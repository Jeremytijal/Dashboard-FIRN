// Configuration Airtable
const AIRTABLE_API_KEY = import.meta.env.VITE_AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = 'app2frF4RzVUnuyCU';

// Noms des tables
const TABLES = {
    stats: 'Stats',
    clients: 'Clients',
    nps: 'NPS',
    objectifs: 'Objectifs',
};

interface AirtableRecord<T> {
    id: string;
    fields: T;
    createdTime: string;
}

interface AirtableResponse<T> {
    records: AirtableRecord<T>[];
    offset?: string;
}

// Helper pour extraire une valeur d'un champ Airtable (peut être un tableau ou une valeur simple)
function getValue(field: unknown): number {
    if (Array.isArray(field)) {
        return field[0] ?? 0;
    }
    if (typeof field === 'number') {
        return field;
    }
    return 0;
}

// Types pour les données Airtable
export interface StatsFields {
    Name: string;
    Amount: number;
    Vendeur: string[];
    'CA du jour (€) (from Vendeur)': number[];
    'CA du mois(€) (from Vendeur)': number[];
    'PM (mois) (from Vendeur)': number[];
    'PM (Jour) - (from Vendeur)': number[];
    'Nb commandes (mois) (from Vendeur)': number[];
    'Nb commandes (Jour) (from Vendeur)': number[];
    'NPS moyenne Vendeur (from Vendeur)': number[];
    'Client repeat (from Vendeur)': number[];
    'CA du jour (€) (from Global)': number[];
    'CA du mois (€) (from Global)': number[];
    'PM (Mois) Boutique (from Global)': number[];
    'PM (Jour) Boutique (from Global)': number[];
    'NPS Moyenne Boutique (from Global)': number[];
    'Clients uniques (from Global)': number[];
    'Email (from Vendeur)': string[];
    Global: string[];
}

export interface ClientFields {
    Email: string;
    'Numéro de commande': number;
    Nom: string;
    Prénom: string;
    'Produit acheté': string;
    'Date commande': string;
    Montant: number;
    NPS: number;
    Whatsapp: string;
    'Lien WhatsApp': string;
    'ID vendeur': string;
    Contacté: boolean;
    Canal?: string;
    Repeat?: boolean;
    'Nombre de commandes'?: number;
}

// Map des vendeurs Shopify (ID -> Nom)
const vendorNamesMap: Record<string, string> = {
    '129862140283': 'Jérémy',
    '129870954875': 'Habib',
    '129338540411': 'Sacha',
    '130146435451': 'Maelle Peiffer',
    '130146468219': 'Fiona Couteau',
    '130156593531': 'Kelly Barou Dagues',
};

export interface NPSFields {
    Email: string;
    Note: number;
    Commentaire: string;
    'Date de soumission': string;
}

export interface ObjectifFields {
    Date: string;
    'Objectif du jour': number;
}

// Fonction générique pour fetch Airtable avec pagination
async function fetchAllAirtable<T>(
    tableName: string,
    options: {
        filterByFormula?: string;
        maxRecords?: number;
        sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
        view?: string;
    } = {}
): Promise<AirtableRecord<T>[]> {
    if (!AIRTABLE_API_KEY) {
        console.error('VITE_AIRTABLE_API_KEY non configurée');
        return [];
    }

    let allRecords: AirtableRecord<T>[] = [];
    let offset: string | undefined;

    do {
        const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}`);

        if (options.filterByFormula) {
            url.searchParams.append('filterByFormula', options.filterByFormula);
        }
        if (options.maxRecords && !offset) {
            url.searchParams.append('maxRecords', options.maxRecords.toString());
        }
        if (options.sort) {
            options.sort.forEach((s, i) => {
                url.searchParams.append(`sort[${i}][field]`, s.field);
                url.searchParams.append(`sort[${i}][direction]`, s.direction);
            });
        }
        if (options.view) {
            url.searchParams.append('view', options.view);
        }
        if (offset) {
            url.searchParams.append('offset', offset);
        }

        const response = await fetch(url.toString(), {
            headers: {
                Authorization: `Bearer ${AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Airtable Error:', error);
            throw new Error(`Airtable Error: ${JSON.stringify(error)}`);
        }

        const data: AirtableResponse<T> = await response.json();
        allRecords = [...allRecords, ...data.records];
        offset = data.offset;

        // Si on a une limite, on s'arrête
        if (options.maxRecords && allRecords.length >= options.maxRecords) {
            break;
        }
    } while (offset);

    return allRecords;
}

// Récupérer les stats - agrège les données de tous les vendeurs
export async function getStats() {
    try {
        const records = await fetchAllAirtable<StatsFields>(TABLES.stats);

        console.log('Stats records:', records.length);

        // On va créer un map par vendeur pour agréger
        const vendorStats = new Map<string, {
            dailyRevenue: number;
            monthlyRevenue: number;
            dailyPM: number;
            monthlyPM: number;
            ordersDay: number;
            ordersMonth: number;
            repeat: number;
        }>();

        // Agréger par vendeur (on prend les données du premier record de chaque vendeur)
        records.forEach((record) => {
            const vendorEmail = getValue(record.fields['Email (from Vendeur)'] as unknown) as unknown as string;
            if (!vendorEmail || vendorEmail === 'Global') return;

            const emailStr = Array.isArray(record.fields['Email (from Vendeur)']) 
                ? record.fields['Email (from Vendeur)'][0] 
                : '';
            
            if (!emailStr || vendorStats.has(emailStr)) return;

            vendorStats.set(emailStr, {
                dailyRevenue: getValue(record.fields['CA du jour (€) (from Vendeur)']),
                monthlyRevenue: getValue(record.fields['CA du mois(€) (from Vendeur)']),
                dailyPM: getValue(record.fields['PM (Jour) - (from Vendeur)']),
                monthlyPM: getValue(record.fields['PM (mois) (from Vendeur)']),
                ordersDay: getValue(record.fields['Nb commandes (Jour) (from Vendeur)']),
                ordersMonth: getValue(record.fields['Nb commandes (mois) (from Vendeur)']),
                repeat: getValue(record.fields['Client repeat (from Vendeur)']),
            });
        });

        console.log('Vendeurs trouvés:', Array.from(vendorStats.keys()));

        // Agréger toutes les stats vendeurs pour avoir les stats boutique
        let totalDailyRevenue = 0;
        let totalMonthlyRevenue = 0;
        let totalOrdersDay = 0;
        let totalOrdersMonth = 0;
        let totalRepeat = 0;

        vendorStats.forEach((stats) => {
            totalDailyRevenue += stats.dailyRevenue;
            totalMonthlyRevenue += stats.monthlyRevenue;
            totalOrdersDay += stats.ordersDay;
            totalOrdersMonth += stats.ordersMonth;
            totalRepeat += stats.repeat;
        });

        // Calculer PM (Panier Moyen) = CA / Nb commandes
        const dailyPM = totalOrdersDay > 0 ? Math.round(totalDailyRevenue / totalOrdersDay) : 0;
        const monthlyPM = totalOrdersMonth > 0 ? Math.round(totalMonthlyRevenue / totalOrdersMonth) : 0;

        const finalStats = {
            dailyRevenue: totalDailyRevenue,
            monthlyRevenue: totalMonthlyRevenue,
            dailyPM,
            monthlyPM,
            dailyUPT: 0, // UPT non disponible dans les données
            monthlyUPT: 0,
            npsStore: 0, // À récupérer depuis la table NPS
            npsCollaborator: 0,
            dailyBonus: 0,
            monthlyBonus: 0,
            repeatStore: totalRepeat,
            repeatCollaborator: 0,
        };

        console.log('Final stats:', finalStats);
        return finalStats;
    } catch (error) {
        console.error('Error fetching stats:', error);
        throw error;
    }
}

// Récupérer les stats d'un vendeur spécifique
export async function getVendorStats(vendeurEmail: string) {
    const records = await fetchAllAirtable<StatsFields>(TABLES.stats, {
        filterByFormula: `FIND('${vendeurEmail}', ARRAYJOIN({Email (from Vendeur)}))`,
        maxRecords: 12,
    });

    if (records.length === 0) return null;

    const firstRecord = records[0];

    return {
        email: vendeurEmail,
        dailyRevenue: getValue(firstRecord.fields['CA du jour (€) (from Vendeur)']),
        monthlyRevenue: getValue(firstRecord.fields['CA du mois(€) (from Vendeur)']),
        dailyPM: getValue(firstRecord.fields['PM (Jour) - (from Vendeur)']),
        monthlyPM: getValue(firstRecord.fields['PM (mois) (from Vendeur)']),
        ordersDay: getValue(firstRecord.fields['Nb commandes (Jour) (from Vendeur)']),
        ordersMonth: getValue(firstRecord.fields['Nb commandes (mois) (from Vendeur)']),
        repeat: getValue(firstRecord.fields['Client repeat (from Vendeur)']),
    };
}

// Helper pour extraire l'ID numérique depuis le format GraphQL Shopify
function extractVendorId(graphqlId: string): string {
    if (!graphqlId) return '';
    // Format: "gid://shopify/StaffMember/129870954875" ou juste "129870954875"
    const parts = graphqlId.split('/');
    return parts[parts.length - 1];
}

// Récupérer la liste des clients à recontacter (POS + 30 jours)
export async function getClientsToContact(limit = 50) {
    try {
        // Utiliser la vue "POS + 30j" qui filtre déjà les clients POS + 30 jours
        const records = await fetchAllAirtable<ClientFields>(TABLES.clients, {
            view: 'POS + 30j',
            maxRecords: limit,
            sort: [{ field: 'Date commande', direction: 'desc' }],
        });

        console.log('Clients records (POS + 30j):', records.length);

        return records.map((record) => {
            // Mapper l'ID vendeur au nom (extraire l'ID numérique du format GraphQL)
            const rawVendorId = record.fields['ID vendeur'] || '';
            const vendorId = extractVendorId(rawVendorId);
            const vendorName = vendorNamesMap[vendorId] || (vendorId ? `Vendeur ${vendorId.slice(-4)}` : 'Non assigné');
            
            return {
                id: record.id,
                email: record.fields.Email || '',
                name: `${record.fields.Prénom || ''} ${record.fields.Nom || ''}`.trim(),
                orderDate: record.fields['Date commande'] || '',
                amount: record.fields.Montant || 0,
                nps: record.fields.NPS || 0,
                whatsapp: record.fields.Whatsapp || '',
                whatsappLink: record.fields['Lien WhatsApp'] || '',
                vendor: vendorName,
                product: record.fields['Produit acheté'] || '',
                isRepeat: record.fields.Repeat || false,
                orderCount: record.fields['Nombre de commandes'] || 1,
            };
        });
    } catch (error) {
        console.error('Error fetching clients:', error);
        return [];
    }
}

// Récupérer les derniers NPS
export async function getRecentNPS(limit = 10) {
    try {
        const records = await fetchAllAirtable<NPSFields>(TABLES.nps, {
            maxRecords: limit,
            sort: [{ field: 'Date de soumission', direction: 'desc' }],
        });

        return records.map((record) => ({
            id: record.id,
            email: record.fields.Email,
            score: record.fields.Note,
            comment: record.fields.Commentaire,
            date: record.fields['Date de soumission'],
        }));
    } catch (error) {
        console.error('Error fetching NPS:', error);
        return [];
    }
}

// Type pour un vendeur
export interface Vendor {
    email: string;
    name: string;
}

// Récupérer la liste des vendeurs
export async function getVendors(): Promise<Vendor[]> {
    try {
        const records = await fetchAllAirtable<StatsFields>(TABLES.stats);

        const vendorsMap = new Map<string, string>();

        records.forEach((record) => {
            const emailArr = record.fields['Email (from Vendeur)'];
            if (!emailArr || !Array.isArray(emailArr)) return;
            
            const email = emailArr[0];
            if (!email || vendorsMap.has(email)) return;

            // Extraire le nom depuis l'email ou utiliser l'email
            const name = email.split('@')[0]
                .replace(/[._]/g, ' ')
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');

            vendorsMap.set(email, name);
        });

        return Array.from(vendorsMap.entries()).map(([email, name]) => ({
            email,
            name,
        })).sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
        console.error('Error fetching vendors:', error);
        return [];
    }
}

// Récupérer les stats pour un vendeur spécifique (ou tous si pas de filtre)
export async function getStatsByVendor(vendorEmail?: string) {
    try {
        const records = await fetchAllAirtable<StatsFields>(TABLES.stats);

        // On va créer un map par vendeur pour agréger
        const vendorStats = new Map<string, {
            dailyRevenue: number;
            monthlyRevenue: number;
            dailyPM: number;
            monthlyPM: number;
            ordersDay: number;
            ordersMonth: number;
            repeat: number;
            nps: number;
        }>();

        // Agréger par vendeur
        records.forEach((record) => {
            const emailArr = record.fields['Email (from Vendeur)'];
            if (!emailArr || !Array.isArray(emailArr)) return;
            
            const emailStr = emailArr[0];
            if (!emailStr || vendorStats.has(emailStr)) return;

            vendorStats.set(emailStr, {
                dailyRevenue: getValue(record.fields['CA du jour (€) (from Vendeur)']),
                monthlyRevenue: getValue(record.fields['CA du mois(€) (from Vendeur)']),
                dailyPM: getValue(record.fields['PM (Jour) - (from Vendeur)']),
                monthlyPM: getValue(record.fields['PM (mois) (from Vendeur)']),
                ordersDay: getValue(record.fields['Nb commandes (Jour) (from Vendeur)']),
                ordersMonth: getValue(record.fields['Nb commandes (mois) (from Vendeur)']),
                repeat: getValue(record.fields['Client repeat (from Vendeur)']),
                nps: getValue(record.fields['NPS moyenne Vendeur (from Vendeur)']),
            });
        });

        // Si on filtre par vendeur
        if (vendorEmail) {
            const stats = vendorStats.get(vendorEmail);
            if (!stats) {
                return {
                    dailyRevenue: 0,
                    monthlyRevenue: 0,
                    dailyPM: 0,
                    monthlyPM: 0,
                    dailyUPT: 0,
                    monthlyUPT: 0,
                    npsStore: 0,
                    npsCollaborator: 0,
                    dailyBonus: 0,
                    monthlyBonus: 0,
                    repeatStore: 0,
                    repeatCollaborator: 0,
                };
            }

            return {
                dailyRevenue: stats.dailyRevenue,
                monthlyRevenue: stats.monthlyRevenue,
                dailyPM: stats.dailyPM,
                monthlyPM: stats.monthlyPM,
                dailyUPT: 0,
                monthlyUPT: 0,
                npsStore: 0,
                npsCollaborator: stats.nps,
                dailyBonus: 0,
                monthlyBonus: 0,
                repeatStore: 0,
                repeatCollaborator: stats.repeat,
            };
        }

        // Sinon, agréger toutes les stats
        let totalDailyRevenue = 0;
        let totalMonthlyRevenue = 0;
        let totalOrdersDay = 0;
        let totalOrdersMonth = 0;
        let totalRepeat = 0;

        vendorStats.forEach((stats) => {
            totalDailyRevenue += stats.dailyRevenue;
            totalMonthlyRevenue += stats.monthlyRevenue;
            totalOrdersDay += stats.ordersDay;
            totalOrdersMonth += stats.ordersMonth;
            totalRepeat += stats.repeat;
        });

        const dailyPM = totalOrdersDay > 0 ? Math.round(totalDailyRevenue / totalOrdersDay) : 0;
        const monthlyPM = totalOrdersMonth > 0 ? Math.round(totalMonthlyRevenue / totalOrdersMonth) : 0;

        return {
            dailyRevenue: totalDailyRevenue,
            monthlyRevenue: totalMonthlyRevenue,
            dailyPM,
            monthlyPM,
            dailyUPT: 0,
            monthlyUPT: 0,
            npsStore: 0,
            npsCollaborator: 0,
            dailyBonus: 0,
            monthlyBonus: 0,
            repeatStore: totalRepeat,
            repeatCollaborator: 0,
        };
    } catch (error) {
        console.error('Error fetching stats:', error);
        throw error;
    }
}

// Marquer un client comme contacté
export async function markClientAsContacted(recordId: string) {
    const response = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${TABLES.clients}/${recordId}`,
        {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                fields: {
                    Contacté: true,
                },
            }),
        }
    );

    if (!response.ok) {
        throw new Error('Failed to update client');
    }

    return response.json();
}

// Récupérer l'objectif du jour
export async function getObjectifDuJour(): Promise<number | null> {
    try {
        // Formater la date d'aujourd'hui au format Airtable (YYYY-MM-DD)
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        console.log('Recherche objectif pour:', todayStr);
        
        // Utiliser la vue "Objectifs du jour" qui filtre déjà sur aujourd'hui
        const records = await fetchAllAirtable<ObjectifFields>(TABLES.objectifs, {
            view: 'Objectifs du jour',
            maxRecords: 1,
        });

        console.log('Objectif records:', records);

        if (records.length > 0) {
            const objectif = records[0].fields['Objectif du jour'];
            console.log('Objectif du jour trouvé:', objectif);
            return objectif || null;
        }

        // Si pas trouvé avec la vue, chercher manuellement par date
        const allRecords = await fetchAllAirtable<ObjectifFields>(TABLES.objectifs, {
            maxRecords: 50,
            sort: [{ field: 'Date', direction: 'desc' }],
        });

        // Chercher la date d'aujourd'hui (format peut varier)
        const todayRecord = allRecords.find(record => {
            const dateField = record.fields.Date;
            if (!dateField) return false;
            
            // Essayer différents formats
            const recordDate = new Date(dateField);
            return recordDate.toISOString().split('T')[0] === todayStr;
        });

        if (todayRecord) {
            return todayRecord.fields['Objectif du jour'] || null;
        }

        console.log('Aucun objectif trouvé pour aujourd\'hui');
        return null;
    } catch (error) {
        console.error('Error fetching objectif du jour:', error);
        return null;
    }
}

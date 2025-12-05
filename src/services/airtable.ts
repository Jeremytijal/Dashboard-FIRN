// Configuration Airtable
const AIRTABLE_API_KEY = import.meta.env.VITE_AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = 'app2frF4RzVUnuyCU';

// IDs des tables (à mettre à jour si besoin)
const TABLES = {
    stats: 'tblmy7aFeSBAb44A0',
    clients: 'Clients', // Nom ou ID de la table Clients
    nps: 'NPS', // Nom ou ID de la table NPS
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

// Types pour les données Airtable
export interface StatsFields {
    Name: string;
    Amount: number;
    Vendeur: string;
    'CA du jour (€) (from Vendeur)': number;
    'CA du mois(€) (from Vendeur)': number;
    'PM (mois) (from Vendeur)': number;
    'PM (Jour) - (from Vendeur)': number;
    'Nb commandes (mois) (from Vendeur)': number;
    'Nb commandes (Jour) (from Vendeur)': number;
    'NPS moyenne Vendeur (from Vendeur)': number;
    'Client repeat (from Vendeur)': number;
    'CA du jour (€) (from Global)': number;
    'CA du mois (€) (from Global)': number;
    'PM (Mois) Boutique (from Global)': number;
    'PM (Jour) Boutique (from Global)': number;
    'NPS Moyenne Boutique (from Global)': number;
    'Clients uniques (from Global)': number;
}

export interface ClientFields {
    Email: string;
    'Numéro de commande': string;
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
}

export interface NPSFields {
    Email: string;
    Note: number;
    Commentaire: string;
    'Date de soumission': string;
}

// Fonction générique pour fetch Airtable
async function fetchAirtable<T>(
    tableName: string,
    options: {
        filterByFormula?: string;
        maxRecords?: number;
        sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
        view?: string;
    } = {}
): Promise<AirtableRecord<T>[]> {
    const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}`);

    if (options.filterByFormula) {
        url.searchParams.append('filterByFormula', options.filterByFormula);
    }
    if (options.maxRecords) {
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

    const response = await fetch(url.toString(), {
        headers: {
            Authorization: `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Airtable Error: ${JSON.stringify(error)}`);
    }

    const data: AirtableResponse<T> = await response.json();
    return data.records;
}

// Récupérer les stats globales et par vendeur
export async function getStats(vendeurEmail?: string) {
    const records = await fetchAirtable<StatsFields>(TABLES.stats, {
        filterByFormula: vendeurEmail
            ? `{Email (from Vendeur)} = '${vendeurEmail}'`
            : undefined,
    });

    // Agréger les données
    const stats = {
        // Données globales (boutique)
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

    // Trouver les lignes avec les bons noms
    records.forEach((record) => {
        const name = record.fields.Name;
        const amount = record.fields.Amount || 0;

        switch (name) {
            case 'CA du jour (€)':
                stats.dailyRevenue = record.fields['CA du jour (€) (from Global)'] || amount;
                break;
            case 'CA cumulé':
                stats.monthlyRevenue = record.fields['CA du mois (€) (from Global)'] || amount;
                break;
            case 'PM (€)':
                stats.dailyPM = record.fields['PM (Jour) Boutique (from Global)'] || amount;
                break;
            case 'PM (Mois)':
                stats.monthlyPM = record.fields['PM (Mois) Boutique (from Global)'] || amount;
                break;
            case 'NPS boutique':
                stats.npsStore = record.fields['NPS Moyenne Boutique (from Global)'] || amount;
                break;
            case 'NPS collaborateur':
                stats.npsCollaborator = record.fields['NPS moyenne Vendeur (from Vendeur)'] || amount;
                break;
            case 'Repeat Boutique':
                stats.repeatStore = amount;
                break;
            case 'Repeat Collaborateur':
                stats.repeatCollaborator = record.fields['Client repeat (from Vendeur)'] || amount;
                break;
        }
    });

    return stats;
}

// Récupérer les stats d'un vendeur spécifique
export async function getVendorStats(vendeurName: string) {
    const records = await fetchAirtable<StatsFields>(TABLES.stats, {
        filterByFormula: `{Vendeur} = '${vendeurName}'`,
    });

    if (records.length === 0) return null;

    // Prendre le premier enregistrement qui contient les données du vendeur
    const vendorRecord = records[0];

    return {
        name: vendeurName,
        dailyRevenue: vendorRecord.fields['CA du jour (€) (from Vendeur)'] || 0,
        monthlyRevenue: vendorRecord.fields['CA du mois(€) (from Vendeur)'] || 0,
        dailyPM: vendorRecord.fields['PM (Jour) - (from Vendeur)'] || 0,
        monthlyPM: vendorRecord.fields['PM (mois) (from Vendeur)'] || 0,
        ordersDay: vendorRecord.fields['Nb commandes (Jour) (from Vendeur)'] || 0,
        ordersMonth: vendorRecord.fields['Nb commandes (mois) (from Vendeur)'] || 0,
        nps: vendorRecord.fields['NPS moyenne Vendeur (from Vendeur)'] || 0,
        repeat: vendorRecord.fields['Client repeat (from Vendeur)'] || 0,
    };
}

// Récupérer la liste des clients à recontacter
export async function getClientsToContact(limit = 10) {
    const records = await fetchAirtable<ClientFields>('Clients', {
        filterByFormula: `AND({Contacté} = FALSE(), {Whatsapp} != '')`,
        maxRecords: limit,
        sort: [{ field: 'Date commande', direction: 'desc' }],
    });

    return records.map((record) => ({
        id: record.id,
        email: record.fields.Email,
        name: `${record.fields.Prénom} ${record.fields.Nom}`,
        orderDate: record.fields['Date commande'],
        amount: record.fields.Montant,
        nps: record.fields.NPS || 0,
        whatsapp: record.fields.Whatsapp,
        whatsappLink: record.fields['Lien WhatsApp'],
        vendor: record.fields['ID vendeur'] || 'Non assigné',
        product: record.fields['Produit acheté'],
    }));
}

// Récupérer les derniers NPS
export async function getRecentNPS(limit = 10) {
    const records = await fetchAirtable<NPSFields>('NPS', {
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
}

// Marquer un client comme contacté
export async function markClientAsContacted(recordId: string) {
    const response = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Clients/${recordId}`,
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


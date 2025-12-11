// Configuration Shopify - utilise une Netlify Function pour éviter CORS
const API_BASE = import.meta.env.DEV 
    ? 'http://localhost:8888/.netlify/functions' 
    : '/.netlify/functions';

// Types
interface ShopifyOrder {
    id: number;
    name: string;
    created_at: string;
    total_price: string;
    current_total_price: string;
    subtotal_price: string;
    total_line_items_price: string; // Prix brut des produits (avant réductions)
    source_name: string;
    user_id: number | null;
    financial_status: string;
    cancelled_at: string | null;
    line_items: ShopifyLineItem[];
    customer?: {
        email: string;
        first_name: string;
        last_name: string;
    };
}

interface ShopifyLineItem {
    id: number;
    quantity: number;
    price: string;
    title: string;
    attributed_staffs?: Array<{
        id: string;
        quantity: number;
    }>;
}

interface OrdersResponse {
    orders: ShopifyOrder[];
}

// Map des vendeurs Shopify POS (user_id -> name)
const vendorNames: Record<string, string> = {
    '129862140283': 'Jérémy',
    '129870954875': 'Habib',
    '129338540411': 'Sacha',
    '130146435451': 'Maelle Peiffer',
    '130146468219': 'Fiona Couteau',
    '130156593531': 'Kelly Barou Dagues',
};

// Helper pour extraire le staff member ID depuis le format GraphQL
function extractStaffId(graphqlId: string): string {
    const parts = graphqlId.split('/');
    return parts[parts.length - 1];
}

// Récupérer toutes les commandes avec pagination via Netlify Function
async function fetchAllOrders(params: Record<string, string> = {}): Promise<ShopifyOrder[]> {
    const allOrders: ShopifyOrder[] = [];
    let hasMore = true;
    let pageInfo: string | null = null;

    while (hasMore) {
        // IMPORTANT: Shopify ne permet pas d'autres params quand page_info est présent
        let queryParams: Record<string, string>;
        
        if (pageInfo) {
            // Pour les pages suivantes, on utilise UNIQUEMENT page_info et limit
            queryParams = { page_info: pageInfo, limit: '250' };
        } else {
            // Pour la première page, on utilise tous les params
            queryParams = { ...params, limit: '250' };
        }

        const url = `${API_BASE}/shopify-orders?${new URLSearchParams(queryParams)}`;
        console.log('Fetching:', url);

        const response = await fetch(url);

        if (!response.ok) {
            const error = await response.text();
            console.error('API Error:', error);
            throw new Error(`API Error: ${response.status} - ${error}`);
        }

        const data: OrdersResponse = await response.json();
        allOrders.push(...data.orders);

        // Vérifier s'il y a une page suivante via le header Link
        const linkHeader = response.headers.get('X-Shopify-Link');
        if (linkHeader && linkHeader.includes('rel="next"')) {
            const nextMatch = linkHeader.match(/<[^>]*page_info=([^&>]*).*?>; rel="next"/);
            pageInfo = nextMatch ? nextMatch[1] : null;
            hasMore = !!pageInfo;
        } else {
            hasMore = false;
        }

        // Limite de sécurité
        if (allOrders.length > 1000) {
            console.warn('Limite de 1000 commandes atteinte');
            break;
        }
    }

    return allOrders;
}

// Obtenir le début du mois en ISO
function getStartOfMonth(): string {
    const now = new Date();
    now.setDate(1);
    now.setHours(0, 0, 0, 0);
    return now.toISOString();
}

// Interface pour les stats calculées
export interface ShopifyStats {
    dailyRevenue: number;
    monthlyRevenue: number;
    dailyOrders: number;
    monthlyOrders: number;
    dailyPM: number;
    monthlyPM: number;
    dailyUPT: number;
    monthlyUPT: number;
    dailyItems: number;
    monthlyItems: number;
}

// Interface pour un vendeur
export interface ShopifyVendor {
    id: string;
    name: string;
}

// Calculer les stats à partir des commandes
function calculateStats(orders: ShopifyOrder[], filterPOS = false): ShopifyStats {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const monthStr = todayStr.substring(0, 7);

    let dailyRevenue = 0;
    let monthlyRevenue = 0;
    let dailyOrders = 0;
    let monthlyOrders = 0;
    let dailyItems = 0;
    let monthlyItems = 0;

    orders.forEach((order) => {
        // Filtrer les commandes annulées
        if (order.cancelled_at) return;
        
        // Filtrer POS si demandé
        if (filterPOS && order.source_name !== 'pos') return;

        const orderDate = order.created_at.split('T')[0];
        const orderMonth = orderDate.substring(0, 7);
        // Utiliser current_total_price = Ventes totales (correspond exactement à Shopify)
        const revenue = parseFloat(order.current_total_price || order.total_price);
        const itemCount = order.line_items.reduce((sum, item) => sum + item.quantity, 0);

        // Stats du mois
        if (orderMonth === monthStr) {
            monthlyRevenue += revenue;
            monthlyOrders++;
            monthlyItems += itemCount;
        }

        // Stats du jour
        if (orderDate === todayStr) {
            dailyRevenue += revenue;
            dailyOrders++;
            dailyItems += itemCount;
        }
    });

    return {
        dailyRevenue: Math.round(dailyRevenue * 100) / 100,
        monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
        dailyOrders,
        monthlyOrders,
        dailyPM: dailyOrders > 0 ? Math.round(dailyRevenue / dailyOrders) : 0,
        monthlyPM: monthlyOrders > 0 ? Math.round(monthlyRevenue / monthlyOrders) : 0,
        dailyUPT: dailyOrders > 0 ? Math.round((dailyItems / dailyOrders) * 10) / 10 : 0,
        monthlyUPT: monthlyOrders > 0 ? Math.round((monthlyItems / monthlyOrders) * 10) / 10 : 0,
        dailyItems,
        monthlyItems,
    };
}

// Récupérer les stats globales (toutes les commandes POS du mois)
export async function getShopifyStats(vendorId?: string): Promise<ShopifyStats> {
    try {
        const startOfMonth = getStartOfMonth();
        
        const orders = await fetchAllOrders({
            status: 'any',
            created_at_min: startOfMonth,
        });

        console.log(`Shopify: ${orders.length} commandes récupérées depuis ${startOfMonth}`);

        // Filtrer par vendeur si spécifié
        let filteredOrders = orders;
        if (vendorId) {
            filteredOrders = orders.filter((order) => {
                // Vérifier user_id (pour les commandes POS)
                if (order.user_id?.toString() === vendorId) return true;
                
                // Vérifier attributed_staffs dans les line_items
                return order.line_items.some((item) =>
                    item.attributed_staffs?.some(
                        (staff) => extractStaffId(staff.id) === vendorId
                    )
                );
            });
        }

        // Calculer les stats (uniquement POS pour la boutique)
        const stats = calculateStats(filteredOrders, true);
        
        console.log('Shopify stats:', stats);
        return stats;
    } catch (error) {
        console.error('Error fetching Shopify stats:', error);
        throw error;
    }
}

// Récupérer la liste des vendeurs depuis les commandes
export async function getShopifyVendors(): Promise<ShopifyVendor[]> {
    try {
        const startOfMonth = getStartOfMonth();
        
        const orders = await fetchAllOrders({
            status: 'any',
            created_at_min: startOfMonth,
        });

        const vendorsMap = new Map<string, string>();

        orders.forEach((order) => {
            // Extraire depuis user_id
            if (order.user_id && order.source_name === 'pos') {
                const id = order.user_id.toString();
                if (!vendorsMap.has(id)) {
                    vendorsMap.set(id, vendorNames[id] || `Vendeur ${id.slice(-4)}`);
                }
            }

            // Extraire depuis attributed_staffs
            order.line_items.forEach((item) => {
                item.attributed_staffs?.forEach((staff) => {
                    const id = extractStaffId(staff.id);
                    if (!vendorsMap.has(id)) {
                        vendorsMap.set(id, vendorNames[id] || `Vendeur ${id.slice(-4)}`);
                    }
                });
            });
        });

        return Array.from(vendorsMap.entries())
            .map(([id, name]) => ({ id, name }))
            .sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
        console.error('Error fetching vendors:', error);
        return [];
    }
}

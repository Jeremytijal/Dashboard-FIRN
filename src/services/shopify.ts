// Configuration Shopify
const SHOPIFY_STORE = 'firn-fr';
const SHOPIFY_ACCESS_TOKEN = import.meta.env.VITE_SHOPIFY_ACCESS_TOKEN;
const SHOPIFY_API_VERSION = '2024-01';

const SHOPIFY_API_URL = `https://${SHOPIFY_STORE}.myshopify.com/admin/api/${SHOPIFY_API_VERSION}`;

// Types
interface ShopifyOrder {
    id: number;
    name: string;
    created_at: string;
    total_price: string;
    current_total_price: string;
    subtotal_price: string;
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

// Map pour stocker les noms des vendeurs (user_id -> name)
const vendorNames: Record<string, string> = {
    '129870954875': 'Habib',
    // Ajoute d'autres vendeurs ici au fur et à mesure
};

// Helper pour extraire le staff member ID depuis le format GraphQL
function extractStaffId(graphqlId: string): string {
    // Format: "gid://shopify/StaffMember/129870954875"
    const parts = graphqlId.split('/');
    return parts[parts.length - 1];
}

// Récupérer toutes les commandes avec pagination
async function fetchAllOrders(params: Record<string, string> = {}): Promise<ShopifyOrder[]> {
    const allOrders: ShopifyOrder[] = [];
    let hasMore = true;
    let pageInfo: string | null = null;

    while (hasMore) {
        const queryParams: Record<string, string> = { ...params, limit: '250' };
        if (pageInfo) {
            queryParams.page_info = pageInfo;
        }

        const response = await fetch(`${SHOPIFY_API_URL}/orders.json?${new URLSearchParams(queryParams)}`, {
            headers: {
                'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN!,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Shopify Error: ${response.status}`);
        }

        const data: OrdersResponse = await response.json();
        allOrders.push(...data.orders);

        // Vérifier s'il y a une page suivante via le header Link
        const linkHeader = response.headers.get('Link');
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
    const parisOffset = 1;
    const parisDate = new Date(now.getTime() + parisOffset * 60 * 60 * 1000);
    parisDate.setUTCDate(1);
    parisDate.setUTCHours(0, 0, 0, 0);
    return parisDate.toISOString();
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
    const monthStr = todayStr.substring(0, 7); // YYYY-MM

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

// Export pour debug
export async function debugOrders() {
    const orders = await fetchAllOrders({
        status: 'any',
        limit: '10',
    });
    
    console.log('Debug orders:', orders.map(o => ({
        id: o.id,
        name: o.name,
        date: o.created_at,
        source: o.source_name,
        user_id: o.user_id,
        total: o.total_price,
        items: o.line_items.length,
    })));
    
    return orders;
}


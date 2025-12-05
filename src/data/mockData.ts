export interface SalesData {
    dailyRevenue: number;
    dailyPM: number;
    dailyUPT: number;
    monthlyRevenue: number;
    monthlyPM: number;
    monthlyUPT: number;
    npsStore: number;
    npsCollaborator: number;
    dailyBonus: number;
    monthlyBonus: number;
    repeatStore: number;
    repeatCollaborator: number;
}

export interface Client {
    id: string;
    email: string;
    name: string;
    orderDate: string;
    amount: number;
    nps: number;
    whatsapp: string;
    whatsappLink?: string;
    vendor: string;
    product?: string;
}

// Données par défaut (utilisées en fallback)
export const mockSalesData: SalesData = {
    dailyRevenue: 0,
    dailyPM: 0,
    dailyUPT: 0,
    monthlyRevenue: 0,
    monthlyPM: 0,
    monthlyUPT: 0,
    npsStore: 0,
    npsCollaborator: 0,
    dailyBonus: 0,
    monthlyBonus: 0,
    repeatStore: 0,
    repeatCollaborator: 0,
};

export const mockClients: Client[] = [];

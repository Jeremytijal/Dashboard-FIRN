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
    vendor: string;
}

export const mockSalesData: SalesData = {
    dailyRevenue: 1250,
    dailyPM: 85,
    dailyUPT: 2.5,
    monthlyRevenue: 45000,
    monthlyPM: 92,
    monthlyUPT: 2.8,
    npsStore: 75,
    npsCollaborator: 82,
    dailyBonus: 50,
    monthlyBonus: 1200,
    repeatStore: 45,
    repeatCollaborator: 52,
};

export const mockClients: Client[] = [
    {
        id: '1',
        email: 'sophie.martin@example.com',
        name: 'Sophie Martin',
        orderDate: '2023-10-25',
        amount: 120,
        nps: 9,
        whatsapp: '+33612345678',
        vendor: 'Julie',
    },
    {
        id: '2',
        email: 'thomas.dubois@example.com',
        name: 'Thomas Dubois',
        orderDate: '2023-10-24',
        amount: 85,
        nps: 10,
        whatsapp: '+33698765432',
        vendor: 'Marie',
    },
    {
        id: '3',
        email: 'emilie.bernard@example.com',
        name: 'Émilie Bernard',
        orderDate: '2023-10-23',
        amount: 210,
        nps: 8,
        whatsapp: '+33611223344',
        vendor: 'Julie',
    },
    {
        id: '4',
        email: 'lucas.petit@example.com',
        name: 'Lucas Petit',
        orderDate: '2023-10-22',
        amount: 65,
        nps: 7,
        whatsapp: '+33655443322',
        vendor: 'Marie',
    },
];

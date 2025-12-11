import { useState, useEffect, useCallback } from 'react';
import { getShopifyStats, getShopifyVendors } from '../services/shopify';
import type { ShopifyVendor } from '../services/shopify';
import { getClientsToContact, getObjectifDuJour } from '../services/airtable';
import type { SalesData, Client } from '../data/mockData';
import { mockSalesData, mockClients } from '../data/mockData';

interface UseAirtableReturn {
    salesData: SalesData;
    boutiqueStats: SalesData; // Stats globales boutique (pour l'objectif)
    clients: Client[];
    vendors: ShopifyVendor[];
    selectedVendor: string | null;
    setSelectedVendor: (id: string | null) => void;
    objectifDuJour: number | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

export function useAirtable(): UseAirtableReturn {
    const [salesData, setSalesData] = useState<SalesData>(mockSalesData);
    const [boutiqueStats, setBoutiqueStats] = useState<SalesData>(mockSalesData);
    const [clients, setClients] = useState<Client[]>(mockClients);
    const [vendors, setVendors] = useState<ShopifyVendor[]>([]);
    const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
    const [objectifDuJour, setObjectifDuJour] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // Fetch en parallèle : Shopify pour les stats, Airtable pour les clients et objectifs
            const [vendorsResult, shopifyStats, globalStats, clientsResult, objectif] = await Promise.all([
                getShopifyVendors(),
                getShopifyStats(selectedVendor || undefined),
                getShopifyStats(), // Stats globales boutique (toujours sans filtre)
                getClientsToContact(10),
                getObjectifDuJour(),
            ]);

            setVendors(vendorsResult);
            setObjectifDuJour(objectif);
            
            // Stats globales boutique (pour l'objectif)
            setBoutiqueStats({
                dailyRevenue: globalStats.dailyRevenue,
                monthlyRevenue: globalStats.monthlyRevenue,
                dailyPM: globalStats.dailyPM,
                monthlyPM: globalStats.monthlyPM,
                dailyUPT: globalStats.dailyUPT,
                monthlyUPT: globalStats.monthlyUPT,
                npsStore: 0,
                npsCollaborator: 0,
                dailyBonus: 0,
                monthlyBonus: 0,
                repeatStore: 0,
                repeatCollaborator: 0,
            });
            
            // Stats du vendeur sélectionné (ou globales si aucun)
            setSalesData({
                dailyRevenue: shopifyStats.dailyRevenue,
                monthlyRevenue: shopifyStats.monthlyRevenue,
                dailyPM: shopifyStats.dailyPM,
                monthlyPM: shopifyStats.monthlyPM,
                dailyUPT: shopifyStats.dailyUPT,
                monthlyUPT: shopifyStats.monthlyUPT,
                npsStore: 0,
                npsCollaborator: 0,
                dailyBonus: 0,
                monthlyBonus: 0,
                repeatStore: 0,
                repeatCollaborator: 0,
            });
            
            setClients(clientsResult);
        } catch (err) {
            console.error('Erreur:', err);
            setError(err instanceof Error ? err.message : 'Erreur de chargement');
        } finally {
            setLoading(false);
        }
    }, [selectedVendor]);

    // Charger les données au démarrage et quand le vendeur change
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return {
        salesData,
        boutiqueStats,
        clients,
        vendors,
        selectedVendor,
        setSelectedVendor,
        objectifDuJour,
        loading,
        error,
        refetch: fetchData,
    };
}

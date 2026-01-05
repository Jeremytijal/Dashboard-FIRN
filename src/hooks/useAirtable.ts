import { useState, useEffect, useCallback } from 'react';
import { getShopifyStats, getShopifyVendorsAndLocations, getCustomerOrderCounts } from '../services/shopify';
import type { ShopifyVendor, ShopifyLocation } from '../services/shopify';
import { getClientsToContact, getObjectifDuJour } from '../services/airtable';
import type { SalesData, Client } from '../data/mockData';
import { mockSalesData, mockClients } from '../data/mockData';

interface UseAirtableReturn {
    salesData: SalesData;
    boutiqueStats: SalesData; // Stats globales boutique (pour l'objectif)
    clients: Client[];
    vendors: ShopifyVendor[];
    locations: ShopifyLocation[];
    selectedVendor: string | null;
    setSelectedVendor: (id: string | null) => void;
    selectedLocation: string | null;
    setSelectedLocation: (id: string | null) => void;
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
    const [locations, setLocations] = useState<ShopifyLocation[]>([]);
    const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
    const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
    const [objectifDuJour, setObjectifDuJour] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // Construire le filtre actuel
            const currentFilter = {
                vendorId: selectedVendor || undefined,
                locationId: selectedLocation || undefined,
            };

            // Fetch en parallèle : Shopify pour les stats, Airtable pour les clients et objectifs
            const [
                vendorsAndLocations, 
                shopifyStats, 
                globalStats, 
                clientsResult, 
                objectif, 
                customerCounts
            ] = await Promise.all([
                getShopifyVendorsAndLocations(),
                getShopifyStats(currentFilter),
                getShopifyStats(), // Stats globales boutique (toujours sans filtre)
                getClientsToContact(50),
                getObjectifDuJour(),
                getCustomerOrderCounts(), // Données repeat par client depuis Shopify
            ]);

            setVendors(vendorsAndLocations.vendors);
            setLocations(vendorsAndLocations.locations);
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
                repeatStore: globalStats.repeatRate, // Repeat calculé sur le mois
                repeatCollaborator: 0,
            });
            
            // Stats du vendeur/boutique sélectionné (ou globales si aucun)
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
                repeatStore: globalStats.repeatRate, // Toujours global
                repeatCollaborator: shopifyStats.repeatRate, // Repeat du filtre actuel
            });
            
            // Enrichir les clients avec les données de repeat depuis Shopify
            const enrichedClients = clientsResult.map(client => {
                const email = client.email?.toLowerCase();
                const orderCount = email ? (customerCounts.get(email) || 1) : 1;
                return {
                    ...client,
                    orderCount,
                    isRepeat: orderCount > 1,
                };
            });
            
            setClients(enrichedClients);
        } catch (err) {
            console.error('Erreur:', err);
            setError(err instanceof Error ? err.message : 'Erreur de chargement');
        } finally {
            setLoading(false);
        }
    }, [selectedVendor, selectedLocation]);

    // Charger les données au démarrage et quand le vendeur change
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return {
        salesData,
        boutiqueStats,
        clients,
        vendors,
        locations,
        selectedVendor,
        setSelectedVendor,
        selectedLocation,
        setSelectedLocation,
        objectifDuJour,
        loading,
        error,
        refetch: fetchData,
    };
}

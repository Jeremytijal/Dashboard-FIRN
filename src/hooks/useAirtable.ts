import { useState, useEffect, useCallback } from 'react';
import { getStats, getStatsByVendor, getClientsToContact, getVendors } from '../services/airtable';
import type { Vendor } from '../services/airtable';
import type { SalesData, Client } from '../data/mockData';
import { mockSalesData, mockClients } from '../data/mockData';

interface UseAirtableReturn {
    salesData: SalesData;
    clients: Client[];
    vendors: Vendor[];
    selectedVendor: string | null;
    setSelectedVendor: (email: string | null) => void;
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

export function useAirtable(): UseAirtableReturn {
    const [salesData, setSalesData] = useState<SalesData>(mockSalesData);
    const [clients, setClients] = useState<Client[]>(mockClients);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // Fetch vendors, stats et clients en parallèle
            const [vendorsResult, statsResult, clientsResult] = await Promise.all([
                getVendors(),
                selectedVendor ? getStatsByVendor(selectedVendor) : getStats(),
                getClientsToContact(10),
            ]);

            setVendors(vendorsResult);
            setSalesData(statsResult);
            setClients(clientsResult);
        } catch (err) {
            console.error('Erreur Airtable:', err);
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
        clients,
        vendors,
        selectedVendor,
        setSelectedVendor,
        loading,
        error,
        refetch: fetchData,
    };
}

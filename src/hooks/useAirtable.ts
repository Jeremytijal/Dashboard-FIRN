import { useState, useEffect } from 'react';
import { getStats, getClientsToContact } from '../services/airtable';
import type { SalesData, Client } from '../data/mockData';
import { mockSalesData, mockClients } from '../data/mockData';

interface UseAirtableReturn {
    salesData: SalesData;
    clients: Client[];
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

export function useAirtable(): UseAirtableReturn {
    const [salesData, setSalesData] = useState<SalesData>(mockSalesData);
    const [clients, setClients] = useState<Client[]>(mockClients);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);

        try {
            // Fetch stats et clients en parallèle
            const [statsResult, clientsResult] = await Promise.all([
                getStats(),
                getClientsToContact(10),
            ]);

            setSalesData(statsResult);
            setClients(clientsResult);
        } catch (err) {
            console.error('Erreur Airtable:', err);
            setError(err instanceof Error ? err.message : 'Erreur de chargement');
            // En cas d'erreur, on garde les données mock
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return {
        salesData,
        clients,
        loading,
        error,
        refetch: fetchData,
    };
}


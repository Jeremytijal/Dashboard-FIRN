import React from 'react';
import { Layout } from '../components/Layout';
import { StatCard } from '../components/StatCard';
import { ClientList } from '../components/ClientList';
import { useAirtable } from '../hooks/useAirtable';
import { RefreshCw } from 'lucide-react';

export const Dashboard: React.FC = () => {
    const { salesData, clients, loading, error, refetch } = useAirtable();

    return (
        <Layout>
            {/* Header avec refresh */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                    {error}
                </div>
            )}
            
            {loading && (
                <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
                    <span className="ml-2 text-slate-500">Chargement...</span>
                </div>
            )}

            {/* Indicateurs commerciaux */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-slate-900">Indicateurs commerciaux</h2>
                    <button
                        onClick={refetch}
                        disabled={loading}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
                <div className="grid grid-cols-1 gap-4">
                    <StatCard
                        title="CA du jour (€)"
                        value={salesData.dailyRevenue}
                        className="border-l-4 border-l-blue-500"
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <StatCard title="PM (€)" value={salesData.dailyPM} />
                        <StatCard title="UPT (Jour)" value={salesData.dailyUPT} />
                    </div>
                </div>
            </section>

            {/* Point sur le mois */}
            <section>
                <h2 className="text-lg font-bold text-slate-900 mb-4">Point sur le mois</h2>
                <div className="grid grid-cols-1 gap-4">
                    <StatCard
                        title="CA cumulé"
                        value={salesData.monthlyRevenue}
                        className="border-l-4 border-l-indigo-500"
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <StatCard title="PM (Mois)" value={salesData.monthlyPM} />
                        <StatCard title="UPT (Mois)" value={salesData.monthlyUPT} />
                    </div>
                </div>
            </section>

            {/* Qualité de service */}
            <section>
                <h2 className="text-lg font-bold text-slate-900 mb-4">Qualité de service</h2>
                <div className="grid grid-cols-2 gap-4">
                    <StatCard title="NPS boutique" value={salesData.npsStore} />
                    <StatCard title="NPS collaborateur" value={salesData.npsCollaborator} />
                </div>
            </section>

            {/* Prime vendeur */}
            <section className="bg-blue-50/50 -mx-4 px-4 py-6 rounded-xl">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Prime vendeur</h2>
                <div className="grid grid-cols-2 gap-4">
                    <StatCard title="Cumul du jour" value={salesData.dailyBonus} />
                    <StatCard title="Cumul du mois" value={salesData.monthlyBonus} />
                </div>
            </section>

            {/* Repeat */}
            <section>
                <h2 className="text-lg font-bold text-slate-900 mb-4">Repeat</h2>
                <div className="grid grid-cols-2 gap-4">
                    <StatCard title="Repeat Boutique" value={`${salesData.repeatStore}%`} />
                    <StatCard title="Repeat Collaborateur" value={`${salesData.repeatCollaborator}%`} />
                </div>
            </section>

            {/* Client à relancer */}
            <section>
                <h2 className="text-lg font-bold text-slate-900 mb-4">
                    Client à relancer
                    {clients.length > 0 && (
                        <span className="ml-2 text-sm font-normal text-slate-500">
                            ({clients.length})
                        </span>
                    )}
                </h2>
                {clients.length === 0 && !loading ? (
                    <p className="text-slate-500 text-sm">Aucun client à relancer</p>
                ) : (
                    <ClientList clients={clients} />
                )}
            </section>
        </Layout>
    );
};

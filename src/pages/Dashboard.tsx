import React from 'react';
import { Layout } from '../components/Layout';
import { StatCard } from '../components/StatCard';
import { ClientList } from '../components/ClientList';
import { useAirtable } from '../hooks/useAirtable';
import { RefreshCw, ChevronDown, Users, User } from 'lucide-react';

export const Dashboard: React.FC = () => {
    const { 
        salesData, 
        clients, 
        vendors, 
        selectedVendor, 
        setSelectedVendor,
        objectifDuJour,
        loading, 
        error, 
        refetch 
    } = useAirtable();

    // Calcul du pourcentage d'atteinte de l'objectif
    const objectifProgress = objectifDuJour && objectifDuJour > 0 
        ? Math.round((salesData.dailyRevenue / objectifDuJour) * 100)
        : null;

    const selectedVendorName = selectedVendor 
        ? vendors.find(v => v.id === selectedVendor)?.name || selectedVendor
        : 'Boutique';

    return (
        <Layout>
            {/* Sélecteur de vendeur */}
            <section className="sticky top-16 z-40 -mx-4 px-4 py-3 bg-white/80 backdrop-blur-md border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                        <select
                            value={selectedVendor || ''}
                            onChange={(e) => setSelectedVendor(e.target.value || null)}
                            className="w-full appearance-none bg-slate-100 hover:bg-slate-200 transition-colors rounded-xl px-4 py-3 pr-10 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">🏪 Vue Boutique (Global)</option>
                            {vendors.map((vendor) => (
                                <option key={vendor.id} value={vendor.id}>
                                    👤 {vendor.name}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    </div>
                    <button
                        onClick={refetch}
                        disabled={loading}
                        className="p-3 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-5 h-5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
                
                {/* Badge vendeur actif */}
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                    {selectedVendor ? (
                        <User className="w-3.5 h-3.5" />
                    ) : (
                        <Users className="w-3.5 h-3.5" />
                    )}
                    <span>
                        {selectedVendor ? `Stats de ${selectedVendorName}` : 'Stats globales de la boutique'}
                    </span>
                </div>
            </section>

            {/* Erreur */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                </div>
            )}
            
            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
                    <span className="ml-2 text-slate-500">Chargement...</span>
                </div>
            )}

            {/* Objectif du jour */}
            {objectifDuJour && (
                <section className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-blue-100 text-sm font-medium">🎯 Objectif du jour</p>
                        <span className={`text-2xl font-bold ${objectifProgress && objectifProgress >= 100 ? 'text-green-300' : ''}`}>
                            {objectifProgress}%
                        </span>
                    </div>
                    <div className="flex items-end justify-between mb-3">
                        <div>
                            <p className="text-3xl font-black">{salesData.dailyRevenue.toLocaleString('fr-FR')}€</p>
                            <p className="text-blue-200 text-sm">sur {objectifDuJour.toLocaleString('fr-FR')}€</p>
                        </div>
                        <p className="text-blue-200 text-sm">
                            Reste : {Math.max(0, objectifDuJour - salesData.dailyRevenue).toLocaleString('fr-FR')}€
                        </p>
                    </div>
                    <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                        <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                                objectifProgress && objectifProgress >= 100 
                                    ? 'bg-green-400' 
                                    : 'bg-white'
                            }`}
                            style={{ width: `${Math.min(objectifProgress || 0, 100)}%` }}
                        />
                    </div>
                </section>
            )}

            {/* Indicateurs commerciaux */}
            <section>
                <h2 className="text-lg font-bold text-slate-900 mb-4">Indicateurs commerciaux</h2>
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
                    <StatCard 
                        title={selectedVendor ? "NPS Vendeur" : "NPS boutique"} 
                        value={selectedVendor ? salesData.npsCollaborator : salesData.npsStore} 
                    />
                    <StatCard 
                        title="NPS collaborateur" 
                        value={salesData.npsCollaborator} 
                    />
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
                    <StatCard 
                        title={selectedVendor ? "Repeat Vendeur" : "Repeat Boutique"} 
                        value={selectedVendor ? salesData.repeatCollaborator : salesData.repeatStore} 
                    />
                    <StatCard 
                        title="Repeat Collaborateur" 
                        value={salesData.repeatCollaborator} 
                    />
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

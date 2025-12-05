import React from 'react';
import { Layout } from '../components/Layout';
import { StatCard } from '../components/StatCard';
import { ClientList } from '../components/ClientList';
import { mockSalesData, mockClients } from '../data/mockData';

export const Dashboard: React.FC = () => {
    return (
        <Layout>
            {/* Indicateurs commerciaux */}
            <section>
                <h2 className="text-lg font-bold text-slate-900 mb-4">Indicateurs commerciaux</h2>
                <div className="grid grid-cols-1 gap-4">
                    <StatCard
                        title="CA du jour (€)"
                        value={mockSalesData.dailyRevenue}
                        className="border-l-4 border-l-blue-500"
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <StatCard title="PM (€)" value={mockSalesData.dailyPM} />
                        <StatCard title="UPT (Jour)" value={mockSalesData.dailyUPT} />
                    </div>
                </div>
            </section>

            {/* Point sur le mois */}
            <section>
                <h2 className="text-lg font-bold text-slate-900 mb-4">Point sur le mois</h2>
                <div className="grid grid-cols-1 gap-4">
                    <StatCard
                        title="CA cumulé"
                        value={mockSalesData.monthlyRevenue}
                        className="border-l-4 border-l-indigo-500"
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <StatCard title="PM (Mois)" value={mockSalesData.monthlyPM} />
                        <StatCard title="UPT (Mois)" value={mockSalesData.monthlyUPT} />
                    </div>
                </div>
            </section>

            {/* Qualité de service */}
            <section>
                <h2 className="text-lg font-bold text-slate-900 mb-4">Qualité de service</h2>
                <div className="grid grid-cols-2 gap-4">
                    <StatCard title="NPS boutique" value={mockSalesData.npsStore} />
                    <StatCard title="NPS collaborateur" value={mockSalesData.npsCollaborator} />
                </div>
            </section>

            {/* Prime vendeur */}
            <section className="bg-blue-50/50 -mx-4 px-4 py-6 rounded-xl">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Prime vendeur</h2>
                <div className="grid grid-cols-2 gap-4">
                    <StatCard title="Cumul du jour" value={mockSalesData.dailyBonus} />
                    <StatCard title="Cumul du mois" value={mockSalesData.monthlyBonus} />
                </div>
            </section>

            {/* Repeat */}
            <section>
                <h2 className="text-lg font-bold text-slate-900 mb-4">Repeat</h2>
                <div className="grid grid-cols-2 gap-4">
                    <StatCard title="Repeat Boutique" value={`${mockSalesData.repeatStore}%`} />
                    <StatCard title="Repeat Collaborateur" value={`${mockSalesData.repeatCollaborator}%`} />
                </div>
            </section>

            {/* Client à relancer */}
            <section>
                <h2 className="text-lg font-bold text-slate-900 mb-4">Client à relancer</h2>
                <ClientList clients={mockClients} />
            </section>
        </Layout>
    );
};

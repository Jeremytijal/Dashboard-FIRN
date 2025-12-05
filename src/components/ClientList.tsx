import React from 'react';
import type { Client } from '../data/mockData';
import { Mail, MessageCircle } from 'lucide-react';

interface ClientListProps {
    clients: Client[];
}

export const ClientList: React.FC<ClientListProps> = ({ clients }) => {
    return (
        <div className="space-y-4">
            {clients.map((client) => (
                <div key={client.id} className="glass-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                        <div className="flex items-center justify-between sm:justify-start gap-2 mb-1">
                            <h4 className="font-semibold text-slate-900">{client.name}</h4>
                            <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                                NPS: {client.nps}
                            </span>
                        </div>
                        <div className="text-sm text-slate-500 space-y-0.5">
                            <p>Commande du {new Date(client.orderDate).toLocaleDateString('fr-FR')}</p>
                            <p>Montant: <span className="font-medium text-slate-700">{client.amount}€</span> • Vendeur: {client.vendor}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <a
                            href={`https://wa.me/${client.whatsapp.replace('+', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm font-medium"
                        >
                            <MessageCircle size={16} />
                            <span className="sm:hidden">WhatsApp</span>
                        </a>
                        <a
                            href={`mailto:${client.email}`}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-sm font-medium"
                        >
                            <Mail size={16} />
                            <span className="sm:hidden">Email</span>
                        </a>
                    </div>
                </div>
            ))}
        </div>
    );
};

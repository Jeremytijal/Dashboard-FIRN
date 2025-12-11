import React from 'react';
import type { Client } from '../data/mockData';
import { Mail, MessageCircle, RefreshCw, ShoppingBag } from 'lucide-react';

interface ClientListProps {
    clients: Client[];
}

export const ClientList: React.FC<ClientListProps> = ({ clients }) => {
    // Calculer le nombre de jours depuis la commande
    const getDaysAgo = (dateStr: string) => {
        const orderDate = new Date(dateStr);
        const today = new Date();
        const diffTime = today.getTime() - orderDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    return (
        <div className="space-y-3">
            {clients.map((client) => {
                const daysAgo = getDaysAgo(client.orderDate);
                
                return (
                    <div key={client.id} className="glass-card p-4">
                        {/* Header avec nom et badges */}
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold text-slate-900">{client.name || 'Client'}</h4>
                                {client.isRepeat && (
                                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                                        <RefreshCw size={10} />
                                        Repeat {client.orderCount && client.orderCount > 1 ? `(${client.orderCount}x)` : ''}
                                    </span>
                                )}
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                client.nps >= 9 ? 'bg-green-100 text-green-700' :
                                client.nps >= 7 ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                            }`}>
                                NPS: {client.nps}
                            </span>
                        </div>

                        {/* Infos client */}
                        <div className="text-sm text-slate-500 space-y-1 mb-3">
                            <div className="flex items-center gap-2">
                                <ShoppingBag size={14} className="text-slate-400" />
                                <span>{client.product || 'Produit non spécifié'}</span>
                            </div>
                            <p>
                                <span className="font-medium text-slate-700">{client.amount}€</span>
                                {' • '}
                                Il y a <span className="font-medium">{daysAgo} jours</span>
                                {' • '}
                                {client.vendor}
                            </p>
                            {client.email && (
                                <p className="text-xs text-slate-400 truncate">{client.email}</p>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            {client.whatsapp && (
                                <a
                                    href={client.whatsappLink || `https://wa.me/${client.whatsapp?.replace('+', '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors text-sm font-medium"
                                >
                                    <MessageCircle size={16} />
                                    WhatsApp
                                </a>
                            )}
                            {client.email && (
                                <a
                                    href={`mailto:${client.email}`}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors text-sm font-medium"
                                >
                                    <Mail size={16} />
                                    Email
                                </a>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

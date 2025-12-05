import React from 'react';
import { cn } from '../lib/utils';

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    className?: string;
    trend?: 'up' | 'down' | 'neutral';
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, className, trend }) => {
    return (
        <div className={cn("glass-card p-6 flex flex-col justify-between h-full min-h-[120px]", className)}>
            <h3 className="text-sm font-medium text-slate-500 mb-2">{title}</h3>
            <div className="flex items-end justify-between">
                <span className="text-3xl font-bold text-slate-900 tracking-tight">{value}</span>
                {trend && (
                    <span className={cn(
                        "text-xs font-medium px-2 py-1 rounded-full",
                        trend === 'up' ? "bg-green-100 text-green-700" :
                            trend === 'down' ? "bg-red-100 text-red-700" :
                                "bg-slate-100 text-slate-600"
                    )}>
                        {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '-'}
                    </span>
                )}
            </div>
            {subtitle && <p className="text-xs text-slate-400 mt-2">{subtitle}</p>}
        </div>
    );
};

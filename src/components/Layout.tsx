import React from 'react';

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen bg-slate-50">
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
                <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
                    <h1 className="text-2xl font-black tracking-tighter uppercase">FIRN</h1>
                    <div className="flex items-center gap-3">
                        <button className="bg-slate-900 text-white px-4 py-1.5 rounded-full text-xs font-medium">
                            Client à relancer
                        </button>
                        <button className="w-8 h-8 rounded-full bg-orange-400 flex items-center justify-center text-white font-bold text-sm">
                            J
                        </button>
                    </div>
                </div>
            </header>
            <main className="max-w-md mx-auto px-4 py-6 pb-24 space-y-8">
                {children}
            </main>
        </div>
    );
};

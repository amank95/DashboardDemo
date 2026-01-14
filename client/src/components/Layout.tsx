import React from 'react';
import Sidebar from './Sidebar';

interface LayoutProps {
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
    headerActions?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children, title, subtitle, headerActions }) => {
    return (
        <div className="min-h-screen bg-gray-100">
            {/* Top Header */}
            <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm">🤖</span>
                    </div>
                    <span className="text-lg font-semibold text-gray-900">Autowhat AI</span>
                </div>

                <div className="flex items-center space-x-4">
                    <div className="flex items-center text-sm text-gray-500">
                        <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                        Offline
                    </div>
                    <button className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors">
                        Refresh
                    </button>
                </div>
            </header>

            <div className="flex">
                {/* Sidebar */}
                <Sidebar />

                {/* Main Content */}
                <main className="flex-1 p-6">
                    {/* Page Header */}
                    {(title || headerActions) && (
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                {title && (
                                    <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                                )}
                                {subtitle && (
                                    <p className="text-gray-500 mt-1">{subtitle}</p>
                                )}
                            </div>
                            {headerActions && (
                                <div className="flex items-center space-x-3">
                                    {headerActions}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Page Content */}
                    {children}
                </main>

                {/* Right Panel (optional placeholder) */}
                <aside className="w-72 bg-white border-l border-gray-200 p-4 hidden xl:block">
                    <div className="mb-6">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            Selected Agent
                        </h3>
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="font-medium text-gray-900">Bid Optimizer</p>
                            <p className="text-xs text-gray-500 mt-1">Optimization Agent</p>
                            <div className="flex items-center mt-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                <span className="text-xs text-green-600 font-medium">ACTIVE</span>
                            </div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            Metrics
                        </h3>
                        <div className="space-y-2 text-sm text-gray-600">
                            <p>Active: <span className="font-medium text-gray-900">1</span></p>
                            <p>Tasks: <span className="font-medium text-gray-900">0</span></p>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            Health
                        </h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">API</span>
                                <span className="text-green-600">Online</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Database</span>
                                <span className="text-green-600">Online</span>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default Layout;

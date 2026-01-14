import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface SidebarItem {
    name: string;
    path: string;
    icon?: string;
}

const Sidebar: React.FC = () => {
    const location = useLocation();

    const activeAgents: SidebarItem[] = [
        { name: 'Bid Optimizer', path: '/bid-optimizer', icon: '🚀' },
    ];

    const inactiveAgents: SidebarItem[] = [
        { name: 'Campaign Creator', path: '/', icon: '📝' },
        { name: 'Invoice Processing', path: '/invoices', icon: '📄' },
        { name: 'Reports', path: '/reports', icon: '📊' },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
            {/* Active Agents Section */}
            <div className="p-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Active Agents
                </h3>
                <ul className="space-y-1">
                    {activeAgents.map((item) => (
                        <li key={item.path}>
                            <Link
                                to={item.path}
                                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive(item.path)
                                        ? 'bg-green-50 text-green-700 border-l-4 border-green-500 -ml-1 pl-4'
                                        : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <span className="mr-2">{item.icon}</span>
                                <span>{item.name}</span>
                                {isActive(item.path) && (
                                    <span className="ml-auto w-2 h-2 bg-green-500 rounded-full"></span>
                                )}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Inactive Agents Section */}
            <div className="p-4 border-t border-gray-100">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Inactive Agents
                </h3>
                <ul className="space-y-1">
                    {inactiveAgents.map((item) => (
                        <li key={item.path}>
                            <Link
                                to={item.path}
                                className={`flex items-center px-3 py-2 rounded-md text-sm transition-colors ${isActive(item.path)
                                        ? 'bg-gray-100 text-gray-900 font-medium'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <span className="mr-2 opacity-60">{item.icon}</span>
                                <span>{item.name}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Status Section */}
            <div className="mt-auto p-4 border-t border-gray-100">
                <div className="flex items-center text-sm">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                    <span className="text-gray-600">Offline</span>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;

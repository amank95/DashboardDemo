import React, { useState, useEffect } from 'react';
import Layout from './Layout';

interface Report {
    name: string;
    size: number;
    sizeFormatted: string;
    createdAt: string;
    type: 'pdf' | 'txt';
    path: string;
}

const ReportsPage: React.FC = () => {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('http://localhost:5000/api/reports');
            const data = await response.json();

            if (data.reports) {
                setReports(data.reports);
            } else {
                setError('Failed to load reports');
            }
        } catch (err) {
            setError('Failed to connect to server');
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const openReport = (report: Report) => {
        window.open(`http://localhost:5000${report.path}`, '_blank');
    };

    const deleteReport = async (filename: string) => {
        try {
            const response = await fetch(`http://localhost:5000/api/reports/${encodeURIComponent(filename)}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setReports(reports.filter(r => r.name !== filename));
                setDeleteConfirm(null);
            } else {
                alert('Failed to delete report');
            }
        } catch (err) {
            console.error('Delete error:', err);
            alert('Failed to delete report');
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getFileIcon = (type: string) => {
        return type === 'pdf' ? '📄' : '📝';
    };

    return (
        <Layout
            title="📊 Reports"
            subtitle="View and manage optimization reports"
            headerActions={
                <button
                    onClick={fetchReports}
                    className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded hover:bg-gray-800 transition-colors"
                >
                    REFRESH NOW
                </button>
            }
        >
            {/* Stats Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Reports</p>
                        <p className="text-4xl font-bold text-gray-900">{reports.length}</p>
                        <p className="text-xs text-gray-400 mt-1">PDF and TXT files</p>
                    </div>
                    <div className="text-6xl opacity-20">📊</div>
                </div>
            </div>

            {/* Reports Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="font-semibold text-gray-900">Fetched from Reports Directory</h2>
                    <span className="text-xs text-gray-500">
                        automation/bid-optimizer/reports/
                    </span>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-500">
                        <div className="animate-spin w-8 h-8 border-4 border-gray-200 border-t-green-500 rounded-full mx-auto mb-4"></div>
                        Loading reports...
                    </div>
                ) : error ? (
                    <div className="p-8 text-center text-red-500">
                        <p className="mb-2">❌ {error}</p>
                        <button
                            onClick={fetchReports}
                            className="text-sm text-blue-600 hover:underline"
                        >
                            Try again
                        </button>
                    </div>
                ) : reports.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <p className="text-4xl mb-4">📭</p>
                        <p>No reports found</p>
                        <p className="text-sm mt-2 text-gray-400">
                            Run the Bid Optimizer with "Generate PDF Report" enabled to create reports
                        </p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <th className="px-6 py-3">Actions</th>
                                <th className="px-6 py-3">Filename</th>
                                <th className="px-6 py-3">Type</th>
                                <th className="px-6 py-3">Size</th>
                                <th className="px-6 py-3">Created</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {reports.map((report) => (
                                <tr key={report.name} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => openReport(report)}
                                                className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                                                title="View Report"
                                            >
                                                👁️
                                            </button>
                                            {deleteConfirm === report.name ? (
                                                <>
                                                    <button
                                                        onClick={() => deleteReport(report.name)}
                                                        className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                                                    >
                                                        Confirm
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteConfirm(null)}
                                                        className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100"
                                                    >
                                                        Cancel
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={() => setDeleteConfirm(report.name)}
                                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                                                    title="Delete Report"
                                                >
                                                    🗑️
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <span className="mr-2 text-lg">{getFileIcon(report.type)}</span>
                                            <span className="font-medium text-gray-900">{report.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-medium rounded ${report.type === 'pdf'
                                                ? 'bg-red-100 text-red-700'
                                                : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {report.type.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                        {report.sizeFormatted}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                        {formatDate(report.createdAt)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Info Note */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                    <span className="font-medium">💡 Tip:</span> Reports are generated when you run the Bid Optimizer with the "Generate PDF Report" option enabled.
                </p>
            </div>
        </Layout>
    );
};

export default ReportsPage;

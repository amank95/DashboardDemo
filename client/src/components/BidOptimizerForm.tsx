import React, { useState, useEffect, useRef } from 'react';
import Layout from './Layout';

interface ConsoleOutput {
    type: 'stdout' | 'stderr' | 'end';
    text?: string;
    time?: number;
    status?: string;
    exitCode?: number;
}

const BidOptimizerForm: React.FC = () => {
    // Form state
    const [startBid, setStartBid] = useState<number>(10000);
    const [minBid, setMinBid] = useState<number>(100);
    const [maxBid, setMaxBid] = useState<number>(50000);
    const [generateReport, setGenerateReport] = useState<boolean>(false);
    const [useVisualRanking, setUseVisualRanking] = useState<boolean>(false);

    // Campaign config
    const [keywords, setKeywords] = useState<string[]>(['birthday', 'balloon']);
    const [newKeyword, setNewKeyword] = useState<string>('');

    // Run state
    const [isRunning, setIsRunning] = useState<boolean>(false);
    const [runId, setRunId] = useState<string | null>(null);
    const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
    const [status, setStatus] = useState<string>('idle');
    const [currentStep, setCurrentStep] = useState<number>(0);

    const consoleRef = useRef<HTMLDivElement>(null);
    const eventSourceRef = useRef<EventSource | null>(null);

    // Auto-scroll console
    useEffect(() => {
        if (consoleRef.current) {
            consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
        }
    }, [consoleOutput]);

    // Cleanup event source on unmount
    useEffect(() => {
        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
        };
    }, []);

    const startOptimizer = async (isDryRun: boolean) => {
        setIsRunning(true);
        setConsoleOutput([]);
        setStatus('running');
        setCurrentStep(1);

        try {
            const response = await fetch('http://localhost:5000/api/bid-optimizer/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dryRun: isDryRun,
                    generateReport,
                    startBid,
                    minBid,
                    maxBid,
                    keywords,
                    useVisualRanking
                })
            });

            const data = await response.json();

            if (data.success) {
                setRunId(data.runId);
                setCurrentStep(2);
                startStreaming(data.runId);
            } else {
                setStatus('error');
                setConsoleOutput(prev => [...prev, `❌ Failed to start: ${data.error}`]);
                setIsRunning(false);
            }
        } catch (error) {
            setStatus('error');
            setConsoleOutput(prev => [...prev, `❌ Connection error: ${error}`]);
            setIsRunning(false);
        }
    };

    const startStreaming = (id: string) => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }

        setCurrentStep(3);
        const eventSource = new EventSource(`http://localhost:5000/api/bid-optimizer/stream/${id}`);
        eventSourceRef.current = eventSource;

        eventSource.onmessage = (event) => {
            try {
                const data: ConsoleOutput = JSON.parse(event.data);

                if (data.type === 'end') {
                    setIsRunning(false);
                    setStatus(data.status === 'completed' ? 'completed' : 'failed');
                    setCurrentStep(5);
                    eventSource.close();
                } else if (data.text) {
                    setConsoleOutput(prev => [...prev, data.text!]);
                    // Update step based on output content
                    if (data.text.includes('ITERATION')) setCurrentStep(4);
                }
            } catch (e) {
                console.error('Parse error:', e);
            }
        };

        eventSource.onerror = () => {
            setIsRunning(false);
            setStatus('error');
            eventSource.close();
        };
    };

    const stopOptimizer = async () => {
        if (!runId) return;

        try {
            await fetch(`http://localhost:5000/api/bid-optimizer/stop/${runId}`, {
                method: 'POST'
            });
            setStatus('stopped');
            setIsRunning(false);
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
        } catch (error) {
            console.error('Stop error:', error);
        }
    };

    const resetForm = () => {
        setStartBid(10000);
        setMinBid(100);
        setMaxBid(50000);
        setGenerateReport(false);
        setUseVisualRanking(false);
        setKeywords(['birthday', 'balloon']);
        setConsoleOutput([]);
        setStatus('idle');
        setRunId(null);
        setCurrentStep(0);
    };

    const addKeyword = () => {
        if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
            setKeywords([...keywords, newKeyword.trim()]);
            setNewKeyword('');
        }
    };

    const removeKeyword = (keyword: string) => {
        setKeywords(keywords.filter(k => k !== keyword));
    };

    const processSteps = [
        { num: 1, label: 'Initialize' },
        { num: 2, label: 'Connect' },
        { num: 3, label: 'Stream' },
        { num: 4, label: 'Optimize' },
        { num: 5, label: 'Complete' },
    ];

    const getStatusBadge = () => {
        const badges: Record<string, { color: string; label: string }> = {
            idle: { color: 'bg-gray-100 text-gray-600', label: 'Ready' },
            running: { color: 'bg-blue-100 text-blue-700', label: 'Running' },
            completed: { color: 'bg-green-100 text-green-700', label: 'Completed' },
            failed: { color: 'bg-red-100 text-red-700', label: 'Failed' },
            stopped: { color: 'bg-orange-100 text-orange-700', label: 'Stopped' },
            error: { color: 'bg-red-100 text-red-700', label: 'Error' }
        };
        const badge = badges[status] || badges.idle;
        return (
            <span className={`px-2 py-1 rounded text-xs font-medium ${badge.color}`}>
                {badge.label}
            </span>
        );
    };

    return (
        <Layout
            title="🚀 Bid Optimizer"
            subtitle="Automated bid optimization for maximum efficiency"
            headerActions={
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded hover:bg-gray-800 transition-colors"
                >
                    REFRESH NOW
                </button>
            }
        >
            {/* Process Indicator & Running Tasks */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <div className="flex">
                    {/* Running Tasks */}
                    <div className="pr-8 border-r border-gray-200">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Running Tasks</p>
                        <p className="text-4xl font-bold text-gray-900">{isRunning ? 1 : 0}</p>
                        <p className="text-xs text-gray-400 mt-1">Active automations</p>
                    </div>

                    {/* Process Steps */}
                    <div className="pl-8 flex-1">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Process</p>
                        <div className="flex items-center space-x-2">
                            {processSteps.map((step, index) => (
                                <React.Fragment key={step.num}>
                                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${currentStep >= step.num
                                        ? 'bg-green-500 text-white'
                                        : 'bg-gray-100 text-gray-400'
                                        }`}>
                                        {step.num}
                                    </div>
                                    {index < processSteps.length - 1 && (
                                        <div className={`flex-1 h-0.5 max-w-[40px] ${currentStep > step.num ? 'bg-green-500' : 'bg-gray-200'
                                            }`} />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                        <div className="flex mt-2 text-xs text-gray-500 space-x-6">
                            {processSteps.map(step => (
                                <span key={step.num} className="w-8 text-center">{step.label}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Automation Tasks */}
            <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Automation Tasks</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Dry Run Task */}
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium text-gray-900">Dry Run</h3>
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">Simulation</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-3">Test optimization without browser automation</p>
                        <button
                            onClick={() => startOptimizer(true)}
                            disabled={isRunning}
                            className="w-full px-4 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                            Run Task
                        </button>
                    </div>

                    {/* Live Run Task */}
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium text-gray-900">Live Run</h3>
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">Production</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-3">Execute with browser automation enabled</p>
                        <button
                            onClick={() => startOptimizer(false)}
                            disabled={isRunning}
                            className="w-full px-4 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                            Run Task
                        </button>
                    </div>

                    {/* Stop Task */}
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium text-gray-900">Control</h3>
                            {getStatusBadge()}
                        </div>
                        <p className="text-xs text-gray-500 mb-3">Stop running task or reset configuration</p>
                        <div className="flex space-x-2">
                            <button
                                onClick={stopOptimizer}
                                disabled={!isRunning}
                                className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                            >
                                Stop
                            </button>
                            <button
                                onClick={resetForm}
                                disabled={isRunning}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Configuration & Output */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Configuration */}
                <div className="space-y-4">
                    {/* Bid Settings */}
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <h3 className="font-medium text-gray-900 mb-4">💰 Bid Settings</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-600 mb-2">
                                    Starting Bid: <span className="font-medium text-gray-900">₹{startBid.toLocaleString()}</span>
                                </label>
                                <input
                                    type="range"
                                    min={minBid}
                                    max={maxBid}
                                    value={startBid}
                                    onChange={(e) => setStartBid(Number(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                                    disabled={isRunning}
                                />
                                <div className="flex justify-between text-xs text-gray-400 mt-1">
                                    <span>₹{minBid.toLocaleString()}</span>
                                    <span>₹{maxBid.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Min Bid (₹)</label>
                                    <input
                                        type="number"
                                        value={minBid}
                                        onChange={(e) => setMinBid(Number(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        disabled={isRunning}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Max Bid (₹)</label>
                                    <input
                                        type="number"
                                        value={maxBid}
                                        onChange={(e) => setMaxBid(Number(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        disabled={isRunning}
                                    />
                                </div>
                            </div>

                            <label className="flex items-center text-sm text-gray-600 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={generateReport}
                                    onChange={(e) => setGenerateReport(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 mr-2"
                                    disabled={isRunning}
                                />
                                📄 Generate PDF Report
                            </label>

                            <label className="flex items-center text-sm text-gray-600 cursor-pointer mt-2">
                                <input
                                    type="checkbox"
                                    checked={useVisualRanking}
                                    onChange={(e) => setUseVisualRanking(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 mr-2"
                                    disabled={isRunning}
                                />
                                🖥️ Show Visual Ranking Check
                            </label>
                        </div>
                    </div>

                    {/* Keywords */}
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <h3 className="font-medium text-gray-900 mb-4">🎯 Keywords</h3>

                        <div className="flex flex-wrap gap-2 mb-3">
                            {keywords.map((keyword) => (
                                <span
                                    key={keyword}
                                    className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                                >
                                    {keyword}
                                    {!isRunning && (
                                        <button
                                            onClick={() => removeKeyword(keyword)}
                                            className="ml-2 text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            ×
                                        </button>
                                    )}
                                </span>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newKeyword}
                                onChange={(e) => setNewKeyword(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                                placeholder="Add keyword..."
                                className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                disabled={isRunning}
                            />
                            <button
                                onClick={addKeyword}
                                disabled={isRunning || !newKeyword.trim()}
                                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                            >
                                Add
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right: Console Output */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="font-medium text-gray-900">Console Output</h3>
                        {isRunning && (
                            <span className="flex items-center text-xs text-green-600">
                                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                                Live
                            </span>
                        )}
                    </div>

                    <div
                        ref={consoleRef}
                        className="p-4 font-mono text-xs text-green-400 overflow-auto h-[400px]"
                        style={{ backgroundColor: '#1a1a2e' }}
                    >
                        {consoleOutput.length === 0 ? (
                            <div className="text-gray-500 italic">
                                Output will appear here when you run a task...
                            </div>
                        ) : (
                            consoleOutput.map((line, index) => (
                                <pre key={index} className="whitespace-pre-wrap break-words mb-0.5">
                                    {line}
                                </pre>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Results Summary */}
            {status === 'completed' && (
                <div className="mt-6 bg-green-50 rounded-lg border border-green-200 p-4">
                    <h3 className="font-medium text-green-800 mb-2">🏆 Optimization Complete</h3>
                    <p className="text-sm text-green-700">
                        Check the console output for detailed results including optimal bids and savings summary.
                    </p>
                    {generateReport && (
                        <p className="text-sm text-green-600 mt-2">
                            📄 PDF report has been generated in the automation/bid-optimizer/reports folder.
                        </p>
                    )}
                </div>
            )}
        </Layout>
    );
};

export default BidOptimizerForm;

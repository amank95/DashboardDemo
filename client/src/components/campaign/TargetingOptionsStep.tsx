import React, { useState } from 'react';
import { CampaignFormData, Keyword, CategoryTarget } from '../../types';

interface TargetingOptionsStepProps {
    formData: CampaignFormData;
    updateFormData: (field: string, value: any) => void;
}

const SUGGESTED_KEYWORDS = [
    { text: 'pop boba', searchVolume: 515350, trending: true, smartMatchBid: 12 },
    { text: 'fruit boba', searchVolume: 277532, trending: true, smartMatchBid: 15 },
    { text: 'tapioca chips', searchVolume: 273685, trending: false, smartMatchBid: 10 },
    { text: 'snacks', searchVolume: 23319, trending: true, smartMatchBid: 20 },
    { text: 'beverages', searchVolume: 22011, trending: true, smartMatchBid: 25 },
    { text: 'healthy chips', searchVolume: 15683, trending: true, smartMatchBid: 14 },
    { text: 'spicy chips', searchVolume: 6745, trending: true, smartMatchBid: 18 },
    { text: 'mocktail mix', searchVolume: 3212, trending: false, smartMatchBid: 22 },
    { text: 'bubble tea', searchVolume: 1137, trending: true, smartMatchBid: 16 },
    { text: 'dobra', searchVolume: 120112, trending: true, smartMatchBid: 11 },
];

const SUGGESTED_CATEGORIES: CategoryTarget[] = [
    { id: 'c1', name: 'Beverages', visits: 15471, suggestedBidRange: '₹1155 - ₹1271', selected: false },
    { id: 'c2', name: 'Confectionery', visits: 88928, suggestedBidRange: '₹3540 - ₹3894', selected: false },
    { id: 'c3', name: 'Snacks', visits: 45201, suggestedBidRange: '₹950 - ₹1100', selected: false },
];

const TargetingOptionsStep: React.FC<TargetingOptionsStepProps> = ({ formData, updateFormData }) => {
    const [activeFilters, setActiveFilters] = useState({
        branded: true,
        generic: true,
        event: true,
    });

    const [manualKeywordInput, setManualKeywordInput] = useState('');
    const [negativeKeywordInput, setNegativeKeywordInput] = useState('');

    // Initializing missing fields if undefined (handling migration/first render)
    if (!formData.targeting.categories) {
        // This logic should ideally be in a useEffect or parent, but for this stateless render pass we'll handle it gracefully in UI rendering or events
    }

    const selectedKeywords = formData.targeting.keywords || [];
    const negativeKeywords = formData.targeting.negativeKeywords || [];

    const updateTargeting = (field: string, value: any) => {
        updateFormData('targeting', {
            ...formData.targeting,
            [field]: value
        });
    };

    const addKeyword = (keywordData: Partial<Keyword>) => {
        if (selectedKeywords.find(k => k.text === keywordData.text)) return;
        const newKeyword: Keyword = {
            text: keywordData.text!,
            searchVolume: keywordData.searchVolume,
            trending: keywordData.trending,
            exactMatchBid: keywordData.smartMatchBid,
            smartMatchBid: keywordData.smartMatchBid,
            bidBooster: false
        };
        updateTargeting('keywords', [...selectedKeywords, newKeyword]);
    };

    const addManualKeyword = () => {
        if (!manualKeywordInput.trim()) return;
        // Split by comma if user enters multiple
        const keywords = manualKeywordInput.split(',').map(k => k.trim()).filter(k => k);

        const newKeywords = keywords.map(text => ({
            text,
            smartMatchBid: 0, // Default
            bidBooster: false
        })).filter(nk => !selectedKeywords.some(sk => sk.text === nk.text));

        // Construct proper implementation later, for now adding one by one logic structure
        const finalKeywords = [...selectedKeywords];
        newKeywords.forEach(k => {
            finalKeywords.push({ ...k, exactMatchBid: 0, smartMatchBid: 0 } as Keyword);
        });

        updateTargeting('keywords', finalKeywords);
        setManualKeywordInput('');
    };

    const addNegativeKeyword = () => {
        if (!negativeKeywordInput.trim()) return;
        if (!negativeKeywords.includes(negativeKeywordInput.trim())) {
            updateTargeting('negativeKeywords', [...negativeKeywords, negativeKeywordInput.trim()]);
        }
        setNegativeKeywordInput('');
    };

    const removeKeyword = (text: string) => {
        updateTargeting('keywords', selectedKeywords.filter(k => k.text !== text));
    };

    const removeNegativeKeyword = (text: string) => {
        updateTargeting('negativeKeywords', negativeKeywords.filter(k => k !== text));
    };

    const updateKeyword = (text: string, updates: Partial<Keyword>) => {
        const updatedKeywords = selectedKeywords.map(k =>
            k.text === text ? { ...k, ...updates } : k
        );
        updateTargeting('keywords', updatedKeywords);
    };

    // Category Logic
    const categories = formData.targeting.categories && formData.targeting.categories.length > 0
        ? formData.targeting.categories
        : SUGGESTED_CATEGORIES;

    const toggleCategory = (id: string) => {
        const updatedCategories = categories.map(c =>
            c.id === id ? { ...c, selected: !c.selected } : c
        );
        updateTargeting('categories', updatedCategories);
    };

    const updateCategoryBid = (id: string, bid: number) => {
        const updatedCategories = categories.map(c =>
            c.id === id ? { ...c, cpmBid: bid } : c
        );
        updateTargeting('categories', updatedCategories);
    };

    return (
        <div className="animate-fadeIn space-y-8">
            <p className="text-gray-700 font-medium">You can select multiple targeting options to boost your product across the platform</p>

            {/* 1. Keyword Targeting Section */}
            <div className="bg-white rounded-lg p-1">
                <label className="flex items-center space-x-2 cursor-pointer mb-6">
                    <input
                        type="checkbox"
                        checked={formData.targeting.enableKeywords ?? true}
                        onChange={(e) => updateTargeting('enableKeywords', e.target.checked)}
                        className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-xl font-bold text-gray-900">Keyword targeting</span>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-semibold rounded border border-blue-100">Search Listing</span>
                </label>

                <p className="text-sm text-gray-600 mb-6 ml-7">Select this for boosting your products on search keywords</p>

                {(formData.targeting.enableKeywords ?? true) && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Left Pane: Suggested Keywords + Manual Entry */}
                            <div className="flex flex-col space-y-4">
                                <div className="border border-gray-200 rounded-lg p-5 flex flex-col h-[400px]">
                                    <h3 className="font-bold text-gray-900 mb-1">Suggested keywords</h3>
                                    <p className="text-xs text-gray-500 mb-4">Pick relevant keywords from our suggestions to target in this campaign</p>

                                    <div className="flex flex-wrap items-center gap-2 mb-4">
                                        <span className="text-sm text-gray-500 mr-1">Filters</span>
                                        {Object.entries(activeFilters).map(([key, active]) => (
                                            <button
                                                key={key}
                                                onClick={() => setActiveFilters(prev => ({ ...prev, [key as keyof typeof activeFilters]: !active }))}
                                                className={`flex items-center px-3 py-1 rounded-full text-xs font-medium border transition-colors ${active
                                                    ? 'bg-green-50 border-green-200 text-green-700'
                                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {key.charAt(0).toUpperCase() + key.slice(1)} keywords
                                                {active && <svg className="w-3 h-3 ml-1.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                        <div className="grid grid-cols-2 gap-3">
                                            {SUGGESTED_KEYWORDS.map((item, idx) => {
                                                const isSelected = selectedKeywords.some(k => k.text === item.text);
                                                return (
                                                    <button
                                                        key={idx}
                                                        onClick={() => addKeyword(item)}
                                                        disabled={isSelected}
                                                        className={`text-left p-3 rounded-lg border transition-all ${isSelected
                                                            ? 'bg-gray-50 border-gray-200 opacity-50 cursor-default'
                                                            : 'bg-white border-gray-200 hover:border-green-500 hover:shadow-sm'
                                                            }`}
                                                    >
                                                        <div className="font-medium text-gray-900 text-sm mb-1 line-clamp-1" title={item.text}>{item.text}</div>
                                                        <div className="flex justify-between items-center text-xs text-gray-500">
                                                            <span>({item.searchVolume.toLocaleString()} searches)</span>
                                                            {item.trending && (
                                                                <span className="text-blue-600 font-medium flex items-center">
                                                                    Trending
                                                                    <svg className="w-3 h-3 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                                                                </span>
                                                            )}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-400">
                                        *Approximate no. of searches in the last 30 days
                                    </div>
                                </div>

                                {/* Manual Entry */}
                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                    <h3 className="font-bold text-gray-900 text-sm mb-1">Enter keywords manually</h3>
                                    <p className="text-xs text-gray-500 mb-3">Type specific keywords or add a list separated by commas</p>
                                    <div className="flex space-x-2">
                                        <input
                                            type="text"
                                            value={manualKeywordInput}
                                            onChange={(e) => setManualKeywordInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && addManualKeyword()}
                                            placeholder="Type a keyword & press enter"
                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                                        />
                                        <button className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap flex items-center">
                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                            Bulk Upload
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Right Pane: Selected Keywords */}
                            <div className="border border-gray-200 rounded-lg flex flex-col h-[540px]">
                                <div className="p-4 border-b border-gray-100 bg-white rounded-t-lg">
                                    <h3 className="font-bold text-gray-900">Selected keywords</h3>
                                    <p className="text-xs text-gray-500">Your selected keywords will appear here</p>
                                </div>
                                <div className="flex-1 bg-[#f8fafc] overflow-y-auto p-4 space-y-4">
                                    {selectedKeywords.map((keyword, idx) => (
                                        <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm grid grid-cols-12 gap-2 group hover:border-green-200 transition-colors">
                                            <div className="col-span-4 flex items-start space-x-3">
                                                <button onClick={() => removeKeyword(keyword.text)} className="text-red-400 hover:text-red-600 mt-1">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                                <div>
                                                    <div className="font-bold text-gray-900 text-sm">{keyword.text}</div>
                                                    <div className="text-xs text-gray-400 mt-0.5">({keyword.searchVolume ? keyword.searchVolume.toLocaleString() : 'N/A'} searches)</div>
                                                </div>
                                            </div>
                                            <div className="col-span-3 flex flex-col items-center">
                                                <div className="relative w-full">
                                                    <span className="absolute left-3 top-2.5 text-gray-400 text-sm">₹</span>
                                                    <input
                                                        type="number"
                                                        placeholder="Enter..."
                                                        value={keyword.exactMatchBid || ''}
                                                        onChange={(e) => updateKeyword(keyword.text, { exactMatchBid: parseFloat(e.target.value) })}
                                                        className="w-full pl-6 pr-3 py-2 border border-gray-200 rounded text-sm focus:border-green-500 outline-none"
                                                    />
                                                </div>
                                                <div className="text-[10px] text-gray-400 text-center mt-2 leading-tight">Suggested top bid range<br /><span className="font-medium text-gray-600">₹359 - ₹395</span></div>
                                            </div>
                                            <div className="col-span-2 flex justify-center pt-2">
                                                <label className="flex flex-col items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={keyword.bidBooster || false}
                                                        onChange={(e) => updateKeyword(keyword.text, { bidBooster: e.target.checked })}
                                                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 mb-1"
                                                    />
                                                    <span className="text-[10px] text-gray-600 font-medium">Boost my bid</span>
                                                </label>
                                            </div>
                                            <div className="col-span-3 flex justify-center pt-0">
                                                <div className="relative w-full opacity-60">
                                                    <span className="absolute left-3 top-2.5 text-gray-400 text-sm">₹</span>
                                                    <input type="text" value="Enter amount" disabled className="w-full pl-6 pr-3 py-2 border border-gray-200 rounded text-sm bg-gray-50 text-gray-400" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Negative Keywords Section */}
                        <div className="bg-white border border-gray-200 rounded-lg p-5">
                            <div className="flex items-center space-x-2 mb-2">
                                <h3 className="font-bold text-gray-900">Negative keywords</h3>
                                <span className="text-xs text-gray-400">(Optional)</span>
                            </div>
                            <p className="text-xs text-gray-500 mb-4">Your ads will not appear on these searches. Please enter the negative keywords below.</p>

                            <input
                                type="text"
                                value={negativeKeywordInput}
                                onChange={(e) => setNegativeKeywordInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addNegativeKeyword()}
                                placeholder="Type a keyword & press enter"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                            />

                            {negativeKeywords.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-4">
                                    {negativeKeywords.map((nk, idx) => (
                                        <span key={idx} className="inline-flex items-center px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm">
                                            {nk}
                                            <button onClick={() => removeNegativeKeyword(nk)} className="ml-2 hover:text-red-900">×</button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* 3. Category Targeting Section */}
            <div className="bg-white rounded-lg p-1">
                <label className="flex items-center space-x-2 cursor-pointer mb-6">
                    <input
                        type="checkbox"
                        checked={formData.targeting.enableCategoryTargeting ?? false}
                        onChange={(e) => updateTargeting('enableCategoryTargeting', e.target.checked)}
                        className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-xl font-bold text-gray-900">Category targeting</span>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-semibold rounded border border-blue-100">Category Listing</span>
                </label>

                <p className="text-sm text-gray-600 mb-6 ml-7">Select this for boosting your products on their category listings</p>

                {
                    (formData.targeting.enableCategoryTargeting) && (
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden ml-7">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-[#f8fafc]">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Number of category visits</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">CPM Bid ⓘ</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Suggested top bid range</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {categories.map((cat) => (
                                        <tr key={cat.id} className={cat.selected ? 'bg-green-50' : ''}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <label className="flex items-center space-x-3 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={cat.selected}
                                                        onChange={() => toggleCategory(cat.id)}
                                                        className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                                    />
                                                    <span className={`text-sm font-medium ${cat.selected ? 'text-gray-900' : 'text-gray-500'}`}>{cat.name}</span>
                                                </label>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                                                {cat.visits.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="relative w-40">
                                                    <span className="absolute left-3 top-2.5 text-gray-400 text-sm">₹</span>
                                                    <input
                                                        type="number"
                                                        placeholder="Enter amount"
                                                        value={cat.cpmBid || ''}
                                                        onChange={(e) => updateCategoryBid(cat.id, parseFloat(e.target.value))}
                                                        disabled={!cat.selected}
                                                        className="w-full pl-6 pr-3 py-2 border border-gray-200 rounded text-sm focus:border-green-500 outline-none disabled:bg-gray-50 disabled:text-gray-400"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex px-4 py-1.5 rounded-md bg-blue-50 text-blue-700 text-sm font-bold border border-blue-100">
                                                    {cat.suggestedBidRange}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                }
            </div >
        </div >
    );
};

export default TargetingOptionsStep;

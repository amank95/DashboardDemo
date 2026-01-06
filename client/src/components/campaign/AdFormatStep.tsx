import React from 'react';
import { CampaignFormData } from '../../types';

interface AdFormatStepProps {
    formData: CampaignFormData;
    updateFormData: (field: string, value: any) => void;
}

const AdFormatStep: React.FC<AdFormatStepProps> = ({ formData, updateFormData }) => {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Add a campaign name</h2>
                <p className="text-sm text-gray-500 mb-4">Add a title to your campaign for easy reference</p>
                <input
                    type="text"
                    value={formData.campaignName || ''}
                    onChange={(e) => updateFormData('campaignName', e.target.value)}
                    placeholder="Trial"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                />
            </div>

            <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Select your advertising objective</h2>
                <p className="text-sm text-gray-500 mb-4">What do you want to achieve through this campaign?</p>

                <div className="grid grid-cols-2 gap-4">
                    <button
                        type="button"
                        onClick={() => updateFormData('objective', 'Performance')}
                        className={`p-4 border-2 rounded-lg text-left transition-all hover:border-green-500 ${formData.objective === 'Performance'
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 bg-white'
                            }`}
                    >
                        <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-1">Performance</h3>
                                <p className="text-sm text-gray-600">Drive clicks, conversions, and measurable results</p>
                            </div>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => updateFormData('objective', 'Reach')}
                        className={`p-4 border-2 rounded-lg text-left transition-all hover:border-green-500 ${formData.objective === 'Reach'
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 bg-white'
                            }`}
                    >
                        <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-1">Reach</h3>
                                <p className="text-sm text-gray-600">Maximize visibility and connect with more shoppers</p>
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            {formData.objective === 'Performance' && (
                <div className="animate-fadeIn">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Select the Ad asset</h2>
                    <p className="text-sm text-gray-500 mb-6">These are recommended ad assets based on your advertising objective</p>

                    <div className="grid grid-cols-2 gap-6">
                        <button
                            type="button"
                            onClick={() => updateFormData('adAsset', 'product_booster')}
                            className={`relative overflow-hidden rounded-xl border-2 text-left transition-all hover:border-green-500 group ${formData.adAsset === 'product_booster'
                                ? 'border-green-500 bg-green-50 ring-1 ring-green-500'
                                : 'border-gray-200 bg-white hover:shadow-md'
                                }`}
                        >
                            <div className="p-5">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${formData.adAsset === 'product_booster'
                                            ? 'border-green-500 bg-green-500'
                                            : 'border-gray-300 bg-white'
                                            }`}>
                                            {formData.adAsset === 'product_booster' && (
                                                <div className="w-2 h-2 rounded-full bg-white" />
                                            )}
                                        </div>
                                        <span className="font-bold text-gray-900 text-lg">Product Booster</span>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600 mb-6 pl-8">
                                    Boost your product's search and category listing performance
                                </p>
                                <div className="flex justify-center bg-gray-50 rounded-lg p-4 mt-2">
                                    <img
                                        src="/assets/product-booster.png"
                                        alt="Product Booster Preview"
                                        className="h-48 object-contain transition-transform group-hover:scale-105"
                                    />
                                </div>
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() => updateFormData('adAsset', 'recommendation_ads')}
                            className={`relative overflow-hidden rounded-xl border-2 text-left transition-all hover:border-green-500 group ${formData.adAsset === 'recommendation_ads'
                                ? 'border-green-500 bg-green-50 ring-1 ring-green-500'
                                : 'border-gray-200 bg-white hover:shadow-md'
                                }`}
                        >
                            <div className="p-5">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${formData.adAsset === 'recommendation_ads'
                                            ? 'border-green-500 bg-green-500'
                                            : 'border-gray-300 bg-white'
                                            }`}>
                                            {formData.adAsset === 'recommendation_ads' && (
                                                <div className="w-2 h-2 rounded-full bg-white" />
                                            )}
                                        </div>
                                        <span className="font-bold text-gray-900 text-lg">Recommendation Ads</span>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600 mb-6 pl-8">
                                    Boost your product's performance in recommendations engines
                                </p>
                                <div className="flex justify-center bg-gray-50 rounded-lg p-4 mt-2">
                                    <img
                                        src="/assets/recommendation-ads.png"
                                        alt="Recommendation Ads Preview"
                                        className="h-48 object-contain transition-transform group-hover:scale-105"
                                    />
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            )}

            {formData.objective === 'Reach' && (
                <div className="animate-fadeIn">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Select the Ad asset</h2>
                    <p className="text-sm text-gray-500 mb-6">These are recommended ad assets based on your advertising objective</p>

                    <div className="grid grid-cols-2 gap-6">
                        <button
                            type="button"
                            onClick={() => updateFormData('adAsset', 'listing_spotlight')}
                            className={`relative overflow-hidden rounded-xl border-2 text-left transition-all hover:border-green-500 group ${formData.adAsset === 'listing_spotlight'
                                    ? 'border-green-500 bg-green-50 ring-1 ring-green-500'
                                    : 'border-gray-200 bg-white hover:shadow-md'
                                }`}
                        >
                            <div className="p-5">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${formData.adAsset === 'listing_spotlight'
                                                ? 'border-green-500 bg-green-500'
                                                : 'border-gray-300 bg-white'
                                            }`}>
                                            {formData.adAsset === 'listing_spotlight' && (
                                                <div className="w-2 h-2 rounded-full bg-white" />
                                            )}
                                        </div>
                                        <span className="font-bold text-gray-900 text-lg">Listing Spotlight</span>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600 mb-6 pl-8">
                                    Enhance brand visibility and acquire new customers
                                </p>
                                <div className="flex justify-center bg-gray-50 rounded-lg p-4 mt-2">
                                    <img
                                        src="/assets/listing-spotlight.png"
                                        alt="Listing Spotlight Preview"
                                        className="h-48 object-contain transition-transform group-hover:scale-105"
                                    />
                                </div>
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() => updateFormData('adAsset', 'brand_booster')}
                            className={`relative overflow-hidden rounded-xl border-2 text-left transition-all hover:border-green-500 group ${formData.adAsset === 'brand_booster'
                                    ? 'border-green-500 bg-green-50 ring-1 ring-green-500'
                                    : 'border-gray-200 bg-white hover:shadow-md'
                                }`}
                        >
                            <div className="p-5">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${formData.adAsset === 'brand_booster'
                                                ? 'border-green-500 bg-green-500'
                                                : 'border-gray-300 bg-white'
                                            }`}>
                                            {formData.adAsset === 'brand_booster' && (
                                                <div className="w-2 h-2 rounded-full bg-white" />
                                            )}
                                        </div>
                                        <span className="font-bold text-gray-900 text-lg">Brand Booster</span>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600 mb-6 pl-8">
                                    Enhance your brands visibility on search and category listings
                                </p>
                                <div className="flex justify-center bg-gray-50 rounded-lg p-4 mt-2">
                                    <img
                                        src="/assets/brand-booster.png"
                                        alt="Brand Booster Preview"
                                        className="h-48 object-contain transition-transform group-hover:scale-105"
                                    />
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default AdFormatStep;

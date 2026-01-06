import React from 'react';
import { CampaignFormData } from '../../types';

interface BudgetDetailsStepProps {
    formData: CampaignFormData;
    updateFormData: (field: string, value: any) => void;
}

const BudgetDetailsStep: React.FC<BudgetDetailsStepProps> = ({ formData, updateFormData }) => {
    const budgetType = formData.budget?.type || 'overall';
    const budgetAmount = formData.budget?.amount || '';

    const handleTypeChange = (type: 'overall' | 'daily') => {
        updateFormData('budget', {
            ...formData.budget,
            type: type
        });
    };

    const handleAmountChange = (amount: string) => {
        updateFormData('budget', {
            ...formData.budget,
            amount: parseFloat(amount) || 0
        });
    };

    return (
        <div className="animate-fadeIn space-y-6 max-w-3xl">
            <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Select a campaign budget</h2>
                <p className="text-sm text-gray-500">Select the budget strategy and specify this campaign's budget amount.</p>
            </div>

            <div className="space-y-4">
                {/* Overall Budget Option */}
                <div
                    className={`border rounded-lg p-5 transition-all cursor-pointer ${budgetType === 'overall'
                            ? 'bg-green-50 border-green-200 ring-1 ring-green-200'
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                    onClick={() => handleTypeChange('overall')}
                >
                    <div className="flex items-start space-x-3">
                        <div className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center ${budgetType === 'overall' ? 'border-green-600' : 'border-gray-400'
                            }`}>
                            {budgetType === 'overall' && <div className="w-2.5 h-2.5 rounded-full bg-green-600" />}
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900 text-sm">Overall campaign budget</h3>
                            <p className="text-xs text-gray-600 mt-1 mb-4">Set an amount you want to spend on the entire campaign's lifetime</p>

                            {budgetType === 'overall' && (
                                <div className="animate-fadeIn">
                                    <div className="relative w-full max-w-sm">
                                        <span className="absolute left-3 top-2.5 text-gray-900 font-medium">₹</span>
                                        <input
                                            type="number"
                                            placeholder="Enter Budget Value"
                                            value={budgetAmount || ''}
                                            onChange={(e) => handleAmountChange(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                                        This is the maximum you'll spend for the entire campaign. Spend may vary by day - more on high-performing days, less on others. It won't be split evenly.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Daily Budget Option */}
                <div
                    className={`border rounded-lg p-5 transition-all cursor-pointer ${budgetType === 'daily'
                            ? 'bg-green-50 border-green-200 ring-1 ring-green-200'
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                    onClick={() => handleTypeChange('daily')}
                >
                    <div className="flex items-start space-x-3">
                        <div className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center ${budgetType === 'daily' ? 'border-green-600' : 'border-gray-400'
                            }`}>
                            {budgetType === 'daily' && <div className="w-2.5 h-2.5 rounded-full bg-green-600" />}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center">
                                <h3 className="font-bold text-gray-900 text-sm mr-1">Daily budget</h3>
                                <span className="text-gray-400 cursor-help" title="Daily spending limit">ⓘ</span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1 mb-2">Set an amount you want to spend on the campaign every day</p>

                            {budgetType === 'daily' && (
                                <div className="animate-fadeIn mt-4">
                                    <div className="relative w-full max-w-sm">
                                        <span className="absolute left-3 top-2.5 text-gray-900 font-medium">₹</span>
                                        <input
                                            type="number"
                                            placeholder="Enter Daily Budget"
                                            value={budgetAmount || ''}
                                            onChange={(e) => handleAmountChange(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BudgetDetailsStep;

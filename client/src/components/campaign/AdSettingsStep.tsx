import React, { useState } from 'react';
import { CampaignFormData } from '../../types';

interface AdSettingsStepProps {
    formData: CampaignFormData;
    updateFormData: (field: string, value: any) => void;
}

const CITIES = [
    'New Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad',
    'Jaipur', 'Lucknow', 'Madurai', 'Mainpuri', 'Manali', 'Mangalore', 'Manipal', 'Mathura',
    'Chandigarh', 'Coimbatore', 'Indore', 'Kochi', 'Nagpur', 'Patna', 'Surat', 'Vadodara'
];

const AdSettingsStep: React.FC<AdSettingsStepProps> = ({ formData, updateFormData }) => {
    const [citySearch, setCitySearch] = useState('');

    const filteredCities = CITIES.filter(city =>
        city.toLowerCase().includes(citySearch.toLowerCase())
    );

    const toggleCity = (city: string) => {
        const currentCities = formData.selectedCities || [];
        const newCities = currentCities.includes(city)
            ? currentCities.filter((c: string) => c !== city)
            : [...currentCities, city];
        updateFormData('selectedCities', newCities);
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Campaign Duration Section */}
            <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Select campaign duration</h2>
                <p className="text-sm text-gray-500 mb-6">Select the schedule that best suits your audience</p>

                <div className="space-y-4 max-w-md">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Start Date
                        </label>
                        <div className="relative">
                            <input
                                type="date"
                                value={formData.startDate || ''}
                                onChange={(e) => updateFormData('startDate', e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="noEndDate"
                            checked={formData.noEndDate || false}
                            onChange={(e) => updateFormData('noEndDate', e.target.checked)}
                            className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />
                        <label htmlFor="noEndDate" className="text-sm text-gray-700">
                            No End Date
                        </label>
                    </div>

                    <div>
                        <label className={`block text-sm font-medium mb-2 ${formData.noEndDate ? 'text-gray-400' : 'text-gray-700'}`}>
                            End Date
                        </label>
                        <div className="relative">
                            <input
                                type="date"
                                value={formData.endDate || ''}
                                onChange={(e) => updateFormData('endDate', e.target.value)}
                                disabled={formData.noEndDate}
                                className={`w-full px-4 py-2.5 border rounded-md outline-none transition-all ${formData.noEndDate
                                    ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent'
                                    }`}
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex items-start space-x-2 bg-blue-50 text-blue-700 p-3 rounded-md text-sm">
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>
                        No end date signifies that the campaign is run until the budget is utilized or if stopped manually, billing is done in 1st week of every month.
                    </p>
                </div>
            </div>

            {/* Campaign Region Section */}
            <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Select campaign region</h2>
                <p className="text-sm text-gray-500 mb-4">Choose locations where your audience is most active</p>

                <div className="space-y-3">
                    <label className="flex items-center space-x-3 cursor-pointer group">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${formData.region === 'Pan India'
                            ? 'border-green-600'
                            : 'border-gray-400 group-hover:border-green-500'
                            }`}>
                            {formData.region === 'Pan India' && (
                                <div className="w-2.5 h-2.5 rounded-full bg-green-600" />
                            )}
                        </div>
                        <input
                            type="radio"
                            name="region"
                            value="Pan India"
                            checked={formData.region === 'Pan India'}
                            onChange={() => updateFormData('region', 'Pan India')}
                            className="hidden"
                        />
                        <span className="text-gray-900 font-medium">Pan India</span>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer group">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${formData.region === 'Select Cities'
                            ? 'border-green-600'
                            : 'border-gray-400 group-hover:border-green-500'
                            }`}>
                            {formData.region === 'Select Cities' && (
                                <div className="w-2.5 h-2.5 rounded-full bg-green-600" />
                            )}
                        </div>
                        <input
                            type="radio"
                            name="region"
                            value="Select Cities"
                            checked={formData.region === 'Select Cities'}
                            onChange={() => updateFormData('region', 'Select Cities')}
                            className="hidden"
                        />
                        <span className="text-gray-900 font-medium">Select Cities</span>
                    </label>

                    {/* Searchable City Selection */}
                    {formData.region === 'Select Cities' && (
                        <div className="mt-4 pl-8 animate-fadeIn">
                            <div className="relative max-w-md">
                                <input
                                    type="text"
                                    placeholder="Seach city"
                                    value={citySearch}
                                    onChange={(e) => setCitySearch(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none pl-10"
                                />
                                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>

                            <div className="mt-3 max-w-md max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-white shadow-sm">
                                {filteredCities.map(city => (
                                    <label key={city} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.selectedCities?.includes(city) || false}
                                            onChange={() => toggleCity(city)}
                                            className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                        />
                                        <span className="text-gray-700">{city}</span>
                                    </label>
                                ))}
                                {filteredCities.length === 0 && (
                                    <p className="text-gray-500 text-center py-2">No cities found</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdSettingsStep;

import React from 'react';
import { AdType } from '../../types';

interface AdTypeSelectionProps {
  adTypes: AdType[];
  onChange: (adTypes: AdType[]) => void;
}

const AdTypeSelection: React.FC<AdTypeSelectionProps> = ({ adTypes, onChange }) => {
  const availableAdTypes: AdType['type'][] = [
    'Product Ads',
    'Brand Ads',
    'Listing Spotlight',
    'Recommendation Ads'
  ];

  const priorities: AdType['priority'][] = ['Low', 'Medium', 'High'];

  const handleCheckboxChange = (type: AdType['type'], checked: boolean) => {
    if (checked) {
      // Add new ad type with default priority
      onChange([...adTypes, { type, priority: 'Medium' }]);
    } else {
      // Remove ad type
      onChange(adTypes.filter(at => at.type !== type));
    }
  };

  const handlePriorityChange = (type: AdType['type'], priority: AdType['priority']) => {
    onChange(
      adTypes.map(at => 
        at.type === type ? { ...at, priority } : at
      )
    );
  };

  const getPriorityForType = (type: AdType['type']): AdType['priority'] => {
    const adType = adTypes.find(at => at.type === type);
    return adType?.priority || 'Medium';
  };

  const isTypeSelected = (type: AdType['type']): boolean => {
    return adTypes.some(at => at.type === type);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {availableAdTypes.map((type) => (
          <div key={type} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <input
                type="checkbox"
                id={type}
                checked={isTypeSelected(type)}
                onChange={(e) => handleCheckboxChange(type, e.target.checked)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor={type} className="ml-3 text-sm font-medium text-gray-700">
                {type}
              </label>
            </div>
            
            {isTypeSelected(type) && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority Level <span className="text-red-500">*</span>
                </label>
                <select
                  value={getPriorityForType(type)}
                  onChange={(e) => handlePriorityChange(type, e.target.value as AdType['priority'])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {priorities.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdTypeSelection;






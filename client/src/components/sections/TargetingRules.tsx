import React from 'react';
import { Targeting } from '../../types';

interface TargetingRulesProps {
  targeting: Targeting;
  onChange: (field: string, value: any) => void;
  onKeywordsChange: (keywords: string[]) => void;
}

const TargetingRules: React.FC<TargetingRulesProps> = ({
  targeting,
  onChange,
  onKeywordsChange
}) => {
  const handleKeywordsInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const keywords = value
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);
    onKeywordsChange(keywords);
  };

  const keywordsString = targeting.keywords.map(k => (typeof k === 'string' ? k : k.text)).join(', ');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
          City <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="city"
          value={targeting.city}
          onChange={(e) => onChange('targeting.city', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label htmlFor="pincode" className="block text-sm font-medium text-gray-700 mb-2">
          Pincode <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          id="pincode"
          value={targeting.pincode || ''}
          onChange={(e) => onChange('targeting.pincode', parseInt(e.target.value) || 0)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label htmlFor="timeSlotStart" className="block text-sm font-medium text-gray-700 mb-2">
          Time Slot Start <span className="text-red-500">*</span>
        </label>
        <input
          type="time"
          id="timeSlotStart"
          value={targeting.timeSlot.start}
          onChange={(e) => onChange('targeting.timeSlot.start', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label htmlFor="timeSlotEnd" className="block text-sm font-medium text-gray-700 mb-2">
          Time Slot End <span className="text-red-500">*</span>
        </label>
        <input
          type="time"
          id="timeSlotEnd"
          value={targeting.timeSlot.end}
          onChange={(e) => onChange('targeting.timeSlot.end', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Day Type <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-6">
          <label className="flex items-center">
            <input
              type="radio"
              name="dayType"
              value="Weekday"
              checked={targeting.dayType === 'Weekday'}
              onChange={(e) => onChange('targeting.dayType', e.target.value)}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Weekday</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="dayType"
              value="Weekend"
              checked={targeting.dayType === 'Weekend'}
              onChange={(e) => onChange('targeting.dayType', e.target.value)}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Weekend</span>
          </label>
        </div>
      </div>

      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={targeting.categoryMatch}
            onChange={(e) => onChange('targeting.categoryMatch', e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="ml-2 text-sm font-medium text-gray-700">
            Category Match
          </span>
        </label>
      </div>

      <div className="md:col-span-2">
        <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-2">
          Search Keywords (comma-separated) <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="keywords"
          value={keywordsString}
          onChange={handleKeywordsInput}
          placeholder="keyword1, keyword2, keyword3"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
        <p className="mt-1 text-xs text-gray-500">
          Separate multiple keywords with commas
        </p>
      </div>
    </div>
  );
};

export default TargetingRules;






import React from 'react';
import { CampaignFormData } from '../../types';

interface ProductSelectionProps {
  formData: CampaignFormData;
  onChange: (field: string, value: any) => void;
}

const ProductSelection: React.FC<ProductSelectionProps> = ({ formData, onChange }) => {
  const categories = [
    'Electronics',
    'Clothing',
    'Home & Kitchen',
    'Sports & Outdoors',
    'Books',
    'Toys & Games',
    'Health & Beauty',
    'Automotive',
    'Other'
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label htmlFor="productId" className="block text-sm font-medium text-gray-700 mb-2">
          Product ID / SKU <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="productId"
          value={formData.productId}
          onChange={(e) => onChange('productId', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label htmlFor="productName" className="block text-sm font-medium text-gray-700 mb-2">
          Product Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="productName"
          value={formData.productName}
          onChange={(e) => onChange('productName', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
          Category <span className="text-red-500">*</span>
        </label>
        <select
          id="category"
          value={formData.category}
          onChange={(e) => onChange('category', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        >
          <option value="">Select a category</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-2">
          Brand <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="brand"
          value={formData.brand}
          onChange={(e) => onChange('brand', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label htmlFor="currentRank" className="block text-sm font-medium text-gray-700 mb-2">
          Current Rank <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          id="currentRank"
          value={formData.currentRank}
          onChange={(e) => onChange('currentRank', parseInt(e.target.value) || 1)}
          min="1"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label htmlFor="targetRank" className="block text-sm font-medium text-gray-700 mb-2">
          Target Rank <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          id="targetRank"
          value={formData.targetRank}
          onChange={(e) => onChange('targetRank', parseInt(e.target.value) || 1)}
          min="1"
          defaultValue={1}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>
    </div>
  );
};

export default ProductSelection;




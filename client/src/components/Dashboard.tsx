import React, { useState, useEffect } from 'react';
import { Campaign, CampaignFormData, AdType } from '../types';
import { createCampaign, getAllCampaigns } from '../services/api';
import ProductSelection from './sections/ProductSelection';
import AdTypeSelection from './sections/AdTypeSelection';
import TargetingRules from './sections/TargetingRules';
import CampaignList from './CampaignList';

const Dashboard: React.FC = () => {
  const [formData, setFormData] = useState<CampaignFormData>({
    productId: '',
    productName: '',
    category: '',
    brand: '',
    currentRank: 1,
    targetRank: 1,
    adTypes: [],
    targeting: {
      city: '',
      pincode: 0,
      timeSlot: {
        start: '',
        end: ''
      },
      dayType: 'Weekday',
      keywords: [],
      categoryMatch: false
    }
  });

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const data = await getAllCampaigns();
      setCampaigns(data);
    } catch (error: any) {
      console.error('Error fetching campaigns:', error);
      // Only show error message if it's a user-facing error
      if (error.message && error.message !== 'Failed to fetch campaigns') {
        setErrorMessage(error.message);
      }
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith('targeting.')) {
      const path = field.replace('targeting.', '').split('.');
      setFormData(prev => {
        const newTargeting = { ...prev.targeting };
        if (path.length === 1) {
          // Direct targeting field (e.g., targeting.city)
          (newTargeting as any)[path[0]] = value;
        } else if (path[0] === 'timeSlot') {
          // Nested timeSlot (e.g., targeting.timeSlot.start)
          newTargeting.timeSlot = {
            ...prev.targeting.timeSlot,
            [path[1]]: value
          };
        }
        return {
          ...prev,
          targeting: newTargeting
        };
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleAdTypesChange = (adTypes: AdType[]) => {
    setFormData(prev => ({
      ...prev,
      adTypes
    }));
  };

  const handleKeywordsChange = (keywords: string[]) => {
    setFormData(prev => ({
      ...prev,
      targeting: {
        ...prev.targeting,
        keywords
      }
    }));
  };

  const validateForm = (): boolean => {
    // Section A validation
    if (!formData.productId.trim() || !formData.productName.trim() || 
        !formData.category.trim() || !formData.brand.trim() ||
        !formData.currentRank || !formData.targetRank) {
      setErrorMessage('Please fill all required fields in Section A');
      return false;
    }

    // Section B validation
    if (formData.adTypes.length === 0) {
      setErrorMessage('Please select at least one Ad Type');
      return false;
    }

    // Section C validation
    if (!formData.targeting.city.trim() || !formData.targeting.pincode ||
        !formData.targeting.timeSlot.start || !formData.targeting.timeSlot.end ||
        formData.targeting.keywords.length === 0) {
      setErrorMessage('Please fill all required fields in Targeting Rules');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await createCampaign(formData as Campaign);
      setSuccessMessage('Campaign created successfully!');
      
      // Reset form
      setFormData({
        productId: '',
        productName: '',
        category: '',
        brand: '',
        currentRank: 1,
        targetRank: 1,
        adTypes: [],
        targeting: {
          city: '',
          pincode: 0,
          timeSlot: {
            start: '',
            end: ''
          },
          dayType: 'Weekday',
          keywords: [],
          categoryMatch: false
        }
      });

      // Refresh campaigns list
      await fetchCampaigns();
    } catch (error: any) {
      // Ensure we always set a string, not an object
      const errorMsg = error.message || error.response?.data?.error || error.response?.data?.message || 'Failed to create campaign';
      setErrorMessage(typeof errorMsg === 'string' ? errorMsg : 'An unexpected error occurred');
      console.error('Campaign creation error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Ad Rank Controller</h1>
        <p className="text-gray-600">Configuration Dashboard for Product Ranking</p>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section A - Product Selection */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Section A — Product Selection</h2>
          <ProductSelection
            formData={formData}
            onChange={handleInputChange}
          />
        </div>

        {/* Section B - Ad Type Selection */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Section B — Ad Type Selection</h2>
          <AdTypeSelection
            adTypes={formData.adTypes}
            onChange={handleAdTypesChange}
          />
        </div>

        {/* Section C - Targeting Rules */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Section C — Targeting Rules</h2>
          <TargetingRules
            targeting={formData.targeting}
            onChange={handleInputChange}
            onKeywordsChange={handleKeywordsChange}
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Submitting...' : 'Submit Campaign'}
          </button>
        </div>
      </form>

      {/* Campaign List */}
      <div className="mt-12">
        <CampaignList campaigns={campaigns} />
      </div>
    </div>
  );
};

export default Dashboard;


import React, { useState } from 'react';
import { Campaign, CampaignFormData } from '../types';
import { createCampaign } from '../services/api';
import StepIndicator from './campaign/StepIndicator';
import AdFormatStep from './campaign/AdFormatStep';
import AdSettingsStep from './campaign/AdSettingsStep';
import ProductDetailsStep from './campaign/ProductDetailsStep';
import TargetingOptionsStep from './campaign/TargetingOptionsStep';
import BudgetDetailsStep from './campaign/BudgetDetailsStep';

const CreateCampaign: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<CampaignFormData>({
    campaignName: '',
    objective: '',
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
      categoryMatch: false,
      enableKeywords: true,
      keywords: [],
      negativeKeywords: [],
      enableCategoryTargeting: false,
      categories: []
    },
    budget: {
      type: 'overall',
      amount: 0
    }
  });

  const steps = [
    { number: 1, title: 'Ad Format' },
    { number: 2, title: 'Ad Settings' },
    { number: 3, title: 'Product details' },
    { number: 4, title: 'Targeting Options' },
    { number: 5, title: 'Budget Details' }
  ];

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      await createCampaign(formData as Campaign);
      alert('Campaign created successfully!');
      // Reset form or redirect
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Failed to create campaign');
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <AdFormatStep formData={formData} updateFormData={updateFormData} />;
      case 2:
        return <AdSettingsStep formData={formData} updateFormData={updateFormData} />;
      case 3:
        return <ProductDetailsStep formData={formData} updateFormData={updateFormData} />;
      case 4:
        return <TargetingOptionsStep formData={formData} updateFormData={updateFormData} />;
      case 5:
        return <BudgetDetailsStep formData={formData} updateFormData={updateFormData} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-yellow-400 rounded flex items-center justify-center">
            <span className="text-white font-bold text-sm">bc</span>
          </div>
          <span className="text-xl font-bold text-gray-900">brand central</span>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="mb-6 text-sm text-gray-600">
          <span className="hover:text-gray-900 cursor-pointer">Ad Campaign</span>
          <span className="mx-2">›</span>
          <span className="text-green-600 font-medium">Create new</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Create new campaign</h1>

        {/* Step Indicator */}
        <StepIndicator steps={steps} currentStep={currentStep} />

        {/* Form Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mt-8">
          {renderStep()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Previous
          </button>

          {currentStep < 5 ? (
            <button
              onClick={handleNext}
              className="px-8 py-2.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium shadow-sm"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="px-8 py-2.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium shadow-sm"
            >
              Submit Campaign
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateCampaign;

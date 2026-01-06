import React from 'react';

interface Step {
    number: number;
    title: string;
}

interface StepIndicatorProps {
    steps: Step[];
    currentStep: number;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ steps, currentStep }) => {
    return (
        <div className="flex items-center justify-between">
            {steps.map((step, index) => (
                <React.Fragment key={step.number}>
                    <div className="flex items-center">
                        <div
                            className={`flex items-center justify-center w-10 h-10 rounded-full border-2 font-semibold transition-all ${step.number === currentStep
                                    ? 'bg-green-600 border-green-600 text-white'
                                    : step.number < currentStep
                                        ? 'bg-green-600 border-green-600 text-white'
                                        : 'bg-white border-gray-300 text-gray-400'
                                }`}
                        >
                            {step.number < currentStep ? (
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            ) : (
                                step.number
                            )}
                        </div>
                        <span
                            className={`ml-3 text-sm font-medium ${step.number === currentStep
                                    ? 'text-gray-900'
                                    : step.number < currentStep
                                        ? 'text-gray-600'
                                        : 'text-gray-400'
                                }`}
                        >
                            {step.title}
                        </span>
                    </div>
                    {index < steps.length - 1 && (
                        <div className="flex-1 mx-4">
                            <div
                                className={`h-0.5 transition-all ${step.number < currentStep ? 'bg-green-600' : 'bg-gray-300'
                                    }`}
                            />
                        </div>
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};

export default StepIndicator;

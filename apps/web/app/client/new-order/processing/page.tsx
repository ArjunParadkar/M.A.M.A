'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { calculateFairPay } from '@/lib/pricingCalculator';
import { estimateCompletionTime } from '@/lib/completionTimeEstimator';

interface AnalysisResults {
  priceEstimate: {
    suggested_pay: number;
    range_low: number;
    range_high: number;
    breakdown: Record<string, number>;
  };
  timeEstimate: {
    estimated_hours: number;
    total_hours: number;
    setup_time_hours: number;
  };
  manufacturerMatches: Array<{
    manufacturer_id: string;
    manufacturer_name: string;
    rank_score: number;
    explanations: Record<string, number>;
    estimated_completion_days: number;
    capacity_score: number;
    quality_score: number;
  }>;
  analysisDetails: {
    material: string;
    quantity: number;
    tolerance: string;
    manufacturingTypes: string[];
    finish: string;
    coatings: string[];
  };
}

export default function ProcessingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderType = searchParams.get('type') || 'open-request';

  const [processingStep, setProcessingStep] = useState(1);
  const [completed, setCompleted] = useState(false);
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [formData, setFormData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Get form data from sessionStorage
    const storedData = sessionStorage.getItem('orderFormData');
    if (storedData) {
      const data = JSON.parse(storedData);
      setFormData(data);
    } else {
      // If no data, redirect back
      router.push('/client/new-order?type=' + orderType);
      return;
    }

    // Run AI analysis
    runAIAnalysis(JSON.parse(storedData));
  }, []);

  const runAIAnalysis = async (data: any) => {
    // Simulate AI processing steps
    const steps = [
      { delay: 1500, step: 1 },
      { delay: 2000, step: 2 },
      { delay: 1500, step: 3 },
      { delay: 2000, step: 4 },
      { delay: 1000, step: 5 },
    ];

    let currentIndex = 0;
    const processSteps = () => {
      if (currentIndex < steps.length) {
        const { delay, step } = steps[currentIndex];
        setTimeout(() => {
          setProcessingStep(step);
          currentIndex++;
          if (currentIndex < steps.length) {
            processSteps();
          } else {
            // After processing, calculate results
            setTimeout(() => {
              calculateResults(data);
            }, 500);
          }
        }, delay);
      }
    };

    processSteps();
  };

  const calculateResults = async (data: any) => {
    // TODO: Call actual API endpoints
    // For now, use accurate calculations based on F2 model

    const quantity = data.quantity || 1;
    const material = data.exactMaterial || 'ABS'; // Default fallback
    
    // Estimate hours based on manufacturing type and complexity
    // TODO: Use actual STL analysis for more accurate time
    const baseHours = data.manufacturingType?.includes('CNC') ? 3.0 : 
                     data.manufacturingType?.includes('3D') ? 2.0 : 2.5;
    const setupHours = 1.0;

    // Calculate accurate price using F2 Fair Pay Estimator
    const priceEstimate = calculateFairPay({
      material,
      quantity,
      toleranceThou: data.toleranceThou,
      estimatedHours: baseHours * quantity,
      setupHours,
      deadline: data.deadline,
      manufacturingTypes: data.manufacturingType || [],
    });

    // Calculate completion time estimate (based on manufacturer behavior model)
    // Example: This will use ML model once we have user data
    const timeEstimate = {
      estimated_hours: baseHours,
      total_hours: (baseHours * quantity) + setupHours,
      setup_time_hours: setupHours,
    };

    // Mock manufacturer matches with completion time from behavior model
    const mockManufacturers = [
      {
        manufacturer_id: 'mfg_001',
        manufacturer_name: 'Precision Makers LLC',
        rank_score: 0.92,
        explanations: { equipment_match: 0.95, reputation: 0.90, capacity: 0.88 },
        capacity_score: 0.85,
        quality_score: 0.88,
      },
      {
        manufacturer_id: 'mfg_002',
        manufacturer_name: 'TechFab Manufacturing',
        rank_score: 0.87,
        explanations: { equipment_match: 0.88, reputation: 0.92, capacity: 0.82 },
        capacity_score: 0.82,
        quality_score: 0.90,
      },
      {
        manufacturer_id: 'mfg_003',
        manufacturer_name: 'Custom Parts Co',
        rank_score: 0.83,
        explanations: { equipment_match: 0.85, reputation: 0.80, capacity: 0.85 },
        capacity_score: 0.88,
        quality_score: 0.82,
      },
    ];

    // Calculate completion time for each manufacturer using behavior model
    const jobComplexity = data.toleranceThou ? 
      (parseFloat(data.toleranceThou) <= 0.005 ? 0.75 : 0.5) : 0.5;
    
    const manufacturersWithCompletionTime = mockManufacturers.map(mfg => {
      const completionEstimate = estimateCompletionTime({
        manufacturer_capacity_score: mfg.capacity_score,
        manufacturer_quality_score: mfg.quality_score,
        estimated_hours: timeEstimate.total_hours,
        job_complexity: jobComplexity,
        manufacturing_type: data.manufacturingType?.[0],
        quantity,
      });
      
      return {
        ...mfg,
        estimated_completion_days: completionEstimate.estimated_completion_days,
      };
    });

    const results: AnalysisResults = {
      priceEstimate,
      timeEstimate,
      manufacturerMatches: manufacturersWithCompletionTime,
      analysisDetails: {
        material: material,
        quantity: quantity,
        tolerance: data.toleranceThou ? `±${data.toleranceThou}" (${(parseFloat(data.toleranceThou) * 25.4).toFixed(3)}mm)` : 'Not specified',
        manufacturingTypes: data.manufacturingType || [],
        finish: data.finishDetails || 'Not specified',
        coatings: data.coatings || [],
      },
    };

    setResults(results);
    setCompleted(true);
  };

  const handleSubmitOrder = async () => {
    setIsSubmitting(true);
    // TODO: Submit order to database
    // Redirect to success page or dashboard
    setTimeout(() => {
      sessionStorage.removeItem('orderFormData');
      router.push('/client/dashboard');
    }, 1000);
  };

  const steps = [
    'STL Analysis',
    'Price Calculation',
    'Time Estimation',
    'Manufacturer Matching',
    'Recommendations Ready',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-200 to-white">
      {/* Top Navigation Bar */}
      <div className="bg-[#0a1929] text-white py-4 px-8 border-b border-[#1a2332]">
        <div className="max-w-7xl mx-auto">
          <Link href="/client/dashboard" className="text-white hover:text-[#9ca3af] transition-colors">
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-8 py-8">
        {!completed ? (
          <div className="bg-[#0a1929] border border-[#1a2332] p-12 text-center">
            <div className="mb-8">
              <div className="inline-block w-16 h-16 border-4 border-[#253242] border-t-white rounded-full animate-spin mb-4" />
              <h2 className="text-2xl font-semibold text-white mb-2 heading-font">
                Processing Your Order
              </h2>
              <p className="text-[#9ca3af]">
                Our AI is analyzing your design and finding the best manufacturers...
              </p>
            </div>

            <div className="space-y-4">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-4 border ${
                    processingStep > index + 1
                      ? 'bg-[#253242] border-[#3a4552]'
                      : processingStep === index + 1
                      ? 'bg-[#1a2332] border-white'
                      : 'bg-[#1a2332] border-[#253242] opacity-50'
                  }`}
                >
                  <span
                    className={`${
                      processingStep >= index + 1 ? 'text-white' : 'text-[#6b7280]'
                    }`}
                  >
                    {step}
                  </span>
                  {processingStep > index + 1 && (
                    <span className="text-green-400">✓</span>
                  )}
                  {processingStep === index + 1 && (
                    <span className="text-white animate-pulse">...</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : results ? (
          <div className="space-y-6">
            {/* Analysis Results Header */}
            <div className="bg-[#0a1929] border border-[#1a2332] p-6">
              <h2 className="text-2xl font-semibold text-white mb-2 heading-font">
                Analysis Complete
              </h2>
              <p className="text-[#9ca3af]">Review the details below and submit your order</p>
            </div>

            {/* Price Estimate */}
            <div className="bg-[#0a1929] border border-[#1a2332] p-6">
              <h3 className="text-xl font-semibold text-white mb-4 heading-font">Estimated Price</h3>
              <div className="text-4xl font-bold text-white mb-2">
                ${results.priceEstimate.suggested_pay.toFixed(2)}
              </div>
              <p className="text-[#9ca3af] mb-4">
                Range: ${results.priceEstimate.range_low.toFixed(2)} - ${results.priceEstimate.range_high.toFixed(2)}
              </p>
              <div className="border-t border-[#253242] pt-4 mt-4">
                <h4 className="text-white font-medium mb-2">Price Breakdown</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-[#9ca3af]">
                    <span>Materials</span>
                    <span className="text-white">${results.priceEstimate.breakdown.materials.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[#9ca3af]">
                    <span>Labor</span>
                    <span className="text-white">${results.priceEstimate.breakdown.labor.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[#9ca3af]">
                    <span>Overhead</span>
                    <span className="text-white">${results.priceEstimate.breakdown.overhead.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[#9ca3af]">
                    <span>Margin</span>
                    <span className="text-white">${results.priceEstimate.breakdown.margin.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Analysis Details */}
            <div className="bg-[#0a1929] border border-[#1a2332] p-6">
              <h3 className="text-xl font-semibold text-white mb-4 heading-font">Analysis Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-[#9ca3af]">Material:</span>
                  <span className="text-white ml-2">{results.analysisDetails.material}</span>
                </div>
                <div>
                  <span className="text-[#9ca3af]">Quantity:</span>
                  <span className="text-white ml-2">{results.analysisDetails.quantity}</span>
                </div>
                <div>
                  <span className="text-[#9ca3af]">Tolerance:</span>
                  <span className="text-white ml-2">{results.analysisDetails.tolerance}</span>
                </div>
                <div>
                  <span className="text-[#9ca3af]">Manufacturing:</span>
                  <span className="text-white ml-2">{results.analysisDetails.manufacturingTypes.join(', ') || 'Not specified'}</span>
                </div>
                <div>
                  <span className="text-[#9ca3af]">Finish:</span>
                  <span className="text-white ml-2">{results.analysisDetails.finish}</span>
                </div>
                <div>
                  <span className="text-[#9ca3af]">Coatings:</span>
                  <span className="text-white ml-2">{results.analysisDetails.coatings.join(', ') || 'None'}</span>
                </div>
                <div>
                  <span className="text-[#9ca3af]">Estimated Time:</span>
                  <span className="text-white ml-2">{results.timeEstimate.total_hours.toFixed(1)} hours</span>
                </div>
              </div>
            </div>

            {/* Manufacturer Matches */}
            <div className="bg-[#0a1929] border border-[#1a2332] p-6">
              <h3 className="text-xl font-semibold text-white mb-4 heading-font">
                Manufacturer Matches ({results.manufacturerMatches.length})
              </h3>
              <p className="text-[#9ca3af] mb-4 text-sm">
                Your project has been sent to these manufacturers. They will review and respond.
              </p>
              <div className="space-y-4">
                {results.manufacturerMatches.map((mfg, index) => (
                  <div key={mfg.manufacturer_id} className="border border-[#253242] p-4 bg-[#1a2332]">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="text-white font-medium">{mfg.manufacturer_name}</h4>
                        <p className="text-[#9ca3af] text-sm">Rank Score: {(mfg.rank_score * 100).toFixed(1)}%</p>
                      </div>
                      <span className="text-green-400 text-sm">✓ Matched</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                      <div>
                        <span className="text-[#9ca3af]">Est. Completion:</span>
                        <span className="text-white ml-2">{mfg.estimated_completion_days} days</span>
                      </div>
                      <div>
                        <span className="text-[#9ca3af]">Capacity:</span>
                        <span className="text-white ml-2">{(mfg.capacity_score * 100).toFixed(0)}%</span>
                      </div>
                      <div>
                        <span className="text-[#9ca3af]">Quality:</span>
                        <span className="text-white ml-2">{(mfg.quality_score * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <Link
                href="/client/dashboard"
                className="flex-1 bg-[#1a2332] hover:bg-[#253242] text-white px-6 py-3 border border-[#253242] hover:border-[#3a4552] transition-colors text-center"
              >
                Cancel
              </Link>
              <button
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
                className="flex-1 bg-[#0a1929] hover:bg-[#253242] text-white px-6 py-3 border border-[#1a2332] hover:border-[#3a4552] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Order'}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

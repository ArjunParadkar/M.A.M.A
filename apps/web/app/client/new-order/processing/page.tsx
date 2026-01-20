'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { calculateFairPay } from '@/lib/pricingCalculator';
import { estimateCompletionTime } from '@/lib/completionTimeEstimator';
import { DEMO_MODE, DEMO_CLIENT_NAME, saveDemoJob, type DemoJob } from '@/lib/demoData';

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
    const quantity = data.quantity || 1;
    const material = data.exactMaterial || 'ABS'; // Default fallback
    
    // Estimate hours based on manufacturing type and complexity
    // TODO: Use actual STL analysis for more accurate time
    const baseHours = data.manufacturingType?.includes('CNC') ? 3.0 : 
                     data.manufacturingType?.includes('3D') ? 2.0 : 2.5;
    const setupHours = 1.0;

    // Calculate tolerance tier from toleranceThou
    let toleranceTier = 'medium';
    if (data.toleranceThou) {
      const tolerance = parseFloat(data.toleranceThou);
      if (tolerance <= 0.001) toleranceTier = 'high';
      else if (tolerance <= 0.005) toleranceTier = 'high';
      else if (tolerance <= 0.010) toleranceTier = 'medium';
      else toleranceTier = 'low';
    }

    // Calculate deadline days
    let deadlineDays = 14;
    if (data.deadline) {
      const deadline = new Date(data.deadline);
      const now = new Date();
      deadlineDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (deadlineDays < 1) deadlineDays = 1;
    }

    // Call F2 Pay Estimator API
    let priceEstimate;
    try {
      const response = await fetch('/api/ai/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          material,
          quantity,
          tolerance_tier: toleranceTier,
          complexity_score: 0.5, // TODO: Calculate from STL
          estimated_hours: baseHours * quantity,
          setup_hours: setupHours,
          deadline_days: deadlineDays,
          standard_delivery_days: 14,
          market_rate_per_hour: 45.0,
        }),
      });

      if (response.ok) {
        priceEstimate = await response.json();
      } else {
        // Fallback to frontend calculator if API fails
        console.warn('API call failed, using fallback calculator');
        priceEstimate = calculateFairPay({
          material,
          quantity,
          toleranceThou: data.toleranceThou,
          estimatedHours: baseHours * quantity,
          setupHours,
          deadline: data.deadline,
          manufacturingTypes: data.manufacturingType || [],
        });
      }
    } catch (error) {
      console.error('Error calling F2 API, using fallback:', error);
      // Fallback to frontend calculator
      priceEstimate = calculateFairPay({
        material,
        quantity,
        toleranceThou: data.toleranceThou,
        estimatedHours: baseHours * quantity,
        setupHours,
        deadline: data.deadline,
        manufacturingTypes: data.manufacturingType || [],
      });
    }

    // Calculate completion time estimate (based on manufacturer behavior model)
    // Example: This will use ML model once we have user data
    const timeEstimate = {
      estimated_hours: baseHours,
      total_hours: (baseHours * quantity) + setupHours,
      setup_time_hours: setupHours,
    };

    // Call F1 Maker Ranking API to get manufacturer matches
    let manufacturersWithCompletionTime = [];
    try {
      // In demo mode, always use the rich mock manufacturer pool
      // so Reva is guaranteed and we have many example users.
      if (DEMO_MODE) {
        manufacturersWithCompletionTime = await _getMockManufacturers(timeEstimate, data, quantity);
      } else {
        // Calculate tolerance tier from toleranceThou
        let toleranceTier = 'medium';
        if (data.toleranceThou) {
          const tolerance = parseFloat(data.toleranceThou);
          if (tolerance <= 0.001) toleranceTier = 'high';
          else if (tolerance <= 0.005) toleranceTier = 'high';
          else if (tolerance <= 0.010) toleranceTier = 'medium';
          else toleranceTier = 'low';
        }

        // Calculate deadline days
        let deadlineDays = 14;
        if (data.deadline) {
          const deadline = new Date(data.deadline);
          const now = new Date();
          deadlineDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (deadlineDays < 1) deadlineDays = 1;
        }

        const rankResponse = await fetch('/api/ai/rank', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            material: material,
            tolerance_tier: toleranceTier,
            quantity: quantity,
            deadline_days: deadlineDays,
            manufacturing_type: data.manufacturingType || [],
          }),
        });

        if (rankResponse.ok) {
          const rankedManufacturers = await rankResponse.json();
          
          manufacturersWithCompletionTime = rankedManufacturers.map((mfg: any) => ({
            manufacturer_id: mfg.manufacturer_id,
            manufacturer_name: `Manufacturer ${mfg.manufacturer_id.slice(-4)}`,
            rank_score: mfg.rank_score,
            explanations: mfg.explanations || {},
            estimated_completion_days: mfg.estimated_completion_days,
            capacity_score: mfg.capacity_score,
            quality_score: mfg.quality_score,
          }));
        } else {
          // Fallback to mock data if API fails
          console.warn('F1 ranking API failed, using fallback');
          manufacturersWithCompletionTime = await _getMockManufacturers(timeEstimate, data, quantity);
        }
      }
    } catch (error) {
      console.error('Error calling F1 ranking API, using fallback:', error);
      manufacturersWithCompletionTime = await _getMockManufacturers(timeEstimate, data, quantity);
    }

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

  const _getMockManufacturers = async (timeEstimate: any, data: any, quantity: number) => {
    // Large demo pool of manufacturers – Reva is always included and shown as top match
    const baseManufacturers = [
      {
        manufacturer_id: 'reva_demo_id',
        manufacturer_name: 'Reva',
        rank_score: 0.98,
        explanations: { equipment_match: 0.99, reputation: 0.97, capacity: 0.95 },
        capacity_score: 0.95,
        quality_score: 0.97,
      },
      {
        manufacturer_id: 'mfg_001',
        manufacturer_name: 'Precision Makers LLC',
        rank_score: 0.94,
        explanations: { equipment_match: 0.96, reputation: 0.92, capacity: 0.90 },
        capacity_score: 0.90,
        quality_score: 0.92,
      },
      {
        manufacturer_id: 'mfg_002',
        manufacturer_name: 'TechFab Manufacturing',
        rank_score: 0.91,
        explanations: { equipment_match: 0.93, reputation: 0.91, capacity: 0.88 },
        capacity_score: 0.88,
        quality_score: 0.91,
      },
      {
        manufacturer_id: 'mfg_003',
        manufacturer_name: 'Custom Parts Co',
        rank_score: 0.88,
        explanations: { equipment_match: 0.90, reputation: 0.86, capacity: 0.87 },
        capacity_score: 0.87,
        quality_score: 0.86,
      },
      {
        manufacturer_id: 'mfg_004',
        manufacturer_name: 'Ozark CNC Works',
        rank_score: 0.86,
        explanations: { equipment_match: 0.89, reputation: 0.84, capacity: 0.83 },
        capacity_score: 0.83,
        quality_score: 0.84,
      },
      {
        manufacturer_id: 'mfg_005',
        manufacturer_name: 'Northwest 3D Lab',
        rank_score: 0.85,
        explanations: { equipment_match: 0.88, reputation: 0.83, capacity: 0.82 },
        capacity_score: 0.82,
        quality_score: 0.83,
      },
      {
        manufacturer_id: 'mfg_006',
        manufacturer_name: 'Arkansas Fab Shop',
        rank_score: 0.84,
        explanations: { equipment_match: 0.87, reputation: 0.82, capacity: 0.81 },
        capacity_score: 0.81,
        quality_score: 0.82,
      },
      {
        manufacturer_id: 'mfg_007',
        manufacturer_name: 'Delta Precision Metals',
        rank_score: 0.83,
        explanations: { equipment_match: 0.86, reputation: 0.81, capacity: 0.80 },
        capacity_score: 0.80,
        quality_score: 0.81,
      },
      {
        manufacturer_id: 'mfg_008',
        manufacturer_name: 'Heartland Machining',
        rank_score: 0.82,
        explanations: { equipment_match: 0.85, reputation: 0.80, capacity: 0.79 },
        capacity_score: 0.79,
        quality_score: 0.80,
      },
      {
        manufacturer_id: 'mfg_009',
        manufacturer_name: 'Midwest Additive',
        rank_score: 0.81,
        explanations: { equipment_match: 0.84, reputation: 0.79, capacity: 0.78 },
        capacity_score: 0.78,
        quality_score: 0.79,
      },
      {
        manufacturer_id: 'mfg_010',
        manufacturer_name: 'Iron Ridge Fabrication',
        rank_score: 0.80,
        explanations: { equipment_match: 0.83, reputation: 0.78, capacity: 0.77 },
        capacity_score: 0.77,
        quality_score: 0.78,
      },
      {
        manufacturer_id: 'mfg_011',
        manufacturer_name: 'Atlas Parts & Tooling',
        rank_score: 0.79,
        explanations: { equipment_match: 0.82, reputation: 0.77, capacity: 0.76 },
        capacity_score: 0.76,
        quality_score: 0.77,
      },
      {
        manufacturer_id: 'mfg_012',
        manufacturer_name: 'Central Prototype Lab',
        rank_score: 0.78,
        explanations: { equipment_match: 0.81, reputation: 0.76, capacity: 0.75 },
        capacity_score: 0.75,
        quality_score: 0.76,
      },
      {
        manufacturer_id: 'mfg_013',
        manufacturer_name: 'Blue River Manufacturing',
        rank_score: 0.77,
        explanations: { equipment_match: 0.80, reputation: 0.75, capacity: 0.74 },
        capacity_score: 0.74,
        quality_score: 0.75,
      },
      {
        manufacturer_id: 'mfg_014',
        manufacturer_name: 'Frontier Machine & Tool',
        rank_score: 0.76,
        explanations: { equipment_match: 0.79, reputation: 0.74, capacity: 0.73 },
        capacity_score: 0.73,
        quality_score: 0.74,
      },
      {
        manufacturer_id: 'mfg_015',
        manufacturer_name: 'Summit Industrial Parts',
        rank_score: 0.75,
        explanations: { equipment_match: 0.78, reputation: 0.73, capacity: 0.72 },
        capacity_score: 0.72,
        quality_score: 0.73,
      },
    ];

    const mockManufacturers = DEMO_MODE ? baseManufacturers : baseManufacturers.filter(m => m.manufacturer_id !== 'reva_demo_id');

    const jobComplexity = data.toleranceThou ? 
      (parseFloat(data.toleranceThou) <= 0.005 ? 0.75 : 0.5) : 0.5;
    
    return mockManufacturers.map(mfg => {
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
  };

  const handleSubmitOrder = async () => {
    setIsSubmitting(true);
    try {
      // Create demo job if in demo mode
      if (DEMO_MODE && results && formData) {
        const jobId = `demo_job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Determine assigned manufacturers based on order type
        let assignedManufacturers = undefined;
        let selectedManufacturerId = undefined;
        
        if (orderType === 'open-request') {
          // For open requests, auto-distribute to multiple manufacturers including Reva
          const totalQuantity = formData.quantity || 1;
          const numManufacturers = Math.min(5, Math.max(3, Math.ceil(totalQuantity / 100)));
          const quantityPerManufacturer = Math.floor(totalQuantity / numManufacturers);
          const remaining = totalQuantity - (quantityPerManufacturer * numManufacturers);
          
          assignedManufacturers = results.manufacturerMatches.slice(0, numManufacturers).map((mfg, idx) => ({
            manufacturer_id: idx === 0 ? 'reva_demo_id' : `mfg_demo_${idx}`,
            manufacturer_name: idx === 0 ? 'Reva' : mfg.manufacturer_name,
            assigned_quantity: quantityPerManufacturer + (idx < remaining ? 1 : 0),
            status: 'pending' as const,
            estimated_delivery: new Date(formData.deadline || Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            pay_amount: (results.priceEstimate.suggested_pay / totalQuantity) * (quantityPerManufacturer + (idx < remaining ? 1 : 0)),
          }));
        } else if (orderType === 'quick-service') {
          // Auto-assign to Reva for quick service
          selectedManufacturerId = 'reva_demo_id';
        }
        // For closed-request and closed-commission, selectedManufacturerId will be set when Arham chooses Reva

        const demoJob: DemoJob = {
          id: jobId,
          client_id: 'arham_demo_id',
          client_name: DEMO_CLIENT_NAME,
          title: formData.productName || 'Predator Part',
          order_type: orderType as any,
          quantity: formData.quantity || 1,
          assigned_quantity: assignedManufacturers ? assignedManufacturers.reduce((sum, m) => sum + m.assigned_quantity, 0) : undefined,
          deadline: formData.deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: selectedManufacturerId || assignedManufacturers ? 'assigned' : 'pending',
          suggested_pay: results.priceEstimate.suggested_pay,
          material: formData.exactMaterial || results.analysisDetails.material,
          tolerance: formData.toleranceThou || results.analysisDetails.tolerance,
          manufacturing_type: formData.manufacturingType || results.analysisDetails.manufacturingTypes,
          stl_file_url: formData.stlFileUrl,
          selected_manufacturer_id: selectedManufacturerId,
          assigned_manufacturers: assignedManufacturers,
          created_at: new Date().toISOString(),
        };
        
        saveDemoJob(demoJob);
        
        sessionStorage.removeItem('orderFormData');
        router.push(`/client/dashboard?new_job=${jobId}`);
        return;
      }

      // Regular flow (non-demo)
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order: {
            ...formData,
            orderType,
          },
          ai: results,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('Failed to create job:', err);
        setIsSubmitting(false);
        return;
      }

      const { job_id } = await res.json();
      sessionStorage.removeItem('orderFormData');
      router.push('/client/dashboard?new_job=' + job_id);
    } catch (e) {
      console.error('Error submitting job:', e);
      setIsSubmitting(false);
    }
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
                {orderType === 'open-request' 
                  ? 'Parts will be distributed among these manufacturers. Each can accept the quantity they can handle.'
                  : 'These manufacturers are available for your project. Select one for closed requests.'}
              </p>
              
              {/* Distribution Preview for Open Requests */}
              {orderType === 'open-request' && (
                <div className="bg-blue-900/20 border border-blue-700/50 p-4 mb-4 rounded">
                  <h4 className="text-white font-medium mb-2">Proposed Distribution</h4>
                  <p className="text-blue-200 text-sm mb-3">
                    Estimated allocation based on capacity and availability:
                  </p>
                  <div className="space-y-2">
                    {(() => {
                      const totalQuantity = formData?.quantity || results.analysisDetails.quantity;
                      const numManufacturers = Math.min(5, Math.max(3, Math.ceil(totalQuantity / 100)));
                      const quantityPerManufacturer = Math.floor(totalQuantity / numManufacturers);
                      const remaining = totalQuantity - (quantityPerManufacturer * numManufacturers);
                      
                      return results.manufacturerMatches.slice(0, numManufacturers).map((mfg, idx) => {
                        const assignedQty = quantityPerManufacturer + (idx < remaining ? 1 : 0);
                        const hoursPerPart = results.timeEstimate.total_hours / totalQuantity;
                        const timeForAssignedQty = hoursPerPart * assignedQty;
                        
                        return (
                          <div key={mfg.manufacturer_id} className="flex justify-between items-center text-sm">
                            <span className="text-white">{mfg.manufacturer_name}:</span>
                            <span className="text-blue-200">
                              {assignedQty} parts ({hoursPerPart.toFixed(1)} hrs/part × {assignedQty} = {timeForAssignedQty.toFixed(1)} hrs)
                            </span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}
              
              <div className="space-y-4">
                {results.manufacturerMatches.map((mfg, index) => {
                  const totalQuantity = formData?.quantity || results.analysisDetails.quantity;
                  const hoursPerPart = results.timeEstimate.total_hours / totalQuantity;
                  const timePerPartMinutes = (hoursPerPart * 60).toFixed(0);
                  
                  return (
                    <div key={mfg.manufacturer_id} className="border border-[#253242] p-4 bg-[#1a2332]">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="text-white font-medium">{mfg.manufacturer_name}</h4>
                          <p className="text-[#9ca3af] text-sm">Rank Score: {(mfg.rank_score * 100).toFixed(1)}%</p>
                        </div>
                        <span className="text-green-400 text-sm">✓ Matched</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                        <div>
                          <span className="text-[#9ca3af]">Time per Part:</span>
                          <span className="text-white ml-2 block">{hoursPerPart.toFixed(2)} hrs ({timePerPartMinutes} min)</span>
                        </div>
                        <div>
                          <span className="text-[#9ca3af]">Est. Completion:</span>
                          <span className="text-white ml-2 block">{mfg.estimated_completion_days} days</span>
                        </div>
                        <div>
                          <span className="text-[#9ca3af]">Capacity:</span>
                          <span className="text-white ml-2 block">{(mfg.capacity_score * 100).toFixed(0)}%</span>
                        </div>
                        <div>
                          <span className="text-[#9ca3af]">Quality:</span>
                          <span className="text-white ml-2 block">{(mfg.quality_score * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
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

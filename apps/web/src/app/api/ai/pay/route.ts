import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Job, PayEstimate } from '@shared/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * AI endpoint for estimating fair pay for a job
 * F2: Fair Pay Estimation
 * 
 * This is a demo implementation. In production, this would:
 * - Analyze STL complexity (vertices, faces, volume)
 * - Consider material costs, machine time
 * - Factor in quantity discounts, urgency premiums
 * - Use historical pricing data
 * 
 * Current implementation: mock calculation based on job parameters
 */
export async function POST(request: NextRequest) {
  try {
    const { jobId, jobData } = await request.json();
    
    if (!jobId) {
      return NextResponse.json(
        { error: 'Missing jobId' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Fetch job if jobData not provided
    let job = jobData;
    if (!job) {
      const { data: fetchedJob, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (jobError || !fetchedJob) {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        );
      }
      job = fetchedJob;
    }

    // Mock AI pay estimation logic
    const baseTime = 2; // hours (would come from STL analysis)
    const baseMaterialCost = 5; // $/unit
    const complexityMultiplier = {
      low: 1.0,
      medium: 1.5,
      high: 2.5,
    }[job.tolerance_tier] || 1.5;

    // Time component (machine + post-processing)
    const timeCost = baseTime * complexityMultiplier * 25; // $25/hour rate

    // Material component
    const materialCost = baseMaterialCost * job.quantity;

    // Complexity component (based on tolerance and features)
    const complexityCost = 50 * complexityMultiplier;

    // Urgency component (based on deadline)
    const daysUntilDeadline = Math.max(1, Math.ceil(
      (new Date(job.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    ));
    const urgencyMultiplier = daysUntilDeadline <= 3 ? 1.5 : daysUntilDeadline <= 7 ? 1.2 : 1.0;
    const urgencyCost = (timeCost + materialCost) * (urgencyMultiplier - 1);

    // Total suggested pay
    const suggestedPay = timeCost + materialCost + complexityCost + urgencyCost;

    // Range (±20%)
    const rangeLow = suggestedPay * 0.8;
    const rangeHigh = suggestedPay * 1.2;

    const breakdown = {
      time: Math.round(timeCost * 100) / 100,
      material: Math.round(materialCost * 100) / 100,
      complexity: Math.round(complexityCost * 100) / 100,
      urgency: Math.round(urgencyCost * 100) / 100,
    };

    const estimate = {
      suggested_pay: Math.round(suggestedPay * 100) / 100,
      range_low: Math.round(rangeLow * 100) / 100,
      range_high: Math.round(rangeHigh * 100) / 100,
      breakdown,
    };

    // Save to database
    const { error: insertError } = await supabase
      .from('pay_estimates')
      .upsert({
        job_id: jobId,
        suggested_pay: estimate.suggested_pay,
        range_low: estimate.range_low,
        range_high: estimate.range_high,
        breakdown,
        model_version: 'demo-v1',
      }, {
        onConflict: 'job_id',
      });

    if (insertError) {
      console.error('Error saving pay estimate:', insertError);
    }

    return NextResponse.json(estimate);
  } catch (error) {
    console.error('Error estimating pay:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

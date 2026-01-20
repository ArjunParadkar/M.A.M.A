/**
 * F1: Maker Ranking API Route
 * Fetches manufacturers from database and ranks them using F1 model
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { estimateCompletionTime } from '@/lib/completionTimeEstimator';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get job specs (either from job_id or direct specs)
    let jobSpecs: any;
    
    if (body.job_id) {
      // Fetch job from database
      const supabase = await createClient();
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', body.job_id)
        .single();
      
      if (jobError || !job) {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        );
      }
      
      jobSpecs = {
        material: job.material || '',
        tolerance_tier: job.tolerance_tier || 'medium',
        quantity: job.quantity || 1,
        deadline_days: job.deadline ? 
          Math.ceil((new Date(job.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 14,
      };
    } else {
      // Use provided specs
      jobSpecs = {
        material: body.material || '',
        tolerance_tier: body.tolerance_tier || 'medium',
        quantity: body.quantity || 1,
        deadline_days: body.deadline_days || 14,
      };
    }
    
    // Fetch manufacturers from database
    const supabase = await createClient();
    const { data: manufacturers, error: mfgError } = await supabase
      .from('manufacturers')
      .select(`
        id,
        materials,
        tolerance_tier,
        capacity_score,
        quality_score,
        location_state,
        profiles!inner (
          id,
          name,
          average_rating,
          total_jobs_completed,
          total_ratings_received
        )
      `);
    
    if (mfgError) {
      console.error('Error fetching manufacturers:', mfgError);
      return NextResponse.json(
        { error: 'Failed to fetch manufacturers', details: mfgError.message },
        { status: 500 }
      );
    }
    
    if (!manufacturers || manufacturers.length === 0) {
      // Return empty or use mock data for demo
      return NextResponse.json([]);
    }
    
    // Calculate equipment match score for each manufacturer
    // TODO: More sophisticated equipment matching based on job requirements
    const manufacturersWithScores = manufacturers.map((mfg: any) => {
      // Simple equipment match (for now, assume all have compatible equipment)
      // In real implementation, check device types against job requirements
      const equipmentMatchScore = 0.85; // Placeholder - would calculate from device types
      
      // Check material compatibility
      const materialsAvailable = mfg.materials || [];
      const hasMaterial = !jobSpecs.material || materialsAvailable.includes(jobSpecs.material);
      
      if (!hasMaterial) {
        return null; // Filter out incompatible manufacturers
      }
      
      return {
        manufacturer_id: mfg.id,
        equipment_match_score: equipmentMatchScore,
        materials_available: materialsAvailable,
        tolerance_capability: mfg.tolerance_tier || 'medium',
        average_rating: mfg.profiles?.average_rating || 4.0,
        total_jobs_completed: mfg.profiles?.total_jobs_completed || 0,
        total_ratings_received: mfg.profiles?.total_ratings_received || 0,
        capacity_score: mfg.capacity_score || 0.5,
        quality_score: mfg.quality_score || 0.5,
        location_state: mfg.location_state || '',
        location_distance_miles: null, // TODO: Calculate distance if job location known
      };
    }).filter((mfg: any) => mfg !== null);
    
    if (manufacturersWithScores.length === 0) {
      return NextResponse.json([]);
    }
    
    // Call FastAPI F1 ranking endpoint
    const response = await fetch(`${FASTAPI_URL}/api/ai/rank/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        job_specs: jobSpecs,
        manufacturers: manufacturersWithScores,
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('FastAPI ranking error:', error);
      // Fallback to simple ranking
      return NextResponse.json(await _fallbackRanking(manufacturersWithScores, jobSpecs));
    }
    
    const rankedResults = await response.json();
    
    // Apply completion time estimator to each result
    const resultsWithCompletionTime = rankedResults.map((result: any) => {
      const completionEstimate = estimateCompletionTime({
        manufacturer_capacity_score: result.capacity_score,
        manufacturer_quality_score: result.quality_score,
        estimated_hours: (jobSpecs.quantity || 1) * 2.0, // TODO: Get from time calculator
        job_complexity: jobSpecs.tolerance_tier === 'high' ? 0.75 : 0.5,
        manufacturing_type: jobSpecs.manufacturing_type?.[0],
        quantity: jobSpecs.quantity || 1,
      });
      
      return {
        ...result,
        estimated_completion_days: completionEstimate.estimated_completion_days,
      };
    });
    
    return NextResponse.json(resultsWithCompletionTime);
    
  } catch (error: any) {
    console.error('Error in F1 ranking:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

async function _fallbackRanking(manufacturers: any[], jobSpecs: any) {
  // Simple ranking fallback
  return manufacturers
    .map((mfg) => ({
      manufacturer_id: mfg.manufacturer_id,
      rank_score: (mfg.equipment_match_score * 0.4) + (mfg.average_rating / 5.0 * 0.3) + (mfg.capacity_score * 0.3),
      explanations: {
        equipment_match: mfg.equipment_match_score,
        reputation: mfg.average_rating / 5.0,
        capacity: mfg.capacity_score,
      },
      estimated_completion_days: 10,
      capacity_score: mfg.capacity_score,
      quality_score: mfg.quality_score,
    }))
    .sort((a, b) => b.rank_score - a.rank_score)
    .slice(0, 10);
}


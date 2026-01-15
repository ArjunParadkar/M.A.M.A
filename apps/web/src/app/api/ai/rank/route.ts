import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Job, Manufacturer, JobRecommendation } from '@shared/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * AI endpoint for ranking manufacturers for a job
 * F1: Manufacturer Ranking
 * 
 * This is a demo implementation. In production, this would:
 * - Extract STL features (complexity, volume, surface area)
 * - Use ML model to match manufacturer capabilities
 * - Consider location, capacity, past performance
 * 
 * Current implementation: mock scoring based on equipment/material match
 */
export async function POST(request: NextRequest) {
  try {
    const { jobId, manufacturers: providedManufacturers } = await request.json();
    
    if (!jobId) {
      return NextResponse.json(
        { error: 'Missing jobId' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Fetch job details
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Fetch manufacturers if not provided
    let manufacturers = providedManufacturers;
    if (!manufacturers || !Array.isArray(manufacturers)) {
      const { data: mfrProfiles, error: mfrError } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          email,
          manufacturers (
            id,
            location_state,
            location_zip,
            equipment,
            materials,
            tolerance_tier,
            capacity_score
          )
        `)
        .eq('role', 'manufacturer');

      if (mfrError || !mfrProfiles) {
        return NextResponse.json(
          { error: 'Failed to fetch manufacturers' },
          { status: 500 }
        );
      }

      // Transform to match Manufacturer type
      manufacturers = mfrProfiles
        .filter((p: any) => p.manufacturers)
        .map((p: any) => ({
          id: p.id,
          ...p.manufacturers[0],
        }));
    }

    // Mock AI ranking logic
    const rankings = manufacturers.map((mfr: Manufacturer) => {
      let score = 0;
      const factors: string[] = [];

      // Equipment match
      if (mfr.equipment?.fdm && job.material.toLowerCase().includes('pla')) {
        score += 0.3;
        factors.push('Equipment matches material (FDM)');
      }
      if (mfr.equipment?.sla && job.material.toLowerCase().includes('resin')) {
        score += 0.3;
        factors.push('Equipment matches material (SLA)');
      }

      // Tolerance match
      if (mfr.tolerance_tier === job.tolerance_tier) {
        score += 0.25;
        factors.push(`Tolerance tier match (${job.tolerance_tier})`);
      } else if (
        (job.tolerance_tier === 'medium' && mfr.tolerance_tier === 'high') ||
        (job.tolerance_tier === 'low' && mfr.tolerance_tier === 'medium')
      ) {
        score += 0.15;
        factors.push('Tolerance capability exceeds requirement');
      }

      // Capacity score
      score += mfr.capacity_score * 0.2;
      if (mfr.capacity_score > 0.8) {
        factors.push('High capacity availability');
      }

      // Material availability
      if (mfr.materials?.includes(job.material)) {
        score += 0.25;
        factors.push('Material in stock');
      }

      // Normalize to 0-1
      score = Math.min(1, score);

      return {
        manufacturer_id: mfr.id,
        score: Math.round(score * 1000) / 1000,
        factors: factors.slice(0, 3), // Top 3 factors
      };
    });

    // Sort by score descending
    rankings.sort((a, b) => b.score - a.score);

    // Save recommendations to database
    const recommendations = rankings.map((r, index) => ({
      job_id: jobId,
      manufacturer_id: r.manufacturer_id,
      rank_score: r.score,
      explanations: { factors: r.factors },
      model_version: 'demo-v1',
    }));

    const { error: insertError } = await supabase
      .from('job_recommendations')
      .upsert(recommendations, {
        onConflict: 'job_id,manufacturer_id',
      });

    if (insertError) {
      console.error('Error saving recommendations:', insertError);
    }

    return NextResponse.json(rankings);
  } catch (error) {
    console.error('Error ranking manufacturers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

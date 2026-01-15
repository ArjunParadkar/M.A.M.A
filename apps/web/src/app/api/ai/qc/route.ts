import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { QCRecord } from '@shared/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * AI endpoint for quality control check
 * F3: Quality Control
 * 
 * This is a demo implementation. In production, this would:
 * - Use CLIP embeddings to compare STL model to photos
 * - Computer vision to detect defects, dimensional accuracy
 * - Compare against reference images
 * - Generate similarity score
 * 
 * Current implementation: mock scoring based on file presence
 */
export async function POST(request: NextRequest) {
  try {
    const { jobId, evidencePaths, stlPath } = await request.json();
    
    if (!jobId || !evidencePaths || !Array.isArray(evidencePaths)) {
      return NextResponse.json(
        { error: 'Missing jobId or evidencePaths array' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Fetch job details
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*, selected_manufacturer_id')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Mock AI QC logic
    // In production: analyze images, compare to STL, run computer vision
    
    // Simulate similarity score (higher with more evidence)
    const baseSimilarity = 0.75;
    const evidenceBonus = Math.min(0.2, evidencePaths.length * 0.05);
    const similarity = Math.min(0.99, baseSimilarity + evidenceBonus);

    // Simulate QC score (0-1)
    // Would come from actual image analysis
    const qcScore = Math.min(0.99, similarity + (Math.random() * 0.15 - 0.05));

    // Determine status
    let status: 'pass' | 'review' | 'fail';
    if (qcScore >= 0.85) {
      status = 'pass';
    } else if (qcScore >= 0.65) {
      status = 'review';
    } else {
      status = 'fail';
    }

    const qcResult = {
      score: Math.round(qcScore * 1000) / 1000,
      status,
      similarity: Math.round(similarity * 1000) / 1000,
      notes: evidencePaths.length > 0 
        ? `Analyzed ${evidencePaths.length} evidence file(s). ${status === 'pass' ? 'Quality standards met.' : status === 'review' ? 'Manual review recommended.' : 'Quality issues detected.'}`
        : 'No evidence files provided.',
    };

    // Save to database
    const { error: insertError } = await supabase
      .from('qc_records')
      .insert({
        job_id: jobId,
        manufacturer_id: job.selected_manufacturer_id,
        qc_score: qcResult.score,
        status: qcResult.status,
        similarity: qcResult.similarity,
        evidence_paths: evidencePaths,
        model_version: 'demo-v1',
      });

    if (insertError) {
      console.error('Error saving QC record:', insertError);
      // Don't fail the request, just log
    }

    // Update job status
    await supabase
      .from('jobs')
      .update({ status: 'qc_done' })
      .eq('id', jobId);

    return NextResponse.json(qcResult);
  } catch (error) {
    console.error('Error running QC check:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

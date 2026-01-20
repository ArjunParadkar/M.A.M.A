/**
 * F3: Vision Quality Check API Route
 * Compares manufactured part photos to STL design
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { uploadQCPhotos } from '@/lib/supabase/storage';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { job_id, photo_urls, tolerance_tier, tolerance_thou, material } = body;
    
    if (!job_id || !photo_urls || photo_urls.length === 0) {
      return NextResponse.json(
        { error: 'job_id and photo_urls are required' },
        { status: 400 }
      );
    }
    
    // Fetch job details from database
    const supabase = await createClient();
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', job_id)
      .single();
    
    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }
    
    // Get STL file URL from job
    const stlFileUrl = job.stl_url || job.stl_file_url || job.stl_path || null;
    
    // Call FastAPI F3 Quality Check endpoint
    const response = await fetch(`${FASTAPI_URL}/api/ai/qc/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        job_id: job_id,
        stl_file_url: stlFileUrl,
        evidence_photo_urls: photo_urls,
        tolerance_tier: tolerance_tier || job.tolerance_tier || 'medium',
        tolerance_thou: tolerance_thou || job.tolerance_thou,
        material: material || job.material,
        critical_dimensions: job.critical_dimensions || null,
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('FastAPI QC error:', error);
      return NextResponse.json(
        { error: 'Quality check failed', details: error },
        { status: response.status }
      );
    }
    
    const qcResults = await response.json();
    
    // Save QC results to database
    const { error: qcError } = await supabase
      .from('qc_records')
      .insert({
        job_id: job_id,
        manufacturer_id: job.manufacturer_id || null,
        qc_score: qcResults.qc_score,
        qc_status: qcResults.status,
        similarity_score: qcResults.similarity,
        anomaly_score: qcResults.anomaly_score,
        photo_urls: photo_urls,
        notes: qcResults.notes || [],
        submitted_at: new Date().toISOString(),
      });
    
    if (qcError) {
      console.error('Error saving QC record:', qcError);
      // Continue anyway - QC results are still returned
    }
    
    // Update active_jobs status if QC passed
    if (qcResults.status === 'pass') {
      await supabase
        .from('active_jobs')
        .update({ status: 'qc_approved' })
        .eq('job_id', job_id);
    } else if (qcResults.status === 'fail') {
      await supabase
        .from('active_jobs')
        .update({ status: 'qc_failed' })
        .eq('job_id', job_id);
    } else {
      await supabase
        .from('active_jobs')
        .update({ status: 'qc_pending' })
        .eq('job_id', job_id);
    }
    
    return NextResponse.json(qcResults);
    
  } catch (error: any) {
    console.error('Error in F3 quality check:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}


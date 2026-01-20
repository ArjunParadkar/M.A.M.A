import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const supabase = await createClient();
    const payload = await request.json();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { qc_score, status, similarity, evidence_paths, model_version } = payload || {};
    if (qc_score == null || !status || similarity == null) {
      return NextResponse.json({ error: 'qc_score, status, similarity are required' }, { status: 400 });
    }

    // Ensure maker is assigned to job
    const { data: job, error: jobErr } = await supabase
      .from('jobs')
      .select('id, selected_manufacturer_id')
      .eq('id', params.jobId)
      .single();

    if (jobErr || !job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    if (job.selected_manufacturer_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error: insErr } = await supabase.from('qc_records').insert({
      job_id: params.jobId,
      manufacturer_id: user.id,
      qc_score: Number(qc_score),
      status,
      similarity: Number(similarity),
      evidence_paths: evidence_paths || [],
      model_version: model_version || 'demo',
    });

    if (insErr) {
      return NextResponse.json({ error: 'Failed to store QC record', details: insErr.message }, { status: 500 });
    }

    // Move job forward
    await supabase.from('jobs').update({ status: 'qc_done' }).eq('id', params.jobId);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}




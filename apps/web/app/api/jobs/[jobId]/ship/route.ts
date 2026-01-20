import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const supabase = await createClient();
    const { carrier, tracking_number } = await request.json();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!carrier || !tracking_number) {
      return NextResponse.json({ error: 'carrier and tracking_number are required' }, { status: 400 });
    }

    const { data: job, error: jobErr } = await supabase
      .from('jobs')
      .select('id, client_id, selected_manufacturer_id')
      .eq('id', params.jobId)
      .single();
    if (jobErr || !job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    if (job.selected_manufacturer_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { error: shipErr } = await supabase.from('shipping_records').upsert({
      job_id: params.jobId,
      manufacturer_id: user.id,
      carrier,
      tracking_number,
      shipped_at: new Date().toISOString(),
    });
    if (shipErr) return NextResponse.json({ error: 'Failed to store shipping record', details: shipErr.message }, { status: 500 });

    await supabase.from('jobs').update({ status: 'accepted' }).eq('id', params.jobId);

    // Update ledger status from pending -> authorized (demo flow)
    await supabase
      .from('financial_transactions')
      .update({ status: 'authorized' })
      .eq('job_id', params.jobId)
      .eq('manufacturer_id', user.id);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}




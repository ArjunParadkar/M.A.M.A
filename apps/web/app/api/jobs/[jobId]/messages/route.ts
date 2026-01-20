import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('job_messages')
      .select('*')
      .eq('job_id', params.jobId)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch messages', details: error.message }, { status: 500 });
    }
    return NextResponse.json({ messages: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const supabase = await createClient();
    const requestBody = await request.json();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    // Handle both { body: "..." } and just "..." formats
    const body = typeof requestBody === 'string' ? requestBody : requestBody?.body;
    if (!body || typeof body !== 'string') {
      return NextResponse.json({ error: 'body is required and must be a string' }, { status: 400 });
    }

    // determine recipient from job row
    const { data: job, error: jobErr } = await supabase
      .from('jobs')
      .select('client_id, selected_manufacturer_id')
      .eq('id', params.jobId)
      .single();

    if (jobErr || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const recipientId =
      user.id === job.client_id ? job.selected_manufacturer_id : job.client_id;

    if (!recipientId) {
      return NextResponse.json({ error: 'Job is not linked to a manufacturer yet' }, { status: 400 });
    }

    const { data: msg, error: insErr } = await supabase
      .from('job_messages')
      .insert({
        job_id: params.jobId,
        sender_id: user.id,
        recipient_id: recipientId,
        body,
      })
      .select('*')
      .single();

    if (insErr || !msg) {
      return NextResponse.json({ error: 'Failed to send message', details: insErr?.message }, { status: 500 });
    }

    return NextResponse.json({ message: msg });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}



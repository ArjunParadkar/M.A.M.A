import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/jobs/[jobId]/assignments
 * Get all manufacturer assignments for a job (for client workflow view)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user owns the job (client) or is assigned (manufacturer)
    const { data: job, error: jobErr } = await supabase
      .from('jobs')
      .select('id, client_id, order_type')
      .eq('id', params.jobId)
      .single();

    if (jobErr || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.client_id !== user.id && job.selected_manufacturer_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch assignments with manufacturer profile info
    const { data: assignments, error: assignErr } = await supabase
      .from('job_assignments')
      .select(`
        *,
        manufacturer:profiles!job_assignments_manufacturer_id_fkey (
          id,
          name,
          company_name
        )
      `)
      .eq('job_id', params.jobId)
      .order('created_at', { ascending: true });

    if (assignErr) {
      return NextResponse.json(
        { error: 'Failed to fetch assignments', details: assignErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json(assignments || []);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/jobs/[jobId]/assignments
 * Manufacturer accepts a portion of an open request job
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { assigned_quantity, estimated_delivery_date, pay_amount_cents } = body;

    if (!assigned_quantity || !estimated_delivery_date || !pay_amount_cents) {
      return NextResponse.json(
        { error: 'Missing required fields: assigned_quantity, estimated_delivery_date, pay_amount_cents' },
        { status: 400 }
      );
    }

    // Verify job is an open request
    const { data: job, error: jobErr } = await supabase
      .from('jobs')
      .select('id, order_type, quantity, status')
      .eq('id', params.jobId)
      .single();

    if (jobErr || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.order_type !== 'open-request') {
      return NextResponse.json(
        { error: 'This job is not an open request' },
        { status: 400 }
      );
    }

    // Check total assigned doesn't exceed job quantity
    const { data: existingAssignments } = await supabase
      .from('job_assignments')
      .select('assigned_quantity')
      .eq('job_id', params.jobId);

    const totalAssigned = (existingAssignments || []).reduce(
      (sum, a) => sum + (a.assigned_quantity || 0),
      0
    );

    if (totalAssigned + assigned_quantity > job.quantity) {
      return NextResponse.json(
        { error: `Cannot assign ${assigned_quantity} units. Only ${job.quantity - totalAssigned} units remaining.` },
        { status: 400 }
      );
    }

    // Create assignment
    const { data: assignment, error: assignErr } = await supabase
      .from('job_assignments')
      .insert({
        job_id: params.jobId,
        manufacturer_id: user.id,
        assigned_quantity: Number(assigned_quantity),
        estimated_delivery_date: new Date(estimated_delivery_date).toISOString(),
        pay_amount_cents: Number(pay_amount_cents),
        status: 'accepted',
      })
      .select('*')
      .single();

    if (assignErr || !assignment) {
      return NextResponse.json(
        { error: 'Failed to create assignment', details: assignErr?.message },
        { status: 500 }
      );
    }

    return NextResponse.json(assignment);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}



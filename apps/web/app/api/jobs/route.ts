import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/jobs
 * Creates a job from the client order submission and links it to a manufacturer (top match).
 * Also stores pay estimate + recommendations + creates a pending financial transaction (demo ledger).
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      order,
      ai,
    }: {
      order: any;
      ai: any;
    } = await request.json();

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Choose top manufacturer match if present
    const matches: any[] = ai?.manufacturerMatches || [];
    const top = matches.length > 0 ? matches[0] : null;

    const title = order?.title || order?.productName || 'New Manufacturing Job';
    const deadline = order?.deadline ? new Date(order.deadline).toISOString() : new Date(Date.now() + 14 * 86400000).toISOString();

    // Convert tolerance to tier (matches existing enum)
    const toleranceThou = order?.toleranceThou ? Number(order.toleranceThou) : null;
    let toleranceTier: 'low' | 'medium' | 'high' = 'medium';
    if (typeof toleranceThou === 'number' && !Number.isNaN(toleranceThou)) {
      if (toleranceThou <= 0.005) toleranceTier = 'high';
      else if (toleranceThou <= 0.01) toleranceTier = 'medium';
      else toleranceTier = 'low';
    }

    const jobInsert: any = {
      client_id: user.id,
      title,
      description: order?.description || '',
      material: order?.exactMaterial || order?.material || 'ABS',
      quantity: Number(order?.quantity || 1),
      tolerance_tier: toleranceTier,
      deadline,
      status: 'assigned',
      selected_manufacturer_id: top?.manufacturer_id || null,
      stl_path: order?.stlPath || null,
      stl_url: order?.stlUrl || null,
      order_type: order?.orderType || null,
      tolerance_thou: toleranceThou,
      manufacturing_types: order?.manufacturingType || [],
      finish_details: order?.finishDetails || null,
      coatings: order?.coatings || [],
      screw_dimensions: order?.screwDimensions || null,
      paint_color: order?.paintColor || null,
      assigned_quantity: Number(order?.quantity || 1),
    };

    const { data: job, error: jobErr } = await supabase
      .from('jobs')
      .insert(jobInsert)
      .select('*')
      .single();

    if (jobErr || !job) {
      return NextResponse.json({ error: 'Failed to create job', details: jobErr?.message }, { status: 500 });
    }

    // Pay estimate
    const pe = ai?.priceEstimate;
    if (pe?.suggested_pay != null) {
      await supabase.from('pay_estimates').upsert({
        job_id: job.id,
        suggested_pay: Number(pe.suggested_pay),
        range_low: Number(pe.range_low ?? pe.suggested_pay * 0.85),
        range_high: Number(pe.range_high ?? pe.suggested_pay * 1.15),
        breakdown: pe.breakdown || {},
        model_version: pe.model_version || 'demo',
      });
    }

    // Recommendations (top N)
    if (matches.length > 0) {
      const recRows = matches.slice(0, 10).map((m) => ({
        job_id: job.id,
        manufacturer_id: m.manufacturer_id,
        rank_score: Number(m.rank_score ?? 0),
        explanations: m.explanations || {},
        model_version: 'demo',
      }));
      await supabase.from('job_recommendations').upsert(recRows);
    }

    // For open requests with large quantities, auto-distribute among manufacturers
    if (job.order_type === 'open-request' && job.quantity >= 100) {
      // Auto-distribute to multiple manufacturers
      try {
        const distributeResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/jobs/auto-distribute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ job_id: job.id }),
        });

        if (distributeResponse.ok) {
          const distributeData = await distributeResponse.json();
          console.log(`Auto-distributed ${distributeData.total_assigned} units to ${distributeData.assignments?.length || 0} manufacturers`);
        }
      } catch (err) {
        // If auto-distribute fails, continue - client can manually distribute later
        console.warn('Auto-distribution failed, client can distribute manually:', err);
      }
    }

    // Demo financial ledger entry (pending) - only for single manufacturer jobs
    if (top?.manufacturer_id && pe?.suggested_pay != null && job.order_type !== 'open-request') {
      const amountCents = Math.max(0, Math.round(Number(pe.suggested_pay) * 100));
      await supabase.from('financial_transactions').insert({
        job_id: job.id,
        client_id: user.id,
        manufacturer_id: top.manufacturer_id,
        amount_cents: amountCents,
        currency: 'USD',
        status: 'pending',
        kind: 'job_payment',
        description: `Pending payment for job ${job.id}`,
      });
    }

    return NextResponse.json({
      job_id: job.id,
      selected_manufacturer_id: job.selected_manufacturer_id,
      auto_distributed: job.order_type === 'open-request' && job.quantity >= 100,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}



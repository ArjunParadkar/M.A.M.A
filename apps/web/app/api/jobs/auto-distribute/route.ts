/**
 * POST /api/jobs/auto-distribute
 * Automatically distributes a large open request job among multiple manufacturers
 * based on their capacity and quality scores
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { job_id } = await request.json();

    if (!job_id) {
      return NextResponse.json({ error: 'job_id required' }, { status: 400 });
    }

    // Fetch job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', job_id)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Only auto-distribute open requests
    if (job.order_type !== 'open-request') {
      return NextResponse.json({ error: 'Job is not an open request' }, { status: 400 });
    }

    // Check if already fully assigned
    const { data: existingAssignments } = await supabase
      .from('job_assignments')
      .select('assigned_quantity')
      .eq('job_id', job_id);

    const totalAssigned = existingAssignments?.reduce(
      (sum, a) => sum + (a.assigned_quantity || 0),
      0
    ) || 0;

    const remaining = job.quantity - totalAssigned;

    if (remaining <= 0) {
      return NextResponse.json({ message: 'Job already fully assigned', assignments: existingAssignments });
    }

    // Get top-ranked manufacturers for this job
    const { data: recommendations } = await supabase
      .from('job_recommendations')
      .select('manufacturer_id, rank_score')
      .eq('job_id', job_id)
      .order('rank_score', { ascending: false })
      .limit(20); // Get top 20 matches

    if (!recommendations || recommendations.length === 0) {
      return NextResponse.json({ error: 'No manufacturer recommendations found. Run F1 ranking first.' }, { status: 400 });
    }

    // Get manufacturer details (capacity, quality, etc.)
    const manufacturerIds = recommendations.map((r) => r.manufacturer_id);
    const { data: manufacturers } = await supabase
      .from('manufacturers')
      .select('id, capacity_score, quality_score, location_state')
      .in('id', manufacturerIds);

    if (!manufacturers || manufacturers.length === 0) {
      return NextResponse.json({ error: 'No manufacturers found' }, { status: 404 });
    }

    // Calculate capacity-weighted distribution
    // Each manufacturer gets units based on: (rank_score * capacity_score * quality_score) / total
    const scores = recommendations.map((rec) => {
      const mfg = manufacturers.find((m) => m.id === rec.manufacturer_id);
      const capacity = mfg?.capacity_score || 0.5;
      const quality = mfg?.quality_score || 0.5;
      const combinedScore = rec.rank_score * capacity * quality;
      return {
        manufacturer_id: rec.manufacturer_id,
        score: combinedScore,
        capacity_score: capacity,
        quality_score: quality,
      };
    });

    const totalScore = scores.reduce((sum, s) => sum + s.score, 0);

    // Distribute remaining units proportionally
    // Minimum 10 units per manufacturer (if possible), maximum based on capacity
    const minUnitsPerMfg = Math.min(10, Math.floor(remaining / scores.length));
    const assignments: Array<{
      manufacturer_id: string;
      assigned_quantity: number;
      estimated_delivery_date: string;
      pay_amount_cents: number;
    }> = [];

    // Get pay estimate for per-unit price
    const { data: payEstimate } = await supabase
      .from('pay_estimates')
      .select('suggested_pay')
      .eq('job_id', job_id)
      .single();

    const perUnitPrice = payEstimate?.suggested_pay 
      ? (payEstimate.suggested_pay / job.quantity)
      : (job.quantity > 0 ? 50.0 : 50.0); // Fallback $50 per unit

    // Calculate deadline date
    const deadlineDate = new Date(job.deadline);
    const estimatedDeliveryDate = new Date(deadlineDate);
    estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() - 1); // Deliver 1 day before deadline

    let remainingToDistribute = remaining;

    // First pass: distribute proportionally
    for (const scoreData of scores) {
      if (remainingToDistribute <= 0) break;

      const proportion = scoreData.score / totalScore;
      let assigned = Math.max(
        minUnitsPerMfg,
        Math.floor(remaining * proportion)
      );

      // Cap based on capacity (capacity score * 500 units max per manufacturer)
      const maxCapacity = Math.floor(scoreData.capacity_score * 500);
      assigned = Math.min(assigned, maxCapacity, remainingToDistribute);

      if (assigned > 0 && remainingToDistribute >= assigned) {
        assignments.push({
          manufacturer_id: scoreData.manufacturer_id,
          assigned_quantity: assigned,
          estimated_delivery_date: estimatedDeliveryDate.toISOString(),
          pay_amount_cents: Math.round(assigned * perUnitPrice * 100),
        });
        remainingToDistribute -= assigned;
      }
    }

    // Second pass: distribute any remaining units to top manufacturers
    if (remainingToDistribute > 0) {
      const sortedAssignments = assignments.sort((a, b) => {
        const aScore = scores.find((s) => s.manufacturer_id === a.manufacturer_id)?.score || 0;
        const bScore = scores.find((s) => s.manufacturer_id === b.manufacturer_id)?.score || 0;
        return bScore - aScore;
      });

      for (const assignment of sortedAssignments) {
        if (remainingToDistribute <= 0) break;
        const addUnits = Math.min(10, remainingToDistribute);
        assignment.assigned_quantity += addUnits;
        assignment.pay_amount_cents += Math.round(addUnits * perUnitPrice * 100);
        remainingToDistribute -= addUnits;
      }
    }

    // Create assignments in database
    const { data: createdAssignments, error: insertError } = await supabase
      .from('job_assignments')
      .insert(assignments)
      .select('*');

    if (insertError) {
      return NextResponse.json({ error: 'Failed to create assignments', details: insertError.message }, { status: 500 });
    }

    // Update job status to 'assigned' if it was 'posted'
    if (job.status === 'posted') {
      await supabase
        .from('jobs')
        .update({ status: 'assigned' })
        .eq('id', job_id);
    }

    return NextResponse.json({
      message: `Distributed ${remaining - remainingToDistribute} units among ${assignments.length} manufacturers`,
      assignments: createdAssignments,
      total_assigned: remaining - remainingToDistribute,
      remaining: remainingToDistribute,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}



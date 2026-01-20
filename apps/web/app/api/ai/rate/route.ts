/**
 * Manufacturer Rating Aggregator API Route
 * Aggregates and calculates manufacturer ratings
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const manufacturerId = searchParams.get('manufacturer_id');
    
    if (!manufacturerId) {
      return NextResponse.json(
        { error: 'manufacturer_id is required' },
        { status: 400 }
      );
    }
    
    // Fetch ratings from database
    const supabase = await createClient();
    const { data: ratings, error: ratingsError } = await supabase
      .from('ratings')
      .select('*')
      .eq('manufacturer_id', manufacturerId)
      .order('created_at', { ascending: false });
    
    if (ratingsError) {
      console.error('Error fetching ratings:', ratingsError);
      return NextResponse.json(
        { error: 'Failed to fetch ratings', details: ratingsError.message },
        { status: 500 }
      );
    }
    
    // Fetch manufacturer stats
    const { data: manufacturer, error: mfgError } = await supabase
      .from('manufacturers')
      .select('total_jobs_completed, total_ratings_received')
      .eq('id', manufacturerId)
      .single();
    
    if (mfgError) {
      console.error('Error fetching manufacturer:', mfgError);
      // Continue with defaults
    }
    
    // Convert ratings to API format
    const ratingsData = (ratings || []).map((r: any) => ({
      rating: r.rating || 0,
      comment: r.comment || null,
      job_id: r.job_id || '',
      rated_at: r.created_at || new Date().toISOString(),
    }));
    
    // Call FastAPI Rating Aggregator endpoint
    const response = await fetch(`${FASTAPI_URL}/api/ai/rate/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        manufacturer_id: manufacturerId,
        ratings: ratingsData,
        total_jobs_completed: manufacturer?.total_jobs_completed || 0,
        total_ratings_received: manufacturer?.total_ratings_received || ratingsData.length,
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('FastAPI rating error:', error);
      return NextResponse.json(
        { error: 'Rating aggregation failed', details: error },
        { status: response.status }
      );
    }
    
    const ratingResults = await response.json();
    
    // Update manufacturer's average_rating in database
    await supabase
      .from('manufacturers')
      .update({
        average_rating: ratingResults.average_rating,
        total_ratings_received: ratingResults.total_ratings,
      })
      .eq('id', manufacturerId);
    
    return NextResponse.json(ratingResults);
    
  } catch (error: any) {
    console.error('Error in rating aggregation:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}


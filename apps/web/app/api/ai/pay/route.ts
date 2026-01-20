/**
 * F2: Fair Pay Estimator API Route
 * Calls FastAPI server to get accurate pricing
 */

import { NextRequest, NextResponse } from 'next/server';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.material || !body.quantity || !body.estimated_hours) {
      return NextResponse.json(
        { error: 'Missing required fields: material, quantity, estimated_hours' },
        { status: 400 }
      );
    }

    // Call FastAPI endpoint
    const response = await fetch(`${FASTAPI_URL}/api/ai/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        material: body.material,
        quantity: body.quantity,
        tolerance_tier: body.tolerance_tier || 'medium',
        complexity_score: body.complexity_score || 0.5,
        estimated_hours: body.estimated_hours,
        setup_hours: body.setup_hours || 1.0,
        deadline_days: body.deadline_days || 14,
        standard_delivery_days: body.standard_delivery_days || 14,
        market_rate_per_hour: body.market_rate_per_hour || 45.0,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('FastAPI error:', error);
      
      // Fallback to heuristic calculation
      console.warn('FastAPI unavailable, using fallback calculation');
      return NextResponse.json(await _fallbackPayEstimate(body));
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error: any) {
    console.error('Error calling F2 Pay Estimator:', error);
    // Fallback on any error
    return NextResponse.json(await _fallbackPayEstimate(body));
  }
}

async function _fallbackPayEstimate(body: any) {
  // Simple heuristic fallback
  const materialCostPerUnit: Record<string, number> = {
    '6061-T6 Aluminum': 0.10,
    '7075 Aluminum': 0.12,
    '304 Stainless Steel': 0.18,
    'PLA': 0.02,
    'ABS': 0.025,
  };
  
  const materialCost = (materialCostPerUnit[body.material] || 0.05) * (body.quantity || 1);
  const laborCost = (body.estimated_hours || 10) * 35.0;
  const overhead = laborCost * 0.15;
  const margin = (materialCost + laborCost + overhead) * 0.20;
  const suggestedPay = (materialCost + laborCost + overhead + margin) * 1.1;
  
  return {
    suggested_pay: Math.round(suggestedPay * 100) / 100,
    range_low: Math.round(suggestedPay * 0.85 * 100) / 100,
    range_high: Math.round(suggestedPay * 1.15 * 100) / 100,
    breakdown: {
      materials: Math.round(materialCost * 100) / 100,
      labor: Math.round(laborCost * 100) / 100,
      overhead: Math.round(overhead * 100) / 100,
      margin: Math.round(margin * 100) / 100,
    },
    fallback: true,
  };
}


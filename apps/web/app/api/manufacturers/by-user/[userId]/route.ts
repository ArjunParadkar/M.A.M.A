import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = await createClient();
    
    // Get manufacturer by user_id
    const { data: manufacturer, error: mfgError } = await supabase
      .from('manufacturers')
      .select('*')
      .eq('user_id', params.userId)
      .single();
    
    if (mfgError || !manufacturer) {
      return NextResponse.json(
        { error: 'Manufacturer not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(manufacturer);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}


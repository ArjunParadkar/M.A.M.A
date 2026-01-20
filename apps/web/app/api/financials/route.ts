import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: tx, error } = await supabase
      .from('financial_transactions')
      .select('*')
      .or(`client_id.eq.${user.id},manufacturer_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch financials', details: error.message }, { status: 500 });
    }
    return NextResponse.json({ transactions: tx || [] });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}




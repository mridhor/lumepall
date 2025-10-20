import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Default fallback values
const DEFAULT_PRICE = 18.49;
const DEFAULT_SP500_PRICE = 3.30;

function getDateRange(period?: string) {
  const now = new Date();
  const start = new Date(now);
  switch (period) {
    case '1d':
      start.setDate(now.getDate() - 1);
      break;
    case '5d':
      start.setDate(now.getDate() - 5);
      break;
    case '7d':
      start.setDate(now.getDate() - 7);
      break;
    case '14d':
      start.setDate(now.getDate() - 14);
      break;
    case '1y':
      start.setFullYear(now.getFullYear() - 1);
      break;
    case '2y':
      start.setFullYear(now.getFullYear() - 2);
      break;
    case '5y':
      start.setFullYear(now.getFullYear() - 5);
      break;
    default:
      return undefined;
  }
  return { from: start.toISOString(), to: now.toISOString() };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || undefined;
    const range = getDateRange(period || undefined);

    // Fetch current prices from Supabase
    const { data, error } = await supabase
      .from('snobol_current_price')
      .select('*')
      .order('id', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      console.log('No price data found, returning defaults');
      return NextResponse.json({
        success: true,
        currentPrice: DEFAULT_PRICE,
        currentSP500Price: DEFAULT_SP500_PRICE
      });
    }

    // Optional: fetch equity and exact value from a historical table if present
    let equity: number | null = null;
    try {
      const { data: equityRow } = await supabase
        .from('snobol_equity')
        .select('total_equity')
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (equityRow?.total_equity != null) equity = Number(equityRow.total_equity);
    } catch {}

    // Optional historical series for selected period if a table exists
    let history: Array<{ date: string; snobol: number; sp500: number }> = [];
    if (range) {
      try {
        const { data: hist } = await supabase
          .from('snobol_history')
          .select('date,snobol,sp500')
          .gte('date', range.from)
          .lte('date', range.to)
          .order('date', { ascending: true });
        if (Array.isArray(hist)) history = hist as any;
      } catch {}
    }

    return NextResponse.json({
      success: true,
      currentPrice: data.current_price || DEFAULT_PRICE,
      currentSP500Price: data.current_sp500_price || DEFAULT_SP500_PRICE,
      exactValue: data.current_price || DEFAULT_PRICE,
      totalEquity: equity,
      history
    });
  } catch (error) {
    console.error('Error fetching price data:', error);
    return NextResponse.json({
      success: true,
      currentPrice: DEFAULT_PRICE,
      currentSP500Price: DEFAULT_SP500_PRICE
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { currentPrice: newPrice, currentSP500Price: newSP500Price } = await request.json();
    
    // Validate the price values and set minimum to 0.01
    const validatedPrice = typeof newPrice === 'number' && newPrice >= 0 
      ? (newPrice === 0 ? 0.01 : newPrice) 
      : DEFAULT_PRICE;
    
    const validatedSP500Price = typeof newSP500Price === 'number' && newSP500Price >= 0 
      ? (newSP500Price === 0 ? 0.01 : newSP500Price) 
      : DEFAULT_SP500_PRICE;

    // Check if a record exists
    const { data: existingData, error: fetchError } = await supabase
      .from('snobol_current_price')
      .select('id')
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();

    let result;
    if (existingData && !fetchError) {
      // Update existing record
      result = await supabase
        .from('snobol_current_price')
        .update({
          current_price: validatedPrice,
          current_sp500_price: validatedSP500Price,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingData.id)
        .select();
    } else {
      // Insert new record
      result = await supabase
        .from('snobol_current_price')
        .insert({
          current_price: validatedPrice,
          current_sp500_price: validatedSP500Price,
          updated_at: new Date().toISOString()
        })
        .select();
    }

    if (result.error) {
      console.error('Supabase error:', result.error);
      return NextResponse.json(
        { error: 'Failed to update price in database' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      currentPrice: validatedPrice,
      currentSP500Price: validatedSP500Price,
      message: 'Price updated successfully'
    });
  } catch (error) {
    console.error('Error updating price:', error);
    return NextResponse.json(
      { error: 'Failed to update price' },
      { status: 500 }
    );
  }
}

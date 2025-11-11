import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';

let cachedSupabase: SupabaseClient | null | undefined;

async function getSupabaseClient(): Promise<SupabaseClient | null> {
  if (cachedSupabase !== undefined) {
    return cachedSupabase;
  }

  try {
    const { supabase } = await import('@/lib/supabase');
    cachedSupabase = supabase;
  } catch (_error) {
    console.warn('Supabase not configured, using fallback data');
    cachedSupabase = null;
  }

  return cachedSupabase ?? null;
}

// Fallback: Simple in-memory storage for development
const fallbackPriceData: { currentPrice: number | null; currentSP500Price: number } = {
  currentPrice: 1.7957,
  currentSP500Price: 3.30
};

// Default fallback values
const DEFAULT_PRICE = 1.7957;
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

    // If Supabase is not configured, return fallback data
    const supabase = await getSupabaseClient();
    if (!supabase) {
      console.log('Supabase not configured, returning fallback data');
      return NextResponse.json({
        success: true,
        currentPrice: fallbackPriceData.currentPrice,
        currentSP500Price: fallbackPriceData.currentSP500Price
      });
    }

    // Fetch latest normalized price from lumepall_history
    const { data: latestHistory, error: latestErr } = await supabase
      .from('lumepall_history')
      .select('date,snobol')
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestErr || !latestHistory) {
      console.log('No lumepall_history data found, returning defaults');
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
    interface HistoryPoint { date: string; snobol: number; sp500: number }
    let history: HistoryPoint[] = [];
    if (range) {
      try {
        const { data: hist } = await supabase
          .from('snobol_history')
          .select('date,snobol,sp500')
          .gte('date', range.from)
          .lte('date', range.to)
          .order('date', { ascending: true });
        if (Array.isArray(hist)) history = hist as HistoryPoint[];
      } catch {}
    }

    return NextResponse.json({
      success: true,
      currentPrice: Number(latestHistory.snobol) || DEFAULT_PRICE,
      currentSP500Price: DEFAULT_SP500_PRICE,
      exactValue: Number(latestHistory.snobol) || DEFAULT_PRICE,
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

    // If Supabase is not configured, use fallback storage
    const supabase = await getSupabaseClient();
    if (!supabase) {
      console.log('Supabase not configured, using fallback storage');
      fallbackPriceData.currentPrice = validatedPrice;
      fallbackPriceData.currentSP500Price = validatedSP500Price;
      return NextResponse.json({
        success: true,
        currentPrice: validatedPrice,
        currentSP500Price: validatedSP500Price,
        message: 'Price saved to fallback storage (Supabase not configured)'
      });
    }

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

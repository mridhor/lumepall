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
  } catch {
    console.warn('Supabase not configured, using fallback data');
    cachedSupabase = null;
  }

  return cachedSupabase ?? null;
}

// Fallback fund parameters for development
const fallbackFundParams = {
  base_fund_value: 500000, // Base fund value in EUR (non-silver portion)
  silver_troy_ounces: 5000, // Silver holdings in Troy ounces
  silver_price_usd: 31.25, // Manual silver price in USD per Troy ounce
  last_updated: new Date().toISOString(),
};

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient();

    // If Supabase is not configured, return fallback data
    if (!supabase) {
      console.log('Supabase not configured, returning fallback fund parameters');
      return NextResponse.json({
        success: true,
        ...fallbackFundParams,
      });
    }

    // Fetch fund parameters from Supabase
    const { data, error } = await supabase
      .from('lumepall_fund_params')
      .select('*')
      .single();

    if (error) {
      console.error('Error fetching fund params:', error);
      return NextResponse.json({
        success: true,
        ...fallbackFundParams,
      });
    }

    return NextResponse.json({
      success: true,
      base_fund_value: Number(data.base_fund_value),
      silver_troy_ounces: Number(data.silver_troy_ounces),
      silver_price_usd: Number(data.silver_price_usd || 31.25),
      last_updated: data.updated_at || data.created_at,
    });
  } catch (error) {
    console.error('Error in fund-params API:', error);
    return NextResponse.json({
      success: true,
      ...fallbackFundParams,
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { base_fund_value, silver_troy_ounces, silver_price_usd } = await request.json();

    if (
      typeof base_fund_value !== 'number' ||
      typeof silver_troy_ounces !== 'number' ||
      typeof silver_price_usd !== 'number'
    ) {
      return NextResponse.json(
        { error: 'Invalid parameters' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseClient();
    if (!supabase) {
      // Update fallback data for development
      fallbackFundParams.base_fund_value = base_fund_value;
      fallbackFundParams.silver_troy_ounces = silver_troy_ounces;
      fallbackFundParams.silver_price_usd = silver_price_usd;
      fallbackFundParams.last_updated = new Date().toISOString();

      return NextResponse.json({
        success: true,
        message: 'Fund parameters updated (fallback storage)',
        ...fallbackFundParams,
      });
    }

    // Upsert fund parameters
    const { error } = await supabase
      .from('lumepall_fund_params')
      .upsert(
        {
          id: 1, // Single row for fund parameters
          base_fund_value,
          silver_troy_ounces,
          silver_price_usd,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

    if (error) {
      console.error('Error updating fund params:', error);
      return NextResponse.json(
        { error: 'Failed to update fund parameters' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Fund parameters updated successfully',
    });
  } catch (error) {
    console.error('Error in fund-params POST:', error);
    return NextResponse.json(
      { error: 'Failed to update fund parameters' },
      { status: 500 }
    );
  }
}

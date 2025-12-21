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

// Fallback data for development (total fund assets in EUR thousands)
// This simulates the growth of total fund assets over time
const fallbackFundAssets = [
  { date: 'Jan 5, 2015', total_assets: 89.7 },
  { date: 'Dec 31, 2015', total_assets: 91.5 },
  { date: 'Dec 31, 2016', total_assets: 93.45 },
  { date: 'Dec 31, 2017', total_assets: 95.4 },
  { date: 'Dec 31, 2018', total_assets: 97.35 },
  { date: 'Dec 31, 2019', total_assets: 99.3 },
  { date: 'Dec 31, 2020', total_assets: 100 },
  { date: 'Dec 31, 2021', total_assets: 220 },
  { date: 'Dec 31, 2022', total_assets: 328 },
  { date: 'Dec 31, 2023', total_assets: 435 },
  { date: 'Dec 31, 2024', total_assets: 575 },
  { date: 'Dec 1, 2025', total_assets: 718 },
];

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient();

    // If Supabase is not configured, return fallback data
    if (!supabase) {
      console.log('Supabase not configured, returning fallback fund assets data');
      return NextResponse.json({
        success: true,
        fundAssets: fallbackFundAssets,
        currentTotalAssets: fallbackFundAssets[fallbackFundAssets.length - 1].total_assets,
      });
    }

    // Fetch all fund assets history from Supabase
    const { data: fundAssetsData, error } = await supabase
      .from('lumepall_fund_assets')
      .select('date, total_assets')
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching fund assets:', error);
      // Return fallback data on error
      return NextResponse.json({
        success: true,
        fundAssets: fallbackFundAssets,
        currentTotalAssets: fallbackFundAssets[fallbackFundAssets.length - 1].total_assets,
      });
    }

    // Convert total_assets to thousands for easier display
    const formattedAssets = fundAssetsData.map((item) => ({
      date: item.date,
      total_assets: Number(item.total_assets) / 1000, // Convert to thousands
    }));

    const currentTotalAssets = formattedAssets.length > 0
      ? formattedAssets[formattedAssets.length - 1].total_assets
      : 0;

    return NextResponse.json({
      success: true,
      fundAssets: formattedAssets,
      currentTotalAssets,
    });
  } catch (error) {
    console.error('Error in fund-assets API:', error);
    return NextResponse.json({
      success: true,
      fundAssets: fallbackFundAssets,
      currentTotalAssets: fallbackFundAssets[fallbackFundAssets.length - 1].total_assets,
    });
  }
}

// POST endpoint to update fund assets
export async function POST(request: NextRequest) {
  try {
    const { date, total_assets } = await request.json();

    if (!date || typeof total_assets !== 'number') {
      return NextResponse.json(
        { error: 'Invalid date or total_assets value' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    // Upsert fund assets data
    const { error } = await supabase
      .from('lumepall_fund_assets')
      .upsert([{ date, total_assets }], { onConflict: 'date' });

    if (error) {
      console.error('Error updating fund assets:', error);
      return NextResponse.json(
        { error: 'Failed to update fund assets' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Fund assets updated successfully',
    });
  } catch (error) {
    console.error('Error in fund-assets POST:', error);
    return NextResponse.json(
      { error: 'Failed to update fund assets' },
      { status: 500 }
    );
  }
}

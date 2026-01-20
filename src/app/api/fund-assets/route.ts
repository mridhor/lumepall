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

// Fallback data from Excel file (total fund assets in EUR thousands)
// Real historical data from investment partnership through fund period
// Data is already sorted chronologically
const fallbackFundAssets = [
  { date: 'Aug 8, 2013', total_assets: 2.5 },         // Investment partnership begins
  { date: 'Dec 31, 2014', total_assets: 6.139 },
  { date: 'Dec 31, 2015', total_assets: 15.997 },
  { date: 'Dec 31, 2016', total_assets: 22.095 },
  { date: 'Dec 31, 2017', total_assets: 71.6 },
  { date: 'Dec 31, 2018', total_assets: 327.801 },
  { date: 'Dec 31, 2019', total_assets: 399.88 },
  { date: 'Dec 31, 2020', total_assets: 376.403 },
  { date: 'Dec 31, 2021', total_assets: 462.964 },    // First year as official fund
  { date: 'Dec 31, 2022', total_assets: 996.929 },
  { date: 'Dec 31, 2023', total_assets: 1334.873 },
  { date: 'Dec 31, 2024', total_assets: 1653.617 },
  { date: 'Dec 31, 2025', total_assets: 2268.755 },
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
      .select('date, total_assets');

    if (error) {
      console.error('Error fetching fund assets:', error);
      // Return fallback data on error
      return NextResponse.json({
        success: true,
        fundAssets: fallbackFundAssets,
        currentTotalAssets: fallbackFundAssets[fallbackFundAssets.length - 1].total_assets,
      });
    }

    // Convert total_assets to thousands and sort chronologically
    const formattedAssets = fundAssetsData
      .map((item) => ({
        date: item.date,
        total_assets: Number(item.total_assets) / 1000, // Convert to thousands
      }))
      .sort((a, b) => {
        // Sort by actual date, not alphabetically
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateA - dateB;
      });

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

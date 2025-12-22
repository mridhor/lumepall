import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';

// --- Configuration ---
const BASE_UPDATE_INTERVAL_MS = 30 * 1000; // 30 seconds
const JITTER_RANGE_MS = 5 * 1000;          // ±5 seconds
const SILVER_API_URL = 'https://api.gold-api.com/price/XAG/EUR';

// --- In-Memory Cache (Layer 1) ---
// Note: In serverless (Vercel), this persists only during "warm" executions.
// We rely on Supabase (Layer 2) for cold starts / cross-instance sharing.
let memoryCache = {
  price: 0,
  lastUpdated: 0
};

// --- Helper Functions ---

// 1. Get Supabase Client (Lazy Load)
let cachedSupabase: SupabaseClient | null | undefined;
async function getSupabaseClient(): Promise<SupabaseClient | null> {
  if (cachedSupabase !== undefined) return cachedSupabase;
  try {
    const { supabase } = await import('@/lib/supabase');
    cachedSupabase = supabase;
  } catch {
    cachedSupabase = null;
  }
  return cachedSupabase ?? null;
}

// 2. Fetch external API
async function fetchSilverApi(apiKey: string) {
  const res = await fetch(SILVER_API_URL, {
    headers: { 'x-access-token': apiKey },
    next: { revalidate: 0 } // No fetch-level caching, we manage it manually
  });
  if (!res.ok) throw new Error(`SilverAPI Error: ${res.status}`);
  return res.json();
}

export async function GET(request: NextRequest) {
  try {
    const now = Date.now();
    const apiKey = process.env.SILVER_API_KEY;

    // --- Layer 1: Check In-Memory Cache ---
    // Apply jitter dynamically to avoid thundering herd across instances if they sync up
    const randomJitter = (Math.random() * 2 - 1) * JITTER_RANGE_MS;
    const effectiveInterval = BASE_UPDATE_INTERVAL_MS + randomJitter;

    if (memoryCache.price > 0 && (now - memoryCache.lastUpdated) < effectiveInterval) {
      return NextResponse.json({
        success: true,
        silverPrice: memoryCache.price,
        source: 'memory_cache',
        timestamp: memoryCache.lastUpdated,
        currency: 'EUR'
      });
    }

    // --- Layer 2: Check Database Cache (Supabase) ---
    // If memory is stale or empty (cold start), check the DB.
    // This creates coordination between multiple serverless instances.
    const supabase = await getSupabaseClient();

    // Default fallback values
    // Note: We are now storing EUR in the 'silver_price_usd' column (legacy name)
    let dbPrice = 28.50; // Approx default EUR price
    let dbLastUpdated = 0;

    if (supabase) {
      const { data } = await supabase.from('lumepall_fund_params').select('silver_price_usd, last_updated').single();
      if (data) {
        dbPrice = Number(data.silver_price_usd) || 28.50;
        dbLastUpdated = data.last_updated ? new Date(data.last_updated).getTime() : 0;
      }
    }

    // Check if DB data is fresh enough (using the same interval logic)
    if ((now - dbLastUpdated) < effectiveInterval) {
      // DB is fresh -> Update memory cache and return
      memoryCache = { price: dbPrice, lastUpdated: dbLastUpdated };
      return NextResponse.json({
        success: true,
        silverPrice: dbPrice,
        source: 'database_cache',
        timestamp: dbLastUpdated,
        currency: 'EUR'
      });
    }

    // --- Layer 3: Fetch External API (Only if both layers are stale) ---
    // At this point, more than ~30s has passed since the last global update.

    let newPrice = dbPrice; // Fallback to old DB price if fetch fails
    let source = 'external_api';

    if (apiKey) {
      try {
        const apiData = await fetchSilverApi(apiKey);
        if (apiData.price) {
          let finalPriceEUR = apiData.price;

          // CRITICAL: Check if API ignored the /EUR path and returned USD
          // GoldAPI returns { currency: "USD", ... } or { symbol: "XAGUSD", ... }
          const currency = apiData.currency || (apiData.symbol && apiData.symbol.includes('USD') ? 'USD' : 'EUR');

          if (currency === 'USD') {
            // Fallback conversion if API fails to give EUR
            // approx rate: 1 EUR = 1.85 USD
            finalPriceEUR = apiData.price / 1.85;
            console.log('API returned USD, converting to EUR:', finalPriceEUR);
          }

          newPrice = finalPriceEUR;

          // Write back to DB (Upsert)
          if (supabase) {
            await supabase.from('lumepall_fund_params').upsert({
              id: 1, // Singleton row
              silver_price_usd: newPrice, // Storing EUR value in legacy column
              last_updated: new Date(now).toISOString()
            }, { onConflict: 'id' });
          }
        }
      } catch (externalError) {
        console.error('External API failed, serving stale data:', externalError);
        source = 'stale_backup';
        // We do NOT update the timestamp, so we retry next request (or we could cache failure for a bit)
      }
    } else {
      source = 'manual_fallback_no_key';
    }

    // Update Memory Cache
    memoryCache = { price: newPrice, lastUpdated: now };

    return NextResponse.json({
      success: true,
      silverPrice: newPrice,
      source: source,
      timestamp: now,
      currency: 'EUR'
    });

  } catch (error) {
    console.error('Critical Error in silver-price API:', error);
    // Ultimate failsafe: return whatever is in memory or hardcoded default
    return NextResponse.json({
      success: true,
      silverPrice: memoryCache.price || 31.25,
      source: 'critical_error_fallback',
      timestamp: Date.now(),
      currency: 'USD'
    });
  }
}

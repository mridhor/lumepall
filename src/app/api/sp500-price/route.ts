import { NextRequest, NextResponse } from 'next/server'
import { addTodayData, checkAndRecordYearlyData, FinancialData } from '@/utils/chartData'
import type { SupabaseClient } from '@supabase/supabase-js'

let cachedSupabase: SupabaseClient | null | undefined
async function getSupabaseClient(): Promise<SupabaseClient | null> {
  if (cachedSupabase !== undefined) return cachedSupabase
  try {
    const { supabase } = await import('@/lib/supabase')
    cachedSupabase = supabase
  } catch {
    cachedSupabase = null
  }
  return cachedSupabase ?? null
}

function getNormalizationBounds(): { min: number; max: number } {
  const minEnv = Number(process.env.SNOBOL_NORMAL_MIN)
  const maxEnv = Number(process.env.SNOBOL_NORMAL_MAX)
  const min = Number.isFinite(minEnv) ? minEnv : 1
  const max = Number.isFinite(maxEnv) ? maxEnv : 1.7957
  // Ensure sane ordering
  if (min >= max) {
    return { min: 1, max: 1.7957 }
  }
  return { min, max }
}

function filterByPeriod(updatedData: FinancialData[], period?: string): FinancialData[] {
  if (!period) return updatedData;
  const now = new Date();
  const start = new Date(now);
  switch (period) {
    case '1d': start.setDate(now.getDate() - 1); break;
    case '5d': start.setDate(now.getDate() - 5); break;
    case '7d': start.setDate(now.getDate() - 7); break;
    case '14d': start.setDate(now.getDate() - 14); break;
    case '1y': start.setFullYear(now.getFullYear() - 1); break;
    case '2y': start.setFullYear(now.getFullYear() - 2); break;
    case '5y': start.setFullYear(now.getFullYear() - 5); break;
    default: return updatedData;
  }
  const fromTime = start.getTime();
  return updatedData.filter((d: FinancialData) => {
    const t = new Date(d.date).getTime();
    return !isNaN(t) && t >= fromTime;
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') || undefined
  const origin = new URL(request.url).origin
  try {
    const { min: normalMin, max: normalMax } = getNormalizationBounds()
    // Prefer Supabase historical snobol series
    const supabase = await getSupabaseClient()
    let sbFinancialData: FinancialData[] | null = null
    if (supabase) {
      try {
        const { data } = await supabase
          .from('lumepall_history')
          .select('date,snobol')
          .order('date', { ascending: true })
        if (Array.isArray(data)) {
          type DBRow = { date: string; snobol: number }
          const parsed = (data as unknown as DBRow[])
            .map((r) => ({ date: r.date, snobol: Number(r.snobol), sp500: 1 }))
            // Filter out zero/invalid values - only keep data with actual values
            .filter(d => d.date && isFinite(d.snobol) && d.snobol > 0.5)

          // Use Supabase data if it has valid entries
          if (parsed.length > 50) {
            sbFinancialData = parsed
          }
        }
      } catch { }
    }

    // Try to load Snobol historical data from CSV if Supabase not present
    let csvFinancialData: FinancialData[] | null = null;
    try {
      const csvRes = await fetch(`${origin}/chartData.csv`);
      if (csvRes.ok) {
        const text = await csvRes.text();
        const lines = text.trim().split('\n');
        // Expect header: datetime_utc,value
        const rows = lines.slice(1);
        csvFinancialData = rows
          .map((line) => {
            const [datetimeUtc, valueStr] = line.split(',');
            const dateObj = new Date(datetimeUtc.replace(' ', 'T') + 'Z');
            if (isNaN(dateObj.getTime())) return null;
            const formatted = dateObj.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
            const snobolVal = Number(valueStr);
            if (!isFinite(snobolVal)) return null;
            return { date: formatted, snobol: snobolVal, sp500: 1 } as FinancialData;
          })
          .filter((v): v is FinancialData => Boolean(v));
      }
    } catch {
      // Ignore CSV issues; we'll fall back to default utils-based data
    }
    // Using Yahoo Finance API for S&P 500 Index (^GSPC) - actual index value
    const yahooUrl = 'https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC';

    const response = await fetch(yahooUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Yahoo API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.chart && data.chart.result && data.chart.result[0]) {
      const result = data.chart.result[0];
      const meta = result.meta;
      const actualPrice = meta.regularMarketPrice;

      // Calculate normalized price of S&P 500 based on 8/8/2013 baseline of $1697.48
      const baselinePrice = 1697.48;
      const normalizedPrice = actualPrice / baselinePrice;

      // Get current Snobol price from admin panel
      let currentSnobolPrice = 1.7957; // Default fallback
      try {
        const priceResponse = await fetch(`${origin}/api/price`);
        const priceData = await priceResponse.json();
        if (priceData.currentPrice) {
          currentSnobolPrice = priceData.currentPrice;
        }
      } catch {
        console.log('Using default Snobol price:', currentSnobolPrice);
      }

      // Build updated financial data:
      // PRIORITY: CSV first (has correct 2015-2025 values), then Supabase as fallback
      let baseData: FinancialData[] = [];
      if (csvFinancialData && csvFinancialData.length > 0) {
        // Use CSV data - it has complete 2015-2025 values without zeros
        const map = new Map<string, FinancialData>();
        for (const row of csvFinancialData) {
          // Only keep data with non-zero values
          if (row.snobol > 0.5) {
            map.set(row.date, row);
          }
        }
        baseData = Array.from(map.values()).sort((a, b) => {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        });
      } else if (sbFinancialData && sbFinancialData.length > 0) {
        // Fallback to Supabase data
        const map = new Map<string, FinancialData>();
        for (const row of sbFinancialData) map.set(row.date, row);
        baseData = Array.from(map.values()).sort((a, b) => {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        });
      } else {
        // Last resort: use embedded data from chartData.ts
        baseData = addTodayData(currentSnobolPrice, normalizedPrice);
        baseData = baseData.slice(0, -1);
      }

      // Append today's point using configured normalized scale
      const today = new Date();
      const formattedToday = today.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      // Ensure today's Snobol stays in normalized range
      const normalizedTodaySnobol = Math.min(Math.max(currentSnobolPrice, normalMin), normalMax);
      const withToday: FinancialData[] = [
        ...baseData.filter((d) => d.date !== formattedToday),
        { date: formattedToday, snobol: normalizedTodaySnobol, sp500: normalizedPrice },
      ];

      let updatedData = withToday;
      updatedData = filterByPeriod(updatedData, period);

      // Check if we need to record yearly data
      checkAndRecordYearlyData(currentSnobolPrice, normalizedPrice);

      return NextResponse.json({
        actualPrice: actualPrice,
        normalizedPrice: normalizedPrice,
        baselinePrice: baselinePrice,
        currentSnobolPrice: currentSnobolPrice,
        updatedData: updatedData,
        source: 'yahoo',
        timestamp: new Date().toISOString()
      });
    }

    // If Yahoo Finance fails, return a fallback price (last known good value)
    const fallbackPrice = 6713.71;
    const baselinePrice = 1697.48;
    const normalizedPrice = fallbackPrice / baselinePrice;

    // Get current Snobol price from admin panel
    let currentSnobolPrice = 1.7957; // Default fallback
    try {
      const priceResponse = await fetch(`${origin}/api/price`);
      const priceData = await priceResponse.json();
      if (priceData.currentPrice) {
        currentSnobolPrice = priceData.currentPrice;
      }
    } catch {
      console.log('Using default Snobol price:', currentSnobolPrice);
    }

    // Still update the financial data with fallback values
    let updatedData = addTodayData(currentSnobolPrice, normalizedPrice);
    updatedData = filterByPeriod(updatedData, period);
    checkAndRecordYearlyData(currentSnobolPrice, normalizedPrice);

    return NextResponse.json({
      actualPrice: fallbackPrice,
      normalizedPrice: normalizedPrice,
      baselinePrice: baselinePrice,
      currentSnobolPrice: currentSnobolPrice,
      updatedData: updatedData,
      source: 'fallback',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('S&P 500 price fetch error:', error);

    // Return fallback price on error
    const fallbackPrice = 6713.71;
    const baselinePrice = 1697.48;
    const normalizedPrice = fallbackPrice / baselinePrice;

    // Get current Snobol price from admin panel
    let currentSnobolPrice = 1.7957; // Default fallback
    try {
      const priceResponse = await fetch(`${origin}/api/price`);
      const priceData = await priceResponse.json();
      if (priceData.currentPrice) {
        currentSnobolPrice = priceData.currentPrice;
      }
    } catch {
      console.log('Using default Snobol price:', currentSnobolPrice);
    }

    // Update financial data even on error
    let updatedData = addTodayData(currentSnobolPrice, normalizedPrice);
    updatedData = filterByPeriod(updatedData, period);
    checkAndRecordYearlyData(currentSnobolPrice, normalizedPrice);

    return NextResponse.json({
      actualPrice: fallbackPrice,
      normalizedPrice: normalizedPrice,
      baselinePrice: baselinePrice,
      currentSnobolPrice: currentSnobolPrice,
      updatedData: updatedData,
      source: 'error_fallback',
      timestamp: new Date().toISOString()
    }, { status: 200 }); // Return 200 to prevent frontend errors
  }
}

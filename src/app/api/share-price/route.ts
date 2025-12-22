import { NextRequest, NextResponse } from 'next/server';

// Share price API - Returns base share price derived from live silver price
// Updates every second

// Deterministic fluctuation function for silver price
// Deterministic fluctuation removed as per user request
// Share price now strictly follows the live silver price minus base/manual settings

export async function GET(request: NextRequest) {
  try {
    // 1. Fetch Fund Parameters
    const paramsRes = await fetch(
      new URL('/api/fund-params', request.url).toString(),
      { cache: 'no-store' }
    );
    const paramsData = await paramsRes.json();

    // 2. Fetch Silver Price (Live/Cached)
    const silverRes = await fetch(
      new URL('/api/silver-price', request.url).toString(),
      { cache: 'no-store' }
    );
    const silverData = await silverRes.json();

    if (paramsData.success && silverData.success) {
      const baseFundValue = paramsData.base_fund_value; // EUR
      const silverOz = paramsData.silver_troy_ounces;
      const manualSilverPriceUSD = paramsData.silver_price_usd;
      const baseSharePrice = paramsData.base_share_price;

      const liveSilverPriceUSD = silverData.silverPrice;
      const eurToUsd = 1.08; // Fixed rate for consistency with frontend

      // Calculate Total Shares based on the MANUAL/BASE state
      // TotalShares = TotalFundValue_Base / BaseSharePrice
      const baseSilverValueEUR = (silverOz * manualSilverPriceUSD) / eurToUsd;
      const totalFundValueBase = baseFundValue + baseSilverValueEUR;
      const totalShares = totalFundValueBase / baseSharePrice;

      // Calculate Current Share Price based on LIVE silver price (NO fluctuation)
      const currentSilverPriceUSD = liveSilverPriceUSD;

      const currentSilverValueEUR = (silverOz * currentSilverPriceUSD) / eurToUsd;
      const totalFundValueCurrent = baseFundValue + currentSilverValueEUR;

      const currentSharePrice = totalFundValueCurrent / totalShares;

      return NextResponse.json({
        success: true,
        sharePrice: currentSharePrice,
        basePrice: baseSharePrice,
        silverPrice: currentSilverPriceUSD,
        fluctuation: 0,
        currency: 'EUR',
        timestamp: Date.now(),
        source: 'calculated_from_silver',
      });
    }

    // Fallback if data missing
    return NextResponse.json({
      success: true,
      sharePrice: 1.80,
      currency: 'EUR',
      timestamp: Date.now(),
      source: 'fallback_default',
    });

  } catch (error) {
    console.error('Error in share-price API:', error);
    return NextResponse.json({
      success: true,
      sharePrice: 1.80,
      currency: 'EUR',
      timestamp: Date.now(),
      source: 'error_fallback',
    });
  }
}

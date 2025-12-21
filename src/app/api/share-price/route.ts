import { NextRequest, NextResponse } from 'next/server';

// Share price API - Returns base share price with realistic fluctuations
// Fluctuates ±0.01 to ±0.05 EUR around the manually set base price
// Updates every second

// Deterministic fluctuation function for silver price
function getSilverFluctuation(): number {
  const now = Date.now();
  const seed = Math.floor(now / 1000); // Changes every second

  // Create pseudo-random value between 0 and 1
  const pseudoRand = Math.abs(Math.sin(seed * 9301 + 49297) * 233280) % 1;

  // Fluctuation range for silver: ±0.05 to ±0.30 USD (to cause ~0.001-0.006 EUR share price change)
  const minFluctuation = 0.002;
  const maxFluctuation = 0.008;

  // Random fluctuation amount
  const fluctuationAmount = minFluctuation + (pseudoRand * (maxFluctuation - minFluctuation));

  // Random direction (up or down)
  const direction = Math.sin(seed * 7919) > 0 ? 1 : -1;

  return fluctuationAmount * direction;
}

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

      // Calculate Current Share Price based on LIVE silver price + Fluctuation
      // Apply fluctuation to the silver price
      const silverFluctuation = getSilverFluctuation();
      const currentSilverPriceUSD = liveSilverPriceUSD + silverFluctuation;

      const currentSilverValueEUR = (silverOz * currentSilverPriceUSD) / eurToUsd;
      const totalFundValueCurrent = baseFundValue + currentSilverValueEUR;

      const currentSharePrice = totalFundValueCurrent / totalShares;

      return NextResponse.json({
        success: true,
        sharePrice: currentSharePrice,
        basePrice: baseSharePrice,
        silverPrice: currentSilverPriceUSD,
        fluctuation: silverFluctuation,
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

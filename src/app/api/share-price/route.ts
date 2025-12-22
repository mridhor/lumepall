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

    // --- Default / Fallback Values (Must match api/fund-params defaults) ---
    // These are used if the DB is inaccessible, ensuring we still calculate.
    let baseFundValue = 575000;
    let silverOz = 5000;
    let manualSilverPriceEUR = 28.50; // Reference price in EUR
    let baseSharePrice = 1.824;

    // --- Override with DB Data if available ---
    if (paramsData.success) {
      baseFundValue = Number(paramsData.base_fund_value) || baseFundValue;
      silverOz = Number(paramsData.silver_troy_ounces) || silverOz;
      manualSilverPriceEUR = Number(paramsData.silver_price_usd) || manualSilverPriceEUR; // legacy name, now EUR
      baseSharePrice = Number(paramsData.base_share_price) || baseSharePrice;
    }

    // --- Determine Live Silver Price ---
    // Default to the manual reference price (neutral impact) if live fetch completely fails
    let liveSilverPriceEUR = manualSilverPriceEUR;
    let priceSource = 'fallback_reference_price';

    if (silverData.success && silverData.silverPrice) {
      liveSilverPriceEUR = silverData.silverPrice; // Already in EUR from silver-price API
      priceSource = silverData.source || 'live_api';
    }

    // --- Calculation Engine ---
    // 1. Calculate Total Shares based on the REFERENCE state (Base)
    //    TotalShares = (BaseFund + (Silver * ReferencePrice)) / BaseSharePrice
    const baseSilverValueEUR = silverOz * manualSilverPriceEUR;
    const totalFundValueBase = baseFundValue + baseSilverValueEUR;
    const totalShares = totalFundValueBase / baseSharePrice;

    // 2. Calculate Current Share Price based on LIVE silver price
    //    CurrentPrice = (BaseFund + (Silver * LivePrice)) / TotalShares
    const currentSilverValueEUR = silverOz * liveSilverPriceEUR;
    const totalFundValueCurrent = baseFundValue + currentSilverValueEUR;

    // Protect against division by zero
    const currentSharePrice = totalShares > 0 ? totalFundValueCurrent / totalShares : baseSharePrice;

    return NextResponse.json({
      success: true,
      sharePrice: currentSharePrice,
      basePrice: baseSharePrice,
      silverPrice: liveSilverPriceEUR,
      fluctuation: 0,
      currency: 'EUR',
      timestamp: Date.now(),
      source: `calculated_from_${priceSource}`,
    });

  } catch (error) {
    console.error('Error in share-price API:', error);
    // Even in critical error, return a safe default that mimics the base
    return NextResponse.json({
      success: true,
      sharePrice: 1.824, // Ultimate safety net calculation result
      currency: 'EUR',
      timestamp: Date.now(),
      source: 'critical_error_fallback',
    });
  }
}

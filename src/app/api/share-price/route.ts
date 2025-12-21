import { NextRequest, NextResponse } from 'next/server';

// Share price API - Returns base share price with realistic fluctuations
// Fluctuates ±0.01 to ±0.05 EUR around the manually set base price
// Updates every second

// Deterministic fluctuation function for smooth, realistic price movement
function getFluctuation(basePrice: number): number {
  const now = Date.now();
  const seed = Math.floor(now / 1000); // Changes every second

  // Create pseudo-random value between 0 and 1
  const pseudoRand = Math.abs(Math.sin(seed * 9301 + 49297) * 233280) % 1;

  // Fluctuation range: ±0.005 to ±0.02 EUR
  const minFluctuation = 0.005;
  const maxFluctuation = 0.02;

  // Random fluctuation amount
  const fluctuationAmount = minFluctuation + (pseudoRand * (maxFluctuation - minFluctuation));

  // Random direction (up or down)
  const direction = Math.sin(seed * 7919) > 0 ? 1 : -1;

  return fluctuationAmount * direction;
}

export async function GET(request: NextRequest) {
  try {
    // Fetch the manually set base share price from fund parameters
    const response = await fetch(
      new URL('/api/fund-params', request.url).toString(),
      { cache: 'no-store' }
    );

    const data = await response.json();

    if (data.success && data.base_share_price) {
      const basePrice = data.base_share_price;
      const fluctuation = getFluctuation(basePrice);
      const currentPrice = basePrice + fluctuation;

      return NextResponse.json({
        success: true,
        sharePrice: currentPrice,
        basePrice: basePrice,
        fluctuation: fluctuation,
        currency: 'EUR',
        timestamp: Date.now(),
        source: 'manual_with_fluctuation',
      });
    }

    // Fallback to default price if not set
    const defaultBasePrice = 1.80;
    const fluctuation = getFluctuation(defaultBasePrice);
    const currentPrice = defaultBasePrice + fluctuation;

    return NextResponse.json({
      success: true,
      sharePrice: currentPrice,
      basePrice: defaultBasePrice,
      fluctuation: fluctuation,
      currency: 'EUR',
      timestamp: Date.now(),
      source: 'default_with_fluctuation',
    });
  } catch (error) {
    console.error('Error in share-price API:', error);

    // Return default price with fluctuation on error
    const defaultBasePrice = 1.80;
    const fluctuation = getFluctuation(defaultBasePrice);
    const currentPrice = defaultBasePrice + fluctuation;

    return NextResponse.json({
      success: true,
      sharePrice: currentPrice,
      basePrice: defaultBasePrice,
      fluctuation: fluctuation,
      currency: 'EUR',
      timestamp: Date.now(),
      source: 'fallback_with_fluctuation',
    });
  }
}

import { NextRequest, NextResponse } from 'next/server';

// Cache structure
let priceCache = {
  price: 0,
  timestamp: 0,
  currency: 'USD'
};

// Cache duration in milliseconds (e.g., 5 minutes to respect free tier limits)
const CACHE_DURATION = 5 * 60 * 1000;

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.SILVER_API_KEY;
    const now = Date.now();

    // Check cache validity
    if (priceCache.price > 0 && (now - priceCache.timestamp < CACHE_DURATION)) {
      return NextResponse.json({
        success: true,
        silverPrice: priceCache.price,
        currency: priceCache.currency,
        unit: 'troy_ounce',
        timestamp: priceCache.timestamp,
        source: 'cache',
      });
    }

    // If API key is present, fetch from GoldAPI
    if (apiKey) {
      try {
        const response = await fetch('https://www.goldapi.io/api/XAG/USD', {
          headers: {
            'x-access-token': apiKey,
            'Content-Type': 'application/json'
          },
          next: { revalidate: 300 } // Next.js cache
        });

        if (response.ok) {
          const data = await response.json();
          // data format: { timestamp: ..., metal: "XAG", currency: "USD", exchange: "...", symbol: "...", prev_close_price: ..., open_price: ..., low_price: ..., high_price: ..., open_time: ..., price: 31.45, ch: ..., chp: ..., ask: ..., bid: ... }

          if (data.price) {
            // Update cache
            priceCache = {
              price: data.price,
              timestamp: now,
              currency: 'USD'
            };

            return NextResponse.json({
              success: true,
              silverPrice: data.price,
              currency: 'USD',
              unit: 'troy_ounce',
              timestamp: now,
              source: 'goldapi',
            });
          }
        } else {
          console.error('GoldAPI error:', response.status, response.statusText);
        }
      } catch (apiError) {
        console.error('Failed to fetch from GoldAPI:', apiError);
      }
    }

    // Fallback: Fetch manually set price from fund parameters
    const response = await fetch(
      new URL('/api/fund-params', request.url).toString(),
      { cache: 'no-store' }
    );

    const data = await response.json();

    if (data.success && data.silver_price_usd) {
      return NextResponse.json({
        success: true,
        silverPrice: data.silver_price_usd,
        currency: 'USD',
        unit: 'troy_ounce',
        timestamp: Date.now(),
        source: 'manual_fallback',
      });
    }

    // Final fallback
    return NextResponse.json({
      success: true,
      silverPrice: 31.25,
      currency: 'USD',
      unit: 'troy_ounce',
      timestamp: Date.now(),
      source: 'default',
    });
  } catch (error) {
    console.error('Error in silver-price API:', error);

    return NextResponse.json({
      success: true,
      silverPrice: 31.25,
      currency: 'USD',
      unit: 'troy_ounce',
      timestamp: Date.now(),
      source: 'error_fallback',
    });
  }
}

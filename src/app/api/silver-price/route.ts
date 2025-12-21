import { NextRequest, NextResponse } from 'next/server';

// Scheduled update times in UTC (corresponding to 9 AM, 1 PM, 5 PM UTC-3)
// UTC-3 is UTC - 3 hours.
// 09:00 UTC-3 = 12:00 UTC
// 13:00 UTC-3 = 16:00 UTC
// 17:00 UTC-3 = 20:00 UTC
const UPDATE_SLOTS_UTC = [12, 16, 20];

// Helper to get the latest checkpoint timestamp that has passed
function getLatestCheckpoint(now: number): number {
  const date = new Date(now);
  const currentHour = date.getUTCHours();

  // Find the latest slot that has passed today
  // Sort slots descending
  const passedSlots = UPDATE_SLOTS_UTC.filter(slot => slot <= currentHour).sort((a, b) => b - a);

  if (passedSlots.length > 0) {
    // Latest slot today
    const checkpoint = new Date(now);
    checkpoint.setUTCHours(passedSlots[0], 0, 0, 0);
    return checkpoint.getTime();
  } else {
    // No slots passed today yet, so the latest was the last slot of yesterday (20:00 UTC)
    const checkpoint = new Date(now);
    checkpoint.setDate(checkpoint.getDate() - 1);
    checkpoint.setUTCHours(UPDATE_SLOTS_UTC[UPDATE_SLOTS_UTC.length - 1], 0, 0, 0);
    return checkpoint.getTime();
  }
}

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.SILVER_API_KEY;
    const now = Date.now();

    // 1. Fetch current stored parameters (price + last_updated)
    const paramsUrl = new URL('/api/fund-params', request.url).toString();
    const paramsRes = await fetch(paramsUrl, { cache: 'no-store' });
    const paramsData = await paramsRes.json();

    let currentStoredPrice = 31.25;
    let lastUpdatedTs = 0;
    let currentParams = {};

    if (paramsData.success) {
      currentStoredPrice = paramsData.silver_price_usd || 31.25;
      lastUpdatedTs = paramsData.last_updated ? new Date(paramsData.last_updated).getTime() : 0;
      currentParams = paramsData;
    }

    // 2. Check if we need to update
    const latestCheckpoint = getLatestCheckpoint(now);
    const needsUpdate = lastUpdatedTs < latestCheckpoint;

    // If no update needed, return stored price
    if (!needsUpdate) {
      return NextResponse.json({
        success: true,
        silverPrice: currentStoredPrice,
        currency: 'USD',
        unit: 'troy_ounce',
        timestamp: lastUpdatedTs,
        source: 'stored_db',
        nextUpdate: 'Next scheduled slot'
      });
    }

    // 3. Update needed: Fetch from GoldAPI
    if (apiKey) {
      try {
        const response = await fetch('https://www.goldapi.io/api/XAG/USD', {
          headers: {
            'x-access-token': apiKey,
            'Content-Type': 'application/json'
          },
          next: { revalidate: 0 } // No caching for the external call itself
        });

        if (response.ok) {
          const data = await response.json();
          if (data.price) {
            const newPrice = data.price;

            // 4. Update the database with new price
            // We need to send all params back to POST
            if (paramsData.success) {
              await fetch(paramsUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  base_fund_value: paramsData.base_fund_value,
                  silver_troy_ounces: paramsData.silver_troy_ounces,
                  base_share_price: paramsData.base_share_price,
                  silver_price_usd: newPrice
                  // updated_at will be set by the POST handler
                })
              });
            }

            return NextResponse.json({
              success: true,
              silverPrice: newPrice,
              currency: 'USD',
              unit: 'troy_ounce',
              timestamp: now,
              source: 'goldapi_live_update',
            });
          }
        } else {
          console.error('GoldAPI error:', response.status);
        }
      } catch (apiError) {
        console.error('Failed to fetch from GoldAPI:', apiError);
      }
    }

    // Fallback if API failed or no key: Return stored price
    return NextResponse.json({
      success: true,
      silverPrice: currentStoredPrice,
      currency: 'USD',
      unit: 'troy_ounce',
      timestamp: lastUpdatedTs,
      source: 'fallback_stored',
      message: 'Update failed or API key missing'
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

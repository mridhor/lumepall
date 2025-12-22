import { NextRequest, NextResponse } from 'next/server';

const MIN_UPDATE_INTERVAL_MS = 6 * 60 * 1000; // 6 minutes (allows ~10 updates/hour)

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

    if (paramsData.success) {
      currentStoredPrice = paramsData.silver_price_usd || 31.25;
      lastUpdatedTs = paramsData.last_updated ? new Date(paramsData.last_updated).getTime() : 0;
    }

    // 2. Check if we need to update
    // Update if more than 6 minutes have passed since last update
    const timeSinceLastUpdate = now - lastUpdatedTs;
    const needsUpdate = timeSinceLastUpdate >= MIN_UPDATE_INTERVAL_MS;

    // If no update needed, return stored price
    if (!needsUpdate) {
      const minutesRemaining = Math.ceil((MIN_UPDATE_INTERVAL_MS - timeSinceLastUpdate) / 60000);
      return NextResponse.json({
        success: true,
        silverPrice: currentStoredPrice,
        currency: 'USD',
        unit: 'troy_ounce',
        timestamp: lastUpdatedTs,
        source: 'stored_db',
        nextUpdate: `In ~${minutesRemaining} minutes`
      });
    }

    // 3. Update needed: Fetch from GoldAPI
    if (apiKey) {
      try {
        const response = await fetch('https://api.gold-api.com/price/XAG', {
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

import { NextRequest, NextResponse } from 'next/server';

// Silver spot price API endpoint
// This fetches real-time silver prices from metals-api.com or similar service

// For development, we'll use a simulated spot price that fluctuates
// In production, you should replace this with a real API call

const SILVER_API_KEY = process.env.METALS_API_KEY;
const SILVER_API_URL = 'https://metals-api.com/api/latest';

// Fallback: simulated silver price (USD per Troy ounce)
let cachedSilverPrice = 31.25; // Starting price
let lastFetchTime = 0;
const CACHE_DURATION = 1000; // 1 second cache

// Simulate silver price fluctuations (for development)
function getSimulatedSilverPrice(): number {
  const now = Date.now();
  const seed = Math.floor(now / 1000);
  const pseudoRand = (Math.sin(seed * 9301 + 49297) * 233280) % 1;

  // Silver typically fluctuates ±0.5% in short timeframes
  const basePrice = 31.25;
  const fluctuation = (pseudoRand - 0.5) * 2 * (basePrice * 0.005);

  return basePrice + fluctuation;
}

async function fetchRealSilverPrice(): Promise<number> {
  if (!SILVER_API_KEY) {
    // No API key configured, use simulated price
    return getSimulatedSilverPrice();
  }

  try {
    // metals-api.com endpoint: XAG = Silver in Troy ounces
    const response = await fetch(
      `${SILVER_API_URL}?access_key=${SILVER_API_KEY}&base=USD&symbols=XAG`,
      { next: { revalidate: 1 } } // Revalidate every second
    );

    if (!response.ok) {
      throw new Error('Failed to fetch silver price');
    }

    const data = await response.json();

    // metals-api returns rate as USD per ounce
    // Format: { rates: { XAG: 0.032 } } - this is inverted (USD per XAG)
    // We need XAG per USD, so we invert it
    if (data.rates && data.rates.XAG) {
      return 1 / data.rates.XAG; // Convert to USD per Troy ounce
    }

    throw new Error('Invalid API response');
  } catch (error) {
    console.error('Error fetching silver price:', error);
    return getSimulatedSilverPrice();
  }
}

export async function GET(request: NextRequest) {
  try {
    const now = Date.now();

    // Use cached price if still fresh
    if (now - lastFetchTime < CACHE_DURATION) {
      return NextResponse.json({
        success: true,
        silverPrice: cachedSilverPrice,
        currency: 'USD',
        unit: 'troy_ounce',
        timestamp: lastFetchTime,
        cached: true,
      });
    }

    // Fetch fresh silver price
    const silverPrice = await fetchRealSilverPrice();

    cachedSilverPrice = silverPrice;
    lastFetchTime = now;

    return NextResponse.json({
      success: true,
      silverPrice: silverPrice,
      currency: 'USD',
      unit: 'troy_ounce',
      timestamp: now,
      cached: false,
    });
  } catch (error) {
    console.error('Error in silver-price API:', error);

    return NextResponse.json({
      success: true,
      silverPrice: cachedSilverPrice,
      currency: 'USD',
      unit: 'troy_ounce',
      timestamp: lastFetchTime,
      error: 'Using cached price due to error',
    });
  }
}

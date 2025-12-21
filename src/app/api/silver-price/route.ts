import { NextRequest, NextResponse } from 'next/server';

// Silver price API - Returns manually set price from fund parameters
// The admin sets the silver price manually in the admin panel

export async function GET(request: NextRequest) {
  try {
    // Fetch the manually set silver price from fund parameters
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
        source: 'manual',
      });
    }

    // Fallback to default price if not set
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

    // Return default price on error
    return NextResponse.json({
      success: true,
      silverPrice: 31.25,
      currency: 'USD',
      unit: 'troy_ounce',
      timestamp: Date.now(),
      source: 'fallback',
    });
  }
}

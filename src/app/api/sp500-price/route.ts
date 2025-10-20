import { NextRequest, NextResponse } from 'next/server'
import { addTodayData, checkAndRecordYearlyData, FinancialData } from '@/utils/chartData'

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
  try {
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
      let currentSnobolPrice = 18.49; // Default fallback
      try {
        const priceResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/price`);
        const priceData = await priceResponse.json();
        if (priceData.currentPrice) {
          currentSnobolPrice = priceData.currentPrice;
        }
      } catch (error) {
        console.log('Using default Snobol price:', currentSnobolPrice);
      }
      
      // Update the financial data with today's data
      let updatedData = addTodayData(currentSnobolPrice, normalizedPrice);
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
    let currentSnobolPrice = 18.49; // Default fallback
    try {
      const priceResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/price`);
      const priceData = await priceResponse.json();
      if (priceData.currentPrice) {
        currentSnobolPrice = priceData.currentPrice;
      }
    } catch (error) {
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
    let currentSnobolPrice = 18.49; // Default fallback
    try {
      const priceResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/price`);
      const priceData = await priceResponse.json();
      if (priceData.currentPrice) {
        currentSnobolPrice = priceData.currentPrice;
      }
    } catch (error) {
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

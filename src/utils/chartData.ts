export interface FinancialData {
  date: string;
  snobol: number;
  sp500: number;
}

// Define the ChartData interface in chartData.ts to match PerformanceChart.tsx
export interface ChartData {
  date: string;
  fullDate: string;
  sp500: number;
  snobol: number;
  totalSnobol?: number; // Optional field for total Snobol price
  actualSp500?: number; // Actual S&P 500 price
  actualSnobol?: number; // Actual Snobol price
  smoothedSnobol?: number; // Smoothed version for visual display
  smoothedSp500?: number; // Smoothed S&P500 for benchmark line
  normalizedSp500?: number; // Normalized S&P500 in EUR (same scale as Lumepall)
}

// S&P500 normalized values (baseline Aug 8, 2013 = 1.0)
const sp500YearEndValues: Record<string, number> = {
  "2013": 1,
  "2014": 1.2303,
  "2015": 1.2203,
  "2016": 1.324,
  "2017": 1.5812,
  "2018": 1.4701,
  "2019": 1.9051,
  "2020": 2.2071,
  "2021": 2.8261,
  "2022": 2.2707,
  "2023": 2.8209,
  "2024": 3.4933,
  "2025": 4.033,  // Estimated based on current value
  "2026": 4.004   // Current as of Jan 2026
};

// Function to get interpolated S&P500 value for any date
function getSp500ForDate(dateStr: string): number {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31);
  const yearProgress = (date.getTime() - yearStart.getTime()) / (yearEnd.getTime() - yearStart.getTime());

  // Get year-end values for current and previous year
  const currentYearValue = sp500YearEndValues[year.toString()] || sp500YearEndValues[(year - 1).toString()] || 1;
  const previousYearValue = sp500YearEndValues[(year - 1).toString()] || 1;

  // Linear interpolation between previous year-end and current year-end
  return previousYearValue + (currentYearValue - previousYearValue) * yearProgress;
}

// Embedded CSV contents from public/chartData.csv for default dataset (normalized Snobol series)
const embeddedCsv = `datetime_utc,value
2013-08-08 00:00:00,0.075
2014-12-31 00:00:00,0.1104
2015-12-31 00:00:00,0.1854
2016-12-31 00:00:00,0.2377
2017-12-31 00:00:00,0.4528
2018-12-31 00:00:00,0.8719
2019-12-31 00:00:00,1.0511
2020-12-31 00:00:00,0.8793
2021-04-01 00:00:00,1
2021-04-04 00:00:00,1.0056
2021-04-11 00:00:00,1.0072
2021-04-18 00:00:00,1.0139
2021-04-25 00:00:00,1.0108
2021-05-02 00:00:00,1.0143
2021-05-09 00:00:00,1.0297
2021-05-16 20:59:59,1.0298
2021-05-23 20:59:59,1.0307
2021-05-30 20:59:59,1.0353
2021-06-06 20:59:59,1.0344
2021-06-13 20:59:59,1.0379
2021-06-20 20:59:59,1.0259
2021-06-27 20:59:59,1.0312
2021-07-04 20:59:59,1.0394
2021-07-11 20:59:59,1.0404
2021-07-18 20:59:59,1.0409
2021-07-25 20:59:59,1.041
2021-08-01 20:59:59,1.0426
2021-08-08 20:59:59,1.0439
2021-08-15 20:59:59,1.0452
2021-08-22 20:59:59,1.0463
2021-08-29 20:59:59,1.0491
2021-09-05 20:59:59,1.0542
2021-09-12 20:59:59,1.0527
2021-09-19 20:59:59,1.0526
2021-09-26 20:59:59,1.0557
2021-10-03 20:59:59,1.0613
2021-10-10 20:59:59,1.0654
2021-10-17 20:59:59,1.0745
2021-10-24 20:59:59,1.0813
2021-10-31 21:59:59,1.0818
2021-11-07 21:59:59,1.0882
2021-11-14 21:59:59,1.0963
2021-11-21 21:59:59,1.0956
2021-11-28 21:59:59,1.0896
2021-12-05 21:59:59,1.0873
2021-12-12 21:59:59,1.0884
2021-12-19 21:59:59,1.0945
2021-12-26 21:59:59,1.0974
2021-12-31 00:00:00,1.0998
2022-01-09 21:59:59,1.0999
2022-01-16 21:59:59,1.1024
2022-01-23 21:59:59,1.1104
2022-01-30 21:59:59,1.1051
2022-02-06 21:59:59,1.1079
2022-02-13 21:59:59,1.1266
2022-02-20 21:59:59,1.1294
2022-02-27 21:59:59,1.1336
2022-03-06 21:59:59,1.1447
2022-03-13 21:59:59,1.1463
2022-03-20 21:59:59,1.1432
2022-03-27 20:59:59,1.1566
2022-04-03 20:59:59,1.1517
2022-04-10 20:59:59,1.1543
2022-04-17 20:59:59,1.1575
2022-04-24 20:59:59,1.1521
2022-05-01 20:59:59,1.1496
2022-05-08 20:59:59,1.1492
2022-05-15 20:59:59,1.146
2022-05-22 20:59:59,1.1541
2022-05-29 20:59:59,1.1561
2022-06-05 20:59:59,1.1718
2022-06-12 20:59:59,1.1736
2022-06-19 20:59:59,1.1728
2022-06-26 20:59:59,1.1696
2022-07-03 20:59:59,1.1663
2022-07-10 20:59:59,1.1677
2022-07-17 20:59:59,1.1676
2022-07-24 20:59:59,1.1679
2022-07-31 20:59:59,1.1769
2022-08-07 20:59:59,1.177
2022-08-14 20:59:59,1.1806
2022-08-21 20:59:59,1.1781
2022-08-28 20:59:59,1.18
2022-09-04 20:59:59,1.1793
2022-09-11 20:59:59,1.1829
2022-09-18 20:59:59,1.1883
2022-09-25 20:59:59,1.1877
2022-10-02 20:59:59,1.1887
2022-10-09 20:59:59,1.1944
2022-10-16 20:59:59,1.1859
2022-10-23 20:59:59,1.19
2022-10-30 21:59:59,1.1884
2022-11-06 21:59:59,1.197
2022-11-13 21:59:59,1.1986
2022-11-20 21:59:59,1.1972
2022-11-27 21:59:59,1.2179
2022-12-04 21:59:59,1.2223
2022-12-11 21:59:59,1.2234
2022-12-18 21:59:59,1.2221
2022-12-25 21:59:59,1.2233
2022-12-31 00:00:00,1.2236
2023-01-08 21:59:59,1.2237
2023-01-15 21:59:59,1.2237
2023-01-22 21:59:59,1.2225
2023-01-29 21:59:59,1.2244
2023-02-05 21:59:59,1.2214
2023-02-12 21:59:59,1.221
2023-02-19 21:59:59,1.2217
2023-02-26 21:59:59,1.2221
2023-03-05 21:59:59,1.2266
2023-03-12 21:59:59,1.2254
2023-03-19 21:59:59,1.2328
2023-03-26 20:59:59,1.234
2023-04-02 20:59:59,1.2377
2023-04-09 20:59:59,1.2402
2023-04-16 20:59:59,1.2417
2023-04-23 20:59:59,1.2409
2023-04-30 20:59:59,1.2415
2023-05-07 20:59:59,1.243
2023-05-14 20:59:59,1.2394
2023-05-21 20:59:59,1.2414
2023-05-28 20:59:59,1.2434
2023-06-04 20:59:59,1.2442
2023-06-11 20:59:59,1.2482
2023-06-18 20:59:59,1.2476
2023-06-25 20:59:59,1.2432
2023-07-02 20:59:59,1.247
2023-07-09 20:59:59,1.2513
2023-07-16 20:59:59,1.2546
2023-07-23 20:59:59,1.2552
2023-07-30 20:59:59,1.2579
2023-08-06 20:59:59,1.2588
2023-08-13 20:59:59,1.2567
2023-08-20 20:59:59,1.2573
2023-08-27 20:59:59,1.2644
2023-09-03 20:59:59,1.2657
2023-09-10 20:59:59,1.2706
2023-09-17 20:59:59,1.2711
2023-09-19 20:59:59,1.2718
2023-10-01 20:59:59,1.2721
2023-10-08 20:59:59,1.2743
2023-10-15 20:59:59,1.2777
2023-10-22 20:59:59,1.2816
2023-10-29 21:59:59,1.2812
2023-11-05 21:59:59,1.2909
2023-11-12 21:59:59,1.2886
2023-11-19 21:59:59,1.2911
2023-11-26 21:59:59,1.2925
2023-12-03 21:59:59,1.2966
2023-12-10 21:59:59,1.2936
2023-12-17 21:59:59,1.3004
2023-12-24 21:59:59,1.3032
2023-12-31 00:00:00,1.3021
2024-01-14 21:59:59,1.3011
2024-01-21 21:59:59,1.3041
2024-01-28 21:59:59,1.3075
2024-02-04 21:59:59,1.3128
2024-02-11 21:59:59,1.3126
2024-02-18 21:59:59,1.3253
2024-02-25 21:59:59,1.3238
2024-03-03 21:59:59,1.3269
2024-03-10 21:59:59,1.3318
2024-03-17 21:59:59,1.3342
2024-03-24 21:59:59,1.3387
2024-03-31 20:59:59,1.3394
2024-04-07 20:59:59,1.3507
2024-04-14 20:59:59,1.353
2024-04-21 20:59:59,1.3583
2024-04-28 20:59:59,1.3596
2024-05-05 20:59:59,1.3576
2024-05-12 20:59:59,1.3623
2024-05-19 20:59:59,1.3695
2024-05-26 20:59:59,1.3672
2024-06-02 20:59:59,1.3673
2024-06-09 20:59:59,1.3671
2024-06-16 20:59:59,1.3766
2024-06-23 20:59:59,1.3766
2024-06-30 20:59:59,1.3755
2024-07-07 20:59:59,1.3797
2024-07-14 20:59:59,1.3782
2024-07-21 20:59:59,1.3797
2024-07-28 20:59:59,1.3767
2024-08-04 20:59:59,1.3832
2024-08-11 20:59:59,1.3831
2024-08-18 20:59:59,1.3861
2024-08-25 20:59:59,1.4105
2024-09-01 20:59:59,1.4086
2024-09-08 20:59:59,1.4053
2024-09-15 20:59:59,1.4143
2024-09-22 20:59:59,1.4149
2024-09-29 20:59:59,1.4164
2024-10-06 20:59:59,1.4235
2024-10-13 20:59:59,1.4215
2024-10-20 20:59:59,1.4292
2024-10-27 21:59:59,1.4326
2024-11-03 21:59:59,1.4277
2024-11-10 21:59:59,1.427
2024-11-17 21:59:59,1.4252
2024-11-24 21:59:59,1.4431
2024-12-01 21:59:59,1.4398
2024-12-08 21:59:59,1.4418
2024-12-15 21:59:59,1.4411
2024-12-22 21:59:59,1.4381
2024-12-29 21:59:59,1.4378
2024-12-31 00:00:00,1.4367
2025-01-05 21:59:59,1.4449
2025-01-12 21:59:59,1.4485
2025-01-19 21:59:59,1.4481
2025-01-26 21:59:59,1.447
2025-02-02 21:59:59,1.698
2025-02-09 21:59:59,1.699
2025-02-16 21:59:59,1.6981
2025-02-23 21:59:59,1.6993
2025-03-02 21:59:59,1.6959
2025-03-09 21:59:59,1.7
2025-03-16 21:59:59,1.7033
2025-03-23 21:59:59,1.7016
2025-03-30 20:59:59,1.7094
2025-04-06 20:59:59,1.6998
2025-04-13 20:59:59,1.7135
2025-04-20 20:59:59,1.7137
2025-04-27 20:59:59,1.7156
2025-05-04 20:59:59,1.7178
2025-05-11 20:59:59,1.7201
2025-05-18 20:59:59,1.7196
2025-05-25 20:59:59,1.7259
2025-06-01 20:59:59,1.7247
2025-06-08 20:59:59,1.7323
2025-06-15 20:59:59,1.7366
2025-06-22 20:59:59,1.736
2025-06-29 20:59:59,1.7343
2025-07-06 20:59:59,1.7414
2025-07-13 20:59:59,1.7461
2025-07-20 20:59:59,1.7461
2025-07-27 20:59:59,1.745
2025-08-03 20:59:59,1.7569
2025-08-10 20:59:59,1.7599
2025-08-17 20:59:59,1.7585
2025-08-24 20:59:59,1.7607
2025-08-31 20:59:59,1.7633
2025-09-07 20:59:59,1.7663
2025-09-14 20:59:59,1.7692
2025-09-21 20:59:59,1.7715
2025-09-22 20:59:59,1.7779
2025-10-12 20:59:59,1.7957
2025-10-19 20:59:59,1.8
2025-10-26 21:59:59,1.803
2025-10-28 21:59:59,1.7957
2025-11-30 00:00:00,1.8278
2025-12-31 00:00:00,1.8596
`;

function parseCsv(csv: string): FinancialData[] {
  try {
    const lines = csv.trim().split('\n');
    if (lines.length <= 1) return [];
    const rows = lines.slice(1);
    const map = new Map<string, FinancialData>();
    for (const line of rows) {
      const [datetimeUtc, valueStr] = line.split(',');
      if (!datetimeUtc || !valueStr) continue;
      const dateObj = new Date(datetimeUtc.replace(' ', 'T') + 'Z');
      if (isNaN(dateObj.getTime())) continue;
      const formatted = dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      const val = Number(valueStr);
      if (!isFinite(val)) continue;
      // Get interpolated S&P500 value for this date
      const sp500Value = getSp500ForDate(dateObj.toISOString());
      // Keep last value per date
      map.set(formatted, { date: formatted, snobol: val, sp500: sp500Value });
    }
    return Array.from(map.values()).sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  } catch {
    return [];
  }
}

// Cache version - increment this to force all users to refresh their data
const CACHE_VERSION = '2.6'; // Updated: Fixed S&P500 normalization to Lumepall baseline

export const financialData: FinancialData[] = (() => {
  // Prefer persisted client-side data
  if (typeof window !== 'undefined') {
    const storedVersion = localStorage.getItem("financialDataVersion");
    const stored = localStorage.getItem("financialData");

    // Check cache version - if different, clear cache
    if (storedVersion !== CACHE_VERSION) {
      console.log(`Cache version mismatch (${storedVersion} !== ${CACHE_VERSION}). Clearing cache.`);
      localStorage.removeItem("financialData");
      localStorage.setItem("financialDataVersion", CACHE_VERSION);
    } else if (stored && stored.length > 0) {
      try {
        const parsed = JSON.parse(stored);
        // Check if cached data includes 2013 data (cache invalidation)
        // Must have data from Aug 2013 (investment partnership start) and be 200+ records
        const has2013Data = parsed.some((d: FinancialData) =>
          d.date?.includes('2013') || d.date?.includes('Aug 8, 2013')
        );
        if (has2013Data && parsed.length >= 200) {
          return parsed;
        }
        // Clear outdated cache - missing historical data
        console.log('Clearing outdated cache - missing 2013-2020 historical data');
        localStorage.removeItem("financialData");
      } catch {
        localStorage.removeItem("financialData");
      }
    }
  }
  // Build from embedded CSV
  const parsed = parseCsv(embeddedCsv);
  return parsed;
})();

export const addTodayData = (latestPrice: number, sp500: number) => {
  const today = new Date();
  const formattedToday = today.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  // Normalize Snobol price based on baseline of $1 (Aug 8, 2013)
  const snobolBaseline = 1;
  const normalizedSnobol = latestPrice / snobolBaseline;

  const withoutToday = financialData.filter(d => d.date !== formattedToday);
  const updatedData: FinancialData[] = [
    ...withoutToday,
    { date: formattedToday, snobol: normalizedSnobol, sp500: sp500 }
  ];

  if (typeof window !== 'undefined') {
    localStorage.setItem("financialData", JSON.stringify(updatedData));
    localStorage.setItem("financialDataVersion", CACHE_VERSION);
  }
  return updatedData;
};

export const checkAndRecordYearlyData = (latestPrice: number, sp500: number) => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const expectedDate = `Dec 31, ${currentYear - 1}`;

  const alreadyRecorded = financialData.some(d => d.date === expectedDate);

  if (today.getMonth() === 0 && today.getDate() === 1 && !alreadyRecorded) {
    // Normalize Snobol price based on baseline of $1 (Aug 8, 2013)
    const snobolBaseline = 1;
    const normalizedSnobol = latestPrice / snobolBaseline;

    const yearEndEntry = {
      date: expectedDate,
      snobol: normalizedSnobol,
      sp500: sp500
    };
    const updatedData = [...financialData, yearEndEntry];
    if (typeof window !== 'undefined') {
      localStorage.setItem("financialData", JSON.stringify(updatedData));
      localStorage.setItem("financialDataVersion", CACHE_VERSION);
    }
    return updatedData;
  }
  return financialData;
};

export const formatAreaChartData = (): ChartData[] => {
  // Snobol baseline is $1 (Aug 8, 2013)
  const snobolBaseline = 1;
  // S&P 500 baseline is $1697.48 (Aug 8, 2013)
  const sp500Baseline = 1697.48;

  return financialData.map(item => {
    // Calculate actual prices from normalized values
    const actualSp500 = item.sp500 * sp500Baseline;
    const actualSnobol = item.snobol * snobolBaseline;

    return {
      date: item.date,                  // Use full date for per-point hover
      fullDate: item.date,
      sp500: actualSp500 / sp500Baseline,  // Normalized S&P 500 for chart line
      snobol: item.snobol,                  // Normalized Snobol growth
      totalSnobol: item.snobol,             // Same as snobol for chart display
      actualSp500: actualSp500,             // Actual S&P 500 price for tooltip
      actualSnobol: actualSnobol            // Actual Snobol price for tooltip
    };
  });
};

export const getYAxisDomain = () => {
  const maxValue = Math.max(...financialData.map(item => item.snobol), 20);
  return [0, Math.ceil(maxValue)];
};

// Helper to format chart data for period-filtered server payloads
export const formatAreaChartDataForPeriod = (
  updatedData: { date: string; sp500: number; snobol: number }[],
  actualSp500?: number,
  actualSnobol?: number
): ChartData[] => {
  const sp500Baseline = 1697.48;
  const snobolBaseline = 1;
  return updatedData.map((item, index) => {
    const year = item.date.split(", ")[1] || item.date;
    const isLatest = index === updatedData.length - 1;
    const aSp500 = isLatest && actualSp500 ? actualSp500 : item.sp500 * sp500Baseline;
    const aSnobol = isLatest && typeof actualSnobol === 'number' ? actualSnobol : item.snobol * snobolBaseline;
    return {
      date: year,
      fullDate: item.date,
      sp500: aSp500 / sp500Baseline,
      snobol: aSnobol / snobolBaseline,
      totalSnobol: aSnobol / snobolBaseline,
      actualSp500: aSp500,
      actualSnobol: aSnobol
    };
  });
};

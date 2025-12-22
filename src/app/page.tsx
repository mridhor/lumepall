"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ArrowRight, Loader2, X, Play } from "lucide-react";
import {
  LineChart,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine
} from "recharts";
import { formatAreaChartData, type ChartData } from "@/utils/chartData";
import Image from "next/image";
import Link from "next/link";
import snobolLogo from "./lumepall.png";

// Currency exchange rate (approximate EUR to USD)
const EUR_TO_USD = 1.08;

// Media item interface for CMS
interface MediaItem {
  id: string;
  title: string;
  description?: string;
  type: 'video' | 'article';
  thumbnail_url?: string;
  image_url?: string;
  video_url?: string;
  article_url?: string;
  slug?: string;
  published_at: string;
}

// Price Graph Component with light gray 2021 divider
interface PriceGraphProps {
  currentPrice?: number;
  showDivider?: boolean;
}

const PriceGraph = React.memo(function PriceGraph({ currentPrice = 0, showDivider = true }: PriceGraphProps) {
  const [chartData, setChartData] = useState<ChartData[]>(() => {
    return formatAreaChartData()
  });
  const [hasAnimated, setHasAnimated] = useState(false);

  // Mark animation as complete after initial render
  useEffect(() => {
    const timer = setTimeout(() => setHasAnimated(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Find the index where 2021 starts (fund begins)
  const dividerIndex = useMemo(() => {
    return chartData.findIndex(item => item.fullDate?.includes('2021') && !item.fullDate?.includes('2020'));
  }, [chartData]);

  const dividerDate = useMemo(() => {
    if (dividerIndex >= 0 && chartData[dividerIndex]) {
      return chartData[dividerIndex].date;
    }
    return null;
  }, [chartData, dividerIndex]);

  useEffect(() => {
    let isMounted = true;

    const fetchPrices = async () => {
      try {
        const [sp500Response, priceResponse] = await Promise.all([
          fetch('/api/sp500-price'),
          fetch('/api/price')
        ]);

        const [sp500Data, priceData] = await Promise.all([
          sp500Response.json(),
          priceResponse.json()
        ]);

        const sp500Baseline = 1697.48;

        const updatedFormattedData = sp500Data.updatedData.map((item: { date: string; sp500: number; snobol: number }, index: number) => {
          const isLatestPoint = index === sp500Data.updatedData.length - 1;
          const actualSp500 = isLatestPoint ? sp500Data.actualPrice : (item.sp500 * sp500Baseline);
          const actualSnobol = item.snobol;

          return {
            date: item.date,
            fullDate: item.date,
            sp500: actualSp500 / sp500Baseline,
            snobol: actualSnobol,
            totalSnobol: actualSnobol,
            actualSp500: actualSp500,
            actualSnobol: actualSnobol
          };
        });

        if (isMounted) {
          // Override the last point with the current dynamic price ONLY if valid
          if (updatedFormattedData.length > 0 && currentPrice > 0) {
            const lastIdx = updatedFormattedData.length - 1;
            updatedFormattedData[lastIdx] = {
              ...updatedFormattedData[lastIdx],
              snobol: currentPrice,
              totalSnobol: currentPrice,
              actualSnobol: currentPrice
            };
          }
          setChartData(updatedFormattedData);
        }
      } catch (error) {
        console.error('Failed to fetch prices:', error);
        if (isMounted) {
          setChartData(prev => {
            if (!prev || prev.length === 0) return prev;
            const lastIdx = prev.length - 1;
            const updated = [...prev];
            updated[lastIdx] = {
              ...updated[lastIdx],
              snobol: currentPrice,
              totalSnobol: currentPrice,
              actualSnobol: currentPrice
            };
            return updated;
          });
        }
      }
    };

    fetchPrices();

    const channel = new BroadcastChannel('price-updates');
    channel.onmessage = (event) => {
      if (event.data === 'price-changed') {
        fetchPrices();
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'priceUpdate') {
        fetchPrices();
      }
    };

    const handlePriceUpdate = () => {
      fetchPrices();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('priceUpdated', handlePriceUpdate);

    return () => {
      isMounted = false;
      channel.close();
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('priceUpdated', handlePriceUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount, and listen for admin price update events

  // Update chart data when currentPrice prop changes
  useEffect(() => {
    if (currentPrice <= 0) return; // Don't update chart with 0 price

    setChartData(prev => {
      if (!prev || prev.length === 0) return prev;
      const lastIdx = prev.length - 1;
      const updated = [...prev];
      updated[lastIdx] = {
        ...updated[lastIdx],
        snobol: currentPrice,
        totalSnobol: currentPrice,
        actualSnobol: currentPrice
      };
      return updated;
    });
  }, [currentPrice]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="text-2xl md:text-3xl mb-2 text-right flex justify-end" style={{ fontFamily: 'Avenir Light', fontWeight: 300, height: '32px' }}>
        {currentPrice > 0 ? (
          `€${currentPrice.toFixed(3)}`
        ) : (
          <div className="h-6 w-24 bg-gray-100 animate-pulse rounded"></div>
        )}
      </div>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
          >
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={false}
              hide
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={false}
              hide />
            {/* Light gray vertical divider at 2021 transition */}
            {dividerDate && (
              <ReferenceLine
                x={dividerDate}
                stroke="#d1d5db"
                strokeWidth={1}
                strokeDasharray="none"
              />
            )}
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  const isLatestPoint = data === chartData[chartData.length - 1];
                  const displayDate = isLatestPoint ?
                    new Date().toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    }) : data.fullDate;

                  return (
                    <div className="bg-white p-3 rounded shadow-sm border text-sm min-w-[200px]">
                      <p className="text-gray-600 font-medium mb-2">{displayDate}</p>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-700">Lumepall:</span>
                          <span className="font-semibold">{data.actualSnobol?.toFixed(2)} EUR</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="totalSnobol"
              fill="#D1D2D3"
              stroke="none"
              isAnimationActive={!hasAnimated}
              animationDuration={1000}
            />
            <Line
              type="monotone"
              dataKey="totalSnobol"
              stroke="#000000"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4.5, fill: "white", stroke: "black", strokeWidth: 3.1 }}
              isAnimationActive={!hasAnimated}
              animationDuration={1000}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

// Fund Assets Graph Component - Shows total fund assets with real-time silver price updates
interface ValueGraphProps {
  currency: 'EUR' | 'USD';
}

interface FundAssetData {
  date: string;
  total_assets: number;
}

const ValueGraph = React.memo(function ValueGraph({ currency }: ValueGraphProps) {
  const [historicalAssets, setHistoricalAssets] = useState<FundAssetData[]>([]);
  const [currentFundValue, setCurrentFundValue] = useState<number>(718); // Current value in thousands
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  // Mark animation as complete after initial render
  useEffect(() => {
    const timer = setTimeout(() => setHasAnimated(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch historical data once
  useEffect(() => {
    const fetchHistoricalData = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/fund-assets');
        const data = await response.json();

        if (data.success && data.fundAssets) {
          // Ensure data is sorted chronologically
          const sortedAssets = [...data.fundAssets].sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return dateA - dateB;
          });
          setHistoricalAssets(sortedAssets);
        }
      } catch (error) {
        console.error('Failed to load historical fund assets data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistoricalData();
  }, []);

  // Real-time fund value updates based on silver price (updates every 30 seconds)
  useEffect(() => {
    let updateInterval: NodeJS.Timeout | null = null;

    const updateFundValue = async () => {
      try {
        // Fetch fund parameters and silver price
        const [paramsRes, silverRes] = await Promise.all([
          fetch('/api/fund-params'),
          fetch('/api/silver-price'),
        ]);

        const [paramsData, silverData] = await Promise.all([
          paramsRes.json(),
          silverRes.json(),
        ]);

        if (paramsData.success && silverData.success) {
          const baseFundValue = paramsData.base_fund_value;
          const silverTroyOunces = paramsData.silver_troy_ounces;
          const silverPriceUSD = silverData.silverPrice;

          // Calculate silver value in EUR
          const silverValueUSD = silverTroyOunces * silverPriceUSD;
          const silverValueEUR = silverValueUSD / EUR_TO_USD;

          // Total fund value in EUR
          const totalValueEUR = baseFundValue + silverValueEUR;

          // Convert to thousands
          const totalValueThousands = totalValueEUR / 1000;

          setCurrentFundValue(totalValueThousands);
        }
      } catch (error) {
        console.error('Failed to update fund value:', error);
      }
    };

    // Initial update
    updateFundValue();

    // Update every 30 seconds
    updateInterval = setInterval(updateFundValue, 30000);

    return () => {
      if (updateInterval) {
        clearInterval(updateInterval);
      }
    };
  }, []);

  // Combine historical data with current live value
  const displayData = useMemo(() => {
    const data = [...historicalAssets];

    // Add current live value as the latest data point
    if (currentFundValue > 0) {
      const today = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      data.push({
        date: today,
        total_assets: currentFundValue,
      });
    }

    // Convert to selected currency
    if (currency === 'USD') {
      return data.map(item => ({
        ...item,
        total_assets: item.total_assets * EUR_TO_USD
      }));
    }
    return data;
  }, [historicalAssets, currentFundValue, currency]);

  const currencySymbol = currency === 'EUR' ? '€' : '$';
  const latestValue = displayData[displayData.length - 1]?.total_assets ?? 0;

  // Calculate Y-axis domain based on data
  const maxValue = Math.max(...displayData.map(d => d.total_assets), 0);
  const yAxisMax = Math.ceil(maxValue / 100) * 100 + 100;

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="text-2xl md:text-3xl mb-[30px]" style={{ fontFamily: 'Avenir Light', fontWeight: 300 }}>
        {currencySymbol}{latestValue.toFixed(0)}k
      </div>
      <div className="flex-1 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={displayData}
            margin={{ top: 5, right: 10, left: 0, bottom: 20 }}
          >
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: isMobile ? 10 : 11, fill: '#6b7280', fontWeight: 500 }}
              ticks={(() => {
                // Use index-based distribution for even spacing
                const tickCount = isMobile ? 5 : 10;
                const step = Math.floor(displayData.length / tickCount);
                const yearTicks: string[] = [];
                for (let i = 0; i < tickCount; i++) {
                  const index = i * step;
                  if (displayData[index]) {
                    yearTicks.push(displayData[index].date);
                  }
                }
                // Always include the last data point
                if (displayData.length > 0) {
                  yearTicks.push(displayData[displayData.length - 1].date);
                }
                return yearTicks;
              })()}
              tickFormatter={(value) => {
                const match = value.match(/\d{4}/);
                if (!match) return value;
                return isMobile ? `'${match[0].slice(2)}` : match[0];
              }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: isMobile ? 9 : 11, fill: '#6b7280', fontWeight: 500 }}
              tickFormatter={(value) => `${currencySymbol}${value}k`}
              width={isMobile ? 40 : 50}
              domain={[0, yAxisMax]}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as FundAssetData;
                  return (
                    <div className="bg-white p-3 rounded shadow-sm border text-sm min-w-[180px]">
                      <p className="text-gray-600 font-medium mb-2">{data.date}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-700">Total Assets:</span>
                        <span className="font-semibold">{currencySymbol}{data.total_assets.toFixed(0)}k</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="total_assets"
              fill="#000000"
              stroke="none"
              baseValue={0}
              isAnimationActive={!hasAnimated}
              animationDuration={1000}
            />
            <Line
              type="monotone"
              dataKey="total_assets"
              stroke="#000000"
              strokeOpacity={0}
              strokeWidth={1}
              dot={false}
              activeDot={{ r: 4.5, fill: "white", stroke: "black", strokeWidth: 3.1 }}
              isAnimationActive={!hasAnimated}
              animationDuration={1000}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

// Media Card Component
interface MediaCardProps {
  item: MediaItem;
}

const MediaCard = ({ item }: MediaCardProps) => {
  // Use image_url as fallback for thumbnail_url
  const imageUrl = item.image_url || item.thumbnail_url;

  // For articles with slug, use internal routing
  if (item.type === 'article' && item.slug) {
    return (
      <Link href={`/article/${item.slug}`} className="block">
        <div className="relative cursor-pointer group overflow-hidden rounded-lg bg-gray-100">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={item.title}
              className="w-full h-40 object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-40 bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400 text-sm">No thumbnail</span>
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-black via-black/60 to-transparent p-3 flex items-end">
            <p className="text-white text-sm font-medium line-clamp-2 drop-shadow-lg">{item.title}</p>
          </div>
        </div>
      </Link>
    );
  }

  // For videos and external articles, use click handler
  const handleClick = () => {
    if (item.type === 'video' && item.video_url) {
      window.open(item.video_url, '_blank');
    } else if (item.type === 'article' && item.article_url) {
      window.open(item.article_url, '_blank');
    }
  };

  return (
    <div
      className="relative cursor-pointer group overflow-hidden rounded-lg bg-gray-100"
      onClick={handleClick}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={item.title}
          className="w-full h-40 object-cover transition-transform group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-40 bg-gray-200 flex items-center justify-center">
          <span className="text-gray-400 text-sm">No thumbnail</span>
        </div>
      )}
      {item.type === 'video' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 bg-black/70 rounded-full flex items-center justify-center group-hover:bg-black/90 transition-colors">
            <Play className="w-5 h-5 text-white ml-1" fill="white" />
          </div>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-black via-black/60 to-transparent p-3 flex flex-col justify-end">
        <p className="text-white text-sm font-medium line-clamp-2 drop-shadow-lg">{item.title}</p>
        {item.description && (
          <p className="text-white/70 text-xs line-clamp-2 mt-1 drop-shadow-md">{item.description}</p>
        )}
      </div>
    </div>
  );
};

// Placeholder Media Items (shown when Supabase table is empty)
const placeholderMedia: MediaItem[] = [
  {
    id: '1',
    title: 'WOWW UNIKAALSUS',
    type: 'article',
    image_url: '/placeholder-video-1.jpg',
    video_url: '#',
    published_at: new Date().toISOString()
  },
  {
    id: '2',
    title: 'WOWW UNIKAALSUS',
    type: 'article',
    image_url: '/placeholder-video-2.jpg',
    video_url: '#',
    published_at: new Date().toISOString()
  },
  {
    id: '3',
    title: 'WOWW UNIKAALSUS',
    type: 'article',
    image_url: '/placeholder-video-3.jpg',
    video_url: '#',
    published_at: new Date().toISOString()
  },
  {
    id: '4',
    title: 'WOWW UNIKAALSUS',
    type: 'article',
    image_url: '/placeholder-video-4.jpg',
    video_url: '#',
    published_at: new Date().toISOString()
  }
];

export default function Homepage() {
  const [emailError, setEmailError] = useState(false);
  const [priceData, setPriceData] = useState({ currentPrice: 0, currentSP500Price: 3.30 });
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [emailValue, setEmailValue] = useState('');
  const [valueCurrency, setValueCurrency] = useState<'EUR' | 'USD'>('EUR');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);

  // Fetch price data with real-time updates (updates every 30 seconds)
  useEffect(() => {
    const fetchPriceData = async () => {
      try {
        const response = await fetch('/api/share-price', { cache: 'no-store' });
        const data = await response.json();
        if (data.success && data.sharePrice) {
          setPriceData({
            currentPrice: data.sharePrice,
            currentSP500Price: 3.30, // Keep default SP500 price
          });
        }
      } catch (error) {
        console.error('Failed to fetch price data:', error);
      }
    };

    // Initial fetch
    fetchPriceData();

    // Update every 30 seconds
    const interval = setInterval(fetchPriceData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch media items from Supabase
  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const response = await fetch('/api/media');
        const data = await response.json();
        if (data.media && data.media.length > 0) {
          setMediaItems(data.media);
        } else {
          setMediaItems(placeholderMedia);
        }
      } catch (error) {
        console.error('Failed to fetch media:', error);
        setMediaItems(placeholderMedia);
      }
    };

    fetchMedia();
  }, []);

  const handleCloseSent = () => {
    setIsSent(false);
    setErrorMessage('');
    setEmailError(false);
    setIsSuccess(false);
    setEmailValue('');
    setIsEmailValid(false);

    const input = document.querySelector('.email-input') as HTMLInputElement;
    if (input) {
      input.value = '';
      const wrapper = input.closest('.email-wrapper') as HTMLElement;
      if (wrapper) {
        wrapper.style.width = '';
        wrapper.style.minWidth = '';
      }
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0, 61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0, 61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2, 63}$/;

    if (!emailRegex.test(email)) {
      return false;
    }

    const domain = email.split('@')[1];
    const domainParts = domain.split('.');

    if (domain.endsWith('.co')) {
      if (domainParts.length === 2 && domainParts[1] === 'co') {
        return false;
      }

      if (domainParts.length >= 3 && domainParts[domainParts.length - 2] === 'co') {
        const countryCode = domainParts[domainParts.length - 1];
        if (!/^[a-zA-Z]{2, 10}$/.test(countryCode)) {
          return false;
        }
      }
    }

    if (domainParts.length < 2) {
      return false;
    }

    const tld = domainParts[domainParts.length - 1];
    if (tld.length < 2 || !/^[a-zA-Z]+$/.test(tld)) {
      return false;
    }

    for (let i = 0; i < domainParts.length - 1; i++) {
      const part = domainParts[i];
      if (part.length === 0 || part.startsWith('-') || part.endsWith('-') || part.includes('..')) {
        return false;
      }
    }

    return true;
  };

  const handleEmailSubmit = async (email: string) => {
    if (!email || !validateEmail(email)) {
      setEmailError(true);
      setErrorMessage(' ');

      const input = document.querySelector('.email-input') as HTMLInputElement;
      if (input) {
        const wrapper = input.closest('.email-wrapper') as HTMLElement;
        if (wrapper) {
          const currentWidth = wrapper.offsetWidth;
          wrapper.style.width = `${currentWidth}px`;
          wrapper.style.minWidth = `${currentWidth}px`;
        }
      }

      return;
    }

    setEmailError(false);
    setErrorMessage('');
    setIsEmailLoading(true);

    const input = document.querySelector('.email-input') as HTMLInputElement;
    if (input) {
      const wrapper = input.closest('.email-wrapper') as HTMLElement;
      if (wrapper) {
        const currentWidth = wrapper.offsetWidth;
        wrapper.style.width = `${currentWidth}px`;
        wrapper.style.minWidth = `${currentWidth}px`;
        wrapper.classList.add('loading');
      }
    }

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (response.ok) {
        setEmailValue('');
        setIsEmailValid(false);
        setEmailError(false);
        setErrorMessage('');
        setIsSuccess(false);
        setIsSent(true);

        const wrapper = input?.closest('.email-wrapper') as HTMLElement;
        if (wrapper) {
          const currentWidth = wrapper.offsetWidth;
          wrapper.style.width = `${currentWidth}px`;
          wrapper.style.minWidth = `${currentWidth}px`;
        }
      } else {
        setEmailError(true);
        setErrorMessage(result.error || 'Something went wrong. Please try again.');

        if (input) {
          const wrapper = input.closest('.email-wrapper') as HTMLElement;
          if (wrapper) {
            const currentWidth = wrapper.offsetWidth;
            wrapper.style.width = `${currentWidth}px`;
            wrapper.style.minWidth = `${currentWidth}px`;
          }
        }
      }
    } catch (error) {
      console.error('Subscription error:', error);
      setEmailError(true);
      setErrorMessage('Something went wrong. Please try again.');

      const input = document.querySelector('.email-input') as HTMLInputElement;
      if (input) {
        const wrapper = input.closest('.email-wrapper') as HTMLElement;
        if (wrapper) {
          const currentWidth = wrapper.offsetWidth;
          wrapper.style.width = `${currentWidth}px`;
          wrapper.style.minWidth = `${currentWidth}px`;
        }
      }
    } finally {
      setIsEmailLoading(false);

      const wrapper = input?.closest('.email-wrapper') as HTMLElement;
      if (wrapper) {
        wrapper.classList.remove('loading');
        if (!isSent) {
          wrapper.style.width = '';
          wrapper.style.minWidth = '';
        }
      }
    }
  };

  return (
    <div className="bg-white min-h-screen flex flex-col" data-name="Homepage">
      {/* Header with Logo */}
      <div className="w-full flex justify-center px-4 md:px-12 lg:px-24 py-8">
        <div className="w-full max-w-6xl">
          <div className="flex gap-2 items-center justify-center opacity-85">
            <Image
              src={snobolLogo}
              alt="Lumepall"
              width={120}
              height={48}
              className="h-8 md:h-10 w-auto"
              priority
            />
          </div>
        </div>
      </div>

      {/* Main Content - 4 Equal Sections */}
      <div className="flex-1 px-4 sm:px-8 lg:px-16 pb-8">
        <div className="max-w-6xl mx-auto">

          {/* SECTION 1: Price Graph */}
          <section className="mb-16">
            <div className="mb-4">
              <p className="text-xl md:text-2xl lg:text-3xl text-black mb-2" style={{ fontFamily: 'Avenir Light', fontWeight: 300 }}>
                Building a world where AI invests money better than any human can.
              </p>
              <p className="text-lg md:text-xl text-gray-600" style={{ fontFamily: 'Avenir Light', fontWeight: 300 }}>
                Lumepall invests in global crises.
              </p>
            </div>
            <div className="h-[250px] md:h-[300px]">
              <PriceGraph currentPrice={priceData.currentPrice} showDivider={true} />
            </div>
          </section>

          {/* SECTION 2: Manifesto */}
          <section className="mb-16">
            <h2 className="manifesto-title">
              MANIFESTO
            </h2>

            <div className="manifesto-content">
              <div className="manifesto-item">
                <span className="manifesto-prefix">#1</span>
                <span className="manifesto-text">Economic inequality is greater than ever.</span>
              </div>

              <div className="manifesto-item">
                <span className="manifesto-prefix">#2</span>
                <span className="manifesto-text">Yet more than ever, ordinary people can reach financial freedom — by starting the right habits early, even at 10 or 12, and becoming free in their 20s or 30s.</span>
              </div>

              <div className="manifesto-item">
                <span className="manifesto-prefix">#3</span>
                <span className="manifesto-text">Since 2013, Lumepall Research Lead Kristian Kuutok has built contrarian investment algorithm outperforming traditional investing — first in a partnership, later through an investment fund from 2021. The full track record is shown in the graph.</span>
              </div>

              <div className="manifesto-item">
                <span className="manifesto-prefix">#4</span>
                <span className="manifesto-text">Lumepall&apos;s mission is to build an AI Fund Manager that consistently outperforms the markets by investing through crises, not avoiding them.</span>
              </div>

              <div className="manifesto-item">
                <span className="manifesto-prefix">#5</span>
                <span className="manifesto-text">The next contrarian star investor will not be human — it will be AI.</span>
              </div>

              <div className="manifesto-item">
                <span className="manifesto-prefix">#6</span>
                <span className="manifesto-text">Financial freedom is one of the deepest sources of happiness and optimism.</span>
              </div>

              <div className="manifesto-item">
                <span className="manifesto-prefix">#7</span>
                <span className="manifesto-text">Our initiative is guided by Nordic values. The word &quot;snøbol&quot; means snowball in Old Swedish — a symbol of quiet, steady growth.</span>
              </div>
            </div>

            <div className="signature-section">
              <p className="signature-name">Kristian J. Kuutok</p>
              <p className="signature-date">October 2025, Alaskan Way — Seattle, WA</p>
            </div>
          </section>

          {/* SECTION 3: Fund Total Assets Graph with Dual Currency */}
          <section className="mb-16">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-3 md:gap-0">
              <h2 className="text-xl md:text-2xl text-black" style={{ fontFamily: 'Avenir Light', fontWeight: 300 }}>
                Value development since the first investment</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setValueCurrency('EUR')}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${valueCurrency === 'EUR'
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  style={{ fontFamily: 'Avenir Light', fontWeight: 300 }}
                >
                  Kroner
                </button>
                <button
                  onClick={() => setValueCurrency('USD')}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${valueCurrency === 'USD'
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  style={{ fontFamily: 'Avenir Light', fontWeight: 300 }}
                >
                  Dollar
                </button>
              </div>
            </div>
            <div className="h-[300px] md:h-[350px]">
              <ValueGraph currency={valueCurrency} />
            </div>
          </section>

          {/* SECTION 4: Media */}
          <section className="mb-16">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {mediaItems.slice(0, 4).map((item) => (
                <MediaCard key={item.id} item={item} />
              ))}
            </div>
          </section>

          {/* Email Signup */}
          <div className="flex flex-col items-center mb-8 gap-2">
            <div className="text-center flex flex-col sm:flex-row items-center gap-1.5">
              <p className="text-lg" style={{ fontFamily: 'Avenir Light', fontWeight: 300 }}>
                Hangi Lumepalli investeerimisnõuanded
              </p>
              <div className="flex justify-center items-center">
                <div className="flex items-center gap-2">
                  <div className={`email-wrapper ${emailError ? 'error' : ''} ${isSuccess ? 'success' : ''} ${isSent ? 'sent' : ''}`}>
                    <div className="email-pill">
                      {isSent ? (
                        <div className="email-sent-content gap-1">
                          <span className="email-sent-text">Esitatud! Aitäh!</span>
                          <button
                            type="button"
                            className="email-close-btn"
                            onClick={handleCloseSent}
                            aria-label="Close"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <input
                          type="email"
                          placeholder="Sisesta e-post"
                          className="email-input"
                          ref={(input) => {
                            if (input) {
                              const span = document.createElement('span');
                              span.style.visibility = 'hidden';
                              span.style.position = 'absolute';
                              span.style.whiteSpace = 'nowrap';
                              span.style.fontSize = '13px';
                              span.style.fontFamily = getComputedStyle(input).fontFamily;
                              span.textContent = 'Sisesta e-post';
                              document.body.appendChild(span);

                              const placeholderWidth = span.offsetWidth + 6;
                              input.style.width = `${placeholderWidth}px`;
                              input.style.minWidth = `${placeholderWidth}px`;

                              (input as HTMLInputElement & { _placeholderWidth?: number })._placeholderWidth = placeholderWidth;

                              const wrapper = input.closest('.email-wrapper') as HTMLElement;
                              if (wrapper) {
                                const wrapperMinWidth = placeholderWidth + 24;
                                wrapper.style.minWidth = `${wrapperMinWidth}px`;
                                (wrapper as HTMLElement & { _minWidth?: number })._minWidth = wrapperMinWidth;
                              }

                              document.body.removeChild(span);
                            }
                          }}
                          onInput={(e) => {
                            const input = e.target as HTMLInputElement;
                            const placeholderWidth = (input as HTMLInputElement & { _placeholderWidth?: number })._placeholderWidth;
                            const email = input.value;

                            setEmailValue(email);
                            setIsEmailValid(validateEmail(email));

                            if (emailError) {
                              setEmailError(false);
                              setErrorMessage('');

                              const wrapper = input.closest('.email-wrapper') as HTMLElement;
                              if (wrapper) {
                                wrapper.style.width = '';
                                wrapper.style.minWidth = '';
                              }
                            }
                            if (isSuccess) {
                              setIsSuccess(false);
                            }
                            if (isSent) {
                              setIsSent(false);
                            }

                            setTimeout(() => {
                              const wrapper = input.closest('.email-wrapper') as HTMLElement;
                              const wrapperMinWidth = (wrapper as HTMLElement & { _minWidth?: number })?._minWidth;

                              if (input.value.length > 0) {
                                const span = document.createElement('span');
                                span.style.visibility = 'hidden';
                                span.style.position = 'absolute';
                                span.style.whiteSpace = 'nowrap';
                                span.style.fontSize = '13px';
                                span.style.fontFamily = getComputedStyle(input).fontFamily;
                                span.style.fontWeight = getComputedStyle(input).fontWeight;
                                span.style.letterSpacing = getComputedStyle(input).letterSpacing;
                                span.style.padding = '0';
                                span.style.margin = '0';
                                span.style.border = 'none';
                                span.textContent = input.value;
                                document.body.appendChild(span);

                                const textWidth = span.offsetWidth;
                                const finalWidth = Math.max(textWidth + 30, placeholderWidth || 100);

                                input.style.width = `${finalWidth}px`;
                                input.style.minWidth = `${placeholderWidth || 100}px`;

                                if (wrapper && wrapperMinWidth) {
                                  const newWrapperWidth = finalWidth + 24;
                                  wrapper.style.minWidth = `${Math.max(newWrapperWidth, wrapperMinWidth)}px`;
                                }

                                document.body.removeChild(span);
                              } else {
                                input.style.width = `${placeholderWidth || 100}px`;
                                input.style.minWidth = `${placeholderWidth || 100}px`;

                                if (wrapper && wrapperMinWidth) {
                                  wrapper.style.minWidth = `${wrapperMinWidth}px`;
                                }
                              }
                            }, 0);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const input = e.target as HTMLInputElement;
                              const email = input.value.trim();
                              handleEmailSubmit(email);
                            }
                          }}
                        />
                      )}
                    </div>
                    {!isSent && isEmailValid && (
                      <button
                        type="button"
                        className={`email-submit-btn ${isEmailLoading ? 'loading' : ''}`}
                        onClick={() => !isEmailLoading && handleEmailSubmit(emailValue)}
                        disabled={isEmailLoading}
                      >
                        {isEmailLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ArrowRight className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <p className="text-sm" style={{ fontFamily: 'Avenir Light', fontWeight: 300 }}>
                Lahtiütlus: tegemist ei ole investeerimisnõuga.
              </p>
              {errorMessage && (
                <div className="absolute-y-4">
                  <div className={`email-error-message ${errorMessage ? 'show' : ''}`}>
                    {errorMessage}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-neutral-200">
        <div className="max-w-4xl mx-auto px-6 py-10 text-center">
          <div className="social-icons">
            <a href="https://instagram.com/" target="_blank" rel="noopener noreferrer" className="social-icon instagram">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
            <a href="https://youtube.com/" target="_blank" rel="noopener noreferrer" className="social-icon youtube">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </a>
            <a href="https://tiktok.com/" target="_blank" rel="noopener noreferrer" className="social-icon tiktok">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
              </svg>
            </a>
          </div>

          <p className="text-xs tracking-wide text-neutral-500 mt-4">LUMEPALL – HUMANITAARNE TEHISINTELLEKTI FONDIJUHT</p>
          <p className="mt-2 text-sm" style={{ fontFamily: 'Avenir Light', fontWeight: 300 }}>
            Kirjuta meile numbril +372 600 3355 või e-posti aadressil info@lumepall.ee
          </p>
          <p className="mt-6 text-xs text-neutral-500">©{new Date().getFullYear()} Blond Finance OÜ</p>
        </div>
      </footer>
    </div>
  );
}

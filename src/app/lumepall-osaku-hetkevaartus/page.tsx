"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip
} from "recharts";

type ChartDataPoint = {
  date: string;
  fullDate: string;
  sp500: number;
  totalSnobol: number;
  actualSp500?: number;
  actualSnobol?: number;
};

type PeriodKey = "1d" | "5d" | "7d" | "14d" | "1y" | "2y" | "5y";

const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: "1d", label: "1 päev" },
  { key: "5d", label: "5 päeva" },
  { key: "7d", label: "7 päeva" },
  { key: "14d", label: "14 päeva" },
  { key: "1y", label: "1 aasta" },
  { key: "2y", label: "2 aastat" },
  { key: "5y", label: "5 aastat" }
];

export default function LumepallOsakuHetkevaartusPage() {
  const [period, setPeriod] = useState<PeriodKey>("1y");
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(18.49);
  const [equity, setEquity] = useState<number | null>(null);
  const [exactValue, setExactValue] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const formattedTopValue = useMemo(() => {
    const val = currentPrice;
    return val.toFixed(2);
  }, [currentPrice]);

  const fetchData = async (selected: PeriodKey) => {
    setLoading(true);
    try {
      const [sp500Res, priceRes] = await Promise.all([
        fetch(`/api/sp500-price?period=${selected}`, { cache: "no-store" }),
        fetch(`/api/price?period=${selected}`, { cache: "no-store" })
      ]);

      const [sp500Data, priceData] = await Promise.all([
        sp500Res.json(),
        priceRes.json()
      ]);

      const sp500Baseline = sp500Data?.baselinePrice ?? 1697.48;
      const snobolBaseline = 1;

      const updatedFormatted = (sp500Data?.updatedData || []).map(
        (item: { date: string; sp500: number; snobol: number }, index: number) => {
          const year = item.date.split(", ")[1];
          const isLatest = index === (sp500Data?.updatedData?.length || 1) - 1;
          const actualSp500 = isLatest
            ? sp500Data.actualPrice
            : item.sp500 * sp500Baseline;
          const actualSnobol = isLatest
            ? priceData.currentPrice
            : item.snobol * snobolBaseline;
          return {
            date: year,
            fullDate: item.date,
            sp500: actualSp500 / sp500Baseline,
            totalSnobol: actualSnobol / snobolBaseline,
            actualSp500,
            actualSnobol
          } as ChartDataPoint;
        }
      );

      setChartData(updatedFormatted);
      setCurrentPrice(priceData.currentPrice ?? 18.49);
      setExactValue(priceData.exactValue ?? priceData.currentPrice ?? null);
      setEquity(priceData.totalEquity ?? null);
    } catch (e) {
      console.error("Failed to load page data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(period);
  }, [period]);

  return (
    <div className="bg-white min-h-screen flex flex-col px-4 sm:px-12 lg:px-30 pt-6">
      <div className="w-full max-w-6xl mx-auto">
        <div className="mb-6">
          <p className="leading-tight not-italic text-xl sm:text-xl md:text-2xl lg:text-3xl text-black mb-1" style={{ fontFamily: 'Avenir Light', fontWeight: 300 }}>
            Lumepall osaku hetkeväärtus
          </p>
          <div className="flex flex-wrap gap-4 items-baseline text-black" style={{ fontFamily: 'Avenir Light', fontWeight: 300 }}>
            <div className="text-2xl md:text-3xl">{formattedTopValue} EUR</div>
            {exactValue != null && (
              <div className="text-sm md:text-base text-gray-600">Osaku täpne väärtus: {exactValue.toFixed(4)} EUR</div>
            )}
            {equity != null && (
              <div className="text-sm md:text-base text-gray-600">Fondi omakapital: {equity.toLocaleString("et-EE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR</div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 mb-2">
          <label className="text-base md:text-lg text-black" style={{ fontFamily: 'Avenir Light', fontWeight: 300 }}>
            Vali periood
          </label>
          <select
            className="border border-gray-300 rounded-md px-3 py-1 text-sm md:text-base bg-white"
            value={period}
            onChange={(e) => setPeriod(e.target.value as PeriodKey)}
          >
            {PERIOD_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="w-full h-60 md:h-[40vh]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={false} hide />
              <YAxis axisLine={false} tickLine={false} tick={false} hide />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const first = payload[0];
                    const data = (first && 'payload' in first ? (first as { payload: ChartDataPoint }).payload : undefined);
                    if (!data) return null;
                    const isLatest = data === chartData[chartData.length - 1];
                    const displayDate = isLatest
                      ? new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : data.fullDate;
                    return (
                      <div className="bg-white p-3 rounded shadow-sm border text-sm min-w-[200px]">
                        <p className="text-gray-600 font-medium mb-2">{displayDate}</p>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-700">Snobol:</span>
                            <span className="font-semibold">${data.actualSnobol?.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line type="monotone" dataKey="sp500" stroke="#E5E5E5" strokeWidth={2} dot={false} activeDot={{ r: 3, fill: "transparent", stroke: "transparent" }} />
              <Line type="monotone" dataKey="totalSnobol" stroke="#000000" strokeWidth={2} dot={false} activeDot={{ r: 4.5, fill: "white", stroke: "black", strokeWidth: 3.1 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="text-sm mt-3" style={{ fontFamily: 'Avenir Light', fontWeight: 300 }}>
          Pane tähele, et mineviku tootlus ei garanteeri tulevast tootlust.
        </div>
      </div>
    </div>
  );
}



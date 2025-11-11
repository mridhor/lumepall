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
import Image from "next/image";
import Link from "next/link";
import snobolLogo from "./lumepall.png";
import { ChevronDown } from "lucide-react";

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
  const [currentPrice, setCurrentPrice] = useState<number>(1.7957);
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

      // Check if responses are ok before parsing JSON
      if (!sp500Res.ok) {
        throw new Error(`SP500 API error: ${sp500Res.status}`);
      }
      if (!priceRes.ok) {
        throw new Error(`Price API error: ${priceRes.status}`);
      }

      const [sp500Data, priceData] = await Promise.all([
        sp500Res.json(),
        priceRes.json()
      ]);

      const sp500Baseline = sp500Data?.baselinePrice ?? 1697.48;
      const snobolBaseline = 1;

      const updatedFormatted = (sp500Data?.updatedData || []).map(
        (item: { date: string; sp500: number; snobol: number }, index: number) => {
          const isLatest = index === (sp500Data?.updatedData?.length || 1) - 1;
          const actualSp500 = isLatest
            ? sp500Data.actualPrice
            : item.sp500 * sp500Baseline;
          const actualSnobol = isLatest
            ? (priceData.currentPrice ?? sp500Data.currentSnobolPrice ?? 1.7957)
            : item.snobol * snobolBaseline;
          return {
            date: item.date,
            fullDate: item.date,
            sp500: actualSp500 / sp500Baseline,
            totalSnobol: actualSnobol / snobolBaseline,
            actualSp500,
            actualSnobol
          } as ChartDataPoint;
        }
      );

      setChartData(updatedFormatted);
      // Use current price from price API, or fall back to SP500 API's currentSnobolPrice, or default
      const currentPriceValue = priceData.currentPrice ?? sp500Data.currentSnobolPrice ?? 1.7957;
      setCurrentPrice(currentPriceValue);
      setExactValue(priceData.exactValue ?? priceData.currentPrice ?? currentPriceValue);
      setEquity(priceData.totalEquity ?? null);
    } catch (e) {
      console.error("Failed to load page data", e);
      // Set fallback data if API fails
      setCurrentPrice(1.7957);
      setExactValue(null);
      setEquity(null);
      setChartData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(period);
  }, [period]);

  // Listen for price updates from admin panel
  useEffect(() => {
    const handlePriceUpdate = () => {
      console.log('Price update detected, refreshing data...');
      fetchData(period);
    };

    // Listen for BroadcastChannel messages
    const channel = new BroadcastChannel('price-updates');
    channel.addEventListener('message', (event) => {
      if (event.data === 'price-changed') {
        handlePriceUpdate();
      }
    });

    // Listen for localStorage changes (fallback)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'priceUpdate') {
        handlePriceUpdate();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Listen for custom events (fallback)
    window.addEventListener('priceUpdated', handlePriceUpdate);

    return () => {
      channel.close();
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('priceUpdated', handlePriceUpdate);
    };
  }, [period]);

  return (
    <div className="bg-white min-h-screen flex flex-col px-4 sm:px-12 lg:px-30 pb-20">
    {/* Snobol logo at the top */}
    <div className="w-full flex justify-center px-4 md:px-12 lg:px-24 py-12 md:py-8 sm:py-2 py-0" data-name="Header" data-node-id="1:154">
      <div className="w-full max-w-6xl">
        <div className="flex gap-2 items-center justify-center opacity-85">
        <Link href=".">
          <Image
            src={snobolLogo}
            alt="Snobol"
            width={120}
            height={48}
            className="h-8 md:h-10 w-auto"
            priority
          />
          </Link>
        </div>
      </div>
    </div>
      <div className="w-full max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row">
        <div className="w-full mb-6">
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
          

        {/* Live value pills like minimal chips */}
        <div className="mt-4 grid grid-rows-1 gap-2 sm:grid-rows-2 text-left">
          <div className="px-4 py-1"> <div className="rounded-full text-sm sm:text-nowrap"> 
            Osaku tänane väärtus: </div> <div className="font-bold text-md">1,79 EUR</div></div>

          <div className="px-4 py-1"> <div className="rounded-full text-sm sm:text-nowrap"> 
            Fondi omakapital: </div> <div className="font-bold text-md">2 141 434,13 EUR</div></div>
        </div>

        </div>
        

        <div className="flex items-center gap-3 mb-2">
  <label
    className="text-base md:text-lg text-black"
    style={{ fontFamily: "Avenir Light", fontWeight: 300 }}
  >
    Vali periood
  </label>

  <div className="relative">
    <select
      className="appearance-none border border-gray-300 bg-white text-black rounded-full px-5 py-2 pr-10 text-sm md:text-base focus:outline-none focus:ring-1 focus:ring-gray-400 transition-all cursor-pointer"
      value={period}
      onChange={(e) => setPeriod(e.target.value as PeriodKey)}
      style={{
        WebkitAppearance: "none",
        MozAppearance: "none",
      }}
    >
      {PERIOD_OPTIONS.map((opt) => (
        <option key={opt.key} value={opt.key}>
          {opt.label}
        </option>
      ))}
    </select>

    <ChevronDown
      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none w-4 h-4"
      aria-hidden="true"
    />
  </div>
</div>

        <div className="w-full h-60 md:h-[40vh]">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">Loading chart data...</div>
            </div>
          ) : (
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
                            <span className="text-gray-700">Lumepall:</span>
                            <span className="font-semibold">${data.actualSnobol?.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line type="monotone" dataKey="totalSnobol" stroke="#000000" strokeWidth={2} dot={false} activeDot={{ r: 4.5, fill: "white", stroke: "black", strokeWidth: 3.1 }} />
            </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="flex flex-col sm:flex-row">
        <div className="w-full text-sm mt-3" style={{ fontFamily: 'Avenir Light', fontWeight: 300 }}>
          Pane tähele, et mineviku tootlus ei garanteeri tulevast tootlust.
        </div>
        <div className="w-auto text-sm mt-3" style={{ fontFamily: 'Avenir Light', fontWeight: 300 }}>
        {/* Email capture, keep minimal like Snöbol, optional */}
        <form className="mt-6 sm:mt-0 flex gap-2" onSubmit={(e) => e.preventDefault()}>
          <input
            className="w-64 md:w-80 rounded-full border border-neutral-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-200"
            placeholder="Get Lumepall AI investment tips, insert email"
            type="email"
          />
          <button className="rounded-full border border-neutral-900 px-4 py-2 text-sm">Subscribe</button>
        </form>
        <p className="mt-2 text-[11px] text-neutral-500">Disclaimer, This is not investment advice.</p>
        </div>
        </div>

      {/* Divider with generous whitespace */}
      <div className="max-w-5xl mx-auto px-6 mt-16 mb-6 border-t border-neutral-200" />

      {/* Content sections, reuse OLD Lumepall content but laid out in the new aesthetic */}
      <div className="max-w-3xl mx-auto px-6 pb-6">
        <h2 className="text-xs tracking-[0.35em] text-neutral-500 text-center">SELgitused</h2>
        <h3 className="mt-2 text-center text-lg">Kuidas Lumepall aitab rahaliselt vabaks saada?</h3>
        <div className="mt-6 space-y-5 text-[15px] leading-7 text-neutral-800">
          <div className="flex gap-4">
            <div className="shrink-0 w-8 text-neutral-500">1.</div>
            <p>
              <span className="font-medium">Alustame S&P järgijatest,</span> investeerimine põhifondi tootlustest veelgi olulisem, see, kui järjepidev ollakse ning kui suurt süsteemsust tehakse. Sinikohal töötab Lumepall app ja aitame Sul jälgida regulaarseid panusi investeeringutesse.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="shrink-0 w-8 text-neutral-500">2.</div>
            <p>
              <span className="font-medium">Hakkad teenima nii väärilise kasu kui ka rentiivitulu,</span> iga Lumepall osak, mille ostad, annab Sulle osaluse fondis. Nõndel osadel Sa samas proportsioonis fondi kinnisvara omanik.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="shrink-0 w-8 text-neutral-500">3.</div>
            <p>
              <span className="font-medium">Usk turgude tootlusesse,</span> kui meil puuduvad õigussagedused haldustasudest, siis teeme võimalikult kõrget tootlust. Meie ühiselt kavandatud fondi toodete osal uskumatud odavad kestmistasud, näiteks kui mõniks S&P 500 indeksfondide tootlus, inflatsiooniliselt perioodidele, mida meie usume olevat lähitulevik, on kinnisvaralt oodatud keskmised veelgi suurem.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 pt-4 pb-20">
        <h3 className="text-center text-lg">Lumepall fondi sisu</h3>
        <ul className="mt-6 space-y-4 text-[15px] leading-7 text-neutral-800">
          <li className="pl-6 relative"><span className="absolute left-0 top-0">•</span> Alustamise hetkel, 1. aprill 2021, maksab üks Lumepall osak täpselt üks euro.</li>
          <li className="pl-6 relative"><span className="absolute left-0 top-0">•</span> Fond kuulub täielikult fondi partneritele, osakute omanikele, kui omad Lumepall osakuid, siis omad samas proportsioonis ka reaalselt kinnisvara.</li>
          <li className="pl-6 relative"><span className="absolute left-0 top-0">•</span> Fondi kogumaht tavaliselt on turuolukorras, kõrgem kui keskmine, ülaltoodud saavutused genereeritakse kinnisvaralt, väärtuvad vabadused ja hooned.</li>
          <li className="pl-6 relative"><span className="absolute left-0 top-0">•</span> Tulu teenitakse valdavalt kahest allikast, 1. Kinnisvara rent, 2. Kinnisvara väärtuse kasv.</li>
          <li className="pl-6 relative"><span className="absolute left-0 top-0">•</span> Partnerid saavutavad koond aastas 20, veebruaril deklareeritud fondi vabad tase ja ülekasvav dividendide vahendamine.</li>
          <li className="pl-6 relative"><span className="absolute left-0 top-0">•</span> Igapäevased haldustasud puuduvad, fondi erilisus seisneb selles, et operatiivrendi puuduvad.</li>
          <li className="pl-6 relative"><span className="absolute left-0 top-0">•</span> Fondivalitsemistasu ainult 10% aktsiastlikku eel fondi osalistele kasumilt. Seega kogu fondi investeeringu soodsaimalt ka haljumilt.</li>
          <li className="pl-6 relative"><span className="absolute left-0 top-0">•</span> Dividend ei maksta, kogu kasum investeeritakse pikema perioodi peale, kasvatades fondi mahtu ja Lumepall osaku väärtust.</li>
        </ul>
        </div>

      {/* Footer, white and minimal */}
      <footer className="border-t border-neutral-200">
        <div className="max-w-4xl mx-auto px-6 py-10 text-center">
          <p className="text-xs tracking-wide text-neutral-500">LUMEPALL – HUMANITAARNE TEHISINTELLEKTI FONDIJUHT</p>
          <p className="mt-2 text-sm">Kirjuta meile numbril +372 600 3355 või e-posti aadressil info@lumepall.ee</p>
          <div className="mt-6 flex items-center justify-center gap-4 text-neutral-600">
            <div className="manifesto-footer">
            {/* Social Media Icons */}
            <div className="social-icons">
              <a href="https://instagram.com/" target="_blank" rel="noopener noreferrer" className="social-icon instagram">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a href="https://youtube.com/" target="_blank" rel="noopener noreferrer" className="social-icon youtube">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
              <a href="https://tiktok.com/" target="_blank" rel="noopener noreferrer" className="social-icon tiktok">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                </svg>
            </a>
          </div>
          </div>
          </div>
          <p className="mt-6 text-xs text-neutral-500">©{new Date().getFullYear()} Blond Finance OÜ</p>
        </div>
      </footer>

    </div>
    </div>
  );
}



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

        <div className="text-sm mt-3" style={{ fontFamily: 'Avenir Light', fontWeight: 300 }}>
          Pane tähele, et mineviku tootlus ei garanteeri tulevast tootlust.
        </div>

        {/* Live value pills like minimal chips */}
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 text-center">
          <div className="px-4 py-1 rounded-full border border-neutral-200 text-sm">Osaku tänane väärtus, <span className="font-medium">1,79 EUR</span></div>
          <div className="px-4 py-1 rounded-full border border-neutral-200 text-sm">Fondi omakapital, <span className="font-medium">2 141 434,13 EUR</span></div>
        </div>

        {/* Email capture, keep minimal like Snöbol, optional */}
        <form className="mt-6 flex items-center gap-2" onSubmit={(e) => e.preventDefault()}>
          <input
            className="w-64 md:w-80 rounded-full border border-neutral-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-200"
            placeholder="Get Lumepall AI investment tips, insert email"
            type="email"
          />
          <button className="rounded-full border border-neutral-900 px-4 py-2 text-sm">Subscribe</button>
        </form>
        <p className="mt-2 text-[11px] text-neutral-500">Disclaimer, This is not investment advice.</p>

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
          <p className="text-xs tracking-wide text-neutral-500">LUMEPALL, HUMANITARIAN AI FUND MANAGER</p>
          <p className="mt-2 text-sm">Text us at +372 000 3355 or email info@lumepall.ee</p>
          <div className="mt-6 flex items-center justify-center gap-4 text-neutral-600">
            <a href="#" className="underline underline-offset-4">Instagram</a>
            <a href="#" className="underline underline-offset-4">LinkedIn</a>
            <a href="#" className="underline underline-offset-4">TikTok</a>
          </div>
          <p className="mt-6 text-xs text-neutral-500">© Lumepall Inc, 2025</p>
        </div>
      </footer>

    </div>
    </div>
  );
}



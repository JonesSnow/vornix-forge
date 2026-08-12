"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickData, Time, CandlestickSeries, LineSeries } from "lightweight-charts";
import { UserButton, useUser } from "@clerk/nextjs";
import { colors, STORAGE_KEYS } from "@/lib/constants";
import { navItems, levelCopy } from "@/lib/constants/content/dashboard-content";
import type { AssessmentStorage } from "@/lib/types";

const bg = colors.bg.primary;
const text = colors.text.primary;
const accent = colors.accent.primary;
const sidebarWidth = 280;

function getLevelFromScore(score: number) {
  if (score <= 40) return 1;
  if (score <= 60) return 2;
  if (score <= 80) return 3;
  return 4;
}

type Trade = {
  id: string;
  symbol: string;
  side: string;
  quantity: number;
  entryPrice: number;
  exitPrice?: number | null;
  stopLoss?: number | null;
  takeProfit?: number | null;
  status: string;
  pnl?: number | null;
  openedAt: string;
  closedAt?: string | null;
};

type Portfolio = {
  id: string;
  balance: number;
  trades?: Trade[];
  openPositions?: Trade[];
  tradeHistory?: Trade[];
};

type SimulatorClientProps = {
  userId: string;
};

const SYMBOLS = [
  { label: "RELIANCE.NS", value: "RELIANCE.NS" },
  { label: "TCS.NS", value: "TCS.NS" },
  { label: "BTC-USD", value: "BTC-USD" },
  { label: "ETH-USD", value: "ETH-USD" },
  { label: "EUR-USD", value: "EUR-USD" },
];

const FALLBACK_PRICES: Record<string, number> = {
  "RELIANCE.NS": 2850,
  "TCS.NS": 3950,
  "BTC-USD": 67000,
  "ETH-USD": 3500,
  "EUR-USD": 1.08,
};

function generateFallbackLineData(basePrice: number) {
  const data: { time: string; value: number }[] = [];
  const now = new Date();
  for (let i = 89; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const timeStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const variation = (Math.random() - 0.5) * basePrice * 0.05;
    data.push({ time: timeStr, value: basePrice + variation });
  }
  return data;
}

export default function SimulatorClient({ userId }: SimulatorClientProps) {
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [assessment, setAssessment] = useState<AssessmentStorage | null>(null);
  const [loading, setLoading] = useState(true);
  const [placingTrade, setPlacingTrade] = useState(false);
  const [tradeError, setTradeError] = useState<string | null>(null);
  const [tradeSuccess, setTradeSuccess] = useState<string | null>(null);
  const [chartError, setChartError] = useState<string | null>(null);

  const [symbol, setSymbol] = useState(SYMBOLS[0].value);
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [quantity, setQuantity] = useState("1");
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [limitPrice, setLimitPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const lineSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);

  useEffect(() => {
    const assessmentRaw = localStorage.getItem(STORAGE_KEYS.assessment);
    if (assessmentRaw) {
      try {
        setAssessment(JSON.parse(assessmentRaw) as AssessmentStorage);
      } catch {
        setAssessment(null);
      }
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    async function fetchPortfolio() {
      try {
        const res = await fetch("/api/simulator/portfolio");
        if (res.ok) {
          const data = await res.json();
          setPortfolio(data.portfolio);
        }
      } catch (e) {
        console.error("Failed to fetch portfolio:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchPortfolio();
  }, []);

  const refreshPortfolio = async () => {
    try {
      const res = await fetch("/api/simulator/portfolio");
      if (res.ok) {
        const data = await res.json();
        setPortfolio(data.portfolio);
      }
    } catch (e) {
      console.error("Failed to refresh portfolio:", e);
    }
  };

  useEffect(() => {
    if (!mounted) return;
    if (!chartContainerRef.current) return;

    let chart: any = null;
    let series: any = null;
    let lineSeries: any = null;

    try {
      chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: "#0F0F0F" },
          textColor: "#F2F0EB",
        },
        grid: {
          vertLines: { color: "#1E1E1E" },
          horzLines: { color: "#1E1E1E" },
        },
        crosshair: {
          mode: 1,
        },
        rightPriceScale: {
          borderColor: "#1E1E1E",
        },
        timeScale: {
          borderColor: "#1E1E1E",
          timeVisible: true,
          secondsVisible: false,
        },
      });

      series = chart.addSeries(CandlestickSeries, {
        upColor: "#4ade80",
        downColor: "#ef4444",
        borderUpColor: "#4ade80",
        borderDownColor: "#ef4444",
        wickUpColor: "#4ade80",
        wickDownColor: "#ef4444",
      });

      lineSeries = chart.addSeries(LineSeries, {
        color: accent,
        lineWidth: 2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
        crosshairMarkerBorderColor: accent,
        lastValueVisible: true,
        priceLineVisible: true,
      });

      chartRef.current = chart;
      seriesRef.current = series;
      lineSeriesRef.current = lineSeries;

      const handleResize = () => {
        if (chartContainerRef.current && chart) {
          chart.applyOptions({
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight || 400,
          });
        }
      };

      handleResize();
      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        if (chart) {
          chart.remove();
        }
      };
    } catch (e) {
      console.error("Chart initialization error:", e);
      setChartError("Failed to initialize chart");
    }
  }, [mounted]);

  useEffect(() => {
    async function fetchChartData() {
      if (!seriesRef.current || !lineSeriesRef.current) return;

      const fallbackPrice = FALLBACK_PRICES[symbol] ?? 100;

      try {
        let url = "";
        let timeSeriesKey = "";

        if (symbol === "RELIANCE.NS" || symbol === "TCS.NS") {
          const avSymbol = symbol.replace(".NS", ".BSE");
          url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${avSymbol}&apikey=demo`;
          timeSeriesKey = "Time Series (Daily)";
        } else if (symbol === "BTC-USD" || symbol === "ETH-USD") {
          const from = symbol.split("-")[0];
          url = `https://www.alphavantage.co/query?function=DIGITAL_CURRENCY_DAILY&symbol=${from}&market=USD&apikey=demo`;
          timeSeriesKey = "Time Series (Digital Currency Daily)";
        } else if (symbol === "EUR-USD") {
          url = `https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=EUR&to_symbol=USD&apikey=demo`;
          timeSeriesKey = "Time Series FX (Daily)";
        }

        if (!url) {
          throw new Error("No chart endpoint for symbol");
        }

        const res = await fetch(url);

        if (!res.ok) {
          throw new Error(`Alpha Vantage returned ${res.status}`);
        }

        const data = await res.json();
        const timeSeries = data?.[timeSeriesKey];

        if (!timeSeries || typeof timeSeries !== "object") {
          throw new Error("Missing time series data");
        }

        const entries = Object.entries(timeSeries).slice(0, 90);
        const candlestickData: CandlestickData<Time>[] = entries.map(([date, values]: [string, any]) => {
          const open = parseFloat(values["1. open"] ?? values["1a. open (USD)"] ?? "0");
          const high = parseFloat(values["2. high"] ?? values["2a. high (USD)"] ?? "0");
          const low = parseFloat(values["3. low"] ?? values["3a. low (USD)"] ?? "0");
          const close = parseFloat(values["4. close"] ?? values["4a. close (USD)"] ?? "0");

          return {
            time: date as Time,
            open,
            high,
            low,
            close,
          };
        });

        const validCandles = candlestickData.filter(
          (c) => Number.isFinite(c.open) && Number.isFinite(c.high) && Number.isFinite(c.low) && Number.isFinite(c.close)
        );

        if (validCandles.length === 0) {
          throw new Error("No valid candle data");
        }

        seriesRef.current.setData(validCandles);
        lineSeriesRef.current.setData([]);
        setChartError(null);
      } catch (e) {
        console.error(`Chart data fetch failed for ${symbol}, using fallback:`, e);
        setChartError(null);

        const fallbackData = generateFallbackLineData(fallbackPrice);
        seriesRef.current.setData([]);
        lineSeriesRef.current.setData(fallbackData);
      }
    }

    fetchChartData();
  }, [symbol]);

  const assessmentScore = assessment?.result?.score ?? assessment?.score ?? 0;
  const currentLevel = assessment?.result?.level ?? assessment?.level ?? getLevelFromScore(assessmentScore);

  const profileName = useMemo(() => {
    const email = user?.primaryEmailAddress?.emailAddress?.split("@")[0];
    return user?.fullName || user?.firstName || user?.username || email || "Signed-in user";
  }, [user]);

  const openTrades = useMemo(
    () => portfolio?.openPositions ?? [],
    [portfolio?.openPositions]
  );

  const closedTrades = useMemo(
    () => (portfolio?.tradeHistory ?? []).slice(0, 10),
    [portfolio?.tradeHistory]
  );

  const totalPnl = useMemo(
    () => (portfolio?.openPositions ?? []).reduce((acc, t) => acc + (t.pnl ?? 0), 0) + (portfolio?.tradeHistory ?? []).reduce((acc, t) => acc + (t.pnl ?? 0), 0),
    [portfolio?.openPositions, portfolio?.tradeHistory]
  );

  const winRate = useMemo(() => {
    const closed = portfolio?.tradeHistory ?? [];
    if (closed.length === 0) return 0;
    const wins = closed.filter((t) => (t.pnl ?? 0) > 0).length;
    return Math.round((wins / closed.length) * 100);
  }, [portfolio?.tradeHistory]);

  async function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault();
    setTradeError(null);
    setTradeSuccess(null);
    setPlacingTrade(true);

    try {
      const body: Record<string, unknown> = {
        symbol,
        side,
        quantity: Number(quantity),
        orderType,
      };

      if (orderType === "limit" && limitPrice) {
        body.limitPrice = Number(limitPrice);
      }
      if (stopLoss) body.stopLoss = Number(stopLoss);
      if (takeProfit) body.takeProfit = Number(takeProfit);

      const res = await fetch("/api/simulator/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setTradeError(data.error || "Failed to place order");
      } else {
        setTradeSuccess("Order placed successfully");
        setQuantity("1");
        setLimitPrice("");
        setStopLoss("");
        setTakeProfit("");
        await refreshPortfolio();
      }
    } catch (e) {
      setTradeError("Network error");
    } finally {
      setPlacingTrade(false);
    }
  }

  async function handleClosePosition(tradeId: string) {
    try {
      const res = await fetch("/api/simulator/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tradeId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setTradeError(data.error || "Failed to close position");
      } else {
        setTradeSuccess("Position closed");
        await refreshPortfolio();
      }
    } catch (e) {
      setTradeError("Network error");
    }
  }

  if (!mounted || loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: bg,
          color: text,
          display: "grid",
          placeItems: "center",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div style={{ color: colors.text.muted }}>Loading simulator...</div>
      </main>
    );
  }

  const balance = portfolio?.balance ?? 500000;

  return (
    <main style={{ minHeight: "100vh", background: bg, color: text, fontFamily: "Inter, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Syne:wght@600;700;800&display=swap');
        * { box-sizing: border-box; }
        .sidebar-link { color: #9A9A9A; text-decoration: none; padding: 12px 14px; border-radius: 10px; display: block; transition: all .2s ease; }
        .sidebar-link:hover { color: ${text}; background: #111111; }
        .sidebar-link.active { color: ${accent}; background: rgba(232, 160, 32, 0.08); }
        .card { background: #0F0F0F; border: 1px solid #1E1E1E; border-radius: 16px; }
        .muted { color: #A3A3A3; }
        .badge { display: inline-flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 999px; border: 1px solid rgba(232,160,32,0.35); background: rgba(232,160,32,0.08); color: ${accent}; font-weight: 600; font-size: 12px; }
        .input { width: 100%; padding: 12px 14px; border-radius: 12px; border: 1px solid #1E1E1E; background: #111111; color: ${text}; font-size: 14px; outline: none; transition: border-color .2s ease; }
        .input:focus { border-color: ${accent}; }
        .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 20px; border-radius: 12px; font-weight: 600; font-size: 14px; cursor: pointer; transition: all .2s ease; border: none; }
        .btn:hover:not(:disabled) { transform: translateY(-1px); }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .btn-buy { background: #4ade80; color: #0A0A0A; }
        .btn-buy:hover:not(:disabled) { background: #22c55e; }
        .btn-sell { background: #ef4444; color: #0A0A0A; }
        .btn-sell:hover:not(:disabled) { background: #dc2626; }
        .btn-close { background: transparent; border: 1px solid #1E1E1E; color: ${text}; }
        .btn-close:hover:not(:disabled) { border-color: #ef4444; color: #ef4444; }
        .table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .table th { text-align: left; padding: 10px 12px; color: #9A9A9A; font-weight: 500; border-bottom: 1px solid #1E1E1E; }
        .table td { padding: 10px 12px; border-bottom: 1px solid #1E1E1E; }
        .table tr:last-child td { border-bottom: none; }
        .profit { color: #4ade80; }
        .loss { color: #ef4444; }
        .sim-layout { display: flex; minHeight: 100vh; }
        .sim-main { margin-left: ${sidebarWidth}px; width: calc(100% - ${sidebarWidth}px); padding: 32px; }
        .sim-top { background: #0F0F0F; border: 1px solid #1E1E1E; border-radius: 16px; overflow: hidden; margin-bottom: 24px; }
        .sim-bottom { display: grid; grid-template-columns: 380px 1fr; gap: 24px; }
        @media (max-width: 1024px) {
          .sim-bottom { grid-template-columns: 1fr; }
        }
      `}</style>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <aside
          style={{
            width: sidebarWidth,
            position: "fixed",
            inset: 0,
            borderRight: "1px solid #1E1E1E",
            background: "#0A0A0A",
            padding: "28px 20px",
            display: "flex",
            flexDirection: "column",
            zIndex: 50,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "Syne, sans-serif",
                fontSize: 18,
                letterSpacing: "0.14em",
                fontWeight: 800,
                marginBottom: 32,
              }}
            >
              VORNIX FORGE
            </div>
            <nav style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className={item.label === "Simulator" ? "sidebar-link active" : "sidebar-link"}
                  aria-current={item.label === "Simulator" ? "page" : undefined}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
          <div className="card" style={{ padding: 16, marginTop: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: text }}>{profileName}</div>
                <div style={{ fontSize: 12, color: "#9A9A9A", marginTop: 4 }}>
                  {levelCopy[currentLevel]?.name ?? `Level ${currentLevel}`}
                </div>
              </div>
              <div className="badge">{levelCopy[currentLevel]?.name ?? `Level ${currentLevel}`}</div>
            </div>
            <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
              <UserButton />
            </div>
          </div>
        </aside>

        <div className="sim-main">
          <header style={{ marginBottom: 24 }}>
            <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 32, lineHeight: 1.1, margin: 0 }}>Paper Trading Simulator</h1>
            <p className="muted" style={{ marginTop: 8, lineHeight: 1.6 }}>
              Practice trading with ₹{balance.toLocaleString("en-IN")} virtual balance. No real money at risk.
            </p>
          </header>

          <div className="sim-top" style={{ height: 400, marginBottom: 24, position: "relative" }}>
            {chartError && (
              <div style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: colors.text.muted,
                fontSize: 14,
                zIndex: 10,
                background: "#0F0F0F",
                borderRadius: 16,
              }}>
                {chartError}
              </div>
            )}
            <div ref={chartContainerRef} style={{ width: "100%", height: "100%" }} />
          </div>
          <div className="muted" style={{ fontSize: 12, marginTop: -16, marginBottom: 24 }}>
            Prices are indicative. For practice only.
          </div>

          <div className="sim-bottom">
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div className="card" style={{ padding: 24 }}>
                <div className="muted" style={{ fontSize: 13, marginBottom: 16, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Place Order</div>
                {tradeError && <div style={{ color: "#ef4444", fontSize: 13, marginBottom: 12 }}>{tradeError}</div>}
                {tradeSuccess && <div style={{ color: "#4ade80", fontSize: 13, marginBottom: 12 }}>{tradeSuccess}</div>}
                <form onSubmit={handlePlaceOrder} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <label className="muted" style={{ fontSize: 12, display: "block", marginBottom: 6 }}>Symbol</label>
                    <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className="input">
                      {SYMBOLS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label className="muted" style={{ fontSize: 12, display: "block", marginBottom: 6 }}>Side</label>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button type="button" className={`btn ${side === "buy" ? "btn-buy" : "btn-close"}`} style={{ flex: 1 }} onClick={() => setSide("buy")}>Buy</button>
                        <button type="button" className={`btn ${side === "sell" ? "btn-sell" : "btn-close"}`} style={{ flex: 1 }} onClick={() => setSide("sell")}>Sell</button>
                      </div>
                    </div>
                    <div>
                      <label className="muted" style={{ fontSize: 12, display: "block", marginBottom: 6 }}>Order Type</label>
                      <select value={orderType} onChange={(e) => setOrderType(e.target.value as "market" | "limit")} className="input">
                        <option value="market">Market</option>
                        <option value="limit">Limit</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="muted" style={{ fontSize: 12, display: "block", marginBottom: 6 }}>Quantity</label>
                    <input type="number" min="1" step="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="input" required />
                  </div>
                  {orderType === "limit" && (
                    <div>
                      <label className="muted" style={{ fontSize: 12, display: "block", marginBottom: 6 }}>Limit Price</label>
                      <input type="number" min="0" step="0.01" value={limitPrice} onChange={(e) => setLimitPrice(e.target.value)} className="input" required />
                    </div>
                  )}
                  <div>
                    <label className="muted" style={{ fontSize: 12, display: "block", marginBottom: 6 }}>Stop Loss (optional)</label>
                    <input type="number" min="0" step="0.01" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} className="input" />
                  </div>
                  <div>
                    <label className="muted" style={{ fontSize: 12, display: "block", marginBottom: 6 }}>Take Profit (optional)</label>
                    <input type="number" min="0" step="0.01" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} className="input" />
                  </div>
                  <button type="submit" className={`btn ${side === "buy" ? "btn-buy" : "btn-sell"}`} disabled={placingTrade}>
                    {placingTrade ? "Placing..." : side === "buy" ? "Buy" : "Sell"} {symbol}
                  </button>
                </form>
              </div>

              <div className="card" style={{ padding: 24 }}>
                <div className="muted" style={{ fontSize: 13, marginBottom: 16, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Open Positions</div>
                {openTrades.length === 0 ? (
                  <div style={{ color: colors.text.muted, fontSize: 13 }}>No open positions.</div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Symbol</th>
                          <th>Side</th>
                          <th>Qty</th>
                          <th>Entry</th>
                          <th>Current</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {openTrades.map((trade) => {
                          const currentPrice = FALLBACK_PRICES[trade.symbol] ?? trade.entryPrice;
                          return (
                            <tr key={trade.id}>
                              <td style={{ fontWeight: 600 }}>{trade.symbol}</td>
                              <td style={{ color: trade.side === "buy" ? "#4ade80" : "#ef4444", textTransform: "uppercase", fontWeight: 600 }}>{trade.side}</td>
                              <td>{trade.quantity}</td>
                              <td>₹{trade.entryPrice.toFixed(2)}</td>
                              <td className="muted">₹{currentPrice.toFixed(2)}</td>
                              <td>
                                <button className="btn btn-close" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => handleClosePosition(trade.id)}>Close</button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div className="card" style={{ padding: 24 }}>
                <div className="muted" style={{ fontSize: 13, marginBottom: 16, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Balance</div>
                <div style={{ fontFamily: "Syne, sans-serif", fontSize: 32, fontWeight: 700 }}>₹{balance.toLocaleString("en-IN")}</div>
              </div>

              <div className="card" style={{ padding: 24 }}>
                <div className="muted" style={{ fontSize: 13, marginBottom: 16, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Stats</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Total P&L</div>
                    <div style={{ fontFamily: "Syne, sans-serif", fontSize: 20, fontWeight: 700, color: totalPnl >= 0 ? "#4ade80" : "#ef4444" }}>
                      {totalPnl >= 0 ? "+" : ""}₹{totalPnl.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Win Rate</div>
                    <div style={{ fontFamily: "Syne, sans-serif", fontSize: 20, fontWeight: 700 }}>{winRate}%</div>
                  </div>
                  <div>
                    <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Total Trades</div>
                    <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 20, fontWeight: 700 }}>{(portfolio?.openPositions?.length ?? 0) + (portfolio?.tradeHistory?.length ?? 0)}</div>
                  </div>
                  <div>
                    <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Open Positions</div>
                    <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 20, fontWeight: 700 }}>{openTrades.length}</div>
                  </div>
                </div>
              </div>

              <div className="card" style={{ padding: 24 }}>
                <div className="muted" style={{ fontSize: 13, marginBottom: 16, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Trade History</div>
                {closedTrades.length === 0 ? (
                  <div style={{ color: colors.text.muted, fontSize: 13 }}>No closed trades yet.</div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Symbol</th>
                          <th>Side</th>
                          <th>Qty</th>
                          <th>Entry</th>
                          <th>Exit</th>
                          <th>P&L</th>
                        </tr>
                      </thead>
                      <tbody>
                        {closedTrades.map((trade) => (
                          <tr key={trade.id}>
                            <td style={{ fontWeight: 600 }}>{trade.symbol}</td>
                            <td style={{ color: trade.side === "buy" ? "#4ade80" : "#ef4444", textTransform: "uppercase", fontWeight: 600 }}>{trade.side}</td>
                            <td>{trade.quantity}</td>
                            <td>₹{trade.entryPrice.toFixed(2)}</td>
                            <td>{trade.exitPrice ? `₹${trade.exitPrice.toFixed(2)}` : "-"}</td>
                            <td className={(trade.pnl ?? 0) >= 0 ? "profit" : "loss"}>
                              {(trade.pnl ?? 0) >= 0 ? "+" : ""}₹{(trade.pnl ?? 0).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

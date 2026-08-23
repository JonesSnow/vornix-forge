"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickData, Time, CandlestickSeries, LineSeries } from "lightweight-charts";
import { UserButton, useUser } from "@clerk/nextjs";
import { colors, STORAGE_KEYS } from "@/lib/constants";
import { navItems, levelCopy } from "@/lib/constants/content/dashboard-content";
import type { AssessmentStorage } from "@/lib/types";
import Sidebar from "../components/Sidebar";

const bg = colors.bg.primary;
const text = colors.text.primary;
const accent = colors.accent.primary;
const sidebarWidth = 220;

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
  const [confirmCloseId, setConfirmCloseId] = useState<string | null>(null);
  const [closePnl, setClosePnl] = useState<number>(0);
  const [resetting, setResetting] = useState(false);

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
          setPortfolio({
            id: "",
            balance: data.balance,
            openPositions: data.openPositions ?? [],
            tradeHistory: data.tradeHistory ?? [],
          });
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
        setPortfolio({
          id: "",
          balance: data.balance,
          openPositions: data.openPositions ?? [],
          tradeHistory: data.tradeHistory ?? [],
        });
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
          background: { type: ColorType.Solid, color: "#111111" },
          textColor: "#F2F0EB",
        },
        grid: {
          vertLines: { color: "#222222" },
          horzLines: { color: "#222222" },
        },
        crosshair: {
          mode: 1,
        },
        rightPriceScale: {
          borderColor: "#222222",
        },
        timeScale: {
          borderColor: "#222222",
          timeVisible: true,
          secondsVisible: false,
        },
      });

      series = chart.addSeries(CandlestickSeries, {
        upColor: "#22C55E",
        downColor: "#EF4444",
        borderUpColor: "#22C55E",
        borderDownColor: "#EF4444",
        wickUpColor: "#22C55E",
        wickDownColor: "#EF4444",
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
    const interval = setInterval(() => {
      setPortfolio((prev) => {
        if (!prev || !prev.openPositions) return prev;
        const updated = prev.openPositions.map((trade) => {
          const currentPrice = FALLBACK_PRICES[trade.symbol] ?? trade.entryPrice;
          const pnl =
            trade.side === "buy"
              ? (currentPrice - trade.entryPrice) * trade.quantity
              : (trade.entryPrice - currentPrice) * trade.quantity;
          return { ...trade, pnl };
        });
        return { ...prev, openPositions: updated };
      });
    }, 30000);
    return () => clearInterval(interval);
  }, []);

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
    const trade = openTrades.find((t) => t.id === tradeId);
    if (!trade) return;

    const currentPrice = FALLBACK_PRICES[trade.symbol] ?? trade.entryPrice;
    const pnl = trade.side === "buy"
      ? (currentPrice - trade.entryPrice) * trade.quantity
      : (trade.entryPrice - currentPrice) * trade.quantity;

    const confirmed = confirm(`Close ${trade.symbol} position?\n\nEntry: ₹${trade.entryPrice.toFixed(2)}\nCurrent: ₹${currentPrice.toFixed(2)}\nP&L: ${pnl >= 0 ? "+" : ""}₹${pnl.toFixed(2)}`);
    if (!confirmed) return;

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

  async function handleResetPortfolio() {
    const confirmed = confirm("Reset portfolio? This will clear all trades and reset your balance to ₹500,000.");
    if (!confirmed) return;

    setResetting(true);
    try {
      const res = await fetch("/api/simulator/reset", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setTradeError(data.error || "Failed to reset portfolio");
      } else {
        setTradeSuccess("Portfolio reset");
        await refreshPortfolio();
      }
    } catch (e) {
      setTradeError("Network error");
    } finally {
      setResetting(false);
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
        <div style={{ color: "#888888" }}>Loading simulator...</div>
      </main>
    );
  }

  const balance = portfolio?.balance ?? 500000;

  return (
    <main style={{ minHeight: "100vh", background: bg, color: text }}>
      <Sidebar activeLabel="Simulator" />

      <section style={{ marginLeft: sidebarWidth, width: `calc(100% - ${sidebarWidth}px)`, padding: "48px 40px 80px" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <header style={{ marginBottom: 32 }}>
            <h1
              style={{
                fontFamily: "Syne, sans-serif",
                fontSize: 32,
                lineHeight: 1.1,
                margin: 0,
                fontWeight: 700,
              }}
            >
              Paper Trading Simulator
            </h1>
            <p style={{ color: "#A0A0A0", marginTop: 8, lineHeight: 1.6, fontSize: 14 }}>
              Practice trading with ₹{balance.toLocaleString("en-IN")} virtual balance. No real money at risk.
            </p>
          </header>

          {/* Chart */}
          <div
            style={{
              background: "#111111",
              border: "1px solid #222222",
              borderRadius: 12,
              overflow: "hidden",
              marginBottom: 24,
              height: 420,
              position: "relative",
            }}
          >
            {chartError && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#888888",
                  fontSize: 14,
                  zIndex: 10,
                  background: "#111111",
                  borderRadius: 12,
                }}
              >
                {chartError}
              </div>
            )}
            <div ref={chartContainerRef} style={{ width: "100%", height: "100%" }} />
          </div>
          <p style={{ fontSize: 12, color: "#555555", marginTop: -16, marginBottom: 24 }}>
            Prices are indicative. For practice only.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "400px 1fr",
              gap: 24,
            }}
          >
            {/* Left: Order + Open Positions */}
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* Place Order */}
              <div
                style={{
                  background: "#111111",
                  border: "1px solid #222222",
                  borderRadius: 12,
                  padding: 24,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "#A0A0A0",
                    marginBottom: 20,
                  }}
                >
                  Place Order
                </div>
                {tradeError && (
                  <div style={{ color: "#EF4444", fontSize: 13, marginBottom: 12, padding: "10px 14px", background: "rgba(239, 68, 68, 0.08)", borderRadius: 8, border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                    {tradeError}
                  </div>
                )}
                {tradeSuccess && (
                  <div style={{ color: "#22C55E", fontSize: 13, marginBottom: 12, padding: "10px 14px", background: "rgba(34, 197, 94, 0.08)", borderRadius: 8, border: "1px solid rgba(34, 197, 94, 0.2)" }}>
                    {tradeSuccess}
                  </div>
                )}
                <form onSubmit={handlePlaceOrder} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label className="label">Symbol</label>
                    <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className="input">
                      {SYMBOLS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label className="label">Side</label>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          type="button"
                          style={{
                            flex: 1,
                            padding: "10px 16px",
                            borderRadius: 8,
                            fontWeight: 600,
                            fontSize: 13,
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                            background: side === "buy" ? "#22C55E" : "transparent",
                            color: side === "buy" ? "#0A0A0A" : "#A0A0A0",
                            border: side === "buy" ? "1px solid #22C55E" : "1px solid #222222",
                          }}
                          onClick={() => setSide("buy")}
                        >
                          Buy
                        </button>
                        <button
                          type="button"
                          style={{
                            flex: 1,
                            padding: "10px 16px",
                            borderRadius: 8,
                            fontWeight: 600,
                            fontSize: 13,
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                            background: side === "sell" ? "#EF4444" : "transparent",
                            color: side === "sell" ? "#0A0A0A" : "#A0A0A0",
                            border: side === "sell" ? "1px solid #EF4444" : "1px solid #222222",
                          }}
                          onClick={() => setSide("sell")}
                        >
                          Sell
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="label">Order Type</label>
                      <select value={orderType} onChange={(e) => setOrderType(e.target.value as "market" | "limit")} className="input">
                        <option value="market">Market</option>
                        <option value="limit">Limit</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="label">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="input"
                      required
                    />
                  </div>
                  {orderType === "limit" && (
                    <div>
                      <label className="label">Limit Price</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={limitPrice}
                        onChange={(e) => setLimitPrice(e.target.value)}
                        className="input"
                        required
                      />
                    </div>
                  )}
                  <div>
                    <label className="label">Stop Loss (optional)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={stopLoss}
                      onChange={(e) => setStopLoss(e.target.value)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Take Profit (optional)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={takeProfit}
                      onChange={(e) => setTakeProfit(e.target.value)}
                      className="input"
                    />
                  </div>
                  <button
                    type="submit"
                    style={{
                      width: "100%",
                      padding: "12px 20px",
                      borderRadius: 8,
                      border: "none",
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      background: side === "buy" ? "#22C55E" : "#EF4444",
                      color: "#0A0A0A",
                      opacity: placingTrade ? 0.6 : 1,
                    }}
                    disabled={placingTrade}
                  >
                    {placingTrade ? "Placing..." : side === "buy" ? "Buy" : "Sell"} {symbol}
                  </button>
                </form>
              </div>

              {/* Open Positions */}
              <div
                style={{
                  background: "#111111",
                  border: "1px solid #222222",
                  borderRadius: 12,
                  padding: 24,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "#A0A0A0",
                    }}
                  >
                    Open Positions
                  </div>
                  <button
                    style={{
                      padding: "6px 14px",
                      borderRadius: 8,
                      border: "1px solid #222222",
                      background: "transparent",
                      color: "#EF4444",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    onClick={handleResetPortfolio}
                    disabled={resetting}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#EF4444")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#222222")}
                  >
                    {resetting ? "Resetting..." : "Reset Portfolio"}
                  </button>
                </div>
                {openTrades.length === 0 ? (
                  <div style={{ color: "#888888", fontSize: 13 }}>No open positions.</div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontSize: 13,
                        fontFamily: "'Inter', monospace",
                      }}
                    >
                      <thead>
                        <tr>
                          <th style={{ textAlign: "left", padding: "10px 12px", color: "#888888", fontWeight: 500, borderBottom: "1px solid #222222", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>Symbol</th>
                          <th style={{ textAlign: "left", padding: "10px 12px", color: "#888888", fontWeight: 500, borderBottom: "1px solid #222222", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>Side</th>
                          <th style={{ textAlign: "left", padding: "10px 12px", color: "#888888", fontWeight: 500, borderBottom: "1px solid #222222", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>Qty</th>
                          <th style={{ textAlign: "left", padding: "10px 12px", color: "#888888", fontWeight: 500, borderBottom: "1px solid #222222", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>Entry</th>
                          <th style={{ textAlign: "left", padding: "10px 12px", color: "#888888", fontWeight: 500, borderBottom: "1px solid #222222", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>Current</th>
                          <th style={{ textAlign: "left", padding: "10px 12px", color: "#888888", fontWeight: 500, borderBottom: "1px solid #222222", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>P&L</th>
                          <th style={{ textAlign: "left", padding: "10px 12px", color: "#888888", fontWeight: 500, borderBottom: "1px solid #222222", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>Opened</th>
                          <th style={{ textAlign: "left", padding: "10px 12px", color: "#888888", fontWeight: 500, borderBottom: "1px solid #222222", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {openTrades.map((trade, idx) => {
                          const currentPrice = FALLBACK_PRICES[trade.symbol] ?? trade.entryPrice;
                          const pnl = trade.side === "buy"
                            ? (currentPrice - trade.entryPrice) * trade.quantity
                            : (trade.entryPrice - currentPrice) * trade.quantity;
                          const isProfitable = pnl >= 0;
                          return (
                            <tr
                              key={trade.id}
                              style={{
                                background: idx % 2 === 0 ? "#111111" : "#0F0F0F",
                              }}
                            >
                              <td style={{ padding: "10px 12px", fontWeight: 600 }}>{trade.symbol}</td>
                              <td style={{ padding: "10px 12px", color: trade.side === "buy" ? "#22C55E" : "#EF4444", textTransform: "uppercase", fontWeight: 600 }}>{trade.side}</td>
                              <td style={{ padding: "10px 12px", fontVariantNumeric: "tabular-nums" }}>{trade.quantity}</td>
                              <td style={{ padding: "10px 12px", fontVariantNumeric: "tabular-nums" }}>₹{trade.entryPrice.toFixed(2)}</td>
                              <td style={{ padding: "10px 12px", color: "#888888", fontVariantNumeric: "tabular-nums" }}>₹{currentPrice.toFixed(2)}</td>
                              <td style={{ padding: "10px 12px", fontWeight: 600, color: isProfitable ? "#22C55E" : "#EF4444", fontVariantNumeric: "tabular-nums" }}>
                                {isProfitable ? "+" : ""}₹{pnl.toFixed(2)}
                              </td>
                              <td style={{ padding: "10px 12px", color: "#888888", fontSize: 12 }}>
                                {new Date(trade.openedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                              </td>
                              <td style={{ padding: "10px 12px" }}>
                                <button
                                  style={{
                                    padding: "6px 14px",
                                    borderRadius: 8,
                                    border: "1px solid #EF4444",
                                    background: "transparent",
                                    color: "#EF4444",
                                    fontSize: 12,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    transition: "all 0.15s ease",
                                  }}
                                  onClick={() => handleClosePosition(trade.id)}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = "#EF4444";
                                    e.currentTarget.style.color = "#0A0A0A";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = "transparent";
                                    e.currentTarget.style.color = "#EF4444";
                                  }}
                                >
                                  Close
                                </button>
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

            {/* Right: Balance + Stats + History */}
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* Balance */}
              <div
                style={{
                  background: "#111111",
                  border: "1px solid #222222",
                  borderRadius: 12,
                  padding: 24,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "#A0A0A0",
                    marginBottom: 12,
                  }}
                >
                  Balance
                </div>
                <div
                  style={{
                    fontFamily: "Syne, sans-serif",
                    fontSize: 32,
                    fontWeight: 700,
                    color: "#F2F0EB",
                  }}
                >
                  ₹{balance.toLocaleString("en-IN")}
                </div>
              </div>

              {/* Stats */}
              <div
                style={{
                  background: "#111111",
                  border: "1px solid #222222",
                  borderRadius: 12,
                  padding: 24,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "#A0A0A0",
                    marginBottom: 16,
                  }}
                >
                  Stats
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "#888888",
                        marginBottom: 6,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      Total P&L
                    </div>
                    <div
                      style={{
                        fontFamily: "Syne, sans-serif",
                        fontSize: 20,
                        fontWeight: 700,
                        color: totalPnl >= 0 ? "#22C55E" : "#EF4444",
                      }}
                    >
                      {totalPnl >= 0 ? "+" : ""}₹{totalPnl.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "#888888",
                        marginBottom: 6,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      Win Rate
                    </div>
                    <div
                      style={{
                        fontFamily: "Syne, sans-serif",
                        fontSize: 20,
                        fontWeight: 700,
                        color: "#F2F0EB",
                      }}
                    >
                      {winRate}%
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "#888888",
                        marginBottom: 6,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      Total Trades
                    </div>
                    <div
                      style={{
                        fontFamily: "Syne, sans-serif",
                        fontSize: 20,
                        fontWeight: 700,
                        color: "#F2F0EB",
                      }}
                    >
                      {(portfolio?.openPositions?.length ?? 0) + (portfolio?.tradeHistory?.length ?? 0)}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "#888888",
                        marginBottom: 6,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      Open Positions
                    </div>
                    <div
                      style={{
                        fontFamily: "Syne, sans-serif",
                        fontSize: 20,
                        fontWeight: 700,
                        color: "#F2F0EB",
                      }}
                    >
                      {openTrades.length}
                    </div>
                  </div>
                </div>
              </div>

              {/* Trade History */}
              <div
                style={{
                  background: "#111111",
                  border: "1px solid #222222",
                  borderRadius: 12,
                  padding: 24,
                  flex: 1,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "#A0A0A0",
                    marginBottom: 16,
                  }}
                >
                  Trade History
                </div>
                {closedTrades.length === 0 ? (
                  <div style={{ color: "#888888", fontSize: 13 }}>No closed trades yet.</div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontSize: 13,
                        fontFamily: "'Inter', monospace",
                      }}
                    >
                      <thead>
                        <tr>
                          <th style={{ textAlign: "left", padding: "8px 10px", color: "#888888", fontWeight: 500, borderBottom: "1px solid #222222", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>Symbol</th>
                          <th style={{ textAlign: "left", padding: "8px 10px", color: "#888888", fontWeight: 500, borderBottom: "1px solid #222222", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>Side</th>
                          <th style={{ textAlign: "left", padding: "8px 10px", color: "#888888", fontWeight: 500, borderBottom: "1px solid #222222", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>Qty</th>
                          <th style={{ textAlign: "left", padding: "8px 10px", color: "#888888", fontWeight: 500, borderBottom: "1px solid #222222", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>Entry</th>
                          <th style={{ textAlign: "left", padding: "8px 10px", color: "#888888", fontWeight: 500, borderBottom: "1px solid #222222", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>Exit</th>
                          <th style={{ textAlign: "left", padding: "8px 10px", color: "#888888", fontWeight: 500, borderBottom: "1px solid #222222", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>P&L</th>
                        </tr>
                      </thead>
                      <tbody>
                        {closedTrades.map((trade, idx) => (
                          <tr key={trade.id} style={{ background: idx % 2 === 0 ? "#111111" : "#0F0F0F" }}>
                            <td style={{ padding: "8px 10px", fontWeight: 600 }}>{trade.symbol}</td>
                            <td style={{ padding: "8px 10px", color: trade.side === "buy" ? "#22C55E" : "#EF4444", textTransform: "uppercase", fontWeight: 600 }}>{trade.side}</td>
                            <td style={{ padding: "8px 10px", fontVariantNumeric: "tabular-nums" }}>{trade.quantity}</td>
                            <td style={{ padding: "8px 10px", fontVariantNumeric: "tabular-nums" }}>₹{trade.entryPrice.toFixed(2)}</td>
                            <td style={{ padding: "8px 10px", fontVariantNumeric: "tabular-nums" }}>{trade.exitPrice ? `₹${trade.exitPrice.toFixed(2)}` : "-"}</td>
                            <td
                              style={{
                                padding: "8px 10px",
                                fontWeight: 600,
                                color: (trade.pnl ?? 0) >= 0 ? "#22C55E" : "#EF4444",
                                fontVariantNumeric: "tabular-nums",
                              }}
                            >
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
      </section>
    </main>
  );
}

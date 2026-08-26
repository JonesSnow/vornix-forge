"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickData, Time, CandlestickSeries, LineSeries } from "lightweight-charts";
import { useUser } from "@clerk/nextjs";
import { STORAGE_KEYS } from "@/lib/constants";
import type { AssessmentStorage } from "@/lib/types";
import Sidebar from "../components/Sidebar";

import {
  AppShell,
  PageHeader,
  Stat,
  SectionHeader,
  Button,
  Badge,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Input,
  EmptyState,
} from "../components";
import ChartContainer from "../components/ChartContainer";

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

export default function SimulatorClient() {
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [assessment, setAssessment] = useState<AssessmentStorage | null>(null);
  const [loading, setLoading] = useState(true);
  const [placingTrade, setPlacingTrade] = useState(false);
  const [tradeError, setTradeError] = useState<string | null>(null);
  const [tradeSuccess, setTradeSuccess] = useState<string | null>(null);
  const [chartError, setChartError] = useState<string | null>(null);
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
        // eslint-disable-next-line react-hooks/set-state-in-effect
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

    let chart: IChartApi | null = null;
    let series: ISeriesApi<"Candlestick"> | null = null;
    let lineSeries: ISeriesApi<"Line"> | null = null;

    try {
      chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: "#FFFFFF" },
          textColor: "#0F172A",
        },
        grid: {
          vertLines: { color: "#F1F5F9" },
          horzLines: { color: "#F1F5F9" },
        },
        crosshair: {
          mode: 1,
        },
        rightPriceScale: {
          borderColor: "#E2E8F0",
        },
        timeScale: {
          borderColor: "#E2E8F0",
          timeVisible: true,
          secondsVisible: false,
        },
      });

      series = chart.addSeries(CandlestickSeries, {
        upColor: "#0D9488",
        downColor: "#DC2626",
        borderUpColor: "#0D9488",
        borderDownColor: "#DC2626",
        wickUpColor: "#0D9488",
        wickDownColor: "#DC2626",
      });

      lineSeries = chart.addSeries(LineSeries, {
        color: "#D4A017",
        lineWidth: 2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
        crosshairMarkerBorderColor: "#D4A017",
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
            height: chartContainerRef.current.clientHeight || 420,
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
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

        const entries = Object.entries(timeSeries).slice(0, 90) as [string, Record<string, string>][];
        const candlestickData: CandlestickData<Time>[] = entries.map(([date, values]) => {
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

  const openTrades = useMemo(
    () => portfolio?.openPositions ?? [],
    [portfolio?.openPositions]
  );

  const closedTrades = useMemo(
    () => (portfolio?.tradeHistory ?? []).slice(0, 10),
    [portfolio?.tradeHistory]
  );

  const balance = portfolio?.balance ?? 500000;
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

  const totalTrades = useMemo(
    () => (portfolio?.openPositions?.length ?? 0) + (portfolio?.tradeHistory?.length ?? 0),
    [portfolio?.openPositions, portfolio?.tradeHistory]
  );

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
    } catch {
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
    } catch {
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
    } catch {
      setTradeError("Network error");
    } finally {
      setResetting(false);
    }
  }

  if (!mounted || loading) {
    return (
      <AppShell activeLabel="Simulator">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-text-secondary">Loading simulator...</div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell activeLabel="Simulator">
      <PageHeader
        title="Paper Trading Simulator"
        subtitle={`Practice trading with ₹${balance.toLocaleString("en-IN")} virtual balance. No real money at risk.`}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
        <Stat label="Balance" value={`₹${balance.toLocaleString("en-IN")}`} />
        <Stat
          label="Total P&L"
          value={`${totalPnl >= 0 ? "+" : ""}₹${totalPnl.toFixed(2)}`}
          change={{
            value: `${winRate}% win rate`,
            direction: winRate >= 50 ? "up" : "down",
          }}
        />
        <Stat label="Open Positions" value={openTrades.length} />
        <Stat label="Total Trades" value={totalTrades} />
        <Stat label="Win Rate" value={`${winRate}%`} />
      </div>

      <div className="divider" />

      {/* Chart + Order Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-8 mb-8">
        {/* Chart */}
        <div>
          <ChartContainer title="Market Chart" subtitle={symbol}>
            {chartError && (
              <div className="text-text-secondary text-body-sm mt-2">{chartError}</div>
            )}
            <div ref={chartContainerRef} className="w-full" style={{ height: 420 }} />
          </ChartContainer>
          <p className="text-caption text-text-muted mt-2">Prices are indicative. For practice only.</p>
        </div>

        {/* Order Panel */}
        <div className="border border-border rounded-xl p-5">
          <div className="text-caption text-text-secondary mb-4">Order Ticket</div>

          {tradeError && (
            <div className="mb-4 p-3 rounded-lg bg-negative-soft border border-negative text-negative text-sm">
              {tradeError}
            </div>
          )}
          {tradeSuccess && (
            <div className="mb-4 p-3 rounded-lg bg-positive-soft border border-positive text-positive text-sm">
              {tradeSuccess}
            </div>
          )}

          <form onSubmit={handlePlaceOrder} className="flex flex-col gap-4">
            <div>
              <label className="label">Symbol</label>
              <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className="input">
                {SYMBOLS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Side</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSide("buy")}
                    className={`
                      flex-1 h-9 rounded-md font-semibold text-sm cursor-pointer transition-all border
                      ${side === "buy"
                        ? "bg-positive text-white border-positive"
                        : "bg-surface text-text-secondary border-border-visible hover:border-positive hover:text-positive"
                      }
                    `}
                  >
                    Buy
                  </button>
                  <button
                    type="button"
                    onClick={() => setSide("sell")}
                    className={`
                      flex-1 h-9 rounded-md font-semibold text-sm cursor-pointer transition-all border
                      ${side === "sell"
                        ? "bg-negative text-white border-negative"
                        : "bg-surface text-text-secondary border-border-visible hover:border-negative hover:text-negative"
                      }
                    `}
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
              <Input
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>

            {orderType === "limit" && (
              <div>
                <label className="label">Limit Price</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  required
                />
              </div>
            )}

            <div>
              <label className="label">Stop Loss (optional)</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Take Profit (optional)</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              variant={side === "buy" ? "primary" : "danger"}
              size="lg"
              className="w-full"
              loading={placingTrade}
            >
              {placingTrade ? "Placing..." : `${side === "buy" ? "Buy" : "Sell"} ${symbol}`}
            </Button>
          </form>
        </div>
      </div>

      <div className="divider" />

      {/* Open Positions */}
      <div className="mb-8">
        <SectionHeader
          title="Open Positions"
          description={`${openTrades.length} active position${openTrades.length !== 1 ? "s" : ""}`}
          actions={
            <Button variant="danger" size="sm" onClick={handleResetPortfolio} loading={resetting}>
              Reset Portfolio
            </Button>
          }
        />
        {openTrades.length === 0 ? (
          <EmptyState
            title="No open positions"
            description="Your active trades will appear here. Start by placing an order above."
          />
        ) : (
          <Table>
            <TableHead>
              <tr>
                <th>Symbol</th>
                <th>Side</th>
                <th align="right">Entry</th>
                <th align="right">Current</th>
                <th align="right">P&L</th>
                <th align="right">Opened</th>
                <th align="center">Action</th>
              </tr>
            </TableHead>
            <TableBody>
              {openTrades.map((trade) => {
                const currentPrice = FALLBACK_PRICES[trade.symbol] ?? trade.entryPrice;
                const pnl = trade.side === "buy"
                  ? (currentPrice - trade.entryPrice) * trade.quantity
                  : (trade.entryPrice - currentPrice) * trade.quantity;
                const isProfitable = pnl >= 0;
                return (
                  <TableRow key={trade.id}>
                    <TableCell>
                      <span className="font-medium">{trade.symbol}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={trade.side === "buy" ? "positive" : "negative"}>
                        {trade.side.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell align="right" className="font-mono-tabular">₹{trade.entryPrice.toFixed(2)}</TableCell>
                    <TableCell align="right" className="font-mono-tabular text-text-secondary">₹{currentPrice.toFixed(2)}</TableCell>
                    <TableCell align="right" className={`font-mono-tabular font-medium ${isProfitable ? "text-positive" : "text-negative"}`}>
                      {isProfitable ? "+" : ""}₹{pnl.toFixed(2)}
                    </TableCell>
                    <TableCell align="right" className="text-text-secondary text-body-sm">
                      {new Date(trade.openedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </TableCell>
                    <TableCell align="center">
                      <Button variant="danger" size="sm" onClick={() => handleClosePosition(trade.id)}>
                        Close
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="divider" />

      {/* Trade History */}
      <div>
        <SectionHeader
          title="Trade History"
          description={`${closedTrades.length} recent closed trade${closedTrades.length !== 1 ? "s" : ""}`}
        />
        {closedTrades.length === 0 ? (
          <EmptyState
            title="No closed trades yet"
            description="Your trade history will appear here after you close positions."
          />
        ) : (
          <Table>
            <TableHead>
              <tr>
                <th>Symbol</th>
                <th>Side</th>
                <th align="right">Entry</th>
                <th align="right">Exit</th>
                <th align="right">P&L</th>
              </tr>
            </TableHead>
            <TableBody>
              {closedTrades.map((trade) => {
                const pnl = trade.pnl ?? 0;
                const isProfitable = pnl >= 0;
                return (
                  <TableRow key={trade.id}>
                    <TableCell>
                      <span className="font-medium">{trade.symbol}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={trade.side === "buy" ? "positive" : "negative"}>
                        {trade.side.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell align="right" className="font-mono-tabular">₹{trade.entryPrice.toFixed(2)}</TableCell>
                    <TableCell align="right" className="font-mono-tabular text-text-secondary">
                      {trade.exitPrice ? `₹${trade.exitPrice.toFixed(2)}` : "—"}
                    </TableCell>
                    <TableCell align="right" className={`font-mono-tabular font-medium ${isProfitable ? "text-positive" : "text-negative"}`}>
                      {isProfitable ? "+" : ""}₹{pnl.toFixed(2)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </AppShell>
  );
}

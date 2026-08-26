"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { STORAGE_KEYS } from "@/lib/constants";
import { navItems, levelCopy, nextModules } from "@/lib/constants/content/dashboard-content";
import type { AssessmentStorage } from "@/lib/types";

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
  EmptyState,
} from "../components";

function getLevelFromScore(score: number) {
  if (score <= 40) return 1;
  if (score <= 60) return 2;
  if (score <= 80) return 3;
  return 4;
}

type DashboardSummary = {
  profile: { id: string; clerkId: string; onboardingDone: boolean };
  assessment: { score: number; level: number } | null;
  modulesCompleted: number;
  openPositions: Array<{ id: string; symbol: string; side: string; status: string; pnl: number | null; entryPrice: number; openedAt: string }>;
  tradeHistory: Array<{ id: string; symbol: string; side: string; status: string; pnl: number | null; entryPrice: number; exitPrice: number | null; openedAt: string; closedAt: string | null }>;
  totalPnl: number;
  winRate: number;
  journalCount: number;
  currentLevel: number;
  balance: number;
};

export default function DashboardClient() {
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);
  const [assessment, setAssessment] = useState<AssessmentStorage | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

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
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/dashboard/summary");
        if (res.ok) {
          const data = await res.json();
          setSummary(data);
        }
      } catch (e) {
        console.error("Failed to fetch dashboard:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  const assessmentScore = assessment?.result?.score ?? assessment?.score ?? 0;
  const currentLevel = summary?.currentLevel ?? assessment?.result?.level ?? assessment?.level ?? getLevelFromScore(assessmentScore);
  const levelEntry = levelCopy[currentLevel] ?? levelCopy[1];
  const nextModule = nextModules[currentLevel];

  const profileName = useMemo(() => {
    const email = user?.primaryEmailAddress?.emailAddress?.split("@")[0];
    return user?.fullName || user?.firstName || user?.username || email || "User";
  }, [user]);

  const firstName = profileName.split(" ")[0];

  if (!mounted || loading) {
    return (
      <AppShell activeLabel="Dashboard">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-text-secondary">Loading dashboard...</div>
        </div>
      </AppShell>
    );
  }

  const openPositions = summary?.openPositions ?? [];
  const tradeHistory = summary?.tradeHistory ?? [];
  const balance = summary?.balance ?? 500000;
  const totalPnl = summary?.totalPnl ?? 0;
  const winRate = summary?.winRate ?? 0;
  const modulesCompleted = summary?.modulesCompleted ?? 0;
  const journalCount = summary?.journalCount ?? 0;

  return (
    <AppShell activeLabel="Dashboard">
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back, ${firstName}. ${levelEntry.description}`}
        actions={
          <div className="flex items-center gap-3">
            <Badge variant="accent">{levelEntry.name}</Badge>
          </div>
        }
      />

      <div className="divider" />

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
        <Stat label="Level" value={currentLevel} />
        <Stat label="Modules Completed" value={modulesCompleted} />
        <Stat
          label="Balance"
          value={`₹${balance.toLocaleString("en-IN")}`}
        />
        <Stat
          label="Total P&L"
          value={`${totalPnl >= 0 ? "+" : ""}₹${totalPnl.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          change={{
            value: `${winRate}% win rate`,
            direction: winRate >= 50 ? "up" : "down",
          }}
        />
        <Stat
          label="Win Rate"
          value={`${winRate}%`}
          change={{
            value: `${tradeHistory.length} closed trades`,
            direction: "neutral",
          }}
        />
      </div>

      <div className="divider" />

      {/* Two-column: Open Positions + Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Open Positions — 2 cols */}
        <div className="lg:col-span-2">
          <SectionHeader
            title="Open Positions"
            description={`${openPositions.length} active position${openPositions.length !== 1 ? "s" : ""}`}
          />
          {openPositions.length === 0 ? (
            <EmptyState
              title="No open positions"
              description="Your active trades will appear here. Start trading in the simulator."
              action={{ label: "Open Simulator", href: "/simulator" }}
            />
          ) : (
            <Table>
              <TableHead>
                <tr>
                  <th>Symbol</th>
                  <th>Side</th>
                  <th align="right">Entry</th>
                  <th align="right">P&L</th>
                  <th align="right">Opened</th>
                </tr>
              </TableHead>
              <TableBody>
                {openPositions.map((trade) => {
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
                      <TableCell align="right" className={`font-mono-tabular font-medium ${isProfitable ? "text-positive" : "text-negative"}`}>
                        {isProfitable ? "+" : ""}₹{pnl.toFixed(2)}
                      </TableCell>
                      <TableCell align="right" className="text-text-secondary text-body-sm">
                        {new Date(trade.openedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Side Panel — 1 col */}
        <div className="space-y-6">
          {/* Next Module */}
          {nextModule && (
            <div className="border-b border-border pb-6">
              <div className="text-caption text-text-secondary mb-3">Next Module</div>
              <div className="text-h3 text-primary mb-2">{nextModule.title}</div>
              <p className="text-body-sm text-text-secondary mb-4 leading-relaxed">{nextModule.description}</p>
              <div className="flex items-center gap-3">
                <span className="text-caption text-text-muted">{nextModule.time}</span>
                <Link href="/learn">
                  <Button variant="primary" size="sm">Continue Learning</Button>
                </Link>
              </div>
            </div>
          )}

          {/* Journal stat */}
          <div className="border-b border-border pb-6">
            <div className="text-caption text-text-secondary mb-3">Journal</div>
            <div className="flex items-baseline gap-3">
              <span className="font-display text-3xl font-bold text-primary">{journalCount}</span>
              <span className="text-body-sm text-text-secondary">entries logged</span>
            </div>
            <div className="mt-3">
              <Link href="/journal">
                <Button variant="secondary" size="sm" className="w-full">View Journal</Button>
              </Link>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <div className="text-caption text-text-secondary mb-3">Quick Actions</div>
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="
                    flex items-center justify-between
                    px-3 py-2.5 rounded-lg
                    border border-border-subtle
                    text-body-sm font-medium text-text-secondary
                    hover:border-border-visible hover:text-primary
                    transition-colors
                  "
                >
                  {item.label}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="divider" />

      {/* Trade History */}
      <div>
        <SectionHeader
          title="Trade History"
          description={`${tradeHistory.length} recent closed trade${tradeHistory.length !== 1 ? "s" : ""}`}
        />
        {tradeHistory.length === 0 ? (
          <EmptyState
            title="No closed trades yet"
            description="Your trade history will appear here after you close positions in the simulator."
            action={{ label: "Open Simulator", href: "/simulator" }}
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
                {tradeHistory.map((trade) => {
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

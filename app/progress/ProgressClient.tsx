"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
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

type ProgressSummary = {
  profile: { id: string; clerkId: string; onboardingDone: boolean };
  assessment: { score: number; level: number } | null;
  completedModules: Array<{
    id: string;
    title: string;
    courseId: string;
    order: number;
  }>;
  openPositions: Array<{ id: string; symbol: string; side: string; status: string }>;
  tradeHistory: Array<{ id: string; symbol: string; side: string; status: string; pnl: number | null }>;
  totalPnl: number;
  winRate: number;
  journalCount: number;
  radarData: Array<{ skill: string; value: number }>;
  currentLevel: number;
  balance: number;
};

type ProgressClientProps = {
  userId: string;
};

const BADGES = [
  { level: 1, name: "Foundation", icon: "🥉" },
  { level: 2, name: "Intermediate", icon: "🥈" },
  { level: 3, name: "Advanced", icon: "🥇" },
  { level: 4, name: "Expert", icon: "🏆" },
];

export default function ProgressClient({ userId }: ProgressClientProps) {
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [assessment, setAssessment] = useState<AssessmentStorage | null>(null);
  const [loading, setLoading] = useState(true);

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
    async function fetchSummary() {
      try {
        const res = await fetch("/api/progress/summary");
        if (res.ok) {
          const data = await res.json();
          setSummary(data);
        }
      } catch (e) {
        console.error("Failed to fetch progress summary:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchSummary();
  }, []);

  const assessmentScore = assessment?.result?.score ?? assessment?.score ?? summary?.assessment?.score ?? 0;
  const currentLevel = summary?.currentLevel ?? assessment?.result?.level ?? assessment?.level ?? getLevelFromScore(assessmentScore);
  const levelEntry = levelCopy[currentLevel] ?? levelCopy[1];
  const nextLevel = Math.min(currentLevel + 1, 4);
  const levelProgress = summary?.assessment
    ? summary.assessment.score
    : assessmentScore;

  const profileName = useMemo(() => {
    const email = user?.primaryEmailAddress?.emailAddress?.split("@")[0];
    return user?.fullName || user?.firstName || user?.username || email || "Signed-in user";
  }, [user]);

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
        <div style={{ color: "#888888" }}>Loading progress...</div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: bg, color: text }}>
      <Sidebar activeLabel="Progress" />

      <section style={{ marginLeft: sidebarWidth, width: `calc(100% - ${sidebarWidth}px)`, padding: "48px 40px 80px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <header style={{ marginBottom: 32 }}>
            <h1
              style={{
                fontFamily: "Syne, sans-serif",
                fontSize: 36,
                lineHeight: 1.05,
                margin: 0,
                fontWeight: 700,
              }}
            >
              Progress
            </h1>
            <p style={{ color: "#A0A0A0", marginTop: 8, lineHeight: 1.6, fontSize: 14 }}>
              Track your learning journey, simulator performance, and trading mindset.
            </p>
          </header>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: 16,
              marginBottom: 32,
            }}
          >
            {[
              { label: "Current Level", value: `Level ${currentLevel}` },
              { label: "Modules Completed", value: summary?.completedModules.length ?? 0 },
              { label: "Journal Entries", value: summary?.journalCount ?? 0 },
              { label: "Win Rate", value: `${summary?.winRate ?? 0}%`, color: (summary?.winRate ?? 0) > 50 ? "#22C55E" : (summary?.winRate ?? 0) < 50 ? "#EF4444" : "#F2F0EB" },
            ].map((item) => (
              <div
                key={item.label}
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
                  {item.label}
                </div>
                <div
                  style={{
                    fontFamily: "Syne, sans-serif",
                    fontSize: 28,
                    fontWeight: 700,
                    color: item.color || "#F2F0EB",
                  }}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.2fr .8fr", gap: 24, marginBottom: 32 }}>
            {/* Radar */}
            <div
              style={{
                background: "#111111",
                border: "1px solid #222222",
                borderRadius: 12,
                padding: 28,
                minHeight: 420,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#A0A0A0",
                  marginBottom: 14,
                }}
              >
                Competency Map
              </div>
              <h2
                style={{
                  fontFamily: "Syne, sans-serif",
                  fontSize: 20,
                  margin: "0 0 20px 0",
                  fontWeight: 700,
                }}
              >
                Eight-skill profile
              </h2>
              <div style={{ width: "100%", height: 340 }}>
                <ResponsiveContainer>
                  <RadarChart data={summary?.radarData ?? []}>
                    <PolarGrid stroke="#2A2A2A" />
                    <PolarAngleAxis
                      dataKey="skill"
                      tick={{ fill: "#F2F0EB", fontSize: 11, fontFamily: "Inter, sans-serif" }}
                    />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 100]}
                      tick={false}
                      axisLine={false}
                    />
                    <Radar
                      dataKey="value"
                      stroke="#E8A020"
                      fill="#E8A020"
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#111111",
                        border: "1px solid #2A2A2A",
                        borderRadius: 8,
                        color: "#F2F0EB",
                        fontSize: 13,
                      }}
                      labelStyle={{ color: "#F2F0EB" }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Level Progress + Milestones + Certifications */}
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* Level Progress */}
              <div
                style={{
                  background: "#111111",
                  border: "1px solid #222222",
                  borderRadius: 12,
                  padding: 28,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "#A0A0A0",
                    marginBottom: 18,
                  }}
                >
                  Level Progress
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{levelEntry.name}</span>
                      <span style={{ fontSize: 12, color: "#888888" }}>Level {currentLevel}</span>
                    </div>
                    <div className="progress-shell">
                      <div className="progress-bar" style={{ width: `${Math.min(levelProgress, 100)}%` }} />
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 12, color: "#888888" }}>Next:</span>
                    <span className="badge">{(levelCopy[nextLevel] ?? levelCopy[1]).name}</span>
                  </div>
                </div>
              </div>

              {/* Next Milestone */}
              <div
                style={{
                  background: "#111111",
                  border: "1px solid #222222",
                  borderRadius: 12,
                  padding: 28,
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
                  Next Milestone
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.8 }}>
                  {(levelCopy[nextLevel] ?? levelCopy[1]).learn.map((item, i) => (
                    <div key={i} style={{ display: "flex", gap: 12, marginBottom: 10, alignItems: "flex-start" }}>
                      <span
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          background: "rgba(232, 160, 32, 0.1)",
                          border: "1px solid rgba(232, 160, 32, 0.3)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 10,
                          fontWeight: 700,
                          color: "#E8A020",
                          flexShrink: 0,
                          marginTop: 2,
                        }}
                      >
                        {i + 1}
                      </span>
                      <span style={{ color: "#F2F0EB" }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Certifications */}
              <div
                style={{
                  background: "#111111",
                  border: "1px solid #222222",
                  borderRadius: 12,
                  padding: 28,
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
                  Certifications
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {BADGES.filter((b) => b.level <= currentLevel).map((badge) => (
                    <div
                      key={badge.level}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "12px 14px",
                        borderRadius: 10,
                        background: "#1A1A1A",
                        border: "1px solid #222222",
                      }}
                    >
                      <span style={{ fontSize: 20 }}>{badge.icon}</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#F2F0EB" }}>{badge.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 }}>
            {/* Modules Completed */}
            <div
              style={{
                background: "#111111",
                border: "1px solid #222222",
                borderRadius: 12,
                padding: 28,
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
                Modules Completed
              </div>
              {!summary || summary.completedModules.length === 0 ? (
                <div style={{ color: "#888888", fontSize: 14 }}>No modules completed yet.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {summary.completedModules.map((mod) => (
                    <div
                      key={mod.id}
                      style={{
                        padding: "12px 14px",
                        borderRadius: 10,
                        background: "#1A1A1A",
                        border: "1px solid #222222",
                        fontSize: 14,
                        color: "#F2F0EB",
                      }}
                    >
                      {mod.title}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Simulator Stats */}
            <div
              style={{
                background: "#111111",
                border: "1px solid #222222",
                borderRadius: 12,
                padding: 28,
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
                Simulator Stats
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
                      color: (summary?.totalPnl ?? 0) >= 0 ? "#22C55E" : "#EF4444",
                    }}
                  >
                    {(summary?.totalPnl ?? 0) >= 0 ? "+" : ""}₹{(summary?.totalPnl ?? 0).toFixed(2)}
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
                    {summary?.winRate ?? 0}%
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
                    {summary?.tradeHistory.length ?? 0}
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
                    {summary?.openPositions.length ?? 0}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Journal Streak */}
          <div
            style={{
              background: "#111111",
              border: "1px solid #222222",
              borderRadius: 12,
              padding: 28,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#A0A0A0",
                marginBottom: 14,
              }}
            >
              Journal Streak
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  fontFamily: "Syne, sans-serif",
                  fontSize: 48,
                  fontWeight: 700,
                  color: "#E8A020",
                  lineHeight: 1,
                }}
              >
                {summary?.journalCount ?? 0}
              </div>
              <div style={{ color: "#A0A0A0", fontSize: 14 }}>entries written</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

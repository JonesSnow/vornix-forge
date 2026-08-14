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
        <div style={{ color: colors.text.muted }}>Loading progress...</div>
      </main>
    );
  }

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
        .progress-shell { height: 10px; border-radius: 999px; background: #161616; overflow: hidden; }
        .progress-bar { height: 100%; background: ${accent}; transition: width .35s ease; }
        .stat-value { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 700; color: ${text}; }
        .profit { color: #4ade80; }
        .loss { color: #ef4444; }
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
                  className={item.label === "Progress" ? "sidebar-link active" : "sidebar-link"}
                  aria-current={item.label === "Progress" ? "page" : undefined}
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
                  {levelEntry.name}
                </div>
              </div>
              <div className="badge">{levelEntry.name}</div>
            </div>
            <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
              <UserButton />
            </div>
          </div>
        </aside>

        <section style={{ marginLeft: sidebarWidth, width: `calc(100% - ${sidebarWidth}px)`, padding: 32 }}>
          <div style={{ maxWidth: 1240, margin: "0 auto" }}>
            <header style={{ marginBottom: 24 }}>
              <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 36, lineHeight: 1.05, margin: 0 }}>Progress</h1>
              <p className="muted" style={{ marginTop: 8, lineHeight: 1.6 }}>
                Track your learning journey, simulator performance, and trading mindset.
              </p>
            </header>

             <section style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 16, marginBottom: 24 }}>
              {[
                { label: "Current Level", value: `Level ${currentLevel}` },
                { label: "Modules Completed", value: summary?.completedModules.length ?? 0 },
                { label: "Journal Entries", value: summary?.journalCount ?? 0 },
                { label: "Win Rate", value: `${summary?.winRate ?? 0}%`, color: (summary?.winRate ?? 0) > 50 ? "#4ade80" : (summary?.winRate ?? 0) < 50 ? "#ef4444" : text },
              ].map((item) => (
                <div key={item.label} className="card" style={{ padding: 20 }}>
                  <div className="muted" style={{ fontSize: 13, marginBottom: 12 }}>{item.label}</div>
                  <div className="stat-value" style={{ color: item.color }}>{item.value}</div>
                </div>
              ))}
            </section>

            <section style={{ display: "grid", gridTemplateColumns: "1.2fr .8fr", gap: 24, marginBottom: 24 }}>
              <div className="card" style={{ padding: 28, minHeight: 420 }}>
                <div className="muted" style={{ fontSize: 13, marginBottom: 14 }}>Competency Map</div>
                <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: 24, margin: "0 0 16px 0" }}>Eight-skill profile</h2>
                <div style={{ width: "100%", height: 320 }}>
                  <ResponsiveContainer>
                    <RadarChart data={summary?.radarData ?? []} width={400} height={300}>
                      <PolarGrid stroke="#222" />
                      <PolarAngleAxis dataKey="skill" tick={{ fill: "#F2F0EB", fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar dataKey="value" stroke={accent} fill={accent} fillOpacity={0.18} />
                      <Tooltip contentStyle={{ background: "#111", border: "1px solid #2A2A2A", color: text }} labelStyle={{ color: text }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div className="card" style={{ padding: 28 }}>
                  <div className="muted" style={{ fontSize: 13, marginBottom: 14 }}>Level Progress</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{levelEntry.name}</span>
                        <span className="muted" style={{ fontSize: 12 }}>Level {currentLevel}</span>
                      </div>
                      <div className="progress-shell">
                        <div className="progress-bar" style={{ width: `${Math.min(levelProgress, 100)}%` }} />
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span className="muted" style={{ fontSize: 13 }}>Next:</span>
                      <span className="badge">{(levelCopy[nextLevel] ?? levelCopy[1]).name}</span>
                    </div>
                  </div>
                </div>

                <div className="card" style={{ padding: 28 }}>
                  <div className="muted" style={{ fontSize: 13, marginBottom: 14 }}>Next Milestone</div>
                  <div style={{ fontSize: 14, lineHeight: 1.7 }}>
                    {(levelCopy[nextLevel] ?? levelCopy[1]).learn.map((item, i) => (
                      <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                        <span style={{ color: accent, flexShrink: 0 }}>→</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card" style={{ padding: 28 }}>
                  <div className="muted" style={{ fontSize: 13, marginBottom: 14 }}>Certifications</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {BADGES.filter((b) => b.level <= currentLevel).map((badge) => (
                      <div key={badge.level} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, background: "#111111", border: "1px solid #1E1E1E" }}>
                        <span style={{ fontSize: 20 }}>{badge.icon}</span>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{badge.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
              <div className="card" style={{ padding: 28 }}>
                <div className="muted" style={{ fontSize: 13, marginBottom: 14 }}>Modules Completed</div>
                {!summary || summary.completedModules.length === 0 ? (
                  <div style={{ color: colors.text.muted, fontSize: 14 }}>No modules completed yet.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {summary.completedModules.map((mod) => (
                      <div key={mod.id} style={{ padding: "10px 12px", borderRadius: 10, background: "#111111", border: "1px solid #1E1E1E", fontSize: 14 }}>
                        {mod.title}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="card" style={{ padding: 28 }}>
                <div className="muted" style={{ fontSize: 13, marginBottom: 14 }}>Simulator Stats</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Total P&L</div>
                    <div className="stat-value" style={{ fontSize: 20, color: (summary?.totalPnl ?? 0) >= 0 ? "#4ade80" : "#ef4444" }}>
                      {(summary?.totalPnl ?? 0) >= 0 ? "+" : ""}₹{(summary?.totalPnl ?? 0).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Win Rate</div>
                    <div className="stat-value" style={{ fontSize: 20 }}>{summary?.winRate ?? 0}%</div>
                  </div>
                  <div>
                    <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Total Trades</div>
                    <div className="stat-value" style={{ fontSize: 20 }}>{summary?.tradeHistory.length ?? 0}</div>
                  </div>
                  <div>
                    <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Open Positions</div>
                    <div className="stat-value" style={{ fontSize: 20 }}>{summary?.openPositions.length ?? 0}</div>
                  </div>
                </div>
              </div>
            </section>

            <section className="card" style={{ padding: 28, marginBottom: 24 }}>
              <div className="muted" style={{ fontSize: 13, marginBottom: 14 }}>Journal Streak</div>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div className="stat-value" style={{ fontSize: 48 }}>{summary?.journalCount ?? 0}</div>
                <div className="muted" style={{ fontSize: 14 }}>entries written</div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  colors,
  STORAGE_KEYS,
} from "@/lib/constants";
import {
  navItems,
  skillLabels,
  levelCopy,
  nextModules,
} from "@/lib/constants/content/dashboard-content";
import type { OnboardingAnswers, AssessmentResult, AssessmentStorage, DashboardState } from "@/lib/types";

const bg = colors.bg.primary;
const text = colors.text.primary;
const accent = colors.accent.primary;
const sidebarWidth = 280;
const ONBOARDING_KEY = STORAGE_KEYS.onboardingAnswers;
const ASSESSMENT_KEY = STORAGE_KEYS.assessment;
const DASHBOARD_KEY = STORAGE_KEYS.dashboard;

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
  openPositions: Array<{ id: string; symbol: string; side: string; status: string }>;
  tradeHistory: Array<{ id: string; symbol: string; side: string; status: string; pnl: number | null }>;
  totalPnl: number;
  winRate: number;
  journalCount: number;
  radarData: Array<{ skill: string; value: number }>;
  currentLevel: number;
  balance: number;
};

export default function DashboardClient() {
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);
  const [onboarding, setOnboarding] = useState<OnboardingAnswers | null>(null);
  const [assessment, setAssessment] = useState<AssessmentStorage | null>(null);
  const [dashboardState, setDashboardState] = useState<DashboardState | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    const onboardingRaw = localStorage.getItem(ONBOARDING_KEY);
    if (onboardingRaw) {
      try {
        setOnboarding(JSON.parse(onboardingRaw) as OnboardingAnswers);
      } catch {
        setOnboarding(null);
      }
    }
    const assessmentRaw = localStorage.getItem(ASSESSMENT_KEY);
    if (assessmentRaw) {
      try {
        setAssessment(JSON.parse(assessmentRaw) as AssessmentStorage);
      } catch {
        setAssessment(null);
      }
    }
    const dashboardRaw = localStorage.getItem(DASHBOARD_KEY);
    if (dashboardRaw) {
      try {
        setDashboardState(JSON.parse(dashboardRaw) as DashboardState);
      } catch {
        const initial = { modulesCompleted: 0 };
        setDashboardState(initial);
        localStorage.setItem(DASHBOARD_KEY, JSON.stringify(initial));
      }
    } else {
      const initial = { modulesCompleted: 0 };
      setDashboardState(initial);
      localStorage.setItem(DASHBOARD_KEY, JSON.stringify(initial));
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (dashboardState) {
      localStorage.setItem(DASHBOARD_KEY, JSON.stringify(dashboardState));
    }
  }, [dashboardState]);

  useEffect(() => {
    async function fetchSummary() {
      try {
        const res = await fetch("/api/dashboard/summary");
        if (res.ok) {
          const data = await res.json();
          setSummary(data);
        }
      } catch (e) {
        console.error("Failed to fetch dashboard summary:", e);
      }
    }
    fetchSummary();
  }, []);

  const profileName = useMemo(() => {
    const email = user?.primaryEmailAddress?.emailAddress?.split("@")[0];
    return user?.fullName || user?.firstName || user?.username || email || "Signed-in user";
  }, [user]);
  const assessmentScore = summary?.assessment?.score ?? assessment?.result?.score ?? assessment?.score ?? 0;
  const currentLevel = summary?.currentLevel ?? assessment?.result?.level ?? assessment?.level ?? getLevelFromScore(assessmentScore);
  const levelEntry = levelCopy[currentLevel] ?? levelCopy[1];
  const specialisationGoal = onboarding?.goal ?? "No onboarding profile saved yet.";
  const modulesCompleted = summary?.modulesCompleted ?? dashboardState?.modulesCompleted ?? 0;
  const daysActive = 1;

  const radarData = useMemo(() => {
    if (summary?.radarData && summary.radarData.length > 0) {
      return summary.radarData.map((item) => ({ subject: item.skill, value: item.value }));
    }
    return skillLabels.map((subject) => ({ subject, value: assessmentScore }));
  }, [summary?.radarData, assessmentScore]);

  const nextModule = nextModules[currentLevel] ?? nextModules[1];
  const levelCompletion = modulesCompleted > 0 ? Math.min((modulesCompleted / 4) * 100, 100) : 0;

  if (!mounted) {
    return (
      <main style={{ minHeight: "100vh", background: bg, color: text, display: "grid", placeItems: "center", fontFamily: "Inter, sans-serif" }}>
        <div style={{ color: "#888" }}>Loading dashboard...</div>
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
      `}</style>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <aside style={{ width: sidebarWidth, position: "fixed", inset: 0, borderRight: "1px solid #1E1E1E", background: "#0A0A0A", padding: "28px 20px", display: "flex", flexDirection: "column", zIndex: 50 }}>
          <div>
            <div style={{ fontFamily: "Syne, sans-serif", fontSize: 18, letterSpacing: "0.14em", fontWeight: 800, marginBottom: 32 }}>VORNIX FORGE</div>
            <nav style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {navItems.map((item) => (
                <a key={item.label} href={item.href} className={item.label === "Dashboard" ? "sidebar-link active" : "sidebar-link"} aria-current={item.label === "Dashboard" ? "page" : undefined}>
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: text }}>{profileName}</div>
                <div style={{ fontSize: 12, color: "#9A9A9A", marginTop: 4 }}>{specialisationGoal}</div>
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
            <header className="card" style={{ padding: 28, marginBottom: 24, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24 }}>
              <div>
                <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 36, lineHeight: 1.05, margin: 0 }}>Welcome back, {profileName}</h1>
                <div style={{ marginTop: 14, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                  <span className="badge">{levelEntry.name}</span>
                  <span className="muted">{specialisationGoal}</span>
                </div>
              </div>
              <div className="badge">Assessment Score {assessmentScore}%</div>
            </header>
            <section style={{ marginBottom: 24 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 16 }}>
                {[
                  { label: "Current Level", value: `Level ${currentLevel}` },
                  { label: "Modules Completed", value: modulesCompleted },
                  { label: "Assessment Score", value: `${assessmentScore}%` },
                  { label: "Days Active", value: daysActive },
                ].map((item) => (
                  <div key={item.label} className="card" style={{ padding: 20 }}>
                    <div className="muted" style={{ fontSize: 13, marginBottom: 12 }}>{item.label}</div>
                    <div className="stat-value">{item.value}</div>
                  </div>
                ))}
              </div>
            </section>
            <section className="card" style={{ padding: 28, marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
                <div style={{ maxWidth: 560 }}>
                  <div className="muted" style={{ fontSize: 13, marginBottom: 10 }}>Continue Learning</div>
                  <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: 26, margin: "0 0 10px 0" }}>{nextModule.title}</h2>
                  <p className="muted" style={{ margin: 0, lineHeight: 1.7 }}>{nextModule.description}</p>
                  <div style={{ marginTop: 14, fontSize: 13, color: accent, fontWeight: 600 }}>Estimated time: {nextModule.time}</div>
                </div>
                <a href="/learn" className="badge" style={{ textDecoration: "none" }}>Continue</a>
              </div>
              <div style={{ marginTop: 20 }}>
                <div className="progress-shell">
                  <div className="progress-bar" style={{ width: `${levelCompletion}%` }} />
                </div>
                <div className="muted" style={{ marginTop: 8, fontSize: 12 }}>{Math.round(levelCompletion)}% of current level completed</div>
              </div>
            </section>
            <section style={{ display: "grid", gridTemplateColumns: "1.2fr .8fr", gap: 24, marginBottom: 24 }}>
              <div className="card" style={{ padding: 28, minHeight: 420 }}>
                <div className="muted" style={{ fontSize: 13, marginBottom: 14 }}>Competency Map</div>
                <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: 24, margin: "0 0 16px 0" }}>Eight-skill profile</h2>
                <div style={{ width: "100%", height: 320 }}>
                  <ResponsiveContainer>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#222" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: "#F2F0EB", fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar dataKey="value" stroke={accent} fill={accent} fillOpacity={0.18} />
                      <Tooltip contentStyle={{ background: "#111", border: "1px solid #2A2A2A", color: text }} labelStyle={{ color: text }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="card" style={{ padding: 28 }}>
                <div className="muted" style={{ fontSize: 13, marginBottom: 14 }}>Profile Summary</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 12, color: "#999", marginBottom: 6 }}>Current Level</div>
                    <div style={{ fontFamily: "Syne, sans-serif", fontSize: 22 }}>{levelEntry.name}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#999", marginBottom: 6 }}>Learning Goal</div>
                    <div style={{ lineHeight: 1.6 }}>{specialisationGoal}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#999", marginBottom: 6 }}>Assessment Result</div>
                    <div style={{ lineHeight: 1.6 }}>{assessmentScore}% score places you at Level {currentLevel}.</div>
                  </div>
                </div>
              </div>
            </section>
            <section className="card" style={{ padding: 28, marginBottom: 24 }}>
              <div className="muted" style={{ fontSize: 13, marginBottom: 14 }}>Recent Activity</div>
              {summary && (summary.openPositions.length > 0 || summary.tradeHistory.length > 0 || summary.journalCount > 0) ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {summary.openPositions.length > 0 && (
                    <div style={{ padding: "12px 16px", borderRadius: 12, background: "#111111", border: "1px solid #1E1E1E", fontSize: 14 }}>
                      📈 {summary.openPositions.length} open position{summary.openPositions.length !== 1 ? "s" : ""} in simulator
                    </div>
                  )}
                  {summary.tradeHistory.length > 0 && (
                    <div style={{ padding: "12px 16px", borderRadius: 12, background: "#111111", border: "1px solid #1E1E1E", fontSize: 14 }}>
                      📊 {summary.tradeHistory.length} closed trade{summary.tradeHistory.length !== 1 ? "s" : ""} — P&L: ₹{summary.totalPnl.toFixed(2)}
                    </div>
                  )}
                  {summary.journalCount > 0 && (
                    <div style={{ padding: "12px 16px", borderRadius: 12, background: "#111111", border: "1px solid #1E1E1E", fontSize: 14 }}>
                      📝 {summary.journalCount} journal entries
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ border: "1px dashed #333", borderRadius: 14, padding: 28, color: "#8D8D8D", textAlign: "center" }}>
                  No activity yet. Complete your first module to get started.
                </div>
              )}
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

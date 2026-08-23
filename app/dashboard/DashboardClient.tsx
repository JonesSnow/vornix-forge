"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { colors, STORAGE_KEYS } from "@/lib/constants";
import { navItems, levelCopy, nextModules } from "@/lib/constants/content/dashboard-content";
import type { AssessmentStorage } from "@/lib/types";
import Sidebar from "../components/Sidebar";

const bg = colors.bg.primary;
const text = colors.text.primary;
const border = "#222222";
const sidebarWidth = 220;

function getLevelFromScore(score: number) {
  if (score <= 40) return 1;
  if (score <= 60) return 2;
  if (score <= 80) return 3;
  return 4;
}

type Deadline = {
  id: string;
  title: string;
  dueDate: string;
  courseTitle?: string;
  type?: string;
};

type FinanceData = {
  totalBalance?: number;
  monthlyIncome?: number;
  monthlyExpenses?: number;
  savingsRate?: number;
};

type Goal = {
  id: string;
  title: string;
  description: string;
  progress: number;
};

export default function DashboardClient() {
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);
  const [assessment, setAssessment] = useState<AssessmentStorage | null>(null);
  const [dashboardData, setDashboardData] = useState<{
    upcomingDeadlines?: Deadline[];
    finances?: FinanceData;
    goals?: Goal[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "finances" | "goals">("overview");

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
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/dashboard");
        if (res.ok) {
          const data = await res.json();
          setDashboardData(data);
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
  const currentLevel = assessment?.result?.level ?? assessment?.level ?? getLevelFromScore(assessmentScore);
  const levelEntry = levelCopy[currentLevel] ?? levelCopy[1];
  const nextModule = nextModules[currentLevel];

  const profileName = useMemo(() => {
    const email = user?.primaryEmailAddress?.emailAddress?.split("@")[0];
    return user?.fullName || user?.firstName || user?.username || email || "Signed-in user";
  }, [user]);

  const deadlines = useMemo(() => {
    if (!dashboardData?.upcomingDeadlines) return [];
    return dashboardData.upcomingDeadlines.slice(0, 5);
  }, [dashboardData]);

  const finances = useMemo(() => {
    if (!dashboardData?.finances) return null;
    return dashboardData.finances;
  }, [dashboardData]);

  const goals = useMemo(() => {
    if (!dashboardData?.goals) return [];
    return dashboardData.goals.slice(0, 4);
  }, [dashboardData]);

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
        <div style={{ color: "#888888" }}>Loading dashboard...</div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: bg, color: text }}>
      <Sidebar activeLabel="Dashboard" />

      <section style={{ marginLeft: sidebarWidth, width: `calc(100% - ${sidebarWidth}px)`, padding: "48px 40px 80px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <h1
              style={{
                fontFamily: "Syne, sans-serif",
                fontSize: 32,
                fontWeight: 700,
                margin: "0 0 8px 0",
                lineHeight: 1.1,
              }}
            >
              Welcome back, {profileName.split(" ")[0]}
            </h1>
            <p style={{ color: "#A0A0A0", fontSize: 14, lineHeight: 1.6, margin: 0 }}>
              {levelEntry.description}
            </p>
          </div>

          {/* Level & Next Module */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 20,
              marginBottom: 32,
            }}
          >
            <div
              style={{
                background: "#111111",
                border: "1px solid #222222",
                borderRadius: 16,
                padding: 28,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 600, color: "#888888", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                Current Level
              </div>
              <div style={{ fontFamily: "Syne, sans-serif", fontSize: 28, fontWeight: 700, color: "#E8A020", marginBottom: 8 }}>
                {levelEntry.name}
              </div>
              <div style={{ fontSize: 13, color: "#A0A0A0", lineHeight: 1.6 }}>
                Assessment score: {assessmentScore}%
              </div>
              <div className="progress-shell" style={{ marginTop: 14 }}>
                <div className="progress-bar" style={{ width: `${levelEntry.progress}%` }} />
              </div>
            </div>

            {nextModule && (
              <div
                style={{
                  background: "#111111",
                  border: "1px solid #222222",
                  borderRadius: 16,
                  padding: 28,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 600, color: "#888888", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                  Next Module
                </div>
                <div style={{ fontFamily: "Syne, sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 8, lineHeight: 1.3 }}>
                  {nextModule.title}
                </div>
                <div style={{ fontSize: 13, color: "#A0A0A0", lineHeight: 1.6, marginBottom: 16 }}>
                  {nextModule.description}
                </div>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "#888888" }}>{nextModule.time}</span>
                  <Link href="/learn" className="btn-primary" style={{ textDecoration: "none", fontSize: 13, padding: "8px 16px" }}>
                    Continue Learning
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Tab navigation */}
          <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: `1px solid ${border}` }}>
            {(["overview", "finances", "goals"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "10px 16px",
                  background: "transparent",
                  border: "none",
                  borderBottom: activeTab === tab ? "2px solid #E8A020" : "2px solid transparent",
                  color: activeTab === tab ? "#E8A020" : "#A0A0A0",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  marginBottom: -1,
                }}
              >
                {tab === "overview" ? "Overview" : tab === "finances" ? "Finances" : "Goals"}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === "overview" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
              <div
                style={{
                  background: "#111111",
                  border: "1px solid #222222",
                  borderRadius: 16,
                  padding: 28,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 600, color: "#888888", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
                  Upcoming Deadlines
                </div>
                {deadlines.length === 0 ? (
                  <div style={{ color: "#555555", fontSize: 14 }}>No upcoming deadlines.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {deadlines.map((d) => (
                      <div
                        key={d.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "12px 0",
                          borderBottom: "1px solid #222222",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "#F2F0EB" }}>{d.title}</div>
                          <div style={{ fontSize: 12, color: "#888888", marginTop: 3 }}>{d.courseTitle || d.type}</div>
                        </div>
                        <div style={{ fontSize: 12, color: "#E8A020", fontWeight: 600 }}>
                          {new Date(d.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div
                style={{
                  background: "#111111",
                  border: "1px solid #222222",
                  borderRadius: 16,
                  padding: 28,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 600, color: "#888888", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
                  Quick Actions
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {navItems.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 16px",
                        background: "#0F0F0F",
                        border: "1px solid #222222",
                        borderRadius: 10,
                        color: text,
                        textDecoration: "none",
                        fontSize: 14,
                        fontWeight: 500,
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#2A2A2A";
                        e.currentTarget.style.color = "#E8A020";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "#222222";
                        e.currentTarget.style.color = text;
                      }}
                    >
                      {item.label}
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#888888" }}>
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "finances" && (
            <div
              style={{
                background: "#111111",
                border: "1px solid #222222",
                borderRadius: 16,
                padding: 28,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 600, color: "#888888", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
                Financial Overview
              </div>
              {finances ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
                  {[
                    { label: "Total Balance", value: `₹${(finances.totalBalance || 0).toLocaleString()}`, color: "#E8A020" },
                    { label: "Monthly Income", value: `₹${(finances.monthlyIncome || 0).toLocaleString()}`, color: "#22C55E" },
                    { label: "Monthly Expenses", value: `₹${(finances.monthlyExpenses || 0).toLocaleString()}`, color: "#EF4444" },
                    { label: "Savings Rate", value: `${finances.savingsRate || 0}%`, color: "#E8A020" },
                  ].map((item) => (
                    <div key={item.label} style={{ padding: "16px 0", borderBottom: "1px solid #222222" }}>
                      <div style={{ fontSize: 12, color: "#888888", marginBottom: 6 }}>{item.label}</div>
                      <div style={{ fontFamily: "Syne, sans-serif", fontSize: 20, fontWeight: 700, color: item.color as string }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: "#555555", fontSize: 14 }}>No financial data available yet.</div>
              )}
            </div>
          )}

          {activeTab === "goals" && (
            <div
              style={{
                background: "#111111",
                border: "1px solid #222222",
                borderRadius: 16,
                padding: 28,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 600, color: "#888888", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
                Active Goals
              </div>
              {goals.length === 0 ? (
                <div style={{ color: "#555555", fontSize: 14 }}>No goals set yet.</div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
                  {goals.map((goal) => (
                    <div
                      key={goal.id}
                      style={{
                        background: "#0F0F0F",
                        border: "1px solid #222222",
                        borderRadius: 12,
                        padding: 20,
                      }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#F2F0EB", marginBottom: 8 }}>{goal.title}</div>
                      <div style={{ fontSize: 12, color: "#888888", marginBottom: 12, lineHeight: 1.6 }}>{goal.description}</div>
                      <div className="progress-shell" style={{ height: 6 }}>
                        <div className="progress-bar" style={{ width: `${Math.min(goal.progress || 0, 100)}%` }} />
                      </div>
                      <div style={{ fontSize: 12, color: "#888888", marginTop: 8 }}>{goal.progress || 0}% complete</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

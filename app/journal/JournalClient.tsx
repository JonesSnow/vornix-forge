"use client";

import React, { useEffect, useMemo, useState } from "react";
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

type JournalEntry = {
  id: string;
  title: string;
  content: string;
  mood: string;
  aiFeedback: string | null;
  createdAt: string;
  updatedAt: string;
};

type JournalClientProps = {
  userId: string;
};

const MOOD_EMOJI: Record<string, string> = {
  Confident: "😎",
  Neutral: "😐",
  Anxious: "😰",
  Frustrated: "😤",
  Excited: "🚀",
};

const MOOD_COLORS: Record<string, string> = {
  Confident: "#E8A020",
  Neutral: "#3B82F6",
  Anxious: "#A855F7",
  Frustrated: "#EF4444",
  Excited: "#22C55E",
};

export default function JournalClient({ userId }: JournalClientProps) {
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [assessment, setAssessment] = useState<AssessmentStorage | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [moodFilter, setMoodFilter] = useState<string | null>(null);

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
    async function fetchEntries() {
      try {
        const res = await fetch("/api/journal");
        if (res.ok) {
          const data = await res.json();
          setEntries(Array.isArray(data.entries) ? data.entries : []);
        }
      } catch (e) {
        console.error("Failed to fetch journal entries:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchEntries();
  }, []);

  const filteredEntries = useMemo(() => {
    if (!moodFilter) return entries;
    return entries.filter((e) => e.mood === moodFilter);
  }, [entries, moodFilter]);

  const MOOD_FILTERS = ["All", "Confident", "Neutral", "Anxious", "Frustrated", "Excited"] as const;

  const assessmentScore = assessment?.result?.score ?? assessment?.score ?? 0;
  const currentLevel = assessment?.result?.level ?? assessment?.level ?? getLevelFromScore(assessmentScore);

  const profileName = useMemo(() => {
    const email = user?.primaryEmailAddress?.emailAddress?.split("@")[0];
    return user?.fullName || user?.firstName || user?.username || email || "Signed-in user";
  }, [user]);

  async function handleDelete(entryId: string) {
    if (!confirm("Delete this journal entry?")) return;
    try {
      const res = await fetch(`/api/journal/${entryId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setEntries((prev) => prev.filter((e) => e.id !== entryId));
        if (selectedId === entryId) setSelectedId(null);
      }
    } catch (e) {
      console.error("Failed to delete entry:", e);
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
        <div style={{ color: "#888888" }}>Loading journal...</div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: bg, color: text }}>
      <Sidebar activeLabel="Journal" />

      <section style={{ marginLeft: sidebarWidth, width: `calc(100% - ${sidebarWidth}px)`, padding: "48px 40px 80px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <header style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 28 }}>
            <div>
              <h1
                style={{
                  fontFamily: "Syne, sans-serif",
                  fontSize: 36,
                  lineHeight: 1.05,
                  margin: 0,
                  fontWeight: 700,
                }}
              >
                Trade Journal
              </h1>
              <p style={{ color: "#A0A0A0", marginTop: 8, lineHeight: 1.6, fontSize: 14 }}>
                {filteredEntries.length} {filteredEntries.length === 1 ? "entry" : "entries"} · Reflect on your trades, track your mindset, and get AI-powered feedback.
              </p>
            </div>
            <a
              href="/journal/new"
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "10px 24px",
                background: "#E8A020",
                color: "#0A0A0A",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
                flexShrink: 0,
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#d4941a")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#E8A020")}
            >
              New Entry
            </a>
          </header>

          {/* Mood filters */}
          <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
            {MOOD_FILTERS.map((mood) => {
              const isActive = mood === "All" ? moodFilter === null : moodFilter === mood;
              return (
                <button
                  key={mood}
                  onClick={() => setMoodFilter(mood === "All" ? null : mood)}
                  style={{
                    padding: "6px 16px",
                    borderRadius: 8,
                    border: "1px solid #222222",
                    background: isActive ? "#E8A020" : "#111111",
                    color: isActive ? "#0A0A0A" : "#A0A0A0",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = "#2A2A2A";
                      e.currentTarget.style.color = "#F2F0EB";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = "#222222";
                      e.currentTarget.style.color = "#A0A0A0";
                    }
                  }}
                >
                  {mood}
                </button>
              );
            })}
          </div>

          {entries.length === 0 ? (
            <div
              style={{
                background: "#111111",
                border: "1px solid #222222",
                borderRadius: 12,
                padding: 56,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 16 }}>📝</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: "#F2F0EB" }}>No journal entries yet</div>
              <div style={{ color: "#A0A0A0", fontSize: 14 }}>Start reflecting on your trades.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {entries.map((entry) => {
                const isSelected = selectedId === entry.id;
                const moodEmoji = MOOD_EMOJI[entry.mood] || "📝";
                const moodColor = MOOD_COLORS[entry.mood] || "#E8A020";
                const preview = entry.content.length > 160 ? entry.content.slice(0, 160) + "..." : entry.content;

                return (
                  <div
                    key={entry.id}
                    style={{
                      background: "#111111",
                      border: "1px solid #222222",
                      borderLeft: `3px solid ${moodColor}`,
                      borderRadius: 12,
                      padding: "20px 24px",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    onClick={() => setSelectedId(isSelected ? null : entry.id)}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#2A2A2A")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = isSelected ? "#E8A020" : "#222222")}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 20 }}>{moodEmoji}</span>
                          <h3
                            style={{
                              fontFamily: "Syne, sans-serif",
                              fontSize: 17,
                              margin: 0,
                              lineHeight: 1.3,
                              fontWeight: 600,
                            }}
                          >
                            {entry.title}
                          </h3>
                          {entry.aiFeedback && (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "3px 10px",
                                borderRadius: 8,
                                background: "rgba(232, 160, 32, 0.08)",
                                border: "1px solid rgba(232, 160, 32, 0.25)",
                                color: "#E8A020",
                                fontSize: 11,
                                fontWeight: 600,
                              }}
                            >
                              AI Coach
                            </span>
                          )}
                        </div>
                        <p style={{ color: "#A0A0A0", fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                          {preview}
                        </p>
                        <div style={{ color: "#888888", fontSize: 12, marginTop: 10 }}>
                          {new Date(entry.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
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
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(entry.id);
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#EF4444")}
                          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#222222")}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    {isSelected && (
                      <div style={{ marginTop: 24, paddingTop: 24, borderTop: "1px solid #222222" }}>
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#E8A020",
                            marginBottom: 12,
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                          }}
                        >
                          Entry
                        </div>
                        <p
                          style={{
                            fontSize: 15,
                            lineHeight: 1.8,
                            margin: "0 0 20px 0",
                            color: "#F2F0EB",
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {entry.content}
                        </p>
                        <div
                          style={{
                            padding: 20,
                            borderRadius: 12,
                            background: "rgba(232, 160, 32, 0.04)",
                            border: "1px solid rgba(232, 160, 32, 0.15)",
                          }}
                        >
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: "#E8A020",
                              marginBottom: 12,
                              textTransform: "uppercase",
                              letterSpacing: "0.08em",
                            }}
                          >
                            AI Coach Feedback
                          </div>
                          {entry.aiFeedback ? (
                            <p style={{ fontSize: 14, lineHeight: 1.7, margin: 0, color: "#F2F0EB" }}>{entry.aiFeedback}</p>
                          ) : (
                            <p style={{ color: "#888888", fontSize: 14, margin: 0 }}>AI feedback is being generated...</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

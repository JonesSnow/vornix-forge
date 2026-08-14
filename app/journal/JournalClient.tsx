"use client";

import React, { useEffect, useMemo, useState } from "react";
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
        <div style={{ color: colors.text.muted }}>Loading journal...</div>
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
        .entry-card { background: #0F0F0F; border: 1px solid #1E1E1E; border-radius: 16px; padding: 20px 24px; transition: all .2s ease; cursor: pointer; }
        .entry-card:hover { border-color: #2A2A2A; }
        .entry-card.expanded { border-color: ${accent}; }
        .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 20px; border-radius: 12px; font-weight: 600; font-size: 14px; cursor: pointer; transition: all .2s ease; border: none; text-decoration: none; }
        .btn:hover { transform: translateY(-1px); }
        .btn-primary { background: ${accent}; color: #0A0A0A; }
        .btn-primary:hover { background: #d4941a; }
        .ai-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 8px; background: rgba(232, 160, 32, 0.08); border: 1px solid rgba(232,160,32,0.25); color: ${accent}; font-size: 11px; font-weight: 600; }
        .mood-btn { padding: 10px 14px; border-radius: 12px; border: 1px solid #1E1E1E; background: #111111; cursor: pointer; transition: all .2s ease; font-size: 20px; }
        .mood-btn:hover { border-color: #2A2A2A; background: #0F0F0F; }
        .mood-btn.selected { border-color: ${accent}; background: rgba(232, 160, 32, 0.08); }
        .journal-textarea { width: 100%; min-height: 240px; padding: 16px; border-radius: 16px; border: 1px solid #1E1E1E; background: #111111; color: ${text}; font-size: 15px; line-height: 1.7; outline: none; transition: border-color .2s ease; resize: vertical; font-family: 'Inter', sans-serif; }
        .journal-textarea:focus { border-color: ${accent}; }
        .journal-input { width: 100%; padding: 14px 16px; border-radius: 12px; border: 1px solid #1E1E1E; background: #111111; color: ${text}; font-size: 15px; outline: none; transition: border-color .2s ease; font-family: 'Inter', sans-serif; }
        .journal-input:focus { border-color: ${accent}; }
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
                  className={item.label === "Journal" ? "sidebar-link active" : "sidebar-link"}
                  aria-current={item.label === "Journal" ? "page" : undefined}
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

        <section style={{ marginLeft: sidebarWidth, width: `calc(100% - ${sidebarWidth}px)`, padding: 32 }}>
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <header style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 24 }}>
              <div>
                <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 36, lineHeight: 1.05, margin: 0 }}>Trade Journal</h1>
                <p className="muted" style={{ marginTop: 8, lineHeight: 1.6 }}>
                  {filteredEntries.length} {filteredEntries.length === 1 ? "entry" : "entries"} · Reflect on your trades, track your mindset, and get AI-powered feedback.
                </p>
              </div>
              <a href="/journal/new" className="btn btn-primary" style={{ flexShrink: 0 }}>
                New Entry
              </a>
            </header>

            <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
              {MOOD_FILTERS.map((mood) => (
                <button
                  key={mood}
                  onClick={() => setMoodFilter(mood === "All" ? null : mood)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 999,
                    border: "1px solid #1E1E1E",
                    background: moodFilter === (mood === "All" ? null : mood) ? accent : "#111111",
                    color: moodFilter === (mood === "All" ? null : mood) ? "#0A0A0A" : text,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all .2s ease",
                  }}
                >
                  {mood}
                </button>
              ))}
            </div>

            {entries.length === 0 ? (
              <div className="card" style={{ padding: 48, textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>📝</div>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No journal entries yet</div>
                <div className="muted" style={{ fontSize: 14 }}>
                  Start reflecting on your trades.
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {entries.map((entry) => {
                  const isSelected = selectedId === entry.id;
                  const moodEmoji = MOOD_EMOJI[entry.mood] || "📝";
                  const preview = entry.content.length > 160 ? entry.content.slice(0, 160) + "..." : entry.content;

                  return (
                    <div
                      key={entry.id}
                      className={`entry-card ${isSelected ? "expanded" : ""}`}
                      onClick={() => setSelectedId(isSelected ? null : entry.id)}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 20 }}>{moodEmoji}</span>
                            <h3 style={{ fontFamily: "Syne, sans-serif", fontSize: 17, margin: 0, lineHeight: 1.3 }}>{entry.title}</h3>
                            {entry.aiFeedback && <span className="ai-badge">AI Feedback</span>}
                          </div>
                          <p className="muted" style={{ fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                            {preview}
                          </p>
                          <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>
                            {new Date(entry.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                          <button
                            className="btn"
                            style={{ padding: "6px 12px", fontSize: 12, background: "#111111", border: "1px solid #1E1E1E", color: "#ef4444" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(entry.id);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      {isSelected && (
                        <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid #1E1E1E" }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: accent, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                            Entry
                          </div>
                          <p style={{ fontSize: 15, lineHeight: 1.8, margin: "0 0 20px 0", color: text, whiteSpace: "pre-wrap" }}>
                            {entry.content}
                          </p>
                          <div style={{ padding: 20, borderRadius: 12, background: "rgba(232, 160, 32, 0.04)", border: "1px solid rgba(232,160,32,0.15)" }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: accent, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                              AI Coach Feedback
                            </div>
                            {entry.aiFeedback ? (
                              <p style={{ fontSize: 14, lineHeight: 1.7, margin: 0, color: text }}>{entry.aiFeedback}</p>
                            ) : (
                              <p className="muted" style={{ fontSize: 14, margin: 0 }}>AI feedback is being generated...</p>
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
      </div>
    </main>
  );
}

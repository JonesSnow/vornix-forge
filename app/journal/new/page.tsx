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

type NewJournalClientProps = {
  userId: string;
};

const MOODS = [
  { label: "Confident", emoji: "😎" },
  { label: "Neutral", emoji: "😐" },
  { label: "Anxious", emoji: "😰" },
  { label: "Frustrated", emoji: "😤" },
  { label: "Excited", emoji: "🚀" },
];

export default function NewJournalClient({ userId }: NewJournalClientProps) {
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);
  const [assessment, setAssessment] = useState<AssessmentStorage | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("Neutral");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  const assessmentScore = assessment?.result?.score ?? assessment?.score ?? 0;
  const currentLevel = assessment?.result?.level ?? assessment?.level ?? getLevelFromScore(assessmentScore);

  const profileName = useMemo(() => {
    const email = user?.primaryEmailAddress?.emailAddress?.split("@")[0];
    return user?.fullName || user?.firstName || user?.username || email || "Signed-in user";
  }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, mood }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create entry");
      } else {
        setSuccess("Entry saved!");
        setTitle("");
        setContent("");
        setMood("Neutral");
        setTimeout(() => {
          window.location.href = "/journal";
        }, 600);
      }
    } catch (e) {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  if (!mounted) {
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
        <div style={{ color: colors.text.muted }}>Loading...</div>
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
        .mood-btn { padding: 10px 14px; border-radius: 12px; border: 1px solid #1E1E1E; background: #111111; cursor: pointer; transition: all .2s ease; font-size: 20px; }
        .mood-btn:hover { border-color: #2A2A2A; background: #0F0F0F; }
        .mood-btn.selected { border-color: ${accent}; background: rgba(232, 160, 32, 0.08); }
        .journal-input { width: 100%; padding: 14px 16px; border-radius: 12px; border: 1px solid #1E1E1E; background: #111111; color: ${text}; font-size: 15px; outline: none; transition: border-color .2s ease; font-family: 'Inter', sans-serif; }
        .journal-input:focus { border-color: ${accent}; }
        .journal-textarea { width: 100%; min-height: 240px; padding: 16px; border-radius: 16px; border: 1px solid #1E1E1E; background: #111111; color: ${text}; font-size: 15px; line-height: 1.7; outline: none; transition: border-color .2s ease; resize: vertical; font-family: 'Inter', sans-serif; }
        .journal-textarea:focus { border-color: ${accent}; }
        .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 20px; border-radius: 12px; font-weight: 600; font-size: 14px; cursor: pointer; transition: all .2s ease; border: none; }
        .btn:hover:not(:disabled) { transform: translateY(-1px); }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .btn-primary { background: ${accent}; color: #0A0A0A; }
        .btn-primary:hover:not(:disabled) { background: #d4941a; }
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
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <header style={{ marginBottom: 28 }}>
              <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 32, lineHeight: 1.1, margin: 0 }}>New Journal Entry</h1>
              <p className="muted" style={{ marginTop: 8, lineHeight: 1.6 }}>
                Reflect on your trading day. What happened? How did you feel? What will you do differently?
              </p>
            </header>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {error && <div style={{ color: "#ef4444", fontSize: 14 }}>{error}</div>}
              {success && <div style={{ color: "#4ade80", fontSize: 14 }}>{success}</div>}

              <div>
                <label className="muted" style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="journal-input"
                  placeholder="e.g. First day trading BTC"
                  required
                  maxLength={200}
                />
              </div>

              <div>
                <label className="muted" style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  How are you feeling?
                </label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {MOODS.map((m) => (
                    <button
                      key={m.label}
                      type="button"
                      className={`mood-btn ${mood === m.label ? "selected" : ""}`}
                      onClick={() => setMood(m.label)}
                      title={m.label}
                    >
                      {m.emoji}
                    </button>
                  ))}
                </div>
              </div>

               <div>
                 <label className="muted" style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                   Journal Entry
                 </label>
                 <textarea
                   value={content}
                   onChange={(e) => setContent(e.target.value)}
                   className="journal-textarea"
                   placeholder="What did I trade today?"
                   required
                   minLength={100}
                   maxLength={5000}
                 />
                 <div style={{ fontSize: 12, marginTop: 6, textAlign: "right", color: content.length >= 100 ? "#4ade80" : colors.text.muted }}>
                   {content.length}/5000 characters {content.length >= 100 ? "✓" : `(min 100)`}
                 </div>
               </div>

              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Saving..." : "Save Entry"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

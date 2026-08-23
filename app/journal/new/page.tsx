"use client";

import React, { useEffect, useMemo, useState } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import { colors, STORAGE_KEYS } from "@/lib/constants";
import { navItems, levelCopy } from "@/lib/constants/content/dashboard-content";
import type { AssessmentStorage } from "@/lib/types";
import Sidebar from "../../components/Sidebar";

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
        <div style={{ color: "#888888" }}>Loading...</div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: bg, color: text }}>
      <Sidebar activeLabel="Journal" />

      <section style={{ marginLeft: sidebarWidth, width: `calc(100% - ${sidebarWidth}px)`, padding: "48px 40px 80px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
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
              New Journal Entry
            </h1>
            <p style={{ color: "#A0A0A0", marginTop: 8, lineHeight: 1.6, fontSize: 14 }}>
              Reflect on your trading day. What happened? How did you feel? What will you do differently?
            </p>
          </header>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {error && (
              <div
                style={{
                  color: "#EF4444",
                  fontSize: 14,
                  padding: "12px 16px",
                  background: "rgba(239, 68, 68, 0.08)",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  borderRadius: 8,
                }}
              >
                {error}
              </div>
            )}
            {success && (
              <div
                style={{
                  color: "#22C55E",
                  fontSize: 14,
                  padding: "12px 16px",
                  background: "rgba(34, 197, 94, 0.08)",
                  border: "1px solid rgba(34, 197, 94, 0.2)",
                  borderRadius: 8,
                }}
              >
                {success}
              </div>
            )}

            <div>
              <label className="label">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input"
                placeholder="e.g. First day trading BTC"
                required
                maxLength={200}
              />
            </div>

            <div>
              <label className="label">How are you feeling?</label>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {MOODS.map((m) => (
                  <button
                    key={m.label}
                    type="button"
                    style={{
                      padding: "10px 18px",
                      borderRadius: 10,
                      border: `1px solid ${mood === m.label ? "#E8A020" : "#222222"}`,
                      background: mood === m.label ? "rgba(232, 160, 32, 0.08)" : "#111111",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      fontSize: 18,
                    }}
                    onClick={() => setMood(m.label)}
                    title={m.label}
                  >
                    {m.emoji}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 12, color: "#888888", marginTop: 8 }}>{mood}</div>
            </div>

            <div>
              <label className="label">Journal Entry</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                style={{
                  width: "100%",
                  minHeight: 280,
                  padding: 16,
                  borderRadius: 12,
                  border: "1px solid #222222",
                  background: "#111111",
                  color: "#F2F0EB",
                  fontSize: 15,
                  lineHeight: 1.8,
                  outline: "none",
                  transition: "border-color 0.15s ease",
                  resize: "vertical",
                  fontFamily: "Inter, sans-serif",
                }}
                placeholder="What did I trade today?"
                required
                minLength={100}
                maxLength={5000}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#E8A020")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#222222")}
              />
              <div
                style={{
                  fontSize: 12,
                  marginTop: 8,
                  textAlign: "right",
                  color: content.length >= 100 ? "#22C55E" : "#888888",
                }}
              >
                {content.length}/5000 characters {content.length >= 100 ? "✓" : `(min 100)`}
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
              style={{ opacity: submitting ? 0.6 : 1 }}
            >
              {submitting ? "Saving..." : "Save Entry"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

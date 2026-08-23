"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { colors, STORAGE_KEYS } from "@/lib/constants";
import {
  onboardingSteps,
  goalOptions,
  experienceOptions,
  marketOptions,
  timeOptions,
  riskOptions,
} from "@/lib/constants/content/onboarding-steps";
import type { OnboardingAnswers } from "@/lib/types";
import { logger } from "@/lib/utils";

const STORAGE_KEY = STORAGE_KEYS.onboardingAnswers;

const accent = colors.accent.primary;
const bg = colors.bg.primary;
const text = colors.text.primary;

const steps = onboardingSteps;

const STEP_ICONS: Record<number, string> = {
  1: "🎯",
  2: "📊",
  3: "🌐",
  4: "⏱",
  5: "🛡",
  6: "✅",
};

export default function OnboardingClient() {
  const router = useRouter();
  const { user } = useUser();
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<OnboardingAnswers>({ markets: [] });
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [marketError, setMarketError] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setAnswers({ markets: [], ...parsed });
      } catch (e) {
        // ignore
      }
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
  }, [answers, loaded]);

  function goTo(newStep: number) {
    if (newStep === step) return;
    setAnimating(true);
    setTimeout(() => {
      setStep(newStep);
      setAnimating(false);
    }, 250);
  }

  function next() {
    if (step === 3 && answers.markets.length === 0) {
      setMarketError(true);
      setTimeout(() => setMarketError(false), 2000);
      return;
    }
    if (step < 6) goTo(step + 1);
  }

  function back() {
    if (step > 1) goTo(step - 1);
  }

  function updateSingle<K extends keyof OnboardingAnswers>(key: K, value: OnboardingAnswers[K]) {
    setAnswers((a) => ({ ...a, [key]: value }));
  }

  function toggleMarket(m: string) {
    setAnswers((a) => {
      const exists = a.markets.includes(m);
      return { ...a, markets: exists ? a.markets.filter((x) => x !== m) : [...a.markets, m] };
    });
  }

  function percent() {
    if (step <= 5) return Math.round(((step - 1) / 5) * 100);
    return 100;
  }

  async function submitOnboarding() {
    setSaving(true);
    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: user?.firstName,
          lastName: user?.lastName,
          goal: answers.goal,
          experienceLevel: answers.experience,
          markets: answers.markets,
          dailyTime: answers.time,
          riskTolerance: answers.risk,
        }),
      });

      if (!response.ok) throw new Error("Failed to save profile");

      localStorage.setItem(STORAGE_KEYS.onboardingComplete, "true");
      router.push("/assessment");
    } catch (error) {
      logger.error("Error saving onboarding:", error);
      localStorage.setItem(STORAGE_KEYS.onboardingComplete, "true");
      router.push("/assessment");
    } finally {
      setSaving(false);
    }
  }

  const StepCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div
      style={{
        background: "#111111",
        border: "1px solid #222222",
        borderRadius: 16,
        padding: 40,
        maxWidth: 720,
        width: "100%",
        opacity: animating ? 0 : 1,
        transform: animating ? "translateY(12px)" : "translateY(0)",
        transition: "opacity .25s ease, transform .25s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "rgba(232, 160, 32, 0.1)",
            border: "1px solid rgba(232, 160, 32, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            flexShrink: 0,
          }}
        >
          {STEP_ICONS[step] || "📋"}
        </div>
        <h2
          style={{
            fontFamily: "Syne, sans-serif",
            fontSize: 22,
            margin: 0,
            color: text,
            fontWeight: 700,
          }}
        >
          {title}
        </h2>
      </div>
      {children}
    </div>
  );

  const stepLabels = ["Goal", "Experience", "Markets", "Time", "Risk", "Review"];

  return (
    <main
      style={{
        minHeight: "100vh",
        background: bg,
        color: text,
        fontFamily: "Inter, sans-serif",
        padding: "48px 24px",
      }}
    >
      <div
        style={{
          maxWidth: 920,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Logo */}
        <div
          style={{
            fontFamily: "Syne, sans-serif",
            fontSize: 13,
            letterSpacing: "0.15em",
            fontWeight: 700,
            color: text,
            marginBottom: 48,
            textAlign: "center",
          }}
        >
          VORNIX FORGE
        </div>

        <div style={{ width: 280, marginBottom: 40 }}>
          <div className="progress-shell" style={{ height: 4 }}>
            <div className="progress-bar" style={{ width: `${percent()}%` }} />
          </div>
          <div
            style={{
              fontSize: 12,
              color: "#888888",
              marginTop: 8,
              textAlign: "right",
              fontWeight: 500,
            }}
          >
            {stepLabels[step - 1]} · {percent()}%
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
          {step <= 5 ? (
            <StepCard title={steps[step - 1]}>
              {step === 1 && (
                <div>
                  <p style={{ fontSize: 14, color: "#A0A0A0", marginBottom: 20, lineHeight: 1.7 }}>
                    What brings you to trading?
                  </p>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                      gap: 12,
                    }}
                  >
                    {goalOptions.map((o) => {
                      const isSelected = answers.goal === o;
                      return (
                        <button
                          key={o}
                          style={{
                            padding: "18px 20px",
                            borderRadius: 12,
                            border: `1px solid ${isSelected ? "#E8A020" : "#222222"}`,
                            background: isSelected ? "rgba(232, 160, 32, 0.08)" : "#0F0F0F",
                            color: isSelected ? "#F2F0EB" : "#A0A0A0",
                            fontSize: 14,
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                            textAlign: "left",
                            fontWeight: isSelected ? 600 : 400,
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                          onClick={() => updateSingle("goal", o)}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.borderColor = "#2A2A2A";
                              e.currentTarget.style.color = "#F2F0EB";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.borderColor = "#222222";
                              e.currentTarget.style.color = "#A0A0A0";
                            }
                          }}
                        >
                          {isSelected && (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E8A020" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                          {o}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <p style={{ fontSize: 14, color: "#A0A0A0", marginBottom: 20, lineHeight: 1.7 }}>
                    How much trading experience do you have?
                  </p>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                      gap: 12,
                    }}
                  >
                    {experienceOptions.map((o) => {
                      const isSelected = answers.experience === o;
                      return (
                        <button
                          key={o}
                          style={{
                            padding: "18px 20px",
                            borderRadius: 12,
                            border: `1px solid ${isSelected ? "#E8A020" : "#222222"}`,
                            background: isSelected ? "rgba(232, 160, 32, 0.08)" : "#0F0F0F",
                            color: isSelected ? "#F2F0EB" : "#A0A0A0",
                            fontSize: 14,
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                            textAlign: "left",
                            fontWeight: isSelected ? 600 : 400,
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                          onClick={() => updateSingle("experience", o)}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.borderColor = "#2A2A2A";
                              e.currentTarget.style.color = "#F2F0EB";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.borderColor = "#222222";
                              e.currentTarget.style.color = "#A0A0A0";
                            }
                          }}
                        >
                          {isSelected && (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E8A020" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                          {o}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <p style={{ fontSize: 14, color: "#A0A0A0", marginBottom: 8, lineHeight: 1.7 }}>
                    Which markets interest you? Select all that apply.
                  </p>
                  {marketError && (
                    <div style={{ color: "#EF4444", fontSize: 13, marginBottom: 12 }}>Please select at least one market</div>
                  )}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: 12,
                    }}
                  >
                    {marketOptions.map((o) => {
                      const isSelected = answers.markets.includes(o);
                      return (
                        <button
                          key={o}
                          style={{
                            padding: "18px 20px",
                            borderRadius: 12,
                            border: `1px solid ${isSelected ? "#E8A020" : "#222222"}`,
                            background: isSelected ? "rgba(232, 160, 32, 0.08)" : "#0F0F0F",
                            color: isSelected ? "#F2F0EB" : "#A0A0A0",
                            fontSize: 14,
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                            textAlign: "left",
                            fontWeight: isSelected ? 600 : 400,
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                          onClick={() => toggleMarket(o)}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.borderColor = "#2A2A2A";
                              e.currentTarget.style.color = "#F2F0EB";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.borderColor = "#222222";
                              e.currentTarget.style.color = "#A0A0A0";
                            }
                          }}
                        >
                          {isSelected && (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E8A020" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                          {o}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === 4 && (
                <div>
                  <p style={{ fontSize: 14, color: "#A0A0A0", marginBottom: 20, lineHeight: 1.7 }}>
                    How much time can you dedicate to trading each day?
                  </p>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                      gap: 12,
                    }}
                  >
                    {timeOptions.map((o) => {
                      const isSelected = answers.time === o;
                      return (
                        <button
                          key={o}
                          style={{
                            padding: "18px 20px",
                            borderRadius: 12,
                            border: `1px solid ${isSelected ? "#E8A020" : "#222222"}`,
                            background: isSelected ? "rgba(232, 160, 32, 0.08)" : "#0F0F0F",
                            color: isSelected ? "#F2F0EB" : "#A0A0A0",
                            fontSize: 14,
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                            textAlign: "left",
                            fontWeight: isSelected ? 600 : 400,
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                          onClick={() => updateSingle("time", o)}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.borderColor = "#2A2A2A";
                              e.currentTarget.style.color = "#F2F0EB";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.borderColor = "#222222";
                              e.currentTarget.style.color = "#A0A0A0";
                            }
                          }}
                        >
                          {isSelected && (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E8A020" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                          {o}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === 5 && (
                <div>
                  <p style={{ fontSize: 14, color: "#A0A0A0", marginBottom: 20, lineHeight: 1.7 }}>
                    What is your risk tolerance?
                  </p>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                      gap: 12,
                    }}
                  >
                    {riskOptions.map((o) => {
                      const isSelected = answers.risk === o;
                      return (
                        <button
                          key={o}
                          style={{
                            padding: "18px 20px",
                            borderRadius: 12,
                            border: `1px solid ${isSelected ? "#E8A020" : "#222222"}`,
                            background: isSelected ? "rgba(232, 160, 32, 0.08)" : "#0F0F0F",
                            color: isSelected ? "#F2F0EB" : "#A0A0A0",
                            fontSize: 14,
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                            textAlign: "left",
                            fontWeight: isSelected ? 600 : 400,
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                          onClick={() => updateSingle("risk", o)}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.borderColor = "#2A2A2A";
                              e.currentTarget.style.color = "#F2F0EB";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.borderColor = "#222222";
                              e.currentTarget.style.color = "#A0A0A0";
                            }
                          }}
                        >
                          {isSelected && (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E8A020" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                          {o}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: 12, marginTop: 28, justifyContent: "space-between" }}>
                <button
                  style={{
                    padding: "10px 20px",
                    borderRadius: 8,
                    border: "1px solid #222222",
                    background: "transparent",
                    color: "#888888",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onClick={back}
                  disabled={step === 1}
                >
                  Back
                </button>
                <button className="btn-primary" onClick={next}>
                  {step < 5 ? "Next" : "Review"}
                </button>
              </div>
            </StepCard>
          ) : (
            <StepCard title="Review Your Answers">
              <div style={{ marginBottom: 24 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "12px 0",
                    borderBottom: "1px solid #222222",
                  }}
                >
                  <span style={{ color: "#888888", fontSize: 14 }}>Trading goal</span>
                  <span style={{ color: "#F2F0EB", fontWeight: 600, fontSize: 14 }}>{answers.goal || "—"}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "12px 0",
                    borderBottom: "1px solid #222222",
                  }}
                >
                  <span style={{ color: "#888888", fontSize: 14 }}>Experience</span>
                  <span style={{ color: "#F2F0EB", fontWeight: 600, fontSize: 14 }}>{answers.experience || "—"}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "12px 0",
                    borderBottom: "1px solid #222222",
                  }}
                >
                  <span style={{ color: "#888888", fontSize: 14 }}>Markets</span>
                  <span style={{ color: "#F2F0EB", fontWeight: 600, fontSize: 14, textAlign: "right", maxWidth: "60%" }}>
                    {answers.markets.length ? answers.markets.join(", ") : "—"}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "12px 0",
                    borderBottom: "1px solid #222222",
                  }}
                >
                  <span style={{ color: "#888888", fontSize: 14 }}>Daily time</span>
                  <span style={{ color: "#F2F0EB", fontWeight: 600, fontSize: 14 }}>{answers.time || "—"}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "12px 0",
                  }}
                >
                  <span style={{ color: "#888888", fontSize: 14 }}>Risk tolerance</span>
                  <span style={{ color: "#F2F0EB", fontWeight: 600, fontSize: 14 }}>{answers.risk || "—"}</span>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "space-between" }}>
                <button
                  style={{
                    padding: "10px 20px",
                    borderRadius: 8,
                    border: "1px solid #222222",
                    background: "transparent",
                    color: "#888888",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onClick={() => goTo(5)}
                >
                  Back
                </button>
                <button
                  className="btn-primary"
                  onClick={submitOnboarding}
                  disabled={saving}
                  style={{ opacity: saving ? 0.6 : 1 }}
                >
                  {saving ? (
                    <>
                      <span
                        style={{
                          width: 16,
                          height: 16,
                          border: "2px solid #0A0A0A",
                          borderTopColor: "transparent",
                          borderRadius: "50%",
                          animation: "spin .8s linear infinite",
                          display: "inline-block",
                          verticalAlign: "middle",
                        }}
                      />
                      Saving...
                    </>
                  ) : (
                    "Start My Assessment"
                  )}
                </button>
              </div>
            </StepCard>
          )}
        </div>

        {/* Progress dots */}
        <div style={{ display: "flex", gap: 8, marginTop: 40 }}>
          {[1, 2, 3, 4, 5, 6].map((dotStep) => (
            <div
              key={dotStep}
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: dotStep === step ? "#E8A020" : dotStep < step ? "#E8A020" : "#222222",
                transition: "all 0.15s ease",
              }}
            />
          ))}
        </div>
      </div>
    </main>
  );
}

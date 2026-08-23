"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { colors, STORAGE_KEYS } from "@/lib/constants";
import { knowledgeQuestions, practicalTasks, correctAnswers } from "@/lib/constants/content/assessment-questions";
import { levelDescriptions } from "@/lib/constants/content/assessment-levels";
import type { Question, AssessmentAnswers, AssessmentResult } from "@/lib/types";
import { logger } from "@/lib/utils";

const STORAGE_KEY = STORAGE_KEYS.assessment;

const bg = colors.bg.primary;
const text = colors.text.primary;
const accent = colors.accent.primary;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

type CategoryScore = {
  category: string;
  total: number;
  correct: number;
  wrong: Array<{ question: string; yourAnswer: string; correctAnswer: string }>;
};

export default function AssessmentClient() {
  const router = useRouter();
  const [stage, setStage] = useState<"knowledge" | "practical" | "result">("knowledge");
  const [questionIdx, setQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<AssessmentAnswers>({});
  const [practicalAnswers, setPracticalAnswers] = useState<AssessmentAnswers>({});
  const [loaded, setLoaded] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const { answers: a, practicalAnswers: pa } = JSON.parse(raw);
        setAnswers(a || {});
        setPracticalAnswers(pa || {});
      } catch (e) {
        // ignore
      }
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const interval = setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [loaded]);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ answers, practicalAnswers, result })
      );
    }
  }, [answers, practicalAnswers, result, loaded]);

  function selectAnswer(qId: number, optIdx: number) {
    setAnswers((a) => ({ ...a, [qId]: optIdx }));
  }

  function selectPractical(taskId: number, optIdx: number) {
    setPracticalAnswers((p) => ({ ...p, [taskId]: optIdx }));
  }

  function nextQuestion() {
    if (stage === "knowledge") {
      if (questionIdx < knowledgeQuestions.length - 1) {
        setQuestionIdx((i) => i + 1);
      } else {
        setStage("practical");
        setQuestionIdx(0);
      }
    }
  }

  function prevQuestion() {
    if (stage === "knowledge") {
      if (questionIdx > 0) {
        setQuestionIdx((i) => i - 1);
      }
    } else if (stage === "practical") {
      setStage("knowledge");
      setQuestionIdx(knowledgeQuestions.length - 1);
    }
  }

  function calculateScore() {
    let correct = 0;
    knowledgeQuestions.forEach((q) => {
      if (answers[q.id] === q.correct) correct++;
    });

    correctAnswers.forEach((ans, idx) => {
      if (practicalAnswers[idx + 1] === ans) correct++;
    });

    const totalQuestions = knowledgeQuestions.length + 3;
    return Math.round((correct / totalQuestions) * 100);
  }

  function calculateCategoryScores(): CategoryScore[] {
    const categories: Record<string, { total: number; correct: number; wrong: CategoryScore["wrong"] }> = {};

    knowledgeQuestions.forEach((q) => {
      if (!categories[q.topic]) {
        categories[q.topic] = { total: 0, correct: 0, wrong: [] };
      }
      categories[q.topic].total++;
      const userAnswerIdx = answers[q.id];
      const isCorrect = userAnswerIdx === q.correct;
      if (isCorrect) {
        categories[q.topic].correct++;
      } else {
        categories[q.topic].wrong.push({
          question: q.question,
          yourAnswer: userAnswerIdx !== undefined ? q.options[userAnswerIdx] : "No answer",
          correctAnswer: q.options[q.correct],
        });
      }
    });

    return Object.entries(categories).map(([category, data]) => ({
      category,
      total: data.total,
      correct: data.correct,
      wrong: data.wrong,
    }));
  }

  function finishAssessment() {
    const score = calculateScore();
    const level = score <= 40 ? 1 : score <= 60 ? 2 : score <= 80 ? 3 : 4;
    const storedResult = { score, level };
    setResult(storedResult);
    setStage("result");
  }

  async function submitAssessment() {
    if (!result) return;

    setSaving(true);
    try {
      const response = await fetch("/api/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score: result.score,
          level: result.level,
        }),
      });

      if (!response.ok) throw new Error("Failed to save assessment");

      localStorage.setItem("vornix_assessment_complete", "true");
      router.push("/dashboard");
    } catch (error) {
      logger.error("Error saving assessment:", error);
      localStorage.setItem(STORAGE_KEYS.assessmentComplete, "true");
      router.push("/dashboard");
    } finally {
      setSaving(false);
    }
  }

  const currentQuestion = knowledgeQuestions[questionIdx];
  const progress = Math.round(
    ((questionIdx + 1) / knowledgeQuestions.length) * 100
  );

  const categoryScores = stage === "result" ? calculateCategoryScores() : [];

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
      {/* Thin progress bar at top */}
      {stage === "knowledge" && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: "#1A1A1A",
            zIndex: 100,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: "#E8A020",
              transition: "width 0.35s ease",
            }}
          />
        </div>
      )}

      <div style={{ maxWidth: 920, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 32,
          }}
        >
          <h1
            style={{
              fontFamily: "Syne, sans-serif",
              fontSize: 24,
              margin: 0,
              fontWeight: 700,
            }}
          >
            Assessment
          </h1>
          <div
            style={{
              fontFamily: "Syne, sans-serif",
              fontSize: 14,
              color: "#888888",
              background: "#111111",
              padding: "6px 14px",
              borderRadius: 8,
              border: "1px solid #222222",
              fontWeight: 600,
            }}
          >
            {formatTime(elapsed)}
          </div>
        </div>

        {stage === "knowledge" && (
          <>
            <div style={{ marginBottom: 28 }}>
              <div style={{ width: 280, margin: "0 0 8px 0" }}>
                <div
                  style={{
                    fontSize: 12,
                    color: "#888888",
                    textAlign: "right",
                    marginBottom: 6,
                  }}
                >
                  Part 1: Knowledge · Question {questionIdx + 1} of {knowledgeQuestions.length}
                </div>
                <div className="progress-shell">
                  <div className="progress-bar" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>

            <div
              style={{
                background: "#111111",
                border: "1px solid #222222",
                borderRadius: 12,
                padding: 36,
                maxWidth: 720,
                margin: "0 auto",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#E8A020",
                  marginBottom: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                {currentQuestion.topic}
              </div>
              <h2
                style={{
                  fontFamily: "Syne, sans-serif",
                  fontSize: 22,
                  marginBottom: 28,
                  lineHeight: 1.3,
                  fontWeight: 700,
                }}
              >
                {currentQuestion.question}
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {currentQuestion.options.map((opt, idx) => (
                  <button
                    key={idx}
                    style={{
                      width: "100%",
                      padding: "14px 18px",
                      borderRadius: 10,
                      border: `1px solid ${answers[currentQuestion.id] === idx ? "#E8A020" : "#222222"}`,
                      background: answers[currentQuestion.id] === idx ? "#E8A020" : "#0F0F0F",
                      color: answers[currentQuestion.id] === idx ? "#0A0A0A" : "#F2F0EB",
                      fontSize: 14,
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      fontWeight: answers[currentQuestion.id] === idx ? 600 : 400,
                    }}
                    onClick={() => selectAnswer(currentQuestion.id, idx)}
                    onMouseEnter={(e) => {
                      if (answers[currentQuestion.id] !== idx) {
                        e.currentTarget.style.borderColor = "#E8A020";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (answers[currentQuestion.id] !== idx) {
                        e.currentTarget.style.borderColor = "#222222";
                      }
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 28, justifyContent: "flex-end" }}>
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
                  onClick={prevQuestion}
                  disabled={questionIdx === 0}
                >
                  Back
                </button>
                <button
                  className="btn-primary"
                  onClick={nextQuestion}
                >
                  {questionIdx === knowledgeQuestions.length - 1
                    ? "Next Part"
                    : "Next"}
                </button>
              </div>
            </div>
          </>
        )}

        {stage === "practical" && (
          <>
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h1
                  style={{
                    fontFamily: "Syne, sans-serif",
                    fontSize: 24,
                    margin: 0,
                    fontWeight: 700,
                  }}
                >
                  Assessment
                </h1>
                <div
                  style={{
                    fontFamily: "Syne, sans-serif",
                    fontSize: 14,
                    color: "#888888",
                    background: "#111111",
                    padding: "6px 14px",
                    borderRadius: 8,
                    border: "1px solid #222222",
                    fontWeight: 600,
                  }}
                >
                  {formatTime(elapsed)}
                </div>
              </div>
              <div style={{ fontSize: 12, color: "#888888" }}>
                Part 2: Practical Tasks — {Object.keys(practicalAnswers).length} of 3 completed
              </div>
            </div>

            <div
              style={{
                background: "#111111",
                border: "1px solid #222222",
                borderRadius: 12,
                padding: 36,
                maxWidth: 720,
                margin: "0 auto",
              }}
            >
              <div style={{ marginBottom: 36 }}>
                <h3
                  style={{
                    fontFamily: "Syne, sans-serif",
                    fontSize: 16,
                    marginBottom: 14,
                    fontWeight: 700,
                  }}
                >
                  Task 1: Chart Pattern Recognition
                </h3>
                <div
                  style={{
                    background: "#0F0F0F",
                    padding: 18,
                    borderRadius: 10,
                    marginBottom: 14,
                    border: "1px solid #222222",
                  }}
                >
                  <div style={{ fontSize: 14, color: "#A0A0A0", lineHeight: 1.7 }}>
                    You see a price chart where each successive candle has higher highs and higher lows. Is this an uptrend or downtrend?
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {["Downtrend", "Uptrend", "Sideways / Consolidation", "Unable to determine"].map(
                    (opt, idx) => (
                      <button
                        key={idx}
                        style={{
                          width: "100%",
                          padding: "14px 18px",
                          borderRadius: 10,
                          border: `1px solid ${practicalAnswers[1] === idx ? "#E8A020" : "#222222"}`,
                          background: practicalAnswers[1] === idx ? "#E8A020" : "#0F0F0F",
                          color: practicalAnswers[1] === idx ? "#0A0A0A" : "#F2F0EB",
                          fontSize: 14,
                          textAlign: "left",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          fontWeight: practicalAnswers[1] === idx ? 600 : 400,
                        }}
                        onClick={() => selectPractical(1, idx)}
                        onMouseEnter={(e) => {
                          if (practicalAnswers[1] !== idx) {
                            e.currentTarget.style.borderColor = "#E8A020";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (practicalAnswers[1] !== idx) {
                            e.currentTarget.style.borderColor = "#222222";
                          }
                        }}
                      >
                        {opt}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div style={{ borderTop: "1px solid #222222", margin: "28px 0" }} />

              <div style={{ marginBottom: 36 }}>
                <h3
                  style={{
                    fontFamily: "Syne, sans-serif",
                    fontSize: 16,
                    marginBottom: 14,
                    fontWeight: 700,
                  }}
                >
                  Task 2: Position Sizing
                </h3>
                <div
                  style={{
                    background: "#0F0F0F",
                    padding: 18,
                    borderRadius: 10,
                    marginBottom: 14,
                    border: "1px solid #222222",
                  }}
                >
                  <div style={{ fontSize: 14, color: "#A0A0A0", lineHeight: 1.7 }}>
                    You have ₹10,000 and decide to risk only 2% per trade. What is your maximum loss per trade?
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {["₹50", "₹100", "₹200", "₹500"].map((opt, idx) => (
                    <button
                      key={idx}
                      style={{
                        width: "100%",
                        padding: "14px 18px",
                        borderRadius: 10,
                        border: `1px solid ${practicalAnswers[2] === idx ? "#E8A020" : "#222222"}`,
                        background: practicalAnswers[2] === idx ? "#E8A020" : "#0F0F0F",
                        color: practicalAnswers[2] === idx ? "#0A0A0A" : "#F2F0EB",
                        fontSize: 14,
                        textAlign: "left",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        fontWeight: practicalAnswers[2] === idx ? 600 : 400,
                      }}
                      onClick={() => selectPractical(2, idx)}
                      onMouseEnter={(e) => {
                        if (practicalAnswers[2] !== idx) {
                          e.currentTarget.style.borderColor = "#E8A020";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (practicalAnswers[2] !== idx) {
                          e.currentTarget.style.borderColor = "#222222";
                        }
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: "1px solid #222222", margin: "28px 0" }} />

              <div style={{ marginBottom: 24 }}>
                <h3
                  style={{
                    fontFamily: "Syne, sans-serif",
                    fontSize: 16,
                    marginBottom: 14,
                    fontWeight: 700,
                  }}
                >
                  Task 3: Risk Management Scenario
                </h3>
                <div
                  style={{
                    background: "#0F0F0F",
                    padding: 18,
                    borderRadius: 10,
                    marginBottom: 14,
                    border: "1px solid #222222",
                  }}
                >
                  <div style={{ fontSize: 14, color: "#A0A0A0", lineHeight: 1.7 }}>
                    You bought a stock at ₹100. It has dropped to ₹92. You had set a 5% stop loss (exit at ₹95). What should you do?
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    "Exit immediately — your stop loss has been hit",
                    "Hold and wait for recovery",
                    "Buy more to average down the price",
                    "Move your stop loss to ₹90 to avoid the loss",
                  ].map((opt, idx) => (
                    <button
                      key={idx}
                      style={{
                        width: "100%",
                        padding: "14px 18px",
                        borderRadius: 10,
                        border: `1px solid ${practicalAnswers[3] === idx ? "#E8A020" : "#222222"}`,
                        background: practicalAnswers[3] === idx ? "#E8A020" : "#0F0F0F",
                        color: practicalAnswers[3] === idx ? "#0A0A0A" : "#F2F0EB",
                        fontSize: 14,
                        textAlign: "left",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        fontWeight: practicalAnswers[3] === idx ? 600 : 400,
                      }}
                      onClick={() => selectPractical(3, idx)}
                      onMouseEnter={(e) => {
                        if (practicalAnswers[3] !== idx) {
                          e.currentTarget.style.borderColor = "#E8A020";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (practicalAnswers[3] !== idx) {
                          e.currentTarget.style.borderColor = "#222222";
                        }
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 28, justifyContent: "flex-end" }}>
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
                  onClick={prevQuestion}
                >
                  Back
                </button>
                <button
                  className="btn-primary"
                  onClick={finishAssessment}
                >
                  Get Results
                </button>
              </div>
            </div>
          </>
        )}

        {stage === "result" && result && (
          <>
            <div style={{ marginBottom: 28 }}>
              <h1
                style={{
                  fontFamily: "Syne, sans-serif",
                  fontSize: 24,
                  margin: "0 0 12px 0",
                  fontWeight: 700,
                }}
              >
                Your Result
              </h1>
            </div>

            <div
              style={{
                background: "#111111",
                border: "1px solid #222222",
                borderRadius: 12,
                padding: 40,
                maxWidth: 720,
                margin: "0 auto",
              }}
            >
              <div style={{ textAlign: "center", marginBottom: 36 }}>
                <div
                  style={{
                    fontFamily: "Syne, sans-serif",
                    fontSize: 80,
                    fontWeight: 800,
                    color: "#E8A020",
                    margin: "0 0 10px 0",
                    lineHeight: 1,
                  }}
                >
                  {result.score}%
                </div>
                <div style={{ fontSize: 15, color: "#A0A0A0", fontWeight: 500 }}>
                  {levelDescriptions[result.level - 1].range} —{" "}
                  {levelDescriptions[result.level - 1].title} Trader
                </div>
                <div style={{ fontSize: 12, color: "#555555", marginTop: 8 }}>
                  Time elapsed: {formatTime(elapsed)}
                </div>
              </div>

              <div
                style={{
                  background: "#0F0F0F",
                  padding: 24,
                  borderRadius: 10,
                  marginBottom: 28,
                  border: "1px solid #E8A020",
                }}
              >
                <h3
                  style={{
                    fontFamily: "Syne, sans-serif",
                    fontSize: 16,
                    marginBottom: 10,
                    color: "#E8A020",
                    fontWeight: 700,
                  }}
                >
                  Level {result.level}: {levelDescriptions[result.level - 1].title}
                </h3>
                <p style={{ fontSize: 14, color: "#A0A0A0", lineHeight: 1.7, margin: 0 }}>
                  {levelDescriptions[result.level - 1].desc}
                </p>
              </div>

              <div style={{ marginBottom: 28 }}>
                <h4
                  style={{
                    fontFamily: "Syne, sans-serif",
                    fontSize: 14,
                    marginBottom: 16,
                    color: "#F2F0EB",
                    fontWeight: 700,
                  }}
                >
                  Category Breakdown:
                </h4>
                {categoryScores.map((cat) => (
                  <div
                    key={cat.category}
                    style={{
                      background: "#0F0F0F",
                      border: "1px solid #222222",
                      borderRadius: 10,
                      padding: 20,
                      marginBottom: 14,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "Syne, sans-serif",
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#E8A020",
                        marginBottom: 10,
                      }}
                    >
                      {cat.category} — {cat.correct}/{cat.total} correct
                    </div>
                    {cat.wrong.length > 0 && (
                      <div style={{ marginTop: 14 }}>
                        {cat.wrong.map((w, i) => (
                          <div
                            key={i}
                            style={{
                              background: "#0A0A0A",
                              border: "1px solid #222222",
                              borderRadius: 8,
                              padding: 14,
                              marginBottom: 10,
                            }}
                          >
                            <div style={{ fontSize: 13, color: "#F2F0EB", marginBottom: 8 }}>{w.question}</div>
                            <div style={{ fontSize: 12, color: "#EF4444", marginBottom: 4 }}>Your answer: {w.yourAnswer}</div>
                            <div style={{ fontSize: 12, color: "#22C55E" }}>Correct answer: {w.correctAnswer}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button
                className="btn-primary"
                onClick={submitAssessment}
                disabled={saving}
                style={{
                  width: "100%",
                  padding: "14px",
                  fontSize: 15,
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? 'Saving...' : 'Begin My Journey'}
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

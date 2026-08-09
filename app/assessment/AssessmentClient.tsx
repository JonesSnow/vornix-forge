"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { colors, STORAGE_KEYS } from "@/lib/constants";
import { knowledgeQuestions, practicalTasks, correctAnswers } from "@/lib/constants/content/assessment-questions";
import { levelDescriptions } from "@/lib/constants/content/assessment-levels";
import type { Question, AssessmentAnswers, AssessmentResult } from "@/types";
import { logger } from "@/lib/utils";

const STORAGE_KEY = STORAGE_KEYS.assessment;

const bg = colors.bg.primary;
const text = colors.text.primary;
const accent = colors.accent.primary;

export default function AssessmentClient() {
  const router = useRouter();
  const [stage, setStage] = useState<"knowledge" | "practical" | "result">("knowledge");
  const [questionIdx, setQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<AssessmentAnswers>({});
  const [practicalAnswers, setPracticalAnswers] = useState<AssessmentAnswers>({});
  const [loaded, setLoaded] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [saving, setSaving] = useState(false);

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
    if (questionIdx > 0) setQuestionIdx((i) => i - 1);
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

      // Set localStorage as backup
      localStorage.setItem("vornix_assessment_complete", "true");
      router.push("/dashboard");
    } catch (error) {
      logger.error("Error saving assessment:", error);
      // Still proceed even if API fails, localStorage is backup
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

  return (
    <main
      style={{
        minHeight: "100vh",
        background: bg,
        color: text,
        fontFamily: "'Inter', sans-serif",
        padding: "48px 16px"
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Syne:wght@600;700;800&display=swap');
        .progress { height: 10px; background: #151515; border-radius: 999px; overflow: hidden; }
        .progress-bar { height: 100%; background: ${accent}; transition: width .35s ease; }
        .option-btn { background: #0F0F0F; border: 1px solid #1E1E1E; color: ${text}; padding: 12px 14px; border-radius: 8px; cursor: pointer; text-align: left; transition: all .2s; width: 100%; }
        .option-btn:hover { border-color: ${accent}; }
        .option-btn.selected { background: ${accent}; color: #0A0A0A; border-color: ${accent}; font-weight: 600; }
        .controls { display: flex; gap: 12px; margin-top: 18px; justify-content: flex-end; }
        .btn { padding: 10px 14px; border-radius: 8px; cursor: pointer; font-weight: 600; border: none; }
        .btn.ghost { background: transparent; color: #888; border: 1px solid #222; }
        .btn.primary { background: ${accent}; color: #0A0A0A; }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      <div style={{ maxWidth: 920, margin: "0 auto" }}>
        {stage === "knowledge" && (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 24
              }}
            >
              <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 24, margin: 0 }}>Assessment</h1>
              <div style={{ width: 280 }}>
                <div className="progress">
                  <div
                    className="progress-bar"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#888",
                    marginTop: 6,
                    textAlign: "right"
                  }}
                >
                  Part 1: Knowledge · Question {questionIdx + 1} of{" "}
                  {knowledgeQuestions.length}
                </div>
              </div>
            </div>

            <div
              style={{
                background: "#0F0F0F",
                padding: 28,
                borderRadius: 10,
                maxWidth: 720,
                margin: "0 auto"
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: accent,
                  fontWeight: 600,
                  marginBottom: 8
                }}
              >
                {currentQuestion.topic}
              </div>
              <h2
                style={{
                  fontFamily: "Syne, sans-serif",
                  fontSize: 18,
                  marginBottom: 20,
                  margin: "0 0 20px 0"
                }}
              >
                {currentQuestion.question}
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {currentQuestion.options.map((opt, idx) => (
                  <button
                    key={idx}
                    className={[
                      "option-btn",
                      answers[currentQuestion.id] === idx ? "selected" : ""
                    ].join(" ")}
                    onClick={() => selectAnswer(currentQuestion.id, idx)}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              <div className="controls">
                <button
                  className="btn ghost"
                  onClick={prevQuestion}
                  disabled={questionIdx === 0}
                >
                  Back
                </button>
                <button className="btn primary" onClick={nextQuestion}>
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
              <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 24, margin: "0 0 12px 0" }}>Assessment</h1>
              <div style={{ fontSize: 12, color: "#888" }}>
                Part 2: Practical Tasks — {Object.keys(practicalAnswers).length} of 3 completed
              </div>
            </div>

            <div
              style={{
                background: "#0F0F0F",
                padding: 28,
                borderRadius: 10,
                maxWidth: 720,
                margin: "0 auto"
              }}
            >
              {/* Task 1 */}
              <div style={{ marginBottom: 32 }}>
                <h3 style={{ fontFamily: "Syne, sans-serif", fontSize: 16, marginBottom: 12 }}>
                  Task 1: Chart Pattern Recognition
                </h3>
                <div
                  style={{
                    background: "#0A0A0A",
                    padding: 16,
                    borderRadius: 8,
                    marginBottom: 12,
                    border: "1px solid #1E1E1E"
                  }}
                >
                  <div style={{ fontSize: 13, color: "#AAA" }}>
                    You see a price chart where each successive candle has higher highs and higher lows. Is this an uptrend or downtrend?
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {["Downtrend", "Uptrend", "Sideways / Consolidation", "Unable to determine"].map(
                    (opt, idx) => (
                      <button
                        key={idx}
                        className={[
                          "option-btn",
                          practicalAnswers[1] === idx ? "selected" : ""
                        ].join(" ")}
                        onClick={() => selectPractical(1, idx)}
                      >
                        {opt}
                      </button>
                    )
                  )}
                </div>
              </div>

              <hr style={{ border: "none", borderTop: "1px solid #1E1E1E", margin: "24px 0" }} />

              {/* Task 2 */}
              <div style={{ marginBottom: 32 }}>
                <h3 style={{ fontFamily: "Syne, sans-serif", fontSize: 16, marginBottom: 12 }}>
                  Task 2: Position Sizing
                </h3>
                <div
                  style={{
                    background: "#0A0A0A",
                    padding: 16,
                    borderRadius: 8,
                    marginBottom: 12,
                    border: "1px solid #1E1E1E"
                  }}
                >
                  <div style={{ fontSize: 13, color: "#AAA" }}>
                    You have ₹10,000 and decide to risk only 2% per trade. What is your maximum loss per trade?
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {["₹50", "₹100", "₹200", "₹500"].map((opt, idx) => (
                    <button
                      key={idx}
                      className={[
                        "option-btn",
                        practicalAnswers[2] === idx ? "selected" : ""
                      ].join(" ")}
                      onClick={() => selectPractical(2, idx)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <hr style={{ border: "none", borderTop: "1px solid #1E1E1E", margin: "24px 0" }} />

              {/* Task 3 */}
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontFamily: "Syne, sans-serif", fontSize: 16, marginBottom: 12 }}>
                  Task 3: Risk Management Scenario
                </h3>
                <div
                  style={{
                    background: "#0A0A0A",
                    padding: 16,
                    borderRadius: 8,
                    marginBottom: 12,
                    border: "1px solid #1E1E1E"
                  }}
                >
                  <div style={{ fontSize: 13, color: "#AAA" }}>
                    You bought a stock at ₹100. It has dropped to ₹92. You had set a 5% stop loss (exit at ₹95). What should you do?
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    "Exit immediately — your stop loss has been hit",
                    "Hold and wait for recovery",
                    "Buy more to average down the price",
                    "Move your stop loss to ₹90 to avoid the loss"
                  ].map((opt, idx) => (
                    <button
                      key={idx}
                      className={[
                        "option-btn",
                        practicalAnswers[3] === idx ? "selected" : ""
                      ].join(" ")}
                      onClick={() => selectPractical(3, idx)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="controls">
                <button className="btn ghost" onClick={() => setStage("knowledge")}>
                  Back
                </button>
                <button className="btn primary" onClick={finishAssessment}>
                  Get Results
                </button>
              </div>
            </div>
          </>
        )}

        {stage === "result" && result && (
          <>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 24, margin: "0 0 12px 0" }}>Your Result</h1>
            </div>

            <div
              style={{
                background: "#0F0F0F",
                padding: 32,
                borderRadius: 10,
                maxWidth: 720,
                margin: "0 auto"
              }}
            >
              <div style={{ textAlign: "center", marginBottom: 32 }}>
                <div
                  style={{
                    fontSize: 64,
                    fontFamily: "Syne, sans-serif",
                    fontWeight: 800,
                    color: accent,
                    margin: "0 0 8px 0"
                  }}
                >
                  {result.score}%
                </div>
                <div style={{ fontSize: 14, color: "#888" }}>
                  {levelDescriptions[result.level - 1].range} —{" "}
                  {levelDescriptions[result.level - 1].title} Trader
                </div>
              </div>

              <div
                style={{
                  background: "#0A0A0A",
                  padding: 20,
                  borderRadius: 8,
                  marginBottom: 24,
                  border: `1px solid ${accent}`
                }}
              >
                <h3 style={{ fontFamily: "Syne, sans-serif", fontSize: 16, marginBottom: 8, color: accent }}>
                  Level {result.level}: {levelDescriptions[result.level - 1].title}
                </h3>
                <p style={{ fontSize: 14, color: "#AAA", lineHeight: 1.6, margin: 0 }}>
                  {levelDescriptions[result.level - 1].desc}
                </p>
              </div>

              <div style={{ marginBottom: 24 }}>
                <h4 style={{ fontFamily: "Syne, sans-serif", fontSize: 14, marginBottom: 12, color: text }}>
                  What You'll Learn:
                </h4>
                {result.level === 1 && (
                  <ul style={{ fontSize: 13, color: "#AAA", lineHeight: 1.8, margin: 0, paddingLeft: 20 }}>
                    <li>Market fundamentals and asset classes</li>
                    <li>Candlestick chart basics and patterns</li>
                    <li>Essential risk management rules</li>
                    <li>Trading psychology foundations</li>
                  </ul>
                )}
                {result.level === 2 && (
                  <ul style={{ fontSize: 13, color: "#AAA", lineHeight: 1.8, margin: 0, paddingLeft: 20 }}>
                    <li>Technical analysis — support, resistance, trends</li>
                    <li>Simulator trading practice</li>
                    <li>Building consistent habits</li>
                    <li>Journal-based improvement</li>
                  </ul>
                )}
                {result.level === 3 && (
                  <ul style={{ fontSize: 13, color: "#AAA", lineHeight: 1.8, margin: 0, paddingLeft: 20 }}>
                    <li>Advanced chart patterns and strategies</li>
                    <li>Portfolio construction and diversification</li>
                    <li>Advanced risk management</li>
                    <li>System building and backtesting</li>
                  </ul>
                )}
                {result.level === 4 && (
                  <ul style={{ fontSize: 13, color: "#AAA", lineHeight: 1.8, margin: 0, paddingLeft: 20 }}>
                    <li>Specialization in your preferred markets</li>
                    <li>Professional-grade analysis tools</li>
                    <li>Proprietary strategy development</li>
                    <li>Advanced edge and optimization</li>
                  </ul>
                )}
              </div>

              <button
                className="btn primary"
                onClick={submitAssessment}
                disabled={saving}
                style={{ width: "100%", padding: "12px", fontSize: 14, opacity: saving ? 0.5 : 1 }}
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

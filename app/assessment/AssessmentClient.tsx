"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Question = {
  id: number;
  question: string;
  options: string[];
  correct: number;
  topic: string;
};

type Answers = Record<number, number>;

const STORAGE_KEY = "vornix_assessment";

const bg = "#0A0A0A";
const text = "#F2F0EB";
const accent = "#E8A020";

const knowledgeQuestions: Question[] = [
  // Basic Market Knowledge (6 questions)
  {
    id: 1,
    topic: "Market Knowledge",
    question: "What does a stock represent?",
    options: [
      "An ownership share in a company",
      "A loan you give to a company",
      "A currency of a specific country",
      "A commodity like gold or oil"
    ],
    correct: 0
  },
  {
    id: 2,
    topic: "Market Knowledge",
    question: "Which asset class has the highest trading volume globally?",
    options: [
      "Cryptocurrencies",
      "Forex (Currency pairs)",
      "Stocks",
      "Commodities"
    ],
    correct: 1
  },
  {
    id: 3,
    topic: "Market Knowledge",
    question: "What is the primary difference between F&O (Futures & Options) and Cash market?",
    options: [
      "F&O trades happen faster",
      "F&O requires leverage and expiry dates, cash market is spot settlement",
      "F&O is only for Indian markets",
      "There is no practical difference"
    ],
    correct: 1
  },
  {
    id: 4,
    topic: "Market Knowledge",
    question: "In the context of Indian markets, what is the NSE?",
    options: [
      "The National Stock Exchange — India's primary stock exchange",
      "The National Savings Entity — a government savings scheme",
      "The Network Security Enforcement body",
      "A cryptocurrency trading platform"
    ],
    correct: 0
  },
  {
    id: 5,
    topic: "Market Knowledge",
    question: "What does leverage mean in trading?",
    options: [
      "Trading with borrowed money to control larger positions",
      "Using only your own capital for trading",
      "Selling assets you already own",
      "Investing in multiple markets simultaneously"
    ],
    correct: 0
  },
  {
    id: 6,
    topic: "Market Knowledge",
    question: "What is a 'bear market'?",
    options: [
      "A market where prices are rising consistently",
      "A market where prices are falling and sentiment is negative",
      "A market that trades only in the morning",
      "A market limited to specific industries"
    ],
    correct: 1
  },
  // Chart Reading Basics (6 questions)
  {
    id: 7,
    topic: "Chart Reading",
    question: "What does a green candlestick typically indicate?",
    options: [
      "The market is about to crash",
      "The closing price is higher than the opening price",
      "The stock is a buy signal",
      "Trading volume increased"
    ],
    correct: 1
  },
  {
    id: 8,
    topic: "Chart Reading",
    question: "What is support in technical analysis?",
    options: [
      "A price level where the asset tends to stop falling and bounce up",
      "The highest price an asset has ever reached",
      "The average price of the asset",
      "A broker who helps you trade"
    ],
    correct: 0
  },
  {
    id: 9,
    topic: "Chart Reading",
    question: "What is resistance in technical analysis?",
    options: [
      "The lowest price an asset can reach",
      "A price level where the asset tends to stop rising and pull back",
      "A government policy affecting trading",
      "The most recent trading price"
    ],
    correct: 1
  },
  {
    id: 10,
    topic: "Chart Reading",
    question: "In candlestick charts, what does the long thin line (wick/shadow) represent?",
    options: [
      "The time duration of the candle",
      "The highest and lowest prices reached during the period",
      "The average price during the period",
      "The trading volume"
    ],
    correct: 1
  },
  {
    id: 11,
    topic: "Chart Reading",
    question: "What is a trend?",
    options: [
      "A sudden spike in trading volume",
      "The general direction of price movement — uptrend, downtrend, or sideways",
      "An unusual price pattern that repeats daily",
      "A recommendation from market analysts"
    ],
    correct: 1
  },
  {
    id: 12,
    topic: "Chart Reading",
    question: "What does 'higher highs and higher lows' indicate?",
    options: [
      "An uptrend is forming",
      "A downtrend is starting",
      "The market is consolidating",
      "Trading will stop soon"
    ],
    correct: 0
  },
  // Risk Management Basics (4 questions)
  {
    id: 13,
    topic: "Risk Management",
    question: "What is a stop loss?",
    options: [
      "A price level where you automatically sell to limit losses",
      "The minimum profit you want to make",
      "A strategy to avoid trading certain stocks",
      "A mechanism to stop trading after a certain time"
    ],
    correct: 0
  },
  {
    id: 14,
    topic: "Risk Management",
    question: "What does 'risking 2% per trade' mean?",
    options: [
      "Investing 2% of your portfolio in each trade",
      "Only trading 2 hours per day",
      "Limiting your potential loss to 2% of your total capital per trade",
      "Expecting a 2% profit minimum"
    ],
    correct: 2
  },
  {
    id: 15,
    topic: "Risk Management",
    question: "If you have ₹50,000 and risk only 1% per trade, what is your maximum loss per trade?",
    options: [
      "₹100",
      "₹500",
      "₹5,000",
      "₹50,000"
    ],
    correct: 1
  },
  {
    id: 16,
    topic: "Risk Management",
    question: "What is the primary purpose of position sizing in trading?",
    options: [
      "To ensure you trade the largest quantity possible",
      "To maximize profits on every trade",
      "To control the amount of capital at risk and protect your account from large losses",
      "To follow what other traders are doing"
    ],
    correct: 2
  },
  // Trading Psychology (4 questions)
  {
    id: 17,
    topic: "Psychology",
    question: "What is FOMO in trading?",
    options: [
      "A technical indicator used to predict prices",
      "Fear Of Missing Out — entering trades impulsively due to fear of missing profit",
      "A regulatory requirement for all traders",
      "The feeling after making a profitable trade"
    ],
    correct: 1
  },
  {
    id: 18,
    topic: "Psychology",
    question: "What is emotional trading?",
    options: [
      "Trading with friends or family",
      "Making trades based on fear or greed rather than a plan",
      "Trading during specific emotional events",
      "A type of automated trading"
    ],
    correct: 1
  },
  {
    id: 19,
    topic: "Psychology",
    question: "What is the key to consistent trading returns?",
    options: [
      "Trading as often as possible",
      "Following a trading plan with discipline and risk management",
      "Always going with your gut feeling",
      "Copying trades from successful traders"
    ],
    correct: 1
  },
  {
    id: 20,
    topic: "Psychology",
    question: "How should you respond when you hit your daily loss limit?",
    options: [
      "Keep trading to recover the loss immediately",
      "Take a break and review what went wrong",
      "Double your position size to make faster profits",
      "Switch to a riskier strategy"
    ],
    correct: 1
  }
];

const levelDescriptions = [
  { level: 1, range: "0-40%", title: "Foundation", desc: "You're just starting. Master the basics of market structure, candlesticks, and risk rules. Build unshakable fundamentals before scaling." },
  { level: 2, range: "41-60%", title: "Beginner", desc: "You know the basics. Now focus on chart patterns, support/resistance, and real simulator practice. Develop consistent trading habits." },
  { level: 3, range: "61-80%", title: "Intermediate", desc: "You have solid knowledge. Master advanced analysis, trade psychology, and portfolio management. Build a repeatable system." },
  { level: 4, range: "81-100%", title: "Advanced", desc: "You're trading at a professional level. Specialize in your market, optimize your strategy, and build edge through discipline and data." }
];

export default function AssessmentClient() {
  const router = useRouter();
  const [stage, setStage] = useState<"knowledge" | "practical" | "result">("knowledge");
  const [questionIdx, setQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [practicalAnswers, setPracticalAnswers] = useState<Answers>({});
  const [loaded, setLoaded] = useState(false);
  const [result, setResult] = useState<{ score: number; level: number } | null>(null);
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

    // Practical scoring
    const correctAnswers = [0, 2, 1]; // Task 1: uptrend (opt 0), Task 2: ₹200 (opt 2), Task 3: Exit (opt 0)
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
      console.error("Error saving assessment:", error);
      // Still proceed even if API fails, localStorage is backup
      localStorage.setItem("vornix_assessment_complete", "true");
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

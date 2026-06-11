"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Answers = {
  goal?: string;
  experience?: string;
  markets: string[];
  time?: string;
  risk?: string;
};

const STORAGE_KEY = "vornix_onboarding_answers";

const accent = "#E8A020";
const bg = "#0A0A0A";
const text = "#F2F0EB";

const steps = [
  "What is your trading goal?",
  "What is your current experience level?",
  "Which markets interest you most?",
  "How much time can you dedicate daily?",
  "How would you describe your risk tolerance?",
];

export default function OnboardingClient() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Answers>({ markets: [] });
  const [loaded, setLoaded] = useState(false);

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

  function next() {
    if (step < 6) setStep((s) => s + 1);
  }
  function back() {
    if (step > 1) setStep((s) => s - 1);
  }

  function updateSingle<K extends keyof Answers>(key: K, value: any) {
    setAnswers((a) => ({ ...a, [key]: value }));
  }

  function toggleMarket(m: string) {
    setAnswers((a) => {
      const exists = a.markets.includes(m);
      return { ...a, markets: exists ? a.markets.filter(x => x !== m) : [...a.markets, m] };
    });
  }

  function percent() {
    if (step <= 5) return Math.round(((step - 1) / 5) * 100);
    return 100;
  }

  const StepCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div style={{ background: "#0F0F0F", padding: 28, borderRadius: 10, maxWidth: 720, width: "100%", boxShadow: "0 6px 20px rgba(0,0,0,0.6)" }}>
      <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: 20, marginBottom: 12, color: text }}>{title}</h2>
      {children}
    </div>
  );

  return (
    <main style={{ minHeight: "100vh", background: bg, color: text, fontFamily: "'Inter', sans-serif", padding: "48px 16px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Syne:wght@600;700;800&display=swap');
        .progress { height: 10px; background: #151515; border-radius: 999px; overflow: hidden; }
        .progress-bar { height: 100%; background: ${accent}; width: ${percent()}%; transition: width .35s ease; }
        .options { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-top: 16px; }
        .option-btn { background: #0A0A0A; border: 1px solid #1E1E1E; color: ${text}; padding: 12px 14px; border-radius: 8px; cursor: pointer; text-align: left; }
        .option-btn.selected { background: ${accent}; color: #0A0A0A; border-color: ${accent}; }
        .controls { display:flex; gap:12px; margin-top:18px; justify-content:flex-end; }
        .btn { padding: 10px 14px; border-radius:8px; cursor:pointer; font-weight:600; }
        .btn.ghost { background: transparent; color: #888; border: 1px solid #222; }
        .btn.primary { background: ${accent}; color: #0A0A0A; }
      `}</style>

      <div style={{ maxWidth: 920, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 18 }}>
          <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 24, margin: 0 }}>Onboarding</h1>
          <div style={{ width: 240 }}>
            <div className="progress">
              <div className="progress-bar" style={{ width: `${percent()}%` }} />
            </div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 6, textAlign: "right" }}>{percent()}% complete</div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "center" }}>
          {step <= 5 ? (
            <StepCard title={steps[step - 1]}>
              {step === 1 && (
                <div>
                  <div className="options">
                    {[
                      "Build a full-time income from trading",
                      "Supplement my existing income",
                      "Learn trading as a skill",
                      "Manage my own investments better",
                    ].map((o) => (
                      <button key={o} className={["option-btn", answers.goal === o ? "selected" : ""].join(" ")} onClick={() => updateSingle('goal', o)}>{o}</button>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <div className="options">
                    {[
                      "Complete beginner — never traded",
                      "Beginner — know basics but never traded real money",
                      "Intermediate — traded but inconsistently",
                      "Experienced — trading regularly but want structure",
                    ].map((o) => (
                      <button key={o} className={["option-btn", answers.experience === o ? "selected" : ""].join(" ")} onClick={() => updateSingle('experience', o)}>{o}</button>
                    ))}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <div style={{ fontSize: 13, color: "#AAA" }}>Select all that apply</div>
                  <div className="options">
                    {["Indian Stocks and F&O", "Forex", "Crypto", "US and Global Stocks", "Commodities"].map((o) => (
                      <button key={o} className={["option-btn", answers.markets.includes(o) ? "selected" : ""].join(" ")} onClick={() => toggleMarket(o)}>{o}</button>
                    ))}
                  </div>
                </div>
              )}

              {step === 4 && (
                <div>
                  <div className="options">
                    {["Less than 30 minutes", "30 minutes to 1 hour", "1 to 2 hours", "More than 2 hours"].map((o) => (
                      <button key={o} className={["option-btn", answers.time === o ? "selected" : ""].join(" ")} onClick={() => updateSingle('time', o)}>{o}</button>
                    ))}
                  </div>
                </div>
              )}

              {step === 5 && (
                <div>
                  <div className="options">
                    {["Conservative — capital preservation first", "Moderate — balanced risk and reward", "Aggressive — high risk high reward", "Not sure yet"].map((o) => (
                      <button key={o} className={["option-btn", answers.risk === o ? "selected" : ""].join(" ")} onClick={() => updateSingle('risk', o)}>{o}</button>
                    ))}
                  </div>
                </div>
              )}

              <div className="controls">
                <button className="btn ghost" onClick={back} disabled={step === 1} style={{ opacity: step === 1 ? 0.5 : 1 }}>Back</button>
                <button className="btn primary" onClick={() => { if (step < 5) next(); else setStep(6); }}>
                  {step < 5 ? 'Next' : 'Review'}
                </button>
              </div>
            </StepCard>
          ) : (
            <StepCard title="Summary">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div><strong>Trading goal:</strong> {answers.goal || '—'}</div>
                <div><strong>Experience:</strong> {answers.experience || '—'}</div>
                <div><strong>Markets:</strong> {answers.markets.length ? answers.markets.join(', ') : '—'}</div>
                <div><strong>Daily time:</strong> {answers.time || '—'}</div>
                <div><strong>Risk tolerance:</strong> {answers.risk || '—'}</div>
              </div>

              <div className="controls">
                <button className="btn ghost" onClick={() => setStep(5)}>Back</button>
                <button className="btn primary" onClick={() => router.push('/assessment')}>Start My Assessment</button>
              </div>
            </StepCard>
          )}
        </div>
      </div>
    </main>
  );
}

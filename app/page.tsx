"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import NavAuth from "./components/NavAuth";

export default function Home() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    if (user) {
      // User is signed in, check progress from database
      const checkUserStatus = async () => {
        try {
          const res = await fetch("/api/user-status");
          if (!res.ok) throw new Error("Failed to fetch user status");
          
          const { onboardingDone, assessmentDone } = await res.json();

          // Fallback to localStorage if database check fails
          const localOnboarding = localStorage.getItem("vornix_onboarding_complete");
          const localAssessment = localStorage.getItem("vornix_assessment_complete");

          if (!onboardingDone && !localOnboarding) {
            router.push("/onboarding");
          } else if (!assessmentDone && !localAssessment) {
            router.push("/assessment");
          } else {
            router.push("/dashboard");
          }
        } catch (error) {
          console.error("Error checking user status:", error);
          // Fallback to localStorage
          const onboardingComplete = localStorage.getItem("vornix_onboarding_complete");
          const assessmentComplete = localStorage.getItem("vornix_assessment_complete");

          if (!onboardingComplete) {
            router.push("/onboarding");
          } else if (!assessmentComplete) {
            router.push("/assessment");
          } else {
            router.push("/dashboard");
          }
        }
      };

      checkUserStatus();
    }
  }, [user, isLoaded, router]);

  return (
    <main style={{ background: "#0A0A0A", color: "#F2F0EB", fontFamily: "'Inter', sans-serif", minHeight: "100vh" }}>

      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Syne:wght@600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0A0A0A; }
        .nav { display: flex; align-items: center; justify-content: space-between; padding: 20px 48px; border-bottom: 1px solid #1E1E1E; position: sticky; top: 0; background: #0A0A0A; z-index: 100; }
        .logo { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 15px; letter-spacing: .12em; color: #F2F0EB; }
        .nav-right { display: flex; align-items: center; gap: 12px; }
        .btn-ghost { font-size: 13px; color: #888; text-decoration: none; padding: 8px 16px; transition: color .2s; }
        .btn-ghost:hover { color: #F2F0EB; }
        .btn-primary { font-size: 13px; font-weight: 500; background: #F2F0EB; color: #0A0A0A; padding: 9px 20px; border-radius: 6px; text-decoration: none; transition: background .2s; }
        .btn-primary:hover { background: #E8A020; }

        .hero { max-width: 860px; margin: 0 auto; padding: 120px 48px 100px; }
        .hero-tag { display: inline-block; font-size: 11px; font-weight: 500; letter-spacing: .1em; text-transform: uppercase; color: #E8A020; margin-bottom: 28px; }
        .hero-h1 { font-family: 'Syne', sans-serif; font-size: clamp(42px, 6vw, 72px); font-weight: 800; line-height: 1.05; letter-spacing: -.02em; margin-bottom: 24px; }
        .hero-h1 span { color: #E8A020; }
        .hero-sub { font-size: 17px; color: #888; line-height: 1.7; max-width: 520px; margin-bottom: 40px; font-weight: 300; }
        .hero-actions { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
        .btn-cta { font-size: 14px; font-weight: 600; background: #E8A020; color: #0A0A0A; padding: 14px 28px; border-radius: 6px; text-decoration: none; transition: opacity .2s; }
        .btn-cta:hover { opacity: .85; }
        .btn-secondary { font-size: 13px; color: #888; text-decoration: none; display: flex; align-items: center; gap: 6px; transition: color .2s; }
        .btn-secondary:hover { color: #F2F0EB; }
        .hero-note { font-size: 12px; color: #444; margin-top: 20px; }

        .section { padding: 80px 48px; border-top: 1px solid #1E1E1E; max-width: 1000px; margin: 0 auto; }
        .section-label { font-size: 11px; font-weight: 500; letter-spacing: .12em; text-transform: uppercase; color: #444; margin-bottom: 48px; }
        
        .problem-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1px; background: #1E1E1E; border: 1px solid #1E1E1E; border-radius: 8px; overflow: hidden; }
        .problem-card { background: #0F0F0F; padding: 28px; font-size: 14px; color: #666; line-height: 1.7; font-style: italic; }
        .problem-end { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 700; color: #F2F0EB; }
        .problem-end span { color: #E8A020; }

        .steps-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 32px; }
        .step-item { display: flex; flex-direction: column; gap: 12px; }
        .step-num { font-family: 'Syne', sans-serif; font-size: 48px; font-weight: 800; color: #1E1E1E; line-height: 1; }
        .step-title { font-size: 14px; font-weight: 600; color: #F2F0EB; }
        .step-desc { font-size: 13px; color: #666; line-height: 1.7; }

        .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1px; background: #1E1E1E; border: 1px solid #1E1E1E; border-radius: 8px; overflow: hidden; }
        .feature-card { background: #0F0F0F; padding: 28px 32px; transition: background .2s; cursor: default; }
        .feature-card:hover { background: #111; }
        .feature-icon { font-size: 22px; margin-bottom: 16px; }
        .feature-title { font-size: 14px; font-weight: 600; color: #F2F0EB; margin-bottom: 8px; }
        .feature-desc { font-size: 13px; color: #666; line-height: 1.7; }

        .who-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; }
        .who-card { border: 1px solid #1E1E1E; border-radius: 8px; padding: 28px; transition: border-color .2s; }
        .who-card:hover { border-color: #E8A020; }
        .who-type { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: #F2F0EB; margin-bottom: 12px; }
        .who-desc { font-size: 13px; color: #666; line-height: 1.7; }

        .cta-section { text-align: center; padding: 100px 48px; border-top: 1px solid #1E1E1E; }
        .cta-h2 { font-family: 'Syne', sans-serif; font-size: clamp(28px, 4vw, 48px); font-weight: 800; line-height: 1.1; margin-bottom: 16px; letter-spacing: -.02em; }
        .cta-h2 span { color: #E8A020; }
        .cta-sub { font-size: 15px; color: #666; margin-bottom: 36px; }

        .footer { padding: 24px 48px; border-top: 1px solid #1E1E1E; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
        .footer-left { font-size: 12px; color: #333; }
        .footer-right { font-size: 11px; color: #2A2A2A; font-style: italic; }

        @media (max-width: 640px) {
          .nav { padding: 16px 20px; }
          .hero { padding: 72px 20px 64px; }
          .section { padding: 60px 20px; }
          .cta-section { padding: 72px 20px; }
          .footer { padding: 20px; }
        }
      `}</style>

      {/* Navbar */}
      <nav className="nav">
        <span className="logo">VORNIX FORGE</span>
        <NavAuth />
      </nav>

      {/* Hero */}
      <div className="hero">
        <span className="hero-tag">Trader Development Platform</span>
        <h1 className="hero-h1">
          Trading is a profession.<br />
          We treat it like <span>one.</span>
        </h1>
        <p className="hero-sub">
          The world's first structured trader development system. Assessed at entry, developed systematically, certified by competence. Not by time spent.
        </p>
        <div className="hero-actions">
          <a href="/sign-up" className="btn-cta">Start My Journey — Free</a>
          <a href="#how-it-works" className="btn-secondary">See how it works →</a>
        </div>
        <p className="hero-note">No credit card. No hidden fees. Free to start.</p>
      </div>

      {/* Problem */}
      <div style={{ borderTop: "1px solid #1E1E1E", padding: "80px 48px" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <p className="section-label">The problem we solve</p>
          <div className="problem-grid">
            {[
              '"YouTube taught me patterns. Nobody taught me how to actually trade."',
              '"I lost ₹2 lakhs before I understood risk management."',
              '"I have been trading 2 years and still don\'t know if I\'m good or just lucky."',
            ].map((q, i) => (
              <div key={i} className="problem-card">{q}</div>
            ))}
          </div>
          <p className="problem-end">That ends <span>here.</span></p>
        </div>
      </div>

      {/* How it works */}
      <div id="how-it-works" style={{ borderTop: "1px solid #1E1E1E", padding: "80px 48px" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <p className="section-label">How it works</p>
          <div className="steps-grid">
            {[
              { n: "01", t: "Get Assessed", d: "Take a knowledge and practical test on entry. The system places you at your real level — not where you think you are." },
              { n: "02", t: "Learn by Doing", d: "Every module: lesson, simulator task, journal, test. Four steps. All required. No passive video watching." },
              { n: "03", t: "Prove Competence", d: "Advance only when your knowledge score, practical score, and risk management score all meet the bar. No shortcuts." },
              { n: "04", t: "Get Certified", d: "Earn a verified Certified Trader credential. Shareable on LinkedIn. Proof that you are genuinely professional." },
            ].map((s) => (
              <div key={s.n} className="step-item">
                <span className="step-num">{s.n}</span>
                <span className="step-title">{s.t}</span>
                <p className="step-desc">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <div style={{ borderTop: "1px solid #1E1E1E", padding: "80px 48px" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <p className="section-label">What you get</p>
          <div className="features-grid">
            {[
              { icon: "📊", t: "Paper Trading Simulator", d: "Real NSE, forex, and crypto prices. Trade with virtual money on real markets across all sessions." },
              { icon: "🧠", t: "AI Journal Feedback", d: "Write after every session. AI reads your entries and gives you specific, personalised feedback." },
              { icon: "📈", t: "Competency Map", d: "See your strength across 8 trading skill dimensions. Know exactly where you are weak before it costs you money." },
              { icon: "🎓", t: "Structured Curriculum", d: "6 levels. 6 specialisation tracks. 85+ modules. A real trading education — not a random course." },
              { icon: "🏆", t: "Verified Certification", d: "Earned through demonstrated skill and proven competence. Not through time spent or money paid." },
              { icon: "🌍", t: "Free to Start", d: "Every trader in India and worldwide. No credit card. No paywall blocking your development." },
            ].map((f) => (
              <div key={f.t} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <p className="feature-title">{f.t}</p>
                <p className="feature-desc">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Who */}
      <div style={{ borderTop: "1px solid #1E1E1E", padding: "80px 48px" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <p className="section-label">Who this is for</p>
          <div className="who-grid">
            {[
              { t: "Complete Beginner", d: "Never traded before. Don't know where to start. Begin at Level 1. We build everything from scratch, step by step." },
              { t: "Intermediate Trader", d: "Know the basics. Want structure and depth. Take the assessment. Skip what you know. Start exactly where you are." },
              { t: "Experienced Trader", d: "Years of trading but no structured system. Get assessed, fill the real gaps, earn the credential that proves your competence." },
            ].map((u) => (
              <div key={u.t} className="who-card">
                <p className="who-type">{u.t}</p>
                <p className="who-desc">{u.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="cta-section">
        <h2 className="cta-h2">Stop learning randomly.<br /><span>Start developing professionally.</span></h2>
        <p className="cta-sub">Join traders in India and worldwide building real competence on Vornix Forge.</p>
        <a href="/sign-up" className="btn-cta">Join Vornix Forge — Free</a>
        <p className="hero-note" style={{ marginTop: "16px" }}>No credit card. No hidden fees. Free forever to start.</p>
      </div>

      {/* Footer */}
      <footer className="footer">
        <span className="footer-left">© 2025 Vornix. All rights reserved.</span>
        <span className="footer-right">From Vaanij — Sanskrit for trader</span>
      </footer>

    </main>
  );
}

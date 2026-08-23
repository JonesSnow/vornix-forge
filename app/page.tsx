"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const bg = "#0A0A0A";
const surface = "#111111";
const accent = "#E8A020";
const text = "#F2F0EB";
const muted = "#888888";
const border = "#222222";

const steps = [
  {
    title: "Start With the Truth",
    description:
      "Take a structured assessment that measures your real knowledge, risk sense, and decision-making — not just your confidence.",
    tag: "Assessment",
  },
  {
    title: "Follow Your Forge Path",
    description:
      "Get a personalized learning track built from your results. Modules adapt to your level so you are never lost or bored.",
    tag: "Learning",
  },
  {
    title: "Practice in a Simulator",
    description:
      "Execute trades in a realistic simulator with journaling built in. Make mistakes here so they cost less later.",
    tag: "Simulator",
  },
  {
    title: "Build Evidence, Not Hope",
    description:
      "Track progress, review journal entries, and move through levels only when your performance proves it.",
    tag: "Progress",
  },
];

const features = [
  "Structured assessment and leveling system",
  "Adaptive course tracks by trader level",
  "Realistic trading simulator with journaling",
  "Progress tracking and performance reviews",
  "Community of serious traders",
  "No hype — just repeatable skill building",
];

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch("/api/user-status");
        if (res.ok) {
          const data = await res.json();
          if (!data.onboardingDone) {
            router.replace("/onboarding");
          } else if (!data.assessmentDone) {
            router.replace("/assessment");
          } else {
            router.replace("/dashboard");
          }
        }
      } catch {
        // ignore and show landing page
      } finally {
        setChecking(false);
      }
    }
    checkStatus();
  }, [router]);

  if (checking) {
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
        <div style={{ color: muted }}>Loading...</div>
      </main>
    );
  }
  return (
    <main style={{ minHeight: "100vh", background: bg, color: text, fontFamily: "Inter, sans-serif" }}>
      {/* Navigation */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 40px",
          borderBottom: `1px solid ${border}`,
          background: "rgba(10, 10, 10, 0.9)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ fontFamily: "Syne, sans-serif", fontSize: 14, fontWeight: 700, letterSpacing: "0.15em" }}>
          VORNIX FORGE
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <Link
            href="/sign-in"
            style={{
              color: muted,
              fontSize: 14,
              fontWeight: 500,
              textDecoration: "none",
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = text)}
            onMouseLeave={(e) => (e.currentTarget.style.color = muted)}
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="btn-primary"
            style={{ textDecoration: "none" }}
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: "100px 40px 80px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              borderRadius: 999,
              border: `1px solid ${border}`,
              background: surface,
              color: muted,
              fontSize: 12,
              fontWeight: 600,
              marginBottom: 24,
            }}
          >
            <span style={{ color: accent }}>●</span> The world&apos;s first structured trader development system
          </div>
          <h1
            style={{
              fontFamily: "Syne, sans-serif",
              fontSize: "clamp(36px, 5vw, 64px)",
              fontWeight: 700,
              lineHeight: 1.05,
              margin: "0 0 20px 0",
              letterSpacing: "-0.02em",
            }}
          >
            Forged by assessment.<br />
            <span style={{ color: accent }}>Built by discipline.</span>
          </h1>
          <p
            style={{
              fontSize: 17,
              lineHeight: 1.7,
              color: muted,
              maxWidth: 560,
              margin: "0 auto 36px",
            }}
          >
            Most trading platforms hand you a chart and hope. Vornix Forge starts by measuring where you actually stand,
            then builds a path from there — assessed at entry, developed systematically, certified by competence.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/sign-up" className="btn-primary" style={{ textDecoration: "none" }}>
              Start Free Assessment
            </Link>
            <Link
              href="/dashboard"
              className="btn-secondary"
              style={{ textDecoration: "none" }}
            >
              View Demo Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section
        style={{
          borderTop: `1px solid ${border}`,
          borderBottom: `1px solid ${border}`,
          background: surface,
          padding: "28px 40px",
        }}
      >
        <div
          style={{
            maxWidth: 1000,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 24,
          }}
        >
          {[
            { value: "4", label: "Trader Levels" },
            { value: "Adaptive", label: "Learning Paths" },
            { value: "Real", label: "Market Simulator" },
            { value: "Structured", label: "Progress System" },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: "center" }}>
              <div
                style={{
                  fontFamily: "Syne, sans-serif",
                  fontSize: 28,
                  fontWeight: 700,
                  color: accent,
                  lineHeight: 1.2,
                }}
              >
                {stat.value}
              </div>
              <div style={{ fontSize: 12, color: muted, marginTop: 6, fontWeight: 500 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section style={{ padding: "80px 40px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <h2
            style={{
              fontFamily: "Syne, sans-serif",
              fontSize: "clamp(24px, 3vw, 36px)",
              fontWeight: 700,
              margin: "0 0 12px 0",
            }}
          >
            How Forge Works
          </h2>
          <p style={{ color: muted, fontSize: 15, maxWidth: 480, margin: "0 auto", lineHeight: 1.7 }}>
            A four-phase system designed to take you from wherever you are to a consistent, evidence-based trader.
          </p>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 20,
          }}
        >
          {steps.map((step) => (
            <div
              key={step.title}
              style={{
                background: surface,
                border: `1px solid ${border}`,
                borderRadius: 16,
                padding: 28,
                transition: "border-color 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#2A2A2A")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = border)}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: accent,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: 14,
                }}
              >
                {step.tag}
              </div>
              <h3
                style={{
                  fontFamily: "Syne, sans-serif",
                  fontSize: 20,
                  fontWeight: 700,
                  margin: "0 0 12px 0",
                  lineHeight: 1.3,
                }}
              >
                {step.title}
              </h3>
              <p style={{ fontSize: 14, color: muted, lineHeight: 1.7, margin: 0 }}>{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: "80px 40px", maxWidth: 1100, margin: "0 auto" }}>
        <div
          style={{
            background: surface,
            border: `1px solid ${border}`,
            borderRadius: 20,
            padding: "48px 40px",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "center" }}>
            <div>
              <h2
                style={{
                  fontFamily: "Syne, sans-serif",
                  fontSize: "clamp(22px, 2.5vw, 32px)",
                  fontWeight: 700,
                  margin: "0 0 16px 0",
                  lineHeight: 1.2,
                }}
              >
                Everything you need to become a disciplined trader.
              </h2>
              <p style={{ color: muted, fontSize: 15, lineHeight: 1.7, margin: "0 0 28px" }}>
                Vornix Forge combines assessment, education, simulation, and tracking into one coherent system.
                No random tips. No gamified nonsense. Just structured development.
              </p>
              <Link href="/sign-up" className="btn-primary" style={{ textDecoration: "none" }}>
                Create Free Account
              </Link>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {features.map((feature) => (
                <div
                  key={feature}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "14px 16px",
                    background: "#0F0F0F",
                    border: `1px solid ${border}`,
                    borderRadius: 12,
                    fontSize: 14,
                    color: text,
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={accent}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ flexShrink: 0 }}
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {feature}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "80px 40px 120px", maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
        <h2
          style={{
            fontFamily: "Syne, sans-serif",
            fontSize: "clamp(24px, 3vw, 36px)",
            fontWeight: 700,
            margin: "0 0 16px 0",
          }}
        >
          Ready to stop guessing?
        </h2>
        <p style={{ color: muted, fontSize: 15, lineHeight: 1.7, margin: "0 0 32px", maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
          Start with a free assessment. See your level. Build from there.
        </p>
        <Link href="/sign-up" className="btn-primary" style={{ textDecoration: "none", fontSize: 15, padding: "14px 28px" }}>
          Start Your Assessment
        </Link>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: `1px solid ${border}`,
          padding: "32px 40px",
          textAlign: "center",
          color: muted,
          fontSize: 13,
        }}
      >
        <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 8 }}>
          VORNIX FORGE
        </div>
        <div>Assessed at entry. Developed systematically. Certified by competence.</div>
      </footer>
    </main>
  );
}

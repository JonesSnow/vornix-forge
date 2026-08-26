"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-text-secondary">Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background font-sans text-primary antialiased">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 sm:px-10 lg:px-16 h-16 border-b border-border">
        <div className="font-display text-sm font-bold tracking-[0.15em] text-primary">
          VORNIX FORGE
        </div>
        <div className="flex items-center gap-6 sm:gap-8">
          <Link
            href="/sign-in"
            className="text-body-sm font-medium text-text-secondary hover:text-primary transition-colors"
          >
            Sign In
          </Link>
          <Link href="/sign-up" className="btn btn-primary">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 sm:px-10 lg:px-16 pt-20 sm:pt-28 pb-16 sm:pb-24">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border-visible bg-surface-elevated text-caption text-text-secondary mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            The world&apos;s first structured trader development system
          </div>
          <h1 className="text-display text-primary mb-6">
            Forged by assessment.
            <br />
            <span className="text-accent">Built by discipline.</span>
          </h1>
          <p className="text-body text-text-secondary max-w-xl mx-auto mb-10 leading-relaxed">
            Most trading platforms hand you a chart and hope. Vornix Forge starts by measuring where you actually stand,
            then builds a path from there — assessed at entry, developed systematically, certified by competence.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/sign-up" className="btn btn-primary btn-lg">
              Start Free Assessment
            </Link>
            <Link href="/dashboard" className="btn btn-secondary btn-lg">
              View Demo Dashboard
            </Link>
          </div>
        </div>
      </section>

      <hr className="border-border mx-6 sm:mx-10 lg:mx-16" />

      {/* Stats */}
      <section className="px-6 sm:px-10 lg:px-16 py-12 sm:py-16">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-12">
          {[
            { value: "4", label: "Trader Levels" },
            { value: "Adaptive", label: "Learning Paths" },
            { value: "Real", label: "Market Simulator" },
            { value: "Structured", label: "Progress System" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-display text-3xl sm:text-4xl font-bold text-accent leading-tight">{stat.value}</div>
              <div className="text-caption text-text-secondary mt-2">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <hr className="border-border mx-6 sm:mx-10 lg:mx-16" />

      {/* Steps */}
      <section className="px-6 sm:px-10 lg:px-16 py-16 sm:py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-h2 text-primary mb-4">How Forge Works</h2>
            <p className="text-body text-text-secondary max-w-lg mx-auto">
              A four-phase system designed to take you from wherever you are to a consistent, evidence-based trader.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border">
            {steps.map((step, idx) => (
              <div key={step.title} className="bg-surface p-8 sm:p-10">
                <div className="text-caption text-accent font-semibold mb-4">
                  {String(idx + 1).padStart(2, "0")} / {step.tag}
                </div>
                <h3 className="text-h3 text-primary mb-3">{step.title}</h3>
                <p className="text-body-sm text-text-secondary leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="border-border mx-6 sm:mx-10 lg:mx-16" />

      {/* Features */}
      <section className="px-6 sm:px-10 lg:px-16 py-16 sm:py-24">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            <div>
              <h2 className="text-h2 text-primary mb-4">Everything you need to become a disciplined trader.</h2>
              <p className="text-body text-text-secondary mb-8 leading-relaxed">
                Vornix Forge combines assessment, education, simulation, and tracking into one coherent system.
                No random tips. No gamified nonsense. Just structured development.
              </p>
              <Link href="/sign-up" className="btn btn-primary">
                Create Free Account
              </Link>
            </div>
            <div className="space-y-3">
              {features.map((feature) => (
                <div
                  key={feature}
                  className="flex items-start gap-4 px-5 py-4 bg-surface border border-border rounded-lg"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-accent flex-shrink-0 mt-0.5"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="text-body-sm text-primary leading-relaxed">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <hr className="border-border mx-6 sm:mx-10 lg:mx-16" />

      {/* Progression */}
      <section className="px-6 sm:px-10 lg:px-16 py-16 sm:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-h2 text-primary mb-4">Level-Based Development</h2>
          <p className="text-body text-text-secondary max-w-xl mx-auto mb-12 leading-relaxed">
            You do not unlock content by watching videos. You advance by demonstrating competence.
            Each level builds on the last, ensuring you have a real foundation before taking on greater complexity.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border">
            {[
              { level: 1, name: "Foundation", focus: "Market structure, chart basics, risk rules" },
              { level: 2, name: "Beginner", focus: "Support and resistance, guided practice, journaling" },
              { level: 3, name: "Intermediate", focus: "Setup selection, risk-reward, review discipline" },
              { level: 4, name: "Advanced", focus: "Strategy refinement, execution, optimization" },
            ].map((item) => (
              <div key={item.level} className="bg-surface p-6 sm:p-8">
                <div className="font-display text-2xl font-bold text-accent mb-2">L{item.level}</div>
                <div className="text-h4 text-primary mb-2">{item.name}</div>
                <p className="text-body-sm text-text-secondary leading-relaxed">{item.focus}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="border-border mx-6 sm:mx-10 lg:mx-16" />

      {/* CTA */}
      <section className="px-6 sm:px-10 lg:px-16 py-16 sm:py-24">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-h2 text-primary mb-4">Ready to stop guessing?</h2>
          <p className="text-body text-text-secondary mb-10 leading-relaxed">
            Start with a free assessment. See your level. Build from there.
          </p>
          <Link href="/sign-up" className="btn btn-primary btn-lg">
            Start Your Assessment
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 sm:px-10 lg:px-16 py-10">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="font-display text-sm font-bold tracking-[0.15em] text-primary">VORNIX FORGE</div>
          <div className="text-body-sm text-text-secondary">Assessed at entry. Developed systematically. Certified by competence.</div>
        </div>
      </footer>
    </main>
  );
}

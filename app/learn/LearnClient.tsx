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

type Course = {
  id: string;
  title: string;
  description: string;
  level: number;
  order: number;
  isActive: boolean;
  createdAt: string;
  modules: Array<{
    id: string;
    courseId: string;
    title: string;
    description: string;
    order: number;
    isActive: boolean;
    createdAt: string;
    _count: {
      lessons: number;
    };
  }>;
};

type CompletedModule = {
  id: string;
  title: string;
  courseId: string;
  order: number;
};

export default function LearnClient() {
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [assessment, setAssessment] = useState<AssessmentStorage | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedModules, setCompletedModules] = useState<CompletedModule[]>([]);

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

  useEffect(() => {
    async function fetchCourses() {
      try {
        const [coursesRes, progressRes] = await Promise.all([
          fetch("/api/courses"),
          fetch("/api/progress/summary"),
        ]);

        if (coursesRes.ok) {
          const data = await coursesRes.json();
          setCourses(Array.isArray(data.courses) ? data.courses : []);
        }
        if (progressRes.ok) {
          const data = await progressRes.json();
          setCompletedModules(Array.isArray(data.completedModules) ? data.completedModules : []);
        }
      } catch (e) {
        console.error("Failed to fetch data:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchCourses();
  }, []);

  const assessmentScore = assessment?.result?.score ?? assessment?.score ?? 0;
  const currentLevel = assessment?.result?.level ?? assessment?.level ?? getLevelFromScore(assessmentScore);

  const completedModuleIds = useMemo(() => new Set(completedModules.map((m) => m.id)), [completedModules]);

  const coursesByLevel = useMemo(() => {
    const grouped: Record<number, Course[]> = {};
    for (const course of courses) {
      if (!grouped[course.level]) {
        grouped[course.level] = [];
      }
      grouped[course.level].push(course);
    }
    return grouped;
  }, [courses]);

  const sortedLevels = useMemo(
    () => Object.keys(coursesByLevel).map(Number).sort((a, b) => a - b),
    [coursesByLevel]
  );

  const getCourseProgress = (course: Course) => {
    const totalModules = course.modules.length;
    if (totalModules === 0) return 0;
    const completed = course.modules.filter((m) => completedModuleIds.has(m.id)).length;
    return Math.round((completed / totalModules) * 100);
  };

  const profileName = useMemo(() => {
    const email = user?.primaryEmailAddress?.emailAddress?.split("@")[0];
    return user?.fullName || user?.firstName || user?.username || email || "Signed-in user";
  }, [user]);

  if (!mounted || loading) {
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
        <div style={{ color: colors.text.muted }}>Loading courses...</div>
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
        .progress-shell { height: 6px; border-radius: 999px; background: #161616; overflow: hidden; }
        .progress-bar { height: 100%; background: ${accent}; transition: width .35s ease; }
        .course-card { background: #0F0F0F; border: 1px solid #1E1E1E; border-radius: 16px; padding: 24px; transition: all .2s ease; cursor: pointer; text-decoration: none; color: inherit; display: block; }
        .course-card:hover { border-color: #2A2A2A; transform: translateY(-2px); }
        .course-card.locked { opacity: 0.5; cursor: not-allowed; }
        .course-card.locked:hover { transform: none; border-color: #1E1E1E; }
        .continue-btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px; border-radius: 10px; background: ${accent}; color: #0A0A0A; font-weight: 600; font-size: 13px; text-decoration: none; transition: all .2s ease; }
        .continue-btn:hover { background: #d4941a; }
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
                  className={item.label === "Learn" ? "sidebar-link active" : "sidebar-link"}
                  aria-current={item.label === "Learn" ? "page" : undefined}
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
          <div style={{ maxWidth: 1240, margin: "0 auto" }}>
            <header className="card" style={{ padding: 28, marginBottom: 24 }}>
              <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 36, lineHeight: 1.05, margin: 0 }}>
                Learn
              </h1>
              <p className="muted" style={{ marginTop: 8, lineHeight: 1.6 }}>
                Master trading fundamentals level by level. Complete each course to unlock the next.
              </p>
            </header>

            {sortedLevels.length === 0 && (
              <div className="card" style={{ padding: 28, textAlign: "center", color: colors.text.muted }}>
                No courses available yet.
              </div>
            )}

            {sortedLevels.map((level) => {
              const levelCourses = coursesByLevel[level];
              const isUnlocked = level <= currentLevel;
              const levelEntry = levelCopy[level] ?? levelCopy[1];

              return (
                <section key={level} style={{ marginBottom: 32 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                    <h2
                      style={{
                        fontFamily: "Syne, sans-serif",
                        fontSize: 22,
                        margin: 0,
                      }}
                    >
                      {levelEntry.name}
                    </h2>
                    {!isUnlocked && (
                      <span className="badge" style={{ opacity: 0.7 }}>
                        Locked
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                      gap: 16,
                    }}
                  >
                    {levelCourses.map((course) => {
                      const unlocked = course.level <= currentLevel;
                      const moduleCount = course.modules.length;
                      const progress = getCourseProgress(course);
                      const hasProgress = progress > 0;

                      return (
                        <a
                          key={course.id}
                          href={unlocked ? `/learn/${course.id}` : "#"}
                          className={`course-card ${unlocked ? "" : "locked"}`}
                          onClick={(e) => {
                            if (!unlocked) e.preventDefault();
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              gap: 12,
                              marginBottom: 12,
                            }}
                          >
                            <h3
                              style={{
                                fontFamily: "Syne, sans-serif",
                                fontSize: 18,
                                margin: 0,
                                lineHeight: 1.3,
                              }}
                            >
                              {course.title}
                            </h3>
                            <span className="badge">Level {course.level}</span>
                          </div>
                          <p className="muted" style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
                            {course.description}
                          </p>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 12,
                              marginBottom: 12,
                            }}
                          >
                            <span className="muted" style={{ fontSize: 13 }}>
                              {moduleCount} module{moduleCount !== 1 ? "s" : ""}
                            </span>
                            {!unlocked && (
                              <span
                                style={{
                                  fontSize: 12,
                                  color: colors.text.muted,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                }}
                              >
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                </svg>
                                Complete Level {course.level - 1} first
                              </span>
                            )}
                            {unlocked && hasProgress && (
                              <span style={{ fontSize: 12, color: accent, fontWeight: 600 }}>
                                {progress}% complete
                              </span>
                            )}
                          </div>
                          <div className="progress-shell">
                            <div className="progress-bar" style={{ width: `${progress}%` }} />
                          </div>
                          {unlocked && hasProgress && (
                            <div style={{ marginTop: 14 }}>
                              <span className="continue-btn">Continue →</span>
                            </div>
                          )}
                        </a>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}

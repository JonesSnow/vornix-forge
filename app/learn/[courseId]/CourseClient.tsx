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

type Lesson = {
  id: string;
  moduleId: string;
  title: string;
  content: string;
  type: string;
  order: number;
  duration: number;
  isActive: boolean;
  createdAt: string;
};

type Module = {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  lessons: Lesson[];
};

type Course = {
  id: string;
  title: string;
  description: string;
  level: number;
  order: number;
  isActive: boolean;
  createdAt: string;
  modules: Module[];
};

type CourseClientProps = {
  courseId: string;
  initialCourse?: Course;
};

type CourseProgress = {
  courseId: string;
  totalModules: number;
  completedModules: number;
  totalLessons: number;
  moduleProgress: Array<{
    id: string;
    title: string;
    completed: boolean;
    totalLessons: number;
  }>;
};

export default function CourseClient({ courseId, initialCourse }: CourseClientProps) {
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);
  const [course, setCourse] = useState<Course | null>(initialCourse ?? null);
  const [assessment, setAssessment] = useState<AssessmentStorage | null>(null);
  const [loading, setLoading] = useState(!initialCourse);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [courseProgress, setCourseProgress] = useState<CourseProgress | null>(null);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());

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
    if (initialCourse) return;
    async function fetchCourse() {
      try {
        const res = await fetch(`/api/courses/${courseId}`);
        if (res.ok) {
          const data = await res.json();
          setCourse(data.course);
        }
      } catch (e) {
        console.error("Failed to fetch course:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchCourse();
  }, [courseId, initialCourse]);

  useEffect(() => {
    async function fetchProgress() {
      try {
        const [courseProgressRes, summaryRes] = await Promise.all([
          fetch(`/api/courses/${courseId}/progress`),
          fetch("/api/progress/summary"),
        ]);

        if (courseProgressRes.ok) {
          const data = await courseProgressRes.json();
          setCourseProgress(data);
        }
        if (summaryRes.ok) {
          const data = await summaryRes.json();
          const completed = Array.isArray(data.completedModules) ? data.completedModules : [];
          setExpandedModules(new Set(completed.map((m: any) => m.id)));
        }
      } catch (e) {
        console.error("Failed to fetch progress:", e);
      }
    }
    fetchProgress();
  }, [courseId]);

  const assessmentScore = assessment?.result?.score ?? assessment?.score ?? 0;
  const currentLevel = assessment?.result?.level ?? assessment?.level ?? getLevelFromScore(assessmentScore);

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
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
        <div style={{ color: colors.text.muted }}>Loading course...</div>
      </main>
    );
  }

  if (!course) {
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
        <div style={{ color: colors.text.muted }}>Course not found.</div>
      </main>
    );
  }

  const levelEntry = levelCopy[course.level] ?? levelCopy[1];
  const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const overallProgress = courseProgress
    ? courseProgress.totalModules > 0
      ? Math.round((courseProgress.completedModules / courseProgress.totalModules) * 100)
      : 0
    : 0;

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
        .module-accordion { background: #0F0F0F; border: 1px solid #1E1E1E; border-radius: 16px; overflow: hidden; margin-bottom: 16px; transition: border-color .2s ease; }
        .module-accordion:hover { border-color: #2A2A2A; }
        .module-accordion.completed { border-color: #4ade80; }
        .module-header { padding: 20px 24px; cursor: pointer; display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; transition: background .2s ease; }
        .module-header:hover { background: #111111; }
        .module-body { padding: 0 24px 20px; border-top: 1px solid #1E1E1E; }
        .lesson-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 14px 0; border-bottom: 1px solid #1E1E1E; text-decoration: none; color: inherit; transition: color .2s ease; }
        .lesson-row:last-child { border-bottom: none; }
        .lesson-row:hover { color: ${accent}; }
        .lesson-row:hover .lesson-arrow { transform: translateX(4px); }
        .lesson-arrow { transition: transform .2s ease; color: ${accent}; }
        .type-badge { display: inline-flex; padding: 4px 10px; border-radius: 8px; border: 1px solid #1E1E1E; background: #111111; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #9A9A9A; }
        .check-icon { color: #4ade80; flexShrink: 0; }
        .progress-shell { height: 8px; border-radius: 999px; background: #161616; overflow: hidden; }
        .progress-bar { height: 100%; background: ${accent}; transition: width .35s ease; }
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
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <header className="card" style={{ padding: 28, marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                <div>
                  <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 32, lineHeight: 1.1, margin: 0 }}>
                    {course.title}
                  </h1>
                  <p className="muted" style={{ marginTop: 10, lineHeight: 1.6 }}>
                    {course.description}
                  </p>
                </div>
                <span className="badge">{levelEntry.name}</span>
              </div>
              <div style={{ marginTop: 16, display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
                <span className="muted" style={{ fontSize: 13 }}>
                  {course.modules.length} module{course.modules.length !== 1 ? "s" : ""}
                </span>
                <span className="muted" style={{ fontSize: 13 }}>
                  {totalLessons} lesson{totalLessons !== 1 ? "s" : ""}
                </span>
                <span style={{ fontSize: 13, color: accent, fontWeight: 600 }}>
                  {overallProgress}% complete
                </span>
              </div>
              <div className="progress-shell" style={{ marginTop: 12 }}>
                <div className="progress-bar" style={{ width: `${overallProgress}%` }} />
              </div>
            </header>

            <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {course.modules.map((module) => {
                const isExpanded = expandedModules.has(module.id);
                const isCompleted = courseProgress?.moduleProgress.find((m) => m.id === module.id)?.completed ?? false;
                const lessonCount = module.lessons.length;

                return (
                  <div key={module.id} className={`module-accordion ${isCompleted ? "completed" : ""}`}>
                    <div
                      className="module-header"
                      onClick={() => toggleModule(module.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggleModule(module.id);
                        }
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                          <div style={{ fontFamily: "Syne, sans-serif", fontSize: 18 }}>
                            {module.title}
                          </div>
                          {isCompleted && (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="check-icon">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          )}
                        </div>
                        <p className="muted" style={{ fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                          {module.description}
                        </p>
                        <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center" }}>
                          <span className="muted" style={{ fontSize: 13 }}>
                            {lessonCount} lesson{lessonCount !== 1 ? "s" : ""}
                          </span>
                          {isCompleted && (
                            <span style={{ fontSize: 12, color: "#4ade80", fontWeight: 600 }}>
                              Completed
                            </span>
                          )}
                        </div>
                      </div>
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                          color: colors.text.muted,
                          transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                          transition: "transform .2s ease",
                          flexShrink: 0,
                          marginTop: 4,
                        }}
                      >
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </div>
                    {isExpanded && (
                      <div className="module-body">
                        {module.lessons.map((lesson) => (
                          <a
                            key={lesson.id}
                            href={`/learn/${course.id}/${module.id}/${lesson.id}`}
                            className="lesson-row"
                          >
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, fontSize: 15 }}>
                                {lesson.title}
                                {completedLessonIds.has(lesson.id) && (
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="check-icon">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                  </svg>
                                )}
                              </div>
                              <div style={{ display: "flex", gap: 10, marginTop: 8, alignItems: "center" }}>
                                <span className="type-badge">{lesson.type}</span>
                                <span className="muted" style={{ fontSize: 13 }}>
                                  {lesson.duration} min
                                </span>
                                <span className="muted" style={{ fontSize: 12 }}>
                                  {completedLessonIds.has(lesson.id) ? "Completed" : "Not started"}
                                </span>
                              </div>
                            </div>
                            <svg
                              className="lesson-arrow"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

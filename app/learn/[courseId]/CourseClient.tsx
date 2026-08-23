"use client";

import React, { useEffect, useMemo, useState } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import { colors, STORAGE_KEYS } from "@/lib/constants";
import { navItems, levelCopy } from "@/lib/constants/content/dashboard-content";
import type { AssessmentStorage } from "@/lib/types";
import Sidebar from "../../components/Sidebar";

const bg = colors.bg.primary;
const text = colors.text.primary;
const accent = colors.accent.primary;
const sidebarWidth = 220;

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
        <div style={{ color: "#888888" }}>Loading course...</div>
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
        <div style={{ color: "#888888" }}>Course not found.</div>
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
    <main style={{ minHeight: "100vh", background: bg, color: text }}>
      <Sidebar activeLabel="Learn" />

      <section style={{ marginLeft: sidebarWidth, width: `calc(100% - ${sidebarWidth}px)`, padding: "48px 40px 80px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <header
            style={{
              background: "#111111",
              border: "1px solid #222222",
              borderRadius: 12,
              padding: 28,
              marginBottom: 28,
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div>
                <h1
                  style={{
                    fontFamily: "Syne, sans-serif",
                    fontSize: 32,
                    lineHeight: 1.1,
                    margin: 0,
                    fontWeight: 700,
                  }}
                >
                  {course.title}
                </h1>
                <p style={{ color: "#A0A0A0", marginTop: 10, lineHeight: 1.6, fontSize: 14 }}>
                  {course.description}
                </p>
              </div>
              <span className="badge">{levelEntry.name}</span>
            </div>
            <div style={{ marginTop: 16, display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ color: "#888888", fontSize: 13 }}>
                {course.modules.length} module{course.modules.length !== 1 ? "s" : ""}
              </span>
              <span style={{ color: "#888888", fontSize: 13 }}>
                {totalLessons} lesson{totalLessons !== 1 ? "s" : ""}
              </span>
              <span style={{ fontSize: 13, color: "#E8A020", fontWeight: 600 }}>
                {overallProgress}% complete
              </span>
            </div>
            <div className="progress-shell" style={{ marginTop: 14 }}>
              <div className="progress-bar" style={{ width: `${overallProgress}%` }} />
            </div>
          </header>

          <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {course.modules.map((module) => {
              const isExpanded = expandedModules.has(module.id);
              const isCompleted = courseProgress?.moduleProgress.find((m) => m.id === module.id)?.completed ?? false;
              const lessonCount = module.lessons.length;

              return (
                <div
                  key={module.id}
                  style={{
                    background: "#111111",
                    border: `1px solid ${isCompleted ? "#22C55E" : "#222222"}`,
                    borderRadius: 12,
                    overflow: "hidden",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div
                    style={{
                      padding: "20px 24px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 16,
                      transition: "background 0.15s ease",
                    }}
                    onClick={() => toggleModule(module.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleModule(module.id);
                      }
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#1A1A1A")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                        <div
                          style={{
                            fontFamily: "Syne, sans-serif",
                            fontSize: 18,
                            fontWeight: 600,
                          }}
                        >
                          {module.title}
                        </div>
                        {isCompleted && (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <p style={{ color: "#A0A0A0", fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                        {module.description}
                      </p>
                      <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center" }}>
                        <span style={{ color: "#888888", fontSize: 13 }}>{lessonCount} lesson{lessonCount !== 1 ? "s" : ""}</span>
                        {isCompleted && (
                          <span style={{ fontSize: 12, color: "#22C55E", fontWeight: 600 }}>
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
                        color: "#888888",
                        transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform .2s ease",
                        flexShrink: 0,
                        marginTop: 4,
                      }}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                  {isExpanded && (
                    <div
                      style={{
                        padding: "0 24px 20px",
                        borderTop: "1px solid #222222",
                        animation: "slideDown 0.2s ease",
                      }}
                    >
                      {module.lessons.map((lesson) => (
                        <a
                          key={lesson.id}
                          href={`/learn/${course.id}/${module.id}/${lesson.id}`}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 16,
                            padding: "14px 0",
                            borderBottom: "1px solid #222222",
                            textDecoration: "none",
                            color: "inherit",
                            transition: "color 0.15s ease",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "#E8A020")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "inherit")}
                        >
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, fontSize: 15 }}>
                              {lesson.title}
                              {completedLessonIds.has(lesson.id) && (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </div>
                            <div style={{ display: "flex", gap: 10, marginTop: 8, alignItems: "center" }}>
                              <span
                                style={{
                                  display: "inline-flex",
                                  padding: "3px 10px",
                                  borderRadius: 6,
                                  border: "1px solid #222222",
                                  background: "#1A1A1A",
                                  fontSize: 11,
                                  fontWeight: 600,
                                  textTransform: "uppercase",
                                  letterSpacing: "0.08em",
                                  color: "#888888",
                                }}
                              >
                                {lesson.type}
                              </span>
                              <span style={{ color: "#888888", fontSize: 13 }}>{lesson.duration} min</span>
                              <span style={{ color: "#555555", fontSize: 12 }}>
                                {completedLessonIds.has(lesson.id) ? "Completed" : "Not started"}
                              </span>
                            </div>
                          </div>
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{
                              color: "#E8A020",
                              flexShrink: 0,
                              transition: "transform 0.2s ease",
                            }}
                          >
                            <polyline points="9 18 15 12 9 6" />
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
    </main>
  );
}

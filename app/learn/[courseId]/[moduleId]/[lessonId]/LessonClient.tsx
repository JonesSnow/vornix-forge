"use client";

import React, { useEffect, useMemo, useState } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import { colors, STORAGE_KEYS } from "@/lib/constants";
import { navItems, levelCopy } from "@/lib/constants/content/dashboard-content";
import type { AssessmentStorage } from "@/lib/types";
import Sidebar from "../../../../components/Sidebar";

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
};

type LessonClientProps = {
  courseId: string;
  moduleId: string;
  lessonId: string;
  initialLesson?: {
    id: string;
    moduleId: string;
    title: string;
    content: string;
    type: string;
    order: number;
    duration: number;
    isActive: boolean;
    createdAt: string;
    module: {
      id: string;
      title: string;
      courseId: string;
      course: {
        id: string;
        title: string;
      };
      lessons: Array<{
        id: string;
        title: string;
        type: string;
        order: number;
        duration: number;
      }>;
    };
  };
};

function extractKeyConcepts(content: string): string[] {
  const paragraphs = content.split(/\n+/).filter((p) => p.trim().length > 0);
  return paragraphs
    .map((p) => {
      const trimmed = p.trim();
      const match = trimmed.match(/^.+?[.!?](?:\s|$)/);
      return match ? match[0].trim() : trimmed;
    })
    .filter((s) => s.length > 0);
}

export default function LessonClient({
  courseId,
  moduleId,
  lessonId,
  initialLesson,
}: LessonClientProps) {
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);
  const [lesson, setLesson] = useState<LessonClientProps["initialLesson"] | null>(initialLesson ?? null);
  const [assessment, setAssessment] = useState<AssessmentStorage | null>(null);
  const [loading, setLoading] = useState(!initialLesson);
  const [completed, setCompleted] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());
  const [showModuleComplete, setShowModuleComplete] = useState(false);
  const [showCourseComplete, setShowCourseComplete] = useState(false);

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
    if (initialLesson) return;
    async function fetchLesson() {
      try {
        const res = await fetch(`/api/lessons/${lessonId}`);
        if (res.ok) {
          const data = await res.json();
          setLesson(data.lesson);
        }
      } catch (e) {
        console.error("Failed to fetch lesson:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchLesson();
  }, [lessonId, initialLesson]);

  useEffect(() => {
    async function fetchProgress() {
      try {
        const res = await fetch("/api/progress/summary");
        if (res.ok) {
          const data = await res.json();
          const completedLessons = new Set<string>();
          if (data.completedLessons && Array.isArray(data.completedLessons)) {
            data.completedLessons.forEach((l: any) => completedLessons.add(l.lessonId));
          }
          setCompletedLessonIds(completedLessons);
        }
      } catch (e) {
        console.error("Failed to fetch lesson progress:", e);
      }
    }
    fetchProgress();
  }, []);

  const assessmentScore = assessment?.result?.score ?? assessment?.score ?? 0;
  const currentLevel = assessment?.result?.level ?? assessment?.level ?? getLevelFromScore(assessmentScore);

  const profileName = useMemo(() => {
    const email = user?.primaryEmailAddress?.emailAddress?.split("@")[0];
    return user?.fullName || user?.firstName || user?.username || email || "Signed-in user";
  }, [user]);

  const currentModuleLessons = lesson?.module.lessons ?? [];
  const currentIndex = currentModuleLessons.findIndex((l) => l.id === lessonId);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < currentModuleLessons.length - 1;
  const previousLesson = hasPrevious ? currentModuleLessons[currentIndex - 1] : null;
  const nextLesson = hasNext ? currentModuleLessons[currentIndex + 1] : null;
  const isLastInModule = !hasNext;
  const isLastInCourse = isLastInModule && courseId === lesson?.module.course.id;

  const keyConcepts = useMemo(() => {
    if (!lesson?.content) return [];
    return extractKeyConcepts(lesson.content);
  }, [lesson?.content]);

  const paragraphs = useMemo(() => {
    if (!lesson?.content) return [];
    return lesson.content.split(/\n+/).filter((p) => p.trim().length > 0);
  }, [lesson?.content]);

  async function handleMarkComplete() {
    if (completing || completed || !lesson) return;
    setCompleting(true);
    try {
      const res = await fetch("/api/lessons/" + lesson.id + "/complete", {
        method: "POST",
      });
      if (res.ok) {
        setCompleted(true);
        setCompletedLessonIds((prev) => new Set(prev).add(lesson.id));

        if (isLastInModule) {
          setShowModuleComplete(true);
          if (isLastInCourse) {
            setShowCourseComplete(true);
          }
          setTimeout(() => {
            window.location.href = `/learn/${courseId}`;
          }, 3000);
        } else if (nextLesson) {
          setTimeout(() => {
            window.location.href = `/learn/${courseId}/${moduleId}/${nextLesson.id}`;
          }, 1500);
        }
      }
    } catch (e) {
      console.error("Failed to mark complete:", e);
    } finally {
      setCompleting(false);
    }
  }

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
        <div style={{ color: "#888888" }}>Loading lesson...</div>
      </main>
    );
  }

  if (!lesson) {
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
        <div style={{ color: "#888888" }}>Lesson not found.</div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: bg, color: text }}>
      <Sidebar activeLabel="Learn" />

      <div style={{ marginLeft: sidebarWidth, width: `calc(100% - ${sidebarWidth}px)`, display: "flex" }}>
        <section style={{ flex: 1, minWidth: 0, padding: "48px 40px 120px", maxWidth: 760, margin: "0 auto" }}>
          {/* Breadcrumb */}
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
              marginBottom: 24,
            }}
            aria-label="Breadcrumb"
          >
            <a
              href="/learn"
              style={{
                color: "#888888",
                textDecoration: "none",
                fontSize: 13,
                transition: "color 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#F2F0EB")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#888888")}
            >
              Learn
            </a>
            <span style={{ color: "#444444", fontSize: 13 }}>/</span>
            <a
              href={`/learn/${courseId}`}
              style={{
                color: "#888888",
                textDecoration: "none",
                fontSize: 13,
                transition: "color 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#F2F0EB")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#888888")}
            >
              {lesson.module.course.title}
            </a>
            <span style={{ color: "#444444", fontSize: 13 }}>/</span>
            <a
              href={`/learn/${courseId}/${moduleId}`}
              style={{
                color: "#888888",
                textDecoration: "none",
                fontSize: 13,
                transition: "color 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#F2F0EB")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#888888")}
            >
              {lesson.module.title}
            </a>
            <span style={{ color: "#444444", fontSize: 13 }}>/</span>
            <span style={{ color: "#F2F0EB", fontWeight: 600, fontSize: 13 }}>{lesson.title}</span>
          </nav>

          {showCourseComplete && (
            <div
              style={{
                background: "rgba(232, 160, 32, 0.08)",
                border: "1px solid rgba(232, 160, 32, 0.25)",
                borderRadius: 12,
                padding: "20px 24px",
                marginBottom: 24,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontFamily: "Syne, sans-serif",
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#E8A020",
                  marginBottom: 6,
                }}
              >
                Course Complete!
              </div>
              <div style={{ fontSize: 13, color: "#888888" }}>Congratulations! You have finished this course. Redirecting...</div>
            </div>
          )}
          {showModuleComplete && !showCourseComplete && (
            <div
              style={{
                background: "rgba(34, 197, 94, 0.08)",
                border: "1px solid rgba(34, 197, 94, 0.25)",
                borderRadius: 12,
                padding: "20px 24px",
                marginBottom: 24,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontFamily: "Syne, sans-serif",
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#22C55E",
                  marginBottom: 6,
                }}
              >
                Module Complete!
              </div>
              <div style={{ fontSize: 13, color: "#888888" }}>Great work! Redirecting to course page...</div>
            </div>
          )}

          <header style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
              <h1
                style={{
                  fontFamily: "Syne, sans-serif",
                  fontSize: 32,
                  lineHeight: 1.15,
                  margin: 0,
                  flex: 1,
                  minWidth: 0,
                  fontWeight: 700,
                }}
              >
                {lesson.title}
              </h1>
              <span className="badge">{lesson.type.toUpperCase()}</span>
              <span style={{ color: "#888888", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {lesson.duration} min
              </span>
            </div>
          </header>

          {keyConcepts.length > 0 && (
            <div
              style={{
                borderLeft: "3px solid #E8A020",
                background: "rgba(232, 160, 32, 0.04)",
                padding: "24px 28px",
                borderRadius: "0 12px 12px 0",
                marginBottom: 36,
              }}
            >
              <div
                style={{
                  fontFamily: "Syne, sans-serif",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#E8A020",
                  marginBottom: 14,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Key Concepts
              </div>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {keyConcepts.map((concept, index) => (
                  <li
                    key={index}
                    style={{
                      fontSize: 15,
                      lineHeight: 1.8,
                      color: "#F2F0EB",
                      marginBottom: 8,
                    }}
                  >
                    {concept}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <article
            style={{
              fontSize: 18,
              lineHeight: 1.8,
              color: "#F2F0EB",
              maxWidth: 720,
            }}
          >
            {paragraphs.map((paragraph, index) => (
              <p
                key={index}
                style={{
                  fontSize: 18,
                  lineHeight: 1.8,
                  margin: "0 0 24px 0",
                  color: "#F2F0EB",
                }}
              >
                {paragraph}
              </p>
            ))}
          </article>
        </section>

        {/* Right panel - Lesson Outline */}
        <aside
          style={{
            width: 280,
            borderLeft: "1px solid #222222",
            padding: "48px 24px",
            position: "sticky",
            top: 0,
            height: "100vh",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#A0A0A0",
              marginBottom: 16,
            }}
          >
            Lesson Outline
          </div>
          <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {currentModuleLessons.map((l) => {
              const isActive = l.id === lessonId;
              const isCompleted = completedLessonIds.has(l.id);
              return (
                <a
                  key={l.id}
                  href={`/learn/${courseId}/${moduleId}/${l.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 12px",
                    borderRadius: 10,
                    textDecoration: "none",
                    color: isCompleted ? "#22C55E" : "inherit",
                    transition: "all 0.15s ease",
                    fontSize: 14,
                    background: isActive ? "rgba(232, 160, 32, 0.08)" : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "#1A1A1A";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {l.title}
                  </span>
                  {isCompleted && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                  <span style={{ color: "#888888", fontSize: 12, flexShrink: 0 }}>{l.duration}m</span>
                </a>
              );
            })}
          </nav>
        </aside>
      </div>

      {/* Bottom bar */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: sidebarWidth,
          right: 0,
          background: "rgba(10, 10, 10, 0.95)",
          backdropFilter: "blur(12px)",
          borderTop: "1px solid #222222",
          padding: "16px 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          zIndex: 40,
        }}
      >
        <div style={{ flex: 1 }}>
          {hasPrevious ? (
            <a
              href={`/learn/${courseId}/${moduleId}/${previousLesson!.id}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 20px",
                background: "#111111",
                border: "1px solid #222222",
                borderRadius: 8,
                color: "#F2F0EB",
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#2A2A2A")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#222222")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Previous
            </a>
          ) : (
            <button
              disabled
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 20px",
                background: "#111111",
                border: "1px solid #222222",
                borderRadius: 8,
                color: "#555555",
                fontSize: 13,
                fontWeight: 600,
                cursor: "not-allowed",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Previous
            </button>
          )}
        </div>

        <div style={{ color: "#888888", fontSize: 13, textAlign: "center", flexShrink: 0 }}>
          Lesson {currentIndex + 1} of {currentModuleLessons.length} in this module
        </div>

        <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
          {completed ? (
            <button
              disabled
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 20px",
                background: "#22C55E",
                border: "none",
                borderRadius: 8,
                color: "#0A0A0A",
                fontSize: 13,
                fontWeight: 600,
                cursor: "default",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Completed
            </button>
          ) : (
            <button
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 20px",
                background: "#E8A020",
                border: "none",
                borderRadius: 8,
                color: "#0A0A0A",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease",
                opacity: completing ? 0.6 : 1,
              }}
              onClick={handleMarkComplete}
              disabled={completing}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#d4941a")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#E8A020")}
            >
              {completing ? (
                "Saving..."
              ) : (
                <>
                  Mark as Complete
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

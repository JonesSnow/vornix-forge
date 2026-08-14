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
        <div style={{ color: colors.text.muted }}>Loading lesson...</div>
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
        <div style={{ color: colors.text.muted }}>Lesson not found.</div>
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
        .outline-item { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 10px; text-decoration: none; color: inherit; transition: all .2s ease; font-size: 14px; }
        .outline-item:hover { background: #111111; }
        .outline-item.active { background: rgba(232, 160, 32, 0.08); color: ${accent}; }
        .outline-item.completed { color: #4ade80; }
        .action-btn { display: inline-flex; align-items: center; gap: 8px; padding: 12px 20px; border-radius: 12px; font-weight: 600; font-size: 14px; cursor: pointer; transition: all .2s ease; border: none; text-decoration: none; }
        .action-btn:hover { transform: translateY(-1px); }
        .action-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
        .action-btn-secondary { background: #0F0F0F; border: 1px solid #1E1E1E; color: ${text}; }
        .action-btn-secondary:hover:not(:disabled) { border-color: #2A2A2A; background: #111111; }
        .action-btn-primary { background: ${accent}; color: #0A0A0A; }
        .action-btn-primary:hover:not(:disabled) { background: #d4941a; }
        .lesson-content p { font-size: 18px; line-height: 1.8; margin: 0 0 20px 0; color: ${text}; }
        .lesson-content p:last-child { margin-bottom: 0; }
        .key-concepts { border-left: 3px solid ${accent}; background: rgba(232, 160, 32, 0.04); padding: 20px 24px; border-radius: 0 12px 12px 0; margin-bottom: 28px; }
        .key-concepts-title { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: ${accent}; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.08em; }
        .key-concepts ul { margin: 0; padding-left: 20px; }
        .key-concepts li { font-size: 15px; line-height: 1.7; color: ${text}; margin-bottom: 8px; }
        .key-concepts li:last-child { margin-bottom: 0; }
        .breadcrumb { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; }
        .breadcrumb a { color: #9A9A9A; text-decoration: none; font-size: 13px; transition: color .2s ease; }
        .breadcrumb a:hover { color: ${text}; }
        .breadcrumb span { color: #444; font-size: 13px; }
        .breadcrumb .current { color: ${text}; font-weight: 600; font-size: 13px; }
        .complete-banner { background: rgba(232, 160, 32, 0.08); border: 1px solid rgba(232,160,32,0.25); border-radius: 12px; padding: 20px 24px; margin-bottom: 24px; text-align: center; }
        .complete-banner.module { background: rgba(74, 222, 128, 0.08); border-color: rgba(74,222,128,0.25); }
        .complete-banner.course { background: rgba(232, 160, 32, 0.12); border-color: ${accent}; }
        .complete-title { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700; color: ${accent}; margin-bottom: 6px; }
        .complete-banner.module .complete-title { color: #4ade80; }
        .complete-sub { font-size: 13px; color: #888; }
        @media (max-width: 1024px) {
          .lesson-layout { flex-direction: column; }
          .right-panel { display: none; }
        }
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

        <div className="lesson-layout" style={{ marginLeft: sidebarWidth, width: `calc(100% - ${sidebarWidth}px)`, display: "flex" }}>
          <section style={{ flex: 1, minWidth: 0, padding: "32px 40px 120px", maxWidth: 860, margin: "0 auto" }}>
            <nav className="breadcrumb" aria-label="Breadcrumb">
              <a href="/learn">Learn</a>
              <span>/</span>
              <a href={`/learn/${courseId}`}>{lesson.module.course.title}</a>
              <span>/</span>
              <a href={`/learn/${courseId}/${moduleId}`}>{lesson.module.title}</a>
              <span>/</span>
              <span className="current">{lesson.title}</span>
            </nav>

            {showCourseComplete && (
              <div className="complete-banner course">
                <div className="complete-title">Course Complete!</div>
                <div className="complete-sub">Congratulations! You have finished this course. Redirecting...</div>
              </div>
            )}
            {showModuleComplete && !showCourseComplete && (
              <div className="complete-banner module">
                <div className="complete-title">Module Complete!</div>
                <div className="complete-sub">Great work! Redirecting to course page...</div>
              </div>
            )}

            <header style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 32, lineHeight: 1.15, margin: 0, flex: 1, minWidth: 0 }}>
                  {lesson.title}
                </h1>
                <span className="badge">{lesson.type.toUpperCase()}</span>
                <span className="muted" style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  {lesson.duration} min
                </span>
              </div>
            </header>

            {keyConcepts.length > 0 && (
              <div className="key-concepts">
                <div className="key-concepts-title">Key Concepts</div>
                <ul>
                  {keyConcepts.map((concept, index) => (
                    <li key={index}>{concept}</li>
                  ))}
                </ul>
              </div>
            )}

            <article className="lesson-content">
              {paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </article>
          </section>

          <aside className="right-panel" style={{ width: 280, borderLeft: "1px solid #1E1E1E", padding: "32px 24px", position: "sticky", top: 0, height: "100vh", overflowY: "auto" }}>
            <div className="muted" style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
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
                    className={`outline-item ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}
                  >
                    <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.title}</span>
                    {isCompleted && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                    <span className="muted" style={{ fontSize: 12, flexShrink: 0 }}>{l.duration}m</span>
                  </a>
                );
              })}
            </nav>
          </aside>
        </div>

        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: sidebarWidth,
            right: 0,
            background: "rgba(10, 10, 10, 0.9)",
            backdropFilter: "blur(12px)",
            borderTop: "1px solid #1E1E1E",
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
              <a href={`/learn/${courseId}/${moduleId}/${previousLesson!.id}`} className="action-btn action-btn-secondary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
                Previous
              </a>
            ) : (
              <button className="action-btn action-btn-secondary" disabled>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
                Previous
              </button>
            )}
          </div>

          <div className="muted" style={{ fontSize: 13, textAlign: "center", flexShrink: 0 }}>
            Lesson {currentIndex + 1} of {currentModuleLessons.length} in this module
          </div>

          <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
            {completed ? (
              <button className="action-btn action-btn-primary" disabled style={{ background: "#4ade80", color: "#0A0A0A" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Completed
              </button>
            ) : (
              <button
                className="action-btn action-btn-primary"
                onClick={handleMarkComplete}
                disabled={completing}
              >
                {completing ? (
                  "Saving..."
                ) : (
                  <>
                    Mark as Complete
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

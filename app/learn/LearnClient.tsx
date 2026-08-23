"use client";

import React, { useEffect, useMemo, useState } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import { colors, STORAGE_KEYS } from "@/lib/constants";
import { navItems, levelCopy } from "@/lib/constants/content/dashboard-content";
import type { AssessmentStorage } from "@/lib/types";
import Sidebar from "../components/Sidebar";

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
        <div style={{ color: "#888888" }}>Loading courses...</div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: bg, color: text }}>
      <Sidebar activeLabel="Learn" />

      <section style={{ marginLeft: sidebarWidth, width: `calc(100% - ${sidebarWidth}px)`, padding: "48px 40px 80px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <header
            style={{
              background: "#111111",
              border: "1px solid #222222",
              borderRadius: 12,
              padding: 28,
              marginBottom: 40,
            }}
          >
            <h1
              style={{
                fontFamily: "Syne, sans-serif",
                fontSize: 36,
                lineHeight: 1.05,
                margin: 0,
                fontWeight: 700,
              }}
            >
              Learn
            </h1>
            <p style={{ color: "#A0A0A0", marginTop: 8, lineHeight: 1.6, fontSize: 14 }}>
              Master trading fundamentals level by level. Complete each course to unlock the next.
            </p>
          </header>

          {sortedLevels.length === 0 && (
            <div
              style={{
                background: "#111111",
                border: "1px solid #222222",
                borderRadius: 12,
                padding: 28,
                textAlign: "center",
                color: "#888888",
              }}
            >
              No courses available yet.
            </div>
          )}

          {sortedLevels.map((level) => {
            const levelCourses = coursesByLevel[level];
            const isUnlocked = level <= currentLevel;
            const levelEntry = levelCopy[level] ?? levelCopy[1];

            return (
              <section key={level} style={{ marginBottom: 40 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: isUnlocked ? "rgba(232, 160, 32, 0.1)" : "#1A1A1A",
                      border: `1px solid ${isUnlocked ? "rgba(232, 160, 32, 0.3)" : "#222222"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "Syne, sans-serif",
                      fontSize: 14,
                      fontWeight: 700,
                      color: isUnlocked ? "#E8A020" : "#555555",
                    }}
                  >
                    {level}
                  </div>
                  <h2
                    style={{
                      fontFamily: "Syne, sans-serif",
                      fontSize: 22,
                      margin: 0,
                      fontWeight: 700,
                    }}
                  >
                    {levelEntry.name}
                  </h2>
                  {!isUnlocked && (
                    <span
                      className="badge"
                      style={{ opacity: 0.7 }}
                    >
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
                        style={{
                          display: "block",
                          background: "#111111",
                          border: "1px solid #222222",
                          borderRadius: 12,
                          padding: 24,
                          textDecoration: "none",
                          color: "inherit",
                          transition: "all 0.15s ease",
                          cursor: unlocked ? "pointer" : "not-allowed",
                          opacity: unlocked ? 1 : 0.5,
                        }}
                        onClick={(e) => {
                          if (!unlocked) e.preventDefault();
                        }}
                        onMouseEnter={(e) => {
                          if (unlocked) {
                            e.currentTarget.style.borderColor = "#2A2A2A";
                            e.currentTarget.style.transform = "translateY(-2px)";
                            e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.3)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (unlocked) {
                            e.currentTarget.style.borderColor = "#222222";
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "none";
                          }
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            gap: 12,
                            marginBottom: 14,
                          }}
                        >
                          <h3
                            style={{
                              fontFamily: "Syne, sans-serif",
                              fontSize: 18,
                              margin: 0,
                              lineHeight: 1.3,
                              fontWeight: 600,
                            }}
                          >
                            {course.title}
                          </h3>
                          <span className="badge">Level {course.level}</span>
                        </div>
                        <p
                          style={{
                            color: "#A0A0A0",
                            fontSize: 14,
                            lineHeight: 1.7,
                            marginBottom: 18,
                          }}
                        >
                          {course.description}
                        </p>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 12,
                            marginBottom: 14,
                          }}
                        >
                          <span style={{ color: "#888888", fontSize: 13 }}>
                            {moduleCount} module{moduleCount !== 1 ? "s" : ""}
                          </span>
                          {!unlocked && (
                            <span
                              style={{
                                fontSize: 12,
                                color: "#555555",
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
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                              </svg>
                              Complete Level {course.level - 1} first
                            </span>
                          )}
                          {unlocked && hasProgress && (
                            <span style={{ fontSize: 12, color: "#E8A020", fontWeight: 600 }}>
                              {progress}% complete
                            </span>
                          )}
                        </div>
                        <div className="progress-shell">
                          <div className="progress-bar" style={{ width: `${progress}%` }} />
                        </div>
                        {unlocked && hasProgress && (
                          <div style={{ marginTop: 14 }}>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "8px 18px",
                                borderRadius: 8,
                                background: "#E8A020",
                                color: "#0A0A0A",
                                fontWeight: 600,
                                fontSize: 13,
                                transition: "all 0.15s ease",
                              }}
                            >
                              Continue
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6" />
                              </svg>
                            </span>
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
    </main>
  );
}

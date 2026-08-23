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

type CommunityPost = {
  id: string;
  clerkId: string;
  content: string;
  likes: number;
  createdAt: string;
  profile: {
    clerkId: string;
    firstName: string | null;
    lastName: string | null;
  };
};

type CommunityClientProps = {
  userId: string;
};

type DateGroup = {
  label: string;
  posts: CommunityPost[];
};

export default function CommunityClient({ userId }: CommunityClientProps) {
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [assessment, setAssessment] = useState<AssessmentStorage | null>(null);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [currentUserLevel, setCurrentUserLevel] = useState(1);

  useEffect(() => {
    const assessmentRaw = localStorage.getItem(STORAGE_KEYS.assessment);
    if (assessmentRaw) {
      try {
        const parsed = JSON.parse(assessmentRaw) as AssessmentStorage;
        setAssessment(parsed);
        const score = parsed.result?.score ?? parsed.score ?? 0;
        const level = parsed.result?.level ?? parsed.level ?? getLevelFromScore(score);
        setCurrentUserLevel(level);
      } catch {
        setAssessment(null);
      }
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    try {
      const res = await fetch("/api/community");
      if (res.ok) {
        const data = await res.json();
        setPosts(Array.isArray(data.posts) ? data.posts : []);
      }
    } catch (e) {
      console.error("Failed to fetch community posts:", e);
    } finally {
      setLoading(false);
    }
  }

  const assessmentScore = assessment?.result?.score ?? assessment?.score ?? 0;
  const currentLevel = assessment?.result?.level ?? assessment?.level ?? getLevelFromScore(assessmentScore);
  const levelEntry = levelCopy[currentLevel] ?? levelCopy[1];

  const profileName = useMemo(() => {
    const email = user?.primaryEmailAddress?.emailAddress?.split("@")[0];
    return user?.fullName || user?.firstName || user?.username || email || "Signed-in user";
  }, [user]);

  function getDateLabel(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const postDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (postDate.getTime() === today.getTime()) return "Today";
    if (postDate.getTime() === yesterday.getTime()) return "Yesterday";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  const groupedPosts = useMemo(() => {
    const groups: DateGroup[] = [];
    const map = new Map<string, CommunityPost[]>();

    posts.forEach((post) => {
      const label = getDateLabel(post.createdAt);
      if (!map.has(label)) {
        map.set(label, []);
      }
      map.get(label)!.push(post);
    });

    map.forEach((posts, label) => {
      groups.push({ label, posts });
    });

    return groups;
  }, [posts]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    if (content.trim().length < 10) {
      setError("Post must be at least 10 characters");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to post");
      } else {
        setSuccess("Posted!");
        setContent("");
        await fetchPosts();
      }
    } catch (e) {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLike(postId: string) {
    try {
      const res = await fetch(`/api/community/${postId}/like`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, likes: data.likes } : p
          )
        );
        setLikedPosts((prev) => {
          const next = new Set(prev);
          if (data.liked) {
            next.add(postId);
          } else {
            next.delete(postId);
          }
          return next;
        });
      }
    } catch (e) {
      console.error("Failed to like post:", e);
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
        <div style={{ color: "#888888" }}>Loading community...</div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: bg, color: text }}>
      <Sidebar activeLabel="Community" />

      <section style={{ marginLeft: sidebarWidth, width: `calc(100% - ${sidebarWidth}px)`, padding: "48px 40px 80px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <header style={{ marginBottom: 28 }}>
            <h1
              style={{
                fontFamily: "Syne, sans-serif",
                fontSize: 36,
                lineHeight: 1.05,
                margin: 0,
                fontWeight: 700,
              }}
            >
              Community
            </h1>
            <p style={{ color: "#A0A0A0", marginTop: 8, lineHeight: 1.6, fontSize: 14 }}>
              {posts.length} {posts.length === 1 ? "post" : "posts"} in community · Share insights, ask questions, and connect with fellow traders.
            </p>
          </header>

          {/* Post composer */}
          <div
            style={{
              background: "#111111",
              border: "1px solid #222222",
              borderRadius: 12,
              padding: 24,
              marginBottom: 32,
            }}
          >
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {error && (
                <div
                  style={{
                    color: "#EF4444",
                    fontSize: 14,
                    padding: "10px 14px",
                    background: "rgba(239, 68, 68, 0.08)",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                    borderRadius: 8,
                  }}
                >
                  {error}
                </div>
              )}
              {success && (
                <div
                  style={{
                    color: "#22C55E",
                    fontSize: 14,
                    padding: "10px 14px",
                    background: "rgba(34, 197, 94, 0.08)",
                    border: "1px solid rgba(34, 197, 94, 0.2)",
                    borderRadius: 8,
                  }}
                >
                  {success}
                </div>
              )}
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                style={{
                  width: "100%",
                  minHeight: 100,
                  padding: 14,
                  borderRadius: 10,
                  border: "1px solid #222222",
                  background: "#0F0F0F",
                  color: "#F2F0EB",
                  fontSize: 15,
                  outline: "none",
                  transition: "border-color 0.15s ease",
                  resize: "vertical",
                  fontFamily: "Inter, sans-serif",
                  lineHeight: 1.7,
                }}
                placeholder="Share a trading insight or ask a question..."
                maxLength={1000}
                required
                onFocus={(e) => (e.currentTarget.style.borderColor = "#E8A020")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#222222")}
              />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#888888" }}>
                  {content.length}/1000 · min 10 chars
                </span>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting || content.trim().length < 10}
                  style={{ opacity: submitting || content.trim().length < 10 ? 0.6 : 1 }}
                >
                  {submitting ? "Posting..." : "Post"}
                </button>
              </div>
            </form>
          </div>

          {posts.length === 0 ? (
            <div
              style={{
                background: "#111111",
                border: "1px solid #222222",
                borderRadius: 12,
                padding: 56,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 16 }}>💬</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: "#F2F0EB" }}>No posts yet</div>
              <div style={{ color: "#A0A0A0", fontSize: 14 }}>Be the first to share something with the community.</div>
            </div>
          ) : (
            <div>
              {groupedPosts.map((group) => (
                <div key={group.label}>
                  <div
                    style={{
                      fontFamily: "Syne, sans-serif",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#555555",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      marginBottom: 14,
                      marginTop: 28,
                    }}
                  >
                    {group.label}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
                    {group.posts.map((post) => {
                      const isLiked = likedPosts.has(post.id);
                      const authorName = post.profile.firstName || post.profile.lastName
                        ? `${post.profile.firstName || ""} ${post.profile.lastName || ""}`.trim()
                        : "Anonymous";

                      return (
                        <div
                          key={post.id}
                          style={{
                            background: "#111111",
                            border: "1px solid #222222",
                            borderRadius: 12,
                            padding: "20px 24px",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                            <div
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: "50%",
                                background: "#1A1A1A",
                                border: "1px solid #2A2A2A",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 14,
                                fontWeight: 700,
                                color: "#E8A020",
                                flexShrink: 0,
                              }}
                            >
                              {authorName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                                <span style={{ fontSize: 14, fontWeight: 600, color: "#F2F0EB" }}>{authorName}</span>
                                <span className="badge" style={{ padding: "2px 10px", fontSize: 11 }}>Lvl {currentUserLevel}</span>
                              </div>
                              <div style={{ color: "#888888", fontSize: 12, marginTop: 3 }}>
                                {new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                              </div>
                            </div>
                          </div>
                          <p
                            style={{
                              fontSize: 15,
                              lineHeight: 1.7,
                              margin: "0 0 18px 0",
                              whiteSpace: "pre-wrap",
                              color: "#F2F0EB",
                            }}
                          >
                            {post.content}
                          </p>
                          <div style={{ display: "flex", alignItems: "center" }}>
                            <button
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "6px 14px",
                                borderRadius: 8,
                                border: `1px solid ${isLiked ? "#E8A020" : "#222222"}`,
                                background: isLiked ? "rgba(232, 160, 32, 0.08)" : "transparent",
                                color: isLiked ? "#E8A020" : "#A0A0A0",
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                              }}
                              onClick={() => handleLike(post.id)}
                              onMouseEnter={(e) => {
                                if (!isLiked) {
                                  e.currentTarget.style.borderColor = "#E8A020";
                                  e.currentTarget.style.color = "#E8A020";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isLiked) {
                                  e.currentTarget.style.borderColor = "#222222";
                                  e.currentTarget.style.color = "#A0A0A0";
                                }
                              }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                              </svg>
                              {post.likes}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

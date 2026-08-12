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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

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
        <div style={{ color: colors.text.muted }}>Loading community...</div>
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
        .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 20px; border-radius: 12px; font-weight: 600; font-size: 14px; cursor: pointer; transition: all .2s ease; border: none; }
        .btn:hover:not(:disabled) { transform: translateY(-1px); }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .btn-primary { background: ${accent}; color: #0A0A0A; }
        .btn-primary:hover:not(:disabled) { background: #d4941a; }
        .community-input { width: 100%; padding: 14px 16px; border-radius: 12px; border: 1px solid #1E1E1E; background: #111111; color: ${text}; font-size: 15px; outline: none; transition: border-color .2s ease; font-family: 'Inter', sans-serif; resize: vertical; min-height: 80px; }
        .community-input:focus { border-color: ${accent}; }
        .post-card { background: #0F0F0F; border: 1px solid #1E1E1E; border-radius: 16px; padding: 20px 24px; transition: all .2s ease; }
        .post-card:hover { border-color: #2A2A2A; }
        .like-btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 8px; border: 1px solid #1E1E1E; background: transparent; color: ${likedPosts.has('') ? '#4ade80' : '#9A9A9A'}; font-size: 13px; cursor: pointer; transition: all .2s ease; }
        .like-btn:hover { border-color: #4ade80; color: #4ade80; }
        .like-btn.liked { border-color: #4ade80; color: #4ade80; background: rgba(74, 222, 128, 0.08); }
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
                  className={item.label === "Community" ? "sidebar-link active" : "sidebar-link"}
                  aria-current={item.label === "Community" ? "page" : undefined}
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
                  {levelEntry.name}
                </div>
              </div>
              <div className="badge">{levelEntry.name}</div>
            </div>
            <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
              <UserButton />
            </div>
          </div>
        </aside>

        <section style={{ marginLeft: sidebarWidth, width: `calc(100% - ${sidebarWidth}px)`, padding: 32 }}>
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <header style={{ marginBottom: 24 }}>
              <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 36, lineHeight: 1.05, margin: 0 }}>Community</h1>
              <p className="muted" style={{ marginTop: 8, lineHeight: 1.6 }}>
                Share insights, ask questions, and connect with fellow traders.
              </p>
            </header>

            <div className="card" style={{ padding: 24, marginBottom: 24 }}>
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {error && <div style={{ color: "#ef4444", fontSize: 14 }}>{error}</div>}
                {success && <div style={{ color: "#4ade80", fontSize: 14 }}>{success}</div>}
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="community-input"
                  placeholder="Share a trading insight or ask a question..."
                  maxLength={1000}
                  required
                />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="muted" style={{ fontSize: 12 }}>{content.length}/1000</span>
                  <button type="submit" className="btn btn-primary" disabled={submitting || content.trim().length === 0}>
                    {submitting ? "Posting..." : "Post"}
                  </button>
                </div>
              </form>
            </div>

            {posts.length === 0 ? (
              <div className="card" style={{ padding: 48, textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>💬</div>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No posts yet</div>
                <div className="muted" style={{ fontSize: 14 }}>Be the first to share something with the community.</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {posts.map((post) => {
                  const isLiked = likedPosts.has(post.id);
                  const authorName = post.profile.firstName || post.profile.lastName
                    ? `${post.profile.firstName || ""} ${post.profile.lastName || ""}`.trim()
                    : "Anonymous";

                  return (
                    <div key={post.id} className="post-card">
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#1E1E1E", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: accent }}>
                          {authorName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600 }}>{authorName}</div>
                          <div className="muted" style={{ fontSize: 12 }}>
                            {new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      </div>
                      <p style={{ fontSize: 15, lineHeight: 1.7, margin: "0 0 16px 0", whiteSpace: "pre-wrap" }}>{post.content}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <button
                          className={`like-btn ${isLiked ? "liked" : ""}`}
                          onClick={() => handleLike(post.id)}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                          </svg>
                          {post.likes}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

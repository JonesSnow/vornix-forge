"use client";

import { useState, useEffect, FormEvent } from "react";

type Stats = {
  totalUsers: number;
  activeToday: number;
  totalTrades: number;
  journalEntries: number;
  communityPosts: number;
  coursesCount: number;
};

type User = {
  clerkId: string;
  name: string;
  email: string;
  level: string;
  assessmentScore: number;
  tradesMade: number;
  journalEntries: number;
  joinedDate: string;
};

type Course = {
  id: string;
  title: string;
  description: string;
  level: number;
  order: number;
  modules: { id: string; title: string; lessons: { id: string; title: string }[] }[];
};

type CommunityPost = {
  id: string;
  content: string;
  reports: number;
  createdAt: string;
  profile: { firstName: string | null; lastName: string | null };
};

type SimulatorData = {
  totalPortfolioValue: number;
  topTraders: any[];
  recentTrades: any[];
  portfolios: any[];
};

type JournalEntry = {
  id: string;
  title: string;
  content: string;
  mood: string;
  createdAt: string;
  profile: { firstName: string | null; lastName: string | null };
};

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "users", label: "Users" },
  { id: "content", label: "Content" },
  { id: "community", label: "Community" },
  { id: "simulator", label: "Simulator" },
  { id: "journal", label: "Journal" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function AdminClient() {
  const [view, setView] = useState<TabId>("overview");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [stats, setStats] = useState<Stats | null>(null);
  const [activity, setActivity] = useState<{ message: string; timestamp: string }[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [newCourse, setNewCourse] = useState({ title: "", description: "", level: "", order: "" });
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [simulator, setSimulator] = useState<SimulatorData | null>(null);
  const [journals, setJournals] = useState<JournalEntry[]>([]);

  const fetchJSON = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${url}`);
    return res.json();
  };

  const loadOverview = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchJSON("/api/admin/stats");
      setStats(data);
      setActivity([{ message: "Platform stats loaded", timestamp: new Date().toISOString() }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load overview");
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchJSON("/api/admin/users");
      setUsers(data.users || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const loadContent = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchJSON("/api/admin/content");
      setCourses(data.courses || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load content");
    } finally {
      setLoading(false);
    }
  };

  const loadCommunity = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchJSON("/api/admin/community");
      setPosts(data.posts || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load community");
    } finally {
      setLoading(false);
    }
  };

  const loadSimulator = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchJSON("/api/admin/simulator");
      setSimulator(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load simulator");
    } finally {
      setLoading(false);
    }
  };

  const loadJournal = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchJSON("/api/admin/journal");
      setJournals(data.entries || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load journal");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    switch (view) {
      case "overview":
        loadOverview();
        break;
      case "users":
        loadUsers();
        break;
      case "content":
        loadContent();
        break;
      case "community":
        loadCommunity();
        break;
      case "simulator":
        loadSimulator();
        break;
      case "journal":
        loadJournal();
        break;
    }
  }, [view]);

  const addCourse = async (e: FormEvent) => {
    e.preventDefault();
    await fetch("/api/admin/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCourse),
    });
    setNewCourse({ title: "", description: "", level: "", order: "" });
    loadContent();
  };

  const deletePost = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    await fetch("/api/admin/community", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postIds: [id] }),
    });
    loadCommunity();
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0A0A0A", color: "#F2F0EB", fontFamily: "Inter, sans-serif" }}>
      <aside
        style={{
          width: 220,
          background: "#0A0A0A",
          borderRight: "1px solid #222222",
          flexShrink: 0,
          padding: "24px 16px",
        }}
      >
        <div
          style={{
            fontFamily: "Syne, sans-serif",
            fontSize: 13,
            letterSpacing: "0.15em",
            fontWeight: 700,
            color: "#F2F0EB",
            marginBottom: 32,
            padding: "0 12px",
          }}
        >
          VORNIX ADMIN
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {TABS.map((tab) => {
            const isActive = view === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setView(tab.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  height: 40,
                  padding: "0 12px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  color: isActive ? "#F2F0EB" : "#A0A0A0",
                  background: isActive ? "#1A1A1A" : "transparent",
                  borderLeft: isActive ? "2px solid #E8A020" : "2px solid transparent",
                  transition: "all 0.15s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "#1A1A1A";
                    e.currentTarget.style.color = "#F2F0EB";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#A0A0A0";
                  }
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <main style={{ flex: 1, padding: "48px 40px", overflow: "auto" }}>
        {loading && <div style={{ color: "#888888", marginBottom: 16 }}>Loading...</div>}
        {error && <div style={{ color: "#EF4444", marginBottom: 16, fontSize: 14 }}>{error}</div>}

        {view === "overview" && stats && (
          <div>
            <h2
              style={{
                fontFamily: "Syne, sans-serif",
                fontSize: 24,
                fontWeight: 700,
                marginBottom: 28,
              }}
            >
              Platform Overview
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 16,
                marginBottom: 32,
              }}
            >
              {[
                { label: "Total Users", value: stats.totalUsers },
                { label: "Active Today", value: stats.activeToday },
                { label: "Total Trades", value: stats.totalTrades },
                { label: "Journal Entries", value: stats.journalEntries },
                { label: "Community Posts", value: stats.communityPosts },
                { label: "Courses Available", value: stats.coursesCount },
              ].map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    background: "#111111",
                    border: "1px solid #222222",
                    borderRadius: 12,
                    padding: 24,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "#888888",
                      marginBottom: 10,
                    }}
                  >
                    {stat.label}
                  </div>
                  <div
                    style={{
                      fontFamily: "Syne, sans-serif",
                      fontSize: 28,
                      fontWeight: 700,
                      color: "#F2F0EB",
                    }}
                  >
                    {stat.value.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
            <div
              style={{
                background: "#111111",
                border: "1px solid #222222",
                borderRadius: 12,
                padding: 24,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#888888",
                  marginBottom: 16,
                }}
              >
                Recent Activity
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {activity.map((item, i) => (
                  <div key={i} style={{ fontSize: 14, color: "#F2F0EB" }}>
                    <span style={{ color: "#555555", fontSize: 12 }}>{new Date(item.timestamp).toLocaleString()}</span>
                    {" — "}
                    {item.message}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {view === "users" && (
          <div>
            <h2
              style={{
                fontFamily: "Syne, sans-serif",
                fontSize: 24,
                fontWeight: 700,
                marginBottom: 24,
              }}
            >
              Users
            </h2>
            <input
              type="text"
              placeholder="Search users..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              style={{
                width: "100%",
                maxWidth: 400,
                padding: "10px 16px",
                background: "#111111",
                border: "1px solid #222222",
                borderRadius: 8,
                color: "#F2F0EB",
                fontSize: 14,
                marginBottom: 20,
                outline: "none",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#E8A020")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#222222")}
            />
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 14,
                }}
              >
                <thead>
                  <tr style={{ borderBottom: "1px solid #222222" }}>
                    {["Name", "Email", "Level", "Score", "Trades", "Joined"].map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: "left",
                          padding: "10px 12px",
                          color: "#888888",
                          fontWeight: 500,
                          fontSize: 12,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.clerkId}
                      onClick={() => setSelectedUser(user)}
                      style={{
                        borderBottom: "1px solid #222222",
                        cursor: "pointer",
                        background: selectedUser?.clerkId === user.clerkId ? "rgba(232, 160, 32, 0.08)" : "transparent",
                        color: selectedUser?.clerkId === user.clerkId ? "#E8A020" : "#F2F0EB",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (selectedUser?.clerkId !== user.clerkId) {
                          e.currentTarget.style.background = "#111111";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedUser?.clerkId !== user.clerkId) {
                          e.currentTarget.style.background = "transparent";
                        }
                      }}
                    >
                      <td style={{ padding: "10px 12px" }}>{user.name}</td>
                      <td style={{ padding: "10px 12px", color: "#888888" }}>{user.email}</td>
                      <td style={{ padding: "10px 12px" }}>{user.level}</td>
                      <td style={{ padding: "10px 12px" }}>{user.assessmentScore}</td>
                      <td style={{ padding: "10px 12px" }}>{user.tradesMade}</td>
                      <td style={{ padding: "10px 12px", color: "#888888" }}>
                        {new Date(user.joinedDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {selectedUser && (
              <div
                style={{
                  background: "#111111",
                  border: "1px solid #222222",
                  borderRadius: 12,
                  padding: 24,
                  marginTop: 20,
                }}
              >
                <div
                  style={{
                    fontFamily: "Syne, sans-serif",
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#F2F0EB",
                    marginBottom: 12,
                  }}
                >
                  User Details
                </div>
                <pre
                  style={{
                    fontSize: 12,
                    color: "#A0A0A0",
                    overflow: "auto",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {JSON.stringify(selectedUser, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {view === "content" && (
          <div>
            <h2
              style={{
                fontFamily: "Syne, sans-serif",
                fontSize: 24,
                fontWeight: 700,
                marginBottom: 24,
              }}
            >
              Content
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
              {courses.map((course) => (
                <div
                  key={course.id}
                  style={{
                    background: "#111111",
                    border: "1px solid #222222",
                    borderRadius: 12,
                    padding: 24,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                    <span
                      style={{
                        fontFamily: "Syne, sans-serif",
                        fontSize: 16,
                        fontWeight: 700,
                        color: "#F2F0EB",
                      }}
                    >
                      {course.title}
                    </span>
                    <span className="badge">Level {course.level}</span>
                  </div>
                  <div style={{ color: "#A0A0A0", fontSize: 14, lineHeight: 1.7, marginBottom: 10 }}>
                    {course.description}
                  </div>
                  <div style={{ color: "#888888", fontSize: 12 }}>
                    {course.modules.length} modules,{" "}
                    {course.modules.reduce((acc, m) => acc + m.lessons.length, 0)} lessons
                  </div>
                </div>
              ))}
            </div>
            <form
              onSubmit={addCourse}
              style={{
                background: "#111111",
                border: "1px solid #222222",
                borderRadius: 12,
                padding: 28,
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <div
                style={{
                  fontFamily: "Syne, sans-serif",
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#F2F0EB",
                }}
              >
                Add Course
              </div>
              <input
                name="title"
                placeholder="Title"
                required
                style={{
                  padding: "10px 14px",
                  background: "#0F0F0F",
                  border: "1px solid #222222",
                  borderRadius: 8,
                  color: "#F2F0EB",
                  fontSize: 14,
                  outline: "none",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#E8A020")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#222222")}
              />
              <input
                name="description"
                placeholder="Description"
                required
                style={{
                  padding: "10px 14px",
                  background: "#0F0F0F",
                  border: "1px solid #222222",
                  borderRadius: 8,
                  color: "#F2F0EB",
                  fontSize: 14,
                  outline: "none",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#E8A020")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#222222")}
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <input
                  name="level"
                  type="number"
                  placeholder="Level"
                  required
                  style={{
                    padding: "10px 14px",
                    background: "#0F0F0F",
                    border: "1px solid #222222",
                    borderRadius: 8,
                    color: "#F2F0EB",
                    fontSize: 14,
                    outline: "none",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#E8A020")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#222222")}
                />
                <input
                  name="order"
                  type="number"
                  placeholder="Order"
                  required
                  style={{
                    padding: "10px 14px",
                    background: "#0F0F0F",
                    border: "1px solid #222222",
                    borderRadius: 8,
                    color: "#F2F0EB",
                    fontSize: 14,
                    outline: "none",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#E8A020")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#222222")}
                />
              </div>
              <button
                type="submit"
                className="btn-primary"
                style={{ alignSelf: "flex-start" }}
              >
                Add Course
              </button>
            </form>
          </div>
        )}

        {view === "community" && (
          <div>
            <h2
              style={{
                fontFamily: "Syne, sans-serif",
                fontSize: 24,
                fontWeight: 700,
                marginBottom: 24,
              }}
            >
              Community
            </h2>
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 14,
                }}
              >
                <thead>
                  <tr style={{ borderBottom: "1px solid #222222" }}>
                    {["Author", "Content", "Reports", "Date", "Action"].map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: "left",
                          padding: "10px 12px",
                          color: "#888888",
                          fontWeight: 500,
                          fontSize: 12,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post) => (
                    <tr key={post.id} style={{ borderBottom: "1px solid #222222" }}>
                      <td style={{ padding: "10px 12px" }}>
                        {post.profile.firstName} {post.profile.lastName}
                      </td>
                      <td style={{ padding: "10px 12px", color: "#A0A0A0", maxWidth: 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {post.content}
                      </td>
                      <td style={{ padding: "10px 12px" }}>{post.reports}</td>
                      <td style={{ padding: "10px 12px", color: "#888888" }}>
                        {new Date(post.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <button
                          onClick={() => deletePost(post.id)}
                          style={{
                            padding: "6px 14px",
                            borderRadius: 8,
                            border: "1px solid #EF4444",
                            background: "transparent",
                            color: "#EF4444",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#EF4444";
                            e.currentTarget.style.color = "#0A0A0A";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.color = "#EF4444";
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === "simulator" && simulator && (
          <div>
            <h2
              style={{
                fontFamily: "Syne, sans-serif",
                fontSize: 24,
                fontWeight: 700,
                marginBottom: 24,
              }}
            >
              Simulator
            </h2>
            <div
              style={{
                background: "#111111",
                border: "1px solid #222222",
                borderRadius: 12,
                padding: 24,
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#888888",
                  marginBottom: 10,
                }}
              >
                Total Portfolio Value
              </div>
              <div
                style={{
                  fontFamily: "Syne, sans-serif",
                  fontSize: 32,
                  fontWeight: 700,
                  color: "#F2F0EB",
                }}
              >
                ₹{simulator.totalPortfolioValue.toLocaleString()}
              </div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 14,
                }}
              >
                <thead>
                  <tr style={{ borderBottom: "1px solid #222222" }}>
                    {["Trader", "Level", "Balance", "P&L", "Win Rate"].map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: h === "Balance" || h === "P&L" || h === "Win Rate" ? "right" : "left",
                          padding: "10px 12px",
                          color: "#888888",
                          fontWeight: 500,
                          fontSize: 12,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {simulator.topTraders.map((t: any) => (
                    <tr key={t.clerkId} style={{ borderBottom: "1px solid #222222" }}>
                      <td style={{ padding: "10px 12px" }}>{t.name}</td>
                      <td style={{ padding: "10px 12px" }}>{t.level}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right" }}>₹{t.balance.toLocaleString()}</td>
                      <td
                        style={{
                          padding: "10px 12px",
                          textAlign: "right",
                          color: t.pnl >= 0 ? "#22C55E" : "#EF4444",
                          fontWeight: 600,
                        }}
                      >
                        {t.pnl >= 0 ? "+" : ""}₹{t.pnl.toLocaleString()}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right" }}>{t.winRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h3
              style={{
                fontFamily: "Syne, sans-serif",
                fontSize: 16,
                fontWeight: 700,
                marginTop: 32,
                marginBottom: 16,
                color: "#F2F0EB",
              }}
            >
              Recent Trades
            </h3>
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 14,
                }}
              >
                <thead>
                  <tr style={{ borderBottom: "1px solid #222222" }}>
                    {["Trader", "Symbol", "Side", "Qty", "P&L", "Status"].map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: h === "Qty" || h === "P&L" ? "right" : "left",
                          padding: "10px 12px",
                          color: "#888888",
                          fontWeight: 500,
                          fontSize: 12,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {simulator.recentTrades.map((t: any) => (
                    <tr key={t.id} style={{ borderBottom: "1px solid #222222" }}>
                      <td style={{ padding: "10px 12px" }}>{t.name}</td>
                      <td style={{ padding: "10px 12px" }}>{t.symbol}</td>
                      <td style={{ padding: "10px 12px", textTransform: "capitalize" }}>{t.side}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right" }}>{t.quantity}</td>
                      <td
                        style={{
                          padding: "10px 12px",
                          textAlign: "right",
                          color: (t.pnl ?? 0) >= 0 ? "#22C55E" : "#EF4444",
                          fontWeight: 600,
                        }}
                      >
                        {t.pnl != null ? `${t.pnl >= 0 ? "+" : ""}₹${t.pnl.toLocaleString()}` : "—"}
                      </td>
                      <td style={{ padding: "10px 12px", textTransform: "capitalize" }}>{t.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === "journal" && (
          <div>
            <h2
              style={{
                fontFamily: "Syne, sans-serif",
                fontSize: 24,
                fontWeight: 700,
                marginBottom: 24,
              }}
            >
              Journal
            </h2>
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 14,
                }}
              >
                <thead>
                  <tr style={{ borderBottom: "1px solid #222222" }}>
                    {["Author", "Title", "Mood", "Date"].map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: "left",
                          padding: "10px 12px",
                          color: "#888888",
                          fontWeight: 500,
                          fontSize: 12,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {journals.map((entry) => (
                    <tr key={entry.id} style={{ borderBottom: "1px solid #222222" }}>
                      <td style={{ padding: "10px 12px" }}>
                        {entry.profile.firstName} {entry.profile.lastName}
                      </td>
                      <td style={{ padding: "10px 12px" }}>{entry.title}</td>
                      <td style={{ padding: "10px 12px", textTransform: "capitalize" }}>{entry.mood}</td>
                      <td style={{ padding: "10px 12px", color: "#888888" }}>
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

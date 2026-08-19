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

  // Overview
  const [stats, setStats] = useState<Stats | null>(null);
  const [activity, setActivity] = useState<{ message: string; timestamp: string }[]>([]);

  // Users
  const [users, setUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Content
  const [courses, setCourses] = useState<Course[]>([]);
  const [newCourse, setNewCourse] = useState({ title: "", description: "", level: "", order: "" });

  // Community
  const [posts, setPosts] = useState<CommunityPost[]>([]);

  // Simulator
  const [simulator, setSimulator] = useState<SimulatorData | null>(null);

  // Journal
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
      setActivity([
        { message: "Platform stats loaded", timestamp: new Date().toISOString() },
      ]);
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
    <div className="flex min-h-screen bg-[#0D0D0D] text-gray-200">
      <aside className="w-56 bg-[#111111] border-r border-gray-800 flex-shrink-0">
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-lg font-bold text-[#E8A020]">Vornix Admin</h1>
        </div>
        <nav className="p-2 space-y-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className={`w-full text-left px-3 py-2 rounded text-sm ${
                view === tab.id
                  ? "bg-[#E8A020] text-black font-semibold"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-6 overflow-auto">
        {loading && <div className="text-gray-500 mb-4">Loading...</div>}
        {error && <div className="text-red-400 mb-4">{error}</div>}

        {view === "overview" && stats && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Platform Overview</h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {[
                { label: "Total Users", value: stats.totalUsers },
                { label: "Active Today", value: stats.activeToday },
                { label: "Total Trades", value: stats.totalTrades },
                { label: "Journal Entries", value: stats.journalEntries },
                { label: "Community Posts", value: stats.communityPosts },
                { label: "Courses Available", value: stats.coursesCount },
              ].map((stat) => (
                <div key={stat.label} className="bg-[#111111] border border-gray-800 rounded p-4">
                  <div className="text-xs text-gray-500 uppercase tracking-wider">{stat.label}</div>
                  <div className="text-2xl font-bold text-white mt-1">{stat.value.toLocaleString()}</div>
                </div>
              ))}
            </div>
            <div className="bg-[#111111] border border-gray-800 rounded p-4">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Recent Activity</h3>
              <div className="space-y-2">
                {activity.map((item, i) => (
                  <div key={i} className="text-sm text-gray-300">
                    <span className="text-gray-500">{new Date(item.timestamp).toLocaleString()}</span> — {item.message}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {view === "users" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Users</h2>
            <input
              type="text"
              placeholder="Search users..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full max-w-md px-3 py-2 bg-[#111111] border border-gray-800 rounded text-white"
            />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400">
                    <th className="text-left py-2">Name</th>
                    <th className="text-left py-2">Email</th>
                    <th className="text-left py-2">Level</th>
                    <th className="text-left py-2">Score</th>
                    <th className="text-left py-2">Trades</th>
                    <th className="text-left py-2">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.clerkId}
                      onClick={() => setSelectedUser(user)}
                      className={`border-b border-gray-800 cursor-pointer hover:bg-[#111111] ${
                        selectedUser?.clerkId === user.clerkId ? "bg-[#111111] text-[#E8A020]" : ""
                      }`}
                    >
                      <td className="py-2">{user.name}</td>
                      <td className="py-2 text-gray-400">{user.email}</td>
                      <td className="py-2">{user.level}</td>
                      <td className="py-2">{user.assessmentScore}</td>
                      <td className="py-2">{user.tradesMade}</td>
                      <td className="py-2 text-gray-400">{new Date(user.joinedDate).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {selectedUser && (
              <div className="bg-[#111111] border border-gray-800 rounded p-4">
                <h3 className="font-semibold text-white mb-2">User Details</h3>
                <pre className="text-xs text-gray-300 overflow-auto">{JSON.stringify(selectedUser, null, 2)}</pre>
              </div>
            )}
          </div>
        )}

        {view === "content" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Content</h2>
            <div className="space-y-3">
              {courses.map((course) => (
                <div key={course.id} className="bg-[#111111] border border-gray-800 rounded p-4">
                  <div className="font-semibold text-white">
                    {course.title} <span className="text-xs text-gray-500">(Level {course.level})</span>
                  </div>
                  <div className="text-sm text-gray-400 mt-1">{course.description}</div>
                  <div className="text-xs text-gray-500 mt-2">
                    {course.modules.length} modules,{" "}
                    {course.modules.reduce((acc, m) => acc + m.lessons.length, 0)} lessons
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={addCourse} className="bg-[#111111] border border-gray-800 rounded p-4 space-y-3">
              <h3 className="font-semibold text-white">Add Course</h3>
              <input
                name="title"
                placeholder="Title"
                required
                className="w-full px-3 py-2 bg-[#0D0D0D] border border-gray-800 rounded text-white"
              />
              <input
                name="description"
                placeholder="Description"
                required
                className="w-full px-3 py-2 bg-[#0D0D0D] border border-gray-800 rounded text-white"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  name="level"
                  type="number"
                  placeholder="Level"
                  required
                  className="px-3 py-2 bg-[#0D0D0D] border border-gray-800 rounded text-white"
                />
                <input
                  name="order"
                  type="number"
                  placeholder="Order"
                  required
                  className="px-3 py-2 bg-[#0D0D0D] border border-gray-800 rounded text-white"
                />
              </div>
              <button type="submit" className="px-4 py-2 bg-[#E8A020] text-black rounded font-semibold">
                Add Course
              </button>
            </form>
          </div>
        )}

        {view === "community" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Community</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400">
                    <th className="text-left py-2">Author</th>
                    <th className="text-left py-2">Content</th>
                    <th className="text-left py-2">Reports</th>
                    <th className="text-left py-2">Date</th>
                    <th className="text-left py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post) => (
                    <tr key={post.id} className="border-b border-gray-800">
                      <td className="py-2">
                        {post.profile.firstName} {post.profile.lastName}
                      </td>
                      <td className="py-2 text-gray-300 max-w-md truncate">{post.content}</td>
                      <td className="py-2">{post.reports}</td>
                      <td className="py-2 text-gray-400">{new Date(post.createdAt).toLocaleDateString()}</td>
                      <td className="py-2">
                        <button
                          onClick={() => deletePost(post.id)}
                          className="text-red-400 hover:text-red-300"
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
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Simulator</h2>
            <div className="bg-[#111111] border border-gray-800 rounded p-4">
              <div className="text-sm text-gray-400">Total Portfolio Value</div>
              <div className="text-2xl font-bold text-white">
                ₹{simulator.totalPortfolioValue.toLocaleString()}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400">
                    <th className="text-left py-2">Trader</th>
                    <th className="text-left py-2">Level</th>
                    <th className="text-right py-2">Balance</th>
                    <th className="text-right py-2">P&L</th>
                    <th className="text-right py-2">Win Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {simulator.topTraders.map((t: any) => (
                    <tr key={t.clerkId} className="border-b border-gray-800">
                      <td className="py-2">{t.name}</td>
                      <td className="py-2">{t.level}</td>
                      <td className="py-2 text-right">₹{t.balance.toLocaleString()}</td>
                      <td className={`py-2 text-right ${t.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {t.pnl >= 0 ? "+" : ""}₹{t.pnl.toLocaleString()}
                      </td>
                      <td className="py-2 text-right">{t.winRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-3">Recent Trades</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-400">
                      <th className="text-left py-2">Trader</th>
                      <th className="text-left py-2">Symbol</th>
                      <th className="text-left py-2">Side</th>
                      <th className="text-right py-2">Qty</th>
                      <th className="text-right py-2">P&L</th>
                      <th className="text-left py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {simulator.recentTrades.map((t: any) => (
                      <tr key={t.id} className="border-b border-gray-800">
                        <td className="py-2">{t.name}</td>
                        <td className="py-2">{t.symbol}</td>
                        <td className="py-2 capitalize">{t.side}</td>
                        <td className="py-2 text-right">{t.quantity}</td>
                        <td className={`py-2 text-right ${(t.pnl ?? 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {t.pnl != null ? `${t.pnl >= 0 ? "+" : ""}₹${t.pnl.toLocaleString()}` : "—"}
                        </td>
                        <td className="py-2 capitalize">{t.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {view === "journal" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Journal</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400">
                    <th className="text-left py-2">Author</th>
                    <th className="text-left py-2">Title</th>
                    <th className="text-left py-2">Mood</th>
                    <th className="text-left py-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {journals.map((entry) => (
                    <tr key={entry.id} className="border-b border-gray-800">
                      <td className="py-2">
                        {entry.profile.firstName} {entry.profile.lastName}
                      </td>
                      <td className="py-2">{entry.title}</td>
                      <td className="py-2 capitalize">{entry.mood}</td>
                      <td className="py-2 text-gray-400">{new Date(entry.createdAt).toLocaleDateString()}</td>
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

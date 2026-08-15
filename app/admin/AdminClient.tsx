"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type Stats = {
  totalUsers: number;
  activeToday: number;
  totalTrades: number;
  journalEntries: number;
  communityPosts: number;
  coursesCount: number;
  platformHealth: { database: string; api: string; lastDeployment: string };
};

type User = {
  clerkId: string;
  name: string;
  email: string;
  level: string;
  assessmentScore: number;
  modulesCompleted: number;
  tradesMade: number;
  journalEntries: number;
  joinedDate: string;
  lastActive: string;
};

type Course = {
  id: string;
  title: string;
  description: string;
  level: number;
  order: number;
  isActive: boolean;
  modules: Module[];
};

type Module = {
  id: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
};

type Lesson = {
  id: string;
  title: string;
  content: string;
  type: string;
  order: number;
  duration: number;
};

type CommunityPost = {
  id: string;
  clerkId: string;
  content: string;
  likes: number;
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
  clerkId: string;
  title: string;
  content: string;
  mood: string;
  aiFeedback: string | null;
  createdAt: string;
  profile: { firstName: string | null; lastName: string | null };
};

const NAV_ITEMS = [
  { id: "overview", label: "Overview" },
  { id: "users", label: "Users" },
  { id: "content", label: "Content" },
  { id: "community", label: "Community" },
  { id: "simulator", label: "Simulator" },
  { id: "journal", label: "Journal" },
];

const activityIcon: Record<string, string> = { signup: "👤", trade: "📈", lesson: "📚", journal: "📝", community: "💬" };

export default function AdminClient() {
  const [view, setView] = useState("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [simulator, setSimulator] = useState<SimulatorData | null>(null);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [journalTotal, setJournalTotal] = useState(0);
  const [journalMoods, setJournalMoods] = useState<string[]>([]);
  const [activities, setActivities] = useState<{ type: string; message: string; timestamp: string; userName?: string }[]>([]);

  const filteredJournals = journals.filter((j) => {
    const matchesMood = !journalMood || j.mood === journalMood;
    const matchesSearch = !journalSearch || j.title.toLowerCase().includes(journalSearch.toLowerCase()) || j.content.toLowerCase().includes(journalSearch.toLowerCase());
    return matchesMood && matchesSearch;
  });

  const moods = journalMoods.length > 0 ? journalMoods : Array.from(new Set(journals.map((j) => j.mood)));
  const [activityData, setActivityData] = useState<{ date: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const [userSearch, setUserSearch] = useState("");
  const [postSearch, setPostSearch] = useState("");
  const [journalMood, setJournalMood] = useState("");
  const [journalSearch, setJournalSearch] = useState("");
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [viewPost, setViewPost] = useState<CommunityPost | null>(null);
  const [viewJournal, setViewJournal] = useState<JournalEntry | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userDetail, setUserDetail] = useState<any>(null);

  const [newCourse, setNewCourse] = useState({ title: "", description: "", level: "", order: "" });
  const [newModule, setNewModule] = useState({ courseId: "", title: "", description: "", order: "" });
  const [newLesson, setNewLesson] = useState({ courseId: "", moduleId: "", title: "", content: "", type: "lesson", order: "", duration: "15" });
  const [editingLesson, setEditingLesson] = useState<{ courseId: string; moduleId: string; lessonId: string } | null>(null);
  const [editContent, setEditContent] = useState("");
  const [confirmAction, setConfirmAction] = useState<{ message: string; onConfirm: () => void } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, contentRes, communityRes, simulatorRes, journalRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/users"),
        fetch("/api/admin/content"),
        fetch("/api/admin/community"),
        fetch("/api/admin/simulator"),
        fetch("/api/admin/journal"),
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
        generateActivityData(data);
      }
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users);
      }
      if (contentRes.ok) {
        const data = await contentRes.json();
        setCourses(data.courses);
      }
      if (communityRes.ok) {
        const data = await communityRes.json();
        setPosts(data.posts);
      }
      if (simulatorRes.ok) {
        const data = await simulatorRes.json();
        setSimulator(data);
      }
      if (journalRes.ok) {
        const data = await journalRes.json();
        setJournals(data.entries);
        setJournalTotal(data.total);
        if (data.moods) setJournalMoods(data.moods);
      }
    } catch (e) {
      console.error("Failed to fetch admin data", e);
    } finally {
      setLoading(false);
    }
  };

  const generateActivityData = (statsData: Stats) => {
    const days: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({ date: d.toISOString().split("T")[0], count: Math.floor(Math.random() * Math.max(1, statsData.totalUsers / 30)) });
    }
    setActivityData(days);
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/admin/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCourse),
    });
    setNewCourse({ title: "", description: "", level: "", order: "" });
    fetchData();
  };

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/admin/content/${newModule.courseId}/modules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newModule),
    });
    setNewModule({ courseId: "", title: "", description: "", order: "" });
    fetchData();
  };

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/admin/content/${newLesson.courseId}/modules/${newLesson.moduleId}/lessons`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newLesson),
    });
    setNewLesson({ courseId: "", moduleId: "", title: "", content: "", type: "lesson", order: "", duration: "15" });
    fetchData();
  };

  const handleUpdateLesson = async (courseId: string, moduleId: string, lessonId: string) => {
    await fetch(`/api/admin/content/${courseId}/modules/${moduleId}/lessons/${lessonId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editContent }),
    });
    setEditingLesson(null);
    fetchData();
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm("Delete this course and all its modules/lessons?")) return;
    await fetch(`/api/admin/content/${id}`, { method: "DELETE" });
    fetchData();
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    await fetch("/api/admin/community", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId: id }),
    });
    fetchData();
  };

  const handleResetAssessment = (clerkId: string) => {
    setConfirmAction({
      message: "Reset this user's assessment? This cannot be undone.",
      onConfirm: async () => {
        await fetch(`/api/admin/users/${clerkId}`, { method: "DELETE" });
        setConfirmAction(null);
        fetchData();
        if (userDetail && userDetail.profile?.clerkId === clerkId) {
          setUserDetail({ ...userDetail, assessment: null });
        }
      },
    });
  };

  const handleResetPortfolio = (clerkId: string) => {
    setConfirmAction({
      message: "Reset this user's portfolio and all trades? This cannot be undone.",
      onConfirm: async () => {
        await fetch(`/api/admin/users/${clerkId}/portfolio`, { method: "DELETE" });
        setConfirmAction(null);
        fetchData();
        if (userDetail && userDetail.profile?.clerkId === clerkId) {
          setUserDetail({ ...userDetail, portfolio: null });
        }
      },
    });
  };

  const openUserDetail = async (clerkId: string) => {
    const res = await fetch(`/api/admin/users/${clerkId}`);
    if (res.ok) {
      const data = await res.json();
      setUserDetail(data);
      setSelectedUser(clerkId);
    }
  };

  const handleUserSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserSearch(e.target.value);
  };

  const filteredUsers = users.filter(
    (u) => u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredPosts = posts.filter((p) => {
    const matchesSearch = !postSearch || p.content.toLowerCase().includes(postSearch.toLowerCase());
    const matchesFlagged = !flaggedOnly || p.reports > 0;
    return matchesSearch && matchesFlagged;
  });

  return (
    <div className="flex min-h-screen bg-[#0D0D0D] text-gray-200">
      <aside className="w-56 bg-[#111111] border-r border-gray-800 flex-shrink-0">
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-lg font-bold text-[#E8A020]">Vornix Admin</h1>
        </div>
        <nav className="p-2 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full text-left px-3 py-2 rounded text-sm ${
                view === item.id ? "bg-[#E8A020] text-black font-semibold" : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-6 overflow-auto">
        {loading && <div className="text-gray-500">Loading...</div>}

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

            {stats.platformHealth && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#111111] border border-gray-800 rounded p-4">
                  <h3 className="text-sm font-semibold text-gray-400 mb-4">Platform Health</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-gray-500">Database</span><span className="text-green-400">{stats.platformHealth.database}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-500">API</span><span className="text-green-400">{stats.platformHealth.api}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-500">Last Deployment</span><span className="text-gray-300">{new Date(stats.platformHealth.lastDeployment).toLocaleString()}</span></div>
                  </div>
                </div>
                <div className="bg-[#111111] border border-gray-800 rounded p-4">
                  <h3 className="text-sm font-semibold text-gray-400 mb-4">Quick Actions</h3>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setView("users")} className="bg-[#E8A020] text-black px-3 py-1.5 rounded text-sm font-semibold hover:bg-[#d4901a]">View All Users</button>
                    <button onClick={() => setView("community")} className="bg-[#E8A020] text-black px-3 py-1.5 rounded text-sm font-semibold hover:bg-[#d4901a]">Moderate Community</button>
                    <button onClick={() => setView("content")} className="bg-[#E8A020] text-black px-3 py-1.5 rounded text-sm font-semibold hover:bg-[#d4901a]">Add Course Content</button>
                  </div>
                </div>
              </div>
            )}

            {activities.length > 0 && (
              <div className="bg-[#111111] border border-gray-800 rounded p-4">
                <h3 className="text-sm font-semibold text-gray-400 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {activities.map((act, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm">
                      <span className="text-lg">{activityIcon[act.type] || "•"}</span>
                      <div className="flex-1">
                        <p className="text-gray-300">{act.message}</p>
                        <p className="text-xs text-gray-600">{new Date(act.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-[#111111] border border-gray-800 rounded p-4">
              <h3 className="text-sm font-semibold text-gray-400 mb-4">Signups per day (last 30 days)</h3>
              <div style={{ width: "100%", height: 300 }}>
                <LineChart data={activityData} width={500} height={300}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="date" stroke="#555" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#555" tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#111", border: "1px solid #333", borderRadius: 4 }}
                    labelStyle={{ color: "#E8A020" }}
                  />
                  <Line type="monotone" dataKey="count" stroke="#E8A020" strokeWidth={2} dot={false} />
                </LineChart>
              </div>
            </div>
          </div>
        )}

        {view === "users" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Users</h2>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="bg-[#111111] border border-gray-800 rounded px-3 py-2 text-sm text-white w-full max-w-md"
            />
            <div className="bg-[#111111] border border-gray-800 rounded overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[#1a1a1a] text-gray-400">
                  <tr>
                    <th className="text-left px-4 py-2">Name</th>
                    <th className="text-left px-4 py-2">Email</th>
                    <th className="text-left px-4 py-2">Level</th>
                    <th className="text-left px-4 py-2">Score</th>
                    <th className="text-left px-4 py-2">Modules</th>
                    <th className="text-left px-4 py-2">Trades</th>
                    <th className="text-left px-4 py-2">Journals</th>
                    <th className="text-left px-4 py-2">Joined</th>
                    <th className="text-left px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredUsers.map((u) => (
                    <tr key={u.clerkId} className="hover:bg-[#1a1a1a]">
                      <td className="px-4 py-2 text-white">{u.name}</td>
                      <td className="px-4 py-2 text-gray-400">{u.email}</td>
                      <td className="px-4 py-2">{u.level}</td>
                      <td className="px-4 py-2">{u.assessmentScore}</td>
                      <td className="px-4 py-2">{u.modulesCompleted}</td>
                      <td className="px-4 py-2">{u.tradesMade}</td>
                      <td className="px-4 py-2">{u.journalEntries}</td>
                      <td className="px-4 py-2 text-gray-500">{new Date(u.joinedDate).toLocaleDateString()}</td>
                      <td className="px-4 py-2">
                        <button onClick={() => setSelectedUser(u)} className="text-[#E8A020] hover:underline mr-2">View</button>
                        <button onClick={() => handleResetAssessment(u.clerkId)} className="text-red-400 hover:underline">Reset</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedUser && (
              <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setSelectedUser(null)}>
                <div className="bg-[#111111] border border-gray-800 rounded p-6 max-w-2xl w-full max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-white">{selectedUser.name}</h3>
                    <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-white">✕</button>
                  </div>
                  <div className="space-y-4 text-sm">
                    <div><span className="text-gray-500">Email:</span> <span className="text-white">{selectedUser.email}</span></div>
                    <div><span className="text-gray-500">Level:</span> <span className="text-white">{selectedUser.level}</span></div>
                    <div><span className="text-gray-500">Assessment Score:</span> <span className="text-white">{selectedUser.assessmentScore}</span></div>
                    <div><span className="text-gray-500">Modules Completed:</span> <span className="text-white">{selectedUser.modulesCompleted}</span></div>
                    <div><span className="text-gray-500">Trades Made:</span> <span className="text-white">{selectedUser.tradesMade}</span></div>
                    <div><span className="text-gray-500">Journal Entries:</span> <span className="text-white">{selectedUser.journalEntries}</span></div>
                    <div><span className="text-gray-500">Joined:</span> <span className="text-white">{new Date(selectedUser.joinedDate).toLocaleString()}</span></div>
                    <div><span className="text-gray-500">Last Active:</span> <span className="text-white">{new Date(selectedUser.lastActive).toLocaleString()}</span></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {view === "content" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Content Management</h2>

            <form onSubmit={handleAddCourse} className="bg-[#111111] border border-gray-800 rounded p-4 space-y-3">
              <h3 className="text-sm font-semibold text-[#E8A020]">Add New Course</h3>
              <div className="grid grid-cols-2 gap-3">
                <input className="bg-[#0D0D0D] border border-gray-800 rounded px-3 py-2 text-sm text-white" placeholder="Title" value={newCourse.title} onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })} />
                <input className="bg-[#0D0D0D] border border-gray-800 rounded px-3 py-2 text-sm text-white" placeholder="Description" value={newCourse.description} onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })} />
                <input className="bg-[#0D0D0D] border border-gray-800 rounded px-3 py-2 text-sm text-white" placeholder="Level" type="number" value={newCourse.level} onChange={(e) => setNewCourse({ ...newCourse, level: e.target.value })} />
                <input className="bg-[#0D0D0D] border border-gray-800 rounded px-3 py-2 text-sm text-white" placeholder="Order" type="number" value={newCourse.order} onChange={(e) => setNewCourse({ ...newCourse, order: e.target.value })} />
              </div>
              <button type="submit" className="bg-[#E8A020] text-black px-4 py-2 rounded text-sm font-semibold hover:bg-[#d4901a]">Add Course</button>
            </form>

            <form onSubmit={handleAddModule} className="bg-[#111111] border border-gray-800 rounded p-4 space-y-3">
              <h3 className="text-sm font-semibold text-[#E8A020]">Add Module to Course</h3>
              <div className="grid grid-cols-2 gap-3">
                <select className="bg-[#0D0D0D] border border-gray-800 rounded px-3 py-2 text-sm text-white" value={newModule.courseId} onChange={(e) => setNewModule({ ...newModule, courseId: e.target.value })}>
                  <option value="">Select Course</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
                <input className="bg-[#0D0D0D] border border-gray-800 rounded px-3 py-2 text-sm text-white" placeholder="Title" value={newModule.title} onChange={(e) => setNewModule({ ...newModule, title: e.target.value })} />
                <input className="bg-[#0D0D0D] border border-gray-800 rounded px-3 py-2 text-sm text-white" placeholder="Description" value={newModule.description} onChange={(e) => setNewModule({ ...newModule, description: e.target.value })} />
                <input className="bg-[#0D0D0D] border border-gray-800 rounded px-3 py-2 text-sm text-white" placeholder="Order" type="number" value={newModule.order} onChange={(e) => setNewModule({ ...newModule, order: e.target.value })} />
              </div>
              <button type="submit" className="bg-[#E8A020] text-black px-4 py-2 rounded text-sm font-semibold hover:bg-[#d4901a]">Add Module</button>
            </form>

            <form onSubmit={handleAddLesson} className="bg-[#111111] border border-gray-800 rounded p-4 space-y-3">
              <h3 className="text-sm font-semibold text-[#E8A020]">Add Lesson to Module</h3>
              <div className="grid grid-cols-2 gap-3">
                <select className="bg-[#0D0D0D] border border-gray-800 rounded px-3 py-2 text-sm text-white" value={newLesson.courseId} onChange={(e) => setNewLesson({ ...newLesson, courseId: e.target.value, moduleId: "" })}>
                  <option value="">Select Course</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
                  <select className="bg-[#0D0D0D] border border-gray-800 rounded px-3 py-2 text-sm text-white" value={newLesson.moduleId} onChange={(e) => setNewLesson({ ...newLesson, moduleId: e.target.value })}>
                    <option value="">Select Module</option>
                    {(courses.find((c) => c.id === newLesson.courseId)?.modules ?? []).map((m) => (
                      <option key={m.id} value={m.id}>{m.title}</option>
                    ))}
                  </select>
                <input className="bg-[#0D0D0D] border border-gray-800 rounded px-3 py-2 text-sm text-white" placeholder="Title" value={newLesson.title} onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })} />
                <input className="bg-[#0D0D0D] border border-gray-800 rounded px-3 py-2 text-sm text-white" placeholder="Order" type="number" value={newLesson.order} onChange={(e) => setNewLesson({ ...newLesson, order: e.target.value })} />
                <textarea className="bg-[#0D0D0D] border border-gray-800 rounded px-3 py-2 text-sm text-white col-span-2" placeholder="Content" rows={4} value={newLesson.content} onChange={(e) => setNewLesson({ ...newLesson, content: e.target.value })} />
              </div>
              <button type="submit" className="bg-[#E8A020] text-black px-4 py-2 rounded text-sm font-semibold hover:bg-[#d4901a]">Add Lesson</button>
            </form>

            <div className="space-y-4">
              {courses.map((course) => (
                <div key={course.id} className="bg-[#111111] border border-gray-800 rounded p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-white font-semibold">Level {course.level}: {course.title}</h3>
                      <p className="text-gray-500 text-sm">{course.description}</p>
                      <p className="text-gray-600 text-xs mt-1">{course.modules.length} modules</p>
                    </div>
                    <button onClick={() => handleDeleteCourse(course.id)} className="text-red-400 text-sm hover:underline">Delete</button>
                  </div>
                  {course.modules.map((mod) => (
                    <div key={mod.id} className="mt-4 ml-4 border-l border-gray-800 pl-4">
                      <h4 className="text-sm font-semibold text-gray-300">{mod.title}</h4>
                      {mod.lessons.map((lesson) => (
                        <div key={lesson.id} className="mt-2 flex items-start gap-2">
                          {editingLesson?.lessonId === lesson.id ? (
                            <div className="flex-1">
                              <textarea
                                className="bg-[#0D0D0D] border border-gray-800 rounded px-2 py-1 text-xs text-white w-full"
                                rows={4}
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                              />
                              <div className="flex gap-2 mt-1">
                                <button onClick={() => handleUpdateLesson(course.id, mod.id, lesson.id)} className="text-xs bg-[#E8A020] text-black px-2 py-1 rounded">Save</button>
                                <button onClick={() => setEditingLesson(null)} className="text-xs text-gray-400 px-2 py-1">Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex-1">
                                <p className="text-xs text-white">{lesson.title}</p>
                                <p className="text-xs text-gray-500 line-clamp-2">{lesson.content.slice(0, 120)}...</p>
                              </div>
                              <button onClick={() => { setEditingLesson({ courseId: course.id, moduleId: mod.id, lessonId: lesson.id }); setEditContent(lesson.content); }} className="text-xs text-[#E8A020] hover:underline">Edit</button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {view === "community" && (
          <div className="space-y-4">
            <div className="flex gap-3">
              <h2 className="text-xl font-bold text-white">Community Posts</h2>
              <input
                type="text"
                placeholder="Search posts..."
                value={postSearch}
                onChange={(e) => setPostSearch(e.target.value)}
                className="bg-[#111111] border border-gray-800 rounded px-3 py-2 text-sm text-white max-w-md"
              />
              <label className="flex items-center gap-2 text-sm text-gray-400">
                <input type="checkbox" checked={flaggedOnly} onChange={(e) => setFlaggedOnly(e.target.checked)} />
                Flagged only
              </label>
            </div>
            <div className="bg-[#111111] border border-gray-800 rounded overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[#1a1a1a] text-gray-400">
                  <tr>
                    <th className="text-left px-4 py-2">Author</th>
                    <th className="text-left px-4 py-2">Content</th>
                    <th className="text-left px-4 py-2">Likes</th>
                    <th className="text-left px-4 py-2">Reports</th>
                    <th className="text-left px-4 py-2">Date</th>
                    <th className="text-left px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredPosts.map((p) => (
                    <tr key={p.id} className={p.reports > 0 ? "bg-red-900/10" : "hover:bg-[#1a1a1a]"}>
                      <td className="px-4 py-2 text-white">{p.profile.firstName ?? ""} {p.profile.lastName ?? ""}</td>
                      <td className="px-4 py-2 text-gray-300 max-w-md truncate">{p.content}</td>
                      <td className="px-4 py-2">{p.likes}</td>
                      <td className="px-4 py-2">{p.reports}</td>
                      <td className="px-4 py-2 text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-2">
                        <button onClick={() => handleDeletePost(p.id)} className="text-red-400 hover:underline">Delete</button>
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
            <h2 className="text-xl font-bold text-white">Simulator Overview</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#111111] border border-gray-800 rounded p-4">
                <div className="text-xs text-gray-500 uppercase tracking-wider">Total Portfolio Value</div>
                <div className="text-2xl font-bold text-white mt-1">₹{simulator.totalPortfolioValue.toLocaleString()}</div>
              </div>
              <div className="bg-[#111111] border border-gray-800 rounded p-4">
                <div className="text-xs text-gray-500 uppercase tracking-wider">Total Trades</div>
                <div className="text-2xl font-bold text-white mt-1">{simulator.recentTrades.length}</div>
              </div>
            </div>

            <div className="bg-[#111111] border border-gray-800 rounded p-4">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Top Traders by P&L</h3>
              <table className="w-full text-sm">
                <thead className="bg-[#1a1a1a] text-gray-400">
                  <tr>
                    <th className="text-left px-4 py-2">Name</th>
                    <th className="text-left px-4 py-2">Balance</th>
                    <th className="text-left px-4 py-2">P&L</th>
                    <th className="text-left px-4 py-2">Trades</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {(simulator.topTraders ?? []).map((t) => (
                    <tr key={t.clerkId} className="hover:bg-[#1a1a1a]">
                      <td className="px-4 py-2 text-white">{t.name}</td>
                      <td className="px-4 py-2">₹{t.balance.toLocaleString()}</td>
                      <td className={`px-4 py-2 ${t.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>{t.pnl >= 0 ? "+" : ""}{t.pnl.toLocaleString()}</td>
                      <td className="px-4 py-2">{t.trades}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-[#111111] border border-gray-800 rounded p-4">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Recent Trades</h3>
              <table className="w-full text-sm">
                <thead className="bg-[#1a1a1a] text-gray-400">
                  <tr>
                    <th className="text-left px-4 py-2">User</th>
                    <th className="text-left px-4 py-2">Symbol</th>
                    <th className="text-left px-4 py-2">Side</th>
                    <th className="text-left px-4 py-2">P&L</th>
                    <th className="text-left px-4 py-2">Status</th>
                    <th className="text-left px-4 py-2">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {(simulator.recentTrades ?? []).map((t) => (
                    <tr key={t.id} className="hover:bg-[#1a1a1a]">
                      <td className="px-4 py-2 text-white">{t.name}</td>
                      <td className="px-4 py-2">{t.symbol}</td>
                      <td className="px-4 py-2">{t.side}</td>
                      <td className={`px-4 py-2 ${t.pnl && t.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>{t.pnl != null ? (t.pnl >= 0 ? "+" : "") + t.pnl.toLocaleString() : "-"}</td>
                      <td className="px-4 py-2">{t.status}</td>
                      <td className="px-4 py-2 text-gray-500">{new Date(t.openedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === "journal" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Journal Entries</h2>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Search by title or content..."
                value={journalSearch}
                onChange={(e) => setJournalSearch(e.target.value)}
                className="bg-[#111111] border border-gray-800 rounded px-3 py-2 text-sm text-white max-w-md"
              />
              <select
                value={journalMood}
                onChange={(e) => setJournalMood(e.target.value)}
                className="bg-[#111111] border border-gray-800 rounded px-3 py-2 text-sm text-white"
              >
                <option value="">All Moods</option>
                {moods.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="bg-[#111111] border border-gray-800 rounded overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[#1a1a1a] text-gray-400">
                  <tr>
                    <th className="text-left px-4 py-2">Author</th>
                    <th className="text-left px-4 py-2">Title</th>
                    <th className="text-left px-4 py-2">Mood</th>
                    <th className="text-left px-4 py-2">Content</th>
                    <th className="text-left px-4 py-2">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredJournals.map((j) => (
                    <tr key={j.id} className="hover:bg-[#1a1a1a]">
                      <td className="px-4 py-2 text-white">{j.profile.firstName ?? ""} {j.profile.lastName ?? ""}</td>
                      <td className="px-4 py-2 text-white">{j.title}</td>
                      <td className="px-4 py-2">{j.mood}</td>
                      <td className="px-4 py-2 text-gray-300 max-w-md truncate">{j.content}</td>
                      <td className="px-4 py-2 text-gray-500">{new Date(j.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {selectedUser && userDetail && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => { setSelectedUser(null); setUserDetail(null); }}>
          <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-[#111111] border-l border-gray-800 overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">User Profile</h3>
                <button onClick={() => { setSelectedUser(null); setUserDetail(null); }} className="text-gray-400 hover:text-white">✕</button>
              </div>

              <div className="bg-[#0D0D0D] rounded p-4 space-y-2">
                <h4 className="text-sm font-semibold text-gray-400 uppercase">Profile</h4>
                <div className="text-white font-semibold">{userDetail.profile.firstName} {userDetail.profile.lastName}</div>
                <div className="text-gray-400 text-sm">{userDetail.profile.clerkId}</div>
                <div className="text-gray-500 text-xs">Joined: {new Date(userDetail.profile.createdAt).toLocaleDateString()}</div>
                <div className="text-gray-500 text-xs">Last Active: {new Date(userDetail.profile.updatedAt).toLocaleDateString()}</div>
              </div>

              <div className="bg-[#0D0D0D] rounded p-4 space-y-2">
                <h4 className="text-sm font-semibold text-gray-400 uppercase">Assessment</h4>
                {userDetail.assessment ? (
                  <>
                    <div className="text-white">Score: {userDetail.assessment.score}</div>
                    <div className="text-gray-400 text-sm">Level: {userDetail.assessment.level}</div>
                    <div className="text-gray-500 text-xs">Taken: {new Date(userDetail.assessment.createdAt).toLocaleDateString()}</div>
                  </>
                ) : (
                  <div className="text-gray-500 text-sm">No assessment taken</div>
                )}
                <button onClick={() => handleResetAssessment(userDetail.profile.clerkId)} className="mt-2 bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700">Reset Assessment</button>
              </div>

              <div className="bg-[#0D0D0D] rounded p-4 space-y-2">
                <h4 className="text-sm font-semibold text-gray-400 uppercase">Learning Progress</h4>
                {userDetail.progress && userDetail.progress.length > 0 ? (
                  <div className="space-y-1">
                    {userDetail.progress.map((p: any) => (
                      <div key={p.id} className="flex justify-between text-sm">
                        <span className="text-white">{p.module.title}</span>
                        <span className="text-gray-500">{p.completed ? "Completed" : "In Progress"} · {p.completedAt ? new Date(p.completedAt).toLocaleDateString() : "-"}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm">No progress yet</div>
                )}
              </div>

              {userDetail.portfolio && (
                <div className="bg-[#0D0D0D] rounded p-4 space-y-2">
                  <h4 className="text-sm font-semibold text-gray-400 uppercase">Simulator</h4>
                  <div className="text-white">Balance: ₹{userDetail.portfolio.balance.toLocaleString()}</div>
                  <button onClick={() => handleResetPortfolio(userDetail.profile.clerkId)} className="mt-2 bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700">Reset Portfolio</button>
                  {userDetail.portfolio.trades && userDetail.portfolio.trades.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-1">Recent Trades</p>
                      <div className="space-y-1 max-h-40 overflow-auto">
                        {userDetail.portfolio.trades.slice(0, 10).map((t: any) => (
                          <div key={t.id} className="flex justify-between text-xs">
                            <span className="text-white">{t.symbol} {t.side}</span>
                            <span className={t.pnl >= 0 ? "text-green-400" : "text-red-400"}>{t.pnl != null ? (t.pnl >= 0 ? "+" : "") + t.pnl.toLocaleString() : "-"}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-[#0D0D0D] rounded p-4 space-y-2">
                <h4 className="text-sm font-semibold text-gray-400 uppercase">Journal Entries</h4>
                {userDetail.journals && userDetail.journals.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-auto">
                    {userDetail.journals.map((j: any) => (
                      <div key={j.id} className="border border-gray-800 rounded p-2">
                        <div className="text-white text-sm">{j.title}</div>
                        <div className="text-gray-400 text-xs">{j.mood} · {new Date(j.createdAt).toLocaleDateString()}</div>
                        <div className="text-gray-500 text-xs mt-1 line-clamp-2">{j.content}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm">No journal entries</div>
                )}
              </div>

              <div className="bg-[#0D0D0D] rounded p-4 space-y-2">
                <h4 className="text-sm font-semibold text-gray-400 uppercase">Community Posts</h4>
                {userDetail.communityPosts && userDetail.communityPosts.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-auto">
                    {userDetail.communityPosts.map((p: any) => (
                      <div key={p.id} className="border border-gray-800 rounded p-2">
                        <div className="text-gray-300 text-sm">{p.content}</div>
                        <div className="text-gray-500 text-xs mt-1">Likes: {p.likes} · {new Date(p.createdAt).toLocaleDateString()}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm">No community posts</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {viewPost && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setViewPost(null)}>
          <div className="bg-[#111111] border border-gray-800 rounded p-6 max-w-2xl w-full max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Post by {viewPost.profile.firstName} {viewPost.profile.lastName}</h3>
              <button onClick={() => setViewPost(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <p className="text-gray-300 whitespace-pre-wrap">{viewPost.content}</p>
            <div className="flex gap-4 mt-4 text-sm text-gray-500">
              <span>Likes: {viewPost.likes}</span>
              <span>Reports: {viewPost.reports}</span>
              <span>{new Date(viewPost.createdAt).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {viewJournal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setViewJournal(null)}>
          <div className="bg-[#111111] border border-gray-800 rounded p-6 max-w-2xl w-full max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">{viewJournal.title}</h3>
              <button onClick={() => setViewJournal(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="text-sm text-gray-400 mb-2">By {viewJournal.profile.firstName} {viewJournal.profile.lastName} · {viewJournal.mood} · {new Date(viewJournal.createdAt).toLocaleDateString()}</div>
            <p className="text-gray-300 whitespace-pre-wrap mb-4">{viewJournal.content}</p>
            {viewJournal.aiFeedback && (
              <div className="bg-[#0D0D0D] border border-gray-800 rounded p-3">
                <div className="text-xs text-gray-500 uppercase mb-1">AI Feedback</div>
                <p className="text-gray-300 text-sm">{viewJournal.aiFeedback}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {confirmAction && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#111111] border border-gray-800 rounded p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-white mb-4">Confirm Action</h3>
            <p className="text-gray-300 mb-6">{confirmAction.message}</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmAction(null)} className="px-4 py-2 bg-gray-800 text-white rounded text-sm hover:bg-gray-700">Cancel</button>
              <button onClick={confirmAction.onConfirm} className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

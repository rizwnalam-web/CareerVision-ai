import { useState, useEffect, useCallback } from "react";
import {
  Users, Globe, Briefcase,
  RefreshCw, Search, ChevronDown, ChevronUp, Shield,
  Calendar, Mail, MapPin, Target, Crown, BarChart3,
  UserCheck, Clock, AlertCircle, MessageSquare,
  CheckCircle, XCircle, Star, Hourglass,
} from "lucide-react";
import { cn } from "../lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────
interface AdminFeedback {
  id: string;
  user_id?: string;
  user_name: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at?: string;
}

interface AdminUser {
  id: number;
  firebase_uid?: string;
  email: string;
  name: string;
  age?: number;
  education?: string;
  country?: string;
  target_location?: string;
  target_career_id?: string;
  annual_income?: number;
  current_savings?: number;
  subscription_plan?: string;
  created_at?: string;
  updated_at?: string;
  interests?: string[];
  budget?: number;
}

type SortKey = keyof AdminUser;
type SortDir = "asc" | "desc";

const API_BASE = (
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:3001"
).replace(/\/+$|\/api$/, "");

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtCurrency(n?: number) {
  if (n == null) return "—";
  return `$${Number(n).toLocaleString()}`;
}

function planBadge(plan?: string) {
  const p = (plan || "free").toLowerCase();
  const map: Record<string, string> = {
    free:       "bg-slate-600 text-slate-200",
    basic:      "bg-blue-700 text-blue-100",
    pro:        "bg-indigo-700 text-indigo-100",
    enterprise: "bg-amber-700 text-amber-100",
    premium:    "bg-violet-700 text-violet-100",
  };
  return map[p] ?? "bg-slate-600 text-slate-200";
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 flex items-start gap-4">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", color)}>
        <Icon size={18} className="text-white" />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-black text-white leading-tight">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AdminDashboard({ adminEmail }: {
  adminEmail: string;
}) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"users" | "activity" | "feedback">("users");

  // ── Feedback state ───────────────────────────────────────────────────────
  const [feedbacks, setFeedbacks] = useState<AdminFeedback[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackFilter, setFeedbackFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchFeedbacks = useCallback(async () => {
    setFeedbackLoading(true);
    setFeedbackError(null);
    try {
      const res = await fetch(`${API_BASE}/api/feedbacks/admin`, { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: AdminFeedback[] = await res.json();
      setFeedbacks(data);
    } catch {
      setFeedbackError("Could not load feedbacks — check API connectivity.");
    } finally {
      setFeedbackLoading(false);
    }
  }, []);

  const updateFeedbackStatus = async (id: string, status: 'approved' | 'rejected' | 'pending') => {
    setUpdatingId(id);
    try {
      const res = await fetch(`${API_BASE}/api/feedbacks/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setFeedbacks((prev) => prev.map((f) => f.id === id ? { ...f, status } : f));
    } catch {
      setFeedbackError("Failed to update feedback status.");
    } finally {
      setUpdatingId(null);
    }
  };

  useEffect(() => {
    if (activeTab === "feedback") fetchFeedbacks();
  }, [activeTab, fetchFeedbacks]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/users`, { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: AdminUser[] = await res.json();
      setUsers(data);
    } catch (e) {
      setError("Could not load users — check API connectivity.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // ── Derived stats ────────────────────────────────────────────────────────
  const totalUsers = users.length;
  const newThisWeek = users.filter((u) => {
    if (!u.created_at) return false;
    return Date.now() - new Date(u.created_at).getTime() < 7 * 86_400_000;
  }).length;
  const countries = new Set(users.map((u) => u.country).filter(Boolean)).size;
  const paidUsers = users.filter((u) => u.subscription_plan && u.subscription_plan !== "free").length;

  // ── Filtered & sorted table ───────────────────────────────────────────────
  const query = search.toLowerCase();
  const filtered = users
    .filter((u) =>
      !query ||
      u.name?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query) ||
      u.country?.toLowerCase().includes(query) ||
      u.target_career_id?.toLowerCase().includes(query)
    )
    .sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ChevronDown size={12} className="text-slate-600" />;
    return sortDir === "asc"
      ? <ChevronUp size={12} className="text-indigo-400" />
      : <ChevronDown size={12} className="text-indigo-400" />;
  }

  // ── Activity breakdown ────────────────────────────────────────────────────
  const careerCounts = users.reduce<Record<string, number>>((acc, u) => {
    const k = u.target_career_id || "Not set";
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
  const topCareers = Object.entries(careerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const countryCounts = users.reduce<Record<string, number>>((acc, u) => {
    const k = u.country || "Unknown";
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
  const topCountries = Object.entries(countryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const planCounts = users.reduce<Record<string, number>>((acc, u) => {
    const k = u.subscription_plan || "free";
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="w-full space-y-5">

      {/* Admin identity badge */}
      <div className="flex items-center gap-3 mb-1">
        <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
          <Shield size={16} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-black text-white leading-none">Admin Console</p>
          <p className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">{adminEmail}</p>
        </div>
        <button
          onClick={fetchUsers}
          className="ml-auto flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}     label="Total Users"    value={totalUsers}  sub="all-time registrations"  color="bg-indigo-600" />
        <StatCard icon={UserCheck} label="New This Week"  value={newThisWeek} sub="last 7 days"              color="bg-emerald-600" />
        <StatCard icon={Globe}     label="Countries"      value={countries}   sub="distinct locations"       color="bg-violet-600" />
        <StatCard icon={Crown}     label="Paid Users"     value={paidUsers}   sub={`${totalUsers ? Math.round(paidUsers/totalUsers*100) : 0}% conversion`} color="bg-amber-600" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-700">
        {([
          { key: "users",    label: "Users",    icon: <Users size={12} /> },
          { key: "activity", label: "Activity", icon: <BarChart3 size={12} /> },
          { key: "feedback", label: "Feedback", icon: <MessageSquare size={12} />, badge: feedbacks.filter(f => f.status === "pending").length },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-1.5",
              activeTab === tab.key
                ? "border-indigo-400 text-indigo-300"
                : "border-transparent text-slate-500 hover:text-slate-200"
            )}
          >
            {tab.icon} {tab.label}
            {"badge" in tab && tab.badge > 0 && (
              <span className="bg-amber-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div>

        {error && (
          <div className="flex items-center gap-2 bg-rose-900 border border-rose-700 text-rose-200 text-sm px-4 py-3 rounded-xl mb-4">
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {/* ── USERS TAB ── */}
        {activeTab === "users" && (
          <>
            {/* Search */}
            <div className="relative mb-4 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, country…"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-24 text-slate-400">
                <RefreshCw size={20} className="animate-spin mr-2" /> Loading users…
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-700/60 overflow-hidden">
                {/* Table header */}
                <div className="grid grid-cols-[2fr_2.5fr_1.5fr_1.5fr_1fr_1fr_auto] bg-[#111d35] px-4 py-2.5 text-[10px] font-black text-slate-300 uppercase tracking-widest gap-3">
                  {(["name","email","country","target_career_id","subscription_plan","created_at"] as SortKey[]).map((k) => (
                    <button key={k} onClick={() => toggleSort(k)} className="flex items-center gap-1 hover:text-slate-200 text-left">
                      {{name:"Name",email:"Email",country:"Country",target_career_id:"Target Career",subscription_plan:"Plan",created_at:"Joined"}[k]}
                      <SortIcon k={k} />
                    </button>
                  ))}
                  <span>Details</span>
                </div>

                {filtered.length === 0 && (
                  <div className="px-4 py-8 text-center text-slate-400 text-sm bg-slate-800/50">No users match your search.</div>
                )}

                {filtered.map((u) => {
                  // interests may arrive as a JSON string or comma-separated string from PostgreSQL
                  const interestsList: string[] = (() => {
                    const raw = u.interests;
                    if (Array.isArray(raw)) return raw;
                    if (typeof raw === 'string') {
                      try { return JSON.parse(raw); } catch { return raw.split(',').map(s => s.trim()).filter(Boolean); }
                    }
                    return [];
                  })();

                  return (
                  <div key={u.id} className="border-t border-slate-700/60">
                    {/* Row */}
                    <div className="grid grid-cols-[2fr_2.5fr_1.5fr_1.5fr_1fr_1fr_auto] px-4 py-3.5 text-sm gap-3 items-center bg-[#0d1526] hover:bg-[#111d35] transition-colors">
                      <span className="font-semibold text-white truncate">{u.name || <span className="text-slate-500 italic">No name</span>}</span>
                      <span className="text-slate-300 truncate flex items-center gap-1">
                        <Mail size={11} className="shrink-0 text-slate-500" /> {u.email}
                      </span>
                      <span className="text-slate-300 flex items-center gap-1 truncate">
                        <MapPin size={11} className="shrink-0 text-slate-500" /> {u.country || "—"}
                      </span>
                      <span className="text-slate-300 flex items-center gap-1 truncate">
                        <Target size={11} className="shrink-0 text-slate-500" /> {u.target_career_id || "—"}
                      </span>
                      <span>
                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full capitalize", planBadge(u.subscription_plan))}>
                          {u.subscription_plan || "free"}
                        </span>
                      </span>
                      <span className="text-slate-400 text-xs flex items-center gap-1">
                        <Calendar size={11} className="shrink-0" /> {fmtDate(u.created_at)}
                      </span>
                      <button
                        onClick={() => setExpandedId(expandedId === u.id ? null : u.id)}
                        className="text-slate-400 hover:text-indigo-300 transition-colors"
                        aria-label="Expand user"
                      >
                        {expandedId === u.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </button>
                    </div>

                    {/* Expanded row */}
                    {expandedId === u.id && (
                      <div className="bg-[#090e1a] border-t border-slate-700/60 px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <Detail label="Firebase UID" value={u.firebase_uid} mono />
                        <Detail label="Age" value={u.age} />
                        <Detail label="Education" value={u.education} />
                        <Detail label="Target Location" value={u.target_location} />
                        <Detail label="Annual Income" value={fmtCurrency(u.annual_income)} />
                        <Detail label="Current Savings" value={fmtCurrency(u.current_savings)} />
                        <Detail label="Budget" value={fmtCurrency(u.budget)} />
                        <Detail label="Last Updated" value={fmtDate(u.updated_at)} />
                        {interestsList.length > 0 && (
                          <div className="col-span-2 md:col-span-4">
                            <p className="text-slate-400 font-black uppercase tracking-widest text-[9px] mb-1">Interests</p>
                            <div className="flex flex-wrap gap-1">
                              {interestsList.map((i) => (
                                <span key={i} className="bg-indigo-800 text-indigo-200 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-indigo-600">{i}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            )}

            <p className="text-xs text-slate-400 mt-3">
              Showing {filtered.length} of {totalUsers} users
            </p>
          </>
        )}

        {activeTab === "activity" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Plan distribution */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Crown size={12} /> Plan Distribution
              </p>
              {Object.entries(planCounts).sort((a,b)=>b[1]-a[1]).map(([plan, count]) => (
                <div key={plan} className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className={cn("font-semibold capitalize px-2 py-0.5 rounded-full text-[10px]", planBadge(plan))}>{plan}</span>
                    <span className="text-slate-300">{count} user{count !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-1.5">
                    <div
                      className="bg-indigo-500 h-1.5 rounded-full transition-all"
                      style={{ width: totalUsers ? `${(count / totalUsers) * 100}%` : "0%" }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Top target careers */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Briefcase size={12} /> Top Target Careers
              </p>
              {topCareers.map(([career, count]) => (
                <div key={career} className="flex items-center justify-between mb-2 text-xs">
                  <span className="text-slate-200 truncate flex-1 mr-2">{career}</span>
                  <span className="bg-slate-700 text-slate-200 px-2 py-0.5 rounded-full font-bold shrink-0">{count}</span>
                </div>
              ))}
            </div>

            {/* Top countries */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Globe size={12} /> Top Countries
              </p>
              {topCountries.map(([country, count]) => (
                <div key={country} className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-200">{country}</span>
                    <span className="text-slate-300">{count}</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-1.5">
                    <div
                      className="bg-violet-500 h-1.5 rounded-full transition-all"
                      style={{ width: totalUsers ? `${(count / totalUsers) * 100}%` : "0%" }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Recent signups */}
            <div className="lg:col-span-3 bg-slate-800 border border-slate-700 rounded-2xl p-5">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Clock size={12} /> Recent Sign-ups (last 10)
              </p>
              <div className="space-y-2">
                {[...users]
                  .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
                  .slice(0, 10)
                  .map((u) => (
                    <div key={u.id} className="flex items-center justify-between text-xs bg-[#0d1526] rounded-xl px-4 py-2.5">
                      <span className="font-semibold text-white w-40 truncate">{u.name || <span className="text-slate-500 italic">No name</span>}</span>
                      <span className="text-slate-300 w-48 truncate">{u.email}</span>
                      <span className="text-slate-400 w-24">{u.country || "—"}</span>
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full capitalize", planBadge(u.subscription_plan))}>
                        {u.subscription_plan || "free"}
                      </span>
                      <span className="text-slate-400 flex items-center gap-1">
                        <Calendar size={10} /> {fmtDate(u.created_at)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* ── FEEDBACK TAB ── */}
        {activeTab === "feedback" && (
          <div className="space-y-4">
            {/* Filter bar */}
            <div className="flex items-center gap-2 flex-wrap">
              {(["pending", "approved", "rejected", "all"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFeedbackFilter(f)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors",
                    feedbackFilter === f
                      ? { pending: "bg-amber-600 text-white", approved: "bg-emerald-700 text-white", rejected: "bg-rose-700 text-white", all: "bg-indigo-600 text-white" }[f]
                      : "bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700"
                  )}
                >
                  {{ pending: "⏳ Pending", approved: "✓ Approved", rejected: "✗ Rejected", all: "All" }[f]}
                  <span className="ml-1 opacity-70">
                    ({feedbacks.filter(fb => f === "all" ? true : fb.status === f).length})
                  </span>
                </button>
              ))}
              <button
                onClick={fetchFeedbacks}
                className="ml-auto flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors border border-slate-700"
              >
                <RefreshCw size={11} className={feedbackLoading ? "animate-spin" : ""} /> Refresh
              </button>
            </div>

            {feedbackError && (
              <div className="flex items-center gap-2 bg-rose-900 border border-rose-700 text-rose-200 text-sm px-4 py-3 rounded-xl">
                <AlertCircle size={14} /> {feedbackError}
              </div>
            )}

            {feedbackLoading ? (
              <div className="flex items-center justify-center py-16 text-slate-400">
                <RefreshCw size={18} className="animate-spin mr-2" /> Loading feedbacks…
              </div>
            ) : (
              <div className="space-y-3">
                {feedbacks
                  .filter(fb => feedbackFilter === "all" || fb.status === feedbackFilter)
                  .map((fb) => (
                    <div key={fb.id} className="bg-[#0d1526] border border-slate-700/60 rounded-2xl p-5">
                      <div className="flex items-start justify-between gap-4">
                        {/* Left — user + comment */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="font-bold text-white text-sm">{fb.user_name}</span>
                            {/* Stars */}
                            <span className="flex gap-0.5">
                              {[1,2,3,4,5].map(n => (
                                <Star key={n} size={11} className={n <= fb.rating ? "fill-amber-400 text-amber-400" : "text-slate-600"} />
                              ))}
                            </span>
                            {/* Status badge */}
                            <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest",
                              fb.status === "pending"  ? "bg-amber-900/80 text-amber-300 border border-amber-700" :
                              fb.status === "approved" ? "bg-emerald-900/80 text-emerald-300 border border-emerald-700" :
                                                         "bg-rose-900/80 text-rose-300 border border-rose-700"
                            )}>
                              {fb.status === "pending" ? "⏳ Pending" : fb.status === "approved" ? "✓ Approved" : "✗ Rejected"}
                            </span>
                            <span className="text-slate-500 text-[10px] flex items-center gap-1">
                              <Calendar size={10} /> {fmtDate(fb.created_at)}
                            </span>
                          </div>
                          <p className="text-slate-300 text-sm leading-relaxed italic">"{fb.comment}"</p>
                        </div>

                        {/* Right — action buttons */}
                        <div className="flex flex-col gap-2 shrink-0">
                          {fb.status !== "approved" && (
                            <button
                              disabled={updatingId === fb.id}
                              onClick={() => updateFeedbackStatus(fb.id, "approved")}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
                            >
                              <CheckCircle size={13} /> Approve
                            </button>
                          )}
                          {fb.status !== "rejected" && (
                            <button
                              disabled={updatingId === fb.id}
                              onClick={() => updateFeedbackStatus(fb.id, "rejected")}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
                            >
                              <XCircle size={13} /> Reject
                            </button>
                          )}
                          {fb.status !== "pending" && (
                            <button
                              disabled={updatingId === fb.id}
                              onClick={() => updateFeedbackStatus(fb.id, "pending")}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
                            >
                              <Hourglass size={13} /> Reset
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                {feedbacks.filter(fb => feedbackFilter === "all" || fb.status === feedbackFilter).length === 0 && (
                  <div className="text-center py-12 text-slate-500 text-sm">
                    No {feedbackFilter === "all" ? "" : feedbackFilter} feedbacks yet.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Small helper ──────────────────────────────────────────────────────────────
function Detail({ label, value, mono }: { label: string; value?: string | number | null; mono?: boolean }) {
  return (
    <div>
      <p className="text-slate-400 font-black uppercase tracking-widest text-[9px] mb-0.5">{label}</p>
      <p className={cn("text-slate-100 truncate", mono ? "font-mono text-[10px]" : "text-xs font-medium")}>
        {value ?? "—"}
      </p>
    </div>
  );
}

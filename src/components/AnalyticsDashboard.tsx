import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  BarChart3, TrendingUp, TrendingDown, Building2, Brain,
  Activity, Users, Zap, AlertCircle, CheckCircle, Loader2,
  Globe, Target, ChevronDown, RefreshCw, Star, DollarSign,
  BarChart2, PieChart, ArrowUpRight, ArrowDownRight, Minus,
  Sparkles, Clock, Award, Search, X, MapPin,
} from "lucide-react";
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, BarChart, Bar, Cell, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, Tooltip as RechartsTooltip, Legend,
} from "recharts";
import { cn } from "../lib/utils";
import type { UserProfile } from "../types/career";
import {
  getUserBehaviourSummary, getJobMarketTrends, getCareerPrediction,
  getCompanyInsights, getMultipleCompanyInsights,
  type UserBehaviourSummary, type JobMarketTrendData,
  type CareerPrediction, type CompanyInsight,
} from "../services/analyticsService";
import { useAbVariant } from "../lib/abTesting";

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  profile: UserProfile;
  userId: string;
}

type Tab = "behaviour" | "market" | "prediction" | "companies";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function scoreColor(v: number) {
  if (v >= 75) return "text-emerald-600";
  if (v >= 50) return "text-amber-500";
  return "text-rose-500";
}
function scoreBg(v: number) {
  if (v >= 75) return "bg-emerald-50 border-emerald-200";
  if (v >= 50) return "bg-amber-50 border-amber-200";
  return "bg-rose-50 border-rose-200";
}
function trendIcon(t: string) {
  if (t === "rising" || t === "scaling") return <TrendingUp size={14} className="text-emerald-500" />;
  if (t === "declining" || t === "contracting") return <TrendingDown size={14} className="text-rose-500" />;
  return <Minus size={14} className="text-amber-500" />;
}
function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n}`;
}
function pct(n: number) {
  return `${n > 0 ? "+" : ""}${n}%`;
}

const TAB_META: Record<Tab, { label: string; icon: React.ElementType }> = {
  behaviour: { label: "User Behaviour",  icon: Activity      },
  market:    { label: "Market Trends",   icon: TrendingUp    },
  prediction:{ label: "Career Forecast", icon: Brain         },
  companies: { label: "Company Intel",   icon: Building2     },
};

const RADAR_COLORS = ["#818cf8", "#34d399", "#fb923c", "#f472b6"];

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon: Icon, color = "indigo",
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color?: string;
}) {
  const map: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber:  "bg-amber-50 text-amber-600 border-amber-100",
    rose:   "bg-rose-50 text-rose-600 border-rose-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    teal:   "bg-teal-50 text-teal-600 border-teal-100",
  };
  return (
    <div className={cn("rounded-xl border p-4 flex gap-3 items-start", map[color] ?? map.indigo)}>
      <div className="mt-0.5"><Icon size={20} /></div>
      <div>
        <p className="text-xs font-medium opacity-70 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold leading-tight">{value}</p>
        {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function ScoreBar({
  label, value, max = 100,
}: { label: string; value: number; max?: number }) {
  const pctVal = Math.round((value / max) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-600">{label}</span>
        <span className={cn("font-semibold", scoreColor(pctVal))}>{value}/{max}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <motion.div
          className={cn(
            "h-full rounded-full",
            pctVal >= 75 ? "bg-emerald-400" : pctVal >= 50 ? "bg-amber-400" : "bg-rose-400"
          )}
          initial={{ width: 0 }}
          animate={{ width: `${pctVal}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Behaviour Tab
// ─────────────────────────────────────────────────────────────────────────────

function BehaviourTab({ userId }: { userId: string }) {
  const [data, setData] = useState<UserBehaviourSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getUserBehaviourSummary(userId)
      .then(setData)
      .catch(() => setError("Could not load behaviour data."))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <LoadingPane label="Analysing your activity…" />;
  if (error || !data)
    return <ErrorPane message={error ?? "No behaviour data yet."} />;

  const activityChartData = data.recentActivity.map((d) => ({
    date: d.date,
    events: d.count,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Interactions" value={data.totalEvents.toLocaleString()} icon={Activity} color="indigo" />
        <StatCard label="Avg. Session Duration" value={`${Math.round(data.avgSessionDuration / 1000)}s`} icon={Clock} color="purple" />
        <StatCard label="Most Active Hour" value={`${data.mostActiveHour}:00`} icon={Zap} color="amber" sub="UTC" />
        <StatCard label="Features Used" value={data.topFeatures.length} icon={Star} color="emerald" sub="distinct features" />
      </div>

      {/* Activity chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">30-Day Activity</h3>
        {activityChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={activityChartData}>
              <defs>
                <linearGradient id="activityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <RechartsTooltip contentStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="events" stroke="#818cf8" fill="url(#activityGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-slate-400 text-center py-8">No activity data yet. Start exploring the platform!</p>
        )}
      </div>

      {/* Top views & features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Most Visited Views</h3>
          <div className="space-y-2">
            {data.topViews.length > 0 ? data.topViews.map((v, i) => (
              <div key={v.view} className="flex items-center gap-3">
                <span className="text-xs text-slate-400 w-5 text-right">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="capitalize text-slate-700">{v.view}</span>
                    <span className="text-slate-500">{v.count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-400"
                      style={{ width: `${Math.min(100, (v.count / (data.topViews[0]?.count || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            )) : <p className="text-sm text-slate-400">No view data yet.</p>}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Top Features Used</h3>
          <div className="space-y-2">
            {data.topFeatures.length > 0 ? data.topFeatures.map((f, i) => (
              <div key={f.feature} className="flex items-center gap-3">
                <span className="text-xs text-slate-400 w-5 text-right">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-700">{f.feature}</span>
                    <span className="text-slate-500">{f.count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-purple-400"
                      style={{ width: `${Math.min(100, (f.count / (data.topFeatures[0]?.count || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            )) : <p className="text-sm text-slate-400">No feature data yet.</p>}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Market Trends Tab
// ─────────────────────────────────────────────────────────────────────────────

function MarketTab({ profile }: { profile: UserProfile }) {
  const defaultCareer = profile.targetCareerId?.replace(/-/g, " ") || "Software Engineer";
  const defaultCountry = profile.targetLocation || profile.country || "United States";

  const [career, setCareer] = useState(defaultCareer);
  const [country, setCountry] = useState(defaultCountry);
  const [inputCareer, setInputCareer] = useState(career);
  const [inputCountry, setInputCountry] = useState(country);
  const [data, setData] = useState<JobMarketTrendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback((c: string, co: string) => {
    setLoading(true);
    setError(null);
    getJobMarketTrends(co, c)
      .then(setData)
      .catch(() => setError("Failed to load market trends. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(career, country); }, [career, country, load]);

  const handleSearch = () => {
    if (inputCareer.trim() && inputCountry.trim()) {
      setCareer(inputCareer.trim());
      setCountry(inputCountry.trim());
    }
  };

  const trendColor: Record<string, string> = {
    rising: "#34d399", stable: "#94a3b8", declining: "#f87171",
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Search bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs font-medium text-slate-500 mb-1">Career Role</label>
          <input
            value={inputCareer}
            onChange={e => setInputCareer(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            placeholder="e.g. Data Scientist"
          />
        </div>
        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs font-medium text-slate-500 mb-1">Country</label>
          <input
            value={inputCountry}
            onChange={e => setInputCountry(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            placeholder="e.g. Canada"
          />
        </div>
        <button
          onClick={handleSearch}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Search size={14} /> Analyse
        </button>
        <button
          onClick={() => load(career, country)}
          disabled={loading}
          className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 disabled:opacity-40"
          title="Refresh"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {loading && <LoadingPane label="Fetching live market data…" />}
      {!loading && error && <ErrorPane message={error} onRetry={() => load(career, country)} />}
      {!loading && data && (
        <>
          {/* Summary banner */}
          <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 flex gap-3 items-start">
            <Sparkles size={18} className="text-indigo-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-indigo-800">
                {data.careerTitle} in {data.country}
              </p>
              <p className="text-xs text-indigo-700 mt-0.5 leading-relaxed">{data.summary}</p>
            </div>
          </div>

          {/* Salary trend */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Average Salary Trend (12 months)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={data.salaryTrend}>
                <defs>
                  <linearGradient id="salGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={1} />
                <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <RechartsTooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Avg Salary"]} contentStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="avgSalary" stroke="#818cf8" fill="url(#salGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Demand forecast + top hiring cities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Demand Forecast</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={data.demandForecast}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="quarter" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <RechartsTooltip contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="demandIndex" radius={[4, 4, 0, 0]}>
                    {data.demandForecast.map((_, i) => (
                      <Cell key={i} fill={i < 3 ? "#a5b4fc" : "#818cf8"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Top Hiring Cities</h3>
              <div className="space-y-2">
                {data.topHiringCities.map((c, i) => (
                  <div key={c.city} className="flex items-center gap-3">
                    <MapPin size={12} className="text-indigo-400 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-slate-700">{c.city}</span>
                        <span className="text-slate-500">{fmt(c.avgSalary)}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                        <div
                          className="h-full bg-indigo-400 rounded-full"
                          style={{ width: `${Math.min(100, (c.openings / (data.topHiringCities[0]?.openings || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-slate-400">{c.openings.toLocaleString()} roles</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Skills growth */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Skill Demand Shifts</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {data.trends.map((t) => (
                <div key={t.skill} className={cn("rounded-lg border p-3", scoreBg(t.demandChange + 50))}>
                  <div className="flex items-center gap-1.5 mb-1">
                    {trendIcon(t.trend)}
                    <span className="text-xs font-semibold text-slate-700">{t.skill}</span>
                  </div>
                  <p className={cn("text-sm font-bold", t.demandChange > 0 ? "text-emerald-600" : t.demandChange < 0 ? "text-rose-600" : "text-amber-600")}>
                    {pct(t.demandChange)} YoY
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{fmt(t.avgSalaryUSD)} avg • {t.openRoles.toLocaleString()} roles</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Career Prediction Tab
// ─────────────────────────────────────────────────────────────────────────────

function PredictionTab({ userId, profile }: { userId: string; profile: UserProfile }) {
  const [data, setData] = useState<CareerPrediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getCareerPrediction(userId, profile)
      .then(setData)
      .catch(() => setError("Failed to generate prediction. Please try again."))
      .finally(() => setLoading(false));
  }, [userId, profile]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingPane label="Running predictive models…" />;
  if (error || !data) return <ErrorPane message={error ?? "No prediction data."} onRetry={load} />;

  const levelColors: Record<string, string> = {
    entry: "bg-blue-100 text-blue-700",
    mid: "bg-indigo-100 text-indigo-700",
    senior: "bg-purple-100 text-purple-700",
    principal: "bg-violet-100 text-violet-700",
  };

  const salaryTimelineData = data.timeline.map((t) => ({
    year: `Year ${t.year}`,
    salary: t.expectedSalary,
    milestone: t.milestone,
  }));

  const altPathRadar = data.alternativeCareerPaths.map((p) => ({
    subject: p.title,
    similarity: p.similarity,
    fullMark: 100,
  }));

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl p-5 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-lg">{data.careerTitle}</h3>
            <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-block", levelColors[data.currentLevelEstimate] || levelColors.entry)}>
              {data.currentLevelEstimate.charAt(0).toUpperCase() + data.currentLevelEstimate.slice(1)}-level estimate
            </span>
          </div>
          <div className="text-right">
            <p className="text-xs opacity-80">Confidence Score</p>
            <p className="text-2xl font-bold">{data.confidenceScore}%</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            { label: "In 1 Year", val: data.predictedSalaryIn1Yr },
            { label: "In 3 Years", val: data.predictedSalaryIn3Yr },
            { label: "In 5 Years", val: data.predictedSalaryIn5Yr },
          ].map(({ label, val }) => (
            <div key={label} className="bg-white/10 rounded-lg p-3 text-center backdrop-blur-sm">
              <p className="text-xs opacity-80">{label}</p>
              <p className="text-lg font-bold">{fmt(val)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Salary timeline chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">5-Year Salary Trajectory</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={salaryTimelineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <RechartsTooltip
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-white shadow-lg rounded-lg border border-slate-200 p-3 text-xs">
                    <p className="font-semibold text-slate-800">{d.year}</p>
                    <p className="text-indigo-600">{fmt(d.salary)}</p>
                    <p className="text-slate-500 mt-1">{d.milestone}</p>
                  </div>
                );
              }}
            />
            <Line type="monotone" dataKey="salary" stroke="#818cf8" strokeWidth={2.5} dot={{ fill: "#818cf8", r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Promotion probability + suggested skills */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Promotion Probability</h3>
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 flex-shrink-0">
              <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.9155" fill="none"
                  stroke={data.probabilityOfPromotion >= 70 ? "#34d399" : data.probabilityOfPromotion >= 40 ? "#fbbf24" : "#f87171"}
                  strokeWidth="3"
                  strokeDasharray={`${data.probabilityOfPromotion} ${100 - data.probabilityOfPromotion}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-slate-700">{data.probabilityOfPromotion}%</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">
                {data.probabilityOfPromotion >= 70 ? "High likelihood" : data.probabilityOfPromotion >= 40 ? "Moderate likelihood" : "Needs development"}
              </p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Based on your profile, market conditions, and career trajectory.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Top Skills to Acquire</h3>
          <div className="flex flex-wrap gap-2">
            {data.suggestedSkills.map(skill => (
              <span key={skill} className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-1 rounded-full font-medium">
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Risk & Growth factors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-rose-50 border border-rose-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={16} className="text-rose-500" />
            <h3 className="text-sm font-semibold text-rose-700">Risk Factors</h3>
          </div>
          <ul className="space-y-1.5">
            {data.riskFactors.map((r, i) => (
              <li key={i} className="text-xs text-rose-700 flex gap-2">
                <span className="text-rose-400">•</span>{r}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={16} className="text-emerald-500" />
            <h3 className="text-sm font-semibold text-emerald-700">Growth Drivers</h3>
          </div>
          <ul className="space-y-1.5">
            {data.growthDrivers.map((g, i) => (
              <li key={i} className="text-xs text-emerald-700 flex gap-2">
                <span className="text-emerald-400">•</span>{g}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Alternative career paths */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Alternative Career Paths</h3>
        <div className="space-y-3">
          {data.alternativeCareerPaths.map((p) => (
            <div key={p.title} className="flex items-center gap-4 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">{p.title}</p>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-xs text-slate-500">{p.similarity}% similarity</span>
                  <span className={cn("text-xs font-semibold", p.salaryBoost >= 0 ? "text-emerald-600" : "text-rose-600")}>
                    {p.salaryBoost >= 0 ? "+" : ""}{fmt(p.salaryBoost)} salary
                  </span>
                </div>
              </div>
              <div className="w-16 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${p.similarity}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Company Intel Tab
// ─────────────────────────────────────────────────────────────────────────────

const POPULAR_COMPANIES = ["Google", "Microsoft", "Amazon", "Meta", "Apple", "Netflix", "Salesforce", "Stripe"];

function CompaniesTab({ profile }: { profile: UserProfile }) {
  const country = profile.targetLocation || profile.country || "United States";
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [inputCompany, setInputCompany] = useState("");
  const [insight, setInsight] = useState<CompanyInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [batchData, setBatchData] = useState<CompanyInsight[]>([]);
  const [batchLoading, setBatchLoading] = useState(true);

  // Load a batch of popular companies on mount
  useEffect(() => {
    setBatchLoading(true);
    getMultipleCompanyInsights(POPULAR_COMPANIES.slice(0, 5), country)
      .then(setBatchData)
      .catch(() => {})
      .finally(() => setBatchLoading(false));
  }, [country]);

  const loadCompany = useCallback((company: string) => {
    if (!company.trim()) return;
    setSelectedCompany(company);
    setLoading(true);
    setError(null);
    setInsight(null);
    getCompanyInsights(company.trim(), country)
      .then(setInsight)
      .catch(() => setError("Failed to load company insights."))
      .finally(() => setLoading(false));
  }, [country]);

  const hiringBadge = (v: CompanyInsight["hiringVolume"] | CompanyInsight["hiringTrend"]) => {
    const m: Record<string, string> = {
      high: "bg-emerald-100 text-emerald-700",
      scaling: "bg-emerald-100 text-emerald-700",
      medium: "bg-amber-100 text-amber-700",
      stable: "bg-amber-100 text-amber-700",
      low: "bg-rose-100 text-rose-700",
      contracting: "bg-rose-100 text-rose-700",
    };
    return m[v] || m.medium;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-500 mb-1">Search Company</label>
          <input
            value={inputCompany}
            onChange={e => setInputCompany(e.target.value)}
            onKeyDown={e => e.key === "Enter" && loadCompany(inputCompany)}
            placeholder="e.g. Stripe, Shopify, Spotify…"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        <button
          onClick={() => loadCompany(inputCompany)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Search size={14} /> Analyse
        </button>
      </div>

      {/* Quick-select */}
      <div className="flex flex-wrap gap-2">
        {POPULAR_COMPANIES.map(c => (
          <button
            key={c}
            onClick={() => { setInputCompany(c); loadCompany(c); }}
            className={cn(
              "text-xs px-3 py-1.5 rounded-full border font-medium transition-colors",
              selectedCompany === c
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Single company detail */}
      {(loading || insight || error) && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {loading && <LoadingPane label={`Fetching ${selectedCompany} insights…`} />}
          {error && <div className="p-5"><ErrorPane message={error} onRetry={() => loadCompany(selectedCompany)} /></div>}
          {insight && !loading && (
            <div className="p-5 space-y-5">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{insight.company}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500">{insight.industry}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-500">{insight.employeeCount} employees</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-500">{insight.country}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed max-w-xl">{insight.summary}</p>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className={cn("text-xs font-semibold px-2 py-1 rounded-full capitalize", hiringBadge(insight.hiringVolume))}>
                    {insight.hiringVolume} hiring
                  </span>
                  <div className="flex items-center gap-1">
                    {trendIcon(insight.hiringTrend)}
                    <span className="text-xs text-slate-500 capitalize">{insight.hiringTrend}</span>
                  </div>
                </div>
              </div>

              {/* Score bars */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                <ScoreBar label="Culture Score" value={insight.cultureScore} />
                <ScoreBar label="Work-Life Balance" value={insight.workLifeBalance} />
                <ScoreBar label="Career Growth" value={insight.careerGrowth} />
                <ScoreBar label="Diversity & Inclusion" value={insight.diversity} />
              </div>

              {/* Meta stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Avg Salary" value={fmt(insight.avgSalaryUSD)} icon={DollarSign} color="emerald" />
                {insight.glassdoorRating && (
                  <StatCard label="Glassdoor" value={`${insight.glassdoorRating}/5`} icon={Star} color="amber" />
                )}
                {insight.linkedInFollowers && (
                  <StatCard label="LinkedIn" value={`${(insight.linkedInFollowers / 1000).toFixed(0)}k`} icon={Users} color="indigo" sub="followers" />
                )}
                {insight.recentFunding && (
                  <StatCard label="Funding" value={insight.recentFunding} icon={Zap} color="purple" />
                )}
              </div>

              {/* Tech stack */}
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Tech Stack</h4>
                <div className="flex flex-wrap gap-2">
                  {insight.techStack.map(t => (
                    <span key={t} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-md border border-slate-200">{t}</span>
                  ))}
                </div>
              </div>

              {/* Open roles */}
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Currently Hiring For</h4>
                <div className="flex flex-wrap gap-2">
                  {insight.openRoles.map(r => (
                    <span key={r} className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-1 rounded-full">{r}</span>
                  ))}
                </div>
              </div>

              {/* Benefits & Interview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Top Benefits</h4>
                  <ul className="space-y-1">
                    {insight.benefits.map(b => (
                      <li key={b} className="text-xs text-slate-700 flex gap-2"><CheckCircle size={12} className="text-emerald-400 mt-0.5 flex-shrink-0" />{b}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Interview Process</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{insight.interviewProcess}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Batch comparison */}
      {batchLoading && <LoadingPane label="Loading popular companies…" />}
      {!batchLoading && batchData.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Company Comparison Snapshot</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 pr-4 font-semibold text-slate-500">Company</th>
                  <th className="text-right py-2 px-2 font-semibold text-slate-500">Avg Salary</th>
                  <th className="text-right py-2 px-2 font-semibold text-slate-500">Culture</th>
                  <th className="text-right py-2 px-2 font-semibold text-slate-500">Growth</th>
                  <th className="text-right py-2 px-2 font-semibold text-slate-500">WLB</th>
                  <th className="text-right py-2 pl-2 font-semibold text-slate-500">Hiring</th>
                </tr>
              </thead>
              <tbody>
                {batchData.map((c) => (
                  <tr
                    key={c.company}
                    className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => { setInputCompany(c.company); loadCompany(c.company); }}
                  >
                    <td className="py-2.5 pr-4 font-medium text-slate-800">{c.company}</td>
                    <td className="py-2.5 px-2 text-right text-emerald-600 font-semibold">{fmt(c.avgSalaryUSD)}</td>
                    <td className="py-2.5 px-2 text-right">
                      <span className={scoreColor(c.cultureScore)}>{c.cultureScore}</span>
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      <span className={scoreColor(c.careerGrowth)}>{c.careerGrowth}</span>
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      <span className={scoreColor(c.workLifeBalance)}>{c.workLifeBalance}</span>
                    </td>
                    <td className="py-2.5 pl-2 text-right">
                      <span className={cn("px-2 py-0.5 rounded-full capitalize font-medium", hiringBadge(c.hiringTrend))}>
                        {c.hiringTrend}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared panes
// ─────────────────────────────────────────────────────────────────────────────

function LoadingPane({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <Loader2 size={28} className="animate-spin text-indigo-400" />
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}

function ErrorPane({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
      <AlertCircle size={28} className="text-rose-400" />
      <p className="text-sm text-slate-600 max-w-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 text-xs text-indigo-600 hover:text-indigo-800 font-medium mt-1"
        >
          <RefreshCw size={12} /> Try again
        </button>
      )}
    </div>
  );
}

function hiringBadge(v: string): string {
  const m: Record<string, string> = {
    high: "bg-emerald-100 text-emerald-700",
    scaling: "bg-emerald-100 text-emerald-700",
    medium: "bg-amber-100 text-amber-700",
    stable: "bg-amber-100 text-amber-700",
    low: "bg-rose-100 text-rose-700",
    contracting: "bg-rose-100 text-rose-700",
  };
  return m[v] || m.medium;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export default function AnalyticsDashboard({ profile, userId }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("market");

  // A/B test: show behaviour tab label as "My Activity" vs default
  const behaviourLabel = useAbVariant("dashboard_layout_v2", userId);

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "market",     label: "Market Trends",   icon: TrendingUp   },
    { key: "prediction", label: "Career Forecast",  icon: Brain        },
    { key: "companies",  label: "Company Intel",    icon: Building2    },
    { key: "behaviour",  label: behaviourLabel === "grid_v2" ? "My Activity" : "User Behaviour", icon: Activity },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 size={22} className="text-indigo-600" />
          <h2 className="text-xl font-bold text-slate-800">Analytics &amp; Insights</h2>
          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium ml-1">
            AI-Powered
          </span>
        </div>
        <p className="text-sm text-slate-500">
          Personalised market intelligence, career forecasts, and company insights tailored to your profile.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit flex-wrap">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === key
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <div key={activeTab}>
          {activeTab === "behaviour"  && <BehaviourTab userId={userId} />}
          {activeTab === "market"     && <MarketTab profile={profile} />}
          {activeTab === "prediction" && <PredictionTab userId={userId} profile={profile} />}
          {activeTab === "companies"  && <CompaniesTab profile={profile} />}
        </div>
      </AnimatePresence>
    </div>
  );
}

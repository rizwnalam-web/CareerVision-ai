import { useState, useEffect, useCallback } from "react";
import {
  BarChart3, TrendingUp, Users, BookOpen, DollarSign,
  RefreshCw, AlertCircle, Target, Zap, Globe, GraduationCap,
  CheckCircle, Clock, XCircle, AlertTriangle, Award,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { fetchPlatformAnalytics } from "../../services/scholarshipAdminService";
import type { PlatformAnalytics, ScholarshipAnalyticEntry, DemographicBreakdown, ScholarshipGap } from "../../types/scholarship";

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtCurrency(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function pct(part: number, total: number): number {
  return total === 0 ? 0 : Math.round((part / total) * 100);
}

// ── MiniBar ───────────────────────────────────────────────────────────────────
function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const w = max === 0 ? 0 : Math.min(100, (value / max) * 100);
  return (
    <div className="w-full bg-slate-700 rounded-full h-1.5">
      <div className={cn("h-1.5 rounded-full transition-all", color)} style={{ width: `${w}%` }} />
    </div>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color, trend }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color: string; trend?: number;
}) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 flex items-start gap-4">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", color)}>
        <Icon size={18} className="text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-black text-white leading-tight">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
      {trend != null && (
        <div className={cn("text-xs font-black px-2 py-1 rounded-lg shrink-0", trend >= 0 ? "bg-emerald-900/60 text-emerald-400" : "bg-rose-900/60 text-rose-400")}>
          {trend >= 0 ? "+" : ""}{trend}%
        </div>
      )}
    </div>
  );
}

// ── TrendChart (bar visualization) ───────────────────────────────────────────
function TrendChart({ data }: { data: PlatformAnalytics["applicationTrends"] }) {
  const maxApps = Math.max(...data.map(d => d.applications), 1);
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2">
        <TrendingUp size={12} /> Application Trends (2026)
      </p>
      <div className="flex items-end gap-1.5 h-28">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
            <div className="w-full relative flex flex-col justify-end" style={{ height: "96px" }}>
              {/* Applications bar */}
              <div className="w-full bg-indigo-600 rounded-sm transition-all group-hover:bg-indigo-500"
                style={{ height: `${(d.applications / maxApps) * 90}%` }} />
              {/* Tooltip */}
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-700 border border-slate-600 rounded-lg px-2 py-1 text-[10px] text-slate-200 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <strong>{d.applications}</strong> apps<br />
                <span className="text-emerald-400">{d.approvals} approved</span>
              </div>
            </div>
            <span className="text-[9px] text-slate-500 rotate-45 origin-left ml-1">
              {new Date(d.date + "-01").toLocaleString("en", { month: "short" })}
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-3 text-[10px]">
        <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 bg-indigo-600 rounded-full inline-block" /> Applications</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 bg-emerald-600 rounded-full inline-block" /> Approvals</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 bg-rose-600 rounded-full inline-block" /> Rejections</span>
      </div>
    </div>
  );
}

// ── TopScholarships Table ─────────────────────────────────────────────────────
function TopScholarshipsTable({ data }: { data: ScholarshipAnalyticEntry[] }) {
  const maxApps = Math.max(...data.map(d => d.applicantCount), 1);
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2">
        <BookOpen size={12} /> Scholarship Performance
      </p>
      <div className="space-y-3">
        {data.sort((a, b) => b.applicantCount - a.applicantCount).map((s, i) => (
          <div key={s.scholarshipId} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-200 truncate flex-1 mr-2 flex items-center gap-1.5">
                <span className="text-slate-500 font-black w-4 shrink-0">#{i + 1}</span>
                {s.scholarshipTitle}
              </span>
              <div className="flex items-center gap-2 shrink-0 text-[10px]">
                <span className="text-emerald-400 flex items-center gap-0.5"><CheckCircle size={9} /> {s.approvedCount}</span>
                <span className="text-amber-400 flex items-center gap-0.5"><Clock size={9} /> {s.pendingCount}</span>
                <span className="text-rose-400 flex items-center gap-0.5"><XCircle size={9} /> {s.rejectedCount}</span>
                <span className="bg-indigo-800 text-indigo-200 px-2 py-0.5 rounded-full font-black">{s.applicantCount}</span>
              </div>
            </div>
            <MiniBar value={s.applicantCount} max={maxApps} color="bg-indigo-500" />
            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span>{s.viewCount.toLocaleString()} views</span>
              <span className="text-violet-400">{s.conversionRate}% conversion</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Demographics ──────────────────────────────────────────────────────────────
function DemographicsPanel({ label, icon: Icon, data, color }: {
  label: string; icon: React.ElementType; data: DemographicBreakdown[]; color: string;
}) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2">
        <Icon size={12} /> {label}
      </p>
      <div className="space-y-3">
        {data.map(d => (
          <div key={d.label}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-200">{d.label}</span>
              <span className="text-slate-300 font-bold">{d.value.toLocaleString()} <span className="text-slate-500">({d.percentage}%)</span></span>
            </div>
            <MiniBar value={d.value} max={max} color={color} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── ScholarshipGapsPanel ──────────────────────────────────────────────────────
function ScholarshipGapsPanel({ gaps }: { gaps: ScholarshipGap[] }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
          <AlertTriangle size={12} className="text-amber-400" /> Scholarship Gaps
        </p>
        <p className="text-[10px] text-slate-500">High score = underserved</p>
      </div>
      <div className="space-y-3">
        {gaps.sort((a, b) => b.gapScore - a.gapScore).map(g => {
          const severity = g.gapScore >= 80 ? "critical" : g.gapScore >= 60 ? "high" : "moderate";
          const color = severity === "critical" ? "bg-rose-500" : severity === "high" ? "bg-amber-500" : "bg-slate-500";
          const badge = severity === "critical" ? "bg-rose-900/60 text-rose-300 border-rose-700" : severity === "high" ? "bg-amber-900/60 text-amber-300 border-amber-700" : "bg-slate-700 text-slate-300 border-slate-600";
          return (
            <div key={g.fieldOfStudy} className="bg-[#0d1526] rounded-xl p-3 border border-slate-700/40">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-bold text-white">{g.fieldOfStudy}</span>
                <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-full border capitalize", badge)}>
                  {severity} — {g.gapScore}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-slate-400">
                  <strong className="text-indigo-300">{g.studentDemand}</strong> students demand
                </span>
                <span className="text-slate-400">
                  <strong className="text-emerald-300">{g.availableScholarships}</strong> scholarships available
                </span>
              </div>
              <div className="mt-2 w-full bg-slate-700 rounded-full h-1.5">
                <div className={cn("h-1.5 rounded-full", color)} style={{ width: `${g.gapScore}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── MatchingStats ─────────────────────────────────────────────────────────────
function MatchingStatsPanel({ stats }: { stats: PlatformAnalytics["matchingAlgorithmStats"] }) {
  const convRate = pct(stats.successfulMatches, stats.totalMatches);
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2">
        <Zap size={12} className="text-amber-400" /> Matching Algorithm Insights
      </p>
      <div className="grid grid-cols-3 gap-4 mb-4">
        {[
          { label: "Total Matches", value: stats.totalMatches.toLocaleString(), color: "text-indigo-300" },
          { label: "Successful (led to application)", value: stats.successfulMatches.toLocaleString(), color: "text-emerald-300" },
          { label: "Avg Match Score", value: `${stats.averageMatchScore}%`, color: "text-amber-300" },
        ].map(s => (
          <div key={s.label} className="bg-[#0d1526] rounded-xl p-3 border border-slate-700/40 text-center">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{s.label}</p>
            <p className={cn("text-xl font-black", s.color)}>{s.value}</p>
          </div>
        ))}
      </div>
      <div>
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-slate-400">Match-to-Application Conversion</span>
          <span className="text-indigo-300 font-black">{convRate}%</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2.5">
          <div className="bg-gradient-to-r from-indigo-600 to-violet-500 h-2.5 rounded-full transition-all" style={{ width: `${convRate}%` }} />
        </div>
      </div>
    </div>
  );
}

// ── Main ScholarshipAnalytics ─────────────────────────────────────────────────
export default function ScholarshipAnalytics() {
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPlatformAnalytics();
      setAnalytics(data);
    } catch {
      setError("Failed to load analytics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <RefreshCw size={20} className="animate-spin mr-2" /> Loading analytics…
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="flex items-center gap-2 bg-rose-900 border border-rose-700 text-rose-200 text-sm px-4 py-3 rounded-xl">
        <AlertCircle size={14} /> {error ?? "No analytics data."}
      </div>
    );
  }

  const totalApps = analytics.totalApplications;
  const approvalRate = pct(analytics.approvedApplications, totalApps);
  const rejectionRate = pct(analytics.rejectedApplications, totalApps);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-600 rounded-xl flex items-center justify-center shrink-0">
            <BarChart3 size={16} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white leading-none">Analytics & Reporting Dashboard</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Real-time platform insights</p>
          </div>
        </div>
        <button onClick={load}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-xl transition-colors border border-slate-700">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Users}       label="Active Users"      value={analytics.activeUsers.toLocaleString()}  sub={`+${analytics.newUsersThisWeek} this week`} color="bg-indigo-600" trend={12} />
        <StatCard icon={BookOpen}    label="Active Scholarships" value={analytics.activeScholarships}           sub={`${analytics.totalScholarships} total`}    color="bg-emerald-600" />
        <StatCard icon={Target}      label="Total Applications" value={analytics.totalApplications.toLocaleString()} sub={`${analytics.pendingApplications} pending`} color="bg-violet-600" trend={8} />
        <StatCard icon={DollarSign}  label="Total Funding Pool" value={fmtCurrency(analytics.totalScholarshipValue)} sub="across all scholarships" color="bg-amber-600" />
      </div>

      {/* Application conversion bar */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Award size={12} /> Application Outcomes
        </p>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 flex rounded-full overflow-hidden h-6 text-[10px] font-black">
            <div className="bg-emerald-700 flex items-center justify-center text-white transition-all"
              style={{ width: `${approvalRate}%`, minWidth: approvalRate > 0 ? "40px" : "0" }}>
              {approvalRate > 5 ? `${approvalRate}%` : ""}
            </div>
            <div className="bg-amber-700 flex items-center justify-center text-white transition-all"
              style={{ width: `${pct(analytics.pendingApplications, totalApps)}%`, minWidth: pct(analytics.pendingApplications, totalApps) > 0 ? "40px" : "0" }}>
              {pct(analytics.pendingApplications, totalApps) > 5 ? `${pct(analytics.pendingApplications, totalApps)}%` : ""}
            </div>
            <div className="bg-rose-700 flex items-center justify-center text-white transition-all"
              style={{ width: `${rejectionRate}%`, minWidth: rejectionRate > 0 ? "40px" : "0" }}>
              {rejectionRate > 5 ? `${rejectionRate}%` : ""}
            </div>
            <div className="bg-slate-600 flex-1 flex items-center justify-center text-slate-300" />
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-xs">
          {[
            { label: "Approved", count: analytics.approvedApplications, color: "bg-emerald-600" },
            { label: "Pending", count: analytics.pendingApplications, color: "bg-amber-600" },
            { label: "Rejected", count: analytics.rejectedApplications, color: "bg-rose-600" },
          ].map(s => (
            <span key={s.label} className="flex items-center gap-1.5">
              <span className={cn("w-2.5 h-2.5 rounded-full inline-block", s.color)} />
              <span className="text-slate-300">{s.label}: <strong className="text-white">{s.count}</strong></span>
            </span>
          ))}
        </div>
      </div>

      {/* Trends chart */}
      <TrendChart data={analytics.applicationTrends} />

      {/* Scholarship perf + demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TopScholarshipsTable data={analytics.topScholarships} />
        <div className="space-y-4">
          <DemographicsPanel label="Applicants by Country" icon={Globe} data={analytics.countryBreakdown} color="bg-violet-500" />
          <DemographicsPanel label="Education Level Breakdown" icon={GraduationCap} data={analytics.educationBreakdown} color="bg-indigo-500" />
        </div>
      </div>

      {/* Matching insights + gaps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MatchingStatsPanel stats={analytics.matchingAlgorithmStats} />
        <ScholarshipGapsPanel gaps={analytics.scholarshipGaps} />
      </div>
    </div>
  );
}

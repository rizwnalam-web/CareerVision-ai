import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Briefcase, Brain, DollarSign, Settings2, Search, Filter,
  Loader2, Sparkles, TrendingUp, TrendingDown, Minus,
  ChevronDown, ChevronRight, ExternalLink, BookOpen,
  Award, Code, Lightbulb, Target, Users, Zap,
  MapPin, Clock, RefreshCw, AlertCircle, CheckCircle,
  Heart, Shield, Star, BarChart3, Globe, X,
} from "lucide-react";
import { cn } from "../lib/utils";
import type { ResumeContent } from "../types/resume";
import type {
  CachedMatch, JobListing, SkillGap, LearningResource,
  SalaryPrediction, CultureAnalysis, WorkPreferences,
} from "../types/jobMatch";
import {
  getJobListings, runJobMatching, getCachedMatches,
  getSkillGapAnalysis, getSalaryPrediction, getCultureFit,
  getWorkPreferences, saveWorkPreferences, addJobListing,
} from "../services/jobMatchService";

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  userId: string;
  resumeContent: ResumeContent | null;
}

type Tab = "matches" | "salary" | "culture" | "preferences";
type WorkTypeFilter = "any" | "remote" | "hybrid" | "onsite";

// ─────────────────────────────────────────────────────────────────────────────
// Small helpers
// ─────────────────────────────────────────────────────────────────────────────

function scoreColor(score: number) {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-500";
  return "text-rose-500";
}

function scoreBg(score: number) {
  if (score >= 80) return "bg-emerald-50 border-emerald-200";
  if (score >= 60) return "bg-amber-50 border-amber-200";
  return "bg-rose-50 border-rose-200";
}

function scoreRing(score: number) {
  if (score >= 80) return "stroke-emerald-500";
  if (score >= 60) return "stroke-amber-400";
  return "stroke-rose-400";
}

function importanceBadge(imp: string) {
  const map: Record<string, string> = {
    critical: "bg-rose-100 text-rose-700",
    high: "bg-orange-100 text-orange-700",
    medium: "bg-amber-100 text-amber-700",
    low: "bg-slate-100 text-slate-500",
  };
  return map[imp] || map.low;
}

function resourceTypeIcon(type: LearningResource["type"]) {
  switch (type) {
    case "course": return <BookOpen size={12} />;
    case "certification": return <Award size={12} />;
    case "project": return <Code size={12} />;
    case "book": return <BookOpen size={12} />;
    default: return <Lightbulb size={12} />;
  }
}

function workTypeLabel(wt: string) {
  return wt === "onsite" ? "On-site" : wt.charAt(0).toUpperCase() + wt.slice(1);
}

function workTypePill(wt: string) {
  const map: Record<string, string> = {
    remote: "bg-violet-100 text-violet-700",
    hybrid: "bg-sky-100 text-sky-700",
    onsite: "bg-slate-100 text-slate-600",
  };
  return map[wt] || map.onsite;
}

function fmt(n: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
}

// ─────────────────────────────────────────────────────────────────────────────
// Radial score ring
// ─────────────────────────────────────────────────────────────────────────────

const ScoreRing: React.FC<{ score: number; size?: number }> = ({ score, size = 56 }) => {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={5} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        strokeWidth={5} strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        className={scoreRing(score)}
        style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
    </svg>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Skill gap detail panel
// ─────────────────────────────────────────────────────────────────────────────

const SkillGapPanel: React.FC<{ gaps: SkillGap[] }> = ({ gaps }) => {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!gaps.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
        <CheckCircle size={32} className="text-emerald-400" />
        <p className="text-sm font-medium">No skill gaps detected — great match!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {gaps.map(gap => (
        <div key={gap.skill} className="border border-slate-200 rounded-2xl overflow-hidden">
          <button
            onClick={() => setExpanded(expanded === gap.skill ? null : gap.skill)}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className={cn("px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest", importanceBadge(gap.importance))}>
                {gap.importance}
              </span>
              <span className="text-sm font-bold text-slate-800">{gap.skill}</span>
              <span className="text-[10px] text-slate-400">
                {gap.currentLevel} → {gap.requiredLevel}
              </span>
            </div>
            {expanded === gap.skill ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
          </button>
          <AnimatePresence>
            {expanded === gap.skill && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-slate-100"
              >
                <div className="p-4 space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Learning Path</p>
                  {gap.learningPath.map((r, i) => (
                    <a
                      key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 transition-colors group"
                    >
                      <span className="mt-0.5 text-slate-400 group-hover:text-indigo-400">{resourceTypeIcon(r.type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate">{r.title}</p>
                        <p className="text-[10px] text-slate-500">{r.platform} · {r.estimatedHours}h</p>
                      </div>
                      <span className={cn("shrink-0 px-1.5 py-0.5 rounded text-[9px] font-black uppercase", importanceBadge(r.priority))}>
                        {r.priority}
                      </span>
                      <ExternalLink size={10} className="shrink-0 mt-0.5 text-slate-300 group-hover:text-indigo-400" />
                    </a>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Salary card
// ─────────────────────────────────────────────────────────────────────────────

const SalaryCard: React.FC<{ pred: SalaryPrediction }> = ({ pred }) => {
  const TrendIcon = pred.marketTrend === "rising" ? TrendingUp : pred.marketTrend === "declining" ? TrendingDown : Minus;
  const trendColor = pred.marketTrend === "rising" ? "text-emerald-500" : pred.marketTrend === "declining" ? "text-rose-500" : "text-slate-400";

  return (
    <div className="space-y-4">
      {/* Range bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          <span>Min</span><span>Median</span><span>Max</span>
        </div>
        <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="absolute top-0 h-full bg-gradient-to-r from-indigo-400 to-violet-500 rounded-full"
            style={{
              left: `${((pred.percentile25 - pred.min) / (pred.max - pred.min)) * 100}%`,
              width: `${((pred.percentile75 - pred.percentile25) / (pred.max - pred.min)) * 100}%`,
            }}
          />
          <div
            className="absolute top-0 w-1 h-full bg-white border-2 border-indigo-600 rounded-full"
            style={{ left: `calc(${((pred.median - pred.min) / (pred.max - pred.min)) * 100}% - 2px)` }}
          />
        </div>
        <div className="flex justify-between text-xs font-black text-slate-700">
          <span>{fmt(pred.min, pred.currency)}</span>
          <span className="text-indigo-600">{fmt(pred.median, pred.currency)}</span>
          <span>{fmt(pred.max, pred.currency)}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <TrendIcon size={14} className={trendColor} />
          <span className={cn("text-xs font-bold capitalize", trendColor)}>{pred.marketTrend} market</span>
        </div>
        <span className="text-[10px] text-slate-400">|</span>
        <span className="text-[10px] text-slate-500 capitalize">{pred.confidenceLevel} confidence</span>
      </div>

      <p className="text-xs text-slate-600 bg-slate-50 rounded-xl p-3">{pred.comparison}</p>

      {pred.factors.length > 0 && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Key Factors</p>
          <div className="flex flex-wrap gap-1.5">
            {pred.factors.map((f, i) => (
              <span key={i} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-medium">{f}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Culture radar
// ─────────────────────────────────────────────────────────────────────────────

const CultureCard: React.FC<{ analysis: CultureAnalysis }> = ({ analysis }) => {
  const dims = [
    { key: "workLifeBalance", label: "Work-Life Balance" },
    { key: "innovationFocus", label: "Innovation" },
    { key: "collaboration", label: "Collaboration" },
    { key: "autonomy", label: "Autonomy" },
    { key: "growthOpportunity", label: "Growth" },
  ] as const;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative">
          <ScoreRing score={analysis.overallFitScore} size={64} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn("text-base font-black", scoreColor(analysis.overallFitScore))}>
              {analysis.overallFitScore}
            </span>
          </div>
        </div>
        <p className="text-sm text-slate-600 flex-1">{analysis.summary}</p>
      </div>

      <div className="space-y-2">
        {dims.map(({ key, label }) => {
          const val = analysis.dimensions[key];
          return (
            <div key={key} className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-slate-500 w-28 shrink-0">{label}</span>
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-400 to-violet-400 rounded-full"
                  style={{ width: `${val}%`, transition: "width 0.6s ease" }}
                />
              </div>
              <span className="text-xs font-black text-slate-600 w-6 text-right">{val}</span>
            </div>
          );
        })}
      </div>

      {analysis.strengths.length > 0 && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1.5">Strengths</p>
          <div className="space-y-1">
            {analysis.strengths.map((s, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle size={11} className="text-emerald-500 mt-0.5 shrink-0" />
                <span className="text-xs text-slate-600">{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {analysis.watchouts.length > 0 && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1.5">Watch-outs</p>
          <div className="space-y-1">
            {analysis.watchouts.map((w, i) => (
              <div key={i} className="flex items-start gap-2">
                <AlertCircle size={11} className="text-amber-500 mt-0.5 shrink-0" />
                <span className="text-xs text-slate-600">{w}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Job match card
// ─────────────────────────────────────────────────────────────────────────────

const MatchCard: React.FC<{
  match: CachedMatch;
  onExpand: () => void;
  expanded: boolean;
}> = ({ match, onExpand, expanded }) => (
  <div className={cn(
    "bg-white rounded-2xl border transition-all",
    expanded ? "border-indigo-300 shadow-lg shadow-indigo-100" : "border-slate-200 hover:border-slate-300"
  )}>
    <button onClick={onExpand} className="w-full text-left p-5">
      <div className="flex items-start gap-4">
        {/* Score ring */}
        <div className="relative shrink-0">
          <ScoreRing score={match.matchScore} size={52} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn("text-sm font-black", scoreColor(match.matchScore))}>
              {match.matchScore}
            </span>
          </div>
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-black text-slate-900 truncate">{match.title}</h3>
              <p className="text-xs text-slate-500">{match.company}</p>
            </div>
            <ChevronDown size={14} className={cn("text-slate-400 mt-0.5 shrink-0 transition-transform", expanded && "rotate-180")} />
          </div>

          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className={cn("px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wide", workTypePill(match.workType))}>
              {workTypeLabel(match.workType)}
            </span>
            {match.location && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded-lg text-[10px] text-slate-500">
                <MapPin size={9} />{match.location}
              </span>
            )}
            {match.salaryMin && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 rounded-lg text-[10px] text-emerald-700 font-bold">
                <DollarSign size={9} />{fmt(match.salaryMin, match.salaryCurrency)}–{fmt(match.salaryMax || match.salaryMin, match.salaryCurrency)}
              </span>
            )}
          </div>

          {/* Sub-scores */}
          <div className="flex gap-3 mt-3">
            {[
              { label: "Skills", value: match.skillMatchScore },
              { label: "Culture", value: match.cultureFitScore },
              { label: "Salary", value: match.salaryFitScore },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className={cn("text-sm font-black", scoreColor(value))}>{value}</p>
                <p className="text-[9px] text-slate-400 uppercase tracking-widest">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </button>

    <AnimatePresence>
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden border-t border-slate-100"
        >
          <div className="p-5 space-y-6">
            {/* Match reasons */}
            {match.matchReasons?.length > 0 && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Why You Match</p>
                <div className="space-y-1.5">
                  {match.matchReasons.map((r, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Star size={10} className="text-indigo-500 mt-0.5 shrink-0" />
                      <span className="text-xs text-slate-600">{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skill gaps */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Skill Gaps &amp; Learning Paths</p>
              <SkillGapPanel gaps={match.skillGaps || []} />
            </div>

            {/* Salary + Culture side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {match.salaryPrediction && (
                <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign size={13} className="text-indigo-500" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Salary Prediction</p>
                  </div>
                  <SalaryCard pred={match.salaryPrediction} />
                </div>
              )}
              {match.cultureAnalysis && (
                <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2 mb-3">
                    <Heart size={13} className="text-rose-400" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Culture Fit</p>
                  </div>
                  <CultureCard analysis={match.cultureAnalysis} />
                </div>
              )}
            </div>

            {/* Skills required */}
            {match.skillsRequired?.length > 0 && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Required Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {match.skillsRequired.map(s => (
                    <span key={s} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-medium">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {match.sourceUrl && (
              <a
                href={match.sourceUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-colors"
              >
                Apply Now <ExternalLink size={11} />
              </a>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Salary Explorer tab
// ─────────────────────────────────────────────────────────────────────────────

const SalaryExplorer: React.FC<{ resumeContent: ResumeContent | null }> = ({ resumeContent }) => {
  const [role, setRole] = useState(resumeContent?.experience?.[0]?.position || "");
  const [location, setLocation] = useState("");
  const [years, setYears] = useState("3");
  const [currency, setCurrency] = useState("USD");
  const [pred, setPred] = useState<SalaryPrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allSkills = resumeContent
    ? [...(resumeContent.skills?.technical || []), ...(resumeContent.skills?.certifications || [])]
    : [];

  const handlePredict = async () => {
    if (!role.trim()) return;
    setLoading(true); setError(null);
    try {
      const result = await getSalaryPrediction({
        role, location: location || "Global", experienceYears: parseInt(years, 10),
        skills: allSkills, currency,
      });
      setPred(result);
    } catch (e: any) {
      setError(e.message || "Prediction failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Job Title / Role</label>
            <input
              value={role} onChange={e => setRole(e.target.value)}
              placeholder="e.g. Senior Software Engineer"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Location</label>
            <input
              value={location} onChange={e => setLocation(e.target.value)}
              placeholder="e.g. San Francisco, CA"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Years of Experience</label>
            <input
              type="number" min="0" max="40" value={years} onChange={e => setYears(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Currency</label>
            <select
              value={currency} onChange={e => setCurrency(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400 bg-white"
            >
              {["USD","GBP","EUR","CAD","AUD","INR","SGD","AED"].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={handlePredict} disabled={loading || !role.trim()}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-colors"
        >
          {loading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
          {loading ? "Predicting…" : "Predict Salary"}
        </button>
        {error && <p className="text-xs text-rose-500">{error}</p>}
      </div>

      {pred && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-200 p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={14} className="text-indigo-500" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-700">Market Salary Range</h3>
            <span className="ml-auto text-[10px] text-slate-400">{role} · {location || "Global"}</span>
          </div>
          <SalaryCard pred={pred} />
        </motion.div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Culture Fit Explorer
// ─────────────────────────────────────────────────────────────────────────────

const CultureExplorer: React.FC<{ resumeContent: ResumeContent | null }> = ({ resumeContent }) => {
  const [company, setCompany] = useState("");
  const [culture, setCulture] = useState("");
  const [result, setResult] = useState<CultureAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAssess = async () => {
    if (!company.trim() || !culture.trim() || !resumeContent) return;
    setLoading(true); setError(null);
    try {
      const analysis = await getCultureFit({ resumeContent, companyName: company, cultureSummary: culture });
      setResult(analysis);
    } catch (e: any) {
      setError(e.message || "Assessment failed");
    } finally {
      setLoading(false);
    }
  };

  if (!resumeContent) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
        <Heart size={36} className="text-rose-200" />
        <p className="text-sm font-medium">Upload your resume first to assess culture fit</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Company Name</label>
          <input
            value={company} onChange={e => setCompany(e.target.value)}
            placeholder="e.g. Google, Stripe, Shopify"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            Company Culture / Values Description
          </label>
          <textarea
            value={culture} onChange={e => setCulture(e.target.value)}
            placeholder="Paste the company's mission, values, or culture page here…"
            rows={5}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none"
          />
        </div>
        <button
          onClick={handleAssess} disabled={loading || !company.trim() || !culture.trim()}
          className="flex items-center gap-2 px-5 py-2.5 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-colors"
        >
          {loading ? <Loader2 size={13} className="animate-spin" /> : <Heart size={13} />}
          {loading ? "Assessing…" : "Assess Culture Fit"}
        </button>
        {error && <p className="text-xs text-rose-500">{error}</p>}
      </div>

      {result && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-200 p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Users size={14} className="text-rose-400" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-700">Culture Fit — {company}</h3>
          </div>
          <CultureCard analysis={result} />
        </motion.div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Preferences tab
// ─────────────────────────────────────────────────────────────────────────────

const PreferencesPanel: React.FC<{ userId: string }> = ({ userId }) => {
  const [prefs, setPrefs] = useState<WorkPreferences>({
    workTypePreference: "any", minSalary: null, maxSalary: null,
    salaryCurrency: "USD", preferredLocations: [], preferredIndustries: [], targetRole: null,
  });
  const [locationInput, setLocationInput] = useState("");
  const [industryInput, setIndustryInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getWorkPreferences(userId).then(p => {
      if (p) setPrefs(p);
    }).catch(() => {});
  }, [userId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveWorkPreferences(userId, prefs);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const addLocation = () => {
    const v = locationInput.trim();
    if (v && !prefs.preferredLocations.includes(v)) {
      setPrefs(p => ({ ...p, preferredLocations: [...p.preferredLocations, v] }));
    }
    setLocationInput("");
  };

  const addIndustry = () => {
    const v = industryInput.trim();
    if (v && !prefs.preferredIndustries.includes(v)) {
      setPrefs(p => ({ ...p, preferredIndustries: [...p.preferredIndustries, v] }));
    }
    setIndustryInput("");
  };

  const WORK_TYPES: { value: WorkPreferences["workTypePreference"]; label: string; icon: React.ElementType }[] = [
    { value: "any", label: "Any", icon: Globe },
    { value: "remote", label: "Remote", icon: Globe },
    { value: "hybrid", label: "Hybrid", icon: Zap },
    { value: "onsite", label: "On-site", icon: Briefcase },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
        {/* Work type */}
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Work Type Preference</p>
          <div className="flex flex-wrap gap-2">
            {WORK_TYPES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setPrefs(p => ({ ...p, workTypePreference: value }))}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all",
                  prefs.workTypePreference === value
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "border-slate-200 text-slate-600 hover:border-indigo-300"
                )}
              >
                <Icon size={11} /> {label}
              </button>
            ))}
          </div>
        </div>

        {/* Salary */}
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Salary Expectation (Annual)</p>
          <div className="flex items-center gap-3">
            <select
              value={prefs.salaryCurrency}
              onChange={e => setPrefs(p => ({ ...p, salaryCurrency: e.target.value }))}
              className="px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400 bg-white"
            >
              {["USD","GBP","EUR","CAD","AUD","INR","SGD","AED"].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input
              type="number" placeholder="Min"
              value={prefs.minSalary ?? ""}
              onChange={e => setPrefs(p => ({ ...p, minSalary: e.target.value ? parseInt(e.target.value, 10) : null }))}
              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400"
            />
            <span className="text-slate-400 text-sm">–</span>
            <input
              type="number" placeholder="Max"
              value={prefs.maxSalary ?? ""}
              onChange={e => setPrefs(p => ({ ...p, maxSalary: e.target.value ? parseInt(e.target.value, 10) : null }))}
              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400"
            />
          </div>
        </div>

        {/* Locations */}
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Preferred Locations</p>
          <div className="flex gap-2">
            <input
              value={locationInput} onChange={e => setLocationInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addLocation()}
              placeholder="Add city or country…"
              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400"
            />
            <button onClick={addLocation} className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-black uppercase tracking-widest">Add</button>
          </div>
          {prefs.preferredLocations.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {prefs.preferredLocations.map(loc => (
                <span key={loc} className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-medium">
                  <MapPin size={9} />{loc}
                  <button onClick={() => setPrefs(p => ({ ...p, preferredLocations: p.preferredLocations.filter(l => l !== loc) }))} className="ml-1 hover:text-rose-500">
                    <X size={9} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Industries */}
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Preferred Industries</p>
          <div className="flex gap-2">
            <input
              value={industryInput} onChange={e => setIndustryInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addIndustry()}
              placeholder="Add industry…"
              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400"
            />
            <button onClick={addIndustry} className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-black uppercase tracking-widest">Add</button>
          </div>
          {prefs.preferredIndustries.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {prefs.preferredIndustries.map(ind => (
                <span key={ind} className="flex items-center gap-1 px-2.5 py-1 bg-violet-50 text-violet-700 rounded-xl text-xs font-medium">
                  {ind}
                  <button onClick={() => setPrefs(p => ({ ...p, preferredIndustries: p.preferredIndustries.filter(i => i !== ind) }))} className="ml-1 hover:text-rose-500">
                    <X size={9} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleSave} disabled={saving}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
            saved
              ? "bg-emerald-500 text-white"
              : "bg-indigo-600 hover:bg-indigo-700 text-white"
          )}
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : saved ? <CheckCircle size={13} /> : <Settings2 size={13} />}
          {saved ? "Saved!" : saving ? "Saving…" : "Save Preferences"}
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

const JobMatchView: React.FC<Props> = ({ userId, resumeContent }) => {
  const [activeTab, setActiveTab] = useState<Tab>("matches");
  const [matches, setMatches] = useState<CachedMatch[]>([]);
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workTypeFilter, setWorkTypeFilter] = useState<WorkTypeFilter>("any");
  const [searchQuery, setSearchQuery] = useState("");
  const [minSalary, setMinSalary] = useState<number | undefined>();
  const [maxSalary, setMaxSalary] = useState<number | undefined>();
  const [prefs, setPrefs] = useState<WorkPreferences | null>(null);

  // Load cached matches and preferences on mount
  useEffect(() => {
    if (!userId) return;
    setIsLoading(true);
    Promise.all([
      getCachedMatches(userId).catch(() => [] as CachedMatch[]),
      getWorkPreferences(userId).catch(() => null),
    ]).then(([cachedMatches, savedPrefs]) => {
      setMatches(cachedMatches);
      if (savedPrefs) {
        setPrefs(savedPrefs);
        setWorkTypeFilter((savedPrefs.workTypePreference as WorkTypeFilter) || "any");
        setMinSalary(savedPrefs.minSalary ?? undefined);
        setMaxSalary(savedPrefs.maxSalary ?? undefined);
      }
    }).finally(() => setIsLoading(false));
  }, [userId]);

  // Load available jobs
  useEffect(() => {
    getJobListings({ workType: workTypeFilter === "any" ? undefined : workTypeFilter, limit: 50 })
      .then(setJobs)
      .catch(() => {});
  }, [workTypeFilter]);

  const handleRunAnalysis = useCallback(async () => {
    if (!resumeContent) {
      setError("Please upload your resume first to run job matching.");
      return;
    }
    setIsAnalysing(true);
    setError(null);
    try {
      await runJobMatching({
        userId,
        resumeContent,
        workTypeFilter: workTypeFilter === "any" ? undefined : workTypeFilter,
        minSalary,
        maxSalary,
      });
      // Reload cached matches
      const updated = await getCachedMatches(userId);
      setMatches(updated);
    } catch (e: any) {
      setError(e.message || "Analysis failed");
    } finally {
      setIsAnalysing(false);
    }
  }, [userId, resumeContent, workTypeFilter, minSalary, maxSalary]);

  const filteredMatches = matches.filter(m => {
    if (workTypeFilter !== "any" && m.workType !== workTypeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!m.title.toLowerCase().includes(q) && !m.company.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "matches", label: "Matches", icon: Brain },
    { id: "salary", label: "Salary Explorer", icon: DollarSign },
    { id: "culture", label: "Culture Fit", icon: Heart },
    { id: "preferences", label: "Preferences", icon: Settings2 },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Brain size={18} className="text-indigo-500" />
          <h1 className="text-xl font-black text-slate-900">AI Job Matching</h1>
          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 text-[9px] font-black rounded-lg uppercase tracking-widest">Semantic AI</span>
        </div>
        <p className="text-sm text-slate-500">
          Semantic resume-to-job matching, skill gap analysis, salary prediction &amp; culture fit.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex bg-slate-100 rounded-2xl p-1 gap-1">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === t.id
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <t.icon size={11} />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── MATCHES TAB ── */}
        {activeTab === "matches" && (
          <motion.div key="matches" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Filters + run analysis */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
              <div className="flex flex-wrap gap-2 items-center">
                {/* Search */}
                <div className="flex items-center gap-2 flex-1 min-w-40 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50">
                  <Search size={13} className="text-slate-400 shrink-0" />
                  <input
                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search jobs…"
                    className="flex-1 text-sm bg-transparent outline-none"
                  />
                </div>

                {/* Work type */}
                {(["any", "remote", "hybrid", "onsite"] as WorkTypeFilter[]).map(wt => (
                  <button
                    key={wt}
                    onClick={() => setWorkTypeFilter(wt)}
                    className={cn(
                      "px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                      workTypeFilter === wt
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "border-slate-200 text-slate-500 hover:border-indigo-300"
                    )}
                  >
                    {wt === "any" ? "All" : workTypeLabel(wt)}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  {jobs.length} available jobs · {filteredMatches.length} matched
                </span>
                <button
                  onClick={handleRunAnalysis}
                  disabled={isAnalysing || !resumeContent}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"
                >
                  {isAnalysing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                  {isAnalysing ? "Analysing…" : "Run AI Match"}
                </button>
              </div>

              {!resumeContent && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <AlertCircle size={13} className="text-amber-500 shrink-0" />
                  <span className="text-xs text-amber-700">Upload your resume to enable AI job matching</span>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl">
                  <AlertCircle size={13} className="text-rose-500 shrink-0" />
                  <span className="text-xs text-rose-700">{error}</span>
                </div>
              )}
            </div>

            {/* Match list */}
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={24} className="animate-spin text-indigo-400" />
              </div>
            ) : filteredMatches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
                <Brain size={40} className="text-slate-200" />
                <p className="text-sm font-medium">
                  {jobs.length === 0
                    ? "No job listings found. Add some jobs to the database first."
                    : "No matches yet — click \"Run AI Match\" to analyse jobs against your resume."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredMatches.map(match => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    expanded={expandedMatch === match.id}
                    onExpand={() => setExpandedMatch(expandedMatch === match.id ? null : match.id)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── SALARY TAB ── */}
        {activeTab === "salary" && (
          <motion.div key="salary" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <SalaryExplorer resumeContent={resumeContent} />
          </motion.div>
        )}

        {/* ── CULTURE TAB ── */}
        {activeTab === "culture" && (
          <motion.div key="culture" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <CultureExplorer resumeContent={resumeContent} />
          </motion.div>
        )}

        {/* ── PREFERENCES TAB ── */}
        {activeTab === "preferences" && (
          <motion.div key="preferences" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <PreferencesPanel userId={userId} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default JobMatchView;

/**
 * OpportunitiesFeed — "My Opportunities" Dashboard Widget
 *
 * A curated, AI-matched feed mixing jobs, scholarships, and social impact
 * projects. Each item shows a Match Score badge, a one-line "Why?" explanation
 * (Explainable AI), and a Shortlist toggle.
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase, GraduationCap, Leaf, Bookmark, BookmarkCheck,
  ChevronRight, Sparkles, ArrowRight, RefreshCw,
  TrendingUp, MapPin, Clock, DollarSign, ExternalLink,
  Zap, Star, Filter,
} from "lucide-react";
import { cn } from "../lib/utils";
import type { UserProfile } from "../types/career";
import type { CareerPath } from "../types/career";
import { FUNDING_OPPORTUNITIES } from "../constants/mockData";

// ─── Types ────────────────────────────────────────────────────────────────────

type OpportunityType = "job" | "scholarship" | "project";

interface Opportunity {
  id: string;
  type: OpportunityType;
  title: string;
  org: string;
  location: string;
  matchScore: number;
  whyMatch: string;
  badge?: string;
  salary?: string;
  deadline?: string;
  tags: string[];
  urgent?: boolean;
  isNew?: boolean;
}

// ─── Match engine ──────────────────────────────────────────────────────────────

function scoreMatch(
  profile: UserProfile,
  title: string,
  tags: unknown,
  baseScore = 65
): { score: number; reason: string } {
  const safeTags: string[] = Array.isArray(tags) ? (tags as string[]) : [];
  const skills = (profile.skills ?? []).map(s => s.toLowerCase());
  const interests = (Array.isArray(profile.interests)
    ? (profile.interests as string[])
    : typeof profile.interests === "string"
      ? (profile.interests as string).split(/[,;]+/)
      : []
  ).map(i => i.toLowerCase().trim());

  const allText = `${title} ${safeTags.join(" ")}`.toLowerCase();

  let score = baseScore;
  const matched: string[] = [];

  skills.forEach(s => {
    if (s.length > 2 && allText.includes(s)) {
      score += 5;
      matched.push(s);
    }
  });
  interests.forEach(i => {
    if (i.length > 2 && allText.includes(i)) {
      score += 4;
      matched.push(i);
    }
  });

  if (profile.targetCareer && allText.includes(profile.targetCareer.toLowerCase())) score += 8;
  if (profile.targetLocation && allText.includes(profile.targetLocation.toLowerCase())) score += 6;
  if (profile.country && allText.includes(profile.country.toLowerCase())) score += 4;

  score = Math.min(99, score);

  const reason = matched.length > 0
    ? `Matched on your ${matched.slice(0, 2).map(m => `"${m}"`).join(" & ")} skills`
    : profile.targetCareer
      ? `Aligned with your ${profile.targetCareer} goal`
      : "Matches your career profile";

  return { score, reason };
}

function buildFeed(profile: UserProfile, careers: CareerPath[]): Opportunity[] {
  const ops: Opportunity[] = [];

  // ── Jobs from careers ──
  const jobSamples = [
    { title: "AI Engineer", org: "DeepMind", location: "London, UK", salary: "$120K–$160K/yr", tags: ["AI", "Python", "Machine Learning"] },
    { title: "Product Manager – HealthTech", org: "Babylon Health", location: "Remote", salary: "$95K–$130K/yr", tags: ["Product", "Healthcare", "Strategy"] },
    { title: "Data Scientist", org: "McKinsey & Company", location: "New York, USA", salary: "$110K–$145K/yr", tags: ["Data Science", "Analytics", "Python"] },
    { title: "UX Researcher", org: "Figma", location: "Remote", salary: "$85K–$115K/yr", tags: ["UX Research", "Design", "User Testing"] },
    { title: "Biomedical Engineer", org: "Medtronic", location: "Dublin, Ireland", salary: "$80K–$110K/yr", tags: ["Biomedical", "Engineering", "Healthcare"] },
    { title: "Cybersecurity Analyst", org: "CrowdStrike", location: "Austin, USA", salary: "$90K–$125K/yr", tags: ["Cybersecurity", "SIEM", "Cloud"] },
    { title: "Climate Finance Analyst", org: "HSBC Sustainability", location: "Toronto, Canada", salary: "$75K–$100K/yr", tags: ["Finance", "Climate", "ESG"] },
    { title: "Research Scientist – NLP", org: "Hugging Face", location: "Remote", salary: "$130K–$170K/yr", tags: ["NLP", "ML Research", "Python", "AI"] },
  ];

  // Add from careers array first (real data)
  careers.slice(0, 3).forEach((c, i) => {
    const safeTags = Array.isArray(c.tags) ? c.tags : [];
    const { score, reason } = scoreMatch(profile, c.title, safeTags, 72 + i * 3);
    ops.push({
      id: `job-real-${c.id}`,
      type: "job",
      title: c.title,
      org: (c as unknown as { employer?: string })?.employer ?? "Top Employer",
      location: profile.targetLocation ?? "Remote",
      matchScore: score,
      whyMatch: reason,
      salary: c.avgSalary ?? undefined,
      tags: safeTags.slice(0, 3),
      badge: score >= 90 ? "Top Match" : undefined,
      isNew: i === 0,
    });
  });

  // Fill with curated samples if under 4 job cards
  if (ops.length < 4) {
    jobSamples.slice(0, 4 - ops.length).forEach((j, i) => {
      const { score, reason } = scoreMatch(profile, j.title, j.tags, 68 + i * 4);
      ops.push({
        id: `job-sample-${i}`,
        type: "job",
        title: j.title,
        org: j.org,
        location: j.location,
        matchScore: score,
        whyMatch: reason,
        salary: j.salary,
        tags: j.tags,
        badge: score >= 88 ? "High Match" : undefined,
        isNew: i < 2,
      });
    });
  }

  // ── Scholarships from FUNDING_OPPORTUNITIES ──
  FUNDING_OPPORTUNITIES.filter(f => f.type !== "Loan").slice(0, 6).forEach((f, i) => {
    const eligParts = Array.isArray(f.eligibility)
      ? (f.eligibility as string[]).map(e => String(e).replace(/\d+.*/, "").trim()).filter(Boolean)
      : [];
    const tags = [f.field, f.type, ...eligParts].filter(Boolean) as string[];
    const { score, reason } = scoreMatch(profile, f.name, tags, 66 + i * 3);
    if (score < 60) return;
    ops.push({
      id: `scholarship-${f.id}`,
      type: "scholarship",
      title: f.name,
      org: f.organization,
      location: "Global",
      matchScore: score,
      whyMatch: reason,
      salary: `$${f.amount.toLocaleString()} award`,
      deadline: f.deadline,
      tags: tags.slice(0, 3),
      badge: score >= 85 ? "Strong Match" : undefined,
      urgent: !!f.deadline && new Date(f.deadline).getTime() - Date.now() < 30 * 86400000,
    });
  });

  // ── Impact Projects ──
  const projectSamples: Omit<Opportunity, "id" | "matchScore" | "whyMatch">[] = [
    { type: "project", title: "AI Literacy for Rural Schools", org: "Khan Academy", location: "Remote", tags: ["EdTech", "AI", "Volunteer"], badge: "High Impact", salary: "Portfolio + Certificate" },
    { type: "project", title: "Climate Data Dashboard", org: "Climate Reality Project", location: "Remote", tags: ["Data Viz", "Open Source", "Climate"], badge: "New", salary: "Portfolio + Recognition" },
    { type: "project", title: "Women in Tech Mentorship App", org: "AnitaB.org", location: "Remote", tags: ["Full Stack", "Social Impact"], salary: "Portfolio + Reference" },
  ];

  projectSamples.forEach((p, i) => {
    const { score, reason } = scoreMatch(profile, p.title, p.tags, 62 + i * 5);
    ops.push({
      id: `project-${i}`,
      ...p,
      matchScore: score,
      whyMatch: reason,
    });
  });

  // Sort by match score descending
  return ops.sort((a, b) => b.matchScore - a.matchScore);
}

// ─── Type config ──────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  job: {
    icon: Briefcase,
    label: "Job Match",
    bg: "bg-indigo-50",
    iconColor: "text-indigo-600",
    border: "border-indigo-100",
    badge: "bg-indigo-600",
  },
  scholarship: {
    icon: GraduationCap,
    label: "Scholarship",
    bg: "bg-violet-50",
    iconColor: "text-violet-600",
    border: "border-violet-100",
    badge: "bg-violet-600",
  },
  project: {
    icon: Leaf,
    label: "Impact Project",
    bg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    border: "border-emerald-100",
    badge: "bg-emerald-600",
  },
};

// ─── Score ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const r = 14;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 85 ? "#6366f1" : score >= 70 ? "#f59e0b" : "#94a3b8";

  return (
    <div className="relative w-10 h-10 shrink-0">
      <svg width={40} height={40} className="-rotate-90">
        <circle cx={20} cy={20} r={r} fill="none" stroke="#f1f5f9" strokeWidth={3} />
        <motion.circle
          cx={20} cy={20} r={r} fill="none"
          stroke={color} strokeWidth={3} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, delay: 0.2 }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[9px] font-black" style={{ color }}>{score}</span>
      </div>
    </div>
  );
}

// ─── Opportunity card ─────────────────────────────────────────────────────────

function OpportunityCard({
  op,
  shortlisted,
  onToggleShortlist,
}: {
  op: Opportunity;
  shortlisted: boolean;
  onToggleShortlist: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = TYPE_CONFIG[op.type];
  const Icon = cfg.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-white rounded-2xl border p-4 hover:shadow-md transition-all group cursor-pointer",
        op.urgent ? "border-amber-200 ring-1 ring-amber-100/70" : "border-slate-100 hover:border-indigo-100"
      )}
      onClick={() => setExpanded(v => !v)}
    >
      <div className="flex items-start gap-3">
        {/* Type icon */}
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", cfg.bg)}>
          <Icon size={15} className={cfg.iconColor} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                <span className={cn("text-[8px] font-black px-1.5 py-0.5 rounded-md text-white uppercase tracking-widest", cfg.badge)}>
                  {cfg.label}
                </span>
                {op.isNew && (
                  <span className="text-[8px] font-black px-1.5 py-0.5 rounded-md bg-rose-500 text-white uppercase tracking-widest">New</span>
                )}
                {op.urgent && (
                  <span className="text-[8px] font-black px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 border border-amber-200 uppercase tracking-widest flex items-center gap-0.5">
                    <Zap size={7} />Deadline Soon
                  </span>
                )}
                {op.badge && !op.isNew && (
                  <span className="text-[8px] font-black px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase tracking-widest flex items-center gap-0.5">
                    <Star size={7} fill="currentColor" />{op.badge}
                  </span>
                )}
              </div>
              <h4 className="text-[12px] font-black text-slate-800 leading-snug truncate group-hover:text-indigo-700 transition-colors">
                {op.title}
              </h4>
              <p className="text-[10px] text-slate-400 font-medium">{op.org}</p>
            </div>

            {/* Score ring */}
            <ScoreRing score={op.matchScore} />
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="flex items-center gap-1 text-[9px] text-slate-400 font-medium">
              <MapPin size={9} />{op.location}
            </span>
            {op.salary && (
              <span className="flex items-center gap-1 text-[9px] text-slate-400 font-medium">
                <DollarSign size={9} />{op.salary}
              </span>
            )}
            {op.deadline && (
              <span className="flex items-center gap-1 text-[9px] text-amber-600 font-bold">
                <Clock size={9} />Due {new Date(op.deadline).toLocaleDateString("en-GB", { month: "short", day: "numeric" })}
              </span>
            )}
          </div>

          {/* Tags */}
          <div className="flex gap-1 mt-2 flex-wrap">
            {(Array.isArray(op.tags) ? op.tags : []).map(t => (
              <span key={t} className="text-[8px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500">{t}</span>
            ))}
          </div>
        </div>

        {/* Shortlist button */}
        <button
          onClick={e => { e.stopPropagation(); onToggleShortlist(op.id); }}
          className={cn("shrink-0 p-1.5 rounded-lg transition-all", shortlisted ? "text-indigo-600 bg-indigo-50" : "text-slate-300 hover:text-indigo-400 hover:bg-indigo-50")}
        >
          {shortlisted ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
        </button>
      </div>

      {/* Expanded: Why this match */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-slate-100">
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-indigo-50 border border-indigo-100">
                <Sparkles size={10} className="text-indigo-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[9px] font-black text-indigo-700 uppercase tracking-widest mb-0.5">Why this match</p>
                  <p className="text-[10px] text-indigo-600 leading-relaxed">{op.whyMatch} · {op.matchScore}% profile fit</p>
                </div>
              </div>
              <button className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all">
                <ExternalLink size={10} />View Opportunity
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const FILTER_TABS = [
  { id: "all",         label: "All",         emoji: "✦" },
  { id: "job",         label: "Jobs",        emoji: "💼" },
  { id: "scholarship", label: "Scholarships",emoji: "🎓" },
  { id: "project",     label: "Projects",    emoji: "🌿" },
] as const;

interface Props {
  profile: UserProfile;
  careers: CareerPath[];
  onNavigate?: (view: string) => void;
}

export default function OpportunitiesFeed({ profile, careers, onNavigate }: Props) {
  const feed = useMemo(() => buildFeed(profile, careers), [profile, careers]);
  const [activeFilter, setActiveFilter] = useState<"all" | OpportunityType>("all");
  const [shortlisted, setShortlisted] = useState<Set<string>>(new Set());
  const [showShortlistOnly, setShowShortlistOnly] = useState(false);

  const toggleShortlist = (id: string) =>
    setShortlisted(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const displayed = feed.filter(op => {
    if (showShortlistOnly && !shortlisted.has(op.id)) return false;
    if (activeFilter !== "all" && op.type !== activeFilter) return false;
    return true;
  });

  const newCount = feed.filter(o => o.isNew).length;
  const urgentCount = feed.filter(o => o.urgent).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-black text-slate-900 tracking-tight">My Opportunities</h3>
            {newCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[8px] font-black uppercase tracking-widest">
                {newCount} new
              </span>
            )}
            {urgentCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 text-[8px] font-black uppercase tracking-widest">
                <Clock size={7} />{urgentCount} urgent
              </span>
            )}
          </div>
          <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mt-0.5">
            AI-Curated · {feed.length} matches · Updated today
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowShortlistOnly(v => !v)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border",
              showShortlistOnly
                ? "bg-indigo-600 text-white border-indigo-700"
                : "bg-white text-slate-500 border-slate-200 hover:border-indigo-200"
            )}
          >
            <Bookmark size={9} />Shortlist {shortlisted.size > 0 && `(${shortlisted.size})`}
          </button>
          <button
            onClick={() => onNavigate?.("jobs")}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-500 text-[9px] font-black uppercase tracking-widest hover:border-indigo-200 hover:text-indigo-600 transition-all"
          >
            All Jobs <ArrowRight size={9} />
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
        {FILTER_TABS.map(({ id, label, emoji }) => (
          <button
            key={id}
            onClick={() => setActiveFilter(id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all border",
              activeFilter === id
                ? "bg-indigo-600 text-white border-indigo-700 shadow-sm shadow-indigo-200"
                : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
            )}
          >
            <span className="text-sm leading-none">{emoji}</span>{label}
            <span className="px-1.5 py-0.5 rounded-full text-[7px] font-black bg-white/20">
              {id === "all" ? feed.length : feed.filter(o => o.type === id).length}
            </span>
          </button>
        ))}
      </div>

      {/* Feed */}
      {displayed.length === 0 ? (
        <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <Sparkles size={24} className="mx-auto mb-3 text-slate-300" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {showShortlistOnly ? "No shortlisted items yet" : "No matches for this filter"}
          </p>
        </div>
      ) : (
        <motion.div layout className="space-y-2.5">
          <AnimatePresence mode="popLayout">
            {displayed.slice(0, 8).map((op, i) => (
              <motion.div key={op.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.04 }}>
                <OpportunityCard op={op} shortlisted={shortlisted.has(op.id)} onToggleShortlist={toggleShortlist} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* View all CTA */}
      {displayed.length > 0 && (
        <button
          onClick={() => onNavigate?.("jobs")}
          className="w-full py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all flex items-center justify-center gap-2"
        >
          View All Opportunities <ChevronRight size={11} />
        </button>
      )}
    </div>
  );
}

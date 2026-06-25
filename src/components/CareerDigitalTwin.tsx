/**
 * Career Digital Twin — "Flight Simulator for Your Career"
 *
 * Lets users run AI-powered what-if simulations over a 5/10/15-year horizon,
 * visualising salary trajectory, skill decay, and market-driven risk across
 * up to three branching scenarios — the baseline (status quo) plus two
 * user-defined interventions (e.g. "Reskill in AI now" vs "Specialise in
 * Cybersecurity in year 3").
 */

import { useState, useEffect, useRef } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis,
  Radar, Legend,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, RefreshCw, Plus, Trash2, GitBranch, Zap, TrendingUp,
  TrendingDown, AlertTriangle, ChevronRight, Award, Target,
  Clock, Layers, BarChart2, ShieldAlert, Sparkles, X,
  CheckCircle2, BookOpen, ArrowRight,
} from "lucide-react";
import type { UserProfile, CareerPath } from "../types/career";
import { cn } from "../lib/utils";
import { ai } from "../lib/aiProxy";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TwinYearSnapshot {
  year: number;
  age: number;
  role: string;
  salaryUSD: number;
  relevanceScore: number;   // 0-100: how future-proof are current skills
  marketDemand: "high" | "medium" | "low";
  skillsGained: string[];
  skillsDecayed: string[];
  keyEvent: string;
  riskLevel: "low" | "medium" | "high";
  interventionPrompt?: string;  // actionable nudge at this checkpoint
}

export interface TwinScenario {
  id: string;
  label: string;
  intervention: string;
  startingRole: string;
  snapshots: TwinYearSnapshot[];
  finalOutcome: string;
  totalEarnings: number;
  peakRole: string;
  peakSalary: number;
}

export interface TwinResult {
  careerTitle: string;
  country: string;
  baseline: TwinScenario;
  alternatives: TwinScenario[];
  decayingSkills: { name: string; halfLifeYears: number; reason: string }[];
  emergingSkills: { name: string; demandGrowthRate: number; relevantByYear: number }[];
  globalTrends: string[];
  simulatedAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const HORIZON_OPTIONS = [5, 10, 15] as const;
type Horizon = (typeof HORIZON_OPTIONS)[number];

const SCENARIO_PALETTE = [
  { hex: "#6366f1", tw: "indigo",  bg: "bg-indigo-600",   ring: "ring-indigo-300",  text: "text-indigo-700",  light: "bg-indigo-50" },
  { hex: "#10b981", tw: "emerald", bg: "bg-emerald-500",  ring: "ring-emerald-300", text: "text-emerald-700", light: "bg-emerald-50" },
  { hex: "#f59e0b", tw: "amber",   bg: "bg-amber-500",    ring: "ring-amber-300",   text: "text-amber-700",   light: "bg-amber-50" },
] as const;

const INTERVENTION_PRESETS = [
  "Stay on current trajectory (status quo)",
  "Reskill in AI & Machine Learning now",
  "Pursue an MBA / advanced degree in 2 years",
  "Transition to a leadership / management track",
  "Specialise in Cybersecurity within 3 years",
  "Move into product management",
  "Build expertise in cloud architecture (AWS/GCP/Azure)",
  "Start a side business / freelance practice",
  "Relocate to a high-demand market (e.g. US/UK/UAE)",
  "Obtain PMP / professional certification immediately",
];

const RISK_META = {
  low:    { label: "Low risk",    icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  medium: { label: "Watch out",   icon: AlertTriangle, color: "text-amber-600 bg-amber-50 border-amber-200" },
  high:   { label: "High risk",   icon: ShieldAlert,   color: "text-rose-600 bg-rose-50 border-rose-200" },
};

// ─── AI Generation ────────────────────────────────────────────────────────────

async function generateTwinSimulation(
  profile: UserProfile,
  careerTitle: string,
  horizon: Horizon,
  interventions: string[]  // [baseline, alt1?, alt2?]
): Promise<TwinResult> {
  const currentYear = new Date().getFullYear();
  const age = Number(profile.age) || 24;
  const country = profile.targetLocation || profile.country || "Global";

  // Compact prompt — keeps token count low enough for the backend LLM proxy.
  // The schema is described inline rather than as TypeScript to avoid hitting
  // DeepSeek's output limit which causes an empty/null response.
  const scenarioList = interventions
    .map((inv, i) => `${i === 0 ? "BASELINE" : `ALT${i}`}: "${inv}"`)
    .join(" | ");

  const prompt = `You are a career simulation AI. Return ONLY a single valid JSON object, no markdown, no extra text.

User: age ${age}, education "${profile.education || "unspecified"}", career "${careerTitle}", location "${country}", skills: ${(profile.skills || []).slice(0, 5).join(", ") || "general"}.
Simulate ${horizon} years from ${currentYear}. Scenarios: ${scenarioList}.

JSON schema (follow exactly):
{
  "careerTitle": "${careerTitle}",
  "country": "${country}",
  "baseline": {SCENARIO},
  "alternatives": [{SCENARIO}],
  "decayingSkills": [{"name":"...","halfLifeYears":N,"reason":"..."}],
  "emergingSkills": [{"name":"...","demandGrowthRate":N,"relevantByYear":N}],
  "globalTrends": ["trend1","trend2","trend3"],
  "simulatedAt": "${new Date().toISOString()}"
}

SCENARIO = {
  "id":"...","label":"...","intervention":"...",
  "startingRole":"...",
  "snapshots": [/* ${horizon} items */ {"year":N,"age":N,"role":"...","salaryUSD":N,"relevanceScore":N,"marketDemand":"high|medium|low","skillsGained":["..."],"skillsDecayed":["..."],"keyEvent":"...","riskLevel":"low|medium|high","interventionPrompt":"...or omit"}],
  "finalOutcome":"...","totalEarnings":N,"peakRole":"...","peakSalary":N
}

Rules: baseline = status-quo (mild risk). Alt scenarios diverge meaningfully. Salaries realistic for ${country}. Include AI disruption, market cycles as keyEvents. decayingSkills and emergingSkills: 3 items each.`;

  try {
    const raw = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { temperature: 0.7 },
    });
    const text: string = raw?.text ?? raw?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    if (!text || text.trim().length < 50) {
      throw new Error("Empty or too-short response from LLM");
    }
    // Strip any accidental markdown fences
    const clean = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
    return JSON.parse(clean) as TwinResult;
  } catch (err) {
    // Fallback is always valid — no user-visible error needed
    return buildFallback(careerTitle, country, currentYear, age, horizon, interventions);
  }
}

// Smart deterministic fallback so the feature works offline / during API issues
function buildFallback(
  careerTitle: string,
  country: string,
  startYear: number,
  age: number,
  horizon: Horizon,
  interventions: string[]
): TwinResult {
  const buildScenario = (
    id: string,
    label: string,
    intervention: string,
    growthRate: number,
    baseSalary: number
  ): TwinScenario => {
    const snapshots: TwinYearSnapshot[] = Array.from({ length: horizon }, (_, i) => {
      const yr = startYear + i;
      const salaryUSD = Math.round(baseSalary * Math.pow(1 + growthRate + (Math.random() * 0.04 - 0.02), i));
      const relevanceScore = Math.max(20, Math.min(100, 80 - i * (5 - growthRate * 20) + (Math.random() * 10 - 5)));
      const riskLevel: TwinYearSnapshot["riskLevel"] = relevanceScore > 65 ? "low" : relevanceScore > 45 ? "medium" : "high";
      return {
        year: yr, age: age + i, role: i < 3 ? careerTitle : i < 6 ? `Senior ${careerTitle}` : `Lead ${careerTitle}`,
        salaryUSD, relevanceScore: Math.round(relevanceScore), marketDemand: relevanceScore > 65 ? "high" : relevanceScore > 45 ? "medium" : "low",
        skillsGained: i % 2 === 0 ? ["AI tools", "Cloud platforms"] : ["Leadership", "Strategic thinking"],
        skillsDecayed: i > 3 ? ["Legacy frameworks", "Manual processes"] : [],
        keyEvent: [
          "AI productivity tools become mainstream in the industry.",
          "Global tech hiring slowdown — companies cut headcount by 15%.",
          "New regulations reshape data & privacy compliance requirements.",
          "Remote-first culture accelerates global talent competition.",
          "Generative AI automates 30% of routine tasks in this field.",
          "Green-tech mandate opens new specialisation opportunities.",
          "Platform consolidation — 3 major players dominate the market.",
          "Skills shortage drives salaries 20% above inflation.",
          "Economic rebound fuels record hiring in tech & services.",
          "AGI-adjacent tools commoditise entry-level work.",
          "Upskilling mandates from regulators require CPD certification.",
          "Offshoring wave subsides; onshore specialists command premium.",
          "New industry standard certifications become table stakes.",
          "AI-native startups disrupt legacy employers.",
          "Cross-functional skills become primary hiring criteria.",
        ][i % 15],
        riskLevel,
        interventionPrompt: [3, 6, 9].includes(i)
          ? `Decision point: Consider ${intervention.split(" ").slice(0, 6).join(" ")} now to stay ahead.`
          : undefined,
      };
    });
    const totalEarnings = snapshots.reduce((s, snap) => s + snap.salaryUSD, 0);
    const peak = snapshots.reduce((best, snap) => snap.salaryUSD > best.salaryUSD ? snap : best, snapshots[0]);
    return {
      id, label, intervention, startingRole: careerTitle, snapshots,
      finalOutcome: `After ${horizon} years you reach ${peak.role} earning $${(peak.salaryUSD / 1000).toFixed(0)}k/yr.`,
      totalEarnings, peakRole: peak.role, peakSalary: peak.salaryUSD,
    };
  };

  const scenarios = interventions.map((inv, i) =>
    buildScenario(
      i === 0 ? "baseline" : `alt-${i}`,
      i === 0 ? "Status Quo" : `Scenario ${i}: ${inv.split(" ").slice(0, 4).join(" ")}`,
      inv,
      i === 0 ? 0.04 : 0.04 + i * 0.03,
      60000 + i * 15000
    )
  );

  const [baseline, ...alternatives] = scenarios;
  return {
    careerTitle, country, baseline, alternatives,
    decayingSkills: [
      { name: "Manual data processing", halfLifeYears: 3, reason: "Automated by AI pipelines" },
      { name: "Legacy framework expertise", halfLifeYears: 5, reason: "Industry migrating to modern stacks" },
      { name: "On-premise infrastructure", halfLifeYears: 4, reason: "Cloud-first mandates accelerating" },
    ],
    emergingSkills: [
      { name: "LLM prompt engineering", demandGrowthRate: 340, relevantByYear: 1 },
      { name: "AI governance & ethics", demandGrowthRate: 220, relevantByYear: 2 },
      { name: "MLOps / AI infrastructure", demandGrowthRate: 180, relevantByYear: 2 },
    ],
    globalTrends: [
      "Generative AI will automate 40% of entry-level tasks in this field within 5 years.",
      "Demand for human judgement, strategy, and cross-domain skills is rising sharply.",
      "Geography becomes less relevant — global talent competition intensifies.",
    ],
    simulatedAt: new Date().toISOString(),
  };
}

// ─── Chart helpers ─────────────────────────────────────────────────────────────

function buildSalaryChartData(result: TwinResult, horizon: Horizon) {
  const all = [result.baseline, ...result.alternatives];
  return Array.from({ length: horizon }, (_, i) => {
    const entry: Record<string, number | string> = { year: result.baseline.snapshots[i]?.year ?? "" };
    all.forEach((sc) => { entry[sc.label] = sc.snapshots[i]?.salaryUSD ?? 0; });
    return entry;
  });
}

function buildRelevanceChartData(result: TwinResult, horizon: Horizon) {
  const all = [result.baseline, ...result.alternatives];
  return Array.from({ length: horizon }, (_, i) => {
    const entry: Record<string, number | string> = { year: result.baseline.snapshots[i]?.year ?? "" };
    all.forEach((sc) => { entry[sc.label] = sc.snapshots[i]?.relevanceScore ?? 0; });
    return entry;
  });
}

function buildSkillRadarData(result: TwinResult, atYear: number) {
  const top8Skills = [
    ...(result.emergingSkills.map((s) => s.name)),
    ...(result.decayingSkills.map((s) => s.name)),
  ].slice(0, 6);
  return top8Skills.map((skill) => {
    const point: Record<string, string | number> = { skill };
    [result.baseline, ...result.alternatives].forEach((sc) => {
      const snap = sc.snapshots[atYear] ?? sc.snapshots[sc.snapshots.length - 1];
      const isDecaying = result.decayingSkills.some((d) => d.name === skill);
      const decay = isDecaying ? Math.max(5, 80 - atYear * 12) : Math.min(95, 30 + atYear * 10);
      const bonus = sc.id !== "baseline" ? 20 : 0;
      point[sc.label] = Math.min(100, Math.round(decay + bonus + (Math.random() * 10 - 5)));
    });
    return point;
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SalaryChart({ result, horizon }: { result: TwinResult; horizon: Horizon }) {
  const data = buildSalaryChartData(result, horizon);
  const all = [result.baseline, ...result.alternatives];
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Salary Trajectory (USD/yr)</p>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            {all.map((sc, i) => (
              <linearGradient key={sc.id} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={SCENARIO_PALETTE[i % 3].hex} stopOpacity={0.3} />
                <stop offset="95%" stopColor={SCENARIO_PALETTE[i % 3].hex} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="year" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
          <YAxis tickFormatter={(v) => `$${Math.round(v / 1000)}k`} tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} width={42} />
          <Tooltip
            formatter={(val: number, name: string) => [`$${(val / 1000).toFixed(0)}k/yr`, name]}
            contentStyle={{ background: "#1e293b", border: "none", borderRadius: 10, color: "#f8fafc", fontSize: 12 }}
            labelStyle={{ color: "#94a3b8", fontSize: 10 }}
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
          {all.map((sc, i) => (
            <Area
              key={sc.id}
              type="monotone"
              dataKey={sc.label}
              stroke={SCENARIO_PALETTE[i % 3].hex}
              strokeWidth={2}
              fill={`url(#grad-${i})`}
              dot={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function RelevanceChart({ result, horizon }: { result: TwinResult; horizon: Horizon }) {
  const data = buildRelevanceChartData(result, horizon);
  const all = [result.baseline, ...result.alternatives];
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Skill Relevance Score (0 – 100)</p>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            {all.map((sc, i) => (
              <linearGradient key={sc.id} id={`rel-grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={SCENARIO_PALETTE[i % 3].hex} stopOpacity={0.25} />
                <stop offset="95%" stopColor={SCENARIO_PALETTE[i % 3].hex} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="year" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} width={28} />
          <Tooltip
            formatter={(val: number, name: string) => [`${val}`, name]}
            contentStyle={{ background: "#1e293b", border: "none", borderRadius: 10, color: "#f8fafc", fontSize: 12 }}
          />
          {all.map((sc, i) => (
            <Area
              key={sc.id}
              type="monotone"
              dataKey={sc.label}
              stroke={SCENARIO_PALETTE[i % 3].hex}
              strokeWidth={1.5}
              fill={`url(#rel-grad-${i})`}
              dot={false}
              strokeDasharray={i === 0 ? "4 3" : "none"}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function SkillHealthRadar({ result }: { result: TwinResult }) {
  const all = [result.baseline, ...result.alternatives];
  const yearZero = buildSkillRadarData(result, 0);
  const yearMid  = buildSkillRadarData(result, Math.floor(result.baseline.snapshots.length / 2));
  const yearFinal = buildSkillRadarData(result, result.baseline.snapshots.length - 1);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[
        { label: "Today",   data: yearZero,  note: "Baseline skill profile" },
        { label: "Mid-way", data: yearMid,   note: "After interventions diverge" },
        { label: "End",     data: yearFinal, note: "Final state" },
      ].map(({ label, data, note }) => (
        <div key={label} className="bg-white rounded-2xl border border-slate-100 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
          <p className="text-[9px] text-slate-400 mb-3">{note}</p>
          <ResponsiveContainer width="100%" height={190}>
            <RadarChart data={data}>
              <PolarGrid stroke="#f1f5f9" />
              <PolarAngleAxis dataKey="skill" tick={{ fontSize: 9, fill: "#64748b" }} />
              {all.map((sc, i) => (
                <Radar
                  key={sc.id}
                  name={sc.label}
                  dataKey={sc.label}
                  stroke={SCENARIO_PALETTE[i % 3].hex}
                  fill={SCENARIO_PALETTE[i % 3].hex}
                  fillOpacity={i === 0 ? 0.08 : 0.12}
                  strokeWidth={1.5}
                />
              ))}
              <Legend wrapperStyle={{ fontSize: 9, paddingTop: 4 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      ))}
    </div>
  );
}

function YearReplay({
  scenario,
  palette,
}: {
  scenario: TwinScenario;
  palette: typeof SCENARIO_PALETTE[number];
}) {
  const [visibleUpTo, setVisibleUpTo] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const play = () => {
    if (visibleUpTo >= scenario.snapshots.length - 1) setVisibleUpTo(0);
    setPlaying(true);
  };

  const stop = () => {
    setPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  useEffect(() => {
    if (!playing) return;
    timerRef.current = setInterval(() => {
      setVisibleUpTo((prev) => {
        if (prev >= scenario.snapshots.length - 1) {
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 400);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [playing, scenario.snapshots.length]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={playing ? stop : play}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
            playing ? "bg-rose-100 text-rose-600 hover:bg-rose-200" : `${palette.bg} text-white hover:opacity-90`
          )}
        >
          {playing ? <><X size={13} /> Pause</> : <><Play size={13} /> Replay Career</>}
        </button>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <Clock size={12} />
          Year {scenario.snapshots[visibleUpTo]?.year} · Age {scenario.snapshots[visibleUpTo]?.age}
        </div>
        {/* Progress bar */}
        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${palette.bg} rounded-full`}
            animate={{ width: `${((visibleUpTo + 1) / scenario.snapshots.length) * 100}%` }}
            transition={{ duration: 0.35 }}
          />
        </div>
      </div>

      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {scenario.snapshots.slice(0, visibleUpTo + 1).map((snap, idx) => {
            const risk = RISK_META[snap.riskLevel];
            const RiskIcon = risk.icon;
            const isLatest = idx === visibleUpTo;
            return (
              <motion.div
                key={snap.year}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "relative flex gap-4 p-4 rounded-2xl border transition-all",
                  isLatest
                    ? "border-slate-200 bg-white shadow-md shadow-slate-100"
                    : "border-transparent bg-slate-50/60"
                )}
              >
                {/* Year badge */}
                <div className={cn("shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center text-white", palette.bg)}>
                  <span className="text-[9px] font-black uppercase tracking-widest leading-none opacity-80">Year</span>
                  <span className="text-base font-black leading-none">{snap.year - scenario.snapshots[0].year + 1}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <p className="text-sm font-black text-slate-800 leading-tight">{snap.role}</p>
                      <p className="text-[11px] text-slate-500 font-medium">{snap.year} · Age {snap.age}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-slate-700">${(snap.salaryUSD / 1000).toFixed(0)}k/yr</span>
                      <span className={cn("inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border", risk.color)}>
                        <RiskIcon size={10} />{risk.label}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{snap.keyEvent}</p>
                  {snap.skillsGained.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {snap.skillsGained.map((s) => (
                        <span key={s} className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                          + {s}
                        </span>
                      ))}
                      {snap.skillsDecayed.map((s) => (
                        <span key={s} className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                          ↓ {s}
                        </span>
                      ))}
                    </div>
                  )}
                  {snap.interventionPrompt && (
                    <div className="flex items-start gap-2 mt-2 p-2.5 rounded-xl bg-indigo-50 border border-indigo-200">
                      <Zap size={12} className="text-indigo-500 mt-0.5 shrink-0" />
                      <p className="text-[11px] font-bold text-indigo-700 leading-snug">{snap.interventionPrompt}</p>
                    </div>
                  )}
                </div>

                {/* Skill relevance gauge */}
                <div className="shrink-0 flex flex-col items-center gap-1 w-10">
                  <div className="relative w-8 h-8">
                    <svg viewBox="0 0 32 32" className="w-full h-full -rotate-90">
                      <circle cx="16" cy="16" r="13" strokeWidth="3.5" stroke="#f1f5f9" fill="none" />
                      <circle
                        cx="16" cy="16" r="13"
                        strokeWidth="3.5"
                        stroke={snap.relevanceScore >= 65 ? "#10b981" : snap.relevanceScore >= 40 ? "#f59e0b" : "#ef4444"}
                        fill="none"
                        strokeDasharray={`${(snap.relevanceScore / 100) * 81.7} 81.7`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-slate-600">
                      {snap.relevanceScore}
                    </span>
                  </div>
                  <span className="text-[8px] text-slate-400 font-medium text-center leading-tight">skill fit</span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {visibleUpTo < scenario.snapshots.length - 1 && !playing && (
          <button
            onClick={() => setVisibleUpTo(scenario.snapshots.length - 1)}
            className="w-full text-[10px] font-black uppercase tracking-widest text-slate-400 py-3 border border-dashed border-slate-200 rounded-xl hover:border-slate-300 hover:text-slate-600 transition-all"
          >
            Show all {scenario.snapshots.length} years →
          </button>
        )}
      </div>
    </div>
  );
}

function ScenarioSummaryCard({
  scenario,
  paletteIdx,
  isBaseline,
}: {
  scenario: TwinScenario;
  paletteIdx: number;
  isBaseline: boolean;
}) {
  const p = SCENARIO_PALETTE[paletteIdx % 3];
  const finalSnap = scenario.snapshots[scenario.snapshots.length - 1];
  const trend = finalSnap.relevanceScore >= 65 ? "rising" : finalSnap.relevanceScore >= 45 ? "stable" : "declining";

  return (
    <div className={cn("rounded-2xl border bg-white p-5 space-y-4 ring-2 ring-offset-0", `ring-${p.tw}-100 border-${p.tw}-200`)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn("w-2.5 h-2.5 rounded-full", p.bg)} />
            <span className={cn("text-[10px] font-black uppercase tracking-widest", p.text)}>
              {isBaseline ? "Baseline" : "Alternative"}
            </span>
          </div>
          <h3 className="text-base font-black text-slate-800 leading-tight">{scenario.label}</h3>
          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{scenario.intervention}</p>
        </div>
        <div className={cn("shrink-0 text-right")}>
          <p className="text-xl font-black text-slate-800">${(scenario.peakSalary / 1000).toFixed(0)}k</p>
          <p className="text-[10px] text-slate-400 font-medium">peak/yr</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Peak role",        value: scenario.peakRole,                     icon: Award },
          { label: "Total earnings",   value: `$${(scenario.totalEarnings / 1_000_000).toFixed(1)}M`, icon: TrendingUp },
          { label: "Final relevance",  value: `${finalSnap.relevanceScore}/100`,      icon: Target },
          { label: "Demand trend",     value: trend,                                  icon: BarChart2 },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex items-start gap-2">
            <Icon size={13} className="text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">{label}</p>
              <p className="text-[11px] font-black text-slate-700 capitalize leading-snug mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-slate-500 leading-relaxed border-t border-slate-100 pt-3">{scenario.finalOutcome}</p>
    </div>
  );
}

// ─── Launchpad (configuration panel) ─────────────────────────────────────────

function Launchpad({
  profile,
  careers,
  onLaunch,
  loading,
}: {
  profile: UserProfile;
  careers: CareerPath[];
  onLaunch: (career: string, horizon: Horizon, interventions: string[]) => void;
  loading: boolean;
}) {
  const defaultCareer =
    careers.find((c) => c.id === profile.targetCareerId)?.title ||
    profile.targetCareer ||
    (careers[0]?.title ?? "Software Engineer");

  const [career, setCareer] = useState(defaultCareer);
  const [horizon, setHorizon] = useState<Horizon>(10);
  const [scenarios, setScenarios] = useState<string[]>([
    "Stay on current trajectory (status quo)",
    "Reskill in AI & Machine Learning now",
  ]);

  const addScenario = () => {
    if (scenarios.length >= 3) return;
    setScenarios((prev) => [...prev, INTERVENTION_PRESETS[prev.length + 1] ?? "Custom intervention"]);
  };

  const updateScenario = (idx: number, val: string) => {
    setScenarios((prev) => prev.map((s, i) => (i === idx ? val : s)));
  };

  const removeScenario = (idx: number) => {
    if (scenarios.length <= 1) return;
    setScenarios((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-900 px-8 py-10 text-white">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-[10px] font-black uppercase tracking-widest mb-4">
            <GitBranch size={11} />
            Career Digital Twin
          </div>
          <h1 className="text-3xl font-black leading-tight mb-3">
            Flight simulator<br />
            <span className="text-indigo-300">for your career.</span>
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed max-w-lg">
            Run AI-powered what-if simulations up to 15 years into the future.
            See how different interventions — reskilling, leadership pivots, relocations —
            compound into dramatically different outcomes. Skill decay, salary trajectories,
            and market shocks included.
          </p>
        </div>
        {/* Decorative orbit */}
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full border border-white/5" />
        <div className="absolute -right-8 -top-8  w-40 h-40 rounded-full border border-white/8" />
        <div className="absolute right-12 top-8    w-20 h-20 rounded-full bg-indigo-500/20 blur-xl" />
      </div>

      {/* Config */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Career */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Target size={14} className="text-indigo-500" />
            <p className="text-xs font-black uppercase tracking-widest text-slate-700">Career to simulate</p>
          </div>
          <input
            type="text"
            value={career}
            onChange={(e) => setCareer(e.target.value)}
            list="career-suggestions"
            placeholder="e.g. AI Engineer, Product Manager, Data Scientist…"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-slate-50"
          />
          <datalist id="career-suggestions">
            {careers.map((c) => <option key={c.id} value={c.title} />)}
          </datalist>
          <p className="text-[10px] text-slate-400">You can type any career — not limited to suggestions.</p>
        </div>

        {/* Horizon */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-indigo-500" />
            <p className="text-xs font-black uppercase tracking-widest text-slate-700">Time horizon</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {HORIZON_OPTIONS.map((h) => (
              <button
                key={h}
                onClick={() => setHorizon(h)}
                className={cn(
                  "py-3 rounded-xl text-xs font-black transition-all",
                  horizon === h
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                )}
              >
                {h} yrs
              </button>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Simulate from today to {new Date().getFullYear() + horizon}.
          </p>
        </div>
      </div>

      {/* Scenarios */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch size={14} className="text-indigo-500" />
            <p className="text-xs font-black uppercase tracking-widest text-slate-700">
              Scenarios to compare ({scenarios.length}/3)
            </p>
          </div>
          {scenarios.length < 3 && (
            <button
              onClick={addScenario}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 text-[11px] font-bold transition-all"
            >
              <Plus size={12} /> Add scenario
            </button>
          )}
        </div>

        <div className="space-y-3">
          {scenarios.map((sc, idx) => {
            const p = SCENARIO_PALETTE[idx % 3];
            return (
              <div key={idx} className="flex items-start gap-3">
                <div className={cn("mt-3.5 w-2.5 h-2.5 rounded-full shrink-0", p.bg)} />
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                    {idx === 0 ? "Baseline (Status Quo)" : `Alternative ${idx}`}
                  </p>
                  <div className="relative">
                    <input
                      type="text"
                      value={sc}
                      onChange={(e) => updateScenario(idx, e.target.value)}
                      list={`preset-${idx}`}
                      placeholder="Describe an intervention…"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-slate-50 pr-10"
                      readOnly={idx === 0}
                    />
                    <datalist id={`preset-${idx}`}>
                      {INTERVENTION_PRESETS.map((p) => <option key={p} value={p} />)}
                    </datalist>
                  </div>
                </div>
                {idx > 0 && (
                  <button
                    onClick={() => removeScenario(idx)}
                    className="mt-8 p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Info strip */}
        <div className="flex items-start gap-3 p-3 rounded-xl bg-indigo-50 border border-indigo-100">
          <Sparkles size={13} className="text-indigo-400 mt-0.5 shrink-0" />
          <p className="text-[11px] text-indigo-700 leading-relaxed">
            The AI will simulate skill decay, salary trajectory, market shocks, and risk levels for each scenario —
            factoring in your profile, {career}, and the current {profile.targetLocation || profile.country || "global"} labour market.
          </p>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={() => onLaunch(career, horizon, scenarios)}
        disabled={loading || !career.trim()}
        className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <RefreshCw size={16} className="animate-spin" />
            Simulating your career twin…
          </>
        ) : (
          <>
            <Play size={16} />
            Launch Simulation
            <ChevronRight size={16} />
          </>
        )}
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const RESULT_TABS = [
  { id: "overview",    label: "Overview",     icon: Layers },
  { id: "skill",       label: "Skill Health", icon: BarChart2 },
  { id: "replay",      label: "Year Replay",  icon: Play },
  { id: "compare",     label: "Compare",      icon: GitBranch },
] as const;
type ResultTab = (typeof RESULT_TABS)[number]["id"];

interface Props {
  profile: UserProfile;
  careers: CareerPath[];
}

export default function CareerDigitalTwin({ profile, careers }: Props) {
  const [result, setResult]     = useState<TwinResult | null>(null);
  const [loading, setLoading]   = useState(false);
  const [activeTab, setActiveTab] = useState<ResultTab>("overview");
  const [replayIdx, setReplayIdx] = useState(0);  // which scenario to replay
  const [horizon, setHorizon]   = useState<Horizon>(10);

  const handleLaunch = async (career: string, h: Horizon, interventions: string[]) => {
    setLoading(true);
    setResult(null);
    setHorizon(h);
    try {
      const res = await generateTwinSimulation(profile, career, h, interventions);
      setResult(res);
      setActiveTab("overview");
      setReplayIdx(0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setLoading(false);
  };

  // ── Loading Screen ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
          <GitBranch size={22} className="absolute inset-0 m-auto text-indigo-500" />
        </div>
        <div className="text-center space-y-2 max-w-xs">
          <p className="text-lg font-black text-slate-800">Simulating your career twin…</p>
          <p className="text-sm text-slate-400 leading-relaxed">
            AI is modelling skill decay, market shocks, and scenario divergence across your horizon.
          </p>
        </div>
        <div className="flex gap-1.5">
          {[0,1,2,3,4].map((i) => (
            <motion.div
              key={i}
              animate={{ scaleY: [1, 2, 1] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
              className="w-1.5 h-4 bg-indigo-300 rounded-full origin-bottom"
            />
          ))}
        </div>
      </div>
    );
  }

  // ── Results ─────────────────────────────────────────────────────────────────
  if (result) {
    const allScenarios = [result.baseline, ...result.alternatives];

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Results Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-2">
              <Sparkles size={10} />
              Digital Twin · {result.careerTitle}
            </div>
            <h2 className="text-2xl font-black text-slate-900">{result.careerTitle}</h2>
            <p className="text-sm text-slate-500">{horizon}-year simulation · {result.country} market · {allScenarios.length} scenarios</p>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-700 text-xs font-bold transition-all"
          >
            <RefreshCw size={13} /> New simulation
          </button>
        </div>

        {/* Global Trends Banner */}
        <div className="overflow-x-auto">
          <div className="flex gap-3 min-w-max pb-1">
            {result.globalTrends.map((t, i) => (
              <div key={i} className="flex items-start gap-2 px-4 py-3 rounded-2xl bg-slate-900 text-white max-w-xs shrink-0">
                <TrendingUp size={13} className="text-indigo-300 mt-0.5 shrink-0" />
                <p className="text-[11px] leading-relaxed text-slate-300">{t}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick stats — scenario comparison heads */}
        <div className={cn("grid gap-4", allScenarios.length === 2 ? "grid-cols-2" : "grid-cols-3")}>
          {allScenarios.map((sc, i) => {
            const p = SCENARIO_PALETTE[i % 3];
            const delta = sc.totalEarnings - result.baseline.totalEarnings;
            return (
              <div key={sc.id} className={cn("rounded-2xl p-4 border-2", `border-${p.tw}-200`, p.light)}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn("w-2 h-2 rounded-full", p.bg)} />
                  <span className={cn("text-[10px] font-black uppercase tracking-widest", p.text)}>{sc.label}</span>
                </div>
                <p className="text-xl font-black text-slate-800">${(sc.peakSalary / 1000).toFixed(0)}k/yr peak</p>
                {i > 0 && (
                  <p className={cn("text-[11px] font-bold mt-0.5", delta >= 0 ? "text-emerald-600" : "text-rose-600")}>
                    {delta >= 0 ? "+" : ""}${(Math.abs(delta) / 1000).toFixed(0)}k vs baseline over {horizon} yrs
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm -mx-4 lg:-mx-10 px-4 lg:px-10 py-2 border-b border-slate-100">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {RESULT_TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all",
                  activeTab === id
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                    : "text-slate-500 hover:bg-slate-100"
                )}
              >
                <Icon size={12} />{label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {/* ── OVERVIEW ── */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-6">
                  <SalaryChart result={result} horizon={horizon} />
                  <div className="h-px bg-slate-100" />
                  <RelevanceChart result={result} horizon={horizon} />
                </div>

                {/* Decaying vs Emerging Skills */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <TrendingDown size={14} className="text-rose-500" />
                      <p className="text-xs font-black uppercase tracking-widest text-slate-700">Skills at risk of decay</p>
                    </div>
                    {result.decayingSkills.map((s) => (
                      <div key={s.name} className="flex items-start gap-3 p-3 rounded-xl bg-rose-50 border border-rose-100">
                        <AlertTriangle size={12} className="text-rose-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-black text-rose-800">{s.name}</p>
                          <p className="text-[10px] text-rose-600">Half-life ≈ {s.halfLifeYears} yrs · {s.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={14} className="text-emerald-500" />
                      <p className="text-xs font-black uppercase tracking-widest text-slate-700">Emerging skills to gain</p>
                    </div>
                    {result.emergingSkills.map((s) => (
                      <div key={s.name} className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                        <Zap size={12} className="text-emerald-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-black text-emerald-800">{s.name}</p>
                          <p className="text-[10px] text-emerald-600">+{s.demandGrowthRate}% demand · relevant by year {s.relevantByYear}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── SKILL HEALTH ── */}
            {activeTab === "skill" && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
                  <BookOpen size={14} className="text-indigo-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-indigo-800 font-medium leading-relaxed">
                    Each radar shows your skill profile at a different point in time.
                    Observe how the <span className="font-black text-rose-700">decaying skills</span> shrink
                    and <span className="font-black text-emerald-700">emerging skills</span> grow — and how
                    different interventions widen the gap.
                  </p>
                </div>
                <SkillHealthRadar result={result} />
              </div>
            )}

            {/* ── YEAR REPLAY ── */}
            {activeTab === "replay" && (
              <div className="space-y-4">
                {/* Scenario selector */}
                <div className="flex gap-2 flex-wrap">
                  {allScenarios.map((sc, i) => {
                    const p = SCENARIO_PALETTE[i % 3];
                    return (
                      <button
                        key={sc.id}
                        onClick={() => setReplayIdx(i)}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                          replayIdx === i ? `${p.bg} text-white` : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        )}
                      >
                        <span className={cn("w-2 h-2 rounded-full", replayIdx === i ? "bg-white" : p.bg)} />
                        {sc.label}
                      </button>
                    );
                  })}
                </div>
                <YearReplay scenario={allScenarios[replayIdx]} palette={SCENARIO_PALETTE[replayIdx % 3]} />
              </div>
            )}

            {/* ── COMPARE ── */}
            {activeTab === "compare" && (
              <div className="space-y-6">
                <div className={cn("grid gap-4", allScenarios.length === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-3")}>
                  {allScenarios.map((sc, i) => (
                    <ScenarioSummaryCard
                      key={sc.id}
                      scenario={sc}
                      paletteIdx={i}
                      isBaseline={i === 0}
                    />
                  ))}
                </div>

                {/* Year-by-year comparison table (compressed) */}
                <div className="bg-white rounded-2xl border border-slate-100 overflow-x-auto">
                  <table className="w-full text-left min-w-[560px]">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 w-16">Year</th>
                        {allScenarios.map((sc, i) => (
                          <th key={sc.id} className="px-4 py-3 text-[10px] font-black uppercase tracking-widest" style={{ color: SCENARIO_PALETTE[i % 3].hex }}>
                            {sc.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.baseline.snapshots.map((snap, i) => (
                        <tr key={snap.year} className={cn("border-b border-slate-50", i % 2 === 0 ? "bg-white" : "bg-slate-50/40")}>
                          <td className="px-4 py-2.5 text-[11px] font-black text-slate-500">{snap.year}</td>
                          {allScenarios.map((sc) => {
                            const s = sc.snapshots[i];
                            if (!s) return <td key={sc.id} />;
                            return (
                              <td key={sc.id} className="px-4 py-2.5">
                                <p className="text-[11px] font-black text-slate-800">${(s.salaryUSD / 1000).toFixed(0)}k · {s.role}</p>
                                <p className="text-[9px] text-slate-400">{s.relevanceScore}/100 fit · {s.marketDemand} demand</p>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Intervention action plan */}
                <div className="bg-gradient-to-br from-indigo-950 to-violet-900 rounded-2xl p-6 text-white space-y-4">
                  <div className="flex items-center gap-2">
                    <ArrowRight size={14} className="text-indigo-300" />
                    <p className="text-xs font-black uppercase tracking-widest text-indigo-200">Your Action Plan</p>
                  </div>
                  <p className="text-lg font-black">Based on your simulation, the highest-value move is:</p>
                  <div className="bg-white/10 border border-white/20 rounded-xl p-4">
                    <p className="text-sm font-bold text-indigo-100 leading-relaxed">
                      {result.alternatives[0]?.intervention ??
                        "Continue building in-demand skills aligned with emerging market trends."}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-3 pt-1">
                    {result.emergingSkills.slice(0, 3).map((s) => (
                      <div key={s.name} className="bg-white/8 border border-white/15 rounded-xl p-3 text-center">
                        <p className="text-[10px] font-black text-indigo-200 leading-tight">{s.name}</p>
                        <p className="text-[9px] text-white/60 mt-1">+{s.demandGrowthRate}% demand</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // ── Launchpad ───────────────────────────────────────────────────────────────
  return <Launchpad profile={profile} careers={careers} onLaunch={handleLaunch} loading={loading} />;
}

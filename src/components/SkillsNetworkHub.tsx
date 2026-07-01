/**
 * SkillsNetworkHub — Two-panel feature:
 * 1. Algorithmic Learning Trajectories (skill gap → certification roadmaps)
 * 2. Networking Copilot (contact discovery + outreach drafting)
 */

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  GraduationCap, Users, Target, ExternalLink, Clock,
  Loader2, Sparkles, ChevronRight, RefreshCw, Copy,
  CheckCircle, MapPin, Briefcase, Mail, Linkedin,
  AlertTriangle, BookOpen, Award, Rocket,
  ArrowRight, Calendar, Star, Building2, UserPlus,
  MessageSquare, Send, Zap,
} from "lucide-react";
import { cn } from "../lib/utils";
import {
  getLearningTrajectories,
  getNetworkingCopilot,
  getCareerSkillGap,
  type LearningTrajectory,
  type LearningStep,
  type NetworkingCopilotResult,
  type NetworkContact,
  type OutreachDraft,
} from "../services/careerAiProxy";
import type { CareerSkillGap, UserProfile } from "../types/career";

// ─── Props ──────────────────────────────────────────────────────────────────

interface Props {
  profile: UserProfile;
  careerTitle: string;
  skillGaps: CareerSkillGap[];
}

type HubTab = "learning" | "networking";

// ─── Helpers ────────────────────────────────────────────────────────────────

function ProgressBar({ value, max, className }: { value: number; max: number; className?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className={cn("h-2 bg-slate-100 rounded-full overflow-hidden", className)}>
      <div
        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-700"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="p-1.5 rounded-lg hover:bg-slate-100 transition-all" title="Copy to clipboard">
      {copied ? <CheckCircle size={13} className="text-emerald-500" /> : <Copy size={13} className="text-slate-400" />}
    </button>
  );
}

const STEP_ICONS: Record<string, React.ElementType> = {
  course: BookOpen,
  certification: Award,
  project: Rocket,
  bootcamp: Zap,
};

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "bg-emerald-100 text-emerald-700 border-emerald-200",
  intermediate: "bg-amber-100 text-amber-700 border-amber-200",
  advanced: "bg-rose-100 text-rose-700 border-rose-200",
};

const SENIORITY_COLORS: Record<string, string> = {
  entry: "bg-slate-100 text-slate-600",
  mid: "bg-blue-100 text-blue-700",
  senior: "bg-indigo-100 text-indigo-700",
  director: "bg-violet-100 text-violet-700",
  vp: "bg-purple-100 text-purple-700",
  "c-suite": "bg-amber-100 text-amber-700",
};

const CONNECTION_ICONS: Record<string, React.ElementType> = {
  alumni: GraduationCap,
  recruiter: UserPlus,
  "hiring-manager": Briefcase,
  "team-lead": Star,
  referral: Users,
};

// ─── Main Component ─────────────────────────────────────────────────────────

export default function SkillsNetworkHub({ profile, careerTitle, skillGaps: initialSkillGaps }: Props) {
  const [activeTab, setActiveTab] = useState<HubTab>("learning");

  // Self-fetch skill gaps if not provided
  const [skillGaps, setSkillGaps] = useState<CareerSkillGap[]>(initialSkillGaps);
  const [skillGapLoading, setSkillGapLoading] = useState(false);

  useEffect(() => {
    if (initialSkillGaps.length > 0 || !careerTitle) return;
    setSkillGapLoading(true);
    getCareerSkillGap(profile, careerTitle)
      .then(setSkillGaps)
      .catch(() => {})
      .finally(() => setSkillGapLoading(false));
  }, [careerTitle, initialSkillGaps.length, profile]);

  // Learning state
  const [trajectories, setTrajectories] = useState<LearningTrajectory[]>([]);
  const [learningLoading, setLearningLoading] = useState(false);
  const [learningLoaded, setLearningLoaded] = useState(false);

  // Networking state
  const [targetCompany, setTargetCompany] = useState("");
  const [targetRole, setTargetRole] = useState(careerTitle || "");
  const [networkResult, setNetworkResult] = useState<NetworkingCopilotResult | null>(null);
  const [networkLoading, setNetworkLoading] = useState(false);
  const [expandedContact, setExpandedContact] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  // ─── Load Learning Trajectories ─────────────────────────────────────────

  const loadTrajectories = useCallback(async () => {
    if (skillGaps.length === 0) {
      setError("No skill gap data available. Run Skill Gap Analysis first.");
      return;
    }
    setLearningLoading(true);
    setError(null);
    try {
      const result = await getLearningTrajectories(profile, careerTitle, skillGaps);
      setTrajectories(result);
      setLearningLoaded(true);
    } catch (err: any) {
      setError(err.message || "Failed to generate learning trajectories");
    } finally {
      setLearningLoading(false);
    }
  }, [profile, careerTitle, skillGaps]);

  // ─── Load Networking Copilot ────────────────────────────────────────────

  const loadNetworkingPlan = useCallback(async () => {
    if (!targetCompany.trim() || !targetRole.trim()) {
      setError("Enter a target company and role first.");
      return;
    }
    setNetworkLoading(true);
    setError(null);
    try {
      const result = await getNetworkingCopilot(profile, targetCompany, targetRole);
      setNetworkResult(result);
    } catch (err: any) {
      setError(err.message || "Failed to generate networking plan");
    } finally {
      setNetworkLoading(false);
    }
  }, [profile, targetCompany, targetRole]);

  // ─── Render ─────────────────────────────────────────────────────────────

  const missingCount = skillGaps.filter(s => !s.owned).length;
  const totalGapPct = skillGaps.length > 0
    ? Math.round((skillGaps.filter(s => s.owned).length / skillGaps.length) * 100)
    : 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 via-emerald-600 to-green-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-2 mb-1">
          <Target size={16} className="text-amber-300" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-200">Skills & Network Acquisition</p>
        </div>
        <h2 className="text-lg font-black">Bridge Your Skill Gaps & Build Strategic Connections</h2>
        <p className="text-xs text-teal-200 mt-1">
          {missingCount > 0
            ? `${missingCount} skills to acquire for "${careerTitle}" — ${100 - totalGapPct}% gap remaining.`
            : `Strengthen your ${careerTitle} profile with advanced certifications and contacts.`
          }
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab("learning")}
          className={cn(
            "flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap",
            activeTab === "learning"
              ? "bg-indigo-600 text-white border-indigo-700 shadow-lg shadow-indigo-200"
              : "bg-white text-slate-600 border-slate-200 hover:border-indigo-200"
          )}
        >
          <GraduationCap size={14} /> Learning Trajectories
        </button>
        <button
          onClick={() => setActiveTab("networking")}
          className={cn(
            "flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap",
            activeTab === "networking"
              ? "bg-violet-600 text-white border-violet-700 shadow-lg shadow-violet-200"
              : "bg-white text-slate-600 border-slate-200 hover:border-violet-200"
          )}
        >
          <Users size={14} /> Networking Copilot
        </button>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 font-medium"
          >
            <AlertTriangle size={16} /> {error}
            <button className="ml-auto text-rose-400 hover:text-rose-600" onClick={() => setError(null)}>×</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB: LEARNING TRAJECTORIES
      ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "learning" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          {/* Skill Gap Summary */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target size={14} className="text-indigo-500" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">Your Skill Gaps</p>
              </div>
              <span className="text-xs font-bold text-slate-500">{totalGapPct}% match</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {skillGaps.map((sg) => (
                <span
                  key={sg.skill}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-[10px] font-bold border",
                    sg.owned
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-rose-50 text-rose-700 border-rose-200"
                  )}
                >
                  {sg.owned ? "✓" : "✗"} {sg.skill} ({sg.demand}% demand)
                </span>
              ))}
            </div>
            {skillGaps.length === 0 && (
              <p className="text-xs text-slate-400 italic">No skill gap data. Run your career skill analysis first.</p>
            )}
          </div>

          {/* Generate Button / Loading */}
          {!learningLoaded && !learningLoading && (
            <div className="flex justify-center">
              <button
                onClick={loadTrajectories}
                disabled={skillGaps.length === 0}
                className="flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-200"
              >
                <Sparkles size={14} /> Generate Learning Roadmap
              </button>
            </div>
          )}

          {learningLoading && (
            <div className="flex flex-col items-center py-16 gap-4 text-slate-500">
              <Loader2 size={40} className="text-indigo-500 animate-spin" />
              <p className="font-bold text-sm">Mapping your certification path…</p>
              <p className="text-xs text-slate-400">Analyzing course catalogs & skill requirements</p>
            </div>
          )}

          {/* Trajectory Cards */}
          {learningLoaded && trajectories.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">
                  {trajectories.length} Skill Trajectories Generated
                </p>
                <button
                  onClick={loadTrajectories}
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-bold"
                >
                  <RefreshCw size={12} /> Regenerate
                </button>
              </div>

              {trajectories.map((traj) => (
                <TrajectoryCard key={traj.skill} trajectory={traj} />
              ))}
            </div>
          )}

          {learningLoaded && trajectories.length === 0 && !error && (
            <div className="text-center py-12 text-slate-400">
              <GraduationCap size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">No trajectories generated</p>
              <p className="text-xs">Your skills may already be well-matched!</p>
            </div>
          )}
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB: NETWORKING COPILOT
      ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "networking" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          {/* Target Input */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Building2 size={14} className="text-violet-500" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">Target Organization</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Company *</label>
                <input
                  value={targetCompany}
                  onChange={(e) => setTargetCompany(e.target.value)}
                  placeholder="Google, Microsoft, Deloitte…"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Target Role *</label>
                <input
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="Software Engineer, Data Analyst…"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-50"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={loadNetworkingPlan}
                disabled={!targetCompany.trim() || !targetRole.trim() || networkLoading}
                className="flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-violet-200"
              >
                {networkLoading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                {networkLoading ? "Scanning…" : "Find Contacts & Draft Outreach"}
              </button>
            </div>
          </div>

          {/* Loading */}
          {networkLoading && (
            <div className="flex flex-col items-center py-16 gap-4 text-slate-500">
              <Loader2 size={40} className="text-violet-500 animate-spin" />
              <p className="font-bold text-sm">Scanning organization & building outreach plan…</p>
              <p className="text-xs text-slate-400">Identifying contacts, drafting messages, scheduling follow-ups</p>
            </div>
          )}

          {/* Results */}
          {networkResult && !networkLoading && (
            <div className="space-y-5">
              {/* Strategy Banner */}
              {networkResult.strategy && (
                <div className="bg-violet-50 rounded-2xl border border-violet-200 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={14} className="text-violet-600" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-violet-700">Networking Strategy</p>
                  </div>
                  <p className="text-sm text-violet-900 leading-relaxed">{networkResult.strategy}</p>
                </div>
              )}

              {/* Contacts */}
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">
                  {networkResult.contacts.length} Contacts Identified
                </p>
                {networkResult.contacts.map((contact) => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    draft={networkResult.outreachDrafts.find(d => d.contactId === contact.id)}
                    expanded={expandedContact === contact.id}
                    onToggle={() => setExpandedContact(expandedContact === contact.id ? null : contact.id)}
                  />
                ))}
              </div>

              {/* Follow-Up Schedule */}
              {networkResult.followUpSchedule.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar size={14} className="text-indigo-500" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">Follow-Up Schedule</p>
                  </div>
                  <div className="space-y-2">
                    {networkResult.followUpSchedule.map((item, i) => {
                      const contact = networkResult.contacts.find(c => c.id === item.contactId);
                      return (
                        <div key={i} className="flex items-center gap-3 px-3 py-2 bg-slate-50 rounded-xl">
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[9px] font-black rounded-lg">
                            Day {item.daysFromNow}
                          </span>
                          <span className="text-xs text-slate-700 font-medium">{item.action}</span>
                          {contact && (
                            <span className="text-[10px] text-slate-400 ml-auto">{contact.name}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {!networkResult && !networkLoading && (
            <div className="text-center py-12 text-slate-400">
              <Users size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">Enter a target company & role above</p>
              <p className="text-xs">The copilot will find contacts and draft personalized outreach messages.</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

// ─── Sub-Components ─────────────────────────────────────────────────────────

function TrajectoryCard({ trajectory }: { trajectory: LearningTrajectory }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-bold text-slate-900 truncate">{trajectory.skill}</p>
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[9px] font-black rounded-lg shrink-0">
              {trajectory.estimatedWeeks}w
            </span>
          </div>
          <ProgressBar value={trajectory.currentLevel} max={trajectory.targetLevel} className="mb-1" />
          <div className="flex items-center gap-3 text-[10px] text-slate-500">
            <span>Current: <b className="text-slate-700">{trajectory.currentLevel}%</b></span>
            <ArrowRight size={10} />
            <span>Target: <b className="text-indigo-700">{trajectory.targetLevel}%</b></span>
            <span className="ml-auto text-rose-500 font-bold">{trajectory.gap}% gap</span>
          </div>
        </div>
        <ChevronRight size={16} className={cn("text-slate-400 transition-transform", expanded && "rotate-90")} />
      </button>

      {/* Steps */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-3 border-t border-slate-100 pt-4">
              {trajectory.steps
                .sort((a, b) => a.priority - b.priority)
                .map((step, idx) => (
                  <StepCard key={step.id} step={step} index={idx} />
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StepCard({ step, index }: { step: LearningStep; index: number }) {
  const Icon = STEP_ICONS[step.type] || BookOpen;
  const diffColor = DIFFICULTY_COLORS[step.difficulty] || DIFFICULTY_COLORS.intermediate;

  return (
    <div className="flex gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
      <div className="flex flex-col items-center gap-1">
        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
          <Icon size={14} className="text-indigo-600" />
        </div>
        <span className="text-[8px] font-black text-slate-400">{index + 1}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-bold text-slate-800 leading-tight">{step.title}</p>
          <a
            href={step.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 hover:bg-indigo-100 rounded-lg transition-colors shrink-0"
          >
            <ExternalLink size={12} className="text-indigo-500" />
          </a>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
          <span className="text-[9px] font-bold text-slate-500">{step.provider}</span>
          <span className="text-slate-300">·</span>
          <span className={cn("px-1.5 py-0.5 rounded text-[8px] font-black uppercase border", diffColor)}>
            {step.difficulty}
          </span>
          <span className="text-slate-300">·</span>
          <span className="text-[9px] text-slate-500 flex items-center gap-0.5">
            <Clock size={9} /> {step.duration}
          </span>
          <span className="text-slate-300">·</span>
          <span className="text-[9px] font-bold text-emerald-600">{step.cost}</span>
        </div>
        <p className="text-[10px] text-slate-500 mt-1.5">{step.reason}</p>
        {step.skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {step.skills.map(s => (
              <span key={s} className="px-1.5 py-0.5 bg-white border border-slate-200 text-[8px] font-medium text-slate-600 rounded">
                {s}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ContactCard({ contact, draft, expanded, onToggle }: {
  contact: NetworkContact;
  draft?: OutreachDraft;
  expanded: boolean;
  onToggle: () => void;
}) {
  const ConnIcon = CONNECTION_ICONS[contact.connectionType] || Users;
  const seniorityColor = SENIORITY_COLORS[contact.seniority] || SENIORITY_COLORS.mid;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
          <ConnIcon size={18} className="text-violet-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-slate-900">{contact.name}</p>
            <span className={cn("px-2 py-0.5 rounded-lg text-[8px] font-black uppercase", seniorityColor)}>
              {contact.seniority}
            </span>
          </div>
          <p className="text-xs text-slate-600 truncate">{contact.role} · {contact.department}</p>
          <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400">
            <span className="flex items-center gap-0.5"><Building2 size={9} /> {contact.company}</span>
            <span className="flex items-center gap-0.5"><Users size={9} /> {contact.mutualConnections} mutual</span>
            <span className="font-bold text-violet-600">{contact.relevanceScore}% match</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <a
            href={contact.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <Linkedin size={14} className="text-blue-600" />
          </a>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-3 border-t border-slate-100 pt-4">
              {/* Reason & Timing */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-[9px] font-black uppercase text-slate-500 mb-1">Why Reach Out</p>
                  <p className="text-xs text-slate-700">{contact.reason}</p>
                </div>
                <div className="p-3 bg-violet-50 rounded-xl">
                  <p className="text-[9px] font-black uppercase text-violet-600 mb-1">Timing</p>
                  <p className="text-xs text-violet-800 font-medium">{contact.reachOutTiming}</p>
                </div>
              </div>

              {/* Outreach Draft */}
              {draft && (
                <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {draft.channel === "linkedin" && <Linkedin size={12} className="text-blue-600" />}
                      {draft.channel === "email" && <Mail size={12} className="text-slate-600" />}
                      <p className="text-[9px] font-black uppercase text-indigo-700">
                        {draft.channel} Message Draft
                      </p>
                      <span className="px-1.5 py-0.5 bg-white border border-indigo-200 text-[8px] font-bold text-indigo-600 rounded">
                        {draft.tone}
                      </span>
                    </div>
                    <CopyButton text={draft.body} />
                  </div>
                  {draft.subject && (
                    <p className="text-[10px] text-indigo-600 font-bold">Subject: {draft.subject}</p>
                  )}
                  <p className="text-xs text-indigo-900 leading-relaxed whitespace-pre-wrap">{draft.body}</p>
                  <div className="flex items-start gap-2 pt-2 border-t border-indigo-100">
                    <Send size={10} className="text-indigo-400 mt-0.5" />
                    <p className="text-[10px] text-indigo-600"><b>CTA:</b> {draft.callToAction}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <MessageSquare size={10} className="text-indigo-400 mt-0.5" />
                    <p className="text-[10px] text-indigo-500 italic">{draft.personalizationNotes}</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

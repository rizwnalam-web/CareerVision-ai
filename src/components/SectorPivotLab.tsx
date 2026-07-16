/**
 * SectorPivotLab — AI-Driven Sector Pivot Certification
 *
 * End-to-end flow:
 *   1. Select Sector Pivot  — AI recommends target sectors based on background
 *   2. Get AI-Scoped Project — Structured 3-part capstone project
 *   3. Submit Milestones     — Write/upload deliverables inline
 *   4. AI/Peer Review        — Rubric-based AI evaluation with feedback
 *   5. Verified Certificate  — Smart PDF + auto-resume injection
 */

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Compass, Rocket, FileText, CheckCircle, Award, ArrowRight,
  ArrowLeft, RefreshCw, Sparkles, Target, TrendingUp, Clock,
  ChevronDown, ChevronUp, Send, Download, Star, Shield,
  BookOpen, Code, Briefcase, Zap, GraduationCap, Copy, Check,
} from "lucide-react";
import { cn } from "../lib/utils";
import type { UserProfile } from "../types/career";
import type {
  PivotPhase, SectorOption, ScopedProject, ProjectMilestone,
  MilestoneStatus, PivotCertificate, ResumeProjectSnippet,
} from "../types/sectorPivot";
import {
  fetchSectorOptions, generateProject, submitForReview,
  generateCertificate, generateResumeSnippet,
} from "../services/sectorPivotService";

// ─── Constants ────────────────────────────────────────────────────────────────

const PHASES: { key: PivotPhase; label: string; icon: React.ElementType }[] = [
  { key: "select",      label: "Select Sector",   icon: Compass },
  { key: "project",     label: "Get Project",      icon: Rocket },
  { key: "submit",      label: "Submit Work",      icon: FileText },
  { key: "review",      label: "AI Review",        icon: CheckCircle },
  { key: "certificate", label: "Certificate",      icon: Award },
];

const DEMAND_STYLES: Record<string, string> = {
  high:     "bg-emerald-100 text-emerald-700",
  medium:   "bg-amber-100 text-amber-700",
  emerging: "bg-violet-100 text-violet-700",
};

const DIFFICULTY_STYLES: Record<string, string> = {
  low:      "bg-emerald-100 text-emerald-700",
  moderate: "bg-amber-100 text-amber-700",
  high:     "bg-rose-100 text-rose-700",
};

const STATUS_STYLE: Record<MilestoneStatus, { bg: string; label: string }> = {
  locked:    { bg: "bg-slate-100 text-slate-500",    label: "Locked" },
  active:    { bg: "bg-indigo-100 text-indigo-700",  label: "In Progress" },
  submitted: { bg: "bg-amber-100 text-amber-700",    label: "Submitted" },
  reviewed:  { bg: "bg-sky-100 text-sky-700",        label: "Reviewed" },
  passed:    { bg: "bg-emerald-100 text-emerald-700", label: "Passed" },
  failed:    { bg: "bg-rose-100 text-rose-700",       label: "Needs Revision" },
};

// ─── Score Ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score, size = 56 }: { score: number; size?: number }) {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - score / 100);
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";
  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={5} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={5}
        strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" textAnchor="middle" dy=".35em" className="text-xs font-black" fill={color}>
        {score}%
      </text>
    </svg>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

interface Props { profile: UserProfile }

export default function SectorPivotLab({ profile }: Props) {
  // Phase
  const [phase, setPhase] = useState<PivotPhase>("select");
  const phaseIdx = PHASES.findIndex(p => p.key === phase);

  // Loading
  const [loading, setLoading] = useState(false);

  // Step 1
  const [sectors, setSectors] = useState<SectorOption[]>([]);
  const [selectedSector, setSelectedSector] = useState<SectorOption | null>(null);

  // Step 2
  const [project, setProject] = useState<ScopedProject | null>(null);

  // Step 3/4
  const [submissions, setSubmissions] = useState<Record<string, string>>({});
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>(null);

  // Step 5
  const [certificate, setCertificate] = useState<PivotCertificate | null>(null);
  const [resumeSnippet, setResumeSnippet] = useState<ResumeProjectSnippet | null>(null);
  const [copied, setCopied] = useState(false);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleFetchSectors = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchSectorOptions(
        profile.education || profile.currentRole || "General",
        profile.interests || [],
        profile.skills || [],
      );
      setSectors(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load sectors:", e);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  const handleSelectSector = useCallback((s: SectorOption) => {
    setSelectedSector(s);
  }, []);

  const handleGenerateProject = useCallback(async () => {
    if (!selectedSector) return;
    setLoading(true);
    try {
      const data = await generateProject(
        selectedSector.title,
        profile.education || profile.currentRole || "General",
        profile.skills || [],
      );
      setProject(data);
      setPhase("project");
    } catch (e) {
      console.error("Failed to generate project:", e);
    } finally {
      setLoading(false);
    }
  }, [selectedSector, profile]);

  const handleStartWork = useCallback(() => {
    if (project?.milestones?.[0]) {
      setExpandedMilestone(project.milestones[0].id);
    }
    setPhase("submit");
  }, [project]);

  const handleSubmitMilestone = useCallback(async (milestone: ProjectMilestone) => {
    const text = submissions[milestone.id];
    if (!text?.trim()) return;

    setLoading(true);
    try {
      const review = await submitForReview(
        milestone.title,
        milestone.deliverable,
        milestone.rubricCriteria,
        text,
        selectedSector?.title || "",
      );

      setProject(prev => {
        if (!prev) return prev;
        const updated = (prev.milestones || []).map((m, i, arr) => {
          if (m.id === milestone.id) {
            return {
              ...m,
              status: (review.passed ? "passed" : "failed") as MilestoneStatus,
              submission: { text, submittedAt: new Date().toISOString() },
              review,
            };
          }
          // Unlock next milestone if current passed
          if (i > 0 && arr[i - 1].id === milestone.id && review.passed && m.status === "locked") {
            return { ...m, status: "active" as MilestoneStatus };
          }
          return m;
        });
        return { ...prev, milestones: updated };
      });

      setPhase("review");
      setExpandedMilestone(milestone.id);

      // Check if all milestones passed → go to certificate
      setTimeout(() => {
        setProject(prev => {
          if (!prev) return prev;
          const allPassed = (prev.milestones || []).length > 0 && (prev.milestones || []).every(m => m.status === "passed");
          if (allPassed) setPhase("certificate");
          return prev;
        });
      }, 100);
    } catch (e) {
      console.error("Review failed:", e);
    } finally {
      setLoading(false);
    }
  }, [submissions, selectedSector]);

  const handleGenerateCertificate = useCallback(async () => {
    if (!project) return;
    setLoading(true);
    try {
      const milestoneScores = (project.milestones || []).map(m => ({
        title: m.title,
        score: m.review?.score ?? 0,
      }));

      const cert = await generateCertificate(
        profile.name || "Student",
        profile.education || "General",
        selectedSector?.title || "",
        project.title,
        milestoneScores,
      );
      setCertificate(cert);

      const snippet = await generateResumeSnippet(
        selectedSector?.title || "",
        project.title,
        (project.milestones || []).map(m => ({ title: m.title })),
        cert.overallScore,
        project.skills || [],
      );
      setResumeSnippet(snippet);
    } catch (e) {
      console.error("Certificate generation failed:", e);
    } finally {
      setLoading(false);
    }
  }, [project, selectedSector, profile]);

  const handleCopySnippet = useCallback(() => {
    if (!resumeSnippet) return;
    const text = [
      resumeSnippet.title,
      ...(resumeSnippet.bullets || []).map(b => `• ${b}`),
      `Technologies: ${(resumeSnippet.technologies || []).join(", ")}`,
      resumeSnippet.certification,
    ].join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [resumeSnippet]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <Compass size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">Sector Pivot Lab</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">AI-Certified Career Transition</p>
          </div>
        </div>

        {/* Phase stepper */}
        <div className="flex items-center gap-1 mt-5 overflow-x-auto pb-1">
          {PHASES.map((p, i) => {
            const Icon = p.icon;
            const isActive = i === phaseIdx;
            const isDone = i < phaseIdx;
            return (
              <div key={p.key} className="flex items-center gap-1 shrink-0">
                {i > 0 && (
                  <div className={cn("w-6 h-0.5 rounded-full", isDone ? "bg-indigo-500" : "bg-slate-200")} />
                )}
                <div
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all",
                    isActive && "bg-indigo-600 text-white shadow-md shadow-indigo-200",
                    isDone && "bg-indigo-100 text-indigo-700",
                    !isActive && !isDone && "bg-slate-100 text-slate-400",
                  )}
                >
                  {isDone ? <CheckCircle size={12} /> : <Icon size={12} />}
                  <span className="hidden sm:inline">{p.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Phase content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={phase}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
        >
          {/* ── PHASE 1: Select Sector ──────────────────────────────────────── */}
          {phase === "select" && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-slate-900">Choose Your Target Sector</h3>
                  <p className="text-sm text-slate-500 mt-0.5">AI recommends sectors based on your background and skills</p>
                </div>
                <button
                  onClick={handleFetchSectors}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50"
                >
                  {loading ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  {sectors.length ? "Refresh" : "Discover Sectors"}
                </button>
              </div>

              {sectors.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {sectors.map(s => (
                    <button
                      key={s.id}
                      onClick={() => handleSelectSector(s)}
                      className={cn(
                        "text-left p-4 rounded-xl border-2 transition-all hover:shadow-md",
                        selectedSector?.id === s.id
                          ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200"
                          : "border-slate-200 hover:border-indigo-300",
                      )}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-black text-sm text-slate-900">{s.title}</h4>
                        <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full uppercase", DEMAND_STYLES[s.demandLevel] || DEMAND_STYLES.medium)}>
                          {s.demandLevel}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mb-3 line-clamp-2">{s.description}</p>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-600 font-semibold">{s.avgSalary}</span>
                        <span className={cn("font-bold px-2 py-0.5 rounded-full", DIFFICULTY_STYLES[s.transitionDifficulty] || DIFFICULTY_STYLES.moderate)}>
                          {s.transitionDifficulty} transition
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {s.topSkills.slice(0, 4).map(sk => (
                          <span key={sk} className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{sk}</span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {selectedSector && (
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleGenerateProject}
                    disabled={loading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-indigo-200"
                  >
                    {loading ? <RefreshCw size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                    Generate Project for {selectedSector.title}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── PHASE 2: Scoped Project ────────────────────────────────────── */}
          {phase === "project" && project && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-1">Your Capstone Project</p>
                <h3 className="font-black text-lg text-slate-900">{project.title}</h3>
                <p className="text-sm text-slate-500 mt-1">{project.scenario}</p>
              </div>

              <div className="flex flex-wrap gap-3 text-xs">
                <span className="flex items-center gap-1 text-slate-600"><Clock size={12} /> {project.estimatedHours} hours</span>
                <span className="flex items-center gap-1 text-slate-600"><Target size={12} /> {(project.milestones || []).length} milestones</span>
                <span className="flex items-center gap-1 text-indigo-600 font-bold"><Briefcase size={12} /> {project.targetSector}</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {(project.skills || []).map(sk => (
                  <span key={sk} className="text-[10px] bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-1 rounded-full">{sk}</span>
                ))}
              </div>

              {/* Milestone overview */}
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Project Milestones</p>
                {(project.milestones || []).map((m, i) => (
                  <div key={m.id} className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-black shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-slate-900">{m.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{m.description}</p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        <span className="font-semibold">Deliverable:</span> {m.deliverable}
                      </p>
                    </div>
                    <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0", STATUS_STYLE[m.status].bg)}>
                      {STATUS_STYLE[m.status].label}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-2">
                <button onClick={() => setPhase("select")} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 font-semibold">
                  <ArrowLeft size={14} /> Back
                </button>
                <button
                  onClick={handleStartWork}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-200"
                >
                  Start Working <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* ── PHASE 3 & 4: Submit & Review ───────────────────────────────── */}
          {(phase === "submit" || phase === "review") && project && (
            <div className="space-y-4">
              {(project.milestones || []).map((m, i) => {
                const isExpanded = expandedMilestone === m.id;
                const canSubmit = m.status === "active" || m.status === "failed";
                const hasReview = !!m.review;

                return (
                  <div key={m.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    {/* Milestone header */}
                    <button
                      onClick={() => setExpandedMilestone(isExpanded ? null : m.id)}
                      className="w-full flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-all"
                    >
                      <div className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center text-sm font-black shrink-0",
                        m.status === "passed" ? "bg-emerald-100 text-emerald-700" :
                        m.status === "active" || m.status === "failed" ? "bg-indigo-100 text-indigo-700" :
                        "bg-slate-100 text-slate-400",
                      )}>
                        {m.status === "passed" ? <CheckCircle size={16} /> : i + 1}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <h4 className="font-bold text-sm text-slate-900">{m.title}</h4>
                        <p className="text-[10px] text-slate-500 truncate">{m.deliverable}</p>
                      </div>
                      {hasReview && m.review && <ScoreRing score={m.review.score} size={40} />}
                      <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full", STATUS_STYLE[m.status].bg)}>
                        {STATUS_STYLE[m.status].label}
                      </span>
                      {isExpanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                    </button>

                    {/* Expanded content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 space-y-4 border-t border-slate-100 pt-4">
                            <p className="text-sm text-slate-600">{m.description}</p>

                            {/* Rubric */}
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Grading Rubric</p>
                              <div className="space-y-1.5">
                                {(m.rubricCriteria || []).map(r => (
                                  <div key={r.criterion} className="flex items-center gap-2 text-xs">
                                    <span className="w-10 text-right font-bold text-indigo-600">{r.weight}%</span>
                                    <span className="text-slate-700 font-semibold">{r.criterion}</span>
                                    <span className="text-slate-400">— {r.description}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Submission area */}
                            {canSubmit && (
                              <div className="space-y-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Your Submission</p>
                                <textarea
                                  value={submissions[m.id] || ""}
                                  onChange={e => setSubmissions(prev => ({ ...prev, [m.id]: e.target.value }))}
                                  placeholder={`Write your deliverable here: ${m.deliverable}`}
                                  rows={8}
                                  className="w-full rounded-xl border border-slate-200 text-sm p-4 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 outline-none resize-y"
                                />
                                <div className="flex justify-end">
                                  <button
                                    onClick={() => handleSubmitMilestone(m)}
                                    disabled={loading || !(submissions[m.id]?.trim())}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-indigo-200"
                                  >
                                    {loading ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                                    Submit for AI Review
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Review feedback */}
                            {hasReview && m.review && (
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">AI Review</p>
                                  <ScoreRing score={m.review.score} size={36} />
                                  <span className={cn(
                                    "text-[10px] font-bold px-2 py-0.5 rounded-full",
                                    m.review.passed ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700",
                                  )}>
                                    {m.review.passed ? "PASSED" : "NEEDS REVISION"}
                                  </span>
                                </div>

                                <p className="text-sm text-slate-700 bg-slate-50 rounded-xl p-4 border border-slate-200">
                                  {m.review.overallComment}
                                </p>

                                <div className="space-y-2">
                                  {(m.review.feedback || []).map(f => (
                                    <div key={f.criterion} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-bold text-slate-900">{f.criterion}</span>
                                        <span className={cn(
                                          "text-[10px] font-bold px-2 py-0.5 rounded-full",
                                          f.score >= 70 ? "bg-emerald-100 text-emerald-700" : f.score >= 50 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700",
                                        )}>
                                          {f.score}%
                                        </span>
                                      </div>
                                      <p className="text-xs text-slate-600">{f.comment}</p>
                                      {f.suggestion && (
                                        <p className="text-[10px] text-indigo-600 mt-1 flex items-start gap-1">
                                          <Sparkles size={10} className="mt-0.5 shrink-0" />
                                          {f.suggestion}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Locked message */}
                            {m.status === "locked" && (
                              <div className="text-center py-6 text-sm text-slate-400">
                                Complete the previous milestone to unlock this one.
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}

              {/* Certificate button — show when all passed */}
              {(project.milestones || []).every(m => m.status === "passed") && (project.milestones || []).length > 0 && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={() => { setPhase("certificate"); handleGenerateCertificate(); }}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-bold rounded-xl transition-all shadow-xl shadow-indigo-200"
                  >
                    <Award size={16} /> Claim Your Certificate
                  </button>
                </div>
              )}

              {/* Back button */}
              <button onClick={() => setPhase("project")} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 font-semibold">
                <ArrowLeft size={14} /> Back to Project Overview
              </button>
            </div>
          )}

          {/* ── PHASE 5: Certificate & Resume Injection ────────────────────── */}
          {phase === "certificate" && (
            <div className="space-y-5">
              {loading && (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                  <RefreshCw size={24} className="animate-spin text-indigo-500 mx-auto mb-3" />
                  <p className="text-sm text-slate-500 font-semibold">Generating your certificate and resume update…</p>
                </div>
              )}

              {certificate && !loading && (
                <>
                  {/* Certificate card */}
                  <div className="bg-gradient-to-br from-indigo-50 via-white to-violet-50 rounded-2xl border-2 border-indigo-200 p-8 text-center space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500" />
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto shadow-lg shadow-indigo-200">
                      <Award size={28} className="text-white" />
                    </div>

                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">EasyCareer AI Verified</p>
                      <h3 className="text-xl font-black text-slate-900 mt-1">Sector Pivot Certificate</h3>
                    </div>

                    <div className="py-3">
                      <p className="text-sm text-slate-500">Awarded to</p>
                      <p className="text-lg font-black text-slate-900">{certificate.holderName}</p>
                    </div>

                    <div className="bg-white rounded-xl p-4 border border-slate-200 inline-block mx-auto">
                      <p className="text-xs text-slate-500">For completing</p>
                      <p className="font-bold text-sm text-slate-900">{certificate.projectTitle}</p>
                      <p className="text-xs text-indigo-600 mt-1">
                        {certificate.originField} → {certificate.targetSector}
                      </p>
                    </div>

                    <ScoreRing score={certificate.overallScore} size={72} />

                    <div className="flex flex-wrap justify-center gap-3">
                      {(certificate.milestoneScores || []).map(ms => (
                        <div key={ms.title} className="text-center">
                          <ScoreRing score={ms.score} size={44} />
                          <p className="text-[9px] text-slate-500 mt-1 max-w-[80px] truncate">{ms.title}</p>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-slate-200">
                      <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                        <Shield size={12} className="text-indigo-500" />
                        <span>Verification ID: <strong className="text-slate-700">{certificate.verificationId}</strong></span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Issued {new Date(certificate.issuedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                      </p>
                    </div>
                  </div>

                  {/* Resume snippet */}
                  {resumeSnippet && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Zap size={15} className="text-indigo-500" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Auto-Resume Update</p>
                        </div>
                        <button
                          onClick={handleCopySnippet}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-all"
                        >
                          {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                          {copied ? "Copied!" : "Copy"}
                        </button>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-3">
                        <h4 className="font-black text-sm text-slate-900">{resumeSnippet.title}</h4>
                        <ul className="space-y-1.5">
                          {(resumeSnippet.bullets || []).map((b, i) => (
                            <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                              <span className="text-indigo-500 mt-1 shrink-0">•</span>
                              {b}
                            </li>
                          ))}
                        </ul>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {(resumeSnippet.technologies || []).map(t => (
                            <span key={t} className="text-[10px] bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-1 rounded-full">{t}</span>
                          ))}
                        </div>
                        <p className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                          {resumeSnippet.certification}
                        </p>
                      </div>

                      <p className="text-[10px] text-slate-400 text-center">
                        This project section has been formatted for ATS compatibility and can be added directly to your resume.
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-center gap-3 pt-2">
                    <button
                      onClick={() => {
                        setPhase("select");
                        setProject(null);
                        setCertificate(null);
                        setResumeSnippet(null);
                        setSelectedSector(null);
                        setSectors([]);
                        setSubmissions({});
                      }}
                      className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-all"
                    >
                      <Compass size={14} /> New Pivot
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

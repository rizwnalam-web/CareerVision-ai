/**
 * CodeAuditLab — AI-Powered Project Technical Review
 *
 * End-to-end flow:
 *   1. Connect GitHub / Submit URL — link a repo or live deployment
 *   2. AI Technical Audit — Architecture, Performance & Security review
 *   3. Actionable PR Recommendations — refactoring tasks to improve score
 *   4. Verified Certificate + Auto-Resume Update
 */

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  GitBranch, Globe, Shield, Cpu, Zap, ArrowRight, ArrowLeft,
  RefreshCw, Sparkles, CheckCircle, AlertTriangle, AlertCircle,
  Info, Award, Copy, Check, ExternalLink, Code, Lock, Search,
  FileText, TrendingUp, ChevronDown, ChevronUp, GitPullRequest,
} from "lucide-react";
import { cn } from "../lib/utils";
import type { UserProfile } from "../types/career";
import type {
  AuditPhase, CodeAuditReport, CodeAuditCertificate, CodeAuditResumeSnippet,
  AuditFinding, PRRecommendation, SecurityVulnerability,
} from "../types/codeAudit";
import {
  runCodeAudit, generateCodeCertificate, generateCodeResumeSnippet,
} from "../services/codeAuditService";

// ─── Constants ────────────────────────────────────────────────────────────────

const PHASES: { key: AuditPhase; label: string; icon: React.ElementType }[] = [
  { key: "input",       label: "Submit Project", icon: GitBranch },
  { key: "auditing",    label: "AI Audit",       icon: Search },
  { key: "report",      label: "Full Report",    icon: FileText },
  { key: "certificate", label: "Certificate",    icon: Award },
];

const SEVERITY_STYLE: Record<string, { bg: string; icon: React.ElementType }> = {
  critical: { bg: "bg-rose-100 text-rose-700 border-rose-200",      icon: AlertCircle },
  high:     { bg: "bg-rose-50 text-rose-600 border-rose-200",       icon: AlertCircle },
  warning:  { bg: "bg-amber-100 text-amber-700 border-amber-200",   icon: AlertTriangle },
  medium:   { bg: "bg-amber-50 text-amber-600 border-amber-200",    icon: AlertTriangle },
  info:     { bg: "bg-sky-100 text-sky-700 border-sky-200",          icon: Info },
  low:      { bg: "bg-sky-50 text-sky-600 border-sky-200",           icon: Info },
  good:     { bg: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle },
};

const PRIORITY_STYLE: Record<string, string> = {
  critical: "bg-rose-100 text-rose-700",
  high:     "bg-amber-100 text-amber-700",
  medium:   "bg-sky-100 text-sky-700",
  low:      "bg-slate-100 text-slate-600",
};

const CATEGORY_ICON: Record<string, React.ElementType> = {
  architecture: Cpu,
  performance: Zap,
  security: Shield,
  "code-quality": Code,
  documentation: FileText,
};

// ─── Score Ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score, size = 56, label }: { score: number; size?: number; label?: string }) {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - score / 100);
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="shrink-0">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={5} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={5}
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text x="50%" y="50%" textAnchor="middle" dy=".35em" className="text-xs font-black" fill={color}>
          {score}
        </text>
      </svg>
      {label && <span className="text-[9px] text-slate-500 font-semibold text-center">{label}</span>}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

interface Props { profile: UserProfile }

export default function CodeAuditLab({ profile }: Props) {
  const [phase, setPhase] = useState<AuditPhase>("input");
  const phaseIdx = PHASES.findIndex(p => p.key === phase);
  const [loading, setLoading] = useState(false);

  // Input
  const [inputType, setInputType] = useState<"github" | "url">("github");
  const [inputValue, setInputValue] = useState("");
  const [description, setDescription] = useState("");

  // Report
  const [report, setReport] = useState<CodeAuditReport | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>("architecture");

  // Certificate
  const [certificate, setCertificate] = useState<CodeAuditCertificate | null>(null);
  const [resumeSnippet, setResumeSnippet] = useState<CodeAuditResumeSnippet | null>(null);
  const [copied, setCopied] = useState(false);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleRunAudit = useCallback(async () => {
    if (!inputValue.trim()) return;
    setLoading(true);
    setPhase("auditing");
    try {
      const data = await runCodeAudit(inputType, inputValue.trim(), description || undefined);
      setReport(data);
      setPhase("report");
    } catch (e) {
      console.error("Audit failed:", e);
      setPhase("input");
    } finally {
      setLoading(false);
    }
  }, [inputType, inputValue, description]);

  const handleGenerateCertificate = useCallback(async () => {
    if (!report) return;
    setLoading(true);
    try {
      const cert = await generateCodeCertificate(
        profile.name || "Developer",
        extractProjectName(report.inputValue),
        report.inputValue,
        report.overallScore,
        report.grade,
        report.techStackDetected || [],
      );
      setCertificate(cert);

      const snippet = await generateCodeResumeSnippet(
        extractProjectName(report.inputValue),
        report.inputValue,
        report.overallScore,
        report.grade,
        report.techStackDetected || [],
        report.strengths || [],
        report.summary || "",
      );
      setResumeSnippet(snippet);
      setPhase("certificate");
    } catch (e) {
      console.error("Certificate generation failed:", e);
    } finally {
      setLoading(false);
    }
  }, [report, profile]);

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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Code size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">Code Audit Lab</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">AI Technical Review & Certification</p>
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
                {i > 0 && <div className={cn("w-6 h-0.5 rounded-full", isDone ? "bg-emerald-500" : "bg-slate-200")} />}
                <div className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all",
                  isActive && "bg-emerald-600 text-white shadow-md shadow-emerald-200",
                  isDone && "bg-emerald-100 text-emerald-700",
                  !isActive && !isDone && "bg-slate-100 text-slate-400",
                )}>
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
          {/* ── PHASE 1: Input ─────────────────────────────────────────────── */}
          {phase === "input" && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
              <div>
                <h3 className="font-black text-slate-900">Submit Your Project</h3>
                <p className="text-sm text-slate-500 mt-0.5">Connect a GitHub repository or paste a live URL for AI-powered technical review</p>
              </div>

              {/* Type toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setInputType("github")}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all",
                    inputType === "github" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-500 hover:border-slate-300",
                  )}
                >
                  <GitBranch size={14} /> GitHub Repository
                </button>
                <button
                  onClick={() => setInputType("url")}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all",
                    inputType === "url" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-500 hover:border-slate-300",
                  )}
                >
                  <Globe size={14} /> Live URL
                </button>
              </div>

              {/* URL input */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">
                  {inputType === "github" ? "Repository URL" : "Deployed URL"}
                </label>
                <input
                  type="url"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  placeholder={inputType === "github" ? "https://github.com/username/project" : "https://my-app.vercel.app"}
                  className="w-full rounded-xl border border-slate-200 text-sm px-4 py-3 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">
                  Project Context <span className="text-slate-400">(optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Brief description of what your project does, its purpose, and any specific areas you'd like reviewed..."
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 text-sm px-4 py-3 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 outline-none resize-y"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleRunAudit}
                  disabled={!inputValue.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-emerald-200"
                >
                  <Sparkles size={14} /> Run AI Audit
                </button>
              </div>
            </div>
          )}

          {/* ── PHASE 2: Auditing ──────────────────────────────────────────── */}
          {phase === "auditing" && (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
              <RefreshCw size={28} className="animate-spin text-emerald-500 mx-auto" />
              <h3 className="font-black text-slate-900">Running Technical Audit…</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Our AI Solutions Architect is reviewing architecture, performance, and security patterns. This typically takes 10–15 seconds.
              </p>
              <div className="flex justify-center gap-6 pt-4">
                {[
                  { icon: Cpu, label: "Architecture" },
                  { icon: Zap, label: "Performance" },
                  { icon: Shield, label: "Security" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-1.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center animate-pulse">
                      <Icon size={16} className="text-slate-400" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── PHASE 3: Report ────────────────────────────────────────────── */}
          {phase === "report" && report && (
            <div className="space-y-5">
              {/* Summary card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="flex items-start gap-5">
                  <ScoreRing score={report.overallScore} size={72} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-black text-lg text-slate-900">Audit Complete</h3>
                      <span className={cn(
                        "text-xs font-black px-2.5 py-0.5 rounded-full",
                        report.overallScore >= 80 ? "bg-emerald-100 text-emerald-700" :
                        report.overallScore >= 60 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700",
                      )}>
                        Grade: {report.grade}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mb-3">{report.summary}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(report.techStackDetected || []).map(t => (
                        <span key={t} className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2.5 py-1 rounded-full">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Score breakdown */}
                <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-slate-100">
                  <div className="text-center">
                    <ScoreRing score={report.architecture?.score ?? 0} size={48} label="Architecture" />
                  </div>
                  <div className="text-center">
                    <ScoreRing score={report.performance?.score ?? 0} size={48} label="Performance" />
                  </div>
                  <div className="text-center">
                    <ScoreRing score={report.security?.score ?? 0} size={48} label="Security" />
                  </div>
                </div>

                {/* Strengths */}
                {(report.strengths || []).length > 0 && (
                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Strengths</p>
                    <div className="flex flex-wrap gap-2">
                      {report.strengths.map((s, i) => (
                        <span key={i} className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-3 py-1.5 rounded-lg border border-emerald-200">
                          <CheckCircle size={10} className="inline mr-1" />{s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Detailed sections */}
              {(["architecture", "performance", "security"] as const).map(section => {
                const data = report[section];
                if (!data) return null;
                const isOpen = expandedSection === section;
                const Icon = section === "architecture" ? Cpu : section === "performance" ? Zap : Shield;
                const color = section === "architecture" ? "indigo" : section === "performance" ? "amber" : "emerald";

                return (
                  <div key={section} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <button
                      onClick={() => setExpandedSection(isOpen ? null : section)}
                      className="w-full flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-all"
                    >
                      <div className={`w-9 h-9 rounded-lg bg-${color}-100 text-${color}-600 flex items-center justify-center`}>
                        <Icon size={16} />
                      </div>
                      <span className="font-bold text-sm text-slate-900 flex-1 text-left capitalize">{section} Review</span>
                      <ScoreRing score={data.score} size={36} />
                      {isOpen ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 space-y-3 border-t border-slate-100 pt-4">
                            {(data.findings || []).map((f: AuditFinding, i: number) => {
                              const sev = SEVERITY_STYLE[f.severity] || SEVERITY_STYLE.info;
                              const SevIcon = sev.icon;
                              return (
                                <div key={i} className={cn("p-3 rounded-xl border", sev.bg)}>
                                  <div className="flex items-center gap-2 mb-1">
                                    <SevIcon size={12} />
                                    <span className="text-xs font-bold">{f.title}</span>
                                    <span className="text-[9px] font-bold uppercase ml-auto opacity-70">{f.severity}</span>
                                  </div>
                                  <p className="text-xs opacity-80 mb-1">{f.description}</p>
                                  <p className="text-[10px] font-semibold flex items-start gap-1">
                                    <Sparkles size={10} className="mt-0.5 shrink-0" /> {f.recommendation}
                                  </p>
                                </div>
                              );
                            })}

                            {/* Security vulnerabilities */}
                            {section === "security" && (report.security?.vulnerabilities || []).length > 0 && (
                              <div className="mt-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Vulnerabilities Found</p>
                                {report.security.vulnerabilities.map((v: SecurityVulnerability, i: number) => (
                                  <div key={i} className="p-3 bg-rose-50 rounded-xl border border-rose-200 mb-2">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Lock size={11} className="text-rose-600" />
                                      <span className="text-xs font-bold text-rose-700">{v.type}</span>
                                      <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-auto", PRIORITY_STYLE[v.severity] || PRIORITY_STYLE.medium)}>
                                        {v.severity}
                                      </span>
                                    </div>
                                    <p className="text-xs text-rose-600 mb-1">{v.description}</p>
                                    {v.location && <p className="text-[10px] text-rose-500 font-mono mb-1">📍 {v.location}</p>}
                                    <p className="text-[10px] text-emerald-700 font-semibold">✅ Fix: {v.fix}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}

              {/* PR Recommendations */}
              {(report.prRecommendations || []).length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <GitPullRequest size={15} className="text-indigo-500" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Pull Request Recommendations</p>
                  </div>
                  <div className="space-y-3">
                    {report.prRecommendations.map((pr: PRRecommendation) => {
                      const CatIcon = CATEGORY_ICON[pr.category] || Code;
                      return (
                        <div key={pr.id} className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                            <CatIcon size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-sm font-bold text-slate-900">{pr.title}</span>
                              <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full uppercase", PRIORITY_STYLE[pr.priority] || PRIORITY_STYLE.medium)}>
                                {pr.priority}
                              </span>
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                                {pr.effort} effort
                              </span>
                            </div>
                            <p className="text-xs text-slate-500">{pr.description}</p>
                            <p className="text-[10px] text-indigo-600 font-semibold mt-1">Impact: {pr.impact}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between">
                <button onClick={() => { setPhase("input"); setReport(null); }} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 font-semibold">
                  <ArrowLeft size={14} /> New Audit
                </button>
                {report.overallScore >= 60 && (
                  <button
                    onClick={handleGenerateCertificate}
                    disabled={loading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-emerald-200 disabled:opacity-50"
                  >
                    {loading ? <RefreshCw size={14} className="animate-spin" /> : <Award size={14} />}
                    Claim Certificate
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── PHASE 4: Certificate ───────────────────────────────────────── */}
          {phase === "certificate" && (
            <div className="space-y-5">
              {loading && (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                  <RefreshCw size={24} className="animate-spin text-emerald-500 mx-auto mb-3" />
                  <p className="text-sm text-slate-500 font-semibold">Generating certificate and resume update…</p>
                </div>
              )}

              {certificate && !loading && (
                <>
                  {/* Certificate card */}
                  <div className="bg-gradient-to-br from-emerald-50 via-white to-teal-50 rounded-2xl border-2 border-emerald-200 p-8 text-center space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500" />
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-200">
                      <Award size={28} className="text-white" />
                    </div>

                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">EasyCareer AI Verified</p>
                      <h3 className="text-xl font-black text-slate-900 mt-1">Code Review Certificate</h3>
                    </div>

                    <div className="py-3">
                      <p className="text-sm text-slate-500">Awarded to</p>
                      <p className="text-lg font-black text-slate-900">{certificate.holderName}</p>
                    </div>

                    <div className="bg-white rounded-xl p-4 border border-slate-200 inline-block mx-auto">
                      <p className="text-xs text-slate-500">Project</p>
                      <p className="font-bold text-sm text-slate-900">{certificate.projectName}</p>
                      <a href={certificate.projectUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 hover:underline flex items-center gap-1 justify-center mt-1">
                        <ExternalLink size={10} /> {certificate.projectUrl}
                      </a>
                    </div>

                    <div className="flex items-center justify-center gap-4">
                      <ScoreRing score={certificate.overallScore} size={64} />
                      <div className="text-left">
                        <p className="text-2xl font-black text-slate-900">{certificate.grade}</p>
                        <p className="text-[10px] text-slate-500 font-bold">Production Grade</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap justify-center gap-1.5">
                      {(certificate.techStack || []).map(t => (
                        <span key={t} className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-1 rounded-full border border-emerald-200">{t}</span>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-slate-200">
                      <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                        <Shield size={12} className="text-emerald-500" />
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
                          <TrendingUp size={15} className="text-emerald-500" />
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
                              <span className="text-emerald-500 mt-1 shrink-0">•</span>
                              {b}
                            </li>
                          ))}
                        </ul>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {(resumeSnippet.technologies || []).map(t => (
                            <span key={t} className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-1 rounded-full">{t}</span>
                          ))}
                        </div>
                        <p className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                          {resumeSnippet.certification}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-center gap-3 pt-2">
                    <button
                      onClick={() => { setPhase("report"); }}
                      className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-all"
                    >
                      <ArrowLeft size={14} /> Back to Report
                    </button>
                    <button
                      onClick={() => { setPhase("input"); setReport(null); setCertificate(null); setResumeSnippet(null); setInputValue(""); setDescription(""); }}
                      className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-all"
                    >
                      <Code size={14} /> New Audit
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractProjectName(url: string): string {
  try {
    const parts = new URL(url).pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] || parts[0] || "Project";
  } catch {
    return url.split("/").pop() || "Project";
  }
}

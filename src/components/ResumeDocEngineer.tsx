/**
 * ResumeDocEngineer — Dynamic Real-Time Document Engineering
 *
 * Side-by-side JD vs CV interface with:
 * - Instant ATS keyword gap analysis + compatibility match %
 * - Highlighted missing competencies with rephrase suggestions
 * - Hyper-targeted cover letter & networking outreach engine
 */

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FileText,
  Target,
  Sparkles,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Copy,
  Check,
  ArrowRight,
  Zap,
  Mail,
  Linkedin,
  UserCircle,
  Building2,
  PenTool,
  RotateCcw,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";
import { cn } from "../lib/utils";
import type { ResumeContent } from "../types/resume";
import {
  analyzeKeywordGap,
  generateTargetedCoverLetter,
  type KeywordGapResult,
  type TargetedCoverLetterInput,
  type TargetedCoverLetterResult,
} from "../services/resumeService";

// ─── Props ──────────────────────────────────────────────────────────────────

interface Props {
  content: ResumeContent | null;
  targetRole?: string;
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function ScoreRing({ score, size = 100 }: { score: number; size?: number }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 75 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="transform -rotate-90" style={{ width: size, height: size }}>
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="8" />
        <circle
          cx="50" cy="50" r={radius} fill="none"
          stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black" style={{ color }}>{score}%</span>
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Match</span>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function ResumeDocEngineer({ content, targetRole }: Props) {
  // Tab state
  const [activeMode, setActiveMode] = useState<"gap" | "outreach">("gap");

  // Gap analysis state
  const [jobDescription, setJobDescription] = useState("");
  const [gapResult, setGapResult] = useState<KeywordGapResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [gapError, setGapError] = useState<string | null>(null);

  // Cover letter state
  const [companyName, setCompanyName] = useState("");
  const [roleName, setRoleName] = useState(targetRole || "");
  const [hmName, setHmName] = useState("");
  const [hmTitle, setHmTitle] = useState("");
  const [tone, setTone] = useState<"professional" | "conversational" | "bold">("professional");
  const [outreachResult, setOutreachResult] = useState<TargetedCoverLetterResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [outreachError, setOutreachError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // ─── Handlers ───────────────────────────────────────────────────────────

  const handleAnalyzeGap = useCallback(async () => {
    if (!content || !jobDescription.trim()) return;
    setIsAnalyzing(true);
    setGapError(null);
    try {
      const result = await analyzeKeywordGap(content, jobDescription);
      setGapResult(result);
    } catch (err: any) {
      setGapError(err.message || "Analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  }, [content, jobDescription]);

  const handleGenerateOutreach = useCallback(async () => {
    if (!content || !jobDescription.trim() || !companyName.trim() || !roleName.trim()) return;
    setIsGenerating(true);
    setOutreachError(null);
    try {
      const input: TargetedCoverLetterInput = {
        content,
        jobDescription,
        companyName,
        targetRole: roleName,
        hiringManagerName: hmName || undefined,
        hiringManagerTitle: hmTitle || undefined,
        tone,
      };
      const result = await generateTargetedCoverLetter(input);
      setOutreachResult(result);
    } catch (err: any) {
      setOutreachError(err.message || "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  }, [content, jobDescription, companyName, roleName, hmName, hmTitle, tone]);

  const copyToClipboard = useCallback((text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }, []);

  const resetAll = () => {
    setGapResult(null);
    setOutreachResult(null);
    setGapError(null);
    setOutreachError(null);
  };

  // ─── No Resume Guard ────────────────────────────────────────────────────

  if (!content) {
    return (
      <div className="text-center py-20 text-slate-400">
        <FileText size={44} className="mx-auto mb-4 opacity-30" />
        <p className="font-bold text-sm">Upload your resume first</p>
        <p className="text-xs mt-1">Go to the Editor tab and upload or paste your resume to use Document Engineering.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-2 mb-1">
          <Zap size={16} className="text-amber-300" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200">Dynamic Document Engineering</p>
        </div>
        <h2 className="text-lg font-black">Drop a JD. Get instant ATS intelligence.</h2>
        <p className="text-xs text-indigo-200 mt-1 max-w-lg">
          Paste any job description below to run a real-time keyword gap analysis, then generate hyper-targeted cover letters and outreach messages.
        </p>
      </div>

      {/* JD Input (shared between both modes) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target size={14} className="text-indigo-500" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">Target Job Description</p>
          </div>
          {jobDescription && (
            <span className="text-[10px] text-slate-400 font-bold">{jobDescription.length} chars</span>
          )}
        </div>
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          rows={7}
          placeholder="Paste the full job description here…&#10;&#10;e.g. We are looking for a Senior Software Engineer with 5+ years experience in React, TypeScript, and cloud infrastructure..."
          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 resize-none"
        />
      </div>

      {/* Mode Toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveMode("gap")}
          className={cn(
            "flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all border",
            activeMode === "gap"
              ? "bg-indigo-600 text-white border-indigo-700 shadow-lg shadow-indigo-200"
              : "bg-white text-slate-600 border-slate-200 hover:border-indigo-200"
          )}
        >
          <ShieldCheck size={14} /> ATS Keyword Gap
        </button>
        <button
          onClick={() => setActiveMode("outreach")}
          className={cn(
            "flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all border",
            activeMode === "outreach"
              ? "bg-violet-600 text-white border-violet-700 shadow-lg shadow-violet-200"
              : "bg-white text-slate-600 border-slate-200 hover:border-violet-200"
          )}
        >
          <PenTool size={14} /> Cover Letter & Outreach
        </button>
        {(gapResult || outreachResult) && (
          <button
            onClick={resetAll}
            className="ml-auto flex items-center gap-1.5 px-3 py-2 text-slate-400 hover:text-slate-600 text-[10px] font-bold uppercase tracking-widest transition-all"
          >
            <RotateCcw size={12} /> Reset
          </button>
        )}
      </div>

      {/* ── MODE: KEYWORD GAP ANALYSIS ── */}
      <AnimatePresence mode="wait">
        {activeMode === "gap" && (
          <motion.div key="gap" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
            {/* Run Button */}
            <div className="flex justify-end">
              <button
                onClick={handleAnalyzeGap}
                disabled={isAnalyzing || !jobDescription.trim()}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-200"
              >
                {isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                {isAnalyzing ? "Analyzing…" : "Run Keyword Gap Analysis"}
              </button>
            </div>

            {/* Error */}
            {gapError && (
              <div className="flex items-center gap-2 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 font-medium">
                <XCircle size={16} /> {gapError}
              </div>
            )}

            {/* Loading */}
            {isAnalyzing && (
              <div className="flex flex-col items-center py-16 gap-4 text-slate-500">
                <Loader2 size={40} className="text-indigo-500 animate-spin" />
                <p className="font-bold text-sm">Running ATS keyword gap analysis…</p>
                <p className="text-xs text-slate-400">Comparing resume against job requirements</p>
              </div>
            )}

            {/* Results */}
            {gapResult && !isAnalyzing && (
              <div className="space-y-5">
                {/* Score + Overview */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <div className="flex items-center gap-8 flex-wrap">
                    <ScoreRing score={gapResult.matchPercentage} size={110} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">ATS Compatibility Score</p>
                      <p className={cn(
                        "text-3xl font-black mb-2",
                        gapResult.matchPercentage >= 75 ? "text-emerald-600" :
                        gapResult.matchPercentage >= 50 ? "text-amber-600" : "text-rose-600"
                      )}>
                        {gapResult.matchPercentage}% Match
                      </p>
                      <p className="text-sm text-slate-600">
                        {gapResult.matchPercentage >= 75
                          ? "Strong alignment — you're a competitive candidate for this role."
                          : gapResult.matchPercentage >= 50
                          ? "Moderate alignment — address missing keywords before submitting."
                          : "Low alignment — significant rework needed for ATS pass-through."}
                      </p>
                    </div>
                  </div>

                  {/* Category Breakdown */}
                  {gapResult.categoryBreakdown?.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6">
                      {gapResult.categoryBreakdown.map((cat) => (
                        <div
                          key={cat.category}
                          className={cn(
                            "rounded-xl border px-3 py-2.5 text-center",
                            cat.score >= 75 ? "bg-emerald-50 border-emerald-200" :
                            cat.score >= 50 ? "bg-amber-50 border-amber-200" : "bg-rose-50 border-rose-200"
                          )}
                        >
                          <p className={cn(
                            "text-lg font-black",
                            cat.score >= 75 ? "text-emerald-600" : cat.score >= 50 ? "text-amber-600" : "text-rose-600"
                          )}>
                            {cat.score}%
                          </p>
                          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mt-0.5 truncate">{cat.category}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Matched vs Missing Keywords */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl border border-emerald-200 p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle size={14} className="text-emerald-500" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
                        Matched Keywords ({gapResult.matched.length})
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {gapResult.matched.map((k) => (
                        <span key={k} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded-lg border border-emerald-100">
                          {k}
                        </span>
                      ))}
                      {gapResult.matched.length === 0 && <span className="text-xs text-slate-400">None found</span>}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-rose-200 p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <XCircle size={14} className="text-rose-500" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-rose-700">
                        Missing Keywords ({gapResult.missing.length})
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {gapResult.missing.map((k) => (
                        <span key={k} className="px-2 py-0.5 bg-rose-50 text-rose-700 text-[11px] font-bold rounded-lg border border-rose-100">
                          {k}
                        </span>
                      ))}
                      {gapResult.missing.length === 0 && <span className="text-xs text-emerald-600 font-bold">All keywords present!</span>}
                    </div>
                  </div>
                </div>

                {/* Partial Matches */}
                {gapResult.partial?.length > 0 && (
                  <div className="bg-white rounded-2xl border border-amber-200 p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle size={14} className="text-amber-500" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">
                        Partial Matches — Needs Rephrasing ({gapResult.partial.length})
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {gapResult.partial.map((k) => (
                        <span key={k} className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[11px] font-bold rounded-lg border border-amber-100">
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rephrase Suggestions */}
                {gapResult.rephraseHints?.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp size={14} className="text-violet-500" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">
                        Rephrase to Improve ATS Score
                      </p>
                    </div>
                    {gapResult.rephraseHints.map((hint, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="shrink-0 px-2 py-0.5 bg-violet-100 text-violet-700 text-[9px] font-black uppercase tracking-widest rounded-md mt-0.5">
                          {hint.keyword}
                        </span>
                        <div className="flex-1 min-w-0 space-y-1">
                          <p className="text-xs text-slate-500 line-through">{hint.currentPhrase}</p>
                          <div className="flex items-center gap-2">
                            <ArrowRight size={10} className="text-indigo-400 shrink-0" />
                            <p className="text-xs text-indigo-700 font-medium">{hint.suggestedPhrase}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* ── MODE: COVER LETTER & OUTREACH ── */}
        {activeMode === "outreach" && (
          <motion.div key="outreach" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
            {/* Targeting Fields */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <UserCircle size={14} className="text-violet-500" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">Target Details</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Company Name *</label>
                  <input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Stripe"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Target Role *</label>
                  <input
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    placeholder="e.g. Senior Product Designer"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Hiring Manager Name (optional)</label>
                  <input
                    value={hmName}
                    onChange={(e) => setHmName(e.target.value)}
                    placeholder="e.g. Sarah Chen"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Their Title (optional)</label>
                  <input
                    value={hmTitle}
                    onChange={(e) => setHmTitle(e.target.value)}
                    placeholder="e.g. VP of Engineering"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-50"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tone</label>
                <div className="flex gap-2">
                  {(["professional", "conversational", "bold"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTone(t)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all",
                        tone === t
                          ? "bg-violet-600 text-white border-violet-700"
                          : "bg-white text-slate-500 border-slate-200 hover:border-violet-200"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleGenerateOutreach}
                  disabled={isGenerating || !jobDescription.trim() || !companyName.trim() || !roleName.trim()}
                  className="flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-violet-200"
                >
                  {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  {isGenerating ? "Crafting…" : "Generate All Documents"}
                </button>
              </div>
            </div>

            {/* Error */}
            {outreachError && (
              <div className="flex items-center gap-2 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 font-medium">
                <XCircle size={16} /> {outreachError}
              </div>
            )}

            {/* Loading */}
            {isGenerating && (
              <div className="flex flex-col items-center py-16 gap-4 text-slate-500">
                <Loader2 size={40} className="text-violet-500 animate-spin" />
                <p className="font-bold text-sm">Crafting personalized outreach documents…</p>
                <p className="text-xs text-slate-400">Analyzing cross-functional alignment</p>
              </div>
            )}

            {/* Results */}
            {outreachResult && !isGenerating && (
              <div className="space-y-5">
                {/* Key Alignments & Differentiators */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl border border-indigo-200 p-5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-700 mb-3 flex items-center gap-1.5">
                      <Target size={12} /> Cross-Functional Alignments
                    </p>
                    <ul className="space-y-1.5">
                      {outreachResult.keyAlignments?.map((a, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                          <CheckCircle size={12} className="text-indigo-400 mt-0.5 shrink-0" />
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-white rounded-2xl border border-violet-200 p-5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-violet-700 mb-3 flex items-center gap-1.5">
                      <Zap size={12} /> Your Differentiators
                    </p>
                    <ul className="space-y-1.5">
                      {outreachResult.differentiators?.map((d, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                          <Sparkles size={12} className="text-violet-400 mt-0.5 shrink-0" />
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Cover Letter */}
                <DocumentCard
                  title="Cover Letter"
                  icon={FileText}
                  iconColor="text-teal-500"
                  borderColor="border-teal-200"
                  content={outreachResult.coverLetter}
                  copiedField={copiedField}
                  fieldId="cover"
                  onCopy={copyToClipboard}
                />

                {/* Email Outreach */}
                <DocumentCard
                  title="Email Outreach"
                  icon={Mail}
                  iconColor="text-blue-500"
                  borderColor="border-blue-200"
                  content={outreachResult.emailOutreach}
                  copiedField={copiedField}
                  fieldId="email"
                  onCopy={copyToClipboard}
                />

                {/* LinkedIn Message */}
                <DocumentCard
                  title="LinkedIn Connection Message"
                  icon={Linkedin}
                  iconColor="text-sky-600"
                  borderColor="border-sky-200"
                  content={outreachResult.linkedinMessage}
                  copiedField={copiedField}
                  fieldId="linkedin"
                  onCopy={copyToClipboard}
                  compact
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Document Card ──────────────────────────────────────────────────────────

function DocumentCard({
  title, icon: Icon, iconColor, borderColor, content, copiedField, fieldId, onCopy, compact,
}: {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  borderColor: string;
  content: string;
  copiedField: string | null;
  fieldId: string;
  onCopy: (text: string, id: string) => void;
  compact?: boolean;
}) {
  return (
    <div className={cn("bg-white rounded-2xl border p-5", borderColor)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon size={14} className={iconColor} />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">{title}</p>
        </div>
        <button
          onClick={() => onCopy(content, fieldId)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
        >
          {copiedField === fieldId ? <><Check size={11} /> Copied!</> : <><Copy size={11} /> Copy</>}
        </button>
      </div>
      <div className={cn("bg-slate-50 rounded-xl border border-slate-100 p-4", compact && "p-3")}>
        <pre className={cn("text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed", compact && "text-xs")}>{content}</pre>
      </div>
    </div>
  );
}

/**
 * WhyThisMatch — Explainable AI (XAI) disclosure component.
 *
 * Surfaces the *cited evidence* behind every AI recommendation so users
 * understand exactly why something was suggested, building trust and agency.
 *
 * Usage (minimal):
 *   <WhyThisMatch explanation="Your interest in ML aligns with this scholarship's focus." />
 *
 * Usage (full):
 *   <WhyThisMatch
 *     explanation="We matched this role because your resume highlights Python and FastAPI…"
 *     profileSignals={["Python", "FastAPI", "3 yrs experience"]}
 *     scoreBreakdown={[{ label: "Skills", points: 38, max: 40 }, …]}
 *     score={92}
 *     accentColor="#6366f1"
 *   />
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronDown, ArrowUpRight, CheckCircle2, Star, ClipboardList, FileText, MessageSquare, Link } from "lucide-react";
import { cn } from "../lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScoreDimension {
  label: string;
  points: number;
  max: number;
}

export interface WhyThisMatchProps {
  /** The AI-generated explanation sentence(s). */
  explanation: string;
  /** Specific profile fields / keywords that drove the match — highlighted inline. */
  profileSignals?: string[];
  /** Optional per-dimension breakdown bars. */
  scoreBreakdown?: ScoreDimension[];
  /** Overall match score 0-100. Shows improvement CTA if below 70. */
  score?: number;
  /** Tailwind text + border colour class, e.g. "text-indigo-600 border-indigo-300" */
  accentClass?: string;
  /** Hex colour for the bar fill. Defaults to indigo. */
  accentColor?: string;
  /** Custom label for the toggle button. */
  label?: string;
  /** Start expanded. */
  defaultOpen?: boolean;
  /** Extra wrapper class. */
  className?: string;
  /**
   * When true (and score >= 75), shows an "Application Advantage" section
   * with positive competitive framing + a "Prepare My Application" checklist.
   */
  showAdvantage?: boolean;
  /** Documents/steps required — auto-populated with sensible defaults if not provided. */
  applicationChecklist?: string[];
}

// ─── Highlight helper ─────────────────────────────────────────────────────────

/**
 * Wraps occurrences of every profileSignal in the explanation text with a
 * highlighted <mark> span. Case-insensitive.
 */
function HighlightedText({ text, signals }: { text: string; signals: string[] }) {
  if (!signals || signals.length === 0) return <span>{text}</span>;

  const escaped = signals.map(s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, i) => {
        const isSignal = signals.some(s => s.toLowerCase() === part.toLowerCase());
        return isSignal ? (
          <mark
            key={i}
            className="bg-indigo-100 text-indigo-800 font-bold rounded px-0.5 not-italic"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        );
      })}
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function WhyThisMatch({
  explanation,
  profileSignals = [],
  scoreBreakdown,
  score,
  accentClass = "text-indigo-600 border-indigo-200",
  accentColor = "#6366f1",
  label = "Why this recommendation?",
  defaultOpen = false,
  className,
  showAdvantage = false,
  applicationChecklist,
}: WhyThisMatchProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());

  const showImprove = score !== undefined && score < 70;
  const showAppAdvantage = showAdvantage && score !== undefined && score >= 75;

  const defaultChecklist = [
    "Personal statement / motivation letter",
    "Latest CV / resume (updated)",
    "Official academic transcripts",
    "2× letters of recommendation",
    "Proof of eligibility (ID / enrollment)",
    "Portfolio or work samples (if required)",
  ];
  const checklist = applicationChecklist ?? defaultChecklist;

  return (
    <div className={cn("rounded-xl border overflow-hidden", accentClass.includes("indigo") ? "border-indigo-100" : "border-slate-200", className)}>
      {/* Toggle row */}
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          "w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left transition-colors",
          open ? "bg-indigo-50" : "bg-slate-50 hover:bg-indigo-50/60"
        )}
      >
        <div className="flex items-center gap-2">
          <Sparkles size={11} className="text-indigo-500 shrink-0" />
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700">{label}</span>
          {score !== undefined && (
            <span
              className="text-[9px] font-black px-1.5 py-0.5 rounded-full text-white"
              style={{ backgroundColor: score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444" }}
            >
              {score}%
            </span>
          )}
        </div>
        <ChevronDown
          size={13}
          className={cn("text-indigo-400 transition-transform shrink-0", open && "rotate-180")}
        />
      </button>

      {/* Expandable body */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-2.5 space-y-3 bg-white border-t border-indigo-100">
              {/* Explanation with signal highlights */}
              <p className="text-[11px] text-slate-600 leading-relaxed italic">
                <HighlightedText text={explanation} signals={profileSignals} />
              </p>

              {/* Signal badges */}
              {profileSignals.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Profile signals cited</p>
                  <div className="flex flex-wrap gap-1.5">
                    {profileSignals.map(sig => (
                      <span
                        key={sig}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-[9px] font-black text-indigo-700"
                      >
                        <CheckCircle2 size={8} />
                        {sig}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Score breakdown bars */}
              {scoreBreakdown && scoreBreakdown.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Match breakdown</p>
                  {scoreBreakdown.map(dim => {
                    const pct = dim.max > 0 ? Math.round((dim.points / dim.max) * 100) : 0;
                    return (
                      <div key={dim.label} className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-slate-500 w-24 shrink-0 truncate">{dim.label}</span>
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.55, ease: "easeOut" }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: accentColor }}
                          />
                        </div>
                        <span className="text-[9px] font-black text-slate-500 w-8 text-right shrink-0">{dim.points}/{dim.max}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Application Advantage — positive framing for high-score matches */}
              {showAppAdvantage && (
                <div className="space-y-2 pt-1 border-t border-emerald-100">
                  <div className="flex items-center gap-1.5">
                    <Star size={10} className="text-emerald-500 shrink-0" fill="currentColor" />
                    <p className="text-[9px] font-black uppercase tracking-widest text-emerald-700">Your Application Advantage</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                    <p className="text-[10px] text-emerald-800 leading-relaxed font-medium">
                      {score !== undefined && score >= 90
                        ? "🏆 You're in the top tier of applicants. Your profile closely matches all key criteria — apply with confidence."
                        : score !== undefined && score >= 80
                          ? "✦ Strong match. Your background gives you a competitive edge. Highlight your relevant experience in your statement."
                          : "✦ Good match. Emphasise your matching skills and interests to stand out from other applicants."}
                    </p>
                  </div>

                  {/* Prepare My Application checklist */}
                  <button
                    onClick={() => setChecklistOpen(v => !v)}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:border-indigo-200 transition-all group"
                  >
                    <div className="flex items-center gap-2">
                      <ClipboardList size={11} className="text-indigo-500 shrink-0" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-700">Prepare My Application</span>
                      <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-600">{checkedItems.size}/{checklist.length}</span>
                    </div>
                    <ChevronDown size={11} className={cn("text-slate-400 transition-transform", checklistOpen && "rotate-180")} />
                  </button>

                  <AnimatePresence>
                    {checklistOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-1.5 pt-1">
                          {checklist.map((item, i) => {
                            const done = checkedItems.has(i);
                            const ICONS = [FileText, FileText, FileText, MessageSquare, Link, FileText];
                            const Icon = ICONS[i] ?? FileText;
                            return (
                              <button
                                key={i}
                                onClick={() => setCheckedItems(prev => {
                                  const next = new Set(prev);
                                  done ? next.delete(i) : next.add(i);
                                  return next;
                                })}
                                className={cn(
                                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border text-left transition-all",
                                  done ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-100 hover:border-indigo-100"
                                )}
                              >
                                <div className={cn("w-5 h-5 rounded-lg flex items-center justify-center shrink-0", done ? "bg-emerald-500" : "bg-slate-100")}>
                                  {done
                                    ? <CheckCircle2 size={11} className="text-white" />
                                    : <Icon size={9} className="text-slate-400" />}
                                </div>
                                <span className={cn("text-[10px] font-bold leading-snug flex-1", done ? "text-emerald-700 line-through" : "text-slate-600")}>{item}</span>
                              </button>
                            );
                          })}
                          {checkedItems.size === checklist.length && (
                            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-600 text-white">
                              <CheckCircle2 size={12} className="shrink-0" />
                              <p className="text-[9px] font-black uppercase tracking-widest">All documents ready — apply now! 🎉</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Improve CTA */}
              {showImprove && (
                <div className="flex items-center gap-2 pt-1">
                  <div className="flex-1 h-px bg-slate-100" />
                  <button className="flex items-center gap-1 text-[9px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-700 transition-colors whitespace-nowrap">
                    <ArrowUpRight size={9} />Improve match
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

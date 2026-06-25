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
import { Sparkles, ChevronDown, ArrowUpRight, CheckCircle2 } from "lucide-react";
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
}: WhyThisMatchProps) {
  const [open, setOpen] = useState(defaultOpen);

  const showImprove = score !== undefined && score < 70;

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

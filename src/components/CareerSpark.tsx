/**
 * CareerSpark — Onboarding Quiz
 *
 * A 3-step, 60-second quiz shown to first-time users:
 *   Step 1 — Pick your top skills (multi-select chips)
 *   Step 2 — Choose where you want to work (country/remote chips)
 *   Step 3 — Pick the impact you want to make (icon cards)
 *   Result — "Career Compass": 3 personalized career recommendations
 *
 * Stores completion flag in localStorage so it only shows once.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ChevronRight, ChevronLeft, Sparkles, Check,
  Globe, Zap, Heart, Code, BarChart3, BookOpen,
  Lightbulb, Users, Leaf, ArrowRight, Star,
} from "lucide-react";
import { cn } from "../lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

export const SPARK_DONE_KEY = "cv_spark_done";

const SKILL_OPTIONS = [
  { id: "programming",   label: "Programming",      icon: "💻" },
  { id: "data",          label: "Data & Analytics",  icon: "📊" },
  { id: "design",        label: "Design & UX",       icon: "🎨" },
  { id: "writing",       label: "Writing",           icon: "✍️" },
  { id: "research",      label: "Research",          icon: "🔬" },
  { id: "leadership",    label: "Leadership",        icon: "🎯" },
  { id: "communication", label: "Communication",     icon: "🗣️" },
  { id: "finance",       label: "Finance",           icon: "💰" },
  { id: "marketing",     label: "Marketing",         icon: "📣" },
  { id: "engineering",   label: "Engineering",       icon: "⚙️" },
  { id: "healthcare",    label: "Healthcare",        icon: "⚕️" },
  { id: "teaching",      label: "Teaching",          icon: "📚" },
];

const LOCATION_OPTIONS = [
  { id: "usa",       label: "USA",           flag: "🇺🇸" },
  { id: "uk",        label: "UK",            flag: "🇬🇧" },
  { id: "canada",    label: "Canada",        flag: "🇨🇦" },
  { id: "australia", label: "Australia",     flag: "🇦🇺" },
  { id: "germany",   label: "Germany",       flag: "🇩🇪" },
  { id: "uae",       label: "UAE",           flag: "🇦🇪" },
  { id: "singapore", label: "Singapore",     flag: "🇸🇬" },
  { id: "remote",    label: "Remote / Anywhere", flag: "🌍" },
];

const IMPACT_OPTIONS = [
  { id: "tech",      label: "Build Tech",        icon: Code,     color: "bg-indigo-100 text-indigo-600", desc: "Shape the future through software & AI" },
  { id: "people",    label: "Help People",       icon: Heart,    color: "bg-rose-100 text-rose-600",     desc: "Careers in health, education, social work" },
  { id: "planet",    label: "Save the Planet",   icon: Leaf,     color: "bg-emerald-100 text-emerald-600", desc: "Climate tech, sustainability, green energy" },
  { id: "data",      label: "Drive Decisions",   icon: BarChart3,color: "bg-amber-100 text-amber-600",   desc: "Data science, policy, analytics" },
  { id: "ideas",     label: "Create & Innovate", icon: Lightbulb,color: "bg-violet-100 text-violet-600", desc: "Design, research, entrepreneurship" },
  { id: "community", label: "Build Communities", icon: Users,    color: "bg-sky-100 text-sky-600",       desc: "Comms, NGOs, social enterprise" },
];

// ─── Career Compass results ───────────────────────────────────────────────────

interface CareerCompassResult {
  title: string;
  emoji: string;
  whyText: string;
  salary: string;
  growth: string;
  accent: string;
}

function buildCompass(
  skills: string[],
  location: string,
  impact: string
): CareerCompassResult[] {
  const istech   = skills.includes("programming") || skills.includes("data") || skills.includes("engineering");
  const isdesign = skills.includes("design");
  const ishealth = skills.includes("healthcare");
  const isfinance= skills.includes("finance");
  const isresearch= skills.includes("research");

  const planetImpact    = impact === "planet";
  const peopleImpact    = impact === "people";
  const techImpact      = impact === "tech";
  const dataImpact      = impact === "data";

  const all: CareerCompassResult[] = [
    {
      title: planetImpact ? "Climate Data Scientist"   : isfinance ? "Sustainable Finance Analyst" : istech ? "AI Engineer" : isdesign ? "Product Designer" : ishealth ? "Health Informatics Specialist" : isresearch ? "Research Scientist" : "Strategy Consultant",
      emoji: planetImpact ? "🌍" : isfinance ? "💹" : istech ? "🤖" : isdesign ? "🎨" : ishealth ? "⚕️" : isresearch ? "🔬" : "📊",
      whyText: `Your ${skills.slice(0, 2).join(" & ")} skills align perfectly with this fast-growing role.`,
      salary: isfinance ? "$85K–$140K" : istech || dataImpact ? "$90K–$160K" : "$70K–$110K",
      growth: "+28% 5yr",
      accent: "from-indigo-600 to-violet-600",
    },
    {
      title: techImpact ? "Software Engineer" : peopleImpact ? "EdTech Product Manager" : planetImpact ? "Sustainability Consultant" : dataImpact ? "Data Analyst" : isdesign ? "UX Researcher" : "Digital Marketing Strategist",
      emoji: techImpact ? "💻" : peopleImpact ? "🎓" : planetImpact ? "♻️" : dataImpact ? "📈" : isdesign ? "🔍" : "📣",
      whyText: `Matches your interest in ${IMPACT_OPTIONS.find(o => o.id === impact)?.label ?? impact} and your ${location} location target.`,
      salary: techImpact ? "$95K–$145K" : "$65K–$105K",
      growth: "+22% 5yr",
      accent: "from-emerald-600 to-teal-600",
    },
    {
      title: isresearch ? "Policy Research Analyst" : ishealth ? "Biomedical Data Scientist" : isfinance ? "FinTech Founder" : techImpact ? "DevOps Engineer" : peopleImpact ? "Career Coach" : "Entrepreneur / Founder",
      emoji: isresearch ? "📋" : ishealth ? "🧬" : isfinance ? "🏦" : techImpact ? "⚙️" : peopleImpact ? "🤝" : "🚀",
      whyText: `A high-growth path that combines your unique skill mix for maximum impact in ${location === "remote" ? "a global remote market" : location.toUpperCase()}.`,
      salary: "$75K–$130K",
      growth: "+35% 5yr",
      accent: "from-amber-500 to-orange-500",
    },
  ];

  return all.slice(0, 3);
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  onComplete: (data: { skills: string[]; location: string; impact: string }) => void;
  onDismiss: () => void;
}

export default function CareerSpark({ onComplete, onDismiss }: Props) {
  const [step, setStep]           = useState(0); // 0=skills, 1=location, 2=impact, 3=result
  const [skills, setSkills]       = useState<string[]>([]);
  const [location, setLocation]   = useState("");
  const [impact, setImpact]       = useState("");
  const [compass, setCompass]     = useState<CareerCompassResult[]>([]);

  const toggleSkill = (id: string) => {
    setSkills(prev =>
      prev.includes(id)
        ? prev.filter(s => s !== id)
        : prev.length >= 3 ? prev : [...prev, id]
    );
  };

  const handleNext = () => {
    if (step === 2) {
      const result = buildCompass(skills, location, impact);
      setCompass(result);
      setStep(3);
    } else {
      setStep(s => s + 1);
    }
  };

  const canNext = (
    step === 0 ? skills.length > 0 :
    step === 1 ? !!location :
    step === 2 ? !!impact :
    true
  );

  const progressPct = step === 3 ? 100 : Math.round(((step) / 3) * 100);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onDismiss(); }}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
      >
        {/* Header bar */}
        <div className="relative bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 px-7 pt-7 pb-6 text-white overflow-hidden">
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5" />
          <div className="absolute top-4 right-16 w-16 h-16 rounded-full bg-white/5" />
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 border border-white/20 text-[9px] font-black uppercase tracking-widest mb-2">
                <Sparkles size={9} />Career Spark Quiz
              </div>
              <h2 className="text-2xl font-black leading-tight">
                {step === 3 ? "Your Career Compass" : "Let's find your path."}
              </h2>
              <p className="text-[11px] text-indigo-200 mt-1">
                {step === 0 && "Step 1 of 3 · Pick up to 3 skills you enjoy"}
                {step === 1 && "Step 2 of 3 · Where do you want to work?"}
                {step === 2 && "Step 3 of 3 · What impact do you want to make?"}
                {step === 3 && "Based on your answers — 3 paths unlocked ✦"}
              </p>
            </div>
            <button onClick={onDismiss} className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-white/15 hover:bg-white/30 transition-all border border-white/20" title="Close">
              <X size={16} />
            </button>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            {["Skills", "Location", "Impact", "Compass"].map((l, i) => (
              <span key={l} className={cn("text-[8px] font-black uppercase tracking-widest", i <= step ? "text-white" : "text-white/30")}>{l}</span>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="px-7 py-6 max-h-[55vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* Step 0 — Skills */}
            {step === 0 && (
              <motion.div key="skills" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-bold text-slate-500">Pick up to 3 skills</p>
                  <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{skills.length}/3 selected</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {SKILL_OPTIONS.map(opt => {
                    const sel = skills.includes(opt.id);
                    const disabled = !sel && skills.length >= 3;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => toggleSkill(opt.id)}
                        disabled={disabled}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all",
                          sel
                            ? "bg-indigo-600 text-white border-indigo-700 shadow-md shadow-indigo-200"
                            : disabled
                              ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
                              : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-700"
                        )}
                      >
                        <span className="text-base leading-none">{opt.icon}</span>
                        {opt.label}
                        {sel && <Check size={10} />}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Step 1 — Location */}
            {step === 1 && (
              <motion.div key="location" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                <p className="text-xs font-bold text-slate-500 mb-3">Where do you want to build your career?</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {LOCATION_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setLocation(opt.id)}
                      className={cn(
                        "flex items-center gap-3 p-3.5 rounded-2xl border text-sm font-bold transition-all text-left",
                        location === opt.id
                          ? "bg-indigo-600 text-white border-indigo-700 shadow-md shadow-indigo-200"
                          : "bg-white text-slate-700 border-slate-200 hover:border-indigo-200 hover:bg-indigo-50"
                      )}
                    >
                      <span className="text-xl leading-none">{opt.flag}</span>
                      <span className="text-[11px] font-black uppercase tracking-wider">{opt.label}</span>
                      {location === opt.id && <Check size={11} className="ml-auto shrink-0" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2 — Impact */}
            {step === 2 && (
              <motion.div key="impact" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-2.5">
                <p className="text-xs font-bold text-slate-500 mb-3">What kind of impact matters most to you?</p>
                {IMPACT_OPTIONS.map(opt => {
                  const Icon = opt.icon;
                  const sel = impact === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setImpact(opt.id)}
                      className={cn(
                        "w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all",
                        sel
                          ? "bg-indigo-600 text-white border-indigo-700 shadow-md shadow-indigo-200"
                          : "bg-white text-slate-700 border-slate-200 hover:border-indigo-200 hover:bg-indigo-50"
                      )}
                    >
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", sel ? "bg-white/20" : opt.color)}>
                        <Icon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-black uppercase tracking-wider">{opt.label}</p>
                        <p className={cn("text-[10px] mt-0.5", sel ? "text-indigo-200" : "text-slate-400")}>{opt.desc}</p>
                      </div>
                      {sel && <Check size={14} className="shrink-0" />}
                    </button>
                  );
                })}
              </motion.div>
            )}

            {/* Step 3 — Career Compass */}
            {step === 3 && (
              <motion.div key="compass" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-amber-50 border border-amber-200 mb-2">
                  <Star size={12} className="text-amber-500 shrink-0" fill="currentColor" />
                  <p className="text-[10px] font-bold text-amber-800">
                    Based on <strong>{skills.length} skill{skills.length !== 1 ? "s" : ""}</strong>, <strong>{LOCATION_OPTIONS.find(l => l.id === location)?.label ?? location}</strong>, and <strong>{IMPACT_OPTIONS.find(i => i.id === impact)?.label ?? impact}</strong>
                  </p>
                </div>
                {compass.map((path, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.12 }}
                    className="relative overflow-hidden rounded-2xl border border-slate-100 hover:shadow-md hover:border-indigo-200 transition-all group cursor-pointer"
                  >
                    <div className={cn("absolute top-0 left-0 w-1 h-full bg-gradient-to-b", path.accent)} />
                    <div className="pl-5 pr-4 py-4">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl leading-none mt-0.5 shrink-0">{path.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h4 className="text-sm font-black text-slate-800 group-hover:text-indigo-700 transition-colors">{path.title}</h4>
                            <span className={cn("text-[8px] font-black px-2 py-0.5 rounded-full text-white bg-gradient-to-r shrink-0", path.accent)}>
                              Path {i + 1}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 leading-relaxed mb-2">{path.whyText}</p>
                          <div className="flex gap-3">
                            <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">{path.salary}</span>
                            <span className="text-[9px] font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">Growth {path.growth}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-7 pb-6 flex items-center gap-3">
          {step > 0 && step < 3 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-1.5 px-4 py-3 rounded-2xl border border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
            >
              <ChevronLeft size={12} />Back
            </button>
          )}
          {step < 3 ? (
            <>
              <button
                onClick={onDismiss}
                className="px-4 py-3 rounded-2xl text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-slate-600 transition-all"
              >
                Skip
              </button>
              <button
                onClick={handleNext}
                disabled={!canNext}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all disabled:opacity-40 shadow-md shadow-indigo-200"
              >
                {step === 2 ? "Reveal My Path" : "Next"}
                <ChevronRight size={12} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onDismiss}
                className="flex items-center gap-1.5 px-4 py-3 rounded-2xl border border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
              >
                Maybe Later
              </button>
              <button
                onClick={() => {
                  onComplete({ skills, location, impact });
                }}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-md shadow-indigo-200"
              >
                Take me to my dashboard <ArrowRight size={12} />
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

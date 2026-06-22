import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Brain, ChevronRight, BarChart3, Loader2, RotateCcw, Star, TrendingUp } from "lucide-react";
import { getSoftSkillQuestions, analyzeSoftSkills, type SoftSkillQuestion, type SoftSkillAnalysis } from "../services/innovativeFeaturesService";

const SKILL_COLORS: Record<string, string> = {
  communication: "bg-blue-100 text-blue-700 border-blue-200",
  leadership: "bg-violet-100 text-violet-700 border-violet-200",
  teamwork: "bg-teal-100 text-teal-700 border-teal-200",
  adaptability: "bg-amber-100 text-amber-700 border-amber-200",
  empathy: "bg-rose-100 text-rose-700 border-rose-200",
  creativity: "bg-orange-100 text-orange-700 border-orange-200",
  "conflict resolution": "bg-red-100 text-red-700 border-red-200",
  "time management": "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const STYLE_META: Record<string, { emoji: string; desc: string }> = {
  Analytical: { emoji: "🔍", desc: "Data-driven and methodical" },
  Creative: { emoji: "🎨", desc: "Imaginative and innovative" },
  Leader: { emoji: "🎯", desc: "Decisive and action-oriented" },
  Collaborator: { emoji: "🤝", desc: "Team-focused and supportive" },
  Independent: { emoji: "⚡", desc: "Self-directed and focused" },
  Direct: { emoji: "🗣️", desc: "Clear and straightforward" },
  Diplomatic: { emoji: "🕊️", desc: "Tactful and considerate" },
  Expressive: { emoji: "✨", desc: "Engaging and enthusiastic" },
};

export default function SoftSkillsAssessment({ profile }: { profile?: any }) {
  const [targetRole, setTargetRole] = useState(profile?.targetCareer || "");
  const [questions, setQuestions] = useState<SoftSkillQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [current, setCurrent] = useState(0);
  const [analysis, setAnalysis] = useState<SoftSkillAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<"setup" | "quiz" | "result">("setup");

  const startAssessment = async () => {
    setLoading(true);
    try {
      const qs = await getSoftSkillQuestions(targetRole);
      setQuestions(qs); setAnswers({}); setCurrent(0); setPhase("quiz");
    } catch { alert("Failed to load questions. Please try again."); }
    finally { setLoading(false); }
  };

  const selectAnswer = (qId: number, optionId: string) => {
    const updated = { ...answers, [qId]: optionId };
    setAnswers(updated);
    if (current < questions.length - 1) {
      setTimeout(() => setCurrent((c) => c + 1), 300);
    } else {
      submitAnalysis(updated);
    }
  };

  const submitAnalysis = async (ans: Record<number, string>) => {
    setLoading(true);
    try {
      const answerData = questions.map((q) => ({
        questionId: q.id, skill: q.skill, question: q.question,
        chosen: q.options.find((o) => o.id === ans[q.id]),
      }));
      const result = await analyzeSoftSkills(answerData, targetRole);
      setAnalysis(result); setPhase("result");
    } catch { alert("Analysis failed. Please try again."); }
    finally { setLoading(false); }
  };

  const reset = () => { setPhase("setup"); setAnalysis(null); setQuestions([]); setAnswers({}); };

  if (phase === "setup") return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900">Soft Skills Assessment</h1>
          <p className="text-xs text-slate-500">Personality & communication analysis — 8 questions, ~5 min</p>
        </div>
      </div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <p className="text-slate-600 text-sm mb-5">This assessment evaluates your communication style, leadership traits, and interpersonal skills using behavioural questions.</p>
        <label className="text-xs text-slate-500 mb-1.5 block">Target role (optional)</label>
        <input value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="e.g. Product Manager, UX Designer"
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-rose-400 mb-5" />
        <button onClick={startAssessment} disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-rose-400 hover:to-pink-400 transition-all disabled:opacity-50 shadow-md shadow-pink-200">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />} Start Assessment
        </button>
      </motion.div>
    </div>
  );

  if (phase === "quiz" && questions.length > 0) {
    const q = questions[current];
    const progress = (current / questions.length) * 100;
    const skillColor = SKILL_COLORS[q.skill.toLowerCase()] ?? "bg-slate-100 text-slate-600 border-slate-200";
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
          </div>
          <span className="text-xs text-slate-500 font-medium">{current + 1}/{questions.length}</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={current} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
            className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full border capitalize mb-4 ${skillColor}`}>{q.skill}</span>
            <h3 className="text-slate-800 font-semibold text-base mb-5 leading-relaxed">{q.question}</h3>
            <div className="space-y-2">
              {q.options.map((opt) => (
                <button key={opt.id} onClick={() => selectAnswer(q.id, opt.id)}
                  className={`w-full text-left px-4 py-3.5 rounded-xl border text-sm transition-all flex items-center gap-3 ${answers[q.id] === opt.id ? "bg-rose-50 border-rose-400 text-rose-800" : "bg-white border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-700"}`}>
                  <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 flex-shrink-0">{opt.id.toUpperCase()}</span>
                  {opt.text}
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
        {loading && <div className="text-center mt-4"><Loader2 className="w-6 h-6 text-rose-400 animate-spin mx-auto" /></div>}
      </div>
    );
  }

  if (phase === "result" && analysis) return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg">
          <BarChart3 className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-slate-900">Your Soft Skills Profile</h1>
        </div>
        <button onClick={reset} className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"><RotateCcw size={12} /> Retake</button>
      </div>

      {/* Score + styles */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-200 flex items-center justify-center">
            <span className="text-2xl font-black text-rose-600">{analysis.overallScore}</span>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-0.5">Overall soft skills score</p>
            <div className="flex gap-2 flex-wrap">
              {[analysis.workStyle, analysis.communicationStyle].map((s) => s && (
                <span key={s} className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium">{STYLE_META[s]?.emoji} {s}</span>
              ))}
            </div>
          </div>
        </div>
        <p className="text-slate-600 text-sm leading-relaxed">{analysis.personality}</p>
        {analysis.topTraits.length > 0 && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {analysis.topTraits.map((t) => <span key={t} className="text-xs bg-rose-50 text-rose-600 border border-rose-200 px-2 py-0.5 rounded-full">{t}</span>)}
          </div>
        )}
      </div>

      {/* Strengths */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><Star size={16} className="text-amber-500" /> Strengths</h3>
        <div className="space-y-3">
          {analysis.strengths.map((s) => (
            <div key={s.skill}>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-slate-700 capitalize">{s.skill}</span>
                <span className="text-emerald-600 font-bold">{s.score}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-1">
                <motion.div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full" initial={{ width: 0 }} animate={{ width: `${s.score}%` }} transition={{ duration: 0.6, delay: 0.1 }} />
              </div>
              <p className="text-xs text-slate-500">{s.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Growth areas */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><TrendingUp size={16} className="text-indigo-500" /> Growth Areas</h3>
        <div className="space-y-3">
          {analysis.improvements.map((s) => (
            <div key={s.skill}>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-slate-700 capitalize">{s.skill}</span>
                <span className="text-amber-600 font-bold">{s.score}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-1">
                <motion.div className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full" initial={{ width: 0 }} animate={{ width: `${s.score}%` }} transition={{ duration: 0.6 }} />
              </div>
              <p className="text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-1.5 mt-1">💡 {s.tip}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Career fit */}
      {analysis.careerFit.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-3">Best Career Matches for Your Profile</h3>
          <div className="flex gap-2 flex-wrap">
            {analysis.careerFit.map((c) => (
              <span key={c} className="text-sm bg-gradient-to-r from-violet-50 to-indigo-50 border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded-full font-medium flex items-center gap-1">
                <ChevronRight size={12} /> {c}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return null;
}

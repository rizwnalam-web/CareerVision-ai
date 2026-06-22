import { useState } from "react";
import { motion } from "motion/react";
import { Heart, Loader2, AlertTriangle, CheckCircle, Calendar, ChevronRight } from "lucide-react";
import { assessBurnout, type BurnoutAssessment } from "../services/innovativeFeaturesService";

const QUESTIONS = [
  { id: "exhaustion", text: "How often do you feel emotionally drained at the end of the workday?", category: "Exhaustion" },
  { id: "detachment", text: "Do you find yourself becoming cynical or detached about your work?", category: "Cynicism" },
  { id: "efficacy", text: "How effective do you feel in accomplishing tasks at work?", category: "Efficacy" },
  { id: "workload", text: "How manageable is your current workload on a typical week?", category: "Workload" },
  { id: "autonomy", text: "How much control do you have over how you do your work?", category: "Autonomy" },
  { id: "social", text: "How supported do you feel by your colleagues and manager?", category: "Social Support" },
  { id: "sleep", text: "How well are you sleeping on average?", category: "Recovery" },
  { id: "enjoyment", text: "How often do you find genuine enjoyment or meaning in your work?", category: "Engagement" },
  { id: "boundaries", text: "How often do work tasks spill into your personal time (evenings, weekends)?", category: "Boundaries" },
  { id: "hobbies", text: "How often do you have time for hobbies and activities outside of work?", category: "Life Balance" },
];

const OPTIONS = [
  { label: "Always / Very poor", value: 1 },
  { label: "Often / Poor", value: 2 },
  { label: "Sometimes / Moderate", value: 3 },
  { label: "Rarely / Good", value: 4 },
  { label: "Never / Excellent", value: 5 },
];

const RISK_META = {
  Low:      { color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", bar: "from-emerald-400 to-teal-400", emoji: "✅" },
  Moderate: { color: "text-amber-600",   bg: "bg-amber-50 border-amber-200",     bar: "from-amber-400 to-yellow-400", emoji: "⚠️" },
  High:     { color: "text-orange-600",  bg: "bg-orange-50 border-orange-200",   bar: "from-orange-400 to-red-400",   emoji: "🔥" },
  Critical: { color: "text-red-600",     bg: "bg-red-50 border-red-200",         bar: "from-red-500 to-rose-600",     emoji: "🚨" },
};

const IMPACT_COLOR = { High: "text-red-600 bg-red-50 border-red-200", Medium: "text-amber-600 bg-amber-50 border-amber-200", Low: "text-emerald-600 bg-emerald-50 border-emerald-200" };

export default function BurnoutPrevention({ profile }: { profile?: any }) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [workHours, setWorkHours] = useState(45);
  const [assessment, setAssessment] = useState<BurnoutAssessment | null>(null);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<"quiz" | "result">("quiz");

  const answered = Object.keys(answers).length;
  const progress = (answered / QUESTIONS.length) * 100;

  const submit = async () => {
    if (answered < QUESTIONS.length) { alert("Please answer all questions before submitting."); return; }
    setLoading(true);
    try {
      const responseData = QUESTIONS.map((q) => ({ question: q.text, category: q.category, score: answers[q.id], label: OPTIONS.find((o) => o.value === answers[q.id])?.label }));
      const result = await assessBurnout(responseData, profile?.currentRole || profile?.targetCareer, workHours);
      setAssessment(result); setPhase("result");
    } catch { alert("Assessment failed. Please try again."); }
    finally { setLoading(false); }
  };

  if (phase === "quiz") return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-red-500 flex items-center justify-center shadow-lg">
          <Heart className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-slate-900">Burnout Prevention</h1>
          <p className="text-xs text-slate-500">Work-life balance assessment — 10 questions</p>
        </div>
        <div className="text-xs text-slate-500">{answered}/{QUESTIONS.length}</div>
      </div>

      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-6">
        <motion.div className="h-full bg-gradient-to-r from-rose-400 to-red-500 rounded-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
      </div>

      <div className="mb-4">
        <label className="text-xs text-slate-500 mb-1.5 block">Average hours worked per week</label>
        <input type="number" min={1} max={100} value={workHours} onChange={(e) => setWorkHours(Number(e.target.value))}
          className="w-32 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-rose-400" />
      </div>

      <div className="space-y-4">
        {QUESTIONS.map((q) => (
          <div key={q.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-start gap-3 mb-3">
              <span className="text-xs font-bold text-rose-500 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">{q.category}</span>
            </div>
            <p className="text-slate-700 text-sm font-medium mb-3">{q.text}</p>
            <div className="grid grid-cols-5 gap-1.5">
              {OPTIONS.map((opt) => (
                <button key={opt.value} onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt.value }))}
                  className={`py-2 rounded-xl text-xs font-semibold transition-all border ${answers[q.id] === opt.value ? "bg-rose-500 text-white border-rose-500" : "bg-slate-50 text-slate-600 border-slate-200 hover:border-rose-300 hover:bg-rose-50"}`}>
                  {opt.value}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 px-1">
              <span>Very poor</span><span>Excellent</span>
            </div>
          </div>
        ))}
      </div>

      <button onClick={submit} disabled={loading || answered < QUESTIONS.length}
        className="w-full mt-6 py-3 bg-gradient-to-r from-rose-500 to-red-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-rose-400 hover:to-red-400 transition-all disabled:opacity-50 shadow-md shadow-rose-200">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className="w-4 h-4" />} Analyse My Balance
      </button>
    </div>
  );

  if (phase === "result" && assessment) {
    const meta = RISK_META[assessment.burnoutRisk];
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-red-500 flex items-center justify-center shadow-lg">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-bold text-slate-900">Your Balance Report</h1>
          <button onClick={() => { setPhase("quiz"); setAssessment(null); setAnswers({}); }} className="ml-auto text-xs text-slate-400 hover:text-slate-600">Retake</button>
        </div>

        {/* Risk banner */}
        <div className={`border rounded-2xl p-5 ${meta.bg}`}>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">{meta.emoji}</span>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Burnout risk level</p>
              <p className={`text-xl font-black ${meta.color}`}>{assessment.burnoutRisk} Risk</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-slate-500 mb-0.5">Risk score</p>
              <p className={`text-2xl font-black ${meta.color}`}>{assessment.riskScore}/100</p>
            </div>
          </div>
          <p className="text-slate-700 text-sm leading-relaxed">{assessment.summary}</p>
          {assessment.professionalHelp && (
            <div className="mt-3 flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs font-semibold">
              <AlertTriangle size={14} /> Consider speaking with a mental health professional or occupational counsellor
            </div>
          )}
        </div>

        {/* Dimension scores */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-3 text-sm">Wellbeing Dimensions</h3>
          <div className="space-y-2.5">
            {Object.entries(assessment.dimensions).map(([key, val]) => (
              <div key={key}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="capitalize text-slate-600 font-medium">{key}</span>
                  <span className={`font-bold ${val >= 70 ? "text-emerald-600" : val >= 40 ? "text-amber-600" : "text-red-600"}`}>{val}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div className={`h-full rounded-full bg-gradient-to-r ${meta.bar}`} initial={{ width: 0 }} animate={{ width: `${val}%` }} transition={{ duration: 0.6 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Red flags */}
        {assessment.redFlags.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-3 text-sm flex items-center gap-2"><AlertTriangle size={14} className="text-red-500" /> Warning Signs</h3>
            <ul className="space-y-1.5">{assessment.redFlags.map((f, i) => <li key={i} className="text-xs text-slate-600 flex gap-2"><span className="text-red-400">⚠</span>{f}</li>)}</ul>
          </div>
        )}

        {/* Recommendations */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-3 text-sm flex items-center gap-2"><CheckCircle size={14} className="text-emerald-500" /> Recommendations</h3>
          <div className="space-y-2">
            {assessment.recommendations.map((r, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${IMPACT_COLOR[r.impact]}`}>{r.impact}</span>
                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-0.5">{r.category}</p>
                  <p className="text-xs text-slate-500">{r.action}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly plan */}
        {assessment.weeklyPlan.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-3 text-sm flex items-center gap-2"><Calendar size={14} className="text-indigo-500" /> This Week's Recovery Plan</h3>
            <div className="space-y-2">
              {assessment.weeklyPlan.map((day, i) => (
                <div key={i} className="flex items-center gap-3 text-xs">
                  <span className="w-20 font-bold text-indigo-600 flex-shrink-0">{day.day}</span>
                  <span className="flex items-center gap-1 text-slate-600"><ChevronRight size={10} />{day.action}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}

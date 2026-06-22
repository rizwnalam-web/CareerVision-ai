import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, CheckCircle, XCircle, Trophy, Loader2, RefreshCw, Building2, ChevronRight } from "lucide-react";
import { getSimScenario, evaluateSimAnswer, type SimScenario, type SimEvaluation } from "../services/innovativeFeaturesService";

const INDUSTRIES = ["Technology", "Finance", "Healthcare", "Marketing", "Law", "Education", "Consulting", "Retail", "Manufacturing", "Media"];
const DIFFICULTIES = ["easy", "medium", "hard"];

export default function IndustrySimulator({ profile }: { profile?: any }) {
  const [industry, setIndustry] = useState("Technology");
  const [role, setRole] = useState(profile?.targetCareer || "Product Manager");
  const [difficulty, setDifficulty] = useState("medium");
  const [scenario, setScenario] = useState<SimScenario | null>(null);
  const [evaluation, setEvaluation] = useState<SimEvaluation | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);

  const start = async () => {
    setLoading(true); setEvaluation(null); setChosen(null);
    try {
      const s = await getSimScenario(industry, role, difficulty);
      setScenario(s); setRound((r) => r + 1);
    } catch { alert("Failed to load scenario. Please try again."); }
    finally { setLoading(false); }
  };

  const answer = async (optionId: string) => {
    if (!scenario || chosen) return;
    setChosen(optionId); setLoading(true);
    try {
      const ev = await evaluateSimAnswer(scenario, optionId, role);
      setEvaluation(ev); setScore((s) => s + ev.score);
    } catch { alert("Failed to evaluate. Please try again."); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900">Industry Simulator</h1>
          <p className="text-xs text-slate-500">Role-play real workplace scenarios and build decision-making skills</p>
        </div>
        {round > 0 && <div className="ml-auto text-sm font-bold text-teal-600 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">{round} rounds · {score} pts</div>}
      </div>

      {!scenario ? (
        /* Setup panel */
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-slate-800 font-semibold mb-4">Configure your simulation</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Industry</label>
              <select value={industry} onChange={(e) => setIndustry(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-teal-400">
                {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Your Role</label>
              <input value={role} onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-teal-400"
                placeholder="e.g. Product Manager" />
            </div>
          </div>
          <div className="mb-5">
            <label className="text-xs text-slate-500 mb-1.5 block">Difficulty</label>
            <div className="flex gap-2">
              {DIFFICULTIES.map((d) => (
                <button key={d} onClick={() => setDifficulty(d)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${difficulty === d ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          <button onClick={start} disabled={loading || !role.trim()}
            className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-teal-400 hover:to-emerald-400 transition-all disabled:opacity-50 shadow-md shadow-teal-200">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Start Simulation
          </button>
        </motion.div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div key={round} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="space-y-4">
            {/* Scenario card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold text-teal-600 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full uppercase tracking-wide">{scenario.industry}</span>
                <span className="text-xs text-slate-400">{scenario.role}</span>
                <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${difficulty === "hard" ? "bg-red-50 text-red-600 border border-red-200" : difficulty === "medium" ? "bg-amber-50 text-amber-600 border border-amber-200" : "bg-emerald-50 text-emerald-600 border border-emerald-200"}`}>{difficulty}</span>
              </div>
              <h3 className="font-bold text-slate-800 mb-2">{scenario.title}</h3>
              <p className="text-slate-600 text-sm mb-3 leading-relaxed">{scenario.context}</p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-amber-800 text-sm font-medium">{scenario.challenge}</p>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-2">
              {scenario.options.map((opt) => {
                const isChosen = chosen === opt.id;
                const isBest = opt.id === scenario.bestOption;
                const showResult = !!evaluation;
                return (
                  <button key={opt.id} onClick={() => answer(opt.id)} disabled={!!chosen || loading}
                    className={`w-full text-left px-4 py-3.5 rounded-xl border text-sm transition-all flex items-start gap-3 ${
                      showResult
                        ? isBest ? "bg-emerald-50 border-emerald-300 text-emerald-800" : isChosen && !isBest ? "bg-red-50 border-red-300 text-red-800" : "bg-slate-50 border-slate-200 text-slate-400"
                        : isChosen ? "bg-teal-50 border-teal-400 text-teal-800" : "bg-white border-slate-200 hover:border-teal-300 hover:bg-teal-50 text-slate-700"
                    }`}>
                    <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 flex-shrink-0 mt-0.5">{opt.id.toUpperCase()}</span>
                    <span className="flex-1">{opt.text}</span>
                    {showResult && isBest && <CheckCircle size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />}
                    {showResult && isChosen && !isBest && <XCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />}
                  </button>
                );
              })}
            </div>

            {loading && !evaluation && (
              <div className="text-center py-4"><Loader2 className="w-6 h-6 text-teal-500 animate-spin mx-auto" /></div>
            )}

            {/* Evaluation */}
            {evaluation && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  {evaluation.correct
                    ? <div className="flex items-center gap-2 text-emerald-600 font-bold"><CheckCircle size={18} /> Excellent choice!</div>
                    : <div className="flex items-center gap-2 text-amber-600 font-bold"><Trophy size={18} /> Learning opportunity</div>}
                  <span className={`ml-auto text-sm font-bold px-3 py-1 rounded-full ${evaluation.score >= 70 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>+{evaluation.score} pts</span>
                </div>
                <p className="text-slate-700 text-sm mb-2">{evaluation.feedback}</p>
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2.5">
                  <p className="text-indigo-700 text-xs font-medium"><span className="font-bold">Key insight:</span> {evaluation.insight}</p>
                </div>
                {evaluation.skillsUsed.length > 0 && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {evaluation.skillsUsed.map((s) => <span key={s} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{s}</span>)}
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                  <button onClick={start} className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all">
                    <RefreshCw size={14} /> Next Scenario
                  </button>
                  <button onClick={() => { setScenario(null); setEvaluation(null); setChosen(null); }}
                    className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all">
                    Change Setup
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

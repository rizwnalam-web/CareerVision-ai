import { useState } from "react";
import { motion } from "motion/react";
import { DollarSign, Send, Loader2, TrendingUp, AlertCircle, Trophy, RotateCcw, Lightbulb } from "lucide-react";
import { getSalaryScenario, submitNegotiationResponse, type SalaryScenario, type NegotiationResponse } from "../services/innovativeFeaturesService";

export default function SalaryNegotiationCoach({ profile }: { profile?: any }) {
  const [role, setRole] = useState(profile?.targetCareer || "");
  const [experience, setExperience] = useState("3-5 years");
  const [location, setLocation] = useState(profile?.country || "United States");
  const [currentOffer, setCurrentOffer] = useState(85000);
  const [scenario, setScenario] = useState<SalaryScenario | null>(null);
  const [history, setHistory] = useState<{ type: "hr" | "user"; text: string; meta?: NegotiationResponse }[]>([]);
  const [input, setInput] = useState("");
  const [round, setRound] = useState(0);
  const [loading, setLoading] = useState(false);
  const [closed, setClosed] = useState(false);
  const [totalScore, setTotalScore] = useState(0);

  const start = async () => {
    setLoading(true);
    try {
      const s = await getSalaryScenario(role, experience, location, currentOffer);
      setScenario(s);
      setHistory([{ type: "hr", text: s.employerOpeningLine }]);
      setRound(1); setClosed(false); setTotalScore(0);
    } catch { alert("Failed to load scenario. Please try again."); }
    finally { setLoading(false); }
  };

  const respond = async () => {
    if (!input.trim() || !scenario || closed) return;
    const userText = input.trim(); setInput(""); setLoading(true);
    setHistory((h) => [...h, { type: "user", text: userText }]);
    try {
      const resp = await submitNegotiationResponse(scenario, userText, round);
      setHistory((h) => [...h, { type: "hr", text: resp.hrReply, meta: resp }]);
      setTotalScore((s) => s + resp.negotiationScore);
      setRound((r) => r + 1);
      if (resp.dealClosed) setClosed(true);
    } catch { alert("Failed to process response."); }
    finally { setLoading(false); }
  };

  const avgScore = round > 1 ? Math.round(totalScore / (round - 1)) : 0;
  const formatSalary = (n: number) => `$${n.toLocaleString()}`;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
          <DollarSign className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900">Salary Negotiation Coach</h1>
          <p className="text-xs text-slate-500">Practice real negotiation scenarios with AI feedback</p>
        </div>
        {round > 1 && <div className="ml-auto text-sm font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">Score: {avgScore}/100</div>}
      </div>

      {!scenario ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-4">Configure your negotiation scenario</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Target role *</label>
              <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Senior Developer"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-400" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Experience level</label>
              <select value={experience} onChange={(e) => setExperience(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-400">
                {["0-2 years", "3-5 years", "6-10 years", "10+ years"].map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Location</label>
              <input value={location} onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-400" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Initial offer ($)</label>
              <input type="number" value={currentOffer} onChange={(e) => setCurrentOffer(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-400" />
            </div>
          </div>
          <button onClick={start} disabled={loading || !role.trim()}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-emerald-400 hover:to-green-400 transition-all disabled:opacity-50 shadow-md shadow-emerald-200">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />} Start Negotiation
          </button>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {/* Market context bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap gap-4 items-center text-sm">
            <div className="text-center">
              <div className="text-xs text-slate-500 mb-0.5">Initial offer</div>
              <div className="font-bold text-slate-700">{formatSalary(scenario.initialOffer)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-slate-500 mb-0.5">Market min</div>
              <div className="font-bold text-red-500">{formatSalary(scenario.marketMin)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-slate-500 mb-0.5">Market median</div>
              <div className="font-bold text-emerald-600">{formatSalary(scenario.marketMedian)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-slate-500 mb-0.5">Market max</div>
              <div className="font-bold text-indigo-600">{formatSalary(scenario.marketMax)}</div>
            </div>
            <button onClick={() => setScenario(null)} className="ml-auto text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"><RotateCcw size={12} /> Reset</button>
          </div>

          {/* Tips */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2"><Lightbulb size={14} className="text-amber-500" /><span className="text-xs font-semibold text-amber-700">Quick tips</span></div>
            <ul className="space-y-1">{scenario.tips.map((t, i) => <li key={i} className="text-xs text-amber-700">• {t}</li>)}</ul>
          </div>

          {/* Chat */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3 max-h-80 overflow-y-auto">
            {history.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.type === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white ${msg.type === "user" ? "bg-indigo-600" : "bg-emerald-600"}`}>
                  {msg.type === "user" ? "You" : "HR"}
                </div>
                <div className="max-w-[80%] space-y-1">
                  <div className={`px-3 py-2.5 rounded-xl text-sm ${msg.type === "user" ? "bg-indigo-600 text-white rounded-tr-sm" : "bg-slate-50 border border-slate-200 text-slate-700 rounded-tl-sm"}`}>
                    {msg.text}
                  </div>
                  {msg.meta && (
                    <div className="flex items-center gap-2">
                      {msg.meta.newOffer && <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">New offer: {formatSalary(msg.meta.newOffer)}</span>}
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{msg.meta.tactic}</span>
                      <span className={`text-xs font-bold ${msg.meta.negotiationScore >= 70 ? "text-emerald-600" : "text-amber-600"}`}>{msg.meta.negotiationScore}/100</span>
                    </div>
                  )}
                  {msg.meta?.feedback && <p className="text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg px-2 py-1">💬 {msg.meta.feedback}</p>}
                </div>
              </div>
            ))}
            {loading && <div className="flex justify-center"><Loader2 className="w-5 h-5 text-emerald-400 animate-spin" /></div>}
          </div>

          {closed ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-center">
              <Trophy className="w-10 h-10 text-amber-400 mx-auto mb-2" />
              <h3 className="font-bold text-slate-800 mb-1">Negotiation complete!</h3>
              <p className="text-slate-500 text-sm mb-1">Average score: <span className="font-bold text-emerald-600">{avgScore}/100</span></p>
              {history.find(h => h.meta?.finalOffer) && <p className="text-sm text-emerald-700 font-medium mb-4">Final offer: {formatSalary(history.findLast(h => h.meta?.finalOffer)?.meta?.finalOffer ?? 0)}</p>}
              <button onClick={() => setScenario(null)} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-all">Practice Again</button>
            </motion.div>
          ) : (
            <div className="flex gap-2">
              <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && respond()}
                placeholder="Type your negotiation response…"
                className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-emerald-400 shadow-sm" />
              <button onClick={respond} disabled={!input.trim() || loading}
                className="w-11 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 flex items-center justify-center text-white transition-all">
                <Send size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

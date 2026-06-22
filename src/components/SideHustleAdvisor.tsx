import { useState } from "react";
import { motion } from "motion/react";
import { Zap, Loader2, ExternalLink, TrendingUp, Clock, DollarSign, Star, ChevronDown, ChevronUp } from "lucide-react";
import { getSideHustles, type SideHustle } from "../services/innovativeFeaturesService";

const CATEGORY_COLORS: Record<string, string> = {
  Freelance: "bg-indigo-50 text-indigo-700 border-indigo-200",
  Content: "bg-rose-50 text-rose-700 border-rose-200",
  Teaching: "bg-amber-50 text-amber-700 border-amber-200",
  Product: "bg-violet-50 text-violet-700 border-violet-200",
  Service: "bg-teal-50 text-teal-700 border-teal-200",
  Investment: "bg-emerald-50 text-emerald-700 border-emerald-200",
};
const DIFFICULTY_COLORS = { Easy: "text-emerald-600 bg-emerald-50 border-emerald-200", Medium: "text-amber-600 bg-amber-50 border-amber-200", Hard: "text-red-600 bg-red-50 border-red-200" };

export default function SideHustleAdvisor({ profile }: { profile?: any }) {
  const [skills, setSkills] = useState<string[]>(profile?.skills?.slice(0, 5) ?? []);
  const [interests, setInterests] = useState<string[]>(profile?.interests?.slice(0, 5) ?? []);
  const [weeklyHours, setWeeklyHours] = useState(10);
  const [incomeGoal, setIncomeGoal] = useState(500);
  const [skillInput, setSkillInput] = useState("");
  const [interestInput, setInterestInput] = useState("");
  const [hustles, setHustles] = useState<SideHustle[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  const addTag = (val: string, list: string[], setter: (v: string[]) => void, inputSetter: (v: string) => void) => {
    const t = val.trim();
    if (t && !list.includes(t)) setter([...list, t]);
    inputSetter("");
  };

  const generate = async () => {
    setLoading(true);
    try {
      const result = await getSideHustles(skills, interests, profile?.targetCareer, weeklyHours, incomeGoal);
      setHustles(result.sort((a, b) => b.fitScore - a.fitScore));
    } catch { alert("Failed to generate suggestions. Please try again."); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900">Side Hustle Advisor</h1>
          <p className="text-xs text-slate-500">AI-powered income opportunities based on your skills and interests</p>
        </div>
      </div>

      {/* Config form */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm mb-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">Weekly hours available</label>
            <input type="number" min={1} max={40} value={weeklyHours} onChange={(e) => setWeeklyHours(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-amber-400" />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">Monthly income goal ($)</label>
            <input type="number" min={0} value={incomeGoal} onChange={(e) => setIncomeGoal(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-amber-400" />
          </div>
        </div>

        {/* Skills */}
        <div className="mb-3">
          <label className="text-xs text-slate-500 mb-1.5 block">Your skills</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {skills.map((s) => <span key={s} className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full cursor-pointer hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors" onClick={() => setSkills(skills.filter((x) => x !== s))}>{s} ×</span>)}
          </div>
          <div className="flex gap-2">
            <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTag(skillInput, skills, setSkills, setSkillInput)}
              placeholder="Add skill and press Enter…" className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-400" />
          </div>
        </div>

        {/* Interests */}
        <div className="mb-4">
          <label className="text-xs text-slate-500 mb-1.5 block">Your interests</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {interests.map((s) => <span key={s} className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full cursor-pointer hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors" onClick={() => setInterests(interests.filter((x) => x !== s))}>{s} ×</span>)}
          </div>
          <div className="flex gap-2">
            <input value={interestInput} onChange={(e) => setInterestInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTag(interestInput, interests, setInterests, setInterestInput)}
              placeholder="Add interest and press Enter…" className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-400" />
          </div>
        </div>

        <button onClick={generate} disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-amber-400 hover:to-orange-400 transition-all disabled:opacity-50 shadow-md shadow-orange-200">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} Find My Side Hustles
        </button>
      </div>

      {/* Results */}
      {hustles.length > 0 && (
        <div className="space-y-3">
          {hustles.map((h, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 cursor-pointer" onClick={() => setExpanded(expanded === i ? null : i)}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-lg flex-shrink-0">💡</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-bold text-slate-800 text-sm">{h.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${CATEGORY_COLORS[h.category] ?? "bg-slate-50 text-slate-600 border-slate-200"}`}>{h.category}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${DIFFICULTY_COLORS[h.difficulty]}`}>{h.difficulty}</span>
                    </div>
                    <p className="text-slate-500 text-xs line-clamp-1">{h.description}</p>
                    <div className="flex gap-4 mt-2 text-xs text-slate-600">
                      <span className="flex items-center gap-1"><DollarSign size={11} className="text-emerald-500" />${h.monthlyEarning.min}–${h.monthlyEarning.max}/mo</span>
                      <span className="flex items-center gap-1"><Clock size={11} className="text-indigo-400" />{h.hoursPerWeek}h/wk</span>
                      <span className="flex items-center gap-1"><Star size={11} className="text-amber-400" />{h.fitScore}% fit</span>
                    </div>
                  </div>
                  <div className="ml-2 text-slate-400">{expanded === i ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</div>
                </div>
              </div>

              {expanded === i && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-3">
                  <p className="text-slate-600 text-sm">{h.description}</p>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1"><TrendingUp size={12} /> How to get started</h4>
                    <ol className="space-y-1">{h.gettingStarted.map((s, j) => <li key={j} className="text-xs text-slate-600 flex gap-2"><span className="font-bold text-amber-500">{j + 1}.</span>{s}</li>)}</ol>
                  </div>
                  {h.skills.length > 0 && <div className="flex gap-1.5 flex-wrap">{h.skills.map((s) => <span key={s} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{s}</span>)}</div>}
                  {h.platforms.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-slate-700 mb-1.5">Platforms</h4>
                      <div className="flex gap-1.5 flex-wrap">{h.platforms.map((p) => <span key={p} className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full flex items-center gap-1"><ExternalLink size={10} />{p}</span>)}</div>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

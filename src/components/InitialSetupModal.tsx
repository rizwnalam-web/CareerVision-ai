import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle, Loader2, Sparkles, Target, Wallet, X } from "lucide-react";
import type { WorkPreferences } from "../types/jobMatch";
import { cn } from "../lib/utils";

interface InitialSetupModalProps {
  isOpen: boolean;
  saving: boolean;
  onSave: (preferences: Partial<WorkPreferences>) => Promise<void>;
  onClose: () => void;
}

const WORK_TYPES: Array<{ value: WorkPreferences["workTypePreference"]; label: string }> = [
  { value: "any", label: "Any" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "On-site" },
];

export const InitialSetupModal: React.FC<InitialSetupModalProps> = ({
  isOpen,
  saving,
  onSave,
  onClose,
}) => {
  const [prefs, setPrefs] = useState<WorkPreferences>({
    workTypePreference: "any",
    minSalary: null,
    maxSalary: null,
    salaryCurrency: "USD",
    preferredLocations: [],
    preferredIndustries: [],
    targetRole: null,
  });
  const [locationInput, setLocationInput] = useState("");
  const [industryInput, setIndustryInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const addTag = (field: "preferredLocations" | "preferredIndustries", value: string) => {
    const v = value.trim();
    if (!v) return;
    setPrefs(prev => {
      const arr = prev[field] || [];
      if (arr.includes(v)) return prev;
      return { ...prev, [field]: [...arr, v] };
    });
  };

  const removeTag = (field: "preferredLocations" | "preferredIndustries", value: string) => {
    setPrefs(prev => ({ ...prev, [field]: (prev[field] || []).filter(v => v !== value) }));
  };

  const handleSave = async () => {
    setError(null);
    if (!prefs.targetRole?.trim()) {
      setError("Target role is required");
      return;
    }
    try {
      await onSave({
        ...prefs,
        targetRole: prefs.targetRole.trim(),
      });
    } catch (err: any) {
      setError(err?.message || "Failed to save setup");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-slate-900/55 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            className="fixed inset-0 z-[91] flex items-center justify-center p-4"
          >
            <div className="w-full max-w-3xl max-h-[90vh] rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
              <div className="bg-gradient-to-br from-indigo-600 to-cyan-600 px-6 py-5 text-white shrink-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-100">First-time setup</p>
                    <h2 className="text-2xl font-black mt-1">Set your job search profile</h2>
                    <p className="text-sm text-indigo-100 mt-1">Complete this once and unlock your starter credits automatically.</p>
                  </div>
                  <button
                    onClick={onClose}
                    aria-label="Close setup"
                    className="h-8 w-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-5 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Target role</label>
                    <input
                      value={prefs.targetRole ?? ""}
                      onChange={e => setPrefs(p => ({ ...p, targetRole: e.target.value }))}
                      placeholder="e.g. Frontend Developer"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Work preference</label>
                    <div className="flex flex-wrap gap-2">
                      {WORK_TYPES.map(t => (
                        <button
                          key={t.value}
                          onClick={() => setPrefs(p => ({ ...p, workTypePreference: t.value }))}
                          className={cn(
                            "px-3 py-2 rounded-xl border text-xs font-black uppercase tracking-widest transition-colors",
                            prefs.workTypePreference === t.value
                              ? "bg-indigo-600 text-white border-indigo-600"
                              : "border-slate-200 text-slate-600 hover:border-indigo-300"
                          )}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-2 md:col-span-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Currency</label>
                    <select
                      value={prefs.salaryCurrency}
                      onChange={e => setPrefs(p => ({ ...p, salaryCurrency: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400"
                    >
                      {["USD", "GBP", "EUR", "CAD", "AUD", "INR", "SGD", "AED"].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Min salary</label>
                    <input
                      type="number"
                      value={prefs.minSalary ?? ""}
                      onChange={e => setPrefs(p => ({ ...p, minSalary: e.target.value ? Number.parseInt(e.target.value, 10) : null }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Max salary</label>
                    <input
                      type="number"
                      value={prefs.maxSalary ?? ""}
                      onChange={e => setPrefs(p => ({ ...p, maxSalary: e.target.value ? Number.parseInt(e.target.value, 10) : null }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Preferred locations</label>
                    <div className="flex gap-2">
                      <input
                        value={locationInput}
                        onChange={e => setLocationInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addTag("preferredLocations", locationInput);
                            setLocationInput("");
                          }
                        }}
                        placeholder="Add city/country"
                        className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400"
                      />
                      <button
                        onClick={() => {
                          addTag("preferredLocations", locationInput);
                          setLocationInput("");
                        }}
                        className="px-3 rounded-xl bg-slate-100 text-slate-700 text-xs font-black uppercase tracking-widest"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {prefs.preferredLocations.map(v => (
                        <button key={v} onClick={() => removeTag("preferredLocations", v)} className="px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-[11px] font-bold">
                          {v} x
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Preferred industries</label>
                    <div className="flex gap-2">
                      <input
                        value={industryInput}
                        onChange={e => setIndustryInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addTag("preferredIndustries", industryInput);
                            setIndustryInput("");
                          }
                        }}
                        placeholder="Add industry"
                        className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400"
                      />
                      <button
                        onClick={() => {
                          addTag("preferredIndustries", industryInput);
                          setIndustryInput("");
                        }}
                        className="px-3 rounded-xl bg-slate-100 text-slate-700 text-xs font-black uppercase tracking-widest"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {prefs.preferredIndustries.map(v => (
                        <button key={v} onClick={() => removeTag("preferredIndustries", v)} className="px-2 py-1 rounded-lg bg-cyan-50 text-cyan-700 text-[11px] font-bold">
                          {v} x
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <Wallet size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-emerald-800 flex items-center gap-1.5"><Sparkles size={14} /> One-time starter bonus</p>
                    <p className="text-xs text-emerald-700">Save your preferences to unlock your initial credit grant.</p>
                  </div>
                </div>

                {error && (
                  <div className="text-sm text-rose-600 font-semibold">{error}</div>
                )}

                <div className="flex items-center justify-between">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50"
                  >
                    Maybe later
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-black uppercase tracking-widest hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                    {saving ? "Saving..." : "Save and claim credits"}
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <Target size={12} />
                  These preferences also personalize job match, salary, and application recommendations.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default InitialSetupModal;

import { useState, useEffect, useCallback } from "react";
import {
  Plus, Search, Edit2, Trash2, Eye, ChevronDown, ChevronUp,
  RefreshCw, AlertCircle, CheckCircle, XCircle, Clock, Archive,
  BookOpen, Award, Gift, DollarSign, Calendar, Users, Star,
  Filter, Save, X, Globe, GraduationCap, Layers,
} from "lucide-react";
import { cn } from "../../lib/utils";
import {
  fetchScholarships, createScholarship, updateScholarship, deleteScholarship,
} from "../../services/scholarshipAdminService";
import type { Scholarship, OpportunityType, OpportunityStatus } from "../../types/scholarship";

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtCurrency(n?: number, currency = "USD") {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
}

function isDeadlineSoon(deadline?: string) {
  if (!deadline) return false;
  const diff = new Date(deadline).getTime() - Date.now();
  return diff > 0 && diff < 30 * 86_400_000;
}

const TYPE_META: Record<OpportunityType, { label: string; color: string; icon: React.ElementType }> = {
  scholarship: { label: "Scholarship", color: "bg-indigo-700 text-indigo-100",  icon: GraduationCap },
  fellowship:  { label: "Fellowship",  color: "bg-violet-700 text-violet-100",   icon: Star },
  grant:       { label: "Grant",       color: "bg-emerald-700 text-emerald-100", icon: Gift },
  bursary:     { label: "Bursary",     color: "bg-amber-700 text-amber-100",     icon: DollarSign },
  award:       { label: "Award",       color: "bg-rose-700 text-rose-100",       icon: Award },
};

const STATUS_META: Record<OpportunityStatus, { label: string; color: string; icon: React.ElementType }> = {
  active:   { label: "Active",   color: "bg-emerald-700 text-emerald-100", icon: CheckCircle },
  draft:    { label: "Draft",    color: "bg-slate-600 text-slate-200",     icon: Clock },
  closed:   { label: "Closed",   color: "bg-rose-700 text-rose-100",       icon: XCircle },
  archived: { label: "Archived", color: "bg-slate-700 text-slate-400",     icon: Archive },
};

// ── Blank scholarship form ─────────────────────────────────────────────────────
const BLANK_FORM: Omit<Scholarship, "id" | "createdAt" | "updatedAt" | "viewCount" | "applicationCount"> = {
  type: "scholarship",
  title: "",
  provider: "",
  description: "",
  eligibility: {},
  benefits: [],
  currency: "USD",
  deadline: "",
  tags: [],
  status: "draft",
  featured: false,
  createdBy: "",
};

// ── ScholarshipForm ───────────────────────────────────────────────────────────
function ScholarshipForm({
  initial,
  adminEmail,
  onSave,
  onCancel,
  saving,
}: {
  initial?: Scholarship;
  adminEmail: string;
  onSave: (data: Omit<Scholarship, "id" | "createdAt" | "updatedAt" | "viewCount" | "applicationCount">) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState(() => initial
    ? { type: initial.type, title: initial.title, provider: initial.provider, description: initial.description,
        eligibility: initial.eligibility, benefits: initial.benefits, currency: initial.currency,
        deadline: initial.deadline.slice(0, 10), applicationOpenDate: initial.applicationOpenDate?.slice(0, 10) ?? "",
        tags: initial.tags, status: initial.status, featured: initial.featured, totalSlots: initial.totalSlots,
        totalValue: initial.totalValue, applicationUrl: initial.applicationUrl ?? "", createdBy: initial.createdBy }
    : { ...BLANK_FORM, createdBy: adminEmail, deadline: "", applicationOpenDate: "" }
  );

  const [tagInput, setTagInput] = useState("");

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  function addTag() {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) set("tags", [...form.tags, t]);
    setTagInput("");
  }

  function removeTag(t: string) {
    set("tags", form.tags.filter(x => x !== t));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      ...form,
      deadline: form.deadline ? new Date(form.deadline).toISOString() : "",
      applicationOpenDate: form.applicationOpenDate ? new Date(form.applicationOpenDate).toISOString() : undefined,
      createdBy: adminEmail,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Title *</label>
          <input required value={form.title} onChange={e => set("title", e.target.value)}
            placeholder="e.g. Global STEM Excellence Award"
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Provider *</label>
          <input required value={form.provider} onChange={e => set("provider", e.target.value)}
            placeholder="e.g. TechForward Foundation"
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Type *</label>
          <select required value={form.type} onChange={e => set("type", e.target.value as OpportunityType)}
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            {(Object.keys(TYPE_META) as OpportunityType[]).map(t => (
              <option key={t} value={t}>{TYPE_META[t].label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status *</label>
          <select required value={form.status} onChange={e => set("status", e.target.value as OpportunityStatus)}
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            {(Object.keys(STATUS_META) as OpportunityStatus[]).map(s => (
              <option key={s} value={s}>{STATUS_META[s].label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Value</label>
          <input type="number" min={0} value={form.totalValue ?? ""} onChange={e => set("totalValue", e.target.value ? Number(e.target.value) : undefined)}
            placeholder="50000"
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Currency</label>
          <select value={form.currency} onChange={e => set("currency", e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            {["USD","EUR","GBP","CAD","AUD","ZAR","NGN"].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Description *</label>
        <textarea required rows={3} value={form.description} onChange={e => set("description", e.target.value)}
          placeholder="Describe the scholarship purpose, scope, and any key information..."
          className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
      </div>

      {/* Deadlines */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Application Deadline *</label>
          <input required type="date" value={form.deadline} onChange={e => set("deadline", e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Open Date</label>
          <input type="date" value={form.applicationOpenDate ?? ""} onChange={e => set("applicationOpenDate" as keyof typeof form, e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Slots</label>
          <input type="number" min={1} value={form.totalSlots ?? ""} onChange={e => set("totalSlots", e.target.value ? Number(e.target.value) : undefined)}
            placeholder="Unlimited"
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
      </div>

      {/* Eligibility row */}
      <div className="bg-slate-700/40 border border-slate-600/50 rounded-2xl p-4 space-y-3">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
          <Filter size={11} /> Eligibility Criteria
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Min GPA</label>
            <input type="number" step="0.1" min={0} max={4} value={form.eligibility.minGpa ?? ""}
              onChange={e => set("eligibility", { ...form.eligibility, minGpa: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="3.5"
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Min Age</label>
            <input type="number" min={0} value={form.eligibility.minAge ?? ""}
              onChange={e => set("eligibility", { ...form.eligibility, minAge: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="18"
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Max Age</label>
            <input type="number" min={0} value={form.eligibility.maxAge ?? ""}
              onChange={e => set("eligibility", { ...form.eligibility, maxAge: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="35"
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Max Income (USD)</label>
            <input type="number" min={0} value={form.eligibility.incomeThreshold ?? ""}
              onChange={e => set("eligibility", { ...form.eligibility, incomeThreshold: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="30000"
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Fields of Study (comma-separated)</label>
          <input value={(form.eligibility.fieldOfStudy ?? []).join(", ")}
            onChange={e => set("eligibility", { ...form.eligibility, fieldOfStudy: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
            placeholder="e.g. Computer Science, Engineering, Mathematics"
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Education Levels</label>
          <div className="flex flex-wrap gap-2">
            {["undergraduate", "postgraduate", "doctoral", "vocational"].map(level => (
              <label key={level} className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox"
                  checked={(form.eligibility.educationLevels ?? []).includes(level)}
                  onChange={e => {
                    const current = form.eligibility.educationLevels ?? [];
                    set("eligibility", { ...form.eligibility, educationLevels: e.target.checked ? [...current, level] : current.filter(l => l !== level) });
                  }}
                  className="accent-indigo-500 w-3.5 h-3.5" />
                <span className="text-xs text-slate-300 capitalize">{level}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Other Requirements</label>
          <input value={form.eligibility.otherRequirements ?? ""}
            onChange={e => set("eligibility", { ...form.eligibility, otherRequirements: e.target.value })}
            placeholder="Any additional criteria..."
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Tags</label>
        <div className="flex gap-2 mb-2 flex-wrap">
          {form.tags.map(t => (
            <span key={t} className="flex items-center gap-1 bg-indigo-800 text-indigo-200 text-xs px-2.5 py-1 rounded-full border border-indigo-700">
              {t}
              <button type="button" onClick={() => removeTag(t)} className="hover:text-white"><X size={10} /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={tagInput} onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(); }}}
            placeholder="Add tag and press Enter"
            className="flex-1 bg-slate-700 border border-slate-600 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <button type="button" onClick={addTag} className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-slate-200 text-sm rounded-xl transition-colors">Add</button>
        </div>
      </div>

      {/* Featured toggle */}
      <label className="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" checked={form.featured} onChange={e => set("featured", e.target.checked)}
          className="accent-amber-500 w-4 h-4" />
        <span className="text-sm text-slate-300">Mark as <strong className="text-amber-400">Featured</strong> (shown prominently to students)</span>
      </label>

      {/* Application URL */}
      <div>
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">External Application URL</label>
        <input type="url" value={form.applicationUrl ?? ""} onChange={e => set("applicationUrl" as keyof typeof form, e.target.value)}
          placeholder="https://provider.org/apply"
          className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2 border-t border-slate-700">
        <button type="button" onClick={onCancel}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-bold rounded-xl transition-colors">
          <X size={14} /> Cancel
        </button>
        <button type="submit" disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-60">
          {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
          {initial ? "Save Changes" : "Create Scholarship"}
        </button>
      </div>
    </form>
  );
}

// ── Main ScholarshipManager ────────────────────────────────────────────────────
export default function ScholarshipManager({ adminEmail }: { adminEmail: string }) {
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<OpportunityType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<OpportunityStatus | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<Scholarship | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchScholarships();
      setScholarships(data);
    } catch {
      setError("Failed to load scholarships.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = scholarships.filter(s => {
    if (typeFilter !== "all" && s.type !== typeFilter) return false;
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return s.title.toLowerCase().includes(q) || s.provider.toLowerCase().includes(q) || s.tags.some(t => t.toLowerCase().includes(q));
    }
    return true;
  });

  async function handleSave(data: Omit<Scholarship, "id" | "createdAt" | "updatedAt" | "viewCount" | "applicationCount">) {
    setSaving(true);
    try {
      if (formMode === "edit" && editTarget) {
        const updated = await updateScholarship(editTarget.id, data);
        setScholarships(prev => prev.map(s => s.id === updated.id ? updated : s));
      } else {
        const created = await createScholarship(data);
        setScholarships(prev => [created, ...prev]);
      }
      setFormMode(null);
      setEditTarget(null);
    } catch {
      setError("Failed to save scholarship.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteScholarship(id);
      setScholarships(prev => prev.filter(s => s.id !== id));
    } catch {
      setError("Failed to delete scholarship.");
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }

  async function toggleStatus(s: Scholarship) {
    const next: OpportunityStatus = s.status === "active" ? "closed" : "active";
    try {
      const updated = await updateScholarship(s.id, { status: next });
      setScholarships(prev => prev.map(x => x.id === updated.id ? updated : x));
    } catch {
      setError("Failed to update status.");
    }
  }

  // Summary stats
  const totalValue = scholarships.reduce((sum, s) => sum + (s.totalValue ?? 0), 0);
  const activeCount = scholarships.filter(s => s.status === "active").length;
  const totalApplications = scholarships.reduce((sum, s) => sum + s.applicationCount, 0);

  if (formMode) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => { setFormMode(null); setEditTarget(null); }}
            className="text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5 text-sm">
            <X size={14} /> Cancel
          </button>
          <span className="text-slate-600">|</span>
          <h3 className="text-base font-black text-white">{formMode === "create" ? "Add New Opportunity" : `Edit: ${editTarget?.title}`}</h3>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <ScholarshipForm
            initial={editTarget ?? undefined}
            adminEmail={adminEmail}
            onSave={handleSave}
            onCancel={() => { setFormMode(null); setEditTarget(null); }}
            saving={saving}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <BookOpen size={16} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white leading-none">Scholarship & Opportunity Management</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">{scholarships.length} listings · {activeCount} active</p>
          </div>
        </div>
        <button onClick={() => { setFormMode("create"); setEditTarget(null); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-colors">
          <Plus size={14} /> Add Opportunity
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Listings", value: scholarships.length, color: "bg-indigo-600", icon: Layers },
          { label: "Active", value: activeCount, color: "bg-emerald-600", icon: CheckCircle },
          { label: "Total Applications", value: totalApplications, color: "bg-violet-600", icon: Users },
          { label: "Total Value", value: fmtCurrency(totalValue), color: "bg-amber-600", icon: DollarSign },
        ].map(s => (
          <div key={s.label} className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex items-center gap-3">
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", s.color)}>
              <s.icon size={16} className="text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
              <p className="text-lg font-black text-white">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search title, provider, tags…"
            className="bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as OpportunityType | "all")}
          className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="all">All Types</option>
          {(Object.keys(TYPE_META) as OpportunityType[]).map(t => <option key={t} value={t}>{TYPE_META[t].label}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as OpportunityStatus | "all")}
          className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="all">All Statuses</option>
          {(Object.keys(STATUS_META) as OpportunityStatus[]).map(s => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
        </select>
        <button onClick={load} className="ml-auto flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-xl transition-colors border border-slate-700">
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-rose-900 border border-rose-700 text-rose-200 text-sm px-4 py-3 rounded-xl">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <RefreshCw size={18} className="animate-spin mr-2" /> Loading scholarships…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500 text-sm bg-slate-800/40 rounded-2xl border border-slate-700/40">
          No opportunities match your filters.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(s => {
            const TIcon = TYPE_META[s.type].icon;
            const SIcon = STATUS_META[s.status].icon;
            const soon = isDeadlineSoon(s.deadline);
            const isExpanded = expandedId === s.id;

            return (
              <div key={s.id} className="bg-[#0d1526] border border-slate-700/60 rounded-2xl overflow-hidden">
                {/* Card header */}
                <div className="px-5 py-4 flex items-center gap-4">
                  {/* Type icon */}
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", TYPE_META[s.type].color.split(" ")[0])}>
                    <TIcon size={16} className="text-white" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="font-black text-white text-sm">{s.title}</span>
                      {s.featured && <span className="text-[9px] font-black bg-amber-700 text-amber-100 px-2 py-0.5 rounded-full uppercase tracking-widest">Featured</span>}
                      {soon && <span className="text-[9px] font-black bg-rose-800 text-rose-200 px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse">Deadline Soon</span>}
                    </div>
                    <div className="flex items-center gap-3 flex-wrap text-xs text-slate-400">
                      <span className="flex items-center gap-1"><Globe size={10} /> {s.provider}</span>
                      <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-full", TYPE_META[s.type].color)}>{TYPE_META[s.type].label}</span>
                      <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1", STATUS_META[s.status].color)}>
                        <SIcon size={10} /> {STATUS_META[s.status].label}
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="hidden md:flex items-center gap-5 text-center shrink-0">
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Value</p>
                      <p className="text-sm font-black text-amber-400">{s.totalValue ? fmtCurrency(s.totalValue, s.currency) : "Varies"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Applications</p>
                      <p className="text-sm font-black text-indigo-300">{s.applicationCount}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Deadline</p>
                      <p className={cn("text-sm font-black", soon ? "text-rose-400" : "text-slate-300")}>{fmtDate(s.deadline)}</p>
                    </div>
                    {s.totalSlots && (
                      <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Slots</p>
                        <p className="text-sm font-black text-slate-300">{s.filledSlots ?? 0}/{s.totalSlots}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => toggleStatus(s)} title={s.status === "active" ? "Close scholarship" : "Activate scholarship"}
                      className={cn("p-1.5 rounded-lg transition-colors text-xs font-bold",
                        s.status === "active" ? "bg-rose-800/50 hover:bg-rose-700/70 text-rose-300" : "bg-emerald-800/50 hover:bg-emerald-700/70 text-emerald-300")}>
                      {s.status === "active" ? <XCircle size={14} /> : <CheckCircle size={14} />}
                    </button>
                    <button onClick={() => { setEditTarget(s); setFormMode("edit"); }}
                      className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors">
                      <Edit2 size={14} />
                    </button>
                    {confirmDeleteId === s.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleDelete(s.id)} disabled={deletingId === s.id}
                          className="px-2 py-1 bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-60">
                          {deletingId === s.id ? <RefreshCw size={10} className="animate-spin" /> : "Confirm"}
                        </button>
                        <button onClick={() => setConfirmDeleteId(null)} className="px-2 py-1 bg-slate-700 text-slate-300 text-xs font-bold rounded-lg">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDeleteId(s.id)}
                        className="p-1.5 rounded-lg bg-slate-700 hover:bg-rose-800/60 text-slate-400 hover:text-rose-300 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    )}
                    <button onClick={() => setExpandedId(isExpanded ? null : s.id)}
                      className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-white transition-colors">
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-slate-700/60 bg-[#090e1a] px-6 py-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Description</p>
                      <p className="text-slate-300 leading-relaxed">{s.description}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Eligibility</p>
                      {s.eligibility.minGpa && <p className="text-slate-300">Min GPA: <strong className="text-white">{s.eligibility.minGpa}</strong></p>}
                      {s.eligibility.minAge && <p className="text-slate-300">Age: <strong className="text-white">{s.eligibility.minAge}–{s.eligibility.maxAge ?? "+"}</strong></p>}
                      {s.eligibility.incomeThreshold && <p className="text-slate-300">Max Income: <strong className="text-white">{fmtCurrency(s.eligibility.incomeThreshold)}</strong></p>}
                      {(s.eligibility.educationLevels?.length ?? 0) > 0 && (
                        <p className="text-slate-300">Education: <strong className="text-white">{s.eligibility.educationLevels!.join(", ")}</strong></p>
                      )}
                      {(s.eligibility.fieldOfStudy?.length ?? 0) > 0 && (
                        <p className="text-slate-300">Fields: <strong className="text-white">{s.eligibility.fieldOfStudy!.join(", ")}</strong></p>
                      )}
                      {s.eligibility.otherRequirements && <p className="text-slate-300">{s.eligibility.otherRequirements}</p>}
                    </div>
                    <div className="space-y-2">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tags</p>
                      <div className="flex flex-wrap gap-1">
                        {s.tags.map(t => (
                          <span key={t} className="bg-indigo-800/60 text-indigo-300 text-[10px] px-2 py-0.5 rounded-full border border-indigo-700/50">{t}</span>
                        ))}
                      </div>
                      {s.viewCount > 0 && (
                        <p className="text-slate-400 flex items-center gap-1"><Eye size={10} /> {s.viewCount.toLocaleString()} views</p>
                      )}
                      {s.applicationUrl && (
                        <a href={s.applicationUrl} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 underline break-all">
                          External Application Link
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!loading && (
        <p className="text-xs text-slate-500">Showing {filtered.length} of {scholarships.length} listings</p>
      )}
    </div>
  );
}

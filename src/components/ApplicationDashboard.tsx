import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Briefcase, Plus, Loader2, Search, Filter, CalendarDays, Clock3,
  CheckCircle2, CircleDashed, XCircle, Trophy, Trash2, Edit3,
  ExternalLink, Sparkles, FileText, Building2, MapPin, Target,
  MessageSquareQuote, Save, X,
} from "lucide-react";
import { cn } from "../lib/utils";
import {
  getApplications,
  createApplication,
  updateApplication,
  deleteApplication,
  getApplicationEvents,
  addApplicationNote,
  getAICoaching,
  type JobApplication,
  type JobApplicationInput,
  type ApplicationStatus,
  type ApplicationEvent,
  type ApplicationStats,
} from "../services/applicationService";

interface Props {
  userId: string;
}

const STATUS_META: Record<ApplicationStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  saved:         { label: "Saved",         color: "text-slate-600",    bg: "bg-slate-100 border-slate-200",       icon: CircleDashed },
  applied:       { label: "Applied",       color: "text-blue-600",     bg: "bg-blue-50 border-blue-200",          icon: Briefcase },
  interviewing:  { label: "Interviewing",  color: "text-amber-600",    bg: "bg-amber-50 border-amber-200",        icon: CalendarDays },
  offered:       { label: "Offered",       color: "text-emerald-600",  bg: "bg-emerald-50 border-emerald-200",    icon: Trophy },
  rejected:      { label: "Rejected",      color: "text-rose-600",     bg: "bg-rose-50 border-rose-200",          icon: XCircle },
  withdrawn:     { label: "Withdrawn",     color: "text-slate-500",    bg: "bg-slate-50 border-slate-200",        icon: X },
};

const STATUS_OPTIONS: ApplicationStatus[] = ["saved", "applied", "interviewing", "offered", "rejected", "withdrawn"];

const emptyForm: Partial<JobApplicationInput> = {
  jobTitle: "",
  company: "",
  location: "",
  workType: "",
  salaryMin: undefined,
  salaryMax: undefined,
  salaryCurrency: "USD",
  jobUrl: "",
  jobDescription: "",
  status: "saved",
  appliedAt: "",
  deadline: "",
  resumeVersionId: "",
  coverLetterSent: false,
  notes: "",
  nextStep: "",
  followUpDate: "",
  source: "manual",
  tags: [],
};

const StatCard = ({ label, value, tone, icon: Icon, sublabel }: { label: string; value: string | number; tone: string; icon: React.ElementType; sublabel?: string }) => (
  <div className={cn("rounded-2xl border p-5", tone)}>
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</p>
        <p className="text-3xl font-black text-slate-900 mt-2 leading-none">{value}</p>
        {sublabel && <p className="text-xs text-slate-500 mt-2">{sublabel}</p>}
      </div>
      <div className="w-10 h-10 rounded-2xl bg-white/70 border border-white shadow-sm flex items-center justify-center">
        <Icon size={18} className="text-slate-700" />
      </div>
    </div>
  </div>
);

const SectionCard: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode; actions?: React.ReactNode }> = ({ title, icon: Icon, children, actions }) => (
  <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Icon size={15} className="text-indigo-500" />
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-700">{title}</h3>
      </div>
      {actions}
    </div>
    {children}
  </div>
);

const TextInput = ({ label, value, onChange, placeholder, multiline = false, rows = 3, type = "text" }: {
  label: string;
  value: string | number | undefined;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  type?: string;
}) => (
  <div className="space-y-1">
    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</label>
    {multiline ? (
      <textarea
        value={value ?? ""}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 resize-none"
      />
    ) : (
      <input
        type={type}
        value={value ?? ""}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50"
      />
    )}
  </div>
);

export default function ApplicationDashboard({ userId }: Props) {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [stats, setStats] = useState<ApplicationStats>({ total: 0, byStatus: {}, applied: 0, interviewing: 0, offered: 0, rejected: 0, responseRate: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<JobApplication | null>(null);
  const [form, setForm] = useState<Partial<JobApplicationInput>>(emptyForm);

  const [selected, setSelected] = useState<JobApplication | null>(null);
  const [events, setEvents] = useState<ApplicationEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [note, setNote] = useState("");
  const [aiCoachLoading, setAiCoachLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        setLoading(true);
        const data = await getApplications(userId);
        setApplications(data.applications || []);
        setStats(data.stats);
      } catch (e: any) {
        setError(e.message || "Failed to load applications");
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const filtered = useMemo(() => {
    return applications.filter(app => {
      const term = search.trim().toLowerCase();
      const matchesSearch = !term || [app.jobTitle, app.company, app.location, app.notes, app.nextStep].filter(Boolean).some(v => String(v).toLowerCase().includes(term));
      const matchesStatus = statusFilter === "all" || app.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [applications, search, statusFilter]);

  const showSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
  };

  const refresh = async () => {
    const data = await getApplications(userId);
    setApplications(data.applications || []);
    setStats(data.stats);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (app: JobApplication) => {
    setEditing(app);
    setForm({
      jobTitle: app.jobTitle,
      company: app.company,
      location: app.location || "",
      workType: app.workType || "",
      salaryMin: app.salaryMin,
      salaryMax: app.salaryMax,
      salaryCurrency: app.salaryCurrency || "USD",
      jobUrl: app.jobUrl || "",
      jobDescription: app.jobDescription || "",
      status: app.status,
      appliedAt: app.appliedAt ? app.appliedAt.slice(0, 10) : "",
      deadline: app.deadline ? app.deadline.slice(0, 10) : "",
      resumeVersionId: app.resumeVersionId || "",
      coverLetterSent: app.coverLetterSent,
      notes: app.notes || "",
      nextStep: app.nextStep || "",
      followUpDate: app.followUpDate ? app.followUpDate.slice(0, 10) : "",
      source: app.source,
      tags: app.tags || [],
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.jobTitle?.trim() || !form.company?.trim()) {
      setError("Job title and company are required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...form,
        salaryMin: form.salaryMin ? Number(form.salaryMin) : undefined,
        salaryMax: form.salaryMax ? Number(form.salaryMax) : undefined,
      };
      if (editing) {
        await updateApplication(userId, editing.id, payload);
        showSuccess("Application updated");
      } else {
        await createApplication(userId, payload);
        showSuccess("Application added");
      }
      setShowForm(false);
      await refresh();
    } catch (e: any) {
      setError(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteApplication(userId, id);
      if (selected?.id === id) setSelected(null);
      await refresh();
      showSuccess("Application deleted");
    } catch (e: any) {
      setError(e.message || "Delete failed");
    }
  };

  const openDetails = async (app: JobApplication) => {
    setSelected(app);
    try {
      setEventsLoading(true);
      const data = await getApplicationEvents(userId, app.id);
      setEvents(data);
    } catch {
      setEvents([]);
    } finally {
      setEventsLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!selected || !note.trim()) return;
    try {
      await addApplicationNote(userId, selected.id, note.trim());
      setNote("");
      const data = await getApplicationEvents(userId, selected.id);
      setEvents(data);
      showSuccess("Timeline note added");
    } catch (e: any) {
      setError(e.message || "Failed to add note");
    }
  };

  const handleAICoach = async () => {
    if (!selected) return;
    try {
      setAiCoachLoading(true);
      const coaching = await getAICoaching(userId, selected.id);
      const updated = await updateApplication(userId, selected.id, {
        ...selected,
        nextStep: coaching.nextStep,
        followUpDate: coaching.followUpInDays ? new Date(Date.now() + coaching.followUpInDays * 86400000).toISOString().slice(0, 10) : selected.followUpDate,
      });
      setSelected(updated);
      await refresh();
      showSuccess("AI next-step plan added");
    } catch (e: any) {
      setError(e.message || "AI coaching failed");
    } finally {
      setAiCoachLoading(false);
    }
  };

  const overdueCount = applications.filter(app => app.followUpDate && new Date(app.followUpDate) < new Date() && !["offered", "rejected", "withdrawn"].includes(app.status)).length;
  const resumeSentCount = applications.filter(app => app.status !== "saved").length;
  const coverLetterCount = applications.filter(app => app.coverLetterSent).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Applications Dashboard</h1>
          <p className="text-[10px] text-indigo-500 font-black uppercase tracking-[0.2em] mt-1">
            Clear overview of jobs tracked, resumes sent, statuses, follow-ups, and next actions
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-200"
        >
          <Plus size={14} /> Add Application
        </button>
      </div>

      <AnimatePresence>
        {(error || success) && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={cn(
              "flex items-center gap-3 px-5 py-3 rounded-2xl text-sm font-bold",
              error ? "bg-rose-50 border border-rose-200 text-rose-700" : "bg-emerald-50 border border-emerald-200 text-emerald-700"
            )}
          >
            {error ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
            <span>{error || success}</span>
            <button className="ml-auto" onClick={() => { setError(null); setSuccess(null); }}>
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard label="Tracked Jobs" value={stats.total} tone="bg-slate-50 border-slate-200" icon={Briefcase} sublabel="All saved and submitted applications" />
        <StatCard label="Resumes Sent" value={resumeSentCount} tone="bg-blue-50 border-blue-200" icon={FileText} sublabel="Applications beyond draft stage" />
        <StatCard label="Interviews" value={stats.interviewing} tone="bg-amber-50 border-amber-200" icon={CalendarDays} sublabel="Currently in interview process" />
        <StatCard label="Offers" value={stats.offered} tone="bg-emerald-50 border-emerald-200" icon={Trophy} sublabel="Applications converted to offers" />
        <StatCard label="Follow-Ups Due" value={overdueCount} tone="bg-rose-50 border-rose-200" icon={Clock3} sublabel="Applications needing action" />
      </div>

      <div className="grid grid-cols-12 gap-6">
        <section className="col-span-12 xl:col-span-8 space-y-6">
          <SectionCard
            title="Pipeline"
            icon={Target}
            actions={
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search company, role, note…"
                    className="pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-400"
                  />
                </div>
                <div className="relative">
                  <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value as ApplicationStatus | "all")}
                    className="pl-9 pr-8 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-indigo-400"
                  >
                    <option value="all">All statuses</option>
                    {STATUS_OPTIONS.map(status => <option key={status} value={status}>{STATUS_META[status].label}</option>)}
                  </select>
                </div>
              </div>
            }
          >
            {loading ? (
              <div className="flex flex-col items-center py-16 gap-3 text-slate-500">
                <Loader2 size={32} className="animate-spin text-indigo-500" />
                <p className="text-sm font-bold">Loading applications…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Briefcase size={40} className="mx-auto mb-4 opacity-30" />
                <p className="font-bold">No applications found</p>
                <p className="text-xs mt-1">Start tracking your job search from one place</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map(app => {
                  const meta = STATUS_META[app.status];
                  const Icon = meta.icon;
                  return (
                    <button
                      key={app.id}
                      onClick={() => openDetails(app)}
                      className={cn(
                        "w-full text-left rounded-2xl border p-4 transition-all hover:border-indigo-300 hover:shadow-sm",
                        selected?.id === app.id ? "border-indigo-300 bg-indigo-50/40" : "border-slate-200 bg-white"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-black text-slate-900 truncate">{app.jobTitle}</p>
                            <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-black uppercase tracking-widest", meta.bg, meta.color)}>
                              <Icon size={10} /> {meta.label}
                            </span>
                            {app.coverLetterSent && (
                              <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest border border-emerald-200">
                                Cover Letter Sent
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 flex-wrap">
                            <span className="inline-flex items-center gap-1"><Building2 size={12} /> {app.company}</span>
                            {app.location && <span className="inline-flex items-center gap-1"><MapPin size={12} /> {app.location}</span>}
                            {app.followUpDate && <span className="inline-flex items-center gap-1"><Clock3 size={12} /> Follow up {new Date(app.followUpDate).toLocaleDateString()}</span>}
                          </div>
                          {app.nextStep && <p className="text-xs text-indigo-600 mt-2 font-medium truncate">Next: {app.nextStep}</p>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {app.jobUrl && (
                            <a
                              href={app.jobUrl}
                              target="_blank"
                              rel="noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="p-2 rounded-xl hover:bg-slate-100 text-slate-500"
                            >
                              <ExternalLink size={14} />
                            </a>
                          )}
                          <button onClick={e => { e.stopPropagation(); openEdit(app); }} className="p-2 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 text-slate-500">
                            <Edit3 size={14} />
                          </button>
                          <button onClick={e => { e.stopPropagation(); handleDelete(app.id); }} className="p-2 rounded-xl hover:bg-rose-50 hover:text-rose-600 text-slate-500">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </section>

        <section className="col-span-12 xl:col-span-4 space-y-6">
          <SectionCard title="Performance Snapshot" icon={CheckCircle2}>
            <div className="space-y-3 text-sm text-slate-700">
              <div className="flex items-center justify-between"><span>Response rate</span><span className="font-black text-slate-900">{stats.responseRate}%</span></div>
              <div className="flex items-center justify-between"><span>Applied roles</span><span className="font-black text-slate-900">{stats.applied}</span></div>
              <div className="flex items-center justify-between"><span>Cover letters sent</span><span className="font-black text-slate-900">{coverLetterCount}</span></div>
              <div className="flex items-center justify-between"><span>Rejected</span><span className="font-black text-slate-900">{stats.rejected}</span></div>
            </div>
          </SectionCard>

          <SectionCard title="Application Details" icon={MessageSquareQuote}>
            {!selected ? (
              <div className="text-center py-10 text-slate-400">
                <MessageSquareQuote size={34} className="mx-auto mb-3 opacity-30" />
                <p className="font-bold">Select an application</p>
                <p className="text-xs mt-1">Review notes, next steps, and timeline here</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-black text-slate-900">{selected.jobTitle}</p>
                  <p className="text-xs text-slate-500 mt-1">{selected.company}{selected.location ? ` · ${selected.location}` : ""}</p>
                </div>

                <div className="space-y-2 text-xs text-slate-600">
                  <div><span className="font-black text-slate-700">Status:</span> {STATUS_META[selected.status].label}</div>
                  <div><span className="font-black text-slate-700">Resume sent:</span> {selected.status === "saved" ? "No" : "Yes"}</div>
                  <div><span className="font-black text-slate-700">Cover letter:</span> {selected.coverLetterSent ? "Sent" : "Not marked"}</div>
                  {selected.followUpDate && <div><span className="font-black text-slate-700">Follow-up date:</span> {new Date(selected.followUpDate).toLocaleDateString()}</div>}
                  {selected.nextStep && <div><span className="font-black text-slate-700">Next step:</span> {selected.nextStep}</div>}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleAICoach}
                    disabled={aiCoachLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    {aiCoachLoading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                    {aiCoachLoading ? "Thinking…" : "AI Next Step"}
                  </button>
                  <button
                    onClick={() => openEdit(selected)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    Edit
                  </button>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Timeline</p>
                  {eventsLoading ? (
                    <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 size={14} className="animate-spin" /> Loading events…</div>
                  ) : events.length === 0 ? (
                    <p className="text-xs text-slate-400">No timeline items yet</p>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-auto pr-1">
                      {events.map(event => (
                        <div key={event.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">{event.event_type.replace(/_/g, " ")}</span>
                            <span className="text-[10px] text-slate-400">{new Date(event.occurred_at).toLocaleString()}</span>
                          </div>
                          {event.description && <p className="text-xs text-slate-600 mt-1">{event.description}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <TextInput label="Add Timeline Note" value={note} onChange={setNote} placeholder="Recruiter emailed back, interview scheduled…" multiline rows={3} />
                  <button
                    onClick={handleAddNote}
                    disabled={!note.trim()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-50 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    <Save size={12} /> Add Note
                  </button>
                </div>
              </div>
            )}
          </SectionCard>
        </section>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div className="fixed inset-0 z-[70] flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-slate-950/45" onClick={() => setShowForm(false)} />
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 10 }}
              className="relative w-full max-w-3xl max-h-[90vh] overflow-auto rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 space-y-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">{editing ? "Edit Application" : "Add Application"}</h2>
                  <p className="text-[10px] text-indigo-500 font-black uppercase tracking-[0.2em] mt-1">Track job, resume sent, follow-ups, and statuses in one place</p>
                </div>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500"><X size={16} /></button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextInput label="Job Title" value={form.jobTitle} onChange={v => setForm(prev => ({ ...prev, jobTitle: v }))} placeholder="Senior Product Designer" />
                <TextInput label="Company" value={form.company} onChange={v => setForm(prev => ({ ...prev, company: v }))} placeholder="Stripe" />
                <TextInput label="Location" value={form.location} onChange={v => setForm(prev => ({ ...prev, location: v }))} placeholder="Remote / London" />
                <TextInput label="Work Type" value={form.workType} onChange={v => setForm(prev => ({ ...prev, workType: v }))} placeholder="Remote / Hybrid / On-site" />
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Status</label>
                  <select value={form.status} onChange={e => setForm(prev => ({ ...prev, status: e.target.value as ApplicationStatus }))} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50">
                    {STATUS_OPTIONS.map(status => <option key={status} value={status}>{STATUS_META[status].label}</option>)}
                  </select>
                </div>
                <TextInput label="Application URL" value={form.jobUrl} onChange={v => setForm(prev => ({ ...prev, jobUrl: v }))} placeholder="https://company.com/jobs/123" />
                <TextInput label="Applied Date" type="date" value={form.appliedAt} onChange={v => setForm(prev => ({ ...prev, appliedAt: v }))} />
                <TextInput label="Deadline" type="date" value={form.deadline} onChange={v => setForm(prev => ({ ...prev, deadline: v }))} />
                <TextInput label="Follow-up Date" type="date" value={form.followUpDate} onChange={v => setForm(prev => ({ ...prev, followUpDate: v }))} />
                <TextInput label="Salary Min" type="number" value={form.salaryMin} onChange={v => setForm(prev => ({ ...prev, salaryMin: v ? Number(v) : undefined }))} placeholder="90000" />
                <TextInput label="Salary Max" type="number" value={form.salaryMax} onChange={v => setForm(prev => ({ ...prev, salaryMax: v ? Number(v) : undefined }))} placeholder="120000" />
                <TextInput label="Currency" value={form.salaryCurrency} onChange={v => setForm(prev => ({ ...prev, salaryCurrency: v }))} placeholder="USD" />
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Source</label>
                  <select value={form.source} onChange={e => setForm(prev => ({ ...prev, source: e.target.value as JobApplicationInput["source"] }))} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50">
                    <option value="manual">Manual</option>
                    <option value="job-board">Job Board</option>
                    <option value="ai-match">AI Match</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-600 font-medium cursor-pointer">
                <input type="checkbox" checked={!!form.coverLetterSent} onChange={e => setForm(prev => ({ ...prev, coverLetterSent: e.target.checked }))} className="rounded" />
                Cover letter sent with this application
              </label>

              <TextInput label="Next Step" value={form.nextStep} onChange={v => setForm(prev => ({ ...prev, nextStep: v }))} placeholder="Follow up with recruiter next Tuesday" />
              <TextInput label="Notes" value={form.notes} onChange={v => setForm(prev => ({ ...prev, notes: v }))} placeholder="Interview process details, recruiter name, prep reminders…" multiline rows={4} />
              <TextInput label="Job Description" value={form.jobDescription} onChange={v => setForm(prev => ({ ...prev, jobDescription: v }))} placeholder="Paste JD for context and future AI coaching…" multiline rows={6} />

              <div className="flex justify-end gap-3">
                <button onClick={() => setShowForm(false)} className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-black uppercase tracking-widest transition-all">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-200">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {saving ? "Saving…" : editing ? "Update Application" : "Save Application"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import {
  Search, RefreshCw, AlertCircle, CheckCircle, XCircle, Clock,
  Eye, FileText, User, Mail, MapPin, GraduationCap,
  ChevronDown, ChevronUp, Filter, Download, Hourglass,
  MessageSquare, Calendar, BookOpen, Star,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { fetchApplications, updateApplicationStatus } from "../../services/scholarshipAdminService";
import type { Application, ApplicationStatus } from "../../types/scholarship";

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtDateTime(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const STATUS_META: Record<ApplicationStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  pending:      { label: "Pending",      color: "text-amber-300",   bg: "bg-amber-900/60 border-amber-700",   icon: Clock },
  under_review: { label: "Under Review", color: "text-blue-300",    bg: "bg-blue-900/60 border-blue-700",     icon: Eye },
  approved:     { label: "Approved",     color: "text-emerald-300", bg: "bg-emerald-900/60 border-emerald-700", icon: CheckCircle },
  rejected:     { label: "Rejected",     color: "text-rose-300",    bg: "bg-rose-900/60 border-rose-700",     icon: XCircle },
  waitlisted:   { label: "Waitlisted",   color: "text-violet-300",  bg: "bg-violet-900/60 border-violet-700", icon: Hourglass },
};

// ── Decision Modal ────────────────────────────────────────────────────────────
function DecisionModal({
  application,
  action,
  adminEmail,
  onConfirm,
  onCancel,
  saving,
}: {
  application: Application;
  action: ApplicationStatus;
  adminEmail: string;
  onConfirm: (notes: string, reason: string) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [notes, setNotes] = useState(application.adminNotes ?? "");
  const [reason, setReason] = useState(application.decisionReason ?? "");

  const isApprove = action === "approved";
  const isReject = action === "rejected";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          {isApprove && <CheckCircle size={18} className="text-emerald-400" />}
          {isReject && <XCircle size={18} className="text-rose-400" />}
          {!isApprove && !isReject && <Eye size={18} className="text-blue-400" />}
          <h3 className="text-base font-black text-white">
            {isApprove ? "Approve Application" : isReject ? "Reject Application" : "Update Status"}
          </h3>
        </div>

        <div className="bg-slate-700/50 rounded-xl p-3 text-xs">
          <p className="text-white font-semibold">{application.applicantName}</p>
          <p className="text-slate-400">{application.applicantEmail}</p>
          <p className="text-slate-400 mt-1">Applying for: <span className="text-indigo-300">{application.scholarshipTitle}</span></p>
        </div>

        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Internal Admin Notes</label>
          <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Internal notes (not visible to applicant)..."
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
        </div>

        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
            Decision Reason <span className="text-slate-500 font-normal">(sent to applicant)</span>
          </label>
          <textarea rows={2} value={reason} onChange={e => setReason(e.target.value)}
            placeholder={isApprove ? "e.g. Exceptional academic record and compelling research proposal." : isReject ? "e.g. Insufficient documentation. Please reapply next cycle." : "..."}
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-slate-700">
          <button onClick={onCancel} className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-bold rounded-xl transition-colors">
            Cancel
          </button>
          <button onClick={() => onConfirm(notes, reason)} disabled={saving}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-60",
              isApprove ? "bg-emerald-700 hover:bg-emerald-600" : isReject ? "bg-rose-700 hover:bg-rose-600" : "bg-blue-700 hover:bg-blue-600"
            )}>
            {saving ? <RefreshCw size={14} className="animate-spin" /> : isApprove ? <CheckCircle size={14} /> : isReject ? <XCircle size={14} /> : <Eye size={14} />}
            Confirm & Notify
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Application Row ───────────────────────────────────────────────────────────
function ApplicationRow({
  app,
  expanded,
  onToggleExpand,
  onAction,
}: {
  app: Application;
  expanded: boolean;
  onToggleExpand: () => void;
  onAction: (app: Application, status: ApplicationStatus) => void;
}) {
  const meta = STATUS_META[app.status];
  const Icon = meta.icon;

  return (
    <div className="bg-[#0d1526] border border-slate-700/60 rounded-2xl overflow-hidden">
      {/* Header row */}
      <div className="px-5 py-4 flex items-center gap-4 flex-wrap">
        {/* Applicant info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 bg-indigo-700 rounded-xl flex items-center justify-center shrink-0">
            <User size={15} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-black text-white text-sm truncate">{app.applicantName}</p>
            <p className="text-[10px] text-slate-400 flex items-center gap-1 truncate">
              <Mail size={9} /> {app.applicantEmail}
            </p>
          </div>
        </div>

        {/* Scholarship */}
        <div className="hidden md:block min-w-0 flex-1">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Scholarship</p>
          <p className="text-xs text-slate-300 truncate flex items-center gap-1">
            <BookOpen size={10} className="shrink-0" /> {app.scholarshipTitle}
          </p>
          <p className="text-[10px] text-slate-500 capitalize">{app.scholarshipType}</p>
        </div>

        {/* Meta */}
        <div className="hidden lg:flex items-center gap-4 text-xs shrink-0">
          {app.applicantCountry && (
            <span className="text-slate-400 flex items-center gap-1"><MapPin size={10} /> {app.applicantCountry}</span>
          )}
          {app.applicantGpa && (
            <span className="text-slate-400 flex items-center gap-1"><Star size={10} /> GPA {app.applicantGpa}</span>
          )}
          <span className="text-slate-400 flex items-center gap-1"><Calendar size={10} /> {fmtDate(app.submittedAt)}</span>
        </div>

        {/* Status */}
        <span className={cn("text-[10px] font-black px-2.5 py-1 rounded-full border flex items-center gap-1 shrink-0", meta.bg, meta.color)}>
          <Icon size={10} /> {meta.label}
        </span>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {app.status !== "approved" && (
            <button onClick={() => onAction(app, "approved")}
              className="p-1.5 bg-emerald-800/50 hover:bg-emerald-700/70 text-emerald-300 rounded-lg transition-colors" title="Approve">
              <CheckCircle size={14} />
            </button>
          )}
          {app.status !== "under_review" && app.status !== "approved" && app.status !== "rejected" && (
            <button onClick={() => onAction(app, "under_review")}
              className="p-1.5 bg-blue-800/50 hover:bg-blue-700/70 text-blue-300 rounded-lg transition-colors" title="Mark Under Review">
              <Eye size={14} />
            </button>
          )}
          {app.status !== "rejected" && (
            <button onClick={() => onAction(app, "rejected")}
              className="p-1.5 bg-rose-800/50 hover:bg-rose-700/70 text-rose-300 rounded-lg transition-colors" title="Reject">
              <XCircle size={14} />
            </button>
          )}
          {app.status !== "waitlisted" && (
            <button onClick={() => onAction(app, "waitlisted")}
              className="p-1.5 bg-violet-800/50 hover:bg-violet-700/70 text-violet-300 rounded-lg transition-colors" title="Waitlist">
              <Hourglass size={14} />
            </button>
          )}
          <button onClick={onToggleExpand}
            className="p-1.5 bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-white rounded-lg transition-colors">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-slate-700/60 bg-[#090e1a] px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Education</p>
              <p className="text-slate-200 capitalize">{app.applicantEducation ?? "—"}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Age</p>
              <p className="text-slate-200">{app.applicantAge ?? "—"}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">GPA</p>
              <p className="text-slate-200">{app.applicantGpa ?? "—"}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Submitted</p>
              <p className="text-slate-200">{fmtDateTime(app.submittedAt)}</p>
            </div>
          </div>

          {app.personalStatement && (
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                <MessageSquare size={10} /> Personal Statement
              </p>
              <p className="text-slate-300 text-xs leading-relaxed bg-slate-800/50 rounded-xl p-3 border border-slate-700/40 italic">
                "{app.personalStatement}"
              </p>
            </div>
          )}

          {app.documents.length > 0 && (
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                <FileText size={10} /> Documents ({app.documents.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {app.documents.map(doc => (
                  <a key={doc.id} href={doc.url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white text-xs px-3 py-1.5 rounded-xl transition-colors border border-slate-600">
                    <Download size={11} /> {doc.name}
                    <span className="text-slate-500 capitalize">({doc.type})</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {(app.adminNotes || app.decisionReason || app.reviewedBy) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {app.adminNotes && (
                <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/40">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Admin Notes</p>
                  <p className="text-slate-300 text-xs">{app.adminNotes}</p>
                </div>
              )}
              {app.decisionReason && (
                <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/40">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Decision Reason (sent to applicant)</p>
                  <p className="text-slate-300 text-xs">{app.decisionReason}</p>
                </div>
              )}
            </div>
          )}

          {app.reviewedBy && (
            <p className="text-[10px] text-slate-500">
              Reviewed by <strong className="text-slate-400">{app.reviewedBy}</strong> on {fmtDateTime(app.reviewedAt)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main ApplicationManager ───────────────────────────────────────────────────
export default function ApplicationManager({ adminEmail }: { adminEmail: string }) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [decisionApp, setDecisionApp] = useState<{ app: Application; status: ApplicationStatus } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchApplications();
      setApplications(data);
    } catch {
      setError("Failed to load applications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = applications.filter(a => {
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    if (typeFilter !== "all" && a.scholarshipType !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return a.applicantName.toLowerCase().includes(q)
        || a.applicantEmail.toLowerCase().includes(q)
        || a.scholarshipTitle.toLowerCase().includes(q)
        || (a.applicantCountry?.toLowerCase().includes(q) ?? false);
    }
    return true;
  });

  async function confirmDecision(notes: string, reason: string) {
    if (!decisionApp) return;
    setSaving(true);
    try {
      const updated = await updateApplicationStatus(decisionApp.app.id, decisionApp.status, notes, reason, adminEmail);
      setApplications(prev => prev.map(a => a.id === updated.id ? updated : a));
      setDecisionApp(null);
    } catch {
      setError("Failed to update application status.");
    } finally {
      setSaving(false);
    }
  }

  // Summary counts
  const counts = (Object.keys(STATUS_META) as ApplicationStatus[]).reduce<Record<string, number>>((acc, s) => {
    acc[s] = applications.filter(a => a.status === s).length;
    return acc;
  }, {});

  const uniqueTypes = [...new Set(applications.map(a => a.scholarshipType))];

  return (
    <div className="space-y-4">
      {/* Decision modal */}
      {decisionApp && (
        <DecisionModal
          application={decisionApp.app}
          action={decisionApp.status}
          adminEmail={adminEmail}
          onConfirm={confirmDecision}
          onCancel={() => setDecisionApp(null)}
          saving={saving}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center shrink-0">
            <FileText size={16} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white leading-none">Applicant & Application Management</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">{applications.length} total · {counts["pending"] ?? 0} pending review</p>
          </div>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-xl transition-colors border border-slate-700">
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Status summary pills */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setStatusFilter("all")}
          className={cn("px-3 py-1.5 rounded-xl text-xs font-bold transition-colors border",
            statusFilter === "all" ? "bg-indigo-700 text-white border-indigo-600" : "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200")}>
          All ({applications.length})
        </button>
        {(Object.entries(STATUS_META) as [ApplicationStatus, typeof STATUS_META[ApplicationStatus]][]).map(([key, meta]) => (
          <button key={key} onClick={() => setStatusFilter(key)}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors border",
              statusFilter === key ? `${meta.bg} ${meta.color}` : "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200")}>
            <meta.icon size={10} /> {meta.label} ({counts[key] ?? 0})
          </button>
        ))}
      </div>

      {/* Search & filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search applicant, scholarship…"
            className="bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64" />
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Filter size={12} /> Type:
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="all">All Types</option>
          {uniqueTypes.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-rose-900 border border-rose-700 text-rose-200 text-sm px-4 py-3 rounded-xl">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <RefreshCw size={18} className="animate-spin mr-2" /> Loading applications…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500 text-sm bg-slate-800/40 rounded-2xl border border-slate-700/40">
          No applications match your filters.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(app => (
            <ApplicationRow
              key={app.id}
              app={app}
              expanded={expandedId === app.id}
              onToggleExpand={() => setExpandedId(expandedId === app.id ? null : app.id)}
              onAction={(a, status) => setDecisionApp({ app: a, status })}
            />
          ))}
        </div>
      )}

      {!loading && (
        <p className="text-xs text-slate-500">Showing {filtered.length} of {applications.length} applications</p>
      )}
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import {
  Bell, Send, RefreshCw, AlertCircle, CheckCircle, Clock,
  XCircle, Mail, Users, MessageSquare, Calendar, Plus,
  BookOpen, Megaphone, AlarmClock, Info, X, Zap,
} from "lucide-react";
import { cn } from "../../lib/utils";
import {
  fetchNotifications, sendNotification, sendDirectMessage,
} from "../../services/scholarshipAdminService";
import type { Notification, NotificationType, NotificationStatus, DirectMessage } from "../../types/scholarship";

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDateTime(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const TYPE_META: Record<NotificationType, { label: string; icon: React.ElementType; color: string }> = {
  new_match:        { label: "New Match",         icon: Zap,          color: "bg-indigo-700 text-indigo-100" },
  deadline_reminder:{ label: "Deadline Reminder", icon: AlarmClock,   color: "bg-amber-700 text-amber-100" },
  status_update:    { label: "Status Update",     icon: Info,         color: "bg-blue-700 text-blue-100" },
  announcement:     { label: "Announcement",      icon: Megaphone,    color: "bg-violet-700 text-violet-100" },
  direct_message:   { label: "Direct Message",    icon: MessageSquare,color: "bg-emerald-700 text-emerald-100" },
};

const STATUS_META: Record<NotificationStatus, { label: string; icon: React.ElementType; color: string }> = {
  draft:     { label: "Draft",     icon: Clock,         color: "text-slate-400" },
  scheduled: { label: "Scheduled", icon: Calendar,      color: "text-amber-400" },
  sent:      { label: "Sent",      icon: CheckCircle,   color: "text-emerald-400" },
  failed:    { label: "Failed",    icon: XCircle,       color: "text-rose-400" },
};

// ── Compose Notification Modal ────────────────────────────────────────────────
function ComposeModal({
  adminEmail,
  onSend,
  onClose,
  sending,
}: {
  adminEmail: string;
  onSend: (data: Omit<Notification, "id" | "createdAt" | "sentAt" | "sentCount" | "failedCount">) => void;
  onClose: () => void;
  sending: boolean;
}) {
  const [type, setType] = useState<NotificationType>("announcement");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [recipientType, setRecipientType] = useState<Notification["recipientType"]>("all_users");
  const [asDraft, setAsDraft] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSend({
      type,
      subject,
      body,
      recipientType,
      status: asDraft ? "draft" : scheduleDate ? "scheduled" : "sent",
      scheduledAt: scheduleDate ? new Date(scheduleDate).toISOString() : undefined,
      createdBy: adminEmail,
    });
  }

  const TIcon = TYPE_META[type].icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <Bell size={16} className="text-indigo-400" /> Compose Notification
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Type */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Notification Type</label>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(TYPE_META) as [NotificationType, typeof TYPE_META[NotificationType]][]).map(([key, meta]) => (
                <button key={key} type="button" onClick={() => setType(key)}
                  className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors border",
                    type === key ? `${meta.color.split(" ")[0]} ${meta.color.split(" ")[1]} border-transparent` : "bg-slate-700 text-slate-300 border-slate-600 hover:border-slate-500")}>
                  <meta.icon size={11} /> {meta.label}
                </button>
              ))}
            </div>
          </div>

          {/* Recipients */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Recipients</label>
            <select value={recipientType} onChange={e => setRecipientType(e.target.value as Notification["recipientType"])}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="all_users">All Users</option>
              <option value="applicants">All Applicants</option>
              <option value="scholarship_applicants">Specific Scholarship Applicants</option>
              <option value="specific_users">Specific Users</option>
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Subject *</label>
            <input required value={subject} onChange={e => setSubject(e.target.value)}
              placeholder="e.g. 🎉 New Scholarship Opportunities Await!"
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          {/* Body */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Message *
              <span className="ml-2 text-slate-500 font-normal text-[9px]">
                Variables: {`{{applicant_name}}, {{scholarship_title}}, {{deadline_date}}, {{status}}`}
              </span>
            </label>
            <textarea required rows={5} value={body} onChange={e => setBody(e.target.value)}
              placeholder={`Hi {{applicant_name}},\n\nYour message here...`}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-mono" />
          </div>

          {/* Preview */}
          {body && (
            <div className="bg-slate-700/40 border border-slate-600/50 rounded-xl p-4">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Mail size={10} /> Preview
              </p>
              <div className="space-y-1">
                <p className="text-sm font-bold text-white">{subject || "(no subject)"}</p>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {body.replace(/{{applicant_name}}/g, "John Doe").replace(/{{scholarship_title}}/g, "Global STEM Award").replace(/{{deadline_date}}/g, "30 Sep 2026").replace(/{{status}}/g, "Approved")}
                </p>
              </div>
            </div>
          )}

          {/* Schedule */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Schedule (optional)</label>
              <input type="datetime-local" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="flex items-center mt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={asDraft} onChange={e => setAsDraft(e.target.checked)}
                  className="accent-slate-500 w-4 h-4" />
                <span className="text-sm text-slate-300">Save as Draft (don't send)</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-700">
            <button type="button" onClick={onClose}
              className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-bold rounded-xl transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={sending}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-60">
              {sending ? <RefreshCw size={14} className="animate-spin" /> : asDraft ? <Clock size={14} /> : scheduleDate ? <Calendar size={14} /> : <Send size={14} />}
              {asDraft ? "Save Draft" : scheduleDate ? "Schedule" : "Send Now"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Direct Message Modal ──────────────────────────────────────────────────────
function DirectMessageModal({
  adminEmail,
  onSend,
  onClose,
  sending,
}: {
  adminEmail: string;
  onSend: (data: Omit<DirectMessage, "id" | "sentAt" | "isRead">) => void;
  onClose: () => void;
  sending: boolean;
}) {
  const [toEmail, setToEmail] = useState("");
  const [toName, setToName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <MessageSquare size={16} className="text-emerald-400" /> Send Direct Message
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors"><X size={18} /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onSend({ fromAdminEmail: adminEmail, toUserId: toEmail, toUserName: toName, toUserEmail: toEmail, subject, body }); }}
          className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Recipient Name *</label>
              <input required value={toName} onChange={e => setToName(e.target.value)}
                placeholder="John Doe"
                className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Recipient Email *</label>
              <input required type="email" value={toEmail} onChange={e => setToEmail(e.target.value)}
                placeholder="applicant@example.com"
                className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Subject *</label>
            <input required value={subject} onChange={e => setSubject(e.target.value)}
              placeholder="Re: Your Application to Global STEM Award"
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Message *</label>
            <textarea required rows={5} value={body} onChange={e => setBody(e.target.value)}
              placeholder="Hi John, I'm reaching out regarding your application..."
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-700">
            <button type="button" onClick={onClose}
              className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-bold rounded-xl transition-colors">Cancel</button>
            <button type="submit" disabled={sending}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-60">
              {sending ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
              Send Message
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main NotificationCenter ───────────────────────────────────────────────────
export default function NotificationCenter({ adminEmail }: { adminEmail: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filter, setFilter] = useState<NotificationStatus | "all">("all");
  const [showCompose, setShowCompose] = useState(false);
  const [showDirect, setShowDirect] = useState(false);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchNotifications();
      setNotifications(data);
    } catch {
      setError("Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSendNotification(data: Omit<Notification, "id" | "createdAt" | "sentAt" | "sentCount" | "failedCount">) {
    setSending(true);
    try {
      const created = await sendNotification(data);
      setNotifications(prev => [created, ...prev]);
      setShowCompose(false);
      setSuccess(`Notification "${created.subject}" ${data.status === "draft" ? "saved as draft" : data.status === "scheduled" ? "scheduled" : "sent"} successfully.`);
      setTimeout(() => setSuccess(null), 4000);
    } catch {
      setError("Failed to send notification.");
    } finally {
      setSending(false);
    }
  }

  async function handleDirectMessage(data: Omit<DirectMessage, "id" | "sentAt" | "isRead">) {
    setSending(true);
    try {
      await sendDirectMessage(data);
      setShowDirect(false);
      setSuccess(`Message sent to ${data.toUserName} successfully.`);
      setTimeout(() => setSuccess(null), 4000);
    } catch {
      setError("Failed to send message.");
    } finally {
      setSending(false);
    }
  }

  const filtered = notifications.filter(n => filter === "all" || n.status === filter);
  const counts = (["draft", "scheduled", "sent", "failed"] as NotificationStatus[]).reduce<Record<string, number>>((acc, s) => {
    acc[s] = notifications.filter(n => n.status === s).length;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {showCompose && (
        <ComposeModal adminEmail={adminEmail} onSend={handleSendNotification} onClose={() => setShowCompose(false)} sending={sending} />
      )}
      {showDirect && (
        <DirectMessageModal adminEmail={adminEmail} onSend={handleDirectMessage} onClose={() => setShowDirect(false)} sending={sending} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <Bell size={16} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white leading-none">Communication & Notification Center</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">{notifications.length} notifications · {counts["scheduled"] ?? 0} scheduled</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowDirect(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl transition-colors">
            <MessageSquare size={14} /> Direct Message
          </button>
          <button onClick={() => setShowCompose(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-colors">
            <Plus size={14} /> Compose
          </button>
        </div>
      </div>

      {/* Quick templates */}
      <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-4">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <Zap size={11} /> Quick Send Templates
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "New Scholarship Alert", type: "announcement" as NotificationType, icon: BookOpen },
            { label: "Deadline Reminder", type: "deadline_reminder" as NotificationType, icon: AlarmClock },
            { label: "Application Status Update", type: "status_update" as NotificationType, icon: Info },
            { label: "New Matches Found", type: "new_match" as NotificationType, icon: Zap },
          ].map(t => (
            <button key={t.label} onClick={() => setShowCompose(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-xl transition-colors border border-slate-600 hover:border-slate-500">
              <t.icon size={12} className="text-indigo-400" /> {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Sent", count: counts["sent"] ?? 0, icon: CheckCircle, color: "bg-emerald-600" },
          { label: "Scheduled", count: counts["scheduled"] ?? 0, icon: Calendar, color: "bg-amber-600" },
          { label: "Drafts", count: counts["draft"] ?? 0, icon: Clock, color: "bg-slate-600" },
          { label: "Failed", count: counts["failed"] ?? 0, icon: XCircle, color: "bg-rose-600" },
        ].map(s => (
          <div key={s.label} className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex items-center gap-3">
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", s.color)}>
              <s.icon size={15} className="text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
              <p className="text-xl font-black text-white">{s.count}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {(["all", "sent", "scheduled", "draft", "failed"] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={cn("px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors border",
              filter === s ? "bg-indigo-700 text-white border-indigo-600" : "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200")}>
            {s === "all" ? "All" : STATUS_META[s].label} ({s === "all" ? notifications.length : counts[s] ?? 0})
          </button>
        ))}
        <button onClick={load} className="ml-auto flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl transition-colors border border-slate-700">
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {success && (
        <div className="flex items-center gap-2 bg-emerald-900 border border-emerald-700 text-emerald-200 text-sm px-4 py-3 rounded-xl">
          <CheckCircle size={14} /> {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 bg-rose-900 border border-rose-700 text-rose-200 text-sm px-4 py-3 rounded-xl">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <RefreshCw size={18} className="animate-spin mr-2" /> Loading notifications…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-500 text-sm bg-slate-800/40 rounded-2xl border border-slate-700/40">
          No {filter === "all" ? "" : filter} notifications yet.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(n => {
            const TIcon = TYPE_META[n.type].icon;
            const SIcon = STATUS_META[n.status].icon;
            return (
              <div key={n.id} className="bg-[#0d1526] border border-slate-700/60 rounded-2xl p-5">
                <div className="flex items-start gap-4">
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5", TYPE_META[n.type].color.split(" ")[0])}>
                    <TIcon size={15} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-black text-white text-sm">{n.subject}</span>
                      <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-full", TYPE_META[n.type].color)}>{TYPE_META[n.type].label}</span>
                      <span className={cn("flex items-center gap-1 text-[10px] font-black", STATUS_META[n.status].color)}>
                        <SIcon size={10} /> {STATUS_META[n.status].label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2 mb-2">{n.body}</p>
                    <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Users size={10} /> {n.recipientType === "all_users" ? "All Users" : n.recipientType === "applicants" ? "All Applicants" : "Specific"}
                      </span>
                      {n.sentAt && <span className="flex items-center gap-1"><Send size={10} /> Sent {fmtDateTime(n.sentAt)}</span>}
                      {n.scheduledAt && n.status === "scheduled" && <span className="flex items-center gap-1 text-amber-400"><Calendar size={10} /> Scheduled {fmtDateTime(n.scheduledAt)}</span>}
                      {n.sentCount != null && <span className="flex items-center gap-1 text-emerald-400"><Mail size={10} /> {n.sentCount.toLocaleString()} delivered</span>}
                      {(n.failedCount ?? 0) > 0 && <span className="flex items-center gap-1 text-rose-400"><XCircle size={10} /> {n.failedCount} failed</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

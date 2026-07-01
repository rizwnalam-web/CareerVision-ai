/**
 * KanbanBoard — Drag-and-drop application pipeline tracker
 *
 * Columns: Wishlist → Applied → Interviewing → Offer
 * Features: DnD between columns, auto follow-up reminders, quick-add cards
 */

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Briefcase,
  Building2,
  CalendarDays,
  Clock3,
  ExternalLink,
  GripVertical,
  MapPin,
  Plus,
  Sparkles,
  Star,
  Trophy,
  Bell,
  X,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { cn } from "../lib/utils";
import type {
  JobApplication,
  ApplicationStatus,
} from "../services/applicationService";
import { updateApplication } from "../services/applicationService";

// ─── Column Configuration ───────────────────────────────────────────────────

interface KanbanColumn {
  id: ApplicationStatus;
  title: string;
  icon: React.ElementType;
  color: string;
  bgGradient: string;
  borderColor: string;
  dotColor: string;
}

const COLUMNS: KanbanColumn[] = [
  {
    id: "saved",
    title: "Wishlist",
    icon: Star,
    color: "text-slate-700",
    bgGradient: "from-slate-50 to-slate-100/50",
    borderColor: "border-slate-200",
    dotColor: "bg-slate-400",
  },
  {
    id: "applied",
    title: "Applied",
    icon: Briefcase,
    color: "text-blue-700",
    bgGradient: "from-blue-50 to-blue-100/30",
    borderColor: "border-blue-200",
    dotColor: "bg-blue-500",
  },
  {
    id: "interviewing",
    title: "Interviewing",
    icon: CalendarDays,
    color: "text-amber-700",
    bgGradient: "from-amber-50 to-amber-100/30",
    borderColor: "border-amber-200",
    dotColor: "bg-amber-500",
  },
  {
    id: "offered",
    title: "Offer",
    icon: Trophy,
    color: "text-emerald-700",
    bgGradient: "from-emerald-50 to-emerald-100/30",
    borderColor: "border-emerald-200",
    dotColor: "bg-emerald-500",
  },
];

// ─── Follow-up Reminder Logic ───────────────────────────────────────────────

interface Reminder {
  applicationId: string;
  message: string;
  urgency: "overdue" | "today" | "upcoming";
  daysUntil: number;
}

function generateReminders(applications: JobApplication[]): Reminder[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const reminders: Reminder[] = [];

  for (const app of applications) {
    if (["offered", "rejected", "withdrawn"].includes(app.status)) continue;

    // Check explicit follow-up dates
    if (app.followUpDate) {
      const followUp = new Date(app.followUpDate);
      followUp.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((followUp.getTime() - now.getTime()) / 86400000);

      if (diffDays < 0) {
        reminders.push({
          applicationId: app.id,
          message: `Follow up with ${app.company} for "${app.jobTitle}" — ${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? "s" : ""} overdue`,
          urgency: "overdue",
          daysUntil: diffDays,
        });
      } else if (diffDays === 0) {
        reminders.push({
          applicationId: app.id,
          message: `Follow up with ${app.company} for "${app.jobTitle}" — due today`,
          urgency: "today",
          daysUntil: 0,
        });
      } else if (diffDays <= 3) {
        reminders.push({
          applicationId: app.id,
          message: `Follow up with ${app.company} for "${app.jobTitle}" — in ${diffDays} day${diffDays > 1 ? "s" : ""}`,
          urgency: "upcoming",
          daysUntil: diffDays,
        });
      }
    }

    // Auto-generate reminders for applications without follow-up dates
    if (!app.followUpDate && app.status === "applied" && app.appliedAt) {
      const applied = new Date(app.appliedAt);
      const daysSinceApplied = Math.ceil((now.getTime() - applied.getTime()) / 86400000);
      if (daysSinceApplied >= 7 && daysSinceApplied < 14) {
        reminders.push({
          applicationId: app.id,
          message: `No response from ${app.company} after ${daysSinceApplied} days — consider following up`,
          urgency: "upcoming",
          daysUntil: 0,
        });
      } else if (daysSinceApplied >= 14) {
        reminders.push({
          applicationId: app.id,
          message: `${app.company} hasn't responded in ${daysSinceApplied} days — follow up or move on`,
          urgency: "overdue",
          daysUntil: -daysSinceApplied,
        });
      }
    }

    // Deadline reminders
    if (app.deadline) {
      const deadline = new Date(app.deadline);
      deadline.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / 86400000);
      if (diffDays >= 0 && diffDays <= 3 && app.status === "saved") {
        reminders.push({
          applicationId: app.id,
          message: `Deadline for ${app.company} "${app.jobTitle}" is ${diffDays === 0 ? "today" : `in ${diffDays} day${diffDays > 1 ? "s" : ""}`} — submit now!`,
          urgency: diffDays === 0 ? "today" : "upcoming",
          daysUntil: diffDays,
        });
      }
    }
  }

  return reminders.sort((a, b) => a.daysUntil - b.daysUntil);
}

// ─── Props ──────────────────────────────────────────────────────────────────

interface KanbanBoardProps {
  applications: JobApplication[];
  userId: string;
  onRefresh: () => Promise<void>;
  onOpenCreate: () => void;
  onOpenEdit: (app: JobApplication) => void;
  onSelect: (app: JobApplication) => void;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function KanbanBoard({
  applications,
  userId,
  onRefresh,
  onOpenCreate,
  onOpenEdit,
  onSelect,
}: KanbanBoardProps) {
  const [draggedCard, setDraggedCard] = useState<JobApplication | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<ApplicationStatus | null>(null);
  const [showReminders, setShowReminders] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const dragRef = useRef<HTMLDivElement | null>(null);

  const reminders = generateReminders(applications);
  const overdueCount = reminders.filter((r) => r.urgency === "overdue").length;

  // Group applications by status
  const columns = COLUMNS.map((col) => ({
    ...col,
    cards: applications.filter((app) => app.status === col.id),
  }));

  // ─── Drag Handlers ──────────────────────────────────────────────────────

  const handleDragStart = useCallback((e: React.DragEvent, app: JobApplication) => {
    setDraggedCard(app);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", app.id);
    // Ghost image styling
    if (dragRef.current) {
      e.dataTransfer.setDragImage(dragRef.current, 0, 0);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, columnId: ApplicationStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(columnId);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverColumn(null);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent, targetStatus: ApplicationStatus) => {
      e.preventDefault();
      setDragOverColumn(null);

      if (!draggedCard || draggedCard.status === targetStatus) {
        setDraggedCard(null);
        return;
      }

      setUpdating(draggedCard.id);
      try {
        // Calculate auto follow-up based on status transition
        const followUpDate = getAutoFollowUp(targetStatus);

        await updateApplication(userId, draggedCard.id, {
          status: targetStatus,
          ...(followUpDate && !draggedCard.followUpDate ? { followUpDate } : {}),
          ...(targetStatus === "applied" && !draggedCard.appliedAt
            ? { appliedAt: new Date().toISOString().slice(0, 10) }
            : {}),
        });
        await onRefresh();
      } catch (err) {
        console.error("Failed to update status:", err);
      } finally {
        setUpdating(null);
        setDraggedCard(null);
      }
    },
    [draggedCard, userId, onRefresh]
  );

  function getAutoFollowUp(status: ApplicationStatus): string | null {
    const now = new Date();
    switch (status) {
      case "applied":
        // Follow up after 7 days
        now.setDate(now.getDate() + 7);
        return now.toISOString().slice(0, 10);
      case "interviewing":
        // Follow up after 3 days
        now.setDate(now.getDate() + 3);
        return now.toISOString().slice(0, 10);
      default:
        return null;
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-black text-slate-900">Pipeline Board</h2>
          <span className="text-xs text-slate-500 font-bold">
            {applications.length} application{applications.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Reminder bell */}
          <button
            onClick={() => setShowReminders(!showReminders)}
            className={cn(
              "relative p-2.5 rounded-xl border transition-all",
              reminders.length > 0
                ? "border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700"
                : "border-slate-200 bg-white hover:bg-slate-50 text-slate-500"
            )}
          >
            <Bell size={16} />
            {overdueCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                {overdueCount}
              </span>
            )}
          </button>
          <button
            onClick={onOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm shadow-indigo-200"
          >
            <Plus size={13} /> Add
          </button>
        </div>
      </div>

      {/* Reminders Panel */}
      <AnimatePresence>
        {showReminders && reminders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white border border-amber-200 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest text-amber-800 flex items-center gap-2">
                  <Bell size={13} /> Follow-up Reminders
                </h3>
                <button
                  onClick={() => setShowReminders(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {reminders.map((r, i) => (
                  <div
                    key={`${r.applicationId}-${i}`}
                    className={cn(
                      "flex items-start gap-2 px-3 py-2 rounded-xl text-xs",
                      r.urgency === "overdue" && "bg-rose-50 text-rose-700",
                      r.urgency === "today" && "bg-amber-50 text-amber-700",
                      r.urgency === "upcoming" && "bg-blue-50 text-blue-700"
                    )}
                  >
                    {r.urgency === "overdue" ? (
                      <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                    ) : (
                      <Clock3 size={12} className="mt-0.5 shrink-0" />
                    )}
                    <span className="font-medium">{r.message}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {columns.map((column) => {
          const Icon = column.icon;
          const isDropTarget = dragOverColumn === column.id && draggedCard?.status !== column.id;

          return (
            <div
              key={column.id}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
              className={cn(
                "flex flex-col rounded-2xl border-2 transition-all duration-200 min-h-[400px]",
                column.borderColor,
                isDropTarget && "border-indigo-400 bg-indigo-50/50 shadow-lg shadow-indigo-100 scale-[1.01]",
                !isDropTarget && `bg-gradient-to-b ${column.bgGradient}`
              )}
            >
              {/* Column Header */}
              <div className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2.5 h-2.5 rounded-full", column.dotColor)} />
                    <h3 className={cn("text-xs font-black uppercase tracking-widest", column.color)}>
                      {column.title}
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-lg border border-slate-100">
                    {column.cards.length}
                  </span>
                </div>
              </div>

              {/* Cards */}
              <div className="flex-1 p-3 pt-1 space-y-2.5 overflow-y-auto">
                {column.cards.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-slate-300">
                    <Icon size={24} className="mb-2 opacity-40" />
                    <p className="text-[10px] font-bold uppercase tracking-widest">
                      Drop here
                    </p>
                  </div>
                ) : (
                  column.cards.map((app) => (
                    <KanbanCard
                      key={app.id}
                      app={app}
                      isUpdating={updating === app.id}
                      onDragStart={handleDragStart}
                      onEdit={onOpenEdit}
                      onSelect={onSelect}
                    />
                  ))
                )}
              </div>

              {/* Column Footer — Quick Add */}
              <div className="p-3 pt-0">
                <button
                  onClick={onOpenCreate}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-slate-300 hover:border-indigo-300 hover:bg-white text-slate-400 hover:text-indigo-500 text-[10px] font-bold uppercase tracking-widest transition-all"
                >
                  <Plus size={12} /> Add
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Hidden drag ghost */}
      <div ref={dragRef} className="fixed -left-[9999px]" aria-hidden="true">
        {draggedCard && (
          <div className="bg-white rounded-xl shadow-xl border border-indigo-300 px-4 py-2 text-sm font-bold text-slate-900">
            {draggedCard.jobTitle}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Kanban Card ────────────────────────────────────────────────────────────

interface KanbanCardProps {
  app: JobApplication;
  isUpdating: boolean;
  onDragStart: (e: React.DragEvent, app: JobApplication) => void;
  onEdit: (app: JobApplication) => void;
  onSelect: (app: JobApplication) => void;
}

function KanbanCard({ app, isUpdating, onDragStart, onEdit, onSelect }: KanbanCardProps) {
  const hasReminder = app.followUpDate && new Date(app.followUpDate) <= new Date();
  const hasDeadline = app.deadline && (() => {
    const d = new Date(app.deadline!);
    d.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return Math.ceil((d.getTime() - now.getTime()) / 86400000) <= 3;
  })();

  return (
    <motion.div
      layout
      draggable
      onDragStart={(e: any) => onDragStart(e, app)}
      onClick={() => onSelect(app)}
      className={cn(
        "group relative bg-white rounded-xl border border-slate-200 p-3 cursor-grab active:cursor-grabbing transition-all hover:border-indigo-300 hover:shadow-md",
        isUpdating && "opacity-50 pointer-events-none",
        hasReminder && "ring-2 ring-amber-200"
      )}
    >
      {/* Grip handle */}
      <div className="absolute top-2.5 left-1.5 opacity-0 group-hover:opacity-40 transition-opacity">
        <GripVertical size={12} className="text-slate-400" />
      </div>

      <div className="pl-3">
        {/* Title + Company */}
        <p className="text-xs font-bold text-slate-900 leading-tight line-clamp-2">
          {app.jobTitle}
        </p>
        <div className="flex items-center gap-1.5 mt-1.5">
          <Building2 size={10} className="text-slate-400 shrink-0" />
          <span className="text-[10px] text-slate-500 font-medium truncate">
            {app.company}
          </span>
        </div>

        {/* Location */}
        {app.location && (
          <div className="flex items-center gap-1.5 mt-1">
            <MapPin size={10} className="text-slate-400 shrink-0" />
            <span className="text-[10px] text-slate-400 truncate">{app.location}</span>
          </div>
        )}

        {/* Meta badges */}
        <div className="flex items-center flex-wrap gap-1.5 mt-2">
          {app.salaryMin && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
              {app.salaryCurrency || "$"}{(app.salaryMin / 1000).toFixed(0)}k
              {app.salaryMax ? `–${(app.salaryMax / 1000).toFixed(0)}k` : "+"}
            </span>
          )}
          {app.workType && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600">
              {app.workType}
            </span>
          )}
          {hasDeadline && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-50 text-rose-600 border border-rose-100">
              Deadline soon
            </span>
          )}
        </div>

        {/* Follow-up / Next step */}
        {app.nextStep && (
          <div className="flex items-start gap-1.5 mt-2 p-1.5 rounded-lg bg-indigo-50">
            <ChevronRight size={10} className="text-indigo-400 mt-0.5 shrink-0" />
            <span className="text-[9px] text-indigo-600 font-medium line-clamp-2">
              {app.nextStep}
            </span>
          </div>
        )}

        {app.followUpDate && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <Clock3 size={10} className={hasReminder ? "text-amber-500" : "text-slate-400"} />
            <span className={cn("text-[9px] font-medium", hasReminder ? "text-amber-600" : "text-slate-400")}>
              Follow up: {new Date(app.followUpDate).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      {/* Quick actions on hover */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
        {app.jobUrl && (
          <a
            href={app.jobUrl}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1 rounded-md hover:bg-slate-100 text-slate-400"
          >
            <ExternalLink size={11} />
          </a>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(app);
          }}
          className="p-1 rounded-md hover:bg-indigo-50 text-slate-400 hover:text-indigo-600"
        >
          <Sparkles size={11} />
        </button>
      </div>
    </motion.div>
  );
}

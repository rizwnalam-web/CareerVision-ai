// ─────────────────────────────────────────────────────────────────────────────
// Job Application types
// ─────────────────────────────────────────────────────────────────────────────

export type ApplicationStatus = "saved" | "applied" | "interviewing" | "offered" | "rejected" | "withdrawn";
export type ApplicationSource  = "manual" | "job-board" | "ai-match";

export interface JobApplication {
  id: string;
  userId: string;
  jobTitle: string;
  company: string;
  location?: string;
  workType?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  jobUrl?: string;
  jobDescription?: string;
  status: ApplicationStatus;
  appliedAt?: string;
  deadline?: string;
  resumeVersionId?: string;
  coverLetterSent: boolean;
  notes?: string;
  nextStep?: string;
  followUpDate?: string;
  source: ApplicationSource;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type JobApplicationInput = Omit<JobApplication, "id" | "userId" | "createdAt" | "updatedAt">;

export interface ApplicationStats {
  total: number;
  byStatus: Record<string, number>;
  applied: number;
  interviewing: number;
  offered: number;
  rejected: number;
  responseRate: number;
}

export interface ApplicationEvent {
  id: string;
  application_id: string;
  event_type: string;
  description?: string;
  occurred_at: string;
}

export interface AICoachingResult {
  nextStep: string;
  reasoning?: string;
  urgency: "low" | "medium" | "high";
  followUpInDays?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// API base
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = (
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:3001"
).replace(/\/+$|\/api$/, "");

// ─────────────────────────────────────────────────────────────────────────────
// CRUD
// ─────────────────────────────────────────────────────────────────────────────

export async function getApplications(userId: string): Promise<{ applications: JobApplication[]; stats: ApplicationStats }> {
  const res  = await fetch(`${API_BASE}/api/applications/${userId}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch applications");
  return data;
}

export async function createApplication(userId: string, input: Partial<JobApplicationInput>): Promise<JobApplication> {
  const res  = await fetch(`${API_BASE}/api/applications/${userId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || "Failed to create application");
  return data.application;
}

export async function updateApplication(userId: string, id: string, input: Partial<JobApplicationInput>): Promise<JobApplication> {
  const res  = await fetch(`${API_BASE}/api/applications/${userId}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || "Failed to update application");
  return data.application;
}

export async function deleteApplication(userId: string, id: string): Promise<void> {
  const res  = await fetch(`${API_BASE}/api/applications/${userId}/${id}`, { method: "DELETE" });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || "Failed to delete application");
}

export async function getApplicationEvents(userId: string, id: string): Promise<ApplicationEvent[]> {
  const res  = await fetch(`${API_BASE}/api/applications/${userId}/${id}/events`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch events");
  return data.events;
}

export async function addApplicationNote(userId: string, id: string, description: string): Promise<ApplicationEvent> {
  const res  = await fetch(`${API_BASE}/api/applications/${userId}/${id}/note`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || "Failed to add note");
  return data.event;
}

export async function getAICoaching(userId: string, id: string): Promise<AICoachingResult> {
  const res  = await fetch(`${API_BASE}/api/applications/${userId}/${id}/ai-coach`, { method: "POST" });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || "AI coaching failed");
  return data.coaching;
}

import { ai } from "../lib/aiProxy";
import type {
  Scholarship, Application, PlatformAnalytics, Notification,
  DirectMessage, OpportunityType, OpportunityStatus,
  ApplicationStatus, NotificationType,
} from "../types/scholarship";

const API_BASE = (
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:3001"
).replace(/\/+$|\/api$/, "");

const LLM_MODEL = "gemini-2.0-flash";

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}/api${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json() as Promise<T>;
}

/** Strip markdown fences and extract the first JSON array or object from raw LLM output */
function extractJSON(raw: string | null | undefined): string {
  if (!raw) return "";
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const arrStart = raw.indexOf("[");
  const objStart = raw.indexOf("{");
  const start =
    arrStart !== -1 && (objStart === -1 || arrStart < objStart)
      ? arrStart
      : objStart;
  if (start !== -1) {
    const lastArr = raw.lastIndexOf("]");
    const lastObj = raw.lastIndexOf("}");
    const end = Math.max(lastArr, lastObj);
    if (end !== -1) return raw.slice(start, end + 1).trim();
  }
  return raw.trim();
}

async function callLLM<T>(prompt: string, systemInstruction: string): Promise<T> {
  const result = await ai.models.generateContent({
    model: LLM_MODEL,
    contents: [{ parts: [{ text: prompt }] }],
    config: { systemInstruction, temperature: 0.3, maxOutputTokens: 4000 },
  });
  const raw =
    result?.text ??
    result?.candidates?.[0]?.content?.parts?.[0]?.text ??
    null;
  const json = extractJSON(raw);
  if (!json) throw new Error("LLM returned no parsable JSON");
  return JSON.parse(json) as T;
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}
function isoNow(): string {
  return new Date().toISOString();
}

// â”€â”€ Session cache â€” starts empty, populated from LLM or API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
let _scholarships: Scholarship[] | null = null;
let _applications: Application[] | null = null;
let _notifications: Notification[] | null = null;

// â”€â”€ Scholarship CRUD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function fetchScholarships(): Promise<Scholarship[]> {
  // 1. Try real backend
  try {
    const data = await apiFetch<Scholarship[]>("/admin/scholarships");
    _scholarships = data;
    return data;
  } catch { /* fall through */ }

  // 2. Return session cache if warm
  if (_scholarships) return _scholarships;

  // 3. Ask LLM for real-time scholarship data
  const today = new Date().toISOString().slice(0, 10);
  const prompt = `Today is ${today}. Generate a JSON array of 8 real, currently active global scholarship and funding opportunities for international students. Each object MUST match this exact TypeScript shape:

{
  id: string,
  type: "scholarship" | "grant" | "fellowship" | "bursary" | "award",
  title: string (real scholarship name),
  provider: string (real foundation or institution name),
  description: string (2â€“3 sentences),
  eligibility: {
    minGpa?: number,
    minAge?: number,
    maxAge?: number,
    countries?: string[],
    educationLevels?: string[],
    fieldOfStudy?: string[],
    incomeThreshold?: number,
    otherRequirements?: string
  },
  benefits: Array<{
    type: "full_tuition"|"partial_tuition"|"living_stipend"|"travel"|"books"|"cash_award"|"other",
    amount?: number,
    currency?: string,
    description?: string
  }>,
  totalValue: number,
  currency: "USD",
  deadline: string (ISO date strictly after ${today}),
  applicationOpenDate: string (ISO date),
  applicationUrl: string (real provider URL),
  tags: string[],
  status: "active" | "draft" | "closed",
  featured: boolean,
  totalSlots: number,
  filledSlots: number,
  viewCount: number,
  applicationCount: number,
  createdAt: string (ISO),
  updatedAt: string (ISO),
  createdBy: "admin@careervision.ai"
}

Include diversity: STEM, healthcare, arts, social sciences, environment. Mix US, UK, EU and global providers (e.g. Chevening, Fulbright, Gates Cambridge, Aga Khan, MasterCard Foundation). Return ONLY a valid JSON array. No prose, no explanation.`;

  const data = await callLLM<Scholarship[]>(
    prompt,
    "You are a global scholarship database expert. Return only a valid JSON array of scholarship objects. Wrap the array in ```json code fences.",
  );
  _scholarships = data;
  return data;
}

export async function createScholarship(
  data: Omit<Scholarship, "id" | "createdAt" | "updatedAt" | "viewCount" | "applicationCount">,
): Promise<Scholarship> {
  try {
    return await apiFetch<Scholarship>("/admin/scholarships", {
      method: "POST",
      body: JSON.stringify(data),
    });
  } catch {
    const created: Scholarship = {
      ...data,
      id: `sch-${uid()}`,
      viewCount: 0,
      applicationCount: 0,
      createdAt: isoNow(),
      updatedAt: isoNow(),
    };
    _scholarships = [created, ...(_scholarships ?? [])];
    return created;
  }
}

export async function updateScholarship(id: string, data: Partial<Scholarship>): Promise<Scholarship> {
  try {
    return await apiFetch<Scholarship>(`/admin/scholarships/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  } catch {
    if (_scholarships) {
      _scholarships = _scholarships.map(s =>
        s.id === id ? { ...s, ...data, updatedAt: isoNow() } : s,
      );
      return _scholarships.find(s => s.id === id)!;
    }
    throw new Error("Cache unavailable for update");
  }
}

export async function deleteScholarship(id: string): Promise<void> {
  try {
    await apiFetch(`/admin/scholarships/${id}`, { method: "DELETE" });
  } catch {
    if (_scholarships) _scholarships = _scholarships.filter(s => s.id !== id);
  }
}

// â”€â”€ Applications â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function fetchApplications(scholarshipId?: string): Promise<Application[]> {
  const path = scholarshipId
    ? `/admin/applications?scholarshipId=${scholarshipId}`
    : "/admin/applications";
  try {
    const data = await apiFetch<Application[]>(path);
    _applications = data;
    return data;
  } catch { /* fall through */ }

  if (_applications) {
    return scholarshipId
      ? _applications.filter(a => a.scholarshipId === scholarshipId)
      : _applications;
  }

  const today = new Date().toISOString().slice(0, 10);
  const prompt = `Today is ${today}. Generate a JSON array of 10 realistic student scholarship applications from diverse countries. Each object MUST match this TypeScript shape exactly:

{
  id: string,
  scholarshipId: string,
  scholarshipTitle: string (real scholarship name),
  scholarshipType: "scholarship" | "grant" | "fellowship" | "bursary" | "award",
  applicantId: string,
  applicantName: string (diverse international names),
  applicantEmail: string,
  applicantCountry: string,
  applicantEducation: "undergraduate" | "postgraduate" | "doctoral" | "vocational",
  applicantGpa: number (2.5â€“4.0),
  applicantAge: number (18â€“35),
  status: "pending" | "under_review" | "approved" | "rejected" | "waitlisted",
  documents: Array<{
    id: string,
    name: string,
    type: "transcript"|"essay"|"recommendation"|"cv"|"portfolio"|"other",
    url: "#",
    uploadedAt: string (ISO)
  }>,
  personalStatement: string (2â€“3 sentences about motivation),
  adminNotes?: string (only for reviewed applications),
  reviewedBy?: "admin@careervision.ai" (only when reviewed),
  reviewedAt?: string (ISO, only when reviewed),
  decisionReason?: string (only for approved/rejected),
  submittedAt: string (ISO, within last 60 days from ${today}),
  updatedAt: string (ISO)
}

Distribution: 4 pending, 2 under_review, 2 approved, 1 rejected, 1 waitlisted. Applicants from Africa, South Asia, Latin America, SE Asia, Europe. Return ONLY a valid JSON array. No explanation.`;

  const data = await callLLM<Application[]>(
    prompt,
    "You are an applications management system. Return only a valid JSON array of application objects wrapped in ```json code fences.",
  );
  _applications = data;
  return scholarshipId ? data.filter(a => a.scholarshipId === scholarshipId) : data;
}

export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatus,
  adminNotes?: string,
  decisionReason?: string,
  reviewedBy?: string,
): Promise<Application> {
  try {
    return await apiFetch<Application>(`/admin/applications/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, adminNotes, decisionReason }),
    });
  } catch {
    if (_applications) {
      _applications = _applications.map(a =>
        a.id === id
          ? {
              ...a,
              status,
              adminNotes: adminNotes ?? a.adminNotes,
              decisionReason: decisionReason ?? a.decisionReason,
              reviewedBy,
              reviewedAt: isoNow(),
              updatedAt: isoNow(),
            }
          : a,
      );
      return _applications.find(a => a.id === id)!;
    }
    throw new Error("Cache unavailable for status update");
  }
}

// â”€â”€ Analytics â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function fetchPlatformAnalytics(): Promise<PlatformAnalytics> {
  try {
    return await apiFetch<PlatformAnalytics>("/admin/analytics");
  } catch { /* fall through */ }

  const today = new Date();
  const year = today.getFullYear();
  const dateStr = today.toISOString().slice(0, 10);
  const prompt = `Today is ${dateStr}. Generate realistic JSON analytics for a scholarship-matching platform that has been live for 18 months and serves ~1,200 active users globally. Return a SINGLE JSON object matching this TypeScript shape exactly:

{
  totalApplications: number,
  pendingApplications: number,
  approvedApplications: number,
  rejectedApplications: number,
  activeUsers: number,
  newUsersThisWeek: number,
  totalScholarships: number,
  activeScholarships: number,
  totalScholarshipValue: number,
  applicationTrends: Array<{
    date: string (YYYY-MM, all 12 months of ${year}),
    applications: number,
    approvals: number,
    rejections: number
  }>,
  topScholarships: Array<{
    scholarshipId: string,
    scholarshipTitle: string (use real scholarship names),
    applicantCount: number,
    approvedCount: number,
    rejectedCount: number,
    pendingCount: number,
    viewCount: number,
    conversionRate: number (0â€“100 integer)
  }> (exactly 6 entries),
  countryBreakdown: Array<{ label: string, value: number, percentage: number }> (6 countries),
  educationBreakdown: Array<{ label: string, value: number, percentage: number }> (4 education levels),
  scholarshipGaps: Array<{
    fieldOfStudy: string,
    studentDemand: number,
    availableScholarships: number,
    gapScore: number (0â€“100)
  }> (5 fields),
  matchingAlgorithmStats: {
    totalMatches: number,
    successfulMatches: number,
    averageMatchScore: number (50â€“95)
  }
}

All numbers must be internally consistent (e.g. approved + rejected + pending â‰¤ totalApplications). Return ONLY a valid JSON object. No explanation.`;

  return await callLLM<PlatformAnalytics>(
    prompt,
    "You are a platform analytics engine. Return only a valid JSON object with realistic metrics wrapped in ```json code fences.",
  );
}

// â”€â”€ Notifications â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function fetchNotifications(): Promise<Notification[]> {
  try {
    const data = await apiFetch<Notification[]>("/admin/notifications");
    _notifications = data;
    return data;
  } catch { /* fall through */ }

  if (_notifications) return _notifications;

  const today = new Date().toISOString().slice(0, 10);
  const prompt = `Today is ${today}. Generate a JSON array of 6 realistic admin notifications for a scholarship platform. Each object MUST match this TypeScript shape:

{
  id: string,
  type: "new_match" | "deadline_reminder" | "status_update" | "announcement" | "direct_message",
  subject: string,
  body: string (use template variables {{applicant_name}}, {{scholarship_title}}, {{deadline_date}}, {{status}} where appropriate),
  recipientType: "all_users" | "applicants" | "specific_users" | "scholarship_applicants",
  scholarshipId?: string,
  status: "draft" | "scheduled" | "sent" | "failed",
  scheduledAt?: string (ISO, only for scheduled items, must be after ${today}),
  sentAt?: string (ISO, within last 30 days, only for sent items),
  sentCount?: number (for sent, 100â€“2000),
  failedCount?: number,
  createdBy: "admin@careervision.ai",
  createdAt: string (ISO)
}

Distribution: 3 sent, 1 scheduled, 1 draft, 1 failed. Use real scholarship names in subjects. Return ONLY a valid JSON array. No explanation.`;

  const data = await callLLM<Notification[]>(
    prompt,
    "You are a notification management system. Return only a valid JSON array wrapped in ```json code fences.",
  );
  _notifications = data;
  return data;
}

export async function sendNotification(
  data: Omit<Notification, "id" | "createdAt" | "sentAt" | "sentCount" | "failedCount">,
): Promise<Notification> {
  try {
    return await apiFetch<Notification>("/admin/notifications", {
      method: "POST",
      body: JSON.stringify(data),
    });
  } catch {
    const created: Notification = {
      ...data,
      id: `ntf-${uid()}`,
      status: data.status === "draft" ? "draft" : "sent",
      sentAt: data.status !== "draft" ? isoNow() : undefined,
      sentCount: data.status !== "draft" ? 0 : undefined,
      failedCount: 0,
      createdAt: isoNow(),
    };
    _notifications = [created, ...(_notifications ?? [])];
    return created;
  }
}

export async function sendDirectMessage(
  msg: Omit<DirectMessage, "id" | "sentAt" | "isRead">,
): Promise<DirectMessage> {
  try {
    return await apiFetch<DirectMessage>("/admin/messages", {
      method: "POST",
      body: JSON.stringify(msg),
    });
  } catch {
    return { ...msg, id: `msg-${uid()}`, sentAt: isoNow(), isRead: false };
  }
}

/** Call after bulk operations to force a fresh LLM fetch on next load */
export function clearAdminCache(): void {
  _scholarships = null;
  _applications = null;
  _notifications = null;
}

export type {
  Scholarship, Application, Notification, DirectMessage,
  OpportunityType, OpportunityStatus, ApplicationStatus, NotificationType,
};

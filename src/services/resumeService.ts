import type {
  ResumeContent,
  ATSReport,
  ResumeRecord,
  ResumeVersion,
  PortfolioProject,
  PortfolioProjectInput,
} from "../types/resume";

const API_BASE = (
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:3001"
).replace(/\/+$|\/api$/, "");

// ─────────────────────────────────────────────────────────────────────────────
// Resume – upload & parse
// ─────────────────────────────────────────────────────────────────────────────

export async function uploadAndParseResume(
  file: File,
  userId: string,
  targetRole?: string
): Promise<{ resumeId: string; versionId: string; versionNumber: number; content: ResumeContent; atsReport: ATSReport | null }> {
  const form = new FormData();
  form.append("file", file);
  form.append("userId", userId);
  if (targetRole) form.append("targetRole", targetRole);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90_000); // 90 s

  try {
    const res = await fetch(`${API_BASE}/api/resume/parse`, {
      method: "POST",
      body: form,
      signal: controller.signal,
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || "Failed to parse resume");
    return data;
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new Error("Resume parsing timed out (90 s). The file may be very large or the AI is busy — please try again.");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Resume – get current
// ─────────────────────────────────────────────────────────────────────────────

export async function getResume(userId: string): Promise<ResumeRecord | null> {
  const res = await fetch(`${API_BASE}/api/resume/${userId}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch resume");
  return data.resume;
}

// ─────────────────────────────────────────────────────────────────────────────
// Resume – save edited content
// ─────────────────────────────────────────────────────────────────────────────

export async function saveResumeContent(
  userId: string,
  content: ResumeContent,
  changeSummary?: string,
  targetRole?: string
): Promise<{ versionId: string; versionNumber: number; atsReport: ATSReport }> {
  const res = await fetch(`${API_BASE}/api/resume/${userId}/content`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, changeSummary, targetRole }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || "Failed to save resume");
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Resume – versions list
// ─────────────────────────────────────────────────────────────────────────────

export async function getResumeVersions(
  userId: string
): Promise<{ currentVersionId: string; versions: ResumeVersion[] }> {
  const res = await fetch(`${API_BASE}/api/resume/${userId}/versions`);
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || "Failed to fetch versions");
  return { currentVersionId: data.currentVersionId, versions: data.versions };
}

// ─────────────────────────────────────────────────────────────────────────────
// Resume – restore version
// ─────────────────────────────────────────────────────────────────────────────

export async function restoreResumeVersion(
  userId: string,
  versionId: string
): Promise<{ versionId: string; versionNumber: number }> {
  const res = await fetch(`${API_BASE}/api/resume/${userId}/restore/${versionId}`, { method: "POST" });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || "Failed to restore version");
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// ATS check
// ─────────────────────────────────────────────────────────────────────────────

export async function runATSCheck(content: ResumeContent, targetRole?: string): Promise<ATSReport> {
  const res = await fetch(`${API_BASE}/api/resume/ats-check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, targetRole }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || "ATS check failed");
  return data.report;
}

// ─────────────────────────────────────────────────────────────────────────────
// AI suggestions
// ─────────────────────────────────────────────────────────────────────────────

export async function getResumeSuggestions(
  section: string,
  currentText: string,
  targetRole?: string
): Promise<string[]> {
  const res = await fetch(`${API_BASE}/api/resume/suggest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ section, currentText, targetRole }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) return [];
  return data.suggestions;
}

// ─────────────────────────────────────────────────────────────────────────────
// Portfolio
// ─────────────────────────────────────────────────────────────────────────────

export async function getPortfolioProjects(userId: string): Promise<PortfolioProject[]> {
  const res = await fetch(`${API_BASE}/api/resume/${userId}/portfolio`);
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || "Failed to fetch portfolio");
  return data.projects;
}

export async function createPortfolioProject(
  userId: string,
  input: PortfolioProjectInput
): Promise<PortfolioProject> {
  const res = await fetch(`${API_BASE}/api/resume/${userId}/portfolio`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || "Failed to create project");
  return data.project;
}

export async function updatePortfolioProject(
  userId: string,
  projectId: string,
  input: PortfolioProjectInput
): Promise<PortfolioProject> {
  const res = await fetch(`${API_BASE}/api/resume/${userId}/portfolio/${projectId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || "Failed to update project");
  return data.project;
}

export async function deletePortfolioProject(userId: string, projectId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/resume/${userId}/portfolio/${projectId}`, {
    method: "DELETE",
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || "Failed to delete project");
}

import type {
  ResumeContent,
  ATSReport,
  ResumeRecord,
  ResumeVersion,
  PortfolioProject,
  PortfolioProjectInput,
  DeepResumeProfileSnapshot,
  DeepResumeResponse,
  DeepResumeHistoryEntry,
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
// Resume – delete old version
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteResumeVersion(userId: string, versionId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/resume/${userId}/version/${versionId}`, { method: "DELETE" });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || "Failed to delete version");
}

// ─────────────────────────────────────────────────────────────────────────────
// ATS check (optionally supply a full job description for precise scoring)
// ─────────────────────────────────────────────────────────────────────────────

export async function runATSCheck(
  content: ResumeContent,
  targetRole?: string,
  jobDescription?: string
): Promise<ATSReport> {
  const res = await fetch(`${API_BASE}/api/resume/ats-check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, targetRole, jobDescription }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || "ATS check failed");
  return data.report;
}

// ─────────────────────────────────────────────────────────────────────────────
// AI Tailor – rewrite resume content to match a job description
// ─────────────────────────────────────────────────────────────────────────────

export async function tailorResumeToJD(
  content: ResumeContent,
  jobDescription: string
): Promise<ResumeContent> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90_000);
  try {
    const res = await fetch(`${API_BASE}/api/resume/tailor`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, jobDescription }),
      signal: controller.signal,
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || "Tailoring failed");
    return data.tailored;
  } catch (err: any) {
    if (err.name === "AbortError") throw new Error("Tailoring timed out. Please try again.");
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Cover Letter – generate from resume + job description
// ─────────────────────────────────────────────────────────────────────────────

export async function generateCoverLetter(
  content: ResumeContent,
  jobDescription: string,
  targetRole?: string
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90_000);
  try {
    const res = await fetch(`${API_BASE}/api/resume/cover-letter`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, jobDescription, targetRole }),
      signal: controller.signal,
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || "Cover letter generation failed");
    return data.coverLetter;
  } catch (err: any) {
    if (err.name === "AbortError") throw new Error("Cover letter generation timed out. Please try again.");
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export async function translateResume(
  userId: string,
  content: ResumeContent,
  targetLanguage: string,
  tone: "professional" | "formal" | "concise" = "professional",
  saveAsVersion = true
): Promise<{ translated: ResumeContent; saved: boolean; versionId?: string; versionNumber?: number }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);

  try {
    const res = await fetch(`${API_BASE}/api/resume/${userId}/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, targetLanguage, tone, saveAsVersion }),
      signal: controller.signal,
    });

    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || "Resume translation failed");
    return {
      translated: data.translated,
      saved: Boolean(data.saved),
      versionId: data.versionId,
      versionNumber: data.versionNumber,
    };
  } catch (err: any) {
    if (err.name === "AbortError") throw new Error("Resume translation timed out. Please try again.");
    throw err;
  } finally {
    clearTimeout(timeout);
  }
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

export async function askDeepResumeQuestion(
  userId: string,
  question: string,
  references: string[] = [],
  conversation: Array<{ question: string; answer: string }> = []
): Promise<{ profileSnapshot: DeepResumeProfileSnapshot; response: DeepResumeResponse }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90_000);

  try {
    const res = await fetch(`${API_BASE}/api/resume/${userId}/deep-profile/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, references, conversation }),
      signal: controller.signal,
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || "Failed to answer deep resume question");
    return {
      profileSnapshot: data.profileSnapshot,
      response: data.response,
    };
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new Error("Deep resume response timed out. Please try again.");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export async function createDeepResumeShareLink(
  userId: string,
  enabled = true,
  publicBaseUrl?: string
): Promise<{ shareSlug: string; shareUrl: string; isPublic: boolean }> {
  const res = await fetch(`${API_BASE}/api/resume/${userId}/deep-profile/share`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enabled, publicBaseUrl }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || "Failed to generate share link");
  return {
    shareSlug: data.shareSlug,
    shareUrl: data.shareUrl,
    isPublic: Boolean(data.isPublic),
  };
}

export async function getDeepResumeHistory(
  userId: string,
  limit = 20
): Promise<DeepResumeHistoryEntry[]> {
  const res = await fetch(`${API_BASE}/api/resume/${userId}/deep-profile/history?limit=${encodeURIComponent(String(limit))}`);
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || "Failed to fetch deep resume history");
  return Array.isArray(data.history) ? data.history : [];
}

export async function getPublicDeepResumeProfile(
  shareSlug: string
): Promise<{ profileSnapshot: DeepResumeProfileSnapshot }> {
  const res = await fetch(`${API_BASE}/api/resume/public/${encodeURIComponent(shareSlug)}`);
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || "Failed to fetch public deep resume profile");
  return { profileSnapshot: data.profileSnapshot };
}

export async function askPublicDeepResumeQuestion(
  shareSlug: string,
  question: string,
  conversation: Array<{ question: string; answer: string }> = []
): Promise<{ profileSnapshot: DeepResumeProfileSnapshot; response: DeepResumeResponse }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90_000);
  try {
    const res = await fetch(`${API_BASE}/api/resume/public/${encodeURIComponent(shareSlug)}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, conversation }),
      signal: controller.signal,
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || "Failed to ask public deep resume question");
    return {
      profileSnapshot: data.profileSnapshot,
      response: data.response,
    };
  } catch (err: any) {
    if (err.name === "AbortError") throw new Error("Public deep resume response timed out. Please try again.");
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

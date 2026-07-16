import type {
  SectorOption,
  ScopedProject,
  MilestoneReview,
  PivotCertificate,
  ResumeProjectSnippet,
} from "../types/sectorPivot";

const API_BASE = (
  (import.meta as any).env?.VITE_API_BASE ||
  (import.meta as any).env?.VITE_API_URL ||
  "http://localhost:3001"
).replace(/\/+$|\/api$/, "");

async function post<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${API_BASE}/api/sector-pivot${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  const json = await res.json();
  return json.data as T;
}

export async function fetchSectorOptions(
  background: string,
  interests: string[],
  skills: string[],
): Promise<SectorOption[]> {
  return post<SectorOption[]>("/sectors", { background, interests, skills });
}

export async function generateProject(
  targetSector: string,
  background: string,
  skills: string[],
): Promise<ScopedProject> {
  return post<ScopedProject>("/project", { targetSector, background, skills });
}

export async function submitForReview(
  milestoneTitle: string,
  deliverable: string,
  rubricCriteria: { criterion: string; weight: number; description: string }[],
  submissionText: string,
  targetSector: string,
): Promise<MilestoneReview> {
  return post<MilestoneReview>("/review", {
    milestoneTitle,
    deliverable,
    rubricCriteria,
    submissionText,
    targetSector,
  });
}

export async function generateCertificate(
  holderName: string,
  originField: string,
  targetSector: string,
  projectTitle: string,
  milestoneScores: { title: string; score: number }[],
): Promise<PivotCertificate> {
  return post<PivotCertificate>("/certificate", {
    holderName,
    originField,
    targetSector,
    projectTitle,
    milestoneScores,
  });
}

export async function generateResumeSnippet(
  targetSector: string,
  projectTitle: string,
  milestones: { title: string }[],
  overallScore: number,
  skills: string[],
): Promise<ResumeProjectSnippet> {
  return post<ResumeProjectSnippet>("/resume-snippet", {
    targetSector,
    projectTitle,
    milestones,
    overallScore,
    skills,
  });
}

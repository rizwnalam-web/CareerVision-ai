import type {
  CodeAuditReport,
  CodeAuditCertificate,
  CodeAuditResumeSnippet,
} from "../types/codeAudit";

const API_BASE = (
  (import.meta as any).env?.VITE_API_BASE ||
  (import.meta as any).env?.VITE_API_URL ||
  "http://localhost:3001"
).replace(/\/+$|\/api$/, "");

async function post<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${API_BASE}/api/code-audit${endpoint}`, {
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

export async function runCodeAudit(
  type: "github" | "url",
  value: string,
  description?: string,
  techStack?: string[],
): Promise<CodeAuditReport> {
  return post<CodeAuditReport>("/audit", { type, value, description, techStack });
}

export async function generateCodeCertificate(
  holderName: string,
  projectName: string,
  projectUrl: string,
  overallScore: number,
  grade: string,
  techStack: string[],
): Promise<CodeAuditCertificate> {
  return post<CodeAuditCertificate>("/certificate", {
    holderName,
    projectName,
    projectUrl,
    overallScore,
    grade,
    techStack,
  });
}

export async function generateCodeResumeSnippet(
  projectName: string,
  projectUrl: string,
  overallScore: number,
  grade: string,
  techStack: string[],
  strengths: string[],
  summary: string,
): Promise<CodeAuditResumeSnippet> {
  return post<CodeAuditResumeSnippet>("/resume-snippet", {
    projectName,
    projectUrl,
    overallScore,
    grade,
    techStack,
    strengths,
    summary,
  });
}

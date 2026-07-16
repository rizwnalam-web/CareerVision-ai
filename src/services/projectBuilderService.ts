import type {
  TechStackPlan,
  ArchitecturePlan,
  MilestonePlan,
  IntentConfig,
} from "../types/projectBuilder";

const API_BASE = (
  (import.meta as any).env?.VITE_API_BASE ||
  (import.meta as any).env?.VITE_API_URL ||
  "http://localhost:3001"
).replace(/\/+$|\/api$/, "");

async function post<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${API_BASE}/api/project-builder${endpoint}`, {
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

export async function generateTechStack(intent: IntentConfig): Promise<TechStackPlan> {
  return post<TechStackPlan>("/stack", intent);
}

export async function generateArchitecture(
  projectTitle: string,
  projectDescription: string,
  stack: TechStackPlan["stack"],
  targetRole: string,
  domain: string,
): Promise<ArchitecturePlan> {
  return post<ArchitecturePlan>("/architecture", {
    projectTitle,
    projectDescription,
    stack,
    targetRole,
    domain,
  });
}

export async function generateMilestones(
  projectTitle: string,
  stack: TechStackPlan["stack"],
  architecture: ArchitecturePlan | null,
  targetRole: string,
  timeCommitment: string,
): Promise<MilestonePlan> {
  return post<MilestonePlan>("/milestones", {
    projectTitle,
    stack,
    architecture,
    targetRole,
    timeCommitment,
  });
}

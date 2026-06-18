import type {
  JobListing, CachedMatch, JobMatchResult,
  WorkPreferences, SalaryPrediction, CultureAnalysis,
} from "../types/jobMatch";
import type { ResumeContent } from "../types/resume";

const API_BASE = (
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:3001"
).replace(/\/+$|\/api$/, "");

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}/api/job-match${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || `Request failed: ${path}`);
  return data as T;
}

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}/api/job-match${path}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed: ${path}`);
  return data as T;
}

// ─────────────────────────────────────────────────────────────────────────────
// Job Listings
// ─────────────────────────────────────────────────────────────────────────────

export async function getJobListings(opts?: {
  workType?: string;
  industry?: string;
  limit?: number;
}): Promise<JobListing[]> {
  const params = new URLSearchParams();
  if (opts?.workType && opts.workType !== "any") params.set("workType", opts.workType);
  if (opts?.industry) params.set("industry", opts.industry);
  if (opts?.limit) params.set("limit", String(opts.limit));
  const qs = params.toString();
  const data = await apiGet<{ jobs: JobListing[] }>(`/jobs${qs ? "?" + qs : ""}`);
  return data.jobs;
}

export async function addJobListing(job: {
  title: string; company: string; location?: string;
  workType?: string; description?: string; requirements?: string;
  skillsRequired?: string[]; salaryMin?: number; salaryMax?: number;
  salaryCurrency?: string; companyCulture?: string;
  industry?: string; experienceLevel?: string; sourceUrl?: string;
}): Promise<JobListing> {
  const data = await apiPost<{ job: JobListing }>("/jobs", job);
  return data.job;
}

// ─────────────────────────────────────────────────────────────────────────────
// Matching
// ─────────────────────────────────────────────────────────────────────────────

export async function runJobMatching(opts: {
  userId: string;
  resumeContent: ResumeContent;
  jobIds?: string[];
  workTypeFilter?: string;
  minSalary?: number;
  maxSalary?: number;
}): Promise<JobMatchResult[]> {
  const data = await apiPost<{ results: JobMatchResult[] }>("/analyse", opts);
  return data.results;
}

export async function getCachedMatches(userId: string): Promise<CachedMatch[]> {
  const data = await apiGet<{ matches: CachedMatch[] }>(`/${userId}/matches`);
  return data.matches;
}

// ─────────────────────────────────────────────────────────────────────────────
// Skill Gap
// ─────────────────────────────────────────────────────────────────────────────

export async function getSkillGapAnalysis(
  resumeContent: ResumeContent,
  jobId: string
): Promise<{ gapSkills: string[]; currentSkills: string[]; requiredSkills: string[]; learningResources: import("../types/jobMatch").LearningResource[] }> {
  const data = await apiPost<{ gapSkills: string[]; currentSkills: string[]; requiredSkills: string[]; learningResources: import("../types/jobMatch").LearningResource[] }>(
    "/skill-gap",
    { resumeContent, jobId }
  );
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Salary Prediction
// ─────────────────────────────────────────────────────────────────────────────

export async function getSalaryPrediction(opts: {
  role: string; location: string;
  experienceYears?: number; skills?: string[]; currency?: string;
}): Promise<SalaryPrediction> {
  const data = await apiPost<{ prediction: SalaryPrediction }>("/salary-predict", opts);
  return data.prediction;
}

// ─────────────────────────────────────────────────────────────────────────────
// Culture Fit
// ─────────────────────────────────────────────────────────────────────────────

export async function getCultureFit(opts: {
  resumeContent: ResumeContent;
  companyName: string;
  cultureSummary: string;
}): Promise<CultureAnalysis> {
  const data = await apiPost<{ analysis: CultureAnalysis }>("/culture-fit", opts);
  return data.analysis;
}

// ─────────────────────────────────────────────────────────────────────────────
// Work Preferences
// ─────────────────────────────────────────────────────────────────────────────

export async function getWorkPreferences(userId: string): Promise<WorkPreferences | null> {
  const data = await apiGet<{ preferences: WorkPreferences | null }>(`/${userId}/preferences`);
  return data.preferences;
}

export async function saveWorkPreferences(
  userId: string,
  prefs: Partial<WorkPreferences>
): Promise<void> {
  await fetch(`${API_BASE}/api/job-match/${userId}/preferences`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(prefs),
  });
}

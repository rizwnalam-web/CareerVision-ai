/**
 * User Behaviour Analytics Service (Frontend)
 *
 * Collects user events in a local buffer and flushes them to the backend in
 * batches.  Also exposes typed helpers for common event categories so the rest
 * of the app doesn't need to hard-code strings.
 */

const API_BASE = (
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:3001"
).replace(/\/+$|\/api$/, "");

// ── Types ────────────────────────────────────────────────────────────────────

export interface AnalyticsEvent {
  userIdentifier: string;
  eventType: string;
  eventCategory?: string;
  eventLabel?: string;
  eventValue?: number;
  properties?: Record<string, unknown>;
  sessionId?: string;
  view?: string;
  durationMs?: number;
}

export interface UserBehaviourSummary {
  totalEvents: number;
  topViews: { view: string; count: number }[];
  topFeatures: { feature: string; count: number }[];
  avgSessionDuration: number;
  mostActiveHour: number;
  recentActivity: { date: string; count: number }[];
}

export interface MarketTrend {
  skill: string;
  demandChange: number;
  avgSalaryUSD: number;
  openRoles: number;
  trend: "rising" | "stable" | "declining";
}

export interface JobMarketTrendData {
  country: string;
  careerTitle: string;
  trends: MarketTrend[];
  salaryTrend: { month: string; avgSalary: number }[];
  demandForecast: { quarter: string; demandIndex: number }[];
  topHiringCities: { city: string; openings: number; avgSalary: number }[];
  skillsGrowth: { skill: string; growth: number; category: string }[];
  summary: string;
  generatedAt: string;
}

export interface CareerPrediction {
  careerTitle: string;
  currentLevelEstimate: string;
  predictedSalaryIn1Yr: number;
  predictedSalaryIn3Yr: number;
  predictedSalaryIn5Yr: number;
  probabilityOfPromotion: number;
  suggestedSkills: string[];
  alternativeCareerPaths: { title: string; similarity: number; salaryBoost: number }[];
  riskFactors: string[];
  growthDrivers: string[];
  confidenceScore: number;
  timeline: { year: number; milestone: string; expectedSalary: number }[];
}

export interface CompanyInsight {
  company: string;
  country: string;
  industry: string;
  employeeCount: string;
  hiringVolume: "high" | "medium" | "low";
  avgSalaryUSD: number;
  techStack: string[];
  openRoles: string[];
  cultureScore: number;
  workLifeBalance: number;
  careerGrowth: number;
  diversity: number;
  recentFunding?: string;
  glassdoorRating?: number;
  linkedInFollowers?: number;
  hiringTrend: "scaling" | "stable" | "contracting";
  benefits: string[];
  interviewProcess: string;
  summary: string;
}

// ── Session ID ───────────────────────────────────────────────────────────────

function getSessionId(): string {
  const key = "cv_session_id";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem(key, id);
  }
  return id;
}

// ── Event buffer ──────────────────────────────────────────────────────────────

const FLUSH_INTERVAL_MS = 5_000;
const MAX_BUFFER_SIZE = 50;

let buffer: AnalyticsEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

async function flush(): Promise<void> {
  if (!buffer.length) return;
  const payload = buffer.splice(0, buffer.length);
  try {
    await fetch(`${API_BASE}/api/analytics/events/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events: payload }),
      keepalive: true,
    });
  } catch {
    // Silently discard – analytics must never break the UI
  }
}

function scheduleFlush(): void {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flush();
  }, FLUSH_INTERVAL_MS);
}

// Flush remaining events when the page is unloaded
if (typeof window !== "undefined") {
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
  window.addEventListener("beforeunload", () => flush());
}

// ── Public API ───────────────────────────────────────────────────────────────

export function track(event: Omit<AnalyticsEvent, "sessionId">): void {
  buffer.push({ ...event, sessionId: getSessionId() });
  if (buffer.length >= MAX_BUFFER_SIZE) {
    flush();
  } else {
    scheduleFlush();
  }
}

/** Track a page/view change */
export function trackView(
  userIdentifier: string,
  view: string,
  properties?: Record<string, unknown>
): void {
  track({
    userIdentifier,
    eventType: "page_view",
    eventCategory: "navigation",
    eventLabel: view,
    view,
    properties,
  });
}

/** Track a feature interaction */
export function trackFeature(
  userIdentifier: string,
  feature: string,
  view?: string,
  properties?: Record<string, unknown>
): void {
  track({
    userIdentifier,
    eventType: "feature_used",
    eventCategory: "feature",
    eventLabel: feature,
    view,
    properties,
  });
}

/** Track a search action */
export function trackSearch(
  userIdentifier: string,
  query: string,
  view?: string
): void {
  track({
    userIdentifier,
    eventType: "search",
    eventCategory: "search",
    eventLabel: query,
    view,
  });
}

/** Track time spent on a view (call on view exit) */
export function trackTimeSpent(
  userIdentifier: string,
  view: string,
  durationMs: number
): void {
  track({
    userIdentifier,
    eventType: "time_spent",
    eventCategory: "engagement",
    eventLabel: view,
    view,
    durationMs,
    eventValue: Math.round(durationMs / 1000),
  });
}

/** Track button / CTA clicks */
export function trackClick(
  userIdentifier: string,
  label: string,
  view?: string,
  properties?: Record<string, unknown>
): void {
  track({
    userIdentifier,
    eventType: "click",
    eventCategory: "interaction",
    eventLabel: label,
    view,
    properties,
  });
}

// ── Backend fetch helpers ─────────────────────────────────────────────────────

async function callAnalyticsApi<T>(
  endpoint: string,
  method: "GET" | "POST" = "POST",
  body?: unknown
): Promise<T> {
  const response = await fetch(`${API_BASE}/api/analytics${endpoint}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || `Analytics API error ${response.status}`);
  }
  const data = await response.json();
  return data.data as T;
}

export async function getUserBehaviourSummary(
  userId: string
): Promise<UserBehaviourSummary> {
  return callAnalyticsApi<UserBehaviourSummary>(`/behaviour/${userId}`, "GET");
}

export async function getJobMarketTrends(
  country: string,
  careerTitle: string
): Promise<JobMarketTrendData> {
  return callAnalyticsApi<JobMarketTrendData>("/market-trends", "POST", {
    country,
    careerTitle,
  });
}

export async function getCareerPrediction(
  userIdentifier: string,
  profile: unknown
): Promise<CareerPrediction> {
  return callAnalyticsApi<CareerPrediction>("/career-prediction", "POST", {
    userIdentifier,
    profile,
  });
}

export async function getCompanyInsights(
  company: string,
  country: string
): Promise<CompanyInsight> {
  return callAnalyticsApi<CompanyInsight>("/company-insights", "POST", {
    company,
    country,
  });
}

export async function getMultipleCompanyInsights(
  companies: string[],
  country: string
): Promise<CompanyInsight[]> {
  return callAnalyticsApi<CompanyInsight[]>("/company-insights/batch", "POST", {
    companies,
    country,
  });
}

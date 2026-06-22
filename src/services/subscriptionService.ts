// ── Types ────────────────────────────────────────────────────────────────────

export type PlanSlug = "free" | "pro" | "team" | "enterprise";

export interface Plan {
  id: string;
  slug: PlanSlug;
  name: string;
  tagline: string;
  priceMonthly: number;
  priceAnnual: number;
  currency: string;
  features: string[];
  limits: Record<string, number>; // -1 = unlimited
}

export interface UserSubscription {
  id: string;
  userIdentifier: string;
  planId: string;
  plan: Plan;
  status: "active" | "cancelled" | "expired" | "trialing" | "past_due";
  billingPeriod: "monthly" | "annual" | "lifetime";
  trialEndsAt?: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelledAt?: string;
  createdAt: string;
}

export interface EnterpriseAccount {
  id: string;
  companyName: string;
  domain?: string;
  industry?: string;
  size?: string;
  ownerIdentifier: string;
  seatLimit: number;
  status: "active" | "suspended" | "trial";
  billingEmail?: string;
  seats: EnterpriseSeat[];
}

export interface EnterpriseSeat {
  id: string;
  userIdentifier: string;
  email?: string;
  role: "admin" | "manager" | "member";
  status: "active" | "invited" | "suspended";
  acceptedAt?: string;
}

export interface AffiliatePartner {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  websiteUrl: string;
  affiliateUrl: string;
  category: "job_board" | "course_platform" | "certification" | "tool" | "recruiter";
  commissionType: "cpc" | "cpa" | "revenue_share";
  isActive: boolean;
}

export const FEATURE_KEYS = {
  INTERVIEW_SESSION:  "interview_sessions_per_month",
  RESUME_TEMPLATE:    "resume_templates",
  AI_ANALYSIS:        "ai_analyses_per_month",
  JOB_MATCH:          "job_matches_per_month",
  CAREER_REPORT:      "career_reports",
} as const;

export type FeatureKey = typeof FEATURE_KEYS[keyof typeof FEATURE_KEYS];

// ── Plan UI metadata ─────────────────────────────────────────────────────────

export const PLAN_BADGES: Record<PlanSlug, string | null> = {
  free: null,
  pro: "Most Popular",
  team: null,
  enterprise: "Custom Pricing",
};

export const PLAN_COLORS: Record<PlanSlug, string> = {
  free: "from-slate-700 to-slate-800",
  pro: "from-indigo-600 to-violet-700",
  team: "from-emerald-600 to-teal-700",
  enterprise: "from-amber-600 to-orange-700",
};

// ── API ───────────────────────────────────────────────────────────────────────

const API_BASE = (
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:3001"
).replace(/\/+$|\/api$/, "");

export async function fetchPlans(): Promise<Plan[]> {
  const res = await fetch(`${API_BASE}/api/subscription/plans`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.plans;
}

export async function fetchUserSubscription(userId: string): Promise<UserSubscription | null> {
  const res = await fetch(`${API_BASE}/api/subscription/user/${encodeURIComponent(userId)}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.subscription;
}

export async function activateSubscription(
  userId: string,
  planSlug: PlanSlug,
  billingPeriod: "monthly" | "annual" = "monthly"
): Promise<UserSubscription> {
  const res = await fetch(`${API_BASE}/api/subscription/activate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, planSlug, billingPeriod }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.subscription;
}

export async function cancelSubscription(userId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/subscription/cancel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
}

export async function checkFeatureAccess(
  userId: string,
  featureKey: FeatureKey
): Promise<{ allowed: boolean; used: number; limit: number }> {
  const res = await fetch(
    `${API_BASE}/api/subscription/feature-access/${encodeURIComponent(userId)}/${encodeURIComponent(featureKey)}`
  );
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return { allowed: data.allowed, used: data.used, limit: data.limit };
}

export async function consumeFeature(
  userId: string,
  featureKey: FeatureKey
): Promise<{ allowed: boolean; used: number; limit: number }> {
  const res = await fetch(`${API_BASE}/api/subscription/feature-use`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, featureKey }),
  });
  const data = await res.json();
  if (res.status === 403) return { allowed: false, used: data.used ?? 0, limit: data.limit ?? 0 };
  if (!data.success) throw new Error(data.error);
  return { allowed: data.allowed, used: data.used, limit: data.limit };
}

// ── Enterprise ────────────────────────────────────────────────────────────────

export async function createEnterpriseAccount(data: {
  companyName: string;
  domain?: string;
  industry?: string;
  size?: string;
  ownerUserId: string;
  seatLimit?: number;
  billingEmail?: string;
}): Promise<EnterpriseAccount> {
  const res = await fetch(`${API_BASE}/api/subscription/enterprise`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const result = await res.json();
  if (!result.success) throw new Error(result.error);
  return result.account;
}

export async function getUserEnterprise(userId: string): Promise<EnterpriseAccount | null> {
  const res = await fetch(
    `${API_BASE}/api/subscription/enterprise/user/${encodeURIComponent(userId)}`
  );
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.account;
}

export async function inviteEnterpriseSeat(
  enterpriseId: string,
  email: string,
  role: "admin" | "manager" | "member" = "member"
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/subscription/enterprise/${enterpriseId}/invite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, role }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
}

// ── Affiliates ────────────────────────────────────────────────────────────────

export async function fetchAffiliatePartners(
  category?: string
): Promise<AffiliatePartner[]> {
  const url = new URL(`${API_BASE}/api/affiliates`);
  if (category) url.searchParams.set("category", category);
  const res = await fetch(url.toString());
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.partners;
}

export async function trackAffiliateClick(
  partnerId: string,
  userId?: string,
  sourceView?: string
): Promise<string> {
  const res = await fetch(`${API_BASE}/api/affiliates/click/${partnerId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, sourceView }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.clickId;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns true if the plan slug grants access to a named feature tier */
export function planHasFeature(
  planSlug: PlanSlug,
  requiredPlan: PlanSlug
): boolean {
  const order: PlanSlug[] = ["free", "pro", "team", "enterprise"];
  return order.indexOf(planSlug) >= order.indexOf(requiredPlan);
}

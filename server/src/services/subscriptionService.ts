import { db } from "../db/database.js";

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
  isActive: boolean;
  sortOrder: number;
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
  contractEndsAt?: string;
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
  commissionRate: number;
  countryCodes: string[];
  isActive: boolean;
  sortOrder: number;
}

// ── Feature keys ─────────────────────────────────────────────────────────────

export const FEATURE_KEYS = {
  INTERVIEW_SESSION:    "interview_sessions_per_month",
  RESUME_TEMPLATE:      "resume_templates",
  AI_ANALYSIS:          "ai_analyses_per_month",
  JOB_MATCH:            "job_matches_per_month",
  CAREER_REPORT:        "career_reports",
} as const;

export type FeatureKey = typeof FEATURE_KEYS[keyof typeof FEATURE_KEYS];

// ── Plans ─────────────────────────────────────────────────────────────────────

export async function getAllPlans(): Promise<Plan[]> {
  const rows = await db.any<{
    id: string; slug: string; name: string; tagline: string;
    price_monthly: string; price_annual: string; currency: string;
    features: string[]; limits: Record<string, number>;
    is_active: boolean; sort_order: number;
  }>(
    `SELECT id, slug, name, tagline, price_monthly, price_annual, currency,
            features, limits, is_active, sort_order
     FROM subscription_plans WHERE is_active = TRUE ORDER BY sort_order`
  );
  return rows.map(mapPlan);
}

export async function getPlanBySlug(slug: string): Promise<Plan | null> {
  const row = await db.oneOrNone<any>(
    `SELECT id, slug, name, tagline, price_monthly, price_annual, currency,
            features, limits, is_active, sort_order
     FROM subscription_plans WHERE slug = $1`,
    [slug]
  );
  return row ? mapPlan(row) : null;
}

function mapPlan(row: any): Plan {
  return {
    id: row.id,
    slug: row.slug as PlanSlug,
    name: row.name,
    tagline: row.tagline,
    priceMonthly: parseFloat(row.price_monthly),
    priceAnnual: parseFloat(row.price_annual),
    currency: row.currency,
    features: Array.isArray(row.features) ? row.features : JSON.parse(row.features ?? "[]"),
    limits: typeof row.limits === "object" ? row.limits : JSON.parse(row.limits ?? "{}"),
    isActive: row.is_active,
    sortOrder: row.sort_order,
  };
}

// ── User Subscriptions ────────────────────────────────────────────────────────

export async function getUserSubscription(
  userIdentifier: string
): Promise<UserSubscription | null> {
  const row = await db.oneOrNone<any>(
    `SELECT s.*, p.slug, p.name, p.tagline, p.price_monthly, p.price_annual,
            p.currency, p.features, p.limits, p.is_active, p.sort_order
     FROM user_subscriptions s
     JOIN subscription_plans p ON p.id = s.plan_id
     WHERE s.user_identifier = $1
       AND s.status IN ('active','trialing')
       AND s.current_period_end > NOW()
     ORDER BY s.created_at DESC LIMIT 1`,
    [userIdentifier]
  );

  if (!row) {
    // User has no subscription → return free plan info
    const freePlan = await getPlanBySlug("free");
    if (!freePlan) return null;
    return {
      id: "free",
      userIdentifier,
      planId: freePlan.id,
      plan: freePlan,
      status: "active",
      billingPeriod: "monthly",
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 36500 * 86400000).toISOString(),
      createdAt: new Date().toISOString(),
    };
  }

  return {
    id: row.id,
    userIdentifier: row.user_identifier,
    planId: row.plan_id,
    plan: mapPlan(row),
    status: row.status,
    billingPeriod: row.billing_period,
    trialEndsAt: row.trial_ends_at?.toISOString(),
    currentPeriodStart: row.current_period_start?.toISOString(),
    currentPeriodEnd: row.current_period_end?.toISOString(),
    cancelledAt: row.cancelled_at?.toISOString(),
    createdAt: row.created_at?.toISOString(),
  };
}

/** Activate or update a user's plan (used by checkout webhook / admin) */
export async function activateSubscription(
  userIdentifier: string,
  planSlug: PlanSlug,
  billingPeriod: "monthly" | "annual" | "lifetime" = "monthly",
  externalId?: string
): Promise<UserSubscription> {
  const plan = await getPlanBySlug(planSlug);
  if (!plan) throw new Error(`Plan '${planSlug}' not found`);

  const periodEnd = billingPeriod === "annual"
    ? new Date(Date.now() + 365 * 86400000)
    : billingPeriod === "lifetime"
      ? new Date(Date.now() + 36500 * 86400000)
      : new Date(Date.now() + 30 * 86400000);

  // Cancel any existing active subscription first
  await db.none(
    `UPDATE user_subscriptions
     SET status = 'cancelled', cancelled_at = NOW(), updated_at = NOW()
     WHERE user_identifier = $1 AND status IN ('active','trialing')`,
    [userIdentifier]
  );

  const row = await db.one<{ id: string }>(
    `INSERT INTO user_subscriptions
       (user_identifier, plan_id, status, billing_period, current_period_start, current_period_end, payment_provider, external_id)
     VALUES ($1, $2, 'active', $3, NOW(), $4, 'stripe', $5)
     RETURNING id`,
    [userIdentifier, plan.id, billingPeriod, periodEnd, externalId ?? null]
  );

  return (await getUserSubscription(userIdentifier))!;
}

export async function cancelSubscription(userIdentifier: string): Promise<void> {
  await db.none(
    `UPDATE user_subscriptions
     SET status = 'cancelled', cancelled_at = NOW(), updated_at = NOW()
     WHERE user_identifier = $1 AND status IN ('active','trialing')`,
    [userIdentifier]
  );
}

// ── Feature gating ────────────────────────────────────────────────────────────

/** Returns true if the user can use the feature (considering usage limits) */
export async function canUseFeature(
  userIdentifier: string,
  featureKey: FeatureKey
): Promise<{ allowed: boolean; used: number; limit: number }> {
  const sub = await getUserSubscription(userIdentifier);
  const limit = sub?.plan.limits[featureKey] ?? 0;

  if (limit === -1) return { allowed: true, used: 0, limit: -1 };
  if (limit === 0)  return { allowed: false, used: 0, limit: 0 };

  const today = new Date().toISOString().slice(0, 7) + "-01"; // month start
  const usage = await db.oneOrNone<{ used_count: number }>(
    `SELECT used_count FROM feature_usage
     WHERE user_identifier = $1 AND feature_key = $2
       AND period_start = $3::date`,
    [userIdentifier, featureKey, today]
  );

  const used = usage?.used_count ?? 0;
  return { allowed: used < limit, used, limit };
}

export async function incrementFeatureUsage(
  userIdentifier: string,
  featureKey: FeatureKey
): Promise<void> {
  const today = new Date().toISOString().slice(0, 7) + "-01";
  await db.none(
    `INSERT INTO feature_usage (user_identifier, feature_key, used_count, period_start)
     VALUES ($1, $2, 1, $3::date)
     ON CONFLICT (user_identifier, feature_key, period_start) DO UPDATE
       SET used_count = feature_usage.used_count + 1, updated_at = NOW()`,
    [userIdentifier, featureKey, today]
  );
}

// ── Enterprise ────────────────────────────────────────────────────────────────

export async function createEnterpriseAccount(data: {
  companyName: string;
  domain?: string;
  industry?: string;
  size?: string;
  ownerIdentifier: string;
  seatLimit?: number;
  billingEmail?: string;
}): Promise<EnterpriseAccount> {
  const entPlan = await getPlanBySlug("enterprise");
  const row = await db.one<{ id: string }>(
    `INSERT INTO enterprise_accounts
       (company_name, domain, industry, size, owner_identifier, seat_limit, plan_id, billing_email, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'trial')
     RETURNING id`,
    [
      data.companyName, data.domain ?? null, data.industry ?? null,
      data.size ?? null, data.ownerIdentifier, data.seatLimit ?? 10,
      entPlan?.id ?? null, data.billingEmail ?? null,
    ]
  );

  // Add owner as admin seat
  await db.none(
    `INSERT INTO enterprise_seats (enterprise_id, user_identifier, role, status, accepted_at)
     VALUES ($1,$2,'admin','active',NOW())`,
    [row.id, data.ownerIdentifier]
  );

  // Give owner enterprise plan
  await activateSubscription(data.ownerIdentifier, "enterprise", "monthly");

  return (await getEnterpriseAccount(row.id))!;
}

export async function getEnterpriseAccount(
  id: string
): Promise<EnterpriseAccount | null> {
  const row = await db.oneOrNone<any>(
    `SELECT * FROM enterprise_accounts WHERE id = $1`,
    [id]
  );
  if (!row) return null;

  const seats = await db.any<any>(
    `SELECT * FROM enterprise_seats WHERE enterprise_id = $1 ORDER BY invited_at`,
    [id]
  );

  return {
    id: row.id,
    companyName: row.company_name,
    domain: row.domain,
    industry: row.industry,
    size: row.size,
    ownerIdentifier: row.owner_identifier,
    seatLimit: row.seat_limit,
    status: row.status,
    billingEmail: row.billing_email,
    contractEndsAt: row.contract_ends_at?.toISOString(),
    seats: seats.map((s: any) => ({
      id: s.id,
      userIdentifier: s.user_identifier,
      email: s.email,
      role: s.role,
      status: s.status,
      acceptedAt: s.accepted_at?.toISOString(),
    })),
  };
}

export async function getUserEnterpriseAccount(
  userIdentifier: string
): Promise<EnterpriseAccount | null> {
  const row = await db.oneOrNone<{ enterprise_id: string }>(
    `SELECT enterprise_id FROM enterprise_seats
     WHERE user_identifier = $1 AND status = 'active' LIMIT 1`,
    [userIdentifier]
  );
  if (!row) return null;
  return getEnterpriseAccount(row.enterprise_id);
}

export async function inviteEnterpriseSeat(
  enterpriseId: string,
  email: string,
  role: "admin" | "manager" | "member" = "member"
): Promise<void> {
  const account = await getEnterpriseAccount(enterpriseId);
  if (!account) throw new Error("Enterprise account not found");
  if (account.seats.length >= account.seatLimit) {
    throw new Error(`Seat limit (${account.seatLimit}) reached`);
  }
  await db.none(
    `INSERT INTO enterprise_seats (enterprise_id, user_identifier, email, role, status)
     VALUES ($1, $2, $2, $3, 'invited')
     ON CONFLICT (enterprise_id, user_identifier) DO UPDATE
       SET role = EXCLUDED.role, status = 'invited'`,
    [enterpriseId, email, role]
  );
}

// ── Affiliate ─────────────────────────────────────────────────────────────────

export async function getAllAffiliatePartners(
  category?: string
): Promise<AffiliatePartner[]> {
  const rows = await db.any<any>(
    `SELECT * FROM affiliate_partners WHERE is_active = TRUE
     ${category ? "AND category = $1" : ""}
     ORDER BY sort_order`,
    category ? [category] : []
  );
  return rows.map(mapPartner);
}

function mapPartner(row: any): AffiliatePartner {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    logoUrl: row.logo_url,
    websiteUrl: row.website_url,
    affiliateUrl: row.affiliate_url,
    category: row.category,
    commissionType: row.commission_type,
    commissionRate: parseFloat(row.commission_rate),
    countryCodes: row.country_codes ?? [],
    isActive: row.is_active,
    sortOrder: row.sort_order,
  };
}

export async function recordAffiliateClick(data: {
  partnerId: string;
  userIdentifier?: string;
  sessionId?: string;
  sourceView?: string;
  ipHash?: string;
  userAgent?: string;
  referrer?: string;
}): Promise<string> {
  const row = await db.one<{ id: string }>(
    `INSERT INTO affiliate_clicks
       (partner_id, user_identifier, session_id, source_view, ip_hash, user_agent, referrer)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING id`,
    [
      data.partnerId, data.userIdentifier ?? null, data.sessionId ?? null,
      data.sourceView ?? null, data.ipHash ?? null, data.userAgent ?? null,
      data.referrer ?? null,
    ]
  );
  return row.id;
}

export async function recordAffiliateConversion(data: {
  partnerId: string;
  clickId?: string;
  userIdentifier?: string;
  conversionType?: string;
  revenueUsd?: number;
}): Promise<void> {
  const partner = await db.oneOrNone<{ commission_rate: string; commission_type: string }>(
    `SELECT commission_rate, commission_type FROM affiliate_partners WHERE id = $1`,
    [data.partnerId]
  );
  const rate = partner ? parseFloat(partner.commission_rate) : 0;
  const commission = data.revenueUsd != null && partner?.commission_type === "revenue_share"
    ? data.revenueUsd * rate
    : rate;

  await db.none(
    `INSERT INTO affiliate_conversions
       (partner_id, click_id, user_identifier, conversion_type, revenue_usd, commission_usd)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [
      data.partnerId, data.clickId ?? null, data.userIdentifier ?? null,
      data.conversionType ?? "signup", data.revenueUsd ?? null, commission,
    ]
  );
}

export async function getAffiliateStats(
  partnerId?: string
): Promise<{ clicks: number; conversions: number; estimatedRevenue: number }> {
  const where = partnerId ? "WHERE partner_id = $1" : "";
  const params = partnerId ? [partnerId] : [];

  const clicks = await db.one<{ count: string }>(
    `SELECT COUNT(*) FROM affiliate_clicks ${where}`, params
  );
  const convs = await db.one<{ count: string; total: string }>(
    `SELECT COUNT(*) as count, COALESCE(SUM(commission_usd),0) as total
     FROM affiliate_conversions ${where}`, params
  );

  return {
    clicks: parseInt(clicks.count),
    conversions: parseInt(convs.count),
    estimatedRevenue: parseFloat(convs.total),
  };
}

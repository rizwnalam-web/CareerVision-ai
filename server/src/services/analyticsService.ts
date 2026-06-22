import { db } from "../db/database.js";
import { generateDeepSeekResponse } from "./deepseekService.js";
import type { UserProfile } from "../types/career.js";

// ── Types ────────────────────────────────────────────────────────────────────

export interface UserEvent {
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
  demandChange: number; // percent
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
  probabilityOfPromotion: number; // 0-100
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
  cultureScore: number; // 0-100
  workLifeBalance: number; // 0-100
  careerGrowth: number; // 0-100
  diversity: number; // 0-100
  recentFunding?: string;
  glassdoorRating?: number;
  linkedInFollowers?: number;
  hiringTrend: "scaling" | "stable" | "contracting";
  benefits: string[];
  interviewProcess: string;
  summary: string;
}

export interface AbVariant {
  testKey: string;
  variant: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function stripJSON(raw: string | null | undefined): string {
  if (!raw) return "";
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  return raw.trim();
}

// ── User Behaviour Analytics ─────────────────────────────────────────────────

export async function recordEvent(event: UserEvent): Promise<void> {
  await db.none(
    `INSERT INTO user_events
       (user_identifier, event_type, event_category, event_label, event_value,
        properties, session_id, view, duration_ms)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [
      event.userIdentifier,
      event.eventType,
      event.eventCategory ?? "interaction",
      event.eventLabel ?? null,
      event.eventValue ?? null,
      JSON.stringify(event.properties ?? {}),
      event.sessionId ?? null,
      event.view ?? null,
      event.durationMs ?? null,
    ]
  );
}

export async function recordEventsBatch(events: UserEvent[]): Promise<void> {
  if (!events.length) return;
  // Insert all events in a single transaction
  await db.tx(async (t) => {
    const queries = events.map((e) =>
      t.none(
        `INSERT INTO user_events
           (user_identifier, event_type, event_category, event_label, event_value,
            properties, session_id, view, duration_ms)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          e.userIdentifier,
          e.eventType,
          e.eventCategory ?? "interaction",
          e.eventLabel ?? null,
          e.eventValue ?? null,
          JSON.stringify(e.properties ?? {}),
          e.sessionId ?? null,
          e.view ?? null,
          e.durationMs ?? null,
        ]
      )
    );
    await t.batch(queries);
  });
}

export async function getUserBehaviourSummary(
  userIdentifier: string
): Promise<UserBehaviourSummary> {
  const [totalRow, topViews, topFeatures, sessionRows, hourRow, activityRows] =
    await Promise.all([
      db.one<{ count: string }>(
        `SELECT COUNT(*) as count FROM user_events WHERE user_identifier = $1`,
        [userIdentifier]
      ),
      db.any<{ view: string; count: string }>(
        `SELECT view, COUNT(*) as count
         FROM user_events
         WHERE user_identifier = $1 AND view IS NOT NULL
         GROUP BY view ORDER BY count DESC LIMIT 5`,
        [userIdentifier]
      ),
      db.any<{ feature: string; count: string }>(
        `SELECT event_label as feature, COUNT(*) as count
         FROM user_events
         WHERE user_identifier = $1 AND event_category = 'feature'
         GROUP BY event_label ORDER BY count DESC LIMIT 8`,
        [userIdentifier]
      ),
      db.any<{ duration: string }>(
        `SELECT AVG(duration_ms) as duration
         FROM user_events
         WHERE user_identifier = $1 AND duration_ms IS NOT NULL`,
        [userIdentifier]
      ),
      db.one<{ hour: string }>(
        `SELECT EXTRACT(HOUR FROM created_at) as hour, COUNT(*) as cnt
         FROM user_events
         WHERE user_identifier = $1
         GROUP BY hour ORDER BY cnt DESC LIMIT 1`,
        [userIdentifier]
      ).catch(() => ({ hour: "9" })),
      db.any<{ date: string; count: string }>(
        `SELECT DATE(created_at) as date, COUNT(*) as count
         FROM user_events
         WHERE user_identifier = $1
           AND created_at >= NOW() - INTERVAL '30 days'
         GROUP BY date ORDER BY date`,
        [userIdentifier]
      ),
    ]);

  return {
    totalEvents: parseInt(totalRow.count),
    topViews: topViews.map((r) => ({ view: r.view, count: parseInt(r.count) })),
    topFeatures: topFeatures.map((r) => ({
      feature: r.feature ?? "unknown",
      count: parseInt(r.count),
    })),
    avgSessionDuration: sessionRows[0]?.duration
      ? parseFloat(sessionRows[0].duration)
      : 0,
    mostActiveHour: parseInt(hourRow.hour ?? "9"),
    recentActivity: activityRows.map((r) => ({
      date: r.date,
      count: parseInt(r.count),
    })),
  };
}

// ── A/B Testing ──────────────────────────────────────────────────────────────

export async function getOrAssignVariant(
  testKey: string,
  userIdentifier: string
): Promise<AbVariant> {
  // Look up the test
  const test = await db.oneOrNone<{
    id: string;
    variants: string[];
    weights: number[];
    status: string;
  }>(
    `SELECT id, variants, weights, status FROM ab_tests WHERE test_key = $1`,
    [testKey]
  );

  if (!test || test.status !== "active") {
    return { testKey, variant: "control" };
  }

  // Check existing assignment
  const existing = await db.oneOrNone<{ variant: string }>(
    `SELECT variant FROM ab_test_assignments WHERE test_id = $1 AND user_identifier = $2`,
    [test.id, userIdentifier]
  );

  if (existing) return { testKey, variant: existing.variant };

  // Assign deterministically using a hash so the same user always gets the same variant
  const crypto = await import("crypto");
  const hash = crypto
    .createHash("md5")
    .update(`${testKey}:${userIdentifier}`)
    .digest("hex");
  const bucket = parseInt(hash.slice(0, 8), 16) % 100;

  const variants: string[] = Array.isArray(test.variants)
    ? test.variants
    : JSON.parse(test.variants as unknown as string);
  const weights: number[] = Array.isArray(test.weights)
    ? test.weights
    : JSON.parse(test.weights as unknown as string);

  let cumulative = 0;
  let assigned = variants[0];
  for (let i = 0; i < variants.length; i++) {
    cumulative += weights[i];
    if (bucket < cumulative) {
      assigned = variants[i];
      break;
    }
  }

  // Persist assignment
  await db
    .none(
      `INSERT INTO ab_test_assignments (test_id, user_identifier, variant)
       VALUES ($1, $2, $3) ON CONFLICT (test_id, user_identifier) DO NOTHING`,
      [test.id, userIdentifier, assigned]
    )
    .catch(() => {}); // ignore race conditions

  return { testKey, variant: assigned };
}

export async function getAllVariantsForUser(
  userIdentifier: string
): Promise<AbVariant[]> {
  const rows = await db.any<{ test_key: string; variant: string }>(
    `SELECT t.test_key, a.variant
     FROM ab_test_assignments a
     JOIN ab_tests t ON t.id = a.test_id
     WHERE a.user_identifier = $1 AND t.status = 'active'`,
    [userIdentifier]
  );
  return rows.map((r) => ({ testKey: r.test_key, variant: r.variant }));
}

// ── Job Market Trends ────────────────────────────────────────────────────────

export async function getJobMarketTrends(
  country: string,
  careerTitle: string
): Promise<JobMarketTrendData> {
  const cacheKey = `market:${country.toLowerCase()}:${careerTitle.toLowerCase().replace(/\s+/g, "_")}`;

  // Check cache
  const cached = await db.oneOrNone<{ trend_data: JobMarketTrendData }>(
    `SELECT trend_data FROM market_trend_cache
     WHERE cache_key = $1 AND expires_at > NOW()`,
    [cacheKey]
  );
  if (cached) return cached.trend_data;

  const prompt = `You are a labour-market economist. Generate a JSON object of current job market trends for the role "${careerTitle}" in ${country}.

Return ONLY valid JSON matching this exact schema:
{
  "country": "${country}",
  "careerTitle": "${careerTitle}",
  "trends": [
    { "skill": string, "demandChange": number, "avgSalaryUSD": number, "openRoles": number, "trend": "rising"|"stable"|"declining" }
  ],
  "salaryTrend": [
    { "month": "Jan 2025", "avgSalary": number }
  ],
  "demandForecast": [
    { "quarter": "Q1 2025", "demandIndex": number }
  ],
  "topHiringCities": [
    { "city": string, "openings": number, "avgSalary": number }
  ],
  "skillsGrowth": [
    { "skill": string, "growth": number, "category": "technical"|"soft"|"domain" }
  ],
  "summary": string
}

Rules:
- trends: 6-8 top skills, demandChange in % year-over-year
- salaryTrend: last 12 months
- demandForecast: next 6 quarters
- topHiringCities: top 5 cities in ${country}
- skillsGrowth: 8-10 skills with % growth rate
- summary: 2-3 sentence synthesis
- Use realistic 2025/2026 market data`;

  const result = await generateDeepSeekResponse(prompt, { maxTokens: 1200 });
  const raw = stripJSON(result.text);
  let parsed: JobMarketTrendData;

  try {
    parsed = JSON.parse(raw);
  } catch {
    // Fallback minimal structure
    parsed = buildFallbackTrendData(country, careerTitle);
  }

  parsed.generatedAt = new Date().toISOString();

  // Store in cache
  await db
    .none(
      `INSERT INTO market_trend_cache (cache_key, country, career_title, trend_data)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (cache_key) DO UPDATE
         SET trend_data = EXCLUDED.trend_data,
             expires_at = NOW() + INTERVAL '24 hours'`,
      [cacheKey, country, careerTitle, JSON.stringify(parsed)]
    )
    .catch(() => {});

  return parsed;
}

function buildFallbackTrendData(
  country: string,
  careerTitle: string
): JobMarketTrendData {
  return {
    country,
    careerTitle,
    trends: [
      { skill: "Python", demandChange: 18, avgSalaryUSD: 115000, openRoles: 4200, trend: "rising" },
      { skill: "Cloud Computing", demandChange: 22, avgSalaryUSD: 125000, openRoles: 5800, trend: "rising" },
      { skill: "Data Analysis", demandChange: 14, avgSalaryUSD: 95000, openRoles: 3100, trend: "stable" },
      { skill: "Machine Learning", demandChange: 30, avgSalaryUSD: 140000, openRoles: 2900, trend: "rising" },
    ],
    salaryTrend: Array.from({ length: 12 }, (_, i) => {
      const d = new Date(2025, i, 1);
      return {
        month: d.toLocaleString("default", { month: "short", year: "numeric" }),
        avgSalary: 90000 + i * 1200,
      };
    }),
    demandForecast: [
      { quarter: "Q1 2025", demandIndex: 72 },
      { quarter: "Q2 2025", demandIndex: 76 },
      { quarter: "Q3 2025", demandIndex: 80 },
      { quarter: "Q4 2025", demandIndex: 83 },
      { quarter: "Q1 2026", demandIndex: 85 },
      { quarter: "Q2 2026", demandIndex: 88 },
    ],
    topHiringCities: [
      { city: "San Francisco", openings: 1800, avgSalary: 160000 },
      { city: "New York", openings: 1400, avgSalary: 140000 },
      { city: "Seattle", openings: 1100, avgSalary: 145000 },
      { city: "Austin", openings: 900, avgSalary: 120000 },
      { city: "Boston", openings: 750, avgSalary: 130000 },
    ],
    skillsGrowth: [
      { skill: "LLM Fine-tuning", growth: 45, category: "technical" },
      { skill: "Kubernetes", growth: 28, category: "technical" },
      { skill: "System Design", growth: 20, category: "domain" },
      { skill: "Communication", growth: 12, category: "soft" },
    ],
    summary:
      `${careerTitle} roles in ${country} show strong upward momentum driven by AI adoption and cloud migration. ` +
      `Demand is expected to grow 20-30% over the next 18 months with premium salaries for specialized skills.`,
    generatedAt: new Date().toISOString(),
  };
}

// ── Predictive Career Analytics ──────────────────────────────────────────────

export async function getCareerPrediction(
  userIdentifier: string,
  profile: UserProfile
): Promise<CareerPrediction> {
  const careerTitle =
    profile.targetCareerId?.replace(/-/g, " ") || "Software Engineer";

  // Check cache
  const cached = await db.oneOrNone<{ prediction_data: CareerPrediction }>(
    `SELECT prediction_data FROM career_prediction_cache
     WHERE user_identifier = $1 AND career_title = $2 AND expires_at > NOW()`,
    [userIdentifier, careerTitle]
  );
  if (cached) return cached.prediction_data;

  const prompt = `You are a predictive career analytics AI. Analyse the following user profile and generate a data-driven career prediction.

User Profile:
- Age: ${profile.age ?? "not specified"}
- Country: ${profile.country}
- Target Career: ${careerTitle}
- Target Location: ${profile.targetLocation ?? profile.country}
- Interests: ${(profile.interests ?? []).join(", ") || "not specified"}
- Budget: ${profile.budget ? `$${profile.budget}` : "not specified"}

Return ONLY valid JSON matching this schema:
{
  "careerTitle": "${careerTitle}",
  "currentLevelEstimate": "entry"|"mid"|"senior"|"principal",
  "predictedSalaryIn1Yr": number,
  "predictedSalaryIn3Yr": number,
  "predictedSalaryIn5Yr": number,
  "probabilityOfPromotion": number,
  "suggestedSkills": string[],
  "alternativeCareerPaths": [
    { "title": string, "similarity": number, "salaryBoost": number }
  ],
  "riskFactors": string[],
  "growthDrivers": string[],
  "confidenceScore": number,
  "timeline": [
    { "year": number, "milestone": string, "expectedSalary": number }
  ]
}

Rules:
- Salaries in USD
- probabilityOfPromotion: 0-100 integer
- suggestedSkills: top 6 skills to acquire
- alternativeCareerPaths: 3 related paths with % similarity and salary difference
- riskFactors: 2-3 realistic risks
- growthDrivers: 3-4 positive factors
- confidenceScore: 0-100 based on available profile data
- timeline: 5-year projection year by year`;

  const result = await generateDeepSeekResponse(prompt, { maxTokens: 1000 });
  const raw = stripJSON(result.text);
  let prediction: CareerPrediction;

  try {
    prediction = JSON.parse(raw);
  } catch {
    prediction = buildFallbackPrediction(careerTitle, profile);
  }

  // Cache it
  await db
    .none(
      `INSERT INTO career_prediction_cache (user_identifier, career_title, prediction_data)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_identifier, career_title) DO UPDATE
         SET prediction_data = EXCLUDED.prediction_data,
             expires_at = NOW() + INTERVAL '6 hours'`,
      [userIdentifier, careerTitle, JSON.stringify(prediction)]
    )
    .catch(() => {});

  return prediction;
}

function buildFallbackPrediction(
  careerTitle: string,
  profile: UserProfile
): CareerPrediction {
  return {
    careerTitle,
    currentLevelEstimate: "entry",
    predictedSalaryIn1Yr: 75000,
    predictedSalaryIn3Yr: 100000,
    predictedSalaryIn5Yr: 140000,
    probabilityOfPromotion: 65,
    suggestedSkills: [
      "Cloud Architecture",
      "System Design",
      "Python",
      "Data Pipelines",
      "Leadership",
      "Communication",
    ],
    alternativeCareerPaths: [
      { title: "Data Engineer", similarity: 80, salaryBoost: 15000 },
      { title: "DevOps Engineer", similarity: 70, salaryBoost: 10000 },
      { title: "ML Engineer", similarity: 65, salaryBoost: 25000 },
    ],
    riskFactors: [
      "AI automation of routine tasks",
      "Rapidly evolving tech stack requires continuous upskilling",
    ],
    growthDrivers: [
      "High global demand",
      "Strong remote work availability",
      "Multiple career progression paths",
    ],
    confidenceScore: 55,
    timeline: [
      { year: 1, milestone: "Junior to Mid-level", expectedSalary: 75000 },
      { year: 2, milestone: "Lead first project", expectedSalary: 90000 },
      { year: 3, milestone: "Senior role", expectedSalary: 110000 },
      { year: 4, milestone: "Team lead / Specialist", expectedSalary: 125000 },
      { year: 5, milestone: "Staff / Principal", expectedSalary: 145000 },
    ],
  };
}

// ── Company-specific Insights ────────────────────────────────────────────────

export async function getCompanyInsights(
  company: string,
  country: string
): Promise<CompanyInsight> {
  // Check cache
  const cached = await db.oneOrNone<{ insights: CompanyInsight }>(
    `SELECT insights FROM company_insights_cache
     WHERE company_name = $1 AND country = $2 AND expires_at > NOW()`,
    [company, country]
  );
  if (cached) return cached.insights;

  const prompt = `You are a corporate intelligence analyst. Generate a comprehensive insight profile for "${company}" as an employer in ${country}.

Return ONLY valid JSON:
{
  "company": "${company}",
  "country": "${country}",
  "industry": string,
  "employeeCount": string,
  "hiringVolume": "high"|"medium"|"low",
  "avgSalaryUSD": number,
  "techStack": string[],
  "openRoles": string[],
  "cultureScore": number,
  "workLifeBalance": number,
  "careerGrowth": number,
  "diversity": number,
  "recentFunding": string,
  "glassdoorRating": number,
  "linkedInFollowers": number,
  "hiringTrend": "scaling"|"stable"|"contracting",
  "benefits": string[],
  "interviewProcess": string,
  "summary": string
}

Rules:
- cultureScore, workLifeBalance, careerGrowth, diversity: 0-100
- glassdoorRating: 1.0-5.0
- techStack: top 8 technologies used
- openRoles: top 5 current job categories
- benefits: top 6 employee benefits
- interviewProcess: brief description (1-2 sentences)
- summary: 2 sentences overview
- Use realistic 2025/2026 data`;

  const result = await generateDeepSeekResponse(prompt, { maxTokens: 800 });
  const raw = stripJSON(result.text);
  let insight: CompanyInsight;

  try {
    insight = JSON.parse(raw);
  } catch {
    insight = buildFallbackCompanyInsight(company, country);
  }

  await db
    .none(
      `INSERT INTO company_insights_cache (company_name, country, insights)
       VALUES ($1, $2, $3)
       ON CONFLICT (company_name, country) DO UPDATE
         SET insights = EXCLUDED.insights,
             expires_at = NOW() + INTERVAL '24 hours'`,
      [company, country, JSON.stringify(insight)]
    )
    .catch(() => {});

  return insight;
}

function buildFallbackCompanyInsight(
  company: string,
  country: string
): CompanyInsight {
  return {
    company,
    country,
    industry: "Technology",
    employeeCount: "1,000–10,000",
    hiringVolume: "medium",
    avgSalaryUSD: 110000,
    techStack: ["Python", "AWS", "React", "Node.js", "Kubernetes", "PostgreSQL", "Kafka", "Terraform"],
    openRoles: ["Software Engineer", "Data Scientist", "Product Manager", "DevOps Engineer", "UX Designer"],
    cultureScore: 72,
    workLifeBalance: 68,
    careerGrowth: 75,
    diversity: 65,
    recentFunding: "Series C – $80M (2024)",
    glassdoorRating: 3.9,
    linkedInFollowers: 45000,
    hiringTrend: "stable",
    benefits: [
      "Remote-first policy",
      "Equity/stock options",
      "Health & dental insurance",
      "Learning & development budget",
      "401k matching",
      "Flexible PTO",
    ],
    interviewProcess:
      "Typically 4-5 rounds: phone screen, technical assessment, system design, and cultural fit. Process takes 2-4 weeks.",
    summary: `${company} is a growing technology company in ${country} known for its collaborative culture and strong engineering practices. They prioritise innovation and offer competitive compensation packages.`,
  };
}

// ── Multi-company batch ───────────────────────────────────────────────────────

export async function getMultipleCompanyInsights(
  companies: string[],
  country: string
): Promise<CompanyInsight[]> {
  const results = await Promise.allSettled(
    companies.map((c) => getCompanyInsights(c, country))
  );
  return results
    .filter(
      (r): r is PromiseFulfilledResult<CompanyInsight> => r.status === "fulfilled"
    )
    .map((r) => r.value);
}

import { db } from "./database.js";

/**
 * Save Career Hub Intelligence to database for caching
 */
export async function saveCareerHub(hubData: any) {
  const { city, country, intensity, marketHealthScore, ...data } = hubData;

  try {
    // Upsert career hub
    const hub = await db.one(
      `INSERT INTO career_hubs (
        city, country, intensity, market_health_score,
        average_salary_min, average_salary_max, currency,
        cost_of_living, visa_openness, hiring_trends,
        remote_work_percentage, internship_opportunities,
        top_employers, market_data, cached_at, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW() + INTERVAL '7 days')
      ON CONFLICT (city, country) DO UPDATE SET
        intensity = $3,
        market_health_score = $4,
        average_salary_min = $5,
        average_salary_max = $6,
        cost_of_living = $8,
        visa_openness = $9,
        hiring_trends = $10,
        remote_work_percentage = $11,
        internship_opportunities = $12,
        top_employers = $13,
        market_data = $14,
        cached_at = NOW(),
        expires_at = NOW() + INTERVAL '7 days'
      RETURNING id`,
      [
        city,
        country,
        intensity,
        marketHealthScore,
        data.averageSalaryRange?.min || null,
        data.averageSalaryRange?.max || null,
        data.averageSalaryRange?.currency || "USD",
        data.costOfLiving || 1.0,
        data.visaOpenness || "Medium",
        data.hiringTrends || "",
        data.remoteWorkPercentage || 0,
        data.internshipOpportunities || 0,
        JSON.stringify(data.topEmployers || []),
        JSON.stringify(data),
      ]
    );

    // Clear and save top careers
    await db.none("DELETE FROM hub_top_careers WHERE hub_id = $1", [hub.id]);
    if (data.topCareers && Array.isArray(data.topCareers)) {
      for (const career of data.topCareers) {
        await db.none(
          `INSERT INTO hub_top_careers (
            hub_id, career_title, demand_score,
            entry_salary, mid_salary, senior_salary,
            job_growth_percentage, estimated_openings
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            hub.id,
            career.title,
            career.demandScore,
            career.avgSalary?.entry || null,
            career.avgSalary?.mid || null,
            career.avgSalary?.senior || null,
            career.jobGrowth || 0,
            career.openings || 0,
          ]
        );
      }
    }

    // Clear and save required skills
    await db.none("DELETE FROM hub_required_skills WHERE hub_id = $1", [hub.id]);
    if (data.requiredSkills && Array.isArray(data.requiredSkills)) {
      for (const skill of data.requiredSkills) {
        await db.none(
          `INSERT INTO hub_required_skills (hub_id, skill_name, demand_score)
           VALUES ($1, $2, $3)`,
          [hub.id, skill.skill, skill.demand]
        );
      }
    }

    return hub.id;
  } catch (error) {
    console.error("Error saving career hub:", error);
    throw error;
  }
}

/**
 * Get Career Hub Intelligence from database (with cache expiry check)
 */
export async function getCareerHubFromDb(
  city: string,
  country: string
): Promise<any | null> {
  try {
    const hub = await db.oneOrNone(
      `SELECT * FROM career_hubs
       WHERE city = $1 AND country = $2
       AND (expires_at IS NULL OR expires_at > NOW())`,
      [city, country]
    );

    if (!hub) return null;

    // Get top careers
    const topCareers = await db.many(
      `SELECT * FROM hub_top_careers WHERE hub_id = $1 ORDER BY demand_score DESC`,
      [hub.id]
    );

    // Get required skills
    const requiredSkills = await db.many(
      `SELECT * FROM hub_required_skills WHERE hub_id = $1 ORDER BY demand_score DESC`,
      [hub.id]
    );

    // Reconstruct the full data object
    return {
      id: hub.id,
      city: hub.city,
      country: hub.country,
      intensity: hub.intensity,
      marketHealthScore: hub.market_health_score,
      averageSalaryRange: {
        min: hub.average_salary_min,
        max: hub.average_salary_max,
        currency: hub.currency,
      },
      costOfLiving: hub.cost_of_living,
      visaOpenness: hub.visa_openness,
      hiringTrends: hub.hiring_trends,
      remoteWorkPercentage: hub.remote_work_percentage,
      internshipOpportunities: hub.internship_opportunities,
      topEmployers: hub.top_employers ? JSON.parse(hub.top_employers) : [],
      topCareers: topCareers.map((tc) => ({
        title: tc.career_title,
        demandScore: tc.demand_score,
        avgSalary: {
          entry: tc.entry_salary,
          mid: tc.mid_salary,
          senior: tc.senior_salary,
          currency: "USD",
        },
        jobGrowth: tc.job_growth_percentage,
        openings: tc.estimated_openings,
      })),
      requiredSkills: requiredSkills.map((rs) => ({
        skill: rs.skill_name,
        demand: rs.demand_score,
      })),
      cachedAt: hub.cached_at,
    };
  } catch (error) {
    console.error("Error fetching career hub from db:", error);
    return null;
  }
}

export async function getCachedCareerHub(
  city: string,
  country: string
): Promise<any | null> {
  return getCareerHubFromDb(city, country);
}

export async function saveCachedCareerHub(hubData: any): Promise<any> {
  return saveCareerHub(hubData);
}

export async function getCachedTopCareers(): Promise<any[] | null> {
  try {
    const careers = await db.manyOrNone(
      `SELECT id, title, description, growth, category, sub_category, work_type, tags
       FROM career_paths
       WHERE is_top_global = true
         AND (expires_at IS NULL OR expires_at > NOW())
       ORDER BY cached_at DESC
       LIMIT 10`
    );
    return careers.length > 0 ? careers : null;
  } catch (error) {
    console.error("Error fetching cached top careers:", error);
    return null;
  }
}

export async function saveCachedTopCareers(careers: any[]): Promise<boolean> {
  try {
    for (const career of careers) {
      await db.none(
        `INSERT INTO career_paths (id, title, description, growth, category, sub_category, work_type, tags, is_top_global, cached_at, expires_at)
         VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW() + INTERVAL '7 days')
         ON CONFLICT (title) DO UPDATE SET
           description = EXCLUDED.description,
           growth = EXCLUDED.growth,
           category = EXCLUDED.category,
           sub_category = EXCLUDED.sub_category,
           work_type = EXCLUDED.work_type,
           tags = EXCLUDED.tags,
           is_top_global = true,
           cached_at = NOW(),
           expires_at = NOW() + INTERVAL '7 days'`,
        [
          career.title,
          career.description,
          career.growth || "high",
          career.category || "General",
          career.subCategory || career.sub_category || "",
          (() => {
            const wt = career.workType || career.work_type || "Remote";
            const valid = ["Remote", "On-site", "Hybrid", "Mobile"];
            return valid.includes(wt) ? wt : "Remote";
          })(),
          Array.isArray(career.tags) ? JSON.stringify(career.tags) : career.tags || "[]",
        ]
      );
    }
    return true;
  } catch (error) {
    console.error("Error saving cached top careers:", error);
    return false;
  }
}

// Map DB snake_case row → camelCase Institution object expected by frontend
function mapInstitutionRow(row: any) {
  return {
    id: row.id,
    name: row.name,
    location: row.location,
    city: row.city,
    country: row.country,
    type: row.type || "University",
    avgCost: Number(row.avg_cost) || 0,
    programs: typeof row.programs === 'string' ? JSON.parse(row.programs) : (row.programs || []),
    ranking: row.ranking || null,
    image: row.image || "",
    applicationDeadline: row.application_deadline || "",
    website: row.website || "",
    allowsInternationalStudents: row.allows_international_students ?? true,
    visaSupport: row.visa_support || "Full",
    coordinates: {
      lat: Number(row.latitude) || 0,
      lng: Number(row.longitude) || 0,
    },
    costOfLivingIndex: Number(row.cost_of_living_index) || 1.0,
  };
}

export async function getCachedInstitutions(
  targetLocation: string
): Promise<any[] | null> {
  try {
    const rows = await db.manyOrNone(
      `SELECT * FROM institutions
       WHERE city ILIKE $1
          OR country ILIKE $1
          OR location ILIKE $1
       ORDER BY updated_at DESC
       LIMIT 20`,
      [`%${targetLocation}%`]
    );
    return rows.length > 0 ? rows.map(mapInstitutionRow) : null;
  } catch (error) {
    console.error("Error fetching cached institutions:", error);
    return null;
  }
}

export async function getCachedInstitutionsByQuery(
  query: string
): Promise<any[] | null> {
  try {
    const rows = await db.manyOrNone(
      `SELECT * FROM institutions
       WHERE name ILIKE $1
          OR city ILIKE $1
          OR country ILIKE $1
          OR location ILIKE $1
          OR programs::text ILIKE $1
       ORDER BY updated_at DESC
       LIMIT 20`,
      [`%${query}%`]
    );
    return rows.length > 0 ? rows.map(mapInstitutionRow) : null;
  } catch (error) {
    console.error("Error fetching cached institutions by query:", error);
    return null;
  }
}

export async function saveCachedInstitutions(institutions: any[]): Promise<boolean> {
  try {
    for (const institution of institutions) {
      // Validate and sanitize application_deadline — must be a parseable date or null
      let appDeadline: string | null = null;
      const rawDeadline = institution.applicationDeadline || institution.application_deadline;
      if (rawDeadline) {
        // Strip ordinal suffixes (1st, 2nd, 3rd, 4th, etc.) and try parsing with current year appended
        const cleaned = String(rawDeadline).replace(/(\d+)(st|nd|rd|th)/gi, '$1');
        const withYear = /\d{4}/.test(cleaned) ? cleaned : `${cleaned} ${new Date().getFullYear()}`;
        const d = new Date(withYear);
        if (!isNaN(d.getTime())) appDeadline = d.toISOString().split('T')[0];
      }
      await db.none(
        `INSERT INTO institutions (id, name, location, city, country, type, avg_cost, programs, ranking, image, application_deadline, website, allows_international_students, visa_support, latitude, longitude, cost_of_living_index)
         VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
         ON CONFLICT DO NOTHING`,
        [
          institution.name,
          institution.location || `${institution.city || ""}, ${institution.country || ""}`,
          institution.city || "",
          institution.country || "",
          institution.type || "University",
          institution.avgCost || institution.avg_cost || 0,
          Array.isArray(institution.programs) ? JSON.stringify(institution.programs) : institution.programs || "[]",
          institution.ranking || null,
          institution.image || institution.logo || "",
          appDeadline,
          institution.website || "",
          institution.allowsInternationalStudents ?? institution.allows_international_students ?? true,
          institution.visaSupport || institution.visa_support || "Full",
          institution.coordinates?.lat || institution.latitude || null,
          institution.coordinates?.lng || institution.longitude || null,
          institution.costOfLivingIndex || institution.cost_of_living_index || 1.0,
        ]
      );
    }
    return true;
  } catch (error) {
    console.error("Error saving cached institutions:", error);
    return false;
  }
}

export async function getCachedStudyMaterialsByCareer(
  careerId: string
): Promise<any[] | null> {
  try {
    // careerId may be a numeric string from AI; skip cache lookup if it's not a valid UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(careerId);
    if (!isUuid) return null;
    const materials = await db.manyOrNone(
      `SELECT * FROM study_materials
       WHERE career_id = $1
       ORDER BY updated_at DESC
       LIMIT 20`,
      [careerId]
    );
    return materials.length > 0 ? materials : null;
  } catch (error) {
    console.error("Error fetching cached study materials:", error);
    return null;
  }
}

export async function saveCachedStudyMaterials(
  materials: any[],
  careerId: string
): Promise<boolean> {
  try {
    for (const material of materials) {
      await db.none(
        `INSERT INTO study_materials (id, title, type, provider, url, career_id, duration, thumbnail, region, language, rating, skill_level, tags, description)
         VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT DO NOTHING`,
        [
          material.title,
          material.type || "article",
          material.provider || "",
          material.url || "",
          careerId || material.careerId || null,
          material.duration || "",
          material.thumbnail || "",
          material.region || "Global",
          material.language || "English",
          material.rating || 0,
          material.skillLevel || material.skill_level || "Beginner",
          Array.isArray(material.tags) ? JSON.stringify(material.tags) : material.tags || "[]",
          material.description || "",
        ]
      );
    }
    return true;
  } catch (error) {
    console.error("Error saving cached study materials:", error);
    return false;
  }
}

/**
 * Save Job Market Insights to database
 */
export async function saveJobMarketInsights(
  careerId: string | null,
  country: string,
  insightsData: any
) {
  const {
    salaryBenchmarks,
    growthForecast,
    inDemandSkills,
    topHiringCompanies,
  } = insightsData;

  try {
    await db.none(
      `INSERT INTO job_market_insights (
        career_id, country, salary_entry, salary_mid, salary_senior,
        currency, growth_percentage, growth_trend, growth_description,
        in_demand_skills, top_hiring_companies, market_data,
        cached_at, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW() + INTERVAL '7 days')
      ON CONFLICT (career_id, country) DO UPDATE SET
        salary_entry = $3,
        salary_mid = $4,
        salary_senior = $5,
        growth_percentage = $7,
        growth_trend = $8,
        in_demand_skills = $10,
        top_hiring_companies = $11,
        market_data = $12,
        cached_at = NOW(),
        expires_at = NOW() + INTERVAL '7 days'`,
      [
        careerId,
        country,
        salaryBenchmarks?.entry || 0,
        salaryBenchmarks?.mid || 0,
        salaryBenchmarks?.senior || 0,
        salaryBenchmarks?.currency || "USD",
        growthForecast?.percentage || 0,
        growthForecast?.trend || "stable",
        growthForecast?.description || "",
        JSON.stringify(inDemandSkills || []),
        JSON.stringify(topHiringCompanies || []),
        JSON.stringify(insightsData),
      ]
    );
  } catch (error) {
    console.error("Error saving job market insights:", error);
    throw error;
  }
}

/**
 * Get Job Market Insights from database
 */
export async function getJobMarketInsightsFromDb(
  careerId: string | null,
  country: string
): Promise<any | null> {
  try {
    const insights = await db.oneOrNone(
      `SELECT * FROM job_market_insights
       WHERE career_id = $1 AND country = $2
       AND (expires_at IS NULL OR expires_at > NOW())`,
      [careerId, country]
    );

    if (!insights) return null;

    return {
      careerId: insights.career_id,
      salaryBenchmarks: {
        entry: insights.salary_entry,
        mid: insights.salary_mid,
        senior: insights.salary_senior,
        currency: insights.currency,
      },
      growthForecast: {
        percentage: insights.growth_percentage,
        trend: insights.growth_trend,
        description: insights.growth_description,
      },
      inDemandSkills: insights.in_demand_skills
        ? JSON.parse(insights.in_demand_skills)
        : [],
      topHiringCompanies: insights.top_hiring_companies
        ? JSON.parse(insights.top_hiring_companies)
        : [],
    };
  } catch (error) {
    console.error("Error fetching market insights from db:", error);
    return null;
  }
}

/**
 * Mark cache entry as expired
 */
export async function expireCache(
  entityType: string,
  entityId?: string | null
) {
  try {
    if (entityId) {
      await db.none(
        `UPDATE cache_metadata SET expires_at = NOW()
         WHERE entity_type = $1 AND entity_id = $2`,
        [entityType, entityId]
      );
    } else {
      await db.none(
        `UPDATE cache_metadata SET expires_at = NOW()
         WHERE entity_type = $1`,
        [entityType]
      );
    }
  } catch (error) {
    console.error("Error expiring cache:", error);
  }
}

/**
 * Check if cache entry is still valid
 */
export async function isCacheValid(cacheKey: string): Promise<boolean> {
  try {
    const result = await db.oneOrNone(
      `SELECT id FROM cache_metadata
       WHERE cache_key = $1
       AND (expires_at IS NULL OR expires_at > NOW())`,
      [cacheKey]
    );
    return result !== null;
  } catch (error) {
    console.error("Error checking cache validity:", error);
    return false;
  }
}

/**
 * Set cache metadata
 */
export async function setCacheMetadata(
  cacheKey: string,
  entityType: string,
  entityId?: string | null,
  ttlHours: number = 168
) {
  try {
    await db.none(
      `INSERT INTO cache_metadata (cache_key, entity_type, entity_id, ttl_hours, expires_at)
       VALUES ($1, $2, $3, $4, NOW() + INTERVAL '1 hour' * $4)
       ON CONFLICT (cache_key) DO UPDATE SET
       cached_at = NOW(),
       expires_at = NOW() + INTERVAL '1 hour' * $4`,
      [cacheKey, entityType, entityId || null, ttlHours]
    );
  } catch (error) {
    console.error("Error setting cache metadata:", error);
  }
}

// ─── Country Careers Cache ─────────────────────────────────────────────────

export interface CountryCareerEntry {
  id: string;
  title: string;
  description: string;
  growth: "high" | "medium" | "stable";
  category: string;
  subCategory: string;
  workType: "Remote" | "On-site" | "Hybrid" | "Mobile";
  tags: string[];
  visibility: "public" | "private";
  demandScore: number;
  avgSalaryUSD: number;
  topSkills: string[];
  topCompanies: string[];
  country: string;
}

export async function getCachedCountryCareers(
  country: string
): Promise<CountryCareerEntry[] | null> {
  try {
    const row = await db.oneOrNone(
      `SELECT careers_json FROM country_careers_cache
       WHERE country = $1 AND expires_at > NOW()`,
      [country]
    );
    if (!row) return null;
    return JSON.parse(row.careers_json) as CountryCareerEntry[];
  } catch (error) {
    console.error("Error fetching country careers cache:", error);
    return null;
  }
}

export async function saveCountryCareersCache(
  country: string,
  careers: CountryCareerEntry[]
): Promise<void> {
  try {
    await db.none(
      `INSERT INTO country_careers_cache (country, careers_json, cached_at, expires_at)
       VALUES ($1, $2, NOW(), NOW() + INTERVAL '24 hours')
       ON CONFLICT (country) DO UPDATE SET
         careers_json = EXCLUDED.careers_json,
         cached_at    = NOW(),
         expires_at   = NOW() + INTERVAL '24 hours'`,
      [country, JSON.stringify(careers)]
    );
  } catch (error) {
    console.error("Error saving country careers cache:", error);
  }
}

export async function invalidateCountryCareersCache(
  country: string
): Promise<void> {
  try {
    await db.none(
      `UPDATE country_careers_cache SET expires_at = NOW() WHERE country = $1`,
      [country]
    );
  } catch (error) {
    console.error("Error invalidating country careers cache:", error);
  }
}

// ─── Milestones Cache ──────────────────────────────────────────────────────

export interface CachedMilestone {
  ageRange: string;
  title: string;
  description: string;
  requirements: string[];
}

export async function getCachedMilestones(
  cacheKey: string
): Promise<CachedMilestone[] | null> {
  try {
    const row = await db.oneOrNone(
      `SELECT milestones_json FROM milestones_cache
       WHERE cache_key = $1 AND expires_at > NOW()`,
      [cacheKey]
    );
    if (!row) return null;
    return JSON.parse(row.milestones_json) as CachedMilestone[];
  } catch (error) {
    console.error("Error reading milestones cache:", error);
    return null;
  }
}

export async function saveMilestonesCache(
  cacheKey: string,
  milestones: CachedMilestone[]
): Promise<void> {
  try {
    await db.none(
      `INSERT INTO milestones_cache (cache_key, milestones_json, cached_at, expires_at)
       VALUES ($1, $2, NOW(), NOW() + INTERVAL '7 days')
       ON CONFLICT (cache_key) DO UPDATE SET
         milestones_json = EXCLUDED.milestones_json,
         cached_at       = NOW(),
         expires_at      = NOW() + INTERVAL '7 days'`,
      [cacheKey, JSON.stringify(milestones)]
    );
  } catch (error) {
    console.error("Error saving milestones cache:", error);
  }
}

// ─── Hub Search Cache ──────────────────────────────────────────────────────

export async function getCachedHubSearch(
  queryKey: string
): Promise<{ city: string; country: string }[] | null> {
  try {
    const row = await db.oneOrNone(
      `SELECT results_json FROM hub_search_cache
       WHERE query_key = $1 AND expires_at > NOW()`,
      [queryKey]
    );
    if (!row) return null;
    return JSON.parse(row.results_json);
  } catch (error) {
    console.error("Error reading hub search cache:", error);
    return null;
  }
}

export async function saveHubSearchCache(
  queryKey: string,
  results: { city: string; country: string }[]
): Promise<void> {
  try {
    await db.none(
      `INSERT INTO hub_search_cache (query_key, results_json, cached_at, expires_at)
       VALUES ($1, $2, NOW(), NOW() + INTERVAL '48 hours')
       ON CONFLICT (query_key) DO UPDATE SET
         results_json = EXCLUDED.results_json,
         cached_at    = NOW(),
         expires_at   = NOW() + INTERVAL '48 hours'`,
      [queryKey, JSON.stringify(results)]
    );
  } catch (error) {
    console.error("Error saving hub search cache:", error);
  }
}

// ─── Dashboard Intelligence Cache (24-hour TTL) ─────────────────────────────

export async function getCachedDashboardIntel(cacheKey: string): Promise<any | null> {
  try {
    const row = await db.oneOrNone<{ data_json: any }>(
      `SELECT data_json FROM dashboard_cache WHERE cache_key = $1 AND expires_at > NOW()`,
      [cacheKey]
    );
    return row?.data_json ?? null;
  } catch {
    return null;
  }
}

export async function saveDashboardIntelCache(cacheKey: string, data: any): Promise<void> {
  try {
    await db.none(
      `INSERT INTO dashboard_cache (cache_key, data_json, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '24 hours')
       ON CONFLICT (cache_key) DO UPDATE SET data_json = EXCLUDED.data_json, expires_at = NOW() + INTERVAL '24 hours'`,
      [cacheKey, JSON.stringify(data)]
    );
  } catch (err) {
    console.warn("saveDashboardIntelCache failed (non-blocking):", err);
  }
}

// ─── Skill Gap Cache (7-day TTL) ────────────────────────────────────────────

export async function getCachedSkillGap(cacheKey: string): Promise<any[] | null> {
  try {
    const row = await db.oneOrNone<{ data_json: any[] }>(
      `SELECT data_json FROM skillgap_cache WHERE cache_key = $1 AND expires_at > NOW()`,
      [cacheKey]
    );
    return row?.data_json ?? null;
  } catch {
    return null;
  }
}

export async function saveSkillGapCache(cacheKey: string, data: any[]): Promise<void> {
  try {
    await db.none(
      `INSERT INTO skillgap_cache (cache_key, data_json, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '7 days')
       ON CONFLICT (cache_key) DO UPDATE SET data_json = EXCLUDED.data_json, expires_at = NOW() + INTERVAL '7 days'`,
      [cacheKey, JSON.stringify(data)]
    );
  } catch (err) {
    console.warn("saveSkillGapCache failed (non-blocking):", err);
  }
}

// ─── Scholarships Cache (24-hour TTL) ───────────────────────────────────────

export async function getCachedScholarships(cacheKey: string): Promise<any[] | null> {
  try {
    const row = await db.oneOrNone<{ scholarships_json: any[] }>(
      `SELECT scholarships_json FROM scholarships_cache WHERE cache_key = $1 AND expires_at > NOW()`,
      [cacheKey]
    );
    return row?.scholarships_json ?? null;
  } catch {
    return null;
  }
}

export async function saveScholarshipsCache(cacheKey: string, data: any[]): Promise<void> {
  try {
    await db.none(
      `INSERT INTO scholarships_cache (cache_key, scholarships_json, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '24 hours')
       ON CONFLICT (cache_key) DO UPDATE SET scholarships_json = EXCLUDED.scholarships_json, expires_at = NOW() + INTERVAL '24 hours'`,
      [cacheKey, JSON.stringify(data)]
    );
  } catch (err) {
    console.warn("saveScholarshipsCache failed (non-blocking):", err);
  }
}

// ─── Generic AI Response Cache (ai_response_cache table) ─────────────────────
// Used for: job listings, study materials, job directory, career requirements, etc.
// TTL is caller-specified (default 24h).

export async function getAiCache<T = any>(cacheKey: string): Promise<T | null> {
  try {
    const row = await db.oneOrNone<{ data_json: T }>(
      `SELECT data_json FROM ai_response_cache WHERE cache_key = $1 AND expires_at > NOW()`,
      [cacheKey]
    );
    return row?.data_json ?? null;
  } catch {
    return null;
  }
}

export async function setAiCache(cacheKey: string, data: any, ttlHours = 24): Promise<void> {
  try {
    await db.none(
      `INSERT INTO ai_response_cache (cache_key, data_json, cached_at, expires_at)
       VALUES ($1, $2, NOW(), NOW() + ($3 || ' hours')::INTERVAL)
       ON CONFLICT (cache_key) DO UPDATE SET
         data_json  = EXCLUDED.data_json,
         cached_at  = NOW(),
         expires_at = NOW() + ($3 || ' hours')::INTERVAL`,
      [cacheKey, JSON.stringify(data), ttlHours]
    );
  } catch (err) {
    console.warn("setAiCache failed (non-blocking):", err);
  }
}

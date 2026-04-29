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

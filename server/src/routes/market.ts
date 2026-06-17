import { Router, Request, Response } from "express";
import {
  saveCareerHub,
  getCareerHubFromDb,
  saveJobMarketInsights,
  getJobMarketInsightsFromDb,
  setCacheMetadata,
} from "../db/marketCache.js";

const router = Router();

/**
 * GET /api/market/career-hub/:city/:country
 * Get Career Hub Intelligence (from cache if available)
 */
router.get("/career-hub/:city/:country", async (req: Request, res: Response) => {
  try {
    const { city, country } = req.params;

    // Try to get from database cache first
    const cachedHub = await getCareerHubFromDb(city, country);

    if (cachedHub) {
      return res.json({
        source: "cache",
        data: cachedHub,
      });
    }

    // If not in cache, return empty to trigger frontend LLM call
    return res.json({
      source: "not-cached",
      data: null,
    });
  } catch (error) {
    console.error("Error fetching career hub:", error);
    res.status(500).json({ error: "Failed to fetch career hub data" });
  }
});

/**
 * POST /api/market/career-hub
 * Save Career Hub Intelligence to database
 */
router.post("/career-hub", async (req: Request, res: Response) => {
  try {
    const hubData = req.body;

    if (!hubData.city || !hubData.country) {
      return res
        .status(400)
        .json({ error: "city and country are required" });
    }

    const hubId = await saveCareerHub(hubData);

    // Set cache metadata
    await setCacheMetadata(
      `career-hub-${hubData.city}-${hubData.country}`,
      "career_hub",
      hubId,
      168 // 7 days
    );

    res.json({
      success: true,
      hubId,
      message: `Career hub data saved for ${hubData.city}, ${hubData.country}`,
    });
  } catch (error) {
    console.error("Error saving career hub:", error);
    res.status(500).json({ error: "Failed to save career hub data" });
  }
});

/**
 * GET /api/market/job-insights/:careerId/:country
 * Get Job Market Insights (from cache if available)
 */
router.get(
  "/job-insights/:careerId/:country",
  async (req: Request, res: Response) => {
    try {
      const { careerId, country } = req.params;

      // Try to get from database cache first
      const cachedInsights = await getJobMarketInsightsFromDb(
        careerId || null,
        country
      );

      if (cachedInsights) {
        return res.json({
          source: "cache",
          data: cachedInsights,
        });
      }

      // If not in cache, return empty to trigger frontend LLM call
      return res.json({
        source: "not-cached",
        data: null,
      });
    } catch (error) {
      console.error("Error fetching job insights:", error);
      res.status(500).json({ error: "Failed to fetch job market insights" });
    }
  }
);

/**
 * POST /api/market/job-insights
 * Save Job Market Insights to database
 */
router.post("/job-insights", async (req: Request, res: Response) => {
  try {
    const { careerId, country, insights } = req.body;

    if (!country || !insights) {
      return res
        .status(400)
        .json({ error: "country and insights are required" });
    }

    await saveJobMarketInsights(careerId || null, country, insights);

    // Set cache metadata
    await setCacheMetadata(
      `job-insights-${careerId}-${country}`,
      "job_market_insights",
      careerId || null,
      168 // 7 days
    );

    res.json({
      success: true,
      message: `Job market insights saved for ${country}`,
    });
  } catch (error) {
    console.error("Error saving job insights:", error);
    res.status(500).json({ error: "Failed to save job market insights" });
  }
});

/**
 * POST /api/market/save-institutions
 * Bulk save institutions to database
 */
router.post("/save-institutions", async (req: Request, res: Response) => {
  try {
    const { institutions } = req.body;

    if (!Array.isArray(institutions)) {
      return res.status(400).json({ error: "institutions must be an array" });
    }

    // Save all institutions
    for (const institution of institutions) {
      await saveInstitution(institution);
    }

    res.json({
      success: true,
      count: institutions.length,
      message: `Saved ${institutions.length} institutions`,
    });
  } catch (error) {
    console.error("Error saving institutions:", error);
    res.status(500).json({ error: "Failed to save institutions" });
  }
});

/**
 * Helper function to save institution
 */
async function saveInstitution(institution: any) {
  const { db } = await import("../db/database.js");

  await db.none(
    `INSERT INTO institutions (
      name, location, city, country, type, avg_cost,
      programs, ranking, image, application_deadline, website,
      allows_international_students, visa_support, latitude, longitude,
      cost_of_living_index
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    ON CONFLICT DO NOTHING`,
    [
      institution.name,
      institution.location,
      institution.city,
      institution.country,
      institution.type,
      institution.avgCost,
      JSON.stringify(institution.programs),
      institution.ranking || null,
      institution.image,
      institution.applicationDeadline && !isNaN(Date.parse(institution.applicationDeadline))
        ? institution.applicationDeadline
        : null,
      institution.website,
      institution.allowsInternationalStudents !== false,
      institution.visaSupport || "None",
      institution.coordinates?.lat || null,
      institution.coordinates?.lng || null,
      institution.costOfLivingIndex || 1.0,
    ]
  );
}

/**
 * POST /api/market/save-study-materials
 * Bulk save study materials to database
 */
router.post("/save-study-materials", async (req: Request, res: Response) => {
  try {
    const { materials, careerId } = req.body;

    if (!Array.isArray(materials)) {
      return res.status(400).json({ error: "materials must be an array" });
    }

    if (!careerId) {
      return res.status(400).json({ error: "careerId is required" });
    }

    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_RE.test(careerId)) {
      return res.status(400).json({ error: "careerId must be a valid UUID" });
    }

    // Save all materials
    for (const material of materials) {
      await saveMaterial(material, careerId);
    }

    res.json({
      success: true,
      count: materials.length,
      message: `Saved ${materials.length} study materials`,
    });
  } catch (error) {
    console.error("Error saving study materials:", error);
    res.status(500).json({ error: "Failed to save study materials" });
  }
});

/**
 * Helper function to save study material
 */
async function saveMaterial(material: any, careerId: string) {
  const { db } = await import("../db/database.js");

  await db.none(
    `INSERT INTO study_materials (
      title, type, provider, url, career_id, duration,
      thumbnail, region, language, rating, skill_level,
      tags, description
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    ON CONFLICT DO NOTHING`,
    [
      material.title,
      material.type?.toLowerCase() || null,
      material.provider,
      material.url,
      careerId,
      material.duration,
      material.thumbnail,
      ["Global", "NA", "EU", "ASIA", "UK"].includes(material.region) ? material.region : "Global",
      material.language || "English",
      material.rating ?? 4.5,
      material.skillLevel
        ? material.skillLevel.charAt(0).toUpperCase() + material.skillLevel.slice(1).toLowerCase()
        : "Intermediate",
      JSON.stringify(material.tags || []),
      material.description || "",
    ]
  );
}
/**
 * GET /api/market/study-materials/:careerId
 * Get cached study materials for a specific career
 */
router.get("/study-materials/:careerId", async (req: Request, res: Response) => {
  try {
    const { careerId } = req.params;
    const { db } = await import("../db/database.js");

    // career_id is a UUID column — skip the query entirely for non-UUID values
    // (e.g. slug strings like "nursing" passed from the frontend)
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_RE.test(careerId)) {
      return res.json({ source: "not-cached", data: null });
    }

    // Use manyOrNone so an empty result set returns [] instead of throwing
    const materials = await db.manyOrNone(
      `SELECT * FROM study_materials WHERE career_id = $1 ORDER BY created_at DESC`,
      [careerId]
    );

    if (materials && materials.length > 0) {
      return res.json({
        source: "cache",
        data: materials.map((m) => ({
          id: m.id,
          title: m.title,
          type: m.type,
          provider: m.provider,
          url: m.url,
          careerId: m.career_id,
          duration: m.duration,
          thumbnail: m.thumbnail,
          region: m.region,
          language: m.language,
          rating: m.rating,
          skillLevel: m.skill_level,
          tags: m.tags ? JSON.parse(m.tags) : [],
          description: m.description,
        })),
      });
    }

    return res.json({ source: "not-cached", data: null });
  } catch (error) {
    console.error("Error fetching study materials:", error);
    res.status(500).json({ error: "Failed to fetch study materials" });
  }
});

/**
 * GET /api/market/institutions
 * Get cached institutions by country/city
 */
router.get("/institutions", async (req: Request, res: Response) => {
  try {
    const { country, city } = req.query;
    const { db } = await import("../db/database.js");

    if (!country) {
      return res.status(400).json({ error: "country query parameter is required" });
    }

    let query = `SELECT * FROM institutions WHERE country = $1`;
    let params: any[] = [country];

    if (city) {
      query += ` AND city = $2`;
      params.push(city);
    }

    query += ` ORDER BY ranking ASC NULLS LAST LIMIT 30`;

    // Use manyOrNone so an empty result set returns [] instead of throwing
    const institutions = await db.manyOrNone(query, params);

    if (institutions && institutions.length > 0) {
      return res.json({
        source: "cache",
        data: institutions.map((i) => ({
          id: i.id,
          name: i.name,
          location: i.location,
          city: i.city,
          country: i.country,
          type: i.type,
          avgCost: i.avg_cost,
          programs: i.programs ? JSON.parse(i.programs) : [],
          ranking: i.ranking,
          image: i.image,
          applicationDeadline: i.application_deadline,
          website: i.website,
          allowsInternationalStudents: i.allows_international_students,
          visaSupport: i.visa_support,
          coordinates: {
            lat: i.latitude,
            lng: i.longitude,
          },
          costOfLivingIndex: i.cost_of_living_index,
        })),
      });
    }

    return res.json({ source: "not-cached", data: null });
  } catch (error) {
    console.error("Error fetching institutions:", error);
    res.status(500).json({ error: "Failed to fetch institutions" });
  }
});

export default router;

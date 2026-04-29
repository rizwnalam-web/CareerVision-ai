import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/database.js";
import { StudyMaterial } from "../types/index.js";
import { videoMaterialsService } from "../services/videoMaterialsService.js";

const router = Router();

/**
 * External Material Search Endpoints
 * Links to curated educational content without hosting
 */

// Search across all external sources
router.get("/search/all", async (req, res) => {
  try {
    const { query, skillLevel = "Beginner" } = req.query;

    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Query parameter is required" });
    }

    const materials = await videoMaterialsService.searchAllSources(
      query,
      (skillLevel as any) || "Beginner"
    );

    res.json(materials);
  } catch (error) {
    console.error("Search all sources error:", error);
    res.status(500).json({ error: "Failed to search materials" });
  }
});

// Search Boclips (1.7M+ educational videos)
router.get("/search/boclips", async (req, res) => {
  try {
    const { query, skillLevel = "Beginner", limit = 10 } = req.query;

    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Query parameter is required" });
    }

    const materials = await videoMaterialsService.searchBoclips(
      query,
      (skillLevel as any) || "Beginner",
      parseInt(limit as string) || 10
    );

    res.json(materials);
  } catch (error) {
    console.error("Boclips search error:", error);
    res.status(500).json({ error: "Failed to search Boclips" });
  }
});

// Search YouTube
router.get("/search/youtube", async (req, res) => {
  try {
    const { query, skillLevel = "Beginner", limit = 10 } = req.query;

    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Query parameter is required" });
    }

    const materials = await videoMaterialsService.searchYouTube(
      query,
      (skillLevel as any) || "Beginner",
      parseInt(limit as string) || 10
    );

    res.json(materials);
  } catch (error) {
    console.error("YouTube search error:", error);
    res.status(500).json({ error: "Failed to search YouTube" });
  }
});

// Search Coursera
router.get("/search/coursera", async (req, res) => {
  try {
    const { query, skillLevel = "Beginner", limit = 5 } = req.query;

    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Query parameter is required" });
    }

    const materials = await videoMaterialsService.searchCoursera(
      query,
      (skillLevel as any) || "Beginner",
      parseInt(limit as string) || 5
    );

    res.json(materials);
  } catch (error) {
    console.error("Coursera search error:", error);
    res.status(500).json({ error: "Failed to search Coursera" });
  }
});

// Search Udemy
router.get("/search/udemy", async (req, res) => {
  try {
    const { query, skillLevel = "Beginner", limit = 10 } = req.query;

    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Query parameter is required" });
    }

    const materials = await videoMaterialsService.searchUdemy(
      query,
      (skillLevel as any) || "Beginner",
      parseInt(limit as string) || 10
    );

    res.json(materials);
  } catch (error) {
    console.error("Udemy search error:", error);
    res.status(500).json({ error: "Failed to search Udemy" });
  }
});

// Search MIT OpenCourseWare (Free)
router.get("/search/mit-ocw", async (req, res) => {
  try {
    const { query, skillLevel = "Intermediate", limit = 5 } = req.query;

    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Query parameter is required" });
    }

    const materials = await videoMaterialsService.searchMITOpenCourseWare(
      query,
      (skillLevel as any) || "Intermediate",
      parseInt(limit as string) || 5
    );

    res.json(materials);
  } catch (error) {
    console.error("MIT OCW search error:", error);
    res.status(500).json({ error: "Failed to search MIT OpenCourseWare" });
  }
});

// Get all study materials
router.get("/", async (req, res) => {
  try {
    const { careerId, type, region, skillLevel } = req.query;
    let query = "SELECT * FROM study_materials WHERE 1=1";
    const params = [];

    if (careerId) {
      query += ` AND career_id = $${params.length + 1}`;
      params.push(careerId);
    }
    if (type) {
      query += ` AND type = $${params.length + 1}`;
      params.push(type);
    }
    if (region) {
      query += ` AND region = $${params.length + 1}`;
      params.push(region);
    }
    if (skillLevel) {
      query += ` AND skill_level = $${params.length + 1}`;
      params.push(skillLevel);
    }

    query += " ORDER BY rating DESC";
    const materials = await db.manyOrNone<StudyMaterial>(query, params);
    res.json(materials || []);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch study materials" });
  }
});

// Get study material by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const material = await db.oneOrNone<StudyMaterial>(
      "SELECT * FROM study_materials WHERE id = $1",
      [id]
    );

    if (!material) {
      return res.status(404).json({ error: "Study material not found" });
    }

    res.json(material);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch study material" });
  }
});

// Create new study material
router.post("/", async (req, res) => {
  try {
    const {
      title,
      type,
      provider,
      url,
      careerId,
      duration,
      thumbnail,
      region,
      language,
      rating,
      skillLevel,
      tags,
      description,
    } = req.body;

    if (!title || !careerId) {
      return res
        .status(400)
        .json({ error: "Title and career ID are required" });
    }

    const id = uuidv4();
    await db.none(
      `INSERT INTO study_materials 
       (id, title, type, provider, url, career_id, duration, thumbnail, region, language, rating, skill_level, tags, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        id,
        title,
        type || "course",
        provider || null,
        url || null,
        careerId,
        duration || null,
        thumbnail || null,
        region || "Global",
        language || "English",
        rating || 0,
        skillLevel || "Beginner",
        tags || null,
        description || null,
      ]
    );

    res.status(201).json({
      id,
      title,
      type,
      provider,
      url,
      careerId,
      duration,
      thumbnail,
      region,
      language,
      rating,
      skillLevel,
      tags,
      description,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to create study material" });
  }
});

// Update study material
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      type,
      provider,
      url,
      careerId,
      duration,
      thumbnail,
      region,
      language,
      rating,
      skillLevel,
      tags,
      description,
    } = req.body;

    await db.none(
      `UPDATE study_materials SET title = $1, type = $2, provider = $3, url = $4, career_id = $5,
       duration = $6, thumbnail = $7, region = $8, language = $9, rating = $10, skill_level = $11, tags = $12, description = $13
       WHERE id = $14`,
      [
        title,
        type,
        provider,
        url,
        careerId,
        duration,
        thumbnail,
        region,
        language,
        rating,
        skillLevel,
        tags,
        description,
        id,
      ]
    );

    res.json({
      id,
      title,
      type,
      provider,
      url,
      careerId,
      duration,
      thumbnail,
      region,
      language,
      rating,
      skillLevel,
      tags,
      description,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to update study material" });
  }
});

// Delete study material
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.none("DELETE FROM study_materials WHERE id = $1", [id]);
    res.json({ message: "Study material deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete study material" });
  }
});

export default router;

import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/database.js";
import { CareerPath, Milestone } from "../types/index.js";

const router = Router();

// Get all career paths
router.get("/", async (req, res) => {
  try {
    const careers = await db.manyOrNone<CareerPath>(
      "SELECT * FROM career_paths ORDER BY created_at DESC"
    );
    res.json(careers || []);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch careers" });
  }
});

// Get career path by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const career = await db.oneOrNone<CareerPath>(
      "SELECT * FROM career_paths WHERE id = $1",
      [id]
    );

    if (!career) {
      return res.status(404).json({ error: "Career not found" });
    }

    // Get milestones for this career
    const milestones = await db.manyOrNone<Milestone>(
      "SELECT * FROM milestones WHERE career_id = $1 ORDER BY sequence_order ASC",
      [id]
    );

    res.json({ ...career, milestones: milestones || [] });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch career" });
  }
});

// Create new career path
router.post("/", async (req, res) => {
  try {
    const {
      title,
      description,
      growth,
      category,
      subCategory,
      workType,
      tags,
    } = req.body;

    if (!title || !category) {
      return res
        .status(400)
        .json({ error: "Title and category are required" });
    }

    const id = uuidv4();
    await db.none(
      `INSERT INTO career_paths (id, title, description, growth, category, sub_category, work_type, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, title, description, growth || "medium", category, subCategory, workType || "Remote", tags]
    );

    res.status(201).json({
      id,
      title,
      description,
      growth: growth || "medium",
      category,
      subCategory,
      workType: workType || "Remote",
      tags,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to create career" });
  }
});

// Update career path
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      growth,
      category,
      subCategory,
      workType,
      tags,
    } = req.body;

    await db.none(
      `UPDATE career_paths SET title = $1, description = $2, growth = $3, category = $4, 
       sub_category = $5, work_type = $6, tags = $7 WHERE id = $8`,
      [title, description, growth, category, subCategory, workType, tags, id]
    );

    res.json({ id, title, description, growth, category, subCategory, workType, tags });
  } catch (error) {
    res.status(500).json({ error: "Failed to update career" });
  }
});

// Delete career path
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.none("DELETE FROM career_paths WHERE id = $1", [id]);
    res.json({ message: "Career deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete career" });
  }
});

// Get milestones for a career
router.get("/:careerId/milestones", async (req, res) => {
  try {
    const { careerId } = req.params;
    const milestones = await db.manyOrNone<Milestone>(
      "SELECT * FROM milestones WHERE career_id = $1 ORDER BY sequence_order ASC",
      [careerId]
    );
    res.json(milestones || []);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch milestones" });
  }
});

// Create milestone
router.post("/:careerId/milestones", async (req, res) => {
  try {
    const { careerId } = req.params;
    const { ageRange, title, description, requirements, sequenceOrder } =
      req.body;

    if (!title || !careerId) {
      return res
        .status(400)
        .json({ error: "Title and career ID are required" });
    }

    const id = uuidv4();
    await db.none(
      `INSERT INTO milestones (id, career_id, age_range, title, description, requirements, sequence_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, careerId, ageRange, title, description, JSON.stringify(requirements || []), sequenceOrder || 0]
    );

    res.status(201).json({
      id,
      careerId,
      ageRange,
      title,
      description,
      requirements: requirements || [],
      sequenceOrder: sequenceOrder || 0,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to create milestone" });
  }
});

// Delete milestone
router.delete("/milestones/:milestoneId", async (req, res) => {
  try {
    const { milestoneId } = req.params;
    await db.none("DELETE FROM milestones WHERE id = $1", [milestoneId]);
    res.json({ message: "Milestone deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete milestone" });
  }
});

/**
 * GET /api/careers/top
 * Returns the cached top global careers (with milestones) if not expired.
 * Cache TTL: 24 hours — AI is only called when cache is stale/empty.
 */
router.get("/top", async (req, res) => {
  try {
    const careers = await db.manyOrNone<CareerPath>(
      `SELECT id, title, description, growth, category,
              sub_category AS "subCategory",
              work_type    AS "workType",
              tags,
              created_at
       FROM career_paths
       WHERE is_top_global = true
         AND (expires_at IS NULL OR expires_at > NOW())
       ORDER BY created_at DESC
       LIMIT 10`
    );

    if (!careers || careers.length < 10) {
      return res.json({ source: "not-cached", data: [] });
    }

    // Attach milestones to each career
    const withMilestones = await Promise.all(
      careers.map(async (career) => {
        const milestones = await db.manyOrNone(
          `SELECT age_range AS "ageRange", title, description, requirements, sequence_order AS "sequenceOrder"
           FROM milestones WHERE career_id = $1 ORDER BY sequence_order ASC`,
          [career.id]
        );
        return {
          id: career.id,
          title: career.title,
          description: career.description,
          growth: career.growth,
          category: career.category,
          subCategory: career.subCategory,
          workType: career.workType,
          tags: career.tags ? JSON.parse(career.tags as unknown as string) : [],
          milestones: milestones.map((m) => ({
            ...m,
            requirements: m.requirements
              ? JSON.parse(m.requirements)
              : [],
          })),
        };
      })
    );

    return res.json({ source: "cache", data: withMilestones });
  } catch (error) {
    console.error("Error fetching top careers:", error);
    res.status(500).json({ error: "Failed to fetch top careers" });
  }
});

/**
 * POST /api/careers/bulk
 * Bulk-save AI-generated top global careers with their milestones.
 * Marks each record as is_top_global=true with a 24-hour TTL.
 * Safe to call repeatedly — upserts on title.
 */
router.post("/bulk", async (req, res) => {
  try {
    const { careers } = req.body as { careers: any[] };

    if (!Array.isArray(careers) || careers.length === 0) {
      return res.status(400).json({ error: "careers array is required" });
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 h TTL
    let savedCount = 0;

    for (const career of careers) {
      if (!career.title || !career.category) continue;

      // Upsert career_path row (match on title to avoid duplicates across refreshes)
      const row = await db.oneOrNone<{ id: string }>(
        `INSERT INTO career_paths
           (id, title, description, growth, category, sub_category, work_type, tags,
            is_top_global, cached_at, expires_at)
         VALUES
           (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, true, NOW(), $8)
         ON CONFLICT (title) DO UPDATE SET
           description  = EXCLUDED.description,
           growth       = EXCLUDED.growth,
           category     = EXCLUDED.category,
           sub_category = EXCLUDED.sub_category,
           work_type    = EXCLUDED.work_type,
           tags         = EXCLUDED.tags,
           is_top_global = true,
           cached_at    = NOW(),
           expires_at   = EXCLUDED.expires_at,
           updated_at   = NOW()
         RETURNING id`,
        [
          career.title,
          career.description || "",
          career.growth || "high",
          career.category || "Technology & Digital",
          career.subCategory || career.sub_category || "",
          career.workType || career.work_type || "Remote",
          JSON.stringify(career.tags || []),
          expiresAt,
        ]
      );

      if (!row) continue;
      const careerId = row.id;

      // Replace milestones for this career
      await db.none("DELETE FROM milestones WHERE career_id = $1", [careerId]);

      if (Array.isArray(career.milestones)) {
        for (let i = 0; i < career.milestones.length; i++) {
          const m = career.milestones[i];
          await db.none(
            `INSERT INTO milestones
               (id, career_id, age_range, title, description, requirements, sequence_order)
             VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6)`,
            [
              careerId,
              m.ageRange || m.age_range || "",
              m.title || "",
              m.description || "",
              JSON.stringify(m.requirements || []),
              i,
            ]
          );
        }
      }

      savedCount++;
    }

    res.json({
      success: true,
      saved: savedCount,
      message: `Cached ${savedCount} top global careers (TTL: 24h)`,
    });
  } catch (error) {
    console.error("Error bulk-saving careers:", error);
    res.status(500).json({ error: "Failed to bulk-save careers" });
  }
});

export default router;

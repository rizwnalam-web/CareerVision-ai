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

export default router;

import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/database.js";
import { Institution } from "../types/index.js";

const router = Router();

// Get all institutions
router.get("/", async (req, res) => {
  try {
    const { country, city, type } = req.query;
    let query = "SELECT * FROM institutions WHERE 1=1";
    const params = [];

    if (country) {
      query += ` AND country = $${params.length + 1}`;
      params.push(country);
    }
    if (city) {
      query += ` AND city = $${params.length + 1}`;
      params.push(city);
    }
    if (type) {
      query += ` AND type = $${params.length + 1}`;
      params.push(type);
    }

    query += " ORDER BY ranking ASC NULLS LAST";
    const institutions = await db.manyOrNone<Institution>(query, params);
    res.json(institutions || []);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch institutions" });
  }
});

// Get institution by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const institution = await db.oneOrNone<Institution>(
      "SELECT * FROM institutions WHERE id = $1",
      [id]
    );

    if (!institution) {
      return res.status(404).json({ error: "Institution not found" });
    }

    res.json(institution);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch institution" });
  }
});

// Create new institution
router.post("/", async (req, res) => {
  try {
    const {
      name,
      location,
      city,
      country,
      type,
      avgCost,
      programs,
      ranking,
      image,
      applicationDeadline,
      website,
      allowsInternationalStudents,
      visaSupport,
      latitude,
      longitude,
      costOfLivingIndex,
    } = req.body;

    if (!name || !country) {
      return res.status(400).json({ error: "Name and country are required" });
    }

    const id = uuidv4();
    await db.none(
      `INSERT INTO institutions 
       (id, name, location, city, country, type, avg_cost, programs, ranking, image, 
        application_deadline, website, allows_international_students, visa_support, latitude, longitude, cost_of_living_index)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
      [
        id,
        name,
        location || null,
        city || null,
        country,
        type || null,
        avgCost || 0,
        JSON.stringify(programs || []),
        ranking || null,
        image || null,
        applicationDeadline || null,
        website || null,
        allowsInternationalStudents !== false,
        visaSupport || "None",
        latitude || null,
        longitude || null,
        costOfLivingIndex || 1.0,
      ]
    );

    res.status(201).json({
      id,
      name,
      location,
      city,
      country,
      type,
      avgCost,
      programs,
      ranking,
      image,
      applicationDeadline,
      website,
      allowsInternationalStudents,
      visaSupport,
      latitude,
      longitude,
      costOfLivingIndex,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to create institution" });
  }
});

// Update institution
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      location,
      city,
      country,
      type,
      avgCost,
      programs,
      ranking,
      image,
      applicationDeadline,
      website,
      allowsInternationalStudents,
      visaSupport,
      latitude,
      longitude,
      costOfLivingIndex,
    } = req.body;

    await db.none(
      `UPDATE institutions SET name = $1, location = $2, city = $3, country = $4, type = $5,
       avg_cost = $6, programs = $7, ranking = $8, image = $9, application_deadline = $10,
       website = $11, allows_international_students = $12, visa_support = $13, 
       latitude = $14, longitude = $15, cost_of_living_index = $16 WHERE id = $17`,
      [
        name,
        location,
        city,
        country,
        type,
        avgCost,
        JSON.stringify(programs || []),
        ranking,
        image,
        applicationDeadline,
        website,
        allowsInternationalStudents,
        visaSupport,
        latitude,
        longitude,
        costOfLivingIndex,
        id,
      ]
    );

    res.json({
      id,
      name,
      location,
      city,
      country,
      type,
      avgCost,
      programs,
      ranking,
      image,
      applicationDeadline,
      website,
      allowsInternationalStudents,
      visaSupport,
      latitude,
      longitude,
      costOfLivingIndex,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to update institution" });
  }
});

// Delete institution
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.none("DELETE FROM institutions WHERE id = $1", [id]);
    res.json({ message: "Institution deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete institution" });
  }
});

export default router;

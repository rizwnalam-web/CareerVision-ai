import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/database.js";
import { FundingOpportunity } from "../types/index.js";

const router = Router();

// Get all funding opportunities
router.get("/", async (req, res) => {
  try {
    const { category, type } = req.query;
    let query = "SELECT * FROM funding_opportunities WHERE deadline > CURRENT_DATE";
    const params = [];

    if (category) {
      query += ` AND category = $${params.length + 1}`;
      params.push(category);
    }
    if (type) {
      query += ` AND type = $${params.length + 1}`;
      params.push(type);
    }

    query += " ORDER BY deadline ASC";
    const opportunities = await db.manyOrNone<FundingOpportunity>(
      query,
      params
    );
    res.json(opportunities || []);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch funding opportunities" });
  }
});

// Get funding opportunity by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const opportunity = await db.oneOrNone<FundingOpportunity>(
      "SELECT * FROM funding_opportunities WHERE id = $1",
      [id]
    );

    if (!opportunity) {
      return res.status(404).json({ error: "Funding opportunity not found" });
    }

    res.json(opportunity);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch funding opportunity" });
  }
});

// Create new funding opportunity
router.post("/", async (req, res) => {
  try {
    const {
      name,
      provider,
      amount,
      deadline,
      eligibilityCriteria,
      description,
      category,
      type,
      terms,
    } = req.body;

    if (!name || !deadline) {
      return res.status(400).json({ error: "Name and deadline are required" });
    }

    const id = uuidv4();
    await db.none(
      `INSERT INTO funding_opportunities 
       (id, name, provider, amount, deadline, eligibility_criteria, description, category, type, terms)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        id,
        name,
        provider || null,
        amount || 0,
        deadline,
        JSON.stringify(eligibilityCriteria || []),
        description || null,
        category || "Merit",
        type || "Scholarship",
        terms || null,
      ]
    );

    res.status(201).json({
      id,
      name,
      provider,
      amount,
      deadline,
      eligibilityCriteria,
      description,
      category,
      type,
      terms,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to create funding opportunity" });
  }
});

// Update funding opportunity
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      provider,
      amount,
      deadline,
      eligibilityCriteria,
      description,
      category,
      type,
      terms,
    } = req.body;

    await db.none(
      `UPDATE funding_opportunities SET name = $1, provider = $2, amount = $3, deadline = $4,
       eligibility_criteria = $5, description = $6, category = $7, type = $8, terms = $9 WHERE id = $10`,
      [
        name,
        provider,
        amount,
        deadline,
        JSON.stringify(eligibilityCriteria || []),
        description,
        category,
        type,
        terms,
        id,
      ]
    );

    res.json({
      id,
      name,
      provider,
      amount,
      deadline,
      eligibilityCriteria,
      description,
      category,
      type,
      terms,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to update funding opportunity" });
  }
});

// Delete funding opportunity
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.none("DELETE FROM funding_opportunities WHERE id = $1", [id]);
    res.json({ message: "Funding opportunity deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete funding opportunity" });
  }
});

export default router;

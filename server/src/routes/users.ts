import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/database.js";
import { UserProfile } from "../types/index.js";

const router = Router();

// Get all users
router.get("/", async (req, res) => {
  try {
    const users = await db.manyOrNone<UserProfile>(
      "SELECT * FROM users ORDER BY created_at DESC"
    );
    res.json(users || []);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Get user by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await db.oneOrNone<UserProfile>(
      "SELECT * FROM users WHERE id = $1",
      [id]
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// Get user by Firebase UID
router.get("/firebase/:firebaseUid", async (req, res) => {
  try {
    const { firebaseUid } = req.params;
    const user = await db.oneOrNone<UserProfile>(
      "SELECT * FROM users WHERE firebase_uid = $1",
      [firebaseUid]
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// Create new user
router.post("/", async (req, res) => {
  try {
    const {
      firebaseUid,
      email,
      name,
      age,
      education,
      interests,
      budget,
      country,
      targetLocation,
      targetCareerId,
      gpa,
      achievements,
      annualIncome,
      currentSavings,
    } = req.body;

    if (!email || !name) {
      return res.status(400).json({ error: "Email and name are required" });
    }

    // Check if user already exists
    const existing = await db.oneOrNone(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );
    if (existing) {
      return res.status(400).json({ error: "User with this email already exists" });
    }

    const id = uuidv4();
    await db.none(
      `INSERT INTO users 
       (id, firebase_uid, email, name, age, education, interests, budget, country, target_location, 
        target_career_id, gpa, achievements, annual_income, current_savings)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        id,
        firebaseUid || null,
        email,
        name,
        age || null,
        education || null,
        interests || null,
        budget || null,
        country || null,
        targetLocation || null,
        targetCareerId || null,
        gpa || null,
        achievements || null,
        annualIncome || null,
        currentSavings || null,
      ]
    );

    res.status(201).json({
      id,
      firebaseUid,
      email,
      name,
      age,
      education,
      interests,
      budget,
      country,
      targetLocation,
      targetCareerId,
      gpa,
      achievements,
      annualIncome,
      currentSavings,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to create user" });
  }
});

// Update user
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      email,
      name,
      age,
      education,
      interests,
      budget,
      country,
      targetLocation,
      targetCareerId,
      gpa,
      achievements,
      annualIncome,
      currentSavings,
    } = req.body;

    await db.none(
      `UPDATE users SET email = $1, name = $2, age = $3, education = $4, interests = $5, 
       budget = $6, country = $7, target_location = $8, target_career_id = $9, gpa = $10,
       achievements = $11, annual_income = $12, current_savings = $13 WHERE id = $14`,
      [
        email,
        name,
        age,
        education,
        interests,
        budget,
        country,
        targetLocation,
        targetCareerId,
        gpa,
        achievements,
        annualIncome,
        currentSavings,
        id,
      ]
    );

    res.json({
      id,
      email,
      name,
      age,
      education,
      interests,
      budget,
      country,
      targetLocation,
      targetCareerId,
      gpa,
      achievements,
      annualIncome,
      currentSavings,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to update user" });
  }
});

// Delete user
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.none("DELETE FROM users WHERE id = $1", [id]);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete user" });
  }
});

export default router;

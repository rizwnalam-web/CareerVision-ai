import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import bcryptjs from "bcryptjs";
import { db } from "../db/database.js";
import { UserProfile, RegistrationRequest, LoginRequest, PasswordResetRequest, PasswordResetTokenRequest, AuthResponse } from "../types/index.js";

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

// Register new user with email and password
router.post("/auth/register", async (req, res) => {
  try {
    const { email, name, password, age, country, interests, budget, education, targetLocation, gpa, targetVisaType }: RegistrationRequest & { targetLocation?: string; gpa?: number; targetVisaType?: string } = req.body;

    console.log("Registration request:", { email, name, passwordProvided: !!password });

    // Validation
    if (!email || !name || !password) {
      return res.status(400).json({ 
        success: false,
        error: "Email, name, and password are required" 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false,
        error: "Password must be at least 6 characters" 
      });
    }

    // Check if user already exists
    const existing = await db.oneOrNone(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );
    if (existing) {
      return res.status(400).json({ 
        success: false,
        error: "User with this email already exists" 
      });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcryptjs.hash(password, saltRounds);
    console.log("Password hashed successfully:", !!passwordHash);

    // Create user
    const id = uuidv4();
    console.log("Inserting user with password hash...");
    try {
      await db.none(
        `INSERT INTO users 
         (id, email, name, password_hash, age, country, target_location, interests, budget, education, gpa, registration_method)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          id,
          email,
          name,
          passwordHash,
          age || null,
          country || null,
          targetLocation || null,
          interests ? JSON.stringify(interests) : null,
          budget || null,
          education || null,
          gpa || null,
          "email"
        ]
      );
      console.log("User inserted successfully");
      
      // Verify the password was stored
      const verifyUser = await db.oneOrNone<any>(
        "SELECT id, email, password_hash FROM users WHERE id = $1",
        [id]
      );
      console.log("Verification - Password stored:", !!verifyUser?.password_hash, "Hash length:", verifyUser?.password_hash?.length || 0);
    } catch (dbError) {
      console.error("Database insert error:", dbError);
      throw dbError;
    }

    const user: UserProfile = {
      id,
      email,
      name,
      age,
      country,
      targetLocation,
      interests: interests ? JSON.stringify(interests) : undefined,
      budget,
      education,
      gpa,
      registrationMethod: "email",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to register user" 
    });
  }
});

// Login user with email and password
router.post("/auth/login", async (req, res) => {
  try {
    const { email, password }: LoginRequest = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        error: "Email and password are required" 
      });
    }

    // Find user - select password_hash explicitly with alias to ensure it's returned
    const user = await db.oneOrNone<any>(
      "SELECT *, password_hash as \"passwordHash\", registration_method as \"registrationMethod\" FROM users WHERE email = $1",
      [email]
    );

    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: "Invalid email or password" 
      });
    }

    // Check password
    if (!user.passwordHash) {
      return res.status(401).json({ 
        success: false,
        error: "This account was not registered with email/password" 
      });
    }

    const passwordMatch = await bcryptjs.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ 
        success: false,
        error: "Invalid email or password" 
      });
    }

    // Remove password hash from response and normalize to camelCase
    const { passwordHash, password_hash, registration_method, registrationMethod, firebase_uid, target_location, target_career_id, annual_income, current_savings, created_at, updated_at, ...rest } = user;

    res.json({
      success: true,
      message: "Login successful",
      user: {
        ...rest,
        uid: firebase_uid || undefined,
        registrationMethod: registrationMethod || registration_method,
        createdAt: created_at,
        updatedAt: updated_at
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to login" 
    });
  }
});

function normalizeResetToken(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .trim()
    .replace(/^["'{}\[\]\s]+|["'{}\[\]\s]+$/g, "")
    .toLowerCase();
}

// Request password reset token for an email-authenticated user
router.post("/auth/password/forgot", async (req, res) => {
  try {
    const { email }: PasswordResetRequest = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required"
      });
    }

    const user = await db.oneOrNone<any>(
      "SELECT id, registration_method FROM users WHERE email = $1",
      [email]
    );

    if (!user || user.registration_method !== "email") {
      return res.json({
        success: true,
        message: "If an account exists for that email, a password reset token has been generated."
      });
    }

    const token = uuidv4().toLowerCase();

    await db.none(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at, used)
       VALUES ($1, $2, NOW() + INTERVAL '1 hour', false)`,
      [user.id, token]
    );

    const response: any = {
      success: true,
      message: "Password reset token created. Use the token to reset your password."
    };

    if (process.env.NODE_ENV !== "production") {
      response.token = token;
    }

    res.json(response);
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to request password reset"
    });
  }
});

// Reset password using a valid reset token
router.post("/auth/password/reset", async (req, res) => {
  try {
    const { token, password }: PasswordResetTokenRequest = req.body;
    const trimmedToken = typeof token === "string" ? token.trim() : "";

    if (!trimmedToken || !password) {
      return res.status(400).json({
        success: false,
        error: "Reset token and new password are required"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters"
      });
    }

    const normalizedToken = normalizeResetToken(trimmedToken);
    const resetRecord = await db.oneOrNone<any>(
      `SELECT id, user_id FROM password_reset_tokens
       WHERE LOWER(token) = LOWER($1) AND used = false AND expires_at > NOW()`,
      [normalizedToken]
    );

    if (!resetRecord) {
      return res.status(400).json({
        success: false,
        error: "Invalid or expired reset token"
      });
    }

    const user = await db.oneOrNone<any>(
      "SELECT id FROM users WHERE id = $1",
      [resetRecord.user_id]
    );

    if (!user) {
      return res.status(400).json({
        success: false,
        error: "Invalid reset token"
      });
    }

    const saltRounds = 10;
    const passwordHash = await bcryptjs.hash(password, saltRounds);

    await db.tx(async (t) => {
      await t.none(
        "UPDATE users SET password_hash = $1 WHERE id = $2",
        [passwordHash, user.id]
      );
      await t.none(
        "UPDATE password_reset_tokens SET used = true WHERE id = $1",
        [resetRecord.id]
      );
    });

    res.json({
      success: true,
      message: "Password has been reset successfully. You can now sign in with your new password."
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to reset password"
    });
  }
});

export default router;

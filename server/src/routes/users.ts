import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import bcryptjs from "bcryptjs";
import { Resend } from "resend";
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

    // Helper: treat empty strings as null for strict DB column types
    const uuid = (v: any) => (v && typeof v === 'string' && v.trim() !== '' ? v.trim() : null);
    const num = (v: any) => (v !== undefined && v !== null && v !== '' ? Number(v) : null);
    const str = (v: any) => (v !== undefined && v !== null && v !== '' ? String(v) : null);
    const interestsJson = Array.isArray(interests) && interests.length > 0
      ? JSON.stringify(interests)
      : interests !== undefined ? null : null;

    // Use COALESCE so omitted/null fields keep their existing DB value
    await db.none(
      `UPDATE users SET
        name = COALESCE($1, name),
        age = COALESCE($2, age),
        education = COALESCE($3, education),
        interests = COALESCE($4, interests),
        budget = COALESCE($5, budget),
        country = COALESCE($6, country),
        target_location = COALESCE($7, target_location),
        target_career_id = COALESCE($8::uuid, target_career_id),
        gpa = COALESCE($9, gpa),
        achievements = COALESCE($10, achievements),
        annual_income = COALESCE($11, annual_income),
        current_savings = COALESCE($12, current_savings)
       WHERE id = $13`,
      [
        str(name),
        num(age),
        str(education),
        interestsJson,
        num(budget),
        str(country),
        str(targetLocation),
        uuid(targetCareerId),
        num(gpa),
        str(achievements),
        num(annualIncome),
        num(currentSavings),
        id,
      ]
    );

    // Return the full updated row with camelCase keys
    const updated = await db.oneOrNone('SELECT * FROM users WHERE id = $1', [id]);
    if (!updated) return res.status(404).json({ error: 'User not found' });
    const { password_hash: _ph, firebase_uid: _fu, target_location: _tl, target_career_id: _tc, annual_income: _ai, current_savings: _cs, created_at: _ca, updated_at: _ua, ...updatedRest } = updated;
    res.json({
      success: true,
      user: {
        ...updatedRest,
        targetLocation: _tl || null,
        targetCareerId: _tc || null,
        annualIncome: _ai || null,
        currentSavings: _cs || null,
        createdAt: _ca,
        updatedAt: _ua,
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
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
        targetLocation: target_location || null,
        targetCareerId: target_career_id || null,
        annualIncome: annual_income || null,
        currentSavings: current_savings || null,
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

    // Send the reset token via email using Resend (HTTPS — not blocked by firewalls)
    const resendApiKey = process.env.RESEND_API_KEY;
    let emailSent = false;
    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        const fromAddress = process.env.RESEND_FROM || "CareerVision AI <onboarding@resend.dev>";
        const { data, error } = await resend.emails.send({
          from: fromAddress,
          to: email,
          subject: "Your CareerVision Password Reset Token",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 32px; border-radius: 12px;">
              <div style="background: #1e293b; padding: 24px; border-radius: 10px; margin-bottom: 24px;">
                <h2 style="color: white; margin: 0; font-size: 20px;">Reset Your Password</h2>
                <p style="color: #94a3b8; margin: 6px 0 0; font-size: 13px;">CareerVision AI</p>
              </div>
              <p style="color: #64748b; font-size: 14px; margin-bottom: 24px;">Use the token below to reset your password. It expires in <strong style="color: #1e293b;">1 hour</strong>.</p>
              <div style="background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin-bottom: 24px; text-align: center;">
                <p style="font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: 700; margin: 0 0 12px;">Reset Token</p>
                <code style="font-size: 15px; color: #4f46e5; font-family: monospace; font-weight: bold; word-break: break-all;">${token}</code>
              </div>
              <p style="color: #64748b; font-size: 13px; line-height: 1.6;">Copy this token, return to the app, and paste it into the Reset Password form along with your new password.</p>
              <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">If you did not request a password reset, you can safely ignore this email.</p>
            </div>
          `
        });
        if (error) {
          console.error("[ForgotPassword] Resend error:", error);
        } else {
          emailSent = true;
          console.log(`[ForgotPassword] Reset token emailed to ${email}, id: ${data?.id}`);
        }
      } catch (emailError) {
        console.error("[ForgotPassword] Failed to send password reset email:", emailError);
      }
    } else {
      console.warn("[ForgotPassword] RESEND_API_KEY not set — reset token not emailed.");
    }

    const response: any = {
      success: true,
      message: emailSent
        ? "A password reset token has been sent to your email. Please check your inbox."
        : "If an account exists for that email, a password reset token has been generated."
    };

    // In development, always include the token so the flow can be tested
    // even when email delivery is unavailable (e.g. sandbox sender restrictions)
    if (process.env.NODE_ENV !== "production") {
      response.token = token;
      if (!emailSent) {
        response.devNote = "Email delivery unavailable in this environment. Token returned for development use only.";
      }
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

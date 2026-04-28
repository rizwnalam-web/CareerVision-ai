import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/database.js";
import {
  InterviewQuestion,
  InterviewSession,
  InterviewFeedback,
} from "../types/index.js";

const router = Router();

// ===== Interview Questions =====

// Get all interview questions
router.get("/questions", async (req, res) => {
  try {
    const { tier, category, company } = req.query;
    let query = "SELECT * FROM interview_questions WHERE 1=1";
    const params = [];

    if (tier) {
      query += ` AND tier = $${params.length + 1}`;
      params.push(tier);
    }
    if (category) {
      query += ` AND category = $${params.length + 1}`;
      params.push(category);
    }
    if (company) {
      query += ` AND company = $${params.length + 1}`;
      params.push(company);
    }

    query += " ORDER BY created_at DESC";
    const questions = await db.manyOrNone<InterviewQuestion>(query, params);
    res.json(questions || []);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch interview questions" });
  }
});

// Get question by ID
router.get("/questions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const question = await db.oneOrNone<InterviewQuestion>(
      "SELECT * FROM interview_questions WHERE id = $1",
      [id]
    );

    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    res.json(question);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch question" });
  }
});

// Create interview question
router.post("/questions", async (req, res) => {
  try {
    const { text, tier, category, company, tips, targetKeywords } = req.body;

    if (!text || !tier) {
      return res.status(400).json({ error: "Text and tier are required" });
    }

    const id = uuidv4();
    await db.none(
      `INSERT INTO interview_questions (id, text, tier, category, company, tips, target_keywords)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        id,
        text,
        tier,
        category || null,
        company || null,
        JSON.stringify(tips || []),
        JSON.stringify(targetKeywords || []),
      ]
    );

    res.status(201).json({
      id,
      text,
      tier,
      category,
      company,
      tips,
      targetKeywords,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to create question" });
  }
});

// ===== Interview Sessions =====

// Get all sessions for a user
router.get("/sessions/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const sessions = await db.manyOrNone<InterviewSession>(
      "SELECT * FROM interview_sessions WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );

    res.json(sessions || []);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
});

// Get session by ID with feedbacks
router.get("/sessions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const session = await db.oneOrNone<InterviewSession>(
      "SELECT * FROM interview_sessions WHERE id = $1",
      [id]
    );

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const feedbacks = await db.manyOrNone<InterviewFeedback>(
      "SELECT * FROM interview_feedbacks WHERE session_id = $1 ORDER BY created_at ASC",
      [id]
    );

    res.json({ ...session, feedbacks: feedbacks || [] });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch session" });
  }
});

// Create interview session
router.post("/sessions", async (req, res) => {
  try {
    const { userId, role, company, totalScore, sessionData } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const id = uuidv4();
    await db.none(
      `INSERT INTO interview_sessions (id, user_id, role, company, total_score, session_data)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, userId, role || null, company || null, totalScore || 0, JSON.stringify(sessionData || {})]
    );

    res.status(201).json({
      id,
      userId,
      role,
      company,
      totalScore,
      sessionData,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to create session" });
  }
});

// Update session
router.put("/sessions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { totalScore, sessionData } = req.body;

    await db.none(
      `UPDATE interview_sessions SET total_score = $1, session_data = $2 WHERE id = $3`,
      [totalScore, JSON.stringify(sessionData || {}), id]
    );

    res.json({
      id,
      totalScore,
      sessionData,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to update session" });
  }
});

// ===== Interview Feedbacks =====

// Create feedback for a session
router.post("/feedbacks", async (req, res) => {
  try {
    const {
      sessionId,
      questionId,
      answerText,
      starScore,
      confidenceScore,
      sentiment,
    } = req.body;

    if (!sessionId || !questionId) {
      return res
        .status(400)
        .json({ error: "Session ID and question ID are required" });
    }

    const id = uuidv4();
    await db.none(
      `INSERT INTO interview_feedbacks (id, session_id, question_id, answer_text, star_score, confidence_score, sentiment)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        id,
        sessionId,
        questionId,
        answerText || null,
        starScore || 0,
        confidenceScore || 0,
        sentiment || "Neutral",
      ]
    );

    res.status(201).json({
      id,
      sessionId,
      questionId,
      answerText,
      starScore,
      confidenceScore,
      sentiment,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to create feedback" });
  }
});

// Get feedback by ID
router.get("/feedbacks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const feedback = await db.oneOrNone<InterviewFeedback>(
      "SELECT * FROM interview_feedbacks WHERE id = $1",
      [id]
    );

    if (!feedback) {
      return res.status(404).json({ error: "Feedback not found" });
    }

    res.json(feedback);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch feedback" });
  }
});

// Update feedback
router.put("/feedbacks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { answerText, starScore, confidenceScore, sentiment } = req.body;

    await db.none(
      `UPDATE interview_feedbacks SET answer_text = $1, star_score = $2, confidence_score = $3, sentiment = $4 WHERE id = $5`,
      [answerText, starScore, confidenceScore, sentiment, id]
    );

    res.json({
      id,
      answerText,
      starScore,
      confidenceScore,
      sentiment,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to update feedback" });
  }
});

export default router;

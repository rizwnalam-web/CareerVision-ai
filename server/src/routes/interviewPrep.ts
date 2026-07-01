import { Router, Request, Response } from "express";
import { db } from "../db/database.js";
import crypto from "crypto";
import {
  generateQuestionBank,
  evaluateAnswer,
  generateSessionFeedback,
  analyseVideoTranscript,
  generateMockFromJD,
  evaluateSTARResponse,
  type PrepQuestion,
  type AnswerScore,
} from "../services/interviewPrepService.js";

const router = Router();

function normaliseUser(raw: unknown): string | null {
  if (!raw || typeof raw !== "string") return null;
  const t = raw.trim();
  return !t || t === "undefined" || t === "null" ? null : t;
}

function randomRoomCode(): string {
  return crypto.randomBytes(3).toString("hex").toUpperCase(); // e.g. "A3F7B2"
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/interview-prep/questions
// Fetch from question_bank with filters; auto-generate if empty
// ─────────────────────────────────────────────────────────────────────────────

router.get("/questions", async (req: Request, res: Response) => {
  try {
    const { type, difficulty, industry, role = "Software Engineer", limit = "20" } = req.query as Record<string, string>;
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (type && type !== "mixed") { params.push(type); conditions.push(`type = $${params.length}`); }
    if (difficulty) { params.push(difficulty); conditions.push(`difficulty = $${params.length}`); }
    if (industry) { params.push(industry); conditions.push(`industry ILIKE $${params.length}`); }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    params.push(parseInt(limit, 10));

    const rows = await db.manyOrNone(
      `SELECT * FROM question_bank ${where} ORDER BY RANDOM() LIMIT $${params.length}`,
      params
    );

    if (rows.length === 0) {
      // Return empty — use POST /questions/generate to seed the bank explicitly
      return res.json({ success: true, questions: [], generated: false });
    }

    // Map snake_case → camelCase
    const questions = rows.map(r => ({
      id: r.id, text: r.text, type: r.type, difficulty: r.difficulty,
      industry: r.industry, category: r.category, subCategory: r.sub_category,
      hints: r.hints || [], expectedKeywords: r.expected_keywords || [],
      sampleAnswer: r.sample_answer, followUps: r.follow_ups || [],
    }));
    res.json({ success: true, questions, generated: false });
  } catch (err) {
    console.error("[interview-prep/questions]", err);
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/interview-prep/questions/generate
// Force-generate a fresh question batch for given industry/role/type
// ─────────────────────────────────────────────────────────────────────────────

router.post("/questions/generate", async (req: Request, res: Response) => {
  try {
    const { industry = "general", role = "Software Engineer", type = "mixed", count = 5 } = req.body;
    const questions = await generateQuestionBank(industry, role, type, count);

    const saved: PrepQuestion[] = [];
    for (const q of questions) {
      try {
        // oneOrNone avoids the "No data returned" error when ON CONFLICT skips
        const row = await db.oneOrNone(
          `INSERT INTO question_bank
             (text, type, difficulty, industry, category, sub_category,
              hints, expected_keywords, sample_answer, follow_ups, created_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'ai')
           ON CONFLICT DO NOTHING
           RETURNING id`,
          [q.text, q.type, q.difficulty, q.industry, q.category,
           q.subCategory || null, q.hints, q.expectedKeywords,
           q.sampleAnswer || null, q.followUps]
        );
        saved.push({ ...q, id: row?.id ?? q.id });
      } catch { saved.push(q); }
    }
    res.json({ success: true, questions: saved });
  } catch (err: any) {
    console.error("[interview-prep/generate]", err);
    res.status(500).json({ error: err?.message ?? "Failed to generate questions" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/interview-prep/sessions
// Start a new prep session
// ─────────────────────────────────────────────────────────────────────────────

router.post("/sessions", async (req: Request, res: Response) => {
  try {
    const { userId, sessionType = "behavioral", industry = "general", role = "Software Engineer", company, questionIds = [] } = req.body;
    const userIdentifier = normaliseUser(userId);
    if (!userIdentifier) return res.status(400).json({ error: "userId is required" });

    const session = await db.one(
      `INSERT INTO interview_prep_sessions
         (user_identifier, session_type, industry, role, company, question_ids, status)
       VALUES ($1,$2,$3,$4,$5,$6,'active')
       RETURNING id, created_at AS "createdAt"`,
      [userIdentifier, sessionType, industry, role, company || null, questionIds]
    );
    res.status(201).json({ success: true, sessionId: session.id, createdAt: session.createdAt });
  } catch (err) {
    console.error("[interview-prep/sessions POST]", err);
    res.status(500).json({ error: "Failed to create session" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/interview-prep/sessions/:userId
// Get past sessions for a user
// ─────────────────────────────────────────────────────────────────────────────

router.get("/sessions/:userId", async (req: Request, res: Response) => {
  try {
    const userIdentifier = normaliseUser(req.params.userId);
    if (!userIdentifier) return res.status(400).json({ error: "userId is required" });

    const rows = await db.manyOrNone(
      `SELECT
         id, session_type AS "sessionType", industry, role, company,
         overall_score AS "overallScore", status,
         duration_seconds AS "durationSeconds",
         created_at AS "createdAt", completed_at AS "completedAt",
         session_feedback AS "sessionFeedback"
       FROM interview_prep_sessions
       WHERE user_identifier = $1
       ORDER BY created_at DESC LIMIT 20`,
      [userIdentifier]
    );
    res.json({ success: true, sessions: rows || [] });
  } catch (err) {
    console.error("[interview-prep/sessions GET]", err);
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/interview-prep/evaluate
// Evaluate a single answer transcript
// Body: { question, transcript, durationSeconds }
// ─────────────────────────────────────────────────────────────────────────────

router.post("/evaluate", async (req: Request, res: Response) => {
  try {
    const { question, transcript, durationSeconds = 0 } = req.body as {
      question: PrepQuestion; transcript: string; durationSeconds?: number;
    };
    if (!question || !transcript?.trim()) {
      return res.status(400).json({ error: "question and transcript are required" });
    }

    const score = await evaluateAnswer(question, transcript, durationSeconds);
    res.json({ success: true, score });
  } catch (err) {
    console.error("[interview-prep/evaluate]", err);
    res.status(500).json({ error: "Failed to evaluate answer" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/interview-prep/complete
// Complete a session: save all answers + generate overall feedback
// Body: { sessionId, answers: AnswerScore[], durationSeconds }
// ─────────────────────────────────────────────────────────────────────────────

router.post("/complete", async (req: Request, res: Response) => {
  try {
    const { sessionId, answers, durationSeconds = 0, role = "Software Engineer", industry = "general" } = req.body as {
      sessionId: string; answers: AnswerScore[]; durationSeconds?: number;
      role?: string; industry?: string;
    };
    if (!sessionId || !answers?.length) {
      return res.status(400).json({ error: "sessionId and answers are required" });
    }

    const feedback = await generateSessionFeedback(role, industry, answers);

    await db.none(
      `UPDATE interview_prep_sessions SET
         answers = $1, overall_score = $2, session_feedback = $3,
         duration_seconds = $4, status = 'completed', completed_at = NOW()
       WHERE id = $5`,
      [JSON.stringify(answers), feedback.overallScore, JSON.stringify(feedback), durationSeconds, sessionId]
    );

    res.json({ success: true, feedback });
  } catch (err) {
    console.error("[interview-prep/complete]", err);
    res.status(500).json({ error: "Failed to complete session" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/interview-prep/video-analysis
// Analyse a speech transcript from video recording
// Body: { transcript, durationSeconds, role }
// ─────────────────────────────────────────────────────────────────────────────

router.post("/video-analysis", async (req: Request, res: Response) => {
  try {
    const { transcript, durationSeconds = 0, role = "Software Engineer" } = req.body as {
      transcript: string; durationSeconds?: number; role?: string;
    };
    if (!transcript?.trim()) return res.status(400).json({ error: "transcript is required" });

    const analysis = await analyseVideoTranscript(transcript, durationSeconds, role);
    res.json({ success: true, analysis });
  } catch (err) {
    console.error("[interview-prep/video-analysis]", err);
    res.status(500).json({ error: "Failed to analyse video transcript" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/interview-prep/peer/create
// Create a peer practice room
// ─────────────────────────────────────────────────────────────────────────────

router.post("/peer/create", async (req: Request, res: Response) => {
  try {
    const { userId, role = "Software Engineer", industry = "general", sessionType = "behavioral", questionIds = [] } = req.body;
    const creatorId = normaliseUser(userId);
    if (!creatorId) return res.status(400).json({ error: "userId is required" });

    // Generate unique room code
    let roomCode = randomRoomCode();
    let attempts = 0;
    while (attempts < 5) {
      const existing = await db.oneOrNone("SELECT id FROM peer_review_sessions WHERE room_code = $1", [roomCode]);
      if (!existing) break;
      roomCode = randomRoomCode();
      attempts++;
    }

    const session = await db.one(
      `INSERT INTO peer_review_sessions
         (room_code, creator_id, role, industry, session_type, question_ids)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id, room_code AS "roomCode", expires_at AS "expiresAt", created_at AS "createdAt"`,
      [roomCode, creatorId, role, industry, sessionType, questionIds]
    );
    res.status(201).json({ success: true, session });
  } catch (err) {
    console.error("[interview-prep/peer/create]", err);
    res.status(500).json({ error: "Failed to create peer session" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/interview-prep/peer/:roomCode
// Join / look up a peer session by room code
// ─────────────────────────────────────────────────────────────────────────────

router.get("/peer/:roomCode", async (req: Request, res: Response) => {
  try {
    const { roomCode } = req.params;
    const session = await db.oneOrNone(
      `SELECT
         id, room_code AS "roomCode", creator_id AS "creatorId",
         participant_id AS "participantId", role, industry,
         session_type AS "sessionType", question_ids AS "questionIds",
         creator_review AS "creatorReview", participant_review AS "participantReview",
         status, expires_at AS "expiresAt", created_at AS "createdAt"
       FROM peer_review_sessions
       WHERE room_code = $1 AND expires_at > NOW()`,
      [roomCode.toUpperCase()]
    );
    if (!session) return res.status(404).json({ error: "Room not found or expired" });
    res.json({ success: true, session });
  } catch (err) {
    console.error("[interview-prep/peer GET]", err);
    res.status(500).json({ error: "Failed to fetch peer session" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/interview-prep/peer/:roomCode/review
// Submit a review for a peer session
// Body: { userId, review: object }
// ─────────────────────────────────────────────────────────────────────────────

router.put("/peer/:roomCode/review", async (req: Request, res: Response) => {
  try {
    const { roomCode } = req.params;
    const { userId, review } = req.body;
    const userIdentifier = normaliseUser(userId);
    if (!userIdentifier || !review) return res.status(400).json({ error: "userId and review are required" });

    const session = await db.oneOrNone(
      "SELECT * FROM peer_review_sessions WHERE room_code = $1",
      [roomCode.toUpperCase()]
    );
    if (!session) return res.status(404).json({ error: "Session not found" });

    const isCreator = session.creator_id === userIdentifier;
    const column = isCreator ? "creator_review" : "participant_review";

    // If participant joining for first time, record them
    if (!isCreator && !session.participant_id) {
      await db.none(
        "UPDATE peer_review_sessions SET participant_id = $1, status = 'active' WHERE room_code = $2",
        [userIdentifier, roomCode.toUpperCase()]
      );
    }

    await db.none(
      `UPDATE peer_review_sessions SET ${column} = $1, status = 'completed' WHERE room_code = $2`,
      [JSON.stringify(review), roomCode.toUpperCase()]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("[interview-prep/peer review]", err);
    res.status(500).json({ error: "Failed to submit review" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/interview-prep/peer/my/:userId
// Get all peer sessions created by or joined by user
// ─────────────────────────────────────────────────────────────────────────────

router.get("/peer/my/:userId", async (req: Request, res: Response) => {
  try {
    const userIdentifier = normaliseUser(req.params.userId);
    if (!userIdentifier) return res.status(400).json({ error: "userId is required" });

    const rows = await db.manyOrNone(
      `SELECT
         id, room_code AS "roomCode", creator_id AS "creatorId",
         participant_id AS "participantId", role, industry,
         session_type AS "sessionType", status,
         expires_at AS "expiresAt", created_at AS "createdAt"
       FROM peer_review_sessions
       WHERE creator_id = $1 OR participant_id = $1
       ORDER BY created_at DESC LIMIT 20`,
      [userIdentifier]
    );
    res.json({ success: true, sessions: rows || [] });
  } catch (err) {
    console.error("[interview-prep/peer/my]", err);
    res.status(500).json({ error: "Failed to fetch peer sessions" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/interview-prep/mock/generate — JD-targeted mock questions
// ─────────────────────────────────────────────────────────────────────────────

router.post("/mock/generate", async (req: Request, res: Response) => {
  try {
    const { jobDescription, role, company, count, focus } = req.body;
    if (!jobDescription || !role) {
      return res.status(400).json({ error: "jobDescription and role are required" });
    }

    const questions = await generateMockFromJD(
      jobDescription, role, company, count || 6, focus || "mixed"
    );
    res.json({ success: true, questions });
  } catch (err: any) {
    console.error("[interview-prep/mock/generate]", err);
    res.status(500).json({ error: err.message || "Failed to generate mock questions" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/interview-prep/mock/evaluate-star — STAR method evaluation
// ─────────────────────────────────────────────────────────────────────────────

router.post("/mock/evaluate-star", async (req: Request, res: Response) => {
  try {
    const { question, transcript, role, durationSeconds } = req.body;
    if (!question || !transcript || !role) {
      return res.status(400).json({ error: "question, transcript, and role are required" });
    }

    const feedback = await evaluateSTARResponse(
      question, transcript, role, durationSeconds || 60
    );
    res.json({ success: true, feedback });
  } catch (err: any) {
    console.error("[interview-prep/mock/evaluate-star]", err);
    res.status(500).json({ error: err.message || "STAR evaluation failed" });
  }
});

export default router;

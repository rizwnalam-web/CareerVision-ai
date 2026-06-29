import { generateDeepSeekResponse } from "./deepseekService.js";
import { jsonrepair } from "jsonrepair";

// ─────────────────────────────────────────────────────────────────────────────
// Shared types
// ─────────────────────────────────────────────────────────────────────────────

export interface PrepQuestion {
  id: string;
  text: string;
  type: "behavioral" | "technical" | "situational" | "culture";
  difficulty: "easy" | "medium" | "hard";
  industry: string;
  category: string;
  subCategory?: string;
  hints: string[];
  expectedKeywords: string[];
  sampleAnswer?: string;
  followUps: string[];
}

export interface AnswerScore {
  overall: number;      // 0-100
  clarity: number;      // 0-100
  relevance: number;    // 0-100
  structure: number;    // 0-100
  keywords: number;     // 0-100
  confidence: number;   // 0-100 (estimated from text signals)
  fillerWords: string[];
  strengths: string[];
  improvements: string[];
  suggestedAnswer: string;
  starBreakdown?: {     // for behavioral questions
    situation: number;
    task: number;
    action: number;
    result: number;
  };
}

export interface SessionFeedback {
  overallScore: number;
  summary: string;
  topStrengths: string[];
  topImprovements: string[];
  readinessLevel: "not_ready" | "developing" | "ready" | "exceptional";
  nextSteps: string[];
}

export interface VideoAnalysis {
  transcript: string;
  fillerWordCount: number;
  speakingPaceWpm: number;
  estimatedConfidence: number;
  keyThemes: string[];
  suggestions: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────────────────────

function extractJSON(raw: string | null | undefined): string {
  if (!raw) return "";
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1].trim() : (() => {
    const first = raw.indexOf("{") !== -1 ? raw.indexOf("{") : raw.indexOf("[");
    const last  = raw.lastIndexOf("}") !== -1 ? raw.lastIndexOf("}") : raw.lastIndexOf("]");
    return first !== -1 && last > first ? raw.slice(first, last + 1) : raw.trim();
  })();
  return jsonrepair(candidate);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Generate industry-specific question bank
// ─────────────────────────────────────────────────────────────────────────────

export async function generateQuestionBank(
  industry: string,
  role: string,
  type: "behavioral" | "technical" | "situational" | "culture" | "mixed",
  count = 5
): Promise<PrepQuestion[]> {
  // Cap at 6 to stay well within free-tier TPM limits
  const safeCount = Math.min(count, 6);

  const typeInstruction = type === "mixed"
    ? "Mix behavioral, technical, and situational questions."
    : `${type} questions only.`;

  const prompt = `Generate ${safeCount} interview questions for a ${role} in ${industry}. ${typeInstruction}

Return ONLY a JSON array (no markdown, no explanation):
[{"id":"q-1","text":"...","type":"behavioral","difficulty":"medium","industry":"${industry}","category":"Leadership","subCategory":"Communication","hints":["hint1","hint2"],"expectedKeywords":["keyword1","keyword2","keyword3"],"sampleAnswer":"Brief outline of ideal answer.","followUps":["Follow-up question?"]}]

Rules: vary difficulty (easy/medium/hard), make questions specific to ${industry} and ${role}, keep sampleAnswer under 30 words.`;

  const result = await generateDeepSeekResponse(prompt, { maxTokens: 2048, temperature: 0.6 });
  if (!result.text) {
    const reason = result.error ? `: ${result.error}` : " (all providers unavailable or rate-limited)";
    throw new Error(`LLM did not return a response${reason}`);
  }

  const raw = result.text;
  const firstBracket = raw.indexOf("[");
  const lastBracket  = raw.lastIndexOf("]");
  const json = firstBracket !== -1 && lastBracket > firstBracket
    ? raw.slice(firstBracket, lastBracket + 1)
    : extractJSON(raw);

  try {
    const parsed = JSON.parse(json) as PrepQuestion[];
    if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("Empty array");
    return parsed;
  } catch {
    console.error("[generateQuestionBank] JSON parse failed:", raw.slice(0, 500));
    throw new Error("LLM returned malformed JSON — please try again");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Evaluate a single answer (transcript → score + feedback)
// ─────────────────────────────────────────────────────────────────────────────

export async function evaluateAnswer(
  question: PrepQuestion,
  transcript: string,
  durationSeconds: number
): Promise<AnswerScore> {
  const wpm = Math.round((transcript.split(/\s+/).length / Math.max(durationSeconds, 1)) * 60);
  const isBehavioral = question.type === "behavioral" || question.type === "situational";

  const prompt = `You are an expert interview coach. Evaluate this interview answer objectively.

QUESTION: "${question.text}"
TYPE: ${question.type}
EXPECTED KEYWORDS: ${question.expectedKeywords.join(", ")}

CANDIDATE ANSWER (transcript):
"${transcript.slice(0, 3000)}"

METADATA:
- Speaking pace: ~${wpm} words per minute
- Duration: ${durationSeconds} seconds

Return ONLY raw JSON:
{
  "overall": <integer 0-100>,
  "clarity": <integer 0-100>,
  "relevance": <integer 0-100>,
  "structure": <integer 0-100>,
  "keywords": <integer 0-100, % of expected keywords covered>,
  "confidence": <integer 0-100, estimated from text signals like hedging language, assertive statements>,
  "fillerWords": ["um", "like", "uh"],
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1", "improvement 2"],
  "suggestedAnswer": "A more complete answer would include...",
  ${isBehavioral ? `"starBreakdown": { "situation": <0-25>, "task": <0-25>, "action": <0-25>, "result": <0-25> },` : ""}
}

Scoring rules:
- overall = weighted avg (clarity 25%, relevance 30%, structure 20%, keywords 25%)
- Be realistic — a 90+ score should be rare
- fillerWords: count actual filler words found in the transcript
- strengths: 2-3 specific things done well
- improvements: 2-3 specific, actionable suggestions
- suggestedAnswer: 2-3 sentences showing what an ideal answer would include`;

  const result = await generateDeepSeekResponse(prompt, { maxTokens: 2048 });
  if (!result.text) throw new Error("LLM did not return answer evaluation");

  try {
    return JSON.parse(extractJSON(result.text)) as AnswerScore;
  } catch {
    console.error("[evaluateAnswer] JSON parse failed");
    throw new Error("Could not parse answer evaluation response");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Session-level feedback (after all answers)
// ─────────────────────────────────────────────────────────────────────────────

export async function generateSessionFeedback(
  role: string,
  industry: string,
  scores: AnswerScore[]
): Promise<SessionFeedback> {
  const avgScore = Math.round(scores.reduce((s, a) => s + a.overall, 0) / Math.max(scores.length, 1));
  const allStrengths = scores.flatMap(s => s.strengths).slice(0, 10);
  const allImprovements = scores.flatMap(s => s.improvements).slice(0, 10);

  const prompt = `You are a senior career coach. Provide overall interview session feedback.

ROLE: ${role}
INDUSTRY: ${industry}
AVERAGE SCORE: ${avgScore}/100
INDIVIDUAL SCORES: ${scores.map(s => s.overall).join(", ")}
IDENTIFIED STRENGTHS: ${allStrengths.join("; ")}
IDENTIFIED IMPROVEMENTS: ${allImprovements.join("; ")}

Return ONLY raw JSON:
{
  "overallScore": ${avgScore},
  "summary": "2-3 sentence overall assessment",
  "topStrengths": ["top strength 1", "top strength 2", "top strength 3"],
  "topImprovements": ["top area 1", "top area 2", "top area 3"],
  "readinessLevel": "not_ready|developing|ready|exceptional",
  "nextSteps": ["actionable next step 1", "actionable next step 2", "actionable next step 3"]
}

readinessLevel guide: not_ready (<40), developing (40-64), ready (65-84), exceptional (85+)`;

  const result = await generateDeepSeekResponse(prompt, { maxTokens: 1024 });
  if (!result.text) throw new Error("LLM did not return session feedback");

  try {
    return JSON.parse(extractJSON(result.text)) as SessionFeedback;
  } catch {
    throw new Error("Could not parse session feedback response");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Video / transcript analysis
// ─────────────────────────────────────────────────────────────────────────────

export async function analyseVideoTranscript(
  transcript: string,
  durationSeconds: number,
  role: string
): Promise<VideoAnalysis> {
  const words = transcript.split(/\s+/).filter(Boolean);
  const wpm   = Math.round((words.length / Math.max(durationSeconds, 1)) * 60);
  const commonFillers = ["um", "uh", "like", "you know", "basically", "literally", "right", "so", "actually"];
  const fillerCount = commonFillers.reduce((count, filler) => {
    const regex = new RegExp(`\\b${filler}\\b`, "gi");
    return count + (transcript.match(regex)?.length || 0);
  }, 0);

  const prompt = `You are a professional speaking coach and interview analyst.

Analyse this interview transcript for communication quality:

ROLE CONTEXT: ${role}
SPEAKING PACE: ${wpm} words per minute (ideal: 130-160 wpm)
TRANSCRIPT:
"${transcript.slice(0, 4000)}"

Return ONLY raw JSON:
{
  "transcript": "${transcript.slice(0, 200).replace(/"/g, "'")}...",
  "fillerWordCount": ${fillerCount},
  "speakingPaceWpm": ${wpm},
  "estimatedConfidence": <integer 0-100>,
  "keyThemes": ["main theme 1", "main theme 2", "main theme 3"],
  "suggestions": [
    "Specific speaking improvement 1",
    "Specific speaking improvement 2",
    "Specific content improvement 1"
  ]
}

estimatedConfidence: based on hedging language, passive vs active voice, assertive statements
keyThemes: main topics or competencies demonstrated in the answer`;

  const result = await generateDeepSeekResponse(prompt);
  if (!result.text) {
    return {
      transcript,
      fillerWordCount: fillerCount,
      speakingPaceWpm: wpm,
      estimatedConfidence: 60,
      keyThemes: [],
      suggestions: ["Review your pacing", "Reduce filler words", "Be more specific with examples"],
    };
  }

  try {
    const parsed = JSON.parse(extractJSON(result.text)) as VideoAnalysis;
    return { ...parsed, transcript, fillerWordCount: fillerCount, speakingPaceWpm: wpm };
  } catch {
    return {
      transcript,
      fillerWordCount: fillerCount,
      speakingPaceWpm: wpm,
      estimatedConfidence: 60,
      keyThemes: [],
      suggestions: ["Review your pacing", "Reduce filler words"],
    };
  }
}

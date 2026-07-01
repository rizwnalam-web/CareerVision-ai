/**
 * MobileInterviewView
 *
 * A mobile-first interview practice UI for CareerVision.
 * Optimised for small screens with:
 *  - Single-column full-height layout with safe area insets
 *  - Large tap targets (48px minimum)
 *  - Audio-only mode (no camera, lighter on mobile bandwidth)
 *  - Haptic feedback via Vibration API
 *  - Waveform visualiser for live audio
 *  - Swipe-to-dismiss hints
 *  - Floating action button for record / stop
 *  - Progress dots instead of numbering
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Mic, MicOff, ChevronRight, ChevronLeft, Brain,
  Loader2, CheckCircle, AlertCircle, RotateCcw,
  Lightbulb, Star, X, Settings2, Play, Square,
  Volume2, VolumeX,
} from "lucide-react";
import { cn } from "../lib/utils";
import type {
  PrepQuestion, AnswerScore, PrepAnswer, SessionFeedback,
  SimulatorConfig, SessionType,
} from "../types/interviewPrep";
import { INDUSTRIES } from "../types/interviewPrep";
import {
  fetchQuestions, createSession, evaluateAnswer, completeSession,
} from "../services/interviewPrepService";

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  userId: string;
  defaultRole?: string;
  onClose?: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Haptic helper
// ─────────────────────────────────────────────────────────────────────────────

function vibrate(pattern: number | number[]) {
  if ("vibrate" in navigator) navigator.vibrate(pattern);
}

// ─────────────────────────────────────────────────────────────────────────────
// Speech Recognition hook (same as InterviewPrepView)
// ─────────────────────────────────────────────────────────────────────────────

function useSpeechRecognition() {
  const [transcript, setTranscript]   = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recogRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSupported(!!SpeechRec);
    if (!SpeechRec) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec: any = new SpeechRec();
    rec.continuous      = true;
    rec.interimResults  = true;
    rec.lang            = "en-US";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript + " ";
      }
      if (final) setTranscript((t) => t + final);
    };
    rec.onend = () => setIsListening(false);
    recogRef.current = rec;
    return () => rec.stop();
  }, []);

  const start = useCallback(() => {
    if (!recogRef.current) return;
    setTranscript("");
    recogRef.current.start();
    setIsListening(true);
  }, []);

  const stop = useCallback(() => {
    recogRef.current?.stop();
    setIsListening(false);
  }, []);

  const reset = useCallback(() => { stop(); setTranscript(""); }, [stop]);

  return { transcript, setTranscript, isListening, isSupported, start, stop, reset };
}

// ─────────────────────────────────────────────────────────────────────────────
// Audio waveform visualiser
// ─────────────────────────────────────────────────────────────────────────────

function AudioWave({ active }: { active: boolean }) {
  const bars = 20;
  return (
    <div className="flex items-center justify-center gap-0.5 h-8">
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div
          key={i}
          className={cn("w-1 rounded-full", active ? "bg-indigo-500" : "bg-slate-300")}
          animate={active ? {
            height: [4, Math.random() * 28 + 4, 4],
          } : { height: 4 }}
          transition={{
            duration: 0.4 + Math.random() * 0.4,
            repeat: active ? Infinity : 0,
            delay: i * 0.04,
            ease: "easeInOut",
          }}
          style={{ height: 4 }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Score gauge
// ─────────────────────────────────────────────────────────────────────────────

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 80 ? "#34d399" : score >= 60 ? "#fbbf24" : "#f87171";
  const r = 44;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={100} height={100} viewBox="0 0 100 100" className="-rotate-90">
        <circle cx={50} cy={50} r={r} fill="none" stroke="#e2e8f0" strokeWidth={8} />
        <motion.circle
          cx={50} cy={50} r={r} fill="none" strokeWidth={8}
          stroke={color} strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${circ}` }}
          animate={{ strokeDasharray: `${dash} ${circ}` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>
      <span className="text-3xl font-black -mt-16" style={{ color }}>{score}</span>
      <span className="text-xs text-slate-400 mt-8">/ 100</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Progress dots
// ─────────────────────────────────────────────────────────────────────────────

function ProgressDots({
  total, current, answers,
}: { total: number; current: number; answers: PrepAnswer[] }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, i) => {
        const answered = answers[i];
        const isCurrent = i === current;
        return (
          <motion.div
            key={i}
            className={cn(
              "rounded-full transition-all",
              answered
                ? "w-2.5 h-2.5 bg-emerald-400"
                : isCurrent
                  ? "w-3 h-3 bg-indigo-600"
                  : "w-2 h-2 bg-slate-200"
            )}
            initial={false}
            animate={{ scale: isCurrent ? 1.1 : 1 }}
          />
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

type Phase = "setup" | "ready" | "answering" | "evaluating" | "review" | "complete";

export default function MobileInterviewView({ userId, defaultRole, onClose }: Props) {
  const [phase, setPhase]         = useState<Phase>("setup");
  const [config, setConfig]       = useState<SimulatorConfig>({
    sessionType: "behavioral", industry: "Technology",
    role: defaultRole || "Software Engineer", company: "", questionCount: 5,
  });
  const [questions, setQuestions] = useState<PrepQuestion[]>([]);
  const [idx, setIdx]             = useState(0);
  const [answers, setAnswers]     = useState<PrepAnswer[]>([]);
  const [score, setScore]         = useState<AnswerScore | null>(null);
  const [feedback, setFeedback]   = useState<SessionFeedback | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [timer, setTimer]         = useState(0);
  const [showHints, setShowHints] = useState(false);
  const [mutedTTS, setMutedTTS]   = useState(false);
  const timerRef                  = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef              = useRef(0);
  const speech                    = useSpeechRecognition();

  // Text-to-speech: read the question aloud
  const speakQuestion = useCallback((text: string) => {
    if (mutedTTS || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.95;
    window.speechSynthesis.speak(utt);
  }, [mutedTTS]);

  // ── Setup → Start ───────────────────────────────────────────────────────────
  const handleStart = async () => {
    vibrate(10);
    setLoading(true); setError(null);
    try {
      const { questions: qs } = await fetchQuestions({
        type: config.sessionType === "mixed" ? undefined : config.sessionType,
        industry: config.industry, role: config.role,
        limit: config.questionCount,
      });
      if (!qs.length) throw new Error("No questions found for this role. Generate them in the desktop Interview Prep first.");
      const { sessionId: sid } = await createSession({
        userId, sessionType: config.sessionType,
        industry: config.industry, role: config.role,
        company: config.company || undefined,
        questionIds: qs.map((q) => q.id),
      });
      setQuestions(qs); setSessionId(sid);
      setAnswers([]); setIdx(0);
      setPhase("ready");
      vibrate([50, 30, 50]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Read question when phase becomes 'ready'
  useEffect(() => {
    if (phase === "ready" && questions[idx]) {
      speakQuestion(questions[idx].text);
    }
  }, [phase, idx, questions, speakQuestion]);

  // ── Start answering ─────────────────────────────────────────────────────────
  const startAnswering = () => {
    vibrate(30);
    setPhase("answering"); setTimer(0); setShowHints(false);
    speech.reset(); speech.start();
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
  };

  // ── Stop + evaluate ─────────────────────────────────────────────────────────
  const stopAndEvaluate = async () => {
    vibrate([50, 50]);
    speech.stop();
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
    const transcript = speech.transcript.trim();

    if (!transcript) {
      setError("No speech detected. Please enable your microphone and try again.");
      return;
    }

    setPhase("evaluating"); setLoading(true);
    try {
      const s = await evaluateAnswer(questions[idx], transcript, duration);
      setScore(s);
      setAnswers((a) => [...a, {
        questionId: questions[idx].id,
        questionText: questions[idx].text,
        transcript, durationSeconds: duration,
        score: s, recordedAt: new Date().toISOString(),
      }]);
      setPhase("review");
      vibrate(s.overall >= 70 ? [50, 30, 80] : [80, 30, 50]);
    } catch (e: any) {
      setError(e.message);
      setPhase("answering");
    } finally {
      setLoading(false);
    }
  };

  // ── Next question / finish ──────────────────────────────────────────────────
  const next = async () => {
    vibrate(20);
    setScore(null); speech.reset();
    if (idx + 1 >= questions.length) {
      setLoading(true);
      try {
        const allScores = answers.map((a) => a.score!).filter(Boolean);
        const fb = await completeSession({
          sessionId: sessionId!,
          answers: allScores,
          durationSeconds: answers.reduce((s, a) => s + a.durationSeconds, 0),
          role: config.role, industry: config.industry,
        });
        setFeedback(fb);
        setPhase("complete");
        vibrate([100, 50, 100, 50, 200]);
      } catch (e: any) { setError(e.message); }
      finally { setLoading(false); }
    } else {
      setIdx((i) => i + 1);
      setPhase("ready");
    }
  };

  const restart = () => {
    vibrate(20);
    speech.reset();
    setPhase("setup"); setQuestions([]); setAnswers([]);
    setIdx(0); setScore(null); setFeedback(null);
    setTimer(0); setError(null);
  };

  const q = questions[idx];
  const fmtTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      className="relative z-0 bg-slate-950 flex flex-col min-h-[calc(100vh-10rem)] rounded-2xl overflow-hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-safe py-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Brain size={18} className="text-indigo-400" />
          <span className="text-sm font-bold text-white">Interview Practice</span>
          {config.role && (
            <span className="text-xs text-slate-500 hidden sm:inline">· {config.role}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMutedTTS((m) => !m)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label={mutedTTS ? "Unmute TTS" : "Mute TTS"}
          >
            {mutedTTS ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* ── SETUP ── */}
          {phase === "setup" && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-5 space-y-6"
            >
              <div className="text-center pt-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 mb-3">
                  <Brain size={28} className="text-indigo-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Configure Session</h2>
                <p className="text-sm text-slate-400 mt-1">Audio-only · Mobile optimised</p>
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Role</label>
                <input
                  value={config.role}
                  onChange={(e) => setConfig((c) => ({ ...c, role: e.target.value }))}
                  placeholder="e.g. Product Manager"
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 text-white px-4 py-3 text-sm
                             focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40"
                />
              </div>

              {/* Session type */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Session Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["behavioral", "technical", "mixed", "situational"] as SessionType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => { vibrate(8); setConfig((c) => ({ ...c, sessionType: t })); }}
                      className={cn(
                        "py-3 rounded-xl text-sm font-semibold capitalize transition-colors border",
                        config.sessionType === t
                          ? "bg-indigo-600 text-white border-indigo-500"
                          : "bg-slate-800 text-slate-300 border-slate-700"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Industry */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Industry</label>
                <select
                  value={config.industry}
                  onChange={(e) => setConfig((c) => ({ ...c, industry: e.target.value }))}
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 text-white px-4 py-3 text-sm
                             focus:outline-none focus:border-indigo-500"
                >
                  {INDUSTRIES.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
                </select>
              </div>

              {/* Question count */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Questions: {config.questionCount}
                </label>
                <input
                  type="range" min={3} max={10} step={1}
                  value={config.questionCount}
                  onChange={(e) => setConfig((c) => ({ ...c, questionCount: +e.target.value }))}
                  className="w-full accent-indigo-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>3 (Quick)</span><span>10 (Full)</span>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-rose-900/30 border border-rose-700/40 rounded-xl p-3">
                  <AlertCircle size={16} className="text-rose-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-rose-300">{error}</p>
                </div>
              )}

              {/* Start */}
              <button
                onClick={handleStart}
                disabled={loading || !config.role.trim()}
                className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50
                           text-white font-bold text-base transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <><Play size={20} /> Start Session</>}
              </button>
            </motion.div>
          )}

          {/* ── READY ── */}
          {phase === "ready" && q && (
            <motion.div
              key={`ready-${idx}`}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              className="flex flex-col h-full p-5 gap-5"
            >
              <div className="pt-2">
                <ProgressDots total={questions.length} current={idx} answers={answers} />
                <p className="text-center text-xs text-slate-500 mt-2">
                  Question {idx + 1} of {questions.length}
                </p>
              </div>

              {/* Question card */}
              <div className="flex-1 flex flex-col justify-center">
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-medium capitalize">
                      {q.type}
                    </span>
                    <span className="text-xs text-slate-500 capitalize">{q.difficulty}</span>
                  </div>
                  <p className="text-white text-base font-medium leading-relaxed">{q.text}</p>

                  {/* Hints */}
                  <AnimatePresence>
                    {showHints && q.hints.length > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mt-4"
                      >
                        <div className="border-t border-slate-700 pt-3 space-y-1">
                          {q.hints.map((h, i) => (
                            <div key={i} className="flex gap-2 text-xs text-slate-400">
                              <span className="text-amber-400 flex-shrink-0">💡</span>{h}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-3 pb-2">
                <button
                  onClick={() => { vibrate(8); setShowHints((h) => !h); }}
                  className="w-full py-3 rounded-xl border border-slate-700 text-slate-300 text-sm font-medium
                             flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
                >
                  <Lightbulb size={16} className="text-amber-400" />
                  {showHints ? "Hide hints" : "Show hints"}
                </button>
                <button
                  onClick={startAnswering}
                  className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold
                             text-base flex items-center justify-center gap-2 transition-colors"
                >
                  <Mic size={20} /> Start Answering
                </button>
              </div>
            </motion.div>
          )}

          {/* ── ANSWERING ── */}
          {phase === "answering" && q && (
            <motion.div
              key="answering"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col h-full p-5 gap-4"
            >
              {/* Timer */}
              <div className="text-center pt-2">
                <span className={cn(
                  "text-2xl font-mono font-bold",
                  timer > 180 ? "text-rose-400" : "text-white"
                )}>
                  {fmtTime(timer)}
                </span>
                {timer > 180 && (
                  <p className="text-xs text-rose-400 mt-0.5">Consider wrapping up…</p>
                )}
              </div>

              {/* Question (compact) */}
              <div className="bg-slate-800/60 rounded-xl p-4">
                <p className="text-sm text-slate-300 leading-relaxed">{q.text}</p>
              </div>

              {/* Waveform */}
              <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <AudioWave active={speech.isListening} />
                {speech.isListening ? (
                  <p className="text-sm text-indigo-300 font-medium">Listening…</p>
                ) : (
                  <p className="text-sm text-slate-500">Tap ⬇ when ready to speak</p>
                )}
              </div>

              {/* Live transcript */}
              {speech.transcript && (
                <div className="bg-slate-800 rounded-xl p-3 max-h-32 overflow-y-auto">
                  <p className="text-xs text-slate-400 italic">{speech.transcript}</p>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="bg-rose-900/30 border border-rose-700/40 rounded-xl p-3 text-xs text-rose-300">
                  {error}
                </div>
              )}

              {/* Stop button — large FAB-style */}
              <button
                onClick={stopAndEvaluate}
                className="w-full py-5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold
                           text-base flex items-center justify-center gap-3 transition-colors"
              >
                <Square size={20} /> Stop &amp; Evaluate
              </button>
            </motion.div>
          )}

          {/* ── EVALUATING ── */}
          {phase === "evaluating" && (
            <motion.div
              key="evaluating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full gap-4 p-5"
            >
              <Loader2 size={40} className="animate-spin text-indigo-400" />
              <p className="text-sm text-slate-300 font-medium">Evaluating your answer…</p>
              <p className="text-xs text-slate-500">AI is analysing structure, clarity & keywords</p>
            </motion.div>
          )}

          {/* ── REVIEW ── */}
          {phase === "review" && score && q && (
            <motion.div
              key="review"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 space-y-5"
            >
              {/* Score */}
              <div className="flex flex-col items-center gap-2 pt-2">
                <ScoreGauge score={score.overall} />
                <p className={cn(
                  "text-sm font-bold",
                  score.overall >= 80 ? "text-emerald-400" : score.overall >= 60 ? "text-amber-400" : "text-rose-400"
                )}>
                  {score.overall >= 80 ? "Excellent answer!" : score.overall >= 60 ? "Good answer" : "Needs improvement"}
                </p>
              </div>

              {/* Sub-scores */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Clarity",    value: score.clarity    },
                  { label: "Relevance",  value: score.relevance  },
                  { label: "Structure",  value: score.structure  },
                  { label: "Keywords",   value: score.keywords   },
                  { label: "Confidence", value: score.confidence },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-800 rounded-xl p-3 text-center">
                    <p className="text-xs text-slate-400">{label}</p>
                    <p className={cn("text-lg font-bold", value >= 75 ? "text-emerald-400" : value >= 55 ? "text-amber-400" : "text-rose-400")}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Strengths */}
              {score.strengths.length > 0 && (
                <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-xl p-4">
                  <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">Strengths</p>
                  <ul className="space-y-1">
                    {score.strengths.map((s, i) => (
                      <li key={i} className="text-xs text-emerald-300 flex gap-2">
                        <CheckCircle size={12} className="flex-shrink-0 mt-0.5" />{s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Improvements */}
              {score.improvements.length > 0 && (
                <div className="bg-amber-900/20 border border-amber-700/30 rounded-xl p-4">
                  <p className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-2">Areas to Improve</p>
                  <ul className="space-y-1">
                    {score.improvements.map((s, i) => (
                      <li key={i} className="text-xs text-amber-300 flex gap-2">
                        <span className="flex-shrink-0 mt-0.5">→</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggested answer (collapsible) */}
              {score.suggestedAnswer && (
                <details className="bg-slate-800 rounded-xl p-4 group">
                  <summary className="text-xs font-bold text-indigo-300 uppercase tracking-widest cursor-pointer list-none flex items-center justify-between">
                    Sample Answer
                    <ChevronRight size={14} className="group-open:rotate-90 transition-transform" />
                  </summary>
                  <p className="text-xs text-slate-300 mt-3 leading-relaxed">{score.suggestedAnswer}</p>
                </details>
              )}

              {/* Next button */}
              <button
                onClick={next}
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50
                           text-white font-bold text-base flex items-center justify-center gap-2 transition-colors"
              >
                {loading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : idx + 1 >= questions.length ? (
                  <><CheckCircle size={20} /> Finish Session</>
                ) : (
                  <>Next Question <ChevronRight size={20} /></>
                )}
              </button>
            </motion.div>
          )}

          {/* ── COMPLETE ── */}
          {phase === "complete" && feedback && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-5 space-y-5"
            >
              <div className="text-center pt-4">
                <div className="text-5xl mb-2">🎉</div>
                <h2 className="text-xl font-black text-white">Session Complete!</h2>
                <div className="text-4xl font-black mt-2" style={{
                  color: feedback.overallScore >= 80 ? "#34d399" : feedback.overallScore >= 60 ? "#fbbf24" : "#f87171"
                }}>
                  {feedback.overallScore}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Overall Score</p>
                <span className={cn(
                  "text-xs font-semibold px-3 py-1 rounded-full mt-2 inline-block capitalize",
                  feedback.readinessLevel === "exceptional" ? "bg-emerald-900/40 text-emerald-300" :
                  feedback.readinessLevel === "ready"       ? "bg-indigo-900/40 text-indigo-300"   :
                  feedback.readinessLevel === "developing"  ? "bg-amber-900/40 text-amber-300"     :
                                                              "bg-slate-800 text-slate-400"
                )}>
                  {feedback.readinessLevel.replace("_", " ")}
                </span>
              </div>

              <p className="text-sm text-slate-300 text-center leading-relaxed">{feedback.summary}</p>

              {feedback.topStrengths.length > 0 && (
                <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-xl p-4">
                  <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">Top Strengths</p>
                  <ul className="space-y-1">
                    {feedback.topStrengths.map((s, i) => (
                      <li key={i} className="text-xs text-emerald-300 flex gap-2">
                        <Star size={10} className="flex-shrink-0 mt-0.5 text-amber-400" />{s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {feedback.nextSteps.length > 0 && (
                <div className="bg-slate-800 rounded-xl p-4">
                  <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-2">Next Steps</p>
                  <ul className="space-y-2">
                    {feedback.nextSteps.map((s, i) => (
                      <li key={i} className="text-xs text-slate-300 flex gap-2">
                        <span className="text-indigo-400 font-bold flex-shrink-0">{i + 1}.</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-3 pb-2">
                <button
                  onClick={restart}
                  className="flex-1 py-3.5 rounded-2xl border border-slate-600 text-slate-300
                             font-semibold text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
                >
                  <RotateCcw size={16} /> Again
                </button>
                {onClose && (
                  <button
                    onClick={onClose}
                    className="flex-1 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500
                               text-white font-bold text-sm transition-colors"
                  >
                    Done
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

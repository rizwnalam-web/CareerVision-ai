import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Mic, MicOff, Video, VideoOff, Play, Square, RotateCcw,
  ChevronRight, ChevronDown, Brain, Target, Users, History,
  Loader2, Sparkles, CheckCircle, AlertCircle, Clock, Star,
  BookOpen, Lightbulb, TrendingUp, Award, Copy, Check,
  Plus, X, Camera, BarChart3, Zap, MessageSquare,
} from "lucide-react";
import { cn } from "../lib/utils";
import type {
  PrepQuestion, AnswerScore, PrepAnswer, PrepSession,
  SessionFeedback, VideoAnalysis, PeerSession,
  SimulatorConfig, PrepTab, SessionType, Difficulty,
} from "../types/interviewPrep";
import { INDUSTRIES, READINESS_CONFIG } from "../types/interviewPrep";
import {
  fetchQuestions, generateQuestions, createSession,
  getUserSessions, evaluateAnswer, completeSession,
  analyseVideoTranscript, createPeerSession, getPeerSession,
  submitPeerReview, getMyPeerSessions,
} from "../services/interviewPrepService";

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface Props { userId: string; defaultRole?: string; }

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function scoreColor(s: number) {
  if (s >= 80) return "text-emerald-600";
  if (s >= 60) return "text-amber-500";
  return "text-rose-500";
}
function scoreBg(s: number) {
  if (s >= 80) return "bg-emerald-50 border-emerald-200";
  if (s >= 60) return "bg-amber-50 border-amber-200";
  return "bg-rose-50 border-rose-200";
}
function diffBadge(d: Difficulty) {
  const m: Record<Difficulty, string> = {
    easy: "bg-emerald-100 text-emerald-700",
    medium: "bg-amber-100 text-amber-700",
    hard: "bg-rose-100 text-rose-700",
  };
  return m[d];
}
function typeBadge(t: PrepQuestion["type"]) {
  const m: Record<string, string> = {
    behavioral: "bg-indigo-100 text-indigo-700",
    technical: "bg-violet-100 text-violet-700",
    situational: "bg-sky-100 text-sky-700",
    culture: "bg-pink-100 text-pink-700",
  };
  return m[t] || "bg-slate-100 text-slate-600";
}
function fmtSecs(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Score Ring
// ─────────────────────────────────────────────────────────────────────────────

const ScoreRing: React.FC<{ score: number; size?: number; strokeWidth?: number }> = ({ score, size = 56, strokeWidth = 5 }) => {
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const c = size / 2;
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={c} cy={c} r={r} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} />
      <circle cx={c} cy={c} r={r} fill="none" strokeWidth={strokeWidth} strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        className={score >= 80 ? "stroke-emerald-500" : score >= 60 ? "stroke-amber-400" : "stroke-rose-400"}
        style={{ transition: "stroke-dasharray 0.7s ease" }}
      />
    </svg>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Speech Recognition hook
// ─────────────────────────────────────────────────────────────────────────────

function useSpeechRecognition() {
  const [transcript, setTranscript] = useState("");
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
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript + " ";
      }
      if (final) setTranscript(t => t + final);
    };
    rec.onend = () => setIsListening(false);
    recogRef.current = rec;

    return () => { rec.stop(); };
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

  const reset = useCallback(() => {
    stop();
    setTranscript("");
  }, [stop]);

  return { transcript, setTranscript, isListening, isSupported, start, stop, reset };
}

// ─────────────────────────────────────────────────────────────────────────────
// Video Recording hook
// ─────────────────────────────────────────────────────────────────────────────

function useVideoRecorder() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.muted = true; }
      setIsStreaming(true); setError(null);
    } catch {
      setError("Camera/microphone access denied. Please allow access in your browser settings.");
    }
  }, []);

  const stopStream = useCallback(() => {
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach(t => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsStreaming(false);
  }, []);

  const startRecording = useCallback(() => {
    const stream = videoRef.current?.srcObject as MediaStream;
    if (!stream) return;
    chunksRef.current = [];
    const mr = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9,opus" });
    mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = () => setRecordedBlob(new Blob(chunksRef.current, { type: "video/webm" }));
    mr.start(100);
    mediaRecorderRef.current = mr;
    setIsRecording(true);
  }, []);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }, []);

  const clearRecording = useCallback(() => setRecordedBlob(null), []);

  return { videoRef, isStreaming, isRecording, recordedBlob, error, startStream, stopStream, startRecording, stopRecording, clearRecording };
}

// ─────────────────────────────────────────────────────────────────────────────
// Score breakdown card
// ─────────────────────────────────────────────────────────────────────────────

const ScoreBreakdown: React.FC<{ score: AnswerScore }> = ({ score }) => {
  const dims = [
    { label: "Clarity", value: score.clarity },
    { label: "Relevance", value: score.relevance },
    { label: "Structure", value: score.structure },
    { label: "Keywords", value: score.keywords },
    { label: "Confidence", value: score.confidence },
  ];
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative">
          <ScoreRing score={score.overall} size={68} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn("text-lg font-black", scoreColor(score.overall))}>{score.overall}</span>
          </div>
        </div>
        <div className="flex-1 space-y-1.5">
          {dims.map(({ label, value }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-500 w-20 shrink-0">{label}</span>
              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full", value >= 80 ? "bg-emerald-500" : value >= 60 ? "bg-amber-400" : "bg-rose-400")}
                  style={{ width: `${value}%`, transition: "width 0.6s ease" }} />
              </div>
              <span className="text-[10px] font-black text-slate-600 w-5 text-right">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {score.starBreakdown && (
        <div className="grid grid-cols-4 gap-2">
          {(["situation", "task", "action", "result"] as const).map(k => (
            <div key={k} className="text-center p-2 bg-indigo-50 rounded-xl">
              <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400">{k}</p>
              <p className="text-lg font-black text-indigo-700">{score.starBreakdown![k]}</p>
              <p className="text-[9px] text-slate-400">/25</p>
            </div>
          ))}
        </div>
      )}

      {score.fillerWords.length > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-1">Filler Words Detected</p>
          <div className="flex flex-wrap gap-1.5">
            {score.fillerWords.map(f => (
              <span key={f} className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-lg text-[10px] font-bold">"{f}"</span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1.5">Strengths</p>
          {score.strengths.map((s, i) => (
            <div key={i} className="flex items-start gap-1.5 mb-1">
              <CheckCircle size={10} className="text-emerald-500 mt-0.5 shrink-0" />
              <span className="text-xs text-slate-600">{s}</span>
            </div>
          ))}
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-rose-600 mb-1.5">Improve</p>
          {score.improvements.map((s, i) => (
            <div key={i} className="flex items-start gap-1.5 mb-1">
              <AlertCircle size={10} className="text-amber-500 mt-0.5 shrink-0" />
              <span className="text-xs text-slate-600">{s}</span>
            </div>
          ))}
        </div>
      </div>

      {score.suggestedAnswer && (
        <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Suggested Approach</p>
          <p className="text-xs text-slate-700">{score.suggestedAnswer}</p>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Simulator Tab
// ─────────────────────────────────────────────────────────────────────────────

const SimulatorTab: React.FC<{ userId: string; defaultRole?: string }> = ({ userId, defaultRole }) => {
  type SimPhase = "setup" | "ready" | "question" | "answering" | "evaluating" | "review" | "complete";
  const [phase, setPhase] = useState<SimPhase>("setup");
  const [config, setConfig] = useState<SimulatorConfig>({
    sessionType: "behavioral", industry: "Technology",
    role: defaultRole || "Software Engineer", company: "", questionCount: 5,
  });
  const [questions, setQuestions] = useState<PrepQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<PrepAnswer[]>([]);
  const [currentScore, setCurrentScore] = useState<AnswerScore | null>(null);
  const [sessionFeedback, setSessionFeedback] = useState<SessionFeedback | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);
  const [showHints, setShowHints] = useState(false);
  const [showSample, setShowSample] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);

  const speech = useSpeechRecognition();

  const handleStart = async () => {
    setLoading(true); setError(null);
    try {
      const { questions: qs } = await fetchQuestions({
        type: config.sessionType === "mixed" ? undefined : config.sessionType,
        industry: config.industry, role: config.role,
        limit: config.questionCount,
      });
      if (!qs.length) throw new Error("No questions in the bank for this industry yet. Go to the 'Question Bank' tab and click 'Generate AI Questions' first, then return here.");

      const { sessionId: sid } = await createSession({
        userId, sessionType: config.sessionType,
        industry: config.industry, role: config.role,
        company: config.company || undefined,
        questionIds: qs.map(q => q.id),
      });

      setQuestions(qs); setSessionId(sid); setAnswers([]); setCurrentIdx(0);
      setPhase("ready");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const startQuestion = () => {
    setPhase("answering"); setTimer(0); setShowHints(false); setShowSample(false);
    speech.reset();
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    speech.start();
  };

  const stopAndEvaluate = async () => {
    speech.stop();
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
    const transcript = speech.transcript.trim();

    if (!transcript) {
      setError("No speech detected. Please allow microphone access and try again.");
      return;
    }

    setPhase("evaluating"); setLoading(true);
    try {
      const score = await evaluateAnswer(questions[currentIdx], transcript, duration);
      setCurrentScore(score);
      setAnswers(a => [...a, {
        questionId: questions[currentIdx].id,
        questionText: questions[currentIdx].text,
        transcript, durationSeconds: duration,
        score, recordedAt: new Date().toISOString(),
      }]);
      setPhase("review");
    } catch (e: any) {
      setError(e.message);
      setPhase("answering");
    } finally {
      setLoading(false);
    }
  };

  const nextQuestion = async () => {
    setCurrentScore(null); speech.reset();
    if (currentIdx + 1 >= questions.length) {
      // Complete session
      setLoading(true);
      try {
        const allScores = answers.map(a => a.score!).filter(Boolean);
        const feedback = await completeSession({
          sessionId: sessionId!,
          answers: allScores,
          durationSeconds: answers.reduce((s, a) => s + a.durationSeconds, 0),
          role: config.role, industry: config.industry,
        });
        setSessionFeedback(feedback);
        setPhase("complete");
      } catch (e: any) { setError(e.message); }
      finally { setLoading(false); }
    } else {
      setCurrentIdx(i => i + 1);
      setPhase("ready");
    }
  };

  const restart = () => {
    speech.reset();
    setPhase("setup"); setQuestions([]); setAnswers([]);
    setCurrentIdx(0); setCurrentScore(null); setSessionFeedback(null);
    setTimer(0); setError(null);
  };

  const q = questions[currentIdx];

  return (
    <div className="space-y-6">
      {/* ─── SETUP ─── */}
      {phase === "setup" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Configure Your Session</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Session Type</label>
                <div className="flex flex-wrap gap-2">
                  {(["behavioral", "technical", "mixed", "situational"] as SessionType[]).map(t => (
                    <button key={t} onClick={() => setConfig(c => ({ ...c, sessionType: t }))}
                      className={cn("px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                        config.sessionType === t ? "bg-indigo-600 text-white border-indigo-600" : "border-slate-200 text-slate-500 hover:border-indigo-300"
                      )}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Industry</label>
                <select value={config.industry} onChange={e => setConfig(c => ({ ...c, industry: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400 bg-white">
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Target Role</label>
                <input value={config.role} onChange={e => setConfig(c => ({ ...c, role: e.target.value }))}
                  placeholder="e.g. Senior Software Engineer"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Company (optional)</label>
                <input value={config.company} onChange={e => setConfig(c => ({ ...c, company: e.target.value }))}
                  placeholder="e.g. Google, Stripe…"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Questions: {config.questionCount}</label>
                <input type="range" min={3} max={12} value={config.questionCount}
                  onChange={e => setConfig(c => ({ ...c, questionCount: parseInt(e.target.value) }))}
                  className="w-full accent-indigo-600" />
                <div className="flex justify-between text-[9px] text-slate-400"><span>3</span><span>12</span></div>
              </div>
            </div>

            {!speech.isSupported && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <AlertCircle size={13} className="text-amber-500 shrink-0" />
                <span className="text-xs text-amber-700">Speech recognition not available in this browser. You can still type your answers manually.</span>
              </div>
            )}

            {error && <p className="text-xs text-rose-500">{error}</p>}

            <button onClick={handleStart} disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-black uppercase tracking-widest transition-colors">
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
              {loading ? "Preparing…" : "Start Interview"}
            </button>
          </div>
        </motion.div>
      )}

      {/* ─── READY ─── */}
      {phase === "ready" && q && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold">Question {currentIdx + 1} of {questions.length}</span>
            <div className="flex gap-1.5">
              {questions.map((_, i) => (
                <div key={i} className={cn("h-1.5 rounded-full transition-all", i < currentIdx ? "bg-emerald-500 w-6" : i === currentIdx ? "bg-indigo-500 w-8" : "bg-slate-200 w-6")} />
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex gap-2 flex-wrap">
              <span className={cn("px-2 py-0.5 rounded-lg text-[10px] font-black uppercase", typeBadge(q.type))}>{q.type}</span>
              <span className={cn("px-2 py-0.5 rounded-lg text-[10px] font-black uppercase", diffBadge(q.difficulty))}>{q.difficulty}</span>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-lg text-[10px]">{q.category}</span>
            </div>

            <p className="text-lg font-bold text-slate-900 leading-relaxed">{q.text}</p>

            <div className="flex gap-3">
              <button onClick={() => setShowHints(!showHints)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors">
                <Lightbulb size={11} /> {showHints ? "Hide" : "Show"} Hints
              </button>
              {q.sampleAnswer && (
                <button onClick={() => setShowSample(!showSample)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors">
                  <BookOpen size={11} /> {showSample ? "Hide" : "See"} Sample
                </button>
              )}
            </div>

            {showHints && q.hints.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 bg-amber-50 border border-amber-100 rounded-xl space-y-1">
                {q.hints.map((h, i) => <p key={i} className="text-xs text-amber-800">• {h}</p>)}
              </motion.div>
            )}
            {showSample && q.sampleAnswer && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                <p className="text-xs text-indigo-800">{q.sampleAnswer}</p>
              </motion.div>
            )}

            <button onClick={startQuestion}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black uppercase tracking-widest text-sm transition-colors">
              <Mic size={16} /> Start Answering
            </button>
          </div>
        </motion.div>
      )}

      {/* ─── ANSWERING ─── */}
      {phase === "answering" && q && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-slate-700 flex-1 pr-4">{q.text}</p>
              <div className={cn("shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-black", timer > 120 ? "text-rose-600 bg-rose-50" : "text-slate-600 bg-slate-100")}>
                <Clock size={13} /> {fmtSecs(timer)}
              </div>
            </div>

            {/* Live transcript */}
            <div className="min-h-32 max-h-48 overflow-y-auto p-4 bg-slate-50 border border-slate-200 rounded-xl">
              {speech.isListening && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Recording…</span>
                </div>
              )}
              {speech.transcript
                ? <p className="text-sm text-slate-700 leading-relaxed">{speech.transcript}</p>
                : <p className="text-sm text-slate-400 italic">{speech.isSupported ? "Speak now — your answer will appear here…" : "Type your answer below…"}</p>
              }
            </div>

            {!speech.isSupported && (
              <textarea value={speech.transcript} onChange={e => speech.setTranscript(e.target.value)}
                placeholder="Type your answer here…" rows={5}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400 resize-none" />
            )}

            <div className="flex gap-3">
              <button onClick={stopAndEvaluate} disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-colors">
                {loading ? <Loader2 size={13} className="animate-spin" /> : <Square size={13} />}
                {loading ? "Evaluating…" : "Stop & Evaluate"}
              </button>
              {speech.isSupported && (
                <button onClick={speech.isListening ? speech.stop : speech.start}
                  className={cn("px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-1.5",
                    speech.isListening ? "bg-rose-100 text-rose-600 hover:bg-rose-200" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}>
                  {speech.isListening ? <><MicOff size={13} /> Pause</> : <><Mic size={13} /> Resume</>}
                </button>
              )}
            </div>
            {error && <p className="text-xs text-rose-500">{error}</p>}
          </div>
        </motion.div>
      )}

      {/* ─── EVALUATING ─── */}
      {phase === "evaluating" && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 size={32} className="animate-spin text-indigo-500" />
          <p className="text-sm font-bold text-slate-700">AI is evaluating your answer…</p>
          <p className="text-xs text-slate-400">Analysing structure, keywords, and delivery</p>
        </div>
      )}

      {/* ─── REVIEW ─── */}
      {phase === "review" && currentScore && q && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-600">Answer Feedback</h3>
            <ScoreBreakdown score={currentScore} />
          </div>
          <div className="flex gap-3">
            <button onClick={nextQuestion} disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-colors">
              {loading ? <Loader2 size={13} className="animate-spin" /> : <ChevronRight size={13} />}
              {loading ? "Generating feedback…" : currentIdx + 1 >= questions.length ? "Finish & Get Report" : "Next Question"}
            </button>
          </div>
        </motion.div>
      )}

      {/* ─── COMPLETE ─── */}
      {phase === "complete" && sessionFeedback && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <div className={cn("bg-white rounded-2xl border-2 p-6 text-center space-y-3", READINESS_CONFIG[sessionFeedback.readinessLevel].bg)}>
            <div className="relative mx-auto w-20 h-20">
              <ScoreRing score={sessionFeedback.overallScore} size={80} strokeWidth={6} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={cn("text-2xl font-black", scoreColor(sessionFeedback.overallScore))}>{sessionFeedback.overallScore}</span>
              </div>
            </div>
            <p className={cn("text-lg font-black", READINESS_CONFIG[sessionFeedback.readinessLevel].color)}>
              {READINESS_CONFIG[sessionFeedback.readinessLevel].label}
            </p>
            <p className="text-sm text-slate-600">{sessionFeedback.summary}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Top Strengths</p>
              {sessionFeedback.topStrengths.map((s, i) => (
                <div key={i} className="flex items-start gap-2"><Star size={11} className="text-emerald-500 mt-0.5 shrink-0" /><span className="text-xs text-slate-700">{s}</span></div>
              ))}
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-rose-600">Areas to Improve</p>
              {sessionFeedback.topImprovements.map((s, i) => (
                <div key={i} className="flex items-start gap-2"><TrendingUp size={11} className="text-amber-500 mt-0.5 shrink-0" /><span className="text-xs text-slate-700">{s}</span></div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Next Steps</p>
            {sessionFeedback.nextSteps.map((s, i) => (
              <div key={i} className="flex items-start gap-2"><ChevronRight size={11} className="text-indigo-400 mt-0.5 shrink-0" /><span className="text-xs text-slate-700">{s}</span></div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Question-by-Question</p>
            {answers.map((a, i) => (
              <div key={i} className={cn("flex items-center gap-3 p-3 rounded-xl border", scoreBg(a.score?.overall || 0))}>
                <div className="relative shrink-0">
                  <ScoreRing score={a.score?.overall || 0} size={36} strokeWidth={3} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={cn("text-[10px] font-black", scoreColor(a.score?.overall || 0))}>{a.score?.overall || 0}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-700 line-clamp-2 flex-1">{a.questionText}</p>
                <span className="text-[10px] text-slate-400 shrink-0">{fmtSecs(a.durationSeconds)}</span>
              </div>
            ))}
          </div>

          <button onClick={restart}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-colors">
            <RotateCcw size={13} /> Start New Session
          </button>
        </motion.div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Question Bank Tab
// ─────────────────────────────────────────────────────────────────────────────

const QuestionBankTab: React.FC = () => {
  const [questions, setQuestions] = useState<PrepQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState({ type: "all", difficulty: "all", industry: "Technology" });
  const [genConfig, setGenConfig] = useState({ role: "Software Engineer", count: "5" });
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { questions: qs } = await fetchQuestions({
        type: filter.type === "all" ? undefined : filter.type,
        difficulty: filter.difficulty === "all" ? undefined : filter.difficulty,
        industry: filter.industry,
        limit: 24,
      });
      setQuestions(qs);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleGenerate = async () => {
    setGenerating(true); setError(null);
    try {
      const qs = await generateQuestions({
        industry: filter.industry, role: genConfig.role,
        type: filter.type === "all" ? "mixed" : filter.type,
        count: parseInt(genConfig.count, 10),
      });
      setQuestions(prev => [...qs, ...prev]);
    } catch (e: any) { setError(e.message); }
    finally { setGenerating(false); }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <div className="flex flex-wrap gap-2 items-end">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Type</label>
            <select value={filter.type} onChange={e => setFilter(f => ({ ...f, type: e.target.value }))}
              className="px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400 bg-white">
              {["all", "behavioral", "technical", "situational", "culture"].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Difficulty</label>
            <select value={filter.difficulty} onChange={e => setFilter(f => ({ ...f, difficulty: e.target.value }))}
              className="px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400 bg-white">
              {["all", "easy", "medium", "hard"].map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Industry</label>
            <select value={filter.industry} onChange={e => setFilter(f => ({ ...f, industry: e.target.value }))}
              className="px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400 bg-white">
              {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-3 items-end flex-wrap">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Role for generation</label>
            <input value={genConfig.role} onChange={e => setGenConfig(g => ({ ...g, role: e.target.value }))}
              className="px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Count</label>
            <select value={genConfig.count} onChange={e => setGenConfig(g => ({ ...g, count: e.target.value }))}
              className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white outline-none">
              {["3", "4", "5", "6"].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button onClick={handleGenerate} disabled={generating}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-colors">
            {generating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            {generating ? "Generating…" : "Generate AI Questions"}
          </button>
        </div>
        {error && <p className="text-xs text-rose-500">{error}</p>}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-indigo-400" /></div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-slate-400">{questions.length} questions in {filter.industry}</p>
          {questions.map(q => (
            <div key={q.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <button onClick={() => setExpanded(expanded === q.id ? null : q.id)}
                className="w-full flex items-start gap-4 p-4 hover:bg-slate-50 text-left transition-colors">
                <div className="flex gap-1.5 flex-wrap shrink-0">
                  <span className={cn("px-2 py-0.5 rounded-lg text-[9px] font-black uppercase", typeBadge(q.type))}>{q.type}</span>
                  <span className={cn("px-2 py-0.5 rounded-lg text-[9px] font-black uppercase", diffBadge(q.difficulty))}>{q.difficulty}</span>
                </div>
                <p className="text-sm text-slate-800 flex-1 font-medium">{q.text}</p>
                {expanded === q.id ? <ChevronDown size={14} className="text-slate-400 shrink-0 mt-0.5" /> : <ChevronRight size={14} className="text-slate-400 shrink-0 mt-0.5" />}
              </button>
              <AnimatePresence>
                {expanded === q.id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-slate-100">
                    <div className="p-4 space-y-3">
                      {q.hints.length > 0 && (
                        <div>
                          <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Hints</p>
                          {q.hints.map((h, i) => <p key={i} className="text-xs text-slate-600">• {h}</p>)}
                        </div>
                      )}
                      {q.expectedKeywords.length > 0 && (
                        <div>
                          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1.5">Expected Keywords</p>
                          <div className="flex flex-wrap gap-1.5">
                            {q.expectedKeywords.map(k => <span key={k} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-lg text-[10px]">{k}</span>)}
                          </div>
                        </div>
                      )}
                      {q.sampleAnswer && (
                        <div className="p-3 bg-slate-50 rounded-xl">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Sample Answer Outline</p>
                          <p className="text-xs text-slate-700">{q.sampleAnswer}</p>
                        </div>
                      )}
                      {q.followUps.length > 0 && (
                        <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Likely Follow-ups</p>
                          {q.followUps.map((f, i) => <p key={i} className="text-xs text-slate-500 italic">→ {f}</p>)}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Video Lab Tab
// ─────────────────────────────────────────────────────────────────────────────

const VideoLabTab: React.FC<{ defaultRole?: string }> = ({ defaultRole }) => {
  const [role, setRole] = useState(defaultRole || "Software Engineer");
  const [question, setQuestion] = useState("Tell me about yourself and why you're interested in this role.");
  const [analysis, setAnalysis] = useState<VideoAnalysis | null>(null);
  const [analysing, setAnalysing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const [recordDuration, setRecordDuration] = useState(0);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);

  const recorder = useVideoRecorder();
  const speech = useSpeechRecognition();

  const handleStartRecording = () => {
    recorder.startRecording();
    speech.reset();
    speech.start();
    setTimer(0); setAnalysis(null);
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
  };

  const handleStopRecording = () => {
    recorder.stopRecording();
    speech.stop();
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setRecordDuration(Math.round((Date.now() - startTimeRef.current) / 1000));
  };

  useEffect(() => {
    if (recorder.recordedBlob) {
      const url = URL.createObjectURL(recorder.recordedBlob);
      setPlaybackUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [recorder.recordedBlob]);

  const handleAnalyse = async () => {
    const transcript = speech.transcript.trim();
    if (!transcript) { setError("No speech detected. Please record with your microphone enabled."); return; }
    setAnalysing(true); setError(null);
    try {
      const result = await analyseVideoTranscript(transcript, recordDuration, role);
      setAnalysis(result);
    } catch (e: any) { setError(e.message); }
    finally { setAnalysing(false); }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Role</label>
            <input value={role} onChange={e => setRole(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Question to Answer</label>
            <input value={question} onChange={e => setQuestion(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Camera preview */}
        <div className="space-y-3">
          <div className="relative bg-slate-950 rounded-2xl overflow-hidden aspect-video">
            {recorder.isStreaming ? (
              <video ref={recorder.videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
            ) : playbackUrl ? (
              <video src={playbackUrl} controls className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <VideoOff size={36} className="text-slate-700" />
                <p className="text-xs text-slate-600">Camera preview</p>
              </div>
            )}
            {recorder.isRecording && (
              <div className="absolute top-3 left-3 flex items-center gap-2 px-2.5 py-1 bg-rose-600/90 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span className="text-[10px] font-black text-white uppercase">{fmtSecs(timer)}</span>
              </div>
            )}
          </div>

          {recorder.error && <p className="text-xs text-rose-500">{recorder.error}</p>}

          <div className="flex gap-2 flex-wrap">
            {!recorder.isStreaming ? (
              <button onClick={recorder.startStream}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-colors">
                <Camera size={12} /> Start Camera
              </button>
            ) : (
              <>
                {!recorder.isRecording ? (
                  <button onClick={handleStartRecording}
                    className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-colors">
                    <Video size={12} /> Record Answer
                  </button>
                ) : (
                  <button onClick={handleStopRecording}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-colors">
                    <Square size={12} /> Stop Recording
                  </button>
                )}
                <button onClick={recorder.stopStream}
                  className="px-4 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-black uppercase tracking-widest transition-colors">
                  Close Camera
                </button>
              </>
            )}
          </div>
        </div>

        {/* Transcript panel */}
        <div className="space-y-3">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 min-h-32 max-h-56 overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Live Transcript</p>
              {speech.isListening && (
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-[10px] font-black text-rose-600 uppercase">Recording</span>
                </div>
              )}
            </div>
            {speech.transcript
              ? <p className="text-sm text-slate-700 leading-relaxed">{speech.transcript}</p>
              : <p className="text-sm text-slate-400 italic">Your speech will appear here when recording…</p>
            }
          </div>

          <p className="text-xs font-bold text-slate-700">Question: <span className="font-normal text-slate-500">{question}</span></p>

          {recorder.recordedBlob && !analysing && (
            <button onClick={handleAnalyse}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-colors">
              <Brain size={13} /> Analyse with AI
            </button>
          )}
          {analysing && (
            <div className="flex items-center justify-center gap-2 py-4 text-slate-500">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-xs font-bold">Analysing speech and delivery…</span>
            </div>
          )}
          {error && <p className="text-xs text-rose-500">{error}</p>}
        </div>
      </div>

      {/* Analysis results */}
      {analysis && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-600">Video Analysis Report</h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Confidence", value: `${analysis.estimatedConfidence}%`, color: scoreColor(analysis.estimatedConfidence) },
              { label: "Pace (WPM)", value: analysis.speakingPaceWpm.toString(), color: analysis.speakingPaceWpm >= 130 && analysis.speakingPaceWpm <= 160 ? "text-emerald-600" : "text-amber-500" },
              { label: "Fillers", value: analysis.fillerWordCount.toString(), color: analysis.fillerWordCount <= 3 ? "text-emerald-600" : analysis.fillerWordCount <= 8 ? "text-amber-500" : "text-rose-500" },
              { label: "Duration", value: fmtSecs(recordDuration), color: "text-slate-700" },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center p-3 bg-slate-50 rounded-xl">
                <p className={cn("text-2xl font-black", color)}>{value}</p>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
              </div>
            ))}
          </div>

          {analysis.keyThemes.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-2">Key Themes Covered</p>
              <div className="flex flex-wrap gap-1.5">
                {analysis.keyThemes.map(t => <span key={t} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-medium">{t}</span>)}
              </div>
            </div>
          )}

          {analysis.suggestions.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-2">AI Suggestions</p>
              {analysis.suggestions.map((s, i) => (
                <div key={i} className="flex items-start gap-2 mb-2">
                  <Lightbulb size={11} className="text-amber-500 mt-0.5 shrink-0" />
                  <span className="text-xs text-slate-700">{s}</span>
                </div>
              ))}
            </div>
          )}

          <div className="p-3 bg-slate-50 rounded-xl">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Pacing Guide</p>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="absolute inset-y-0 left-[40%] right-[30%] bg-emerald-400 rounded-full opacity-50" />
                <div className="absolute inset-y-0 rounded-full bg-indigo-500"
                  style={{ left: `${Math.min((analysis.speakingPaceWpm / 250) * 100, 100)}%`, width: "4px" }} />
              </div>
            </div>
            <div className="flex justify-between text-[9px] text-slate-400 mt-1">
              <span>Too Slow (100)</span><span className="text-emerald-600">Ideal (130-160)</span><span>Too Fast (200+)</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Peer Practice Tab
// ─────────────────────────────────────────────────────────────────────────────

const PeerTab: React.FC<{ userId: string }> = ({ userId }) => {
  const [myRooms, setMyRooms] = useState<PeerSession[]>([]);
  const [roomCode, setRoomCode] = useState("");
  const [joinedSession, setJoinedSession] = useState<PeerSession | null>(null);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState({ role: "Software Engineer", industry: "Technology", sessionType: "behavioral" });

  useEffect(() => {
    getMyPeerSessions(userId).then(setMyRooms).catch(() => {});
  }, [userId]);

  const handleCreate = async () => {
    setCreating(true); setError(null);
    try {
      const session = await createPeerSession({ userId, ...config, questionIds: [] });
      setJoinedSession(session);
      setMyRooms(r => [session, ...r]);
    } catch (e: any) { setError(e.message); }
    finally { setCreating(false); }
  };

  const handleJoin = async () => {
    if (!roomCode.trim()) return;
    setJoining(true); setError(null);
    try {
      const session = await getPeerSession(roomCode.trim());
      setJoinedSession(session);
    } catch (e: any) { setError(e.message); }
    finally { setJoining(false); }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusBadge = (s: PeerSession["status"]) => {
    const m: Record<string, string> = { open: "bg-emerald-100 text-emerald-700", active: "bg-sky-100 text-sky-700", completed: "bg-slate-100 text-slate-500", expired: "bg-rose-100 text-rose-600" };
    return m[s] || m.open;
  };

  return (
    <div className="space-y-6">
      {joinedSession ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-white rounded-2xl border border-indigo-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-bold">Practice Room</p>
                <p className="text-3xl font-black text-slate-900 tracking-widest">{joinedSession.roomCode}</p>
              </div>
              <div className={cn("px-3 py-1.5 rounded-xl text-xs font-black uppercase border", statusBadge(joinedSession.status))}>
                {joinedSession.status}
              </div>
            </div>

            <p className="text-sm text-slate-600">Share this code with your practice partner. Valid for 24 hours.</p>

            <div className="flex gap-3">
              <button onClick={() => copyCode(joinedSession.roomCode)}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-black uppercase tracking-widest transition-colors">
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? "Copied!" : "Copy Code"}
              </button>
              <button onClick={() => setJoinedSession(null)}
                className="px-4 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-black uppercase tracking-widest transition-colors">
                Close
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Session Details</p>
              <div className="flex gap-4 text-xs text-slate-600">
                <span><strong>Role:</strong> {joinedSession.role}</span>
                <span><strong>Industry:</strong> {joinedSession.industry}</span>
                <span><strong>Type:</strong> {joinedSession.sessionType}</span>
              </div>
              <p className="text-[10px] text-slate-400">Expires: {new Date(joinedSession.expiresAt).toLocaleString()}</p>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Create room */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center"><Plus size={14} className="text-indigo-600" /></div>
              <h3 className="text-sm font-black text-slate-800">Create Room</h3>
            </div>

            <div className="space-y-3">
              <div className="space-y-1"><label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Role</label>
                <input value={config.role} onChange={e => setConfig(c => ({ ...c, role: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400" />
              </div>
              <div className="space-y-1"><label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Industry</label>
                <select value={config.industry} onChange={e => setConfig(c => ({ ...c, industry: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white outline-none">
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div className="space-y-1"><label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Session Type</label>
                <select value={config.sessionType} onChange={e => setConfig(c => ({ ...c, sessionType: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white outline-none">
                  {["behavioral", "technical", "mixed"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <button onClick={handleCreate} disabled={creating}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-colors">
              {creating ? <Loader2 size={12} className="animate-spin" /> : <Users size={12} />}
              {creating ? "Creating…" : "Create Practice Room"}
            </button>
          </div>

          {/* Join room */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center"><MessageSquare size={14} className="text-violet-600" /></div>
              <h3 className="text-sm font-black text-slate-800">Join Room</h3>
            </div>
            <p className="text-xs text-slate-500">Enter the 6-character room code shared by your partner.</p>
            <input value={roomCode} onChange={e => setRoomCode(e.target.value.toUpperCase())}
              placeholder="e.g. A3F7B2" maxLength={6}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xl font-black text-center tracking-widest outline-none focus:border-violet-400" />
            <button onClick={handleJoin} disabled={joining || roomCode.length < 6}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-colors">
              {joining ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
              {joining ? "Joining…" : "Join Room"}
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-rose-500">{error}</p>}

      {myRooms.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">My Sessions</p>
          {myRooms.map(s => (
            <div key={s.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4">
              <div className="font-black text-lg text-slate-700 tracking-widest">{s.roomCode}</div>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-700">{s.role} · {s.industry}</p>
                <p className="text-[10px] text-slate-400">{new Date(s.createdAt).toLocaleDateString()}</p>
              </div>
              <span className={cn("px-2 py-0.5 rounded-lg text-[10px] font-black uppercase", statusBadge(s.status))}>{s.status}</span>
              <button onClick={() => copyCode(s.roomCode)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <Copy size={12} className="text-slate-400" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// History Tab
// ─────────────────────────────────────────────────────────────────────────────

const HistoryTab: React.FC<{ userId: string }> = ({ userId }) => {
  const [sessions, setSessions] = useState<PrepSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserSessions(userId).then(setSessions).catch(() => {}).finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-indigo-400" /></div>;

  if (!sessions.length) return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
      <History size={40} className="text-slate-200" />
      <p className="text-sm font-medium">No sessions yet — complete your first interview above</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {sessions.map(s => {
        const rl = s.sessionFeedback?.readinessLevel;
        const cfg = rl ? READINESS_CONFIG[rl] : null;
        return (
          <div key={s.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
            {s.overallScore !== undefined && s.overallScore !== null ? (
              <div className="relative shrink-0">
                <ScoreRing score={s.overallScore} size={48} strokeWidth={4} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={cn("text-sm font-black", scoreColor(s.overallScore))}>{s.overallScore}</span>
                </div>
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                <Brain size={18} className="text-slate-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-slate-800 truncate">{s.role}</p>
              <p className="text-xs text-slate-500">{s.industry} · {s.sessionType}</p>
              {cfg && <span className={cn("text-[10px] font-black", cfg.color)}>{cfg.label}</span>}
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] text-slate-400">{new Date(s.createdAt).toLocaleDateString()}</p>
              {s.durationSeconds && <p className="text-[10px] text-slate-400">{fmtSecs(s.durationSeconds)}</p>}
              <span className={cn("text-[9px] font-black uppercase px-1.5 py-0.5 rounded",
                s.status === "completed" ? "bg-emerald-100 text-emerald-700" : s.status === "active" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"
              )}>{s.status}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

const InterviewPrepView: React.FC<Props> = ({ userId, defaultRole }) => {
  const [activeTab, setActiveTab] = useState<PrepTab>("simulator");

  const TABS: { id: PrepTab; label: string; icon: React.ElementType; description: string }[] = [
    { id: "simulator", label: "Simulator",     icon: Brain,         description: "AI-powered interview simulation with speech-to-text" },
    { id: "questions", label: "Question Bank", icon: BookOpen,      description: "Industry-specific questions with hints & model answers" },
    { id: "video",     label: "Video Lab",     icon: Video,         description: "Record, review and get AI analysis of your delivery" },
    { id: "peer",      label: "Peer Practice", icon: Users,         description: "Share a room code and practice with a partner" },
    { id: "history",   label: "History",       icon: History,       description: "Past sessions and progress tracking" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Brain size={18} className="text-violet-500" />
          <h1 className="text-xl font-black text-slate-900">Interview Preparation</h1>
          <span className="px-2 py-0.5 bg-violet-100 text-violet-700 text-[9px] font-black rounded-lg uppercase tracking-widest">AI-Powered</span>
        </div>
        <p className="text-sm text-slate-500">Simulate real interviews, analyse your delivery, and practise with peers.</p>
      </div>

      {/* Tab bar */}
      <div className="flex bg-slate-100 rounded-2xl p-1 gap-1 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={cn(
              "flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
              activeTab === t.id ? "bg-white text-violet-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}>
            <t.icon size={11} />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab description */}
      <p className="text-xs text-slate-400 -mt-2">{TABS.find(t => t.id === activeTab)?.description}</p>

      <AnimatePresence mode="wait">
        {activeTab === "simulator" && (
          <motion.div key="simulator" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <SimulatorTab userId={userId} defaultRole={defaultRole} />
          </motion.div>
        )}
        {activeTab === "questions" && (
          <motion.div key="questions" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <QuestionBankTab />
          </motion.div>
        )}
        {activeTab === "video" && (
          <motion.div key="video" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <VideoLabTab defaultRole={defaultRole} />
          </motion.div>
        )}
        {activeTab === "peer" && (
          <motion.div key="peer" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <PeerTab userId={userId} />
          </motion.div>
        )}
        {activeTab === "history" && (
          <motion.div key="history" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <HistoryTab userId={userId} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InterviewPrepView;

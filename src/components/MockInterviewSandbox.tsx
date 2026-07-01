/**
 * MockInterviewSandbox — AI Mock Interview with STAR-Method Coaching
 *
 * Takes a job posting, generates targeted questions, provides voice input
 * for live practice, and gives real-time STAR-method structural feedback.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Mic,
  MicOff,
  Play,
  Square,
  ChevronRight,
  Loader2,
  Sparkles,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Target,
  Clock,
  RotateCcw,
  Zap,
  Brain,
  MessageSquare,
  BarChart3,
  ArrowRight,
  Volume2,
} from "lucide-react";
import { cn } from "../lib/utils";
import {
  generateMockQuestions,
  evaluateSTAR,
  type MockInterviewQuestion,
  type STARFeedback,
} from "../services/interviewPrepService";

// ─── Props ──────────────────────────────────────────────────────────────────

interface Props {
  userId: string;
  defaultRole?: string;
  defaultCompany?: string;
  jobDescription?: string;
}

// ─── Speech Recognition Hook ────────────────────────────────────────────────

function useSpeechRecognition() {
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recogRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSupported(!!SpeechRec);
    if (!SpeechRec) return;

    const rec: any = new SpeechRec();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onresult = (e: any) => {
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript + " ";
      }
      if (final) setTranscript((t) => t + final);
    };
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);
    recogRef.current = rec;

    return () => { try { rec.stop(); } catch {} };
  }, []);

  const start = useCallback(() => {
    if (!recogRef.current) return;
    setTranscript("");
    try { recogRef.current.start(); } catch {}
    setIsListening(true);
  }, []);

  const stop = useCallback(() => {
    try { recogRef.current?.stop(); } catch {}
    setIsListening(false);
  }, []);

  const reset = useCallback(() => {
    stop();
    setTranscript("");
  }, [stop]);

  return { transcript, setTranscript, isListening, isSupported, start, stop, reset };
}

// ─── Audio Visualizer ───────────────────────────────────────────────────────

function AudioVisualizer({ isActive }: { isActive: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isActive) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      cancelAnimationFrame(animRef.current);
      return;
    }

    let active = true;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!active) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;

        const ctx = new AudioContext();
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        analyserRef.current = analyser;

        const draw = () => {
          if (!active || !canvasRef.current) return;
          const canvas = canvasRef.current;
          const cctx = canvas.getContext("2d");
          if (!cctx) return;

          const bufLen = analyser.frequencyBinCount;
          const data = new Uint8Array(bufLen);
          analyser.getByteFrequencyData(data);

          cctx.clearRect(0, 0, canvas.width, canvas.height);
          const barW = canvas.width / bufLen;
          const centerY = canvas.height / 2;

          for (let i = 0; i < bufLen; i++) {
            const h = (data[i] / 255) * centerY;
            const x = i * barW;
            const gradient = cctx.createLinearGradient(x, centerY - h, x, centerY + h);
            gradient.addColorStop(0, "#818cf8");
            gradient.addColorStop(1, "#6366f1");
            cctx.fillStyle = gradient;
            cctx.fillRect(x, centerY - h, barW - 1, h * 2);
          }

          animRef.current = requestAnimationFrame(draw);
        };
        draw();
      } catch {}
    })();

    return () => {
      active = false;
      cancelAnimationFrame(animRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [isActive]);

  return (
    <canvas
      ref={canvasRef}
      width={280}
      height={48}
      className="rounded-lg bg-slate-900/5"
    />
  );
}

// ─── Timer Hook ─────────────────────────────────────────────────────────────

function useTimer() {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const start = useCallback(() => {
    setSeconds(0);
    setRunning(true);
  }, []);

  const stop = useCallback(() => {
    setRunning(false);
    return seconds;
  }, [seconds]);

  const reset = useCallback(() => {
    setRunning(false);
    setSeconds(0);
  }, []);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const formatted = `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`;

  return { seconds, formatted, running, start, stop, reset };
}

// ─── STAR Score Ring ────────────────────────────────────────────────────────

function STARRing({ label, score, max, present }: { label: string; score: number; max: number; present: boolean }) {
  const pct = max > 0 ? Math.round((score / max) * 100) : 0;
  const color = present
    ? pct >= 80 ? "text-emerald-600" : pct >= 50 ? "text-amber-600" : "text-rose-500"
    : "text-slate-300";
  const bg = present
    ? pct >= 80 ? "bg-emerald-50 border-emerald-200" : pct >= 50 ? "bg-amber-50 border-amber-200" : "bg-rose-50 border-rose-200"
    : "bg-slate-50 border-slate-200";

  return (
    <div className={cn("rounded-xl border p-3 text-center", bg)}>
      <p className={cn("text-2xl font-black", color)}>{score}/{max}</p>
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mt-1">{label}</p>
      {!present && (
        <p className="text-[8px] text-rose-400 font-bold mt-0.5">Missing</p>
      )}
    </div>
  );
}

// ─── Phase Enum ─────────────────────────────────────────────────────────────

type Phase = "setup" | "generating" | "interview" | "evaluating" | "feedback";

// ─── Main Component ─────────────────────────────────────────────────────────

export default function MockInterviewSandbox({ userId, defaultRole, defaultCompany, jobDescription: initialJD }: Props) {
  // Setup state
  const [jd, setJd] = useState(initialJD || "");
  const [role, setRole] = useState(defaultRole || "");
  const [company, setCompany] = useState(defaultCompany || "");
  const [focus, setFocus] = useState<"behavioral" | "technical" | "mixed">("mixed");
  const [questionCount, setQuestionCount] = useState(5);

  // Interview state
  const [phase, setPhase] = useState<Phase>("setup");
  const [questions, setQuestions] = useState<MockInterviewQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<{ transcript: string; duration: number; feedback?: STARFeedback }[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Hooks
  const speech = useSpeechRecognition();
  const timer = useTimer();

  // ─── Generate Questions ─────────────────────────────────────────────────

  const handleStart = useCallback(async () => {
    if (!jd.trim() || !role.trim()) return;
    setPhase("generating");
    setError(null);
    try {
      const qs = await generateMockQuestions({
        jobDescription: jd,
        role,
        company: company || undefined,
        count: questionCount,
        focus,
      });
      setQuestions(qs);
      setCurrentIdx(0);
      setAnswers([]);
      setPhase("interview");
    } catch (err: any) {
      setError(err.message || "Failed to generate questions");
      setPhase("setup");
    }
  }, [jd, role, company, questionCount, focus]);

  // ─── Recording Controls ─────────────────────────────────────────────────

  const startRecording = useCallback(() => {
    speech.reset();
    timer.start();
    speech.start();
  }, [speech, timer]);

  const stopRecording = useCallback(() => {
    speech.stop();
    const duration = timer.stop();
    return { transcript: speech.transcript, duration };
  }, [speech, timer]);

  // ─── Submit Answer ──────────────────────────────────────────────────────

  const handleSubmitAnswer = useCallback(async () => {
    const { transcript, duration } = stopRecording();

    if (!transcript.trim()) {
      setError("No speech detected. Please try again.");
      return;
    }

    setPhase("evaluating");
    try {
      const feedback = await evaluateSTAR({
        question: questions[currentIdx].text,
        transcript,
        role,
        durationSeconds: duration,
      });

      setAnswers((prev) => [...prev, { transcript, duration, feedback }]);
      setPhase("feedback");
    } catch (err: any) {
      // Still save the answer even if evaluation fails
      setAnswers((prev) => [...prev, { transcript, duration }]);
      setError(err.message || "Evaluation failed");
      setPhase("feedback");
    }
  }, [stopRecording, questions, currentIdx, role]);

  // ─── Navigation ─────────────────────────────────────────────────────────

  const handleNextQuestion = useCallback(() => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((i) => i + 1);
      speech.reset();
      timer.reset();
      setError(null);
      setPhase("interview");
    }
  }, [currentIdx, questions.length, speech, timer]);

  const handleRestart = useCallback(() => {
    setPhase("setup");
    setQuestions([]);
    setCurrentIdx(0);
    setAnswers([]);
    speech.reset();
    timer.reset();
    setError(null);
  }, [speech, timer]);

  const currentQuestion = questions[currentIdx];
  const currentFeedback = answers[currentIdx]?.feedback;
  const isLastQuestion = currentIdx === questions.length - 1;

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-2 mb-1">
          <Brain size={16} className="text-amber-300" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-200">AI Mock Interview Sandbox</p>
        </div>
        <h2 className="text-lg font-black">Practice with JD-Targeted Questions & STAR Coaching</h2>
        <p className="text-xs text-violet-200 mt-1">
          Paste a job description → get realistic interview questions → practice with voice → get instant STAR-method feedback.
        </p>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 font-medium"
          >
            <AlertTriangle size={16} /> {error}
            <button className="ml-auto" onClick={() => setError(null)}><XCircle size={14} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PHASE: SETUP ── */}
      {phase === "setup" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Target size={14} className="text-indigo-500" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">Target Job Posting</p>
            </div>
            <textarea
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              rows={6}
              placeholder="Paste the full job description here…"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 resize-none"
            />
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Role *</label>
                <input
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="Senior Software Engineer"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-400"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Company</label>
                <input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Google"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-400"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Questions</label>
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-indigo-400"
                >
                  <option value={3}>3 questions</option>
                  <option value={5}>5 questions</option>
                  <option value={8}>8 questions</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Focus Area</label>
              <div className="flex gap-2">
                {(["mixed", "behavioral", "technical"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFocus(f)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                      focus === f
                        ? "bg-indigo-600 text-white border-indigo-700"
                        : "bg-white text-slate-600 border-slate-200 hover:border-indigo-200"
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleStart}
              disabled={!jd.trim() || !role.trim()}
              className="flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-200"
            >
              <Play size={14} /> Start Mock Interview
            </button>
          </div>
        </motion.div>
      )}

      {/* ── PHASE: GENERATING ── */}
      {phase === "generating" && (
        <div className="flex flex-col items-center py-20 gap-4 text-slate-500">
          <Loader2 size={44} className="text-indigo-500 animate-spin" />
          <p className="font-bold text-sm">Generating targeted interview questions…</p>
          <p className="text-xs text-slate-400">Analyzing job description for key competencies</p>
        </div>
      )}

      {/* ── PHASE: INTERVIEW ── */}
      {phase === "interview" && currentQuestion && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          {/* Progress */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-black uppercase">
                Question {currentIdx + 1}/{questions.length}
              </span>
              <span className={cn(
                "px-2 py-1 rounded-lg text-[9px] font-black uppercase",
                currentQuestion.type === "behavioral" ? "bg-violet-100 text-violet-700" :
                currentQuestion.type === "technical" ? "bg-blue-100 text-blue-700" :
                currentQuestion.type === "architectural" ? "bg-rose-100 text-rose-700" :
                "bg-amber-100 text-amber-700"
              )}>
                {currentQuestion.type}
              </span>
              <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase">
                {currentQuestion.difficulty}
              </span>
            </div>
            <button onClick={handleRestart} className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
              <RotateCcw size={12} /> Restart
            </button>
          </div>

          {/* Question Card */}
          <div className="bg-white rounded-2xl border-2 border-indigo-200 p-6 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                <MessageSquare size={16} className="text-indigo-600" />
              </div>
              <div>
                <p className="text-base font-bold text-slate-900 leading-relaxed">{currentQuestion.text}</p>
                <p className="text-xs text-slate-500 mt-2 italic">{currentQuestion.context}</p>
              </div>
            </div>
            {currentQuestion.expectedTopics.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mr-1">Expected topics:</span>
                {currentQuestion.expectedTopics.map((t) => (
                  <span key={t} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-medium rounded-md">{t}</span>
                ))}
              </div>
            )}
          </div>

          {/* Voice Input Area */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={speech.isListening ? handleSubmitAnswer : startRecording}
                  className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg",
                    speech.isListening
                      ? "bg-rose-500 hover:bg-rose-600 shadow-rose-200 animate-pulse"
                      : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-200"
                  )}
                >
                  {speech.isListening ? <Square size={20} className="text-white" /> : <Mic size={20} className="text-white" />}
                </button>
                <div>
                  <p className="text-xs font-bold text-slate-700">
                    {speech.isListening ? "Recording… Click to stop & evaluate" : "Click to start speaking"}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {speech.isSupported ? "Voice recognition active" : "Type your answer below"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <AudioVisualizer isActive={speech.isListening} />
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-lg">
                  <Clock size={12} className="text-slate-500" />
                  <span className="text-sm font-mono font-bold text-slate-700">{timer.formatted}</span>
                </div>
              </div>
            </div>

            {/* Transcript display */}
            <div className="min-h-[100px] max-h-[200px] overflow-y-auto p-4 bg-slate-50 rounded-xl border border-slate-100">
              {speech.transcript ? (
                <p className="text-sm text-slate-700 leading-relaxed">{speech.transcript}</p>
              ) : (
                <p className="text-sm text-slate-300 italic">Your answer will appear here as you speak…</p>
              )}
            </div>

            {/* Manual text input fallback */}
            {!speech.isSupported && (
              <textarea
                value={speech.transcript}
                onChange={(e) => speech.setTranscript(e.target.value)}
                rows={4}
                placeholder="Type your answer here…"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-400 resize-none"
              />
            )}

            {/* Submit typed answer */}
            {!speech.isListening && speech.transcript && (
              <div className="flex justify-end">
                <button
                  onClick={handleSubmitAnswer}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  <Sparkles size={13} /> Evaluate My Answer
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ── PHASE: EVALUATING ── */}
      {phase === "evaluating" && (
        <div className="flex flex-col items-center py-20 gap-4 text-slate-500">
          <Loader2 size={44} className="text-violet-500 animate-spin" />
          <p className="font-bold text-sm">Analyzing your answer with STAR-method framework…</p>
          <p className="text-xs text-slate-400">Checking structure, metrics, and clarity</p>
        </div>
      )}

      {/* ── PHASE: FEEDBACK ── */}
      {phase === "feedback" && currentFeedback && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          {/* Overall Score */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-6 flex-wrap">
              <div className="text-center">
                <p className={cn(
                  "text-5xl font-black",
                  currentFeedback.overall >= 75 ? "text-emerald-600" :
                  currentFeedback.overall >= 50 ? "text-amber-600" : "text-rose-600"
                )}>
                  {currentFeedback.overall}
                </p>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mt-1">Overall Score</p>
              </div>
              <div className="flex-1 grid grid-cols-4 gap-3">
                <STARRing label="Situation" score={currentFeedback.situation.score} max={25} present={currentFeedback.situation.present} />
                <STARRing label="Task" score={currentFeedback.task.score} max={25} present={currentFeedback.task.present} />
                <STARRing label="Action" score={currentFeedback.action.score} max={25} present={currentFeedback.action.present} />
                <STARRing label="Result" score={currentFeedback.result.score} max={25} present={currentFeedback.result.present} />
              </div>
            </div>
          </div>

          {/* STAR Detail Feedback */}
          <div className="grid sm:grid-cols-2 gap-3">
            {(["situation", "task", "action", "result"] as const).map((key) => {
              const item = currentFeedback[key];
              return (
                <div key={key} className={cn(
                  "rounded-xl border p-4",
                  item.present ? "bg-white border-slate-200" : "bg-rose-50 border-rose-200"
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    {item.present ? <CheckCircle size={14} className="text-emerald-500" /> : <XCircle size={14} className="text-rose-500" />}
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">{key}</p>
                    <span className="ml-auto text-xs font-bold text-slate-500">{item.score}/25</span>
                  </div>
                  <p className="text-xs text-slate-600">{item.feedback}</p>
                </div>
              );
            })}
          </div>

          {/* Metrics & Quantification */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <BarChart3 size={14} className="text-indigo-500" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">Metrics & Quantification</p>
              <span className={cn(
                "ml-2 px-2 py-0.5 rounded-md text-[9px] font-black uppercase",
                currentFeedback.metrics.hasQuantification
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-rose-100 text-rose-700"
              )}>
                {currentFeedback.metrics.hasQuantification ? "Numbers Present" : "No Metrics Found"}
              </span>
            </div>
            {currentFeedback.metrics.suggestions.length > 0 && (
              <ul className="space-y-1">
                {currentFeedback.metrics.suggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                    <ArrowRight size={10} className="text-indigo-400 mt-0.5 shrink-0" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Vague Language */}
          {currentFeedback.vagueLanguage?.length > 0 && (
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5 space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} className="text-amber-600" />
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-800">Vague Language Detected</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {currentFeedback.vagueLanguage.map((v, i) => (
                  <span key={i} className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[11px] font-bold rounded-lg border border-amber-200">
                    "{v}"
                  </span>
                ))}
              </div>
              <p className="text-xs text-amber-700">Replace these with specific actions, numbers, and outcomes.</p>
            </div>
          )}

          {/* Strengths & Improvements */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-emerald-200 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 mb-2 flex items-center gap-1.5">
                <CheckCircle size={12} /> Strengths
              </p>
              <ul className="space-y-1">
                {currentFeedback.strengths?.map((s, i) => (
                  <li key={i} className="text-xs text-slate-700 flex items-start gap-2">
                    <Zap size={10} className="text-emerald-400 mt-0.5 shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-xl border border-rose-200 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-rose-700 mb-2 flex items-center gap-1.5">
                <Target size={12} /> Improvements
              </p>
              <ul className="space-y-1">
                {currentFeedback.improvements?.map((s, i) => (
                  <li key={i} className="text-xs text-slate-700 flex items-start gap-2">
                    <ArrowRight size={10} className="text-rose-400 mt-0.5 shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Rewritten Answer */}
          {currentFeedback.rewrittenAnswer && (
            <div className="bg-indigo-50 rounded-2xl border border-indigo-200 p-5 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-indigo-600" />
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-700">Ideal STAR Answer</p>
              </div>
              <p className="text-sm text-indigo-900 leading-relaxed italic">"{currentFeedback.rewrittenAnswer}"</p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleRestart}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              <RotateCcw size={12} /> Start Over
            </button>
            {!isLastQuestion ? (
              <button
                onClick={handleNextQuestion}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-200"
              >
                Next Question <ChevronRight size={14} />
              </button>
            ) : (
              <div className="flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest">
                <CheckCircle size={14} /> Session Complete
              </div>
            )}
          </div>

          {/* Follow-up hint */}
          {currentQuestion?.followUp && (
            <div className="bg-slate-50 rounded-xl border border-slate-100 p-3 flex items-start gap-2">
              <Volume2 size={12} className="text-slate-400 mt-0.5 shrink-0" />
              <p className="text-[10px] text-slate-500">
                <span className="font-bold">Likely follow-up:</span> "{currentQuestion.followUp}"
              </p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

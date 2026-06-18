import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Mic, MicOff, Send, MessageSquare, 
  Target, Award, History, TrendingUp, 
  ChevronRight, Brain, AlertCircle, CheckCircle2, Sparkles,
  Trophy, Flame, BarChart3, Layout, Info, Globe,
  Map as MapIcon, Video, VideoOff, Activity, 
  Zap, Search, BookOpen, Quote, RotateCcw
} from 'lucide-react';
import { cn } from '../lib/utils';
import { InterviewQuestion, QuestionTier, InterviewFeedback, InterviewStats, EtiquetteInsight } from '../types/interview';
import { generateInterviewQuestions, evaluateInterviewAnswer, getLocalizedEtiquette } from '../services/interviewService';

// --- Sub-Components ---

interface InterviewHotSeatProps {
  isOpen: boolean;
  onClose: () => void;
  role: string;
  location?: string;
  company?: string;
  onStatsUpdate?: (stats: InterviewStats) => void;
}

const WebcamPreview = ({ isStreaming }: { isStreaming: boolean }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (isStreaming) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          if (videoRef.current) videoRef.current.srcObject = stream;
        })
        .catch(() => setHasError(true));
    } else {
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
    }
  }, [isStreaming]);

  return (
    <div className="relative w-full aspect-video bg-slate-900 rounded-[2rem] overflow-hidden border border-slate-800 shadow-2xl">
      {isStreaming && !hasError ? (
        <video 
          ref={videoRef} 
          autoPlay 
          muted 
          playsInline 
          className="w-full h-full object-cover scale-x-[-1]" 
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center space-y-4 bg-slate-950">
          <VideoOff size={48} className="text-slate-800" />
          <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Simulation Feed Offline</p>
        </div>
      )}
      <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 bg-rose-600/20 border border-rose-500/30 rounded-full">
         <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
         <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest">Live Simulation</span>
      </div>
      <div className="absolute bottom-4 right-4 flex gap-2">
         <div className="px-2 py-1 bg-slate-900/80 backdrop-blur-md rounded-lg border border-slate-800">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">HD Stream: 2026.04</p>
         </div>
      </div>
    </div>
  );
};

const AudioVisualizer = ({ isRecording }: { isRecording: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const requestRef = useRef<number>(0);

  useEffect(() => {
    if (isRecording) {
      const startAudio = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyzerRef.current = audioCtxRef.current.createAnalyser();
        const source = audioCtxRef.current.createMediaStreamSource(stream);
        source.connect(analyzerRef.current);
        analyzerRef.current.fftSize = 256;
        
        const bufferLength = analyzerRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const draw = () => {
          if (!canvasRef.current || !analyzerRef.current) return;
          const ctx = canvasRef.current.getContext('2d');
          if (!ctx) return;

          const width = canvasRef.current.width;
          const height = canvasRef.current.height;
          analyzerRef.current.getByteFrequencyData(dataArray);

          ctx.clearRect(0, 0, width, height);
          
          const barWidth = (width / bufferLength) * 2.5;
          let x = 0;

          for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * height;
            
            ctx.fillStyle = `rgba(99, 102, 241, ${0.2 + (dataArray[i] / 255) * 0.8})`;
            ctx.fillRect(x, height - barHeight, barWidth, barHeight);
            
            x += barWidth + 1;
          }
          requestRef.current = requestAnimationFrame(draw);
        };
        draw();
      };
      startAudio();
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      audioCtxRef.current?.close();
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isRecording]);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-8 opacity-50" 
      width={400} 
      height={32} 
    />
  );
};

// --- Main Interface ---

export const InterviewHotSeat = ({ isOpen, onClose, role, location, company, onStatsUpdate }: InterviewHotSeatProps) => {
  const [step, setStep] = useState<'intro' | 'active' | 'feedback' | 'summary'>('intro');
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [etiquetteInsights, setEtiquetteInsights] = useState<EtiquetteInsight[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedbacks, setFeedbacks] = useState<InterviewFeedback[]>([]);
  const [stats, setStats] = useState<InterviewStats>({
    fieldReadiness: 65,
    streakCount: 3,
    badges: [],
    questionsAnswered: 12
  });
  
  // Real-time telemetry states
  const [speechConfidence, setSpeechConfidence] = useState(0);
  const [matchedWords, setMatchedWords] = useState<string[]>([]);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen && questions.length === 0) {
      loadQuestions();
      if (location) loadEtiquette();
    }
  }, [isOpen, role, company, location]);

  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        setSpeechConfidence(prev => {
          const change = Math.random() * 20 - 10;
          return Math.max(40, Math.min(95, prev + change));
        });
      }, 2000);
      return () => clearInterval(interval);
    } else {
      setSpeechConfidence(0);
    }
  }, [isRecording]);

  const loadQuestions = async () => {
    setIsLoading(true);
    try {
      const q = await generateInterviewQuestions(role, company);
      setQuestions(Array.isArray(q) ? q : []);
    } catch (error) {
      console.error("Failed to load questions");
    } finally {
      setIsLoading(false);
    }
  };

  const loadEtiquette = async () => {
    if (!location) return;
    try {
      const insights = await getLocalizedEtiquette(location, role);
      setEtiquetteInsights(Array.isArray(insights) ? insights : []);
    } catch (error) {
      console.error("Failed to load etiquette");
    }
  };

  const startInterview = () => {
    setStep('active');
    setCurrentQuestionIndex(0);
    setFeedbacks([]);
    setMatchedWords([]);
  };

  const toggleRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript.toLowerCase();
          if (event.results[i].isFinal) {
            setAnswer(prev => prev + event.results[i][0].transcript + ' ');
            // Check for keywords
            const target = questions[currentQuestionIndex].targetKeywords || [];
            target.forEach(kw => {
               if (transcript.includes(kw.toLowerCase()) && !matchedWords.includes(kw)) {
                 setMatchedWords(prev => [...prev, kw]);
               }
            });
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
      };

      recognitionRef.current.onend = () => setIsRecording(false);
      recognitionRef.current.start();
      setIsRecording(true);
      setSpeechConfidence(75);
    }
  };

  const handleNextQuestion = async () => {
    if (!answer.trim()) return;

    setIsLoading(true);
    try {
      const feedback = await evaluateInterviewAnswer(questions[currentQuestionIndex].text, answer);
      // Ensure keywords are tracked in final feedback
      setFeedbacks(prev => [...prev, { ...feedback, matchedKeywords: matchedWords }]);
      
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setAnswer('');
        setMatchedWords([]);
      } else {
        setStep('summary');
        const newReadiness = Math.min(100, stats.fieldReadiness + 5);
        const updatedStats = {
          ...stats,
          fieldReadiness: newReadiness,
          questionsAnswered: stats.questionsAnswered + questions.length,
          streakCount: stats.streakCount + 1
        };
        setStats(updatedStats);
        onStatsUpdate?.(updatedStats);
      }
    } catch (error) {
      console.error("Failed to evaluate answer");
    } finally {
      setIsLoading(false);
    }
  };

  const activeQuestion = questions[currentQuestionIndex];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 lg:p-8"
      >
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-2xl transition-all z-[60]"
        >
          <X size={24} />
        </button>

        <div className="w-full max-w-7xl max-h-[95vh] overflow-y-auto relative scrollbar-hide">
          {step === 'intro' && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center space-y-12 py-12"
            >
              <div className="space-y-4">
                <div className="w-24 h-24 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-indigo-600/40 animate-pulse relative">
                   <div className="absolute inset-0 bg-indigo-500 rounded-3xl blur-2xl opacity-20" />
                   <Brain size={48} className="text-white relative z-10" />
                </div>
                <h2 className="text-5xl font-black text-white tracking-tighter uppercase italic">The Hot Seat</h2>
                <p className="text-slate-400 text-lg max-w-md mx-auto leading-relaxed font-medium">
                  Step into the high-frequency simulation. Spark.E will challenge your technical depth and cultural alignment for <span className="text-indigo-400 font-bold underline decoration-indigo-500/50 underline-offset-4">{role}</span>.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-[2.5rem] text-left space-y-4 hover:border-emerald-500/30 transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Target size={24} className="text-emerald-400" />
                  </div>
                  <h4 className="text-sm font-black text-white uppercase tracking-widest">3-Tier Logic</h4>
                  <p className="text-[11px] text-slate-500 uppercase leading-relaxed font-bold">Universal, Role, and Company alignment checks optimized for 2026 hiring shifts.</p>
                </div>
                <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-[2.5rem] text-left space-y-4 hover:border-blue-500/30 transition-all group">
                   <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Award size={24} className="text-blue-400" />
                  </div>
                  <h4 className="text-sm font-black text-white uppercase tracking-widest">STAR Telemetry</h4>
                  <p className="text-[11px] text-slate-500 uppercase leading-relaxed font-bold">Real-time analysis of your situation structure and narrative confidence levels.</p>
                </div>
                <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-[2.5rem] text-left space-y-4 hover:border-indigo-500/30 transition-all group">
                   <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Video size={24} className="text-indigo-400" />
                  </div>
                  <h4 className="text-sm font-black text-white uppercase tracking-widest">Sim-Mode Active</h4>
                  <p className="text-[11px] text-slate-500 uppercase leading-relaxed font-bold">Pro-grade environment with live feed and behavioral sentiment tracking engines.</p>
                </div>
              </div>

              {location && etiquetteInsights.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="max-w-3xl mx-auto p-10 bg-indigo-600/[0.03] border border-indigo-500/20 rounded-[3rem] text-left space-y-8 backdrop-blur-md"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/30">
                       <Globe size={24} />
                    </div>
                    <div>
                       <h4 className="text-sm font-black text-white uppercase tracking-[0.3em] italic">Localized Protocol {location}</h4>
                       <p className="text-[10px] text-indigo-400/60 font-black uppercase tracking-widest">Spark.E Cultural Synchronization Engine</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {etiquetteInsights.map((insight, idx) => (
                      <div key={idx} className="space-y-3 p-4 bg-slate-950/50 rounded-2xl border border-slate-800/50">
                         <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black text-indigo-400 uppercase tracking-tighter">{insight.category}</span>
                            <span className={cn(
                              "text-[9px] px-2 py-0.5 rounded uppercase font-black tracking-widest",
                              insight.importance === 'High' ? "bg-rose-500/20 text-rose-400" : "bg-blue-500/20 text-blue-400"
                            )}>{insight.importance} PRIORITY</span>
                         </div>
                         <p className="text-[11px] text-slate-400 leading-relaxed font-medium">"{insight.insight}"</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              <button 
                onClick={startInterview}
                disabled={isLoading}
                className="group px-16 py-6 bg-indigo-600 text-white rounded-[2rem] text-xl font-black uppercase tracking-[0.2em] hover:bg-slate-50 hover:text-slate-950 transition-all shadow-2xl shadow-indigo-600/20 active:scale-95 disabled:opacity-50 ring-4 ring-indigo-500/20 flex items-center gap-4 mx-auto"
              >
                {isLoading ? "Synchronizing Context..." : (
                  <>
                    <Activity size={24} className="group-hover:text-indigo-600" />
                    Enter Simulation
                  </>
                )}
              </button>
            </motion.div>
          )}

          {step === 'active' && activeQuestion && (
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Left Column: Simulation Feed */}
              <div className="lg:col-span-5 space-y-6">
                <WebcamPreview isStreaming={true} />
                
                <div className="p-8 bg-slate-900/80 border border-slate-800 rounded-[2.5rem] space-y-6 relative overflow-hidden backdrop-blur-md">
                   <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Zap size={120} className="text-white" />
                   </div>
                   
                   <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-xl bg-indigo-600/20 flex items-center justify-center">
                            <Activity size={16} className="text-indigo-400" />
                         </div>
                         <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Speech Telemetry</h4>
                      </div>
                      <div className="px-2 py-0.5 bg-emerald-500/10 rounded-md border border-emerald-500/20">
                         <span className="text-[8px] font-black text-emerald-400 uppercase">Synchronized</span>
                      </div>
                   </div>

                   <div className="space-y-6 relative z-10">
                      <div className="space-y-2">
                         <div className="flex justify-between items-end">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Confidence Meter</span>
                            <span className={cn(
                              "text-xs font-black",
                              speechConfidence > 80 ? "text-emerald-400" : speechConfidence > 50 ? "text-indigo-400" : "text-rose-400"
                            )}>{speechConfidence}%</span>
                         </div>
                         <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                            <motion.div 
                              className={cn(
                                "h-full transition-all duration-500",
                                speechConfidence > 80 ? "bg-emerald-500" : speechConfidence > 50 ? "bg-indigo-500" : "bg-rose-500"
                              )}
                              initial={{ width: 0 }}
                              animate={{ width: `${speechConfidence}%` }}
                            />
                         </div>
                      </div>

                      <div className="space-y-3">
                         <span className="text-[10px] font-bold text-slate-500 uppercase">Keyword Alignment</span>
                         <div className="flex flex-wrap gap-2">
                            {activeQuestion.targetKeywords?.map((kw, idx) => (
                              <div 
                                key={idx} 
                                className={cn(
                                  "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter transition-all border",
                                  matchedWords.includes(kw) 
                                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 scale-105" 
                                    : "bg-slate-950 text-slate-600 border-slate-800"
                                )}
                              >
                                {kw}
                              </div>
                            ))}
                         </div>
                      </div>
                      
                      <AudioVisualizer isRecording={isRecording} />
                   </div>
                </div>
              </div>

              {/* Right Column: Interaction Hub */}
              <div className="lg:col-span-7 space-y-6">
                <div className="p-10 bg-slate-900 border border-slate-800 rounded-[3rem] space-y-12 relative overflow-hidden backdrop-blur-md shadow-2xl">
                  <div className="absolute top-10 right-10">
                    <div className={cn(
                      "px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                      activeQuestion.tier === QuestionTier.BEHAVIORAL ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" : 
                      activeQuestion.tier === QuestionTier.ROLE_SPECIFIC ? "text-blue-400 border-blue-500/20 bg-blue-500/5" : "text-rose-400 border-rose-500/20 bg-rose-500/5"
                    )}>
                      {activeQuestion.tier} Protocol
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
                         <Sparkles size={20} />
                      </div>
                      <div>
                        <p className="text-[11px] font-black text-indigo-400 uppercase tracking-widest">Spark.E Intelligence Feed</p>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">Question {currentQuestionIndex + 1} of {questions.length}</p>
                      </div>
                    </div>
                    <h3 className="text-3xl font-bold text-white leading-tight pr-20 italic">
                      "{activeQuestion.text}"
                    </h3>
                  </div>

                  <div className="space-y-6">
                    <div className="relative group">
                      <textarea 
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="Establish Scenario context..."
                        className="w-full h-56 bg-slate-950/50 border border-slate-800 rounded-[2.5rem] p-10 text-lg text-slate-200 placeholder:text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all resize-none font-medium leading-relaxed"
                      />
                      <div className="absolute right-8 bottom-8 flex gap-4">
                         <button 
                           onClick={toggleRecording}
                           className={cn(
                             "w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-xl",
                             isRecording ? "bg-rose-500 text-white animate-pulse" : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
                           )}
                         >
                           {isRecording ? <MicOff size={24} /> : <Mic size={24} />}
                         </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-8 bg-indigo-600/[0.03] border border-indigo-500/20 rounded-[2.5rem]">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                            <Layout size={20} className="text-indigo-400" />
                         </div>
                         <div>
                           <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest underline decoration-indigo-500/30">STAR Framework Helper</p>
                           <p className="text-[11px] text-slate-500 font-bold">Recommended: <span className="text-white">Situation {'>'} Task {'>'} Action {'>'} Result</span></p>
                         </div>
                      </div>
                      <button 
                        onClick={handleNextQuestion}
                        disabled={isLoading || !answer.trim()}
                        className="group flex items-center gap-3 px-10 py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-30 disabled:grayscale"
                      >
                        {isLoading ? "Analyzing Vector..." : currentQuestionIndex === questions.length - 1 ? "Finalize Simulation" : "Next Protocol"}
                        <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   {activeQuestion.tips?.slice(0, 2).map((tip, idx) => (
                     <div key={idx} className="p-6 bg-slate-900/30 border border-slate-800 rounded-3xl flex items-start gap-4">
                        <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                           <Search size={14} className="text-slate-500" />
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-tighter">Strategic Insight</p>
                           <p className="text-[11px] text-slate-400 leading-relaxed font-medium italic">"{tip}"</p>
                        </div>
                     </div>
                   ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === 'summary' && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="space-y-12 py-12 px-6 lg:px-12"
            >
              <div className="text-center space-y-6">
                 <div className="w-24 h-24 bg-emerald-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/30 relative">
                    <div className="absolute inset-0 bg-emerald-400 rounded-[2rem] blur-xl opacity-30" />
                    <Trophy size={48} className="text-white relative z-10" />
                 </div>
                 <div className="space-y-2">
                    <h2 className="text-5xl font-black text-white uppercase tracking-tighter italic">Simulation Debrief</h2>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-[10px]">Intelligence Post-Processing Complete</p>
                 </div>
                 <p className="text-slate-400 max-w-xl mx-auto leading-relaxed text-lg font-medium">Spark.E has completed the vector analysis of your performance. Your professional readiness index and behavioral markers have been synchronized.</p>
              </div>

              {/* High-Level Intelligence Feed */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                 {[
                   { label: 'Readiness Index', val: `${stats.fieldReadiness}%`, icon: BarChart3, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
                   { label: 'Session Consistency', val: `${stats.streakCount}D Streak`, icon: Flame, color: 'text-rose-400', bg: 'bg-rose-500/10' },
                   { label: 'Answer Impact', val: `Top 5%`, icon: Award, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                   { label: 'Questions Solved', val: stats.questionsAnswered, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' }
                 ].map((metric, i) => (
                    <div key={i} className="p-8 bg-slate-900 border border-slate-800 rounded-[2.5rem] space-y-4 hover:border-slate-700 transition-colors shadow-xl">
                      <div className="flex items-center justify-between">
                         <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", metric.bg)}>
                            <metric.icon size={20} className={metric.color} />
                         </div>
                         <span className="text-2xl font-black text-white italic tracking-tighter">{metric.val}</span>
                      </div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{metric.label}</p>
                    </div>
                 ))}
              </div>

              {/* Granular Feedback Matrix */}
              <div className="space-y-8">
                 <div className="flex items-center gap-4">
                    <Activity size={20} className="text-indigo-400" />
                    <h4 className="text-xs font-black text-white uppercase tracking-[0.3em]">Behavioral Intelligence Feed</h4>
                 </div>
                 
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {feedbacks.map((f, idx) => (
                       <motion.div 
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="p-10 bg-slate-900/50 border border-slate-800 rounded-[3rem] space-y-8 relative overflow-hidden group hover:bg-slate-900 transition-all"
                       >
                          <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
                             <Quote size={80} className="text-white" />
                          </div>

                          <div className="flex items-center justify-between relative z-10">
                             <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black shadow-lg shadow-indigo-600/20">
                                   Q{idx + 1}
                                </div>
                                <div>
                                   <p className="text-[11px] font-black text-white uppercase tracking-widest">STAR Analysis</p>
                                   <p className="text-[9px] text-slate-500 font-bold uppercase">{f.sentiment} Trajectory</p>
                                </div>
                             </div>
                             <div className="text-right">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Impact Score</p>
                                <p className="text-xl font-black text-emerald-400 italic">{f.starScore.overall}/100</p>
                             </div>
                          </div>

                          <div className="space-y-4 relative z-10">
                             <p className="text-sm text-slate-400 leading-relaxed font-medium">"{f.starScore.feedback}"</p>
                             
                             <div className="grid grid-cols-4 gap-2">
                                {['S', 'T', 'A', 'R'].map((step, i) => {
                                  const score = [f.starScore.situation, f.starScore.task, f.starScore.action, f.starScore.result][i] * 10;
                                  return (
                                    <div key={i} className="space-y-2">
                                       <div className="flex justify-between items-center px-1">
                                          <span className="text-[9px] font-black text-slate-600">{step}</span>
                                          <span className="text-[8px] font-black text-slate-400">{score}%</span>
                                       </div>
                                       <div className="h-1 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                                          <div className="h-full bg-indigo-500" style={{ width: `${score}%` }} />
                                       </div>
                                    </div>
                                  );
                                })}
                             </div>
                          </div>

                          <div className="p-6 bg-slate-950 rounded-[2rem] border border-slate-800 space-y-4 relative z-10">
                             <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Target Keyword Coverage</span>
                                <span className="text-[8px] font-bold text-slate-500 uppercase">{f.matchedKeywords.length} Primary Markers Detected</span>
                             </div>
                             <div className="flex flex-wrap gap-2">
                                {f.matchedKeywords.map((kw, i) => (
                                  <div key={i} className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
                                     <div className="w-1 h-1 rounded-full bg-emerald-500" />
                                     <span className="text-[8px] font-black text-emerald-400 uppercase">{kw}</span>
                                  </div>
                                ))}
                             </div>
                          </div>

                          {f.suggestedAnswer && (
                            <div className="p-6 bg-indigo-600/5 border border-indigo-500/10 rounded-[2rem] space-y-3 relative z-10">
                               <div className="flex items-center gap-2">
                                  <BookOpen size={14} className="text-indigo-400" />
                                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Optimization Suggestion</span>
                               </div>
                               <p className="text-[11px] text-slate-500 italic leading-relaxed font-medium">"{f.suggestedAnswer}"</p>
                            </div>
                          )}
                       </motion.div>
                    ))}
                 </div>
              </div>

              {/* Recommended Improvements */}
              <div className="p-10 bg-indigo-600 text-white rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-indigo-600/30">
                 <div className="space-y-4 text-center md:text-left">
                    <h4 className="text-3xl font-black uppercase tracking-tighter italic">Deep-Dive Preparation</h4>
                    <p className="text-indigo-100 font-medium max-w-lg">Based on your "Role-Specific" performance gaps, Spark.E recommends reviewing core <span className="font-bold underline decoration-white/50 underline-offset-4">{role}</span> architecture principles.</p>
                 </div>
                 <button 
                  onClick={onClose}
                  className="px-10 py-5 bg-white text-indigo-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-xl flex items-center gap-3 shrink-0"
                 >
                   Access Advanced Materials <BookOpen size={16} />
                 </button>
              </div>

              <div className="flex gap-6 py-6 font-black uppercase tracking-widest">
                 <button 
                  onClick={onClose}
                  className="flex-1 py-6 bg-slate-900 text-slate-400 rounded-3xl text-sm border border-slate-800 hover:text-white hover:border-slate-600 transition-all flex items-center justify-center gap-3 italic"
                 >
                   Archive Session <History size={18} />
                 </button>
                 <button 
                  onClick={() => {
                    setStep('intro');
                    setQuestions([]);
                    loadQuestions();
                  }}
                  className="flex-1 py-6 bg-white text-slate-950 rounded-3xl text-sm hover:bg-indigo-50 transition-all shadow-2xl flex items-center justify-center gap-3"
                 >
                   New Trajectory Simulation <RotateCcw size={18} />
                 </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

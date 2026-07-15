import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, FileText, Shield, Lock, Sparkles, ChevronRight, AlertCircle, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';

const API_BASE = (
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE) ||
  'http://localhost:3001'
).replace(/\/+$|\/api$/, '');

interface ATSResult {
  score: number;
  summary: string;
  sectionScores: {
    keywords: number;
    formatting: number;
    content: number;
    structure: number;
  };
  foundKeywordsCount: number;
  missingKeywordsCount: number;
  suggestionsCount: number;
}

interface ResumeDropZoneProps {
  onSignUp: () => void;
  /** When true, renders a smaller version suitable for hero-section embedding */
  compact?: boolean;
}

export const ResumeDropZone: React.FC<ResumeDropZoneProps> = ({ onSignUp, compact }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ATSResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ALLOWED_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ];
  const ALLOWED_EXTS = ['pdf', 'docx', 'txt'];

  const validateFile = (file: File): string | null => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTS.includes(ext || '')) {
      return 'Only PDF, DOCX, and TXT files are supported.';
    }
    if (file.size > 10 * 1024 * 1024) {
      return 'File must be under 10 MB.';
    }
    return null;
  };

  const processFile = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setFileName(file.name);

    const form = new FormData();
    form.append('file', file);

    try {
      const res = await fetch(`${API_BASE}/api/resume/anonymous-ats`, {
        method: 'POST',
        body: form,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Analysis failed');
      }
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
    // Reset so same file can be re-selected
    e.target.value = '';
  }, [processFile]);

  const scoreColor = (score: number) => {
    if (score >= 75) return 'text-emerald-600';
    if (score >= 50) return 'text-amber-600';
    return 'text-rose-600';
  };

  const scoreLabel = (score: number) => {
    if (score >= 75) return 'Strong';
    if (score >= 50) return 'Needs Improvement';
    return 'Critical Issues';
  };

  const scoreBg = (score: number) => {
    if (score >= 75) return 'bg-emerald-50 border-emerald-200';
    if (score >= 50) return 'bg-amber-50 border-amber-200';
    return 'bg-rose-50 border-rose-200';
  };

  return (
    <section className={cn(
      'overflow-hidden',
      compact ? 'py-0' : 'py-24 bg-gradient-to-b from-white to-slate-50'
    )}>
      <div className={compact ? '' : 'max-w-4xl mx-auto px-8'}>
        {/* Header — hidden in compact/hero mode */}
        {!compact && (
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-black uppercase tracking-[0.3em] px-4 py-1.5 rounded-full mb-4">
              <Shield size={11} /> Anonymous · No sign-up required
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-3">
              Is Your Resume <span className="text-indigo-600 italic">ATS-Ready?</span>
            </h2>
            <p className="text-slate-400 font-medium max-w-lg mx-auto">
              Scan your resume against modern ATS algorithms for free — no signup required. Your file is never stored.
            </p>
          </div>
        )}

        {/* Drop Zone */}
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div
              key="dropzone"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'relative cursor-pointer border-2 border-dashed text-center transition-all duration-300',
                  compact ? 'rounded-2xl p-8' : 'rounded-[2.5rem] p-12 md:p-16',
                  isDragging
                    ? 'border-indigo-400 bg-indigo-50 shadow-xl shadow-indigo-100 scale-[1.01]'
                    : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/30 shadow-lg shadow-slate-100',
                  loading && 'pointer-events-none opacity-60'
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {loading ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center">
                      <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-700 mb-1">Analysing your resume...</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        AI is parsing & scoring against modern engineering standards
                      </p>
                    </div>
                    {fileName && (
                      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                        <FileText size={12} className="text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-500">{fileName}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <motion.div
                      animate={isDragging ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
                      className={cn(
                        'rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center',
                        compact ? 'w-12 h-12' : 'w-16 h-16'
                      )}
                    >
                      <Upload size={compact ? 22 : 28} className={isDragging ? 'text-indigo-600' : 'text-indigo-400'} />
                    </motion.div>
                    <div>
                      <p className={cn('font-black text-slate-800 mb-1', compact ? 'text-base' : 'text-lg')}>
                        {isDragging ? 'Drop it here!' : 'Drag & Drop Your Resume PDF Here to Scan'}
                      </p>
                      <p className={cn('text-slate-400 font-medium', compact ? 'text-xs' : 'text-sm')}>
                        or <span className="text-indigo-600 font-bold">click to browse</span> · PDF, DOCX, TXT (max 10 MB)
                      </p>
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        <Shield size={10} className="text-emerald-500" /> We strictly respect your privacy
                      </div>
                    </div>
                    {!compact && (
                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        <FileText size={10} className="text-indigo-400" /> No data is saved or shared without your permission
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3"
                >
                  <AlertCircle size={14} />
                  <span className="text-xs font-bold">{error}</span>
                </motion.div>
              )}
            </motion.div>
          ) : (
            /* Results Card */
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'bg-white border border-slate-100 shadow-xl shadow-slate-100 overflow-hidden',
                compact ? 'rounded-2xl' : 'rounded-[2.5rem]'
              )}
            >
              {/* Score Header */}
              <div className="px-6 md:px-8 pt-6 md:pt-8 pb-5 border-b border-slate-50">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={cn('w-16 h-16 md:w-20 md:h-20 rounded-2xl border-2 flex flex-col items-center justify-center', scoreBg(result.score))}>
                      <span className={cn('text-2xl md:text-3xl font-black', scoreColor(result.score))}>{result.score}</span>
                      <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">/ 100</span>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1">ATS Compatibility Score</p>
                      <h3 className={cn('font-black text-slate-900', compact ? 'text-base' : 'text-xl')}>
                        Your resume scores <span className={scoreColor(result.score)}>{result.score}%</span> against modern ATS algorithms
                      </h3>
                    </div>
                  </div>
                  <button
                    onClick={() => { setResult(null); setFileName(null); }}
                    className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-700 transition-colors"
                  >
                    Try Another
                  </button>
                </div>
              </div>

              {/* Section Scores */}
              <div className="px-8 py-6 border-b border-slate-50">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Section Breakdown</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Keywords', score: result.sectionScores.keywords },
                    { label: 'Content', score: result.sectionScores.content },
                    { label: 'Structure', score: result.sectionScores.structure },
                    { label: 'Formatting', score: result.sectionScores.formatting },
                  ].map(({ label, score }) => (
                    <div key={label} className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                      <span className={cn('text-2xl font-black', scoreColor(score))}>{score}</span>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="px-8 py-5 border-b border-slate-50">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">AI Summary</p>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">{result.summary}</p>
              </div>

              {/* Gated Features — Strategic Signup Gate */}
              <div className="px-6 md:px-8 py-6 bg-gradient-to-br from-indigo-50/50 to-purple-50/50">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={14} className="text-amber-600" />
                  <p className="text-sm font-black text-slate-800">
                    Your Resume Has {result.missingKeywordsCount} Major Semantic Gaps.
                  </p>
                </div>
                <p className="text-xs text-slate-500 font-medium mb-5">
                  You have outstanding experience, but modern tracking systems are missing key accomplishments in your writing.
                </p>

                <div className="grid md:grid-cols-3 gap-3 mb-5">
                  <div className="bg-white border border-indigo-100 rounded-xl p-4 relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                      <Lock size={16} className="text-indigo-400" />
                    </div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Missing Keywords</p>
                    <p className="text-2xl font-black text-rose-600">{result.missingKeywordsCount}</p>
                    <p className="text-[9px] text-slate-400 font-medium">critical gaps identified</p>
                  </div>
                  <div className="bg-white border border-indigo-100 rounded-xl p-4 relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                      <Lock size={16} className="text-indigo-400" />
                    </div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">AI Suggestions</p>
                    <p className="text-2xl font-black text-amber-600">{result.suggestionsCount}</p>
                    <p className="text-[9px] text-slate-400 font-medium">actionable improvements</p>
                  </div>
                  <div className="bg-white border border-indigo-100 rounded-xl p-4 relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                      <Lock size={16} className="text-indigo-400" />
                    </div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Tailored PDF</p>
                    <p className="text-2xl font-black text-indigo-600">
                      <Sparkles size={20} className="inline" />
                    </p>
                    <p className="text-[9px] text-slate-400 font-medium">anti-hallucination resume</p>
                  </div>
                </div>

                <div className="bg-white border border-indigo-200 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-black text-slate-800 mb-1">
                      Create a Free Account to Unlock Your Custom Keyword Fixes &amp; Launch the Interview Simulator
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      No credit card required · Full workspace setup in 45 seconds
                    </p>
                  </div>
                  <button
                    onClick={onSignUp}
                    className="shrink-0 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-xl transition-all shadow-lg shadow-indigo-200 group"
                  >
                    Create Free Account <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default ResumeDropZone;

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Upload, FileText, CheckCircle, AlertCircle, Sparkles, Clock,
  Plus, Trash2, Edit3, Save, X, ExternalLink, Github, Star,
  ChevronDown, ChevronRight, Loader2, RotateCcw, Download,
  User, Briefcase, GraduationCap, Code, Award, FolderGit2,
  TrendingUp, Target, Lightbulb, Shield, Wand2, FileEdit, Copy, Check,
  Languages, MessageSquare, Send,
} from "lucide-react";
import { cn } from "../lib/utils";
import type { UserProfile } from "../types/career";
import type {
  ResumeContent, ResumeVersion, ATSReport, ATSSuggestion,
  PortfolioProject, PortfolioProjectInput,
  DeepResumeProfileSnapshot, DeepResumeResponse,
} from "../types/resume";
import {
  uploadAndParseResume, getResume, saveResumeContent,
  getResumeVersions, restoreResumeVersion, runATSCheck,
  getResumeSuggestions, getPortfolioProjects,
  createPortfolioProject, updatePortfolioProject, deletePortfolioProject,
  tailorResumeToJD, translateResume, generateCoverLetter, deleteResumeVersion,
  askDeepResumeQuestion, createDeepResumeShareLink, getDeepResumeHistory,
} from "../services/resumeService";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Tab = "editor" | "tailor" | "translate" | "cover-letter" | "deep-profile" | "ats" | "versions" | "portfolio";

interface DeepResumeTurn {
  question: string;
  response: DeepResumeResponse;
}

interface Props {
  profile: UserProfile;
  userId: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function emptyContent(): ResumeContent {
  return {
    personalInfo: { name: "", email: "", phone: "", location: "", linkedin: "", website: "", summary: "" },
    experience: [],
    education: [],
    skills: { technical: [], soft: [], languages: [], certifications: [] },
    projects: [],
    awards: [],
    references: [],
  };
}

function scoreColor(score: number) {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-500";
  return "text-rose-500";
}

function scoreBg(score: number) {
  if (score >= 80) return "bg-emerald-50 border-emerald-200";
  if (score >= 60) return "bg-amber-50 border-amber-200";
  return "bg-rose-50 border-rose-200";
}

function priorityBadge(priority: ATSSuggestion["priority"]) {
  const map: Record<string, string> = {
    critical: "bg-rose-100 text-rose-700",
    high:     "bg-orange-100 text-orange-700",
    medium:   "bg-amber-100 text-amber-700",
    low:      "bg-slate-100 text-slate-500",
  };
  return map[priority] || map.low;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

const SectionCard: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode; className?: string }> =
  ({ title, icon: Icon, children, className }) => (
    <div className={cn("bg-white rounded-2xl border border-slate-200 p-6 space-y-4", className)}>
      <div className="flex items-center gap-2">
        <Icon size={15} className="text-indigo-500" />
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-700">{title}</h3>
      </div>
      {children}
    </div>
  );

const TextInput: React.FC<{
  label: string; value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
}> = ({ label, value, onChange, placeholder, multiline, rows = 3 }) => (
  <div className="space-y-1">
    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</label>
    {multiline ? (
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 resize-none"
      />
    ) : (
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50"
      />
    )}
  </div>
);

const TagInput: React.FC<{
  label: string; tags: string[];
  onChange: (tags: string[]) => void;
}> = ({ label, tags, onChange }) => {
  const [input, setInput] = useState("");
  const safeTags = Array.isArray(tags) ? tags : [];

  const addTag = () => {
    const trimmed = input.trim();
    if (trimmed && !safeTags.includes(trimmed)) {
      onChange([...safeTags, trimmed]);
    }
    setInput("");
  };

  return (
    <div className="space-y-1">
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</label>
      <div className="flex flex-wrap gap-1.5 min-h-[36px] px-3 py-2 rounded-xl border border-slate-200 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-50">
        {safeTags.map(tag => (
          <span key={tag} className="flex items-center gap-1 bg-indigo-50 text-indigo-700 text-[11px] font-bold px-2 py-0.5 rounded-lg">
            {tag}
            <button type="button" onClick={() => onChange(safeTags.filter(t => t !== tag))} className="hover:text-rose-500">
              <X size={10} />
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }}
          onBlur={addTag}
          placeholder="Type and press Enter"
          className="flex-1 min-w-[120px] text-sm text-slate-800 placeholder-slate-400 focus:outline-none bg-transparent"
        />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ATS Score Ring
// ─────────────────────────────────────────────────────────────────────────────

const ScoreRing: React.FC<{ score: number; size?: number }> = ({ score, size = 80 }) => {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#f43f5e";

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={8} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={8}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1s ease" }}
      />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
        fill={color} fontSize={size / 5} fontWeight="900"
        style={{ transform: "rotate(90deg)", transformOrigin: "center" }}
      >
        {score}
      </text>
    </svg>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Upload zone
// ─────────────────────────────────────────────────────────────────────────────

const UploadZone: React.FC<{
  onFile: (file: File) => void;
  isLoading: boolean;
}> = ({ onFile, isLoading }) => {
  const ref = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  };

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => ref.current?.click()}
      className={cn(
        "relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all",
        dragging ? "border-indigo-400 bg-indigo-50/60" : "border-slate-300 hover:border-indigo-300 hover:bg-slate-50/50"
      )}
    >
      <input
        ref={ref}
        type="file"
        accept=".pdf,.docx,.txt"
        className="hidden"
        onChange={e => e.target.files?.[0] && onFile(e.target.files[0])}
      />
      {isLoading ? (
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="text-indigo-500 animate-spin" />
          <p className="text-sm font-bold text-indigo-600 uppercase tracking-widest">Extracting &amp; Structuring…</p>
          <p className="text-xs text-slate-500">AI is reading your resume — this takes ~20 s</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center">
            <Upload size={22} className="text-indigo-500" />
          </div>
          <div>
            <p className="text-sm font-black text-slate-800">Drop resume here or click to browse</p>
            <p className="text-xs text-slate-500 mt-1">PDF, DOCX, or TXT — max 10 MB</p>
          </div>
          <div className="flex gap-2 mt-2">
            {["PDF", "DOCX", "TXT"].map(fmt => (
              <span key={fmt} className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-600 uppercase tracking-widest">{fmt}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

const ResumeManager: React.FC<Props> = ({ profile, userId }) => {
  const [activeTab, setActiveTab] = useState<Tab>("editor");
  const [content, setContent] = useState<ResumeContent>(emptyContent());
  const [atsReport, setAtsReport] = useState<ATSReport | null>(null);
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [currentVersionId, setCurrentVersionId] = useState<string>("");
  const [portfolioProjects, setPortfolioProjects] = useState<PortfolioProject[]>([]);
  const [targetRole, setTargetRole] = useState(profile.targetCareerId?.replace(/-/g, " ") || "");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAtsLoading, setIsAtsLoading] = useState(false);
  const [jdForAts, setJdForAts] = useState("");

  // ── AI Tailor state ──
  const [jdForTailor, setJdForTailor] = useState("");
  const [isTailorLoading, setIsTailorLoading] = useState(false);
  const [tailoredContent, setTailoredContent] = useState<ResumeContent | null>(null);
  const [tailorApplied, setTailorApplied] = useState(false);

  // ── Resume Translation state ──
  const [translationLanguage, setTranslationLanguage] = useState("Spanish");
  const [translationTone, setTranslationTone] = useState<"professional" | "formal" | "concise">("professional");
  const [isTranslationLoading, setIsTranslationLoading] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<ResumeContent | null>(null);
  const [translationApplied, setTranslationApplied] = useState(false);

  // - Deep Resume interactive profile state -
  const [deepQuestion, setDeepQuestion] = useState("");
  const [deepReferences, setDeepReferences] = useState<string[]>([]);
  const [deepHistory, setDeepHistory] = useState<DeepResumeTurn[]>([]);
  const [deepSnapshot, setDeepSnapshot] = useState<DeepResumeProfileSnapshot | null>(null);
  const [isDeepLoading, setIsDeepLoading] = useState(false);
  const [isShareLoading, setIsShareLoading] = useState(false);
  const [deepShareUrl, setDeepShareUrl] = useState("");
  const [hasLoadedDeepHistory, setHasLoadedDeepHistory] = useState(false);

  // ── Cover Letter state ──
  const [jdForCover, setJdForCover] = useState("");
  const [isCoverLoading, setIsCoverLoading] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [coverCopied, setCoverCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionSection, setSuggestionSection] = useState("");
  const [isSuggLoading, setIsSuggLoading] = useState(false);
  const [hasResume, setHasResume] = useState(false);
  const [expandedExp, setExpandedExp] = useState<string | null>(null);
  const [expandedEdu, setExpandedEdu] = useState<string | null>(null);
  const [pendingDeleteVersionId, setPendingDeleteVersionId] = useState<string | null>(null);
  const [isDeletingVersion, setIsDeletingVersion] = useState(false);

  // Portfolio state
  const [showPortfolioForm, setShowPortfolioForm] = useState(false);
  const [editingProject, setEditingProject] = useState<PortfolioProject | null>(null);
  const [projectForm, setProjectForm] = useState<PortfolioProjectInput>({
    title: "", description: "", techStack: [], role: "", isOngoing: false,
    startDate: "", endDate: "", projectUrl: "", repoUrl: "", imageUrl: "", tags: [], featured: false,
  });

  // ── Load existing resume on mount ──
  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        setIsLoading(true);
        const [resume, projects] = await Promise.all([
          getResume(userId),
          getPortfolioProjects(userId),
        ]);
        if (resume?.content) {
          setContent(resume.content);
          setHasResume(true);
        }
        if (resume?.atsReport) setAtsReport(resume.atsReport);
        setPortfolioProjects(projects);
      } catch {
        // Silent — no resume yet
      } finally {
        setIsLoading(false);
      }
    })();
  }, [userId]);

  // ── Load versions when tab opens ──
  useEffect(() => {
    if (activeTab !== "versions" || !userId) return;
    (async () => {
      try {
        const result = await getResumeVersions(userId);
        setVersions(result.versions);
        setCurrentVersionId(result.currentVersionId);
      } catch {
        // ignore
      }
    })();
  }, [activeTab, userId]);

  useEffect(() => {
    setDeepReferences(Array.isArray(content.references) ? content.references : []);
  }, [content.references]);

  useEffect(() => {
    if (activeTab !== "deep-profile" || !userId || hasLoadedDeepHistory) return;
    (async () => {
      try {
        const history = await getDeepResumeHistory(userId, 20);
        if (history.length > 0) {
          setDeepHistory(
            history
              .slice()
              .reverse()
              .map((item) => ({ question: item.question, response: item.response }))
          );
        }
      } catch {
        // Non-blocking
      } finally {
        setHasLoadedDeepHistory(true);
      }
    })();
  }, [activeTab, userId, hasLoadedDeepHistory]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  // ── File upload ──
  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await uploadAndParseResume(file, userId, targetRole);
      setContent(result.content);
      if (result.atsReport) setAtsReport(result.atsReport);
      setHasResume(true);
      const info = result.content?.personalInfo;
      const isEmpty = !info?.name && !info?.email && !info?.summary;
      if (isEmpty) {
        setError("Resume uploaded but we couldn't auto-extract your details — please fill in the fields manually.");
      } else {
        showSuccess(`Resume parsed (v${result.versionNumber}) — run ATS Check to score it`);
      }
      setActiveTab("editor");
    } catch (e: any) {
      setError(e.message || "Upload failed");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Save edits ──
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const result = await saveResumeContent(userId, content, "Manual edit", targetRole);
      setAtsReport(result.atsReport);
      setHasResume(true);
      showSuccess(`Saved as v${result.versionNumber} · ATS score: ${result.atsReport.score}/100`);
    } catch (e: any) {
      setError(e.message || "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Run ATS check ──
  const handleATSCheck = async () => {
    setIsAtsLoading(true);
    setError(null);
    try {
      const report = await runATSCheck(content, targetRole, jdForAts || undefined);
      setAtsReport(report);
    } catch (e: any) {
      setError(e.message || "ATS check failed");
    } finally {
      setIsAtsLoading(false);
    }
  };

  // ── AI Tailor ──
  const handleTailorResume = async () => {
    if (!jdForTailor.trim()) return setError("Paste a job description first");
    setIsTailorLoading(true);
    setError(null);
    setTailoredContent(null);
    setTailorApplied(false);
    try {
      const result = await tailorResumeToJD(content, jdForTailor);
      setTailoredContent(result);
    } catch (e: any) {
      setError(e.message || "Tailoring failed");
    } finally {
      setIsTailorLoading(false);
    }
  };

  const handleApplyTailored = () => {
    if (!tailoredContent) return;
    setContent(tailoredContent);
    setTailorApplied(true);
    showSuccess("Tailored resume applied — review the Editor tab, then Save & Run ATS Check");
  };

  // ── Resume translation ──
  const handleTranslateResume = async () => {
    if (!translationLanguage.trim()) return setError("Select a target language");
    setIsTranslationLoading(true);
    setError(null);
    setTranslatedContent(null);
    setTranslationApplied(false);
    try {
      const result = await translateResume(userId, content, translationLanguage, translationTone, true);
      setTranslatedContent(result.translated);
      setContent(result.translated);
      setHasResume(true);
      setTranslationApplied(true);
      showSuccess(
        result.saved && result.versionNumber
          ? `Translated to ${translationLanguage} and saved as v${result.versionNumber}`
          : `Translated to ${translationLanguage}`
      );
    } catch (e: any) {
      setError(e.message || "Translation failed");
    } finally {
      setIsTranslationLoading(false);
    }
  };

  // ── Cover Letter ──
  const handleGenerateCoverLetter = async () => {
    if (!jdForCover.trim()) return setError("Paste a job description first");
    setIsCoverLoading(true);
    setError(null);
    setCoverLetter("");
    try {
      const letter = await generateCoverLetter(content, jdForCover, targetRole || undefined);
      setCoverLetter(letter);
    } catch (e: any) {
      setError(e.message || "Cover letter generation failed");
    } finally {
      setIsCoverLoading(false);
    }
  };

  const handleCopyCoverLetter = async () => {
    if (!coverLetter) return;
    await navigator.clipboard.writeText(coverLetter);
    setCoverCopied(true);
    setTimeout(() => setCoverCopied(false), 2000);
  };

  // - Deep Resume interactive Q&A -
  const handleAskDeepResume = async () => {
    if (!deepQuestion.trim()) {
      setError("Enter a question for the interactive profile");
      return;
    }

    setIsDeepLoading(true);
    setError(null);
    try {
      const historyPayload = deepHistory.slice(-4).map((turn) => ({
        question: turn.question,
        answer: turn.response.answer,
      }));

      const result = await askDeepResumeQuestion(userId, deepQuestion.trim(), deepReferences, historyPayload);
      setDeepSnapshot(result.profileSnapshot);
      setDeepHistory((prev) => [...prev, { question: deepQuestion.trim(), response: result.response }]);
      setDeepQuestion("");
    } catch (e: any) {
      setError(e.message || "Deep resume query failed");
    } finally {
      setIsDeepLoading(false);
    }
  };

  const handleGenerateShareLink = async () => {
    setIsShareLoading(true);
    setError(null);
    try {
      const result = await createDeepResumeShareLink(userId, true, window.location.origin);
      setDeepShareUrl(result.shareUrl);
      await navigator.clipboard.writeText(result.shareUrl);
      showSuccess("Public Deep Resume link generated and copied to clipboard");
    } catch (e: any) {
      setError(e.message || "Failed to generate share link");
    } finally {
      setIsShareLoading(false);
    }
  };

  // ── AI suggestions ──
  const handleGetSuggestions = async (section: string, text: string) => {
    setSuggestionSection(section);
    setIsSuggLoading(true);
    setSuggestions([]);
    try {
      const s = await getResumeSuggestions(section, text, targetRole);
      setSuggestions(s);
    } catch {
      setSuggestions(["Could not load suggestions. Please try again."]);
    } finally {
      setIsSuggLoading(false);
    }
  };

  // ── Restore version ──
  const handleRestoreVersion = async (versionId: string) => {
    try {
      const result = await restoreResumeVersion(userId, versionId);
      showSuccess(`Restored as v${result.versionNumber}`);
      const resume = await getResume(userId);
      if (resume?.content) setContent(resume.content);
      if (resume?.atsReport) setAtsReport(resume.atsReport);
      const versionsResult = await getResumeVersions(userId);
      setVersions(versionsResult.versions);
      setCurrentVersionId(versionsResult.currentVersionId);
    } catch (e: any) {
      setError(e.message || "Restore failed");
    }
  };

  // ── Delete old version ──
  const handleDeleteVersion = async (versionId: string) => {
    if (versionId === currentVersionId) {
      return setError("Cannot delete the current version");
    }

    setPendingDeleteVersionId(versionId);
  };

  const confirmDeleteVersion = async () => {
    if (!pendingDeleteVersionId) return;

    try {
      setIsDeletingVersion(true);
      await deleteResumeVersion(userId, pendingDeleteVersionId);
      showSuccess("Version deleted");
      const versionsResult = await getResumeVersions(userId);
      setVersions(versionsResult.versions);
      setCurrentVersionId(versionsResult.currentVersionId);
    } catch (e: any) {
      setError(e.message || "Delete failed");
    } finally {
      setIsDeletingVersion(false);
      setPendingDeleteVersionId(null);
    }
  };

  // ── Portfolio CRUD ──
  const openCreateProject = () => {
    setEditingProject(null);
    setProjectForm({
      title: "", description: "", techStack: [], role: "", isOngoing: false,
      startDate: "", endDate: "", projectUrl: "", repoUrl: "", imageUrl: "", tags: [], featured: false,
    });
    setShowPortfolioForm(true);
  };

  const openEditProject = (p: PortfolioProject) => {
    setEditingProject(p);
    setProjectForm({
      title: p.title, description: p.description || "", techStack: p.techStack,
      role: p.role || "", isOngoing: p.isOngoing, startDate: p.startDate || "",
      endDate: p.endDate || "", projectUrl: p.projectUrl || "", repoUrl: p.repoUrl || "",
      imageUrl: p.imageUrl || "", tags: p.tags, featured: p.featured,
    });
    setShowPortfolioForm(true);
  };

  const handleSaveProject = async () => {
    if (!projectForm.title.trim()) return setError("Project title is required");
    setIsSaving(true);
    setError(null);
    try {
      if (editingProject) {
        const updated = await updatePortfolioProject(userId, editingProject.id, projectForm);
        setPortfolioProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
      } else {
        const created = await createPortfolioProject(userId, projectForm);
        setPortfolioProjects(prev => [created, ...prev]);
      }
      setShowPortfolioForm(false);
      showSuccess(editingProject ? "Project updated" : "Project added");
    } catch (e: any) {
      setError(e.message || "Failed to save project");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await deletePortfolioProject(userId, projectId);
      setPortfolioProjects(prev => prev.filter(p => p.id !== projectId));
      showSuccess("Project deleted");
    } catch (e: any) {
      setError(e.message || "Failed to delete project");
    }
  };

  // ── Content updaters ──
  const updatePersonal = (key: keyof ResumeContent["personalInfo"], value: string) =>
    setContent(c => ({ ...c, personalInfo: { ...c.personalInfo, [key]: value } }));

  const updateSkills = (key: keyof ResumeContent["skills"], tags: string[]) =>
    setContent(c => ({ ...c, skills: { ...c.skills, [key]: tags } }));

  const addExperience = () => setContent(c => ({
    ...c,
    experience: [...c.experience, {
      id: crypto.randomUUID(), company: "", position: "", startDate: "", endDate: "",
      isCurrentRole: false, description: "", achievements: [],
    }],
  }));

  const updateExp = (id: string, key: string, value: any) =>
    setContent(c => ({ ...c, experience: c.experience.map(e => e.id === id ? { ...e, [key]: value } : e) }));

  const removeExp = (id: string) =>
    setContent(c => ({ ...c, experience: c.experience.filter(e => e.id !== id) }));

  const addEducation = () => setContent(c => ({
    ...c,
    education: [...c.education, {
      id: crypto.randomUUID(), institution: "", degree: "", fieldOfStudy: "",
      startDate: "", endDate: "", gpa: "", achievements: [],
    }],
  }));

  const updateEdu = (id: string, key: string, value: any) =>
    setContent(c => ({ ...c, education: c.education.map(e => e.id === id ? { ...e, [key]: value } : e) }));

  const removeEdu = (id: string) =>
    setContent(c => ({ ...c, education: c.education.filter(e => e.id !== id) }));

  // ─────────────────────────────────────────────────────────────────────────
  // Render tabs
  // ─────────────────────────────────────────────────────────────────────────

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "editor",       label: "Resume Editor", icon: Edit3 },
    { id: "tailor",       label: "AI Tailor",     icon: Wand2 },
    { id: "translate",    label: "Translate",     icon: Languages },
    { id: "cover-letter", label: "Cover Letter",  icon: FileEdit },
    { id: "deep-profile", label: "Deep Resume",   icon: MessageSquare },
    { id: "ats",          label: "ATS Scanner",   icon: Shield },
    { id: "versions",     label: "Versions",      icon: Clock },
    { id: "portfolio",    label: "Portfolio",     icon: FolderGit2 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Resume & Profile</h1>
          <p className="text-[10px] text-indigo-500 font-black uppercase tracking-[0.2em] mt-1">
            Multi-format parsing · AI Tailor · Translation · Cover Letter · Deep Resume · ATS Scanner · Version control · Portfolio
          </p>
        </div>
        {hasResume && atsReport && (
          <div className={cn("flex items-center gap-3 px-4 py-2 rounded-2xl border", scoreBg(atsReport.score))}>
            <ScoreRing score={atsReport.score} size={52} />
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">ATS Score</p>
              <p className={cn("text-lg font-black", scoreColor(atsReport.score))}>{atsReport.score}/100</p>
            </div>
          </div>
        )}
      </div>

      {/* Toast messages */}
      <AnimatePresence>
        {(error || successMsg) && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={cn(
              "flex items-center gap-3 px-5 py-3 rounded-2xl text-sm font-bold",
              error ? "bg-rose-50 border border-rose-200 text-rose-700" : "bg-emerald-50 border border-emerald-200 text-emerald-700"
            )}
          >
            {error ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
            <span>{error || successMsg}</span>
            <button className="ml-auto" onClick={() => { setError(null); setSuccessMsg(null); }}>
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Target role input */}
      <div className="flex items-center gap-3 bg-white rounded-2xl border border-slate-200 px-5 py-3">
        <Target size={14} className="text-indigo-500 shrink-0" />
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">Target Role</label>
        <input
          type="text"
          value={targetRole}
          onChange={e => setTargetRole(e.target.value)}
          placeholder="e.g. Senior Software Engineer"
          className="flex-1 text-sm text-slate-800 placeholder-slate-400 focus:outline-none bg-transparent"
        />
      </div>

      {/* Tab navigation */}
      <div className="sticky top-14 z-20 -mx-2 px-2 py-1 bg-slate-50/95 backdrop-blur-sm">
        <div className="flex gap-1 bg-slate-100/90 rounded-2xl p-1 overflow-x-auto scrollbar-hide">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={cn(
                "shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all",
                activeTab === t.id
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <t.icon size={12} />
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── TAB: EDITOR ── */}
      <AnimatePresence mode="wait">
        {activeTab === "editor" && (
          <motion.div key="editor" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            {/* Upload zone always visible at top */}
            <SectionCard title="Upload Resume" icon={Upload}>
              <UploadZone onFile={handleFileUpload} isLoading={isLoading} />
              {hasResume && (
                <p className="text-xs text-slate-500 text-center">Uploading a new file will create a new version. Your edits below are preserved.</p>
              )}
            </SectionCard>

            {/* Personal Info */}
            <SectionCard title="Personal Information" icon={User}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextInput label="Full Name" value={content.personalInfo.name} onChange={v => updatePersonal("name", v)} placeholder="Jane Doe" />
                <TextInput label="Email" value={content.personalInfo.email} onChange={v => updatePersonal("email", v)} placeholder="jane@example.com" />
                <TextInput label="Phone" value={content.personalInfo.phone} onChange={v => updatePersonal("phone", v)} placeholder="+1 555 0100" />
                <TextInput label="Location" value={content.personalInfo.location} onChange={v => updatePersonal("location", v)} placeholder="San Francisco, CA" />
                <TextInput label="LinkedIn URL" value={content.personalInfo.linkedin} onChange={v => updatePersonal("linkedin", v)} placeholder="linkedin.com/in/jane" />
                <TextInput label="Website / Portfolio" value={content.personalInfo.website} onChange={v => updatePersonal("website", v)} placeholder="janesmith.dev" />
              </div>
              <div className="flex items-start gap-2 mt-2">
                <TextInput label="Professional Summary" value={content.personalInfo.summary} onChange={v => updatePersonal("summary", v)} placeholder="2-3 sentence professional summary…" multiline rows={4} />
                <button
                  onClick={() => handleGetSuggestions("summary", content.personalInfo.summary)}
                  className="mt-6 shrink-0 flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  <Sparkles size={11} /> AI
                </button>
              </div>
            </SectionCard>

            {/* Experience */}
            <SectionCard title="Work Experience" icon={Briefcase}>
              <div className="space-y-3">
                {content.experience.map(exp => (
                  <div key={exp.id} className="border border-slate-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedExp(expandedExp === exp.id ? null : exp.id)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-800 truncate">{exp.position || "New Position"}</p>
                        <p className="text-xs text-slate-500 truncate">{exp.company || "Company"} {exp.startDate && `· ${exp.startDate}`}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={e => { e.stopPropagation(); removeExp(exp.id); }}
                          onKeyDown={e => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              e.stopPropagation();
                              removeExp(exp.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-500"
                        >
                          <Trash2 size={13} />
                        </span>
                        {expandedExp === exp.id ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
                      </div>
                    </button>
                    {expandedExp === exp.id && (
                      <div className="p-4 space-y-4 border-t border-slate-200">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <TextInput label="Position" value={exp.position} onChange={v => updateExp(exp.id, "position", v)} />
                          <TextInput label="Company" value={exp.company} onChange={v => updateExp(exp.id, "company", v)} />
                          <TextInput label="Start Date" value={exp.startDate} onChange={v => updateExp(exp.id, "startDate", v)} placeholder="2022-01" />
                          <TextInput label="End Date" value={exp.endDate} onChange={v => updateExp(exp.id, "endDate", v)} placeholder="2024-06 or present" />
                        </div>
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
                          <input type="checkbox" checked={exp.isCurrentRole} onChange={e => updateExp(exp.id, "isCurrentRole", e.target.checked)} className="rounded" />
                          Currently working here
                        </label>
                        <div className="flex items-start gap-2">
                          <TextInput label="Description" value={exp.description} onChange={v => updateExp(exp.id, "description", v)} multiline rows={3} />
                          <button
                            onClick={() => handleGetSuggestions("experience", `${exp.position} at ${exp.company}: ${exp.description}`)}
                            className="mt-6 shrink-0 flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                          >
                            <Sparkles size={11} /> AI
                          </button>
                        </div>
                        <TagInput label="Key Achievements" tags={exp.achievements} onChange={v => updateExp(exp.id, "achievements", v)} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={addExperience} className="flex items-center gap-2 text-indigo-600 text-xs font-black uppercase tracking-widest hover:text-indigo-500 transition-colors">
                <Plus size={14} /> Add Experience
              </button>
            </SectionCard>

            {/* Education */}
            <SectionCard title="Education" icon={GraduationCap}>
              <div className="space-y-3">
                {content.education.map(edu => (
                  <div key={edu.id} className="border border-slate-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedEdu(expandedEdu === edu.id ? null : edu.id)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-800 truncate">{edu.degree || "Degree"} {edu.fieldOfStudy && `in ${edu.fieldOfStudy}`}</p>
                        <p className="text-xs text-slate-500 truncate">{edu.institution || "Institution"}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={e => { e.stopPropagation(); removeEdu(edu.id); }}
                          onKeyDown={e => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              e.stopPropagation();
                              removeEdu(edu.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-500"
                        >
                          <Trash2 size={13} />
                        </span>
                        {expandedEdu === edu.id ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
                      </div>
                    </button>
                    {expandedEdu === edu.id && (
                      <div className="p-4 space-y-4 border-t border-slate-200">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <TextInput label="Institution" value={edu.institution} onChange={v => updateEdu(edu.id, "institution", v)} />
                          <TextInput label="Degree" value={edu.degree} onChange={v => updateEdu(edu.id, "degree", v)} placeholder="Bachelor of Science" />
                          <TextInput label="Field of Study" value={edu.fieldOfStudy} onChange={v => updateEdu(edu.id, "fieldOfStudy", v)} />
                          <TextInput label="GPA" value={edu.gpa} onChange={v => updateEdu(edu.id, "gpa", v)} placeholder="3.8 / 4.0" />
                          <TextInput label="Start Date" value={edu.startDate} onChange={v => updateEdu(edu.id, "startDate", v)} placeholder="2018-09" />
                          <TextInput label="End Date" value={edu.endDate} onChange={v => updateEdu(edu.id, "endDate", v)} placeholder="2022-05" />
                        </div>
                        <TagInput label="Achievements / Honours" tags={edu.achievements} onChange={v => updateEdu(edu.id, "achievements", v)} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={addEducation} className="flex items-center gap-2 text-indigo-600 text-xs font-black uppercase tracking-widest hover:text-indigo-500 transition-colors">
                <Plus size={14} /> Add Education
              </button>
            </SectionCard>

            {/* Skills */}
            <SectionCard title="Skills" icon={Code}>
              <div className="space-y-4">
                <TagInput label="Technical Skills" tags={content.skills.technical} onChange={v => updateSkills("technical", v)} />
                <TagInput label="Soft Skills" tags={content.skills.soft} onChange={v => updateSkills("soft", v)} />
                <TagInput label="Languages" tags={content.skills.languages} onChange={v => updateSkills("languages", v)} />
                <TagInput label="Certifications" tags={content.skills.certifications} onChange={v => updateSkills("certifications", v)} />
              </div>
              <div className="flex justify-end mt-2">
                <button
                  onClick={() => handleGetSuggestions("skills", content.skills.technical.join(", "))}
                  className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  <Sparkles size={11} /> Suggest Missing Skills
                </button>
              </div>
            </SectionCard>

            {/* Awards */}
            <SectionCard title="Awards & Honours" icon={Award}>
              <TagInput label="Awards" tags={content.awards} onChange={v => setContent(c => ({ ...c, awards: v }))} />
            </SectionCard>

            <SectionCard title="References" icon={MessageSquare}>
              <TagInput
                label="Professional References"
                tags={content.references}
                onChange={v => setContent(c => ({ ...c, references: v }))}
              />
              <p className="text-xs text-slate-500">Add referee details (name, role, organization, contact) to power recruiter Q&A with evidence.</p>
            </SectionCard>

            {/* AI Suggestions Panel */}
            <AnimatePresence>
              {(isSuggLoading || suggestions.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="bg-indigo-50 rounded-2xl border border-indigo-200 p-5 space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <Lightbulb size={14} className="text-indigo-500" />
                    <p className="text-xs font-black uppercase tracking-widest text-indigo-700">
                      AI Suggestions — {suggestionSection}
                    </p>
                    <button onClick={() => setSuggestions([])} className="ml-auto text-slate-400 hover:text-slate-600"><X size={13} /></button>
                  </div>
                  {isSuggLoading ? (
                    <div className="flex items-center gap-2 text-sm text-indigo-600"><Loader2 size={14} className="animate-spin" /> Generating…</div>
                  ) : (
                    <ul className="space-y-2">
                      {suggestions.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                          <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center text-[10px] font-black mt-0.5">{i + 1}</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Save button */}
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-200"
              >
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {isSaving ? "Saving…" : "Save & Run ATS Check"}
              </button>
            </div>
          </motion.div>
        )}

        {/* ── TAB: AI TAILOR ── */}
        {activeTab === "tailor" && (
          <motion.div key="tailor" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="bg-gradient-to-r from-violet-50 to-indigo-50 rounded-2xl border border-indigo-100 p-5">
              <div className="flex items-center gap-2 mb-1">
                <Wand2 size={15} className="text-violet-500" />
                <p className="text-xs font-black uppercase tracking-widest text-violet-700">AI-Powered Resume Tailoring</p>
              </div>
              <p className="text-sm text-slate-600">Paste a job description and Spark.E will intelligently rewrite your summary, experience bullet points, and skills to mirror the JD's language — without fabricating anything.</p>
            </div>

            <SectionCard title="Job Description" icon={FileEdit}>
              <textarea
                value={jdForTailor}
                onChange={e => setJdForTailor(e.target.value)}
                rows={10}
                placeholder="Paste the full job description here…&#10;&#10;e.g. We are looking for a Senior Software Engineer with 5+ years of experience in React, Node.js, and cloud infrastructure. The ideal candidate will lead cross-functional teams…"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-50 resize-none"
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-slate-400">{jdForTailor.length} characters</p>
                <button
                  onClick={handleTailorResume}
                  disabled={isTailorLoading || !jdForTailor.trim()}
                  className="flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-violet-200"
                >
                  {isTailorLoading ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                  {isTailorLoading ? "Tailoring resume…" : "Tailor My Resume"}
                </button>
              </div>
            </SectionCard>

            {isTailorLoading && (
              <div className="flex flex-col items-center py-16 gap-4 text-slate-500">
                <Loader2 size={36} className="text-violet-500 animate-spin" />
                <p className="font-bold text-sm">AI is tailoring your resume to the job description…</p>
                <p className="text-xs text-slate-400">This takes ~30 seconds</p>
              </div>
            )}

            {tailoredContent && !isTailorLoading && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-emerald-500" />
                    <p className="text-sm font-black text-slate-800">Tailoring complete!</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setTailoredContent(null); setTailorApplied(false); }}
                      className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      <RotateCcw size={11} /> Discard
                    </button>
                    <button
                      onClick={handleApplyTailored}
                      disabled={tailorApplied}
                      className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      {tailorApplied ? <><Check size={11} /> Applied</> : <><Save size={11} /> Apply to Resume</>}
                    </button>
                  </div>
                </div>

                {/* Summary diff preview */}
                {tailoredContent.personalInfo.summary !== content.personalInfo.summary && (
                  <SectionCard title="Tailored Summary" icon={User}>
                    <div className="space-y-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Original</p>
                        <p className="text-sm text-slate-500 bg-slate-50 rounded-xl p-3 line-through">{content.personalInfo.summary || "(empty)"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-violet-600 mb-1">Tailored</p>
                        <p className="text-sm text-slate-800 bg-violet-50 rounded-xl p-3 border border-violet-100">{tailoredContent.personalInfo.summary}</p>
                      </div>
                    </div>
                  </SectionCard>
                )}

                {/* Experience diffs */}
                {tailoredContent.experience.length > 0 && (
                  <SectionCard title="Tailored Experience Highlights" icon={Briefcase}>
                    <div className="space-y-4">
                      {tailoredContent.experience.map((exp, i) => {
                        const orig = content.experience[i];
                        if (!orig || orig.description === exp.description) return null;
                        return (
                          <div key={exp.id} className="space-y-2">
                            <p className="text-xs font-black text-slate-700">{exp.position} @ {exp.company}</p>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Original</p>
                              <p className="text-xs text-slate-500 bg-slate-50 rounded-xl p-3 line-through">{orig.description || "(empty)"}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-violet-600 mb-1">Tailored</p>
                              <p className="text-xs text-slate-800 bg-violet-50 rounded-xl p-3 border border-violet-100">{exp.description}</p>
                            </div>
                          </div>
                        );
                      }).filter(Boolean)}
                      {tailoredContent.experience.every((exp, i) => content.experience[i]?.description === exp.description) && (
                        <p className="text-sm text-slate-500 text-center py-2">Experience descriptions already well-aligned to the JD</p>
                      )}
                    </div>
                  </SectionCard>
                )}

                {/* Skills diff */}
                <SectionCard title="Skills Alignment" icon={Code}>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Technical Skills (tailored)</p>
                      <div className="flex flex-wrap gap-1.5">
                        {tailoredContent.skills.technical.map(s => (
                          <span key={s} className={cn(
                            "px-2 py-0.5 text-[11px] font-bold rounded-lg",
                            content.skills.technical.includes(s) ? "bg-slate-100 text-slate-600" : "bg-violet-100 text-violet-700 ring-1 ring-violet-300"
                          )}>{s}</span>
                        ))}
                      </div>
                      <p className="text-[10px] text-violet-600 mt-2">Purple = newly added from JD</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Certifications (tailored)</p>
                      <div className="flex flex-wrap gap-1.5">
                        {tailoredContent.skills.certifications.map(s => (
                          <span key={s} className={cn(
                            "px-2 py-0.5 text-[11px] font-bold rounded-lg",
                            content.skills.certifications.includes(s) ? "bg-slate-100 text-slate-600" : "bg-violet-100 text-violet-700 ring-1 ring-violet-300"
                          )}>{s}</span>
                        ))}
                        {tailoredContent.skills.certifications.length === 0 && <span className="text-xs text-slate-400">None</span>}
                      </div>
                    </div>
                  </div>
                </SectionCard>
              </div>
            )}
          </motion.div>
        )}

        {/* ── TAB: TRANSLATE ── */}
        {activeTab === "translate" && (
          <motion.div key="translate" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="bg-gradient-to-r from-sky-50 to-cyan-50 rounded-2xl border border-sky-100 p-5">
              <div className="flex items-center gap-2 mb-1">
                <Languages size={15} className="text-sky-500" />
                <p className="text-xs font-black uppercase tracking-widest text-sky-700">AI Resume Translation</p>
              </div>
              <p className="text-sm text-slate-600">Professionally localize your resume for global recruiters while preserving facts, dates, and measurable achievements.</p>
            </div>

            <SectionCard title="Translation Settings" icon={Languages}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Target Language</label>
                  <select
                    value={translationLanguage}
                    onChange={e => setTranslationLanguage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-sky-400 bg-white"
                  >
                    {["Spanish", "French", "German", "Portuguese", "Italian", "Dutch", "Arabic", "Chinese (Simplified)", "Japanese", "Korean", "Hindi"].map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tone</label>
                  <select
                    value={translationTone}
                    onChange={e => setTranslationTone(e.target.value as "professional" | "formal" | "concise")}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-sky-400 bg-white"
                  >
                    <option value="professional">Professional</option>
                    <option value="formal">Formal</option>
                    <option value="concise">Concise</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-slate-500">Creates a new resume version automatically so you can restore anytime.</p>
                <button
                  onClick={handleTranslateResume}
                  disabled={isTranslationLoading}
                  className="flex items-center gap-2 px-6 py-3 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-sky-200"
                >
                  {isTranslationLoading ? <Loader2 size={14} className="animate-spin" /> : <Languages size={14} />}
                  {isTranslationLoading ? "Translating…" : `Translate to ${translationLanguage}`}
                </button>
              </div>
            </SectionCard>

            {isTranslationLoading && (
              <div className="flex flex-col items-center py-16 gap-4 text-slate-500">
                <Loader2 size={36} className="text-sky-500 animate-spin" />
                <p className="font-bold text-sm">Localizing your resume for {translationLanguage} recruiters…</p>
                <p className="text-xs text-slate-400">This usually takes ~20-40 seconds</p>
              </div>
            )}

            {translatedContent && !isTranslationLoading && (
              <SectionCard title="Translation Preview" icon={CheckCircle}>
                <div className="space-y-4">
                  <div className="bg-sky-50 border border-sky-100 rounded-xl p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-sky-700 mb-1">Localized Professional Summary</p>
                    <p className="text-sm text-slate-700">{translatedContent.personalInfo.summary || "Summary is empty"}</p>
                  </div>

                  {translatedContent.experience.length > 0 && (
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Localized Experience Highlights</p>
                      <div className="space-y-2">
                        {translatedContent.experience.slice(0, 2).map(exp => (
                          <div key={exp.id} className="border border-slate-200 rounded-xl p-3">
                            <p className="text-xs font-black text-slate-800">{exp.position} · {exp.company}</p>
                            <p className="text-xs text-slate-600 mt-1">{exp.description || "No description"}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-emerald-600 font-bold">
                      {translationApplied ? `Current resume is now localized in ${translationLanguage}.` : "Translation ready."}
                    </span>
                    <button
                      onClick={() => setActiveTab("editor")}
                      className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      <Edit3 size={11} /> Review in Editor
                    </button>
                  </div>
                </div>
              </SectionCard>
            )}
          </motion.div>
        )}

        {/* ── TAB: COVER LETTER ── */}
        {activeTab === "cover-letter" && (
          <motion.div key="cover-letter" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-2xl border border-teal-100 p-5">
              <div className="flex items-center gap-2 mb-1">
                <FileEdit size={15} className="text-teal-500" />
                <p className="text-xs font-black uppercase tracking-widest text-teal-700">AI Cover Letter Builder</p>
              </div>
              <p className="text-sm text-slate-600">Paste a job description and Spark.E will craft a compelling, personalised cover letter using your resume content, matched to the role's specific requirements.</p>
            </div>

            <SectionCard title="Job Description" icon={FileEdit}>
              <textarea
                value={jdForCover}
                onChange={e => setJdForCover(e.target.value)}
                rows={8}
                placeholder="Paste the full job description here…"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-50 resize-none"
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-slate-400">{jdForCover.length} characters</p>
                <button
                  onClick={handleGenerateCoverLetter}
                  disabled={isCoverLoading || !jdForCover.trim()}
                  className="flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-teal-200"
                >
                  {isCoverLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  {isCoverLoading ? "Writing cover letter…" : "Generate Cover Letter"}
                </button>
              </div>
            </SectionCard>

            {isCoverLoading && (
              <div className="flex flex-col items-center py-16 gap-4 text-slate-500">
                <Loader2 size={36} className="text-teal-500 animate-spin" />
                <p className="font-bold text-sm">Crafting your cover letter…</p>
                <p className="text-xs text-slate-400">This takes ~20 seconds</p>
              </div>
            )}

            {coverLetter && !isCoverLoading && (
              <SectionCard title="Your Cover Letter" icon={FileText}>
                <div className="flex justify-end gap-2 mb-3">
                  <button
                    onClick={handleCopyCoverLetter}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-teal-50 hover:text-teal-600 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    {coverCopied ? <><Check size={11} /> Copied!</> : <><Copy size={11} /> Copy</>}
                  </button>
                  <button
                    onClick={() => { setJdForCover(""); setCoverLetter(""); }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    <RotateCcw size={11} /> Reset
                  </button>
                </div>
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
                  <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">{coverLetter}</pre>
                </div>
                <p className="text-[10px] text-slate-400 text-center mt-2">Review and personalise before sending. Remove placeholder text like [Company Name] if present.</p>
              </SectionCard>
            )}

            {!coverLetter && !isCoverLoading && (
              <div className="text-center py-16 text-slate-400">
                <FileEdit size={40} className="mx-auto mb-4 opacity-30" />
                <p className="font-bold">No cover letter yet</p>
                <p className="text-xs mt-1">Paste a job description and click Generate</p>
              </div>
            )}
          </motion.div>
        )}

        {/* ── TAB: ATS SCANNER ── */}
        {activeTab === "deep-profile" && (
          <motion.div key="deep-profile" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-2xl border border-cyan-100 p-5">
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare size={15} className="text-cyan-600" />
                <p className="text-xs font-black uppercase tracking-widest text-cyan-700">Deep Resume Interactive Profile</p>
              </div>
              <p className="text-sm text-slate-600">Replace static PDFs with a live profile. Hiring managers can ask questions and get evidence-backed answers from your resume, portfolio, GitHub repositories, case studies, and references.</p>
            </div>

            <SectionCard title="Ask the Candidate Profile" icon={MessageSquare}>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                  <p className="text-xs text-slate-600">Create a public read-only Deep Resume URL for hiring managers.</p>
                  <button
                    onClick={handleGenerateShareLink}
                    disabled={isShareLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    {isShareLoading ? <Loader2 size={11} className="animate-spin" /> : <ExternalLink size={11} />}
                    {isShareLoading ? "Generating..." : "Generate Share URL"}
                  </button>
                </div>

                {deepShareUrl && (
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-2">
                    <input
                      readOnly
                      value={deepShareUrl}
                      className="flex-1 bg-transparent text-xs text-emerald-800 font-medium focus:outline-none"
                    />
                    <button
                      onClick={() => navigator.clipboard.writeText(deepShareUrl)}
                      className="px-2.5 py-1 bg-white border border-emerald-300 text-emerald-700 rounded-lg text-[10px] font-black uppercase tracking-widest"
                    >
                      Copy
                    </button>
                  </div>
                )}

                <textarea
                  value={deepQuestion}
                  onChange={e => setDeepQuestion(e.target.value)}
                  rows={3}
                  placeholder="e.g. Show me examples of leadership on distributed teams"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-50 resize-none"
                />
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <TagInput label="References used by AI" tags={deepReferences} onChange={setDeepReferences} />
                  <button
                    onClick={handleAskDeepResume}
                    disabled={isDeepLoading || !deepQuestion.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    {isDeepLoading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                    {isDeepLoading ? "Thinking..." : "Ask Deep Resume"}
                  </button>
                </div>
              </div>
            </SectionCard>

            {deepSnapshot && (
              <SectionCard title="Profile Snapshot" icon={User}>
                <div className="space-y-3">
                  <p className="text-sm text-slate-700"><span className="font-black text-slate-900">{deepSnapshot.name}</span>{deepSnapshot.headline ? ` - ${deepSnapshot.headline}` : ""}</p>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Strengths</p>
                    <div className="flex flex-wrap gap-1.5">
                      {deepSnapshot.strengths.map(skill => (
                        <span key={skill} className="px-2 py-0.5 bg-cyan-50 text-cyan-700 text-[11px] font-bold rounded-lg">{skill}</span>
                      ))}
                      {deepSnapshot.strengths.length === 0 && <span className="text-xs text-slate-400">No skills indexed yet</span>}
                    </div>
                  </div>
                </div>
              </SectionCard>
            )}

            {deepHistory.length > 0 ? (
              <div className="space-y-4">
                {deepHistory.slice().reverse().map((turn, idx) => (
                  <div key={`${turn.question}-${idx}`} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Question</p>
                    <p className="text-sm font-bold text-slate-800">{turn.question}</p>

                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-cyan-700 mb-2">Answer · Confidence {turn.response.confidence}%</p>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{turn.response.answer}</p>
                    </div>

                    {turn.response.evidence.length > 0 && (
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Evidence</p>
                        <div className="space-y-2">
                          {turn.response.evidence.map((ev, evIndex) => (
                            <div key={`${ev.title}-${evIndex}`} className="rounded-xl border border-slate-200 p-3">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-xs font-black text-slate-800">{ev.title}</p>
                                <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg uppercase tracking-widest font-black">{ev.sourceType}</span>
                              </div>
                              <p className="text-xs text-slate-600 mt-1">{ev.quote}</p>
                              {(ev.sectionPath || ev.sourceId) && (
                                <div className="flex gap-1.5 mt-2 flex-wrap">
                                  {ev.sectionPath && (
                                    <span className="px-2 py-0.5 bg-cyan-50 text-cyan-700 rounded-md text-[10px] font-black">{ev.sectionPath}</span>
                                  )}
                                  {ev.sourceId && (
                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-black">{ev.sourceId}</span>
                                  )}
                                </div>
                              )}
                              {ev.link && (
                                <a href={ev.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold text-cyan-700 hover:text-cyan-600">
                                  <ExternalLink size={10} /> Source
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {turn.response.followUpQuestions.length > 0 && (
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Suggested Follow-ups</p>
                        <div className="flex flex-wrap gap-2">
                          {turn.response.followUpQuestions.map((fq, fIdx) => (
                            <button
                              key={`${fq}-${fIdx}`}
                              onClick={() => setDeepQuestion(fq)}
                              className="px-3 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                              {fq}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-slate-400">
                <MessageSquare size={38} className="mx-auto mb-4 opacity-35" />
                <p className="font-bold">No deep profile conversation yet</p>
                <p className="text-xs mt-1">Ask your first hiring-manager style question above</p>
              </div>
            )}
          </motion.div>
        )}

        {/* ── TAB: ATS SCANNER ── */}
        {activeTab === "ats" && (
          <motion.div key="ats" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <p className="text-sm text-slate-600">Score your resume against ATS systems. Add a job description for a precise, JD-matched analysis.</p>
              <button
                onClick={handleATSCheck}
                disabled={isAtsLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0"
              >
                {isAtsLoading ? <Loader2 size={13} className="animate-spin" /> : <Shield size={13} />}
                {isAtsLoading ? "Analysing…" : "Run ATS Scan"}
              </button>
            </div>

            {/* Optional JD input for precise ATS scanning */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <FileEdit size={13} className="text-indigo-400" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Job Description (optional — for precise keyword matching)</p>
              </div>
              <textarea
                value={jdForAts}
                onChange={e => setJdForAts(e.target.value)}
                rows={4}
                placeholder="Paste the job description here for a JD-specific ATS score. Leave blank for a general analysis."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 resize-none"
              />
              {jdForAts && <p className="text-[10px] text-indigo-500 font-bold">JD-matched scanning enabled — keywords will be extracted from this description</p>}
            </div>

            {!atsReport && !isAtsLoading && (
              <div className="text-center py-20 text-slate-400">
                <Shield size={40} className="mx-auto mb-4 opacity-30" />
                <p className="font-bold">No ATS report yet</p>
                <p className="text-xs mt-1">Upload a resume or click Run ATS Scan above</p>
              </div>
            )}

            {isAtsLoading && (
              <div className="flex flex-col items-center py-20 gap-4 text-slate-500">
                <Loader2 size={36} className="text-indigo-500 animate-spin" />
                <p className="font-bold text-sm">Running ATS analysis…</p>
              </div>
            )}

            {atsReport && !isAtsLoading && (
              <div className="space-y-5">
                {/* Score overview */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <div className="flex items-center gap-8">
                    <ScoreRing score={atsReport.score} size={96} />
                    <div className="flex-1">
                      <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">Overall ATS Score</p>
                      <p className={cn("text-4xl font-black mb-2", scoreColor(atsReport.score))}>{atsReport.score}/100</p>
                      <p className="text-sm text-slate-600">{atsReport.summary}</p>
                    </div>
                  </div>
                  {/* Section scores */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                    {(["keywords", "formatting", "content", "structure"] as const).map(sec => (
                      <div key={sec} className={cn("rounded-xl border px-4 py-3 text-center", scoreBg(atsReport.sections[sec].score))}>
                        <p className={cn("text-2xl font-black", scoreColor(atsReport.sections[sec].score))}>{atsReport.sections[sec].score}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-0.5">{sec}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Keywords */}
                <SectionCard title="Keywords Analysis" icon={TrendingUp}>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">Found Keywords</p>
                      <div className="flex flex-wrap gap-1.5">
                        {atsReport.sections.keywords.found.map(k => (
                          <span key={k} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded-lg">{k}</span>
                        ))}
                        {atsReport.sections.keywords.found.length === 0 && <span className="text-xs text-slate-400">None detected</span>}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-rose-600 mb-2">Missing Keywords</p>
                      <div className="flex flex-wrap gap-1.5">
                        {atsReport.sections.keywords.missing.map(k => (
                          <span key={k} className="px-2 py-0.5 bg-rose-50 text-rose-700 text-[11px] font-bold rounded-lg">{k}</span>
                        ))}
                        {atsReport.sections.keywords.missing.length === 0 && <span className="text-xs text-slate-400">All key terms present</span>}
                      </div>
                    </div>
                  </div>
                </SectionCard>

                {/* Suggestions */}
                <SectionCard title="Actionable Suggestions" icon={Lightbulb}>
                  <div className="space-y-3">
                    {atsReport.suggestions.map((s, i) => (
                      <div key={i} className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <span className={cn("shrink-0 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest", priorityBadge(s.priority))}>
                          {s.priority}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800">{s.issue}</p>
                          <p className="text-xs text-indigo-600 mt-1 font-medium">→ {s.fix}</p>
                        </div>
                        <span className="shrink-0 text-[10px] text-slate-400 uppercase tracking-widest">{s.category}</span>
                      </div>
                    ))}
                    {atsReport.suggestions.length === 0 && (
                      <p className="text-sm text-emerald-600 font-bold text-center py-4">No suggestions — excellent resume!</p>
                    )}
                  </div>
                </SectionCard>

                {/* Formatting & structure issues */}
                {(atsReport.sections.formatting.issues.length > 0 || atsReport.sections.structure.issues.length > 0) && (
                  <SectionCard title="Formatting & Structure Issues" icon={AlertCircle}>
                    <div className="space-y-2">
                      {[...atsReport.sections.formatting.issues, ...atsReport.sections.structure.issues].map((issue, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-slate-700">
                          <AlertCircle size={13} className="text-amber-500 shrink-0 mt-0.5" />
                          {issue}
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* ── TAB: VERSIONS ── */}
        {activeTab === "versions" && (
          <motion.div key="versions" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <p className="text-sm text-slate-600">Every save and upload creates a snapshot. Restore any past version instantly.</p>
            {versions.length === 0 ? (
              <div className="text-center py-20 text-slate-400">
                <Clock size={40} className="mx-auto mb-4 opacity-30" />
                <p className="font-bold">No versions yet</p>
                <p className="text-xs mt-1">Upload or save your resume to start version history</p>
              </div>
            ) : (
              <div className="space-y-3">
                {versions.map(v => (
                  <div
                    key={v.id}
                    className={cn(
                      "flex items-center gap-4 bg-white rounded-2xl border px-5 py-4 transition-all",
                      v.id === currentVersionId ? "border-indigo-300 shadow-sm shadow-indigo-100" : "border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                      <FileText size={14} className="text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-800">v{v.versionNumber}</span>
                        {v.id === currentVersionId && (
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 text-[9px] font-black rounded-lg uppercase tracking-widest">Current</span>
                        )}
                        {v.fileFormat && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-black rounded-lg uppercase">{v.fileFormat}</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate">{v.changeSummary || "—"}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{new Date(v.createdAt).toLocaleString()}</p>
                    </div>
                    {v.atsScore !== undefined && v.atsScore !== null && (
                      <div className={cn("text-center px-3 py-1.5 rounded-xl border", scoreBg(v.atsScore))}>
                        <p className={cn("text-lg font-black leading-none", scoreColor(v.atsScore))}>{v.atsScore}</p>
                        <p className="text-[9px] text-slate-400 uppercase tracking-widest">ATS</p>
                      </div>
                    )}
                    {v.id !== currentVersionId && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDeleteVersion(v.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                          <Trash2 size={11} /> Delete
                        </button>
                        <button
                          onClick={() => handleRestoreVersion(v.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                          <RotateCcw size={11} /> Restore
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── TAB: PORTFOLIO ── */}
        {activeTab === "portfolio" && (
          <motion.div key="portfolio" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">Showcase your projects, open source contributions, and side work.</p>
              <button
                onClick={openCreateProject}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                <Plus size={13} /> Add Project
              </button>
            </div>

            {portfolioProjects.length === 0 && !showPortfolioForm && (
              <div className="text-center py-20 text-slate-400">
                <FolderGit2 size={40} className="mx-auto mb-4 opacity-30" />
                <p className="font-bold">No projects yet</p>
                <p className="text-xs mt-1">Add your first project to build your portfolio</p>
              </div>
            )}

            {/* Project cards grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {portfolioProjects.map(p => (
                <div key={p.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                  {p.imageUrl && (
                    <img src={p.imageUrl} alt={p.title} className="w-full h-32 object-cover" />
                  )}
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          {p.featured && <Star size={11} className="text-amber-400 fill-amber-400" />}
                          <h3 className="text-sm font-black text-slate-900">{p.title}</h3>
                        </div>
                        {p.role && <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{p.role}</p>}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => openEditProject(p)} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50"><Edit3 size={12} /></button>
                        <button onClick={() => handleDeleteProject(p.id)} className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50"><Trash2 size={12} /></button>
                      </div>
                    </div>

                    {p.description && <p className="text-xs text-slate-600 line-clamp-2">{p.description}</p>}

                    {p.techStack.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {p.techStack.slice(0, 5).map(t => (
                          <span key={t} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-md">{t}</span>
                        ))}
                        {p.techStack.length > 5 && <span className="text-[10px] text-slate-400">+{p.techStack.length - 5}</span>}
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                      {p.projectUrl && (
                        <a href={p.projectUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-indigo-600 hover:text-indigo-500 font-bold">
                          <ExternalLink size={10} /> Live
                        </a>
                      )}
                      {p.repoUrl && (
                        <a href={p.repoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-700 font-bold">
                          <Github size={10} /> Repo
                        </a>
                      )}
                      {p.startDate && (
                        <span className="ml-auto text-[10px] text-slate-400">{p.startDate} {p.isOngoing ? "– Present" : p.endDate ? `– ${p.endDate}` : ""}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Portfolio form modal */}
            <AnimatePresence>
              {showPortfolioForm && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                  onClick={e => { if (e.target === e.currentTarget) setShowPortfolioForm(false); }}
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
                  >
                    <div className="sticky top-0 bg-white/95 backdrop-blur-sm flex items-center justify-between px-6 py-4 border-b border-slate-100 z-10">
                      <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">
                        {editingProject ? "Edit Project" : "New Project"}
                      </h2>
                      <button onClick={() => setShowPortfolioForm(false)} className="p-1.5 text-slate-400 hover:text-slate-700"><X size={16} /></button>
                    </div>
                    <div className="p-6 space-y-4">
                      <TextInput label="Project Title *" value={projectForm.title} onChange={v => setProjectForm(f => ({ ...f, title: v }))} placeholder="CareerVision AI" />
                      <TextInput label="Your Role" value={projectForm.role || ""} onChange={v => setProjectForm(f => ({ ...f, role: v }))} placeholder="Lead Developer" />
                      <TextInput label="Description" value={projectForm.description || ""} onChange={v => setProjectForm(f => ({ ...f, description: v }))} multiline rows={3} placeholder="Describe what the project does and your contributions…" />
                      <TagInput label="Tech Stack" tags={projectForm.techStack} onChange={v => setProjectForm(f => ({ ...f, techStack: v }))} />
                      <div className="grid grid-cols-2 gap-4">
                        <TextInput label="Start Date" value={projectForm.startDate || ""} onChange={v => setProjectForm(f => ({ ...f, startDate: v }))} placeholder="2023-01" />
                        <TextInput label="End Date" value={projectForm.endDate || ""} onChange={v => setProjectForm(f => ({ ...f, endDate: v }))} placeholder="2024-06" />
                      </div>
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
                        <input type="checkbox" checked={projectForm.isOngoing} onChange={e => setProjectForm(f => ({ ...f, isOngoing: e.target.checked }))} className="rounded" />
                        Ongoing project
                      </label>
                      <TextInput label="Live URL" value={projectForm.projectUrl || ""} onChange={v => setProjectForm(f => ({ ...f, projectUrl: v }))} placeholder="https://careervision.ai" />
                      <TextInput label="Repository URL" value={projectForm.repoUrl || ""} onChange={v => setProjectForm(f => ({ ...f, repoUrl: v }))} placeholder="https://github.com/..." />
                      <TextInput label="Cover Image URL" value={projectForm.imageUrl || ""} onChange={v => setProjectForm(f => ({ ...f, imageUrl: v }))} placeholder="https://..." />
                      <TagInput label="Tags" tags={projectForm.tags} onChange={v => setProjectForm(f => ({ ...f, tags: v }))} />
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
                        <input type="checkbox" checked={projectForm.featured} onChange={e => setProjectForm(f => ({ ...f, featured: e.target.checked }))} className="rounded" />
                        Featured project
                      </label>
                    </div>
                    <div className="px-6 pb-6 flex gap-3 justify-end">
                      <button onClick={() => setShowPortfolioForm(false)} className="px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-600 hover:text-slate-800 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all">Cancel</button>
                      <button
                        onClick={handleSaveProject}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                      >
                        {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                        {isSaving ? "Saving…" : "Save Project"}
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete version confirmation */}
      <AnimatePresence>
        {pendingDeleteVersionId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-slate-950/45" onClick={() => !isDeletingVersion && setPendingDeleteVersionId(null)} />
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 8 }}
              className="relative w-full max-w-md rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                  <Trash2 size={16} className="text-rose-600" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Delete Resume Version?</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    This will permanently delete this older snapshot. This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-1">
                <button
                  onClick={() => setPendingDeleteVersionId(null)}
                  disabled={isDeletingVersion}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteVersion}
                  disabled={isDeletingVersion}
                  className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-60 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                >
                  {isDeletingVersion ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  {isDeletingVersion ? "Deleting…" : "Delete Version"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ResumeManager;

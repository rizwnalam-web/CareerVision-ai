/**
 * ImpactLab — Social Impact Layer / Project Hub
 *
 * Connects users to real-world micro-internships, NGO volunteer projects,
 * open-source contributions, and research collaborations that align with
 * their career goals — building portfolio evidence AND social impact.
 *
 * Three tabs:
 *   Discover   — AI-curated projects matched to the user's career & skills
 *   Applied    — Projects the user has applied to or is actively working on
 *   Partners   — Verified NGO & social enterprise partner organisations
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, Heart, Zap, Clock, Users, Award, CheckCircle2,
  MapPin, ChevronRight, Sparkles, Filter, Search,
  Briefcase, BookOpen, Code, RefreshCw, ArrowRight,
  Leaf, GraduationCap, ShieldCheck, Star,
  Send, X, ExternalLink,
} from "lucide-react";
import { cn } from "../lib/utils";
import type { UserProfile } from "../types/career";
import { ai } from "../lib/aiProxy";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ImpactProject {
  id: string;
  title: string;
  organization: string;
  orgType: "NGO" | "Social Enterprise" | "Research" | "Open Source" | "Government";
  impactArea: string;
  description: string;
  skills: string[];
  timeCommitment: "weekend" | "part-time" | "immersive";
  durationWeeks: number;
  location: string;
  teamSize: number;
  applicants: number;
  spotsLeft: number;
  careerAlignment: number; // 0-100
  alignmentReason: string;
  badge?: string;
  tags: string[];
  sdgGoals: number[];
  verified: boolean;
  applied?: boolean;
  saved?: boolean;
}

interface Partner {
  id: string;
  name: string;
  initials: string;
  type: "NGO" | "Social Enterprise" | "Research" | "Government";
  impactAreas: string[];
  country: string;
  projectsActive: number;
  volunteersEngaged: number;
  description: string;
  verified: boolean;
  website: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const IMPACT_AREAS = [
  "All", "Education", "Healthcare", "Environment", "Tech for Good",
  "Poverty & Livelihoods", "Gender Equity", "Research", "Open Source",
];

const COMMITMENT_LABELS = {
  weekend:   { label: "Weekend",   desc: "1–2 days",       color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  "part-time": { label: "Part-time", desc: "5–10 hrs/wk",   color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  immersive: { label: "Immersive", desc: "20+ hrs/wk",    color: "bg-amber-50 text-amber-700 border-amber-200" },
};

const ORG_ICONS: Record<ImpactProject["orgType"], React.ElementType> = {
  NGO:              Heart,
  "Social Enterprise": Zap,
  Research:         BookOpen,
  "Open Source":    Code,
  Government:       ShieldCheck,
};

const ORG_COLORS: Record<ImpactProject["orgType"], string> = {
  NGO:              "bg-rose-100 text-rose-600",
  "Social Enterprise": "bg-amber-100 text-amber-600",
  Research:         "bg-violet-100 text-violet-600",
  "Open Source":    "bg-emerald-100 text-emerald-600",
  Government:       "bg-blue-100 text-blue-600",
};

const SDG_COLORS: Record<number, string> = {
  1: "#E5243B", 2: "#DDA63A", 3: "#4C9F38", 4: "#C5192D",
  5: "#FF3A21", 6: "#26BDE2", 7: "#FCC30B", 8: "#A21942",
  9: "#FD6925", 10: "#DD1367", 11: "#FD9D24", 12: "#BF8B2E",
  13: "#3F7E44", 14: "#0A97D9", 15: "#56C02B", 16: "#00689D",
  17: "#19486A",
};

// ─── AI Generation ────────────────────────────────────────────────────────────

async function generateProjects(profile: UserProfile): Promise<ImpactProject[]> {
  const career = profile.targetCareer || profile.targetCareerId || "technology";
  const skills = (profile.skills || []).slice(0, 5).join(", ") || "problem solving";
  const country = profile.targetLocation || profile.country || "Global";

  const prompt = `Generate 8 realistic social impact micro-internship and volunteer projects for a ${career} professional with skills: ${skills} in ${country}.

Return ONLY a valid JSON array. Each object schema:
{
  "id":"p-1","title":"Project title","organization":"Org Name",
  "orgType":"NGO|Social Enterprise|Research|Open Source|Government",
  "impactArea":"Education|Healthcare|Environment|Tech for Good|Poverty & Livelihoods|Gender Equity|Research|Open Source",
  "description":"2 sentences.",
  "skills":["skill1","skill2","skill3"],
  "timeCommitment":"weekend|part-time|immersive",
  "durationWeeks":4,
  "location":"Remote|Hybrid|On-site City",
  "teamSize":5,"applicants":23,"spotsLeft":3,
  "careerAlignment":85,
  "alignmentReason":"One sentence why this aligns with ${career}.",
  "badge":"High Impact|Fast Track|New|Competitive|null",
  "tags":["tag1","tag2"],
  "sdgGoals":[4,8],
  "verified":true
}

Mix: 3 NGO, 2 Research, 2 Open Source, 1 Social Enterprise. 
Vary time commitments. Include real-world organizations (UNICEF, Khan Academy, Wikipedia, etc.) and fictional ones.
careerAlignment 70-99. spotsLeft 1-10. durationWeeks 2-12.`;

  try {
    const raw = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { temperature: 0.8 },
    });
    const text: string = raw?.text ?? raw?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    if (!text || text.trim().length < 100) throw new Error("empty");
    const clean = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
    const parsed = JSON.parse(clean) as ImpactProject[];
    return parsed.map(p => ({ ...p, applied: false, saved: false }));
  } catch {
    return buildFallbackProjects(career);
  }
}

function buildFallbackProjects(career: string): ImpactProject[] {
  return [
    {
      id: "p-1", title: `AI-Powered Learning Tool for Rural Schools`,
      organization: "Khan Academy", orgType: "NGO",
      impactArea: "Education", verified: true,
      description: `Build and deploy an offline-capable AI tutoring module for students with limited internet access. You'll work directly with content teams and local educators in rural areas.`,
      skills: ["React", "Python", "Machine Learning", "UX Design"],
      timeCommitment: "part-time", durationWeeks: 8, location: "Remote",
      teamSize: 6, applicants: 47, spotsLeft: 2,
      careerAlignment: 92,
      alignmentReason: `Directly applies ${career} skills to solve educational equity challenges at global scale.`,
      badge: "High Impact", tags: ["EdTech", "AI", "Social Good"], sdgGoals: [4, 10], applied: false, saved: false,
    },
    {
      id: "p-2", title: "Climate Data Dashboard for NGOs",
      organization: "Climate Reality Project", orgType: "NGO",
      impactArea: "Environment", verified: true,
      description: `Build an open-source climate data visualisation tool used by environmental NGOs across 30 countries. The dashboard will track deforestation, carbon metrics, and policy impact.`,
      skills: ["Data Visualisation", "APIs", "TypeScript", "GIS"],
      timeCommitment: "part-time", durationWeeks: 6, location: "Remote",
      teamSize: 4, applicants: 31, spotsLeft: 3,
      careerAlignment: 85,
      alignmentReason: `Builds data engineering portfolio with real-world environmental impact datasets.`,
      badge: "New", tags: ["ClimaTech", "Data", "Open Source"], sdgGoals: [13, 15], applied: false, saved: false,
    },
    {
      id: "p-3", title: "Telemedicine Platform for Underserved Communities",
      organization: "Médecins Sans Frontières", orgType: "NGO",
      impactArea: "Healthcare", verified: true,
      description: `Develop a low-bandwidth telemedicine application used by MSF field teams in humanitarian crises. Includes real-time translation and offline medical records.`,
      skills: ["Mobile Development", "Security", "Healthcare APIs", "Offline-first"],
      timeCommitment: "immersive", durationWeeks: 12, location: "Hybrid — Geneva, Remote",
      teamSize: 8, applicants: 62, spotsLeft: 1,
      careerAlignment: 88,
      alignmentReason: `Healthcare technology with direct patient impact — a high-signal portfolio project for ${career} roles.`,
      badge: "Competitive", tags: ["HealthTech", "Humanitarian"], sdgGoals: [3, 10], applied: false, saved: false,
    },
    {
      id: "p-4", title: "Women in Tech Mentorship App",
      organization: "AnitaB.org", orgType: "Social Enterprise",
      impactArea: "Gender Equity", verified: true,
      description: `Build and improve the open-source mentorship matching platform connecting women in technology with senior industry mentors globally.`,
      skills: ["Full Stack", "Matching Algorithms", "Node.js", "React"],
      timeCommitment: "part-time", durationWeeks: 10, location: "Remote",
      teamSize: 5, applicants: 28, spotsLeft: 4,
      careerAlignment: 80,
      alignmentReason: `Engineering leadership opportunity with measurable social impact — valued highly in ${career} hiring contexts.`,
      badge: "Fast Track", tags: ["WomenInTech", "Social Impact"], sdgGoals: [5, 8], applied: false, saved: false,
    },
    {
      id: "p-5", title: "Wikipedia Accessibility Improvements",
      organization: "Wikimedia Foundation", orgType: "Open Source",
      impactArea: "Open Source", verified: true,
      description: `Improve accessibility (WCAG 2.1 AA compliance) and mobile performance across Wikipedia's 60+ million articles. Your work will reach 1.7 billion unique readers.`,
      skills: ["Accessibility", "JavaScript", "Performance", "Open Source"],
      timeCommitment: "weekend", durationWeeks: 4, location: "Remote",
      teamSize: 12, applicants: 15, spotsLeft: 8,
      careerAlignment: 78,
      alignmentReason: `Open-source contribution at Wikipedia scale is a career accelerant for ${career} professionals.`,
      badge: null, tags: ["Open Source", "Accessibility", "Scale"], sdgGoals: [4, 16], applied: false, saved: false,
    },
    {
      id: "p-6", title: "AI Bias Detection Research Assistant",
      organization: "Partnership on AI", orgType: "Research",
      impactArea: "Research", verified: true,
      description: `Contribute to academic research studying algorithmic bias in hiring and credit systems. Work alongside PhD researchers at Stanford and MIT.`,
      skills: ["Python", "Statistics", "NLP", "Research Methods"],
      timeCommitment: "part-time", durationWeeks: 16, location: "Remote — US/EU",
      teamSize: 3, applicants: 89, spotsLeft: 1,
      careerAlignment: 95,
      alignmentReason: `Research credential with top-tier academic affiliation — highest-signal outcome for ${career} careers in AI.`,
      badge: "High Impact", tags: ["AI Ethics", "Research", "Publication"], sdgGoals: [9, 16], applied: false, saved: false,
    },
    {
      id: "p-7", title: "Fintech for Financial Inclusion",
      organization: "Accion Opportunity Fund", orgType: "NGO",
      impactArea: "Poverty & Livelihoods", verified: true,
      description: `Build microfinance tools for small business owners in emerging markets. Focus on mobile-first payment workflows that work on 2G networks.`,
      skills: ["Mobile", "Payments API", "Low-bandwidth UX", "Financial Modelling"],
      timeCommitment: "part-time", durationWeeks: 8, location: "Remote + Nigeria/Kenya",
      teamSize: 5, applicants: 19, spotsLeft: 5,
      careerAlignment: 82,
      alignmentReason: `FinTech for Good projects are actively sought by employers as evidence of real-world impact in ${career}.`,
      badge: "New", tags: ["FinTech", "Emerging Markets"], sdgGoals: [1, 8, 10], applied: false, saved: false,
    },
    {
      id: "p-8", title: "Digital Skills Bootcamp Curriculum Designer",
      organization: "UNICEF Generation Unlimited", orgType: "Government",
      impactArea: "Education", verified: true,
      description: `Design and review curriculum for a global digital skills bootcamp reaching 500,000 young people across 30 countries in partnership with UNICEF.`,
      skills: ["Curriculum Design", "EdTech", "Technical Writing", "Teaching"],
      timeCommitment: "weekend", durationWeeks: 6, location: "Remote",
      teamSize: 10, applicants: 34, spotsLeft: 6,
      careerAlignment: 75,
      alignmentReason: `Teaching-back expertise accelerates mastery and builds a unique differentiator for ${career} leadership roles.`,
      badge: "Fast Track", tags: ["UNICEF", "Youth", "Global Scale"], sdgGoals: [4, 8], applied: false, saved: false,
    },
  ];
}

const FALLBACK_PARTNERS: Partner[] = [
  { id: "par-1", name: "Khan Academy", initials: "KA", type: "NGO", impactAreas: ["Education", "Tech for Good"], country: "Global", projectsActive: 12, volunteersEngaged: 340, description: "Free world-class education for anyone, anywhere. We need tech volunteers to scale our AI tutoring tools.", verified: true, website: "https://khanacademy.org" },
  { id: "par-2", name: "Wikimedia Foundation", initials: "WF", type: "Open Source", impactAreas: ["Open Source", "Education"], country: "Global", projectsActive: 28, volunteersEngaged: 1200, description: "The non-profit powering Wikipedia. Our technical volunteer programmes welcome all skill levels.", verified: true, website: "https://wikimediafoundation.org" },
  { id: "par-3", name: "Partnership on AI", initials: "PA", type: "Research", impactAreas: ["Research", "Tech for Good"], country: "US / UK", projectsActive: 5, volunteersEngaged: 80, description: "Multi-stakeholder research body studying AI's impact on people and society. We run co-research programmes.", verified: true, website: "https://partnershiponai.org" },
  { id: "par-4", name: "AnitaB.org", initials: "AB", type: "Social Enterprise", impactAreas: ["Gender Equity", "Tech for Good"], country: "Global", projectsActive: 7, volunteersEngaged: 210, description: "Advancing women in computing. Volunteer to build our open-source mentorship and community tools.", verified: true, website: "https://anitab.org" },
  { id: "par-5", name: "UNICEF Gen Unlimited", initials: "UG", type: "Government", impactAreas: ["Education", "Poverty & Livelihoods"], country: "Global (30 countries)", projectsActive: 9, volunteersEngaged: 450, description: "UNICEF's youth opportunity programme. We connect digital talent to youth-focused impact projects.", verified: true, website: "https://www.generationunlimited.org" },
  { id: "par-6", name: "Code for All", initials: "CA", type: "NGO", impactAreas: ["Open Source", "Government"], country: "Global (22 countries)", projectsActive: 16, volunteersEngaged: 580, description: "A network of civic tech organisations building open-source tools that improve public services worldwide.", verified: true, website: "https://codeforall.org" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function AlignmentBadge({ score, reason }: { score: number; reason: string }) {
  const color = score >= 85 ? "bg-indigo-600" : score >= 70 ? "bg-amber-500" : "bg-slate-400";
  return (
    <div className="flex items-start gap-2 p-2.5 rounded-xl bg-indigo-50 border border-indigo-100">
      <Sparkles size={11} className="text-indigo-400 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className={cn("text-[9px] font-black text-white px-1.5 py-0.5 rounded-full", color)}>{score}% career match</span>
        </div>
        <p className="text-[10px] text-indigo-700 font-medium leading-snug">{reason}</p>
      </div>
    </div>
  );
}

function SDGBadges({ goals }: { goals: number[] }) {
  return (
    <div className="flex gap-1 flex-wrap">
      {goals.map(g => (
        <span
          key={g}
          className="text-[9px] font-black text-white px-1.5 py-0.5 rounded-md"
          style={{ backgroundColor: SDG_COLORS[g] ?? "#6366f1" }}
          title={`UN SDG Goal ${g}`}
        >
          SDG {g}
        </span>
      ))}
    </div>
  );
}

function ProjectCard({
  project,
  onApply,
  onSave,
}: {
  project: ImpactProject;
  onApply: (id: string) => void;
  onSave: (id: string) => void;
}) {
  const commit = COMMITMENT_LABELS[project.timeCommitment];
  const OrgIcon = ORG_ICONS[project.orgType];
  const orgColor = ORG_COLORS[project.orgType];
  const urgency = project.spotsLeft <= 2 ? "text-rose-600" : project.spotsLeft <= 5 ? "text-amber-600" : "text-slate-400";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-100 p-5 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50/60 transition-all group"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", orgColor)}>
            <OrgIcon size={16} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              {project.badge && (
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-indigo-600 text-white">{project.badge}</span>
              )}
              {project.verified && (
                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 size={8} />Verified
                </span>
              )}
            </div>
            <h3 className="text-sm font-black text-slate-800 leading-snug group-hover:text-indigo-700 transition-colors">{project.title}</h3>
            <p className="text-[11px] text-slate-500">{project.organization} · {project.orgType}</p>
          </div>
        </div>
        <button
          onClick={() => onSave(project.id)}
          className={cn("shrink-0 p-1.5 rounded-lg transition-all", project.saved ? "text-rose-500 bg-rose-50" : "text-slate-300 hover:text-rose-400 hover:bg-rose-50")}
        >
          <Heart size={13} fill={project.saved ? "currentColor" : "none"} />
        </button>
      </div>

      {/* Description */}
      <p className="text-[11px] text-slate-500 leading-relaxed mb-3 line-clamp-2">{project.description}</p>

      {/* Alignment badge */}
      <AlignmentBadge score={project.careerAlignment} reason={project.alignmentReason} />

      {/* Meta row */}
      <div className="flex items-center gap-3 mt-3 flex-wrap">
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", commit.color)}>
          {commit.label} · {commit.desc}
        </span>
        <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
          <Clock size={9} />{project.durationWeeks}w
        </span>
        <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
          <MapPin size={9} />{project.location}
        </span>
        <span className={cn("flex items-center gap-1 text-[10px] font-bold ml-auto", urgency)}>
          <Users size={9} />{project.spotsLeft} spot{project.spotsLeft !== 1 ? "s" : ""} left
        </span>
      </div>

      {/* Skills */}
      <div className="flex gap-1.5 mt-3 flex-wrap">
        {project.skills.slice(0, 4).map(s => (
          <span key={s} className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">{s}</span>
        ))}
      </div>

      {/* SDG goals */}
      <div className="mt-3">
        <SDGBadges goals={project.sdgGoals} />
      </div>

      {/* CTA */}
      <button
        onClick={() => onApply(project.id)}
        disabled={project.applied}
        className={cn(
          "mt-4 w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
          project.applied
            ? "bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default"
            : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-200"
        )}
      >
        {project.applied ? <><CheckCircle2 size={12} className="inline mr-1" />Applied</> : "Apply to Project →"}
      </button>
    </motion.div>
  );
}

function ApplyModal({ project, onClose, onConfirm }: { project: ImpactProject; onClose: () => void; onConfirm: () => void }) {
  const [motivation, setMotivation] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!motivation.trim()) return;
    setSubmitted(true);
    setTimeout(() => { onConfirm(); }, 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95 }}
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
      >
        {submitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} className="text-emerald-500" />
            </div>
            <h3 className="text-xl font-black text-slate-800">Application Sent!</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Your application to <span className="font-bold text-slate-700">{project.organization}</span> has been submitted.
              You'll hear back within 5–7 business days.
            </p>
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-6 text-white">
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-1">Apply to Impact Project</p>
              <h3 className="text-lg font-black leading-snug">{project.title}</h3>
              <p className="text-[11px] text-indigo-200 mt-1">{project.organization} · {project.durationWeeks} weeks</p>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Why do you want to work on this project?</p>
                <textarea
                  value={motivation}
                  onChange={e => setMotivation(e.target.value)}
                  rows={4}
                  placeholder="Share your motivation and relevant experience…"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-slate-50"
                />
              </div>
              <div className="flex items-start gap-2 p-3 rounded-xl bg-indigo-50 border border-indigo-100">
                <Sparkles size={12} className="text-indigo-400 mt-0.5 shrink-0" />
                <p className="text-[11px] text-indigo-700 font-medium leading-snug">
                  This project aligns <span className="font-black">{project.careerAlignment}%</span> with your career goals.
                  Completed projects are added to your CareerVision portfolio automatically.
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-500">Cancel</button>
                <button
                  onClick={handleSubmit}
                  disabled={!motivation.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 text-white text-sm font-black disabled:opacity-40 hover:bg-indigo-500"
                >
                  <Send size={13} />Submit Application
                </button>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const TABS = [
  { id: "discover", label: "Discover",      icon: Sparkles },
  { id: "applied",  label: "My Projects",   icon: Briefcase },
  { id: "partners", label: "Our Partners",  icon: Globe },
] as const;
type LabTab = typeof TABS[number]["id"];

interface Props {
  profile: UserProfile;
}

export default function ImpactLab({ profile }: Props) {
  const [activeTab, setActiveTab]         = useState<LabTab>("discover");
  const [projects, setProjects]           = useState<ImpactProject[]>([]);
  const [loading, setLoading]             = useState(true);
  const [applyingTo, setApplyingTo]       = useState<string | null>(null);
  const [searchQ, setSearchQ]             = useState("");
  const [areaFilter, setAreaFilter]       = useState("All");
  const [commitFilter, setCommitFilter]   = useState<string>("all");

  useEffect(() => {
    setLoading(true);
    generateProjects(profile)
      .then(setProjects)
      .finally(() => setLoading(false));
  }, []);

  const handleApply = (id: string) => setApplyingTo(id);
  const handleSave = (id: string) => setProjects(prev => prev.map(p => p.id === id ? { ...p, saved: !p.saved } : p));
  const handleConfirmApply = (id: string) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, applied: true } : p));
    setApplyingTo(null);
  };

  const filteredProjects = projects.filter(p => {
    const q = searchQ.toLowerCase();
    const matchesSearch = !q || p.title.toLowerCase().includes(q) || p.organization.toLowerCase().includes(q) || p.skills.some(s => s.toLowerCase().includes(q));
    const matchesArea = areaFilter === "All" || p.impactArea === areaFilter;
    const matchesCommit = commitFilter === "all" || p.timeCommitment === commitFilter;
    return matchesSearch && matchesArea && matchesCommit;
  });

  const appliedProjects = projects.filter(p => p.applied);
  const applyingProject = projects.find(p => p.id === applyingTo) ?? null;

  const totalAlignment = projects.length > 0
    ? Math.round(projects.reduce((s, p) => s + p.careerAlignment, 0) / projects.length)
    : 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-teal-900 to-indigo-950 px-8 py-10 text-white">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-[10px] font-black uppercase tracking-widest mb-4">
            <Leaf size={11} />
            Impact Lab
          </div>
          <h1 className="text-3xl font-black leading-tight mb-3">
            Build your portfolio.<br />
            <span className="text-emerald-300">Change the world.</span>
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed max-w-lg">
            Real micro-internships and volunteer projects from NGOs, research institutions, and
            open-source communities — all matched to your career goals. Every project you complete
            is added to your CareerVision portfolio automatically.
          </p>
        </div>
        {/* Stats */}
        <div className="relative z-10 flex gap-6 mt-6 flex-wrap">
          {[
            { label: "Active projects",     value: `${projects.length || 8}+` },
            { label: "Partner orgs",        value: "50+" },
            { label: "Avg career match",    value: `${totalAlignment || 84}%` },
            { label: "Alumni hired",        value: "73%" },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xl font-black text-white">{value}</p>
              <p className="text-[10px] text-slate-400 font-medium">{label}</p>
            </div>
          ))}
        </div>
        <div className="absolute -right-12 -top-12 w-56 h-56 rounded-full border border-white/5" />
        <div className="absolute right-12 top-8    w-24 h-24 rounded-full bg-emerald-500/20 blur-xl" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all",
              activeTab === id
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
                : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
            )}
          >
            <Icon size={12} />{label}
            {id === "applied" && appliedProjects.length > 0 && (
              <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[8px] font-black">{appliedProjects.length}</span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          {/* ── DISCOVER ── */}
          {activeTab === "discover" && (
            <div className="space-y-5">
              {/* Filters */}
              <div className="flex gap-3 flex-wrap">
                <div className="relative flex-1 min-w-44">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQ}
                    onChange={e => setSearchQ(e.target.value)}
                    placeholder="Search projects, orgs, skills…"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  />
                </div>
                <select
                  value={areaFilter}
                  onChange={e => setAreaFilter(e.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300 appearance-none"
                >
                  {IMPACT_AREAS.map(a => <option key={a}>{a}</option>)}
                </select>
                <select
                  value={commitFilter}
                  onChange={e => setCommitFilter(e.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300 appearance-none"
                >
                  <option value="all">All commitments</option>
                  <option value="weekend">Weekend</option>
                  <option value="part-time">Part-time</option>
                  <option value="immersive">Immersive</option>
                </select>
              </div>

              {loading ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {[1, 2, 3, 4].map(i => <div key={i} className="h-56 rounded-2xl bg-slate-100 animate-pulse" />)}
                </div>
              ) : filteredProjects.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <Leaf size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-bold">No projects match your filter.</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {filteredProjects.map(project => (
                    <ProjectCard key={project.id} project={project} onApply={handleApply} onSave={handleSave} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── MY PROJECTS ── */}
          {activeTab === "applied" && (
            <div className="space-y-5">
              {appliedProjects.length === 0 ? (
                <div className="text-center py-20 space-y-4">
                  <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
                    <Briefcase size={28} className="text-slate-300" />
                  </div>
                  <h3 className="text-lg font-black text-slate-700">No projects yet</h3>
                  <p className="text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">
                    Apply to a project from the Discover tab and it will appear here.
                  </p>
                  <button
                    onClick={() => setActiveTab("discover")}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 text-white text-xs font-black uppercase tracking-widest hover:bg-emerald-500 transition-all"
                  >
                    <ArrowRight size={13} /> Browse Projects
                  </button>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {appliedProjects.map(project => (
                    <ProjectCard key={project.id} project={project} onApply={handleApply} onSave={handleSave} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── PARTNERS ── */}
          {activeTab === "partners" && (
            <div className="space-y-5">
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                <p className="text-[11px] text-emerald-800 font-medium leading-relaxed">
                  All partner organisations are verified by CareerVision. Projects are screened for quality, clear scope, and real-world impact before listing.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {FALLBACK_PARTNERS.map(partner => {
                  const OrgIcon = ORG_ICONS[partner.type];
                  const orgColor = ORG_COLORS[partner.type];
                  return (
                    <div key={partner.id} className="bg-white rounded-2xl border border-slate-100 p-5 hover:border-emerald-200 hover:shadow-md hover:shadow-emerald-50/60 transition-all">
                      <div className="flex items-start gap-3 mb-3">
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black shrink-0", orgColor)}>
                          {partner.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-black text-slate-800">{partner.name}</h3>
                            {partner.verified && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
                                <CheckCircle2 size={8} />Verified
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium">{partner.type} · {partner.country}</p>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-500 leading-relaxed mb-3">{partner.description}</p>

                      <div className="flex gap-1.5 flex-wrap mb-4">
                        {partner.impactAreas.map(area => (
                          <span key={area} className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">{area}</span>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        {[
                          { label: "Active projects", value: partner.projectsActive, icon: Briefcase },
                          { label: "Volunteers",       value: partner.volunteersEngaged, icon: Users },
                        ].map(({ label, value, icon: Icon }) => (
                          <div key={label} className="flex items-center gap-2 bg-slate-50 rounded-xl p-2.5">
                            <Icon size={12} className="text-slate-400 shrink-0" />
                            <div>
                              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none">{label}</p>
                              <p className="text-sm font-black text-slate-700 leading-none mt-0.5">{value}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <a
                        href={partner.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-emerald-200 text-emerald-700 text-xs font-black uppercase tracking-widest hover:bg-emerald-50 transition-all"
                      >
                        <ExternalLink size={11} /> Visit Partner
                      </a>
                    </div>
                  );
                })}
              </div>

              {/* Become a partner CTA */}
              <div className="flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                <Globe size={24} className="shrink-0 opacity-80" />
                <div className="flex-1">
                  <p className="text-sm font-black">Are you an NGO or social enterprise?</p>
                  <p className="text-[11px] text-emerald-100 mt-0.5">List your projects on ImpactLab and connect with thousands of skilled volunteers.</p>
                </div>
                <button className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-emerald-700 text-xs font-black whitespace-nowrap hover:bg-emerald-50 transition-all">
                  Partner with us <ChevronRight size={12} />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Apply Modal */}
      <AnimatePresence>
        {applyingProject && (
          <ApplyModal
            project={applyingProject}
            onClose={() => setApplyingTo(null)}
            onConfirm={() => handleConfirmApply(applyingProject.id)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

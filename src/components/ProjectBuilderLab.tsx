/**
 * ProjectBuilderLab — AI Software Engineering Lifecycle Roadmap Creator
 *
 * Flow:
 *   Define Goal → Generate Stack → Architecture & ERD → Milestones & Tasks → Review Setup Plan
 */

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Target, Cpu, Boxes, KanbanSquare, CheckCircle, ArrowRight, ArrowLeft,
  RefreshCw, Sparkles, FolderTree, Database, GitBranch, Globe, Terminal,
  ChevronDown, ChevronUp, Code, ShieldCheck, Clock,
} from "lucide-react";
import { cn } from "../lib/utils";
import type { UserProfile } from "../types/career";
import type {
  BuilderPhase, IntentConfig, TechStackPlan, ArchitecturePlan,
  MilestonePlan, Sprint, SprintTask, FolderNode, ERDEntity,
} from "../types/projectBuilder";
import {
  generateTechStack, generateArchitecture, generateMilestones,
} from "../services/projectBuilderService";

const PHASES: { key: BuilderPhase; label: string; icon: React.ElementType }[] = [
  { key: "intent",       label: "Define Goal",  icon: Target },
  { key: "stack",        label: "Tech Stack",   icon: Cpu },
  { key: "architecture", label: "Architecture", icon: Boxes },
  { key: "milestones",   label: "Milestones",   icon: KanbanSquare },
  { key: "review",       label: "Launch Plan",  icon: CheckCircle },
];

const ROLE_OPTIONS = [
  "Full-Stack Developer",
  "Frontend Engineer",
  "Backend Engineer",
  "Data Engineer",
  "Cloud Architect",
  "DevOps Engineer",
  "Machine Learning Engineer",
  "Security Engineer",
];

const DOMAIN_OPTIONS = [
  "E-commerce",
  "FinTech",
  "Healthcare",
  "EdTech",
  "IoT",
  "SaaS",
  "Cybersecurity",
  "Media & Streaming",
];

interface Props { profile: UserProfile }

export default function ProjectBuilderLab({ profile }: Props) {
  const [phase, setPhase] = useState<BuilderPhase>("intent");
  const phaseIdx = PHASES.findIndex(p => p.key === phase);
  const [loading, setLoading] = useState(false);

  const [intent, setIntent] = useState<IntentConfig>({
    targetRole: "Full-Stack Developer",
    domain: "SaaS",
    experienceLevel: "intermediate",
    timeCommitment: "1-month",
  });

  const [stackPlan, setStackPlan] = useState<TechStackPlan | null>(null);
  const [architecture, setArchitecture] = useState<ArchitecturePlan | null>(null);
  const [milestones, setMilestones] = useState<MilestonePlan | null>(null);
  const [expandedSprint, setExpandedSprint] = useState<string | null>(null);

  const handleGenerateStack = useCallback(async () => {
    setLoading(true);
    try {
      const data = await generateTechStack(intent);
      setStackPlan(data);
      setPhase("stack");
    } catch (e) {
      console.error("Stack generation failed:", e);
    } finally {
      setLoading(false);
    }
  }, [intent]);

  const handleGenerateArchitecture = useCallback(async () => {
    if (!stackPlan) return;
    setLoading(true);
    try {
      const data = await generateArchitecture(
        stackPlan.projectTitle,
        stackPlan.projectDescription,
        stackPlan.stack || [],
        stackPlan.targetRole,
        stackPlan.domain,
      );
      setArchitecture(data);
      setPhase("architecture");
    } catch (e) {
      console.error("Architecture generation failed:", e);
    } finally {
      setLoading(false);
    }
  }, [stackPlan]);

  const handleGenerateMilestones = useCallback(async () => {
    if (!stackPlan) return;
    setLoading(true);
    try {
      const data = await generateMilestones(
        stackPlan.projectTitle,
        stackPlan.stack || [],
        architecture,
        stackPlan.targetRole,
        intent.timeCommitment,
      );
      setMilestones(data);
      setExpandedSprint(data.sprints?.[0]?.id || null);
      setPhase("milestones");
    } catch (e) {
      console.error("Milestone generation failed:", e);
    } finally {
      setLoading(false);
    }
  }, [stackPlan, architecture, intent.timeCommitment]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center">
            <Boxes size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">Project Builder Lab</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">AI Software Engineering Roadmap Creator</p>
          </div>
        </div>

        <div className="flex items-center gap-1 mt-5 overflow-x-auto pb-1">
          {PHASES.map((p, i) => {
            const Icon = p.icon;
            const isActive = i === phaseIdx;
            const isDone = i < phaseIdx;
            return (
              <div key={p.key} className="flex items-center gap-1 shrink-0">
                {i > 0 && <div className={cn("w-6 h-0.5 rounded-full", isDone ? "bg-sky-500" : "bg-slate-200")} />}
                <div className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all",
                  isActive && "bg-sky-600 text-white shadow-md shadow-sky-200",
                  isDone && "bg-sky-100 text-sky-700",
                  !isActive && !isDone && "bg-slate-100 text-slate-400",
                )}>
                  {isDone ? <CheckCircle size={12} /> : <Icon size={12} />}
                  <span className="hidden sm:inline">{p.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={phase}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
        >
          {phase === "intent" && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
              <div>
                <h3 className="font-black text-slate-900">Define Your Project Goal</h3>
                <p className="text-sm text-slate-500 mt-0.5">Choose the role and domain you want to optimize for, and the AI will build a realistic engineering roadmap.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Target Role</label>
                  <select
                    value={intent.targetRole}
                    onChange={e => setIntent(prev => ({ ...prev, targetRole: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 text-sm px-4 py-3 focus:border-sky-400 focus:ring-2 focus:ring-sky-50 outline-none"
                  >
                    {ROLE_OPTIONS.map(role => <option key={role} value={role}>{role}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Domain</label>
                  <select
                    value={intent.domain}
                    onChange={e => setIntent(prev => ({ ...prev, domain: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 text-sm px-4 py-3 focus:border-sky-400 focus:ring-2 focus:ring-sky-50 outline-none"
                  >
                    {DOMAIN_OPTIONS.map(domain => <option key={domain} value={domain}>{domain}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Experience Level</label>
                  <select
                    value={intent.experienceLevel}
                    onChange={e => setIntent(prev => ({ ...prev, experienceLevel: e.target.value as IntentConfig["experienceLevel"] }))}
                    className="w-full rounded-xl border border-slate-200 text-sm px-4 py-3 focus:border-sky-400 focus:ring-2 focus:ring-sky-50 outline-none"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Time Commitment</label>
                  <select
                    value={intent.timeCommitment}
                    onChange={e => setIntent(prev => ({ ...prev, timeCommitment: e.target.value as IntentConfig["timeCommitment"] }))}
                    className="w-full rounded-xl border border-slate-200 text-sm px-4 py-3 focus:border-sky-400 focus:ring-2 focus:ring-sky-50 outline-none"
                  >
                    <option value="2-weeks">2 Weeks</option>
                    <option value="1-month">1 Month</option>
                    <option value="2-months">2 Months</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleGenerateStack}
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-sky-200"
                >
                  {loading ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  Generate Stack & Project
                </button>
              </div>
            </div>
          )}

          {phase === "stack" && stackPlan && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-sky-600 mb-1">Recommended Project</p>
                <h3 className="font-black text-lg text-slate-900">{stackPlan.projectTitle}</h3>
                <p className="text-sm text-slate-500 mt-1">{stackPlan.projectDescription}</p>
              </div>

              <p className="text-sm text-slate-700 bg-sky-50 border border-sky-100 rounded-xl p-4">
                <span className="font-bold text-sky-700">Why this stack:</span> {stackPlan.whyThisStack}
              </p>

              <div className="grid md:grid-cols-2 gap-3">
                {(stackPlan.stack || []).map(item => (
                  <div key={`${item.category}-${item.tool}`} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{item.category}</p>
                    <h4 className="font-bold text-sm text-slate-900">{item.tool}</h4>
                    <p className="text-xs text-slate-500 mt-1">{item.reason}</p>
                    {(item.alternatives || []).length > 0 && (
                      <p className="text-[10px] text-slate-400 mt-2">Alternatives: {item.alternatives.join(", ")}</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-2">
                <button onClick={() => setPhase("intent")} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 font-semibold">
                  <ArrowLeft size={14} /> Back
                </button>
                <button
                  onClick={handleGenerateArchitecture}
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-sky-200"
                >
                  {loading ? <RefreshCw size={14} className="animate-spin" /> : <FolderTree size={14} />}
                  Generate Architecture
                </button>
              </div>
            </div>
          )}

          {phase === "architecture" && stackPlan && architecture && (
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-sky-600 mb-1">System Blueprint</p>
                  <h3 className="font-black text-lg text-slate-900">Architecture & Data Model</h3>
                  <p className="text-sm text-slate-500 mt-1">{architecture.flowDescription}</p>
                </div>

                <div className="grid lg:grid-cols-2 gap-5">
                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <FolderTree size={15} className="text-sky-600" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Folder Structure</p>
                    </div>
                    <FolderTreeView nodes={architecture.folderStructure || []} depth={0} />
                  </div>

                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Database size={15} className="text-sky-600" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">ERD Entities</p>
                    </div>
                    <div className="space-y-3 max-h-[520px] overflow-auto pr-1">
                      {(architecture.erdEntities || []).map(entity => (
                        <div key={entity.name} className="bg-white rounded-lg border border-slate-200 p-3">
                          <p className="text-sm font-bold text-slate-900 mb-2">{entity.name}</p>
                          <div className="space-y-1">
                            {(entity.fields || []).map(field => (
                              <div key={field.name} className="text-[11px] text-slate-600 flex items-center justify-between gap-2">
                                <span className="font-mono">{field.name}: {field.type}</span>
                                {field.constraints && <span className="text-slate-400">{field.constraints}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {architecture.diagramMermaid && (
                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <GitBranch size={15} className="text-sky-600" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Mermaid Diagram</p>
                    </div>
                    <pre className="text-[11px] text-slate-700 bg-white rounded-lg p-4 border border-slate-200 overflow-x-auto whitespace-pre-wrap">
{architecture.diagramMermaid}
                    </pre>
                  </div>
                )}

                <div className="flex justify-between pt-2">
                  <button onClick={() => setPhase("stack")} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 font-semibold">
                    <ArrowLeft size={14} /> Back
                  </button>
                  <button
                    onClick={handleGenerateMilestones}
                    disabled={loading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-sky-200"
                  >
                    {loading ? <RefreshCw size={14} className="animate-spin" /> : <KanbanSquare size={14} />}
                    Build Sprint Plan
                  </button>
                </div>
              </div>
            </div>
          )}

          {phase === "milestones" && milestones && (
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-sky-600 mb-1">Execution Roadmap</p>
                    <h3 className="font-black text-lg text-slate-900">Sprint-by-Sprint Build Plan</h3>
                    <p className="text-sm text-slate-500 mt-1">Your project is broken down into delivery-focused sprints with engineering-grade tasks.</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-2xl font-black text-slate-900">{milestones.totalEstimatedHours || 0}h</p>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Estimated Total</p>
                  </div>
                </div>
              </div>

              {(milestones.sprints || []).map((sprint: Sprint) => {
                const isOpen = expandedSprint === sprint.id;
                return (
                  <div key={sprint.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <button
                      onClick={() => setExpandedSprint(isOpen ? null : sprint.id)}
                      className="w-full flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-all"
                    >
                      <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center text-sm font-black shrink-0">
                        {sprint.order}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <h4 className="font-bold text-sm text-slate-900">{sprint.title}</h4>
                        <p className="text-[10px] text-slate-500">{sprint.goal}</p>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1"><Clock size={11} /> {sprint.durationDays} days</span>
                      {isOpen ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 space-y-3 border-t border-slate-100 pt-4">
                            {(sprint.tasks || []).map((task: SprintTask) => (
                              <div key={task.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <h5 className="font-bold text-sm text-slate-900">{task.title}</h5>
                                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">{task.estimatedHours}h</span>
                                  {(task.labels || []).map(label => (
                                    <span key={label} className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{label}</span>
                                  ))}
                                </div>
                                <p className="text-xs text-slate-600 mb-2">{task.description}</p>
                                <div className="bg-white rounded-lg border border-slate-200 p-3">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Engineering Guideline</p>
                                  <p className="text-xs text-slate-700">{task.guideline}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}

              <div className="flex justify-between">
                <button onClick={() => setPhase("architecture")} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 font-semibold">
                  <ArrowLeft size={14} /> Back
                </button>
                <button
                  onClick={() => setPhase("review")}
                  className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-sky-200"
                >
                  Review Setup Plan <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {phase === "review" && milestones && (
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-sky-600 mb-1">Launch Checklist</p>
                  <h3 className="font-black text-lg text-slate-900">GitHub, Local Dev & Hosting Setup</h3>
                  <p className="text-sm text-slate-500 mt-1">A realistic setup plan covering repository hygiene, local environment, and deployment readiness.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <SetupCard icon={GitBranch} title="GitHub Setup" steps={milestones.setupInstructions?.github || []} color="indigo" />
                  <SetupCard icon={Terminal} title="Local Development" steps={milestones.setupInstructions?.localDev || []} color="amber" />
                  <SetupCard icon={Globe} title="Hosting & Deployment" steps={milestones.setupInstructions?.hosting || []} color="emerald" />
                </div>

                <div className="bg-sky-50 border border-sky-100 rounded-xl p-4 text-sm text-slate-700">
                  <p className="font-bold text-sky-700 mb-1">What this gives you</p>
                  <p>
                    You now have a role-specific project brief, a modern stack recommendation, an architecture blueprint, and a sprint plan detailed enough to start building immediately.
                  </p>
                </div>

                <div className="flex justify-between pt-2">
                  <button onClick={() => setPhase("milestones")} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 font-semibold">
                    <ArrowLeft size={14} /> Back
                  </button>
                  <button
                    onClick={() => {
                      setPhase("intent");
                      setStackPlan(null);
                      setArchitecture(null);
                      setMilestones(null);
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-all"
                  >
                    <Boxes size={14} /> Start Another Build Plan
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function FolderTreeView({ nodes, depth }: { nodes: FolderNode[]; depth: number }) {
  return (
    <div className="space-y-1">
      {(nodes || []).map(node => (
        <div key={`${depth}-${node.name}`}>
          <div className="text-xs text-slate-700" style={{ paddingLeft: `${depth * 16}px` }}>
            <span className={cn("font-mono", node.type === "folder" ? "font-bold text-slate-900" : "text-slate-600")}>{node.type === "folder" ? "📁" : "📄"} {node.name}</span>
            {node.description && <span className="text-slate-400"> — {node.description}</span>}
          </div>
          {node.children && node.children.length > 0 && <FolderTreeView nodes={node.children} depth={depth + 1} />}
        </div>
      ))}
    </div>
  );
}

function SetupCard({
  icon: Icon,
  title,
  steps,
  color,
}: {
  icon: React.ElementType;
  title: string;
  steps: string[];
  color: "indigo" | "amber" | "emerald";
}) {
  const colorMap = {
    indigo: "bg-indigo-50 border-indigo-100 text-indigo-700",
    amber: "bg-amber-50 border-amber-100 text-amber-700",
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-700",
  };

  return (
    <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center border", colorMap[color])}>
          <Icon size={15} />
        </div>
        <p className="text-sm font-bold text-slate-900">{title}</p>
      </div>
      <div className="space-y-2">
        {(steps || []).map((step, idx) => (
          <div key={idx} className="flex items-start gap-2 text-xs text-slate-600">
            <span className="w-5 h-5 rounded-full bg-white border border-slate-200 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{idx + 1}</span>
            <span>{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

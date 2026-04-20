import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Map, 
  School, 
  BookOpen, 
  CircleDollarSign, 
  MessageSquare, 
  ChevronRight,
  User,
  Settings,
  TrendingUp,
  Clock,
  ExternalLink,
  Search,
  Filter,
  PlayCircle,
  Headphones,
  Share2,
  Check,
  UserCheck,
  Activity,
  ArrowLeft,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from './lib/utils';
import { CAREER_PATHS, INSTITUTIONS, STUDY_MATERIALS } from './constants/mockData';
import { CareerPath, UserProfile, Institution } from './types/career';
import { getCareerAdvice } from './services/geminiService';

// --- Components ---

const NavItem = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={cn(
      "px-1 pb-1 transition-all duration-200 border-b-2 font-medium text-sm",
      active 
        ? "border-indigo-600 text-indigo-600" 
        : "border-transparent text-slate-600 hover:text-indigo-600"
    )}
  >
    {label}
  </button>
);

const SectionTitle = ({ title, subtitle }: { title: string, subtitle?: string }) => (
  <div className="mb-8">
    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{title}</h1>
    {subtitle && <p className="text-xs text-slate-400 font-mono mt-1 uppercase tracking-wider">{subtitle}</p>}
  </div>
);

const ShareButton = ({ title, type, id }: { title: string, type: string, id: string }) => {
  const [copied, setCopied] = useState(false);

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareText = `Check out this ${type} on CareerVision AI: ${title}. Explore more at ${window.location.origin}?ref=${id}`;
    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleShare}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
        copied 
          ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200" 
          : "bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-100"
      )}
    >
      {copied ? <Check size={12} /> : <Share2 size={12} />}
      {copied ? "Copied" : "Share"}
    </button>
  );
};

// --- Pages ---

const Dashboard = ({ profile, onSelectPath }: { profile: UserProfile, onSelectPath: (id: string) => void }) => {
  return (
    <div className="space-y-8 pb-12">
      <div className="bg-indigo-600 rounded-2xl p-8 text-white relative overflow-hidden shadow-lg">
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-3xl font-bold mb-3">Hello, {profile.name}! 👋</h2>
          <p className="text-indigo-100 text-base mb-6 opacity-90">
            Based on your interests in {profile.interests.join(", ")}, we've found 3 high-growth career paths for you to explore.
          </p>
          <button 
            onClick={() => onSelectPath(CAREER_PATHS[0].id)}
            className="bg-white text-indigo-600 px-6 py-2 rounded-lg font-bold hover:bg-indigo-50 transition-all flex items-center gap-2 text-sm shadow-sm"
          >
            Start Your Journey <ChevronRight size={16} />
          </button>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
      </div>

      <div>
        <SectionTitle title="Recommended Paths" subtitle="Market Analysis: O*NET + BLS Real-time" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CAREER_PATHS.map((path) => (
            <motion.div
              key={path.id}
              whileHover={{ y: -4, borderColor: 'var(--color-indigo-400)' }}
              onClick={() => onSelectPath(path.id)}
              className="bg-white border border-slate-200 rounded-2xl p-6 cursor-pointer shadow-sm transition-all"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
                  <TrendingUp size={20} />
                </div>
                <span className={cn(
                  "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                  path.growth === "high" ? "bg-emerald-50 text-emerald-700" : "bg-indigo-50 text-indigo-700"
                )}>
                  {path.growth} Growth
                </span>
                <ShareButton title={path.title} type="career path" id={path.id} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">{path.title}</h3>
              <p className="text-slate-500 text-xs mb-6 line-clamp-2 leading-relaxed">{path.description}</p>
              <div className="flex items-center gap-4 text-[10px] text-slate-400 border-t border-slate-50 pt-4 font-bold uppercase tracking-widest">
                <div className="flex items-center gap-1">
                  <Clock size={12} /> 3-5 Years
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen size={12} /> {path.milestones.length} Stages
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

const RoadmapView = ({ profile, pathId }: { profile: UserProfile, pathId?: string }) => {
  const path = CAREER_PATHS.find(p => p.id === pathId) || CAREER_PATHS[0];
  
  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <SectionTitle 
        title={`${path.title} Roadmap`} 
        subtitle={`Adaptive Timeline for age ${profile.age}`} 
      />
      
      <div className="relative pl-8 border-l-2 border-indigo-100 space-y-10 ml-4">
        {path.milestones.map((ms, idx) => (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={idx} 
            className="relative"
          >
            <div className={cn(
              "absolute -left-12 top-0 w-8 h-8 rounded-full border-4 border-slate-50 shadow-sm z-10 flex items-center justify-center text-xs font-bold",
              idx === 0 ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-500"
            )}>
              {idx + 1}
            </div>
            
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <span className="text-indigo-600 font-bold text-[10px] uppercase tracking-widest">{ms.ageRange}</span>
                <span className="bg-slate-50 text-slate-400 text-[9px] px-1.5 py-0.5 rounded-md font-mono border border-slate-100">{ms.title}</span>
              </div>
              <h4 className="text-lg font-bold text-slate-800 mb-3">{ms.description}</h4>
              <div className="flex flex-wrap gap-1.5">
                {ms.requirements.map((req, i) => (
                  <span key={i} className="bg-indigo-50/50 text-indigo-700 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-indigo-100">
                    {req}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const InstitutionsView = ({ budget }: { budget: number }) => {
  const [search, setSearch] = useState("");
  const filtered = INSTITUTIONS.filter(inst => 
    inst.name.toLowerCase().includes(search.toLowerCase()) || 
    inst.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <SectionTitle title="Educational Ecosystem" subtitle="International Institution Dataset" />
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search institutions..." 
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map(inst => (
          <div key={inst.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden group hover:border-indigo-200 shadow-sm hover:shadow-md transition-all">
            <div className="h-40 relative">
              <img 
                src={inst.image} 
                className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-700" 
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-black shadow-sm">
                RANK #{inst.ranking}
              </div>
            </div>
            <div className="p-5">
              <div className="flex justify-between items-start mb-1">
                <h3 className="text-base font-bold text-slate-800 leading-tight">{inst.name}</h3>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-indigo-600 font-black text-sm">${(inst.avgCost/1000).toFixed(0)}K</span>
                  <ShareButton title={inst.name} type="institution" id={inst.id} />
                </div>
              </div>
              <p className="text-slate-400 text-[11px] font-medium mb-4 flex items-center gap-1">
                <Map size={12} /> {inst.location} • {inst.type}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {inst.programs.slice(0, 2).map((p, i) => (
                  <span key={i} className="text-[9px] uppercase font-bold tracking-widest text-slate-400 bg-slate-50 border border-slate-100 px-2 py-1 rounded">
                    {p}
                  </span>
                ))}
              </div>
              {inst.avgCost > budget && (
                <div className="mt-4 flex items-center gap-2 bg-amber-50 p-2 rounded-xl border border-amber-100">
                  <div className="h-1 flex-1 bg-amber-200 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 w-[70%]"></div>
                  </div>
                   <span className="text-amber-700 text-[9px] font-bold whitespace-nowrap">BUDGET EXCEEDED</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const MaterialsView = () => (
  <div className="space-y-8">
    <SectionTitle title="Learning Hub" subtitle="Micro-learning Sync: Active" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {STUDY_MATERIALS.map(mat => (
        <div key={mat.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-100 transition-all">
          <div className="relative aspect-video rounded-xl overflow-hidden mb-4 bg-slate-100 group">
            <img src={mat.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-slate-900/10 flex items-center justify-center">
              <div className="bg-white p-2.5 rounded-full shadow-lg text-indigo-600 group-hover:scale-110 transition-transform">
                {mat.type === 'video' ? <PlayCircle size={24} /> : <Headphones size={24} />}
              </div>
            </div>
            <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
               <span className="bg-black/60 backdrop-blur-md text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">{mat.type}</span>
               <span className="bg-black/60 backdrop-blur-md text-white text-[9px] font-bold px-1.5 py-0.5 rounded">{mat.duration}</span>
            </div>
          </div>
          <h4 className="font-bold text-slate-800 text-sm mb-1">{mat.title}</h4>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-3">{mat.provider}</p>
          <a 
            href={mat.url} 
            target="_blank" 
            className="flex items-center justify-between text-indigo-600 text-[10px] font-black uppercase tracking-widest hover:underline pt-2 border-t border-slate-50"
          >
            Access Now <ExternalLink size={10} />
          </a>
        </div>
      ))}
    </div>
  </div>
);

const AIAdvisor = ({ profile }: { profile: UserProfile }) => {
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput("");
    setIsLoading(true);

    const advice = await getCareerAdvice(userMsg, profile);
    setMessages(prev => [...prev, { role: 'ai', text: advice || "Error fetching advice." }]);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-[600px] bg-slate-800 rounded-3xl overflow-hidden shadow-2xl border border-slate-700">
      <div className="p-5 bg-slate-900/50 border-b border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/20">
            ⚡
          </div>
          <div>
            <h3 className="font-bold text-white text-sm leading-none">Spark.E</h3>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">AI Career Mentor</span>
          </div>
        </div>
        <div className="flex gap-1.5">
           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
           <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
           <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
        {messages.length === 0 && (
          <div className="text-center py-20 px-10">
            <div className="bg-indigo-500/10 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6 text-indigo-400">
               <MessageSquare size={32} />
            </div>
            <h4 className="text-lg font-bold text-white mb-2">Connect with your future</h4>
            <p className="text-slate-500 text-xs leading-relaxed max-w-xs mx-auto">"What is the ROI of a Data Science degree in Canada?" or "What's the best first step for an AI enthusiast?"</p>
          </div>
        )}
        {messages.map((m, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={i} 
            className={cn(
              "max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed",
              m.role === 'user' ? "bg-indigo-600 text-white ml-auto font-medium" : "bg-slate-700/50 text-slate-100"
            )}
          >
            {m.text}
          </motion.div>
        ))}
        {isLoading && (
          <div className="bg-slate-700/30 text-slate-500 p-4 rounded-2xl text-[10px] font-bold tracking-widest uppercase animate-pulse w-fit">
            Spark.E is analyzing...
          </div>
        )}
      </div>

      <div className="p-4 bg-slate-900/30 border-t border-slate-700/50 flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask a question..."
          className="flex-1 px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl outline-none focus:border-indigo-500 transition-all text-xs text-white placeholder-slate-500"
        />
        <button 
          onClick={handleSend}
          disabled={isLoading}
          className="bg-indigo-600 text-white px-4 rounded-xl hover:bg-indigo-500 transition-all disabled:opacity-50 font-bold text-xs"
        >
          SEND
        </button>
      </div>
    </div>
  );
};

const ParentalDashboard = ({ profile, onBack }: { profile: UserProfile, onBack: () => void }) => {
  const currentPath = CAREER_PATHS.find(p => p.id === profile.targetCareerId) || CAREER_PATHS[0];
  const progressPercent = Math.min(((profile.completedMilestones.length / currentPath.milestones.length) * 100), 100);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <SectionTitle title="Parental Control Center" subtitle={`Monitoring progress for: ${profile.name}`} />
        <button 
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-all text-sm font-bold"
        >
          <ArrowLeft size={16} /> Exit Supervisor View
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Overview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
            <h3 className="text-xl font-bold text-slate-800 mb-6">Exploration Roadmap Progress</h3>
            <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-end">
                <p className="text-sm font-bold text-indigo-600 uppercase tracking-widest">{currentPath.title}</p>
                <span className="text-3xl font-black text-slate-900">{progressPercent.toFixed(0)}%</span>
              </div>
              <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  className="h-full bg-indigo-600 shadow-lg shadow-indigo-100" 
                />
              </div>
            </div>
            {/* Background elements */}
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
               <ShieldCheck size={160} className="text-slate-900" />
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 flex items-start gap-4 shadow-sm">
            <div className="p-3 bg-white rounded-2xl text-emerald-600 shadow-sm">
              <Activity size={24} />
            </div>
            <div>
              <h4 className="font-bold text-emerald-900 mb-1">Recommended Next Step</h4>
              <p className="text-emerald-700 text-sm leading-relaxed mb-4">
                {profile.name} has completed the "Exploratory Phase". We recommend enrolling in a 
                <span className="font-bold"> Python for Beginners</span> micro-course to start the "Foundational Phase".
              </p>
              <button className="bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all">
                Send Materials to {profile.name}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats & Controls */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Guardianship Status</h4>
            <div className="space-y-4">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">SJ</div>
                  <div>
                     <p className="text-xs font-black text-slate-800 uppercase tracking-tighter">Sarah Jenkins</p>
                     <p className="text-[9px] text-slate-400">Primary Supervisor</p>
                  </div>
               </div>
               <div className="pt-4 border-t border-slate-50 space-y-3">
                  <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                     <span className="text-[10px] font-bold text-slate-500">EMAIL ALERTS</span>
                     <div className="w-8 h-4 bg-indigo-600 rounded-full flex items-center justify-end px-1 shadow-inner"><div className="w-2 h-2 bg-white rounded-full"></div></div>
                  </div>
                  <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 opacity-50">
                     <span className="text-[10px] font-bold text-slate-500">SPENDING CAP</span>
                     <span className="text-[10px] font-black text-slate-800">$1,200/mo</span>
                  </div>
               </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-3xl p-6 text-white overflow-hidden relative">
             <h4 className="text-sm font-bold mb-4">Top Careers for {profile.name}</h4>
             <div className="space-y-3">
                {CAREER_PATHS.map(p => (
                   <div key={p.id} className="flex items-center justify-between text-xs bg-white/5 p-2 rounded-lg border border-white/5">
                      <span className="font-medium text-slate-300">{p.title.split(' ')[0]} Specialist</span>
                      <span className="text-emerald-400 font-black">94% Fit</span>
                   </div>
                ))}
             </div>
             <p className="text-[10px] text-slate-500 italic mt-6">*Compatibility based on interest evolution in 2026.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [activeView, setActiveView] = useState<'dashboard' | 'roadmap' | 'institutions' | 'materials' | 'expenses' | 'advisor' | 'parent'>('dashboard');
  const [selectedPathId, setSelectedPathId] = useState<string>("ai-engineer");
  
  const [profile, setProfile] = useState<UserProfile>({
    name: "Alex",
    age: 16,
    education: "High School Junior",
    interests: ["Coding", "Robotics", "Space"],
    budget: 50000,
    targetCareerId: "ai-engineer",
    completedMilestones: ["ai-engineer-0"] // Pre-populated progress
  });

  const handleSelectPath = (id: string) => {
    setSelectedPathId(id);
    setProfile(prev => ({ ...prev, targetCareerId: id }));
    setActiveView('roadmap');
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Header Navigation */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-4 z-20 shrink-0">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveView('dashboard')}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white shadow-sm shadow-indigo-200">CV</div>
          <span className="text-xl font-bold tracking-tight text-slate-800">CareerVision<span className="text-indigo-600 font-black italic">AI</span></span>
        </div>
        <nav className="hidden lg:flex gap-8">
          <NavItem label="Dashboard" active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
          <NavItem label="Personalized Roadmap" active={activeView === 'roadmap'} onClick={() => setActiveView('roadmap')} />
          <NavItem label="Institutions" active={activeView === 'institutions'} onClick={() => setActiveView('institutions')} />
          <NavItem label="Learning Hub" active={activeView === 'materials'} onClick={() => setActiveView('materials')} />
          <NavItem label="Financial Simulator" active={activeView === 'expenses'} onClick={() => setActiveView('expenses')} />
        </nav>
        <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
          <div className="h-6 w-6 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center">
            <User size={14} className="text-indigo-600" />
          </div>
          <span className="text-xs font-bold text-slate-700">{profile.name}</span>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="flex-1 grid grid-cols-12 gap-6 p-6 overflow-hidden">
        
        {/* Left Column: Context & Mentor */}
        <section className="col-span-12 lg:col-span-3 flex flex-col gap-6 overflow-hidden">
          {/* Profile Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Context</h3>
            <div className="mt-4 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Global ID</span>
                <span className="text-[10px] font-mono font-bold bg-slate-50 px-2 py-0.5 rounded text-slate-400">#EDU-2026-XP</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Age Stage</span>
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-black text-indigo-700 uppercase tracking-tighter">
                  {profile.age} • {profile.age >= 18 ? 'Specialized' : 'Exploratory'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Target Path</span>
                <span className="text-xs font-bold text-slate-800">{CAREER_PATHS.find(p => p.id === selectedPathId)?.title.split(' ')[0]}...</span>
              </div>
            </div>
          </div>

          {/* AI Advisor Shortcut / Container */}
          <div className="flex-1 overflow-hidden">
            <AIAdvisor profile={profile} />
          </div>
        </section>

        {/* Middle Column: Viewport */}
        <section className="col-span-12 lg:col-span-6 flex flex-col gap-6 overflow-y-auto pr-2 scrollbar-hide">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, x: 5 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -5 }}
              transition={{ duration: 0.15 }}
              className="flex-1"
            >
              {activeView === 'dashboard' && <Dashboard profile={profile} onSelectPath={handleSelectPath} />}
              {activeView === 'roadmap' && <RoadmapView profile={profile} pathId={selectedPathId} />}
              {activeView === 'institutions' && <InstitutionsView budget={profile.budget} />}
              {activeView === 'materials' && <MaterialsView />}
              {activeView === 'parent' && <ParentalDashboard profile={profile} onBack={() => setActiveView('dashboard')} />}
              {activeView === 'expenses' && (
                <div className="space-y-8">
                  <SectionTitle title="Financial Simulator" subtitle="ROI Analysis Engine" />
                  <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-8">
                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Adjust Annual Budget</label>
                        <span className="text-2xl font-black text-indigo-600 font-mono">${profile.budget.toLocaleString()}</span>
                      </div>
                      <input 
                        type="range" 
                        min="5000" 
                        max="150000" 
                        step="5000"
                        value={profile.budget}
                        onChange={(e) => setProfile({...profile, budget: parseInt(e.target.value)})}
                        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                       <div className="rounded-xl border border-indigo-100 bg-indigo-50/30 p-4">
                          <span className="text-[10px] font-black text-indigo-400 uppercase">Top Efficiency Region</span>
                          <p className="mt-1 text-sm font-bold text-indigo-900">Switzerland / ETH</p>
                          <p className="text-[10px] text-indigo-600 font-medium">92% Cost-to-Value Ratio</p>
                       </div>
                       <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                          <span className="text-[10px] font-black text-emerald-400 uppercase">Scholarship Fit</span>
                          <p className="mt-1 text-sm font-bold text-emerald-900">High Match Rate</p>
                          <p className="text-[10px] text-emerald-600 font-medium">12 Active Programs found</p>
                       </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </section>

        {/* Right Column: Daily Spark & Parental */}
        <section className="col-span-12 lg:col-span-3 flex flex-col gap-6 overflow-hidden">
          {/* Daily Spark Widget style */}
          <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Daily Spark</h3>
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-black text-amber-700 uppercase tracking-tighter">Audio</span>
            </div>
            <div className="relative flex h-32 items-center justify-center rounded-xl bg-slate-800 overflow-hidden group">
                <img src={STUDY_MATERIALS[1].thumbnail} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" />
                <button className="z-10 h-10 w-10 rounded-full bg-white shadow-xl flex items-center justify-center text-indigo-600 hover:scale-110 transition-transform">
                    <PlayCircle size={20} />
                </button>
                <div className="absolute bottom-2 left-2 right-2">
                   <p className="text-[10px] font-bold text-white line-clamp-1">Today's Topic: Quantum Ethics in AI</p>
                </div>
            </div>
            <div className="space-y-1.5">
               <div className="flex items-center justify-between text-[9px] font-bold text-slate-400">
                  <span>PLAYLIST PROGRESS</span>
                  <span>25%</span>
               </div>
               <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full w-1/4 bg-indigo-500"></div>
               </div>
            </div>
          </div>

          {/* Parental Dashboard Shortcut */}
          <button 
            onClick={() => setActiveView('parent')}
            className={cn(
              "flex items-center gap-4 rounded-2xl border p-4 transition-colors group",
              activeView === 'parent' 
                ? "border-indigo-600 bg-indigo-50/10" 
                : "border-dashed border-slate-300 text-slate-500 hover:bg-slate-50"
            )}
          >
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full transition-transform group-hover:scale-110",
              activeView === 'parent' ? "bg-indigo-600 text-white" : "bg-indigo-50 text-indigo-600"
            )}>
               <ShieldCheck size={20} />
            </div>
            <div className="text-left">
                <p className={cn("text-xs font-bold", activeView === 'parent' ? "text-indigo-600" : "text-slate-800")}>Parental Dashboard</p>
                <p className="text-[10px] text-slate-400">Sync progress with supervisors</p>
            </div>
            <ChevronRight size={16} className="ml-auto" />
          </button>

          {/* Upsell Widget */}
          <div className="rounded-2xl bg-slate-900 p-5 mt-auto text-white shadow-xl">
            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">CareerVision Premium</p>
            <p className="text-[11px] text-slate-300 font-medium">Unlock priority scholarship matching and elite institutional data pipelines.</p>
            <button className="mt-4 w-full rounded-xl bg-white/10 hover:bg-white/20 border border-white/5 py-2 text-[10px] font-black text-white uppercase tracking-widest transition-all">
                Upgrade Pro
            </button>
          </div>
        </section>
      </main>

      {/* Footer Status Bar */}
      <footer className="flex items-center justify-between border-t border-slate-200 bg-white px-8 py-2.5 text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] shrink-0">
        <div className="flex gap-6">
          <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> IPEDS Access: Online</span>
          <span>O*NET Sync: Active</span>
        </div>
        <div className="flex gap-4">
          <span className="text-indigo-500">Multi-Tenant Secure Cloud</span>
        </div>
      </footer>
    </div>
  );
}

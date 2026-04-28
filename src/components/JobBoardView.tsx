import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, MapPin, Briefcase, DollarSign, Clock, 
  ExternalLink, Building2, Filter, Loader2, Sparkles,
  ArrowUpRight, Tag, Bookmark, CheckCircle2, X,
  ChevronDown, BrainCircuit, TrendingUp, Lightbulb
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { JobListing, UserProfile } from '../types/career';
import { JOB_LISTINGS, CAREER_PATHS } from '../constants/mockData';
import { aiSearchJobs, getAiJobSuggestions } from '../services/geminiService';

export const JobBoardView = ({ profile }: { profile: UserProfile }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [activeCareer, setActiveCareer] = useState<string>("All");
  const [activeType, setActiveType] = useState<string>("All");
  const [isSearching, setIsSearching] = useState(false);
  
  // AI Search State
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiResults, setAiResults] = useState<JobListing[]>([]);
  const [hasAiSearched, setHasAiSearched] = useState(false);

  // Suggestions State
  const [suggestions, setSuggestions] = useState<JobListing[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const careers = ["All", ...CAREER_PATHS.map(c => c.title)];

  const filteredJobs = useMemo(() => {
    // Merge local, AI search results, and suggestions
    const baseList = [...JOB_LISTINGS];
    if (hasAiSearched) baseList.unshift(...aiResults);
    if (suggestions.length > 0) baseList.unshift(...suggestions);
    
    // Deduplicate by ID
    const uniqueMap = new Map();
    baseList.forEach(job => uniqueMap.set(job.id, job));
    const combined = Array.from(uniqueMap.values()) as JobListing[];

    return combined.filter(job => {
      const career = CAREER_PATHS.find(c => c.id === job.careerId);
      const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           job.company.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLocation = job.location.toLowerCase().includes(locationQuery.toLowerCase());
      const matchesCareer = activeCareer === "All" || career?.title === activeCareer;
      const matchesType = activeType === "All" || job.type === activeType;

      return matchesSearch && matchesLocation && matchesCareer && matchesType;
    });
  }, [searchQuery, locationQuery, activeCareer, activeType, aiResults, hasAiSearched, suggestions]);

  const loadAiSuggestions = async () => {
    setIsSuggesting(true);
    setShowSuggestions(true);
    try {
      const results = await getAiJobSuggestions(profile);
      setSuggestions(results);
    } catch (error) {
      console.error("Suggestions Error:", error);
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleAiSearch = async () => {
    if (!searchQuery.trim() && !locationQuery.trim()) return;
    
    setIsAiSearching(true);
    setHasAiSearched(true);
    try {
      const results = await aiSearchJobs(searchQuery, locationQuery || "Global");
      setAiResults(results);
    } catch (error) {
      console.error("AI Job Search Error:", error);
    } finally {
      setIsAiSearching(false);
    }
  };

  const handleSearch = () => {
    setIsSearching(true);
    setTimeout(() => setIsSearching(false), 800);
  };

  return (
    <div className="h-full flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">
              Global Job Board
            </h2>
            <div className="bg-indigo-500 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest animate-pulse">
              Live
            </div>
          </div>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-widest flex items-center gap-2">
            <TrendingUp size={14} className="text-emerald-500" />
            {filteredJobs.length} Market Matches Analyzed
          </p>
        </div>
        
        <button 
          onClick={loadAiSuggestions}
          disabled={isSuggesting}
          className="group relative flex items-center gap-3 bg-white border-2 border-indigo-100 px-6 py-4 rounded-[2rem] hover:border-indigo-500 transition-all shadow-sm hover:shadow-indigo-500/10 active:scale-95 disabled:opacity-50"
        >
          <div className="w-10 h-10 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shadow-lg group-hover:rotate-12 transition-transform">
            {isSuggesting ? <Loader2 size={18} className="animate-spin" /> : <BrainCircuit size={18} />}
          </div>
          <div className="text-left">
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none mb-1">Smart Scout</p>
            <p className="text-xs font-black text-slate-900 uppercase tracking-tight">Personalized Suggestions</p>
          </div>
        </button>
      </div>

      {/* Suggested Section */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-indigo-50 rounded-[2.5rem] p-8 border border-indigo-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-xl text-indigo-600 shadow-sm">
                    <Lightbulb size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-indigo-950 uppercase tracking-widest">AI Market Pulse</h3>
                    <p className="text-xs font-bold text-indigo-500 uppercase tracking-tight">Based on your {profile.targetCareerId || 'career'} path in {profile.country}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowSuggestions(false)}
                  className="text-indigo-400 hover:text-indigo-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {isSuggesting ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2].map(i => (
                    <div key={i} className="h-24 bg-white/50 animate-pulse rounded-2xl" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {suggestions.map((job) => (
                    <motion.div 
                      key={`suggest-${job.id}`}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-sm flex items-center justify-between gap-4 group hover:border-indigo-500 transition-colors"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                          {job.logo ? <img src={job.logo} className="w-full h-full object-cover" /> : <Building2 size={18} className="text-slate-300" />}
                        </div>
                        <div className="overflow-hidden">
                           <h4 className="text-xs font-black text-slate-950 truncate uppercase tracking-tight">{job.title}</h4>
                           <p className="text-[10px] font-bold text-slate-400 truncate">{job.company}</p>
                        </div>
                      </div>
                      <a href={job.url} target="_blank" className="shrink-0 w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all">
                        <ArrowUpRight size={14} />
                      </a>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Controls */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative group">
          <Briefcase className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
          <input 
            type="text"
            placeholder="Role or Company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border-2 border-transparent rounded-[1.5rem] py-4 pl-14 pr-6 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-500/30 focus:ring-4 focus:ring-indigo-500/5 transition-all"
          />
        </div>
        <div className="flex-1 relative group">
          <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={20} />
          <input 
            type="text"
            placeholder="City, Country or Remote..."
            value={locationQuery}
            onChange={(e) => setLocationQuery(e.target.value)}
            className="w-full bg-slate-50 border-2 border-transparent rounded-[1.5rem] py-4 pl-14 pr-6 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/5 transition-all"
          />
        </div>
        <div className="relative group min-w-[200px]">
          <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <select 
            value={activeCareer}
            onChange={(e) => setActiveCareer(e.target.value)}
            className="w-full appearance-none bg-slate-50 border-2 border-transparent rounded-[1.5rem] py-4 pl-14 pr-10 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-500/30 transition-all cursor-pointer"
          >
            {careers.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={handleSearch}
            className="bg-slate-900 text-white px-6 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all hover:shadow-xl hover:shadow-indigo-500/10 active:scale-95 flex items-center justify-center gap-3"
          >
            {isSearching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
            <span className="hidden sm:inline">Search</span>
          </button>

          <button 
            onClick={handleAiSearch}
            disabled={isAiSearching || (!searchQuery.trim() && !locationQuery.trim())}
            className={cn(
              "px-6 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-xl disabled:opacity-50 disabled:grayscale",
              isAiSearching ? "bg-indigo-900 text-white" : "bg-indigo-600 text-white shadow-indigo-200 hover:-translate-y-1"
            )}
          >
            {isAiSearching ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Sparkles size={18} />
            )}
            <span className="hidden sm:inline">{isAiSearching ? "Discovering..." : "AI Discover"}</span>
          </button>
        </div>
      </div>

      {/* AI Search Active Indicator */}
      {hasAiSearched && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between bg-indigo-50/50 border border-indigo-100 px-6 py-4 rounded-[2rem]"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
               <Sparkles size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-indigo-900 uppercase tracking-[0.2em]">Spark.E Job Intelligence Active</p>
              <p className="text-xs font-bold text-indigo-600">Showing {aiResults.length} global vacancies matched to your intent</p>
            </div>
          </div>
          <button 
            onClick={() => { setHasAiSearched(false); setAiResults([]); }}
            className="text-[10px] font-black text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-widest underline decoration-2 underline-offset-4"
          >
            Clear AI Findings
          </button>
        </motion.div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto pr-2 pb-12 scrollbar-hide">
        {filteredJobs.map((job, i) => (
          <JobCard key={job.id} job={job} index={i} />
        ))}
        {filteredJobs.length === 0 && (
          <div className="col-span-full py-20 bg-white rounded-[3rem] border border-dashed border-slate-200 flex flex-col items-center gap-4 text-center">
            <div className="p-6 bg-slate-50 rounded-full text-slate-300">
               <Briefcase size={48} />
            </div>
            <div>
              <p className="text-lg font-black text-slate-900 uppercase tracking-tight">No positions found</p>
              <p className="text-slate-500 font-medium">Try adjusting your filters or location</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const JobCard = ({ job, index }: { job: JobListing, index: number }) => {
  const career = CAREER_PATHS.find(c => c.id === job.careerId);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group bg-white border-2 border-transparent hover:border-indigo-100 rounded-[2.5rem] p-8 transition-all hover:shadow-2xl hover:shadow-indigo-500/10 flex flex-col gap-6 relative"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 overflow-hidden shadow-sm group-hover:bg-white transition-colors">
            {job.logo ? (
              <img src={job.logo} alt={job.company} className="w-full h-full object-cover" />
            ) : (
              <Building2 size={24} className="text-slate-300" />
            )}
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-tight group-hover:text-indigo-600 transition-colors">
              {job.title}
            </h3>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest flex items-center gap-2 mt-1">
              {job.company} <CheckCircle2 size={12} className="text-emerald-500" />
            </p>
          </div>
        </div>
        <div className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest">
           {job.type}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 py-6 border-y border-slate-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
            <MapPin size={18} />
          </div>
          <div>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Location</p>
            <p className="text-xs font-black text-slate-900">{job.location}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <DollarSign size={18} />
          </div>
          <div>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Salary Estimate</p>
            <p className="text-xs font-black text-slate-900">
              {job.salary.currency} {job.salary.min.toLocaleString()} - {job.salary.max.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
         {career && (
           <div className="bg-slate-900 text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
              <Sparkles size={12} /> {career.title}
           </div>
         )}
         <div className="bg-slate-50 text-slate-400 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
            <Clock size={12} /> {job.postedAt}
         </div>
      </div>

      <p className="text-xs font-medium text-slate-500 line-clamp-2 leading-relaxed">
        {job.description}
      </p>

      <div className="pt-2 flex items-center justify-between">
        <button className="text-slate-400 hover:text-rose-500 transition-colors p-2">
           <Bookmark size={20} />
        </button>
        <a 
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg shadow-indigo-600/20"
        >
          View Details <ArrowUpRight size={14} />
        </a>
      </div>
    </motion.div>
  );
};


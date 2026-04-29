import React, { useState, useMemo } from 'react';
import { 
  Search, Filter, PlayCircle, BookOpen, Mic, GraduationCap, 
  Star, Globe, Clock, ChevronDown, Check, X,
  LayoutGrid, List, Sparkles, FilterX, ExternalLink,
  Tag, Briefcase, Award, Loader2, Wand2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { StudyMaterial, CareerPath } from '../types/career';
import { STUDY_MATERIALS, CAREER_PATHS } from '../constants/mockData';
import { aiSearchStudyMaterials } from '../services/geminiService';

interface MaterialsLibraryProps {
  onBack?: () => void;
  materials?: StudyMaterial[];
  isLoading?: boolean;
}

const MaterialsLibrary: React.FC<MaterialsLibraryProps> = ({ materials = STUDY_MATERIALS, isLoading = false }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeType, setActiveType] = useState<string>("All");
  const [activeLevel, setActiveLevel] = useState<string>("All");
  const [activeCareer, setActiveCareer] = useState<string>("All");
  const [activeLanguage, setActiveLanguage] = useState<string>("All");
  const [minRating, setMinRating] = useState<number>(0);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('sparke_recent_materials');
    return saved ? JSON.parse(saved) : [];
  });
  
  // AI Search State
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiResults, setAiResults] = useState<StudyMaterial[]>([]);
  const [hasAiSearched, setHasAiSearched] = useState(false);

  // Derive recent materials
  const recentMaterials = useMemo(() => {
    // Combine local and AI results to find the objects for the IDs
    const allKnown = [...materials, ...aiResults];
    return recentlyViewedIds
      .map(id => allKnown.find(m => m.id === id))
      .filter((m): m is StudyMaterial => !!m)
      .slice(0, 5); // Keep only top 5
  }, [recentlyViewedIds, aiResults, materials]);

  const addToRecent = (id: string) => {
    const newIds = [id, ...recentlyViewedIds.filter(existingId => existingId !== id)].slice(0, 10);
    setRecentlyViewedIds(newIds);
    localStorage.setItem('sparke_recent_materials', JSON.stringify(newIds));
  };

  // Derive unique options for filters
  const types = ["All", ...Array.from(new Set(materials.map(m => m.type)))];
  const levels = ["All", "Beginner", "Intermediate", "Advanced"];
  const languages = ["All", ...Array.from(new Set(materials.map(m => m.language)))];

  const filteredMaterials = useMemo(() => {
    // Merge local and AI results
    const combinedBase = hasAiSearched ? [...aiResults, ...materials] : materials;
    
    // Deduplicate by ID
    const uniqueMap = new Map();
    combinedBase.forEach(m => uniqueMap.set(m.id, m));
    const combined = Array.from(uniqueMap.values());

    return combined.filter(m => {
      const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           m.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           m.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesType = activeType === "All" || m.type === activeType;
      const matchesLevel = activeLevel === "All" || m.skillLevel === activeLevel;
      const matchesCareer = activeCareer === "All" || m.careerId === activeCareer;
      const matchesLanguage = activeLanguage === "All" || m.language === activeLanguage;
      const matchesRating = m.rating >= minRating;

      return matchesSearch && matchesType && matchesLevel && matchesCareer && matchesLanguage && matchesRating;
    });
  }, [searchQuery, activeType, activeLevel, activeCareer, activeLanguage, minRating, aiResults, hasAiSearched]);

  const handleAiSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsAiSearching(true);
    setHasAiSearched(true);
    try {
      const results = await aiSearchStudyMaterials(searchQuery);
      setAiResults(results);
    } catch (error) {
      console.error("AI Search Error:", error);
    } finally {
      setIsAiSearching(false);
    }
  };

  const resetFilters = () => {
    setSearchQuery("");
    setActiveType("All");
    setActiveLevel("All");
    setActiveCareer("All");
    setActiveLanguage("All");
    setMinRating(0);
    setHasAiSearched(false);
    setAiResults([]);
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            Academy <span className="text-indigo-600 italic">Library</span>
            <Sparkles className="text-amber-400" size={24} />
          </h2>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">
            {isLoading ? '🔄 Loading curated resources...' : `${filteredMaterials.length} Curated Resources for ${activeCareer === 'All' ? 'Global Careers' : CAREER_PATHS.find(c => c.id === activeCareer)?.title}`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button 
              onClick={() => setViewMode('grid')}
              className={cn("p-2 rounded-xl transition-all", viewMode === 'grid' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400")}
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={cn("p-2 rounded-xl transition-all", viewMode === 'list' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400")}
            >
              <List size={18} />
            </button>
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border",
              showFilters ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-indigo-200"
            )}
          >
            <Filter size={16} />
            Filters {(activeType !== 'All' || activeLevel !== 'All' || activeCareer !== 'All') && "•"}
          </button>
        </div>
      </div>

      {/* Search Bar with AI Focus */}
      <div className="flex gap-3">
        <div className="relative group flex-1">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
          <input 
            type="text"
            placeholder="Search by topic, provider, or skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
            className="w-full bg-white border-2 border-slate-100 rounded-[2rem] py-4 pl-14 pr-6 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500/30 focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-sm"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500">
              <X size={18} />
            </button>
          )}
        </div>
        <button 
          onClick={handleAiSearch}
          disabled={isAiSearching || !searchQuery.trim()}
          className={cn(
            "px-6 py-4 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3 transition-all shadow-xl disabled:opacity-50 disabled:grayscale",
            isAiSearching ? "bg-slate-900 text-white" : "bg-indigo-600 text-white shadow-indigo-200 hover:-translate-y-1"
          )}
        >
          {isAiSearching ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Wand2 size={18} />
          )}
          <span>{isAiSearching ? "Discovering..." : "Global AI Search"}</span>
        </button>
      </div>

      {/* AI Search Active Indicator */}
      {hasAiSearched && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between bg-indigo-50/50 border border-indigo-100 px-6 py-3 rounded-[1.5rem]"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white">
               <Sparkles size={16} />
            </div>
            <div>
              <p className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Spark.E Intelligence Active</p>
              <p className="text-xs font-bold text-indigo-600">Showing {aiResults.length} global recommendations matched to "{searchQuery}"</p>
            </div>
          </div>
          <button 
            onClick={() => { setHasAiSearched(false); setAiResults([]); }}
            className="text-[10px] font-black text-slate-400 hover:text-rose-500 uppercase tracking-widest underline"
          >
            Switch to Local Library Only
          </button>
        </motion.div>
      )}

      {/* Recently Viewed Section */}
      {!hasAiSearched && recentMaterials.length > 0 && !searchQuery && (
        <div className="animate-in fade-in slide-in-from-left duration-500 delay-200">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] flex items-center gap-2">
              <Clock size={12} className="text-indigo-500" /> Recently Viewed
            </h3>
            <button 
              onClick={() => {
                setRecentlyViewedIds([]);
                localStorage.removeItem('sparke_recent_materials');
              }}
              className="text-[10px] font-black text-slate-300 hover:text-rose-500 transition-colors uppercase tracking-widest"
            >
              Clear History
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-2 px-2">
            {recentMaterials.map((mat) => (
              <div key={`recent-${mat.id}`} className="min-w-[200px] max-w-[240px]">
                <MaterialCard material={mat} viewMode="grid" index={0} onInteract={() => addToRecent(mat.id)} isCompact />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 shadow-sm">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <PlayCircle size={12} /> Content Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {types.map(t => (
                    <button 
                      key={t}
                      onClick={() => setActiveType(t)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all",
                        activeType === t ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Award size={12} /> Proficiency Level
                </label>
                <div className="flex flex-wrap gap-2">
                  {levels.map(l => (
                    <button 
                      key={l}
                      onClick={() => setActiveLevel(l)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all",
                        activeLevel === l ? "bg-rose-500 text-white shadow-lg shadow-rose-200" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                      )}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Briefcase size={12} /> Career Alignment
                </label>
                <select 
                  value={activeCareer}
                  onChange={(e) => setActiveCareer(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-xl py-2 px-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="All">All Career Paths</option>
                  {CAREER_PATHS.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Star size={12} /> Minimum Rating
                </label>
                <div className="flex items-center gap-3">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button 
                      key={star}
                      onClick={() => setMinRating(star)}
                      className="transition-transform active:scale-90"
                    >
                      <Star 
                        size={20} 
                        fill={star <= minRating ? "#F59E0B" : "transparent"} 
                        className={star <= minRating ? "text-amber-500" : "text-slate-200"} 
                      />
                    </button>
                  ))}
                  {minRating > 0 && (
                    <button onClick={() => setMinRating(0)} className="text-[10px] font-bold text-slate-400 hover:text-rose-500 underline uppercase tracking-widest">
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Materials List/Grid */}
      <div className="flex-1 overflow-y-auto pr-2 pb-10 scrollbar-hide">
        {filteredMaterials.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
              <FilterX size={40} className="text-slate-300" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">No matches found</h3>
            <p className="text-sm text-slate-500 max-w-xs mx-auto mb-8 font-medium">Try adjusting your filters or search terms for broader results.</p>
            <button 
              onClick={resetFilters}
              className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-200 hover:-translate-y-1 active:scale-95 transition-all"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className={cn(
            "grid gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500",
            viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
          )}>
            {filteredMaterials.map((mat, idx) => (
              <MaterialCard 
                key={mat.id} 
                material={mat} 
                viewMode={viewMode} 
                index={idx} 
                onInteract={() => addToRecent(mat.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const MaterialCard = ({ 
  material, 
  viewMode, 
  index, 
  onInteract,
  isCompact = false 
}: { 
  material: StudyMaterial, 
  viewMode: 'grid' | 'list', 
  index: number,
  onInteract?: () => void,
  isCompact?: boolean
}) => {
  const typeIcon = {
    video: <PlayCircle size={16} className="text-indigo-600" />,
    audio: <Mic size={16} className="text-rose-600" />,
    course: <GraduationCap size={16} className="text-blue-600" />,
    article: <BookOpen size={16} className="text-emerald-600" />
  };

  const careerName = CAREER_PATHS.find(c => c.id === material.careerId)?.title || "General";

  if (viewMode === 'list') {
    return (
      <motion.div 
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        className="group bg-white border border-slate-100 hover:border-indigo-100 rounded-3xl p-5 flex items-center gap-6 transition-all hover:shadow-xl hover:shadow-indigo-50"
      >
        <div className="w-32 aspect-video rounded-2xl overflow-hidden shrink-0 relative">
          <img src={material.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-transparent transition-colors" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
             {typeIcon[material.type as keyof typeof typeIcon]}
             <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">{material.type} • {material.duration}</span>
          </div>
          <h4 className="text-lg font-black text-slate-900 truncate leading-snug group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{material.title}</h4>
          <p className="text-xs font-bold text-slate-500 mb-2">{material.provider}</p>
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 bg-slate-950 text-white text-[8px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1">
               <Briefcase size={8} className="text-indigo-400" /> {careerName}
            </span>
            <span className={cn(
              "px-2 py-1 text-[8px] font-black uppercase tracking-widest rounded-lg",
              material.skillLevel === 'Beginner' ? 'bg-emerald-50 text-emerald-600' : 
              material.skillLevel === 'Intermediate' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
            )}>
              {material.skillLevel}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3 shrink-0">
          <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg">
            <Star size={12} fill="#F59E0B" className="text-amber-500" />
            <span className="text-xs font-black text-amber-600 leading-none">{material.rating}</span>
          </div>
          <a 
            href={material.url} 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={onInteract}
            className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
          >
            <ExternalLink size={18} />
          </a>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "group bg-white border-2 border-transparent hover:border-indigo-100 rounded-[2.5rem] overflow-hidden transition-all hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 flex flex-col h-full bg-clip-padding",
        isCompact && "rounded-3xl border-slate-100"
      )}
    >
      {/* Thumbnail Area */}
      <div className={cn("relative overflow-hidden", isCompact ? "aspect-video" : "aspect-[16/10]")}>
        <img src={material.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" referrerPolicy="no-referrer" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/20 to-transparent" />
        
        {/* Floating Info */}
        <div className="absolute top-3 left-3 flex gap-2">
          <div className="bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1.5 shadow-xl border border-white">
            {typeIcon[material.type as keyof typeof typeIcon]}
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-900">{material.type}</span>
          </div>
        </div>

        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
           <p className="text-[10px] font-black text-white uppercase tracking-tight truncate w-3/4">{material.provider}</p>
           <div className="flex items-center gap-1 bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded-md">
              <Star size={10} fill="currentColor" stroke="none" />
              <span className="text-[10px] font-black leading-none">{material.rating}</span>
           </div>
        </div>
      </div>

      {/* Content Area */}
      <div className={cn("p-6 flex-1 flex flex-col", isCompact && "p-4")}>
        <div className="flex items-center gap-2 mb-3">
          <div className={cn(
             "px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest",
             material.skillLevel === 'Beginner' ? 'bg-emerald-50 text-emerald-600' : 
             material.skillLevel === 'Intermediate' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
          )}>
            {material.skillLevel}
          </div>
        </div>

        <h3 className={cn(
          "font-black text-slate-900 mb-2 leading-tight uppercase tracking-tighter group-hover:text-indigo-600 transition-colors",
          isCompact ? "text-sm line-clamp-1" : "text-xl"
        )}>
          {material.title}
        </h3>
        
        {!isCompact && material.description && (
          <p className="text-xs font-medium text-slate-500 mb-6 line-clamp-2 leading-relaxed">
            {material.description}
          </p>
        )}

        <div className={cn("mt-auto flex items-center justify-between pt-3 border-t border-slate-100", isCompact && "pt-2")}>
           <div className="flex items-center gap-2 overflow-hidden">
              <span className="text-[8px] font-bold text-slate-400 flex items-center gap-1 shrink-0 uppercase tracking-widest">
                <Clock size={8} /> {material.duration}
              </span>
           </div>
           <a 
             href={material.url} 
             target="_blank" 
             rel="noopener noreferrer"
             onClick={onInteract}
             className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-colors group/link"
           >
             {isCompact ? "Launch" : "Open"} <ExternalLink size={isCompact ? 10 : 12} className="group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
           </a>
        </div>
      </div>
    </motion.div>
  );
};

export default MaterialsLibrary;

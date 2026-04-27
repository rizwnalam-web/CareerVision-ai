import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  MapPin, 
  DollarSign, 
  Users, 
  Plus, 
  Info, 
  TrendingUp, 
  ShieldCheck,
  PlaneTakeoff,
  Landmark,
  Building2,
  AlertCircle,
  Check,
  ExternalLink,
  Zap,
  ChevronRight
} from 'lucide-react';
import { Institution, UserProfile } from '../types/career';
import { INSTITUTIONS } from '../constants/mockData';
import { cn } from '../lib/utils';
import { generateCoverLetter } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

interface ComparisonProps {
  onClose: () => void;
  selectedIds: string[];
  onRemove: (id: string) => void;
  onAddMore: () => void;
  profile: UserProfile;
}

const AISingleCoverLetter = ({ institution, profile }: { institution: Institution, profile: UserProfile }) => {
  const [highlights, setHighlights] = useState("");
  const [generatedLetter, setGeneratedLetter] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    const letter = await generateCoverLetter(institution, profile, highlights);
    setGeneratedLetter(letter);
    setIsGenerating(false);
    setShowEditor(true);
  };

  return (
    <div className="mt-8 pt-8 border-t border-slate-100 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Zap size={16} className="text-amber-500 fill-amber-500" />
        <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest leading-loose">AI Admission Forge</span>
      </div>
      
      {!showEditor ? (
        <div className="space-y-3">
          <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
            Generate a high-impact cover letter tailored to {institution.name}'s specific culture and your profile.
          </p>
          <div className="relative">
            <textarea 
              value={highlights}
              onChange={(e) => setHighlights(e.target.value)}
              placeholder="List specific projects, roles, or achievements you want to highlight (e.g. 'Led 5 robotics competitions', '3.9 GPA in STEM')..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-medium focus:ring-2 focus:ring-indigo-500 outline-none min-h-[80px] resize-none"
            />
          </div>
          <button 
            onClick={handleGenerate}
            disabled={isGenerating || !highlights}
            className="w-full py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isGenerating ? "Forging..." : "Generate AI Letter"}
          </button>
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100 h-[250px] overflow-y-auto custom-scrollbar">
            <div className="prose prose-slate prose-xs max-w-none text-[10px] font-medium leading-relaxed">
              <ReactMarkdown>{generatedLetter}</ReactMarkdown>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowEditor(false)}
              className="flex-1 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
            >
              Back to Input
            </button>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(generatedLetter);
                alert("Letter copied to clipboard!");
              }}
              className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
            >
              Copy Letter
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const InstitutionComparator: React.FC<ComparisonProps> = ({ onClose, selectedIds, onRemove, onAddMore, profile }) => {
  const [visaFilter, setVisaFilter] = useState<Institution['visaSupport'] | 'All'>('All');

  const allSelectedInstitutions = selectedIds
    .map(id => INSTITUTIONS.find(i => i.id === id))
    .filter((i): i is Institution => !!i);

  const selectedInstitutions = visaFilter === 'All' 
    ? allSelectedInstitutions 
    : allSelectedInstitutions.filter(inst => inst.visaSupport === visaFilter);

  const calculateTotalEstimate = (inst: Institution) => {
    const tuition = inst.avgCost;
    const livingExpenses = 25000 * inst.costOfLivingIndex;
    return tuition + livingExpenses;
  };

  const handleExport = () => {
    if (selectedInstitutions.length === 0) return;

    // CSV Headers
    const headers = ["Metric", ...selectedInstitutions.map(i => i.name)];
    
    // CSV Rows
    const rows = [
      ["Global Hub", ...selectedInstitutions.map(i => `${i.city}, ${i.country}`)],
      ["Tuition (p/a)", ...selectedInstitutions.map(i => `$${i.avgCost.toLocaleString()}`)],
      ["Est. Living Cost", ...selectedInstitutions.map(i => `$${(25000 * i.costOfLivingIndex).toLocaleString()}`)],
      ["COL Index", ...selectedInstitutions.map(i => `${i.costOfLivingIndex}x`)],
      ["Visa Support", ...selectedInstitutions.map(i => i.visaSupport)],
      ["Total Capital Requirement", ...selectedInstitutions.map(i => `$${calculateTotalEstimate(i).toLocaleString()}`)],
      ["Website", ...selectedInstitutions.map(i => i.website)]
    ];

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `CareerVision_Comparison_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full max-w-6xl h-[90vh] rounded-[32px] shadow-2xl flex flex-col overflow-hidden border border-slate-100"
      >
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <TrendingUp className="text-indigo-600" size={28} />
              The "Study Anywhere" Side-by-Side Advisor
            </h2>
            <div className="flex items-center gap-6 mt-2">
              <p className="text-slate-500 text-sm font-medium">Compare global career hubs, ROI, and cost of living impacts.</p>
              
              {/* Visa Support Filter */}
              <div className="flex items-center gap-2 pl-6 border-l border-slate-200">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-loose">Visa Support:</span>
                <div className="relative min-w-[120px]">
                  <ShieldCheck className="absolute left-2.5 top-1/2 -translate-y-1/2 text-indigo-500" size={12} />
                  <select 
                    value={visaFilter}
                    onChange={(e) => setVisaFilter(e.target.value as any)}
                    className="w-full pl-8 pr-8 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 transition-all outline-none appearance-none cursor-pointer"
                  >
                    <option value="All">All Levels</option>
                    <option value="Full">Full Only</option>
                    <option value="Partial">Partial</option>
                    <option value="None">None</option>
                  </select>
                  <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" size={10} />
                </div>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2.5 rounded-full hover:bg-slate-200 transition-colors text-slate-400 group"
          >
            <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-x-auto p-8 overflow-y-auto">
          {selectedIds.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-24 h-24 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-600 animate-pulse">
                <Building2 size={48} />
              </div>
              <div className="max-w-md">
                <h3 className="text-xl font-bold text-slate-800 mb-2">Initialize Comparison Layer</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-8">
                  Select up to 3 institutions to generate a side-by-side geospatial and financial analysis.
                </p>
                <button 
                  onClick={onAddMore}
                  className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2 mx-auto"
                >
                  <Plus size={18} /> Select Institutions
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-[200px_repeat(3,1fr)] gap-6 h-full">
              {/* Metrics Labels */}
              <div className="space-y-12 pt-40">
                <div className="h-24 flex flex-col justify-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-loose">Institution</span>
                </div>
                <div className="h-16 flex flex-col justify-center">
                   <div className="flex items-center gap-2 text-slate-500">
                    <MapPin size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Global Hub</span>
                   </div>
                </div>
                <div className="h-16 flex flex-col justify-center">
                   <div className="flex items-center gap-2 text-slate-500">
                    <DollarSign size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Tuition (p/a)</span>
                   </div>
                </div>
                <div className="h-16 flex flex-col justify-center border-t border-slate-50">
                   <div className="flex items-center gap-2 text-slate-500">
                    <TrendingUp size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Est. Living Cost</span>
                   </div>
                   <p className="text-[8px] text-slate-400 leading-tight pr-4 mt-1">Adjusted by regional Teleport API metrics.</p>
                </div>
                <div className="h-12 flex flex-col justify-center border-t border-slate-50">
                   <div className="flex items-center gap-2 text-slate-500 group relative cursor-help">
                    <Info size={14} className="text-indigo-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest">COL Index</span>
                    <div className="absolute bottom-full left-0 mb-2 w-48 p-3 bg-slate-900 text-white text-[9px] font-medium rounded-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-10 shadow-2xl border border-slate-700 leading-relaxed translate-y-1 group-hover:translate-y-0">
                       <p className="font-bold text-indigo-300 mb-1">Cost of Living (COL) Index</p>
                       A numerical multiplier representing the relative cost of rent, food, and transport compared to a global baseline. 1.0x is average; values above 1.4x indicate high-density premium zones.
                       <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-slate-900"></div>
                    </div>
                   </div>
                </div>
                <div className="h-12 flex flex-col justify-center">
                   <div className="flex items-center gap-2 text-slate-500">
                    <PlaneTakeoff size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Migration Support</span>
                   </div>
                </div>
                <div className="h-12 flex flex-col justify-center">
                   <div className="flex items-center gap-2 text-slate-500">
                    <ExternalLink size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Official Website</span>
                   </div>
                </div>
                <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                   <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Total Capital Req.</span>
                </div>
                <div className="pt-8">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-loose">Admission Suite</span>
                </div>
              </div>

              {/* Institution Columns */}
              {Array.from({ length: 3 }).map((_, idx) => {
                const inst = selectedInstitutions[idx];
                
                if (!inst) {
                  return (
                    <div key={idx} className="bg-slate-50 border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center space-y-4">
                       <button 
                        onClick={onAddMore}
                        className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors"
                      >
                         <Plus size={24} />
                       </button>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Empty Slot {idx + 1}</span>
                    </div>
                  );
                }

                const total = calculateTotalEstimate(inst);

                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={inst.id} 
                    className="space-y-12 bg-white rounded-3xl"
                  >
                    {/* Header Image */}
                    <div className="h-40 rounded-3xl overflow-hidden relative group">
                      <img src={inst.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                         <h4 className="text-white font-bold leading-tight line-clamp-2">{inst.name}</h4>
                         <p className="text-white/70 text-[10px] font-medium">{inst.city}, {inst.country}</p>
                      </div>
                      <button 
                        onClick={() => onRemove(inst.id)}
                        className="absolute top-2 right-2 p-1.5 bg-black/40 hover:bg-black/60 rounded-full text-white/80 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>

                    <div className="h-16 flex flex-col justify-center px-2">
                       <span className="text-sm font-bold text-slate-700">{inst.city}</span>
                       <span className={cn(
                        "text-[9px] font-black px-2 py-0.5 rounded uppercase mt-1 w-fit",
                        inst.costOfLivingIndex > 1.4 ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                       )}>
                          {inst.costOfLivingIndex > 1.4 ? "High Density" : "Mid Density"}
                       </span>
                    </div>

                    <div className="h-16 flex flex-col justify-center px-2">
                       <span className="text-xl font-black text-slate-800">${inst.avgCost.toLocaleString()}</span>
                    </div>

                    <div className="h-16 flex flex-col justify-center px-2 border-t border-slate-50">
                       <span className="text-xl font-black text-indigo-600">${(25000 * inst.costOfLivingIndex).toLocaleString()}</span>
                    </div>
                    
                    <div className="h-12 flex flex-col justify-center px-2 border-t border-slate-50">
                       <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-base font-black",
                            inst.costOfLivingIndex > 1.4 ? "text-rose-600" : "text-emerald-600"
                          )}>
                            {inst.costOfLivingIndex}x
                          </span>
                          <span className="text-[8px] font-black uppercase text-slate-400 tracking-tighter">Multiplier</span>
                       </div>
                    </div>

                    <div className="h-12 flex flex-col justify-center px-2">
                       {(() => {
                         const info = inst.visaSupport === 'Full' 
                           ? {
                               icon: <ShieldCheck size={14} className="text-emerald-500" />,
                               color: "text-emerald-700 bg-emerald-50 border-emerald-100 ring-4 ring-emerald-500/10",
                               label: "Premium Support",
                               details: "Full Institutional Sponsorship",
                               description: "You're fully covered. The institution features a dedicated International Student Office (ISO) that manages legal sponsorship certificates (I-20/CAS), provides certified immigration advisors, and handles mandatory health insurance coordination. Includes pre-departure legal briefings and on-campus work permit filing assistance."
                             }
                           : inst.visaSupport === 'Partial'
                           ? {
                               icon: <AlertCircle size={14} className="text-amber-500" />,
                               color: "text-amber-700 bg-amber-50 border-amber-100",
                               label: "Assisted Support",
                               details: "Administrative Guidance Only",
                               description: "The institution provides the necessary Admission Letters for your visa application and general procedural webinars. However, students must manage their own legal filings, pay SEVIS/immigration fees independently, and secure their own health coverage. No dedicated legal representation for visa appeals."
                             }
                           : {
                               icon: <Info size={14} className="text-slate-400" />,
                               color: "text-slate-600 bg-slate-50 border-slate-200",
                               label: "Self-Managed",
                               details: "Independent Application Required",
                               description: "No institutional visa sponsorship is provided. The student is solely responsible for obtaining the correct legal residence permit. Proof of enrollment is issued only after a successful visa outcome. Recommended only for students with existing residency or clear independent relocation paths."
                             };
                         
                         return (
                           <div className="group relative">
                             <div className={cn(
                               "flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all cursor-help shadow-sm group-hover:shadow-md",
                               info.color
                             )}>
                                {info.icon}
                                <span>{info.label}</span>
                             </div>
                             <div className="absolute bottom-full left-0 mb-3 w-64 p-4 bg-slate-900 text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-20 shadow-2xl border border-slate-700 leading-relaxed translate-y-1 group-hover:translate-y-0">
                                <div className="flex items-center gap-2 mb-2">
                                  {info.icon}
                                  <span className="text-[9px] font-black uppercase tracking-widest text-indigo-300">{info.details}</span>
                                </div>
                                <p className="text-[10px] font-medium text-slate-300 leading-relaxed">
                                  {info.description}
                                </p>
                                <div className="absolute top-full left-6 -mt-1.5 border-6 border-transparent border-t-slate-900"></div>
                             </div>
                           </div>
                         );
                       })()}
                    </div>

                    <div className="h-12 flex flex-col justify-center px-2">
                       <a 
                        href={inst.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1.5 underline underline-offset-4 decoration-indigo-200"
                       >
                         Visit Site <ExternalLink size={12} />
                       </a>
                    </div>

                    <div className="bg-indigo-600 p-6 rounded-[24px] shadow-xl shadow-indigo-100 text-white">
                        <span className="text-[10px] font-black opacity-60 uppercase tracking-widest block mb-1">Total Requirement</span>
                        <span className="text-2xl font-black">${total.toLocaleString()}</span>
                        <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2">
                           <AlertCircle size={14} className="text-indigo-200" />
                           <span className="text-[9px] leading-tight font-medium text-indigo-100">Recommended starting balance based on local rent + tuition.</span>
                        </div>
                    </div>
                    <AISingleCoverLetter institution={inst} profile={profile} />
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
           <div className="flex items-center gap-2 text-slate-400">
              <Info size={16} />
              <span className="text-xs font-medium italic">Geospatial indices provided by Simulated Teleport API 2026.</span>
           </div>
           <button 
            onClick={handleExport}
            disabled={selectedInstitutions.length === 0}
            className="px-6 py-2.5 bg-slate-800 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Export Location Dossier
          </button>
        </div>
      </motion.div>

    </div>
  );
};

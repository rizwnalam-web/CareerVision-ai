import React, { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { getLatestCareerNews } from '../services/geminiService';

export const NewsFlash = ({ country }: { country: string }) => {
  const [news, setNews] = useState<{ career: string, country: string, aiTech: string }[]>([]);

  useEffect(() => {
    const fetchNews = async () => {
      const data = await getLatestCareerNews(country);
      if (data && data.length > 0) {
        setNews(data);
      } else {
        setNews([
          { career: `AI Ethics Specialist`, country: country, aiTech: "Gemini 3 Ultra" },
          { career: "Remote Cybersecurity Lead", country: "Global", aiTech: "Project Aether" },
          { career: "Data Sovereignty Architect", country: "EU-Hague", aiTech: "Logic-Mesh V1" },
          { career: "Biotech Synthetic Engineer", country: "Zurich", aiTech: "Gene-Sys V4" },
          { career: "Quantum Network Architect", country: "Toronto", aiTech: "Q-Router 2" }
        ]);
      }
    };
    fetchNews();
  }, [country]);

  if (news.length === 0) return <div className="h-8 bg-slate-950 border-y border-slate-800 animate-pulse" />;

  return (
    <div className="bg-slate-950 border-y border-slate-800 h-8 flex items-center overflow-hidden whitespace-nowrap relative z-30 shrink-0">
      <div className="absolute left-0 top-0 bottom-0 bg-slate-950 px-4 flex items-center gap-2 z-10 border-r border-slate-800 shadow-[10px_0_15px_rgba(0,0,0,0.5)]">
        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
        <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Global Flash</span>
      </div>
      
      <motion.div 
        animate={{ x: [0, -1000] }}
        transition={{ 
          duration: 35, 
          repeat: Infinity, 
          ease: "linear" 
        }}
        className="flex gap-16 pl-32 items-center"
      >
        {[...news, ...news, ...news].map((item, idx) => (
          <div key={`${item.career}-${idx}`} className="flex items-center gap-4">
            <span className="text-[10px] font-black text-white uppercase tracking-tight">
              {item.career} <span className="text-slate-600 mx-1">/</span> <span className="text-indigo-400">{item.country}</span>
            </span>
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md">
              <Activity size={10} className="text-emerald-500" />
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{item.aiTech}</span>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

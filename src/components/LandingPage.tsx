import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, 
  Target, 
  Map as MapIcon, 
  ShieldCheck, 
  Zap, 
  Globe, 
  TrendingUp, 
  Cpu,
  Flame,
  Radio
} from 'lucide-react';
import { cn } from '../lib/utils';
import { getLatestCareerNews } from '../services/geminiService';

interface LandingPageProps {
  onStart: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  const [news, setNews] = useState<{ career: string, country: string, aiTech: string }[]>([]);
  const [currentNewsIdx, setCurrentNewsIdx] = useState(0);

  useEffect(() => {
    const fetchNews = async () => {
      const data = await getLatestCareerNews();
      if (data && data.length > 0) setNews(data);
    };
    fetchNews();
  }, []);

  useEffect(() => {
    if (news.length === 0) return;
    const interval = setInterval(() => {
      setCurrentNewsIdx((prev) => (prev + 1) % news.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [news]);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-100 italic-selection">
      {/* News Flash Ticker */}
      <div className="bg-slate-900 text-white overflow-hidden py-2 border-b border-white/10 relative z-50">
        <div className="max-w-7xl mx-auto px-8 flex items-center gap-6">
          <div className="flex items-center gap-2 shrink-0">
            <Radio size={14} className="text-rose-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">Live News Flash</span>
          </div>
          <div className="flex-1 relative h-4 overflow-hidden">
            <AnimatePresence mode="wait">
              {news.length > 0 && (
                <motion.div 
                  key={currentNewsIdx}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  className="absolute inset-0 flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest"
                >
                  <span className="text-indigo-400">Trending in {news[currentNewsIdx].country}:</span>
                  <span className="text-white">{news[currentNewsIdx].career}</span>
                  <span className="mx-2 text-slate-700">|</span>
                  <span className="text-amber-400">AI Launch:</span>
                  <span className="text-white">{news[currentNewsIdx].aiTech}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 font-bold text-white shadow-lg">CV</div>
          <span className="text-2xl font-black tracking-tighter text-slate-900">CareerVision<span className="text-indigo-600 italic">AI</span></span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">Intelligence</a>
          <a href="#roadmap" className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">Roadmaps</a>
          <a href="#global" className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">Global Demand</a>
          <button 
            onClick={onStart}
            className="bg-slate-900 text-white px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl hover:shadow-indigo-200"
          >
            Launch System
          </button>
        </div>
      </nav>

      {/* Hero Section - Recipe 11: Split Layout Inspiration */}
      <main className="max-w-7xl mx-auto px-8 py-12 lg:py-24 grid lg:grid-cols-2 gap-16 items-center">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700">2026 Workforce Sync Active</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black leading-[0.9] tracking-tighter text-slate-900 mb-8">
            Pioneer Your <br />
            <span className="text-indigo-600 italic">Global</span> Legacy.
          </h1>
          
          <p className="text-lg text-slate-500 max-w-lg mb-10 leading-relaxed font-medium">
            The era of linear careers is over. CareerVision AI synthesizes real-time global demand, institutional data, and financial modeling into a singular, executable trajectory.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={onStart}
              className="flex items-center justify-center gap-3 bg-indigo-600 text-white px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-2xl shadow-indigo-200 group"
            >
              Initialize My Path <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <div className="flex -space-x-3 items-center">
              {[1, 2, 3, 4].map((i) => (
                <img 
                  key={i}
                  src={`https://picsum.photos/seed/user${i}/100/100`} 
                  className="h-10 w-10 rounded-full border-2 border-white object-cover shadow-sm"
                  referrerPolicy="no-referrer"
                  alt={`User ${i}`}
                />
              ))}
              <div className="pl-6">
                <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Joined by 12,000+</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Global Students</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          {/* Decorative Elements - Recipe 5 Brutalist Tool Vibes */}
          <div className="aspect-square bg-slate-50 rounded-[4rem] relative overflow-hidden border-2 border-slate-100 shadow-2xl ring-1 ring-slate-200">
            <img 
              src="https://picsum.photos/seed/vision/1200/1200" 
              className="absolute inset-0 w-full h-full object-cover opacity-20 grayscale brightness-125"
              referrerPolicy="no-referrer"
              alt="Vision"
            />
            
            {/* Floating Widget 1 */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-12 left-12 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 w-48 z-10"
            >
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={16} className="text-emerald-500" />
                <span className="text-[10px] font-black uppercase tracking-widest">Growth Forecast</span>
              </div>
              <div className="h-12 flex items-end gap-1 px-2">
                {[4, 7, 5, 9, 6].map((h, i) => (
                  <div key={i} className="flex-1 bg-emerald-100 rounded-t-sm" style={{ height: `${h * 10}%` }}></div>
                ))}
              </div>
              <p className="mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">+12.4% Annual Demand</p>
            </motion.div>

            {/* Floating Widget 2 */}
            <motion.div 
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-12 right-12 bg-slate-900 p-4 rounded-2xl shadow-2xl w-56 z-10"
            >
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck size={16} className="text-indigo-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white">Migration Support</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xl font-black text-white">L1-A Ready</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Executive Track</span>
                </div>
                <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
                  <Globe size={20} className="text-indigo-400" />
                </div>
              </div>
            </motion.div>

            {/* Central Visual */}
            <div className="absolute inset-0 flex items-center justify-center opacity-5">
              <Cpu size={300} strokeWidth={0.5} className="text-slate-900" />
            </div>
          </div>
        </motion.div>
      </main>

      {/* Feature Grid */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
            <div>
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-4">Core Systems</p>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Proprietary Architecture for <br /> Future-Ready Success.</h2>
            </div>
            <p className="text-sm text-slate-500 max-w-xs font-medium leading-relaxed">
              We track over 4,000 data points across global labor markets to ensure your roadmap remains relevant.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-1px bg-slate-200 border border-slate-200 overflow-hidden rounded-3xl">
            <FeatureCard 
              icon={<Zap className="text-amber-500" />}
              title="Real-Time Sync" 
              description="Our LLM engine pulls daily updates from IPEDS and O*NET to reflect current hiring trends."
            />
            <FeatureCard 
              icon={<MapIcon className="text-indigo-500" />}
              title="Adaptive roadmaps" 
              description="Your path adjusts to your age, performance, and financial context automatically."
            />
            <FeatureCard 
              icon={<Target className="text-emerald-500" />}
              title="Goal Alignment" 
              description="Connect with elite institutions that match your target career and migration goals."
            />
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
        <div className="max-w-4xl mx-auto px-8 text-center relative z-10">
          <h2 className="text-5xl md:text-7xl font-black mb-8 leading-tight">Ready to map <br /> the unknown?</h2>
          <p className="text-lg text-slate-400 mb-12 max-w-xl mx-auto font-medium">
            Join the students securing the highest-demand positions of 2026. Data-driven, AI-validated, globally focused.
          </p>
          <button 
            onClick={onStart}
            className="inline-flex items-center gap-3 bg-white text-slate-900 px-10 py-5 rounded-2xl text-sm font-black uppercase tracking-[0.2em] hover:bg-indigo-500 hover:text-white transition-all shadow-2xl hover:shadow-indigo-500/50"
          >
            Create My Profile <ChevronRight size={20} />
          </button>
        </div>
        
        {/* Decorative Background Pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:40px_40px]"></div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="py-12 border-t border-slate-100 bg-white px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-slate-900 font-bold text-white text-[10px]">CV</div>
            <span className="text-sm font-bold tracking-tight text-slate-800">CareerVision AI</span>
          </div>
          <div className="flex gap-8">
            <a href="#" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-indigo-600">Privacy</a>
            <a href="#" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-indigo-600">Protocol</a>
            <a href="#" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-indigo-600">Sync Log</a>
          </div>
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">© 2026 Future Systems Laboratory</p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="bg-white p-12 hover:bg-slate-50 transition-colors">
    <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-8 border border-slate-100">
      {icon}
    </div>
    <h3 className="text-xl font-black text-slate-900 mb-4">{title}</h3>
    <p className="text-slate-500 text-sm font-medium leading-relaxed">{description}</p>
  </div>
);

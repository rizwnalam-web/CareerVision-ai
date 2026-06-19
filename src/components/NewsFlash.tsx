import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { getGlobalContextInsights, GlobalInsight } from '../services/geminiService';

const COLOR_MAP: Record<GlobalInsight['color'], { pill: string; dot: string }> = {
  emerald: { pill: 'bg-emerald-500 text-white',  dot: 'bg-emerald-400' },
  indigo:  { pill: 'bg-indigo-500 text-white',   dot: 'bg-indigo-400' },
  amber:   { pill: 'bg-amber-500 text-white',    dot: 'bg-amber-400' },
  rose:    { pill: 'bg-rose-500 text-white',     dot: 'bg-rose-400' },
  purple:  { pill: 'bg-purple-500 text-white',   dot: 'bg-purple-400' },
};

const FALLBACK: GlobalInsight[] = [
  { flag: '🇩🇪', city: 'BERLIN', country: 'Germany', stat: 'AI +24%', category: 'AI', color: 'emerald' },
  { flag: '🇸🇬', city: 'SINGAPORE', country: 'Singapore', stat: 'TECH +31%', category: 'Tech', color: 'indigo' },
  { flag: '🇬🇧', city: 'LONDON', country: 'UK', stat: 'FINTECH +18%', category: 'FinTech', color: 'amber' },
  { flag: '🇺🇸', city: 'NYC', country: 'USA', stat: 'AI ROLES +32%', category: 'AI', color: 'rose' },
  { flag: '🇦🇪', city: 'DUBAI', country: 'UAE', stat: 'CLOUD +28%', category: 'Cloud', color: 'purple' },
  { flag: '🇨🇦', city: 'TORONTO', country: 'Canada', stat: 'HIRING +21%', category: 'Tech', color: 'emerald' },
];

export const NewsFlash = ({ country }: { country: string }) => {
  const [insights, setInsights] = useState<GlobalInsight[]>(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
  const [now, setNow] = useState(() =>
    new Date().toISOString().slice(0, 16).replace('T', ' ')
  );

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      setLoading(true);
      const data = await getGlobalContextInsights(
        country || 'Global',
        ['Technology', 'AI', 'Finance', 'Cloud'],
        'technology'
      );
      if (!cancelled && data.length > 0) setInsights(data);
      if (!cancelled) setLoading(false);
    };
    fetch();
    return () => { cancelled = true; };
  }, [country]);

  // Cycle visible insights every 3.5 s
  useEffect(() => {
    if (insights.length <= 4) return;
    const timer = setInterval(() => {
      setActiveIdx(i => (i + 1) % Math.max(1, insights.length - 3));
    }, 3500);
    return () => clearInterval(timer);
  }, [insights.length]);

  // Live clock (updates every minute)
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date().toISOString().slice(0, 16).replace('T', ' '));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Show 4 at a time
  const visible = insights.slice(activeIdx, activeIdx + 4);

  return (
    <div className="bg-slate-800 border-b border-slate-700 shrink-0 z-30 overflow-hidden">
      <div className="px-6 py-2.5 flex items-center justify-between gap-4">

        {/* Label */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-black text-white uppercase tracking-[0.2em] hidden sm:block">
            Global Intel
          </span>
          <span className="w-px h-4 bg-slate-600 hidden sm:block" />
        </div>

        {/* Cycling pills */}
        <div className="flex-1 flex items-center gap-3 overflow-hidden min-w-0">
          {loading ? (
            [0, 1, 2, 3].map(i => (
              <div key={i} className="h-6 w-28 rounded-full bg-white/5 animate-pulse shrink-0" />
            ))
          ) : (
            <AnimatePresence mode="popLayout" initial={false}>
              {visible.map(item => {
                const c = COLOR_MAP[item.color] ?? COLOR_MAP.indigo;
                return (
                  <motion.div
                    key={`${item.city}-${item.stat}`}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.35, ease: 'easeInOut' }}
                    className="flex items-center gap-2 shrink-0"
                  >
                    <span className="text-sm leading-none select-none">{item.flag}</span>
                    <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wide hidden md:block">
                      {item.city}
                    </span>
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide whitespace-nowrap ${c.pill}`}>
                      {item.stat}
                    </span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Timestamp + Live badge */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[11px] text-slate-400 font-medium hidden lg:block tabular-nums">
            {now} UTC
          </span>
          <div className="flex items-center gap-1.5 bg-emerald-500 rounded-full px-2.5 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Live</span>
          </div>
        </div>
      </div>
    </div>
  );
};

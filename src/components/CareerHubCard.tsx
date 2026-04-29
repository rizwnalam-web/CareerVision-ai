import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, TrendingUp, Users, Briefcase, DollarSign, Globe, Zap } from 'lucide-react';
import { CareerHubIntelligence } from '../types/career';
import { cn } from '../lib/utils';

interface CareerHubCardProps {
  hub: CareerHubIntelligence;
  isLoading?: boolean;
}

export const CareerHubCard: React.FC<CareerHubCardProps> = ({ hub, isLoading = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm animate-pulse">
        <div className="h-8 w-3/4 bg-slate-100 rounded mb-4" />
        <div className="h-4 w-1/2 bg-slate-50 rounded mb-6" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-slate-50 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const salaryMid = hub.averageSalaryRange?.max || 100000;
  const costOfLivingColor = Number(hub.costOfLiving) > 1.3 ? 'text-rose-500' : Number(hub.costOfLiving) > 1.0 ? 'text-amber-500' : 'text-emerald-500';
  const visaColor = hub.visaOpenness === 'High' ? 'bg-emerald-50 text-emerald-700' : hub.visaOpenness === 'Medium' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-white border border-slate-200 rounded-3xl shadow-sm hover:shadow-lg transition-all overflow-hidden group"
    >
      {/* Decorative gradient background */}
      <div
        className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full opacity-10 group-hover:opacity-20 transition-opacity"
        style={{ background: `radial-gradient(circle, #6366f1 0%, transparent 70%)`, filter: "blur(20px)" }}
      />

      <div className="p-6 relative z-10">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">{hub.city}</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{hub.country}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-indigo-50 px-3 py-1.5 rounded-xl">
              <span className="text-indigo-600 text-xs font-black">{hub.intensity}% Heat</span>
            </div>
            <motion.button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown size={18} className="text-slate-400" />
            </motion.button>
          </div>
        </div>

        {/* Intensity Bar */}
        <div className="mb-6 space-y-2">
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${hub.intensity}%` }}
              transition={{ duration: 1, delay: 0.2 }}
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
            />
          </div>
          <p className="text-[10px] text-slate-400 font-semibold">Market Activity: {hub.marketHealthScore}% Healthy</p>
        </div>

        {/* Top Careers - Always Visible */}
        <div className="space-y-3 mb-6">
          <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Top Careers</p>
          <div className="space-y-2">
            {hub.topCareers.slice(0, 3).map((career, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-3 flex items-center justify-between"
              >
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-slate-800">{career.title}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    ${(Number(career.avgSalary.entry) / 1000).toFixed(0)}k - ${(Number(career.avgSalary.senior) / 1000).toFixed(0)}k/yr
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-xs font-black text-indigo-600">{career.demandScore}%</p>
                    <p className="text-[10px] text-slate-400">Demand</p>
                  </div>
                  <TrendingUp size={16} className="text-emerald-500" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Quick Stats - Always Visible */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-slate-50 rounded-xl p-3 text-center">
            <DollarSign size={16} className="mx-auto text-slate-600 mb-1" />
            <p className="text-xs font-black text-slate-800">${(Number(hub.averageSalaryRange.max) / 1000).toFixed(0)}k</p>
            <p className="text-[9px] text-slate-400">Avg Salary</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 text-center">
            <Globe size={16} className="mx-auto text-slate-600 mb-1" />
            <p className={cn("text-xs font-black", costOfLivingColor)}>{Number(hub.costOfLiving).toFixed(1)}x</p>
            <p className="text-[9px] text-slate-400">Cost of Living</p>
          </div>
          <div className={cn("rounded-xl p-3 text-center", visaColor)}>
            <Zap size={16} className="mx-auto mb-1" />
            <p className="text-xs font-black">{hub.visaOpenness}</p>
            <p className="text-[9px]">Visa Open</p>
          </div>
        </div>

        {/* Expandable Details */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t border-slate-200 pt-6 space-y-6"
            >
              {/* Hiring Trends */}
              <div>
                <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Current Trends</p>
                <p className="text-sm text-slate-700 leading-relaxed">{hub.hiringTrends}</p>
              </div>

              {/* Required Skills */}
              <div>
                <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-3">Essential Skills</p>
                <div className="space-y-2">
                  {hub.requiredSkills.slice(0, 5).map((skill, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-slate-700">{skill.skill}</span>
                        <span className="text-[10px] font-black text-indigo-600">{skill.demand}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${skill.demand}%` }}
                          transition={{ duration: 0.5, delay: idx * 0.05 }}
                          className="h-full bg-indigo-500 rounded-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Employers */}
              <div>
                <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Top Employers</p>
                <div className="flex flex-wrap gap-2">
                  {hub.topEmployers.map((employer, idx) => (
                    <span
                      key={idx}
                      className="text-xs font-semibold bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg"
                    >
                      {employer}
                    </span>
                  ))}
                </div>
              </div>

              {/* Career Stats */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Briefcase size={14} className="text-slate-600" />
                    <span className="text-xs font-semibold text-slate-700">Job Openings</span>
                  </div>
                  <span className="text-sm font-black text-indigo-600">
                    {hub.topCareers.reduce((acc, c) => acc + c.openings, 0).toLocaleString()} total
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-slate-600" />
                    <span className="text-xs font-semibold text-slate-700">Internship Spots</span>
                  </div>
                  <span className="text-sm font-black text-emerald-600">{hub.internshipOpportunities}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe size={14} className="text-slate-600" />
                    <span className="text-xs font-semibold text-slate-700">Remote Friendly</span>
                  </div>
                  <span className="text-sm font-black text-purple-600">{hub.remoteWorkPercentage}%</span>
                </div>
              </div>

              {/* All Top Careers */}
              {hub.topCareers.length > 3 && (
                <div>
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-3">All Top Careers</p>
                  <div className="space-y-2">
                    {hub.topCareers.map((career, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-50 rounded-lg p-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{career.title}</p>
                          <p className="text-[10px] text-slate-500">{career.jobGrowth}% growth • {career.openings} openings</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-indigo-600">${(Number(career.avgSalary.mid) / 1000).toFixed(0)}k</p>
                          <p className="text-[9px] text-slate-400">avg salary</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

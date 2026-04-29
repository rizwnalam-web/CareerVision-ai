import React from 'react';
import { motion } from 'motion/react';
import { Globe, Clock, DollarSign, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { cn } from '../lib/utils';

interface VisaDetailsProps {
  visaGuidance: any;
  isLoading?: boolean;
  targetCountry?: string;
  profile?: any;
}

export const VisaDetails: React.FC<VisaDetailsProps> = ({ visaGuidance, isLoading, targetCountry, profile }) => {
  if (!visaGuidance && !isLoading) return null;

  if (isLoading) {
    return (
      <div className="space-y-4 p-6 bg-gradient-to-br from-emerald-50 to-cyan-50 rounded-3xl border border-emerald-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Globe size={18} className="text-emerald-600 animate-spin" />
          <p className="text-sm font-black text-emerald-700 uppercase tracking-widest">Loading visa details...</p>
        </div>
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-3 bg-emerald-200 rounded-full animate-pulse w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!visaGuidance) return null;

  // Safely extract data with defaults
  const recommendedVisas = visaGuidance.recommendedVisaTypes || [];
  const timeline = visaGuidance.processingTimeline || {};
  const cost = visaGuidance.estimatedCost || 1500;
  const sponsorshipLikelihood = visaGuidance.sponsorshipLikelihood || 'Medium';
  const requirements = visaGuidance.requirements || [];
  const nextSteps = visaGuidance.nextSteps || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-8 bg-gradient-to-br from-emerald-50 via-cyan-50 to-blue-50 rounded-3xl border border-emerald-200 shadow-md relative overflow-hidden"
    >
      {/* Background accent */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-200/20 rounded-full blur-3xl -z-10" />

      {/* Header */}
      <div className="flex items-start gap-4 pb-6 border-b border-emerald-200/50">
        <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white flex-shrink-0">
          <Globe size={24} />
        </div>
        <div>
          <h3 className="text-xl font-black text-emerald-900 tracking-tight mb-1">Visa Roadmap</h3>
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
            {targetCountry || 'International'} Immigration Guide
          </p>
        </div>
      </div>

      {/* Recommended Visa Types */}
      <div>
        <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-3 flex items-center gap-2">
          <CheckCircle2 size={14} className="text-emerald-600" />
          Recommended Visa Types
        </p>
        <div className="flex flex-wrap gap-2">
          {recommendedVisas.map((visa: string, idx: number) => (
            <motion.span
              key={idx}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="px-4 py-2 bg-emerald-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-md"
            >
              {visa}
            </motion.span>
          ))}
        </div>
      </div>

      {/* Processing Timeline */}
      <div className="p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-emerald-100">
        <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest mb-2 flex items-center gap-2">
          <Clock size={12} /> Processing Timeline
        </p>
        {typeof timeline === 'object' && Object.keys(timeline).length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm font-bold text-slate-800">
              {timeline.totalTimeline || '3-6 months total'}
            </p>
            {timeline.applicationSubmission && (
              <p className="text-[11px] text-slate-600">
                📋 Application: {timeline.applicationSubmission}
              </p>
            )}
            {timeline.visaProcessing && (
              <p className="text-[11px] text-slate-600">
                ✓ Visa Processing: {timeline.visaProcessing}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm font-bold text-slate-800">{timeline || '3-6 months'}</p>
        )}
        <p className="text-[9px] text-slate-500 mt-1">From document submission to approval</p>
      </div>

      {/* Estimated Cost */}
      <div className="p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-emerald-100">
        <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest mb-2 flex items-center gap-2">
          <DollarSign size={12} /> Estimated Cost
        </p>
        <p className="text-lg font-black text-emerald-700">
          ${typeof cost === 'number' ? cost.toLocaleString() : '1,500'}
        </p>
        <p className="text-[9px] text-slate-500 mt-1">Fees, processing, medical, translation</p>
      </div>

      {/* Sponsorship Likelihood */}
      <div>
        <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest mb-3 flex items-center gap-2">
          <AlertCircle size={12} />
          Sponsorship Likelihood
        </p>
        <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{
              width: sponsorshipLikelihood === 'High' ? '90%' : sponsorshipLikelihood === 'Medium' ? '55%' : '25%'
            }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className={cn(
              'h-full rounded-full transition-all',
              sponsorshipLikelihood === 'High'
                ? 'bg-emerald-500'
                : sponsorshipLikelihood === 'Medium'
                  ? 'bg-amber-500'
                  : 'bg-red-400'
            )}
          />
        </div>
        <p className={cn(
          'text-xs font-black uppercase tracking-widest mt-2 flex items-center gap-1',
          sponsorshipLikelihood === 'High'
            ? 'text-emerald-700'
            : sponsorshipLikelihood === 'Medium'
              ? 'text-amber-700'
              : 'text-red-700'
        )}>
          {sponsorshipLikelihood} Likelihood
        </p>
      </div>

      {/* Requirements */}
      {requirements.length > 0 && (
        <div>
          <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest mb-3 flex items-center gap-2">
            <FileText size={12} /> Requirements
          </p>
          <ul className="space-y-2">
            {requirements.map((req: string, idx: number) => (
              <motion.li
                key={idx}
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="text-sm text-slate-700 flex items-start gap-3"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0 mt-1.5" />
                {req}
              </motion.li>
            ))}
          </ul>
        </div>
      )}

      {/* Next Steps */}
      {nextSteps.length > 0 && (
        <div className="p-4 bg-emerald-100/50 rounded-2xl border border-emerald-200">
          <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest mb-3">Next Steps</p>
          <ol className="space-y-2 counter-reset: list-counter">
            {nextSteps.map((step: string, idx: number) => (
              <li key={idx} className="text-[11px] text-slate-700 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] font-black flex-shrink-0">
                  {idx + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}
    </motion.div>
  );
};

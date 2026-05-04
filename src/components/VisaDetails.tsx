import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, Clock, DollarSign, CheckCircle2, AlertCircle, FileText, BookOpen, Building2, ChevronDown, ExternalLink, Landmark, ShieldCheck, Info } from 'lucide-react';
import { cn } from '../lib/utils';

interface VisaDetailsProps {
  visaGuidance: any;
  isLoading?: boolean;
  targetCountry?: string;
  profile?: any;
}

const Section = ({ title, icon, children, defaultOpen = true }: { title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-emerald-100 rounded-2xl overflow-hidden bg-white/60 backdrop-blur-sm">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-emerald-50/50 transition-colors"
      >
        <span className="flex items-center gap-2 text-[10px] font-black text-emerald-800 uppercase tracking-widest">
          {icon} {title}
        </span>
        <ChevronDown size={14} className={cn("text-emerald-400 transition-transform duration-200", open && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const VisaDetails: React.FC<VisaDetailsProps> = ({ visaGuidance, isLoading, targetCountry, profile }) => {
  const [loadingTooLong, setLoadingTooLong] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setLoadingTooLong(false);
      return;
    }
    const timer = setTimeout(() => setLoadingTooLong(true), 20000);
    return () => clearTimeout(timer);
  }, [isLoading]);

  if (!visaGuidance && !isLoading) return null;

  if (isLoading) {
    return (
      <div className="space-y-4 p-6 bg-gradient-to-br from-emerald-50 to-cyan-50 rounded-3xl border border-emerald-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Globe size={18} className={loadingTooLong ? "text-amber-500" : "text-emerald-600 animate-spin"} />
          <p className={`text-sm font-black uppercase tracking-widest ${loadingTooLong ? "text-amber-700" : "text-emerald-700"}`}>
            {loadingTooLong
              ? "Taking longer than usual — AI is generating real visa data..."
              : "Fetching live visa requirements..."}
          </p>
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={cn("h-3 bg-emerald-200 rounded-full animate-pulse", i % 2 === 0 ? "w-full" : "w-3/4")} />
          ))}
        </div>
        {loadingTooLong && (
          <p className="text-[10px] text-amber-600 font-medium">
            Generating country-specific visa requirements, documents, and test details. Please wait...
          </p>
        )}
      </div>
    );
  }

  if (!visaGuidance) return null;

  const recommendedVisas = visaGuidance.recommendedVisaTypes || [];
  const timeline = visaGuidance.processingTimeline || {};
  const cost = visaGuidance.estimatedCost || {};
  const requiredDocuments = visaGuidance.requiredDocuments || [];
  const languageTests = visaGuidance.languageAndAcademicTests || [];
  const financialReqs = visaGuidance.financialRequirements || {};
  const sponsorshipLikelihood = visaGuidance.sponsorshipLikelihood || 'Medium';
  const embassyInfo = visaGuidance.embassyInfo || {};
  const nextSteps = visaGuidance.nextSteps || [];
  const postArrival = visaGuidance.postArrivalRequirements || [];

  const totalCost = typeof cost === 'number' ? cost : (cost.totalEstimate || 0);
  const currency = cost.currency || 'USD';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 p-8 bg-gradient-to-br from-emerald-50 via-cyan-50 to-blue-50 rounded-3xl border border-emerald-200 shadow-md relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-200/20 rounded-full blur-3xl -z-10" />

      {/* Header */}
      <div className="flex items-start justify-between pb-5 border-b border-emerald-200/50">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white flex-shrink-0">
            <Globe size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-emerald-900 tracking-tight mb-1">Visa Roadmap</h3>
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
              {targetCountry || 'International'} Immigration Guide
            </p>
            {visaGuidance.importantDeadlines && (
              <p className="text-[10px] text-amber-700 font-bold mt-1 flex items-center gap-1">
                <AlertCircle size={10} /> {visaGuidance.importantDeadlines}
              </p>
            )}
          </div>
        </div>
        {embassyInfo.officialPortalUrl && (
          <a
            href={embassyInfo.officialPortalUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-all shadow-md"
          >
            Official Portal <ExternalLink size={10} />
          </a>
        )}
      </div>

      {/* Recommended Visa Types */}
      <Section title="Recommended Visa Types" icon={<ShieldCheck size={12} />}>
        <div className="space-y-3 pt-1">
          {recommendedVisas.map((visa: any, idx: number) => {
            const visaName = typeof visa === 'string' ? visa : visa.name;
            const visaCode = typeof visa === 'object' ? visa.code : null;
            const visaDesc = typeof visa === 'object' ? visa.description : null;
            const workRights = typeof visa === 'object' ? visa.workRights : null;
            const maxDuration = typeof visa === 'object' ? visa.maxDuration : null;
            return (
              <motion.div
                key={idx}
                initial={{ scale: 0.97, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: idx * 0.08 }}
                className="p-4 bg-emerald-600 text-white rounded-2xl shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-black">{visaName}</p>
                    {visaCode && <p className="text-[9px] font-bold text-emerald-200 uppercase tracking-widest mt-0.5">{visaCode}</p>}
                  </div>
                  {maxDuration && (
                    <span className="px-2 py-1 bg-white/20 rounded-lg text-[8px] font-black uppercase tracking-wider shrink-0">{maxDuration}</span>
                  )}
                </div>
                {visaDesc && <p className="text-[10px] text-emerald-100 mt-2 leading-relaxed">{visaDesc}</p>}
                {workRights && (
                  <p className="text-[9px] text-emerald-200 mt-2 flex items-center gap-1">
                    <CheckCircle2 size={9} /> Work rights: {workRights}
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      </Section>

      {/* Required Documents */}
      {requiredDocuments.length > 0 && (
        <Section title={`Required Documents (${requiredDocuments.length})`} icon={<FileText size={12} />}>
          <div className="space-y-2.5 pt-1">
            {requiredDocuments.map((doc: any, idx: number) => {
              const docName = typeof doc === 'string' ? doc : doc.name;
              const issuedBy = typeof doc === 'object' ? doc.issuedBy : null;
              const description = typeof doc === 'object' ? doc.description : null;
              const notes = typeof doc === 'object' ? doc.notes : null;
              const mandatory = typeof doc === 'object' ? doc.mandatory !== false : true;
              return (
                <motion.div
                  key={idx}
                  initial={{ x: -8, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: idx * 0.04 }}
                  className="flex items-start gap-3 p-3 bg-white/70 rounded-xl border border-emerald-100"
                >
                  <div className={cn("w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5", mandatory ? "bg-emerald-500" : "bg-slate-300")}>
                    <CheckCircle2 size={11} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[11px] font-black text-slate-800">{docName}</p>
                      {!mandatory && <span className="text-[8px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-bold uppercase">Optional</span>}
                    </div>
                    {description && <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{description}</p>}
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {issuedBy && (
                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          Issued by: {issuedBy}
                        </span>
                      )}
                      {notes && (
                        <span className="text-[9px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
                          ⚠ {notes}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Language & Academic Tests */}
      {languageTests.length > 0 && (
        <Section title="Language & Academic Tests" icon={<BookOpen size={12} />}>
          <div className="space-y-3 pt-1">
            {languageTests.map((test: any, idx: number) => {
              const testName = typeof test === 'string' ? test : test.testName;
              const minScore = typeof test === 'object' ? test.minimumScore : null;
              const purpose = typeof test === 'object' ? test.purpose : null;
              const validity = typeof test === 'object' ? test.validity : null;
              const waivable = typeof test === 'object' ? test.waivable : null;
              const alternatives = typeof test === 'object' && Array.isArray(test.alternativeTests) ? test.alternativeTests : [];
              return (
                <motion.div
                  key={idx}
                  initial={{ x: -8, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: idx * 0.06 }}
                  className="p-4 bg-blue-50/80 border border-blue-100 rounded-2xl"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-black text-blue-900">{testName}</p>
                      {purpose && <p className="text-[9px] text-blue-600 font-bold mt-0.5">{purpose}</p>}
                    </div>
                    {minScore && (
                      <div className="text-right shrink-0">
                        <p className="text-[9px] font-black text-blue-700 uppercase tracking-wider">Min Score</p>
                        <p className="text-xs font-black text-blue-900">{minScore}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {validity && (
                      <span className="text-[9px] text-slate-500 bg-white px-2 py-0.5 rounded-full font-medium border border-slate-100">
                        Valid: {validity}
                      </span>
                    )}
                    {waivable && (
                      <span className="text-[9px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                        {waivable}
                      </span>
                    )}
                  </div>
                  {alternatives.length > 0 && (
                    <p className="text-[9px] text-slate-500 mt-2">
                      Alternatives: {alternatives.join(', ')}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Financial Requirements */}
      {(financialReqs.proofOfFundsAmount || totalCost > 0) && (
        <Section title="Financial Requirements" icon={<DollarSign size={12} />}>
          <div className="space-y-3 pt-1">
            {totalCost > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {typeof cost === 'object' && cost.visaApplicationFee > 0 && (
                  <div className="p-3 bg-white/70 rounded-xl border border-emerald-100 text-center">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Application Fee</p>
                    <p className="text-sm font-black text-emerald-700">${cost.visaApplicationFee.toLocaleString()}</p>
                  </div>
                )}
                {typeof cost === 'object' && cost.biometricsFee > 0 && (
                  <div className="p-3 bg-white/70 rounded-xl border border-emerald-100 text-center">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Biometrics Fee</p>
                    <p className="text-sm font-black text-emerald-700">${cost.biometricsFee.toLocaleString()}</p>
                  </div>
                )}
                {typeof cost === 'object' && cost.healthSurcharge > 0 && (
                  <div className="p-3 bg-white/70 rounded-xl border border-emerald-100 text-center">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Health Surcharge</p>
                    <p className="text-sm font-black text-emerald-700">${cost.healthSurcharge.toLocaleString()}</p>
                  </div>
                )}
                {typeof cost === 'object' && cost.medicalExamEstimate > 0 && (
                  <div className="p-3 bg-white/70 rounded-xl border border-emerald-100 text-center">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Medical Exam</p>
                    <p className="text-sm font-black text-emerald-700">~${cost.medicalExamEstimate.toLocaleString()}</p>
                  </div>
                )}
                <div className="col-span-2 p-3 bg-emerald-600 rounded-xl text-center">
                  <p className="text-[8px] font-black text-emerald-200 uppercase tracking-widest">Total Visa Cost Estimate</p>
                  <p className="text-lg font-black text-white">{currency} {totalCost.toLocaleString()}</p>
                </div>
              </div>
            )}
            {financialReqs.proofOfFundsAmount > 0 && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest mb-1">Proof of Funds Required</p>
                <p className="text-base font-black text-amber-900">
                  {financialReqs.currency || 'USD'} {financialReqs.proofOfFundsAmount.toLocaleString()}
                </p>
                {financialReqs.description && (
                  <p className="text-[10px] text-amber-700 mt-1">{financialReqs.description}</p>
                )}
                {Array.isArray(financialReqs.acceptedEvidence) && financialReqs.acceptedEvidence.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {financialReqs.acceptedEvidence.map((e: string, i: number) => (
                      <li key={i} className="text-[10px] text-amber-800 flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-amber-500 shrink-0" /> {e}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Processing Timeline */}
      <Section title="Processing Timeline" icon={<Clock size={12} />}>
        <div className="space-y-2 pt-1">
          {typeof timeline === 'object' ? (
            <>
              {timeline.totalTimeline && (
                <div className="p-3 bg-emerald-100/60 rounded-xl border border-emerald-200 flex justify-between items-center">
                  <p className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">Total Timeline</p>
                  <p className="text-sm font-black text-emerald-900">{timeline.totalTimeline}</p>
                </div>
              )}
              {[
                { label: 'Document Collection', val: timeline.documentCollection },
                { label: 'Application Submission', val: timeline.applicationSubmission },
                { label: 'Visa Processing', val: timeline.visaProcessing },
                { label: 'Biometrics Appointment', val: timeline.biometricsAppointment },
                { label: 'Apply Before Course Start', val: timeline.earliestApplyBeforeCourseStart },
              ].filter(r => r.val).map((row, i) => (
                <div key={i} className="flex justify-between items-center py-1.5 border-b border-emerald-50 last:border-0">
                  <p className="text-[10px] font-bold text-slate-500">{row.label}</p>
                  <p className="text-[10px] font-black text-slate-800">{row.val}</p>
                </div>
              ))}
            </>
          ) : (
            <p className="text-sm font-bold text-slate-800">{timeline}</p>
          )}
        </div>
      </Section>

      {/* Sponsorship Likelihood */}
      <Section title="Sponsorship Likelihood" icon={<Landmark size={12} />} defaultOpen={false}>
        <div className="space-y-3 pt-2">
          <div className="relative h-2.5 bg-slate-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: sponsorshipLikelihood === 'High' ? '90%' : sponsorshipLikelihood === 'Medium' ? '55%' : '20%'
              }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className={cn(
                'h-full rounded-full',
                sponsorshipLikelihood === 'High' ? 'bg-emerald-500' :
                sponsorshipLikelihood === 'Medium' ? 'bg-amber-500' : 'bg-red-400'
              )}
            />
          </div>
          <p className={cn(
            'text-xs font-black uppercase tracking-widest flex items-center gap-1',
            sponsorshipLikelihood === 'High' ? 'text-emerald-700' :
            sponsorshipLikelihood === 'Medium' ? 'text-amber-700' : 'text-red-700'
          )}>
            {sponsorshipLikelihood} Likelihood
          </p>
          {visaGuidance.sponsorshipNotes && (
            <p className="text-[10px] text-slate-600 leading-relaxed bg-white/60 p-3 rounded-xl border border-slate-100">
              {visaGuidance.sponsorshipNotes}
            </p>
          )}
        </div>
      </Section>

      {/* Embassy & Official Info */}
      {(embassyInfo.processingLocation || embassyInfo.officialPortalUrl) && (
        <Section title="Embassy & Official Info" icon={<Building2 size={12} />} defaultOpen={false}>
          <div className="space-y-2 pt-1">
            {embassyInfo.processingLocation && (
              <div className="flex justify-between items-center py-1.5 border-b border-emerald-50">
                <p className="text-[10px] font-bold text-slate-500">Processing Location</p>
                <p className="text-[10px] font-black text-slate-800 text-right max-w-[60%]">{embassyInfo.processingLocation}</p>
              </div>
            )}
            {embassyInfo.officialPortalUrl && (
              <a href={embassyInfo.officialPortalUrl} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-200 hover:bg-emerald-100 transition-colors group"
              >
                <ExternalLink size={12} className="text-emerald-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">Official Government Portal</p>
                  <p className="text-[10px] text-emerald-600 truncate">{embassyInfo.officialPortalUrl}</p>
                </div>
              </a>
            )}
            {embassyInfo.appointmentBookingUrl && (
              <a href={embassyInfo.appointmentBookingUrl} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl border border-blue-200 hover:bg-blue-100 transition-colors"
              >
                <ExternalLink size={12} className="text-blue-600 shrink-0" />
                <div>
                  <p className="text-[9px] font-black text-blue-700 uppercase tracking-widest">Book Appointment</p>
                  <p className="text-[10px] text-blue-600 truncate">{embassyInfo.appointmentBookingUrl}</p>
                </div>
              </a>
            )}
          </div>
        </Section>
      )}

      {/* Post-Arrival Requirements */}
      {postArrival.length > 0 && (
        <Section title="Post-Arrival Requirements" icon={<Info size={12} />} defaultOpen={false}>
          <ul className="space-y-2 pt-1">
            {postArrival.map((item: string, idx: number) => (
              <li key={idx} className="text-[11px] text-slate-700 flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[9px] font-black flex-shrink-0">{idx + 1}</span>
                {item}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Next Steps */}
      {nextSteps.length > 0 && (
        <div className="p-5 bg-emerald-100/50 rounded-2xl border border-emerald-200">
          <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest mb-3 flex items-center gap-2">
            <CheckCircle2 size={12} /> Action Plan — Next Steps
          </p>
          <ol className="space-y-2">
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

      {/* Country-Specific Notes */}
      {visaGuidance.countrySpecificNotes && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl">
          <p className="text-[9px] font-black text-blue-700 uppercase tracking-widest mb-1 flex items-center gap-1">
            <Info size={10} /> Country-Specific Notes
          </p>
          <p className="text-[11px] text-blue-800 leading-relaxed">{visaGuidance.countrySpecificNotes}</p>
        </div>
      )}
    </motion.div>
  );
};


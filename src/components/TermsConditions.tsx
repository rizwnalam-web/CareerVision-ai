import React from 'react';
import { motion } from 'motion/react';
import { FileText, ArrowLeft, AlertTriangle, CheckCircle2, Scale, Ban, Shield, Users, RefreshCw, Mail } from 'lucide-react';

interface TermsConditionsProps {
  onBack: () => void;
}

const Section: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode; delay?: number }> = ({ icon, title, children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="mb-12"
  >
    <div className="flex items-center gap-3 mb-4">
      <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <h2 className="text-xl font-black text-slate-900 tracking-tight">{title}</h2>
    </div>
    <div className="pl-12 space-y-3 text-sm text-slate-600 font-medium leading-relaxed">
      {children}
    </div>
  </motion.div>
);

export const TermsConditions: React.FC<TermsConditionsProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Header */}
      <div className="bg-slate-950 text-white py-16 px-8">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs font-black uppercase tracking-widest mb-8"
          >
            <ArrowLeft size={14} /> Back to Home
          </button>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-700 flex items-center justify-center">
              <FileText size={24} className="text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1">Legal</p>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight">Terms &amp; Conditions</h1>
            </div>
          </div>
          <p className="text-slate-400 text-sm font-medium mt-4">
            Last updated: <strong className="text-slate-300">June 19, 2026</strong> &nbsp;·&nbsp; Effective: June 19, 2026
          </p>
          <p className="text-slate-400 text-sm font-medium mt-2 max-w-2xl">
            These Terms &amp; Conditions govern your access to and use of CareerVision AI, operated by decodflow.com ("Company", "we", "our"). By creating an account or using our platform, you agree to be bound by these terms.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-8 py-16">

        {/* Summary box */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-14 p-5 bg-amber-50 border border-amber-200 rounded-2xl"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-black text-amber-900 text-sm mb-1">Plain-Language Summary</p>
              <p className="text-amber-800 text-xs leading-relaxed">
                Use our platform lawfully, respect other users, don't abuse our AI systems, and understand that career guidance is informational — not a guarantee of employment outcomes. We may update these terms and will notify you of material changes.
              </p>
            </div>
          </div>
        </motion.div>

        <Section icon={<FileText size={16} className="text-slate-600" />} title="1. Acceptance of Terms" delay={0.05}>
          <p>
            By accessing or using CareerVision AI ("the Service") through any interface including <strong>{import.meta.env.VITE_APP_DOMAIN || 'careervision.ai'}</strong> or any subdomain thereof, you confirm that:
          </p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>You are at least 16 years of age (or the minimum age of digital consent in your jurisdiction).</li>
            <li>You have read, understood, and agree to be bound by these Terms &amp; Conditions.</li>
            <li>If you are using the Service on behalf of an organisation, you have authority to bind that organisation to these terms.</li>
          </ul>
          <p className="mt-2">If you do not agree to these terms, please discontinue use of the Service immediately.</p>
        </Section>

        <Section icon={<CheckCircle2 size={16} className="text-slate-600" />} title="2. Description of Service" delay={0.1}>
          <p>CareerVision AI provides:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>AI-powered career path recommendations and personalised roadmaps.</li>
            <li>Global labour market data analysis and career demand forecasts.</li>
            <li>Skill gap analysis with recommended upskilling resources.</li>
            <li>Educational institution matching and programme recommendations.</li>
            <li>AI interview simulation and preparation tools.</li>
            <li>Resume building, job matching, and visa pathway guidance.</li>
          </ul>
          <p className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-xs">
            <strong>Important:</strong> CareerVision AI is an <em>informational tool</em>. Career recommendations are AI-generated and based on publicly available data. They do not constitute professional career counselling, legal immigration advice, or employment guarantees.
          </p>
        </Section>

        <Section icon={<Users size={16} className="text-slate-600" />} title="3. User Accounts" delay={0.15}>
          <p>When creating an account, you agree to:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>Provide accurate, current, and complete registration information.</li>
            <li>Maintain the security of your credentials. You are responsible for all activity under your account.</li>
            <li>Notify us immediately of any unauthorised access at <a href="mailto:security@decodflow.com" className="text-indigo-600 hover:underline">security@decodflow.com</a>.</li>
            <li>Not share your account with others or create multiple accounts to circumvent restrictions.</li>
            <li>Not use another person's account without authorisation.</li>
          </ul>
          <p className="mt-3">We reserve the right to suspend or terminate accounts that violate these terms, engage in fraudulent activity, or misuse the Service.</p>
        </Section>

        <Section icon={<Ban size={16} className="text-slate-600" />} title="4. Acceptable Use Policy" delay={0.2}>
          <p>You agree <strong>not</strong> to use CareerVision AI to:</p>
          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            {[
              'Scrape, crawl, or systematically extract data from the platform without written consent.',
              'Attempt to reverse-engineer, decompile, or access source code of our AI systems.',
              'Upload malicious content, malware, or scripts designed to disrupt the Service.',
              'Impersonate another person or entity, or provide false information.',
              'Circumvent access controls, rate limits, or authentication mechanisms.',
              'Use the Service for any unlawful purpose or in violation of applicable regulations.',
              'Harvest other users\' data or personal information without consent.',
              'Resell, sublicense, or commercially exploit the Service without prior written permission.',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2 p-3 bg-red-50 rounded-xl border border-red-100">
                <Ban size={12} className="text-red-400 mt-0.5 shrink-0" />
                <p className="text-red-700 text-xs">{item}</p>
              </div>
            ))}
          </div>
          <p className="mt-4">Violations may result in immediate account termination and, where applicable, reporting to relevant authorities.</p>
        </Section>

        <Section icon={<Shield size={16} className="text-slate-600" />} title="5. Intellectual Property" delay={0.25}>
          <p>All content, features, and functionality of CareerVision AI — including but not limited to text, graphics, AI models, algorithms, interfaces, and data compilations — are owned by or licensed to decodflow.com and are protected by intellectual property laws.</p>
          <p className="mt-3">You are granted a limited, non-exclusive, non-transferable licence to use the Service for your personal, non-commercial career planning purposes only.</p>
          <p className="mt-3"><strong>User-generated content:</strong> By submitting feedback, reviews, or other content, you grant us a non-exclusive, royalty-free, perpetual licence to use, modify, and display such content in connection with the Service (with attribution where appropriate).</p>
        </Section>

        <Section icon={<AlertTriangle size={16} className="text-slate-600" />} title="6. Disclaimer of Warranties" delay={0.3}>
          <div className="p-4 bg-slate-900 text-white rounded-2xl">
            <p className="text-sm leading-relaxed">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
            </p>
            <p className="text-slate-300 text-sm mt-3 leading-relaxed">
              We do not warrant that: (a) the Service will be uninterrupted or error-free; (b) AI-generated career recommendations will be accurate, complete, or suitable for your specific circumstances; (c) labour market data will be real-time accurate; or (d) the Service will meet your specific requirements.
            </p>
          </div>
        </Section>

        <Section icon={<Scale size={16} className="text-slate-600" />} title="7. Limitation of Liability" delay={0.35}>
          <p>
            To the maximum extent permitted by applicable law, decodflow.com, its officers, directors, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to:
          </p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>Loss of employment opportunities or career outcomes based on AI recommendations.</li>
            <li>Decisions made regarding educational programmes, immigration applications, or career changes.</li>
            <li>Data loss, service interruptions, or technical errors.</li>
            <li>Any reliance on third-party data sources integrated into the platform.</li>
          </ul>
          <p className="mt-3">Our total aggregate liability to you shall not exceed the amount paid by you for the Service in the 12 months preceding the claim, or USD $100, whichever is greater.</p>
        </Section>

        <Section icon={<RefreshCw size={16} className="text-slate-600" />} title="8. Modifications to Terms and Service" delay={0.4}>
          <p>We reserve the right to modify these Terms at any time. Changes will be effective upon posting the updated Terms on the platform.</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li><strong>Material changes</strong> (affecting your rights or obligations) will be communicated via email or an in-app notification at least 14 days before taking effect.</li>
            <li><strong>Minor changes</strong> (typos, clarifications) may be made without prior notice.</li>
            <li>Continued use of the Service after changes constitute acceptance of the revised Terms.</li>
          </ul>
          <p className="mt-3">We also reserve the right to modify, suspend, or discontinue any part of the Service at any time with reasonable notice.</p>
        </Section>

        <Section icon={<Scale size={16} className="text-slate-600" />} title="9. Governing Law &amp; Dispute Resolution" delay={0.45}>
          <p>
            These Terms are governed by and construed in accordance with applicable international law and the laws of the jurisdiction in which decodflow.com is registered, without regard to conflict of law provisions.
          </p>
          <p className="mt-3">
            Any disputes arising from these Terms or your use of the Service shall first be attempted to be resolved through good-faith negotiation. If unresolved within 30 days, disputes shall be submitted to binding arbitration under internationally recognised arbitration rules.
          </p>
          <p className="mt-3">Users in the European Union retain the right to lodge complaints with their local Data Protection Authority.</p>
        </Section>

        <Section icon={<Users size={16} className="text-slate-600" />} title="10. Termination" delay={0.5}>
          <p>Either party may terminate this agreement at any time:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li><strong>You</strong> may delete your account at any time via Account Settings. Upon deletion, your personal data will be purged within 90 days per our Privacy Policy.</li>
            <li><strong>We</strong> may suspend or terminate your account for violations of these Terms, fraudulent activity, or for operational reasons, with or without notice depending on severity.</li>
          </ul>
          <p className="mt-3">Sections 5 (Intellectual Property), 6 (Disclaimer), 7 (Limitation of Liability), and 9 (Governing Law) survive termination.</p>
        </Section>

        <Section icon={<Mail size={16} className="text-slate-600" />} title="11. Contact" delay={0.55}>
          <p>For questions about these Terms &amp; Conditions:</p>
          <div className="mt-3 p-4 bg-slate-900 text-white rounded-2xl">
            <p className="font-black text-sm mb-1">CareerVision AI — Legal Team</p>
            <p className="text-slate-300 text-xs">decodflow.com</p>
            <a href="mailto:legal@decodflow.com" className="text-indigo-400 text-xs hover:text-indigo-300 font-bold">legal@decodflow.com</a>
          </div>
        </Section>

        <div className="mt-8 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
          <p className="text-xs text-slate-500 font-medium">
            These Terms &amp; Conditions were last reviewed on <strong>June 19, 2026</strong>. If you accessed this page after that date, please check for the most recent version at {import.meta.env.VITE_APP_DOMAIN || 'careervision.ai'}.
          </p>
        </div>

        <div className="mt-12 flex justify-center">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-all"
          >
            <ArrowLeft size={14} /> Back to CareerVision AI
          </button>
        </div>
      </div>
    </div>
  );
};

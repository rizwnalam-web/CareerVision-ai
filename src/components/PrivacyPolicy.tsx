import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, ArrowLeft, Lock, Eye, Database, Globe, Mail, RefreshCw } from 'lucide-react';

interface PrivacyPolicyProps {
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
      <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <h2 className="text-xl font-black text-slate-900 tracking-tight">{title}</h2>
    </div>
    <div className="pl-12 space-y-3 text-sm text-slate-600 font-medium leading-relaxed">
      {children}
    </div>
  </motion.div>
);

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
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
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center">
              <ShieldCheck size={24} className="text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-1">Legal</p>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight">Privacy Policy</h1>
            </div>
          </div>
          <p className="text-slate-400 text-sm font-medium mt-4">
            Last updated: <strong className="text-slate-300">June 19, 2026</strong> &nbsp;·&nbsp; Effective: June 19, 2026
          </p>
          <p className="text-slate-400 text-sm font-medium mt-2 max-w-2xl">
            CareerVision AI ("we", "us", "our") is operated by decodflow.com. This policy explains how we collect, use, and protect your personal data when you use our platform at <strong className="text-slate-300">easycareer-ai.decodflow.com</strong> and related services.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-8 py-16">

        <Section icon={<Database size={16} className="text-indigo-600" />} title="1. Information We Collect" delay={0.05}>
          <p>We collect the following categories of information to provide and improve our services:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li><strong>Account Information:</strong> Name, email address, and password (hashed) when you register.</li>
            <li><strong>Profile Data:</strong> Age, educational background, career goals, target country, and work experience you provide during onboarding.</li>
            <li><strong>Usage Data:</strong> Features accessed, career paths explored, sessions created, and interaction patterns within the platform.</li>
            <li><strong>Technical Data:</strong> IP address, browser type, device identifiers, and page visit timestamps (collected via server logs and analytics).</li>
            <li><strong>Feedback &amp; Communications:</strong> Any feedback, ratings, or support requests you submit through the platform.</li>
          </ul>
          <p className="mt-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100 text-indigo-700 text-xs">
            We do <strong>not</strong> collect payment card information directly. Any billing is handled through secure third-party processors.
          </p>
        </Section>

        <Section icon={<Eye size={16} className="text-indigo-600" />} title="2. How We Use Your Information" delay={0.1}>
          <p>Your data is used exclusively to provide and improve the CareerVision AI experience:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>Generating personalised AI career roadmaps, skill gap analyses, and institution recommendations.</li>
            <li>Authenticating your account and maintaining your session securely via Firebase Authentication.</li>
            <li>Storing your saved roadmaps, resume data, and progress history in your personal profile.</li>
            <li>Sending transactional emails (account verification, password reset) — never unsolicited marketing without consent.</li>
            <li>Improving our AI models using anonymised, aggregated usage patterns. Individual data is never used to train models without explicit consent.</li>
            <li>Complying with legal obligations and preventing fraud or abuse.</li>
          </ul>
        </Section>

        <Section icon={<Globe size={16} className="text-indigo-600" />} title="3. Third-Party Services" delay={0.15}>
          <p>We integrate the following trusted third-party services. Each is subject to their own privacy policies:</p>
          <div className="space-y-3 mt-3">
            {[
              { name: 'Firebase (Google)', purpose: 'Authentication, real-time database, and secure file storage.', link: 'https://firebase.google.com/support/privacy' },
              { name: 'Google Gemini AI', purpose: 'Powers our Spark.E AI assistant for career intelligence and recommendations.', link: 'https://ai.google.dev/gemini-api/terms' },
              { name: 'Netlify', purpose: 'Hosting and CDN delivery of the web application.', link: 'https://www.netlify.com/privacy/' },
              { name: 'Render', purpose: 'Backend API server hosting.', link: 'https://render.com/privacy' },
              { name: 'PostgreSQL (via Render)', purpose: 'Secure relational database for user and career data.', link: null },
            ].map(({ name, purpose, link }) => (
              <div key={name} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <div>
                  <p className="font-black text-slate-800 text-xs">{name}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{purpose}</p>
                  {link && <a href={link} target="_blank" rel="noopener noreferrer" className="text-indigo-600 text-[10px] font-bold hover:underline">{link}</a>}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section icon={<Lock size={16} className="text-indigo-600" />} title="4. Data Security" delay={0.2}>
          <p>We implement industry-standard security measures to protect your data:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li><strong>Encryption in transit:</strong> All data is transmitted over TLS 1.3 (HTTPS). HTTP connections are automatically redirected to HTTPS.</li>
            <li><strong>Encryption at rest:</strong> Database fields containing sensitive data are encrypted at the storage level via Firebase and PostgreSQL security configurations.</li>
            <li><strong>Password hashing:</strong> Passwords are never stored in plain text. Firebase Authentication uses industry-standard bcrypt hashing.</li>
            <li><strong>Access controls:</strong> Firestore security rules enforce that users can only access their own data. Server-side API routes require authenticated JWT tokens.</li>
            <li><strong>Regular audits:</strong> We perform periodic security reviews of our codebase and infrastructure configurations.</li>
          </ul>
          <p className="mt-3">Despite our measures, no system is 100% impenetrable. If you suspect a security breach, please contact <a href="mailto:security@decodflow.com" className="text-indigo-600 hover:underline">security@decodflow.com</a> immediately.</p>
        </Section>

        {/* <Section icon={<ShieldCheck size={16} className="text-indigo-600" />} title="5. Your Rights (GDPR & Privacy Laws)" delay={0.25}>
          <p>Depending on your jurisdiction, you have the following rights regarding your personal data:</p>
          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            {[
              { right: 'Right to Access', desc: 'Request a copy of all data we hold about you.' },
              { right: 'Right to Rectification', desc: 'Correct inaccurate or incomplete personal data.' },
              { right: 'Right to Erasure', desc: 'Request deletion of your account and all associated data.' },
              { right: 'Right to Portability', desc: 'Export your data in a machine-readable format (JSON/CSV).' },
              { right: 'Right to Object', desc: 'Object to processing of your data for marketing purposes.' },
              { right: 'Right to Withdraw Consent', desc: 'Withdraw consent at any time without affecting prior processing.' },
            ].map(({ right, desc }) => (
              <div key={right} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="font-black text-slate-800 text-xs">{right}</p>
                <p className="text-slate-500 text-xs mt-1">{desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-4">To exercise any of these rights, email <a href="mailto:privacy@decodflow.com" className="text-indigo-600 hover:underline">privacy@decodflow.com</a>. We will respond within 30 days.</p>
        </Section> */}

        <Section icon={<RefreshCw size={16} className="text-indigo-600" />} title="5. Data Retention" delay={0.3}>
          <p>We retain your data for as long as your account is active or as needed to provide services. Specifically:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>Account data is retained for the lifetime of your account plus 90 days after deletion (for recovery purposes).</li>
            <li>Anonymised usage analytics may be retained indefinitely for service improvement.</li>
            <li>Backups are purged on a rolling 30-day schedule.</li>
          </ul>
        </Section>

        {/* <Section icon={<Globe size={16} className="text-indigo-600" />} title="6. International Data Transfers" delay={0.35}>
          <p>
            Our servers are hosted in the United States (Render, Firebase). By using our service, you consent to the transfer of your data to the US. We rely on Standard Contractual Clauses (SCCs) and Firebase's Data Processing Addendum to ensure GDPR-compliant transfers.
          </p>
        </Section> */}

        <Section icon={<Mail size={16} className="text-indigo-600" />} title="6. Cookies" delay={0.4}>
          <p>We use minimal cookies necessary for operation:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li><strong>Session cookies:</strong> Maintain your authenticated session (cleared on browser close).</li>
            <li><strong>Preference cookies:</strong> Store your UI preferences such as selected country or theme.</li>
          </ul>
          <p className="mt-2">We do not use advertising or tracking cookies. You may disable cookies in your browser settings, though this may impair platform functionality.</p>
        </Section>

        <Section icon={<Mail size={16} className="text-indigo-600" />} title="7. Contact Us" delay={0.45}>
          <p>For any privacy-related queries, data requests, or concerns:</p>
          <div className="mt-3 p-4 bg-slate-900 text-white rounded-2xl">
            <p className="font-black text-sm mb-1">CareerVision AI — Data Privacy Team</p>
            <p className="text-slate-300 text-xs">decodflow.com</p>
            <a href="mailto:privacy@decodflow.com" className="text-indigo-400 text-xs hover:text-indigo-300 font-bold">privacy@decodflow.com</a>
          </div>
        </Section>

        <div className="mt-8 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
          <p className="text-xs text-indigo-700 font-medium">
            <strong>Policy Updates:</strong> We may update this policy periodically. Material changes will be communicated via email or a prominent notice on the platform. Continued use of the service after changes constitutes acceptance.
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

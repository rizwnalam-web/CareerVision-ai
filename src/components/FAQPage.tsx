import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ChevronDown,
  HelpCircle,
  Zap,
  Globe,
  ShieldCheck,
  Brain,
  GraduationCap,
  Briefcase,
  Mic,
  FileText,
  Target,
  BarChart3,
  Users,
  Sparkles,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { ContactModal } from './ContactModal';

interface FAQPageProps {
  onBack: () => void;
  onStart: () => void;
}

interface FAQItem {
  q: string;
  a: React.ReactNode;
}

interface FAQCategory {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  items: FAQItem[];
}

const FAQ_CATEGORIES: FAQCategory[] = [
  {
    id: 'getting-started',
    label: 'Getting Started',
    icon: Sparkles,
    color: 'indigo',
    items: [
      {
        q: 'What is CareerVision AI?',
        a: (
          <>
            CareerVision AI is an AI-powered global career intelligence platform. It combines real-time labour market data from sources like O*NET and IPEDS with Google Gemini AI to generate personalised career roadmaps, skill gap analyses, institution recommendations, and interview preparation — all in one place.
          </>
        ),
      },
      {
        q: 'Who is CareerVision AI designed for?',
        a: (
          <ul className="list-disc pl-4 space-y-1.5 mt-1">
            <li><strong>Students</strong> (undergraduate / postgraduate) planning their first career move.</li>
            <li><strong>Early-career professionals</strong> (0–5 years) looking to specialise or pivot.</li>
            <li><strong>Mid-career professionals</strong> exploring international opportunities or promotions.</li>
            <li><strong>Career changers</strong> switching industries and needing a structured transition plan.</li>
            <li><strong>International job seekers</strong> navigating visa pathways and foreign job markets.</li>
          </ul>
        ),
      },
      {
        q: 'Is CareerVision AI free to use?',
        a: 'You can sign up and access core features — career roadmaps, skill gap analysis, top career listings, and global demand data — at no cost. Advanced features such as unlimited AI roadmap generation, deep interview simulation sessions, and priority data refresh are available on premium plans.',
      },
      {
        q: 'Do I need to install anything?',
        a: 'No. CareerVision AI is a fully web-based platform. It runs entirely in your browser — no downloads, no plugins, no app store installations required. It is optimised for desktop, tablet, and mobile.',
      },
      {
        q: 'How do I get started?',
        a: (
          <>
            Click <strong>"Sign Up"</strong> on the homepage. You will be guided through a short onboarding questionnaire (age, education level, career goals, preferred country). Spark.E — our AI assistant — then generates your first personalised roadmap in seconds.
          </>
        ),
      },
    ],
  },
  {
    id: 'career-intelligence',
    label: 'Career Intelligence & Roadmaps',
    icon: Brain,
    color: 'violet',
    items: [
      {
        q: 'How does the AI Career Roadmap work?',
        a: (
          <>
            When you select a career path, Spark.E generates a <strong>6-milestone roadmap</strong> tailored to your age, education, and target country. Each milestone includes a realistic age range, action-oriented title, a two-sentence description of what to do and why, and a list of 3–5 specific skills, certifications, or actions needed. Roadmaps are dynamically generated using live 2026 labour market data.
          </>
        ),
      },
      {
        q: 'How accurate is the career demand data?',
        a: 'Our data pipeline pulls from authoritative sources: O*NET (US Labour occupational data), IPEDS (US higher education), LinkedIn Labour Insights, and government statistics from 12 countries. Data is validated and refreshed on a rolling basis. AI-generated insights are clearly labelled as AI-generated forecasts, not official statistics.',
      },
      {
        q: 'What is the Global Demand Heatmap?',
        a: 'The Global Demand Heatmap visualises hiring intensity across 12 countries on an interactive map. It shows which regions have the highest demand for your chosen career, colour-coded by demand score, with salary ranges and growth percentages. You can filter by career category and target specific countries for a focused view.',
      },
      {
        q: 'Can I compare multiple career paths?',
        a: 'Yes. The Career Hub lets you browse and compare hundreds of career paths. Each card shows the demand score, average salary range, top hiring countries, required skills, and an AI-generated summary. You can pin favourites and generate full roadmaps for any path.',
      },
      {
        q: 'What are Career Milestones?',
        a: (
          <>
            Career Milestones break your overall roadmap into <strong>6 progressive checkpoints</strong> — each one a concrete stage in your journey from where you are today to your ultimate career goal. For example: "Age 22–24 · Foundation & Skill Assessment → Age 24–26 · First Role or Internship" and so on. You can mark milestones as complete to track your real-world progress. Milestones are cached so repeated loads are instant.
          </>
        ),
      },
    ],
  },
  {
    id: 'features',
    label: 'Features & Tools',
    icon: Zap,
    color: 'amber',
    items: [
      {
        q: 'What is Skill Gap Analysis?',
        a: (
          <>
            Skill Gap Analysis compares your current skill set against the top skills demanded for a specific career in your target country. Each skill is shown with a <strong>demand score (0–100%)</strong> and a status: <em>Owned</em>, <em>Partial</em>, or <em>Gap</em>. Spark.E also suggests specific courses, certifications, and resources to close each gap — including free options from Coursera, edX, and YouTube.
          </>
        ),
      },
      {
        q: 'How does Interview Hot Seat work?',
        a: (
          <>
            Interview Hot Seat is an AI-powered mock interview simulator tailored to your target role. Spark.E asks <strong>role-specific technical and behavioural questions</strong>, evaluates your answers in real time, and provides a score out of 100 with specific feedback on what was strong and what to improve. Sessions are saved so you can review your progress over time.
          </>
        ),
      },
      {
        q: 'What does the Job Matching feature do?',
        a: 'Job Matching analyses your profile — education, skills, experience, and target role — and surfaces the most relevant live job listings from global sources. Each match includes a compatibility score, salary estimate, required skills, and a direct link. You can also generate a tailored cover letter for any listing with one click.',
      },
      {
        q: 'What is the Resume Manager?',
        a: 'The Resume Manager lets you upload an existing resume (PDF or text) or build one from scratch using guided templates. The AI scores your resume against your target role, highlights weaknesses, and suggests improvements. You can maintain multiple resume versions for different target roles.',
      },
      {
        q: 'What is the Institution Comparator?',
        a: (
          <>
            The Institution Comparator recommends <strong>real universities and programmes</strong> matched to your career goal, target country, and budget. Spark.E evaluates tuition fees, entry requirements, programme duration, post-graduation employment rates, and location desirability. You can compare up to 3 institutions side by side and generate a cover letter for each application.
          </>
        ),
      },
      {
        q: 'What are Study Materials?',
        a: 'The Study Materials section provides AI-curated learning resources for your chosen career — textbooks, online courses, YouTube channels, certifications, and practice platforms. Resources are ranked by relevance, difficulty level, and cost (with free options always highlighted first).',
      },
      {
        q: 'What is the Dashboard Intelligence panel?',
        a: 'The Dashboard gives you a real-time overview of your career readiness: a Readiness Score (%), your Next Action, Sector Health Index, Salary Trajectory projection, and any recent global news relevant to your target field. Everything is personalised to your profile and updates as your data changes.',
      },
    ],
  },
  {
    id: 'global-visas',
    label: 'Global Careers & Visas',
    icon: Globe,
    color: 'emerald',
    items: [
      {
        q: 'Which countries does CareerVision AI cover?',
        a: (
          <ul className="list-disc pl-4 space-y-1 mt-1 columns-2">
            {['🇺🇸 United States', '🇬🇧 United Kingdom', '🇨🇦 Canada', '🇦🇺 Australia', '🇩🇪 Germany', '🇸🇬 Singapore', '🇦🇪 UAE (Dubai)', '🇮🇳 India', '🇳🇱 Netherlands', '🇫🇷 France', '🇯🇵 Japan', '🇸🇪 Sweden'].map(c => (
              <li key={c} className="text-xs">{c}</li>
            ))}
          </ul>
        ),
      },
      {
        q: 'Does CareerVision AI support visa pathway guidance?',
        a: (
          <>
            Yes. The Visa Details feature provides guidance on the most relevant visa routes for your target country and role — including <strong>H-1B (USA), Skilled Worker Visa (UK), Express Entry (Canada), Skilled Independent Visa (Australia), Blue Card (Germany)</strong>, and more. Each pathway includes eligibility criteria, estimated timelines, required documentation, and key tips.
          </>
        ),
      },
      {
        q: 'Can it help me find jobs that sponsor visas?',
        a: 'The Job Matching feature can be filtered to show only roles from companies with a track record of visa sponsorship in your target country. Each listing is annotated with sponsorship likelihood and links to the company\'s immigration history where available.',
      },
      {
        q: 'Is the salary data in local currency?',
        a: 'Yes. Salary ranges are displayed in the local currency of the selected country (USD, GBP, EUR, AUD, SGD, AED, INR, etc.) and are benchmarked against the most recent available national statistics for that role and location.',
      },
    ],
  },
  {
    id: 'use-cases',
    label: 'Use Cases',
    icon: Users,
    color: 'rose',
    items: [
      {
        q: 'I\'m a final-year university student. How can CareerVision AI help me?',
        a: (
          <ol className="list-decimal pl-4 space-y-1.5 mt-1">
            <li>Enter your degree and target country → get the <strong>top 10 in-demand careers</strong> for your profile.</li>
            <li>Pick a career → generate a <strong>6-milestone roadmap</strong> from graduation to senior level.</li>
            <li>Run a <strong>Skill Gap Analysis</strong> to identify exactly what to learn before graduation.</li>
            <li>Use the <strong>Institution Comparator</strong> if you're considering a postgraduate programme.</li>
            <li>Practice for job interviews using <strong>Interview Hot Seat</strong>.</li>
          </ol>
        ),
      },
      {
        q: 'I want to move abroad for work. How does this help?',
        a: (
          <>
            Select your target country in your profile. CareerVision AI will show you:
            <ul className="list-disc pl-4 space-y-1.5 mt-2">
              <li>The highest-demand roles in that country right now.</li>
              <li>Visa pathways available for your nationality and role.</li>
              <li>Institutions in that country offering relevant programmes.</li>
              <li>Job listings with visa sponsorship indicators.</li>
              <li>Salary benchmarks in local currency.</li>
            </ul>
          </>
        ),
      },
      {
        q: 'I\'m changing careers mid-life. Is CareerVision AI suitable?',
        a: 'Absolutely. During onboarding, enter your current age, existing skills, and the new career you\'re targeting. The roadmap will be calibrated to your starting point — not from age 22. Skill Gap Analysis will identify transferable skills you already own (reducing the gap) and clearly highlight what you need to acquire. The platform treats you as an adult learner, not a fresh graduate.',
      },
      {
        q: 'I\'m an employer / recruiter. Can I use this?',
        a: 'CareerVision AI is currently focused on individuals. However, if you\'re an HR professional or recruiter looking to understand talent pipelines, the Global Demand Heatmap and Career Intelligence features provide useful market context. Enterprise/team plans are on our roadmap — contact us at hello@decodflow.com.',
      },
    ],
  },
  {
    id: 'data-privacy',
    label: 'Data, Privacy & Security',
    icon: ShieldCheck,
    color: 'sky',
    items: [     
      {
        q: 'Does CareerVision AI sell my data?',
        a: 'Never. We do not sell, rent, or share your personal data with third-party advertisers or data brokers. Data is only shared with our infrastructure partners (Firebase, Gemini AI, Netlify, Render) strictly for the purpose of delivering the service. See our full Privacy Policy for details.',
      },
      {
        q: 'Is my resume data stored securely?',
        a: 'Resume data you upload or create is stored in your personal account, encrypted and isolated from other users. You can delete your resume data at any time from Account Settings. Deletion is permanent and takes effect immediately.',
      },
      {
        q: 'Can I delete my account and all my data?',
        a: 'Yes. Go to Account Settings → Delete Account. This will permanently remove your profile, roadmaps, resume, interview history, and all associated data. Per our Privacy Policy, data is purged from backups within 90 days of deletion.',
      },
    ],
  },
];

const COLOR_STYLES: Record<string, { tab: string; activeTab: string; badge: string; icon: string; dot: string }> = {
  indigo:  { tab: 'border-indigo-200 bg-indigo-50', activeTab: 'bg-indigo-600 text-white border-indigo-600', badge: 'bg-indigo-100 text-indigo-700', icon: 'text-indigo-600', dot: 'bg-indigo-500' },
  violet:  { tab: 'border-violet-200 bg-violet-50', activeTab: 'bg-violet-600 text-white border-violet-600', badge: 'bg-violet-100 text-violet-700', icon: 'text-violet-600', dot: 'bg-violet-500' },
  amber:   { tab: 'border-amber-200 bg-amber-50',   activeTab: 'bg-amber-500 text-white border-amber-500',   badge: 'bg-amber-100 text-amber-700',   icon: 'text-amber-600',  dot: 'bg-amber-500' },
  emerald: { tab: 'border-emerald-200 bg-emerald-50',activeTab: 'bg-emerald-600 text-white border-emerald-600',badge: 'bg-emerald-100 text-emerald-700',icon: 'text-emerald-600',dot: 'bg-emerald-500' },
  rose:    { tab: 'border-rose-200 bg-rose-50',     activeTab: 'bg-rose-600 text-white border-rose-600',     badge: 'bg-rose-100 text-rose-700',     icon: 'text-rose-600',   dot: 'bg-rose-500' },
  sky:     { tab: 'border-sky-200 bg-sky-50',       activeTab: 'bg-sky-600 text-white border-sky-600',       badge: 'bg-sky-100 text-sky-700',       icon: 'text-sky-600',    dot: 'bg-sky-500' },
};

const AccordionItem: React.FC<{ item: FAQItem; isOpen: boolean; onToggle: () => void; dot: string; id: string }> = ({ item, isOpen, onToggle, dot, id }) => (
  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
    <button
      onClick={onToggle}
      aria-expanded={isOpen}
      aria-controls={`faq-answer-${id}`}
      id={`faq-question-${id}`}
      className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-slate-50 transition-colors gap-4"
    >
      <div className="flex items-center gap-3">
        <span className={cn('w-2 h-2 rounded-full shrink-0', dot)} aria-hidden="true" />
        <span className="text-sm font-black text-slate-900">{item.q}</span>
      </div>
      <motion.span
        animate={{ rotate: isOpen ? 180 : 0 }}
        transition={{ duration: 0.2 }}
        className="shrink-0 text-slate-400"
        aria-hidden="true"
      >
        <ChevronDown size={18} />
      </motion.span>
    </button>
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          key="answer"
          id={`faq-answer-${id}`}
          role="region"
          aria-labelledby={`faq-question-${id}`}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="overflow-hidden"
        >
          <div className="px-6 pb-5 border-t border-slate-100">
            <div className="text-sm text-slate-500 font-medium leading-relaxed pt-4">
              {item.a}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

export const FAQPage: React.FC<FAQPageProps> = ({ onBack, onStart }) => {
  const [activeCategory, setActiveCategory] = useState('getting-started');
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const [contactOpen, setContactOpen] = useState(false);

  const category = FAQ_CATEGORIES.find(c => c.id === activeCategory) ?? FAQ_CATEGORIES[0];
  const styles = COLOR_STYLES[category.color];

  const totalQuestions = FAQ_CATEGORIES.reduce((acc, c) => acc + c.items.length, 0);

  return (
    <div className="min-h-screen bg-white font-sans">
      {contactOpen && <ContactModal onClose={() => setContactOpen(false)} />}
      {/* Header */}
      <div className="bg-slate-950 text-white py-16 px-8">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs font-black uppercase tracking-widest mb-8"
          >
            <ArrowLeft size={14} /> Back to Home
          </button>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center">
                  <HelpCircle size={24} className="text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-1">Help Centre</p>
                  <h1 className="text-3xl md:text-4xl font-black tracking-tight">Frequently Asked Questions</h1>
                </div>
              </div>
              <p className="text-slate-400 text-sm font-medium max-w-xl">
                Everything you need to know about CareerVision AI — features, use cases, data, and more.
              </p>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <div className="text-center">
                <p className="text-3xl font-black text-white">{totalQuestions}</p>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Questions</p>
              </div>
              <div className="w-px h-10 bg-slate-700" />
              <div className="text-center">
                <p className="text-3xl font-black text-white">{FAQ_CATEGORIES.length}</p>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Categories</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-5xl mx-auto px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Sidebar — category tabs */}
          <aside className="lg:w-64 shrink-0">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Browse by topic</p>
            <div className="space-y-2 lg:sticky lg:top-6">
              {FAQ_CATEGORIES.map(cat => {
                const Icon = cat.icon;
                const s = COLOR_STYLES[cat.color];
                const active = cat.id === activeCategory;
                return (
                  <button
                    key={cat.id}
                    onClick={() => { setActiveCategory(cat.id); setOpenIdx(0); }}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-all',
                      active ? s.activeTab : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                    )}
                  >
                    <Icon size={16} className={active ? 'text-white' : s.icon} />
                    <span className={cn('text-xs font-black', active ? 'text-white' : 'text-slate-700')}>
                      {cat.label}
                    </span>
                    <span className={cn(
                      'ml-auto text-[10px] font-black px-1.5 py-0.5 rounded-md',
                      active ? 'bg-white/20 text-white' : s.badge
                    )}>
                      {cat.items.length}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* CTA card */}
            <div className="mt-6 p-5 bg-slate-900 rounded-2xl">
              <p className="text-xs font-black text-white mb-2">Still have questions?</p>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-4">Our team is happy to help you navigate your career journey.</p>
              <button
                onClick={() => setContactOpen(true)}
                className="flex items-center justify-center gap-2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-2.5 rounded-xl hover:bg-indigo-500 transition-colors"
              >
                Contact Support
              </button>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {/* Category header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center', `bg-${category.color}-50 border border-${category.color}-100`)}>
                    <category.icon size={20} className={styles.icon} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900">{category.label}</h2>
                    <p className="text-[11px] text-slate-400 font-bold">{category.items.length} questions in this section</p>
                  </div>
                </div>

                {/* Accordion items */}
                <div className="space-y-3">
                  {category.items.map((item, i) => (
                    <AccordionItem
                      key={i}
                      id={`${activeCategory}-${i}`}
                      item={item}
                      isOpen={openIdx === i}
                      onToggle={() => setOpenIdx(openIdx === i ? null : i)}
                      dot={styles.dot}
                    />
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Bottom CTA */}
            <div className="mt-12 p-8 bg-slate-900 rounded-3xl text-white text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-4">
                <Sparkles size={22} className="text-white" />
              </div>
              <h3 className="text-xl font-black mb-2">Ready to map your career?</h3>
              <p className="text-slate-400 text-sm font-medium mb-6 max-w-sm mx-auto">
                Sign up free and get your personalised AI roadmap in under 2 minutes.
              </p>
              <button
                onClick={onStart}
                className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-900/50"
              >
                Get Started Free <ArrowLeft size={14} className="rotate-180" />
              </button>
            </div>
          </main>
        </div>
      </div>

      {/* Back button */}
      <div className="pb-12 flex justify-center">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 text-xs font-black uppercase tracking-widest transition-colors"
        >
          <ArrowLeft size={12} /> Back to CareerVision AI
        </button>
      </div>
    </div>
  );
};

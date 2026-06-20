import React, { useState, useRef, useEffect } from 'react';
import Logo from './Logo';
import { motion, AnimatePresence } from 'motion/react';
import { NewsFlash } from './NewsFlash';
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
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Brain,
  BarChart3,
  GraduationCap,
  Mic,
  Sparkles,
  Search,
  CircleDot,
  Star,
  Quote,
  Users,
  ChevronDown,
  CheckCircle2,
  ArrowRight,
  Building2,
  Lightbulb,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { getTopFeedbacks, Feedback } from '../services/feedbackService';
import { ContactModal } from './ContactModal';

interface LandingPageProps {
  onStart: () => void;
  onShowPrivacy?: () => void;
  onShowTerms?: () => void;
  onShowFaq?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart, onShowPrivacy, onShowTerms, onShowFaq }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-100 italic-selection">
      {contactOpen && <ContactModal onClose={() => setContactOpen(false)} />}
      <NewsFlash country="Global" />

      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 md:px-8 py-6 max-w-7xl mx-auto relative">
        <div className="flex items-center gap-2">
          <Logo size={40} className="shadow-lg rounded-xl" />
          <span className="text-2xl font-black tracking-tighter text-slate-900">CareerVision<span className="text-indigo-600 italic">AI</span></span>
        </div>
        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" style={{color:'#94a3b8',textDecoration:'none'}} className="text-xs font-bold uppercase tracking-widest hover:text-slate-900 transition-colors">Intelligence</a>
          <a href="#demo"     style={{color:'#94a3b8',textDecoration:'none'}} className="text-xs font-bold uppercase tracking-widest hover:text-slate-900 transition-colors">Demo</a>
          <a href="#roadmap"  style={{color:'#94a3b8',textDecoration:'none'}} className="text-xs font-bold uppercase tracking-widest hover:text-slate-900 transition-colors">Roadmaps</a>
          <a href="#global"   style={{color:'#94a3b8',textDecoration:'none'}} className="text-xs font-bold uppercase tracking-widest hover:text-slate-900 transition-colors">Global Demand</a>
          <button onClick={onShowFaq} style={{color:'#94a3b8',background:'none',border:'none',cursor:'pointer',padding:0}} className="text-xs font-bold uppercase tracking-widest hover:text-slate-900 transition-colors">FAQ</button>
          <button onClick={() => setContactOpen(true)} style={{color:'#94a3b8',background:'none',border:'none',cursor:'pointer',padding:0}} className="text-xs font-bold uppercase tracking-widest hover:text-slate-900 transition-colors">Contact</button>
          <button 
            onClick={onStart}
            className="bg-slate-900 text-white px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl hover:shadow-indigo-200"
          >
            Sign Up / Login
          </button>
        </div>
        {/* Mobile: Sign-up button + hamburger */}
        <div className="flex md:hidden items-center gap-3">
          <button
            onClick={onStart}
            className="bg-indigo-600 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg"
          >
            Sign Up
          </button>
          <button
            onClick={() => setMobileMenuOpen(v => !v)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 transition-colors"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen
              ? <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><line x1="2" y1="2" x2="16" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="16" y1="2" x2="2" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              : <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect y="3" width="18" height="1.8" rx="0.9" fill="currentColor"/><rect y="8.1" width="18" height="1.8" rx="0.9" fill="currentColor"/><rect y="13.2" width="18" height="1.8" rx="0.9" fill="currentColor"/></svg>
            }
          </button>
        </div>
        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 mx-4 mt-1 bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-200/60 py-3 z-50 md:hidden">
            {[
              { label: 'Intelligence', href: '#features' },
              { label: 'Demo', href: '#demo' },
              { label: 'Roadmaps', href: '#roadmap' },
              { label: 'Global Demand', href: '#global' },
            ].map(link => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                style={{ textDecoration: 'none' }}
              >
                {link.label}
              </a>
            ))}
            <button
              onClick={() => { setMobileMenuOpen(false); onShowFaq?.(); }}
              className="flex w-full items-center px-5 py-3 text-xs font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 transition-colors bg-transparent border-none cursor-pointer"
            >
              FAQ
            </button>
            <button
              onClick={() => { setMobileMenuOpen(false); setContactOpen(true); }}
              className="flex w-full items-center px-5 py-3 text-xs font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 transition-colors bg-transparent border-none cursor-pointer"
            >
              Contact
            </button>
          </div>
        )}
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
              Sign Up & Initialize <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
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

      {/* Stats Bar */}
      <StatsBar />

      {/* Product Demo Section */}
      <DemoSection onStart={onStart} />

      {/* How It Works */}
      <HowItWorksSection onStart={onStart} />

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* Feature Grid */}
      <section id="features" className="py-24 bg-slate-50">
        <div id="roadmap" className="absolute" style={{marginTop:'-80px',visibility:'hidden'}} />
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

      {/* FAQ Section */}
      <FAQSection onShowFaq={onShowFaq} />

      {/* CTA Footer */}
      <section id="global" className="py-24 bg-slate-900 text-white overflow-hidden relative">
        <div className="max-w-4xl mx-auto px-8 text-center relative z-10">
          <h2 className="text-5xl md:text-7xl font-black mb-8 leading-tight">Ready to map <br /> the unknown?</h2>
          <p className="text-lg text-slate-400 mb-12 max-w-xl mx-auto font-medium">
            Join the students securing the highest-demand positions of 2026. Data-driven, AI-validated, globally focused.
          </p>
          <button 
            onClick={onStart}
            className="inline-flex items-center gap-3 bg-white text-slate-900 px-10 py-5 rounded-2xl text-sm font-black uppercase tracking-[0.2em] hover:bg-indigo-500 hover:text-white transition-all shadow-2xl hover:shadow-indigo-500/50"
          >
            Start Your Registration <ChevronRight size={20} />
          </button>
        </div>
        
        {/* Decorative Background Pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:40px_40px]"></div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-white pt-16 pb-8 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <Logo size={36} className="rounded-xl shadow-lg" />
                <span className="text-lg font-black tracking-tight">CareerVision<span className="text-indigo-400 italic">AI</span></span>
              </div>
              <p className="text-slate-400 text-xs font-medium leading-relaxed max-w-[200px]">
                AI-powered global career intelligence for the next generation of professionals.
              </p>
            </div>
            {/* Product */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4">Product</p>
              <ul className="space-y-3">
                {['Intelligence', 'Demo', 'Roadmaps', 'Global Demand'].map(l => (
                  <li key={l}><a href={`#${l.toLowerCase().replace(' ', '')}`} className="text-xs text-slate-400 hover:text-white transition-colors font-medium" style={{textDecoration:'none'}}>{l}</a></li>
                ))}
              </ul>
            </div>
            {/* Company */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4">Company</p>
              <ul className="space-y-3">
                <li><a href="#" className="text-xs text-slate-400 hover:text-white transition-colors font-medium" style={{textDecoration:'none'}}>About</a></li>
                <li><a href="#" className="text-xs text-slate-400 hover:text-white transition-colors font-medium" style={{textDecoration:'none'}}>Blog</a></li>
                <li><a href="#" className="text-xs text-slate-400 hover:text-white transition-colors font-medium" style={{textDecoration:'none'}}>Careers</a></li>
                <li>
                  <button onClick={() => setContactOpen(true)} className="text-xs text-slate-400 hover:text-white transition-colors font-medium bg-transparent border-none cursor-pointer p-0">
                    Contact
                  </button>
                </li>
              </ul>
            </div>
            {/* Legal */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4">Legal</p>
              <ul className="space-y-3">
                <li>
                  <button onClick={onShowFaq} className="text-xs text-slate-400 hover:text-white transition-colors font-medium bg-transparent border-none cursor-pointer p-0">
                    FAQ / Help Centre
                  </button>
                </li>
                <li>
                  <button onClick={onShowPrivacy} className="text-xs text-slate-400 hover:text-white transition-colors font-medium bg-transparent border-none cursor-pointer p-0">
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button onClick={onShowTerms} className="text-xs text-slate-400 hover:text-white transition-colors font-medium bg-transparent border-none cursor-pointer p-0">
                    Terms &amp; Conditions
                  </button>
                </li>
                <li><a href="#" className="text-xs text-slate-400 hover:text-white transition-colors font-medium" style={{textDecoration:'none'}}>Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">© 2026 CareerVision AI · decodflow.com · All Rights Reserved</p>
            <div className="flex items-center gap-1 text-[10px] text-slate-600 font-bold uppercase tracking-widest">
              <ShieldCheck size={12} className="text-indigo-500" />
              <span>Data Secure · End-to-End Encrypted</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Stats Bar
// ─────────────────────────────────────────────────────────────────────────────
const STATS = [
  { value: '12,000+', label: 'Global Students', icon: Users },
  { value: '150+', label: 'Career Paths', icon: Target },
  { value: '12', label: 'Countries Tracked', icon: Globe },
  { value: '4,000+', label: 'Live Data Points', icon: BarChart3 },
];

const StatsBar = () => (
  <section className="border-y border-slate-100 bg-slate-50 py-10">
    <div className="max-w-7xl mx-auto px-8 grid grid-cols-2 md:grid-cols-4 gap-8">
      {STATS.map(({ value, label, icon: Icon }) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col items-center text-center gap-2"
        >
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-1">
            <Icon size={18} className="text-indigo-600" />
          </div>
          <span className="text-3xl font-black tracking-tighter text-slate-900">{value}</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
        </motion.div>
      ))}
    </div>
  </section>
);

// ─────────────────────────────────────────────────────────────────────────────
// How It Works
// ─────────────────────────────────────────────────────────────────────────────
const HOW_STEPS = [
  {
    step: '01',
    icon: Brain,
    color: 'indigo',
    title: 'Build Your Profile',
    desc: 'Tell us your background, goals, and preferred country. Takes less than 2 minutes.',
  },
  {
    step: '02',
    icon: Lightbulb,
    color: 'amber',
    title: 'AI Analyses Global Demand',
    desc: 'Spark.E cross-references 4,000+ live data points from O*NET, IPEDS, and job boards.',
  },
  {
    step: '03',
    icon: ArrowRight,
    color: 'emerald',
    title: 'Get Your Executable Roadmap',
    desc: 'Receive a personalised step-by-step career plan with institution recommendations, skill gaps, and salary projections.',
  },
];

const HowItWorksSection: React.FC<{ onStart: () => void }> = ({ onStart }) => (
  <section className="py-24 bg-white">
    <div className="max-w-7xl mx-auto px-8">
      <div className="text-center mb-16">
        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-4">Simple Process</p>
        <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
          From Zero to Roadmap <span className="text-indigo-600 italic">in Minutes.</span>
        </h2>
        <p className="text-slate-400 font-medium max-w-md mx-auto mt-4 text-sm">
          No career counsellor. No guesswork. Just AI-driven clarity.
        </p>
      </div>

      <div className="relative grid md:grid-cols-3 gap-8">
        {/* Connecting line on desktop */}
        <div className="hidden md:block absolute top-[3.5rem] left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px bg-gradient-to-r from-indigo-200 via-amber-200 to-emerald-200" />

        {HOW_STEPS.map(({ step, icon: Icon, color, title, desc }, i) => (
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15 }}
            className="flex flex-col items-center text-center"
          >
            <div className={cn(
              'relative w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg z-10',
              color === 'indigo' && 'bg-indigo-600',
              color === 'amber' && 'bg-amber-500',
              color === 'emerald' && 'bg-emerald-600',
            )}>
              <Icon size={24} className="text-white" />
              <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center text-[9px] font-black text-slate-700">{step}</span>
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-3">{title}</h3>
            <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-xs">{desc}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-14 text-center">
        <button
          onClick={onStart}
          className="inline-flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl hover:shadow-indigo-200 group"
        >
          Start for Free <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </button>
        <p className="mt-3 text-[10px] text-slate-400 font-bold uppercase tracking-widest">No credit card required</p>
      </div>
    </div>
  </section>
);

// ─────────────────────────────────────────────────────────────────────────────
// FAQ
// ─────────────────────────────────────────────────────────────────────────────
const FAQS = [
  {
    q: 'What is CareerVision AI?',
    a: 'CareerVision AI is an AI-powered platform that analyses global job market data to create personalised career roadmaps, skill gap analyses, and institution recommendations — all tailored to your goals, background, and target country.',
  },
  {
    q: 'Is my data safe and private?',
    a: 'Yes. All data is encrypted. We never sell your personal data to third parties. See our Privacy Policy for full details.',
  },
  {
    q: 'How accurate is the career data?',
    a: 'Our AI engine pulls daily updates from authoritative sources including O*NET, IPEDS, LinkedIn Labour Insights, and government labour statistics from 12 countries. Data is validated and refreshed every 24 hours.',
  },
  {
    q: 'Does it support international careers and migration?',
    a: 'Absolutely. We cover 12 countries — USA, UK, Canada, Australia, Germany, Singapore, UAE, India, and more — with visa pathway guidance (H-1B, Skilled Worker Visa, PR routes) integrated into each roadmap.',
  },
  {
    q: 'Is CareerVision AI free to use?',
    a: 'You can sign up and access core features for free. Premium features including advanced AI roadmaps, unlimited career comparisons, and interview simulation are available on our paid plans.',
  },
  {
    q: 'What AI technology powers the platform?',
    a: 'CareerVision AI is built on Google Gemini for natural language intelligence, combined with proprietary matching algorithms trained on millions of career data points. The AI assistant, Spark.E, handles all personalised recommendations.',
  },
];

const FAQSection = ({ onShowFaq }: { onShowFaq?: () => void }) => {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  // Show only first 4 questions as a teaser
  const preview = FAQS.slice(0, 4);
  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-3xl mx-auto px-8">
        <div className="text-center mb-14">
          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-4">FAQ</p>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">
            Common Questions <span className="text-indigo-600 italic">Answered.</span>
          </h2>
          <p className="text-slate-400 text-sm font-medium mt-3">Quick answers below — or browse our full Help Centre for all topics.</p>
        </div>
        <div className="space-y-3">
          {preview.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-slate-50 transition-colors"
              >
                <span className="text-sm font-black text-slate-900 pr-4">{item.q}</span>
                <motion.span
                  animate={{ rotate: openIdx === i ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="shrink-0 text-slate-400"
                >
                  <ChevronDown size={18} />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {openIdx === i && (
                  <motion.div
                    key="answer"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-5 border-t border-slate-100">
                      <p className="text-sm text-slate-500 font-medium leading-relaxed pt-4">{item.a}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* View All FAQs CTA */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-white border border-slate-200 rounded-3xl">
          <div>
            <p className="text-sm font-black text-slate-900">Still have questions?</p>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Browse 25+ answers across 6 categories in our full Help Centre.</p>
          </div>
          <button
            onClick={onShowFaq}
            className="shrink-0 flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg shadow-indigo-100 group"
          >
            View All FAQs <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Demo Section (existing)
// ─────────────────────────────────────────────────────────────────────────────
const DEMO_FEATURES = [
  {
    id: 'trajectories',
    icon: TrendingUp,
    label: 'Career Trajectories',
    color: 'indigo',
    timestamp: '0:08',
    desc: 'AI generates 10 top in-demand career paths for 2026, ranked by global market demand.',
    mockLines: ['AI & Machine Learning Engineer', 'Full-Stack Developer', 'Cybersecurity Analyst', 'Biotech Researcher'],
    badge: 'HIGH GROWTH',
    badgeColor: 'bg-slate-900 text-white',
  },
  {
    id: 'country',
    icon: Globe,
    label: 'Country Filter',
    color: 'emerald',
    timestamp: '0:34',
    desc: 'Filter top in-demand jobs by 12 key countries — USA, India, UAE, Germany, Singapore and more.',
    mockLines: ['🇮🇳 India — Software Engineer', '🇮🇳 India — Data Scientist', '🇮🇳 India — Cloud Architect'],
    badge: 'LIVE MARKET',
    badgeColor: 'bg-emerald-600 text-white',
  },
  {
    id: 'skill-gap',
    icon: Target,
    label: 'Skill Gap Analysis',
    color: 'purple',
    timestamp: '1:02',
    desc: 'Expand any career path to reveal your personalised AI skill gap analysis with demand scores.',
    mockLines: ['Python · 95% demand · Owned', 'MLOps · 88% demand · Gap', 'LLM Fine-tuning · 92% demand · Gap'],
    badge: 'AI POWERED',
    badgeColor: 'bg-indigo-600 text-white',
  },
  {
    id: 'institutions',
    icon: GraduationCap,
    label: 'AI Curated Programs',
    color: 'amber',
    timestamp: '1:28',
    desc: 'Spark.E recommends 3 real institutions tailored to your career goal, budget, and target country.',
    mockLines: ['MIT — AI & Robotics', 'NUS Singapore — Data Science', 'IIT Bombay — Computer Science'],
    badge: 'SPARK.E',
    badgeColor: 'bg-amber-500 text-white',
  },
  {
    id: 'interview',
    icon: Mic,
    label: 'Interview Hot Seat',
    color: 'rose',
    timestamp: '1:54',
    desc: 'AI-driven role-specific interview simulator with real-time feedback and scoring.',
    mockLines: ['"Tell me about a system you designed…"', '"How do you handle model drift?"', 'Score: 87/100 — Excellent'],
    badge: 'LIVE SESSION',
    badgeColor: 'bg-rose-600 text-white',
  },
  {
    id: 'dashboard',
    icon: BarChart3,
    label: 'Dashboard Intelligence',
    color: 'sky',
    timestamp: '2:20',
    desc: 'Real-time readiness score, next actions, sector health index, and salary trajectory — all AI-driven.',
    mockLines: ['Readiness · 78%', 'Sector: Tech — HOT 🔥', 'Salary Trajectory: +14% YoY'],
    badge: 'REAL-TIME',
    badgeColor: 'bg-sky-600 text-white',
  },
];

const colorMap: Record<string, { pill: string; glow: string; dot: string }> = {
  indigo: { pill: 'bg-indigo-50 border-indigo-200 text-indigo-700', glow: 'shadow-indigo-200', dot: 'bg-indigo-500' },
  emerald: { pill: 'bg-emerald-50 border-emerald-200 text-emerald-700', glow: 'shadow-emerald-200', dot: 'bg-emerald-500' },
  purple: { pill: 'bg-purple-50 border-purple-200 text-purple-700', glow: 'shadow-purple-200', dot: 'bg-purple-500' },
  amber: { pill: 'bg-amber-50 border-amber-200 text-amber-700', glow: 'shadow-amber-200', dot: 'bg-amber-500' },
  rose: { pill: 'bg-rose-50 border-rose-200 text-rose-700', glow: 'shadow-rose-200', dot: 'bg-rose-500' },
  sky: { pill: 'bg-sky-50 border-sky-200 text-sky-700', glow: 'shadow-sky-200', dot: 'bg-sky-500' },
};

const DemoSection: React.FC<{ onStart: () => void }> = ({ onStart }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [activeFeature, setActiveFeature] = useState(0);
  const [hasVideo, setHasVideo] = useState(false);

  // Cycle feature highlights every 4 s when video is not playing
  useEffect(() => {
    if (isPlaying) return;
    const t = setInterval(() => setActiveFeature(p => (p + 1) % DEMO_FEATURES.length), 4000);
    return () => clearInterval(t);
  }, [isPlaying]);

  const handlePlayPause = () => {
    const v = videoRef.current;
    if (!v || !hasVideo) return;
    if (isPlaying) { v.pause(); } else { v.play(); }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    setProgress((v.currentTime / v.duration) * 100);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v || !hasVideo) return;
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    v.currentTime = ((e.clientX - rect.left) / rect.width) * v.duration;
  };

  const feat = DEMO_FEATURES[activeFeature];
  const colors = colorMap[feat.color];

  return (
    <section id="demo" className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-8">

        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-4">Product Demo</p>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
            See CareerVision AI <span className="text-indigo-600 italic">in Action.</span>
          </h2>
          <p className="text-slate-400 font-medium max-w-lg mx-auto">
            Watch how AI maps your global career trajectory in seconds — from skill gaps to elite institutions.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">

          {/* Feature Tabs — left */}
          <div className="lg:col-span-4 space-y-2">
            {DEMO_FEATURES.map((f, i) => {
              const Icon = f.icon;
              const c = colorMap[f.color];
              const active = i === activeFeature;
              return (
                <button
                  key={f.id}
                  onClick={() => { setActiveFeature(i); if (videoRef.current && hasVideo) videoRef.current.currentTime = 0; }}
                  className={cn(
                    'w-full flex items-start gap-3 p-4 rounded-2xl border transition-all text-left',
                    active
                      ? `${c.pill} border-current shadow-lg ${c.glow}`
                      : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                  )}
                >
                  <div className={cn('mt-0.5 w-7 h-7 rounded-xl flex items-center justify-center shrink-0', active ? 'bg-white/80' : 'bg-slate-100')}>
                    <Icon size={14} className={active ? `text-${f.color}-600` : 'text-slate-500'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn('text-[10px] font-black uppercase tracking-widest', active ? '' : 'text-slate-700')}>{f.label}</p>
                      <span className="text-[8px] font-black text-slate-400 shrink-0">{f.timestamp}</span>
                    </div>
                    {active && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="text-[10px] mt-1 leading-relaxed font-medium"
                      >
                        {f.desc}
                      </motion.p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Video / Mock Player — right */}
          <div className="lg:col-span-8">
            <div className="relative rounded-[2.5rem] overflow-hidden border-2 border-slate-100 shadow-2xl bg-slate-900 aspect-video">

              {/* Video element — plays /demo.mp4 from public/ */}
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                src="/demo.mp4"
                muted={isMuted}
                playsInline
                poster="/demo-poster.jpg"
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setIsPlaying(false)}
                onLoadedMetadata={() => setHasVideo(true)}
                onError={() => {
                  console.warn('Video not found - showing mock UI. Add demo.mp4 to /public');
                  setHasVideo(false);
                }}
              />

              {/* Animated mock UI shown when no video file is present */}
              {!hasVideo && (
                <div className="absolute inset-0 flex flex-col">
                  {/* Mock top bar */}
                  <div className="flex items-center gap-2 px-6 py-4 bg-slate-800/80 border-b border-slate-700/50">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                      <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                    </div>
                    <div className="flex-1 mx-4 h-6 rounded-lg bg-slate-700/60 flex items-center px-3">
                      <span className="text-[9px] text-slate-400 font-mono">careervision.ai · dashboard</span>
                    </div>
                    <div className={cn('px-2 py-1 rounded-md text-[8px] font-black uppercase', feat.badgeColor)}>{feat.badge}</div>
                  </div>

                  {/* Mock content area */}
                  <div className="flex-1 p-6 flex flex-col justify-between">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={feat.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.35 }}
                        className="space-y-3"
                      >
                        <div className="flex items-center gap-2 mb-4">
                          <div className={cn('w-2 h-2 rounded-full', colors.dot)} />
                          <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">{feat.label}</span>
                        </div>
                        {feat.mockLines.map((line, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.12 }}
                            className="bg-slate-800/70 border border-slate-700/50 rounded-xl px-4 py-3 flex items-center justify-between"
                          >
                            <span className="text-[11px] font-bold text-white/80">{line}</span>
                            {i === 0 && <div className={cn('text-[8px] font-black px-2 py-0.5 rounded', feat.badgeColor)}>{feat.badge}</div>}
                          </motion.div>
                        ))}
                      </motion.div>
                    </AnimatePresence>

                    {/* Fake sparkline at bottom */}
                    <div className="flex items-end gap-1 h-10 opacity-30">
                      {[3,5,4,7,6,8,7,9,8,10,9,11].map((h, i) => (
                        <div key={i} className={cn('flex-1 rounded-t', colors.dot)} style={{ height: `${h * 9}%` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Play button overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  onClick={handlePlayPause}
                  className={cn(
                    'group flex items-center justify-center w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 hover:scale-110 transition-all shadow-2xl',
                    isPlaying && 'opacity-0 hover:opacity-100'
                  )}
                >
                  {isPlaying
                    ? <Pause size={24} className="text-white" />
                    : <Play size={24} className="text-white ml-1" />
                  }
                </button>
              </div>

              {/* Bottom controls bar */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-6 py-4">
                {/* Progress bar */}
                <div
                  className="w-full h-1 bg-white/20 rounded-full mb-3 cursor-pointer"
                  onClick={handleSeek}
                >
                  <div className="h-full bg-indigo-400 rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button onClick={handlePlayPause} className="text-white/80 hover:text-white transition-colors">
                      {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                    <button
                      onClick={() => { setIsMuted(!isMuted); if (videoRef.current) videoRef.current.muted = !isMuted; }}
                      className="text-white/60 hover:text-white transition-colors"
                    >
                      {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                    </button>
                    <span className="text-[9px] font-black text-white/50 uppercase tracking-widest">
                      {hasVideo ? 'CareerVision AI · Feature Demo' : 'Interactive Preview'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {!hasVideo && (
                      <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">
                        Drop demo.mp4 in /public to enable video
                      </span>
                    )}
                    <button
                      onClick={onStart}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all"
                    >
                      Try Live <ChevronRight size={10} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature count row */}
            <div className="flex items-center justify-between mt-5 px-2">
              <div className="flex gap-1.5">
                {DEMO_FEATURES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveFeature(i)}
                    className={cn('h-1.5 rounded-full transition-all', i === activeFeature ? 'w-6 bg-indigo-500' : 'w-1.5 bg-slate-200 hover:bg-slate-300')}
                  />
                ))}
              </div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{activeFeature + 1} of {DEMO_FEATURES.length} features</p>
            </div>
          </div>
        </div>
      </div>
    </section>
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

const TestimonialsSection = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);

  useEffect(() => {
    getTopFeedbacks().then(setFeedbacks).catch(console.error);
  }, []);

  if (feedbacks.length === 0) return null;

  return (
    <section className="py-24 bg-white border-y border-slate-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-8">
        <div className="text-center mb-16">
          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-4">Wall of Fame</p>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Verified <span className="text-indigo-600 italic">User Insights.</span></h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {feedbacks.map((fb, i) => (
            <motion.div 
              key={fb.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 relative group hover:bg-white hover:shadow-2xl hover:shadow-indigo-100 transition-all"
            >
              <Quote size={40} className="absolute top-6 right-6 text-indigo-100 group-hover:text-indigo-200 transition-colors" />
              
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, idx) => (
                  <Star 
                    key={idx} 
                    size={14} 
                    className={cn(idx < fb.rating ? "text-amber-400 fill-amber-400" : "text-slate-200")} 
                  />
                ))}
              </div>

              <p className="text-slate-600 font-medium leading-relaxed mb-8 italic">
                "{fb.comment}"
              </p>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black text-xs">
                  {fb.user_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900 uppercase tracking-widest">{fb.user_name}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Verified Pioneer</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

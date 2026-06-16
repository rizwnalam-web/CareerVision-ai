import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight, Mail, Lock, User, MapPin, DollarSign, BookOpen, Loader2, Target, Briefcase, GraduationCap, Globe, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { registerUser } from '../services/authService';

interface RegisterScreenProps {
  onBack?: () => void;
  onSuccess?: (user: any) => void;
}

const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Argentina","Armenia","Australia","Austria","Azerbaijan",
  "Bahrain","Bangladesh","Belarus","Belgium","Bolivia","Bosnia and Herzegovina","Brazil","Bulgaria",
  "Cambodia","Canada","Chile","China","Colombia","Croatia","Cuba","Cyprus","Czech Republic",
  "Denmark","Dominican Republic","Ecuador","Egypt","El Salvador","Estonia","Ethiopia",
  "Finland","France","Georgia","Germany","Ghana","Greece","Guatemala","Honduras","Hungary",
  "Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy","Jamaica","Japan",
  "Jordan","Kazakhstan","Kenya","Kuwait","Latvia","Lebanon","Libya","Lithuania","Luxembourg",
  "Malaysia","Malta","Mexico","Morocco","Mozambique","Myanmar","Nepal","Netherlands",
  "New Zealand","Nicaragua","Nigeria","Norway","Oman","Pakistan","Panama","Paraguay","Peru",
  "Philippines","Poland","Portugal","Qatar","Romania","Russia","Saudi Arabia","Senegal",
  "Serbia","Singapore","Slovakia","Slovenia","South Africa","South Korea","Spain","Sri Lanka",
  "Sweden","Switzerland","Taiwan","Tanzania","Thailand","Tunisia","Turkey","Uganda","Ukraine",
  "United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan","Venezuela",
  "Vietnam","Yemen","Zimbabwe"
];

const CAREER_FIELDS = [
  "Artificial Intelligence & Machine Learning",
  "Software Engineering & Development",
  "Data Science & Analytics",
  "Cybersecurity",
  "Cloud Computing & DevOps",
  "Business & Management",
  "Finance & Investment Banking",
  "Marketing & Digital Media",
  "Healthcare & Medicine",
  "Nursing & Allied Health",
  "Pharmacy & Biomedical Science",
  "Law & Legal Studies",
  "Architecture & Urban Planning",
  "Civil & Structural Engineering",
  "Mechanical & Aerospace Engineering",
  "Electrical & Electronics Engineering",
  "Environmental Science & Sustainability",
  "Design & Creative Arts",
  "Media & Journalism",
  "Education & Teaching",
  "Psychology & Social Work",
  "Economics & Public Policy",
  "Hospitality & Tourism",
  "Agriculture & Food Science",
  "Other"
];

const VISA_TYPES = [
  "Student Visa",
  "Work Visa / Work Permit",
  "Skilled Worker Visa",
  "Graduate / Post-Study Work Visa",
  "Entrepreneur / Startup Visa",
  "Family Reunification",
  "Permanent Residency",
  "Not sure yet"
];

const STEPS = [
  { label: "Account", icon: User },
  { label: "Background", icon: GraduationCap },
  { label: "Goals", icon: Target },
];

const inputClass = (hasError = false) => cn(
  "w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors",
  hasError ? "border-red-500/50" : "border-slate-700"
);

const labelClass = "text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-2 mb-2";

export const RegisterScreen = ({ onBack, onSuccess }: RegisterScreenProps) => {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    // Step 1 — Account
    email: '',
    name: '',
    password: '',
    confirmPassword: '',
    // Step 2 — Background
    age: '',
    homeCountry: '',
    education: '',
    gpa: '',
    // Step 3 — Goals
    targetCountry: '',
    careerField: '',
    budget: '',
    interests: '',
    targetVisaType: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    setGeneralError('');
  };

  const validateStep = (s: number): Record<string, string> => {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (!formData.email) e.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = 'Invalid email format';
      if (!formData.name.trim()) e.name = 'Full name is required';
      if (!formData.password) e.password = 'Password is required';
      else if (formData.password.length < 6) e.password = 'At least 6 characters required';
      if (formData.password !== formData.confirmPassword) e.confirmPassword = 'Passwords do not match';
    }
    if (s === 1) {
      if (!formData.homeCountry) e.homeCountry = 'Home country is required';
    }
    if (s === 2) {
      if (!formData.targetCountry) e.targetCountry = 'Target country is required';
    }
    return e;
  };

  const nextStep = () => {
    const e = validateStep(step);
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setErrors({});
    setStep(s => s + 1);
  };

  const prevStep = () => { setErrors({}); setStep(s => s - 1); };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const stepErrors = validateStep(2);
    if (Object.keys(stepErrors).length > 0) { setErrors(stepErrors); return; }

    setIsLoading(true);
    setGeneralError('');

    try {
      const interests = formData.interests ? formData.interests.split(',').map(i => i.trim()).filter(Boolean) : [];
      if (formData.careerField && formData.careerField !== 'Other') interests.unshift(formData.careerField);

      const result = await registerUser({
        email: formData.email,
        name: formData.name,
        password: formData.password,
        country: formData.homeCountry || undefined,
        targetLocation: formData.targetCountry || undefined,
        age: formData.age ? parseInt(formData.age) : undefined,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
        education: formData.education || undefined,
        gpa: formData.gpa ? parseFloat(formData.gpa) : undefined,
        targetVisaType: formData.targetVisaType || undefined,
        interests: interests.length > 0 ? interests : undefined,
      });

      setSuccess(true);
      if (onSuccess) onSuccess(result.user);
    } catch (error: any) {
      setGeneralError(error.message || 'Failed to register. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-slate-900/50 border border-slate-800 rounded-[3rem] p-12 backdrop-blur-xl text-center space-y-6"
        >
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
            <Check size={32} className="text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Welcome to CareerVision!</h2>
          <p className="text-slate-400">Account ready. Data will be personalised for <span className="text-emerald-400 font-semibold">{formData.targetCountry}</span>.</p>
          <button onClick={onBack} className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors">
            Go to Login
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500 rounded-full blur-[128px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl bg-slate-900/60 border border-slate-800 rounded-[2.5rem] p-8 backdrop-blur-xl relative z-10"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={step === 0 ? onBack : prevStep}
            className="text-slate-500 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-white">Create Account</h1>
            <p className="text-slate-400 text-sm">Join CareerVision to start your career journey</p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = i < step;
            const active = i === step;
            return (
              <React.Fragment key={i}>
                <div className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap",
                  done ? "bg-emerald-500/20 text-emerald-400" :
                  active ? "bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/40" :
                  "bg-slate-800 text-slate-500"
                )}>
                  {done ? <Check size={12} /> : <Icon size={12} />}
                  {s.label}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn("flex-1 h-px", done ? "bg-emerald-500/40" : "bg-slate-700")} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {generalError && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
          >
            {generalError}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {/* ── STEP 1: Account ── */}
            {step === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }} className="space-y-4">
                <div>
                  <label className={labelClass}><Mail size={13} />Email Address</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange}
                    placeholder="you@example.com" className={inputClass(!!errors.email)} />
                  {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label className={labelClass}><User size={13} />Full Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange}
                    placeholder="John Doe" className={inputClass(!!errors.name)} />
                  {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className={labelClass}><Lock size={13} />Password</label>
                  <input type="password" name="password" value={formData.password} onChange={handleChange}
                    placeholder="••••••••" className={inputClass(!!errors.password)} />
                  {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
                </div>
                <div>
                  <label className={labelClass}><Lock size={13} />Confirm Password</label>
                  <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                    placeholder="••••••••" className={inputClass(!!errors.confirmPassword)} />
                  {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
                </div>
              </motion.div>
            )}

            {/* ── STEP 2: Background ── */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }} className="space-y-4">
                <div>
                  <label className={labelClass}><MapPin size={13} />Home Country <span className="text-slate-500 font-normal normal-case tracking-normal">(where you currently live)</span></label>
                  <input type="text" name="homeCountry" value={formData.homeCountry} onChange={handleChange}
                    placeholder="Start typing…" list="home-countries" className={inputClass(!!errors.homeCountry)} autoComplete="off" />
                  <datalist id="home-countries">
                    {COUNTRIES.map(c => <option key={c} value={c} />)}
                  </datalist>
                  {errors.homeCountry && <p className="text-red-400 text-xs mt-1">{errors.homeCountry}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Age</label>
                    <input type="number" name="age" value={formData.age} onChange={handleChange}
                      placeholder="18" min="13" max="80" className={inputClass()} />
                  </div>
                  <div>
                    <label className={labelClass}><BookOpen size={13} />Education</label>
                    <select name="education" value={formData.education} onChange={handleChange} className={inputClass()}>
                      <option value="">Select…</option>
                      <option>Middle School</option>
                      <option>High School</option>
                      <option>Diploma / Vocational</option>
                      <option>Bachelor's Degree</option>
                      <option>Master's Degree</option>
                      <option>PhD / Doctorate</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelClass}><GraduationCap size={13} />GPA / Academic Score <span className="text-slate-500 font-normal normal-case tracking-normal">(optional)</span></label>
                  <input type="number" name="gpa" value={formData.gpa} onChange={handleChange}
                    placeholder="e.g. 3.8 or 85%" step="0.01" min="0" max="100" className={inputClass()} />
                </div>
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-300 text-xs leading-relaxed">
                  <Globe size={12} className="inline mr-1 mb-0.5" />
                  CareerVision uses your background to tailor career recommendations, institution matches, and scholarship eligibility.
                </div>
              </motion.div>
            )}

            {/* ── STEP 3: Goals ── */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }} className="space-y-4">
                <div>
                  <label className={labelClass}><Target size={13} />Target Country <span className="text-slate-500 font-normal normal-case tracking-normal">(study / work destination)</span></label>
                  <input type="text" name="targetCountry" value={formData.targetCountry} onChange={handleChange}
                    placeholder="e.g. Germany, Canada, Australia…" list="target-countries" className={inputClass(!!errors.targetCountry)} autoComplete="off" />
                  <datalist id="target-countries">
                    {COUNTRIES.map(c => <option key={c} value={c} />)}
                  </datalist>
                  {errors.targetCountry && <p className="text-red-400 text-xs mt-1">{errors.targetCountry}</p>}
                  <p className="text-slate-500 text-xs mt-1">Sets your default data region — you can search any country anytime inside the app.</p>
                </div>
                <div>
                  <label className={labelClass}><Briefcase size={13} />Career Field of Interest</label>
                  <select name="careerField" value={formData.careerField} onChange={handleChange} className={inputClass()}>
                    <option value="">Select a field…</option>
                    {CAREER_FIELDS.map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}><DollarSign size={13} />Annual Budget</label>
                    <input type="number" name="budget" value={formData.budget} onChange={handleChange}
                      placeholder="50000" min="0" className={inputClass()} />
                    <p className="text-slate-600 text-xs mt-1">USD / year</p>
                  </div>
                  <div>
                    <label className={labelClass}><Globe size={13} />Target Visa Type</label>
                    <select name="targetVisaType" value={formData.targetVisaType} onChange={handleChange} className={inputClass()}>
                      <option value="">Select…</option>
                      {VISA_TYPES.map(v => <option key={v}>{v}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Interests &amp; Skills <span className="text-slate-500 font-normal normal-case tracking-normal">(comma-separated)</span></label>
                  <textarea name="interests" value={formData.interests} onChange={handleChange} rows={2}
                    placeholder="e.g. Python, Machine Learning, Public Speaking"
                    className={cn(inputClass(), "resize-none")} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="pt-2">
            {step < STEPS.length - 1 ? (
              <button type="button" onClick={nextStep}
                className="w-full py-3 px-6 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl font-bold uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2"
              >
                Continue <ArrowRight size={16} />
              </button>
            ) : (
              <button type="submit" disabled={isLoading}
                className={cn(
                  "w-full py-3 px-6 rounded-xl font-bold uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2",
                  isLoading ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white"
                )}
              >
                {isLoading && <Loader2 size={18} className="animate-spin" />}
                {isLoading ? 'Creating Account…' : 'Create Account'}
              </button>
            )}
          </div>

          <p className="text-center text-slate-400 text-sm">
            Already have an account?{' '}
            <button type="button" onClick={onBack} className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
              Log in
            </button>
          </p>
        </form>
      </motion.div>
    </div>
  );
};

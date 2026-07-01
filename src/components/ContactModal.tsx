import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Mail,
  Phone,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MessageSquare,
  Globe,
  Clock,
} from 'lucide-react';

interface ContactModalProps {
  onClose: () => void;
}

type FormState = 'idle' | 'loading' | 'success' | 'error';

const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || 'support@careervision.ai';
const CONTACT_PHONE = import.meta.env.VITE_CONTACT_PHONE || '';
const APP_DOMAIN = import.meta.env.VITE_APP_DOMAIN || 'careervision.ai';

const SUBJECTS = [
  'General Enquiry',
  'Technical Support',
  'Feature Request',
  'Partnership / Business',
  'Billing / Account',
  'Report a Bug',
  'Other',
];

const API_BASE = (import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/+$|\/api$/, '');

export const ContactModal: React.FC<ContactModalProps> = ({ onClose }) => {
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [message, setMessage] = useState('');
  const [formState, setFormState] = useState<FormState>('idle');
  const [errorMsg, setErrorMsg]   = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    setFormState('loading');
    setErrorMsg('');

    try {
      const res = await fetch(`${API_BASE}/api/contact/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send message');
      setFormState('success');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setFormState('error');
    }
  };

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        aria-hidden="true"
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
      />

      {/* Modal */}
      <motion.div
        key="modal"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="contact-modal-title"
          className="w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden pointer-events-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-slate-900 px-8 py-6 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare size={18} className="text-indigo-400" />
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.25em]">Get in Touch</p>
              </div>
              <h2 id="contact-modal-title" className="text-2xl font-black text-white tracking-tight">Contact Us</h2>
              <p className="text-slate-400 text-sm font-medium mt-1">We typically reply within 1–2 business days.</p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close contact modal"
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-400 hover:text-white transition-colors shrink-0 mt-1"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid md:grid-cols-5 divide-x divide-slate-100">
            {/* Contact info sidebar */}
            <div className="md:col-span-2 bg-slate-50 p-6 space-y-5">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Direct Contact</p>
                <div className="space-y-3">
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="flex items-center gap-3 group"
                    style={{ textDecoration: 'none' }}
                  >
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 transition-colors">
                      <Mail size={15} className="text-indigo-600 group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</p>
                      <p className="text-xs font-bold text-slate-700 group-hover:text-indigo-600 transition-colors break-all">
                        {CONTACT_EMAIL}
                      </p>
                    </div>
                  </a>

                  <a
                    href={`tel:${CONTACT_PHONE}`}
                    className="flex items-center gap-3 group"
                    style={{ textDecoration: 'none' }}
                  >
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 transition-colors">
                      <Phone size={15} className="text-emerald-600 group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone</p>
                      <p className="text-xs font-bold text-slate-700 group-hover:text-emerald-600 transition-colors">
                        {CONTACT_PHONE}
                      </p>
                    </div>
                  </a>

                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                      <Globe size={15} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Website</p>
                      <p className="text-xs font-bold text-slate-700">https://{APP_DOMAIN}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={13} className="text-slate-400" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Response Time</p>
                </div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Mon–Fri, 9am–6pm EST<br />
                  We aim to reply within <strong className="text-slate-700">24 hours</strong>.
                </p>
              </div>

              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Technical Support</p>
                <p className="text-xs text-indigo-700 font-medium leading-relaxed">
                  For urgent technical issues, include your account email and a brief description of the problem.
                </p>
              </div>
            </div>

            {/* Form */}
            <div className="md:col-span-3 p-6">
              {formState === 'success' ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="h-full flex flex-col items-center justify-center text-center py-8 gap-4"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 size={32} className="text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 mb-2">Message Sent!</h3>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-xs mx-auto">
                      Thanks for reaching out. We've also sent a confirmation to your email. We'll reply within 1–2 business days.
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="mt-2 bg-slate-900 text-white px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-all"
                  >
                    Close
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                        Your Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Jane Smith"
                        required
                        maxLength={100}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                        Email Address <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        maxLength={200}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                      Subject
                    </label>
                    <select
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white"
                    >
                      {SUBJECTS.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                      Message <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      placeholder="Tell us how we can help you..."
                      required
                      maxLength={5000}
                      rows={5}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                    />
                    <p className="text-[10px] text-slate-300 font-medium text-right mt-1">{message.length}/5000</p>
                  </div>

                  {formState === 'error' && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl"
                    >
                      <AlertCircle size={15} className="text-rose-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-rose-700 font-medium">{errorMsg}</p>
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={formState === 'loading' || !name.trim() || !email.trim() || !message.trim()}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3.5 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-100"
                  >
                    {formState === 'loading' ? (
                      <><Loader2 size={16} className="animate-spin" /> Sending...</>
                    ) : (
                      <><Send size={16} /> Send Message</>
                    )}
                  </button>

                  <p className="text-[10px] text-slate-400 text-center font-medium">
                    By submitting, you agree to our{' '}
                    <span className="text-slate-600 font-bold">Privacy Policy</span>.
                    We never share your data.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

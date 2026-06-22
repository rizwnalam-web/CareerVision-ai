import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  User,
  Mail,
  MapPin,
  GraduationCap,
  DollarSign,
  Target,
  Star,
  Pencil,
  Save,
  Loader2,
  Check,
  Camera,
  Globe,
  Briefcase,
  Heart,
  Trophy,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { UserProfile } from '../types/career';
import { updateUserProfile } from '../services/authService';
import { FeedbackForm } from './FeedbackForm';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any; // Firebase user
  profile: UserProfile;
  onProfileUpdate: (updated: UserProfile) => void;
}

const INTEREST_OPTIONS = [
  'Coding', 'Robotics', 'AI/ML', 'Data Science', 'Cybersecurity', 'Cloud Computing',
  'Space', 'Biotech', 'Medicine', 'Finance', 'Law', 'Architecture', 'Design',
  'Marketing', 'Entrepreneurship', 'Education', 'Engineering', 'Research',
  'Gaming', 'Music', 'Art', 'Writing', 'Psychology', 'Environmental Science',
];

const COUNTRY_OPTIONS = [
  'USA', 'UK', 'Canada', 'Australia', 'Germany', 'France', 'Netherlands',
  'Singapore', 'Japan', 'UAE', 'India', 'Brazil', 'South Africa', 'Nigeria',
  'Kenya', 'New Zealand', 'Ireland', 'Sweden', 'Norway', 'Denmark',
];

const EDUCATION_OPTIONS = [
  'Middle School',
  'High School Freshman',
  'High School Sophomore',
  'High School Junior',
  'High School Senior',
  'Undergraduate (Year 1)',
  'Undergraduate (Year 2)',
  'Undergraduate (Year 3)',
  'Undergraduate (Year 4)',
  'Graduate Student',
  'PhD Student',
  'Working Professional',
  'Career Changer',
];

interface FieldSectionProps {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}

const FieldSection = ({ icon: Icon, label, children }: FieldSectionProps) => (
  <div className="space-y-1.5">
    <label className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
      <Icon size={9} />
      {label}
    </label>
    {children}
  </div>
);

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  profile,
  onProfileUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [draft, setDraft] = useState<UserProfile>(profile);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  // Sync draft when profile prop changes (external updates)
  React.useEffect(() => {
    if (!isEditing) {
      setDraft(profile);
    }
  }, [profile, isEditing]);

  const handleEdit = () => {
    setDraft(profile);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setDraft(profile);
    setIsEditing(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // user.id is the DB id for email/password users; user.profile?.id is a legacy fallback
      const userId = user?.id || user?.profile?.id;
      if (userId) {
        await updateUserProfile(userId, {
          name: draft.name,
          age: draft.age,
          education: draft.education,
          country: draft.country,
          targetLocation: draft.targetLocation,
          targetCareerId: draft.targetCareerId,
          budget: draft.budget,
          interests: Array.isArray(draft.interests) ? draft.interests : [],
          gpa: draft.academicPerformance?.gpa,
          achievements: draft.academicPerformance?.achievements?.join(', '),
        });
      }

      // Persist the updated fields into localStorage so the data survives a page refresh.
      try {
        const stored = localStorage.getItem('cv_local_user');
        if (stored) {
          const localUser = JSON.parse(stored);
          const merged = {
            ...localUser,
            name: draft.name,
            age: draft.age,
            education: draft.education,
            country: draft.country,
            targetLocation: draft.targetLocation,
            target_location: draft.targetLocation,
            targetCareerId: draft.targetCareerId || null,
            target_career_id: draft.targetCareerId || null,
            budget: draft.budget,
            interests: draft.interests,
            gpa: draft.academicPerformance?.gpa,
            achievements: draft.academicPerformance?.achievements?.join(', ') ?? '',
          };
          localStorage.setItem('cv_local_user', JSON.stringify(merged));
        }
      } catch {
        // localStorage write failure is non-critical
      }

      // Update React state
      onProfileUpdate(draft);
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Profile save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleInterest = (interest: string) => {
    setDraft(prev => {
      const current = Array.isArray(prev.interests) ? prev.interests : [];
      return {
        ...prev,
        interests: current.includes(interest)
          ? current.filter(i => i !== interest)
          : [...current, interest],
      };
    });
  };

  const authProvider = user?.providerData?.[0]?.providerId === 'google.com'
    ? 'Google'
    : 'Email';

  const completedCount = profile.completedMilestones?.length ?? 0;
  
  // 1. Force TypeScript to treat the runtime string accurately
const gpaRaw = profile.academicPerformance?.gpa as unknown as string;

// 2. Your original code will now work perfectly without any type errors or crashes
const gpaDisplay = gpaRaw != null && gpaRaw !== ''
    ? `${Number(gpaRaw).toFixed(1)} GPA`
    : 'Not set';




  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="profile-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal Panel */}
          <motion.div
            key="profile-panel"
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="profile-modal-title"
              className="pointer-events-auto w-full max-w-2xl max-h-[90vh] flex flex-col bg-white rounded-3xl shadow-2xl shadow-slate-300/50 overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative bg-gradient-to-br from-indigo-600 to-indigo-700 px-8 pt-8 pb-16">
                <button
                  onClick={onClose}
                  aria-label="Close profile modal"
                  className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <X size={15} />
                </button>

                <div className="flex items-start gap-5">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/30 shadow-xl bg-indigo-500 flex items-center justify-center">
                      {user?.photoURL ? (
                        <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User size={28} className="text-white" />
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h2 id="profile-modal-title" className="text-xl font-black text-white tracking-tight leading-none">
                      {profile.name}
                    </h2>
                    <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest mt-1">
                      {user?.email}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <span className="bg-white/10 border border-white/20 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
                        {authProvider} Account
                      </span>
                      <span className="bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
                        {completedCount} milestones
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats row */}
                <div className="absolute bottom-0 left-0 right-0 translate-y-1/2 px-8">
                  <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 grid grid-cols-3 divide-x divide-slate-100 py-3">
                    {[
                      { label: 'Budget', value: `$${(profile.budget ?? 0).toLocaleString()}` },
                      { label: 'Academic', value: gpaDisplay },
                      { label: 'Target', value: profile.targetLocation || 'Not set' },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex flex-col items-center gap-0.5 px-4">
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">{label}</span>
                        <span className="text-xs font-black text-slate-800 truncate">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto mt-10 px-8 pb-8 pt-4 space-y-8">
                {showFeedbackForm ? (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">
                        System Feedback
                      </h3>
                      <button 
                        onClick={() => setShowFeedbackForm(false)}
                        className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600"
                      >
                        Back to profile
                      </button>
                    </div>
                    <FeedbackForm 
                      profile={profile} 
                      userId={user?.id || user?.profile?.id} 
                      onClose={() => setShowFeedbackForm(false)} 
                    />
                  </div>
                ) : (
                  <>
                {/* Save success banner */}
                <AnimatePresence>
                  {saveSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-emerald-700 text-xs font-black"
                    >
                      <Check size={14} />
                      Profile saved successfully!
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action buttons */}
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Profile Details
                  </h3>
                  {!isEditing ? (
                    <button
                      onClick={handleEdit}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-[10px] font-black uppercase tracking-widest transition-colors"
                    >
                      <Pencil size={11} /> Edit Profile
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCancel}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-widest transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-60"
                      >
                        {isSaving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
                        {isSaving ? 'Saving…' : 'Save'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-5">
                  {/* Full Name */}
                  <FieldSection icon={User} label="Full Name">
                    {isEditing ? (
                      <input
                        type="text"
                        value={draft.name}
                        onChange={e => setDraft(p => ({ ...p, name: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      />
                    ) : (
                      <p className="text-sm font-bold text-slate-800">{profile.name}</p>
                    )}
                  </FieldSection>

                  {/* Age */}
                  <FieldSection icon={Star} label="Age">
                    {isEditing ? (
                      <input
                        type="number"
                        min={10}
                        max={80}
                        value={draft.age}
                        onChange={e => setDraft(p => ({ ...p, age: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      />
                    ) : (
                      <p className="text-sm font-bold text-slate-800">{profile.age} years old</p>
                    )}
                  </FieldSection>

                  {/* Education */}
                  <FieldSection icon={GraduationCap} label="Education Level">
                    {isEditing ? (
                      <select
                        value={draft.education}
                        onChange={e => setDraft(p => ({ ...p, education: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      >
                        {EDUCATION_OPTIONS.map(o => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-sm font-bold text-slate-800">{profile.education}</p>
                    )}
                  </FieldSection>

                  {/* Country */}
                  <FieldSection icon={Globe} label="Home Country">
                    {isEditing ? (
                      <select
                        value={draft.country}
                        onChange={e => setDraft(p => ({ ...p, country: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      >
                        {COUNTRY_OPTIONS.map(o => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                        <option value={draft.country}>{draft.country}</option>
                      </select>
                    ) : (
                      <p className="text-sm font-bold text-slate-800">{profile.country}</p>
                    )}
                  </FieldSection>

                  {/* Target Location */}
                  <FieldSection icon={MapPin} label="Target Location">
                    {isEditing ? (
                      <input
                        type="text"
                        placeholder="e.g. Germany, Singapore"
                        value={draft.targetLocation ?? ''}
                        onChange={e => setDraft(p => ({ ...p, targetLocation: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      />
                    ) : (
                      <p className="text-sm font-bold text-slate-800">{profile.targetLocation || '—'}</p>
                    )}
                  </FieldSection>

                  {/* Budget */}
                  <FieldSection icon={DollarSign} label="Annual Budget (USD)">
                    {isEditing ? (
                      <input
                        type="number"
                        min={0}
                        step={1000}
                        value={draft.budget}
                        onChange={e => setDraft(p => ({ ...p, budget: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      />
                    ) : (
                      <p className="text-sm font-bold text-slate-800">${(profile.budget ?? 0).toLocaleString()}</p>
                    )}
                  </FieldSection>

                  {/* GPA */}
                  <FieldSection icon={Trophy} label="GPA">
                    {isEditing ? (
                      <input
                        type="number"
                        min={0}
                        max={4}
                        step={0.1}
                        placeholder="0.0 – 4.0"
                        value={draft.academicPerformance?.gpa ?? ''}
                        onChange={e => {
                          const val = parseFloat(e.target.value);
                          setDraft(p => ({
                            ...p,
                            academicPerformance: {
                              ...(p.academicPerformance || { achievements: [] }),
                              gpa: isNaN(val) ? 0 : val,
                            },
                          }));
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      />
                    ) : (
                      <p className="text-sm font-bold text-slate-800">{gpaDisplay}</p>
                    )}
                  </FieldSection>

                  {/* Target Career */}
                  <FieldSection icon={Briefcase} label="Target Career ID">
                    <p className="text-sm font-bold text-slate-800">{profile.targetCareerId || '—'}</p>
                  </FieldSection>
                </div>

                {/* Achievements */}
                <FieldSection icon={Trophy} label="Achievements">
                  {isEditing ? (
                    <textarea
                      rows={2}
                      placeholder="e.g. Winner of Regional Robotics Hackathon, Dean's List"
                      value={(draft.academicPerformance?.achievements ?? []).join(', ')}
                      onChange={e => {
                        const vals = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                        setDraft(p => ({
                          ...p,
                          academicPerformance: {
                            ...(p.academicPerformance || { gpa: 0 }),
                            achievements: vals,
                          },
                        }));
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none"
                    />
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {(profile.academicPerformance?.achievements ?? []).length > 0 ? (
                        (profile.academicPerformance?.achievements ?? []).map((ach, i) => (
                          <span
                            key={i}
                            className="bg-amber-50 border border-amber-100 text-amber-700 text-[10px] font-bold px-2.5 py-1 rounded-lg"
                          >
                            {ach}
                          </span>
                        ))
                      ) : (
                        <p className="text-sm text-slate-400">No achievements added</p>
                      )}
                    </div>
                  )}
                </FieldSection>

                {/* Interests */}
                <FieldSection icon={Heart} label="Interests">
                  {isEditing ? (
                    <div className="flex flex-wrap gap-1.5">
                      {INTEREST_OPTIONS.map(interest => {
                        const selected = (Array.isArray(draft.interests) ? draft.interests : []).includes(interest);
                        return (
                          <button
                            key={interest}
                            type="button"
                            onClick={() => toggleInterest(interest)}
                            className={cn(
                              'px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors',
                              selected
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'
                            )}
                          >
                            {interest}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {(Array.isArray(profile.interests) ? profile.interests : []).length > 0 ? (
                        (Array.isArray(profile.interests) ? profile.interests : []).map((int, i) => (
                          <span
                            key={i}
                            className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold px-2.5 py-1 rounded-lg"
                          >
                            {int}
                          </span>
                        ))
                      ) : (
                        <p className="text-sm text-slate-400">No interests added</p>
                      )}
                    </div>
                  )}
                </FieldSection>

                <div className="pt-6 border-t border-slate-100">
                  <button 
                    onClick={() => setShowFeedbackForm(true)}
                    className="w-full py-4 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all flex items-center justify-center gap-3 group"
                  >
                    <MessageSquare size={18} className="group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Share Your Experience</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </>
      )}
    </AnimatePresence>
  );
};

export default UserProfileModal;

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  signInWithPopup, 
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, LogOut, Loader2, Sparkles, ShieldCheck, Globe, ArrowLeft, Mail, Lock, CheckCircle, TrendingUp, Brain, Target, Users } from 'lucide-react';
import { cn } from '../lib/utils';
import { loginUser, forgotPassword, resetPassword } from '../services/authService';

export interface AuthUser extends User {
  profile?: any;
}

export const AuthProvider = ({ children }: { children: (props: { user: AuthUser | null, loading: boolean }) => React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    // Track the last known UID so we can detect fresh logins vs page refreshes
    let lastKnownUid: string | null = sessionStorage.getItem('cv_firebase_uid');

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        // If UID changed (fresh login, not a refresh), reset to dashboard
        if (lastKnownUid !== firebaseUser.uid) {
          sessionStorage.removeItem('cv_activeView');
          sessionStorage.setItem('cv_firebase_uid', firebaseUser.uid);
          lastKnownUid = firebaseUser.uid;
        }
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        try {
          const userDoc = await getDoc(userDocRef);
          
          let profile = null;
          if (userDoc.exists()) {
            profile = userDoc.data();
          } else {
            // Initialize fresh profile
            profile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              interests: [],
              completedMilestones: [],
              budget: 0,
              country: 'USA'
            };
            await setDoc(userDocRef, profile);
          }
          
          setUser({ ...firebaseUser, profile });
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
        }
      } else {
        setUser(null);
        sessionStorage.removeItem('cv_firebase_uid');
        lastKnownUid = null;
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return <>{children({ user, loading })}</>;
};

export const LoginScreen = ({ onBack, onShowRegister, onLoginSuccess }: { onBack?: () => void; onShowRegister?: () => void; onLoginSuccess?: (user: any) => void }) => {
  const { t } = useTranslation();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authStage, setAuthStage] = useState<'initial' | 'emailLogin' | 'forgotPassword' | 'resetPassword'>('initial');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    setIsLoading(true);
    try {
      const response = await loginUser({ email, password });
      if (onLoginSuccess && response.user) {
        onLoginSuccess(response.user);
      }
      // On successful login, user data is returned
      // The component will be removed and main app will show
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Email is required');
      return;
    }

    setIsLoading(true);
    try {
      const response = await forgotPassword({ email: trimmedEmail });
      // In development the server returns the token directly as a fallback
      // when email delivery is unavailable (e.g. sandbox/SMTP restrictions)
      if (response.token) {
        setResetToken(response.token);
        setMessage((response as any).devNote
          ? `Dev mode: email unavailable. Token pre-filled below.`
          : (response.message || 'Token sent. Check your email.'));
      } else {
        setMessage(response.message || 'If an account exists for that email, a password reset token has been sent. Please check your inbox.');
      }
      setAuthStage('resetPassword');
    } catch (err: any) {
      setError(err.message || 'Failed to request password reset');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const trimmedToken = resetToken.trim();
    if (!trimmedToken) {
      setError('Reset token is required');
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError('Enter and confirm your new password');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      const trimmedToken = resetToken.trim();
      const response = await resetPassword({ token: trimmedToken, password: newPassword });
      setMessage(response.message || 'Password has been reset successfully.');
      setAuthStage('emailLogin');
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setResetToken('');
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  if (authStage === 'emailLogin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden" style={{ background: 'linear-gradient(to bottom right, #0a0c10, #1e1b4b, #0f172a)' }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/25 rounded-full blur-[140px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-[120px]" />
          <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:50px_50px]" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Card */}
          <div className="bg-white/[0.07] border border-white/[0.12] rounded-[2.5rem] p-8 md:p-10 backdrop-blur-2xl shadow-2xl shadow-black/50">
            <button 
              onClick={() => {
                setAuthStage('initial');
                setError('');
                setEmail('');
                setPassword('');
                setMessage('');
              }}
              className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1 hover:text-white transition-colors mb-7"
            >
              <ArrowLeft size={12} /> Back
            </button>

            {/* Header */}
            <div className="mb-7">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-indigo-900/50">
                <Mail size={20} className="text-white" />
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">{t('auth.signInTitle')}</h1>
              <p className="text-slate-400 text-sm mt-1">Sign in with your email and password to continue.</p>
            </div>

            {(error || message) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                id="auth-login-msg"
                role={error ? 'alert' : 'status'}
                aria-live={error ? 'assertive' : 'polite'}
                className={cn(
                  "mb-5 p-4 rounded-2xl text-sm border",
                  error ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                )}
              >
                {error || message}
              </motion.div>
            )}

            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label htmlFor="login-email" className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" aria-hidden="true" />
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    aria-required="true"
                    aria-invalid={!!error}
                    aria-describedby={error ? 'auth-login-msg' : undefined}
                    className="w-full pl-10 pr-4 py-3.5 bg-white/[0.08] border border-white/[0.15] rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:bg-white/10 transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="login-password" className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" aria-hidden="true" />
                  <input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    aria-required="true"
                    aria-invalid={!!error}
                    aria-describedby={error ? 'auth-login-msg' : undefined}
                    className="w-full pl-10 pr-4 py-3.5 bg-white/[0.08] border border-white/[0.15] rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:bg-white/10 transition-all text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setAuthStage('forgotPassword');
                    setError('');
                    setMessage('');
                  }}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold transition-colors"
                >
                  Forgot password?
                </button>
                <span className="text-[10px] text-slate-600 font-medium italic">Need help?</span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                aria-busy={isLoading}
                className={cn(
                  "w-full py-3.5 px-6 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-2 mt-2 shadow-xl",
                  isLoading
                    ? "bg-slate-700/60 text-slate-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-900/50"
                )}
              >
                {isLoading && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
                {isLoading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-center text-slate-500 text-sm">
                Don't have an account?{" "}
                <button
                  onClick={onShowRegister}
                  className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors"
                >
                  Create one here
                </button>
              </p>
            </div>

            {/* Trust indicators */}
            <div className="flex items-center justify-center gap-4 mt-5 flex-wrap">
              <span className="flex items-center gap-1 text-[9px] text-slate-600 font-bold uppercase tracking-widest">
                <ShieldCheck size={10} className="text-emerald-600" /> SSL Encrypted
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (authStage === 'forgotPassword') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden" style={{ background: 'linear-gradient(to bottom right, #0a0c10, #1e1b4b, #0f172a)' }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/25 rounded-full blur-[140px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-[120px]" />
          <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:50px_50px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md relative z-10"
        >
          <div className="bg-white/[0.07] border border-white/[0.12] rounded-[2.5rem] p-8 md:p-10 backdrop-blur-2xl shadow-2xl shadow-black/50">
            <button
              onClick={() => {
                setAuthStage('emailLogin');
                setError('');
                setMessage('');
              }}
              className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1 hover:text-white transition-colors mb-7"
            >
              <ArrowLeft size={12} /> Back to Login
            </button>

            <div className="mb-7">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-amber-900/40">
                <Mail size={20} className="text-white" />
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">Forgot Password</h1>
              <p className="text-slate-400 text-sm mt-1">Enter your account email and we'll send a reset token to your inbox.</p>
            </div>

            {(error || message) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "mb-5 p-4 rounded-2xl text-sm border",
                  error ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                )}
              >
                {error || message}
              </motion.div>
            )}

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Email Address</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full pl-10 pr-4 py-3.5 bg-white/[0.08] border border-white/[0.15] rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:bg-white/10 transition-all text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={cn(
                  "w-full py-3.5 px-6 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-2 shadow-xl",
                  isLoading
                    ? "bg-slate-700/60 text-slate-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-amber-900/40"
                )}
              >
                {isLoading && <Loader2 size={16} className="animate-spin" />}
                {isLoading ? "Requesting reset..." : "Request Reset Token"}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  if (authStage === 'resetPassword') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden" style={{ background: 'linear-gradient(to bottom right, #0a0c10, #1e1b4b, #0f172a)' }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/25 rounded-full blur-[140px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-[120px]" />
          <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:50px_50px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md relative z-10"
        >
          <div className="bg-white/[0.07] border border-white/[0.12] rounded-[2.5rem] p-8 md:p-10 backdrop-blur-2xl shadow-2xl shadow-black/50">
            <button
              onClick={() => {
                setAuthStage('emailLogin');
                setError('');
                setMessage('');
              }}
              className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1 hover:text-white transition-colors mb-7"
            >
              <ArrowLeft size={12} /> Back to Login
            </button>

            <div className="mb-7">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-emerald-900/40">
                <Lock size={20} className="text-white" />
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">Reset Password</h1>
              <p className="text-slate-400 text-sm mt-1">Check your email for the reset token, then enter it below with your new password.</p>
            </div>

            {(error || message) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "mb-5 p-4 rounded-2xl text-sm border",
                  error ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                )}
              >
                {error || message}
              </motion.div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Reset Token</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <input
                    type="text"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    placeholder="Paste your reset token"
                    className="w-full pl-10 pr-4 py-3.5 bg-white/[0.08] border border-white/[0.15] rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:bg-white/10 transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">New Password</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3.5 bg-white/[0.08] border border-white/[0.15] rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:bg-white/10 transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3.5 bg-white/[0.08] border border-white/[0.15] rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:bg-white/10 transition-all text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={cn(
                  "w-full py-3.5 px-6 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-2 shadow-xl",
                  isLoading
                    ? "bg-slate-700/60 text-slate-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/40"
                )}
              >
                {isLoading && <Loader2 size={16} className="animate-spin" />}
                {isLoading ? "Resetting password..." : "Reset Password"}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-stretch relative overflow-hidden" style={{ background: 'linear-gradient(to bottom right, #0a0c10, #1e1b4b, #0f172a)' }}>
      {/* Ambient background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 -right-20 w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-indigo-900/30 rounded-full blur-[100px]" />
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:50px_50px]" />
      </div>

      {/* ── Left panel — feature highlights (hidden on mobile) ── */}
      <div className="hidden lg:flex w-[480px] shrink-0 flex-col justify-between p-12 relative z-10">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-900/60">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <p className="text-white font-black tracking-tight text-lg leading-none">CareerVision<span className="text-indigo-400 italic">AI</span></p>
            <p className="text-[9px] text-indigo-400 uppercase tracking-widest font-bold">Global Career Intelligence</p>
          </div>
        </div>

        {/* Hero copy */}
        <div className="space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 rounded-full px-3 py-1.5 mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Live · 2026 Workforce Sync</span>
            </div>
            <h1 className="text-5xl font-black text-white leading-[0.95] tracking-tight mb-4">
              Your global<br /><span className="text-indigo-400 italic">career awaits.</span>
            </h1>
            <p className="text-slate-400 font-medium leading-relaxed">
              Join 12,000+ students and professionals using AI-powered career intelligence to navigate the future of work.
            </p>
          </div>

          {/* Feature bullets */}
          <div className="space-y-4">
            {[
              { icon: Brain, label: 'AI Career Roadmaps', desc: 'Personalised step-by-step career plans', color: 'text-indigo-400' },
              { icon: Target, label: 'Skill Gap Analysis', desc: 'Know exactly what you need to learn', color: 'text-violet-400' },
              { icon: TrendingUp, label: 'Live Market Data', desc: '4,000+ data points, refreshed daily', color: 'text-emerald-400' },
              { icon: Users, label: 'Interview Simulator', desc: 'AI mock interviews with real feedback', color: 'text-amber-400' },
              { icon: Globe, label: 'Global Mobility', desc: 'Visa pathways for 12 countries', color: 'text-teal-400' },
            ].map(({ icon: Icon, label, desc, color }) => (
              <div key={label} className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-white/[0.08] border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon size={14} className={color} />
                </div>
                <div>
                  <p className="text-[12px] font-black text-white">{label}</p>
                  <p className="text-[10px] text-slate-500 font-medium">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Social proof */}
          <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <img
                  key={i}
                  src={`https://picsum.photos/seed/auth${i}/60/60`}
                  className="w-8 h-8 rounded-full border-2 border-slate-800 object-cover"
                  alt=""
                  referrerPolicy="no-referrer"
                />
              ))}
            </div>
            <div>
              <p className="text-[11px] font-black text-white">12,000+ students joined</p>
              <div className="flex items-center gap-0.5 mt-0.5">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} width="9" height="9" viewBox="0 0 10 10" fill="currentColor" className="text-amber-400"><path d="M5 0l1.2 3.7H10L7 6l1.2 3.7L5 7.6 1.8 9.7 3 6 0 3.7h3.8z"/></svg>
                ))}
                <span className="text-[9px] text-slate-400 font-bold ml-1">4.9/5 rating</span>
              </div>
            </div>
          </div>
        </div>

        {/* Trust seals */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-bold uppercase tracking-widest">
            <ShieldCheck size={11} className="text-emerald-500" /> End-to-End Encrypted
          </div>
        </div>
      </div>

      {/* ── Right panel — auth card ── */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-10 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile brand header */}
          <div className="flex lg:hidden items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-xl">
              <Sparkles size={20} className="text-white" />
            </div>
            <p className="text-white font-black tracking-tight text-xl">CareerVision<span className="text-indigo-400 italic">AI</span></p>
          </div>

          {/* Card */}
          <div className="bg-white/[0.06] border border-white/[0.12] rounded-[2.5rem] p-8 md:p-10 backdrop-blur-2xl shadow-2xl shadow-black/40">
            {onBack && (
              <button 
                onClick={onBack}
                className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1 hover:text-white transition-colors mb-8"
              >
                <ArrowLeft size={12} /> Back
              </button>
            )}

            <div className="mb-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-[1.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-indigo-900/60 mb-5">
                <Sparkles size={32} className="text-white" />
              </div>
              <h1 className="text-3xl font-black text-white tracking-tighter">Welcome Back</h1>
              <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-[0.25em] mt-1">Spark.E · Career Intelligence</p>
            </div>

            {/* Feature badges */}
            <div className="grid grid-cols-2 gap-2.5 mb-8">
              <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 p-3 rounded-2xl">
                <ShieldCheck className="text-emerald-400 shrink-0" size={16} />
                <div>
                  <p className="text-[10px] font-black text-white">Secure Access</p>
                  <p className="text-[8px] text-slate-500 uppercase tracking-wider">Encrypted</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 p-3 rounded-2xl">
                <Globe className="text-blue-400 shrink-0" size={16} />
                <div>
                  <p className="text-[10px] font-black text-white">Cloud Sync</p>
                  <p className="text-[8px] text-slate-500 uppercase tracking-wider">Multi-device</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setAuthStage('emailLogin');
                  setError('');
                  setMessage('');
                }}
                className="w-full h-14 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-900/50 font-black uppercase tracking-widest text-[11px] group"
              >
                <Mail size={18} />
                Sign In with Email
              </button>

              <button
                onClick={onShowRegister}
                className="w-full h-14 bg-white/10 hover:bg-white/15 border border-white/20 hover:border-emerald-500/50 text-white rounded-2xl flex items-center justify-center gap-3 transition-all font-black uppercase tracking-widest text-[11px] group"
              >
                <Sparkles size={18} className="text-emerald-400" />
                Create Free Account
              </button>
            </div>

            <p className="mt-6 text-center text-[8px] text-slate-600 font-bold uppercase tracking-widest leading-relaxed">
              By continuing you agree to our Terms & Privacy Policy.<br/>
              Proprietary Spark.E Authentication · All sessions encrypted.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};


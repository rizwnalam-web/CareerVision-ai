import React, { useState } from 'react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, LogOut, Loader2, Sparkles, ShieldCheck, Globe, ArrowLeft, Mail, Lock } from 'lucide-react';
import { cn } from '../lib/utils';
import { loginUser } from '../services/authService';

export interface AuthUser extends User {
  profile?: any;
}

export const AuthProvider = ({ children }: { children: (props: { user: AuthUser | null, loading: boolean }) => React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
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
              name: firebaseUser.displayName || 'Anonymous Explorer',
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
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return <>{children({ user, loading })}</>;
};

export const LoginScreen = ({ onBack, onShowRegister, onLoginSuccess }: { onBack?: () => void; onShowRegister?: () => void; onLoginSuccess?: (user: any) => void }) => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [useEmailLogin, setUseEmailLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login Error:", error);
      alert("Failed to sign in. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

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

  if (useEmailLogin) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500 rounded-full blur-[128px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500 rounded-full blur-[128px]" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-slate-900/50 border border-slate-800 rounded-[3rem] p-12 backdrop-blur-xl relative z-10"
        >
          <button 
            onClick={() => {
              setUseEmailLogin(false);
              setError('');
              setEmail('');
              setPassword('');
            }}
            className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft size={12} /> Back
          </button>

          <div className="space-y-2 mb-8">
            <h1 className="text-2xl font-black text-white">Email Login</h1>
            <p className="text-slate-400">Sign in with your email and password</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="text-xs font-black text-slate-300 uppercase tracking-widest block mb-2">
                <Mail size={14} className="inline mr-2" />
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-black text-slate-300 uppercase tracking-widest block mb-2">
                <Lock size={14} className="inline mr-2" />
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "w-full py-3 px-6 rounded-xl font-bold uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2",
                isLoading
                  ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-700 hover:to-emerald-700 text-white"
              )}
            >
              {isLoading && <Loader2 size={18} className="animate-spin" />}
              {isLoading ? "Logging in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-center text-slate-400 text-sm">
              Don't have an account?{" "}
              <button
                onClick={onShowRegister}
                className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
              >
                Create one here
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500 rounded-full blur-[128px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-900/50 border border-slate-800 rounded-[3rem] p-12 backdrop-blur-xl relative z-10 text-center space-y-8"
      >
        {onBack && (
          <button 
            onClick={onBack}
            className="absolute top-8 left-8 text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1 hover:text-white transition-colors"
          >
            <ArrowLeft size={12} /> Back to Entry
          </button>
        )}
        <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-indigo-500/20 mb-8">
           <Sparkles size={40} className="text-white" />
        </div>

        <div className="space-y-2">
           <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase">Spark.E Login</h1>
           <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Trajectory Protocol Identity</p>
        </div>

        <div className="space-y-4">
           <div className="flex items-center gap-4 bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
              <ShieldCheck className="text-emerald-400" size={20} />
              <div className="text-left">
                 <p className="text-[10px] font-black text-white uppercase tracking-wider">Secure Access</p>
                 <p className="text-[8px] text-slate-500 font-bold uppercase">Encrypted Session Data</p>
              </div>
           </div>
           <div className="flex items-center gap-4 bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
              <Globe className="text-blue-400" size={20} />
              <div className="text-left">
                 <p className="text-[10px] font-black text-white uppercase tracking-wider">Cloud Sync</p>
                 <p className="text-[8px] text-slate-500 font-bold uppercase">Multi-Device Persistence</p>
              </div>
           </div>
        </div>

        <div className="space-y-3">
          <button 
            onClick={handleGoogleLogin}
            disabled={isLoggingIn}
            className="w-full h-16 bg-white hover:bg-slate-50 text-slate-900 rounded-2xl flex items-center justify-center gap-4 transition-all shadow-xl font-black uppercase tracking-tighter disabled:opacity-50"
          >
            {isLoggingIn ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <>
                <LogIn size={24} />
                Sign in with Google
              </>
            )}
          </button>

          <button
            onClick={() => setUseEmailLogin(true)}
            className="w-full h-16 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl flex items-center justify-center gap-4 transition-all shadow-xl font-black uppercase tracking-tighter"
          >
            <Mail size={24} />
            Sign in with Email
          </button>

          <button
            onClick={onShowRegister}
            className="w-full h-16 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl flex items-center justify-center gap-4 transition-all shadow-xl font-black uppercase tracking-tighter"
          >
            <Sparkles size={24} />
            Create Account
          </button>
        </div>

        <p className="text-[8px] text-slate-600 font-black uppercase tracking-widest leading-relaxed">
          Proprietary Spark.E Authentication Protocol.<br /> 
          Unauthorized trajectory access is strictly prohibited.
        </p>
      </motion.div>
    </div>
  );
};

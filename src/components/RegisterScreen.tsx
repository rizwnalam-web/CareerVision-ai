import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Mail, Lock, User, MapPin, DollarSign, BookOpen, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { registerUser } from '../services/authService';

interface RegisterScreenProps {
  onBack?: () => void;
  onSuccess?: (user: any) => void;
}

export const RegisterScreen = ({ onBack, onSuccess }: RegisterScreenProps) => {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    confirmPassword: '',
    country: '',
    age: '',
    budget: '',
    education: '',
    interests: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [success, setSuccess] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.name) {
      newErrors.name = 'Name is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    return newErrors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setGeneralError('');

    try {
      const interests = formData.interests ? formData.interests.split(',').map(i => i.trim()) : [];
      
      const result = await registerUser({
        email: formData.email,
        name: formData.name,
        password: formData.password,
        country: formData.country || undefined,
        age: formData.age ? parseInt(formData.age) : undefined,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
        education: formData.education || undefined,
        interests
      });

      setSuccess(true);
      if (onSuccess) {
        onSuccess(result.user);
      }
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
            <div className="w-8 h-8 bg-emerald-500 rounded-full animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-white">Welcome!</h2>
          <p className="text-slate-400">Your account has been created successfully. You can now log in.</p>
          <button
            onClick={onBack}
            className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors"
          >
            Back to Login
          </button>
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
        className="w-full max-w-2xl bg-slate-900/50 border border-slate-800 rounded-[3rem] p-8 backdrop-blur-xl relative z-10"
      >
        <div className="flex items-center gap-2 mb-8">
          {onBack && (
            <button
              onClick={onBack}
              className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1 hover:text-white transition-colors"
            >
              <ArrowLeft size={12} /> Back
            </button>
          )}
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-black text-white mb-2">Create Account</h1>
          <p className="text-slate-400">Join CareerVision to start your career journey</p>
        </div>

        {generalError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
          >
            {generalError}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="text-xs font-black text-slate-300 uppercase tracking-widest block mb-2">
              <Mail size={14} className="inline mr-2" />
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className={cn(
                "w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors",
                errors.email ? "border-red-500/50" : "border-slate-700"
              )}
            />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
          </div>

          {/* Name */}
          <div>
            <label className="text-xs font-black text-slate-300 uppercase tracking-widest block mb-2">
              <User size={14} className="inline mr-2" />
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              className={cn(
                "w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors",
                errors.name ? "border-red-500/50" : "border-slate-700"
              )}
            />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="text-xs font-black text-slate-300 uppercase tracking-widest block mb-2">
              <Lock size={14} className="inline mr-2" />
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••"
              className={cn(
                "w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors",
                errors.password ? "border-red-500/50" : "border-slate-700"
              )}
            />
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-xs font-black text-slate-300 uppercase tracking-widest block mb-2">
              <Lock size={14} className="inline mr-2" />
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••"
              className={cn(
                "w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors",
                errors.confirmPassword ? "border-red-500/50" : "border-slate-700"
              )}
            />
            {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
          </div>

          {/* Optional Fields - Grid Layout */}
          <div className="grid grid-cols-2 gap-4">
            {/* Age */}
            <div>
              <label className="text-xs font-black text-slate-300 uppercase tracking-widest block mb-2">
                Age
              </label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                placeholder="25"
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Country */}
            <div>
              <label className="text-xs font-black text-slate-300 uppercase tracking-widest block mb-2">
                <MapPin size={14} className="inline mr-2" />
                Country
              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder="USA"
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {/* Budget and Education - Grid Layout */}
          <div className="grid grid-cols-2 gap-4">
            {/* Budget */}
            <div>
              <label className="text-xs font-black text-slate-300 uppercase tracking-widest block mb-2">
                <DollarSign size={14} className="inline mr-2" />
                Budget
              </label>
              <input
                type="number"
                name="budget"
                value={formData.budget}
                onChange={handleChange}
                placeholder="50000"
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Education */}
            <div>
              <label className="text-xs font-black text-slate-300 uppercase tracking-widest block mb-2">
                <BookOpen size={14} className="inline mr-2" />
                Education Level
              </label>
              <select
                name="education"
                value={formData.education}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="">Select...</option>
                <option value="High School">High School</option>
                <option value="Bachelor">Bachelor's Degree</option>
                <option value="Master">Master's Degree</option>
                <option value="PhD">PhD</option>
              </select>
            </div>
          </div>

          {/* Interests */}
          <div>
            <label className="text-xs font-black text-slate-300 uppercase tracking-widest block mb-2">
              Interests (comma-separated)
            </label>
            <textarea
              name="interests"
              value={formData.interests}
              onChange={handleChange}
              placeholder="e.g., Software Development, Data Science, Design"
              rows={2}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
            />
          </div>

          {/* Submit Button */}
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
            {isLoading ? "Creating Account..." : "Create Account"}
          </button>

          {/* Login Link */}
          <p className="text-center text-slate-400 text-sm">
            Already have an account?{" "}
            <button
              type="button"
              onClick={onBack}
              className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
            >
              Log in here
            </button>
          </p>
        </form>
      </motion.div>
    </div>
  );
};

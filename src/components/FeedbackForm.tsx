import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Star, MessageSquare, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { submitFeedback } from '../services/feedbackService';
import { UserProfile } from '../types/career';

interface FeedbackFormProps {
  profile: UserProfile;
  userId?: string;
  onClose: () => void;
}

export const FeedbackForm: React.FC<FeedbackFormProps> = ({ profile, userId, onClose }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setIsSubmitting(true);
    try {
      await submitFeedback({
        userId,
        userName: profile.name,
        rating,
        comment
      });
      setSuccess(true);
      setTimeout(onClose, 2000);
    } catch (error) {
      console.error('Feedback submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
          <CheckCircle2 size={32} />
        </div>
        <h3 className="text-xl font-black text-slate-900">Thank You!</h3>
        <p className="text-sm text-slate-500 font-medium">Your feedback helps us improve the trajectory.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Star size={12} /> Rate your experience
        </label>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="transition-transform active:scale-90"
            >
              <Star
                size={24}
                fill={star <= rating ? "#F59E0B" : "transparent"}
                className={star <= rating ? "text-amber-500" : "text-slate-200"}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <MessageSquare size={12} /> Your Insights
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your thoughts on Spark.E and your career journey..."
          className="w-full h-32 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
          required
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !comment.trim()}
          className={cn(
            "flex-[2] py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-indigo-200 flex items-center justify-center gap-2",
            (isSubmitting || !comment.trim()) && "opacity-50 grayscale cursor-not-allowed"
          )}
        >
          {isSubmitting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Send size={16} />
          )}
          Submit Feedback
        </button>
      </div>
    </form>
  );
};
/**
 * CoachingHub — "AI Efficiency × Human Expertise"
 *
 * Four tabs:
 *   AI Match       — AI-powered mentor ranking tailored to the user's profile
 *   Book a Session — Premium coaching session catalogue with simulated booking
 *   Directory      — Full mentor roster with live search + industry filter
 *   Forum          — AI-seeded alumni Q&A threads with like / reply UX
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Star, Clock, MapPin, ChevronRight, CheckCircle2,
  Sparkles, MessageSquare, Calendar, Video, FileText,
  Briefcase, Award, ThumbsUp, Filter, Search, Lock,
  RefreshCw, ExternalLink, Send, Heart, ArrowRight,
  Zap, UserCheck, Globe, Crown, BookOpen, Mic,
} from "lucide-react";
import { cn } from "../lib/utils";
import type { UserProfile } from "../types/career";
import { getNetworkMentors } from "../services/geminiService";
import { ai } from "../lib/aiProxy";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Mentor {
  id: string;
  name: string;
  avatar: string;
  title: string;
  company: string;
  industry: string;
  expertise: string[];
  mentees: number;
  rating: number;
  reviews: number;
  responseTime: string;
  availability: "available" | "limited" | "full";
  bio: string;
  country: string;
  yearsExp: number;
  requested: boolean;
  linkedin: string;
  matchScore?: number;
  matchReason?: string;
}

interface SessionType {
  id: string;
  icon: React.ElementType;
  title: string;
  duration: number;
  price: number;
  priceLabel: string;
  description: string;
  isPremium: boolean;
  badge?: string;
}

interface ForumThread {
  id: string;
  category: string;
  title: string;
  author: string;
  authorInitials: string;
  authorRole: string;
  isExpert: boolean;
  body: string;
  likes: number;
  replies: ForumReply[];
  postedAt: string;
  tags: string[];
  liked: boolean;
}

interface ForumReply {
  id: string;
  author: string;
  authorInitials: string;
  isExpert: boolean;
  body: string;
  postedAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SESSION_TYPES: SessionType[] = [
  {
    id: "power",
    icon: Zap,
    title: "Power Session",
    duration: 30,
    price: 49,
    priceLabel: "$49",
    description: "A focused 30-minute sprint. Perfect for a specific challenge — interview prep, offer evaluation, or quick career guidance.",
    isPremium: false,
    badge: "Most Popular",
  },
  {
    id: "deep-dive",
    icon: BookOpen,
    title: "Deep Dive",
    duration: 60,
    price: 89,
    priceLabel: "$89",
    description: "A full hour to map your career trajectory, identify blockers, and build an actionable 90-day plan with an expert coach.",
    isPremium: true,
  },
  {
    id: "resume",
    icon: FileText,
    title: "Resume & LinkedIn Audit",
    duration: 45,
    price: 69,
    priceLabel: "$69",
    description: "Live critique of your resume and LinkedIn profile. Coach rewrites two sections live and shows you exactly how recruiters see you.",
    isPremium: false,
    badge: "High ROI",
  },
  {
    id: "mock-interview",
    icon: Mic,
    title: "Mock Interview",
    duration: 60,
    price: 99,
    priceLabel: "$99",
    description: "Real-time behavioural + technical mock interview with an industry practitioner. Detailed scorecard and recording provided.",
    isPremium: true,
    badge: "Conversion Booster",
  },
  {
    id: "strategy",
    icon: Crown,
    title: "Career Strategy",
    duration: 90,
    price: 149,
    priceLabel: "$149",
    description: "90-minute executive coaching engagement. Covers long-term vision, personal brand, compensation strategy, and leadership positioning.",
    isPremium: true,
  },
  {
    id: "mentor-match",
    icon: UserCheck,
    title: "AI Mentor Match",
    duration: 0,
    price: 0,
    priceLabel: "Free",
    description: "Let our AI match you with a mentor from our vetted network. First 20-minute intro call is always free.",
    isPremium: false,
    badge: "Free to start",
  },
];

const FORUM_CATEGORIES = [
  "All", "Interview Prep", "Salary & Offers", "Career Pivots", "Leadership", "Tech Careers", "Global Mobility",
];

const INDUSTRY_FILTERS = [
  "All Industries", "Technology", "Finance", "Healthcare", "Consulting", "Product", "Data & AI", "Marketing",
];

const AVAILABILITY_COLORS = {
  available: "text-emerald-600 bg-emerald-50 border-emerald-200",
  limited:   "text-amber-600  bg-amber-50  border-amber-200",
  full:      "text-slate-500  bg-slate-100 border-slate-200",
};

const AVAILABILITY_LABELS = {
  available: "Available",
  limited:   "Limited spots",
  full:      "Fully booked",
};

// ─── Match Score (client-side, deterministic) ─────────────────────────────────

function computeMatchScore(mentor: Mentor, profile: UserProfile): number {
  let score = 50;
  const career = (profile.targetCareer || profile.targetCareerId || "").toLowerCase();
  const industry = mentor.industry.toLowerCase();
  const expertise = mentor.expertise.map(e => e.toLowerCase()).join(" ");

  if (career && (industry.includes(career) || expertise.includes(career))) score += 20;
  if (profile.country && mentor.country.toLowerCase().includes(profile.country.toLowerCase())) score += 10;
  if (mentor.availability === "available") score += 10;
  if (mentor.rating >= 4.8) score += 5;
  if (mentor.yearsExp >= 10) score += 5;

  const profileSkills = (profile.skills || []).map(s => s.toLowerCase());
  const overlapCount = profileSkills.filter(s => expertise.includes(s)).length;
  score += Math.min(overlapCount * 5, 15);

  return Math.min(score, 99);
}

// ─── AI Forum Generation ───────────────────────────────────────────────────────

async function generateForumThreads(profile: UserProfile): Promise<ForumThread[]> {
  const career = profile.targetCareer || profile.targetCareerId || "technology";
  const country = profile.targetLocation || profile.country || "Global";

  const prompt = `Generate 6 career mentorship forum threads for a ${career} professional in ${country}. Return ONLY valid JSON array.

Each thread schema: {"id":"t-1","category":"Interview Prep","title":"Question title?","author":"Full Name","authorInitials":"FN","authorRole":"Senior X at Company","isExpert":true,"body":"2-3 sentence insightful post.","likes":N,"postedAt":"2h ago","tags":["tag1","tag2"],"replies":[{"id":"r-1","author":"Full Name","authorInitials":"FN","isExpert":false,"body":"1-2 sentence reply.","postedAt":"1h ago"}]}

Categories: Interview Prep, Salary & Offers, Career Pivots, Leadership, Tech Careers, Global Mobility. Mix isExpert: true for 3 threads. Include 1-2 replies each. liked: false for all.`;

  try {
    const raw = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { temperature: 0.8 },
    });
    const text: string = raw?.text ?? raw?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    if (!text || text.trim().length < 100) throw new Error("empty");
    const clean = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
    const parsed = JSON.parse(clean) as ForumThread[];
    return parsed.map(t => ({ ...t, liked: false }));
  } catch {
    return buildFallbackThreads(career);
  }
}

function buildFallbackThreads(career: string): ForumThread[] {
  return [
    {
      id: "t-1", category: "Interview Prep",
      title: `How do I answer "Tell me about yourself" without boring the interviewer?`,
      author: "Priya Sharma", authorInitials: "PS", authorRole: `Senior ${career} Consultant`,
      isExpert: true, likes: 47, postedAt: "2h ago", tags: ["Interview", "Behavioural"], liked: false,
      body: `After 200+ mock interviews, the secret is this: lead with your 'north star' — the one outcome you're driving toward — then walk backwards. Skip the LinkedIn summary read-aloud. Recruiters want narrative, not chronology.`,
      replies: [
        { id: "r-1", author: "James Okafor", authorInitials: "JO", isExpert: false, body: "This framing completely changed how I open interviews. Landed a FAANG offer last week!", postedAt: "1h ago" },
      ],
    },
    {
      id: "t-2", category: "Salary & Offers",
      title: "Got two competing offers — how do I leverage without losing both?",
      author: "Marcus Chen", authorInitials: "MC", authorRole: "Career Strategist at Top Consulting Firm",
      isExpert: true, likes: 93, postedAt: "5h ago", tags: ["Negotiation", "Offers"], liked: false,
      body: `The golden rule: never reveal the competing number first. Say 'I have another offer I'm evaluating seriously' and let them ask. Once they ask, anchor high. Most candidates leave 15–20% on the table by going first.`,
      replies: [
        { id: "r-1", author: "Sofia Reyes", authorInitials: "SR", isExpert: false, body: "Followed this advice and got a $22k increase over the initial offer. Do NOT sleep on this.", postedAt: "3h ago" },
        { id: "r-2", author: "Anik Das", authorInitials: "AD", isExpert: false, body: "Is this different for startups vs big tech?", postedAt: "2h ago" },
      ],
    },
    {
      id: "t-3", category: "Career Pivots",
      title: `Pivoting from ${career} into AI/ML — realistic in 12 months?`,
      author: "Fatima Al-Rashid", authorInitials: "FA", authorRole: "AI Engineer, ex-Google",
      isExpert: true, likes: 128, postedAt: "1d ago", tags: ["AI", "Reskilling", "Pivot"], liked: false,
      body: `Yes — if you're strategic. Skip the full ML degree. Instead: Andrew Ng's ML Spec → fast.ai → build 3 portfolio projects → contribute to one open-source repo. That's the path that gets interviews in under a year. The degree is a 4-year detour most people don't need.`,
      replies: [
        { id: "r-1", author: "Tom Williams", authorInitials: "TW", isExpert: false, body: "Made this pivot in 10 months. The fast.ai course was genuinely the inflection point.", postedAt: "18h ago" },
      ],
    },
    {
      id: "t-4", category: "Leadership",
      title: "How do I transition from individual contributor to team lead without formal authority?",
      author: "Kenji Tanaka", authorInitials: "KT", authorRole: "Engineering Director",
      isExpert: false, likes: 61, postedAt: "2d ago", tags: ["Leadership", "Management"], liked: false,
      body: `Start by volunteering to run the next sprint retro or lead the quarterly planning doc. Leadership is a behaviour before it's a title. Make yourself the 'connector' — the person who synthesises decisions and surfaces blockers for others.`,
      replies: [
        { id: "r-1", author: "Linh Pham", authorInitials: "LP", isExpert: false, body: "The 'connector' framing is spot on. I got promoted 6 months after adopting this approach.", postedAt: "1d ago" },
      ],
    },
    {
      id: "t-5", category: "Global Mobility",
      title: "H-1B alternatives for ${career} professionals wanting to work in the US?",
      author: "Elena Popescu", authorInitials: "EP", authorRole: "Immigration Specialist & Career Coach",
      isExpert: true, likes: 215, postedAt: "3d ago", tags: ["Visa", "US", "Global"], liked: false,
      body: `O-1A (extraordinary ability) is the most underrated path. With 3+ years of experience, publications/patents, or conference talks, you're often eligible. Unlike H-1B it's not a lottery. Also consider TN (for Canadians/Mexicans) or company internal transfers on L-1.`,
      replies: [
        { id: "r-1", author: "Raj Mehta", authorInitials: "RM", isExpert: false, body: "Got my O-1A approved in 90 days. This advice is accurate — more people should consider it.", postedAt: "2d ago" },
      ],
    },
    {
      id: "t-6", category: "Tech Careers",
      title: "Is it worth staying at a stable big-tech job or joining an early-stage startup right now?",
      author: "Nadia Volkov", authorInitials: "NV", authorRole: "3x Startup Founder & Angel Investor",
      isExpert: false, likes: 74, postedAt: "4d ago", tags: ["Startup", "BigTech", "Risk"], liked: false,
      body: `The math changed post-2023. Startup equity is worth less today due to valuation compression. Unless you're joining pre-seed with a meaningful equity stake (> 0.5%), the big-tech RSU path wins on expected value. Startups win on learning velocity and career optionality — but that's personal ROI, not financial ROI.`,
      replies: [],
    },
  ];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MentorCard({
  mentor,
  showMatch,
  onRequest,
}: {
  mentor: Mentor;
  showMatch: boolean;
  onRequest: (id: string) => void;
}) {
  const avail = AVAILABILITY_COLORS[mentor.availability];
  const availLabel = AVAILABILITY_LABELS[mentor.availability];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-100 p-5 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50/60 transition-all group"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-200">
            {mentor.avatar || mentor.name.slice(0, 2).toUpperCase()}
          </div>
          {mentor.availability === "available" && (
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <h3 className="text-sm font-black text-slate-800 group-hover:text-indigo-700 transition-colors">{mentor.name}</h3>
              <p className="text-[11px] text-slate-500 font-medium">{mentor.title} · {mentor.company}</p>
            </div>
            {showMatch && mentor.matchScore && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-600 text-white text-[10px] font-black">
                <Sparkles size={9} />
                {mentor.matchScore}% match
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold">
              <Star size={10} fill="currentColor" />
              {mentor.rating} ({mentor.reviews})
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
              <MapPin size={9} />
              {mentor.country}
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
              <Users size={9} />
              {mentor.mentees} mentees
            </div>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", avail)}>
              {availLabel}
            </span>
          </div>

          {/* Expertise chips */}
          <div className="flex gap-1.5 mt-2.5 flex-wrap">
            {mentor.expertise.slice(0, 4).map(skill => (
              <span key={skill} className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                {skill}
              </span>
            ))}
          </div>

          <p className="text-[11px] text-slate-500 mt-2.5 leading-relaxed line-clamp-2">{mentor.bio}</p>

          {showMatch && mentor.matchReason && (
            <div className="flex items-start gap-1.5 mt-2.5 p-2 rounded-xl bg-indigo-50 border border-indigo-100">
              <Sparkles size={10} className="text-indigo-400 mt-0.5 shrink-0" />
              <p className="text-[10px] text-indigo-700 font-medium leading-snug">{mentor.matchReason}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={() => onRequest(mentor.id)}
              disabled={mentor.availability === "full" || mentor.requested}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all",
                mentor.requested
                  ? "bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default"
                  : mentor.availability === "full"
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-200"
              )}
            >
              {mentor.requested ? <><CheckCircle2 size={11} />Requested</> : <><MessageSquare size={11} />Connect</>}
            </button>
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
              <Clock size={10} />
              Responds {mentor.responseTime}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function BookingModal({ session, onClose, onConfirm }: { session: SessionType; onClose: () => void; onConfirm: () => void }) {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const mockSlots = [
    "Today 2:00 PM", "Today 4:30 PM", "Tomorrow 10:00 AM",
    "Tomorrow 1:00 PM", "Thu 9:00 AM", "Thu 3:00 PM",
  ];

  const handleConfirm = () => {
    if (!selectedSlot) return;
    setConfirmed(true);
    setTimeout(() => { onConfirm(); }, 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="bg-white rounded-3xl shadow-2xl shadow-slate-300/40 max-w-md w-full overflow-hidden"
      >
        {confirmed ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} className="text-emerald-500" />
            </div>
            <h3 className="text-xl font-black text-slate-800">Session Confirmed!</h3>
            <p className="text-sm text-slate-500">Your <span className="font-bold text-slate-700">{session.title}</span> at <span className="font-bold text-slate-700">{selectedSlot}</span> is booked. A calendar invite has been sent to your email.</p>
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-6 text-white">
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-1">Book Session</p>
              <h3 className="text-xl font-black">{session.title}</h3>
              <div className="flex items-center gap-4 mt-2 text-sm text-indigo-100">
                <span className="flex items-center gap-1"><Clock size={13} />{session.duration} min</span>
                <span className="font-black text-white">{session.priceLabel}</span>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">Pick a time slot</p>
                <div className="grid grid-cols-2 gap-2">
                  {mockSlots.map(slot => (
                    <button
                      key={slot}
                      onClick={() => setSelectedSlot(slot)}
                      className={cn(
                        "px-3 py-2.5 rounded-xl text-xs font-bold transition-all border",
                        selectedSlot === slot
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-300"
                      )}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
                <Lock size={12} className="text-amber-500 mt-0.5 shrink-0" />
                <p className="text-[11px] text-amber-700 font-medium leading-snug">Secure checkout via Stripe. Cancel up to 24 hours in advance for a full refund.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-500 hover:bg-slate-50">
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!selectedSlot}
                  className="flex-1 py-3 rounded-xl bg-indigo-600 text-white text-sm font-black disabled:opacity-40 hover:bg-indigo-500 transition-all shadow-md shadow-indigo-200"
                >
                  Confirm — {session.priceLabel}
                </button>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

function ThreadCard({ thread, onLike, onExpand }: { thread: ForumThread; onLike: (id: string) => void; onExpand: (id: string) => void }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 hover:border-indigo-100 hover:shadow-md hover:shadow-indigo-50/40 transition-all">
      <div className="flex items-start gap-3">
        <div className={cn(
          "shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm text-white",
          thread.isExpert ? "bg-gradient-to-br from-indigo-500 to-purple-600" : "bg-slate-400"
        )}>
          {thread.authorInitials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-black text-slate-800">{thread.author}</span>
            {thread.isExpert && (
              <span className="inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-200">
                <Award size={8} />Expert
              </span>
            )}
            <span className="text-[10px] text-slate-400 font-medium">{thread.postedAt}</span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">{thread.authorRole}</p>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 shrink-0">{thread.category}</span>
      </div>

      <button onClick={() => onExpand(thread.id)} className="text-left mt-3 w-full">
        <h3 className="text-sm font-black text-slate-800 hover:text-indigo-700 transition-colors leading-snug">{thread.title}</h3>
      </button>
      <p className="text-[12px] text-slate-500 mt-2 leading-relaxed line-clamp-3">{thread.body}</p>

      <div className="flex gap-1.5 mt-3 flex-wrap">
        {thread.tags.map(tag => (
          <span key={tag} className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">#{tag}</span>
        ))}
      </div>

      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-50">
        <button
          onClick={() => onLike(thread.id)}
          className={cn("flex items-center gap-1.5 text-[11px] font-bold transition-colors", thread.liked ? "text-rose-500" : "text-slate-400 hover:text-rose-400")}
        >
          <Heart size={12} fill={thread.liked ? "currentColor" : "none"} />
          {thread.likes + (thread.liked ? 1 : 0)}
        </button>
        <button onClick={() => onExpand(thread.id)} className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-indigo-500 transition-colors">
          <MessageSquare size={12} />
          {thread.replies.length} {thread.replies.length === 1 ? "reply" : "replies"}
        </button>
        <div className="flex-1" />
        <button onClick={() => onExpand(thread.id)} className="text-[10px] font-black text-indigo-500 hover:text-indigo-700 transition-colors uppercase tracking-widest">
          Read more →
        </button>
      </div>
    </div>
  );
}

function ThreadModal({ thread, onClose, onLike }: { thread: ForumThread; onClose: () => void; onLike: (id: string) => void }) {
  const [replyText, setReplyText] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm px-6 py-4 border-b border-slate-100 flex items-center justify-between z-10">
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">{thread.category}</span>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xs font-bold">Close</button>
        </div>
        <div className="p-6 space-y-6">
          {/* Original post */}
          <div>
            <h2 className="text-lg font-black text-slate-800 mb-3">{thread.title}</h2>
            <div className="flex items-center gap-3 mb-4">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0", thread.isExpert ? "bg-gradient-to-br from-indigo-500 to-purple-600" : "bg-slate-400")}>
                {thread.authorInitials}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-slate-800">{thread.author}</span>
                  {thread.isExpert && <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-200"><Award size={8} className="inline mr-0.5" />Expert</span>}
                </div>
                <p className="text-[11px] text-slate-400">{thread.authorRole} · {thread.postedAt}</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{thread.body}</p>
            <button onClick={() => onLike(thread.id)} className={cn("flex items-center gap-1.5 mt-3 text-sm font-bold transition-colors", thread.liked ? "text-rose-500" : "text-slate-400 hover:text-rose-400")}>
              <Heart size={14} fill={thread.liked ? "currentColor" : "none"} />
              {thread.likes + (thread.liked ? 1 : 0)} likes
            </button>
          </div>

          {/* Replies */}
          {thread.replies.length > 0 && (
            <div className="space-y-3 pl-4 border-l-2 border-slate-100">
              {thread.replies.map(reply => (
                <div key={reply.id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black text-white shrink-0", reply.isExpert ? "bg-indigo-500" : "bg-slate-400")}>
                      {reply.authorInitials}
                    </div>
                    <span className="text-xs font-black text-slate-700">{reply.author}</span>
                    <span className="text-[10px] text-slate-400">{reply.postedAt}</span>
                  </div>
                  <p className="text-[12px] text-slate-500 leading-relaxed pl-9">{reply.body}</p>
                </div>
              ))}
            </div>
          )}

          {/* Reply input */}
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
              <Users size={13} className="text-indigo-500" />
            </div>
            <div className="flex-1 flex items-end gap-2">
              <textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder="Share your experience or advice…"
                rows={2}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-slate-50"
              />
              <button
                disabled={!replyText.trim()}
                onClick={() => setReplyText("")}
                className="shrink-0 p-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-40 transition-all"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const TABS = [
  { id: "ai-match",  label: "AI Match",      icon: Sparkles,     badge: "New" },
  { id: "book",      label: "Book a Session", icon: Calendar,     badge: null },
  { id: "directory", label: "Directory",      icon: Users,        badge: null },
  { id: "forum",     label: "Alumni Forum",   icon: MessageSquare, badge: null },
] as const;
type HubTab = typeof TABS[number]["id"];

interface Props {
  profile: UserProfile;
}

export default function CoachingHub({ profile }: Props) {
  const [activeTab, setActiveTab]         = useState<HubTab>("ai-match");
  const [mentors, setMentors]             = useState<Mentor[]>([]);
  const [mentorsLoading, setMentorsLoading] = useState(true);
  const [threads, setThreads]             = useState<ForumThread[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [bookingSession, setBookingSession] = useState<SessionType | null>(null);
  const [bookedIds, setBookedIds]         = useState<Set<string>>(new Set());
  const [requestedMentors, setRequestedMentors] = useState<Set<string>>(new Set());
  const [expandedThread, setExpandedThread] = useState<string | null>(null);
  const [searchQ, setSearchQ]             = useState("");
  const [industryFilter, setIndustryFilter] = useState("All Industries");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // Load mentors
  useEffect(() => {
    setMentorsLoading(true);
    getNetworkMentors(profile)
      .then((raw: any[]) => {
        const enriched = (raw as Mentor[]).map(m => ({
          ...m,
          matchScore: computeMatchScore(m, profile),
          matchReason: buildMatchReason(m, profile),
        }));
        enriched.sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
        setMentors(enriched);
      })
      .catch(() => setMentors([]))
      .finally(() => setMentorsLoading(false));
  }, []);

  // Load forum threads lazily when tab becomes active
  useEffect(() => {
    if (activeTab !== "forum" || threads.length > 0) return;
    setThreadsLoading(true);
    generateForumThreads(profile)
      .then(setThreads)
      .finally(() => setThreadsLoading(false));
  }, [activeTab]);

  const buildMatchReason = (m: Mentor, p: UserProfile): string => {
    const career = p.targetCareer || p.targetCareerId || "";
    const parts: string[] = [];
    if (career && m.expertise.some(e => e.toLowerCase().includes(career.toLowerCase().split(" ")[0]))) {
      parts.push(`Specialises in ${career}`);
    }
    if (p.country && m.country.toLowerCase().includes(p.country.toLowerCase())) {
      parts.push(`Based in ${m.country}`);
    }
    if (m.rating >= 4.8) parts.push("Top-rated mentor");
    if (m.availability === "available") parts.push("Available now");
    return parts.length > 0 ? parts.slice(0, 2).join(" · ") : `${m.yearsExp}+ years in ${m.industry}`;
  };

  const handleMentorRequest = useCallback((id: string) => {
    setRequestedMentors(prev => new Set([...prev, id]));
    setMentors(prev => prev.map(m => m.id === id ? { ...m, requested: true } : m));
  }, []);

  const handleLike = useCallback((id: string) => {
    setThreads(prev => prev.map(t => t.id === id ? { ...t, liked: !t.liked } : t));
  }, []);

  const filteredMentors = mentors.filter(m => {
    const q = searchQ.toLowerCase();
    const matchesSearch = !q || m.name.toLowerCase().includes(q) || m.title.toLowerCase().includes(q) || m.expertise.some(e => e.toLowerCase().includes(q));
    const matchesIndustry = industryFilter === "All Industries" || m.industry.toLowerCase().includes(industryFilter.toLowerCase());
    return matchesSearch && matchesIndustry;
  });

  const filteredThreads = threads.filter(t =>
    categoryFilter === "All" || t.category === categoryFilter
  );

  const topMatches = mentors.slice(0, 3);
  const expandedThreadData = threads.find(t => t.id === expandedThread) ?? null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-purple-950 to-indigo-900 px-8 py-10 text-white">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-[10px] font-black uppercase tracking-widest mb-4">
            <UserCheck size={11} />
            Coaching Hub
          </div>
          <h1 className="text-3xl font-black leading-tight mb-3">
            AI efficiency meets<br />
            <span className="text-purple-300">human expertise.</span>
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed max-w-lg">
            Our AI handles synthesis, pattern recognition, and mentor matching.
            Your coach handles judgment, nuance, and the human insight that no model can replicate.
            Together, they create a career acceleration system built around you.
          </p>
        </div>
        {/* Stats */}
        <div className="relative z-10 flex gap-6 mt-6 flex-wrap">
          {[
            { label: "Vetted coaches",   value: "200+" },
            { label: "Industries",       value: "40+" },
            { label: "Sessions booked",  value: "12k+" },
            { label: "Avg rating",       value: "4.9 ★" },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xl font-black text-white">{value}</p>
              <p className="text-[10px] text-slate-400 font-medium">{label}</p>
            </div>
          ))}
        </div>
        {/* Decorative */}
        <div className="absolute -right-12 -top-12 w-56 h-56 rounded-full border border-white/5" />
        <div className="absolute right-12 top-8    w-24 h-24 rounded-full bg-purple-500/20 blur-xl" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
        {TABS.map(({ id, label, icon: Icon, badge }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all relative",
              activeTab === id
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
            )}
          >
            <Icon size={12} />{label}
            {badge && (
              <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[8px] font-black leading-none">{badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          {/* ── AI MATCH ── */}
          {activeTab === "ai-match" && (
            <div className="space-y-6">
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-indigo-50 border border-indigo-200">
                <Sparkles size={14} className="text-indigo-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-black text-indigo-800 mb-0.5">How AI matching works</p>
                  <p className="text-[11px] text-indigo-700 leading-relaxed">
                    We score every mentor against your career target, skills, location, and availability in real time.
                    Match scores reflect both expertise alignment and mentor responsiveness.
                  </p>
                </div>
              </div>

              {mentorsLoading ? (
                <div className="grid gap-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-40 rounded-2xl bg-slate-100 animate-pulse" />
                  ))}
                </div>
              ) : topMatches.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <Users size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-bold">No mentors found. Try again shortly.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {topMatches.map((mentor, idx) => (
                    <div key={mentor.id} className="relative">
                      {idx === 0 && (
                        <div className="absolute -top-2 left-4 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400 text-slate-900 text-[9px] font-black uppercase tracking-widest shadow-sm">
                          <Award size={9} />Best Match
                        </div>
                      )}
                      <MentorCard mentor={mentor} showMatch onRequest={handleMentorRequest} />
                    </div>
                  ))}
                </div>
              )}

              {/* CTA to directory */}
              <button
                onClick={() => setActiveTab("directory")}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 text-xs font-bold transition-all"
              >
                <ArrowRight size={13} /> Browse all {mentors.length} mentors in the directory
              </button>
            </div>
          )}

          {/* ── BOOK A SESSION ── */}
          {activeTab === "book" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {SESSION_TYPES.map(session => {
                  const Icon = session.icon;
                  const isBooked = bookedIds.has(session.id);
                  return (
                    <div
                      key={session.id}
                      className={cn(
                        "relative bg-white rounded-2xl border p-5 space-y-4 hover:shadow-lg hover:shadow-indigo-50/60 transition-all",
                        session.isPremium ? "border-purple-200" : "border-slate-100"
                      )}
                    >
                      {session.badge && (
                        <div className="absolute -top-2 right-4 px-2.5 py-1 rounded-full bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest">
                          {session.badge}
                        </div>
                      )}
                      {session.isPremium && (
                        <div className="absolute top-3 left-3">
                          <Crown size={12} className="text-amber-400" />
                        </div>
                      )}
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        session.isPremium ? "bg-purple-100 text-purple-600" : "bg-indigo-100 text-indigo-600"
                      )}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-800">{session.title}</h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {session.duration > 0 ? `${session.duration} min` : "Flexible"} · <span className="font-black text-slate-700">{session.priceLabel}</span>
                        </p>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">{session.description}</p>
                      <button
                        onClick={() => session.price > 0 ? setBookingSession(session) : handleMentorRequest("match")}
                        disabled={isBooked}
                        className={cn(
                          "w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                          isBooked
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                            : session.isPremium
                              ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-200 hover:opacity-90"
                              : "bg-indigo-600 text-white shadow-md shadow-indigo-200 hover:bg-indigo-500"
                        )}
                      >
                        {isBooked ? <><CheckCircle2 size={11} className="inline mr-1" />Booked</> : session.price === 0 ? "Get Matched Free →" : `Book Now — ${session.priceLabel}`}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Trust signal */}
              <div className="flex items-start gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex -space-x-2 shrink-0">
                  {["JK", "MR", "SR", "AT"].map(initials => (
                    <div key={initials} className="w-8 h-8 rounded-full bg-indigo-500 border-2 border-white flex items-center justify-center text-[10px] text-white font-black">{initials}</div>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-black text-slate-700">4 people from your region booked a session this week.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">All sessions include a satisfaction guarantee. Not happy? We'll re-book for free.</p>
                </div>
              </div>
            </div>
          )}

          {/* ── DIRECTORY ── */}
          {activeTab === "directory" && (
            <div className="space-y-5">
              {/* Filters */}
              <div className="flex gap-3 flex-wrap">
                <div className="relative flex-1 min-w-48">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQ}
                    onChange={e => setSearchQ(e.target.value)}
                    placeholder="Search by name, role, skill…"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
                <div className="relative">
                  <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <select
                    value={industryFilter}
                    onChange={e => setIndustryFilter(e.target.value)}
                    className="pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 appearance-none"
                  >
                    {INDUSTRY_FILTERS.map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
              </div>

              {mentorsLoading ? (
                <div className="grid gap-4">
                  {[1, 2, 3, 4].map(i => <div key={i} className="h-36 rounded-2xl bg-slate-100 animate-pulse" />)}
                </div>
              ) : filteredMentors.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <Users size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-bold">No mentors match your filter.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredMentors.map(mentor => (
                    <MentorCard key={mentor.id} mentor={mentor} showMatch={false} onRequest={handleMentorRequest} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── FORUM ── */}
          {activeTab === "forum" && (
            <div className="space-y-5">
              {/* Category filter */}
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                {FORUM_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all",
                      categoryFilter === cat ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Post prompt */}
              <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                  <Users size={14} className="text-indigo-500" />
                </div>
                <input
                  readOnly
                  onClick={() => {}}
                  placeholder="Ask the community or share your experience…"
                  className="flex-1 text-sm text-slate-400 cursor-pointer focus:outline-none bg-transparent"
                />
                <button className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-black uppercase tracking-widest">
                  Post
                </button>
              </div>

              {threadsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <div key={i} className="h-44 rounded-2xl bg-slate-100 animate-pulse" />)}
                </div>
              ) : filteredThreads.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <MessageSquare size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-bold">No threads yet in this category.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredThreads.map(thread => (
                    <ThreadCard
                      key={thread.id}
                      thread={thread}
                      onLike={handleLike}
                      onExpand={id => setExpandedThread(id)}
                    />
                  ))}
                </div>
              )}

              {/* Expert CTA */}
              <div className="flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                <Award size={24} className="shrink-0 opacity-80" />
                <div className="flex-1">
                  <p className="text-sm font-black">Are you an industry professional?</p>
                  <p className="text-[11px] text-purple-200 mt-0.5">Apply to become a verified mentor and help the next generation of talent.</p>
                </div>
                <button className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-indigo-700 text-xs font-black whitespace-nowrap hover:bg-indigo-50 transition-all">
                  Apply <ChevronRight size={12} />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Booking Modal */}
      <AnimatePresence>
        {bookingSession && (
          <BookingModal
            session={bookingSession}
            onClose={() => setBookingSession(null)}
            onConfirm={() => {
              setBookedIds(prev => new Set([...prev, bookingSession.id]));
              setBookingSession(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Thread Modal */}
      <AnimatePresence>
        {expandedThreadData && (
          <ThreadModal
            thread={expandedThreadData}
            onClose={() => setExpandedThread(null)}
            onLike={handleLike}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

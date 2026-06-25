import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users, MessageSquare, Star, Building2,
  Search, Send, Heart, MapPin,
  GraduationCap, Handshake,
  BadgeCheck, Clock, Bell,
  Reply, Bookmark, ExternalLink,
  CheckCircle, Share2,
  ArrowRight, Hash, Lock,
  FileText, Plus, X, Loader2, RefreshCw, Sparkles,
  Trophy, HelpCircle, ThumbsUp, ChevronDown, ChevronUp, Gift,
} from "lucide-react";
import { cn } from "../lib/utils";
import type { UserProfile } from "../types/career";
import {
  getNetworkCommunities,
  getNetworkMentors,
  getNetworkResumeReviews,
  getNetworkReferrals,
  getNetworkCompanies,
  getQAPosts,
  createQAPost,
  voteQAPost,
} from "../services/geminiService";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type NetworkTab = "communities" | "mentorship" | "resume-review" | "referrals" | "companies" | "q-and-a" | "success-wall";

interface CommunityPost {
  id: string;
  author: string;
  avatar: string;
  role: string;
  content: string;
  timestamp: string;
  likes: number;
  replies: number;
  tags: string[];
  liked: boolean;
  bookmarked: boolean;
}

interface Community {
  id: string;
  name: string;
  industry: string;
  members: number;
  description: string;
  posts: CommunityPost[];
  color: string;
  icon: string;
  joined: boolean;
  private: boolean;
}

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
  linkedin?: string;
}

interface ResumeReviewRequest {
  id: string;
  author: string;
  avatar: string;
  role: string;
  targetRole: string;
  submittedAt: string;
  reviewsReceived: number;
  reviewsNeeded: number;
  tags: string[];
  status: "open" | "completed";
  reviewed: boolean;
}

interface ReferralConnection {
  id: string;
  name: string;
  avatar: string;
  title: string;
  company: string;
  companyLogo: string;
  connectionStrength: "strong" | "medium" | "weak";
  mutualConnections: number;
  openRoles: string[];
  connected: boolean;
  requestSent: boolean;
}

interface CompanyProfile {
  id: string;
  name: string;
  logo: string;
  industry: string;
  size: string;
  rating: number;
  reviews: number;
  alumniCount: number;
  openRoles: number;
  culture: string[];
  hq: string;
  alumni: { name: string; role: string; avatar: string; gradYear: number }[];
  followed: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers / Shared UI
// ─────────────────────────────────────────────────────────────────────────────

const LoadingSkeleton: React.FC<{ rows?: number }> = ({ rows = 4 }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="bg-white border border-slate-100 rounded-2xl p-4 animate-pulse">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-slate-200 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-slate-200 rounded w-1/3" />
            <div className="h-2.5 bg-slate-100 rounded w-1/2" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-2.5 bg-slate-100 rounded w-full" />
          <div className="h-2.5 bg-slate-100 rounded w-4/5" />
        </div>
      </div>
    ))}
  </div>
);

const ErrorRetry: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
      <RefreshCw size={20} className="text-red-400" />
    </div>
    <p className="font-bold text-slate-700 mb-1">Failed to load</p>
    <p className="text-sm text-slate-400 mb-4">{message}</p>
    <button onClick={onRetry} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all">
      <RefreshCw size={13} /> Try Again
    </button>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

const colorMap: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  indigo: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", badge: "bg-indigo-100 text-indigo-700" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", badge: "bg-emerald-100 text-emerald-700" },
  amber: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", badge: "bg-amber-100 text-amber-700" },
  pink: { bg: "bg-pink-50", text: "text-pink-700", border: "border-pink-200", badge: "bg-pink-100 text-pink-700" },
  slate: { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200", badge: "bg-slate-100 text-slate-700" },
  orange: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", badge: "bg-orange-100 text-orange-700" },
};

const availabilityConfig = {
  available: { label: "Available", color: "bg-emerald-100 text-emerald-700" },
  limited: { label: "Limited Spots", color: "bg-amber-100 text-amber-700" },
  full: { label: "Fully Booked", color: "bg-red-100 text-red-700" },
};

const strengthConfig = {
  strong: { label: "Strong Connection", color: "text-emerald-600", dot: "bg-emerald-500" },
  medium: { label: "Mutual Connections", color: "text-amber-600", dot: "bg-amber-500" },
  weak: { label: "Weak Connection", color: "text-slate-400", dot: "bg-slate-400" },
};

// Avatar Bubble
const AvatarBubble: React.FC<{ initials: string; size?: "sm" | "md" | "lg"; color?: string }> = ({ initials, size = "md", color }) => {
  const colors = ["bg-indigo-500", "bg-emerald-500", "bg-violet-500", "bg-amber-500", "bg-rose-500", "bg-teal-500", "bg-pink-500", "bg-blue-500"];
  const picked = color || colors[initials.charCodeAt(0) % colors.length];
  const sz = size === "sm" ? "w-7 h-7 text-[9px]" : size === "lg" ? "w-12 h-12 text-sm" : "w-9 h-9 text-xs";
  return (
    <div className={cn("rounded-full flex items-center justify-center font-black text-white shrink-0 uppercase", picked, sz)}>
      {initials}
    </div>
  );
};

// Star Rating
const StarRating: React.FC<{ rating: number; small?: boolean }> = ({ rating, small }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(s => (
      <Star key={s} size={small ? 10 : 12} className={s <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"} />
    ))}
    <span className={cn("font-bold text-slate-600 ml-1", small ? "text-[10px]" : "text-xs")}>{rating.toFixed(1)}</span>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Communities Tab
// ─────────────────────────────────────────────────────────────────────────────

const CommunitiesTab: React.FC<{ initialData: Community[] }> = ({ initialData }) => {
  const [communities, setCommunities] = useState<Community[]>(initialData);
  const [selected, setSelected] = useState<Community | null>(initialData[0] ?? null);
  const [posts, setPosts] = useState<Community["posts"]>(initialData[0]?.posts ?? []);
  const [newPost, setNewPost] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("All");

  useEffect(() => {
    if (initialData.length > 0) {
      setCommunities(initialData);
      setSelected(initialData[0]);
      setPosts(initialData[0].posts);
    }
  }, [initialData]);

  const industries = ["All", ...Array.from(new Set(communities.map(c => c.industry)))];
  const filtered = communities.filter(c =>
    (filter === "All" || c.industry === filter) &&
    (c.name.toLowerCase().includes(search.toLowerCase()) || c.industry.toLowerCase().includes(search.toLowerCase()))
  );

  const selectCommunity = (c: Community) => {
    setSelected(c);
    setPosts(c.posts);
    setNewPost("");
  };

  const toggleJoin = (id: string) => {
    setCommunities(prev => prev.map(c => c.id === id ? { ...c, joined: !c.joined, members: c.joined ? c.members - 1 : c.members + 1 } : c));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, joined: !prev.joined } : prev);
  };

  const toggleLike = (postId: string) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p));
  };

  const toggleBookmark = (postId: string) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, bookmarked: !p.bookmarked } : p));
  };

  const submitPost = () => {
    if (!newPost.trim() || !selected) return;
    const post: CommunityPost = {
      id: `p-${Date.now()}`, author: "You", avatar: "YO", role: "Member",
      content: newPost, timestamp: "Just now", likes: 0, replies: 0,
      tags: [], liked: false, bookmarked: false,
    };
    setPosts(prev => [post, ...prev]);
    setNewPost("");
  };

  return (
    <div className="flex gap-4 h-full min-h-[600px]">
      {/* Sidebar */}
      <div className="w-72 shrink-0 flex flex-col gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search communities…"
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-400"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {industries.map(ind => (
            <button key={ind} onClick={() => setFilter(ind)}
              className={cn("px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-colors",
                filter === ind ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200")}
            >{ind}</button>
          ))}
        </div>
        <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[520px] pr-1">
          {filtered.map(c => {
            const colors = colorMap[c.color] || colorMap.indigo;
            const isActive = selected?.id === c.id;
            return (
              <button key={c.id} onClick={() => selectCommunity(c)}
                className={cn("w-full text-left p-3 rounded-xl border transition-all",
                  isActive ? "bg-indigo-50 border-indigo-200 shadow-sm" : "bg-white border-slate-200 hover:border-slate-300")}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{c.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 leading-tight truncate">{c.name}</p>
                    <p className="text-[10px] text-slate-400">{c.members.toLocaleString()} members</p>
                  </div>
                  {c.private && <Lock size={11} className="text-slate-400 shrink-0" />}
                  {c.joined && <BadgeCheck size={13} className="text-indigo-500 shrink-0" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Feed */}
      {selected ? (
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto min-w-0">
          {/* Community Header */}
          <div className={cn("p-4 rounded-2xl border flex items-start justify-between gap-4", colorMap[selected.color]?.bg || "bg-indigo-50", colorMap[selected.color]?.border || "border-indigo-200")}>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{selected.icon}</span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-800">{selected.name}</h3>
                  {selected.private && <span className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded text-[9px] font-bold uppercase flex items-center gap-1"><Lock size={9}/> Private</span>}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{selected.description}</p>
                <p className="text-[10px] text-slate-400 mt-1">{selected.members.toLocaleString()} members · {selected.industry}</p>
              </div>
            </div>
            <button onClick={() => toggleJoin(selected.id)}
              className={cn("shrink-0 px-4 py-1.5 rounded-xl text-xs font-bold transition-all",
                selected.joined ? "bg-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600" : "bg-indigo-600 text-white hover:bg-indigo-700")}
            >
              {selected.joined ? "Leave" : "Join"}
            </button>
          </div>

          {/* Post Composer */}
          {selected.joined && !selected.private && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <textarea value={newPost} onChange={e => setNewPost(e.target.value)}
                placeholder={`Share something with ${selected.name}…`}
                rows={3}
                className="w-full text-sm text-slate-700 placeholder-slate-400 border-none outline-none resize-none"
              />
              <div className="flex justify-end mt-2">
                <button onClick={submitPost} disabled={!newPost.trim()}
                  className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all disabled:opacity-40"
                >
                  <Send size={12} /> Post
                </button>
              </div>
            </div>
          )}

          {/* Posts */}
          {selected.private && !selected.joined ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
              <Lock size={32} className="text-slate-300 mb-3" />
              <p className="font-bold text-slate-600">Private Community</p>
              <p className="text-sm text-slate-400 mt-1">Join to see posts and discussions.</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
              <MessageSquare size={32} className="text-slate-300 mb-3" />
              <p className="font-bold text-slate-600">No posts yet</p>
              <p className="text-sm text-slate-400">Be the first to start a discussion!</p>
            </div>
          ) : (
            <AnimatePresence>
              {posts.map((post, i) => (
                <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-white border border-slate-200 rounded-2xl p-4"
                >
                  <div className="flex items-start gap-3">
                    <AvatarBubble initials={post.avatar} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-800">{post.author}</span>
                        <span className="text-[10px] text-slate-400">{post.role}</span>
                        <span className="text-[10px] text-slate-300 ml-auto">{post.timestamp}</span>
                      </div>
                      <p className="text-sm text-slate-600 mt-2 leading-relaxed">{post.content}</p>
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {post.tags.map(t => (
                          <span key={t} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-bold">#{t}</span>
                        ))}
                      </div>
                      <div className="flex items-center gap-4 mt-3">
                        <button onClick={() => toggleLike(post.id)} className={cn("flex items-center gap-1 text-[11px] font-bold transition-colors", post.liked ? "text-rose-500" : "text-slate-400 hover:text-rose-400")}>
                          <Heart size={13} fill={post.liked ? "currentColor" : "none"} /> {post.likes}
                        </button>
                        <button className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-indigo-500 transition-colors">
                          <Reply size={13} /> {post.replies}
                        </button>
                        <button onClick={() => toggleBookmark(post.id)} className={cn("flex items-center gap-1 text-[11px] font-bold transition-colors", post.bookmarked ? "text-amber-500" : "text-slate-400 hover:text-amber-400")}>
                          <Bookmark size={13} fill={post.bookmarked ? "currentColor" : "none"} />
                        </button>
                        <button className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-colors ml-auto">
                          <Share2 size={13} /> Share
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-slate-400">Select a community to view posts</p>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Mentorship Tab
// ─────────────────────────────────────────────────────────────────────────────

const MentorshipTab: React.FC<{ initialData: Mentor[] }> = ({ initialData }) => {
  const [mentors, setMentors] = useState<Mentor[]>(initialData);
  const [search, setSearch] = useState("");
  const [industry, setIndustry] = useState("All");
  const [avail, setAvail] = useState("All");
  const [selected, setSelected] = useState<Mentor | null>(null);

  const industries = ["All", ...Array.from(new Set(mentors.map(m => m.industry)))];
  const filtered = mentors.filter(m =>
    (industry === "All" || m.industry === industry) &&
    (avail === "All" || m.availability === avail) &&
    (m.name.toLowerCase().includes(search.toLowerCase()) || m.title.toLowerCase().includes(search.toLowerCase()) || m.expertise.some(e => e.toLowerCase().includes(search.toLowerCase())))
  );

  const requestMentorship = (id: string) => {
    setMentors(prev => prev.map(m => m.id === id ? { ...m, requested: !m.requested } : m));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, requested: !prev.requested } : prev);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search mentors by name, role, or skill…"
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-400"
          />
        </div>
        <select value={industry} onChange={e => setIndustry(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-indigo-400">
          {industries.map(i => <option key={i}>{i}</option>)}
        </select>
        <select value={avail} onChange={e => setAvail(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-indigo-400">
          <option value="All">All Availability</option>
          <option value="available">Available</option>
          <option value="limited">Limited</option>
          <option value="full">Fully Booked</option>
        </select>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Active Mentors", value: mentors.filter(m => m.availability !== "full").length, icon: Users, color: "text-indigo-600 bg-indigo-50" },
          { label: "Avg Rating", value: (mentors.reduce((a, m) => a + m.rating, 0) / mentors.length).toFixed(1), icon: Star, color: "text-amber-600 bg-amber-50" },
          { label: "Total Mentees", value: mentors.reduce((a, m) => a + m.mentees, 0), icon: GraduationCap, color: "text-emerald-600 bg-emerald-50" },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", s.color)}>
              <s.icon size={18} />
            </div>
            <div>
              <p className="text-lg font-black text-slate-800">{s.value}</p>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Mentor Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((mentor, i) => {
            const avCfg = availabilityConfig[mentor.availability];
            return (
              <motion.div key={mentor.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }}
                className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-all cursor-pointer"
                onClick={() => setSelected(mentor)}
              >
                <div className="flex items-start gap-3 mb-3">
                  <AvatarBubble initials={mentor.avatar} size="lg" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-slate-800 text-sm">{mentor.name}</h4>
                      <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-bold", avCfg.color)}>{avCfg.label}</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{mentor.title} @ {mentor.company}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin size={10} className="text-slate-400" />
                      <span className="text-[10px] text-slate-400">{mentor.country} · {mentor.yearsExp} yrs exp</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 mb-3">{mentor.bio}</p>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {mentor.expertise.slice(0, 3).map(e => (
                    <span key={e} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-semibold">{e}</span>
                  ))}
                  {mentor.expertise.length > 3 && <span className="px-2 py-0.5 bg-slate-100 text-slate-400 rounded-full text-[10px]">+{mentor.expertise.length - 3}</span>}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <StarRating rating={mentor.rating} small />
                    <span className="text-[10px] text-slate-400">{mentor.mentees} mentees</span>
                  </div>
                  <button onClick={e => { e.stopPropagation(); requestMentorship(mentor.id); }}
                    disabled={mentor.availability === "full" && !mentor.requested}
                    className={cn("px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all",
                      mentor.requested
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                        : mentor.availability === "full"
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                          : "bg-indigo-600 text-white hover:bg-indigo-700"
                    )}
                  >
                    {mentor.requested ? <span className="flex items-center gap-1"><CheckCircle size={11} /> Requested</span> : "Request Mentorship"}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Mentor Detail Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelected(null)}
          >
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <AvatarBubble initials={selected.avatar} size="lg" />
                  <div>
                    <h3 className="font-bold text-slate-800">{selected.name}</h3>
                    <p className="text-xs text-slate-500">{selected.title} @ {selected.company}</p>
                    <StarRating rating={selected.rating} />
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="p-1.5 hover:bg-slate-100 rounded-xl"><X size={16} /></button>
              </div>

              <p className="text-sm text-slate-600 mb-4">{selected.bio}</p>

              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { label: "Mentees", value: selected.mentees },
                  { label: "Reviews", value: selected.reviews },
                  { label: "Exp (yrs)", value: selected.yearsExp },
                ].map(s => (
                  <div key={s.label} className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className="font-black text-slate-800">{s.value}</p>
                    <p className="text-[10px] text-slate-400">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="mb-4">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Expertise</p>
                <div className="flex flex-wrap gap-1.5">
                  {selected.expertise.map(e => <span key={e} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold">{e}</span>)}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                <span className="flex items-center gap-1"><Clock size={12} /> Responds {selected.responseTime}</span>
                <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold", availabilityConfig[selected.availability].color)}>{availabilityConfig[selected.availability].label}</span>
              </div>

              <button onClick={() => { requestMentorship(selected.id); }}
                disabled={selected.availability === "full" && !selected.requested}
                className={cn("w-full py-3 rounded-2xl font-bold text-sm transition-all",
                  selected.requested
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                    : selected.availability === "full"
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "bg-indigo-600 text-white hover:bg-indigo-700"
                )}
              >
                {selected.requested ? "✓ Mentorship Requested" : "Request Mentorship"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Peer Resume Review Tab
// ─────────────────────────────────────────────────────────────────────────────

const ResumeReviewTab: React.FC<{ initialData: ResumeReviewRequest[] }> = ({ initialData }) => {
  const [reviews, setReviews] = useState<ResumeReviewRequest[]>(initialData);
  const [showSubmit, setShowSubmit] = useState(false);
  const [targetRole, setTargetRole] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "open" | "completed">("all");

  const filtered = reviews.filter(r => activeFilter === "all" || r.status === activeFilter);

  const markReviewed = (id: string) => {
    setReviews(prev => prev.map(r => r.id === id ? { ...r, reviewed: true, reviewsReceived: Math.min(r.reviewsNeeded, r.reviewsReceived + 1) } : r));
  };

  const handleSubmit = () => {
    if (!targetRole.trim()) return;
    const newReq: ResumeReviewRequest = {
      id: `rr-${Date.now()}`, author: "You", avatar: "YO", role: "Your Current Role",
      targetRole, submittedAt: "Just now", reviewsReceived: 0, reviewsNeeded: 3,
      tags: ["My Resume"], status: "open", reviewed: false,
    };
    setReviews(prev => [newReq, ...prev]);
    setSubmitted(true);
    setShowSubmit(false);
    setTargetRole("");
  };

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          {(["all", "open", "completed"] as const).map(f => (
            <button key={f} onClick={() => setActiveFilter(f)}
              className={cn("px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-colors",
                activeFilter === f ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-500 hover:border-slate-300")}
            >{f}</button>
          ))}
        </div>
        <button onClick={() => setShowSubmit(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all"
        >
          <Plus size={14} /> Submit My Resume for Review
        </button>
      </div>

      {submitted && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl"
        >
          <CheckCircle size={18} className="text-emerald-600 shrink-0" />
          <div>
            <p className="text-sm font-bold text-emerald-800">Resume submitted for peer review!</p>
            <p className="text-xs text-emerald-600">You'll be notified when peers leave feedback. Help others by reviewing their resumes too.</p>
          </div>
        </motion.div>
      )}

      {/* How it works */}
      <div className="bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl p-4">
        <p className="text-xs font-black text-indigo-800 uppercase tracking-wider mb-3">How Peer Review Works</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { step: "1", title: "Submit", desc: "Upload your resume and state your target role" },
            { step: "2", title: "Review Others", desc: "Review 2 peers to unlock full feedback on yours" },
            { step: "3", title: "Get Feedback", desc: "Receive structured feedback from qualified peers" },
          ].map(s => (
            <div key={s.step} className="text-center">
              <div className="w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-black mx-auto mb-2">{s.step}</div>
              <p className="text-[11px] font-bold text-slate-700">{s.title}</p>
              <p className="text-[10px] text-slate-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Review Requests */}
      <div className="space-y-3">
        {filtered.map((req, i) => (
          <motion.div key={req.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-white border border-slate-200 rounded-2xl p-4"
          >
            <div className="flex items-start gap-3">
              <AvatarBubble initials={req.avatar} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-slate-800">{req.author}</span>
                  <span className="text-xs text-slate-400">{req.role}</span>
                  <span className="text-[10px] text-slate-300 ml-auto">{req.submittedAt}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <ArrowRight size={12} className="text-indigo-500 shrink-0" />
                  <p className="text-xs font-semibold text-indigo-700 truncate">Target: {req.targetRole}</p>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {req.tags.map(t => <span key={t} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-semibold">{t}</span>)}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {Array.from({ length: req.reviewsNeeded }).map((_, idx) => (
                    <div key={idx} className={cn("w-5 h-1.5 rounded-full", idx < req.reviewsReceived ? "bg-emerald-500" : "bg-slate-200")} />
                  ))}
                </div>
                <span className="text-[10px] text-slate-400">{req.reviewsReceived}/{req.reviewsNeeded} reviews</span>
                {req.status === "completed" && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[9px] font-bold uppercase">Complete</span>}
              </div>

              {req.author !== "You" && (
                <button onClick={() => markReviewed(req.id)} disabled={req.reviewed || req.status === "completed"}
                  className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all",
                    req.reviewed || req.status === "completed"
                      ? "bg-emerald-50 text-emerald-600 cursor-default"
                      : "bg-indigo-600 text-white hover:bg-indigo-700"
                  )}
                >
                  <FileText size={11} />
                  {req.reviewed ? "Reviewed ✓" : "Review Resume"}
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Submit Modal */}
      <AnimatePresence>
        {showSubmit && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowSubmit(false)}
          >
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800">Submit for Peer Review</h3>
                <button onClick={() => setShowSubmit(false)} className="p-1.5 hover:bg-slate-100 rounded-xl"><X size={16} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-2">Target Role</label>
                  <input value={targetRole} onChange={e => setTargetRole(e.target.value)}
                    placeholder="e.g. Senior Software Engineer @ FAANG"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-indigo-400"
                  />
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-xs text-amber-700">📋 Your resume file will be shared as a PDF. You must review 2 other resumes to receive full feedback.</p>
                </div>
                <button onClick={handleSubmit} disabled={!targetRole.trim()}
                  className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all disabled:opacity-40"
                >
                  Submit Resume
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Job Referrals Tab
// ─────────────────────────────────────────────────────────────────────────────

const ReferralsTab: React.FC<{ initialData: ReferralConnection[] }> = ({ initialData }) => {
  const [connections, setConnections] = useState<ReferralConnection[]>(initialData);
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("All");

  const companies = ["All", ...Array.from(new Set(connections.map(c => c.company)))];
  const filtered = connections.filter(c =>
    (companyFilter === "All" || c.company === companyFilter) &&
    (c.name.toLowerCase().includes(search.toLowerCase()) || c.company.toLowerCase().includes(search.toLowerCase()) || c.title.toLowerCase().includes(search.toLowerCase()))
  );

  const toggleConnect = (id: string) => {
    setConnections(prev => prev.map(c => c.id === id ? { ...c, connected: !c.connected, requestSent: false } : c));
  };

  const sendReferralRequest = (id: string) => {
    setConnections(prev => prev.map(c => c.id === id ? { ...c, requestSent: true } : c));
  };

  return (
    <div className="space-y-4">
      {/* Info Banner */}
      <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-start gap-3">
        <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
          <Handshake size={18} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">Job Referral Network</p>
          <p className="text-xs text-slate-500 mt-0.5">Connect with insiders at your target companies. A referral can increase your interview chances by <strong>10×</strong>.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, company or role…"
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-400"
          />
        </div>
        <select value={companyFilter} onChange={e => setCompanyFilter(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none">
          {companies.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Connection Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((conn, i) => {
            const str = strengthConfig[conn.connectionStrength];
            return (
              <motion.div key={conn.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-3 mb-3">
                  <AvatarBubble initials={conn.avatar} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-800">{conn.name}</span>
                      {conn.connected && <BadgeCheck size={13} className="text-indigo-500 shrink-0" />}
                    </div>
                    <p className="text-xs text-slate-500 truncate">{conn.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className={cn("w-2 h-2 rounded-full shrink-0", str.dot)} />
                      <span className={cn("text-[10px] font-semibold", str.color)}>{str.label}</span>
                      {conn.mutualConnections > 0 && <span className="text-[10px] text-slate-400">· {conn.mutualConnections} mutual</span>}
                    </div>
                  </div>
                  <div className="text-center shrink-0">
                    <div className="w-9 h-9 bg-slate-800 rounded-xl flex items-center justify-center text-white text-xs font-black">{conn.companyLogo}</div>
                    <p className="text-[9px] text-slate-500 mt-1">{conn.company}</p>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Open Roles</p>
                  <div className="flex flex-wrap gap-1">
                    {conn.openRoles.map(r => <span key={r} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-semibold">{r}</span>)}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => toggleConnect(conn.id)}
                    className={cn("flex-1 py-1.5 rounded-xl text-[11px] font-bold transition-all",
                      conn.connected ? "bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-500" : "bg-slate-800 text-white hover:bg-slate-700")}
                  >
                    {conn.connected ? "Connected ✓" : "Connect"}
                  </button>
                  <button onClick={() => sendReferralRequest(conn.id)} disabled={!conn.connected || conn.requestSent}
                    className={cn("flex-1 py-1.5 rounded-xl text-[11px] font-bold transition-all",
                      conn.requestSent
                        ? "bg-amber-50 text-amber-600 cursor-default"
                        : !conn.connected
                          ? "bg-slate-50 text-slate-300 cursor-not-allowed"
                          : "bg-indigo-600 text-white hover:bg-indigo-700"
                    )}
                  >
                    {conn.requestSent ? "Referral Requested ✓" : "Ask for Referral"}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Company Research & Alumni Tab
// ─────────────────────────────────────────────────────────────────────────────

const CompaniesTab: React.FC<{ initialData: CompanyProfile[]; profile: UserProfile }> = ({ initialData, profile }) => {
  const [companies, setCompanies] = useState<CompanyProfile[]>(initialData);
  const [selected, setSelected] = useState<CompanyProfile | null>(null);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [industry, setIndustry] = useState("All");
  const [searching, setSearching] = useState(false);

  // Run an AI-powered company search with the given query
  const runSearch = useCallback(async (query: string) => {
    const q = query.trim();
    if (!q) {
      setCompanies(initialData);
      setSearch("");
      return;
    }
    setSearch(q);
    setSearching(true);
    try {
      const results = await getNetworkCompanies(profile, q);
      // Always use AI results directly — even if empty, don't fall back to
      // unrelated initialData which would then get text-filtered to 0.
      setCompanies(Array.isArray(results) ? results : []);
    } catch {
      setCompanies([]);
    } finally {
      setSearching(false);
    }
  }, [initialData, profile]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') runSearch(searchInput);
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearch("");
    setCompanies(initialData);
    setIndustry("All");
  };

  const industries = ["All", ...Array.from(new Set(companies.map(c => c.industry)))];
  // When an AI search is active the LLM already filtered the results — only
  // apply the industry dropdown. Without search, do a local text match.
  const filtered = companies.filter(c => {
    if (industry !== "All" && c.industry !== industry) return false;
    if (search) return true; // AI already selected relevant companies
    return true;
  });

  const toggleFollow = (id: string) => {
    setCompanies(prev => prev.map(c => c.id === id ? { ...c, followed: !c.followed } : c));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, followed: !prev.followed } : prev);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search companies… (press Enter)"
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-400"
          />
        </div>
        <button
          onClick={() => runSearch(searchInput)}
          disabled={searching}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all",
            searching
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : "bg-indigo-600 text-white hover:bg-indigo-700"
          )}
        >
          {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
          {searching ? "Searching AI…" : "Search"}
        </button>
        {search && (
          <button onClick={clearSearch} className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-bold text-slate-500 bg-white border border-slate-200 hover:border-slate-300 transition-all">
            <X size={13} /> Clear
          </button>
        )}
        <select value={industry} onChange={e => setIndustry(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none">
          {industries.map(i => <option key={i}>{i}</option>)}
        </select>
      </div>

      {search && (
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2">
          <Sparkles size={12} className="text-indigo-500" />
          <span>
            Showing AI results for <strong className="text-indigo-700">"{search}"</strong> — first result is the exact match, followed by similar companies
            {filtered.length > 0 && <span className="ml-1 text-slate-400">({filtered.length} found)</span>}
          </span>
        </div>
      )}

      {/* Empty state when search returns nothing */}
      {filtered.length === 0 && !searching && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
            <Building2 size={22} className="text-slate-400" />
          </div>
          <p className="font-bold text-slate-700 mb-1">
            {search ? `No companies found for "${search}"` : "No companies found"}
          </p>
          <p className="text-sm text-slate-400 mb-4">
            {search ? "Try a different name or broaden your search." : "Try searching for a specific company."}
          </p>
          {search && (
            <button onClick={clearSearch} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all">
              <RefreshCw size={13} /> Reset search
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((company, i) => (
            <motion.div key={company.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.07 }}
              className={cn(
                "bg-white border rounded-2xl p-5 hover:shadow-md transition-all cursor-pointer",
                search && i === 0 ? "border-indigo-300 ring-1 ring-indigo-200 shadow-sm" : "border-slate-200"
              )}
              onClick={() => setSelected(company)}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-white font-black text-sm shrink-0">{company.logo}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-slate-800">{company.name}</h4>
                    {search && i === 0 && (
                      <span className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[9px] font-black flex items-center gap-1">
                        <CheckCircle size={9} /> Best Match
                      </span>
                    )}
                    {company.followed && <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded text-[9px] font-bold">Following</span>}
                  </div>
                  <p className="text-xs text-slate-500">{company.industry} · {company.size} employees</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin size={10} className="text-slate-400" />
                    <span className="text-[10px] text-slate-400">{company.hq}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { label: "Rating", value: `${company.rating}★`, color: "text-amber-600" },
                  { label: "Alumni", value: company.alumniCount, color: "text-indigo-600" },
                  { label: "Open Roles", value: company.openRoles, color: "text-emerald-600" },
                ].map(s => (
                  <div key={s.label} className="bg-slate-50 rounded-xl p-2 text-center">
                    <p className={cn("text-sm font-black", s.color)}>{s.value}</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="mb-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Culture Highlights</p>
                <div className="flex flex-wrap gap-1">
                  {company.culture.map(c => <span key={c} className="px-2 py-0.5 bg-violet-50 text-violet-700 rounded text-[10px] font-semibold">{c}</span>)}
                </div>
              </div>

              {/* Alumni Preview */}
              <div className="mb-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Alumni in Network</p>
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {company.alumni.slice(0, 3).map(a => (
                      <div key={a.name} title={`${a.name} · ${a.role}`}
                        className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-black text-white bg-indigo-500"
                      >{a.avatar}</div>
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-500">{company.alumni.length} connected alumni</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={e => { e.stopPropagation(); toggleFollow(company.id); }}
                  className={cn("flex-1 py-1.5 rounded-xl text-[11px] font-bold transition-all",
                    company.followed ? "bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-500" : "bg-slate-800 text-white hover:bg-slate-700")}
                >
                  {company.followed ? "Following ✓" : "Follow"}
                </button>
                <button onClick={e => { e.stopPropagation(); setSelected(company); }}
                  className="flex-1 py-1.5 bg-indigo-600 text-white rounded-xl text-[11px] font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-1"
                >
                  <Users size={11} /> View Alumni
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Company Detail Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelected(null)}
          >
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl max-h-[85vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center text-white font-black">{selected.logo}</div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{selected.name}</h3>
                    <p className="text-xs text-slate-500">{selected.industry} · {selected.size} employees</p>
                    <StarRating rating={selected.rating} />
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="p-1.5 hover:bg-slate-100 rounded-xl"><X size={16} /></button>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: "Rating", value: `${selected.rating}★`, sub: `${selected.reviews.toLocaleString()} reviews` },
                  { label: "Alumni", value: selected.alumniCount, sub: "in network" },
                  { label: "Open Roles", value: selected.openRoles, sub: "hiring now" },
                ].map(s => (
                  <div key={s.label} className="bg-slate-50 rounded-2xl p-3 text-center">
                    <p className="text-lg font-black text-slate-800">{s.value}</p>
                    <p className="text-[10px] text-slate-500">{s.sub}</p>
                  </div>
                ))}
              </div>

              <div className="mb-5">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Culture</p>
                <div className="flex flex-wrap gap-1.5">
                  {selected.culture.map(c => <span key={c} className="px-3 py-1 bg-violet-50 text-violet-700 rounded-full text-xs font-semibold">{c}</span>)}
                </div>
              </div>

              <div className="mb-5">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-3">Alumni Connections</p>
                <div className="space-y-3">
                  {selected.alumni.map(a => (
                    <div key={a.name} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
                      <AvatarBubble initials={a.avatar} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{a.name}</p>
                        <p className="text-[10px] text-slate-500 truncate">{a.role} · Joined {a.gradYear}</p>
                      </div>
                      <button className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-[10px] font-bold hover:bg-indigo-700 transition-all">
                        Connect
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => toggleFollow(selected.id)}
                  className={cn("flex-1 py-3 rounded-2xl font-bold text-sm transition-all",
                    selected.followed ? "bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-500" : "bg-slate-800 text-white hover:bg-slate-700")}
                >
                  {selected.followed ? "Unfollow" : "Follow Company"}
                </button>
                <a href={`https://www.google.com/search?q=${encodeURIComponent(selected.name + " jobs 2026")}`} target="_blank" rel="noopener noreferrer"
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                  <ExternalLink size={14} /> View Jobs
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main NetworkView
// ─────────────────────────────────────────────────────────────────────────────

interface Props { profile: UserProfile }

const TABS: { id: NetworkTab; label: string; icon: React.ElementType; desc: string }[] = [
  { id: "communities",    label: "Communities",     icon: Hash,          desc: "Industry channels & discussions" },
  { id: "mentorship",     label: "Mentorship",      icon: GraduationCap, desc: "Find & connect with mentors" },
  { id: "q-and-a",        label: "Q&A",             icon: HelpCircle,    desc: "Ask questions, share answers" },
  { id: "success-wall",   label: "Success Wall",    icon: Trophy,        desc: "Community wins & UGC stories" },
  { id: "resume-review",  label: "Resume Review",   icon: FileText,      desc: "Peer feedback on your resume" },
  { id: "referrals",      label: "Job Referrals",   icon: Handshake,     desc: "Get referred at target companies" },
  { id: "companies",      label: "Companies",       icon: Building2,     desc: "Research & alumni connections" },
];

type TabData = {
  communities: Community[];
  mentorship: Mentor[];
  "resume-review": ResumeReviewRequest[];
  referrals: ReferralConnection[];
  companies: CompanyProfile[];
  "q-and-a": QAPost[];
  "success-wall": SuccessStory[];
};

// ── Q&A types ──
interface QAPost {
  id: string;
  title: string;
  body: string;
  author: string;
  avatar: string;
  role: string;
  tags: string[];
  votes: number;
  answers: number;
  createdAt: string;
  voted: boolean;
  answered: boolean;
  topAnswer?: string;
  topAnswerAuthor?: string;
}

// ── Success story types ──
interface SuccessStory {
  id: string;
  author: string;
  avatar: string;
  headline: string;
  story: string;
  careerBefore: string;
  careerAfter: string;
  country: string;
  timeframe: string;
  likes: number;
  liked: boolean;
  verified: boolean;
  proGranted: boolean;
}

const FETCHERS: Record<NetworkTab, (profile: UserProfile) => Promise<any[]>> = {
  communities:     getNetworkCommunities,
  mentorship:      getNetworkMentors,
  "resume-review": getNetworkResumeReviews,
  referrals:       getNetworkReferrals,
  companies:       getNetworkCompanies,
  "q-and-a":       async (profile) => {
    const career = profile.targetCareerId?.replace(/-/g, ' ') || 'career';
    const country = profile.targetLocation || profile.country || 'Global';
    return getQAPosts(career, country);
  },
  "success-wall":  async (profile) => generateSuccessStories(profile),
};

// ─── Success Wall seed generator (still AI via backend) ──────────────────────

async function generateSuccessStories(profile: UserProfile): Promise<SuccessStory[]> {
  const career = profile.targetCareerId?.replace(/-/g, ' ') || 'tech';
  const country = profile.targetLocation || profile.country || 'Global';
  // Fallback seed data — returned when backend is unavailable
  return [
    { id: 's1', author: 'Amara O.', avatar: '🌟', headline: `Landed a ${career} role in ${country} in under 4 months!`, story: `I started with CareerVision AI knowing nothing about ${country}'s job market. The AI roadmap showed me exactly which certifications mattered, and the scholarship matching found me $8,000 in funding I didn't know existed. I'm now working at a top firm in ${country}.`, careerBefore: 'Customer Support Agent', careerAfter: `${career} Specialist`, country, timeframe: '4 months', likes: 142, liked: false, verified: true, proGranted: true },
    { id: 's2', author: 'Daniel R.', avatar: '🏆', headline: 'From dropout to Software Engineer — my CareerVision story', story: 'I dropped out at 19 with no degree and no connections. The skill gap analysis showed me exactly what I was missing. 8 months of focused upskilling later, I have an offer letter.', careerBefore: 'Retail Associate', careerAfter: 'Junior Software Engineer', country, timeframe: '8 months', likes: 98, liked: false, verified: true, proGranted: false },
  ];
}

const NetworkView: React.FC<Props> = ({ profile }) => {
  const [activeTab, setActiveTab] = useState<NetworkTab>("communities");
  const [data, setData] = useState<Partial<TabData>>({});
  const [loading, setLoading] = useState<Partial<Record<NetworkTab, boolean>>>({});
  const [errors, setErrors] = useState<Partial<Record<NetworkTab, string>>>({});

  // Use a ref to access latest data without it being a useCallback dep (avoids stale-closure loop)
  const dataRef = React.useRef(data);
  dataRef.current = data;

  const fetchTab = useCallback(async (tab: NetworkTab, force = false) => {
    if (!force && dataRef.current[tab]) return; // already loaded, skip unless forced
    setLoading(prev => ({ ...prev, [tab]: true }));
    setErrors(prev => ({ ...prev, [tab]: undefined }));
    try {
      const result = await FETCHERS[tab](profile);
      setData(prev => ({ ...prev, [tab]: result }));
    } catch (err: any) {
      setErrors(prev => ({ ...prev, [tab]: err?.message || "Failed to load data" }));
    } finally {
      setLoading(prev => ({ ...prev, [tab]: false }));
    }
  }, [profile]);

  const retryTab = useCallback((tab: NetworkTab) => {
    setData(prev => { const next = { ...prev }; delete next[tab]; return next; });
    setErrors(prev => ({ ...prev, [tab]: undefined }));
    fetchTab(tab, true);
  }, [fetchTab]);

  const refreshCurrentTab = useCallback(() => {
    fetchTab(activeTab, true);
  }, [fetchTab, activeTab]);

  // Fetch current tab on mount and when switching
  useEffect(() => { fetchTab(activeTab); }, [activeTab]);

  const current = TABS.find(t => t.id === activeTab)!;
  const isLoading = !!loading[activeTab];
  const error = errors[activeTab];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Network & Community</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            AI-curated connections, mentors, and communities tailored to your career in{" "}
            <span className="font-semibold text-indigo-600">{profile.targetCareerId?.replace(/-/g, " ") || "your field"}</span>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="relative p-2 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors">
            <Bell size={16} className="text-slate-500" />
          </button>
          <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl">
            <AvatarBubble initials={profile.name.slice(0, 2).toUpperCase()} size="sm" />
            <span className="text-xs font-bold text-slate-700 hidden sm:block">{profile.name.split(" ")[0]}</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all shrink-0",
              activeTab === tab.id
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                : "bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
            )}
          >
            <tab.icon size={15} />
            {tab.label}
            {loading[tab.id] && <Loader2 size={11} className="animate-spin opacity-60" />}
          </button>
        ))}
      </div>

      {/* Tab Description */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <current.icon size={13} />
        <span>{current.desc}</span>
        {isLoading && <span className="text-indigo-400 flex items-center gap-1"><Loader2 size={11} className="animate-spin" /> Loading AI data…</span>}
        <button
          onClick={refreshCurrentTab}
          disabled={isLoading}
          title="Refresh data from AI"
          className={cn(
            "ml-auto flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold transition-all border",
            isLoading
              ? "bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed"
              : "bg-white border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50"
          )}
        >
          <RefreshCw size={11} className={cn(isLoading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
          {error ? (
            <ErrorRetry message={error} onRetry={() => retryTab(activeTab)} />
          ) : isLoading || !data[activeTab] ? (
            <LoadingSkeleton rows={activeTab === "communities" ? 3 : 4} />
          ) : (
            <>
              {activeTab === "communities"   && <CommunitiesTab   initialData={data.communities   ?? []} />}
              {activeTab === "mentorship"    && <MentorshipTab    initialData={data.mentorship    ?? []} />}
              {activeTab === "q-and-a"       && <QAndATab         initialData={(data as any)["q-and-a"] ?? []} profile={profile} />}
              {activeTab === "success-wall"  && <SuccessWallTab   initialData={(data as any)["success-wall"] ?? []} profile={profile} />}
              {activeTab === "resume-review" && <ResumeReviewTab  initialData={data["resume-review"] ?? []} />}
              {activeTab === "referrals"     && <ReferralsTab     initialData={data.referrals     ?? []} />}
              {activeTab === "companies"     && <CompaniesTab     initialData={data.companies     ?? []} profile={profile} />}
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Q&A Tab
// ─────────────────────────────────────────────────────────────────────────────

function formatRelativeQA(ts: string): string {
  if (!ts || ts === 'just now') return ts || 'just now';
  const date = new Date(ts);
  if (isNaN(date.getTime())) return ts; // pass through "3 hours ago"-style strings
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

const QAndATab: React.FC<{ initialData: QAPost[]; profile: UserProfile }> = ({ initialData, profile }) => {
  const [posts, setPosts] = useState<QAPost[]>(initialData);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAskModal, setShowAskModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Keep in sync if parent re-fetches
  useEffect(() => { setPosts(initialData); }, [initialData]);

  const handleVote = async (id: string) => {
    const post = posts.find(p => p.id === id);
    if (!post) return;
    const direction = post.voted ? 'down' : 'up';
    // Optimistic update
    setPosts(prev => prev.map(p =>
      p.id === id ? { ...p, votes: p.voted ? p.votes - 1 : p.votes + 1, voted: !p.voted } : p
    ));
    try {
      await voteQAPost(id, direction);
    } catch {
      // Revert on failure
      setPosts(prev => prev.map(p =>
        p.id === id ? { ...p, votes: p.voted ? p.votes - 1 : p.votes + 1, voted: !p.voted } : p
      ));
    }
  };

  const handleAsk = async () => {
    if (!newQuestion.trim()) return;
    setSubmitting(true);
    const careerTag = profile.targetCareerId?.replace(/-/g, ' ') || 'career';
    const countryTag = profile.targetLocation || profile.country || 'Global';
    const optimisticPost: QAPost = {
      id: `q${Date.now()}`,
      title: newQuestion,
      body: '',
      author: profile.name.split(' ')[0],
      avatar: '🙋',
      role: careerTag,
      tags: [careerTag],
      votes: 0,
      answers: 0,
      createdAt: 'just now',
      voted: false,
      answered: false,
    };
    setPosts(prev => [optimisticPost, ...prev]);
    setNewQuestion('');
    setShowAskModal(false);
    setSubmitting(false);

    // Persist to backend (replace optimistic entry with real one on success)
    try {
      const saved = await createQAPost({
        author: profile.name.split(' ')[0],
        avatar: '🙋',
        role: careerTag,
        careerTag,
        countryTag,
        title: optimisticPost.title,
      });
      if (saved?.id) {
        setPosts(prev => prev.map(p =>
          p.id === optimisticPost.id
            ? { ...p, id: saved.id, createdAt: saved.createdAt || p.createdAt }
            : p
        ));
      }
    } catch {
      // Keep optimistic post — it's visible but not persisted
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 font-medium">Community Q&amp;A — ask anything about careers, visas, or study abroad.</p>
        <button
          onClick={() => setShowAskModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-md shadow-indigo-200"
        >
          <Plus size={13} /> Ask Question
        </button>
      </div>

      {/* Ask modal */}
      <AnimatePresence>
        {showAskModal && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-white border border-indigo-100 rounded-[2rem] p-5 shadow-xl shadow-indigo-100"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-black text-slate-700 uppercase tracking-widest">Your Question</p>
              <button onClick={() => setShowAskModal(false)} className="text-slate-400 hover:text-slate-700 transition-colors"><X size={14} /></button>
            </div>
            <textarea
              value={newQuestion}
              onChange={e => setNewQuestion(e.target.value)}
              placeholder="What's your career question? Be specific for better answers…"
              rows={3}
              className="w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 placeholder-slate-400 mb-3"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowAskModal(false)} className="px-4 py-2 text-xs font-bold text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
              <button onClick={handleAsk} disabled={submitting || !newQuestion.trim()}
                className="flex items-center gap-2 px-4 py-2 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all disabled:opacity-50">
                {submitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                Post Question
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Posts */}
      {posts.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <HelpCircle size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No questions yet. Be the first to ask!</p>
        </div>
      )}

      <div className="space-y-3">
        {posts.map(post => (
          <div key={post.id} className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden hover:border-indigo-100 transition-colors">
            <div className="p-5">
              <div className="flex items-start gap-3">
                {/* Vote */}
                <div className="flex flex-col items-center gap-1 shrink-0 min-w-[36px]">
                  <button onClick={() => handleVote(post.id)} className={cn('p-1 rounded-lg transition-colors', post.voted ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50')}>
                    <ChevronUp size={14} />
                  </button>
                  <span className={cn('text-[11px] font-black leading-none', post.voted ? 'text-indigo-600' : 'text-slate-500')}>{post.votes}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <button className="text-left w-full" onClick={() => setExpandedId(expandedId === post.id ? null : post.id)}>
                    <p className="text-sm font-black text-slate-800 leading-snug hover:text-indigo-600 transition-colors">{post.title}</p>
                  </button>

                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-[9px] font-bold text-slate-400">{post.avatar} {post.author} · {post.role}</span>
                    <span className="text-[9px] text-slate-300">·</span>
                    <span className="text-[9px] text-slate-400 flex items-center gap-0.5"><Clock size={8} /> {formatRelativeQA(post.createdAt)}</span>
                    <span className="text-[9px] text-slate-400 flex items-center gap-0.5"><Reply size={8} /> {post.answers} answers</span>
                    {post.tags.slice(0, 2).map(t => (
                      <span key={t} className="text-[8px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">#{t}</span>
                    ))}
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {expandedId === post.id && post.topAnswer && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 pl-9 border-l-2 border-indigo-100 ml-4">
                      <div className="flex items-center gap-2 mb-1">
                        <BadgeCheck size={12} className="text-indigo-500" />
                        <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Top Answer · {post.topAnswerAuthor}</span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed">{post.topAnswer}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Success Wall Tab + UGC Campaign
// ─────────────────────────────────────────────────────────────────────────────
const SuccessWallTab: React.FC<{ initialData: SuccessStory[]; profile: UserProfile }> = ({ initialData, profile }) => {
  const [stories, setStories] = useState<SuccessStory[]>(initialData);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareForm, setShareForm] = useState({ headline: '', story: '', careerBefore: '', careerAfter: '', timeframe: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleLike = (id: string) => {
    setStories(prev => prev.map(s => s.id === id ? { ...s, likes: s.liked ? s.likes - 1 : s.likes + 1, liked: !s.liked } : s));
  };

  const handleSubmitStory = async () => {
    if (!shareForm.headline.trim() || !shareForm.story.trim()) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 800));
    const newStory: SuccessStory = {
      id: `s${Date.now()}`,
      author: profile.name.split(' ')[0],
      avatar: '🌟',
      headline: shareForm.headline,
      story: shareForm.story,
      careerBefore: shareForm.careerBefore,
      careerAfter: shareForm.careerAfter,
      country: profile.targetLocation || profile.country || '',
      timeframe: shareForm.timeframe || '6 months',
      likes: 0,
      liked: false,
      verified: false,
      proGranted: false,
    };
    setStories(prev => [newStory, ...prev]);
    setShareForm({ headline: '', story: '', careerBefore: '', careerAfter: '', timeframe: '' });
    setShowShareModal(false);
    setSubmitted(true);
    setSubmitting(false);
  };

  return (
    <div className="space-y-5">
      {/* UGC Campaign Banner */}
      <div className="rounded-[2rem] p-5 flex items-start gap-4 overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)' }}>
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle at 80% 50%, white, transparent 60%)' }} />
        <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
          <Gift size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0 relative z-10">
          <p className="text-[10px] font-black text-white/70 uppercase tracking-widest mb-0.5">🎁 UGC Campaign — Limited Time</p>
          <p className="text-sm font-black text-white leading-tight mb-1">Share your success story and get 1 month Pro free</p>
          <p className="text-[10px] text-white/70 font-medium">Verified, detailed success stories earn you a free Pro upgrade. Help inspire 50,000+ students!</p>
        </div>
        <button
          onClick={() => setShowShareModal(true)}
          className="shrink-0 px-4 py-2 bg-white text-violet-700 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-50 transition-colors whitespace-nowrap"
        >
          Share Story
        </button>
      </div>

      {submitted && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-3 text-sm font-medium text-emerald-700">
          <CheckCircle size={16} className="text-emerald-500 shrink-0" />
          Your story has been submitted for verification. Pro access will be granted within 24 hours if approved.
        </motion.div>
      )}

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="bg-white border border-violet-100 rounded-[2rem] p-6 shadow-xl shadow-violet-50"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Trophy size={16} className="text-violet-600" />
                <p className="text-sm font-black text-slate-800">Share Your Success Story</p>
              </div>
              <button onClick={() => setShowShareModal(false)}><X size={14} className="text-slate-400" /></button>
            </div>
            <div className="space-y-3">
              {[
                { key: 'headline', label: 'Headline', placeholder: 'e.g. "Landed my dream job in Canada in 6 months!"', multiline: false },
                { key: 'careerBefore', label: 'Career Before', placeholder: 'e.g. "Retail Associate"', multiline: false },
                { key: 'careerAfter', label: 'Career After', placeholder: 'e.g. "Software Engineer at Google"', multiline: false },
                { key: 'timeframe', label: 'Timeframe', placeholder: 'e.g. "6 months"', multiline: false },
                { key: 'story', label: 'Your Story', placeholder: 'Tell the community how you got there…', multiline: true },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{f.label}</label>
                  {f.multiline ? (
                    <textarea
                      value={(shareForm as any)[f.key]}
                      onChange={e => setShareForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      rows={3}
                      className="w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-violet-400 placeholder-slate-400"
                    />
                  ) : (
                    <input
                      value={(shareForm as any)[f.key]}
                      onChange={e => setShareForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400 placeholder-slate-400"
                    />
                  )}
                </div>
              ))}
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowShareModal(false)} className="px-4 py-2 text-xs font-bold text-slate-500 bg-slate-100 rounded-xl">Cancel</button>
                <button onClick={handleSubmitStory} disabled={submitting || !shareForm.headline.trim() || !shareForm.story.trim()}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-black text-white rounded-xl transition-all disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                  {submitting ? <Loader2 size={12} className="animate-spin" /> : <Trophy size={12} />}
                  Submit Story
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stories */}
      <div className="space-y-4">
        {stories.map(story => (
          <div key={story.id} className="bg-white border border-slate-100 rounded-[2rem] p-6 hover:border-violet-100 transition-colors">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <span className="text-2xl leading-none shrink-0 mt-0.5">{story.avatar}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="text-sm font-black text-slate-800">{story.author}</p>
                    {story.verified && (
                      <span className="flex items-center gap-1 text-[8px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full uppercase tracking-widest">
                        <BadgeCheck size={8} /> Verified
                      </span>
                    )}
                    {story.proGranted && (
                      <span className="text-[8px] font-black text-violet-600 bg-violet-50 border border-violet-200 px-1.5 py-0.5 rounded-full uppercase tracking-widest">
                        ✦ Pro Granted
                      </span>
                    )}
                  </div>
                  <p className="text-[9px] text-slate-400 font-medium">{story.careerBefore} → {story.careerAfter} · {story.country} · {story.timeframe}</p>
                </div>
              </div>
              <button
                onClick={() => handleLike(story.id)}
                className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black transition-all border shrink-0', story.liked ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-white text-slate-400 border-slate-200 hover:border-rose-200 hover:text-rose-500')}
              >
                <Heart size={11} fill={story.liked ? 'currentColor' : 'none'} /> {story.likes}
              </button>
            </div>
            <p className="text-[11px] font-black text-violet-700 mb-2">"{story.headline}"</p>
            <p className="text-sm text-slate-600 leading-relaxed">{story.story}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

export default NetworkView;

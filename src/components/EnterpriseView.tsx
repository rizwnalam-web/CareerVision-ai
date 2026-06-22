import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Building2, Users, Shield, Zap, Globe, BarChart3,
  ArrowRight, Check, Plus, Loader2, Mail, ChevronDown,
  Crown, Settings, UserCheck, AlertCircle,
} from "lucide-react";
import {
  getUserEnterprise,
  createEnterpriseAccount,
  inviteEnterpriseSeat,
  type EnterpriseAccount,
} from "../services/subscriptionService";
import { useSubscription } from "../hooks/useSubscription";

const ENTERPRISE_FEATURES = [
  { icon: <Users className="w-5 h-5" />,    title: "Unlimited Seats",          desc: "Onboard your entire team — no seat caps." },
  { icon: <Shield className="w-5 h-5" />,   title: "SSO / LDAP",               desc: "Single sign-on via your existing identity provider." },
  { icon: <Zap className="w-5 h-5" />,      title: "Custom AI Tuning",         desc: "AI models fine-tuned on your industry and roles." },
  { icon: <BarChart3 className="w-5 h-5" />,title: "Bulk Analytics",           desc: "Aggregate insights across your entire workforce." },
  { icon: <Globe className="w-5 h-5" />,    title: "White-Label Option",       desc: "Deploy CareerVision under your own brand." },
  { icon: <Crown className="w-5 h-5" />,    title: "Dedicated Success Manager", desc: "A named expert who knows your goals." },
];

const TESTIMONIALS = [
  { quote: "Our hiring managers cut screening time by 40% using CareerVision's AI interview prep.", name: "Sarah K.", role: "Head of Talent, FinTech Corp" },
  { quote: "The bulk analytics dashboard gave us visibility we never had before.", name: "James L.", role: "L&D Director, GlobalBank" },
  { quote: "Custom AI tuning means the tool actually speaks our industry's language.", name: "Priya M.", role: "CHRO, MedTech Group" },
];

const INDUSTRY_OPTIONS = ["Technology", "Finance", "Healthcare", "Education", "Retail", "Manufacturing", "Consulting", "Other"];
const SIZE_OPTIONS = ["1-10", "11-50", "51-200", "201-500", "500+"];

interface Props {
  userId: string;
  onNavigatePricing?: () => void;
}

export default function EnterpriseView({ userId, onNavigatePricing }: Props) {
  const { isEnterprise, isLoading: subLoading } = useSubscription(userId);
  const [enterprise, setEnterprise] = useState<EnterpriseAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "team" | "setup">("overview");

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    getUserEnterprise(userId)
      .then(setEnterprise)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading || subLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (!isEnterprise || !enterprise) {
    return <EnterpriseSignupView userId={userId} onSuccess={setEnterprise} onViewPricing={onNavigatePricing} />;
  }

  return (
    <div className="min-h-screen pb-20 px-4">
      {/* Header */}
      <div className="max-w-5xl mx-auto pt-8 mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-600 to-orange-700 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{enterprise.companyName}</h1>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span className="capitalize">{enterprise.status}</span>
                <span>·</span>
                <span>{enterprise.seats.length} / {enterprise.seatLimit === -1 ? "∞" : enterprise.seatLimit} seats</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {["overview", "team", "setup"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                  tab === t
                    ? "bg-indigo-600 text-white"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        {tab === "overview" && <EnterpriseOverview enterprise={enterprise} />}
        {tab === "team"     && <TeamManagement enterprise={enterprise} onUpdate={setEnterprise} />}
        {tab === "setup"    && <EnterpriseSetup enterprise={enterprise} />}
      </div>
    </div>
  );
}

// ── Overview tab ─────────────────────────────────────────────────────────────

function EnterpriseOverview({ enterprise }: { enterprise: EnterpriseAccount }) {
  const activeSeats  = enterprise.seats.filter((s) => s.status === "active").length;
  const pendingSeats = enterprise.seats.filter((s) => s.status === "invited").length;

  const stats = [
    { label: "Active Members",    value: activeSeats,                        icon: <UserCheck className="w-5 h-5" /> },
    { label: "Pending Invites",   value: pendingSeats,                       icon: <Mail className="w-5 h-5" /> },
    { label: "Seat Utilisation",  value: `${Math.round(activeSeats / (enterprise.seatLimit || 1) * 100)}%`, icon: <BarChart3 className="w-5 h-5" /> },
    { label: "Plan",              value: "Enterprise",                       icon: <Crown className="w-5 h-5" /> },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm"
          >
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
              {s.icon}
              {s.label}
            </div>
            <div className="text-2xl font-bold text-slate-900">{s.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-amber-500" />
          Enterprise Features Active
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ENTERPRISE_FEATURES.map((f, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-amber-500 mt-0.5">{f.icon}</div>
              <div>
                <div className="text-sm font-medium text-slate-900">{f.title}</div>
                <div className="text-xs text-slate-500 mt-0.5">{f.desc}</div>
              </div>
              <Check className="w-4 h-4 text-emerald-500 ml-auto mt-0.5 flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Team management tab ───────────────────────────────────────────────────────

function TeamManagement({
  enterprise,
  onUpdate,
}: {
  enterprise: EnterpriseAccount;
  onUpdate: (acc: EnterpriseAccount) => void;
}) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "manager" | "member">("member");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setError(null);
    setInviting(true);
    try {
      await inviteEnterpriseSeat(enterprise.id, inviteEmail.trim(), inviteRole);
      // Refresh enterprise
      const updated = await getUserEnterprise(enterprise.ownerIdentifier);
      if (updated) onUpdate(updated);
      setInviteEmail("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setInviting(false);
    }
  };

  const roleColor = {
    admin: "text-amber-700 bg-amber-100",
    manager: "text-blue-700 bg-blue-100",
    member: "text-slate-600 bg-slate-100",
  };

  return (
    <div className="space-y-6">
      {/* Invite form */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-indigo-500" />
          Invite Team Members
        </h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="colleague@company.com"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-400"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-indigo-400"
          >
            <option value="member">Member</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
          <button
            onClick={handleInvite}
            disabled={inviting || !inviteEmail.trim()}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            Invite
          </button>
        </div>
        {error && (
          <div className="mt-3 flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
      </div>

      {/* Seats table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <h3 className="font-semibold text-slate-900">Team Members ({enterprise.seats.length})</h3>
        </div>
        {enterprise.seats.length === 0 ? (
          <div className="text-center py-12 text-slate-500">No members yet — invite your team above.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-600 text-left border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 font-medium">Member</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {enterprise.seats.map((seat, i) => (
                <tr key={seat.id} className={`border-b border-slate-100 ${i % 2 === 0 ? "" : "bg-slate-50/60"}`}>
                  <td className="px-4 py-3 text-slate-900">{seat.email ?? seat.userIdentifier}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${roleColor[seat.role]}`}>
                      {seat.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1 text-xs ${seat.status === "active" ? "text-emerald-600" : "text-yellow-600"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${seat.status === "active" ? "bg-emerald-500" : "bg-yellow-500"}`} />
                      {seat.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {seat.acceptedAt ? new Date(seat.acceptedAt).toLocaleDateString() : "Pending"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Setup / Config tab ────────────────────────────────────────────────────────

function EnterpriseSetup({ enterprise }: { enterprise: EnterpriseAccount }) {
  return (
    <div className="space-y-4">
      {[
        { title: "SSO Configuration", desc: "Connect your SAML/OIDC identity provider.", badge: "Contact support" },
        { title: "Custom AI Model", desc: "Upload role definitions and company glossary for fine-tuning.", badge: "In progress" },
        { title: "White-Label Branding", desc: "Custom domain, logo, colour palette.", badge: "Contact support" },
        { title: "API Credentials", desc: "Generate API keys for programmatic access.", badge: "Coming soon" },
        { title: "Compliance Export", desc: "GDPR / SOC 2 audit reports.", badge: "Contact support" },
      ].map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.06 }}
          className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50/30 transition-all cursor-pointer shadow-sm"
        >
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-slate-400" />
            <div>
              <div className="text-slate-900 text-sm font-medium">{item.title}</div>
              <div className="text-xs text-slate-500 mt-0.5">{item.desc}</div>
            </div>
          </div>
          <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">{item.badge}</span>
        </motion.div>
      ))}
    </div>
  );
}

// ── Enterprise signup / marketing view ───────────────────────────────────────

function EnterpriseSignupView({
  userId,
  onSuccess,
  onViewPricing,
}: {
  userId: string;
  onSuccess: (acc: EnterpriseAccount) => void;
  onViewPricing?: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    companyName: "",
    domain: "",
    industry: "",
    size: "",
    billingEmail: "",
    seatLimit: 10,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyName.trim()) return;
    setError(null);
    setSubmitting(true);
    try {
      const account = await createEnterpriseAccount({ ...form, ownerUserId: userId });
      onSuccess(account);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 px-4">
      {/* Hero */}
      <div className="max-w-4xl mx-auto pt-10 text-center mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-1.5 mb-6"
        >
          <Building2 className="w-4 h-4 text-amber-500" />
          <span className="text-amber-600 text-sm font-medium">Enterprise Solutions</span>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="text-4xl font-bold text-slate-900 mb-4"
        >
          Empower your entire workforce
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-slate-500 text-lg max-w-xl mx-auto mb-8"
        >
          CareerVision Enterprise gives your HR and L&amp;D teams AI-powered career development tools at scale
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-wrap gap-3 justify-center"
        >
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:from-amber-400 hover:to-orange-400 transition-all flex items-center gap-2 shadow-lg shadow-orange-200"
          >
            Get started free
            <ArrowRight className="w-4 h-4" />
          </button>
          {onViewPricing && (
            <button
              onClick={onViewPricing}
              className="px-6 py-3 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:border-slate-400 hover:bg-slate-100 transition-all"
            >
              Compare plans
            </button>
          )}
        </motion.div>
      </div>

      {/* Feature grid */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
        {ENTERPRISE_FEATURES.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 mb-4">
              {f.icon}
            </div>
            <div className="font-semibold text-slate-900 text-sm mb-1">{f.title}</div>
            <div className="text-xs text-slate-500">{f.desc}</div>
          </motion.div>
        ))}
      </div>

      {/* Testimonials */}
      <div className="max-w-4xl mx-auto mb-16">
        <h2 className="text-center text-2xl font-bold text-slate-900 mb-8">Trusted by leading teams</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"
            >
              <p className="text-slate-600 text-sm italic mb-4">"{t.quote}"</p>
              <div className="text-slate-900 text-sm font-medium">{t.name}</div>
              <div className="text-slate-500 text-xs">{t.role}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Setup modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowForm(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl"
        >
          <h3 className="text-xl font-bold text-slate-900 mb-1">Set up your enterprise</h3>
          <p className="text-slate-500 text-sm mb-6">Complete setup instantly — upgrade later.</p>

            {error && (
              <div className="mb-4 flex items-center gap-2 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-slate-600 mb-1.5 block">Company name *</label>
                <input
                  required
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-indigo-400"
                  placeholder="Acme Corp"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-600 mb-1.5 block">Industry</label>
                  <select
                    value={form.industry}
                    onChange={(e) => setForm({ ...form, industry: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-indigo-400"
                  >
                    <option value="">Select…</option>
                    {INDUSTRY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-600 mb-1.5 block">Company size</label>
                  <select
                    value={form.size}
                    onChange={(e) => setForm({ ...form, size: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-indigo-400"
                  >
                    <option value="">Select…</option>
                    {SIZE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-600 mb-1.5 block">Company domain</label>
                <input
                  value={form.domain}
                  onChange={(e) => setForm({ ...form, domain: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-indigo-400"
                  placeholder="company.com"
                />
              </div>
              <div>
                <label className="text-xs text-slate-600 mb-1.5 block">Billing email</label>
                <input
                  type="email"
                  value={form.billingEmail}
                  onChange={(e) => setForm({ ...form, billingEmail: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-indigo-400"
                  placeholder="finance@company.com"
                />
              </div>
              <div>
                <label className="text-xs text-slate-600 mb-1.5 block">Initial seat limit</label>
                <input
                  type="number"
                  min={1}
                  value={form.seatLimit}
                  onChange={(e) => setForm({ ...form, seatLimit: parseInt(e.target.value) || 10 })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-indigo-400"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 border border-slate-300 text-slate-600 rounded-xl text-sm hover:border-slate-400 hover:bg-slate-50 transition-all">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-semibold text-sm hover:from-amber-500 hover:to-orange-500 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Account"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}


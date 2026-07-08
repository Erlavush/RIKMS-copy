import { Link } from "react-router";
import {
  Database,
  Building2,
  Users,
  BookOpen,
  Clock,
  Zap,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Lock,
  KeyRound,
  FileText,
  Eye,
  Plus,
  ArrowRight,
  Download,
  Upload,
  CheckCircle2,
  XCircle,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/* ──────────── Mock Data ──────────── */

const AGENCY_RESEARCH_DATA = [
  { name: "DOST XI", count: 186 },
  { name: "CHED XI", count: 152 },
  { name: "DTI XI", count: 128 },
  { name: "NEDA XI", count: 114 },
  { name: "DICT XI", count: 97 },
  { name: "RHRDC XI", count: 143 },
  { name: "DRIERDC", count: 108 },
  { name: "SMAARRDEC", count: 89 },
  { name: "USEP", count: 231 },
];

const YEARLY_RESEARCH_DATA = [
  { year: "2020", uploads: 87 },
  { year: "2021", uploads: 134 },
  { year: "2022", uploads: 198 },
  { year: "2023", uploads: 267 },
  { year: "2024", uploads: 312 },
  { year: "2025", uploads: 198 },
  { year: "2026", uploads: 52 },
];

const ACTIVITY_FEED = [
  { id: 1, user: "Agency Admin (DOST XI)", action: "uploaded new research", title: "IoT-Based Water Quality Monitoring", time: "12 minutes ago", icon: Upload, color: "#16A34A", bg: "#DCFCE7" },
  { id: 2, user: "System", action: "published research", title: "Climate Adaptation in Davao Agriculture", time: "34 minutes ago", icon: CheckCircle2, color: "#1E3A8A", bg: "#DBEAFE" },
  { id: 3, user: "Agency Admin (CHED XI)", action: "approved access request for", title: "Maria Santos", time: "1 hour ago", icon: ShieldCheck, color: "#7C3AED", bg: "#EDE9FE" },
  { id: 4, user: "Agency Admin (NEDA XI)", action: "updated metadata for", title: "Regional Economic Growth Indicators 2025", time: "2 hours ago", icon: FileText, color: "#D97706", bg: "#FEF3C7" },
  { id: 5, user: "Agency Admin (DTI XI)", action: "uploaded new research", title: "MSME Digital Transformation Impact", time: "3 hours ago", icon: Upload, color: "#16A34A", bg: "#DCFCE7" },
];

const MODERATION_ALERTS = [
  { id: 1, title: "Duplicate Research Submission Detected", agency: "DICT XI", type: "Flagged Record", severity: "warning" as const },
  { id: 2, title: "Missing Abstract and Keywords", agency: "SMAARRDEC", type: "Metadata Issue", severity: "info" as const },
  { id: 3, title: "Pending Access Request (72h+)", agency: "RHRDC XI", type: "Access Request", severity: "warning" as const },
  { id: 4, title: "Incomplete Author Affiliation Data", agency: "DRIERDC", type: "Metadata Issue", severity: "info" as const },
];

const SECURITY_CARDS = [
  { label: "MFA-Enabled Accounts", value: "3 / 3", icon: Lock, color: "#16A34A", bg: "#DCFCE7" },
  { label: "Recent Failed Logins", value: "2", icon: XCircle, color: "#DC2626", bg: "#FEE2E2" },
  { label: "Locked Accounts", value: "0", icon: ShieldAlert, color: "#6B7280", bg: "#F3F4F6" },
  { label: "Security Alerts", value: "1", icon: AlertTriangle, color: "#D97706", bg: "#FEF3C7" },
];

const QUICK_ACTIONS = [
  { label: "Create New Agency", icon: Plus, href: "/admin/agencies", color: "#1E3A8A", bg: "#DBEAFE" },
  { label: "Manage Admin Users", icon: Users, href: "/admin/users", color: "#7C3AED", bg: "#EDE9FE" },
  { label: "View System Research", icon: Database, href: "/admin/research", color: "#16A34A", bg: "#DCFCE7" },
  { label: "Open Activity Logs", icon: FileText, href: "/admin/activity", color: "#D97706", bg: "#FEF3C7" },
  { label: "Manage RBAC Roles", icon: KeyRound, href: "/admin/rbac", color: "#DC2626", bg: "#FEE2E2" },
];

/* ──────────── Component ──────────── */

export function SuperAdminDashboard() {
  const metrics = [
    { label: "Total Research Records", value: "1,248", icon: Database, color: "#1E3A8A", bg: "#DBEAFE", trend: "+24 this month" },
    { label: "Participating Agencies", value: "9", icon: Building2, color: "#7C3AED", bg: "#EDE9FE", trend: "Region XI" },
    { label: "Agency Admin Users", value: "27", icon: Users, color: "#16A34A", bg: "#DCFCE7", trend: "+3 new" },
    { label: "Published Research", value: "1,052", icon: BookOpen, color: "#D97706", bg: "#FEF3C7", trend: "84.3% published" },
    { label: "Pending Access Requests", value: "18", icon: Clock, color: "#DC2626", bg: "#FEE2E2", trend: "5 urgent" },
    { label: "Active Sessions", value: "12", icon: Zap, color: "#0891B2", bg: "#CFFAFE", trend: "Online now" },
  ];

  return (
    <div className="space-y-6 max-w-[1376px]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[#0F172A] mb-1" style={{ fontSize: "1.5rem", fontWeight: 700 }}>
            System Dashboard
          </h1>
          <p className="text-[#6B7280] text-sm">
            Monitor and manage the RIKMS platform across participating agencies.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1E3A8A] text-white text-sm rounded-[10px] hover:bg-[#1E3A8A]/90 transition-colors shadow-sm self-start" style={{ fontWeight: 500 }}>
          <Download className="w-4 h-4" /> Generate System Report
        </button>
      </div>

      {/* Section 1 – System Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="bg-white rounded-[10px] border border-gray-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-[10px] flex items-center justify-center" style={{ backgroundColor: m.bg }}>
                  <Icon className="w-5 h-5" style={{ color: m.color }} />
                </div>
              </div>
              <p className="text-2xl text-gray-800 mb-0.5" style={{ fontWeight: 700 }}>{m.value}</p>
              <p className="text-xs text-gray-500" style={{ fontWeight: 500 }}>{m.label}</p>
              <p className="text-[11px] text-gray-400 mt-1">{m.trend}</p>
            </div>
          );
        })}
      </div>

      {/* Section 2 – Research Distribution Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Research by Agency */}
        <section className="bg-white rounded-[10px] border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[10px] bg-[#1E3A8A]/10 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-[#1E3A8A]" />
            </div>
            <h2 className="text-[#0F172A] text-sm" style={{ fontWeight: 700 }}>Research by Agency</h2>
          </div>
          <div className="px-4 py-5">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={AGENCY_RESEARCH_DATA} margin={{ top: 5, right: 20, left: 0, bottom: 40 }}>
                <CartesianGrid key="grid-agency" strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis key="x-agency" dataKey="name" tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} angle={-35} textAnchor="end" interval={0} />
                <YAxis key="y-agency" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <Tooltip
                  key="tooltip-agency"
                  contentStyle={{ borderRadius: "10px", border: "1px solid #E5E7EB", fontSize: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                  cursor={{ fill: "rgba(30,58,138,0.04)" }}
                />
                <Bar key="bar-agency" dataKey="count" fill="#1E3A8A" radius={[6, 6, 0, 0]} barSize={28} name="Research" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Research by Year */}
        <section className="bg-white rounded-[10px] border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[10px] bg-green-50 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <h2 className="text-[#0F172A] text-sm" style={{ fontWeight: 700 }}>Research Uploads by Year</h2>
          </div>
          <div className="px-4 py-5">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={YEARLY_RESEARCH_DATA} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid key="grid-yearly" strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis key="x-yearly" dataKey="year" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis key="y-yearly" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <Tooltip
                  key="tooltip-yearly"
                  contentStyle={{ borderRadius: "10px", border: "1px solid #E5E7EB", fontSize: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                />
                <Line key="line-yearly" type="monotone" dataKey="uploads" stroke="#16A34A" strokeWidth={2.5} dot={{ fill: "#16A34A", r: 4 }} activeDot={{ r: 6 }} name="Uploads" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Section 3 & 4 – Activity Feed & Moderation Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Activity Feed */}
        <section className="lg:col-span-3 bg-white rounded-[10px] border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[10px] bg-[#1E3A8A]/10 flex items-center justify-center">
                <FileText className="w-4 h-4 text-[#1E3A8A]" />
              </div>
              <h2 className="text-[#0F172A] text-sm" style={{ fontWeight: 700 }}>System Activity Feed</h2>
            </div>
            <Link to="/admin/activity" className="text-xs text-[#1E3A8A] hover:underline flex items-center gap-1" style={{ fontWeight: 500 }}>
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {ACTIVITY_FEED.map((a) => {
              const Icon = a.icon;
              return (
                <div key={a.id} className="flex items-start gap-3.5 px-6 py-3.5 hover:bg-[#F9FAFB] transition-colors">
                  <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: a.bg }}>
                    <Icon className="w-4 h-4" style={{ color: a.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700">
                      <span style={{ fontWeight: 600 }}>{a.user}</span>{" "}
                      <span className="text-gray-500">{a.action}</span>{" "}
                      <span className="text-[#1E3A8A]" style={{ fontWeight: 500 }}>{a.title}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {a.time}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Pending Moderation Alerts */}
        <section className="lg:col-span-2 bg-white rounded-[10px] border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[10px] bg-amber-50 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              </div>
              <h2 className="text-[#0F172A] text-sm" style={{ fontWeight: 700 }}>Pending Moderation</h2>
            </div>
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full" style={{ fontWeight: 600 }}>{MODERATION_ALERTS.length}</span>
          </div>
          <div className="divide-y divide-gray-50">
            {MODERATION_ALERTS.map((alert) => (
              <div key={alert.id} className="px-6 py-3.5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-sm text-gray-800" style={{ fontWeight: 500 }}>{alert.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{alert.agency}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${
                    alert.severity === "warning"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-blue-50 text-blue-600"
                  }`} style={{ fontWeight: 600 }}>
                    {alert.type}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="text-[11px] text-[#1E3A8A] hover:underline" style={{ fontWeight: 500 }}>Review</button>
                  <span className="text-gray-300">|</span>
                  <button className="text-[11px] text-gray-500 hover:underline" style={{ fontWeight: 500 }}>View Details</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Section 5 – Security Status */}
      <section className="bg-white rounded-[10px] border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[10px] bg-red-50 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-red-500" />
            </div>
            <h2 className="text-[#0F172A] text-sm" style={{ fontWeight: 700 }}>Security Status</h2>
          </div>
          <Link to="/admin/security" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-50 border border-red-200 rounded-[8px] text-red-600 hover:bg-red-100 transition-colors" style={{ fontWeight: 500 }}>
            <ShieldAlert className="w-3 h-3" /> Open Security Center
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
          {SECURITY_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="flex items-center gap-4 p-4 bg-[#F9FAFB] rounded-[10px] border border-gray-100">
                <div className="w-11 h-11 rounded-[10px] flex items-center justify-center shrink-0" style={{ backgroundColor: card.bg }}>
                  <Icon className="w-5 h-5" style={{ color: card.color }} />
                </div>
                <div>
                  <p className="text-xl text-gray-800" style={{ fontWeight: 700 }}>{card.value}</p>
                  <p className="text-xs text-gray-500" style={{ fontWeight: 500 }}>{card.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 6 – Quick Management Actions */}
      <section className="bg-white rounded-[10px] border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[10px] bg-gray-100 flex items-center justify-center">
            <Zap className="w-4 h-4 text-gray-600" />
          </div>
          <h2 className="text-[#0F172A] text-sm" style={{ fontWeight: 700 }}>Quick Management Actions</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 p-6">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                to={action.href}
                className="flex flex-col items-center gap-3 p-5 rounded-[10px] border border-gray-100 bg-[#F9FAFB] hover:border-[#1E3A8A]/20 hover:bg-[#1E3A8A]/[0.02] transition-colors group"
              >
                <div className="w-12 h-12 rounded-[10px] flex items-center justify-center transition-colors" style={{ backgroundColor: action.bg }}>
                  <Icon className="w-5 h-5" style={{ color: action.color }} />
                </div>
                <span className="text-xs text-gray-600 text-center group-hover:text-[#1E3A8A] transition-colors" style={{ fontWeight: 500 }}>
                  {action.label}
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
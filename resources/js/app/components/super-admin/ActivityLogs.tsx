import { useState } from "react";
import {
  FileText,
  Search,
  Download,
  Clock,
  Upload,
  CheckCircle2,
  ShieldCheck,
  Edit2,
  Trash2,
  LogIn,
  UserPlus,
  Settings,
  Eye,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Building2,
  User,
  X,
  Bell,
  BellOff,
  Shield,
  Globe,
  Monitor,
  Database,
  MoreVertical,
  XCircle,
} from "lucide-react";
import { AGENCIES } from "../../data/mock-data";

/* ─── Types ─── */
type NotificationType = "research" | "user" | "security" | "system";
type ActivityStatus = "Completed" | "Pending" | "Failed";
type SortOption = "newest" | "oldest";

interface Notification {
  id: number;
  type: NotificationType;
  message: string;
  timestamp: string;
  read: boolean;
  icon: any;
  iconColor: string;
  iconBg: string;
}

interface ActivityLog {
  id: number;
  timestamp: string;
  user: string;
  role: string;
  agency: string;
  action: string;
  resource: string;
  status: ActivityStatus;
  ip?: string;
  device?: string;
}

/* ─── Mock Data: Notifications ─── */
const NOTIFICATIONS: Notification[] = [
  { id: 1, type: "research", message: "Agency Admin from DOST XI uploaded new research: 'IoT-Based Water Quality Monitoring System for Davao River'", timestamp: "2 hours ago", read: false, icon: Upload, iconColor: "#1E3A8A", iconBg: "#DBEAFE" },
  { id: 2, type: "user", message: "Access request approved for Maria Santos by Agency Admin – DICT XI", timestamp: "3 hours ago", read: false, icon: CheckCircle2, iconColor: "#16A34A", iconBg: "#DCFCE7" },
  { id: 3, type: "research", message: "Research metadata updated: 'Climate Adaptation Strategies in Davao Agriculture' by SMAARRDEC Admin", timestamp: "4 hours ago", read: false, icon: Edit2, iconColor: "#D97706", iconBg: "#FEF3C7" },
  { id: 4, type: "system", message: "New agency 'Davao Region Environmental Research Center' has been created", timestamp: "5 hours ago", read: true, icon: Building2, iconColor: "#7C3AED", iconBg: "#EDE9FE" },
  { id: 5, type: "user", message: "Agency Admin account created for Dr. Carlos Tan – SMAARRDEC", timestamp: "6 hours ago", read: true, icon: UserPlus, iconColor: "#0891B2", iconBg: "#CFFAFE" },
  { id: 6, type: "security", message: "Multiple failed login attempts detected from IP 203.177.45.112", timestamp: "7 hours ago", read: false, icon: AlertTriangle, iconColor: "#DC2626", iconBg: "#FEE2E2" },
  { id: 7, type: "research", message: "Research 'Renewable Energy Potential Assessment' published by DRIEERDC Admin", timestamp: "8 hours ago", read: true, icon: CheckCircle2, iconColor: "#16A34A", iconBg: "#DCFCE7" },
  { id: 8, type: "system", message: "System maintenance scheduled for Mar 7, 2026 – 02:00 AM to 04:00 AM", timestamp: "10 hours ago", read: true, icon: Settings, iconColor: "#6B7280", iconBg: "#F3F4F6" },
  { id: 9, type: "security", message: "MFA policy enabled for DICT XI by Super Admin", timestamp: "12 hours ago", read: true, icon: Shield, iconColor: "#D97706", iconBg: "#FEF3C7" },
  { id: 10, type: "user", message: "Access request denied for Rafael Domingo by Agency Admin – CHED XI", timestamp: "Yesterday", read: true, icon: XCircle, iconColor: "#DC2626", iconBg: "#FEE2E2" },
];

/* ─── Mock Data: Activity Logs ─── */
const ACTIVITY_LOGS: ActivityLog[] = [
  { id: 1, timestamp: "Mar 5, 2026 – 10:32 AM", user: "Dr. Maria Santos", role: "Agency Admin", agency: "DOST XI", action: "Uploaded Research", resource: "IoT-Based Water Quality Monitoring System for Davao River", status: "Completed", ip: "192.168.1.45", device: "Chrome 122 / Windows 11" },
  { id: 2, timestamp: "Mar 5, 2026 – 10:15 AM", user: "Super Admin", role: "Super Admin", agency: "System", action: "Approved Access Request", resource: "Climate Adaptation Strategies in Davao Agriculture", status: "Completed", ip: "10.0.0.1", device: "Firefox 124 / macOS" },
  { id: 3, timestamp: "Mar 5, 2026 – 09:55 AM", user: "Prof. Elena Marquez", role: "Agency Admin", agency: "CHED XI", action: "Updated Metadata", resource: "Higher Education Quality Assurance Metrics in Region XI", status: "Completed", ip: "172.16.0.88", device: "Chrome 122 / Windows 10" },
  { id: 4, timestamp: "Mar 5, 2026 – 09:32 AM", user: "Dr. Carlos Tan", role: "Agency Admin", agency: "SMAARRDEC", action: "Uploaded Research", resource: "Sustainable Agriculture Practices in Southern Mindanao", status: "Completed", ip: "192.168.2.12", device: "Safari 17 / macOS" },
  { id: 5, timestamp: "Mar 5, 2026 – 09:15 AM", user: "Unknown", role: "Unknown", agency: "System", action: "Failed Login Attempt", resource: "Admin Portal Login", status: "Failed", ip: "203.177.45.112", device: "Chrome 120 / Linux" },
  { id: 6, timestamp: "Mar 5, 2026 – 08:47 AM", user: "Dr. Teresa Mendez", role: "Agency Admin", agency: "NEDA XI", action: "Updated Metadata", resource: "Regional Economic Growth Indicators 2025", status: "Completed", ip: "192.168.1.67", device: "Edge 122 / Windows 11" },
  { id: 7, timestamp: "Mar 4, 2026 – 04:30 PM", user: "Super Admin", role: "Super Admin", agency: "SMAARRDEC", action: "Created Agency Admin", resource: "Dr. Carlos Tan – Agency Admin Account", status: "Completed", ip: "10.0.0.1", device: "Firefox 124 / macOS" },
  { id: 8, timestamp: "Mar 4, 2026 – 03:45 PM", user: "Super Admin", role: "Super Admin", agency: "DICT XI", action: "Settings Changed", resource: "MFA Policy – Enabled for DICT XI", status: "Completed", ip: "10.0.0.1", device: "Firefox 124 / macOS" },
  { id: 9, timestamp: "Mar 4, 2026 – 02:18 PM", user: "Dr. Pedro Villanueva", role: "Agency Admin", agency: "SMAARRDEC", action: "Archived Research", resource: "Outdated Report on Water Supply Infrastructure", status: "Completed", ip: "192.168.3.22", device: "Chrome 122 / Windows 11" },
  { id: 10, timestamp: "Mar 4, 2026 – 01:40 PM", user: "Dr. Isabella Cruz", role: "Agency Admin", agency: "RHRDC XI", action: "Denied Access Request", resource: "Public Health Framework for Disease Surveillance", status: "Completed", ip: "172.16.0.44", device: "Safari 17 / macOS" },
  { id: 11, timestamp: "Mar 4, 2026 – 12:30 PM", user: "Prof. Roberto Garcia", role: "Agency Admin", agency: "USEP", action: "Uploaded Research", resource: "Gender Equality in STEM Education Programs", status: "Completed", ip: "192.168.4.15", device: "Chrome 122 / Windows 10" },
  { id: 12, timestamp: "Mar 4, 2026 – 11:15 AM", user: "Dr. Antonio Mendoza", role: "Agency Admin", agency: "DTI XI", action: "Uploaded Research", resource: "MSME Digital Transformation Impact Study", status: "Completed", ip: "192.168.5.33", device: "Edge 122 / Windows 11" },
  { id: 13, timestamp: "Mar 4, 2026 – 10:00 AM", user: "System", role: "System", agency: "System", action: "Automated Backup", resource: "Full Database Backup – 2.4 GB", status: "Completed", ip: "—", device: "Server Process" },
  { id: 14, timestamp: "Mar 4, 2026 – 09:12 AM", user: "Dr. Lourdes Tan", role: "Agency Admin", agency: "DTI XI", action: "Approved Access Request", resource: "Economic Impact of Digital Transformation on MSMEs", status: "Completed", ip: "192.168.5.34", device: "Chrome 122 / Windows 11" },
  { id: 15, timestamp: "Mar 3, 2026 – 04:45 PM", user: "Unknown", role: "Unknown", agency: "System", action: "Failed Login Attempt", resource: "Admin Portal Login", status: "Failed", ip: "45.33.12.78", device: "Unknown Browser" },
  { id: 16, timestamp: "Mar 3, 2026 – 03:20 PM", user: "Super Admin", role: "Super Admin", agency: "System", action: "Created Agency", resource: "Davao Region Environmental Research Center", status: "Pending", ip: "10.0.0.1", device: "Firefox 124 / macOS" },
];

/* ─── Timeline Data ─── */
const TIMELINE_EVENTS = [
  { action: "Research Uploaded", detail: "IoT-Based Water Quality Monitoring System – DICT XI", timestamp: "Mar 5, 2026 – 10:32 AM", color: "#1E3A8A", icon: Upload },
  { action: "Access Request Approved", detail: "Climate Adaptation Strategies – Maria Santos", timestamp: "Mar 5, 2026 – 10:15 AM", color: "#16A34A", icon: CheckCircle2 },
  { action: "Research Metadata Updated", detail: "Higher Education QA Metrics – CHED XI", timestamp: "Mar 5, 2026 – 09:55 AM", color: "#D97706", icon: Edit2 },
  { action: "Failed Login Attempt", detail: "IP 203.177.45.112 – Invalid credentials", timestamp: "Mar 5, 2026 – 09:15 AM", color: "#DC2626", icon: AlertTriangle },
  { action: "Agency Admin Created", detail: "Dr. Carlos Tan – SMAARRDEC", timestamp: "Mar 4, 2026 – 04:30 PM", color: "#0891B2", icon: UserPlus },
  { action: "Research Archived", detail: "Outdated Report on Water Supply – SMAARRDEC", timestamp: "Mar 4, 2026 – 02:18 PM", color: "#6B7280", icon: Trash2 },
  { action: "Agency Created", detail: "Davao Region Environmental Research Center", timestamp: "Mar 4, 2026 – 10:00 AM", color: "#7C3AED", icon: Building2 },
];

const ITEMS_PER_PAGE = 8;

/* ─── Status Badge ─── */
function StatusBadge({ status }: { status: ActivityStatus }) {
  const styles: Record<ActivityStatus, { bg: string; text: string; border: string; dot: string }> = {
    Completed: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", dot: "bg-green-500" },
    Pending: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
    Failed: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500" },
  };
  const s = styles[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border ${s.bg} ${s.text} ${s.border}`} style={{ fontWeight: 600 }}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}

/* ─── Activity Detail Panel ─── */
function ActivityDetailPanel({ log, onClose }: { log: ActivityLog | null; onClose: () => void }) {
  if (!log) return null;
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-[480px] bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-[#0F172A]" style={{ fontSize: "1.125rem", fontWeight: 700 }}>Activity Details</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="flex items-center justify-between">
            <StatusBadge status={log.status} />
            <span className="text-xs text-gray-400">{log.timestamp}</span>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-[#1E3A8A]" />
              <span className="text-xs text-gray-500" style={{ fontWeight: 700 }}>User Information</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-gray-400 block" style={{ fontWeight: 500 }}>User</span>
                <span className="text-sm text-gray-800" style={{ fontWeight: 600 }}>{log.user}</span>
              </div>
              <div>
                <span className="text-[11px] text-gray-400 block" style={{ fontWeight: 500 }}>Role</span>
                <span className="text-sm text-gray-700">{log.role}</span>
              </div>
              <div>
                <span className="text-[11px] text-gray-400 block" style={{ fontWeight: 500 }}>Agency</span>
                <span className="text-sm text-gray-700 flex items-center gap-1"><Building2 className="w-3 h-3 text-gray-400" />{log.agency}</span>
              </div>
            </div>
          </div>

          <div>
            <span className="text-xs text-gray-500 block mb-2" style={{ fontWeight: 700 }}>Action Performed</span>
            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
              <p className="text-sm text-[#1E3A8A]" style={{ fontWeight: 600 }}>{log.action}</p>
            </div>
          </div>

          <div>
            <span className="text-xs text-gray-500 block mb-2" style={{ fontWeight: 700 }}>Affected Resource</span>
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#1E3A8A] shrink-0" />
                <p className="text-sm text-gray-800" style={{ fontWeight: 500 }}>{log.resource}</p>
              </div>
            </div>
          </div>

          {log.ip && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <span className="text-xs text-gray-500 block" style={{ fontWeight: 700 }}>Technical Details</span>
              <div className="grid grid-cols-1 gap-2.5">
                <div>
                  <span className="text-[11px] text-gray-400 block" style={{ fontWeight: 500 }}>IP Address</span>
                  <span className="text-sm text-gray-700 flex items-center gap-1 font-mono">{log.ip}</span>
                </div>
                {log.device && (
                  <div>
                    <span className="text-[11px] text-gray-400 block" style={{ fontWeight: 500 }}>Device / Browser</span>
                    <span className="text-sm text-gray-700 flex items-center gap-1"><Monitor className="w-3 h-3 text-gray-400" />{log.device}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ─── Main Component ─── */
export function ActivityLogs() {
  // Notification state
  const [notifTab, setNotifTab] = useState<"all" | NotificationType>("all");
  const [notifications, setNotifications] = useState(NOTIFICATIONS);

  // Activity log state
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("All");
  const [filterAgency, setFilterAgency] = useState("All");
  const [filterAction, setFilterAction] = useState("All");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifs = notifications.filter((n) => notifTab === "all" || n.type === notifTab);

  const filteredLogs = ACTIVITY_LOGS.filter((l) => {
    const matchesSearch =
      l.user.toLowerCase().includes(search.toLowerCase()) ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.resource.toLowerCase().includes(search.toLowerCase());
    const matchesRole = filterRole === "All" || l.role === filterRole;
    const matchesAgency = filterAgency === "All" || l.agency === filterAgency;
    const matchesAction = filterAction === "All" || l.action === filterAction;
    return matchesSearch && matchesRole && matchesAgency && matchesAction;
  }).sort((a, b) => (sortBy === "oldest" ? a.id - b.id : b.id - a.id));

  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const markAllRead = () => setNotifications(notifications.map((n) => ({ ...n, read: true })));
  const clearNotifications = () => setNotifications([]);

  const NOTIF_TABS = [
    { key: "all" as const, label: "All Notifications" },
    { key: "research" as const, label: "Research Updates" },
    { key: "user" as const, label: "User Activity" },
    { key: "security" as const, label: "Security Alerts" },
    { key: "system" as const, label: "System Updates" },
  ];

  const uniqueActions = [...new Set(ACTIVITY_LOGS.map((l) => l.action))];
  const uniqueRoles = [...new Set(ACTIVITY_LOGS.map((l) => l.role))];
  const uniqueAgencies = [...new Set(ACTIVITY_LOGS.map((l) => l.agency))];

  return (
    <div className="space-y-6 max-w-[1376px]">
      {/* ─── Page Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[#0F172A] mb-1" style={{ fontSize: "1.5rem", fontWeight: 700 }}>
            System Notifications & Activity Logs
          </h1>
          <p className="text-[#6B7280] text-sm">
            Monitor system notifications and track administrative activities across the RIKMS platform.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start flex-wrap">
          <button className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50 transition-colors shadow-sm" style={{ fontWeight: 500 }}>
            <Download className="w-4 h-4" /> Export Activity Log
          </button>
          <button
            onClick={clearNotifications}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-red-200 text-red-600 text-sm rounded-xl hover:bg-red-50 transition-colors shadow-sm"
            style={{ fontWeight: 500 }}
          >
            <BellOff className="w-4 h-4" /> Clear Notifications
          </button>
        </div>
      </div>

      {/* ─── Section 1: System Notifications ─── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#1E3A8A]/10 flex items-center justify-center">
              <Bell className="w-4 h-4 text-[#1E3A8A]" />
            </div>
            <h2 className="text-[#0F172A] text-sm" style={{ fontWeight: 700 }}>System Notifications</h2>
            {unreadCount > 0 && (
              <span className="text-[10px] text-white bg-red-500 px-2 py-0.5 rounded-full" style={{ fontWeight: 700 }}>{unreadCount} new</span>
            )}
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs text-[#1E3A8A] hover:underline" style={{ fontWeight: 500 }}>
              Mark all as read
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="px-5 sm:px-6 py-2 border-b border-gray-100 overflow-x-auto">
          <div className="flex items-center gap-1 min-w-max">
            {NOTIF_TABS.map((tab) => (
              <button
                key={`ntab-${tab.key}`}
                onClick={() => setNotifTab(tab.key)}
                className={`px-3.5 py-2 text-xs rounded-lg transition-colors whitespace-nowrap ${
                  notifTab === tab.key
                    ? "bg-[#1E3A8A] text-white"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
                style={{ fontWeight: notifTab === tab.key ? 600 : 500 }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notification Feed */}
        {filteredNotifs.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <BellOff className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400" style={{ fontWeight: 500 }}>No notifications to display.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 max-h-[420px] overflow-y-auto">
            {filteredNotifs.map((notif) => {
              const Icon = notif.icon;
              return (
                <div
                  key={`notif-${notif.id}`}
                  className={`px-5 sm:px-6 py-3.5 flex items-start gap-3.5 transition-colors hover:bg-gray-50/50 ${
                    !notif.read ? "bg-blue-50/30 border-l-[3px] border-l-[#1E3A8A]" : ""
                  }`}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: notif.iconBg }}
                  >
                    <Icon className="w-4 h-4" style={{ color: notif.iconColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm text-gray-700 ${!notif.read ? "" : ""}`} style={{ fontWeight: !notif.read ? 600 : 400, lineHeight: 1.6 }}>
                      {notif.message}
                    </p>
                    <span className="text-[11px] text-gray-400 flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" /> {notif.timestamp}
                    </span>
                  </div>
                  {!notif.read && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#1E3A8A] shrink-0 mt-2" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Section 2: Activity Log Table ─── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header + Filters */}
        <div className="px-5 sm:px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
              <FileText className="w-4 h-4 text-amber-600" />
            </div>
            <h2 className="text-[#0F172A] text-sm" style={{ fontWeight: 700 }}>Activity Log</h2>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search activity logs..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]/30"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={filterRole}
                onChange={(e) => { setFilterRole(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 cursor-pointer"
              >
                <option value="All">All Roles</option>
                {uniqueRoles.map((r) => (
                  <option key={`role-${r}`} value={r}>{r}</option>
                ))}
              </select>
              <select
                value={filterAgency}
                onChange={(e) => { setFilterAgency(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 cursor-pointer"
              >
                <option value="All">All Agencies</option>
                {uniqueAgencies.map((a) => (
                  <option key={`ag-${a}`} value={a}>{a}</option>
                ))}
              </select>
              <select
                value={filterAction}
                onChange={(e) => { setFilterAction(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 cursor-pointer"
              >
                <option value="All">All Actions</option>
                {uniqueActions.map((a) => (
                  <option key={`act-${a}`} value={a}>{a}</option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 cursor-pointer"
              >
                <option value="newest">Newest Activity</option>
                <option value="oldest">Oldest Activity</option>
              </select>
            </div>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80">
                <th className="text-left px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>Timestamp</th>
                <th className="text-left px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>User</th>
                <th className="text-left px-6 py-3 text-xs text-gray-500 hidden xl:table-cell" style={{ fontWeight: 600 }}>Role</th>
                <th className="text-left px-6 py-3 text-xs text-gray-500 hidden lg:table-cell" style={{ fontWeight: 600 }}>Agency</th>
                <th className="text-left px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>Action</th>
                <th className="text-left px-6 py-3 text-xs text-gray-500 hidden xl:table-cell" style={{ fontWeight: 600 }}>Affected Resource</th>
                <th className="text-left px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>Status</th>
                <th className="text-right px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedLogs.map((log) => (
                <tr
                  key={`log-${log.id}`}
                  className="hover:bg-gray-50/60 transition-colors cursor-pointer group"
                  onClick={() => setSelectedLog(log)}
                >
                  <td className="px-6 py-3.5">
                    <span className="text-xs text-gray-500 whitespace-nowrap">{log.timestamp}</span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="text-sm text-gray-800" style={{ fontWeight: 600 }}>{log.user}</span>
                  </td>
                  <td className="px-6 py-3.5 hidden xl:table-cell">
                    <span className={`text-xs px-2 py-1 rounded-md ${
                      log.role === "Super Admin" ? "text-amber-700 bg-amber-50" : log.role === "System" ? "text-gray-500 bg-gray-100" : "text-[#1E3A8A] bg-[#1E3A8A]/5"
                    }`} style={{ fontWeight: 600 }}>
                      {log.role}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 hidden lg:table-cell">
                    <span className="text-xs text-gray-600">{log.agency}</span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="text-sm text-gray-700" style={{ fontWeight: 500 }}>{log.action}</span>
                  </td>
                  <td className="px-6 py-3.5 hidden xl:table-cell max-w-[240px]">
                    <span className="text-xs text-gray-500 truncate block">{log.resource}</span>
                  </td>
                  <td className="px-6 py-3.5">
                    <StatusBadge status={log.status} />
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <button className="p-1.5 rounded-lg text-gray-400 hover:text-[#1E3A8A] hover:bg-[#1E3A8A]/5 transition-colors opacity-0 group-hover:opacity-100">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-gray-100">
          {paginatedLogs.map((log) => (
            <div
              key={`mob-log-${log.id}`}
              className="p-4 hover:bg-gray-50/50 transition-colors cursor-pointer"
              onClick={() => setSelectedLog(log)}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-sm text-gray-800" style={{ fontWeight: 600 }}>{log.action}</p>
                <StatusBadge status={log.status} />
              </div>
              <p className="text-xs text-gray-500 mb-2 truncate">{log.resource}</p>
              <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                <span className="flex items-center gap-1"><User className="w-3 h-3" />{log.user}</span>
                <span className={`px-1.5 py-0.5 rounded ${
                  log.role === "Super Admin" ? "text-amber-700 bg-amber-50" : "text-[#1E3A8A] bg-[#1E3A8A]/5"
                }`} style={{ fontWeight: 600, fontSize: "10px" }}>
                  {log.role}
                </span>
                <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{log.agency}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{log.timestamp}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="px-5 sm:px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredLogs.length)}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredLogs.length)} of {filteredLogs.length} activities
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`p-1.5 rounded-lg transition-colors ${currentPage === 1 ? "text-gray-300 cursor-not-allowed" : "hover:bg-gray-100 text-gray-400"}`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={`pg-${page}`}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-lg text-xs transition-colors ${page === currentPage ? "bg-[#1E3A8A] text-white" : "hover:bg-gray-100 text-gray-500"}`}
                style={{ fontWeight: page === currentPage ? 600 : 400 }}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={`p-1.5 rounded-lg transition-colors ${currentPage === totalPages ? "text-gray-300 cursor-not-allowed" : "hover:bg-gray-100 text-gray-400"}`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Section 3: Activity Timeline ─── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-[#0F172A] text-sm" style={{ fontWeight: 700 }}>Activity Timeline</h2>
            <p className="text-xs text-gray-400">Recent system events visualized chronologically.</p>
          </div>
        </div>
        <div className="p-5 sm:p-6">
          <div className="relative pl-6">
            <div className="absolute left-[11px] top-3 bottom-3 w-px bg-gray-200" />
            <div className="space-y-5">
              {TIMELINE_EVENTS.map((event, i) => {
                const Icon = event.icon;
                return (
                  <div key={`tl-${i}`} className="relative">
                    <div
                      className="absolute -left-6 top-1 w-[22px] h-[22px] rounded-full flex items-center justify-center border-2 border-white"
                      style={{ backgroundColor: event.color }}
                    >
                      <Icon className="w-3 h-3 text-white" />
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 ml-2 hover:bg-gray-100/80 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                        <span className="text-sm text-gray-800" style={{ fontWeight: 600 }}>{event.action}</span>
                        <span className="text-[11px] text-gray-400 flex items-center gap-1 shrink-0">
                          <Clock className="w-3 h-3" /> {event.timestamp}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{event.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Activity Detail Panel ─── */}
      <ActivityDetailPanel log={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  );
}

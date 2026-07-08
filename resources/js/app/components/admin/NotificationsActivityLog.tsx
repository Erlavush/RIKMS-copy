import { useState, useMemo } from "react";
import { Link } from "react-router";
import {
  ChevronRight,
  ChevronLeft,
  Bell,
  FileText,
  ShieldCheck,
  Upload,
  CheckCircle2,
  XCircle,
  Archive,
  Pencil,
  Search,
  Clock,
  X,
  AlertTriangle,
  Globe,
  Info,
} from "lucide-react";

/* ──────────── Types ──────────── */

type NotifCategory = "all" | "unread" | "access-requests" | "research-updates" | "system-alerts";

interface Notification {
  id: number;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  message: string;
  detail?: string;
  timestamp: string;
  read: boolean;
  category: Exclude<NotifCategory, "all" | "unread">;
}

type ActivityType =
  | "Research Uploaded"
  | "Metadata Updated"
  | "Research Published"
  | "Access Request Approved"
  | "Access Request Denied"
  | "Research Archived";

type ActivityStatus = "Completed" | "Pending" | "Failed";

interface ActivityEntry {
  id: number;
  user: string;
  action: ActivityType;
  researchTitle: string;
  dateTime: string;
  status: ActivityStatus;
  notes?: string;
}

/* ──────────── Mock Data ──────────── */

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 1, icon: ShieldCheck, iconColor: "#D97706", iconBg: "#FEF3C7", message: 'New access request for "Climate Adaptation in Davao Agriculture"', detail: "Requester: Juan Dela Cruz (usep.edu.ph)", timestamp: "2 hours ago", read: false, category: "access-requests" },
  { id: 2, icon: CheckCircle2, iconColor: "#16A34A", iconBg: "#DCFCE7", message: 'Research "Public Health Response Framework" successfully published', timestamp: "5 hours ago", read: false, category: "research-updates" },
  { id: 3, icon: Pencil, iconColor: "#1E3A8A", iconBg: "#DBEAFE", message: 'Metadata updated for "Digital Literacy Programs and Rural Education"', timestamp: "8 hours ago", read: false, category: "research-updates" },
  { id: 4, icon: CheckCircle2, iconColor: "#16A34A", iconBg: "#DCFCE7", message: "Download access approved for Maria Santos", detail: "Research: Impact of Climate Change on Coastal Communities", timestamp: "1 day ago", read: true, category: "access-requests" },
  { id: 5, icon: AlertTriangle, iconColor: "#DC2626", iconBg: "#FEE2E2", message: "System maintenance scheduled for March 10, 2026", detail: "The system will be unavailable from 2:00 AM to 4:00 AM PST.", timestamp: "1 day ago", read: true, category: "system-alerts" },
  { id: 6, icon: ShieldCheck, iconColor: "#D97706", iconBg: "#FEF3C7", message: 'New access request for "Sustainable Agriculture Practices"', detail: "Requester: Elena Torres (dost.gov.ph)", timestamp: "2 days ago", read: true, category: "access-requests" },
  { id: 7, icon: Upload, iconColor: "#7C3AED", iconBg: "#EDE9FE", message: 'Research "Indigenous Knowledge Systems in DRR" uploaded successfully', timestamp: "2 days ago", read: true, category: "research-updates" },
  { id: 8, icon: Globe, iconColor: "#1E3A8A", iconBg: "#DBEAFE", message: 'Research "Economic Impact of Digital Transformation" published', timestamp: "3 days ago", read: true, category: "research-updates" },
  { id: 9, icon: XCircle, iconColor: "#DC2626", iconBg: "#FEE2E2", message: "Access request denied for Carlos Tan", detail: "Insufficient justification provided.", timestamp: "3 days ago", read: true, category: "access-requests" },
  { id: 10, icon: Info, iconColor: "#0284C7", iconBg: "#E0F2FE", message: "RIKMS v2.1 update available — new analytics features", timestamp: "4 days ago", read: true, category: "system-alerts" },
];

const MOCK_ACTIVITIES: ActivityEntry[] = [
  { id: 1, user: "Agency Admin", action: "Research Uploaded", researchTitle: "Sustainable Agriculture Practices in Davao Region", dateTime: "2026-03-05T10:45:00", status: "Completed" },
  { id: 2, user: "Agency Admin", action: "Metadata Updated", researchTitle: "Impact of Climate Change on Coastal Communities", dateTime: "2026-03-04T15:30:00", status: "Completed", notes: "Updated SDG tags and keywords." },
  { id: 3, user: "Agency Admin", action: "Research Published", researchTitle: "Public Health Response Framework for Emerging Infectious Diseases", dateTime: "2026-03-04T09:15:00", status: "Completed" },
  { id: 4, user: "Agency Admin", action: "Access Request Approved", researchTitle: "Climate Adaptation in Davao Agriculture", dateTime: "2026-03-03T14:20:00", status: "Completed", notes: "Approved for Maria Santos." },
  { id: 5, user: "Agency Admin", action: "Access Request Denied", researchTitle: "Indigenous Knowledge Systems in Disaster Risk Reduction", dateTime: "2026-03-03T11:00:00", status: "Completed", notes: "Requester did not provide purpose." },
  { id: 6, user: "Agency Admin", action: "Research Archived", researchTitle: "Early Warning Systems for Typhoon-Prone Communities", dateTime: "2026-03-02T16:45:00", status: "Completed" },
  { id: 7, user: "Agency Admin", action: "Research Uploaded", researchTitle: "Economic Impact of Digital Transformation on MSMEs", dateTime: "2026-03-02T08:30:00", status: "Completed" },
  { id: 8, user: "Agency Admin", action: "Metadata Updated", researchTitle: "Digital Literacy Programs and Rural Education Outcomes", dateTime: "2026-03-01T13:15:00", status: "Completed", notes: "Added co-authors." },
  { id: 9, user: "Agency Admin", action: "Research Published", researchTitle: "Community-Based Tuberculosis Prevention in Urban Poor Areas", dateTime: "2026-02-28T10:00:00", status: "Completed" },
  { id: 10, user: "Agency Admin", action: "Access Request Approved", researchTitle: "Sustainable Agriculture Practices in Davao Region", dateTime: "2026-02-27T09:45:00", status: "Completed", notes: "Approved for Pedro Villanueva." },
  { id: 11, user: "Agency Admin", action: "Research Uploaded", researchTitle: "Water Quality Monitoring in Davao Gulf", dateTime: "2026-02-26T14:30:00", status: "Completed" },
  { id: 12, user: "Agency Admin", action: "Metadata Updated", researchTitle: "Renewable Energy Adoption in Rural Mindanao", dateTime: "2026-02-25T11:20:00", status: "Completed" },
];

/* ──────────── Helpers ──────────── */

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
    " – " +
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
  );
}

const ACTIVITY_ICON: Record<ActivityType, { icon: React.ElementType; color: string; bg: string }> = {
  "Research Uploaded": { icon: Upload, color: "#7C3AED", bg: "#EDE9FE" },
  "Metadata Updated": { icon: Pencil, color: "#1E3A8A", bg: "#DBEAFE" },
  "Research Published": { icon: Globe, color: "#16A34A", bg: "#DCFCE7" },
  "Access Request Approved": { icon: CheckCircle2, color: "#16A34A", bg: "#DCFCE7" },
  "Access Request Denied": { icon: XCircle, color: "#DC2626", bg: "#FEE2E2" },
  "Research Archived": { icon: Archive, color: "#6B7280", bg: "#F3F4F6" },
};

function StatusBadge({ status }: { status: ActivityStatus }) {
  const cls: Record<ActivityStatus, string> = {
    Completed: "bg-green-50 text-green-700 border-green-200",
    Pending: "bg-amber-50 text-amber-700 border-amber-200",
    Failed: "bg-red-50 text-red-600 border-red-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border ${cls[status]}`}
      style={{ fontWeight: 500 }}
    >
      {status}
    </span>
  );
}

const NOTIF_FILTERS: { id: NotifCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "access-requests", label: "Access Requests" },
  { id: "research-updates", label: "Research Updates" },
  { id: "system-alerts", label: "System Alerts" },
];

const ACTIVITY_TYPES: ActivityType[] = [
  "Research Uploaded",
  "Metadata Updated",
  "Research Published",
  "Access Request Approved",
  "Access Request Denied",
  "Research Archived",
];

/* ──────────── Component ──────────── */

export function NotificationsActivityLog() {
  /* Notifications state */
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [notifFilter, setNotifFilter] = useState<NotifCategory>("all");

  /* Activity log state */
  const [activitySearch, setActivitySearch] = useState("");
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  /* Detail modal */
  const [selectedActivity, setSelectedActivity] = useState<ActivityEntry | null>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifs = useMemo(() => {
    return notifications.filter((n) => {
      if (notifFilter === "all") return true;
      if (notifFilter === "unread") return !n.read;
      return n.category === notifFilter;
    });
  }, [notifications, notifFilter]);

  const filteredActivities = useMemo(() => {
    let list = MOCK_ACTIVITIES;
    if (activityTypeFilter !== "all") {
      list = list.filter((a) => a.action === activityTypeFilter);
    }
    if (activitySearch.trim()) {
      const q = activitySearch.toLowerCase();
      list = list.filter(
        (a) =>
          a.researchTitle.toLowerCase().includes(q) ||
          a.action.toLowerCase().includes(q) ||
          a.user.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activitySearch, activityTypeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredActivities.length / rowsPerPage));
  const paginatedActivities = filteredActivities.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const toggleRead = (id: number) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n)));
  };

  /* ──────────── Render ──────────── */
  return (
    <div className="space-y-8">
      {/* ── Activity Detail Modal ── */}
      {selectedActivity && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[90]" onClick={() => setSelectedActivity(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] w-[calc(100%-2rem)] max-w-lg bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-[#1E3A8A]" style={{ fontSize: "1rem", fontWeight: 700 }}>
                Activity Details
              </h3>
              <button
                onClick={() => setSelectedActivity(null)}
                className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {(() => {
                const cfg = ACTIVITY_ICON[selectedActivity.action];
                const Icon = cfg.icon;
                return (
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0"
                      style={{ backgroundColor: cfg.bg }}
                    >
                      <Icon className="w-5 h-5" style={{ color: cfg.color }} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-800" style={{ fontWeight: 600 }}>
                        {selectedActivity.action}
                      </p>
                      <StatusBadge status={selectedActivity.status} />
                    </div>
                  </div>
                );
              })()}
              <div className="space-y-3 border-t border-gray-100 pt-4">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">User</p>
                  <p className="text-sm text-gray-800" style={{ fontWeight: 500 }}>
                    {selectedActivity.user}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Action Performed</p>
                  <p className="text-sm text-gray-800" style={{ fontWeight: 500 }}>
                    {selectedActivity.action}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Research Title</p>
                  <p className="text-sm text-gray-800" style={{ fontWeight: 500 }}>
                    {selectedActivity.researchTitle}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Date & Time</p>
                  <p className="text-sm text-gray-800" style={{ fontWeight: 500 }}>
                    {formatDateTime(selectedActivity.dateTime)}
                  </p>
                </div>
                {selectedActivity.notes && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Additional Notes</p>
                    <p className="text-sm text-gray-600">{selectedActivity.notes}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedActivity(null)}
                className="px-4 py-2 text-sm bg-[#1E3A8A] text-white rounded-[10px] hover:bg-[#1E3A8A]/90 transition-colors"
                style={{ fontWeight: 500 }}
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-500 flex-wrap">
        <Link to="/agency/dashboard" className="hover:text-[#1E3A8A] transition-colors">
          Agency
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-[#1E3A8A]" style={{ fontWeight: 500 }}>
          Notifications
        </span>
      </nav>

      {/* ── Page Header ── */}
      <div>
        <h1 className="text-[#1E3A8A] mb-1" style={{ fontSize: "1.5rem", fontWeight: 700 }}>
          Notifications & Activity Log
        </h1>
        <p className="text-[#6B7280] text-sm">
          Track system notifications and activities related to your agency's research repository.
        </p>
      </div>

      {/* ════════════════════════════════════════════════
          SECTION 1 – NOTIFICATIONS FEED (full-width)
         ════════════════════════════════════════════════ */}
      <section className="bg-white rounded-[10px] border border-gray-200 shadow-sm overflow-hidden">
        {/* Header row */}
        <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[10px] bg-[#1E3A8A]/10 flex items-center justify-center">
              <Bell className="w-4 h-4 text-[#1E3A8A]" />
            </div>
            <h2 className="text-[#1E3A8A]" style={{ fontSize: "0.95rem", fontWeight: 700 }}>
              Notifications
            </h2>
            {unreadCount > 0 && (
              <span
                className="px-2 py-0.5 bg-red-500 text-white text-[10px] rounded-full"
                style={{ fontWeight: 600 }}
              >
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-[#1E3A8A] hover:underline transition-colors"
              style={{ fontWeight: 500 }}
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="px-5 sm:px-6 py-3 border-b border-gray-100 overflow-x-auto">
          <div className="flex items-center gap-1.5 min-w-max">
            {NOTIF_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setNotifFilter(f.id)}
                className={`px-3.5 py-1.5 rounded-[10px] text-xs transition-colors ${
                  notifFilter === f.id
                    ? "bg-[#1E3A8A] text-white shadow-sm"
                    : "bg-[#F9FAFB] text-gray-600 hover:bg-gray-100"
                }`}
                style={{ fontWeight: 500 }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notification list — scrollable max-height */}
        <div className="max-h-[500px] overflow-y-auto">
          {filteredNotifs.length === 0 ? (
            <div className="py-16 text-center">
              <Bell className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400" style={{ fontWeight: 500 }}>
                No notifications found.
              </p>
              <p className="text-xs text-gray-300 mt-1">Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filteredNotifs.map((n) => {
                const Icon = n.icon;
                return (
                  <button
                    key={n.id}
                    onClick={() => toggleRead(n.id)}
                    className={`w-full flex items-start gap-3 sm:gap-4 px-5 sm:px-6 py-4 text-left transition-all hover:shadow-[0_1px_4px_rgba(0,0,0,0.04)] ${
                      !n.read ? "bg-[#1E3A8A]/[0.03]" : "bg-white"
                    }`}
                  >
                    {/* Unread indicator */}
                    <div className="pt-1.5 shrink-0 w-2.5">
                      {!n.read && <div className="w-2.5 h-2.5 rounded-full bg-[#1E3A8A]" />}
                    </div>

                    {/* Category icon */}
                    <div
                      className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0"
                      style={{ backgroundColor: n.iconBg }}
                    >
                      <Icon className="w-[18px] h-[18px]" style={{ color: n.iconColor }} />
                    </div>

                    {/* Message body */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm leading-snug ${!n.read ? "text-gray-800" : "text-gray-600"}`}
                        style={{ fontWeight: !n.read ? 500 : 400 }}
                      >
                        {n.message}
                      </p>
                      {n.detail && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{n.detail}</p>
                      )}
                    </div>

                    {/* Timestamp — aligned right on wider screens */}
                    <span className="hidden sm:flex items-center gap-1 text-[11px] text-gray-400 shrink-0 pt-0.5 whitespace-nowrap">
                      <Clock className="w-3 h-3" />
                      {n.timestamp}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          SECTION 2 – ACTIVITY LOG (full-width, below)
         ════════════════════════════════════════════════ */}
      <section className="bg-white rounded-[10px] border border-gray-200 shadow-sm overflow-hidden">
        {/* Header + controls */}
        <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[10px] bg-[#1E3A8A]/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-[#1E3A8A]" />
            </div>
            <h2 className="text-[#1E3A8A]" style={{ fontSize: "0.95rem", fontWeight: 700 }}>
              Activity Log
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={activitySearch}
                onChange={(e) => {
                  setActivitySearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search activity log..."
                className="w-full sm:w-56 pl-10 pr-4 py-2 bg-[#F9FAFB] border border-gray-200 rounded-[10px] text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]/40"
              />
            </div>
            {/* Type filter */}
            <select
              value={activityTypeFilter}
              onChange={(e) => {
                setActivityTypeFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-[#F9FAFB] border border-gray-200 rounded-[10px] text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 shrink-0"
            >
              <option value="all">All Activity Types</option>
              {ACTIVITY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Desktop / Tablet table (scrollable on tablet) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 500 }}>
                  User
                </th>
                <th className="text-left px-4 py-3 text-xs text-gray-500" style={{ fontWeight: 500 }}>
                  Action
                </th>
                <th className="text-left px-4 py-3 text-xs text-gray-500" style={{ fontWeight: 500 }}>
                  Research Title
                </th>
                <th className="text-left px-4 py-3 text-xs text-gray-500" style={{ fontWeight: 500 }}>
                  Date & Time
                </th>
                <th className="text-left px-4 py-3 text-xs text-gray-500" style={{ fontWeight: 500 }}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedActivities.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-sm text-gray-400">
                    No activity records found.
                  </td>
                </tr>
              ) : (
                paginatedActivities.map((a) => {
                  const cfg = ACTIVITY_ICON[a.action];
                  const Icon = cfg.icon;
                  return (
                    <tr
                      key={a.id}
                      onClick={() => setSelectedActivity(a)}
                      className="border-b border-gray-50 hover:bg-[#F9FAFB] transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-3.5 text-gray-700 whitespace-nowrap" style={{ fontWeight: 500 }}>
                        {a.user}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                            style={{ backgroundColor: cfg.bg }}
                          >
                            <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                          </div>
                          <span className="text-gray-700 text-xs whitespace-nowrap" style={{ fontWeight: 500 }}>
                            {a.action}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-gray-500 max-w-[280px]">
                        <span className="block truncate">{a.researchTitle}</span>
                      </td>
                      <td className="px-4 py-3.5 text-gray-500 text-xs whitespace-nowrap">
                        {formatDateTime(a.dateTime)}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={a.status} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile stacked cards */}
        <div className="sm:hidden divide-y divide-gray-50">
          {paginatedActivities.length === 0 ? (
            <div className="py-16 text-center">
              <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400" style={{ fontWeight: 500 }}>
                No activity records found.
              </p>
            </div>
          ) : (
            paginatedActivities.map((a) => {
              const cfg = ACTIVITY_ICON[a.action];
              const Icon = cfg.icon;
              return (
                <button
                  key={a.id}
                  onClick={() => setSelectedActivity(a)}
                  className="w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0"
                      style={{ backgroundColor: cfg.bg }}
                    >
                      <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs text-gray-700" style={{ fontWeight: 600 }}>
                          {a.action}
                        </span>
                        <StatusBadge status={a.status} />
                      </div>
                      <p className="text-sm text-gray-600 truncate">{a.researchTitle}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <p className="text-[11px] text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDateTime(a.dateTime)}
                        </p>
                        <span className="text-[11px] text-gray-400">{a.user}</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Pagination */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setPage(1);
              }}
              className="px-2 py-1 bg-[#F9FAFB] border border-gray-200 rounded-md text-xs focus:outline-none"
            >
              {[5, 10, 20].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span className="ml-2">
              {filteredActivities.length === 0
                ? "0 results"
                : `${(page - 1) * rowsPerPage + 1}–${Math.min(
                    page * rowsPerPage,
                    filteredActivities.length
                  )} of ${filteredActivities.length}`}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-[10px] hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              style={{ fontWeight: 500 }}
            >
              <ChevronLeft className="w-3 h-3" /> Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-[10px] text-xs transition-colors ${
                  page === p
                    ? "bg-[#1E3A8A] text-white shadow-sm"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
                style={{ fontWeight: 500 }}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-[10px] hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              style={{ fontWeight: 500 }}
            >
              Next <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router";
import {
  Archive,
  Search,
  Download,
  RotateCcw,
  Trash2,
  Building2,
  Calendar,
  Eye,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Users,
  X,
  Info,
  Clock,
  User,
  Shield,
  ArrowUpDown,
} from "lucide-react";

/* ═══════════════════════════════════════════ */
/* ─── Types ─── */
/* ═══════════════════════════════════════════ */
type TabKey = "research" | "agencies" | "users";
type SortKey = "newest" | "oldest";

interface ArchivedResearch {
  id: number;
  title: string;
  agency: string;
  authors: string;
  publicationYear: string;
  archivedBy: string;
  archiveDate: string;
  status: "Archived" | "Pending Deletion";
}

interface ArchivedAgency {
  id: number;
  name: string;
  shortName: string;
  logoColor: string;
  logoBg: string;
  archivedBy: string;
  archiveDate: string;
}

interface ArchivedUser {
  id: number;
  name: string;
  email: string;
  role: string;
  agency: string;
  archivedBy: string;
  archiveDate: string;
}

interface TimelineEntry {
  id: number;
  action: "archived" | "restored" | "deleted";
  resourceType: "Research" | "Agency" | "User";
  resourceName: string;
  user: string;
  timestamp: string;
}

/* ═══════════════════════════════════════════ */
/* ─── Mock Data ─── */
/* ═══════════════════════════════════════════ */
const ARCHIVED_RESEARCH: ArchivedResearch[] = [
  { id: 1, title: "Outdated Report on Water Supply Systems in Davao del Sur", agency: "SMAARRDEC", authors: "Dr. Pedro Villanueva, Dr. Ana Reyes", publicationYear: "2021", archivedBy: "Dr. Pedro Villanueva", archiveDate: "Feb 28, 2026", status: "Archived" },
  { id: 2, title: "Preliminary Assessment of ICT Infrastructure – 2020 Edition", agency: "DICT XI", authors: "Eng. Rafael Domingo", publicationYear: "2020", archivedBy: "Eng. Rafael Domingo", archiveDate: "Feb 15, 2026", status: "Archived" },
  { id: 3, title: "Duplicate Submission: Economic Impact Study v1", agency: "DTI XI", authors: "Dr. Antonio Mendoza, Maria Santos", publicationYear: "2024", archivedBy: "System", archiveDate: "Feb 10, 2026", status: "Archived" },
  { id: 4, title: "Retracted: Unverified Agricultural Data Report", agency: "SMAARRDEC", authors: "Dr. Jose Morales", publicationYear: "2023", archivedBy: "Super Admin", archiveDate: "Jan 28, 2026", status: "Pending Deletion" },
  { id: 5, title: "Expired Partnership Agreement – Research Collaboration MOU", agency: "RHRDC XI", authors: "Dr. Isabella Cruz", publicationYear: "2022", archivedBy: "System", archiveDate: "Jan 15, 2026", status: "Archived" },
  { id: 6, title: "Old Geospatial Data Visualization Report", agency: "NEDA XI", authors: "Dr. Teresa Mendez, Carlo Reyes", publicationYear: "2020", archivedBy: "Dr. Teresa Mendez", archiveDate: "Dec 20, 2025", status: "Archived" },
  { id: 7, title: "Duplicate: Digital Literacy Baseline Study", agency: "CHED XI", authors: "Prof. Roberto Garcia", publicationYear: "2023", archivedBy: "System", archiveDate: "Dec 10, 2025", status: "Archived" },
  { id: 8, title: "Preliminary Survey on Renewable Energy Adoption in Davao", agency: "DOST XI", authors: "Sofia Magsaysay, Leo Tanaka", publicationYear: "2021", archivedBy: "Sofia Magsaysay", archiveDate: "Nov 25, 2025", status: "Archived" },
];

const ARCHIVED_AGENCIES: ArchivedAgency[] = [
  { id: 1, name: "Former Regional Research Partner Office", shortName: "FRRPO", logoColor: "#D97706", logoBg: "#FEF3C7", archivedBy: "Super Admin", archiveDate: "Jan 5, 2026" },
  { id: 2, name: "Davao Regional Science Hub (Legacy)", shortName: "DRSH", logoColor: "#7C3AED", logoBg: "#EDE9FE", archivedBy: "Super Admin", archiveDate: "Nov 18, 2025" },
  { id: 3, name: "Mindanao Research Coordination Office", shortName: "MRCO", logoColor: "#DC2626", logoBg: "#FEE2E2", archivedBy: "Juan Dela Cruz", archiveDate: "Oct 2, 2025" },
];

const ARCHIVED_USERS: ArchivedUser[] = [
  { id: 1, name: "Mark Aquino", email: "m.aquino@drieerdc.gov.ph", role: "Data Manager", agency: "DRIEERDC", archivedBy: "Super Admin", archiveDate: "Feb 20, 2026" },
  { id: 2, name: "Ramon Torres", email: "r.torres@rikms.gov.ph", role: "Auditor", agency: "System", archivedBy: "Super Admin", archiveDate: "Feb 1, 2026" },
  { id: 3, name: "Elena Pascual", email: "e.pascual@frrpo.gov.ph", role: "Agency Administrator", agency: "FRRPO", archivedBy: "System", archiveDate: "Jan 5, 2026" },
  { id: 4, name: "David Santos", email: "d.santos@drsh.gov.ph", role: "Data Manager", agency: "DRSH", archivedBy: "System", archiveDate: "Nov 18, 2025" },
  { id: 5, name: "Carmen Reyes", email: "c.reyes@mrco.gov.ph", role: "Agency Administrator", agency: "MRCO", archivedBy: "Juan Dela Cruz", archiveDate: "Oct 2, 2025" },
];

const TIMELINE_ENTRIES: TimelineEntry[] = [
  { id: 1, action: "archived", resourceType: "Research", resourceName: "Outdated Report on Water Supply Systems", user: "Dr. Pedro Villanueva", timestamp: "Feb 28, 2026 – 03:45 PM" },
  { id: 2, action: "restored", resourceType: "Research", resourceName: "Davao Health Survey 2024", user: "Super Admin", timestamp: "Feb 25, 2026 – 10:12 AM" },
  { id: 3, action: "archived", resourceType: "Research", resourceName: "Preliminary Assessment of ICT Infrastructure", user: "Eng. Rafael Domingo", timestamp: "Feb 15, 2026 – 02:30 PM" },
  { id: 4, action: "archived", resourceType: "User", resourceName: "Mark Aquino", user: "Super Admin", timestamp: "Feb 20, 2026 – 11:00 AM" },
  { id: 5, action: "deleted", resourceType: "Research", resourceName: "Obsolete Census Data Report 2019", user: "Super Admin", timestamp: "Feb 12, 2026 – 09:15 AM" },
  { id: 6, action: "archived", resourceType: "Research", resourceName: "Duplicate Submission: Economic Impact Study v1", user: "System", timestamp: "Feb 10, 2026 – 08:00 AM" },
  { id: 7, action: "archived", resourceType: "Agency", resourceName: "Former Regional Research Partner Office", user: "Super Admin", timestamp: "Jan 5, 2026 – 04:20 PM" },
  { id: 8, action: "restored", resourceType: "User", resourceName: "Dr. Lucia Bautista", user: "Super Admin", timestamp: "Jan 3, 2026 – 01:45 PM" },
  { id: 9, action: "archived", resourceType: "Research", resourceName: "Old Geospatial Data Visualization Report", user: "Dr. Teresa Mendez", timestamp: "Dec 20, 2025 – 11:30 AM" },
  { id: 10, action: "archived", resourceType: "Agency", resourceName: "Davao Regional Science Hub (Legacy)", user: "Super Admin", timestamp: "Nov 18, 2025 – 09:00 AM" },
];

const ALL_AGENCIES = [...new Set([...ARCHIVED_RESEARCH.map((r) => r.agency), ...ARCHIVED_USERS.map((u) => u.agency)])];

/* ═══════════════════════════════════════════ */
/* ─── Toast ─── */
/* ═══════════════════════════════════════════ */
function Toast({ message, visible, onHide }: { message: string; visible: boolean; onHide: () => void }) {
  useEffect(() => {
    if (visible) {
      const t = setTimeout(onHide, 3500);
      return () => clearTimeout(t);
    }
  }, [visible, onHide]);
  if (!visible) return null;
  return (
    <div className="fixed top-6 right-6 z-[100]" style={{ animation: "sa-slide-in 0.3s ease-out" }}>
      <div className="bg-white border border-green-200 shadow-lg rounded-xl px-5 py-3.5 flex items-center gap-3">
        <div className="w-7 h-7 rounded-full bg-green-50 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
        </div>
        <p className="text-sm text-gray-700" style={{ fontWeight: 500 }}>{message}</p>
        <button onClick={onHide} className="p-1 rounded hover:bg-gray-100 text-gray-400 ml-2 shrink-0">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════ */
/* ─── Confirmation Dialog ─── */
/* ═══════════════════════════════════════════ */
function ConfirmDialog({
  open, onClose, onConfirm, title, message, confirmLabel, danger,
}: {
  open: boolean; onClose: () => void; onConfirm: () => void;
  title: string; message: string; confirmLabel: string; danger?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[420px] relative z-10" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${danger ? "bg-red-50" : "bg-blue-50"}`}>
            {danger ? <AlertTriangle className="w-5 h-5 text-red-600" /> : <RotateCcw className="w-5 h-5 text-[#1E3A8A]" />}
          </div>
          <h2 className="text-[#0F172A]" style={{ fontSize: "1rem", fontWeight: 700 }}>{title}</h2>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-5 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors" style={{ fontWeight: 500 }}>
            Cancel
          </button>
          <button onClick={onConfirm} className={`px-5 py-2.5 text-sm text-white rounded-xl transition-colors shadow-sm ${danger ? "bg-red-600 hover:bg-red-700" : "bg-[#1E3A8A] hover:bg-[#1E3A8A]/90"}`} style={{ fontWeight: 600 }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════ */
/* ─── Status Badge ─── */
/* ═══════════════════════════════════════════ */
function StatusBadge({ status }: { status: string }) {
  const isArchived = status === "Archived";
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border ${
      isArchived ? "bg-gray-50 text-gray-500 border-gray-200" : "bg-red-50 text-red-600 border-red-200"
    }`} style={{ fontWeight: 600 }}>
      <span className={`w-1.5 h-1.5 rounded-full ${isArchived ? "bg-gray-400" : "bg-red-500"}`} />
      {status}
    </span>
  );
}

/* ═══════════════════════════════════════════ */
/* ─── Timeline Action Badge ─── */
/* ═══════════════════════════════════════════ */
function ActionBadge({ action }: { action: TimelineEntry["action"] }) {
  const config = {
    archived: { label: "Archived", color: "text-gray-600", bg: "bg-gray-100", border: "border-gray-200", dot: "bg-gray-400" },
    restored: { label: "Restored", color: "text-green-700", bg: "bg-green-50", border: "border-green-200", dot: "bg-green-500" },
    deleted: { label: "Deleted", color: "text-red-600", bg: "bg-red-50", border: "border-red-200", dot: "bg-red-500" },
  }[action];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border ${config.bg} ${config.color} ${config.border}`} style={{ fontWeight: 600 }}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

/* ═══════════════════════════════════════════ */
/* ─── Main Component ─── */
/* ═══════════════════════════════════════════ */
export function SAArchive() {
  const [activeTab, setActiveTab] = useState<TabKey>("research");
  const [search, setSearch] = useState("");
  const [filterAgency, setFilterAgency] = useState("All");
  const [sortOrder, setSortOrder] = useState<SortKey>("newest");

  // Pagination
  const [researchPage, setResearchPage] = useState(1);
  const [agencyPage, setAgencyPage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const PER_PAGE = 10;

  // Dialogs
  const [restoreDialog, setRestoreDialog] = useState<{ open: boolean; name: string; type: string }>({ open: false, name: "", type: "" });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; name: string; type: string }>({ open: false, name: "", type: "" });

  // Toast
  const [toast, setToast] = useState({ visible: false, message: "" });
  const showToast = useCallback((msg: string) => setToast({ visible: true, message: msg }), []);
  const hideToast = useCallback(() => setToast({ visible: false, message: "" }), []);

  const TABS: { key: TabKey; label: string; icon: any; count: number }[] = [
    { key: "research", label: "Archived Research", icon: FileText, count: ARCHIVED_RESEARCH.length },
    { key: "agencies", label: "Archived Agencies", icon: Building2, count: ARCHIVED_AGENCIES.length },
    { key: "users", label: "Archived Users", icon: Users, count: ARCHIVED_USERS.length },
  ];

  // Filter research
  const filteredResearch = ARCHIVED_RESEARCH.filter((r) => {
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase()) || r.authors.toLowerCase().includes(search.toLowerCase());
    const matchAgency = filterAgency === "All" || r.agency === filterAgency;
    return matchSearch && matchAgency;
  });
  const researchTotalPages = Math.ceil(filteredResearch.length / PER_PAGE);
  const paginatedResearch = filteredResearch.slice((researchPage - 1) * PER_PAGE, researchPage * PER_PAGE);

  // Filter agencies
  const filteredAgencies = ARCHIVED_AGENCIES.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()) || a.shortName.toLowerCase().includes(search.toLowerCase())
  );
  const agencyTotalPages = Math.ceil(filteredAgencies.length / PER_PAGE);
  const paginatedAgencies = filteredAgencies.slice((agencyPage - 1) * PER_PAGE, agencyPage * PER_PAGE);

  // Filter users
  const filteredUsersList = ARCHIVED_USERS.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchAgency = filterAgency === "All" || u.agency === filterAgency;
    return matchSearch && matchAgency;
  });
  const userTotalPages = Math.ceil(filteredUsersList.length / PER_PAGE);
  const paginatedUsersList = filteredUsersList.slice((userPage - 1) * PER_PAGE, userPage * PER_PAGE);

  // Stats
  const recentlyRestored = TIMELINE_ENTRIES.filter((e) => e.action === "restored").length;

  return (
    <div className="space-y-6 max-w-[1376px]">
      {/* ─── Toast ─── */}
      <Toast message={toast.message} visible={toast.visible} onHide={hideToast} />

      {/* ─── Dialogs ─── */}
      <ConfirmDialog
        open={restoreDialog.open}
        onClose={() => setRestoreDialog({ open: false, name: "", type: "" })}
        onConfirm={() => {
          showToast(`${restoreDialog.type} "${restoreDialog.name}" has been restored successfully.`);
          setRestoreDialog({ open: false, name: "", type: "" });
        }}
        title={`Restore ${restoreDialog.type} Record`}
        message={`This will restore the ${restoreDialog.type.toLowerCase()} record to the active repository.`}
        confirmLabel="Restore"
      />
      <ConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, name: "", type: "" })}
        onConfirm={() => {
          showToast(`${deleteDialog.type} "${deleteDialog.name}" has been permanently deleted.`);
          setDeleteDialog({ open: false, name: "", type: "" });
        }}
        title="Permanent Deletion"
        message={`This action will permanently remove the ${deleteDialog.type.toLowerCase()} record and cannot be undone.`}
        confirmLabel="Delete Permanently"
        danger
      />

      {/* ─── Page Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[#0F172A] mb-1" style={{ fontSize: "1.5rem", fontWeight: 700 }}>
            Archive & Data Recovery
          </h1>
          <p className="text-[#6B7280] text-sm">
            View, restore, or permanently delete archived system records.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50 transition-colors self-start shadow-sm" style={{ fontWeight: 500 }}>
          <Download className="w-4 h-4" /> Export Archive Report
        </button>
      </div>

      {/* ─── Data Recovery Warning ─── */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3.5 flex items-center gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
        <p className="text-xs text-amber-700 flex-1" style={{ fontWeight: 500 }}>
          Archived records can be restored at any time unless permanently deleted.
          Permanent deletion actions are logged in the system activity logs.{" "}
          <Link to="/admin/activity" className="text-[#1E3A8A] hover:underline" style={{ fontWeight: 600 }}>
            View Activity Logs
          </Link>
        </p>
      </div>

      {/* ─── Stats ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Archived Research Records", value: ARCHIVED_RESEARCH.length, icon: FileText, color: "#1E3A8A", bg: "#DBEAFE" },
          { label: "Archived Agencies", value: ARCHIVED_AGENCIES.length, icon: Building2, color: "#7C3AED", bg: "#EDE9FE" },
          { label: "Archived User Accounts", value: ARCHIVED_USERS.length, icon: Users, color: "#D97706", bg: "#FEF3C7" },
          { label: "Recently Restored", value: recentlyRestored, icon: RotateCcw, color: "#16A34A", bg: "#DCFCE7" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={`stat-${s.label}`} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: s.bg }}>
                <Icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-xl text-gray-800" style={{ fontWeight: 700 }}>{s.value}</p>
                <p className="text-xs text-gray-500" style={{ fontWeight: 500 }}>{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Archive Tabs ─── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Tab bar */}
        <div className="px-5 sm:px-6 border-b border-gray-100 overflow-x-auto">
          <div className="flex items-center gap-1 min-w-max -mb-px">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={`tab-${tab.key}`}
                  onClick={() => { setActiveTab(tab.key); setSearch(""); setFilterAgency("All"); }}
                  className={`flex items-center gap-2 px-4 py-3.5 text-sm border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.key
                      ? "border-[#1E3A8A] text-[#1E3A8A]"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                  style={{ fontWeight: activeTab === tab.key ? 700 : 500 }}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.key ? "bg-[#1E3A8A]/10 text-[#1E3A8A]" : "bg-gray-100 text-gray-400"
                  }`} style={{ fontWeight: 600 }}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search & Filters */}
        <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search archived records..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setResearchPage(1); setAgencyPage(1); setUserPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {activeTab !== "agencies" && (
              <select
                value={filterAgency}
                onChange={(e) => { setFilterAgency(e.target.value); setResearchPage(1); setUserPage(1); }}
                className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 cursor-pointer"
              >
                <option value="All">All Agencies</option>
                {ALL_AGENCIES.map((a) => <option key={`fa-${a}`} value={a}>{a}</option>)}
              </select>
            )}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortKey)}
              className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 cursor-pointer"
            >
              <option value="newest">Newest Archived</option>
              <option value="oldest">Oldest Archived</option>
            </select>
          </div>
        </div>

        {/* ─── Tab 1: Archived Research ─── */}
        {activeTab === "research" && (
          <div>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/80">
                    <th className="text-left px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>Research Title</th>
                    <th className="text-left px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>Agency</th>
                    <th className="text-left px-6 py-3 text-xs text-gray-500 hidden xl:table-cell" style={{ fontWeight: 600 }}>Authors</th>
                    <th className="text-center px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>Year</th>
                    <th className="text-left px-6 py-3 text-xs text-gray-500 hidden lg:table-cell" style={{ fontWeight: 600 }}>Archived By</th>
                    <th className="text-left px-6 py-3 text-xs text-gray-500 hidden lg:table-cell" style={{ fontWeight: 600 }}>Archive Date</th>
                    <th className="text-center px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>Status</th>
                    <th className="text-right px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedResearch.map((item) => (
                    <tr key={`res-${item.id}`} className="hover:bg-gray-50/60 transition-colors group">
                      <td className="px-6 py-3.5 max-w-[280px]">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#1E3A8A]/5 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4 text-[#1E3A8A]" />
                          </div>
                          <span className="text-sm text-gray-800 line-clamp-2" style={{ fontWeight: 600 }}>{item.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="text-xs text-gray-600 flex items-center gap-1"><Building2 className="w-3 h-3 text-gray-400" />{item.agency}</span>
                      </td>
                      <td className="px-6 py-3.5 hidden xl:table-cell max-w-[200px]">
                        <span className="text-xs text-gray-500 line-clamp-1">{item.authors}</span>
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <span className="text-xs text-gray-600" style={{ fontWeight: 600 }}>{item.publicationYear}</span>
                      </td>
                      <td className="px-6 py-3.5 hidden lg:table-cell">
                        <span className="text-xs text-gray-500">{item.archivedBy}</span>
                      </td>
                      <td className="px-6 py-3.5 hidden lg:table-cell">
                        <span className="text-xs text-gray-500 flex items-center gap-1"><Calendar className="w-3 h-3 text-gray-400" />{item.archiveDate}</span>
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#1E3A8A] transition-colors" title="View Record">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setRestoreDialog({ open: true, name: item.title, type: "Research" })}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-[#1E3A8A] transition-colors"
                            title="Restore Research"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteDialog({ open: true, name: item.title, type: "Research" })}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                            title="Permanently Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {paginatedResearch.map((item) => (
                <div key={`mob-res-${item.id}`} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#1E3A8A]/5 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="w-5 h-5 text-[#1E3A8A]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 mb-1 line-clamp-2" style={{ fontWeight: 600 }}>{item.title}</p>
                      <div className="flex items-center gap-3 flex-wrap text-xs text-gray-400 mb-2">
                        <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{item.agency}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{item.archiveDate}</span>
                        <StatusBadge status={item.status} />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setRestoreDialog({ open: true, name: item.title, type: "Research" })}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-50 border border-blue-200 rounded-lg text-blue-700 hover:bg-blue-100 transition-colors"
                          style={{ fontWeight: 500 }}
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Restore
                        </button>
                        <button
                          onClick={() => setDeleteDialog({ open: true, name: item.title, type: "Research" })}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-50 border border-red-200 rounded-lg text-red-600 hover:bg-red-100 transition-colors"
                          style={{ fontWeight: 500 }}
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {researchTotalPages > 1 && (
              <PaginationBar current={researchPage} total={researchTotalPages} count={filteredResearch.length} onPage={setResearchPage} />
            )}
            {filteredResearch.length === 0 && <EmptyState />}
          </div>
        )}

        {/* ─── Tab 2: Archived Agencies ─── */}
        {activeTab === "agencies" && (
          <div>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/80">
                    <th className="text-left px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>Agency</th>
                    <th className="text-left px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>Short Name</th>
                    <th className="text-left px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>Archived By</th>
                    <th className="text-left px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>Archive Date</th>
                    <th className="text-right px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedAgencies.map((agency) => (
                    <tr key={`ag-${agency.id}`} className="hover:bg-gray-50/60 transition-colors group">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: agency.logoBg }}>
                            <Building2 className="w-4 h-4" style={{ color: agency.logoColor }} />
                          </div>
                          <span className="text-sm text-gray-800" style={{ fontWeight: 600 }}>{agency.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="text-xs text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg" style={{ fontWeight: 600 }}>{agency.shortName}</span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="text-xs text-gray-500">{agency.archivedBy}</span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="text-xs text-gray-500 flex items-center gap-1"><Calendar className="w-3 h-3 text-gray-400" />{agency.archiveDate}</span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setRestoreDialog({ open: true, name: agency.name, type: "Agency" })}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-[#1E3A8A] transition-colors"
                            title="Restore Agency"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteDialog({ open: true, name: agency.name, type: "Agency" })}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                            title="Delete Permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {paginatedAgencies.map((agency) => (
                <div key={`mob-ag-${agency.id}`} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: agency.logoBg }}>
                      <Building2 className="w-5 h-5" style={{ color: agency.logoColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 mb-0.5" style={{ fontWeight: 600 }}>{agency.name}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mb-2">
                        <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600" style={{ fontWeight: 600 }}>{agency.shortName}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{agency.archiveDate}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setRestoreDialog({ open: true, name: agency.name, type: "Agency" })}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-50 border border-blue-200 rounded-lg text-blue-700 hover:bg-blue-100 transition-colors"
                          style={{ fontWeight: 500 }}
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Restore
                        </button>
                        <button
                          onClick={() => setDeleteDialog({ open: true, name: agency.name, type: "Agency" })}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-50 border border-red-200 rounded-lg text-red-600 hover:bg-red-100 transition-colors"
                          style={{ fontWeight: 500 }}
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {agencyTotalPages > 1 && (
              <PaginationBar current={agencyPage} total={agencyTotalPages} count={filteredAgencies.length} onPage={setAgencyPage} />
            )}
            {filteredAgencies.length === 0 && <EmptyState />}
          </div>
        )}

        {/* ─── Tab 3: Archived Users ─── */}
        {activeTab === "users" && (
          <div>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/80">
                    <th className="text-left px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>User Name</th>
                    <th className="text-left px-6 py-3 text-xs text-gray-500 hidden xl:table-cell" style={{ fontWeight: 600 }}>Email</th>
                    <th className="text-left px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>Role</th>
                    <th className="text-left px-6 py-3 text-xs text-gray-500 hidden lg:table-cell" style={{ fontWeight: 600 }}>Agency</th>
                    <th className="text-left px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>Archived By</th>
                    <th className="text-left px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>Archive Date</th>
                    <th className="text-right px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedUsersList.map((user) => (
                    <tr key={`usr-${user.id}`} className="hover:bg-gray-50/60 transition-colors group">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-500" style={{ fontWeight: 700 }}>
                            {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </div>
                          <span className="text-sm text-gray-800" style={{ fontWeight: 600 }}>{user.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 hidden xl:table-cell">
                        <span className="text-xs text-gray-500">{user.email}</span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="text-xs text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200" style={{ fontWeight: 500 }}>{user.role}</span>
                      </td>
                      <td className="px-6 py-3.5 hidden lg:table-cell">
                        <span className="text-xs text-gray-600 flex items-center gap-1"><Building2 className="w-3 h-3 text-gray-400" />{user.agency}</span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="text-xs text-gray-500">{user.archivedBy}</span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="text-xs text-gray-500 flex items-center gap-1"><Calendar className="w-3 h-3 text-gray-400" />{user.archiveDate}</span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setRestoreDialog({ open: true, name: user.name, type: "User" })}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-[#1E3A8A] transition-colors"
                            title="Restore User"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteDialog({ open: true, name: user.name, type: "User" })}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                            title="Delete Permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {paginatedUsersList.map((user) => (
                <div key={`mob-usr-${user.id}`} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-500 shrink-0" style={{ fontWeight: 700 }}>
                      {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 mb-0.5" style={{ fontWeight: 600 }}>{user.name}</p>
                      <p className="text-xs text-gray-400 mb-1.5">{user.email}</p>
                      <div className="flex items-center gap-2 flex-wrap text-xs text-gray-400 mb-2">
                        <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600 border border-gray-200" style={{ fontWeight: 500 }}>{user.role}</span>
                        <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{user.agency}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{user.archiveDate}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setRestoreDialog({ open: true, name: user.name, type: "User" })}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-50 border border-blue-200 rounded-lg text-blue-700 hover:bg-blue-100 transition-colors"
                          style={{ fontWeight: 500 }}
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Restore
                        </button>
                        <button
                          onClick={() => setDeleteDialog({ open: true, name: user.name, type: "User" })}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-50 border border-red-200 rounded-lg text-red-600 hover:bg-red-100 transition-colors"
                          style={{ fontWeight: 500 }}
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {userTotalPages > 1 && (
              <PaginationBar current={userPage} total={userTotalPages} count={filteredUsersList.length} onPage={setUserPage} />
            )}
            {filteredUsersList.length === 0 && <EmptyState />}
          </div>
        )}
      </div>

      {/* ─── Archive Activity Timeline ─── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#1E3A8A]/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-[#1E3A8A]" />
            </div>
            <h2 className="text-sm text-[#0F172A]" style={{ fontWeight: 700 }}>Archive Activity Timeline</h2>
          </div>
          <Link to="/admin/activity" className="text-xs text-[#1E3A8A] hover:underline" style={{ fontWeight: 600 }}>
            View All Activity
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {TIMELINE_ENTRIES.slice(0, 8).map((entry, idx) => (
            <div key={`tl-${entry.id}`} className="px-6 py-3.5 flex items-center gap-4 hover:bg-gray-50/40 transition-colors">
              {/* Timeline dot + line */}
              <div className="flex flex-col items-center shrink-0 relative" style={{ width: 20 }}>
                <div className={`w-3 h-3 rounded-full border-2 ${
                  entry.action === "restored" ? "border-green-400 bg-green-100" :
                  entry.action === "deleted" ? "border-red-400 bg-red-100" :
                  "border-gray-300 bg-gray-100"
                }`} />
                {idx < Math.min(TIMELINE_ENTRIES.length, 8) - 1 && (
                  <div className="w-px h-full bg-gray-200 absolute top-3" style={{ minHeight: 28 }} />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <ActionBadge action={entry.action} />
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500" style={{ fontWeight: 500 }}>{entry.resourceType}</span>
                </div>
                <p className="text-sm text-gray-700 line-clamp-1" style={{ fontWeight: 500 }}>
                  {entry.resourceName}
                </p>
              </div>

              {/* Meta */}
              <div className="text-right shrink-0 hidden sm:block">
                <p className="text-xs text-gray-500" style={{ fontWeight: 500 }}>{entry.user}</p>
                <p className="text-[11px] text-gray-400">{entry.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Inline keyframe for toast animation */}
      <style>{`
        @keyframes sa-slide-in {
          from { opacity: 0; transform: translateX(60px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════ */
/* ─── Reusable Sub-components ─── */
/* ═══════════════════════════════════════════ */

function PaginationBar({ current, total, count, onPage }: { current: number; total: number; count: number; onPage: (p: number) => void }) {
  return (
    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
      <p className="text-xs text-gray-400">
        Showing {(current - 1) * 10 + 1}–{Math.min(current * 10, count)} of {count}
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPage(Math.max(1, current - 1))} disabled={current === 1} className={`p-1.5 rounded-lg ${current === 1 ? "text-gray-300" : "hover:bg-gray-100 text-gray-400"}`}>
          <ChevronLeft className="w-4 h-4" />
        </button>
        {Array.from({ length: total }, (_, i) => i + 1).map((p) => (
          <button key={`pg-${p}`} onClick={() => onPage(p)} className={`w-8 h-8 rounded-lg text-xs ${p === current ? "bg-[#1E3A8A] text-white" : "hover:bg-gray-100 text-gray-500"}`} style={{ fontWeight: p === current ? 600 : 400 }}>
            {p}
          </button>
        ))}
        <button onClick={() => onPage(Math.min(total, current + 1))} disabled={current === total} className={`p-1.5 rounded-lg ${current === total ? "text-gray-300" : "hover:bg-gray-100 text-gray-400"}`}>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="px-6 py-12 text-center">
      <Archive className="w-10 h-10 text-gray-300 mx-auto mb-3" />
      <p className="text-sm text-gray-500" style={{ fontWeight: 500 }}>No archived records found.</p>
      <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filters.</p>
    </div>
  );
}

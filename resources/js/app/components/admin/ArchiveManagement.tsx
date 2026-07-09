import { useState, useMemo } from "react";
import { Link } from "react-router";
import {
  ChevronRight,
  ChevronLeft,
  Search,
  Archive,
  RotateCcw,
  Trash2,
  X,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Upload,
  Eye,
  ChevronDown,
} from "lucide-react";

/* ──────────── Types ──────────── */

type ArchiveStatus = "Archived";
type PreviousStatus = "Draft" | "Published";

interface ArchivedResearch {
  id: number;
  title: string;
  authors: string[];
  publicationYear: number;
  category: string;
  archiveDate: string;
  archivedBy: string;
  status: ArchiveStatus;
  previousStatus: PreviousStatus;
}

interface ArchiveActivity {
  id: number;
  action: "archived" | "restored" | "deleted";
  title: string;
  user: string;
  dateTime: string;
}

/* ──────────── Mock Data ──────────── */

const MOCK_ARCHIVED: ArchivedResearch[] = [
  { id: 1, title: "Climate Adaptation Strategies in Davao Agriculture", authors: ["Juan Dela Cruz", "Maria Santos", "Pedro Villanueva"], publicationYear: 2024, category: "Agriculture & Food Security", archiveDate: "2026-03-06", archivedBy: "Agency Admin", status: "Archived", previousStatus: "Published" },
  { id: 2, title: "Early Warning Systems for Typhoon-Prone Communities", authors: ["Elena Torres", "Carlos Tan"], publicationYear: 2023, category: "Disaster Risk Reduction", archiveDate: "2026-03-04", archivedBy: "Agency Admin", status: "Archived", previousStatus: "Published" },
  { id: 3, title: "Marine Biodiversity Assessment in Davao Gulf", authors: ["Ana Reyes"], publicationYear: 2023, category: "Environment & Natural Resources", archiveDate: "2026-03-01", archivedBy: "Agency Admin", status: "Archived", previousStatus: "Draft" },
  { id: 4, title: "Water Quality Monitoring in Davao Gulf", authors: ["Roberto Garcia", "Liza Fernandez"], publicationYear: 2024, category: "Environment & Natural Resources", archiveDate: "2026-02-25", archivedBy: "Agency Admin", status: "Archived", previousStatus: "Published" },
  { id: 5, title: "Impact Assessment of MSME Digital Transformation", authors: ["Mark Anthony Cruz", "Jennifer Lee", "David Santos"], publicationYear: 2024, category: "Economic Development", archiveDate: "2026-02-20", archivedBy: "Agency Admin", status: "Archived", previousStatus: "Published" },
  { id: 6, title: "Indigenous Peoples Health Access in Remote Barangays", authors: ["Fatima Abdullah"], publicationYear: 2022, category: "Public Health", archiveDate: "2026-02-18", archivedBy: "Agency Admin", status: "Archived", previousStatus: "Draft" },
  { id: 7, title: "Renewable Energy Potential in Compostela Valley", authors: ["Ricardo Morales", "Angela Lim"], publicationYear: 2023, category: "Energy & Technology", archiveDate: "2026-02-10", archivedBy: "Agency Admin", status: "Archived", previousStatus: "Published" },
  { id: 8, title: "Urban Flooding Resilience in Davao City", authors: ["Josefina Tan", "Miguel Santos", "Elena Ramos"], publicationYear: 2024, category: "Disaster Risk Reduction", archiveDate: "2026-02-05", archivedBy: "Agency Admin", status: "Archived", previousStatus: "Published" },
];

const MOCK_ACTIVITIES: ArchiveActivity[] = [
  { id: 1, action: "archived", title: "Climate Adaptation Strategies in Davao Agriculture", user: "Agency Admin", dateTime: "2026-03-06T10:45:00" },
  { id: 2, action: "restored", title: "Public Health Response Framework", user: "Agency Admin", dateTime: "2026-03-05T14:30:00" },
  { id: 3, action: "archived", title: "Early Warning Systems for Typhoon-Prone Communities", user: "Agency Admin", dateTime: "2026-03-04T09:15:00" },
  { id: 4, action: "deleted", title: "Outdated Survey Data 2019", user: "Agency Admin", dateTime: "2026-03-03T16:00:00" },
  { id: 5, action: "archived", title: "Marine Biodiversity Assessment in Davao Gulf", user: "Agency Admin", dateTime: "2026-03-01T11:20:00" },
];

const CATEGORIES = [
  "All Categories",
  "Agriculture & Food Security",
  "Disaster Risk Reduction",
  "Environment & Natural Resources",
  "Economic Development",
  "Public Health",
  "Energy & Technology",
];

/* ──────────── Helpers ──────────── */

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
    " – " +
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
  );
}

function formatAuthors(authors: string[]) {
  if (authors.length <= 1) return authors[0] || "Unknown";
  return `${authors[0]} +${authors.length - 1}`;
}

/* ──────────── Component ──────────── */

export function ArchiveManagement() {
  const [records, setRecords] = useState(MOCK_ARCHIVED);
  const [activities, setActivities] = useState(MOCK_ACTIVITIES);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Modals
  const [restoreTarget, setRestoreTarget] = useState<ArchivedResearch | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ArchivedResearch | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const totalArchived = records.length;
  const recentlyArchived = records.filter((r) => {
    const days = (Date.now() - new Date(r.archiveDate).getTime()) / (1000 * 60 * 60 * 24);
    return days <= 7;
  }).length;
  const restoredCount = activities.filter((a) => a.action === "restored").length;

  const filtered = useMemo(() => {
    let list = [...records];
    if (categoryFilter !== "All Categories") {
      list = list.filter((r) => r.category === categoryFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.authors.some((a) => a.toLowerCase().includes(q)) ||
          r.category.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      const da = new Date(a.archiveDate).getTime();
      const db = new Date(b.archiveDate).getTime();
      return sortOrder === "newest" ? db - da : da - db;
    });
    return list;
  }, [records, search, categoryFilter, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const handleRestore = () => {
    if (!restoreTarget) return;
    setRecords((prev) => prev.filter((r) => r.id !== restoreTarget.id));
    setActivities((prev) => [
      { id: prev.length + 1, action: "restored", title: restoreTarget.title, user: "Agency Admin", dateTime: new Date().toISOString() },
      ...prev,
    ]);
    showToast(`"${restoreTarget.title}" has been restored to the active repository.`);
    setRestoreTarget(null);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setRecords((prev) => prev.filter((r) => r.id !== deleteTarget.id));
    setActivities((prev) => [
      { id: prev.length + 1, action: "deleted", title: deleteTarget.title, user: "Agency Admin", dateTime: new Date().toISOString() },
      ...prev,
    ]);
    showToast(`"${deleteTarget.title}" has been permanently deleted.`);
    setDeleteTarget(null);
  };

  const statCards = [
    { label: "Total Archived Research", value: totalArchived, icon: Archive, color: "#6B7280", bg: "#F3F4F6" },
    { label: "Recently Archived", value: recentlyArchived, icon: Clock, color: "#D97706", bg: "#FEF3C7" },
    { label: "Restored Research", value: restoredCount, icon: RotateCcw, color: "#16A34A", bg: "#DCFCE7" },
  ];

  const activityIcons: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
    archived: { icon: Archive, color: "#6B7280", bg: "#F3F4F6" },
    restored: { icon: RotateCcw, color: "#16A34A", bg: "#DCFCE7" },
    deleted: { icon: Trash2, color: "#DC2626", bg: "#FEE2E2" },
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-6 z-[100] bg-green-600 text-white px-5 py-3 rounded-[10px] shadow-lg flex items-center gap-2 text-sm animate-[fadeIn_0.2s_ease] max-w-md" style={{ fontWeight: 500 }}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="truncate">{toast}</span>
        </div>
      )}

      {/* Restore Modal */}
      {restoreTarget && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[90]" onClick={() => setRestoreTarget(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] w-[calc(100%-2rem)] max-w-md bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-[#1E3A8A]" style={{ fontSize: "1rem", fontWeight: 700 }}>Restore Research</h3>
              <button onClick={() => setRestoreTarget(null)} className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-[10px] bg-green-50 flex items-center justify-center shrink-0">
                  <RotateCcw className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-700" style={{ fontWeight: 500 }}>Restore this research record to the active repository?</p>
                  <p className="text-xs text-gray-400 mt-1">The research will be restored with its previous status: <span className="text-gray-600" style={{ fontWeight: 600 }}>{restoreTarget.previousStatus}</span></p>
                </div>
              </div>
              <div className="bg-[#F9FAFB] rounded-[10px] border border-gray-200 p-4">
                <p className="text-sm text-gray-800" style={{ fontWeight: 600 }}>{restoreTarget.title}</p>
                <p className="text-xs text-gray-400 mt-1">{restoreTarget.authors.join(", ")} • {restoreTarget.publicationYear}</p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button onClick={() => setRestoreTarget(null)} className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-[10px] hover:bg-gray-50 transition-colors" style={{ fontWeight: 500 }}>
                Cancel
              </button>
              <button onClick={handleRestore} className="px-4 py-2 text-sm text-white bg-green-600 rounded-[10px] hover:bg-green-700 transition-colors flex items-center gap-1.5" style={{ fontWeight: 500 }}>
                <RotateCcw className="w-3.5 h-3.5" /> Restore
              </button>
            </div>
          </div>
        </>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[90]" onClick={() => setDeleteTarget(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] w-[calc(100%-2rem)] max-w-md bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-red-100 bg-red-50">
              <h3 className="text-red-700" style={{ fontSize: "1rem", fontWeight: 700 }}>Permanently Delete</h3>
              <button onClick={() => setDeleteTarget(null)} className="p-1 rounded-md hover:bg-red-100 text-red-400 hover:text-red-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-[10px] bg-red-50 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-red-700" style={{ fontWeight: 600 }}>This action will permanently remove the research record and cannot be undone.</p>
                  <p className="text-xs text-gray-500 mt-1">All associated data, metadata, and files will be irreversibly deleted.</p>
                </div>
              </div>
              <div className="bg-red-50 rounded-[10px] border border-red-200 p-4">
                <p className="text-sm text-gray-800" style={{ fontWeight: 600 }}>{deleteTarget.title}</p>
                <p className="text-xs text-gray-500 mt-1">{deleteTarget.authors.join(", ")} • {deleteTarget.publicationYear}</p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-[10px] hover:bg-gray-50 transition-colors" style={{ fontWeight: 500 }}>
                Cancel
              </button>
              <button onClick={handleDelete} className="px-4 py-2 text-sm text-white bg-red-600 rounded-[10px] hover:bg-red-700 transition-colors flex items-center gap-1.5" style={{ fontWeight: 500 }}>
                <Trash2 className="w-3.5 h-3.5" /> Delete Permanently
              </button>
            </div>
          </div>
        </>
      )}

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-500 flex-wrap">
        <Link to="/agency/dashboard" className="hover:text-[#1E3A8A] transition-colors">Agency</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-[#1E3A8A]" style={{ fontWeight: 500 }}>Archive</span>
      </nav>

      {/* Page Header */}
      <div>
        <h1 className="text-[#1E3A8A] mb-1" style={{ fontSize: "1.5rem", fontWeight: 700 }}>
          Archived Research
        </h1>
        <p className="text-[#6B7280] text-sm">
          Manage research records that have been archived from the active repository.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-[10px] border border-gray-200 shadow-sm p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-[10px] flex items-center justify-center shrink-0" style={{ backgroundColor: card.bg }}>
                <Icon className="w-6 h-6" style={{ color: card.color }} />
              </div>
              <div>
                <p className="text-2xl text-gray-800" style={{ fontWeight: 700 }}>{card.value}</p>
                <p className="text-xs text-gray-500" style={{ fontWeight: 500 }}>{card.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Archive Table Section */}
      <section className="bg-white rounded-[10px] border border-gray-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="px-5 sm:px-6 py-4 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search archived research..."
                className="w-full pl-10 pr-4 py-2 bg-[#F9FAFB] border border-gray-200 rounded-[10px] text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]/40"
              />
            </div>
            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                className="px-3 py-2 bg-[#F9FAFB] border border-gray-200 rounded-[10px] text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
                className="px-3 py-2 bg-[#F9FAFB] border border-gray-200 rounded-[10px] text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20"
              >
                <option value="newest">Newest Archived</option>
                <option value="oldest">Oldest Archived</option>
              </select>
            </div>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="py-20 text-center">
              <Archive className="w-14 h-14 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500" style={{ fontWeight: 500 }}>No archived research records.</p>
              <p className="text-xs text-gray-400 mt-1">Archived research will appear here when removed from the active repository.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F9FAFB] border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 500 }}>Research Title</th>
                  <th className="text-left px-4 py-3 text-xs text-gray-500" style={{ fontWeight: 500 }}>Authors</th>
                  <th className="text-left px-4 py-3 text-xs text-gray-500 hidden lg:table-cell" style={{ fontWeight: 500 }}>Year</th>
                  <th className="text-left px-4 py-3 text-xs text-gray-500" style={{ fontWeight: 500 }}>Archive Date</th>
                  <th className="text-left px-4 py-3 text-xs text-gray-500 hidden lg:table-cell" style={{ fontWeight: 500 }}>Archived By</th>
                  <th className="text-left px-4 py-3 text-xs text-gray-500" style={{ fontWeight: 500 }}>Status</th>
                  <th className="text-right px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 500 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-[#F9FAFB] transition-colors">
                    <td className="px-6 py-3.5 max-w-[280px]">
                      <span className="text-[#1E3A8A] cursor-pointer hover:underline block truncate" style={{ fontWeight: 500 }}>
                        {r.title}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-gray-600 text-xs whitespace-nowrap">{formatAuthors(r.authors)}</td>
                    <td className="px-4 py-3.5 text-gray-500 text-xs hidden lg:table-cell">{r.publicationYear}</td>
                    <td className="px-4 py-3.5 text-gray-500 text-xs whitespace-nowrap">{formatDate(r.archiveDate)}</td>
                    <td className="px-4 py-3.5 text-gray-500 text-xs hidden lg:table-cell">{r.archivedBy}</td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-gray-100 text-gray-500 border border-gray-200 rounded-full text-xs" style={{ fontWeight: 500 }}>
                        <Archive className="w-3 h-3" /> Archived
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setRestoreTarget(r)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] bg-green-50 border border-green-200 rounded-[8px] text-green-600 hover:bg-green-100 transition-colors"
                          style={{ fontWeight: 500 }}
                          title="Restore Research"
                        >
                          <RotateCcw className="w-3 h-3" /> Restore
                        </button>
                        <button
                          onClick={() => setDeleteTarget(r)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] bg-red-50 border border-red-200 rounded-[8px] text-red-500 hover:bg-red-100 transition-colors"
                          style={{ fontWeight: 500 }}
                          title="Permanently Delete"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Mobile Cards */}
        <div className="sm:hidden">
          {filtered.length === 0 ? (
            <div className="py-20 text-center">
              <Archive className="w-14 h-14 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500" style={{ fontWeight: 500 }}>No archived research records.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {paginated.map((r) => (
                <div key={r.id} className="px-5 py-4">
                  <p className="text-sm text-[#1E3A8A] mb-1 truncate" style={{ fontWeight: 600 }}>{r.title}</p>
                  <p className="text-xs text-gray-400 mb-2">{formatAuthors(r.authors)} • {r.publicationYear}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-[10px]" style={{ fontWeight: 500 }}>
                        <Archive className="w-2.5 h-2.5" /> Archived
                      </span>
                      <span className="text-[11px] text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatDate(r.archiveDate)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setRestoreTarget(r)}
                        className="p-2 rounded-[8px] bg-green-50 border border-green-200 text-green-600 hover:bg-green-100 transition-colors"
                        title="Restore"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(r)}
                        className="p-2 rounded-[8px] bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="px-5 sm:px-6 py-3.5 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
                className="px-2 py-1 bg-[#F9FAFB] border border-gray-200 rounded-md text-xs focus:outline-none"
              >
                {[5, 10, 20].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <span className="ml-2">
                {`${(page - 1) * rowsPerPage + 1}–${Math.min(page * rowsPerPage, filtered.length)} of ${filtered.length}`}
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
        )}
      </section>

      {/* Archive Activity Log */}
      <section className="bg-white rounded-[10px] border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[10px] bg-[#1E3A8A]/10 flex items-center justify-center">
            <FileText className="w-4 h-4 text-[#1E3A8A]" />
          </div>
          <h2 className="text-[#1E3A8A] text-sm" style={{ fontWeight: 700 }}>Archive Activity</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {activities.slice(0, 5).map((a) => {
            const cfg = activityIcons[a.action];
            const Icon = cfg.icon;
            const actionLabels: Record<string, string> = {
              archived: "Research archived",
              restored: "Research restored",
              deleted: "Research permanently deleted",
            };
            return (
              <div key={a.id} className="flex items-start gap-3 px-5 sm:px-6 py-3.5">
                <div className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0" style={{ backgroundColor: cfg.bg }}>
                  <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700" style={{ fontWeight: 500 }}>
                    {actionLabels[a.action]}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{a.title}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[11px] text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {formatDateTime(a.dateTime)}
                  </p>
                  <p className="text-[11px] text-gray-400">{a.user}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

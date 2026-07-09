import { useState, useMemo } from "react";
import { Link } from "react-router";
import {
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  Inbox,
  ArrowUpDown,
  FileText,
  Trash2,
  AlertTriangle,
} from "lucide-react";

type RequestStatus = "Pending" | "Approved" | "Denied";
type SortOption = "newest" | "oldest";

interface AccessRequest {
  id: number;
  requester: string;
  email: string;
  organization: string;
  research: string;
  researchId: number;
  purpose: string;
  date: string;
  category: string;
  year: number;
  status: RequestStatus;
}

const MOCK_REQUESTS: AccessRequest[] = [
  {
    id: 1,
    requester: "Dr. Ana Lourdes Mercado",
    email: "almercado@addu.edu.ph",
    organization: "Ateneo de Davao University",
    research: "Impact of Climate Change on Coastal Communities in the Davao Gulf",
    researchId: 1,
    purpose: "Reference for ongoing dissertation on marine ecosystem resilience in Southeast Asian coastal regions.",
    date: "2025-03-04",
    category: "Environmental Science",
    year: 2025,
    status: "Pending",
  },
  {
    id: 2,
    requester: "Prof. James Chua",
    email: "jchua@umindanao.edu.ph",
    organization: "University of Mindanao",
    research: "IoT-Based Environmental Monitoring System for Mount Apo Natural Park",
    researchId: 2,
    purpose: "Comparative study for IoT deployment research in protected areas.",
    date: "2025-03-03",
    category: "Technology",
    year: 2025,
    status: "Pending",
  },
  {
    id: 3,
    requester: "Engr. Patricia Navarro",
    email: "pnavarro@dost.gov.ph",
    organization: "DOST - PCIEERD",
    research: "AI-Assisted Water Quality Assessment Framework for Davao River Systems",
    researchId: 3,
    purpose: "National technology assessment and scaling evaluation for AI-driven water monitoring systems.",
    date: "2025-03-02",
    category: "Technology",
    year: 2025,
    status: "Pending",
  },
  {
    id: 4,
    requester: "Dr. Roberto Garcia",
    email: "rgarcia@usep.edu.ph",
    organization: "University of Southeastern Philippines",
    research: "Renewable Energy Microgrids for Off-Grid Barangays in Southern Mindanao",
    researchId: 5,
    purpose: "Cross-referencing for energy policy research paper on decentralized power systems.",
    date: "2025-02-28",
    category: "Technology",
    year: 2025,
    status: "Approved",
  },
  {
    id: 5,
    requester: "Ms. Sarah Lim",
    email: "sarahlim@gmail.com",
    organization: "Independent Researcher",
    research: "Indigenous Knowledge Systems in Disaster Risk Reduction",
    researchId: 4,
    purpose: "Personal interest in cultural resilience methods.",
    date: "2025-02-25",
    category: "Social Sciences",
    year: 2024,
    status: "Denied",
  },
  {
    id: 6,
    requester: "Dr. Fernando Aquino",
    email: "faquino@rhrdc.org",
    organization: "RHRDC XI",
    research: "Impact of Climate Change on Coastal Communities in the Davao Gulf",
    researchId: 1,
    purpose: "Health impact assessment related to coastal environmental changes and respiratory conditions.",
    date: "2025-02-20",
    category: "Environmental Science",
    year: 2025,
    status: "Approved",
  },
  {
    id: 7,
    requester: "Dr. Maria Elena Torres",
    email: "metorres@dlsu.edu.ph",
    organization: "De La Salle University",
    research: "Digital Literacy Programs and Their Effect on Rural Education Outcomes",
    researchId: 9,
    purpose: "Meta-analysis of ICT interventions in Philippine education for an upcoming journal publication.",
    date: "2025-03-01",
    category: "Education",
    year: 2025,
    status: "Pending",
  },
  {
    id: 8,
    requester: "Mr. Kevin Ramos",
    email: "kramos@neda.gov.ph",
    organization: "NEDA Region XI",
    research: "Sustainable Agriculture Practices for Smallholder Farmers in Southern Mindanao",
    researchId: 10,
    purpose: "Regional development planning reference for agricultural productivity targets.",
    date: "2025-02-18",
    category: "Agriculture",
    year: 2024,
    status: "Approved",
  },
  {
    id: 9,
    requester: "Prof. Linda Pascual",
    email: "lpascual@up.edu.ph",
    organization: "University of the Philippines Mindanao",
    research: "Community-Based Tuberculosis Prevention in Urban Poor Areas of Davao City",
    researchId: 8,
    purpose: "Systematic review of community health interventions in Mindanao.",
    date: "2025-02-15",
    category: "Public Health",
    year: 2023,
    status: "Approved",
  },
  {
    id: 10,
    requester: "Engr. Mark Santos",
    email: "msantos@dict.gov.ph",
    organization: "DICT Region XI",
    research: "Geospatial Analysis for Regional Development Planning in Davao Region",
    researchId: 12,
    purpose: "Supporting documentation for the regional ICT roadmap and smart city initiative.",
    date: "2025-03-05",
    category: "Social Sciences",
    year: 2024,
    status: "Pending",
  },
  {
    id: 11,
    requester: "Dr. Teresa Mendez",
    email: "tmendez@pgh.gov.ph",
    organization: "Philippine General Hospital – Davao Extension",
    research: "Public Health Response Framework for Emerging Infectious Diseases in Region XI",
    researchId: 11,
    purpose: "Reference for hospital emergency preparedness plan restructuring.",
    date: "2025-02-12",
    category: "Public Health",
    year: 2025,
    status: "Denied",
  },
  {
    id: 12,
    requester: "Ms. Angela Cruz",
    email: "acruz@oxfam.org",
    organization: "Oxfam Philippines",
    research: "Smart Farming Technologies for Cacao Production in Davao Region",
    researchId: 7,
    purpose: "Agricultural livelihood assessment for cacao-producing communities grant proposal.",
    date: "2025-02-10",
    category: "Agriculture",
    year: 2024,
    status: "Pending",
  },
];

const CATEGORIES = ["All", ...new Set(MOCK_REQUESTS.map((r) => r.category))];
const YEARS = ["All", ...new Set(MOCK_REQUESTS.map((r) => String(r.year)))].sort((a, b) => {
  if (a === "All") return -1;
  if (b === "All") return 1;
  return Number(b) - Number(a);
});

function StatusBadge({ status }: { status: RequestStatus }) {
  const config = {
    Pending: { style: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
    Approved: { style: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle2 },
    Denied: { style: "bg-red-50 text-red-600 border-red-200", icon: XCircle },
  };
  const { style, icon: Icon } = config[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs border ${style}`} style={{ fontWeight: 500 }}>
      <Icon className="w-3 h-3" />
      {status}
    </span>
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function AccessRequests() {
  const [requests, setRequests] = useState<AccessRequest[]>(MOCK_REQUESTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [yearFilter, setYearFilter] = useState("All");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Confirmation dialogs
  const [approveConfirm, setApproveConfirm] = useState<{ ids: number[] } | null>(null);
  const [denyConfirm, setDenyConfirm] = useState<{ ids: number[] } | null>(null);
  const [denyReason, setDenyReason] = useState("");

  // Stats
  const totalCount = requests.length;
  const pendingCount = requests.filter((r) => r.status === "Pending").length;
  const approvedCount = requests.filter((r) => r.status === "Approved").length;
  const deniedCount = requests.filter((r) => r.status === "Denied").length;

  // Filtering & sorting
  const filtered = useMemo(() => {
    let items = requests.filter((req) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        req.requester.toLowerCase().includes(q) ||
        req.email.toLowerCase().includes(q) ||
        req.research.toLowerCase().includes(q);
      const matchStatus = statusFilter === "All" || req.status === statusFilter;
      const matchCategory = categoryFilter === "All" || req.category === categoryFilter;
      const matchYear = yearFilter === "All" || String(req.year) === yearFilter;
      return matchSearch && matchStatus && matchCategory && matchYear;
    });

    items = [...items].sort((a, b) => {
      if (sortBy === "newest") return b.date.localeCompare(a.date);
      return a.date.localeCompare(b.date);
    });

    return items;
  }, [requests, searchQuery, statusFilter, categoryFilter, yearFilter, sortBy]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage);

  // Selection
  const allPageIds = new Set(paginated.map((r) => r.id));
  const allPageSelected = paginated.length > 0 && paginated.every((r) => selectedIds.has(r.id));
  const somePageSelected = paginated.some((r) => selectedIds.has(r.id));

  const toggleSelectAll = () => {
    if (allPageSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        allPageIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        allPageIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  // Actions
  const doApprove = (ids: number[]) => {
    setRequests((prev) => prev.map((r) => (ids.includes(r.id) ? { ...r, status: "Approved" as RequestStatus } : r)));
    if (selectedRequest && ids.includes(selectedRequest.id)) {
      setSelectedRequest((p) => (p ? { ...p, status: "Approved" } : null));
    }
    setApproveConfirm(null);
    clearSelection();
  };

  const doDeny = (ids: number[]) => {
    setRequests((prev) => prev.map((r) => (ids.includes(r.id) ? { ...r, status: "Denied" as RequestStatus } : r)));
    if (selectedRequest && ids.includes(selectedRequest.id)) {
      setSelectedRequest((p) => (p ? { ...p, status: "Denied" } : null));
    }
    setDenyConfirm(null);
    setDenyReason("");
    clearSelection();
  };

  const doDelete = (ids: number[]) => {
    setRequests((prev) => prev.filter((r) => !ids.includes(r.id)));
    if (selectedRequest && ids.includes(selectedRequest.id)) {
      setSelectedRequest(null);
    }
    clearSelection();
  };

  const hasActiveFilters = statusFilter !== "All" || categoryFilter !== "All" || yearFilter !== "All" || searchQuery !== "";
  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("All");
    setCategoryFilter("All");
    setYearFilter("All");
    setCurrentPage(1);
  };

  // --- EMPTY STATE (no requests at all) ---
  if (requests.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader />
        <div className="flex flex-col items-center justify-center py-24">
          <div className="w-20 h-20 bg-[#1E3A8A]/10 rounded-full flex items-center justify-center mb-5">
            <Inbox className="w-10 h-10 text-[#1E3A8A]" />
          </div>
          <h2 className="text-gray-800 mb-2" style={{ fontSize: "1.1rem", fontWeight: 600 }}>
            No access requests have been submitted.
          </h2>
          <p className="text-sm text-gray-500 text-center max-w-sm">
            When users request access to restricted research, their requests will appear here for your review.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader />

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FileText} label="Total Requests" count={totalCount} color="blue" />
        <StatCard icon={Clock} label="Pending Requests" count={pendingCount} color="amber" />
        <StatCard icon={CheckCircle2} label="Approved Requests" count={approvedCount} color="green" />
        <StatCard icon={XCircle} label="Denied Requests" count={deniedCount} color="red" />
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search requester name, email, or research title..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2 bg-[#F9FAFB] border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]/40"
            />
          </div>
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-gray-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-2 bg-[#F9FAFB] border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20"
            >
              <option value="newest">Newest Requests</option>
              <option value="oldest">Oldest Requests</option>
            </select>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 items-start sm:items-center">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-1.5 bg-[#F9FAFB] border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Denied">Denied</option>
          </select>
          <select
            value={yearFilter}
            onChange={(e) => { setYearFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-1.5 bg-[#F9FAFB] border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20"
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>{y === "All" ? "All Years" : y}</option>
            ))}
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-1.5 bg-[#F9FAFB] border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c === "All" ? "All Categories" : c}</option>
            ))}
          </select>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors" style={{ fontWeight: 500 }}>
              <X className="w-3.5 h-3.5" /> Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-[#1E3A8A] rounded-xl px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-white text-sm" style={{ fontWeight: 500 }}>
              {selectedIds.size} request{selectedIds.size > 1 ? "s" : ""} selected
            </span>
            <button onClick={clearSelection} className="text-white/70 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setApproveConfirm({ ids: [...selectedIds] })}
              className="px-3 py-1.5 text-xs bg-green-500/90 text-white rounded-md hover:bg-green-500 transition-colors"
              style={{ fontWeight: 500 }}
            >
              Approve Selected
            </button>
            <button
              onClick={() => setDenyConfirm({ ids: [...selectedIds] })}
              className="px-3 py-1.5 text-xs bg-red-500/80 text-white rounded-md hover:bg-red-500 transition-colors"
              style={{ fontWeight: 500 }}
            >
              Deny Selected
            </button>
            <button
              onClick={() => doDelete([...selectedIds])}
              className="px-3 py-1.5 text-xs bg-white/20 text-white rounded-md hover:bg-white/30 transition-colors"
              style={{ fontWeight: 500 }}
            >
              Delete Requests
            </button>
          </div>
        </div>
      )}

      {/* Results summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Showing{" "}
          <span className="text-gray-800" style={{ fontWeight: 600 }}>
            {filtered.length > 0 ? `${(safePage - 1) * rowsPerPage + 1}–${Math.min(safePage * rowsPerPage, filtered.length)}` : "0"}
          </span>{" "}
          of {filtered.length} requests
        </p>
      </div>

      {/* Filtered empty state */}
      {filtered.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center py-16">
          <Search className="w-10 h-10 text-gray-300 mb-4" />
          <p className="text-gray-600 mb-1" style={{ fontWeight: 500 }}>No matching requests found.</p>
          <p className="text-sm text-gray-400 mb-4">Try adjusting your search or filters.</p>
          <button onClick={clearFilters} className="text-sm text-[#1E3A8A] hover:underline" style={{ fontWeight: 500 }}>
            Clear all filters
          </button>
        </div>
      )}

      {/* Mobile: Cards */}
      {filtered.length > 0 && (
        <div className="sm:hidden space-y-3">
          {paginated.map((req) => (
            <div key={req.id} className={`bg-white border rounded-xl p-4 shadow-sm space-y-2 ${selectedIds.has(req.id) ? "border-[#1E3A8A] ring-1 ring-[#1E3A8A]/20" : "border-gray-200"}`}>
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedIds.has(req.id)}
                  onChange={() => toggleSelect(req.id)}
                  className="mt-1 w-4 h-4 rounded border-gray-300 accent-[#1E3A8A] cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-gray-800 text-sm" style={{ fontWeight: 500 }}>{req.requester}</p>
                    <StatusBadge status={req.status} />
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{req.organization}</p>
                  <Link to={`/research/${req.researchId}`} className="text-xs text-[#1E3A8A] hover:underline mt-1 block line-clamp-1">
                    {req.research}
                  </Link>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(req.date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 pl-7 pt-1">
                <button
                  onClick={() => setSelectedRequest(req)}
                  className="px-3 py-1.5 text-xs bg-gray-50 text-gray-600 border border-gray-200 rounded-md hover:bg-gray-100"
                  style={{ fontWeight: 500 }}
                >
                  View Details
                </button>
                {req.status === "Pending" && (
                  <>
                    <button
                      onClick={() => setApproveConfirm({ ids: [req.id] })}
                      className="flex-1 px-3 py-1.5 text-xs bg-green-50 text-green-700 border border-green-200 rounded-md hover:bg-green-100"
                      style={{ fontWeight: 500 }}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => setDenyConfirm({ ids: [req.id] })}
                      className="flex-1 px-3 py-1.5 text-xs bg-red-50 text-red-600 border border-red-200 rounded-md hover:bg-red-100"
                      style={{ fontWeight: 500 }}
                    >
                      Deny
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Desktop: Table */}
      {filtered.length > 0 && (
        <div className="hidden sm:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-[#F9FAFB]">
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allPageSelected}
                      ref={(el) => { if (el) el.indeterminate = somePageSelected && !allPageSelected; }}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 accent-[#1E3A8A] cursor-pointer"
                    />
                  </th>
                  <th className="text-left px-4 py-3 text-xs text-gray-500" style={{ fontWeight: 500 }}>Requester Name</th>
                  <th className="text-left px-3 py-3 text-xs text-gray-500 hidden md:table-cell" style={{ fontWeight: 500 }}>Email</th>
                  <th className="text-left px-3 py-3 text-xs text-gray-500 hidden lg:table-cell" style={{ fontWeight: 500 }}>Organization</th>
                  <th className="text-left px-3 py-3 text-xs text-gray-500 hidden xl:table-cell" style={{ fontWeight: 500 }}>Research Title</th>
                  <th className="text-left px-3 py-3 text-xs text-gray-500 hidden md:table-cell" style={{ fontWeight: 500 }}>Request Date</th>
                  <th className="text-left px-3 py-3 text-xs text-gray-500" style={{ fontWeight: 500 }}>Status</th>
                  <th className="text-right px-4 py-3 text-xs text-gray-500" style={{ fontWeight: 500 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((req) => (
                  <tr
                    key={req.id}
                    className={`border-b border-gray-50 transition-colors group ${
                      selectedIds.has(req.id) ? "bg-[#1E3A8A]/5" : "hover:bg-[#F9FAFB]"
                    }`}
                  >
                    <td className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(req.id)}
                        onChange={() => toggleSelect(req.id)}
                        className="w-4 h-4 rounded border-gray-300 accent-[#1E3A8A] cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-800" style={{ fontWeight: 500 }}>{req.requester}</p>
                    </td>
                    <td className="px-3 py-3 text-gray-500 hidden md:table-cell">
                      <span className="truncate block max-w-[180px]">{req.email}</span>
                    </td>
                    <td className="px-3 py-3 text-gray-500 hidden lg:table-cell">
                      <span className="truncate block max-w-[160px]">{req.organization}</span>
                    </td>
                    <td className="px-3 py-3 hidden xl:table-cell">
                      <Link to={`/research/${req.researchId}`} className="text-[#1E3A8A] hover:underline truncate block max-w-[240px]" style={{ fontWeight: 500 }}>
                        {req.research}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-gray-500 hidden md:table-cell">{formatDate(req.date)}</td>
                    <td className="px-3 py-3">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setSelectedRequest(req)}
                          className="p-1.5 rounded-md hover:bg-blue-50 text-gray-400 hover:text-[#1E3A8A]"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {req.status === "Pending" && (
                          <>
                            <button
                              onClick={() => setApproveConfirm({ ids: [req.id] })}
                              className="p-1.5 rounded-md hover:bg-green-50 text-gray-400 hover:text-green-600"
                              title="Approve"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDenyConfirm({ ids: [req.id] })}
                              className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500"
                              title="Deny"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => doDelete([req.id])}
                          className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500"
                          title="Delete"
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

          {/* Pagination */}
          <PaginationBar
            currentPage={safePage}
            totalPages={totalPages}
            rowsPerPage={rowsPerPage}
            totalItems={filtered.length}
            onPageChange={(p) => { setCurrentPage(p); clearSelection(); }}
            onRowsPerPageChange={(n) => { setRowsPerPage(n); setCurrentPage(1); clearSelection(); }}
          />
        </div>
      )}

      {/* --- MODALS --- */}

      {/* Detail Modal */}
      {selectedRequest && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setSelectedRequest(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between">
                <h3 className="text-[#1E3A8A]" style={{ fontSize: "1.05rem", fontWeight: 700 }}>
                  Request Details
                </h3>
                <button onClick={() => setSelectedRequest(null)} className="p-1 hover:bg-gray-100 rounded-md">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                <ModalField label="Requester Name" value={selectedRequest.requester} />
                <ModalField label="Email Address" value={selectedRequest.email} />
                <ModalField label="Organization / Affiliation" value={selectedRequest.organization} />
                <ModalField label="Purpose of Request" value={selectedRequest.purpose} />
                <div>
                  <p className="text-xs text-gray-400 mb-1" style={{ fontWeight: 500 }}>Requested Research Title</p>
                  <Link to={`/research/${selectedRequest.researchId}`} className="text-sm text-[#1E3A8A] hover:underline" style={{ fontWeight: 500 }}>
                    {selectedRequest.research}
                  </Link>
                </div>
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-xs text-gray-400 mb-1" style={{ fontWeight: 500 }}>Request Date</p>
                    <p className="text-sm text-gray-700">{formatDate(selectedRequest.date)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1" style={{ fontWeight: 500 }}>Status</p>
                    <StatusBadge status={selectedRequest.status} />
                  </div>
                </div>
              </div>

              {selectedRequest.status === "Pending" && (
                <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => { setSelectedRequest(null); setApproveConfirm({ ids: [selectedRequest.id] }); }}
                    className="flex-1 px-4 py-2.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    style={{ fontWeight: 500 }}
                  >
                    Approve Request
                  </button>
                  <button
                    onClick={() => { setSelectedRequest(null); setDenyConfirm({ ids: [selectedRequest.id] }); }}
                    className="flex-1 px-4 py-2.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    style={{ fontWeight: 500 }}
                  >
                    Deny Request
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Approve Confirmation */}
      {approveConfirm && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[60]" onClick={() => setApproveConfirm(null)} />
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-gray-800" style={{ fontSize: "1rem", fontWeight: 700 }}>
                  Approve Download Access
                </h3>
              </div>
              <p className="text-sm text-gray-600">
                {approveConfirm.ids.length === 1
                  ? "Approve download access for this requester? The system will generate download access and notify the requester."
                  : `Approve download access for ${approveConfirm.ids.length} selected requesters?`}
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setApproveConfirm(null)}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  style={{ fontWeight: 500 }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => doApprove(approveConfirm.ids)}
                  className="px-5 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  style={{ fontWeight: 500 }}
                >
                  Approve
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Deny Confirmation */}
      {denyConfirm && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[60]" onClick={() => { setDenyConfirm(null); setDenyReason(""); }} />
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-gray-800" style={{ fontSize: "1rem", fontWeight: 700 }}>
                  Deny Access Request
                </h3>
              </div>
              <p className="text-sm text-gray-600">
                {denyConfirm.ids.length === 1
                  ? "Are you sure you want to deny this access request?"
                  : `Deny ${denyConfirm.ids.length} selected access requests?`}
              </p>
              <div>
                <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 500 }}>
                  Reason for denial <span className="text-gray-400 text-xs">(optional)</span>
                </label>
                <textarea
                  value={denyReason}
                  onChange={(e) => setDenyReason(e.target.value)}
                  placeholder="Provide a reason for denying this request..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-[#F9FAFB] border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => { setDenyConfirm(null); setDenyReason(""); }}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  style={{ fontWeight: 500 }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => doDeny(denyConfirm.ids)}
                  className="px-5 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  style={{ fontWeight: 500 }}
                >
                  Deny Request
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// --- Sub-components ---

function PageHeader() {
  return (
    <div>
      <h1 className="text-[#1E3A8A] mb-1" style={{ fontSize: "1.5rem", fontWeight: 700 }}>
        Access Requests
      </h1>
      <p className="text-[#6B7280] text-sm">
        Review and manage download access requests submitted by users.
      </p>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  count,
  color,
}: {
  icon: React.ElementType;
  label: string;
  count: number;
  color: "blue" | "amber" | "green" | "red";
}) {
  const colorMap = {
    blue: { bg: "bg-blue-50", text: "text-[#1E3A8A]" },
    amber: { bg: "bg-amber-50", text: "text-amber-600" },
    green: { bg: "bg-green-50", text: "text-green-600" },
    red: { bg: "bg-red-50", text: "text-red-500" },
  };
  const c = colorMap[color];
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
      <div className={`w-11 h-11 rounded-lg ${c.bg} flex items-center justify-center shrink-0`}>
        <Icon className={`w-5 h-5 ${c.text}`} />
      </div>
      <div>
        <p className="text-gray-800" style={{ fontSize: "1.35rem", fontWeight: 700 }}>{count}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}

function ModalField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-1" style={{ fontWeight: 500 }}>{label}</p>
      <p className="text-sm text-gray-700">{value}</p>
    </div>
  );
}

function PaginationBar({
  currentPage,
  totalPages,
  rowsPerPage,
  totalItems,
  onPageChange,
  onRowsPerPageChange,
}: {
  currentPage: number;
  totalPages: number;
  rowsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (n: number) => void;
}) {
  const pages: (number | "...")[] = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-6 py-3 border-t border-gray-100 gap-3">
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span>Rows per page:</span>
        <select
          value={rowsPerPage}
          onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
          className="px-2 py-1 bg-[#F9FAFB] border border-gray-200 rounded text-xs focus:outline-none"
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
        </select>
        <span className="text-gray-400 ml-2">{totalItems} total</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className={`p-1.5 rounded-md transition-colors ${currentPage <= 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-500 hover:bg-gray-100"}`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`dots-${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-gray-400">...</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={`w-8 h-8 rounded-md text-xs flex items-center justify-center transition-colors ${
                currentPage === p ? "bg-[#1E3A8A] text-white" : "text-gray-600 hover:bg-gray-100"
              }`}
              style={{ fontWeight: currentPage === p ? 600 : 400 }}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={`p-1.5 rounded-md transition-colors ${currentPage >= totalPages ? "text-gray-300 cursor-not-allowed" : "text-gray-500 hover:bg-gray-100"}`}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

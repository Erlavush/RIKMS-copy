import { useState } from "react";
import {
  Database,
  Search,
  Filter,
  Download,
  ExternalLink,
  Eye,
  Calendar,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Building2,
  Tag,
  BarChart3,
} from "lucide-react";
import { RESEARCH_DATA, AGENCIES, RESEARCH_CATEGORIES } from "../../data/mock-data";

type PubStatus = "Published" | "Draft" | "Under Review";

const EXTENDED_RESEARCH = RESEARCH_DATA.map((r, i) => ({
  ...r,
  status: (i % 5 === 0 ? "Under Review" : i % 7 === 0 ? "Draft" : "Published") as PubStatus,
  views: [1247, 893, 756, 2103, 634, 445, 567, 389, 312, 287, 512, 198][i] || 200,
}));

function StatusBadge({ status }: { status: PubStatus }) {
  const styles = {
    Published: "bg-green-50 text-green-700 border-green-200",
    Draft: "bg-gray-50 text-gray-500 border-gray-200",
    "Under Review": "bg-amber-50 text-amber-700 border-amber-200",
  };
  return (
    <span className={`text-[11px] px-2.5 py-0.5 rounded-full border ${styles[status]}`} style={{ fontWeight: 600 }}>
      {status}
    </span>
  );
}

export function SystemResearch() {
  const [search, setSearch] = useState("");
  const [filterAgency, setFilterAgency] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");

  const filtered = EXTENDED_RESEARCH.filter((r) => {
    const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase()) || r.authors.some((a) => a.toLowerCase().includes(search.toLowerCase()));
    const matchesAgency = filterAgency === "All" || r.agencyAbbr === filterAgency;
    const matchesCategory = filterCategory === "All" || r.category === filterCategory;
    return matchesSearch && matchesAgency && matchesCategory;
  });

  return (
    <div className="space-y-6 max-w-[1376px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[#0F172A] mb-1" style={{ fontSize: "1.5rem", fontWeight: 700 }}>System Research Repository</h1>
          <p className="text-[#6B7280] text-sm">Browse and manage all research records across the RIKMS platform.</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 text-sm rounded-[10px] hover:bg-gray-50 transition-colors self-start" style={{ fontWeight: 500 }}>
          <Download className="w-4 h-4" /> Export Records
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Records", value: EXTENDED_RESEARCH.length, icon: Database, color: "#1E3A8A", bg: "#DBEAFE" },
          { label: "Published", value: EXTENDED_RESEARCH.filter((r) => r.status === "Published").length, icon: BookOpen, color: "#16A34A", bg: "#DCFCE7" },
          { label: "Under Review", value: EXTENDED_RESEARCH.filter((r) => r.status === "Under Review").length, icon: Eye, color: "#D97706", bg: "#FEF3C7" },
          { label: "Total Views", value: EXTENDED_RESEARCH.reduce((s, r) => s + r.views, 0).toLocaleString(), icon: BarChart3, color: "#7C3AED", bg: "#EDE9FE" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-[10px] border border-gray-200 shadow-sm p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-[10px] flex items-center justify-center shrink-0" style={{ backgroundColor: s.bg }}>
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

      {/* Filters & Table */}
      <div className="bg-white rounded-[10px] border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input type="text" placeholder="Search research titles, authors..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]/30" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-gray-400" />
            <select value={filterAgency} onChange={(e) => setFilterAgency(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20">
              <option value="All">All Agencies</option>
              {AGENCIES.map((a) => <option key={a.id} value={a.abbreviation}>{a.abbreviation}</option>)}
            </select>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20">
              <option value="All">All Categories</option>
              {RESEARCH_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="divide-y divide-gray-50">
          {filtered.map((r) => (
            <div key={r.id} className="px-6 py-4 hover:bg-gray-50/50 transition-colors">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <StatusBadge status={r.status} />
                    <span className="text-[11px] text-gray-400 flex items-center gap-1"><Building2 className="w-3 h-3" /> {r.agencyAbbr}</span>
                    <span className="text-[11px] text-gray-400 flex items-center gap-1"><Calendar className="w-3 h-3" /> {r.year}</span>
                  </div>
                  <h3 className="text-sm text-gray-800 mb-1" style={{ fontWeight: 600 }}>{r.title}</h3>
                  <p className="text-xs text-gray-400 mb-2">{r.authors.join(", ")}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1E3A8A]/5 text-[#1E3A8A] flex items-center gap-1" style={{ fontWeight: 500 }}>
                      <Tag className="w-2.5 h-2.5" /> {r.category}
                    </span>
                    <span className="text-[10px] text-gray-400">{r.downloads.toLocaleString()} downloads</span>
                    <span className="text-[10px] text-gray-400">{r.views.toLocaleString()} views</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors" style={{ fontWeight: 500 }}>
                    <Eye className="w-3.5 h-3.5" /> View
                  </button>
                  <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors" style={{ fontWeight: 500 }}>
                    <ExternalLink className="w-3.5 h-3.5" /> Open
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">Showing {filtered.length} research records</p>
          <div className="flex items-center gap-1">
            <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><ChevronLeft className="w-4 h-4" /></button>
            <button className="w-8 h-8 rounded-lg bg-[#1E3A8A] text-white text-xs" style={{ fontWeight: 600 }}>1</button>
            <button className="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-500 text-xs" style={{ fontWeight: 500 }}>2</button>
            <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

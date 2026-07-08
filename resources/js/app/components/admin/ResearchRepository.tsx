import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router";
import {
  Search, Eye, Pencil, Download, Plus, LayoutGrid, List,
  ShieldCheck, FileText, X, Lock, Globe, Clock, KeyRound,
  ChevronRight, Home, SlidersHorizontal, ChevronDown,
  BarChart3, Users, Tag, Sparkles, TrendingUp, ArrowUpDown,
  CheckCircle2, Filter, Layers, Grid3X3, RefreshCw,
  BookOpen, ClipboardList, FileBarChart, Star,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { SDG_DATA, SDG_RESEARCH_COUNTS } from "../../data/mock-data";

// ─── Types ─────────────────────────────────────────────────────────────────────

type ResearchStatus = "Published" | "Draft" | "Archived";
type AccessPolicy   = "Public" | "Restricted" | "Request Access" | "Embargoed";
type DocType        = "Research Study" | "Terminal Report" | "Project Report";
type SortOption     = "newest" | "oldest" | "most-downloaded" | "most-relevant";
type ViewMode       = "grid" | "table";
type SDGViewMode    = "by-category" | "all";

interface ResearchItem {
  id: number;
  title: string;
  authors: string[];
  year: number;
  quarter?: string;
  agency: string;
  agencyAbbr: string;
  category: string;
  docType: DocType;
  sdgs: number[];
  accessPolicy: AccessPolicy;
  status: ResearchStatus;
  lastUpdated: string;
  downloads: number;
  abstract?: string;
  papCategory?: string;
  completion?: number;
  budgetUtil?: number;
  featured?: boolean;
  aiTagged?: boolean;
}

// ─── SDG Category Grouping ────────────────────────────────────────────────────

const SDG_CATEGORIES = [
  {
    id: "social",
    label: "Social",
    icon: Users,
    color: "#E5243B",
    description: "People-centered goals addressing poverty, health, education, and equality",
    sdgs: [1, 2, 3, 4, 5],
    bg: "#FFF1F2",
    border: "#FECDD3",
  },
  {
    id: "economic",
    label: "Economic",
    icon: TrendingUp,
    color: "#A21942",
    description: "Goals driving prosperity, innovation, infrastructure, and reduced inequality",
    sdgs: [8, 9, 10],
    bg: "#FFF1F6",
    border: "#FBCFE8",
  },
  {
    id: "environmental",
    label: "Environmental",
    icon: Globe,
    color: "#3F7E44",
    description: "Goals protecting the planet — water, energy, cities, climate, and oceans",
    sdgs: [6, 7, 11, 12, 13, 14, 15],
    bg: "#F0FDF4",
    border: "#BBF7D0",
  },
  {
    id: "governance",
    label: "Governance",
    icon: ShieldCheck,
    color: "#00689D",
    description: "Goals for peace, justice, strong institutions, and global partnerships",
    sdgs: [16, 17],
    bg: "#F0F9FF",
    border: "#BAE6FD",
  },
] as const;

// ─── Mock Research Data ────────────────────────────────────────────────────────

const RESEARCH_ITEMS: ResearchItem[] = [
  {
    id: 1,
    title: "Impact of Climate Change on Coastal Communities in the Davao Gulf",
    authors: ["Dr. Maria Santos", "Dr. Juan Dela Cruz", "Prof. Ana Reyes"],
    year: 2025, quarter: "Q1",
    agency: "Southern Mindanao Agriculture Aquatic and Natural Resources R&D Consortium",
    agencyAbbr: "SMAARRDEC",
    category: "Environmental Science", docType: "Research Study",
    sdgs: [13, 14, 11], accessPolicy: "Public", status: "Published",
    lastUpdated: "2025-02-28", downloads: 1247,
    abstract: "This study examines the socioeconomic impact of climate change on coastal communities along the Davao Gulf, identifying key vulnerability factors and proposing adaptation strategies for local government units.",
    aiTagged: true,
  },
  {
    id: 2,
    title: "IoT-Based Environmental Monitoring System for Mount Apo Natural Park",
    authors: ["Eng. Sofia Reyes", "Dr. Marco Villanueva"],
    year: 2025, quarter: "Q1",
    agency: "Department of Science and Technology – Region XI",
    agencyAbbr: "DOST XI",
    category: "Technology", docType: "Research Study",
    sdgs: [6, 9, 15], accessPolicy: "Public", status: "Published",
    lastUpdated: "2025-02-25", downloads: 389,
    abstract: "IoT-based real-time monitoring of biodiversity indicators and water quality across Mount Apo Natural Park, evaluating the system for conservation management and early hazard detection.",
    featured: true, aiTagged: true,
  },
  {
    id: 3,
    title: "AI-Assisted Water Quality Assessment Framework for Davao River Systems",
    authors: ["Dr. Elena Torres", "Dr. Rafael Santos"],
    year: 2025, quarter: "Q2",
    agency: "DOST XI", agencyAbbr: "DOST XI",
    category: "Technology", docType: "Terminal Report",
    sdgs: [6, 9], accessPolicy: "Restricted", status: "Draft",
    lastUpdated: "2025-03-01", downloads: 0,
    papCategory: "Digital Economy", completion: 78, budgetUtil: 65,
  },
  {
    id: 4,
    title: "Indigenous Knowledge Systems in Disaster Risk Reduction: A Davao Region Study",
    authors: ["Prof. Ana Reyes", "Dr. Carlos Tan"],
    year: 2024, quarter: "Q4",
    agency: "University of Southeastern Philippines", agencyAbbr: "USEP",
    category: "Social Sciences", docType: "Research Study",
    sdgs: [11, 13], accessPolicy: "Request Access", status: "Published",
    lastUpdated: "2024-12-15", downloads: 892,
    abstract: "Documents how indigenous knowledge systems in highland Davao communities contribute to disaster resilience and climate adaptation in geographically isolated areas.",
    aiTagged: true,
  },
  {
    id: 5,
    title: "Renewable Energy Microgrids for Off-Grid Barangays in Southern Mindanao",
    authors: ["Eng. Miguel Ramos"],
    year: 2025, quarter: "Q1",
    agency: "DRIEERDC", agencyAbbr: "DRIEERDC",
    category: "Technology", docType: "Terminal Report",
    sdgs: [7, 9, 11], accessPolicy: "Embargoed", status: "Draft",
    lastUpdated: "2025-03-03", downloads: 0,
    papCategory: "Circular Economy", completion: 45, budgetUtil: 38,
  },
  {
    id: 6,
    title: "Biodiversity Assessment of Mount Hamiguitan Range Wildlife Sanctuary",
    authors: ["Dr. Lena Gomez", "Prof. Ricardo Bautista"],
    year: 2024, quarter: "Q3",
    agency: "SMAARRDEC", agencyAbbr: "SMAARRDEC",
    category: "Environmental Science", docType: "Research Study",
    sdgs: [15, 13], accessPolicy: "Public", status: "Published",
    lastUpdated: "2024-11-20", downloads: 567,
    abstract: "A comprehensive biodiversity assessment documenting flora, fauna, and endemic species within the Mount Hamiguitan UNESCO World Heritage Site.",
    aiTagged: true,
  },
  {
    id: 7,
    title: "Smart Farming Technologies for Cacao Production in Davao Region",
    authors: ["Dr. Pedro Villanueva", "Dr. Rosa Lim"],
    year: 2024, quarter: "Q3",
    agency: "SMAARRDEC", agencyAbbr: "SMAARRDEC",
    category: "Agriculture", docType: "Project Report",
    sdgs: [2, 12], accessPolicy: "Public", status: "Published",
    lastUpdated: "2024-10-10", downloads: 445,
    papCategory: "STI Strategy", completion: 100, budgetUtil: 91,
    aiTagged: true,
  },
  {
    id: 8,
    title: "Community-Based Tuberculosis Prevention in Urban Poor Areas of Davao City",
    authors: ["Dr. Isabella Cruz", "Dr. Fernando Aquino"],
    year: 2023, quarter: "Q4",
    agency: "Regional Health Research and Development Consortium XI", agencyAbbr: "RHRDC XI",
    category: "Public Health", docType: "Research Study",
    sdgs: [3, 1], accessPolicy: "Public", status: "Archived",
    lastUpdated: "2023-12-01", downloads: 1823,
    abstract: "Community-driven TB prevention strategies targeting urban poor populations, with documented reductions in new infection rates following 18-month interventions in Davao City.",
  },
  {
    id: 9,
    title: "Digital Literacy Programs and Their Effect on Rural Education Outcomes",
    authors: ["Prof. Roberto Garcia", "Dr. Elena Marquez"],
    year: 2025, quarter: "Q1",
    agency: "Commission on Higher Education – Region XI", agencyAbbr: "CHED XI",
    category: "Education", docType: "Terminal Report",
    sdgs: [4, 10, 9], accessPolicy: "Request Access", status: "Published",
    lastUpdated: "2025-01-18", downloads: 893,
    papCategory: "Digital Economy", completion: 95, budgetUtil: 87,
    aiTagged: true, featured: true,
  },
  {
    id: 10,
    title: "Sustainable Agriculture Practices for Smallholder Farmers in Southern Mindanao",
    authors: ["Dr. Pedro Villanueva", "Dr. Rosa Lim", "Dr. Carlos Tan"],
    year: 2024, quarter: "Q2",
    agency: "SMAARRDEC", agencyAbbr: "SMAARRDEC",
    category: "Agriculture", docType: "Research Study",
    sdgs: [2, 12, 15, 1], accessPolicy: "Public", status: "Published",
    lastUpdated: "2024-09-22", downloads: 756,
    abstract: "Documents best practices in organic farming, water conservation, and crop diversification that improved yields and income for smallholder farming communities across Southern Mindanao.",
    aiTagged: true,
  },
  {
    id: 11,
    title: "Public Health Response Framework for Emerging Infectious Diseases in Region XI",
    authors: ["Dr. Isabella Cruz", "Dr. Fernando Aquino"],
    year: 2025, quarter: "Q2",
    agency: "RHRDC XI", agencyAbbr: "RHRDC XI",
    category: "Public Health", docType: "Research Study",
    sdgs: [3, 17], accessPolicy: "Restricted", status: "Published",
    lastUpdated: "2025-02-10", downloads: 2103,
    abstract: "A multi-tiered response framework for emerging infectious diseases in Region XI, incorporating surveillance, rapid testing, contact tracing, and community-based health interventions.",
    aiTagged: true,
  },
  {
    id: 12,
    title: "Geospatial Analysis for Regional Development Planning in Davao Region",
    authors: ["Dr. Teresa Mendez", "Prof. Andrew Pascual", "Dr. Lea Navarro"],
    year: 2024, quarter: "Q3",
    agency: "National Economic and Development Authority – Region XI", agencyAbbr: "NEDA XI",
    category: "Social Sciences", docType: "Project Report",
    sdgs: [11, 8, 17], accessPolicy: "Public", status: "Published",
    lastUpdated: "2024-08-05", downloads: 478,
    papCategory: "STI Strategy", completion: 100, budgetUtil: 94,
    aiTagged: true,
  },
  {
    id: 13,
    title: "Economic Impact of Digital Transformation on MSMEs in Davao Region",
    authors: ["Dr. Antonio Mendoza", "Dr. Grace Lim"],
    year: 2025, quarter: "Q1",
    agency: "Department of Trade and Industry – Region XI", agencyAbbr: "DTI XI",
    category: "Economics", docType: "Terminal Report",
    sdgs: [8, 17, 10], accessPolicy: "Public", status: "Published",
    lastUpdated: "2025-01-30", downloads: 567,
    papCategory: "Digital Economy", completion: 100, budgetUtil: 88,
    aiTagged: true, featured: true,
  },
  {
    id: 14,
    title: "Gender Equality in STEM Education: A Regional Assessment",
    authors: ["Dr. Carmen Flores", "Prof. Diana Salazar"],
    year: 2024, quarter: "Q2",
    agency: "University of Southeastern Philippines", agencyAbbr: "USEP",
    category: "Social Sciences", docType: "Research Study",
    sdgs: [5, 4, 10], accessPolicy: "Public", status: "Published",
    lastUpdated: "2024-07-14", downloads: 445,
    abstract: "Regional assessment of gender equality in STEM education, examining enrollment patterns, retention rates, and institutional barriers at HEIs in the Davao Region.",
    aiTagged: true,
  },
  {
    id: 15,
    title: "Cybersecurity Readiness Assessment of Government ICT Infrastructure in Region XI",
    authors: ["Eng. Rafael Domingo", "Dr. Lisa Tan"],
    year: 2025, quarter: "Q1",
    agency: "Department of Information and Communications Technology – Region XI", agencyAbbr: "DICT XI",
    category: "Technology", docType: "Research Study",
    sdgs: [9, 16, 17], accessPolicy: "Public", status: "Published",
    lastUpdated: "2025-02-05", downloads: 312,
    abstract: "A comprehensive cybersecurity readiness assessment of government ICT infrastructure across Region XI agencies, proposing a regional cybersecurity framework.",
    aiTagged: true,
  },
];

const AGENCIES_LIST   = [...new Set(RESEARCH_ITEMS.map(r => r.agencyAbbr))].sort();
const YEARS_LIST      = [...new Set(RESEARCH_ITEMS.map(r => String(r.year)))].sort((a, b) => +b - +a);
const QUARTERS_LIST   = ["Q1", "Q2", "Q3", "Q4"];
const PAP_CATS        = ["Circular Economy", "Digital Economy", "STI Strategy", "GAD", "Youth"];
const ACCESS_POLICIES = ["Public", "Restricted", "Request Access", "Embargoed"] as const;
const DOC_TYPE_LIST   = ["Research Study", "Terminal Report", "Project Report"] as const;

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest",          label: "Most Recent" },
  { value: "most-downloaded", label: "Most Downloaded" },
  { value: "oldest",          label: "Oldest First" },
  { value: "most-relevant",   label: "Most Relevant" },
];

// ─── Small helpers ─────────────────────────────────────────────────────────────

function fmtAuthors(authors: string[]) {
  if (authors.length === 0) return "";
  if (authors.length === 1) return authors[0];
  const parts = authors[0].split(" ");
  return `${parts[parts.length - 1]} et al.`;
}

function docTypeColor(dt: DocType) {
  if (dt === "Research Study")   return { bg: "#EFF6FF", color: "#1E3A8A", Icon: BookOpen };
  if (dt === "Terminal Report")  return { bg: "#F5F3FF", color: "#7C3AED", Icon: ClipboardList };
  return                                { bg: "#ECFDF5", color: "#059669", Icon: FileBarChart };
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ResearchStatus }) {
  const s: Record<ResearchStatus, string> = {
    Published: "bg-green-50 text-green-700 border-green-200",
    Draft:     "bg-amber-50 text-amber-700 border-amber-200",
    Archived:  "bg-gray-100 text-gray-500 border-gray-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] border font-semibold ${s[status]}`}>
      {status}
    </span>
  );
}

function AccessBadge({ policy }: { policy: AccessPolicy }) {
  const cfg: Record<AccessPolicy, { style: string; Icon: React.ElementType }> = {
    Public:          { style: "bg-blue-50 text-blue-700 border-blue-200",     Icon: Globe     },
    Restricted:      { style: "bg-red-50 text-red-600 border-red-200",        Icon: Lock      },
    "Request Access":{ style: "bg-purple-50 text-purple-700 border-purple-200", Icon: KeyRound },
    Embargoed:       { style: "bg-orange-50 text-orange-700 border-orange-200",Icon: Clock    },
  };
  const { style, Icon } = cfg[policy];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border font-semibold ${style}`}>
      <Icon className="w-2.5 h-2.5" />{policy}
    </span>
  );
}

function SdgChip({ number, size = "sm" }: { number: number; size?: "sm" | "xs" }) {
  const sdg = SDG_DATA.find(s => s.number === number);
  if (!sdg) return null;
  const cls = size === "xs"
    ? "px-1.5 py-0.5 text-[9px]"
    : "px-2 py-0.5 text-[10px]";
  return (
    <span className={`inline-flex items-center rounded font-bold text-white ${cls}`} style={{ background: sdg.color }}>
      SDG {sdg.number}
    </span>
  );
}

// ─── SDG Card ─────────────────────────────────────────────────────────────────

function SdgCard({
  sdg, count, selected, onClick, onHover, hovered,
}: {
  sdg: typeof SDG_DATA[number];
  count: number;
  selected: boolean;
  onClick: () => void;
  onHover: (n: number | null) => void;
  hovered: number | null;
}) {
  const isHov = hovered === sdg.number;
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => onHover(sdg.number)}
      onMouseLeave={() => onHover(null)}
      className={`relative w-full rounded-2xl p-3.5 text-left transition-all duration-200 border-2 ${
        selected
          ? "border-white shadow-xl ring-2 ring-offset-2"
          : "border-transparent hover:shadow-lg hover:scale-[1.03]"
      }`}
      style={{
        background:  selected ? sdg.color : isHov ? sdg.color : sdg.color + "CC",
        ringColor:   selected ? sdg.color : undefined,
      }}
    >
      {selected && (
        <div className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow">
          <CheckCircle2 className="w-3.5 h-3.5" style={{ color: sdg.color }} />
        </div>
      )}
      <div className="text-white/70 text-[9px] font-bold mb-0.5">SDG</div>
      <div className="text-white font-black mb-1" style={{ fontSize: "1.75rem", lineHeight: 1 }}>
        {sdg.number}
      </div>
      <p className="text-white font-semibold leading-tight mb-2" style={{ fontSize: "0.67rem" }}>
        {sdg.title}
      </p>
      <div className="flex items-center gap-1">
        <span className="text-white/80 text-[10px] font-semibold">{count.toLocaleString()}</span>
        <span className="text-white/60 text-[9px]">studies</span>
      </div>
      {/* Tooltip on hover */}
      {isHov && !selected && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none w-44">
          <div className="bg-gray-900 text-white text-[10px] px-3 py-2 rounded-xl shadow-xl text-center">
            <p className="font-bold">{sdg.title}</p>
            <p className="text-gray-400 mt-0.5">{count} documents tagged</p>
          </div>
          <div className="w-2 h-2 bg-gray-900 rotate-45 mx-auto -mt-1" />
        </div>
      )}
    </button>
  );
}

// ─── Document Card (Grid) ─────────────────────────────────────────────────────

function DocCard({ item, onEdit, onManageAccess }: {
  item: ResearchItem;
  onEdit: () => void;
  onManageAccess: () => void;
}) {
  const { bg, color, Icon } = docTypeColor(item.docType);
  const isRestricted = item.accessPolicy === "Restricted" || item.accessPolicy === "Embargoed";

  return (
    <div className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col group ${
      isRestricted ? "border-red-100" : "border-gray-200"
    }`}>
      {/* Top accent bar */}
      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${item.sdgs.map(n => SDG_DATA.find(s => s.number === n)?.color).filter(Boolean).join(", ")})` }} />

      <div className="p-5 flex flex-col flex-1">
        {/* Header badges */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold" style={{ background: bg, color }}>
              <Icon className="w-3 h-3" />
              {item.docType}
            </span>
            {item.quarter && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-semibold rounded-lg">
                {item.quarter} {item.year}
              </span>
            )}
            {item.featured && (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-lg border border-amber-200">
                <Star className="w-2.5 h-2.5" /> Featured
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <StatusBadge status={item.status} />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-gray-900 font-semibold leading-snug mb-1.5 group-hover:text-[#1E3A8A] transition-colors" style={{ fontSize: "0.88rem" }}>
          {isRestricted && <Lock className="w-3.5 h-3.5 inline mr-1 text-red-400" />}
          {item.title}
        </h3>

        {/* Authors */}
        <p className="text-xs text-gray-400 font-medium mb-1">{fmtAuthors(item.authors)}</p>

        {/* Agency */}
        <p className="text-[10px] text-gray-400 mb-3 truncate">{item.agencyAbbr}</p>

        {/* Abstract or restricted overlay */}
        {isRestricted ? (
          <div className="flex-1 flex items-center justify-center flex-col gap-2 py-4 bg-red-50/60 rounded-xl border border-dashed border-red-200 mb-3">
            <Lock className="w-6 h-6 text-red-300" />
            <p className="text-xs text-red-400 font-medium">Access Restricted</p>
            <button className="text-[10px] text-red-600 bg-red-100 px-3 py-1 rounded-full font-semibold hover:bg-red-200 transition-colors">
              Request Access
            </button>
          </div>
        ) : item.abstract ? (
          <p className="text-xs text-gray-500 leading-relaxed mb-3 flex-1 line-clamp-3">{item.abstract}</p>
        ) : (
          <div className="flex-1" />
        )}

        {/* Performance bars (Terminal/Project Reports) */}
        {(item.docType === "Terminal Report" || item.docType === "Project Report") && item.completion !== undefined && (
          <div className="space-y-1.5 mb-3 p-3 bg-gray-50 rounded-xl">
            {item.papCategory && (
              <div className="flex items-center gap-1.5 mb-2">
                <Tag className="w-3 h-3 text-[#1E3A8A]" />
                <span className="text-[10px] text-[#1E3A8A] font-semibold">{item.papCategory}</span>
              </div>
            )}
            <div>
              <div className="flex justify-between text-[10px] text-gray-500 mb-1 font-medium">
                <span>Completion</span><span className="font-bold">{item.completion}%</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${item.completion}%` }} />
              </div>
            </div>
            {item.budgetUtil !== undefined && (
              <div>
                <div className="flex justify-between text-[10px] text-gray-500 mb-1 font-medium">
                  <span>Budget Utilized</span><span className="font-bold">{item.budgetUtil}%</span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${item.budgetUtil > 90 ? "bg-red-500" : "bg-[#1E3A8A]"}`}
                    style={{ width: `${item.budgetUtil}%` }} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* SDG Tags */}
        {item.sdgs.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {item.sdgs.map(n => <SdgChip key={`card-sdg-${item.id}-${n}`} number={n} size="xs" />)}
            {item.aiTagged && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-purple-50 text-purple-600 text-[9px] font-semibold rounded border border-purple-100">
                <Sparkles className="w-2 h-2" /> AI Tagged
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
          <div className="flex items-center gap-2">
            <AccessBadge policy={item.accessPolicy} />
            {item.downloads > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-gray-400">
                <Download className="w-3 h-3" />{item.downloads.toLocaleString()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={onEdit}
              className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-[#1E3A8A] transition-colors" title="Edit">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={onManageAccess}
              className="p-1.5 rounded-lg hover:bg-purple-50 text-gray-400 hover:text-purple-600 transition-colors" title="Access Control">
              <ShieldCheck className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Document Table Row ────────────────────────────────────────────────────────

function DocTableRow({ item, selected, onToggle, onEdit, onManageAccess }: {
  item: ResearchItem; selected: boolean;
  onToggle: () => void; onEdit: () => void; onManageAccess: () => void;
}) {
  const { color, Icon } = docTypeColor(item.docType);
  return (
    <tr className={`border-b border-gray-100 hover:bg-[#F8FAFF] transition-colors ${selected ? "bg-blue-50/30" : ""}`}>
      <td className="px-4 py-3 text-center">
        <input type="checkbox" checked={selected} onChange={onToggle} className="rounded border-gray-300" />
      </td>
      <td className="px-4 py-3 min-w-[300px]">
        <div className="flex items-start gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: color + "18" }}>
            <Icon className="w-3.5 h-3.5" style={{ color }} />
          </div>
          <div>
            <p className="text-sm text-gray-800 font-medium leading-snug hover:text-[#1E3A8A] cursor-pointer transition-colors line-clamp-2">
              {item.title}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{fmtAuthors(item.authors)} · {item.agencyAbbr}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="text-xs text-gray-600 font-medium whitespace-nowrap">{item.quarter} {item.year}</span>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={item.status} />
      </td>
      <td className="px-4 py-3">
        <AccessBadge policy={item.accessPolicy} />
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {item.sdgs.slice(0, 3).map(n => <SdgChip key={`tbl-sdg-${item.id}-${n}`} number={n} size="xs" />)}
          {item.sdgs.length > 3 && <span className="text-[9px] text-gray-400 font-medium">+{item.sdgs.length - 3}</span>}
        </div>
      </td>
      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
        {item.downloads > 0 ? item.downloads.toLocaleString() : "—"}
      </td>
      <td className="px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-1">
          <button onClick={onEdit} className="p-1.5 rounded-md hover:bg-blue-50 text-gray-400 hover:text-[#1E3A8A] transition-colors">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={onManageAccess} className="p-1.5 rounded-md hover:bg-purple-50 text-gray-400 hover:text-purple-600 transition-colors">
            <ShieldCheck className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function ResearchRepository() {
  const navigate = useNavigate();

  // ── SDG Section state
  const [sdgViewMode,    setSdgViewMode]    = useState<SDGViewMode>("by-category");
  const [selectedSdgs,   setSelectedSdgs]   = useState<Set<number>>(new Set());
  const [hoveredSdg,     setHoveredSdg]     = useState<number | null>(null);
  const [collapsedCats,  setCollapsedCats]  = useState<Set<string>>(new Set());

  // ── Filter state
  const [search,         setSearch]         = useState("");
  const [filterDocType,  setFilterDocType]  = useState<string>("All");
  const [filterAgency,   setFilterAgency]   = useState<string>("All");
  const [filterYear,     setFilterYear]     = useState<string>("All");
  const [filterQuarter,  setFilterQuarter]  = useState<string>("All");
  const [filterAccess,   setFilterAccess]   = useState<string>("All");
  const [filterStatus,   setFilterStatus]   = useState<string>("All");
  const [showFilters,    setShowFilters]     = useState(false);

  // ── View state
  const [viewMode,       setViewMode]       = useState<ViewMode>("grid");
  const [sortBy,         setSortBy]         = useState<SortOption>("newest");
  const [selectedIds,    setSelectedIds]    = useState<Set<number>>(new Set());
  const [showAnalytics,  setShowAnalytics]  = useState(true);
  const [currentPage,    setCurrentPage]    = useState(1);
  const PAGE_SIZE = 9;

  // ── SDG helpers
  const toggleSdg = (n: number) => {
    setSelectedSdgs(prev => {
      const next = new Set(prev);
      next.has(n) ? next.delete(n) : next.add(n);
      return next;
    });
    setCurrentPage(1);
  };
  const clearSdgs = () => { setSelectedSdgs(new Set()); setCurrentPage(1); };

  const toggleCat = (id: string) => setCollapsedCats(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  // ── Active filter chips
  const activeFilters: { label: string; onRemove: () => void }[] = [
    ...Array.from(selectedSdgs).map(n => {
      const sdg = SDG_DATA.find(s => s.number === n);
      return { label: `SDG ${n} · ${sdg?.title ?? ""}`, onRemove: () => toggleSdg(n) };
    }),
    ...(filterDocType !== "All"  ? [{ label: filterDocType,        onRemove: () => setFilterDocType("All")  }] : []),
    ...(filterAgency  !== "All"  ? [{ label: filterAgency,         onRemove: () => setFilterAgency("All")   }] : []),
    ...(filterYear    !== "All"  ? [{ label: `Year: ${filterYear}`,onRemove: () => setFilterYear("All")     }] : []),
    ...(filterQuarter !== "All"  ? [{ label: filterQuarter,        onRemove: () => setFilterQuarter("All")  }] : []),
    ...(filterAccess  !== "All"  ? [{ label: filterAccess,         onRemove: () => setFilterAccess("All")   }] : []),
    ...(filterStatus  !== "All"  ? [{ label: filterStatus,         onRemove: () => setFilterStatus("All")   }] : []),
  ];

  const clearAllFilters = () => {
    clearSdgs();
    setFilterDocType("All"); setFilterAgency("All"); setFilterYear("All");
    setFilterQuarter("All"); setFilterAccess("All"); setFilterStatus("All");
    setSearch("");
    setCurrentPage(1);
  };

  // ── Filtering + sorting
  const filtered = useMemo(() => {
    let items = RESEARCH_ITEMS.filter(item => {
      const q = search.toLowerCase();
      const matchSearch = !q || item.title.toLowerCase().includes(q) ||
        item.authors.some(a => a.toLowerCase().includes(q)) ||
        item.sdgs.some(s => `sdg ${s}`.includes(q)) ||
        item.agencyAbbr.toLowerCase().includes(q);
      const matchSdg    = selectedSdgs.size === 0 || item.sdgs.some(s => selectedSdgs.has(s));
      const matchType   = filterDocType  === "All" || item.docType        === filterDocType;
      const matchAgency = filterAgency   === "All" || item.agencyAbbr     === filterAgency;
      const matchYear   = filterYear     === "All" || String(item.year)   === filterYear;
      const matchQtr    = filterQuarter  === "All" || item.quarter        === filterQuarter;
      const matchAccess = filterAccess   === "All" || item.accessPolicy   === filterAccess;
      const matchStatus = filterStatus   === "All" || item.status         === filterStatus;
      return matchSearch && matchSdg && matchType && matchAgency && matchYear && matchQtr && matchAccess && matchStatus;
    });

    items.sort((a, b) => {
      if (sortBy === "newest")          return b.year - a.year || b.lastUpdated.localeCompare(a.lastUpdated);
      if (sortBy === "oldest")          return a.year - b.year;
      if (sortBy === "most-downloaded") return b.downloads - a.downloads;
      // most-relevant: featured first, then ai-tagged, then newest
      const scoreA = (a.featured ? 2 : 0) + (a.aiTagged ? 1 : 0);
      const scoreB = (b.featured ? 2 : 0) + (b.aiTagged ? 1 : 0);
      return scoreB - scoreA || b.year - a.year;
    });

    return items;
  }, [search, selectedSdgs, filterDocType, filterAgency, filterYear, filterQuarter, filterAccess, filterStatus, sortBy]);

  const totalPages   = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated    = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const toggleSelect = (id: number) => setSelectedIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const selectAll  = () => setSelectedIds(new Set(paginated.map(i => i.id)));
  const clearSel   = () => setSelectedIds(new Set());

  // ── Analytics data
  const analyticsBar = SDG_DATA.slice(0, 10).map(sdg => ({
    name:  `SDG ${sdg.number}`,
    count: RESEARCH_ITEMS.filter(r => r.sdgs.includes(sdg.number)).length,
    color: sdg.color,
  }));
  const pieData = [
    { name: "Research Study",   value: RESEARCH_ITEMS.filter(r => r.docType === "Research Study").length,   color: "#1E3A8A" },
    { name: "Terminal Report",  value: RESEARCH_ITEMS.filter(r => r.docType === "Terminal Report").length,  color: "#7C3AED" },
    { name: "Project Report",   value: RESEARCH_ITEMS.filter(r => r.docType === "Project Report").length,   color: "#059669" },
  ];

  return (
    <div className="space-y-5">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
            <Link to="/agency/dashboard" className="flex items-center gap-1 hover:text-[#1E3A8A] transition-colors">
              <Home className="w-3.5 h-3.5" /> Dashboard
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[#1E3A8A] font-semibold">Research Repository</span>
          </nav>
          <h1 className="text-[#1E3A8A]" style={{ fontSize: "1.5rem", fontWeight: 700 }}>
            Research Repository
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Explore research and reports categorized by Sustainable Development Goals
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl">
            <FileText className="w-3.5 h-3.5 text-[#1E3A8A]" />
            <span className="text-xs text-[#1E3A8A] font-semibold">{RESEARCH_ITEMS.length} Documents</span>
          </div>
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
              showAnalytics ? "bg-[#1E3A8A] text-white border-[#1E3A8A]" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" /> Analytics
          </button>
          <Link to="/agency/upload"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#1E3A8A] text-white rounded-xl text-sm font-medium hover:bg-[#1E3A8A]/90 transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Upload
          </Link>
        </div>
      </div>

      {/* ── Global Search ─────────────────────────────────────────────────────── */}
      <div className="relative max-w-2xl mx-auto">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text" value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
          placeholder="Search by title, author, agency, or SDG…"
          className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]/40"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Main Layout ───────────────────────────────────────────────────────── */}
      <div className="flex gap-5">
        {/* ── Left / Center ─────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* SDG Browse Section */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Section header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-[#1E3A8A]/10 rounded-xl flex items-center justify-center">
                  <Globe className="w-5 h-5 text-[#1E3A8A]" />
                </div>
                <div>
                  <p className="text-[#1E3A8A] font-bold" style={{ fontSize: "0.95rem" }}>
                    Browse by Sustainable Development Goals
                  </p>
                  <p className="text-xs text-gray-400">
                    Click cards to filter · Multi-select enabled
                    {selectedSdgs.size > 0 && (
                      <span className="ml-2 text-[#1E3A8A] font-semibold">
                        {selectedSdgs.size} selected
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedSdgs.size > 0 && (
                  <button onClick={clearSdgs}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg font-medium hover:bg-red-100 transition-colors">
                    <X className="w-3 h-3" /> Clear ({selectedSdgs.size})
                  </button>
                )}
                {/* View toggle */}
                <div className="flex items-center bg-gray-100 rounded-xl p-1 text-xs">
                  <button
                    onClick={() => setSdgViewMode("by-category")}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                      sdgViewMode === "by-category" ? "bg-white text-[#1E3A8A] shadow-sm" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <Layers className="w-3 h-3" /> By Category
                  </button>
                  <button
                    onClick={() => setSdgViewMode("all")}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                      sdgViewMode === "all" ? "bg-white text-[#1E3A8A] shadow-sm" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <Grid3X3 className="w-3 h-3" /> All SDGs
                  </button>
                </div>
              </div>
            </div>

            <div className="p-5">
              {/* Selected SDG chips */}
              {selectedSdgs.size > 0 && (
                <div className="flex flex-wrap gap-2 mb-4 p-3 bg-[#F8FAFF] border border-[#BFDBFE] rounded-xl">
                  <span className="text-[10px] text-[#1E3A8A] font-bold self-center mr-1">FILTERING BY:</span>
                  {Array.from(selectedSdgs).map(n => {
                    const sdg = SDG_DATA.find(s => s.number === n);
                    return (
                      <span
                        key={`sel-chip-${n}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-white text-xs font-semibold"
                        style={{ background: sdg?.color }}
                      >
                        SDG {n} · {sdg?.title}
                        <button onClick={() => toggleSdg(n)} className="hover:bg-white/20 rounded-full p-0.5 transition-colors">
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {/* By Category view */}
              {sdgViewMode === "by-category" ? (
                <div className="space-y-5">
                  {SDG_CATEGORIES.map(cat => {
                    const catSdgs = cat.sdgs.map(n => SDG_DATA.find(s => s.number === n)).filter(Boolean) as typeof SDG_DATA;
                    const collapsed = collapsedCats.has(cat.id);
                    const catSelected = catSdgs.filter(s => selectedSdgs.has(s.number)).length;
                    return (
                      <div key={`cat-${cat.id}`} className="rounded-xl border overflow-hidden" style={{ borderColor: cat.border }}>
                        {/* Category header */}
                        <button
                          onClick={() => toggleCat(cat.id)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:opacity-90 transition-opacity"
                          style={{ background: cat.bg }}
                        >
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: cat.color + "20" }}>
                            <cat.icon className="w-4 h-4" style={{ color: cat.color }} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-sm" style={{ color: cat.color }}>{cat.label}</p>
                              {catSelected > 0 && (
                                <span className="px-2 py-0.5 text-white text-[10px] font-bold rounded-full" style={{ background: cat.color }}>
                                  {catSelected} selected
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-500">{cat.description}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-medium" style={{ color: cat.color }}>
                              SDG {catSdgs.map(s => s.number).join(", ")}
                            </span>
                            {collapsed ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400 rotate-180" />}
                          </div>
                        </button>

                        {/* SDG cards grid */}
                        {!collapsed && (
                          <div className="p-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
                            {catSdgs.map(sdg => (
                              <SdgCard
                                key={`cat-sdg-card-${sdg.number}`}
                                sdg={sdg}
                                count={SDG_RESEARCH_COUNTS[sdg.number] ?? 0}
                                selected={selectedSdgs.has(sdg.number)}
                                onClick={() => toggleSdg(sdg.number)}
                                onHover={setHoveredSdg}
                                hovered={hoveredSdg}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* All SDGs flat grid */
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
                  {SDG_DATA.map(sdg => (
                    <SdgCard
                      key={`all-sdg-card-${sdg.number}`}
                      sdg={sdg}
                      count={SDG_RESEARCH_COUNTS[sdg.number] ?? 0}
                      selected={selectedSdgs.has(sdg.number)}
                      onClick={() => toggleSdg(sdg.number)}
                      onHover={setHoveredSdg}
                      hovered={hoveredSdg}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Filter Bar ─────────────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Filters toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
                  showFilters || activeFilters.length > 0
                    ? "bg-[#1E3A8A] text-white border-[#1E3A8A]"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                }`}
              >
                <Filter className="w-4 h-4" />
                Filters
                {activeFilters.length > 0 && (
                  <span className="bg-white/25 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {activeFilters.length}
                  </span>
                )}
              </button>

              {/* Quick filter pills */}
              <div className="flex items-center gap-2 flex-wrap flex-1">
                <FilterSelect label="Type"    value={filterDocType}  onChange={v => { setFilterDocType(v); setCurrentPage(1); }}
                  options={["All", ...DOC_TYPE_LIST]} />
                <FilterSelect label="Agency"  value={filterAgency}   onChange={v => { setFilterAgency(v); setCurrentPage(1); }}
                  options={["All", ...AGENCIES_LIST]} />
                <FilterSelect label="Year"    value={filterYear}     onChange={v => { setFilterYear(v); setCurrentPage(1); }}
                  options={["All", ...YEARS_LIST]} />
                <FilterSelect label="Status"  value={filterStatus}   onChange={v => { setFilterStatus(v); setCurrentPage(1); }}
                  options={["All", "Published", "Draft", "Archived"]} />
              </div>

              {/* Sort & view */}
              <div className="flex items-center gap-2 shrink-0 ml-auto">
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as SortOption)}
                    className="appearance-none pl-3 pr-8 py-2 text-xs bg-white border border-gray-200 rounded-xl font-medium text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]/30 cursor-pointer"
                  >
                    {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <ArrowUpDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                </div>
                <div className="flex items-center bg-gray-100 rounded-xl p-1">
                  <button onClick={() => setViewMode("grid")}
                    className={`p-1.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-white text-[#1E3A8A] shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button onClick={() => setViewMode("table")}
                    className={`p-1.5 rounded-lg transition-all ${viewMode === "table" ? "bg-white text-[#1E3A8A] shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Expanded filters */}
            {showFilters && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-3 border-t border-gray-100">
                <FilterSelect label="Quarter"  value={filterQuarter} onChange={v => { setFilterQuarter(v); setCurrentPage(1); }}
                  options={["All", ...QUARTERS_LIST]} />
                <FilterSelect label="Access"   value={filterAccess}  onChange={v => { setFilterAccess(v); setCurrentPage(1); }}
                  options={["All", ...ACCESS_POLICIES]} />
              </div>
            )}

            {/* Active filter chips */}
            {activeFilters.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {activeFilters.map((f, i) => {
                  const sdgNum = selectedSdgs.size > 0 && i < selectedSdgs.size
                    ? Array.from(selectedSdgs)[i]
                    : null;
                  const sdgColor = sdgNum ? SDG_DATA.find(s => s.number === sdgNum)?.color : undefined;
                  return (
                    <span
                      key={`af-chip-${i}`}
                      className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-semibold text-white"
                      style={{ background: sdgColor ?? "#1E3A8A" }}
                    >
                      {f.label}
                      <button
                        onClick={f.onRemove}
                        className="w-4 h-4 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center transition-colors"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  );
                })}
                <button onClick={clearAllFilters}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs text-gray-500 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors font-medium">
                  <RefreshCw className="w-3 h-3" /> Clear all
                </button>
              </div>
            )}
          </div>

          {/* ── Document Area ─────────────────────────────────────────────────── */}
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <p className="text-sm text-gray-500">
                  <span className="text-gray-900 font-semibold">{filtered.length}</span> document{filtered.length !== 1 ? "s" : ""} found
                  {selectedSdgs.size > 0 && (
                    <span className="ml-1 text-[#1E3A8A]">· {selectedSdgs.size} SDG filter{selectedSdgs.size !== 1 ? "s" : ""} active</span>
                  )}
                </p>
                {selectedIds.size > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#1E3A8A] font-semibold bg-[#EFF6FF] px-2 py-0.5 rounded-full">
                      {selectedIds.size} selected
                    </span>
                    <button onClick={clearSel} className="text-xs text-gray-400 hover:text-gray-600">Deselect all</button>
                  </div>
                )}
              </div>
              {viewMode === "table" && (
                <button onClick={selectAll} className="text-xs text-[#1E3A8A] hover:underline font-medium">
                  Select all on page
                </button>
              )}
            </div>

            {filtered.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-16 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-gray-700 font-semibold mb-1">No documents found</p>
                <p className="text-sm text-gray-400 mb-4">Try adjusting your search or filter criteria</p>
                <button onClick={clearAllFilters}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#1E3A8A] text-white rounded-xl text-sm font-medium hover:bg-[#1E3A8A]/90 transition-colors">
                  <RefreshCw className="w-3.5 h-3.5" /> Reset Filters
                </button>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginated.map(item => (
                  <DocCard
                    key={`doc-card-${item.id}`}
                    item={item}
                    onEdit={() => navigate(`/agency/research/${item.id}/edit`)}
                    onManageAccess={() => navigate(`/agency/research/${item.id}/access-control`)}
                  />
                ))}
              </div>
            ) : (
              /* Table view */
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#F8FAFF] border-b border-gray-200">
                        <th className="px-4 py-3 w-10">
                          <input type="checkbox"
                            checked={selectedIds.size === paginated.length && paginated.length > 0}
                            onChange={selectedIds.size === paginated.length ? clearSel : selectAll}
                            className="rounded border-gray-300" />
                        </th>
                        {["Title & Author", "Period", "Status", "Access", "SDG Tags", "Downloads", ""].map((h, i) => (
                          <th key={`th-${i}`} className="px-4 py-3 text-left text-xs text-gray-500 font-semibold whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.map(item => (
                        <DocTableRow
                          key={`tbl-row-${item.id}`}
                          item={item}
                          selected={selectedIds.has(item.id)}
                          onToggle={() => toggleSelect(item.id)}
                          onEdit={() => navigate(`/agency/research/${item.id}/edit`)}
                          onManageAccess={() => navigate(`/agency/research/${item.id}/access-control`)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  Showing {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 rotate-180" />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={`pg-${page}`}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                          currentPage === page
                            ? "bg-[#1E3A8A] text-white"
                            : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Right Analytics Panel ─────────────────────────────────────────── */}
        {showAnalytics && (
          <div className="xl:w-[260px] shrink-0 space-y-4 xl:sticky xl:top-20">
            <div className="flex items-center gap-2 px-1">
              <BarChart3 className="w-4 h-4 text-[#1E3A8A]" />
              <span className="text-sm text-[#1E3A8A] font-bold">Analytics</span>
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Total Docs",  value: RESEARCH_ITEMS.length,                                        color: "text-[#1E3A8A]", bg: "bg-[#EFF6FF]" },
                { label: "Published",   value: RESEARCH_ITEMS.filter(r => r.status === "Published").length,  color: "text-green-600", bg: "bg-green-50"  },
                { label: "SDGs Covered",value: new Set(RESEARCH_ITEMS.flatMap(r => r.sdgs)).size,            color: "text-[#0EA5E9]", bg: "bg-sky-50"    },
                { label: "AI Tagged",   value: RESEARCH_ITEMS.filter(r => r.aiTagged).length,               color: "text-purple-600",bg: "bg-purple-50" },
              ].map(stat => (
                <div key={`stat-${stat.label}`} className={`${stat.bg} rounded-xl p-3 text-center`}>
                  <p className={`font-bold text-lg ${stat.color}`}>{stat.value}</p>
                  <p className="text-[10px] text-gray-500 font-medium">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Documents per SDG bar chart */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <p className="text-[10px] text-gray-400 font-bold mb-3">DOCS PER SDG (TOP 10)</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={analyticsBar} layout="vertical" margin={{ top: 0, right: 8, left: 32, bottom: 0 }}>
                  <XAxis type="number" tick={{ fontSize: 8 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 8 }} />
                  <Tooltip
                    contentStyle={{ fontSize: 10, borderRadius: 8, border: "1px solid #E5E7EB" }}
                    cursor={{ fill: "#F3F4F6" }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {analyticsBar.map((entry, index) => (
                      <Cell key={`bar-cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Document type pie */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <p className="text-[10px] text-gray-400 font-bold mb-2">BY DOCUMENT TYPE</p>
              <ResponsiveContainer width="100%" height={130}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={32} outerRadius={55} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={`pie-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-1">
                {pieData.map(d => (
                  <div key={`pie-leg-${d.name}`} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                      <span className="text-[10px] text-gray-500">{d.name}</span>
                    </div>
                    <span className="text-[10px] font-bold text-gray-700">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* SDG legend strip */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <p className="text-[10px] text-gray-400 font-bold mb-3">SDG CATEGORIES</p>
              <div className="space-y-2">
                {SDG_CATEGORIES.map(cat => {
                  const total = cat.sdgs.reduce((sum, n) => sum + (SDG_RESEARCH_COUNTS[n] ?? 0), 0);
                  return (
                    <div key={`leg-cat-${cat.id}`} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: cat.color + "20" }}>
                          <cat.icon className="w-3 h-3" style={{ color: cat.color }} />
                        </div>
                        <span className="text-[11px] text-gray-600 font-medium">{cat.label}</span>
                      </div>
                      <span className="text-[10px] font-bold" style={{ color: cat.color }}>{total}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected SDG insight */}
            {selectedSdgs.size > 0 && (
              <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-4">
                <p className="text-[10px] text-[#1E3A8A] font-bold mb-2">FILTER INSIGHT</p>
                <p className="text-sm text-[#1E3A8A] font-semibold">{filtered.length} document{filtered.length !== 1 ? "s" : ""}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">match your SDG selection</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {Array.from(selectedSdgs).map(n => {
                    const sdg = SDG_DATA.find(s => s.number === n);
                    return (
                      <span key={`insight-sdg-${n}`} className="w-6 h-6 rounded flex items-center justify-center text-white text-[10px] font-black" style={{ background: sdg?.color }}>
                        {n}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Shared tiny filter select ─────────────────────────────────────────────────

function FilterSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`appearance-none pl-3 pr-7 py-1.5 text-xs border rounded-xl font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]/30 transition-colors ${
          value !== "All"
            ? "bg-[#1E3A8A] text-white border-[#1E3A8A]"
            : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
        }`}
      >
        <option value="All">{label}: All</option>
        {options.filter(o => o !== "All").map(o => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      <ChevronDown className={`absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none ${value !== "All" ? "text-white" : "text-gray-400"}`} />
    </div>
  );
}

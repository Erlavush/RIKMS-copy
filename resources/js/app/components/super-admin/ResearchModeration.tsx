import { useState } from "react";
import {
  ShieldCheck,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  Building2,
  Flag,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Copy,
  MoreVertical,
  X,
  Edit2,
  Archive,
  Trash2,
  Send,
  User,
  Calendar,
  BookOpen,
  AlertCircle,
  Check,
  ExternalLink,
  RotateCcw,
} from "lucide-react";
import { AGENCIES, RESEARCH_DATA } from "../../data/mock-data";

type ModerationStatus = "Pending Review" | "Resolved";
type IssueType = "Incomplete Metadata" | "Duplicate Research" | "Policy Violation";
type SortOption = "newest" | "oldest";

interface FlaggedRecord {
  id: number;
  title: string;
  agency: string;
  agencyAbbr: string;
  uploadedBy: string;
  authors: string[];
  abstract: string;
  issueType: IssueType;
  issueDescription: string;
  publicationYear: number;
  status: ModerationStatus;
  dateFlagged: string;
  metadataCompleteness: number;
  keywords: string[];
  duplicateOf?: { title: string; agency: string };
}

const FLAGGED_RECORDS: FlaggedRecord[] = [
  {
    id: 1,
    title: "Climate Adaptation Strategies in Davao Agriculture",
    agency: "Department of Science and Technology – Region XI",
    agencyAbbr: "DOST XI",
    uploadedBy: "Juan Dela Cruz",
    authors: ["Dr. Maria Santos", "Prof. Ana Reyes"],
    abstract: "This study examines climate adaptation strategies implemented across agricultural communities in the Davao Region, focusing on crop diversification, water management, and resilient farming techniques.",
    issueType: "Duplicate Research",
    issueDescription: "A research record with a highly similar title and overlapping keywords was found submitted by another agency. Manual review is required to determine if this is an intentional resubmission or a duplicate entry.",
    publicationYear: 2025,
    status: "Pending Review",
    dateFlagged: "Mar 4, 2026",
    metadataCompleteness: 85,
    keywords: ["climate adaptation", "agriculture", "Davao Region"],
    duplicateOf: { title: "Climate Adaptation Strategies for Davao Agriculture", agency: "CHED XI" },
  },
  {
    id: 2,
    title: "IoT-Based Water Quality Monitoring System for Davao River",
    agency: "Department of Information and Communications Technology – Region XI",
    agencyAbbr: "DICT XI",
    uploadedBy: "Carlos Reyes",
    authors: ["Eng. Rafael Domingo", "Dr. Carlos Reyes"],
    abstract: "Development and deployment of an Internet of Things (IoT) based water quality monitoring system for real-time environmental data collection along the Davao River system.",
    issueType: "Incomplete Metadata",
    issueDescription: "The submission is missing required metadata fields: DOI, publication venue, funding source, and SDG alignment tags. The abstract also falls below the minimum 200-word requirement.",
    publicationYear: 2026,
    status: "Pending Review",
    dateFlagged: "Mar 3, 2026",
    metadataCompleteness: 52,
    keywords: ["IoT", "water quality", "environmental monitoring"],
  },
  {
    id: 3,
    title: "Aquaculture Best Practices in Southern Mindanao",
    agency: "Southern Mindanao Agriculture Aquatic and Natural Resources Research and Development Consortium",
    agencyAbbr: "SMAARRDEC",
    uploadedBy: "Sofia Aquino",
    authors: ["Dr. Pedro Villanueva", "Dr. Sofia Aquino"],
    abstract: "A comprehensive guide to sustainable aquaculture practices adopted in Southern Mindanao, covering species management, water quality control, and market integration strategies.",
    issueType: "Incomplete Metadata",
    issueDescription: "Missing abstract keywords, author ORCID identifiers, and institutional affiliation data. The publication year format is also inconsistent with system standards.",
    publicationYear: 2025,
    status: "Pending Review",
    dateFlagged: "Mar 2, 2026",
    metadataCompleteness: 61,
    keywords: ["aquaculture", "Southern Mindanao"],
  },
  {
    id: 4,
    title: "Unauthorized Content in Uploaded Research Document",
    agency: "University of Southeastern Philippines",
    agencyAbbr: "USEP",
    uploadedBy: "Miguel Torres",
    authors: ["Prof. Roberto Garcia"],
    abstract: "Research paper on gender equality in STEM education programs across the Davao Region with recommendations for institutional policy reform.",
    issueType: "Policy Violation",
    issueDescription: "The uploaded PDF contains copyrighted figures from a third-party journal without proper attribution or licensing. This violates the RIKMS content policy on intellectual property compliance.",
    publicationYear: 2025,
    status: "Pending Review",
    dateFlagged: "Mar 1, 2026",
    metadataCompleteness: 90,
    keywords: ["gender equality", "STEM", "education"],
  },
  {
    id: 5,
    title: "Economic Impact of Digital Transformation on MSMEs",
    agency: "Department of Trade and Industry – Region XI",
    agencyAbbr: "DTI XI",
    uploadedBy: "Elena Marquez",
    authors: ["Dr. Antonio Mendoza", "Dr. Elena Marquez"],
    abstract: "Analysis of how digital transformation initiatives have impacted micro, small, and medium enterprises in the Davao Region, measuring productivity gains and market expansion.",
    issueType: "Duplicate Research",
    issueDescription: "This research was previously submitted under a different title by the same agency. The content overlap analysis shows 87% similarity with an existing record.",
    publicationYear: 2025,
    status: "Resolved",
    dateFlagged: "Feb 28, 2026",
    metadataCompleteness: 95,
    keywords: ["digital transformation", "MSMEs", "economic impact"],
    duplicateOf: { title: "Digital Transformation Effects on Davao MSMEs", agency: "DTI XI" },
  },
  {
    id: 6,
    title: "Public Health Framework for Disease Surveillance in Region XI",
    agency: "Regional Health Research and Development Consortium XI",
    agencyAbbr: "RHRDC XI",
    uploadedBy: "Ana Fernandez",
    authors: ["Dr. Isabella Cruz", "Dr. Ana Fernandez"],
    abstract: "A proposed public health framework for strengthening disease surveillance capabilities across local government health units in the Davao Region.",
    issueType: "Incomplete Metadata",
    issueDescription: "Author affiliation data is incomplete. Two of the listed co-authors lack institutional email verification, and the funding disclosure section is empty.",
    publicationYear: 2025,
    status: "Resolved",
    dateFlagged: "Feb 27, 2026",
    metadataCompleteness: 73,
    keywords: ["public health", "disease surveillance", "Region XI"],
  },
  {
    id: 7,
    title: "Renewable Energy Potential Assessment for Davao Region",
    agency: "Davao Region Industry Energy and Emerging Technology Research and Development Consortium",
    agencyAbbr: "DRIEERDC",
    uploadedBy: "Andres Ramos",
    authors: ["Eng. Pedro Villanueva", "Dr. Andres Ramos"],
    abstract: "Assessment of solar, wind, and geothermal energy potential across the Davao Region with feasibility analysis for community-scale renewable energy projects.",
    issueType: "Policy Violation",
    issueDescription: "The research document references classified government energy infrastructure data that has not been cleared for public dissemination through the RIKMS platform.",
    publicationYear: 2024,
    status: "Pending Review",
    dateFlagged: "Feb 26, 2026",
    metadataCompleteness: 88,
    keywords: ["renewable energy", "Davao Region", "feasibility"],
  },
  {
    id: 8,
    title: "Coastal Ecosystem Mapping Using Remote Sensing in Davao Gulf",
    agency: "Department of Science and Technology – Region XI",
    agencyAbbr: "DOST XI",
    uploadedBy: "Patricia Lim",
    authors: ["Dr. Maria Santos", "Patricia Lim"],
    abstract: "Application of satellite remote sensing technology for comprehensive mapping and monitoring of coastal ecosystems along the Davao Gulf.",
    issueType: "Incomplete Metadata",
    issueDescription: "Research category and SDG alignment tags are missing. The uploaded file is in an unsupported format (DOCX instead of PDF).",
    publicationYear: 2025,
    status: "Pending Review",
    dateFlagged: "Feb 25, 2026",
    metadataCompleteness: 58,
    keywords: ["remote sensing", "coastal ecosystem", "Davao Gulf"],
  },
  {
    id: 9,
    title: "Higher Education Quality Assurance Metrics in Region XI",
    agency: "Commission on Higher Education – Region XI",
    agencyAbbr: "CHED XI",
    uploadedBy: "Maria Santos",
    authors: ["Prof. Ricardo Bautista", "Dr. Lourdes Tan"],
    abstract: "Development of quality assurance metrics and benchmarking tools for higher education institutions across the Davao Region.",
    issueType: "Duplicate Research",
    issueDescription: "A substantially similar paper was published in the 2024 repository cycle. This appears to be an updated version without proper versioning metadata.",
    publicationYear: 2026,
    status: "Resolved",
    dateFlagged: "Feb 24, 2026",
    metadataCompleteness: 92,
    keywords: ["quality assurance", "higher education", "benchmarking"],
    duplicateOf: { title: "Quality Assurance Framework for HEIs in Davao Region", agency: "CHED XI" },
  },
  {
    id: 10,
    title: "Sustainable Agriculture Practices – Revised Methodology",
    agency: "Southern Mindanao Agriculture Aquatic and Natural Resources Research and Development Consortium",
    agencyAbbr: "SMAARRDEC",
    uploadedBy: "Carmen Navarro",
    authors: ["Dr. Carlos Tan", "Carmen Navarro"],
    abstract: "Revised methodology for implementing sustainable agriculture practices incorporating climate-resilient crop varieties and integrated pest management systems.",
    issueType: "Policy Violation",
    issueDescription: "The revised methodology section contains unverified statistical claims and data sources that cannot be independently validated. Requires author verification before publication.",
    publicationYear: 2025,
    status: "Pending Review",
    dateFlagged: "Feb 23, 2026",
    metadataCompleteness: 79,
    keywords: ["sustainable agriculture", "methodology", "climate-resilient"],
  },
  {
    id: 11,
    title: "Digital Literacy Assessment Tool for Rural Communities",
    agency: "National Economic and Development Authority – Region XI",
    agencyAbbr: "NEDA XI",
    uploadedBy: "Francisco Aguilar",
    authors: ["Dr. Roberto Garcia", "Francisco Aguilar"],
    abstract: "Development of a standardized digital literacy assessment tool designed for deployment in rural communities across the Davao Region.",
    issueType: "Incomplete Metadata",
    issueDescription: "Publication venue and peer review status are not specified. The research methodology section references external datasets without proper citation.",
    publicationYear: 2026,
    status: "Pending Review",
    dateFlagged: "Feb 22, 2026",
    metadataCompleteness: 65,
    keywords: ["digital literacy", "rural communities", "assessment"],
  },
  {
    id: 12,
    title: "Indigenous Knowledge Systems in Mindanao Agriculture",
    agency: "Department of Science and Technology – Region XI",
    agencyAbbr: "DOST XI",
    uploadedBy: "Angelica Reyes",
    authors: ["Dr. Maria Santos", "Angelica Reyes", "Prof. Ana Reyes"],
    abstract: "Documentation and integration of indigenous knowledge systems into modern agricultural practices in Mindanao, with focus on sustainable land management.",
    issueType: "Duplicate Research",
    issueDescription: "Title and abstract closely match a previously archived research record. Content similarity score is 78%, suggesting substantial overlap.",
    publicationYear: 2025,
    status: "Resolved",
    dateFlagged: "Feb 20, 2026",
    metadataCompleteness: 88,
    keywords: ["indigenous knowledge", "agriculture", "Mindanao"],
    duplicateOf: { title: "Indigenous Agricultural Knowledge in Southern Mindanao", agency: "SMAARRDEC" },
  },
];

// Moderation activity log
const MODERATION_LOG = [
  { id: 1, moderator: "System Admin", action: "Approved research", title: "Economic Impact of Digital Transformation on MSMEs", timestamp: "Mar 3, 2026 – 02:15 PM" },
  { id: 2, moderator: "System Admin", action: "Requested revision", title: "Public Health Framework for Disease Surveillance in Region XI", timestamp: "Mar 2, 2026 – 10:30 AM" },
  { id: 3, moderator: "System Admin", action: "Resolved duplicate flag", title: "Higher Education Quality Assurance Metrics in Region XI", timestamp: "Mar 1, 2026 – 04:45 PM" },
  { id: 4, moderator: "System Admin", action: "Archived research", title: "Indigenous Knowledge Systems in Mindanao Agriculture", timestamp: "Feb 28, 2026 – 11:20 AM" },
  { id: 5, moderator: "System Admin", action: "Approved research", title: "Gender Equality in STEM – Updated Version 2.1", timestamp: "Feb 27, 2026 – 09:00 AM" },
];

const ITEMS_PER_PAGE = 8;

/* ─── Status Badge ─── */
function StatusBadge({ status }: { status: ModerationStatus }) {
  const isResolved = status === "Resolved";
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border ${
        isResolved
          ? "bg-green-50 text-green-700 border-green-200"
          : "bg-amber-50 text-amber-700 border-amber-200"
      }`}
      style={{ fontWeight: 600 }}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isResolved ? "bg-green-500" : "bg-amber-500"}`} />
      {status}
    </span>
  );
}

/* ─── Issue Type Badge ─── */
function IssueTypeBadge({ type }: { type: IssueType }) {
  const styles: Record<IssueType, { bg: string; text: string; border: string; icon: typeof AlertTriangle }> = {
    "Incomplete Metadata": { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", icon: AlertCircle },
    "Duplicate Research": { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", icon: Copy },
    "Policy Violation": { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", icon: AlertTriangle },
  };
  const s = styles[type];
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${s.bg} ${s.text} ${s.border}`} style={{ fontWeight: 600 }}>
      <Icon className="w-3 h-3" /> {type}
    </span>
  );
}

/* ─── Metadata Bar ─── */
function MetadataBar({ completeness }: { completeness: number }) {
  const color = completeness >= 80 ? "bg-green-500" : completeness >= 60 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${completeness}%` }} />
      </div>
      <span className="text-[11px] text-gray-500 shrink-0" style={{ fontWeight: 600 }}>{completeness}%</span>
    </div>
  );
}

/* ─── Moderation Review Panel ─── */
function ReviewPanel({ record, onClose }: { record: FlaggedRecord | null; onClose: () => void }) {
  if (!record) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-[560px] bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-[#0F172A]" style={{ fontSize: "1.125rem", fontWeight: 700 }}>
            Moderation Review
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Title & Agency */}
          <div>
            <h3 className="text-[#0F172A] mb-2" style={{ fontSize: "1rem", fontWeight: 700 }}>
              {record.title}
            </h3>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs text-[#1E3A8A] bg-[#1E3A8A]/5 px-2 py-1 rounded-md" style={{ fontWeight: 600 }}>
                {record.agencyAbbr}
              </span>
              <span className="text-xs text-gray-400">{record.publicationYear}</span>
              <StatusBadge status={record.status} />
            </div>
          </div>

          {/* Issue Alert */}
          <div className={`rounded-xl p-4 border ${
            record.issueType === "Policy Violation" ? "bg-red-50/60 border-red-100" :
            record.issueType === "Duplicate Research" ? "bg-orange-50/60 border-orange-100" :
            "bg-blue-50/60 border-blue-100"
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <IssueTypeBadge type={record.issueType} />
            </div>
            <p className="text-sm text-gray-700" style={{ lineHeight: 1.7 }}>
              {record.issueDescription}
            </p>
          </div>

          {/* Authors */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-[#1E3A8A]" />
              <span className="text-xs text-gray-500" style={{ fontWeight: 600 }}>Authors</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {record.authors.map((a) => (
                <span key={a} className="text-xs text-gray-700 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-lg">
                  {a}
                </span>
              ))}
            </div>
          </div>

          {/* Uploaded By */}
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-500 text-xs" style={{ fontWeight: 500 }}>Uploaded by:</span>
            <span className="text-gray-700 text-xs" style={{ fontWeight: 600 }}>
              Agency Admin – {record.agencyAbbr} ({record.uploadedBy})
            </span>
          </div>

          {/* Abstract */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-[#1E3A8A]" />
              <span className="text-xs text-gray-500" style={{ fontWeight: 600 }}>Abstract</span>
            </div>
            <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-4" style={{ lineHeight: 1.7 }}>
              {record.abstract}
            </p>
          </div>

          {/* Keywords */}
          <div>
            <span className="text-xs text-gray-500 mb-2 block" style={{ fontWeight: 600 }}>Keywords</span>
            <div className="flex flex-wrap gap-1.5">
              {record.keywords.map((k) => (
                <span key={k} className="text-[11px] text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">{k}</span>
              ))}
            </div>
          </div>

          {/* Metadata Completeness */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500" style={{ fontWeight: 600 }}>Metadata Completeness</span>
              <span className={`text-xs ${record.metadataCompleteness >= 80 ? "text-green-600" : record.metadataCompleteness >= 60 ? "text-amber-600" : "text-red-600"}`} style={{ fontWeight: 700 }}>
                {record.metadataCompleteness}%
              </span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  record.metadataCompleteness >= 80 ? "bg-green-500" : record.metadataCompleteness >= 60 ? "bg-amber-500" : "bg-red-500"
                }`}
                style={{ width: `${record.metadataCompleteness}%` }}
              />
            </div>
          </div>

          {/* PDF Preview Placeholder */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-[#1E3A8A]" />
              <span className="text-xs text-gray-500" style={{ fontWeight: 600 }}>Uploaded Document</span>
            </div>
            <div className="border border-gray-200 rounded-xl p-6 flex flex-col items-center gap-3 bg-gray-50/50">
              <div className="w-14 h-14 rounded-xl bg-red-50 flex items-center justify-center">
                <FileText className="w-7 h-7 text-red-500" />
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-700" style={{ fontWeight: 600 }}>research-paper.pdf</p>
                <p className="text-xs text-gray-400 mt-0.5">2.4 MB • Uploaded {record.dateFlagged}</p>
              </div>
              <button className="inline-flex items-center gap-1.5 text-xs text-[#1E3A8A] hover:underline" style={{ fontWeight: 500 }}>
                <ExternalLink className="w-3.5 h-3.5" /> Preview Document
              </button>
            </div>
          </div>

          {/* Duplicate Detection */}
          {record.duplicateOf && (
            <div className="border border-orange-200 bg-orange-50/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Copy className="w-4 h-4 text-orange-600" />
                <span className="text-xs text-orange-700" style={{ fontWeight: 700 }}>Possible Duplicate Detected</span>
              </div>
              <div className="bg-white rounded-lg p-3 border border-orange-100">
                <p className="text-sm text-gray-700" style={{ fontWeight: 600 }}>{record.duplicateOf.title}</p>
                <p className="text-xs text-gray-500 mt-1">Agency: {record.duplicateOf.agency}</p>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <button className="text-xs text-orange-700 bg-white border border-orange-200 px-3 py-1.5 rounded-lg hover:bg-orange-100 transition-colors" style={{ fontWeight: 500 }}>
                  View Comparison
                </button>
                <button className="text-xs text-orange-700 bg-white border border-orange-200 px-3 py-1.5 rounded-lg hover:bg-orange-100 transition-colors" style={{ fontWeight: 500 }}>
                  Flag for Review
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-2 px-6 py-4 border-t border-gray-100">
          {record.status === "Pending Review" ? (
            <>
              <button className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors" style={{ fontWeight: 600 }}>
                <CheckCircle2 className="w-4 h-4" /> Approve
              </button>
              <button className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors" style={{ fontWeight: 500 }}>
                <Send className="w-4 h-4" /> Request Revision
              </button>
              <button className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors" style={{ fontWeight: 500 }}>
                <Archive className="w-4 h-4" /> Archive
              </button>
            </>
          ) : (
            <div className="flex-1 text-center">
              <span className="inline-flex items-center gap-2 text-sm text-green-600" style={{ fontWeight: 600 }}>
                <CheckCircle2 className="w-4 h-4" /> This issue has been resolved
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ─── Main Component ─── */
export function ResearchModeration() {
  const [search, setSearch] = useState("");
  const [filterAgency, setFilterAgency] = useState("All");
  const [filterIssueType, setFilterIssueType] = useState<IssueType | "All">("All");
  const [filterStatus, setFilterStatus] = useState<ModerationStatus | "All">("All");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  const [reviewRecord, setReviewRecord] = useState<FlaggedRecord | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const flaggedCount = FLAGGED_RECORDS.filter((r) => r.issueType !== "Duplicate Research" || r.status === "Pending Review").length;
  const pendingCount = FLAGGED_RECORDS.filter((r) => r.status === "Pending Review").length;
  const resolvedCount = FLAGGED_RECORDS.filter((r) => r.status === "Resolved").length;
  const duplicateCount = FLAGGED_RECORDS.filter((r) => r.issueType === "Duplicate Research").length;

  const filtered = FLAGGED_RECORDS.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.agencyAbbr.toLowerCase().includes(search.toLowerCase()) ||
      r.uploadedBy.toLowerCase().includes(search.toLowerCase());
    const matchesAgency = filterAgency === "All" || r.agencyAbbr === filterAgency;
    const matchesIssue = filterIssueType === "All" || r.issueType === filterIssueType;
    const matchesStatus = filterStatus === "All" || r.status === filterStatus;
    return matchesSearch && matchesAgency && matchesIssue && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === "oldest") return a.id - b.id;
    return b.id - a.id;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Duplicates for the detection panel
  const duplicateAlerts = FLAGGED_RECORDS.filter((r) => r.duplicateOf && r.status === "Pending Review");

  return (
    <div className="space-y-6 max-w-[1376px]">
      {/* ─── Page Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[#0F172A] mb-1" style={{ fontSize: "1.5rem", fontWeight: 700 }}>
            Research Integrity & Moderation
          </h1>
          <p className="text-[#6B7280] text-sm">
            Review and moderate research records to ensure metadata completeness and policy compliance.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-200 text-gray-600 text-sm rounded-[10px] hover:bg-gray-50 transition-colors shadow-sm self-start" style={{ fontWeight: 500 }}>
          <Download className="w-4 h-4" /> Export Moderation Report
        </button>
      </div>

      {/* ─── Section 1: Overview Metrics ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Flagged Research Records", value: flaggedCount, icon: Flag, color: "#EA580C", bg: "#FFF7ED" },
          { label: "Pending Review", value: pendingCount, icon: Clock, color: "#D97706", bg: "#FEF3C7" },
          { label: "Resolved Issues", value: resolvedCount, icon: CheckCircle2, color: "#16A34A", bg: "#DCFCE7" },
          { label: "Duplicate Research Alerts", value: duplicateCount, icon: Copy, color: "#7C3AED", bg: "#EDE9FE" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: s.bg }}>
                <Icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
              <div className="min-w-0">
                <p className="text-2xl text-gray-800" style={{ fontWeight: 700 }}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5" style={{ fontWeight: 500 }}>{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Section 2 & 3: Flagged Research Table ─── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Filter Bar */}
        <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search research records..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]/30"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={filterAgency}
              onChange={(e) => { setFilterAgency(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 cursor-pointer"
            >
              <option value="All">All Agencies</option>
              {AGENCIES.map((a) => (
                <option key={a.id} value={a.abbreviation}>{a.abbreviation}</option>
              ))}
            </select>
            <select
              value={filterIssueType}
              onChange={(e) => { setFilterIssueType(e.target.value as IssueType | "All"); setCurrentPage(1); }}
              className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 cursor-pointer"
            >
              <option value="All">All Issue Types</option>
              <option value="Incomplete Metadata">Incomplete Metadata</option>
              <option value="Duplicate Research">Duplicate Research</option>
              <option value="Policy Violation">Policy Violation</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value as ModerationStatus | "All"); setCurrentPage(1); }}
              className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 cursor-pointer"
            >
              <option value="All">All Status</option>
              <option value="Pending Review">Pending Review</option>
              <option value="Resolved">Resolved</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 cursor-pointer"
            >
              <option value="newest">Newest Flagged</option>
              <option value="oldest">Oldest Flagged</option>
            </select>
          </div>
        </div>

        {/* Desktop/Tablet Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80">
                <th className="text-left px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>Research Title</th>
                <th className="text-left px-6 py-3 text-xs text-gray-500 hidden lg:table-cell" style={{ fontWeight: 600 }}>Agency</th>
                <th className="text-left px-6 py-3 text-xs text-gray-500 hidden xl:table-cell" style={{ fontWeight: 600 }}>Uploaded By</th>
                <th className="text-left px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>Issue Type</th>
                <th className="text-center px-6 py-3 text-xs text-gray-500 hidden lg:table-cell" style={{ fontWeight: 600 }}>Year</th>
                <th className="text-left px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>Status</th>
                <th className="text-left px-6 py-3 text-xs text-gray-500 hidden xl:table-cell" style={{ fontWeight: 600 }}>Date Flagged</th>
                <th className="text-right px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50/60 transition-colors group">
                  {/* Title */}
                  <td className="px-6 py-4 max-w-[280px]">
                    <button
                      onClick={() => setReviewRecord(record)}
                      className="text-sm text-[#1E3A8A] hover:underline text-left truncate block max-w-full"
                      style={{ fontWeight: 600 }}
                    >
                      {record.title}
                    </button>
                  </td>

                  {/* Agency */}
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <span className="text-xs text-[#1E3A8A] bg-[#1E3A8A]/5 px-2 py-1 rounded-md" style={{ fontWeight: 600 }}>
                      {record.agencyAbbr}
                    </span>
                  </td>

                  {/* Uploaded By */}
                  <td className="px-6 py-4 hidden xl:table-cell">
                    <div>
                      <p className="text-xs text-gray-600" style={{ fontWeight: 500 }}>{record.uploadedBy}</p>
                      <p className="text-[11px] text-gray-400">Agency Admin – {record.agencyAbbr}</p>
                    </div>
                  </td>

                  {/* Issue Type */}
                  <td className="px-6 py-4">
                    <IssueTypeBadge type={record.issueType} />
                  </td>

                  {/* Year */}
                  <td className="px-6 py-4 text-center hidden lg:table-cell">
                    <span className="text-xs text-gray-500">{record.publicationYear}</span>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <StatusBadge status={record.status} />
                  </td>

                  {/* Date Flagged */}
                  <td className="px-6 py-4 hidden xl:table-cell">
                    <span className="text-xs text-gray-400">{record.dateFlagged}</span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right">
                    <div className="relative inline-flex items-center gap-1">
                      <button
                        onClick={() => setReviewRecord(record)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-[#1E3A8A] hover:bg-[#1E3A8A]/5 transition-colors opacity-0 group-hover:opacity-100"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {record.status === "Pending Review" && (
                        <button
                          className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors opacity-0 group-hover:opacity-100"
                          title="Approve Research"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => setMenuOpen(menuOpen === record.id ? null : record.id)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {menuOpen === record.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(null)} />
                          <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 z-50">
                            <button
                              onClick={() => { setReviewRecord(record); setMenuOpen(null); }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5"
                            >
                              <Eye className="w-3.5 h-3.5 text-gray-400" /> View Details
                            </button>
                            {record.status === "Pending Review" && (
                              <>
                                <button onClick={() => setMenuOpen(null)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Approve Research
                                </button>
                                <button onClick={() => setMenuOpen(null)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5">
                                  <Send className="w-3.5 h-3.5 text-amber-500" /> Request Metadata Revision
                                </button>
                              </>
                            )}
                            <button onClick={() => setMenuOpen(null)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5">
                              <Archive className="w-3.5 h-3.5 text-gray-400" /> Archive Research
                            </button>
                            <div className="border-t border-gray-100 my-1" />
                            <button onClick={() => setMenuOpen(null)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5">
                              <Trash2 className="w-3.5 h-3.5" /> Delete Research
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ─── Mobile Card Layout ─── */}
        <div className="md:hidden divide-y divide-gray-100">
          {paginated.map((record) => (
            <div key={`mobile-${record.id}`} className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <IssueTypeBadge type={record.issueType} />
                <StatusBadge status={record.status} />
              </div>
              <button
                onClick={() => setReviewRecord(record)}
                className="text-sm text-[#1E3A8A] hover:underline text-left mb-2 block"
                style={{ fontWeight: 600 }}
              >
                {record.title}
              </button>
              <div className="flex items-center gap-3 text-xs text-gray-500 mb-3 flex-wrap">
                <span className="text-[#1E3A8A] bg-[#1E3A8A]/5 px-2 py-0.5 rounded" style={{ fontWeight: 600 }}>
                  {record.agencyAbbr}
                </span>
                <span>{record.publicationYear}</span>
                <span className="text-gray-400">{record.dateFlagged}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setReviewRecord(record)}
                  className="flex-1 text-center text-xs text-[#1E3A8A] bg-[#1E3A8A]/5 py-2 rounded-lg hover:bg-[#1E3A8A]/10 transition-colors"
                  style={{ fontWeight: 600 }}
                >
                  View Details
                </button>
                {record.status === "Pending Review" && (
                  <>
                    <button className="flex-1 text-center text-xs text-green-700 bg-green-50 py-2 rounded-lg hover:bg-green-100 transition-colors" style={{ fontWeight: 500 }}>
                      Approve
                    </button>
                    <button className="flex-1 text-center text-xs text-amber-700 bg-amber-50 py-2 rounded-lg hover:bg-amber-100 transition-colors" style={{ fontWeight: 500 }}>
                      Revise
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="px-5 sm:px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filtered.length)}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} records
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
                key={`page-${page}`}
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

      {/* ─── Section 5: Duplicate Research Detection ─── */}
      {duplicateAlerts.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center">
              <Copy className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <h2 className="text-[#0F172A] text-sm" style={{ fontWeight: 700 }}>Duplicate Research Detection</h2>
              <p className="text-xs text-gray-400">Potential duplicates requiring manual verification.</p>
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {duplicateAlerts.map((record) => (
              <div key={`dup-${record.id}`} className="px-6 py-4">
                <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-[11px] text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full" style={{ fontWeight: 600 }}>
                        Possible duplicate detected
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <p className="text-[10px] text-gray-400 mb-1" style={{ fontWeight: 600 }}>ORIGINAL</p>
                        <p className="text-sm text-gray-700" style={{ fontWeight: 600 }}>{record.title}</p>
                        <p className="text-xs text-gray-400 mt-1">Agency: {record.agencyAbbr}</p>
                      </div>
                      <div className="bg-orange-50/50 rounded-lg p-3 border border-orange-100">
                        <p className="text-[10px] text-orange-500 mb-1" style={{ fontWeight: 600 }}>MATCHING RECORD</p>
                        <p className="text-sm text-gray-700" style={{ fontWeight: 600 }}>{record.duplicateOf!.title}</p>
                        <p className="text-xs text-gray-400 mt-1">Agency: {record.duplicateOf!.agency}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setReviewRecord(record)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                      style={{ fontWeight: 500 }}
                    >
                      <Eye className="w-3.5 h-3.5" /> View Comparison
                    </button>
                    <button className="inline-flex items-center gap-1.5 px-3 py-2 text-xs bg-orange-50 border border-orange-200 rounded-lg text-orange-700 hover:bg-orange-100 transition-colors" style={{ fontWeight: 500 }}>
                      <Flag className="w-3.5 h-3.5" /> Flag for Review
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Section 6: Moderation Activity Log ─── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#1E3A8A]/10 flex items-center justify-center">
            <RotateCcw className="w-4 h-4 text-[#1E3A8A]" />
          </div>
          <div>
            <h2 className="text-[#0F172A] text-sm" style={{ fontWeight: 700 }}>Moderation Activity Log</h2>
            <p className="text-xs text-gray-400">Recent moderation actions performed by administrators.</p>
          </div>
        </div>
        <div className="divide-y divide-gray-50">
          {MODERATION_LOG.map((entry) => {
            const actionColor =
              entry.action.includes("Approved") ? "text-green-600 bg-green-50" :
              entry.action.includes("Archived") ? "text-gray-600 bg-gray-100" :
              entry.action.includes("Resolved") ? "text-blue-600 bg-blue-50" :
              "text-amber-600 bg-amber-50";
            const ActionIcon =
              entry.action.includes("Approved") ? CheckCircle2 :
              entry.action.includes("Archived") ? Archive :
              entry.action.includes("Resolved") ? Check :
              Send;

            return (
              <div key={`log-${entry.id}`} className="px-6 py-3.5 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${actionColor}`}>
                  <ActionIcon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700">
                    <span style={{ fontWeight: 600 }}>{entry.moderator}</span>{" "}
                    <span className="text-gray-400">{entry.action}:</span>{" "}
                    <span className="text-gray-600">{entry.title}</span>
                  </p>
                </div>
                <span className="text-xs text-gray-400 shrink-0 hidden sm:block">{entry.timestamp}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Review Panel ─── */}
      <ReviewPanel record={reviewRecord} onClose={() => setReviewRecord(null)} />
    </div>
  );
}

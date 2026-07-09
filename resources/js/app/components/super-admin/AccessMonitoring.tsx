import { useState } from "react";
import {
  Eye,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  User,
  FileText,
  ChevronLeft,
  ChevronRight,
  Download,
  Shield,
  MoreVertical,
  X,
  Mail,
  Globe,
  Calendar,
  ExternalLink,
  ShieldCheck,
  ShieldOff,
  RotateCcw,
  Hourglass,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { AGENCIES } from "../../data/mock-data";

type RequestStatus = "Pending" | "Approved" | "Denied";
type SortOption = "newest" | "oldest";

interface TimelineEntry {
  user: string;
  action: string;
  timestamp: string;
}

interface AccessRequest {
  id: number;
  requesterName: string;
  email: string;
  organization: string;
  researchTitle: string;
  agencyAbbr: string;
  agencyFull: string;
  requestDate: string;
  status: RequestStatus;
  reviewedBy: string;
  purpose: string;
  timeline: TimelineEntry[];
}

const MOCK_REQUESTS: AccessRequest[] = [
  {
    id: 1,
    requesterName: "Maria Santos",
    email: "maria.santos@email.com",
    organization: "University of the Philippines – Mindanao",
    researchTitle: "Climate Adaptation Strategies in Davao Agriculture",
    agencyAbbr: "DOST XI",
    agencyFull: "Department of Science and Technology – Region XI",
    requestDate: "Mar 5, 2026 – 09:22 AM",
    status: "Pending",
    reviewedBy: "—",
    purpose: "Academic research reference for doctoral dissertation on climate-resilient farming practices in the Davao Region.",
    timeline: [
      { user: "Maria Santos", action: "Request Submitted", timestamp: "Mar 5, 2026 – 09:22 AM" },
    ],
  },
  {
    id: 2,
    requesterName: "Juan Dela Cruz",
    email: "juan.delacruz@usep.edu.ph",
    organization: "University of Southeastern Philippines",
    researchTitle: "IoT-Based Water Quality Monitoring System for Davao River",
    agencyAbbr: "DICT XI",
    agencyFull: "Department of Information and Communications Technology – Region XI",
    requestDate: "Mar 5, 2026 – 08:10 AM",
    status: "Approved",
    reviewedBy: "Agency Admin – DICT XI",
    purpose: "Thesis reference for undergraduate capstone project on environmental monitoring systems.",
    timeline: [
      { user: "Juan Dela Cruz", action: "Request Submitted", timestamp: "Mar 5, 2026 – 08:10 AM" },
      { user: "Agency Admin – DICT XI", action: "Request Approved", timestamp: "Mar 5, 2026 – 10:45 AM" },
    ],
  },
  {
    id: 3,
    requesterName: "Ana Reyes",
    email: "ana.reyes@addu.edu.ph",
    organization: "Ateneo de Davao University",
    researchTitle: "Public Health Framework for Disease Surveillance in Region XI",
    agencyAbbr: "RHRDC XI",
    agencyFull: "Regional Health Research and Development Consortium XI",
    requestDate: "Mar 4, 2026 – 02:30 PM",
    status: "Approved",
    reviewedBy: "Agency Admin – RHRDC XI",
    purpose: "Policy research on strengthening disease surveillance mechanisms in local government health units.",
    timeline: [
      { user: "Ana Reyes", action: "Request Submitted", timestamp: "Mar 4, 2026 – 02:30 PM" },
      { user: "Agency Admin – RHRDC XI", action: "Request Approved", timestamp: "Mar 4, 2026 – 04:15 PM" },
      { user: "Super Admin", action: "Decision Reviewed", timestamp: "Mar 4, 2026 – 05:00 PM" },
    ],
  },
  {
    id: 4,
    requesterName: "Roberto Garcia",
    email: "roberto.garcia@dti.gov.ph",
    organization: "Department of Trade and Industry – Central Office",
    researchTitle: "Economic Impact of Digital Transformation on MSMEs",
    agencyAbbr: "DTI XI",
    agencyFull: "Department of Trade and Industry – Region XI",
    requestDate: "Mar 4, 2026 – 11:05 AM",
    status: "Pending",
    reviewedBy: "—",
    purpose: "Policy development reference for national MSME digital transformation strategy.",
    timeline: [
      { user: "Roberto Garcia", action: "Request Submitted", timestamp: "Mar 4, 2026 – 11:05 AM" },
    ],
  },
  {
    id: 5,
    requesterName: "Elena Marquez",
    email: "elena.marquez@dict.gov.ph",
    organization: "DICT – Regional Office XI",
    researchTitle: "Cybersecurity Readiness Assessment for Government Agencies",
    agencyAbbr: "DICT XI",
    agencyFull: "Department of Information and Communications Technology – Region XI",
    requestDate: "Mar 3, 2026 – 04:45 PM",
    status: "Denied",
    reviewedBy: "Agency Admin – DICT XI",
    purpose: "Internal agency reference for cybersecurity capacity assessment.",
    timeline: [
      { user: "Elena Marquez", action: "Request Submitted", timestamp: "Mar 3, 2026 – 04:45 PM" },
      { user: "Agency Admin – DICT XI", action: "Request Denied – Restricted content", timestamp: "Mar 4, 2026 – 09:00 AM" },
    ],
  },
  {
    id: 6,
    requesterName: "Carlos Tan",
    email: "carlos.tan@neda.gov.ph",
    organization: "National Economic and Development Authority",
    researchTitle: "Regional Development Planning Using Geospatial Analysis",
    agencyAbbr: "NEDA XI",
    agencyFull: "National Economic and Development Authority – Region XI",
    requestDate: "Mar 3, 2026 – 10:20 AM",
    status: "Approved",
    reviewedBy: "Agency Admin – NEDA XI",
    purpose: "Agency reference for regional socioeconomic development planning and geospatial data integration.",
    timeline: [
      { user: "Carlos Tan", action: "Request Submitted", timestamp: "Mar 3, 2026 – 10:20 AM" },
      { user: "Agency Admin – NEDA XI", action: "Request Approved", timestamp: "Mar 3, 2026 – 11:30 AM" },
    ],
  },
  {
    id: 7,
    requesterName: "Patricia Navarro",
    email: "patricia.navarro@dlsu.edu.ph",
    organization: "De La Salle University",
    researchTitle: "Renewable Energy Potential Assessment for Davao Region",
    agencyAbbr: "DRIEERDC",
    agencyFull: "Davao Region Industry Energy and Emerging Technology Research and Development Consortium",
    requestDate: "Mar 5, 2026 – 01:15 PM",
    status: "Pending",
    reviewedBy: "—",
    purpose: "Comparative study on renewable energy adoption across Philippine regions for master's thesis.",
    timeline: [
      { user: "Patricia Navarro", action: "Request Submitted", timestamp: "Mar 5, 2026 – 01:15 PM" },
    ],
  },
  {
    id: 8,
    requesterName: "Luis Bautista",
    email: "luis.bautista@ched.gov.ph",
    organization: "Commission on Higher Education – Central Office",
    researchTitle: "Digital Literacy Programs and Their Effect on Rural Education",
    agencyAbbr: "CHED XI",
    agencyFull: "Commission on Higher Education – Region XI",
    requestDate: "Mar 2, 2026 – 03:40 PM",
    status: "Approved",
    reviewedBy: "Agency Admin – CHED XI",
    purpose: "Policy review and benchmarking of regional digital literacy programs.",
    timeline: [
      { user: "Luis Bautista", action: "Request Submitted", timestamp: "Mar 2, 2026 – 03:40 PM" },
      { user: "Agency Admin – CHED XI", action: "Request Approved", timestamp: "Mar 2, 2026 – 05:10 PM" },
    ],
  },
  {
    id: 9,
    requesterName: "Sophia Aquino",
    email: "sophia.aquino@um.edu.ph",
    organization: "University of Mindanao",
    researchTitle: "Sustainable Agriculture Practices in Southern Mindanao",
    agencyAbbr: "SMAARRDEC",
    agencyFull: "Southern Mindanao Agriculture Aquatic and Natural Resources Research and Development Consortium",
    requestDate: "Mar 2, 2026 – 09:30 AM",
    status: "Approved",
    reviewedBy: "Agency Admin – SMAARRDEC",
    purpose: "Academic research on sustainable farming techniques for undergraduate agriculture program.",
    timeline: [
      { user: "Sophia Aquino", action: "Request Submitted", timestamp: "Mar 2, 2026 – 09:30 AM" },
      { user: "Agency Admin – SMAARRDEC", action: "Request Approved", timestamp: "Mar 2, 2026 – 11:00 AM" },
    ],
  },
  {
    id: 10,
    requesterName: "Miguel Torres",
    email: "miguel.torres@pup.edu.ph",
    organization: "Polytechnic University of the Philippines",
    researchTitle: "Indigenous Knowledge Systems in Mindanao Agriculture",
    agencyAbbr: "DOST XI",
    agencyFull: "Department of Science and Technology – Region XI",
    requestDate: "Mar 1, 2026 – 08:55 AM",
    status: "Denied",
    reviewedBy: "Agency Admin – DOST XI",
    purpose: "Reference for comparative study on indigenous agricultural practices across Philippine regions.",
    timeline: [
      { user: "Miguel Torres", action: "Request Submitted", timestamp: "Mar 1, 2026 – 08:55 AM" },
      { user: "Agency Admin – DOST XI", action: "Request Denied – Insufficient justification", timestamp: "Mar 1, 2026 – 02:20 PM" },
    ],
  },
  {
    id: 11,
    requesterName: "Teresa Mendez",
    email: "teresa.mendez@doh.gov.ph",
    organization: "Department of Health – Region XI",
    researchTitle: "Aquaculture Best Practices in Southern Mindanao",
    agencyAbbr: "SMAARRDEC",
    agencyFull: "Southern Mindanao Agriculture Aquatic and Natural Resources Research and Development Consortium",
    requestDate: "Feb 28, 2026 – 10:15 AM",
    status: "Approved",
    reviewedBy: "Agency Admin – SMAARRDEC",
    purpose: "Cross-agency reference for food security and nutrition policy development.",
    timeline: [
      { user: "Teresa Mendez", action: "Request Submitted", timestamp: "Feb 28, 2026 – 10:15 AM" },
      { user: "Agency Admin – SMAARRDEC", action: "Request Approved", timestamp: "Feb 28, 2026 – 03:30 PM" },
    ],
  },
  {
    id: 12,
    requesterName: "Rafael Domingo",
    email: "rafael.domingo@pldt.com.ph",
    organization: "PLDT Enterprise",
    researchTitle: "Higher Education Quality Assurance Metrics in Region XI",
    agencyAbbr: "CHED XI",
    agencyFull: "Commission on Higher Education – Region XI",
    requestDate: "Feb 27, 2026 – 02:00 PM",
    status: "Denied",
    reviewedBy: "Agency Admin – CHED XI",
    purpose: "Private sector reference for corporate social responsibility programs in education.",
    timeline: [
      { user: "Rafael Domingo", action: "Request Submitted", timestamp: "Feb 27, 2026 – 02:00 PM" },
      { user: "Agency Admin – CHED XI", action: "Request Denied – Private sector access restricted", timestamp: "Feb 28, 2026 – 09:10 AM" },
    ],
  },
  {
    id: 13,
    requesterName: "Lourdes Tan",
    email: "lourdes.tan@worldbank.org",
    organization: "World Bank – Philippines",
    researchTitle: "Economic Impact of Digital Transformation on MSMEs",
    agencyAbbr: "DTI XI",
    agencyFull: "Department of Trade and Industry – Region XI",
    requestDate: "Feb 26, 2026 – 11:30 AM",
    status: "Approved",
    reviewedBy: "Agency Admin – DTI XI",
    purpose: "International development research on MSME digital transformation in Southeast Asia.",
    timeline: [
      { user: "Lourdes Tan", action: "Request Submitted", timestamp: "Feb 26, 2026 – 11:30 AM" },
      { user: "Agency Admin – DTI XI", action: "Request Approved", timestamp: "Feb 26, 2026 – 04:00 PM" },
      { user: "Super Admin", action: "Decision Reviewed", timestamp: "Feb 27, 2026 – 10:00 AM" },
    ],
  },
  {
    id: 14,
    requesterName: "Carmen Navarro",
    email: "carmen.navarro@deped.gov.ph",
    organization: "Department of Education – Region XI",
    researchTitle: "Digital Literacy Assessment Tool for Rural Communities",
    agencyAbbr: "NEDA XI",
    agencyFull: "National Economic and Development Authority – Region XI",
    requestDate: "Feb 25, 2026 – 09:45 AM",
    status: "Pending",
    reviewedBy: "—",
    purpose: "Educational program development for rural digital literacy initiatives.",
    timeline: [
      { user: "Carmen Navarro", action: "Request Submitted", timestamp: "Feb 25, 2026 – 09:45 AM" },
    ],
  },
  {
    id: 15,
    requesterName: "Andres Ramos",
    email: "andres.ramos@usep.edu.ph",
    organization: "University of Southeastern Philippines",
    researchTitle: "Coastal Ecosystem Mapping Using Remote Sensing in Davao Gulf",
    agencyAbbr: "DOST XI",
    agencyFull: "Department of Science and Technology – Region XI",
    requestDate: "Feb 24, 2026 – 03:20 PM",
    status: "Approved",
    reviewedBy: "Agency Admin – DOST XI",
    purpose: "Faculty research on coastal ecosystem monitoring methodologies.",
    timeline: [
      { user: "Andres Ramos", action: "Request Submitted", timestamp: "Feb 24, 2026 – 03:20 PM" },
      { user: "Agency Admin – DOST XI", action: "Request Approved", timestamp: "Feb 25, 2026 – 10:15 AM" },
    ],
  },
];

// Analytics data
const REQUESTS_BY_AGENCY = AGENCIES.map((a) => ({
  name: a.abbreviation,
  requests: MOCK_REQUESTS.filter((r) => r.agencyAbbr === a.abbreviation).length,
})).filter((d) => d.requests > 0).sort((a, b) => b.requests - a.requests);

const STATUS_DISTRIBUTION = [
  { name: "Approved", value: MOCK_REQUESTS.filter((r) => r.status === "Approved").length, color: "#16A34A" },
  { name: "Pending", value: MOCK_REQUESTS.filter((r) => r.status === "Pending").length, color: "#D97706" },
  { name: "Denied", value: MOCK_REQUESTS.filter((r) => r.status === "Denied").length, color: "#DC2626" },
];

const ITEMS_PER_PAGE = 8;

/* ─── Status Badge ─── */
function StatusBadge({ status }: { status: RequestStatus }) {
  const styles: Record<RequestStatus, { bg: string; text: string; border: string; dot: string }> = {
    Pending: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
    Approved: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", dot: "bg-green-500" },
    Denied: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500" },
  };
  const s = styles[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border ${s.bg} ${s.text} ${s.border}`} style={{ fontWeight: 600 }}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}

/* ─── Request Detail Panel ─── */
function RequestDetailPanel({ request, onClose }: { request: AccessRequest | null; onClose: () => void }) {
  if (!request) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-[520px] bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-[#0F172A]" style={{ fontSize: "1.125rem", fontWeight: 700 }}>
            Request Details
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Status */}
          <div className="flex items-center justify-between">
            <StatusBadge status={request.status} />
            <span className="text-xs text-gray-400">{request.requestDate}</span>
          </div>

          {/* Requester Info */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-[#1E3A8A]" />
              <span className="text-xs text-gray-500" style={{ fontWeight: 700 }}>Requester Information</span>
            </div>
            <div className="grid grid-cols-1 gap-2.5">
              <div>
                <span className="text-[11px] text-gray-400 block" style={{ fontWeight: 500 }}>Full Name</span>
                <span className="text-sm text-gray-800" style={{ fontWeight: 600 }}>{request.requesterName}</span>
              </div>
              <div>
                <span className="text-[11px] text-gray-400 block" style={{ fontWeight: 500 }}>Email Address</span>
                <span className="text-sm text-gray-700 flex items-center gap-1"><Mail className="w-3 h-3 text-gray-400" /> {request.email}</span>
              </div>
              <div>
                <span className="text-[11px] text-gray-400 block" style={{ fontWeight: 500 }}>Organization</span>
                <span className="text-sm text-gray-700 flex items-center gap-1"><Globe className="w-3 h-3 text-gray-400" /> {request.organization}</span>
              </div>
            </div>
          </div>

          {/* Purpose */}
          <div>
            <span className="text-xs text-gray-500 block mb-2" style={{ fontWeight: 700 }}>Purpose of Request</span>
            <p className="text-sm text-gray-600 bg-blue-50/50 border border-blue-100 rounded-xl p-4" style={{ lineHeight: 1.7 }}>
              {request.purpose}
            </p>
          </div>

          {/* Research Record */}
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-[#1E3A8A]" />
              <span className="text-xs text-gray-500" style={{ fontWeight: 700 }}>Requested Research Record</span>
            </div>
            <p className="text-sm text-[#1E3A8A] mb-2" style={{ fontWeight: 600 }}>{request.researchTitle}</p>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs text-[#1E3A8A] bg-[#1E3A8A]/5 px-2 py-0.5 rounded" style={{ fontWeight: 600 }}>
                {request.agencyAbbr}
              </span>
              <span className="text-xs text-gray-400">{request.agencyFull}</span>
            </div>
          </div>

          {/* Review History */}
          {request.reviewedBy !== "—" && (
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4 text-green-600" />
                <span className="text-xs text-gray-500" style={{ fontWeight: 700 }}>Reviewed By</span>
              </div>
              <p className="text-sm text-gray-700" style={{ fontWeight: 600 }}>{request.reviewedBy}</p>
            </div>
          )}

          {/* Timeline */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-[#1E3A8A]" />
              <span className="text-xs text-gray-500" style={{ fontWeight: 700 }}>Request Activity Timeline</span>
            </div>
            <div className="relative pl-5">
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-200" />
              <div className="space-y-4">
                {request.timeline.map((entry, i) => {
                  const isLast = i === request.timeline.length - 1;
                  const dotColor = entry.action.includes("Denied") ? "bg-red-500" :
                    entry.action.includes("Approved") ? "bg-green-500" :
                    entry.action.includes("Reviewed") ? "bg-blue-500" : "bg-gray-400";
                  return (
                    <div key={`tl-${request.id}-${i}`} className="relative">
                      <div className={`absolute -left-5 top-1 w-3.5 h-3.5 rounded-full border-2 border-white ${dotColor}`} />
                      <div className="bg-white border border-gray-100 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-800" style={{ fontWeight: 600 }}>{entry.action}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-gray-500">{entry.user}</span>
                          <span className="text-[11px] text-gray-400">{entry.timestamp}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-2 px-6 py-4 border-t border-gray-100">
          <button className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 text-sm text-[#1E3A8A] border border-[#1E3A8A]/20 rounded-lg hover:bg-[#1E3A8A]/5 transition-colors" style={{ fontWeight: 500 }}>
            <ExternalLink className="w-4 h-4" /> View Research
          </button>
          {request.status === "Denied" && (
            <button className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors" style={{ fontWeight: 600 }}>
              <ShieldCheck className="w-4 h-4" /> Override – Approve
            </button>
          )}
          {request.status === "Approved" && (
            <button className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors" style={{ fontWeight: 500 }}>
              <ShieldOff className="w-4 h-4" /> Override – Deny
            </button>
          )}
          {request.status === "Pending" && (
            <span className="flex-1 text-center text-xs text-amber-600" style={{ fontWeight: 500 }}>
              Awaiting Agency Admin review
            </span>
          )}
        </div>
      </div>
    </>
  );
}

/* ─── Custom Tooltip for charts ─── */
function CustomBarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white shadow-lg border border-gray-200 rounded-lg px-3 py-2">
      <p className="text-xs text-gray-800" style={{ fontWeight: 600 }}>{label}</p>
      <p className="text-xs text-[#1E3A8A]">{payload[0].value} requests</p>
    </div>
  );
}

/* ─── Main Component ─── */
export function AccessMonitoring() {
  const [search, setSearch] = useState("");
  const [filterAgency, setFilterAgency] = useState("All");
  const [filterStatus, setFilterStatus] = useState<RequestStatus | "All">("All");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  const [detailRequest, setDetailRequest] = useState<AccessRequest | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const totalRequests = MOCK_REQUESTS.length;
  const pendingCount = MOCK_REQUESTS.filter((r) => r.status === "Pending").length;
  const approvedCount = MOCK_REQUESTS.filter((r) => r.status === "Approved").length;
  const deniedCount = MOCK_REQUESTS.filter((r) => r.status === "Denied").length;

  const filtered = MOCK_REQUESTS.filter((r) => {
    const matchesSearch =
      r.requesterName.toLowerCase().includes(search.toLowerCase()) ||
      r.researchTitle.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase());
    const matchesAgency = filterAgency === "All" || r.agencyAbbr === filterAgency;
    const matchesStatus = filterStatus === "All" || r.status === filterStatus;
    return matchesSearch && matchesAgency && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === "oldest") return a.id - b.id;
    return b.id - a.id;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 max-w-[1376px]">
      {/* ─── Page Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[#0F172A] mb-1" style={{ fontSize: "1.5rem", fontWeight: 700 }}>
            Access Request Monitoring
          </h1>
          <p className="text-[#6B7280] text-sm">
            Monitor research download requests submitted across all participating agencies.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-200 text-gray-600 text-sm rounded-[10px] hover:bg-gray-50 transition-colors shadow-sm self-start" style={{ fontWeight: 500 }}>
          <Download className="w-4 h-4" /> Export Access Report
        </button>
      </div>

      {/* ─── Section 1: Overview Metrics ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Access Requests", value: totalRequests, icon: Eye, color: "#1E3A8A", bg: "#DBEAFE" },
          { label: "Pending Requests", value: pendingCount, icon: Hourglass, color: "#D97706", bg: "#FEF3C7" },
          { label: "Approved Requests", value: approvedCount, icon: CheckCircle2, color: "#16A34A", bg: "#DCFCE7" },
          { label: "Denied Requests", value: deniedCount, icon: XCircle, color: "#DC2626", bg: "#FEE2E2" },
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

      {/* ─── Section 2 & 3: Filters + Table ─── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Filter Bar */}
        <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search requester, research title, or email..."
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
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value as RequestStatus | "All"); setCurrentPage(1); }}
              className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 cursor-pointer"
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Denied">Denied</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 cursor-pointer"
            >
              <option value="newest">Newest Requests</option>
              <option value="oldest">Oldest Requests</option>
            </select>
          </div>
        </div>

        {/* Desktop/Tablet Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80">
                <th className="text-left px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>Requester</th>
                <th className="text-left px-6 py-3 text-xs text-gray-500 hidden xl:table-cell" style={{ fontWeight: 600 }}>Organization</th>
                <th className="text-left px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>Research Title</th>
                <th className="text-left px-6 py-3 text-xs text-gray-500 hidden lg:table-cell" style={{ fontWeight: 600 }}>Agency</th>
                <th className="text-left px-6 py-3 text-xs text-gray-500 hidden xl:table-cell" style={{ fontWeight: 600 }}>Request Date</th>
                <th className="text-left px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>Status</th>
                <th className="text-left px-6 py-3 text-xs text-gray-500 hidden lg:table-cell" style={{ fontWeight: 600 }}>Reviewed By</th>
                <th className="text-right px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50/60 transition-colors group">
                  {/* Requester */}
                  <td className="px-6 py-4">
                    <div className="min-w-0">
                      <p className="text-sm text-gray-800" style={{ fontWeight: 600 }}>{req.requesterName}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {req.email}
                      </p>
                    </div>
                  </td>

                  {/* Organization */}
                  <td className="px-6 py-4 hidden xl:table-cell">
                    <span className="text-xs text-gray-600 max-w-[180px] truncate block">{req.organization}</span>
                  </td>

                  {/* Research Title */}
                  <td className="px-6 py-4 max-w-[240px]">
                    <button
                      onClick={() => setDetailRequest(req)}
                      className="text-sm text-[#1E3A8A] hover:underline text-left truncate block max-w-full"
                      style={{ fontWeight: 500 }}
                    >
                      {req.researchTitle}
                    </button>
                  </td>

                  {/* Agency */}
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <span className="text-xs text-[#1E3A8A] bg-[#1E3A8A]/5 px-2 py-1 rounded-md" style={{ fontWeight: 600 }}>
                      {req.agencyAbbr}
                    </span>
                  </td>

                  {/* Request Date */}
                  <td className="px-6 py-4 hidden xl:table-cell">
                    <span className="text-xs text-gray-400">{req.requestDate}</span>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <StatusBadge status={req.status} />
                  </td>

                  {/* Reviewed By */}
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <span className="text-xs text-gray-500">{req.reviewedBy}</span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right">
                    <div className="relative inline-flex items-center gap-1">
                      <button
                        onClick={() => setDetailRequest(req)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-[#1E3A8A] hover:bg-[#1E3A8A]/5 transition-colors opacity-0 group-hover:opacity-100"
                        title="View Request Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setMenuOpen(menuOpen === req.id ? null : req.id)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {menuOpen === req.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(null)} />
                          <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 z-50">
                            <button
                              onClick={() => { setDetailRequest(req); setMenuOpen(null); }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5"
                            >
                              <Eye className="w-3.5 h-3.5 text-gray-400" /> View Request Details
                            </button>
                            <button onClick={() => setMenuOpen(null)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5">
                              <Shield className="w-3.5 h-3.5 text-gray-400" /> Audit Decision
                            </button>
                            {req.status === "Denied" && (
                              <button onClick={() => setMenuOpen(null)} className="w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-50 flex items-center gap-2.5">
                                <ShieldCheck className="w-3.5 h-3.5 text-green-500" /> Override – Approve
                              </button>
                            )}
                            {req.status === "Approved" && (
                              <button onClick={() => setMenuOpen(null)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5">
                                <ShieldOff className="w-3.5 h-3.5 text-red-500" /> Override – Deny
                              </button>
                            )}
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
          {paginated.map((req) => (
            <div key={`mobile-${req.id}`} className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-sm text-gray-800" style={{ fontWeight: 600 }}>{req.requesterName}</p>
                <StatusBadge status={req.status} />
              </div>
              <button
                onClick={() => setDetailRequest(req)}
                className="text-sm text-[#1E3A8A] hover:underline text-left mb-2 block truncate max-w-full"
                style={{ fontWeight: 500 }}
              >
                {req.researchTitle}
              </button>
              <div className="flex items-center gap-3 text-xs text-gray-500 mb-3 flex-wrap">
                <span className="text-[#1E3A8A] bg-[#1E3A8A]/5 px-2 py-0.5 rounded" style={{ fontWeight: 600 }}>
                  {req.agencyAbbr}
                </span>
                <span className="text-gray-400">{req.organization}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDetailRequest(req)}
                  className="flex-1 text-center text-xs text-[#1E3A8A] bg-[#1E3A8A]/5 py-2 rounded-lg hover:bg-[#1E3A8A]/10 transition-colors"
                  style={{ fontWeight: 600 }}
                >
                  View Details
                </button>
                <button className="flex-1 text-center text-xs text-gray-600 bg-gray-50 py-2 rounded-lg hover:bg-gray-100 transition-colors" style={{ fontWeight: 500 }}>
                  Audit
                </button>
                <button className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="px-5 sm:px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filtered.length)}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} requests
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

      {/* ─── Section 6: Access Request Analytics ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Requests by Agency (Bar Chart) */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-[#0F172A] mb-1" style={{ fontSize: "0.875rem", fontWeight: 700 }}>
            Requests by Agency
          </h3>
          <p className="text-xs text-gray-400 mb-4">Distribution of access requests across agencies.</p>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={REQUESTS_BY_AGENCY} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 0 }}>
                <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                <XAxis key="x-axis" type="number" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis key="y-axis" type="category" dataKey="name" tick={{ fontSize: 11, fill: "#6B7280", fontWeight: 500 }} axisLine={false} tickLine={false} width={80} />
                <Tooltip key="tooltip" content={<CustomBarTooltip />} />
                <Bar key="bar-requests" dataKey="requests" fill="#1E3A8A" radius={[0, 6, 6, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Requests by Status (Donut Chart) */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-[#0F172A] mb-1" style={{ fontSize: "0.875rem", fontWeight: 700 }}>
            Requests by Status
          </h3>
          <p className="text-xs text-gray-400 mb-4">Overall status distribution of access requests.</p>
          <div className="h-[260px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  key="pie-status"
                  data={STATUS_DISTRIBUTION}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {STATUS_DISTRIBUTION.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  key="pie-tooltip"
                  formatter={(value: number, name: string) => [`${value} requests`, name]}
                  contentStyle={{ borderRadius: "8px", fontSize: "12px", border: "1px solid #E5E7EB" }}
                />
                <Legend
                  key="pie-legend"
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  formatter={(value: string) => (
                    <span className="text-xs text-gray-600" style={{ fontWeight: 500 }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Summary */}
          <div className="flex items-center justify-center gap-6 mt-2">
            {STATUS_DISTRIBUTION.map((s) => (
              <div key={`stat-${s.name}`} className="text-center">
                <p className="text-lg text-gray-800" style={{ fontWeight: 700 }}>{s.value}</p>
                <p className="text-[11px] text-gray-500" style={{ fontWeight: 500 }}>{s.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Detail Panel ─── */}
      <RequestDetailPanel request={detailRequest} onClose={() => setDetailRequest(null)} />
    </div>
  );
}
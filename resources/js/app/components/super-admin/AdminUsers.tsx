import { useState } from "react";
import {
  Users,
  Search,
  Plus,
  MoreVertical,
  Shield,
  Mail,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  KeyRound,
  UserCog,
  Eye,
  Power,
  X,
  UserPlus,
  Calendar,
  Activity,
  LogIn,
  Globe,
  Send,
  Lock,
} from "lucide-react";
import { AGENCIES } from "../../data/mock-data";

type UserStatus = "Active" | "Inactive";
type SortOption = "newest" | "last-login" | "alphabetical";

interface AdminUser {
  id: number;
  name: string;
  email: string;
  agency: string;
  agencyFull: string;
  role: string;
  status: UserStatus;
  lastLogin: string;
  created: string;
  initials: string;
  avatarColor: string;
  recentActivity: { action: string; time: string }[];
  loginHistory: { date: string; ip: string; device: string }[];
}

const AVATAR_COLORS = [
  "#1E3A8A",
  "#7C3AED",
  "#0891B2",
  "#059669",
  "#D97706",
  "#DC2626",
  "#4F46E5",
  "#0D9488",
  "#C026D3",
  "#EA580C",
  "#2563EB",
  "#9333EA",
  "#0284C7",
  "#16A34A",
  "#CA8A04",
  "#E11D48",
  "#6366F1",
  "#14B8A6",
  "#A855F7",
  "#F97316",
  "#3B82F6",
  "#8B5CF6",
  "#06B6D4",
  "#10B981",
  "#EAB308",
  "#F43F5E",
  "#818CF8",
];

function getInitials(name: string) {
  return name
    .split(" ")
    .filter((p) => !["Dr.", "Prof.", "Eng.", "Mr.", "Ms.", "Mrs."].includes(p))
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const MOCK_USERS: AdminUser[] = [
  {
    id: 1,
    name: "Juan Dela Cruz",
    email: "juan.delacruz@dost11.gov.ph",
    agency: "DOST XI",
    agencyFull: "Department of Science and Technology – Region XI",
    role: "Agency Admin",
    status: "Active",
    lastLogin: "Mar 5, 2026 – 09:42 AM",
    created: "Jan 15, 2023",
    initials: "JD",
    avatarColor: AVATAR_COLORS[0],
    recentActivity: [
      { action: "Uploaded 3 research papers", time: "2 hours ago" },
      { action: "Updated agency profile", time: "1 day ago" },
      { action: "Approved 5 submissions", time: "2 days ago" },
    ],
    loginHistory: [
      { date: "Mar 5, 2026 – 09:42 AM", ip: "192.168.1.45", device: "Chrome / Windows" },
      { date: "Mar 4, 2026 – 02:18 PM", ip: "192.168.1.45", device: "Chrome / Windows" },
      { date: "Mar 3, 2026 – 10:05 AM", ip: "10.0.0.12", device: "Safari / macOS" },
    ],
  },
  {
    id: 2,
    name: "Maria Santos",
    email: "maria.santos@ched11.gov.ph",
    agency: "CHED XI",
    agencyFull: "Commission on Higher Education – Region XI",
    role: "Agency Admin",
    status: "Active",
    lastLogin: "Mar 5, 2026 – 08:15 AM",
    created: "Feb 3, 2023",
    initials: "MS",
    avatarColor: AVATAR_COLORS[1],
    recentActivity: [
      { action: "Reviewed 8 submissions", time: "5 hours ago" },
      { action: "Created new user account", time: "1 day ago" },
    ],
    loginHistory: [
      { date: "Mar 5, 2026 – 08:15 AM", ip: "172.16.0.88", device: "Firefox / Windows" },
      { date: "Mar 4, 2026 – 09:30 AM", ip: "172.16.0.88", device: "Firefox / Windows" },
    ],
  },
  {
    id: 3,
    name: "Roberto Garcia",
    email: "roberto.garcia@neda11.gov.ph",
    agency: "NEDA XI",
    agencyFull: "National Economic and Development Authority – Region XI",
    role: "Agency Admin",
    status: "Active",
    lastLogin: "Mar 4, 2026 – 04:22 PM",
    created: "Mar 8, 2023",
    initials: "RG",
    avatarColor: AVATAR_COLORS[2],
    recentActivity: [
      { action: "Exported quarterly report", time: "1 day ago" },
      { action: "Updated research metadata", time: "3 days ago" },
    ],
    loginHistory: [
      { date: "Mar 4, 2026 – 04:22 PM", ip: "192.168.5.10", device: "Chrome / Windows" },
    ],
  },
  {
    id: 4,
    name: "Elena Marquez",
    email: "elena.marquez@dti11.gov.ph",
    agency: "DTI XI",
    agencyFull: "Department of Trade and Industry – Region XI",
    role: "Agency Admin",
    status: "Active",
    lastLogin: "Mar 5, 2026 – 10:05 AM",
    created: "Mar 15, 2023",
    initials: "EM",
    avatarColor: AVATAR_COLORS[3],
    recentActivity: [
      { action: "Uploaded 2 trade research papers", time: "3 hours ago" },
      { action: "Modified agency settings", time: "2 days ago" },
    ],
    loginHistory: [
      { date: "Mar 5, 2026 – 10:05 AM", ip: "10.10.0.55", device: "Edge / Windows" },
      { date: "Mar 3, 2026 – 11:42 AM", ip: "10.10.0.55", device: "Edge / Windows" },
    ],
  },
  {
    id: 5,
    name: "Carlos Reyes",
    email: "carlos.reyes@dict11.gov.ph",
    agency: "DICT XI",
    agencyFull: "Department of Information and Communications Technology – Region XI",
    role: "Agency Admin",
    status: "Active",
    lastLogin: "Mar 4, 2026 – 01:30 PM",
    created: "Apr 12, 2023",
    initials: "CR",
    avatarColor: AVATAR_COLORS[4],
    recentActivity: [
      { action: "Submitted ICT research report", time: "1 day ago" },
    ],
    loginHistory: [
      { date: "Mar 4, 2026 – 01:30 PM", ip: "192.168.3.77", device: "Chrome / Linux" },
    ],
  },
  {
    id: 6,
    name: "Ana Fernandez",
    email: "ana.fernandez@rhrdc11.gov.ph",
    agency: "RHRDC XI",
    agencyFull: "Regional Health Research and Development Consortium XI",
    role: "Agency Admin",
    status: "Active",
    lastLogin: "Mar 5, 2026 – 07:50 AM",
    created: "May 5, 2023",
    initials: "AF",
    avatarColor: AVATAR_COLORS[5],
    recentActivity: [
      { action: "Published health research findings", time: "6 hours ago" },
      { action: "Assigned reviewer to submission", time: "1 day ago" },
    ],
    loginHistory: [
      { date: "Mar 5, 2026 – 07:50 AM", ip: "172.20.0.33", device: "Safari / macOS" },
      { date: "Mar 4, 2026 – 08:10 AM", ip: "172.20.0.33", device: "Safari / macOS" },
    ],
  },
  {
    id: 7,
    name: "Pedro Villanueva",
    email: "pedro.villanueva@drieerdc.gov.ph",
    agency: "DRIEERDC",
    agencyFull: "Davao Region Industry Energy and Emerging Technology Research and Development Consortium",
    role: "Agency Admin",
    status: "Inactive",
    lastLogin: "Feb 18, 2026 – 03:15 PM",
    created: "Jun 10, 2023",
    initials: "PV",
    avatarColor: AVATAR_COLORS[6],
    recentActivity: [
      { action: "Last activity recorded", time: "15 days ago" },
    ],
    loginHistory: [
      { date: "Feb 18, 2026 – 03:15 PM", ip: "192.168.8.22", device: "Chrome / Windows" },
    ],
  },
  {
    id: 8,
    name: "Sofia Aquino",
    email: "sofia.aquino@smaarrdec.gov.ph",
    agency: "SMAARRDEC",
    agencyFull: "Southern Mindanao Agriculture Aquatic and Natural Resources Research and Development Consortium",
    role: "Agency Admin",
    status: "Active",
    lastLogin: "Mar 5, 2026 – 11:20 AM",
    created: "Jul 20, 2023",
    initials: "SA",
    avatarColor: AVATAR_COLORS[7],
    recentActivity: [
      { action: "Uploaded agriculture study data", time: "4 hours ago" },
      { action: "Reviewed team submissions", time: "1 day ago" },
    ],
    loginHistory: [
      { date: "Mar 5, 2026 – 11:20 AM", ip: "10.5.0.19", device: "Chrome / Windows" },
      { date: "Mar 4, 2026 – 09:45 AM", ip: "10.5.0.19", device: "Chrome / Windows" },
    ],
  },
  {
    id: 9,
    name: "Miguel Torres",
    email: "miguel.torres@usep.edu.ph",
    agency: "USEP",
    agencyFull: "University of Southeastern Philippines",
    role: "Agency Admin",
    status: "Active",
    lastLogin: "Mar 5, 2026 – 02:08 PM",
    created: "Aug 1, 2023",
    initials: "MT",
    avatarColor: AVATAR_COLORS[8],
    recentActivity: [
      { action: "Submitted 4 academic papers", time: "1 hour ago" },
      { action: "Updated research categories", time: "3 hours ago" },
      { action: "Modified user permissions", time: "1 day ago" },
    ],
    loginHistory: [
      { date: "Mar 5, 2026 – 02:08 PM", ip: "192.168.10.5", device: "Firefox / Windows" },
      { date: "Mar 4, 2026 – 10:32 AM", ip: "192.168.10.5", device: "Firefox / Windows" },
      { date: "Mar 3, 2026 – 08:55 AM", ip: "10.0.1.5", device: "Chrome / Android" },
    ],
  },
  {
    id: 10,
    name: "Teresa Mendez",
    email: "teresa.mendez@neda11.gov.ph",
    agency: "NEDA XI",
    agencyFull: "National Economic and Development Authority – Region XI",
    role: "Agency Admin",
    status: "Inactive",
    lastLogin: "Feb 26, 2026 – 09:10 AM",
    created: "Sep 14, 2023",
    initials: "TM",
    avatarColor: AVATAR_COLORS[9],
    recentActivity: [
      { action: "Account deactivated by admin", time: "7 days ago" },
    ],
    loginHistory: [
      { date: "Feb 26, 2026 – 09:10 AM", ip: "192.168.5.10", device: "Chrome / Windows" },
    ],
  },
  {
    id: 11,
    name: "Rafael Domingo",
    email: "rafael.domingo@dict11.gov.ph",
    agency: "DICT XI",
    agencyFull: "Department of Information and Communications Technology – Region XI",
    role: "Agency Admin",
    status: "Active",
    lastLogin: "Mar 4, 2026 – 05:00 PM",
    created: "Oct 2, 2023",
    initials: "RD",
    avatarColor: AVATAR_COLORS[10],
    recentActivity: [
      { action: "Uploaded ICT infrastructure report", time: "1 day ago" },
    ],
    loginHistory: [
      { date: "Mar 4, 2026 – 05:00 PM", ip: "192.168.3.100", device: "Chrome / Windows" },
    ],
  },
  {
    id: 12,
    name: "Isabella Cruz",
    email: "isabella.cruz@rhrdc11.gov.ph",
    agency: "RHRDC XI",
    agencyFull: "Regional Health Research and Development Consortium XI",
    role: "Agency Admin",
    status: "Active",
    lastLogin: "Mar 5, 2026 – 06:30 AM",
    created: "Oct 18, 2023",
    initials: "IC",
    avatarColor: AVATAR_COLORS[11],
    recentActivity: [
      { action: "Published clinical trial data", time: "8 hours ago" },
      { action: "Updated consortium member list", time: "2 days ago" },
    ],
    loginHistory: [
      { date: "Mar 5, 2026 – 06:30 AM", ip: "172.20.0.45", device: "Safari / iOS" },
      { date: "Mar 4, 2026 – 07:15 AM", ip: "172.20.0.33", device: "Safari / macOS" },
    ],
  },
  {
    id: 13,
    name: "Antonio Mendoza",
    email: "antonio.mendoza@dti11.gov.ph",
    agency: "DTI XI",
    agencyFull: "Department of Trade and Industry – Region XI",
    role: "Agency Admin",
    status: "Active",
    lastLogin: "Mar 3, 2026 – 03:45 PM",
    created: "Nov 5, 2023",
    initials: "AM",
    avatarColor: AVATAR_COLORS[12],
    recentActivity: [
      { action: "Reviewed trade research submissions", time: "2 days ago" },
    ],
    loginHistory: [
      { date: "Mar 3, 2026 – 03:45 PM", ip: "10.10.0.60", device: "Edge / Windows" },
    ],
  },
  {
    id: 14,
    name: "Patricia Lim",
    email: "patricia.lim@dost11.gov.ph",
    agency: "DOST XI",
    agencyFull: "Department of Science and Technology – Region XI",
    role: "Agency Admin",
    status: "Active",
    lastLogin: "Mar 5, 2026 – 12:10 PM",
    created: "Nov 20, 2023",
    initials: "PL",
    avatarColor: AVATAR_COLORS[13],
    recentActivity: [
      { action: "Submitted DOST grant research", time: "2 hours ago" },
      { action: "Edited researcher profiles", time: "1 day ago" },
    ],
    loginHistory: [
      { date: "Mar 5, 2026 – 12:10 PM", ip: "192.168.1.50", device: "Chrome / macOS" },
      { date: "Mar 4, 2026 – 11:00 AM", ip: "192.168.1.50", device: "Chrome / macOS" },
    ],
  },
  {
    id: 15,
    name: "Ricardo Bautista",
    email: "ricardo.bautista@ched11.gov.ph",
    agency: "CHED XI",
    agencyFull: "Commission on Higher Education – Region XI",
    role: "Agency Admin",
    status: "Active",
    lastLogin: "Mar 4, 2026 – 08:50 AM",
    created: "Dec 1, 2023",
    initials: "RB",
    avatarColor: AVATAR_COLORS[14],
    recentActivity: [
      { action: "Uploaded institutional research", time: "1 day ago" },
    ],
    loginHistory: [
      { date: "Mar 4, 2026 – 08:50 AM", ip: "172.16.0.90", device: "Firefox / Windows" },
    ],
  },
  {
    id: 16,
    name: "Carmen Navarro",
    email: "carmen.navarro@smaarrdec.gov.ph",
    agency: "SMAARRDEC",
    agencyFull: "Southern Mindanao Agriculture Aquatic and Natural Resources Research and Development Consortium",
    role: "Agency Admin",
    status: "Active",
    lastLogin: "Mar 5, 2026 – 01:25 PM",
    created: "Dec 15, 2023",
    initials: "CN",
    avatarColor: AVATAR_COLORS[15],
    recentActivity: [
      { action: "Tagged research with SDG goals", time: "3 hours ago" },
      { action: "Reviewed submission backlog", time: "1 day ago" },
    ],
    loginHistory: [
      { date: "Mar 5, 2026 – 01:25 PM", ip: "10.5.0.25", device: "Chrome / Windows" },
    ],
  },
  {
    id: 17,
    name: "Gabriel Pascual",
    email: "gabriel.pascual@usep.edu.ph",
    agency: "USEP",
    agencyFull: "University of Southeastern Philippines",
    role: "Agency Admin",
    status: "Inactive",
    lastLogin: "Jan 30, 2026 – 10:00 AM",
    created: "Jan 8, 2024",
    initials: "GP",
    avatarColor: AVATAR_COLORS[16],
    recentActivity: [
      { action: "Account deactivated – transferred", time: "34 days ago" },
    ],
    loginHistory: [
      { date: "Jan 30, 2026 – 10:00 AM", ip: "192.168.10.12", device: "Firefox / Windows" },
    ],
  },
  {
    id: 18,
    name: "Rosario Enriquez",
    email: "rosario.enriquez@dost11.gov.ph",
    agency: "DOST XI",
    agencyFull: "Department of Science and Technology – Region XI",
    role: "Agency Admin",
    status: "Active",
    lastLogin: "Mar 5, 2026 – 03:30 PM",
    created: "Jan 22, 2024",
    initials: "RE",
    avatarColor: AVATAR_COLORS[17],
    recentActivity: [
      { action: "Managed DOST research tags", time: "1 hour ago" },
    ],
    loginHistory: [
      { date: "Mar 5, 2026 – 03:30 PM", ip: "192.168.1.60", device: "Chrome / Windows" },
    ],
  },
  {
    id: 19,
    name: "Lourdes Tan",
    email: "lourdes.tan@ched11.gov.ph",
    agency: "CHED XI",
    agencyFull: "Commission on Higher Education – Region XI",
    role: "Agency Admin",
    status: "Active",
    lastLogin: "Mar 4, 2026 – 07:20 PM",
    created: "Feb 5, 2024",
    initials: "LT",
    avatarColor: AVATAR_COLORS[18],
    recentActivity: [
      { action: "Approved faculty research submissions", time: "1 day ago" },
    ],
    loginHistory: [
      { date: "Mar 4, 2026 – 07:20 PM", ip: "172.16.0.95", device: "Chrome / macOS" },
    ],
  },
  {
    id: 20,
    name: "Francisco Aguilar",
    email: "francisco.aguilar@neda11.gov.ph",
    agency: "NEDA XI",
    agencyFull: "National Economic and Development Authority – Region XI",
    role: "Agency Admin",
    status: "Active",
    lastLogin: "Mar 3, 2026 – 11:55 AM",
    created: "Feb 19, 2024",
    initials: "FA",
    avatarColor: AVATAR_COLORS[19],
    recentActivity: [
      { action: "Submitted economic policy brief", time: "2 days ago" },
    ],
    loginHistory: [
      { date: "Mar 3, 2026 – 11:55 AM", ip: "192.168.5.15", device: "Edge / Windows" },
    ],
  },
  {
    id: 21,
    name: "Diana Salazar",
    email: "diana.salazar@dti11.gov.ph",
    agency: "DTI XI",
    agencyFull: "Department of Trade and Industry – Region XI",
    role: "Agency Admin",
    status: "Active",
    lastLogin: "Mar 5, 2026 – 04:10 PM",
    created: "Mar 1, 2024",
    initials: "DS",
    avatarColor: AVATAR_COLORS[20],
    recentActivity: [
      { action: "Updated MSME research catalog", time: "5 hours ago" },
    ],
    loginHistory: [
      { date: "Mar 5, 2026 – 04:10 PM", ip: "10.10.0.70", device: "Chrome / Windows" },
    ],
  },
  {
    id: 22,
    name: "Andres Ramos",
    email: "andres.ramos@drieerdc.gov.ph",
    agency: "DRIEERDC",
    agencyFull: "Davao Region Industry Energy and Emerging Technology Research and Development Consortium",
    role: "Agency Admin",
    status: "Active",
    lastLogin: "Mar 4, 2026 – 06:40 PM",
    created: "Mar 12, 2024",
    initials: "AR",
    avatarColor: AVATAR_COLORS[21],
    recentActivity: [
      { action: "Published energy research data", time: "1 day ago" },
    ],
    loginHistory: [
      { date: "Mar 4, 2026 – 06:40 PM", ip: "192.168.8.30", device: "Chrome / Linux" },
    ],
  },
  {
    id: 23,
    name: "Beatriz Cunanan",
    email: "beatriz.cunanan@rhrdc11.gov.ph",
    agency: "RHRDC XI",
    agencyFull: "Regional Health Research and Development Consortium XI",
    role: "Agency Admin",
    status: "Active",
    lastLogin: "Mar 5, 2026 – 05:15 PM",
    created: "Mar 25, 2024",
    initials: "BC",
    avatarColor: AVATAR_COLORS[22],
    recentActivity: [
      { action: "Reviewed public health study", time: "3 hours ago" },
    ],
    loginHistory: [
      { date: "Mar 5, 2026 – 05:15 PM", ip: "172.20.0.50", device: "Safari / macOS" },
    ],
  },
  {
    id: 24,
    name: "Eduardo Velasco",
    email: "eduardo.velasco@dict11.gov.ph",
    agency: "DICT XI",
    agencyFull: "Department of Information and Communications Technology – Region XI",
    role: "Agency Admin",
    status: "Active",
    lastLogin: "Mar 2, 2026 – 09:00 AM",
    created: "Apr 8, 2024",
    initials: "EV",
    avatarColor: AVATAR_COLORS[23],
    recentActivity: [
      { action: "Submitted digital gov't report", time: "3 days ago" },
    ],
    loginHistory: [
      { date: "Mar 2, 2026 – 09:00 AM", ip: "192.168.3.110", device: "Chrome / Windows" },
    ],
  },
  {
    id: 25,
    name: "Maricar Dizon",
    email: "maricar.dizon@smaarrdec.gov.ph",
    agency: "SMAARRDEC",
    agencyFull: "Southern Mindanao Agriculture Aquatic and Natural Resources Research and Development Consortium",
    role: "Agency Admin",
    status: "Active",
    lastLogin: "Mar 5, 2026 – 08:45 AM",
    created: "Apr 20, 2024",
    initials: "MD",
    avatarColor: AVATAR_COLORS[24],
    recentActivity: [
      { action: "Uploaded aquaculture study", time: "7 hours ago" },
    ],
    loginHistory: [
      { date: "Mar 5, 2026 – 08:45 AM", ip: "10.5.0.32", device: "Firefox / Windows" },
    ],
  },
  {
    id: 26,
    name: "Vicente Santos",
    email: "vicente.santos@usep.edu.ph",
    agency: "USEP",
    agencyFull: "University of Southeastern Philippines",
    role: "Agency Admin",
    status: "Active",
    lastLogin: "Mar 5, 2026 – 10:30 AM",
    created: "May 6, 2024",
    initials: "VS",
    avatarColor: AVATAR_COLORS[25],
    recentActivity: [
      { action: "Updated thesis repository", time: "4 hours ago" },
      { action: "Submitted engineering paper", time: "1 day ago" },
    ],
    loginHistory: [
      { date: "Mar 5, 2026 – 10:30 AM", ip: "192.168.10.20", device: "Chrome / Windows" },
    ],
  },
  {
    id: 27,
    name: "Angelica Reyes",
    email: "angelica.reyes@dost11.gov.ph",
    agency: "DOST XI",
    agencyFull: "Department of Science and Technology – Region XI",
    role: "Agency Admin",
    status: "Active",
    lastLogin: "Mar 5, 2026 – 11:50 AM",
    created: "May 18, 2024",
    initials: "AR",
    avatarColor: AVATAR_COLORS[26],
    recentActivity: [
      { action: "Published innovation research", time: "2 hours ago" },
    ],
    loginHistory: [
      { date: "Mar 5, 2026 – 11:50 AM", ip: "192.168.1.75", device: "Chrome / Windows" },
    ],
  },
];

const ITEMS_PER_PAGE = 10;

// Count recently created (within last 90 days)
const RECENTLY_CREATED_COUNT = 5;

/* ─── Status Badge ─── */
function StatusBadge({ status }: { status: UserStatus }) {
  const isActive = status === "Active";
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border ${
        isActive
          ? "bg-green-50 text-green-700 border-green-200"
          : "bg-gray-100 text-gray-500 border-gray-200"
      }`}
      style={{ fontWeight: 600 }}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-green-500" : "bg-gray-400"}`} />
      {status}
    </span>
  );
}

/* ─── Avatar ─── */
function UserAvatar({ initials, color, size = "md" }: { initials: string; color: string; size?: "sm" | "md" | "lg" }) {
  const dims = size === "lg" ? "w-16 h-16" : size === "md" ? "w-10 h-10" : "w-9 h-9";
  const textSize = size === "lg" ? "text-lg" : size === "md" ? "text-xs" : "text-[10px]";
  return (
    <div
      className={`${dims} rounded-full flex items-center justify-center shrink-0 text-white ${textSize}`}
      style={{ backgroundColor: color, fontWeight: 700 }}
    >
      {initials}
    </div>
  );
}

/* ─── Create Agency Admin Modal ─── */
function CreateAdminModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    agency: "",
    role: "Agency Admin",
    tempPassword: "",
    sendEmail: true,
  });

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-[520px] max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <div>
              <h2 className="text-[#0F172A]" style={{ fontSize: "1.125rem", fontWeight: 700 }}>
                Create Agency Admin
              </h2>
              <p className="text-gray-500 text-xs mt-0.5">
                Add a new administrator account for a participating agency.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-5">
            {/* Full Name */}
            <div>
              <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 600 }}>
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="e.g. Juan Dela Cruz"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]/40"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 600 }}>
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="juan.delacruz@agency.gov.ph"
                  className="w-full pl-10 pr-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]/40"
                />
              </div>
            </div>

            {/* Agency Assignment */}
            <div>
              <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 600 }}>
                Agency Assignment <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.agency}
                onChange={(e) => setFormData({ ...formData, agency: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]/40 bg-white"
              >
                <option value="">Select an agency...</option>
                {AGENCIES.map((a) => (
                  <option key={a.id} value={a.abbreviation}>
                    {a.abbreviation} – {a.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 600 }}>
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]/40 bg-white"
              >
                <option value="Agency Admin">Agency Admin</option>
              </select>
            </div>

            {/* Temporary Password */}
            <div>
              <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 600 }}>
                Temporary Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={formData.tempPassword}
                  onChange={(e) => setFormData({ ...formData, tempPassword: e.target.value })}
                  placeholder="Enter temporary password"
                  className="w-full pl-10 pr-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]/40"
                />
              </div>
            </div>

            {/* Send Email Option */}
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={formData.sendEmail}
                  onChange={(e) => setFormData({ ...formData, sendEmail: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-5 h-5 border-2 border-gray-300 rounded peer-checked:bg-[#1E3A8A] peer-checked:border-[#1E3A8A] transition-colors flex items-center justify-center">
                  {formData.sendEmail && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-700" style={{ fontWeight: 500 }}>
                  Send password setup email
                </span>
                <p className="text-xs text-gray-400 mt-0.5">
                  The user will receive an email to set up their account password.
                </p>
              </div>
            </label>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              style={{ fontWeight: 500 }}
            >
              Cancel
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm text-white bg-[#1E3A8A] rounded-lg hover:bg-[#1E3A8A]/90 transition-colors shadow-sm"
              style={{ fontWeight: 600 }}
            >
              Create User
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── User Detail Panel ─── */
function UserDetailPanel({
  user,
  onClose,
}: {
  user: AdminUser | null;
  onClose: () => void;
}) {
  if (!user) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-[520px] bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-[#0F172A]" style={{ fontSize: "1.125rem", fontWeight: 700 }}>
            User Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Profile */}
          <div className="flex items-start gap-4">
            <UserAvatar initials={user.initials} color={user.avatarColor} size="lg" />
            <div className="flex-1 min-w-0">
              <h3 className="text-[#0F172A]" style={{ fontSize: "1rem", fontWeight: 700 }}>
                {user.name}
              </h3>
              <p className="text-gray-500 text-sm mt-0.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> {user.email}
              </p>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <StatusBadge status={user.status} />
                <span
                  className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border bg-blue-50 text-[#1E3A8A] border-blue-200"
                  style={{ fontWeight: 600 }}
                >
                  <Shield className="w-3 h-3" /> {user.role}
                </span>
              </div>
            </div>
          </div>

          {/* Agency Info */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-4 h-4 text-[#1E3A8A]" />
              <span className="text-xs text-gray-500" style={{ fontWeight: 600 }}>
                Assigned Agency
              </span>
            </div>
            <p className="text-sm text-gray-800" style={{ fontWeight: 600 }}>
              {user.agency}
            </p>
            <p className="text-xs text-gray-500 mt-1">{user.agencyFull}</p>
          </div>

          {/* Account Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-amber-600" />
                <span className="text-xs text-gray-500" style={{ fontWeight: 500 }}>
                  Account Created
                </span>
              </div>
              <p className="text-sm text-gray-800" style={{ fontWeight: 600 }}>
                {user.created}
              </p>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span className="text-xs text-gray-500" style={{ fontWeight: 500 }}>
                  Last Login
                </span>
              </div>
              <p className="text-xs text-gray-800" style={{ fontWeight: 600 }}>
                {user.lastLogin}
              </p>
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-[#1E3A8A]" />
              <h4 className="text-sm text-[#0F172A]" style={{ fontWeight: 700 }}>
                Recent Activity
              </h4>
            </div>
            <div className="space-y-2">
              {user.recentActivity.map((act, i) => (
                <div key={`activity-${user.id}-${i}`} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-[#1E3A8A]/40 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700">{act.action}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{act.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Login History */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <LogIn className="w-4 h-4 text-[#1E3A8A]" />
              <h4 className="text-sm text-[#0F172A]" style={{ fontWeight: 700 }}>
                Recent Login History
              </h4>
            </div>
            <div className="space-y-2">
              {user.loginHistory.map((login, i) => (
                <div key={`login-${user.id}-${i}`} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-700" style={{ fontWeight: 500 }}>
                      {login.date}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{login.device}</p>
                  </div>
                  <span className="text-[11px] text-gray-400 bg-white px-2 py-0.5 rounded border border-gray-100">
                    {login.ip}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-2 px-6 py-4 border-t border-gray-100">
          <button className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors" style={{ fontWeight: 500 }}>
            <Edit2 className="w-4 h-4" /> Edit
          </button>
          <button className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors" style={{ fontWeight: 500 }}>
            <KeyRound className="w-4 h-4" /> Reset Password
          </button>
          <button className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors" style={{ fontWeight: 500 }}>
            <Power className="w-4 h-4" /> {user.status === "Active" ? "Deactivate" : "Activate"}
          </button>
        </div>
      </div>
    </>
  );
}

/* ─── Main Component ─── */
export function AdminUsers() {
  const [search, setSearch] = useState("");
  const [filterAgency, setFilterAgency] = useState("All");
  const [filterStatus, setFilterStatus] = useState<UserStatus | "All">("All");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailUser, setDetailUser] = useState<AdminUser | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const activeCount = MOCK_USERS.filter((u) => u.status === "Active").length;
  const inactiveCount = MOCK_USERS.filter((u) => u.status === "Inactive").length;

  const filtered = MOCK_USERS.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesAgency = filterAgency === "All" || u.agency === filterAgency;
    const matchesStatus = filterStatus === "All" || u.status === filterStatus;
    return matchesSearch && matchesAgency && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === "alphabetical") return a.name.localeCompare(b.name);
    if (sortBy === "last-login") return MOCK_USERS.indexOf(a) - MOCK_USERS.indexOf(b);
    // newest
    return MOCK_USERS.indexOf(b) - MOCK_USERS.indexOf(a);
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 max-w-[1376px]">
      {/* ─── Page Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[#0F172A] mb-1" style={{ fontSize: "1.5rem", fontWeight: 700 }}>
            Agency Admin Users
          </h1>
          <p className="text-[#6B7280] text-sm">
            Manage administrator accounts assigned to participating agencies.
          </p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1E3A8A] text-white text-sm rounded-[10px] hover:bg-[#1E3A8A]/90 transition-colors shadow-sm self-start"
          style={{ fontWeight: 600 }}
        >
          <Plus className="w-4 h-4" /> Create Agency Admin
        </button>
      </div>

      {/* ─── Section 1: User Overview Metrics ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Agency Admin Users",
            value: MOCK_USERS.length,
            icon: Users,
            color: "#1E3A8A",
            bg: "#DBEAFE",
          },
          {
            label: "Active Users",
            value: activeCount,
            icon: CheckCircle2,
            color: "#16A34A",
            bg: "#DCFCE7",
          },
          {
            label: "Inactive Users",
            value: inactiveCount,
            icon: XCircle,
            color: "#6B7280",
            bg: "#F3F4F6",
          },
          {
            label: "Recently Created",
            value: RECENTLY_CREATED_COUNT,
            icon: UserPlus,
            color: "#7C3AED",
            bg: "#EDE9FE",
          },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-start gap-4"
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: s.bg }}
              >
                <Icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
              <div className="min-w-0">
                <p className="text-2xl text-gray-800" style={{ fontWeight: 700 }}>
                  {s.value}
                </p>
                <p className="text-xs text-gray-500 mt-0.5" style={{ fontWeight: 500 }}>
                  {s.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Section 2 & 3: Search/Filters + Table ─── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Filter Bar */}
        <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]/30"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={filterAgency}
              onChange={(e) => {
                setFilterAgency(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 cursor-pointer"
            >
              <option value="All">All Agencies</option>
              {AGENCIES.map((a) => (
                <option key={a.id} value={a.abbreviation}>
                  {a.abbreviation}
                </option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value as UserStatus | "All");
                setCurrentPage(1);
              }}
              className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 cursor-pointer"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 cursor-pointer"
            >
              <option value="newest">Newest Users</option>
              <option value="last-login">Last Login</option>
              <option value="alphabetical">Alphabetical</option>
            </select>
          </div>
        </div>

        {/* ─── Desktop/Tablet Table ─── */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80">
                <th className="text-left px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>
                  User
                </th>
                <th className="text-left px-6 py-3 text-xs text-gray-500 hidden lg:table-cell" style={{ fontWeight: 600 }}>
                  Agency
                </th>
                <th className="text-left px-6 py-3 text-xs text-gray-500 hidden lg:table-cell" style={{ fontWeight: 600 }}>
                  Role
                </th>
                <th className="text-left px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>
                  Status
                </th>
                <th className="text-left px-6 py-3 text-xs text-gray-500 hidden xl:table-cell" style={{ fontWeight: 600 }}>
                  Last Login
                </th>
                <th className="text-right px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/60 transition-colors group">
                  {/* Avatar + Name + Email */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <UserAvatar initials={user.initials} color={user.avatarColor} />
                      <div className="min-w-0">
                        <p className="text-sm text-gray-800" style={{ fontWeight: 600 }}>
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {user.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Agency */}
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <span
                      className="text-xs text-[#1E3A8A] bg-[#1E3A8A]/5 px-2 py-1 rounded-md"
                      style={{ fontWeight: 600 }}
                    >
                      {user.agency}
                    </span>
                  </td>

                  {/* Role */}
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                      <UserCog className="w-3 h-3 text-gray-400" /> {user.role}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <StatusBadge status={user.status} />
                  </td>

                  {/* Last Login */}
                  <td className="px-6 py-4 hidden xl:table-cell">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {user.lastLogin}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right">
                    <div className="relative inline-flex items-center gap-1">
                      <button
                        onClick={() => setDetailUser(user)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-[#1E3A8A] hover:bg-[#1E3A8A]/5 transition-colors opacity-0 group-hover:opacity-100"
                        title="View User"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1.5 rounded-lg text-gray-400 hover:text-[#1E3A8A] hover:bg-[#1E3A8A]/5 transition-colors opacity-0 group-hover:opacity-100"
                        title="Edit User"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setMenuOpen(menuOpen === user.id ? null : user.id)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {menuOpen === user.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(null)} />
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 z-50">
                            <button
                              onClick={() => {
                                setDetailUser(user);
                                setMenuOpen(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5"
                            >
                              <Eye className="w-3.5 h-3.5 text-gray-400" /> View User
                            </button>
                            <button
                              onClick={() => setMenuOpen(null)}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-gray-400" /> Edit User
                            </button>
                            <button
                              onClick={() => setMenuOpen(null)}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5"
                            >
                              <KeyRound className="w-3.5 h-3.5 text-gray-400" /> Reset Password
                            </button>
                            <button
                              onClick={() => setMenuOpen(null)}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5"
                            >
                              <Power className="w-3.5 h-3.5 text-gray-400" />{" "}
                              {user.status === "Active" ? "Deactivate" : "Activate"} User
                            </button>
                            <div className="border-t border-gray-100 my-1" />
                            <button
                              onClick={() => setMenuOpen(null)}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete User
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
          {paginated.map((user) => (
            <div key={`mobile-${user.id}`} className="p-4">
              <div className="flex items-start gap-3">
                <UserAvatar initials={user.initials} color={user.avatarColor} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm text-gray-800 truncate" style={{ fontWeight: 600 }}>
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                    <StatusBadge status={user.status} />
                  </div>

                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span
                      className="text-[#1E3A8A] bg-[#1E3A8A]/5 px-2 py-0.5 rounded"
                      style={{ fontWeight: 600 }}
                    >
                      {user.agency}
                    </span>
                    <span className="text-gray-400">{user.role}</span>
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => setDetailUser(user)}
                      className="flex-1 text-center text-xs text-[#1E3A8A] bg-[#1E3A8A]/5 py-2 rounded-lg hover:bg-[#1E3A8A]/10 transition-colors"
                      style={{ fontWeight: 600 }}
                    >
                      View Details
                    </button>
                    <button className="flex-1 text-center text-xs text-gray-600 bg-gray-50 py-2 rounded-lg hover:bg-gray-100 transition-colors" style={{ fontWeight: 500 }}>
                      Edit
                    </button>
                    <button className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ─── Pagination ─── */}
        <div className="px-5 sm:px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} users
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`p-1.5 rounded-lg transition-colors ${
                currentPage === 1 ? "text-gray-300 cursor-not-allowed" : "hover:bg-gray-100 text-gray-400"
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={`page-${page}`}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-lg text-xs transition-colors ${
                  page === currentPage
                    ? "bg-[#1E3A8A] text-white"
                    : "hover:bg-gray-100 text-gray-500"
                }`}
                style={{ fontWeight: page === currentPage ? 600 : 400 }}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={`p-1.5 rounded-lg transition-colors ${
                currentPage === totalPages ? "text-gray-300 cursor-not-allowed" : "hover:bg-gray-100 text-gray-400"
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Modals & Panels ─── */}
      <CreateAdminModal open={createModalOpen} onClose={() => setCreateModalOpen(false)} />
      <UserDetailPanel user={detailUser} onClose={() => setDetailUser(null)} />
    </div>
  );
}

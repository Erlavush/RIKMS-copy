import { Link } from "react-router";
import {
  FileText,
  FilePenLine,
  CheckCircle2,
  Archive,
  Eye,
  Pencil,
  ArchiveRestore,
  ArrowRight,
  Plus,
  FolderOpen,
  ClipboardList,
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

// Mock dashboard data
const DASHBOARD_STATS = {
  total: 142,
  draft: 18,
  published: 120,
  archived: 4,
};

const RESEARCH_BY_YEAR = [
  { year: "2020", count: 12 },
  { year: "2021", count: 18 },
  { year: "2022", count: 24 },
  { year: "2023", count: 31 },
  { year: "2024", count: 35 },
  { year: "2025", count: 22 },
];

const RESEARCH_BY_CATEGORY = [
  { name: "Environmental Science", value: 28, color: "#1E3A8A" },
  { name: "Public Health", value: 24, color: "#4C9F38" },
  { name: "Education", value: 22, color: "#C5192D" },
  { name: "Technology", value: 32, color: "#FD6925" },
  { name: "Agriculture", value: 18, color: "#DDA63A" },
  { name: "Social Sciences", value: 20, color: "#0A97D9" },
];

const RECENT_UPLOADS = [
  {
    id: 1,
    title: "Impact of Climate Change on Coastal Communities in the Davao Gulf",
    authors: "Dr. Maria Santos, Dr. Juan Dela Cruz",
    year: 2025,
    category: "Environmental Science",
    status: "Published" as const,
    lastUpdated: "2025-02-28",
  },
  {
    id: 2,
    title: "IoT-Based Environmental Monitoring System for Mount Apo Natural Park",
    authors: "Eng. Sofia Reyes, Dr. Marco Villanueva",
    year: 2025,
    category: "Technology",
    status: "Published" as const,
    lastUpdated: "2025-02-25",
  },
  {
    id: 3,
    title: "AI-Assisted Water Quality Assessment Framework for Davao River Systems",
    authors: "Dr. Elena Torres, Dr. Rafael Santos",
    year: 2025,
    category: "Technology",
    status: "Draft" as const,
    lastUpdated: "2025-03-01",
  },
  {
    id: 4,
    title: "Indigenous Knowledge Systems in Disaster Risk Reduction: A Davao Region Study",
    authors: "Prof. Ana Reyes, Dr. Carlos Tan",
    year: 2024,
    category: "Social Sciences",
    status: "Published" as const,
    lastUpdated: "2024-12-15",
  },
  {
    id: 5,
    title: "Renewable Energy Microgrids for Off-Grid Barangays in Southern Mindanao",
    authors: "Eng. Miguel Ramos",
    year: 2025,
    category: "Technology",
    status: "Draft" as const,
    lastUpdated: "2025-03-03",
  },
];

const ACCESS_REQUESTS = [
  {
    id: 1,
    requester: "Dr. Ana Lourdes Mercado",
    organization: "Ateneo de Davao University",
    research: "Impact of Climate Change on Coastal Communities",
    date: "2025-03-04",
    status: "Pending" as const,
  },
  {
    id: 2,
    requester: "Prof. James Chua",
    organization: "University of Mindanao",
    research: "IoT-Based Environmental Monitoring System",
    date: "2025-03-03",
    status: "Pending" as const,
  },
  {
    id: 3,
    requester: "Engr. Patricia Navarro",
    organization: "DOST - PCIEERD",
    research: "AI-Assisted Water Quality Assessment Framework",
    date: "2025-03-02",
    status: "Pending" as const,
  },
];

function StatusBadge({ status }: { status: "Published" | "Draft" | "Archived" | "Pending" }) {
  const styles = {
    Published: "bg-green-50 text-green-700 border-green-200",
    Draft: "bg-amber-50 text-amber-700 border-amber-200",
    Archived: "bg-gray-50 text-gray-600 border-gray-200",
    Pending: "bg-blue-50 text-blue-700 border-blue-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border ${styles[status]}`}
      style={{ fontWeight: 500 }}
    >
      {status}
    </span>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: React.ElementType;
  value: number;
  label: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div>
          <p className="text-gray-800" style={{ fontSize: "1.5rem", fontWeight: 700 }}>
            {value}
          </p>
          <p className="text-xs text-[#6B7280]">{label}</p>
        </div>
      </div>
    </div>
  );
}

export function AgencyAdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-[#1E3A8A] mb-1" style={{ fontSize: "1.5rem", fontWeight: 700 }}>
          Agency Research Dashboard
        </h1>
        <p className="text-[#6B7280] text-sm">
          Manage and publish research studies contributed by your institution.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3">
        <Link
          to="/agency/upload"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1E3A8A] text-white rounded-lg hover:bg-[#1E3A8A]/90 transition-colors text-sm w-full sm:w-auto"
          style={{ fontWeight: 500 }}
        >
          <Plus className="w-4 h-4" /> Upload New Research
        </Link>
        <Link
          to="/agency/research"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm w-full sm:w-auto"
          style={{ fontWeight: 500 }}
        >
          <FolderOpen className="w-4 h-4" /> Manage Research
        </Link>
        <Link
          to="/agency/access-requests"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm w-full sm:w-auto"
          style={{ fontWeight: 500 }}
        >
          <ClipboardList className="w-4 h-4" /> View Access Requests
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FileText} value={DASHBOARD_STATS.total} label="Total Research Studies" color="#1E3A8A" />
        <StatCard icon={FilePenLine} value={DASHBOARD_STATS.draft} label="Draft Research" color="#D97706" />
        <StatCard icon={CheckCircle2} value={DASHBOARD_STATS.published} label="Published Research" color="#059669" />
        <StatCard icon={Archive} value={DASHBOARD_STATS.archived} label="Archived Research" color="#6B7280" />
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Research by Year */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-[#1E3A8A] mb-4" style={{ fontSize: "0.95rem", fontWeight: 600 }}>
            Research by Year
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={RESEARCH_BY_YEAR}>
              <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis key="xaxis" dataKey="year" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
              <YAxis key="yaxis" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
              <Tooltip
                key="tooltip"
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #E5E7EB",
                  fontSize: "13px",
                }}
              />
              <Bar key="bar" dataKey="count" fill="#1E3A8A" radius={[4, 4, 0, 0]} name="Studies" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Research by Category */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-[#1E3A8A] mb-4" style={{ fontSize: "0.95rem", fontWeight: 600 }}>
            Research by Category
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                key="pie"
                data={RESEARCH_BY_CATEGORY}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
              >
                {RESEARCH_BY_CATEGORY.map((entry) => (
                  <Cell key={`cell-${entry.name}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                key="pie-tooltip"
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #E5E7EB",
                  fontSize: "13px",
                }}
              />
              <Legend
                key="legend"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: "12px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Research Uploads */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between p-4 sm:p-6 pb-4">
          <h3 className="text-[#1E3A8A]" style={{ fontSize: "0.95rem", fontWeight: 600 }}>
            Recent Research Uploads
          </h3>
          <Link to="/agency/research" className="inline-flex items-center gap-1 text-sm text-[#1E3A8A] hover:underline" style={{ fontWeight: 500 }}>
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile: Stacked Cards */}
        <div className="sm:hidden px-4 pb-4 space-y-3">
          {RECENT_UPLOADS.map((item) => (
            <div key={item.id} className="border border-gray-100 rounded-lg p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-gray-800 text-sm flex-1" style={{ fontWeight: 500 }}>
                  {item.title}
                </p>
                <StatusBadge status={item.status} />
              </div>
              <p className="text-xs text-gray-500">{item.authors}</p>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span>{item.year}</span>
                <span>{item.category}</span>
                <span>{item.lastUpdated}</span>
              </div>
              <div className="flex items-center gap-1 pt-1">
                <button className="p-1.5 rounded-md hover:bg-blue-50 text-gray-400 hover:text-[#1E3A8A] transition-colors" title="View">
                  <Eye className="w-4 h-4" />
                </button>
                <button className="p-1.5 rounded-md hover:bg-blue-50 text-gray-400 hover:text-[#1E3A8A] transition-colors" title="Edit">
                  <Pencil className="w-4 h-4" />
                </button>
                <button className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Archive">
                  <ArchiveRestore className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-b border-gray-100 bg-[#F9FAFB]">
                <th className="text-left px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 500 }}>Title</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 hidden md:table-cell" style={{ fontWeight: 500 }}>Authors</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 hidden lg:table-cell" style={{ fontWeight: 500 }}>Year</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 hidden lg:table-cell" style={{ fontWeight: 500 }}>Category</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500" style={{ fontWeight: 500 }}>Status</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 hidden md:table-cell" style={{ fontWeight: 500 }}>Last Updated</th>
                <th className="text-right px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 500 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_UPLOADS.map((item) => (
                <tr key={item.id} className="border-b border-gray-50 hover:bg-[#F9FAFB] transition-colors">
                  <td className="px-6 py-3.5">
                    <p className="text-gray-800 truncate max-w-[280px]" style={{ fontWeight: 500 }}>
                      {item.title}
                    </p>
                  </td>
                  <td className="px-4 py-3.5 text-gray-500 hidden md:table-cell">
                    <p className="truncate max-w-[180px]">{item.authors}</p>
                  </td>
                  <td className="px-4 py-3.5 text-gray-500 hidden lg:table-cell">{item.year}</td>
                  <td className="px-4 py-3.5 text-gray-500 hidden lg:table-cell">{item.category}</td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-3.5 text-gray-500 hidden md:table-cell">{item.lastUpdated}</td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 rounded-md hover:bg-blue-50 text-gray-400 hover:text-[#1E3A8A] transition-colors" title="View">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 rounded-md hover:bg-blue-50 text-gray-400 hover:text-[#1E3A8A] transition-colors" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Archive">
                        <ArchiveRestore className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Access Requests */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between p-4 sm:p-6 pb-4">
          <h3 className="text-[#1E3A8A]" style={{ fontSize: "0.95rem", fontWeight: 600 }}>
            Pending Access Requests
          </h3>
          <Link to="/agency/access-requests" className="inline-flex items-center gap-1 text-sm text-[#1E3A8A] hover:underline" style={{ fontWeight: 500 }}>
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile: Stacked Cards */}
        <div className="sm:hidden px-4 pb-4 space-y-3">
          {ACCESS_REQUESTS.map((req) => (
            <div key={req.id} className="border border-gray-100 rounded-lg p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-gray-800 text-sm" style={{ fontWeight: 500 }}>{req.requester}</p>
                <StatusBadge status={req.status} />
              </div>
              <p className="text-xs text-gray-500">{req.organization}</p>
              <p className="text-xs text-gray-500 line-clamp-1">{req.research}</p>
              <p className="text-xs text-gray-400">{req.date}</p>
              <div className="flex items-center gap-2 pt-1">
                <button className="flex-1 px-3 py-1.5 text-xs bg-green-50 text-green-700 border border-green-200 rounded-md hover:bg-green-100 transition-colors" style={{ fontWeight: 500 }}>
                  Approve
                </button>
                <button className="flex-1 px-3 py-1.5 text-xs bg-red-50 text-red-600 border border-red-200 rounded-md hover:bg-red-100 transition-colors" style={{ fontWeight: 500 }}>
                  Deny
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-b border-gray-100 bg-[#F9FAFB]">
                <th className="text-left px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 500 }}>Requester Name</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 hidden md:table-cell" style={{ fontWeight: 500 }}>Organization</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 hidden lg:table-cell" style={{ fontWeight: 500 }}>Research Title</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 hidden md:table-cell" style={{ fontWeight: 500 }}>Request Date</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500" style={{ fontWeight: 500 }}>Status</th>
                <th className="text-right px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 500 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ACCESS_REQUESTS.map((req) => (
                <tr key={req.id} className="border-b border-gray-50 hover:bg-[#F9FAFB] transition-colors">
                  <td className="px-6 py-3.5 text-gray-800" style={{ fontWeight: 500 }}>{req.requester}</td>
                  <td className="px-4 py-3.5 text-gray-500 hidden md:table-cell">{req.organization}</td>
                  <td className="px-4 py-3.5 text-gray-500 hidden lg:table-cell">
                    <p className="truncate max-w-[220px]">{req.research}</p>
                  </td>
                  <td className="px-4 py-3.5 text-gray-500 hidden md:table-cell">{req.date}</td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={req.status} />
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <button className="px-3 py-1 text-xs bg-green-50 text-green-700 border border-green-200 rounded-md hover:bg-green-100 transition-colors" style={{ fontWeight: 500 }}>
                        Approve
                      </button>
                      <button className="px-3 py-1 text-xs bg-red-50 text-red-600 border border-red-200 rounded-md hover:bg-red-100 transition-colors" style={{ fontWeight: 500 }}>
                        Deny
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

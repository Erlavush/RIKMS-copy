import { useState, useMemo } from "react";
import { Link } from "react-router";
import {
  TrendingUp,
  TrendingDown,
  FileText,
  Eye,
  Download,
  ShieldCheck,
  Calendar,
  ChevronRight,
  FileDown,
  Filter,
  ChevronDown,
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
  LineChart,
  Line,
} from "recharts";
import { SDG_DATA, RESEARCH_CATEGORIES } from "../../data/mock-data";

/* ──────────────── Mock Data ──────────────── */

const PUBLICATIONS_BY_YEAR = [
  { year: "2020", count: 12 },
  { year: "2021", count: 18 },
  { year: "2022", count: 24 },
  { year: "2023", count: 30 },
  { year: "2024", count: 38 },
  { year: "2025", count: 20 },
];

const CATEGORY_DISTRIBUTION = [
  { name: "Agriculture", value: 26, color: "#DDA63A" },
  { name: "Education", value: 22, color: "#C5192D" },
  { name: "Technology", value: 32, color: "#FD6925" },
  { name: "Health", value: 28, color: "#4C9F38" },
  { name: "Environment", value: 18, color: "#3F7E44" },
  { name: "Social Sciences", value: 16, color: "#0A97D9" },
];

const SDG_CONTRIBUTIONS = SDG_DATA.map((sdg) => ({
  sdg: `SDG ${sdg.number}`,
  label: sdg.title,
  count: Math.floor(Math.random() * 30) + 5,
  color: sdg.color,
})).sort((a, b) => b.count - a.count);

const MOST_ACCESSED = [
  { title: "Public Health Response Framework for Emerging Infectious Diseases in Region XI", category: "Public Health", year: 2025, downloads: 2103, views: 5420 },
  { title: "Impact of Climate Change on Coastal Communities in the Davao Gulf", category: "Environmental Science", year: 2025, downloads: 1247, views: 3891 },
  { title: "Community-Based Tuberculosis Prevention in Urban Poor Areas of Davao City", category: "Public Health", year: 2024, downloads: 1823, views: 3567 },
  { title: "Digital Literacy Programs and Their Effect on Rural Education Outcomes", category: "Education", year: 2025, downloads: 893, views: 2456 },
  { title: "Indigenous Knowledge Systems in Disaster Risk Reduction", category: "Social Sciences", year: 2024, downloads: 892, views: 2234 },
  { title: "Sustainable Agriculture Practices for Smallholder Farmers in Southern Mindanao", category: "Agriculture", year: 2024, downloads: 756, views: 1980 },
  { title: "Economic Impact of Digital Transformation on MSMEs in Davao Region", category: "Economics", year: 2025, downloads: 567, views: 1534 },
];

const ACCESS_REQUEST_STATUS = [
  { name: "Approved", value: 54, color: "#16A34A" },
  { name: "Pending", value: 23, color: "#D97706" },
  { name: "Denied", value: 12, color: "#DC2626" },
];

const DOWNLOAD_TIMELINE = [
  { month: "Jan", downloads: 245 },
  { month: "Feb", downloads: 312 },
  { month: "Mar", downloads: 198 },
  { month: "Apr", downloads: 456 },
  { month: "May", downloads: 389 },
  { month: "Jun", downloads: 521 },
  { month: "Jul", downloads: 478 },
  { month: "Aug", downloads: 634 },
  { month: "Sep", downloads: 567 },
  { month: "Oct", downloads: 712 },
  { month: "Nov", downloads: 489 },
  { month: "Dec", downloads: 356 },
];

/* ──────────────── Sub-Components ──────────────── */

function MetricCard({
  icon: Icon,
  value,
  label,
  change,
  positive,
  color,
}: {
  icon: React.ElementType;
  value: string;
  label: string;
  change: string;
  positive: boolean;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div className={`flex items-center gap-1 text-xs ${positive ? "text-green-600" : "text-red-500"}`}>
          {positive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          <span style={{ fontWeight: 500 }}>{change}</span>
        </div>
      </div>
      <p className="text-gray-800" style={{ fontSize: "1.5rem", fontWeight: 700 }}>{value}</p>
      <p className="text-xs text-[#6B7280] mt-0.5">{label}</p>
    </div>
  );
}

function ChartCard({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm p-5 lg:p-6 ${className}`}>
      <h3 className="text-[#1E3A8A] mb-4" style={{ fontSize: "0.9rem", fontWeight: 700 }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

/* ──────────────── Main Component ──────────────── */

export function Analytics() {
  const [dateRange, setDateRange] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterSdg, setFilterSdg] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-500 flex-wrap">
        <Link to="/agency/dashboard" className="hover:text-[#1E3A8A] transition-colors">Agency</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-[#1E3A8A]" style={{ fontWeight: 500 }}>Research Analytics</span>
      </nav>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-[#1E3A8A] mb-1" style={{ fontSize: "1.5rem", fontWeight: 700 }}>
            Agency Research Analytics
          </h1>
          <p className="text-[#6B7280] text-sm">
            Analyze research publications, access activity, and impact across your agency's repository.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20"
            >
              <option value="30d">Last 30 Days</option>
              <option value="6m">Last 6 Months</option>
              <option value="1y">Last Year</option>
              <option value="all">All Time</option>
            </select>
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-[#1E3A8A] text-white rounded-lg hover:bg-[#1E3A8A]/90 transition-colors" style={{ fontWeight: 500 }}>
            <FileDown className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Data Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="w-full flex items-center justify-between px-5 py-3.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors md:hidden"
          style={{ fontWeight: 500 }}
        >
          <span className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            Data Filters
          </span>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
        </button>
        <div className={`${filtersOpen ? "block" : "hidden"} md:block px-5 py-4 md:py-3.5`}>
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <span className="hidden md:flex items-center gap-2 text-sm text-gray-500 shrink-0" style={{ fontWeight: 500 }}>
              <Filter className="w-4 h-4" /> Filters:
            </span>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="px-3 py-2 bg-[#F9FAFB] border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20"
            >
              <option value="all">All Years</option>
              {[2025, 2024, 2023, 2022, 2021, 2020].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 bg-[#F9FAFB] border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20"
            >
              <option value="all">All Categories</option>
              {RESEARCH_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={filterSdg}
              onChange={(e) => setFilterSdg(e.target.value)}
              className="px-3 py-2 bg-[#F9FAFB] border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20"
            >
              <option value="all">All SDGs</option>
              {SDG_DATA.map((s) => (
                <option key={s.number} value={s.number}>SDG {s.number} – {s.title}</option>
              ))}
            </select>
            {(filterYear !== "all" || filterCategory !== "all" || filterSdg !== "all") && (
              <button
                onClick={() => { setFilterYear("all"); setFilterCategory("all"); setFilterSdg("all"); }}
                className="text-xs text-[#1E3A8A] hover:underline shrink-0"
                style={{ fontWeight: 500 }}
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Section 1 – Research Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={FileText} value="142" label="Total Research Publications" change="+12.5%" positive={true} color="#1E3A8A" />
        <MetricCard icon={Download} value="5,357" label="Total Downloads" change="+8.7%" positive={true} color="#059669" />
        <MetricCard icon={Eye} value="24,802" label="Total Views" change="+18.3%" positive={true} color="#7C3AED" />
        <MetricCard icon={ShieldCheck} value="89" label="Access Requests" change="+5.1%" positive={true} color="#D97706" />
      </div>

      {/* Section 2 & 3 – Bar Chart + Donut */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Research Publications by Year */}
        <ChartCard title="Research Publications by Year">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={PUBLICATIONS_BY_YEAR}>
              <CartesianGrid key="grid-pub-yr" strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis key="x-pub-yr" dataKey="year" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
              <YAxis key="y-pub-yr" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
              <Tooltip
                key="tt-pub-yr"
                contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "13px" }}
              />
              <Bar key="bar-pub-yr" dataKey="count" fill="#1E3A8A" radius={[6, 6, 0, 0]} name="Publications" barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Research Distribution by Category */}
        <ChartCard title="Research Distribution by Category">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                key="pie-cat-dist"
                data={CATEGORY_DISTRIBUTION}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
                style={{ fontSize: "10px" }}
              >
                {CATEGORY_DISTRIBUTION.map((entry) => (
                  <Cell key={`cat-cell-${entry.name}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                key="tt-cat-dist"
                contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "13px" }}
                formatter={(value: number) => [`${value} papers`, ""]}
              />
              <Legend key="legend-cat-dist" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Section 4 – SDG Contribution Overview */}
      <ChartCard title="Research Contribution by SDG">
        <div className="space-y-2.5">
          {SDG_CONTRIBUTIONS.map((item) => {
            const maxCount = SDG_CONTRIBUTIONS[0].count;
            const pct = (item.count / maxCount) * 100;
            return (
              <div key={item.sdg} className="flex items-center gap-3">
                <div className="w-16 text-xs text-gray-600 shrink-0 text-right" style={{ fontWeight: 500 }}>
                  {item.sdg}
                </div>
                <div className="flex-1 h-7 bg-[#F9FAFB] rounded-md overflow-hidden relative">
                  <div
                    className="h-full rounded-md transition-all duration-500 flex items-center"
                    style={{ width: `${pct}%`, backgroundColor: `${item.color}30` }}
                  >
                    <div
                      className="h-full rounded-md"
                      style={{ width: "100%", backgroundColor: item.color, opacity: 0.7 }}
                    />
                  </div>
                  <span
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-600"
                    style={{ fontWeight: 500 }}
                  >
                    {item.count} papers
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </ChartCard>

      {/* Section 5 – Most Accessed Research */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 lg:px-6 py-4 border-b border-gray-100">
          <h3 className="text-[#1E3A8A]" style={{ fontSize: "0.9rem", fontWeight: 700 }}>
            Most Accessed Research
          </h3>
        </div>

        {/* Mobile: Cards */}
        <div className="sm:hidden p-4 space-y-3">
          {MOST_ACCESSED.map((item, i) => (
            <div key={`mob-res-${i}`} className="border border-gray-100 rounded-lg p-4 space-y-2">
              <div className="flex items-start gap-3">
                <span
                  className="w-6 h-6 rounded-full bg-[#1E3A8A]/10 text-[#1E3A8A] flex items-center justify-center text-xs shrink-0"
                  style={{ fontWeight: 600 }}
                >
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-gray-800 text-sm truncate" style={{ fontWeight: 500 }}>{item.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.category} • {item.year}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500 ml-9">
                <span className="flex items-center gap-1"><Download className="w-3.5 h-3.5" /> {item.downloads.toLocaleString()}</span>
                <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {item.views.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs text-gray-500 w-10" style={{ fontWeight: 500 }}>#</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500" style={{ fontWeight: 500 }}>Research Title</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 hidden md:table-cell" style={{ fontWeight: 500 }}>Category</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 hidden lg:table-cell" style={{ fontWeight: 500 }}>Year</th>
                <th className="text-right px-4 py-3 text-xs text-gray-500" style={{ fontWeight: 500 }}>Downloads</th>
                <th className="text-right px-5 py-3 text-xs text-gray-500" style={{ fontWeight: 500 }}>Views</th>
              </tr>
            </thead>
            <tbody>
              {MOST_ACCESSED.map((item, i) => (
                <tr key={`desk-res-${i}`} className="border-b border-gray-50 hover:bg-[#F9FAFB] transition-colors">
                  <td className="px-5 py-3.5">
                    <span
                      className="w-6 h-6 rounded-full bg-[#1E3A8A]/10 text-[#1E3A8A] flex items-center justify-center text-xs"
                      style={{ fontWeight: 600 }}
                    >
                      {i + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-gray-800 max-w-xs truncate" style={{ fontWeight: 500 }}>
                    {item.title}
                  </td>
                  <td className="px-4 py-3.5 text-gray-500 hidden md:table-cell">{item.category}</td>
                  <td className="px-4 py-3.5 text-gray-500 hidden lg:table-cell">{item.year}</td>
                  <td className="px-4 py-3.5 text-gray-700 text-right" style={{ fontWeight: 500 }}>
                    {item.downloads.toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 text-right">{item.views.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 6 & 7 – Access Request Analytics + Download Timeline */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Access Requests by Status */}
        <ChartCard title="Access Requests by Status">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-full sm:w-1/2">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    key="pie-access-status"
                    data={ACCESS_REQUEST_STATUS}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    nameKey="name"
                  >
                    {ACCESS_REQUEST_STATUS.map((entry) => (
                      <Cell key={`ar-cell-${entry.name}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    key="tt-access-status"
                    contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "13px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full sm:w-1/2 space-y-3">
              {ACCESS_REQUEST_STATUS.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-gray-700">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-800" style={{ fontWeight: 600 }}>{item.value}</span>
                    <span className="text-xs text-gray-400">
                      ({Math.round((item.value / ACCESS_REQUEST_STATUS.reduce((s, v) => s + v.value, 0)) * 100)}%)
                    </span>
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600" style={{ fontWeight: 500 }}>Total</span>
                  <span className="text-sm text-gray-800" style={{ fontWeight: 700 }}>
                    {ACCESS_REQUEST_STATUS.reduce((s, v) => s + v.value, 0)}
                  </span>
                </div>
              </div>
              <Link
                to="/agency/access-requests"
                className="inline-flex items-center gap-1.5 text-xs text-[#1E3A8A] hover:underline"
                style={{ fontWeight: 500 }}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                View All Access Requests
              </Link>
            </div>
          </div>
        </ChartCard>

        {/* Download Activity Timeline */}
        <ChartCard title="Research Download Activity">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={DOWNLOAD_TIMELINE}>
              <CartesianGrid key="grid-dl-timeline" strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis key="x-dl-timeline" dataKey="month" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
              <YAxis key="y-dl-timeline" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
              <Tooltip
                key="tt-dl-timeline"
                contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "13px" }}
              />
              <Line
                key="line-dl-activity"
                type="monotone"
                dataKey="downloads"
                stroke="#1E3A8A"
                strokeWidth={2.5}
                dot={{ fill: "#1E3A8A", r: 4, strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6, fill: "#1E3A8A", stroke: "#fff", strokeWidth: 2 }}
                name="Downloads"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

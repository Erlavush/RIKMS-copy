import { useState, useMemo, useCallback, useEffect } from "react";
import {
  TrendingUp,
  Download,
  Database,
  Building2,
  Users,
  BookOpen,
  Eye,
  Globe,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Hourglass,
  Filter,
  X,
  RefreshCw,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { AGENCIES } from "../../data/mock-data";

/* ─── Raw Data ─── */

const AGENCY_NAMES = AGENCIES.map((a) => a.abbreviation);

const CATEGORIES = ["Agriculture", "Education", "Technology", "Health", "Environment", "Economics", "Social Sciences", "Engineering"];
const CATEGORY_COLORS: Record<string, string> = {
  Agriculture: "#16A34A", Education: "#D97706", Technology: "#1E3A8A", Health: "#DC2626",
  Environment: "#0891B2", Economics: "#7C3AED", "Social Sciences": "#EA580C", Engineering: "#6B7280",
};

const SDG_LIST = [
  { sdg: "SDG 2 – Zero Hunger", color: "#DDA63A" },
  { sdg: "SDG 3 – Good Health", color: "#4C9F38" },
  { sdg: "SDG 4 – Quality Education", color: "#C5192D" },
  { sdg: "SDG 6 – Clean Water", color: "#26BDE2" },
  { sdg: "SDG 8 – Decent Work", color: "#A21942" },
  { sdg: "SDG 9 – Industry & Innovation", color: "#FD6925" },
  { sdg: "SDG 13 – Climate Action", color: "#3F7E44" },
  { sdg: "SDG 15 – Life on Land", color: "#56C02B" },
  { sdg: "SDG 17 – Partnerships", color: "#19486A" },
];

const YEARS = [2020, 2021, 2022, 2023, 2024, 2025];

/* Seeded pseudo-random for deterministic mock data */
function seededRand(seed: number) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647; };
}

/* Generate granular mock research records */
interface MockRecord {
  agency: string;
  year: number;
  category: string;
  sdg: string;
  views: number;
  downloads: number;
  title: string;
  accessStatus: "Approved" | "Pending" | "Denied";
}

const MOCK_RECORDS: MockRecord[] = (() => {
  const rng = seededRand(42);
  const records: MockRecord[] = [];
  const titles = [
    "IoT-Based Water Quality Monitoring System for Davao River",
    "Climate Adaptation Strategies in Davao Agriculture",
    "Economic Impact of Digital Transformation on MSMEs",
    "Public Health Framework for Disease Surveillance in Region XI",
    "Higher Education Quality Assurance Metrics in Region XI",
    "Renewable Energy Potential Assessment for Davao Region",
    "Digital Literacy Assessment Tool for Rural Communities",
    "Sustainable Agriculture Practices in Southern Mindanao",
    "Indigenous Knowledge Systems in Mindanao Agriculture",
    "Gender Equality in STEM Education Programs",
  ];
  const statuses: MockRecord["accessStatus"][] = ["Approved", "Pending", "Denied"];

  for (let y = 0; y < YEARS.length; y++) {
    const yearMult = 1 + y * 0.6; // more records in recent years
    for (let a = 0; a < AGENCY_NAMES.length; a++) {
      const count = Math.floor(3 + rng() * 12 * yearMult);
      for (let r = 0; r < count; r++) {
        const cat = CATEGORIES[Math.floor(rng() * CATEGORIES.length)];
        const sdg = SDG_LIST[Math.floor(rng() * SDG_LIST.length)].sdg;
        records.push({
          agency: AGENCY_NAMES[a],
          year: YEARS[y],
          category: cat,
          sdg,
          views: Math.floor(100 + rng() * 2800),
          downloads: Math.floor(50 + rng() * 1200),
          title: titles[Math.floor(rng() * titles.length)],
          accessStatus: statuses[Math.floor(rng() * 3 * (rng() > 0.3 ? 1 : 0.5))] || "Approved",
        });
      }
    }
  }
  return records;
})();

/* ─── Custom Tooltip ─── */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white shadow-lg border border-gray-200 rounded-lg px-3 py-2.5">
      <p className="text-xs text-gray-800 mb-1" style={{ fontWeight: 600 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={`tp-${p.dataKey}-${p.name}`} className="text-xs" style={{ color: p.color }}>
          {p.name}: {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  );
}

/* ─── Filter Active Pill ─── */
function FilterPill({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 bg-[#1E3A8A]/10 text-[#1E3A8A] rounded-full" style={{ fontWeight: 600 }}>
      {label}
      <button onClick={onClear} className="hover:bg-[#1E3A8A]/20 rounded-full p-0.5"><X className="w-3 h-3" /></button>
    </span>
  );
}

/* ─── Loading Overlay ─── */
function LoadingOverlay({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center rounded-xl" style={{ animation: "sa-fade-in 0.15s ease-out" }}>
      <RefreshCw className="w-5 h-5 text-[#1E3A8A] animate-spin" />
    </div>
  );
}

/* ═══════════════════════════════════════════ */
/* ─── Main Component ─── */
/* ═══════════════════════════════════════════ */
export function SystemAnalytics() {
  const [dateRange, setDateRange] = useState("all");
  const [filterAgency, setFilterAgency] = useState("All");
  const [filterYear, setFilterYear] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterSDG, setFilterSDG] = useState("All");
  const [showFilters, setShowFilters] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const hasActiveFilters = filterAgency !== "All" || filterYear !== "All" || filterCategory !== "All" || filterSDG !== "All";

  // Brief loading animation on filter change
  const triggerLoad = useCallback(() => {
    setIsLoading(true);
    const t = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (hasActiveFilters) return triggerLoad();
  }, [filterAgency, filterYear, filterCategory, filterSDG]);

  /* ─── Filtered Records ─── */
  const filtered = useMemo(() => {
    return MOCK_RECORDS.filter((r) => {
      if (filterAgency !== "All" && r.agency !== filterAgency) return false;
      if (filterYear !== "All" && r.year !== Number(filterYear)) return false;
      if (filterCategory !== "All" && r.category !== filterCategory) return false;
      if (filterSDG !== "All" && r.sdg !== filterSDG) return false;
      return true;
    });
  }, [filterAgency, filterYear, filterCategory, filterSDG]);

  /* ─── Chart Data: Upload Trends (Line/Area Chart) ─── */
  const uploadTrends = useMemo(() => {
    const map: Record<number, number> = {};
    YEARS.forEach((y) => { map[y] = 0; });
    filtered.forEach((r) => { map[r.year] = (map[r.year] || 0) + 1; });
    return YEARS.map((y) => ({ year: String(y), uploads: map[y] || 0 }));
  }, [filtered]);

  /* ─── Chart Data: Agency Contributions (Bar Chart) ─── */
  const agencyResearch = useMemo(() => {
    const map: Record<string, number> = {};
    AGENCY_NAMES.forEach((n) => { map[n] = 0; });
    filtered.forEach((r) => { map[r.agency] = (map[r.agency] || 0) + 1; });
    return AGENCY_NAMES.map((n) => ({ name: n, count: map[n] || 0 })).sort((a, b) => b.count - a.count);
  }, [filtered]);

  /* ─── Chart Data: Category (Donut) ─── */
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach((r) => { map[r.category] = (map[r.category] || 0) + 1; });
    return CATEGORIES.map((c) => ({ name: c, value: map[c] || 0, color: CATEGORY_COLORS[c] })).filter((c) => c.value > 0);
  }, [filtered]);
  const categoryTotal = categoryData.reduce((a, c) => a + c.value, 0);

  /* ─── Chart Data: SDG (Horizontal Bar) ─── */
  const sdgData = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach((r) => { map[r.sdg] = (map[r.sdg] || 0) + 1; });
    return SDG_LIST.map((s) => ({ sdg: s.sdg, count: map[s.sdg] || 0, color: s.color })).filter((s) => s.count > 0);
  }, [filtered]);

  /* ─── Chart Data: Access Status (Donut) ─── */
  const accessStatus = useMemo(() => {
    const map: Record<string, number> = { Approved: 0, Pending: 0, Denied: 0 };
    filtered.forEach((r) => { map[r.accessStatus] = (map[r.accessStatus] || 0) + 1; });
    return [
      { name: "Approved", value: map.Approved, color: "#16A34A" },
      { name: "Pending", value: map.Pending, color: "#D97706" },
      { name: "Denied", value: map.Denied, color: "#DC2626" },
    ];
  }, [filtered]);

  /* ─── Top Research ─── */
  const topResearch = useMemo(() => {
    return [...filtered].sort((a, b) => b.downloads - a.downloads).slice(0, 10);
  }, [filtered]);

  /* ─── Platform Usage (static – not affected by filters) ─── */
  const PLATFORM_USAGE = [
    { month: "Oct", views: 3240, downloads: 1120, requests: 28 },
    { month: "Nov", views: 3580, downloads: 1340, requests: 35 },
    { month: "Dec", views: 2980, downloads: 980, requests: 22 },
    { month: "Jan", views: 4120, downloads: 1560, requests: 41 },
    { month: "Feb", views: 4670, downloads: 1780, requests: 48 },
    { month: "Mar", views: 3820, downloads: 1420, requests: 38 },
  ];

  /* ─── Dynamic chart titles ─── */
  const filterContext = useMemo(() => {
    const parts: string[] = [];
    if (filterAgency !== "All") parts.push(filterAgency);
    if (filterYear !== "All") parts.push(filterYear);
    if (filterCategory !== "All") parts.push(filterCategory);
    if (filterSDG !== "All") parts.push(filterSDG.replace("SDG ", "").split(" – ")[0]);
    return parts.length > 0 ? ` – ${parts.join(", ")}` : "";
  }, [filterAgency, filterYear, filterCategory, filterSDG]);

  /* ─── Summary stats ─── */
  const totalViews = filtered.reduce((s, r) => s + r.views, 0);
  const totalDownloads = filtered.reduce((s, r) => s + r.downloads, 0);

  return (
    <div className="space-y-6 max-w-[1376px]">
      {/* ─── Page Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[#0F172A] mb-1" style={{ fontSize: "1.5rem", fontWeight: 700 }}>
            System Analytics
          </h1>
          <p className="text-[#6B7280] text-sm">
            Analyze research activity, system usage, and agency contributions across the RIKMS platform.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start flex-wrap">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 cursor-pointer"
          >
            <option value="last-30">Last 30 Days</option>
            <option value="last-6m">Last 6 Months</option>
            <option value="last-year">Last Year</option>
            <option value="all">All Time</option>
          </select>
          <button className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50 transition-colors shadow-sm" style={{ fontWeight: 500 }}>
            <Download className="w-4 h-4" /> Export Analytics Report
          </button>
        </div>
      </div>

      {/* ─── Filters ─── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#1E3A8A]" />
            <span className="text-sm text-gray-700" style={{ fontWeight: 600 }}>Analytics Filters</span>
            {hasActiveFilters && (
              <span className="text-[10px] text-[#1E3A8A] bg-[#1E3A8A]/10 px-2 py-0.5 rounded-full" style={{ fontWeight: 600 }}>
                Active
              </span>
            )}
          </div>
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${showFilters ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showFilters && (
          <div className="px-5 pb-4 pt-1 border-t border-gray-100">
            <div className="flex flex-wrap gap-3 mb-3">
              <div>
                <label className="block text-[10px] text-gray-400 mb-1 uppercase" style={{ fontWeight: 600, letterSpacing: "0.05em" }}>Agency</label>
                <select value={filterAgency} onChange={(e) => setFilterAgency(e.target.value)}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 cursor-pointer min-w-[140px]">
                  <option value="All">All Agencies</option>
                  {AGENCIES.map((a) => (<option key={`f-a-${a.id}`} value={a.abbreviation}>{a.abbreviation}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 mb-1 uppercase" style={{ fontWeight: 600, letterSpacing: "0.05em" }}>Publication Year</label>
                <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 cursor-pointer min-w-[120px]">
                  <option value="All">All Years</option>
                  {[...YEARS].reverse().map((y) => (<option key={`f-y-${y}`} value={y}>{y}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 mb-1 uppercase" style={{ fontWeight: 600, letterSpacing: "0.05em" }}>Research Category</label>
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 cursor-pointer min-w-[140px]">
                  <option value="All">All Categories</option>
                  {CATEGORIES.map((c) => (<option key={`f-c-${c}`} value={c}>{c}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 mb-1 uppercase" style={{ fontWeight: 600, letterSpacing: "0.05em" }}>SDG</label>
                <select value={filterSDG} onChange={(e) => setFilterSDG(e.target.value)}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 cursor-pointer min-w-[180px]">
                  <option value="All">All SDGs</option>
                  {SDG_LIST.map((s) => (<option key={`f-s-${s.sdg}`} value={s.sdg}>{s.sdg}</option>))}
                </select>
              </div>
            </div>
            {/* Active filter pills */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2 flex-wrap">
                {filterAgency !== "All" && <FilterPill label={filterAgency} onClear={() => setFilterAgency("All")} />}
                {filterYear !== "All" && <FilterPill label={filterYear} onClear={() => setFilterYear("All")} />}
                {filterCategory !== "All" && <FilterPill label={filterCategory} onClear={() => setFilterCategory("All")} />}
                {filterSDG !== "All" && <FilterPill label={filterSDG} onClear={() => setFilterSDG("All")} />}
                <button
                  onClick={() => { setFilterAgency("All"); setFilterYear("All"); setFilterCategory("All"); setFilterSDG("All"); }}
                  className="text-xs text-red-500 hover:underline px-2 py-1" style={{ fontWeight: 500 }}
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Section 1: Platform Overview Metrics ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { label: "Total Research Records", value: filtered.length.toLocaleString(), icon: Database, color: "#1E3A8A", bg: "#DBEAFE" },
          { label: "Total Participating Agencies", value: new Set(filtered.map((r) => r.agency)).size.toString(), icon: Building2, color: "#7C3AED", bg: "#EDE9FE" },
          { label: "Total Downloads", value: totalDownloads.toLocaleString(), icon: Download, color: "#D97706", bg: "#FEF3C7" },
          { label: "Total Views", value: totalViews.toLocaleString(), icon: Eye, color: "#16A34A", bg: "#DCFCE7" },
          { label: "Total Access Requests", value: filtered.length.toLocaleString(), icon: FileText, color: "#0891B2", bg: "#CFFAFE" },
          { label: "Active Agency Admin Users", value: "27", icon: Users, color: "#EA580C", bg: "#FFF7ED" },
        ].map((m) => {
          const Icon = m.icon;
          return (
            <div key={`metric-${m.label}`} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: m.bg }}>
                  <Icon className="w-5 h-5" style={{ color: m.color }} />
                </div>
              </div>
              <p className="text-2xl text-gray-800" style={{ fontWeight: 700 }}>{m.value}</p>
              <p className="text-[11px] text-gray-500 mt-1" style={{ fontWeight: 500 }}>{m.label}</p>
            </div>
          );
        })}
      </div>

      {/* ─── Section 2 & 3: Upload Trends + Agency Contributions ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Research Upload Trends (Area Chart) */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden relative">
          <LoadingOverlay show={isLoading} />
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h2 className="text-[#0F172A] text-sm" style={{ fontWeight: 700 }}>Research Upload Trends{filterContext}</h2>
              <p className="text-xs text-gray-400">Number of research uploads per year.</p>
            </div>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={uploadTrends} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="uploadGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1E3A8A" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#1E3A8A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid key="cg-ut" strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis key="x-ut" dataKey="year" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                <YAxis key="y-ut" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <Tooltip key="tt-ut" content={<ChartTooltip />} />
                <Area key="area-up" type="monotone" dataKey="uploads" stroke="#1E3A8A" strokeWidth={2.5} fill="url(#uploadGradient)" name="Uploads" dot={{ fill: "#1E3A8A", r: 4, strokeWidth: 2, stroke: "#fff" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Research Contributions by Agency (Bar Chart) */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden relative">
          <LoadingOverlay show={isLoading} />
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#1E3A8A]/10 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-[#1E3A8A]" />
            </div>
            <div>
              <h2 className="text-[#0F172A] text-sm" style={{ fontWeight: 700 }}>Research by Agency{filterContext}</h2>
              <p className="text-xs text-gray-400">Number of research records per agency.</p>
            </div>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={agencyResearch} margin={{ top: 5, right: 20, left: 0, bottom: 40 }}>
                <CartesianGrid key="cg-ar" strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis key="x-ar" dataKey="name" tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} angle={-35} textAnchor="end" interval={0} />
                <YAxis key="y-ar" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <Tooltip key="tt-ar" content={<ChartTooltip />} />
                <Bar key="bar-cnt" dataKey="count" fill="#1E3A8A" radius={[6, 6, 0, 0]} barSize={28} name="Research Records" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* ─── Section 4 & 5: Category + SDG ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Research by Category (Donut Chart) */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden relative">
          <LoadingOverlay show={isLoading} />
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h2 className="text-[#0F172A] text-sm" style={{ fontWeight: 700 }}>Research by Category{filterContext}</h2>
              <p className="text-xs text-gray-400">Distribution of research across categories.</p>
            </div>
          </div>
          <div className="p-5">
            {categoryData.length > 0 ? (
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="w-[220px] h-[220px] shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie key="pie-cat" data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={2} dataKey="value" stroke="none">
                        {categoryData.map((entry) => (<Cell key={`cc-${entry.name}`} fill={entry.color} />))}
                      </Pie>
                      <Tooltip key="tt-cat" formatter={(value: number, name: string) => [`${value} (${categoryTotal > 0 ? ((value / categoryTotal) * 100).toFixed(1) : 0}%)`, name]} contentStyle={{ borderRadius: "8px", fontSize: "12px", border: "1px solid #E5E7EB" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-2.5 w-full">
                  {categoryData.map((c) => (
                    <div key={`leg-${c.name}`} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                      <span className="text-xs text-gray-600 truncate flex-1">{c.name}</span>
                      <span className="text-xs text-gray-800 shrink-0" style={{ fontWeight: 600 }}>{c.value}</span>
                      <span className="text-[10px] text-gray-400 shrink-0">({categoryTotal > 0 ? ((c.value / categoryTotal) * 100).toFixed(0) : 0}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[220px] text-gray-400 text-sm">No data for selected filters</div>
            )}
          </div>
        </section>

        {/* SDG Research Contribution (Horizontal Bar Chart) */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden relative">
          <LoadingOverlay show={isLoading} />
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-50 flex items-center justify-center">
              <Globe className="w-4 h-4 text-cyan-600" />
            </div>
            <div>
              <h2 className="text-[#0F172A] text-sm" style={{ fontWeight: 700 }}>SDG Contribution{filterContext}</h2>
              <p className="text-xs text-gray-400">Research counts aligned per SDG.</p>
            </div>
          </div>
          <div className="p-5">
            {sdgData.length > 0 ? (
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={sdgData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid key="cg-sdg" strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                  <XAxis key="x-sdg" type="number" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                  <YAxis key="y-sdg" type="category" dataKey="sdg" tick={{ fontSize: 10, fill: "#6B7280", fontWeight: 500 }} axisLine={false} tickLine={false} width={160} />
                  <Tooltip key="tt-sdg" content={<ChartTooltip />} />
                  <Bar key="bar-sdg" dataKey="count" radius={[0, 6, 6, 0]} barSize={18} name="Papers">
                    {sdgData.map((entry) => (<Cell key={`sdg-c-${entry.sdg}`} fill={entry.color} />))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[340px] text-gray-400 text-sm">No data for selected filters</div>
            )}
          </div>
        </section>
      </div>

      {/* ─── Section 6: Most Accessed Research ─── */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden relative">
        <LoadingOverlay show={isLoading} />
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <h2 className="text-[#0F172A] text-sm" style={{ fontWeight: 700 }}>Most Accessed Research{filterContext}</h2>
            <p className="text-xs text-gray-400">Top research records by downloads.</p>
          </div>
        </div>
        {topResearch.length > 0 ? (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/80">
                    <th className="text-left px-6 py-3 text-xs text-gray-500 w-8" style={{ fontWeight: 600 }}>#</th>
                    <th className="text-left px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>Research Title</th>
                    <th className="text-left px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>Agency</th>
                    <th className="text-center px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>Year</th>
                    <th className="text-right px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>Views</th>
                    <th className="text-right px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>Downloads</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {topResearch.map((r, i) => (
                    <tr key={`tr-${i}-${r.title.slice(0,10)}-${r.agency}`} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] ${i < 3 ? "bg-[#1E3A8A] text-white" : "bg-gray-100 text-gray-500"}`} style={{ fontWeight: 700 }}>{i + 1}</span>
                      </td>
                      <td className="px-6 py-3.5"><span className="text-sm text-gray-800 truncate block max-w-[340px]" style={{ fontWeight: 500 }}>{r.title}</span></td>
                      <td className="px-6 py-3.5"><span className="text-xs text-[#1E3A8A] bg-[#1E3A8A]/5 px-2 py-1 rounded-md" style={{ fontWeight: 600 }}>{r.agency}</span></td>
                      <td className="px-6 py-3.5 text-center"><span className="text-xs text-gray-500">{r.year}</span></td>
                      <td className="px-6 py-3.5 text-right"><span className="text-xs text-gray-600" style={{ fontWeight: 600 }}>{r.views.toLocaleString()}</span></td>
                      <td className="px-6 py-3.5 text-right"><span className="text-xs text-[#1E3A8A]" style={{ fontWeight: 700 }}>{r.downloads.toLocaleString()}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="md:hidden divide-y divide-gray-100">
              {topResearch.slice(0, 6).map((r, i) => (
                <div key={`mob-tr-${i}-${r.agency}`} className="p-4">
                  <div className="flex items-start gap-3">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] shrink-0 mt-0.5 ${i < 3 ? "bg-[#1E3A8A] text-white" : "bg-gray-100 text-gray-500"}`} style={{ fontWeight: 700 }}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 mb-1" style={{ fontWeight: 500 }}>{r.title}</p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs text-[#1E3A8A] bg-[#1E3A8A]/5 px-2 py-0.5 rounded" style={{ fontWeight: 600 }}>{r.agency}</span>
                        <span className="text-xs text-gray-400">{r.year}</span>
                        <span className="text-xs text-gray-500"><Eye className="w-3 h-3 inline mr-0.5" />{r.views.toLocaleString()}</span>
                        <span className="text-xs text-[#1E3A8A]" style={{ fontWeight: 600 }}><Download className="w-3 h-3 inline mr-0.5" />{r.downloads.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-[120px] text-gray-400 text-sm">No research data for selected filters</div>
        )}
      </section>

      {/* ─── Section 7 & 8: Access Request Status + Platform Usage ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Access Request Status (Donut Chart) */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden relative">
          <LoadingOverlay show={isLoading} />
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-[#0F172A] text-sm" style={{ fontWeight: 700 }}>Access Request Status{filterContext}</h2>
              <p className="text-xs text-gray-400">Distribution of access request outcomes.</p>
            </div>
          </div>
          <div className="p-5">
            <div className="flex flex-col items-center">
              <div className="w-[220px] h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie key="pie-ars" data={accessStatus} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value" stroke="none">
                      {accessStatus.map((entry) => (<Cell key={`ars-${entry.name}`} fill={entry.color} />))}
                    </Pie>
                    <Tooltip key="tt-ars" formatter={(value: number, name: string) => [`${value} requests`, name]} contentStyle={{ borderRadius: "8px", fontSize: "12px", border: "1px solid #E5E7EB" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-8 mt-4">
                {accessStatus.map((s) => (
                  <div key={`ars-leg-${s.name}`} className="text-center">
                    <div className="flex items-center gap-1.5 justify-center mb-1">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="text-xs text-gray-500" style={{ fontWeight: 500 }}>{s.name}</span>
                    </div>
                    <p className="text-lg text-gray-800" style={{ fontWeight: 700 }}>{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Platform Usage Activity (Line Chart) */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-[#0F172A] text-sm" style={{ fontWeight: 700 }}>Platform Usage Activity</h2>
              <p className="text-xs text-gray-400">Monthly views, downloads, and access requests.</p>
            </div>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={PLATFORM_USAGE} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid key="cg-pu" strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis key="x-pu" dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis key="y-pu" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <Tooltip key="tt-pu" content={<ChartTooltip />} />
                <Legend key="lg-pu" wrapperStyle={{ fontSize: "11px" }} iconType="circle" iconSize={8} />
                <Line key="ln-views" type="monotone" dataKey="views" stroke="#1E3A8A" strokeWidth={2} dot={{ fill: "#1E3A8A", r: 3 }} name="Research Views" />
                <Line key="ln-downloads" type="monotone" dataKey="downloads" stroke="#16A34A" strokeWidth={2} dot={{ fill: "#16A34A", r: 3 }} name="Downloads" />
                <Line key="ln-requests" type="monotone" dataKey="requests" stroke="#D97706" strokeWidth={2} dot={{ fill: "#D97706", r: 3 }} name="Access Requests" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <style>{`
        @keyframes sa-fade-in { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}

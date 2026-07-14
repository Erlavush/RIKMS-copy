import { BarChart3, Download, FileText, KeyRound, TrendingUp } from "lucide-react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { useApi } from "../../hooks/useApi";
import { type AgencyAnalytics } from "../../lib/api";
import { formatNumber } from "../../lib/format";
import { EmptyState, ErrorState, LoadingState } from "../shared/AsyncState";

const COLORS = ["#1E3A8A", "#059669", "#D97706", "#7C3AED", "#0891B2", "#DC2626", "#64748B"];

function Metric({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-[#1E3A8A]">
                    <Icon className="h-5 w-5" />
                </span>
                <div>
                    <p className="text-2xl font-bold text-gray-900">{formatNumber(value)}</p>
                    <p className="text-xs text-gray-500">{label}</p>
                </div>
            </div>
        </div>
    );
}

export function Analytics() {
    const analytics = useApi<AgencyAnalytics>("/api/rikms/agency/analytics");
    if (analytics.loading) return <LoadingState label="Loading analytics…" />;
    if (analytics.error || !analytics.data)
        return (
            <ErrorState
                message={analytics.error ?? "Analytics are unavailable."}
                onRetry={() => void analytics.refresh()}
            />
        );
    const { statistics, documentsByYear, documentsByCategory, downloadsByMonth, topDocuments } =
        analytics.data.data;

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold text-[#1E3A8A]">Agency Analytics</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Live repository, download, and access trends for your agency.
                </p>
            </header>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Metric
                    icon={FileText}
                    label="Research records"
                    value={statistics.totalResearch ?? statistics.total ?? 0}
                />
                <Metric
                    icon={Download}
                    label="Downloads"
                    value={statistics.totalDownloads ?? statistics.downloads ?? 0}
                />
                <Metric
                    icon={KeyRound}
                    label="Access requests"
                    value={statistics.totalAccessRequests ?? statistics.accessRequests ?? 0}
                />
                <Metric icon={TrendingUp} label="Published records" value={statistics.published ?? 0} />
            </section>
            <section className="grid gap-6 lg:grid-cols-2">
                <ChartCard title="Research by year">
                    {documentsByYear.length ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={documentsByYear}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                <XAxis dataKey="year" />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#1E3A8A" radius={[5, 5, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyState title="No yearly data" />
                    )}
                </ChartCard>
                <ChartCard title="Research by category">
                    {documentsByCategory.length ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie
                                    data={documentsByCategory}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={95}
                                >
                                    {documentsByCategory.map((item, index) => (
                                        <Cell key={item.name} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyState title="No category data" />
                    )}
                </ChartCard>
                <div className="lg:col-span-2">
                    <ChartCard title="Downloads over time">
                        {downloadsByMonth.length ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={downloadsByMonth}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                    <XAxis dataKey="month" />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip />
                                    <Line
                                        type="monotone"
                                        dataKey="count"
                                        name="Downloads"
                                        stroke="#7C3AED"
                                        strokeWidth={3}
                                        dot={{ fill: "#7C3AED" }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <EmptyState title="No download activity yet" />
                        )}
                    </ChartCard>
                </div>
            </section>
            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-5 py-4">
                    <h2 className="font-semibold text-[#1E3A8A]">Most downloaded research</h2>
                </div>
                {topDocuments.length ? (
                    <ol className="divide-y divide-gray-100">
                        {topDocuments.map((document, index) => (
                            <li key={document.id} className="flex items-center gap-4 px-5 py-4">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-[#1E3A8A]">
                                    {index + 1}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-gray-900">
                                        {document.title}
                                    </p>
                                    <p className="mt-1 text-xs text-gray-500">
                                        {document.year} · {document.category}
                                    </p>
                                </div>
                                <span className="inline-flex items-center gap-1 text-sm font-semibold text-gray-700">
                                    <Download className="h-4 w-4" />
                                    {formatNumber(document.downloads)}
                                </span>
                            </li>
                        ))}
                    </ol>
                ) : (
                    <div className="p-5">
                        <EmptyState title="No downloads recorded" />
                    </div>
                )}
            </section>
        </div>
    );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 flex items-center gap-2 font-semibold text-[#1E3A8A]">
                <BarChart3 className="h-4 w-4" />
                {title}
            </h2>
            {children}
        </div>
    );
}

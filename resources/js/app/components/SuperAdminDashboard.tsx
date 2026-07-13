import { Link } from "react-router";
import {
    ArrowRight,
    BarChart3,
    BookOpen,
    Building2,
    Clock3,
    Database,
    Download,
    FileText,
    ShieldCheck,
    Users,
} from "lucide-react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

import { auditActorName, documentAgencyName } from "../lib/admin-api";
import type { AdminDocument, AuditLog, DataResponse } from "../lib/admin-api";
import { downloadCsv } from "../lib/csv";
import { EmptyState, ErrorState, LoadingState, PageHeader, Panel, StatusBadge } from "./super-admin/AdminUi";
import { formatDate, primaryButton } from "./super-admin/admin-ui-utils";
import { useAdminResource } from "./super-admin/useAdminResource";

interface DashboardStatistics {
    totalDocuments: number;
    publishedDocuments: number;
    pendingReview: number;
    totalAgencies: number;
    totalUsers: number;
    pendingAccessRequests: number;
    totalDownloads: number;
}

interface ChartPoint {
    name?: string;
    agency?: string;
    month?: string;
    year?: string | number;
    count?: number;
    value?: number;
    total?: number;
    submissions?: number;
}

interface DashboardData {
    statistics: DashboardStatistics;
    recentDocuments: AdminDocument[];
    recentActivity: AuditLog[];
    statusBreakdown: ChartPoint[] | Record<string, number>;
    monthlySubmissions: ChartPoint[];
    agencyBreakdown?: ChartPoint[];
}

function chartValue(point: ChartPoint): number {
    return Number(point.count ?? point.value ?? point.total ?? point.submissions ?? 0);
}

function chartLabel(point: ChartPoint): string {
    return String(point.name ?? point.agency ?? point.month ?? point.year ?? "Unknown");
}

function exportDashboard(data: DashboardData): void {
    const rows = [
        ["RIKMS system report", new Date().toLocaleString("en-PH")],
        [],
        ["Metric", "Value"],
        ...Object.entries(data.statistics).map(([key, value]) => [
            key.replace(/([A-Z])/g, " $1").trim(),
            value,
        ]),
        [],
        ["Monthly submissions", "Count"],
        ...data.monthlySubmissions.map((point) => [chartLabel(point), chartValue(point)]),
    ];
    downloadCsv(`rikms-system-report-${new Date().toISOString().slice(0, 10)}.csv`, rows);
}

export function SuperAdminDashboard() {
    const {
        data: response,
        loading,
        error,
        reload,
    } = useAdminResource<DataResponse<DashboardData>>("/dashboard");
    const data = response?.data;

    if (loading && !data) return <LoadingState label="Loading system dashboard…" />;
    if (error && !data) return <ErrorState message={error} onRetry={reload} />;
    if (!data)
        return (
            <EmptyState
                title="Dashboard unavailable"
                description="No dashboard data was returned by the platform."
            />
        );

    const statistics = data.statistics;
    const metrics = [
        {
            label: "Research records",
            value: statistics.totalDocuments,
            icon: Database,
            color: "text-blue-800",
            bg: "bg-blue-50",
            href: "/admin/research",
        },
        {
            label: "Published research",
            value: statistics.publishedDocuments,
            icon: BookOpen,
            color: "text-green-700",
            bg: "bg-green-50",
            href: "/admin/research?status=published",
        },
        {
            label: "Pending review",
            value: statistics.pendingReview,
            icon: ShieldCheck,
            color: "text-amber-700",
            bg: "bg-amber-50",
            href: "/admin/moderation",
        },
        {
            label: "Participating agencies",
            value: statistics.totalAgencies,
            icon: Building2,
            color: "text-violet-700",
            bg: "bg-violet-50",
            href: "/admin/agencies",
        },
        {
            label: "Admin users",
            value: statistics.totalUsers,
            icon: Users,
            color: "text-cyan-700",
            bg: "bg-cyan-50",
            href: "/admin/users",
        },
        {
            label: "Pending access requests",
            value: statistics.pendingAccessRequests,
            icon: Clock3,
            color: "text-red-700",
            bg: "bg-red-50",
            href: "/admin/access-monitoring",
        },
    ];

    const statusData = Array.isArray(data.statusBreakdown)
        ? data.statusBreakdown
        : Object.entries(data.statusBreakdown ?? {}).map(([name, count]) => ({ name, count }));

    return (
        <div className="mx-auto max-w-[1376px] space-y-6">
            <PageHeader
                title="System Dashboard"
                description="Live platform totals, review workload, and recent administrative activity."
                action={
                    <button type="button" className={primaryButton} onClick={() => exportDashboard(data)}>
                        <Download className="h-4 w-4" /> Export snapshot
                    </button>
                }
            />

            {error && <ErrorState message={`Some dashboard data may be stale: ${error}`} onRetry={reload} />}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {metrics.map(({ label, value, icon: Icon, color, bg, href }) => (
                    <Link
                        key={label}
                        to={href}
                        className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                        <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
                            <Icon className={`h-5 w-5 ${color}`} />
                        </div>
                        <p className="text-2xl font-bold text-slate-900">
                            {Number(value ?? 0).toLocaleString()}
                        </p>
                        <p className="mt-1 text-xs font-medium text-gray-500">{label}</p>
                    </Link>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Panel>
                    <div className="flex items-center gap-2.5 border-b border-gray-100 px-6 py-4">
                        <BarChart3 className="h-5 w-5 text-[#1E3A8A]" />
                        <h2 className="text-sm font-bold text-slate-900">Records by status</h2>
                    </div>
                    {statusData.length === 0 ? (
                        <EmptyState
                            title="No status data"
                            description="Status distribution will appear after records are added."
                        />
                    ) : (
                        <div className="px-4 py-5">
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart
                                    data={statusData.map((point) => ({
                                        label: chartLabel(point),
                                        count: chartValue(point),
                                    }))}
                                    margin={{ top: 5, right: 16, left: 0, bottom: 28 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                                    <XAxis
                                        dataKey="label"
                                        tick={{ fontSize: 10, fill: "#6B7280" }}
                                        axisLine={false}
                                        tickLine={false}
                                        angle={-20}
                                        textAnchor="end"
                                    />
                                    <YAxis
                                        allowDecimals={false}
                                        tick={{ fontSize: 11, fill: "#9CA3AF" }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: 10,
                                            border: "1px solid #E5E7EB",
                                            fontSize: 12,
                                        }}
                                    />
                                    <Bar
                                        dataKey="count"
                                        name="Records"
                                        fill="#1E3A8A"
                                        radius={[6, 6, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </Panel>

                <Panel>
                    <div className="flex items-center gap-2.5 border-b border-gray-100 px-6 py-4">
                        <FileText className="h-5 w-5 text-green-700" />
                        <h2 className="text-sm font-bold text-slate-900">Monthly submissions</h2>
                    </div>
                    {data.monthlySubmissions.length === 0 ? (
                        <EmptyState
                            title="No submission history"
                            description="Monthly submission totals will appear here."
                        />
                    ) : (
                        <div className="px-4 py-5">
                            <ResponsiveContainer width="100%" height={280}>
                                <LineChart
                                    data={data.monthlySubmissions.map((point) => ({
                                        label: chartLabel(point),
                                        count: chartValue(point),
                                    }))}
                                    margin={{ top: 5, right: 16, left: 0, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                                    <XAxis
                                        dataKey="label"
                                        tick={{ fontSize: 10, fill: "#6B7280" }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        allowDecimals={false}
                                        tick={{ fontSize: 11, fill: "#9CA3AF" }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: 10,
                                            border: "1px solid #E5E7EB",
                                            fontSize: 12,
                                        }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="count"
                                        name="Submissions"
                                        stroke="#16A34A"
                                        strokeWidth={2.5}
                                        dot={{ r: 3, fill: "#16A34A" }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </Panel>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                <Panel className="lg:col-span-3">
                    <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                        <h2 className="text-sm font-bold text-slate-900">Recent activity</h2>
                        <Link
                            to="/admin/activity"
                            className="flex items-center gap-1 text-xs font-semibold text-[#1E3A8A] hover:underline"
                        >
                            View all <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                    {data.recentActivity.length === 0 ? (
                        <EmptyState
                            title="No activity yet"
                            description="Administrative actions will be recorded here."
                        />
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {data.recentActivity.map((activity) => (
                                <li key={activity.id} className="px-6 py-4">
                                    <p className="text-sm text-slate-700">
                                        <span className="font-semibold">{auditActorName(activity)}</span>{" "}
                                        {activity.description ?? activity.eventType ?? activity.action}
                                    </p>
                                    <p className="mt-1 text-xs text-gray-400">
                                        {formatDate(activity.createdAt, true)}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>

                <Panel className="lg:col-span-2">
                    <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                        <h2 className="text-sm font-bold text-slate-900">Recent research</h2>
                        <Link
                            to="/admin/research"
                            className="flex items-center gap-1 text-xs font-semibold text-[#1E3A8A] hover:underline"
                        >
                            Browse <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                    {data.recentDocuments.length === 0 ? (
                        <EmptyState
                            title="No research records"
                            description="Newly submitted records will appear here."
                        />
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {data.recentDocuments.map((document) => (
                                <li key={document.id} className="px-6 py-4">
                                    <p className="truncate text-sm font-semibold text-slate-800">
                                        {document.title}
                                    </p>
                                    <div className="mt-2 flex items-center justify-between gap-3">
                                        <span className="truncate text-xs text-gray-500">
                                            {documentAgencyName(document)}
                                        </span>
                                        <StatusBadge status={document.status} />
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>
            </div>

            <p className="text-right text-xs text-gray-400">
                {Number(statistics.totalDownloads ?? 0).toLocaleString()} authorized downloads recorded
            </p>
        </div>
    );
}

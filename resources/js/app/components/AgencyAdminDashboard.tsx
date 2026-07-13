import { Link } from "react-router";
import {
    Archive,
    CheckCircle2,
    ClipboardList,
    Database,
    Download,
    FilePenLine,
    FileText,
    Plus,
} from "lucide-react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { useApi } from "../hooks/useApi";
import { type DashboardPayload } from "../lib/api";
import { formatDate, formatNumber } from "../lib/format";
import { EmptyState, ErrorState, LoadingState } from "./shared/AsyncState";
import { StatusBadge } from "./shared/StatusBadge";
import { useAgencyContext } from "../hooks/useAgencyContext";
import { hasPermission } from "../lib/permissions";

const STATUS_COLORS: Record<string, string> = {
    published: "#059669",
    pending: "#2563EB",
    draft: "#D97706",
    rejected: "#DC2626",
    archived: "#6B7280",
};

function StatCard({
    icon: Icon,
    label,
    value,
    color,
}: {
    icon: React.ElementType;
    label: string;
    value: number;
    color: string;
}) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
                <span
                    className="flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${color}15` }}
                >
                    <Icon className="h-5 w-5" style={{ color }} />
                </span>
                <div>
                    <p className="text-2xl font-bold text-gray-800">{formatNumber(value)}</p>
                    <p className="text-xs text-gray-500">{label}</p>
                </div>
            </div>
        </div>
    );
}

export function AgencyAdminDashboard() {
    const { user } = useAgencyContext();
    const dashboard = useApi<DashboardPayload>("/api/rikms/agency/dashboard");
    const canCreate = hasPermission(user, "documents.create");
    const canUpdate = hasPermission(user, "documents.update");
    const canManageAccess = hasPermission(user, "access_requests.manage");

    if (dashboard.loading) return <LoadingState label="Loading dashboard…" />;
    if (dashboard.error || !dashboard.data)
        return (
            <ErrorState
                message={dashboard.error ?? "Dashboard data is unavailable."}
                onRetry={() => void dashboard.refresh()}
            />
        );

    const { statistics, recentDocuments, pendingAccessRequests, statusBreakdown, monthlySubmissions } =
        dashboard.data.data;
    const pieData = statusBreakdown.map((item) => ({
        ...item,
        color: item.color ?? STATUS_COLORS[item.name.toLowerCase()] ?? "#94A3B8",
    }));

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold text-[#1E3A8A]">Welcome, {user.name}</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Here is the current research activity for {user.agencyName}.
                </p>
            </header>

            <div className="flex flex-wrap gap-3">
                {canCreate && (
                    <Link
                        to="/agency/upload"
                        className="inline-flex items-center gap-2 rounded-lg bg-[#1E3A8A] px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-900"
                    >
                        <Plus className="h-4 w-4" />
                        Upload research
                    </Link>
                )}
                <Link
                    to="/agency/research"
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    <Database className="h-4 w-4" />
                    Manage repository
                </Link>
                {canManageAccess && (
                    <Link
                        to="/agency/access-requests"
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        <ClipboardList className="h-4 w-4" />
                        Review requests ({statistics.pendingAccessRequests})
                    </Link>
                )}
            </div>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Research statistics">
                <StatCard
                    icon={FileText}
                    label="Total records"
                    value={statistics.totalResearch}
                    color="#1E3A8A"
                />
                <StatCard icon={FilePenLine} label="Drafts" value={statistics.drafts} color="#D97706" />
                <StatCard
                    icon={CheckCircle2}
                    label="Published"
                    value={statistics.published}
                    color="#059669"
                />
                <StatCard icon={Archive} label="Archived" value={statistics.archived} color="#6B7280" />
                <StatCard
                    icon={ClipboardList}
                    label="Pending review"
                    value={statistics.pending}
                    color="#2563EB"
                />
                <StatCard
                    icon={Download}
                    label="Downloads"
                    value={statistics.totalDownloads}
                    color="#7C3AED"
                />
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-4 font-semibold text-[#1E3A8A]">Monthly submissions</h2>
                    {monthlySubmissions.length ? (
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={monthlySubmissions}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Bar
                                    dataKey="count"
                                    name="Submissions"
                                    fill="#1E3A8A"
                                    radius={[5, 5, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyState title="No submission history yet" />
                    )}
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-4 font-semibold text-[#1E3A8A]">Repository status</h2>
                    {pieData.length ? (
                        <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    dataKey="value"
                                    nameKey="name"
                                    innerRadius={55}
                                    outerRadius={90}
                                    paddingAngle={2}
                                >
                                    {pieData.map((item) => (
                                        <Cell key={item.name} fill={item.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyState title="No records yet" />
                    )}
                </div>
            </section>

            <section className={`grid gap-6 ${canManageAccess ? "xl:grid-cols-[1.5fr_1fr]" : ""}`}>
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                        <h2 className="font-semibold text-[#1E3A8A]">Recently updated</h2>
                        <Link
                            to="/agency/research"
                            className="text-sm font-medium text-[#1E3A8A] hover:underline"
                        >
                            View all
                        </Link>
                    </div>
                    {recentDocuments.length ? (
                        <ul className="divide-y divide-gray-100">
                            {recentDocuments.map((document) => (
                                <li
                                    key={document.id}
                                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                                >
                                    <div className="min-w-0">
                                        <Link
                                            to={
                                                canUpdate
                                                    ? `/agency/research/${document.id}/edit`
                                                    : `/agency/research/${document.id}/versions`
                                            }
                                            className="line-clamp-1 text-sm font-medium text-gray-800 hover:text-[#1E3A8A]"
                                        >
                                            {document.title}
                                        </Link>
                                        <p className="mt-1 text-xs text-gray-500">
                                            {document.year} · Updated {formatDate(document.updatedAt)}
                                        </p>
                                    </div>
                                    <StatusBadge status={document.status} />
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="p-5">
                            <EmptyState
                                title="No research records"
                                description={
                                    canCreate
                                        ? "Upload your first record to start the repository."
                                        : "Research records will appear here when they are available."
                                }
                            />
                        </div>
                    )}
                </div>
                {canManageAccess && (
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                            <h2 className="font-semibold text-[#1E3A8A]">Pending access requests</h2>
                            <Link
                                to="/agency/access-requests"
                                className="text-sm font-medium text-[#1E3A8A] hover:underline"
                            >
                                View all
                            </Link>
                        </div>
                        {pendingAccessRequests.length ? (
                            <ul className="divide-y divide-gray-100">
                                {pendingAccessRequests.map((request) => (
                                    <li key={request.id} className="px-5 py-4">
                                        <p className="line-clamp-1 text-sm font-medium text-gray-800">
                                            {request.title}
                                        </p>
                                        <p className="mt-1 text-xs text-gray-500">
                                            {request.requesterName} · {formatDate(request.createdAt)}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="p-5">
                                <EmptyState title="No pending requests" />
                            </div>
                        )}
                    </div>
                )}
            </section>
        </div>
    );
}

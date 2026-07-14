import { Building2, Download, FileDown, Library } from "lucide-react";
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

import type { DataResponse } from "../../lib/admin-api";
import { downloadCsv } from "../../lib/csv";
import { EmptyState, ErrorState, LoadingState, PageHeader, Panel } from "./AdminUi";
import { primaryButton } from "./admin-ui-utils";
import { useAdminResource } from "./useAdminResource";

interface AnalyticsPoint {
    name?: string;
    label?: string;
    status?: string;
    agency?: string;
    abbreviation?: string;
    sdg?: string | number;
    month?: string;
    count?: number;
    value?: number;
    total?: number;
    submissions?: number;
    downloads?: number;
}

interface AnalyticsData {
    statistics: Record<string, number>;
    statusBreakdown: AnalyticsPoint[] | Record<string, number>;
    agencyBreakdown: AnalyticsPoint[];
    sdgBreakdown: AnalyticsPoint[];
    monthlySubmissions: AnalyticsPoint[];
    monthlyDownloads: AnalyticsPoint[];
}

function valueOf(point: AnalyticsPoint, preferred?: "downloads" | "submissions"): number {
    return Number(
        (preferred ? point[preferred] : undefined) ??
            point.count ??
            point.value ??
            point.total ??
            point.submissions ??
            point.downloads ??
            0,
    );
}

function labelOf(point: AnalyticsPoint): string {
    const sdg = point.sdg ? `SDG ${point.sdg}` : undefined;
    return String(
        point.name ??
            point.label ??
            point.status ??
            point.abbreviation ??
            point.agency ??
            sdg ??
            point.month ??
            "Unknown",
    );
}

function asPoints(value: AnalyticsPoint[] | Record<string, number>): AnalyticsPoint[] {
    return Array.isArray(value)
        ? value
        : Object.entries(value ?? {}).map(([name, count]) => ({ name, count }));
}

function exportAnalytics(data: AnalyticsData): void {
    const sections: Array<[string, AnalyticsPoint[]]> = [
        ["Status breakdown", asPoints(data.statusBreakdown)],
        ["Agency breakdown", data.agencyBreakdown],
        ["SDG breakdown", data.sdgBreakdown],
        ["Monthly submissions", data.monthlySubmissions],
        ["Monthly downloads", data.monthlyDownloads],
    ];
    const rows: Array<Array<string | number>> = [
        ["RIKMS analytics export", new Date().toLocaleString("en-PH")],
        [],
        ["Metric", "Value"],
        ...Object.entries(data.statistics),
    ];
    sections.forEach(([heading, points]) =>
        rows.push([], [heading, "Count"], ...points.map((point) => [labelOf(point), valueOf(point)])),
    );
    downloadCsv(`rikms-analytics-${new Date().toISOString().slice(0, 10)}.csv`, rows);
}

function AnalyticsChart({
    title,
    points,
    kind = "bar",
    preferred,
}: {
    title: string;
    points: AnalyticsPoint[];
    kind?: "bar" | "line";
    preferred?: "downloads" | "submissions";
}) {
    const chartData = points.map((point) => ({ label: labelOf(point), value: valueOf(point, preferred) }));
    return (
        <Panel>
            <div className="border-b border-gray-100 px-6 py-4">
                <h2 className="text-sm font-bold text-slate-900">{title}</h2>
            </div>
            {chartData.length === 0 ? (
                <EmptyState
                    title="No data available"
                    description="This chart will populate as platform activity is recorded."
                />
            ) : (
                <div className="p-4">
                    <ResponsiveContainer width="100%" height={285}>
                        {kind === "line" ? (
                            <LineChart data={chartData} margin={{ top: 5, right: 18, left: 0, bottom: 12 }}>
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
                                    dataKey="value"
                                    stroke="#16A34A"
                                    strokeWidth={2.5}
                                    dot={{ r: 3, fill: "#16A34A" }}
                                />
                            </LineChart>
                        ) : (
                            <BarChart data={chartData} margin={{ top: 5, right: 18, left: 0, bottom: 35 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                                <XAxis
                                    dataKey="label"
                                    tick={{ fontSize: 9, fill: "#6B7280" }}
                                    axisLine={false}
                                    tickLine={false}
                                    angle={-25}
                                    textAnchor="end"
                                    interval={0}
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
                                <Bar dataKey="value" fill="#1E3A8A" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        )}
                    </ResponsiveContainer>
                </div>
            )}
        </Panel>
    );
}

export function SystemAnalytics() {
    const {
        data: response,
        loading,
        error,
        reload,
    } = useAdminResource<DataResponse<AnalyticsData>>("/analytics");
    const data = response?.data;
    if (loading && !data) return <LoadingState label="Loading system analytics…" />;
    if (error && !data) return <ErrorState message={error} onRetry={reload} />;
    if (!data)
        return <EmptyState title="Analytics unavailable" description="No analytics payload was returned." />;

    const metricCandidates = [
        { keys: ["totalDocuments", "researchRecords"], label: "Research records", icon: Library },
        { keys: ["publishedDocuments", "publishedResearch"], label: "Published", icon: FileDown },
        { keys: ["totalDownloads", "downloads"], label: "Downloads", icon: Download },
        { keys: ["totalAgencies", "agencies"], label: "Participating agencies", icon: Building2 },
    ];

    return (
        <div className="mx-auto max-w-[1376px] space-y-6">
            <PageHeader
                title="System Analytics"
                description="Live aggregate measures derived from RIKMS records and authorized activity."
                action={
                    <button type="button" className={primaryButton} onClick={() => exportAnalytics(data)}>
                        <Download className="h-4 w-4" /> Export CSV
                    </button>
                }
            />
            {error && <ErrorState message={`Displayed values may be stale: ${error}`} onRetry={reload} />}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {metricCandidates.map(({ keys, label, icon: Icon }) => {
                    const value =
                        keys
                            .map((key) => data.statistics[key])
                            .find((candidate) => candidate !== undefined) ?? 0;
                    return (
                        <div key={label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                                <Icon className="h-5 w-5 text-[#1E3A8A]" />
                            </div>
                            <p className="text-2xl font-bold text-slate-900">
                                {Number(value).toLocaleString()}
                            </p>
                            <p className="mt-1 text-xs font-medium text-gray-500">{label}</p>
                        </div>
                    );
                })}
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
                <AnalyticsChart title="Records by agency" points={data.agencyBreakdown ?? []} />
                <AnalyticsChart title="Records by status" points={asPoints(data.statusBreakdown)} />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
                <AnalyticsChart
                    title="Monthly submissions"
                    points={data.monthlySubmissions ?? []}
                    kind="line"
                    preferred="submissions"
                />
                <AnalyticsChart
                    title="Monthly downloads"
                    points={data.monthlyDownloads ?? []}
                    kind="line"
                    preferred="downloads"
                />
            </div>
            <AnalyticsChart title="Sustainable Development Goal coverage" points={data.sdgBreakdown ?? []} />
            <p className="text-xs leading-5 text-gray-400">
                Analytics reflect data currently stored by RIKMS. They are operational indicators, not
                independently validated impact measurements.
            </p>
        </div>
    );
}

import { AlertTriangle, Clock3, KeyRound, ShieldAlert, ShieldCheck, UserCheck, Users } from "lucide-react";

import type { DataResponse } from "../../lib/admin-api";
import { EmptyState, ErrorState, LoadingState, PageHeader, Panel, StatusBadge } from "./AdminUi";
import { formatDate } from "./admin-ui-utils";
import { useAdminResource } from "./useAdminResource";

interface LoginEvent {
    id?: number | string;
    user?: string;
    userName?: string;
    email?: string;
    ipAddress?: string;
    status?: string;
    successful?: boolean;
    failureReason?: string | null;
    createdAt?: string;
    loggedInAt?: string;
}

interface SecurityEvent {
    id?: number | string;
    type?: string;
    action?: string;
    eventType?: string;
    severity?: string;
    title?: string;
    description?: string;
    details?: Record<string, unknown> | null;
    createdAt?: string;
}

interface SecurityData {
    activeUsers: number;
    admins: number;
    failedLogins24h: number;
    recentLogins: LoginEvent[];
    securityEvents: SecurityEvent[];
    passwordPolicy: string | Record<string, unknown> | null;
    sessionLifetime: number | string;
}

function policyEntries(policy: SecurityData["passwordPolicy"]): Array<[string, string]> {
    if (!policy) return [];
    if (typeof policy === "string") return [["Policy", policy]];
    return Object.entries(policy).map(([key, value]) => [
        key
            .replace(/([A-Z_])/g, " $1")
            .replace(/_/g, " ")
            .trim(),
        typeof value === "boolean" ? (value ? "Required" : "Not required") : String(value),
    ]);
}

export function SecurityCenter() {
    const {
        data: response,
        loading,
        error,
        reload,
    } = useAdminResource<DataResponse<SecurityData>>("/security");
    const data = response?.data;
    if (loading && !data) return <LoadingState label="Loading security status…" />;
    if (error && !data) return <ErrorState message={error} onRetry={reload} />;
    if (!data)
        return (
            <EmptyState
                title="Security status unavailable"
                description="The server returned no security information."
            />
        );

    const cards = [
        {
            label: "Active users",
            value: data.activeUsers,
            icon: UserCheck,
            color: "text-green-700",
            bg: "bg-green-50",
        },
        {
            label: "Administrator accounts",
            value: data.admins,
            icon: Users,
            color: "text-blue-800",
            bg: "bg-blue-50",
        },
        {
            label: "Failed logins (24h)",
            value: data.failedLogins24h,
            icon: ShieldAlert,
            color: data.failedLogins24h > 0 ? "text-red-700" : "text-gray-600",
            bg: data.failedLogins24h > 0 ? "bg-red-50" : "bg-gray-100",
        },
        {
            label: "Session lifetime",
            value: `${data.sessionLifetime} min`,
            icon: Clock3,
            color: "text-violet-700",
            bg: "bg-violet-50",
        },
    ];

    return (
        <div className="mx-auto max-w-[1376px] space-y-6">
            <PageHeader
                title="Security Center"
                description="Read-only security posture based on real accounts, login events, and configured policies."
            />
            {error && <ErrorState message={`Security data may be stale: ${error}`} onRetry={reload} />}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {cards.map(({ label, value, icon: Icon, color, bg }) => (
                    <div key={label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
                            <Icon className={`h-5 w-5 ${color}`} />
                        </div>
                        <p className="text-2xl font-bold text-slate-900">
                            {typeof value === "number" ? value.toLocaleString() : value}
                        </p>
                        <p className="mt-1 text-xs font-medium text-gray-500">{label}</p>
                    </div>
                ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-5">
                <Panel className="lg:col-span-3">
                    <div className="flex items-center gap-2.5 border-b border-gray-100 px-6 py-4">
                        <ShieldCheck className="h-5 w-5 text-[#1E3A8A]" />
                        <h2 className="text-sm font-bold text-slate-900">Recent login events</h2>
                    </div>
                    {!data.recentLogins?.length ? (
                        <EmptyState
                            title="No login events"
                            description="Recent successful or failed login attempts will appear here."
                        />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                                    <tr>
                                        <th className="px-5 py-3 font-semibold">User</th>
                                        <th className="px-5 py-3 font-semibold">Status</th>
                                        <th className="px-5 py-3 font-semibold">IP address</th>
                                        <th className="px-5 py-3 font-semibold">Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {data.recentLogins.map((login, index) => (
                                        <tr key={login.id ?? `${login.email}-${login.createdAt}-${index}`}>
                                            <td className="px-5 py-4">
                                                <p className="font-medium text-slate-800">
                                                    {login.userName ?? login.user ?? "Unknown user"}
                                                </p>
                                                <p className="text-xs text-gray-500">{login.email || "—"}</p>
                                                {login.failureReason && (
                                                    <p className="mt-1 text-xs text-red-600">
                                                        {login.failureReason}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-5 py-4">
                                                <StatusBadge
                                                    status={
                                                        login.status ??
                                                        (login.successful === false ? "failed" : "successful")
                                                    }
                                                />
                                            </td>
                                            <td className="px-5 py-4 font-mono text-xs text-gray-500">
                                                {login.ipAddress || "—"}
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4 text-xs text-gray-500">
                                                {formatDate(login.loggedInAt ?? login.createdAt, true)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Panel>
                <Panel className="lg:col-span-2">
                    <div className="flex items-center gap-2.5 border-b border-gray-100 px-6 py-4">
                        <KeyRound className="h-5 w-5 text-violet-700" />
                        <h2 className="text-sm font-bold text-slate-900">Password policy</h2>
                    </div>
                    {policyEntries(data.passwordPolicy).length === 0 ? (
                        <EmptyState
                            title="No policy details"
                            description="Password validation remains enforced by the authentication backend."
                        />
                    ) : (
                        <dl className="divide-y divide-gray-100">
                            {policyEntries(data.passwordPolicy).map(([label, value]) => (
                                <div
                                    key={label}
                                    className="flex items-center justify-between gap-4 px-6 py-3.5"
                                >
                                    <dt className="text-sm capitalize text-gray-600">{label}</dt>
                                    <dd className="text-right text-sm font-semibold text-slate-800">
                                        {value}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    )}
                </Panel>
            </div>

            <Panel>
                <div className="flex items-center gap-2.5 border-b border-gray-100 px-6 py-4">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    <h2 className="text-sm font-bold text-slate-900">Security events</h2>
                </div>
                {!data.securityEvents?.length ? (
                    <EmptyState
                        title="No recent security events"
                        description="The server has not reported any security-relevant events for this period."
                    />
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {data.securityEvents.map((event, index) => (
                            <li
                                key={event.id ?? `${event.title}-${index}`}
                                className="flex items-start gap-4 px-6 py-4"
                            >
                                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50">
                                    <AlertTriangle className="h-4 w-4 text-amber-700" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <p className="font-semibold text-slate-800">
                                            {event.title ?? event.action ?? event.type ?? "Security event"}
                                        </p>
                                        <StatusBadge status={event.severity ?? "info"} />
                                    </div>
                                    <p className="mt-1 text-sm leading-6 text-gray-600">
                                        {event.description ??
                                            event.eventType ??
                                            (event.details && Object.keys(event.details).length
                                                ? JSON.stringify(event.details)
                                                : "No additional details were recorded.")}
                                    </p>
                                    <p className="mt-1 text-xs text-gray-400">
                                        {formatDate(event.createdAt, true)}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </Panel>
            <p className="text-xs leading-5 text-gray-400">
                Session termination and account changes are not exposed here because the backend does not
                provide those security operations. Deactivate compromised accounts from Administrator Users.
            </p>
        </div>
    );
}

import { useState } from "react";
import { Download, Eye, FileClock, Filter } from "lucide-react";

import { auditActorEmail, auditActorName } from "../../lib/admin-api";
import type { AuditLog, Paginated } from "../../lib/admin-api";
import { downloadCsv } from "../../lib/csv";
import {
    EmptyState,
    ErrorState,
    LoadingState,
    Modal,
    PageHeader,
    Pagination,
    Panel,
    StatusBadge,
} from "./AdminUi";
import { formatDate, inputClass, secondaryButton } from "./admin-ui-utils";
import { useAdminResource } from "./useAdminResource";

function exportLogs(logs: AuditLog[]): void {
    const rows = [
        ["Timestamp", "User", "Email", "Action", "Description", "IP address", "Subject"],
        ...logs.map((log) => [
            formatDate(log.createdAt, true),
            auditActorName(log),
            auditActorEmail(log) ?? "",
            log.action,
            log.description ?? log.eventType ?? "",
            log.ipAddress ?? "",
            log.documentTitle ?? `${log.subjectType ?? ""}${log.subjectId ? ` #${log.subjectId}` : ""}`,
        ]),
    ];
    downloadCsv(`rikms-audit-log-page-${new Date().toISOString().slice(0, 10)}.csv`, rows);
}

export function ActivityLogs() {
    const [action, setAction] = useState("");
    const [userId, setUserId] = useState("");
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<AuditLog | null>(null);
    const {
        data: response,
        loading,
        error,
        reload,
    } = useAdminResource<Paginated<AuditLog>>("/audit-logs", { action, user_id: userId, page });

    return (
        <div className="mx-auto max-w-[1376px] space-y-6">
            <PageHeader
                title="System Activity Logs"
                description="Review immutable administrative and security-relevant events recorded by RIKMS."
                action={
                    <button
                        type="button"
                        className={secondaryButton}
                        disabled={!response?.data.length}
                        onClick={() => exportLogs(response?.data ?? [])}
                    >
                        <Download className="h-4 w-4" /> Export this page
                    </button>
                }
            />
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                <div className="flex gap-3">
                    <FileClock className="h-5 w-5 shrink-0" />
                    <p>
                        The export contains the currently loaded page. Server audit records cannot be edited
                        from this screen.
                    </p>
                </div>
            </div>
            <Panel>
                <div className="grid gap-3 border-b border-gray-100 p-5 sm:grid-cols-[220px_220px_auto]">
                    <label>
                        <span className="mb-1.5 block text-xs font-medium text-gray-500">Action</span>
                        <select
                            value={action}
                            onChange={(event) => {
                                setAction(event.target.value);
                                setPage(1);
                            }}
                            className={inputClass}
                        >
                            <option value="">All actions</option>
                            <option value="login">Login</option>
                            <option value="logout">Logout</option>
                            <option value="created">Created</option>
                            <option value="updated">Updated</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="archived">Archived</option>
                            <option value="restored">Restored</option>
                        </select>
                    </label>
                    <label>
                        <span className="mb-1.5 block text-xs font-medium text-gray-500">User ID</span>
                        <input
                            type="number"
                            min="1"
                            value={userId}
                            onChange={(event) => {
                                setUserId(event.target.value);
                                setPage(1);
                            }}
                            placeholder="All users"
                            className={inputClass}
                        />
                    </label>
                    <div className="flex items-end">
                        <div className="flex items-center gap-2 pb-3 text-xs text-gray-400">
                            <Filter className="h-4 w-4" /> Filters are applied server-side
                        </div>
                    </div>
                </div>
                {loading && !response ? (
                    <LoadingState label="Loading audit logs…" />
                ) : error && !response ? (
                    <ErrorState message={error} onRetry={reload} />
                ) : !response?.data.length ? (
                    <EmptyState
                        title="No audit events found"
                        description="No events match the selected filters."
                    />
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                                    <tr>
                                        <th className="px-5 py-3 font-semibold">Time</th>
                                        <th className="px-5 py-3 font-semibold">Actor</th>
                                        <th className="px-5 py-3 font-semibold">Action</th>
                                        <th className="px-5 py-3 font-semibold">Event</th>
                                        <th className="px-5 py-3 font-semibold">IP address</th>
                                        <th className="px-5 py-3 text-right font-semibold">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {response.data.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50/70">
                                            <td className="whitespace-nowrap px-5 py-4 text-xs text-gray-500">
                                                {formatDate(log.createdAt, true)}
                                            </td>
                                            <td className="px-5 py-4">
                                                <p className="font-medium text-slate-800">
                                                    {auditActorName(log)}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {auditActorEmail(log) ?? "Automated event"}
                                                </p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <StatusBadge status={log.action} />
                                            </td>
                                            <td className="max-w-lg px-5 py-4 text-gray-600">
                                                {log.description ?? log.eventType ?? log.action}
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4 font-mono text-xs text-gray-500">
                                                {log.ipAddress ?? "—"}
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => setSelected(log)}
                                                    className="rounded-lg p-2 text-gray-400 hover:bg-blue-50 hover:text-blue-800"
                                                    aria-label={`View event ${log.id}`}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <Pagination meta={response.meta} onPage={setPage} />
                    </>
                )}
            </Panel>
            <Modal
                open={Boolean(selected)}
                title={`Audit event #${selected?.id ?? ""}`}
                description={selected ? formatDate(selected.createdAt, true) : undefined}
                onClose={() => setSelected(null)}
            >
                {selected && (
                    <div className="space-y-5 text-sm">
                        <dl className="grid gap-4 rounded-xl bg-gray-50 p-4 sm:grid-cols-2">
                            <div>
                                <dt className="text-xs text-gray-500">Actor</dt>
                                <dd className="mt-1 font-medium text-slate-800">
                                    {auditActorName(selected)}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs text-gray-500">Action</dt>
                                <dd className="mt-1">
                                    <StatusBadge status={selected.action} />
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs text-gray-500">Subject</dt>
                                <dd className="mt-1 font-medium text-slate-800">
                                    {selected.documentTitle ??
                                        (selected.subjectType
                                            ? `${selected.subjectType}${selected.subjectId ? ` #${selected.subjectId}` : ""}`
                                            : "—")}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs text-gray-500">IP address</dt>
                                <dd className="mt-1 font-mono text-xs text-slate-800">
                                    {selected.ipAddress || "—"}
                                </dd>
                            </div>
                        </dl>
                        <div>
                            <h3 className="font-semibold text-slate-800">Description</h3>
                            <p className="mt-2 leading-6 text-gray-600">
                                {selected.description || selected.eventType || selected.action}
                            </p>
                        </div>
                        {(selected.metadata ?? selected.details) &&
                            Object.keys(selected.metadata ?? selected.details ?? {}).length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-slate-800">Recorded context</h3>
                                    <pre className="mt-2 overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs leading-5 text-slate-200">
                                        {JSON.stringify(selected.metadata ?? selected.details, null, 2)}
                                    </pre>
                                </div>
                            )}
                    </div>
                )}
            </Modal>
        </div>
    );
}

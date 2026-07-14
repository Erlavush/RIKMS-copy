import { useState } from "react";
import { CheckCircle2, Eye, Search, ShieldCheck, XCircle } from "lucide-react";

import { adminApi, errorMessage } from "../../lib/admin-api";
import type { AccessRequestRecord, Agency, Paginated } from "../../lib/admin-api";
import {
    EmptyState,
    ErrorState,
    LoadingState,
    Modal,
    PageHeader,
    Pagination,
    Panel,
    StatusBadge,
    Toast,
} from "./AdminUi";
import { formatDate, inputClass, primaryButton, secondaryButton } from "./admin-ui-utils";
import { useAdminResource, useDebouncedValue } from "./useAdminResource";

type Decision = "approve" | "reject";

function requesterName(request: AccessRequestRecord): string {
    return request.requesterName ?? request.requester?.name ?? "Unknown requester";
}

function requesterEmail(request: AccessRequestRecord): string {
    return request.requesterEmail ?? request.requester?.email ?? "—";
}

function documentTitle(request: AccessRequestRecord): string {
    return request.documentTitle ?? request.title ?? request.document?.title ?? "Unknown research record";
}

export function AccessMonitoring() {
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<AccessRequestRecord | null>(null);
    const [decision, setDecision] = useState<Decision | null>(null);
    const [reason, setReason] = useState("");
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);
    const debouncedSearch = useDebouncedValue(search);
    const {
        data: response,
        loading,
        error,
        reload,
    } = useAdminResource<Paginated<AccessRequestRecord>>("/access-requests", {
        search: debouncedSearch,
        status,
        page,
    });
    const { data: agenciesResponse } = useAdminResource<Paginated<Agency>>("/agencies", { per_page: 100 });
    const agencyName = (request: AccessRequestRecord) =>
        request.agencyName ??
        request.document?.agency?.name ??
        agenciesResponse?.data.find((agency) => agency.id === request.agencyId)?.name ??
        "—";

    const openDecision = (request: AccessRequestRecord, nextDecision: Decision) => {
        setSelected(request);
        setDecision(nextDecision);
        setReason("");
    };

    const submitDecision = async () => {
        if (!selected || !decision) return;
        if (decision === "reject" && reason.trim().length < 5) {
            setToast({ message: "Provide a rejection reason (at least 5 characters).", tone: "error" });
            return;
        }
        setSaving(true);
        try {
            await adminApi.post(
                `/access-requests/${selected.id}/${decision}`,
                reason.trim() ? { reason: reason.trim() } : {},
            );
            setToast({
                message: decision === "approve" ? "Access request approved." : "Access request rejected.",
                tone: "success",
            });
            setSelected(null);
            setDecision(null);
            setReason("");
            reload();
        } catch (requestError) {
            setToast({ message: errorMessage(requestError), tone: "error" });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="mx-auto max-w-[1376px] space-y-6">
            {toast && <Toast {...toast} onClose={() => setToast(null)} />}
            <PageHeader
                title="Access Request Monitoring"
                description="Monitor and resolve research access requests across all agencies."
            />
            <Panel>
                <div className="grid gap-3 border-b border-gray-100 p-5 sm:grid-cols-[1fr_220px]">
                    <label className="relative">
                        <span className="sr-only">Search requests</span>
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            value={search}
                            onChange={(event) => {
                                setSearch(event.target.value);
                                setPage(1);
                            }}
                            placeholder="Search requester or research title…"
                            className={`${inputClass} pl-10`}
                        />
                    </label>
                    <label>
                        <span className="sr-only">Request status</span>
                        <select
                            value={status}
                            onChange={(event) => {
                                setStatus(event.target.value);
                                setPage(1);
                            }}
                            className={inputClass}
                        >
                            <option value="">All statuses</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </label>
                </div>
                {loading && !response ? (
                    <LoadingState label="Loading access requests…" />
                ) : error && !response ? (
                    <ErrorState message={error} onRetry={reload} />
                ) : !response?.data.length ? (
                    <EmptyState
                        title="No access requests found"
                        description="New requests will appear here when users request restricted research."
                    />
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                                    <tr>
                                        <th className="px-5 py-3 font-semibold">Requester</th>
                                        <th className="px-5 py-3 font-semibold">Research</th>
                                        <th className="px-5 py-3 font-semibold">Agency</th>
                                        <th className="px-5 py-3 font-semibold">Status</th>
                                        <th className="px-5 py-3 font-semibold">Requested</th>
                                        <th className="px-5 py-3 text-right font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {response.data.map((request) => {
                                        const pending = request.status.toLowerCase() === "pending";
                                        return (
                                            <tr key={request.id} className="hover:bg-gray-50/70">
                                                <td className="px-5 py-4">
                                                    <p className="font-semibold text-slate-800">
                                                        {requesterName(request)}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {requesterEmail(request)}
                                                    </p>
                                                </td>
                                                <td className="max-w-md px-5 py-4">
                                                    <p className="line-clamp-2 font-medium text-gray-700">
                                                        {documentTitle(request)}
                                                    </p>
                                                </td>
                                                <td className="px-5 py-4 text-gray-600">
                                                    {agencyName(request)}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <StatusBadge status={request.status} />
                                                </td>
                                                <td className="whitespace-nowrap px-5 py-4 text-gray-500">
                                                    {formatDate(request.createdAt, true)}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSelected(request);
                                                                setDecision(null);
                                                            }}
                                                            className={secondaryButton}
                                                        >
                                                            <Eye className="h-4 w-4" /> Details
                                                        </button>
                                                        {pending && (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        openDecision(request, "approve")
                                                                    }
                                                                    className="rounded-lg p-2 text-green-700 hover:bg-green-50"
                                                                    aria-label={`Approve request from ${requesterName(request)}`}
                                                                >
                                                                    <CheckCircle2 className="h-5 w-5" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        openDecision(request, "reject")
                                                                    }
                                                                    className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                                                                    aria-label={`Reject request from ${requesterName(request)}`}
                                                                >
                                                                    <XCircle className="h-5 w-5" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <Pagination meta={response.meta} onPage={setPage} />
                    </>
                )}
            </Panel>

            <Modal
                open={Boolean(selected)}
                title="Access request"
                description={selected ? `${requesterName(selected)} · Request #${selected.id}` : undefined}
                onClose={() => {
                    if (!saving) {
                        setSelected(null);
                        setDecision(null);
                        setReason("");
                    }
                }}
                size="max-w-2xl"
                footer={
                    selected?.status.toLowerCase() === "pending" && !decision ? (
                        <>
                            <button
                                type="button"
                                onClick={() => setDecision("reject")}
                                className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50"
                            >
                                <XCircle className="h-4 w-4" /> Reject
                            </button>
                            <button
                                type="button"
                                onClick={() => setDecision("approve")}
                                className={primaryButton}
                            >
                                <ShieldCheck className="h-4 w-4" /> Approve access
                            </button>
                        </>
                    ) : decision ? (
                        <>
                            <button
                                type="button"
                                className={secondaryButton}
                                onClick={() => {
                                    setDecision(null);
                                    setReason("");
                                }}
                                disabled={saving}
                            >
                                Back
                            </button>
                            <button
                                type="button"
                                className={
                                    decision === "reject"
                                        ? "rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                                        : primaryButton
                                }
                                onClick={() => void submitDecision()}
                                disabled={saving}
                            >
                                {saving
                                    ? "Saving…"
                                    : decision === "approve"
                                      ? "Confirm approval"
                                      : "Confirm rejection"}
                            </button>
                        </>
                    ) : undefined
                }
            >
                {selected && (
                    <div className="space-y-5 text-sm">
                        {decision ? (
                            <div>
                                <p
                                    className={`rounded-xl border p-4 ${decision === "approve" ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-800"}`}
                                >
                                    {decision === "approve"
                                        ? "Approval grants access according to the platform's server-side access policy."
                                        : "The requester will not be granted access. Provide a clear reason."}
                                </p>
                                <div className="mt-4">
                                    <label
                                        htmlFor="access-decision-reason"
                                        className="mb-1.5 block font-semibold text-slate-800"
                                    >
                                        {decision === "approve"
                                            ? "Decision note (optional)"
                                            : "Rejection reason"}
                                    </label>
                                    <textarea
                                        id="access-decision-reason"
                                        rows={4}
                                        value={reason}
                                        onChange={(event) => setReason(event.target.value)}
                                        className={inputClass}
                                    />
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between gap-3">
                                    <StatusBadge status={selected.status} />
                                    <span className="text-xs text-gray-400">
                                        {formatDate(selected.createdAt, true)}
                                    </span>
                                </div>
                                <dl className="grid gap-4 rounded-xl bg-gray-50 p-4 sm:grid-cols-2">
                                    <div>
                                        <dt className="text-xs text-gray-500">Requester</dt>
                                        <dd className="mt-1 font-medium text-slate-800">
                                            {requesterName(selected)}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs text-gray-500">Email</dt>
                                        <dd className="mt-1 break-all font-medium text-slate-800">
                                            {requesterEmail(selected)}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs text-gray-500">Organization</dt>
                                        <dd className="mt-1 font-medium text-slate-800">
                                            {selected.requesterOrganization || "—"}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs text-gray-500">Agency holding record</dt>
                                        <dd className="mt-1 font-medium text-slate-800">
                                            {agencyName(selected)}
                                        </dd>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <dt className="text-xs text-gray-500">Research</dt>
                                        <dd className="mt-1 font-medium text-slate-800">
                                            {documentTitle(selected)}
                                        </dd>
                                    </div>
                                </dl>
                                <div>
                                    <h3 className="font-semibold text-slate-800">Purpose</h3>
                                    <p className="mt-2 whitespace-pre-wrap leading-6 text-gray-600">
                                        {selected.purpose ||
                                            selected.reason ||
                                            selected.message ||
                                            "No purpose was provided."}
                                    </p>
                                </div>
                                {selected.decisionReason && (
                                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                        <h3 className="font-semibold text-slate-800">Decision note</h3>
                                        <p className="mt-1 whitespace-pre-wrap text-gray-600">
                                            {selected.decisionReason}
                                        </p>
                                        <p className="mt-2 text-xs text-gray-400">
                                            {selected.decidedBy || "Administrator"} ·{" "}
                                            {formatDate(selected.decidedAt, true)}
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}

import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Check, ExternalLink, Mail, Search, X } from "lucide-react";
import { toast } from "sonner";
import { useApi } from "../../hooks/useApi";
import { useAgencyContext } from "../../hooks/useAgencyContext";
import { useDialogFocus } from "../../hooks/useDialogFocus";
import {
    apiPost,
    firstValidationError,
    type AccessRequestRecord,
    type Paginated,
    queryString,
} from "../../lib/api";
import { formatDateTime } from "../../lib/format";
import { hasPermission } from "../../lib/permissions";
import { EmptyState, ErrorState, LoadingState } from "../shared/AsyncState";
import { StatusBadge } from "../shared/StatusBadge";

const STATUSES = ["all", "pending", "approved", "rejected"] as const;

export function AccessRequests() {
    const { user } = useAgencyContext();
    const [params, setParams] = useSearchParams();
    const [search, setSearch] = useState(params.get("search") ?? "");
    const [busyId, setBusyId] = useState<number | null>(null);
    const [rejecting, setRejecting] = useState<AccessRequestRecord | null>(null);
    const [reason, setReason] = useState("");
    const [rejectionDialogRef, rejectionInitialFocusRef] = useDialogFocus<
        HTMLFormElement,
        HTMLTextAreaElement
    >(Boolean(rejecting), () => {
        if (busyId === null) setRejecting(null);
    });
    const status = params.get("status") ?? "all";
    const page = Math.max(1, Number(params.get("page") ?? 1));
    const query = params.get("search") ?? "";
    const requests = useApi<Paginated<AccessRequestRecord>>(
        `/api/rikms/agency/access-requests${queryString({ status: status === "all" ? null : status, search: query, page })}`,
    );
    const canEditDocuments = hasPermission(user, "documents.view") && hasPermission(user, "documents.update");

    useEffect(() => setSearch(query), [query]);

    function updateParams(updates: Record<string, string | null>) {
        const next = new URLSearchParams(params);
        for (const [key, value] of Object.entries(updates)) {
            if (value && value !== "all") next.set(key, value);
            else next.delete(key);
        }
        setParams(next);
    }

    async function approve(request: AccessRequestRecord) {
        if (
            !window.confirm(
                `Approve access for ${request.requesterName}? An expiring download grant will be created.`,
            )
        )
            return;
        setBusyId(request.id);
        try {
            await apiPost(`/api/rikms/agency/access-requests/${request.id}/approve`);
            toast.success("Access request approved and recorded.");
            await requests.refresh();
        } catch (error) {
            toast.error(firstValidationError(error));
        } finally {
            setBusyId(null);
        }
    }

    async function reject(event: React.FormEvent) {
        event.preventDefault();
        if (!rejecting) return;
        setBusyId(rejecting.id);
        try {
            await apiPost(`/api/rikms/agency/access-requests/${rejecting.id}/reject`, { reason });
            toast.success("Access request rejected.");
            setRejecting(null);
            setReason("");
            await requests.refresh();
        } catch (error) {
            toast.error(firstValidationError(error));
        } finally {
            setBusyId(null);
        }
    }

    const result = requests.data;

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold text-[#1E3A8A]">Access Requests</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Review public requests for protected research files. Every decision is recorded.
                </p>
            </header>

            <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <form
                    className="flex flex-col gap-3 sm:flex-row"
                    onSubmit={(event) => {
                        event.preventDefault();
                        updateParams({ search: search.trim() || null, page: null });
                    }}
                >
                    <label className="relative flex-1">
                        <span className="sr-only">Search access requests</span>
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search requester, email, or research title…"
                            className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                    </label>
                    <button
                        type="submit"
                        className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white"
                    >
                        Search
                    </button>
                </form>
                <div className="mt-4 flex flex-wrap gap-2">
                    {STATUSES.map((filter) => (
                        <button
                            key={filter}
                            type="button"
                            aria-pressed={status === filter}
                            onClick={() => updateParams({ status: filter, page: null })}
                            className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize ${status === filter ? "border-[#1E3A8A] bg-blue-50 text-[#1E3A8A]" : "border-gray-200 text-gray-600"}`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </section>

            {requests.loading && <LoadingState label="Loading access requests…" />}
            {requests.error && (
                <ErrorState message={requests.error} onRetry={() => void requests.refresh()} />
            )}
            {!requests.loading &&
                !requests.error &&
                result &&
                (result.data.length === 0 ? (
                    <EmptyState
                        title="No matching access requests"
                        description="New public requests will appear here."
                    />
                ) : (
                    <div className="space-y-3">
                        {result.data.map((request) => (
                            <article
                                key={request.id}
                                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                            >
                                <div className="flex flex-col justify-between gap-4 lg:flex-row">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="font-semibold text-gray-900">
                                                {request.requesterName}
                                            </h2>
                                            <StatusBadge status={request.status} />
                                        </div>
                                        <a
                                            href={`mailto:${request.requesterEmail}`}
                                            className="mt-1 inline-flex items-center gap-1 text-xs text-[#1E3A8A] hover:underline"
                                        >
                                            <Mail className="h-3 w-3" />
                                            {request.requesterEmail}
                                        </a>
                                        {request.requesterOrganization && (
                                            <p className="mt-1 text-xs text-gray-500">
                                                {request.requesterOrganization}
                                            </p>
                                        )}
                                        <p className="mt-4 text-xs font-medium uppercase tracking-wide text-gray-400">
                                            Requested research
                                        </p>
                                        {canEditDocuments ? (
                                            <Link
                                                to={`/agency/research/${request.documentId}/access-control`}
                                                className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-[#1E3A8A] hover:underline"
                                            >
                                                {request.title}
                                                <ExternalLink className="h-3 w-3" />
                                            </Link>
                                        ) : (
                                            <p className="mt-1 text-sm font-medium text-gray-800">
                                                {request.title}
                                            </p>
                                        )}
                                        <blockquote className="mt-3 rounded-lg border-l-4 border-gray-200 bg-gray-50 px-4 py-3 text-sm leading-relaxed text-gray-600">
                                            {request.message || "No message supplied."}
                                        </blockquote>
                                        {request.decisionReason && (
                                            <p
                                                className={`mt-3 rounded-lg p-3 text-xs ${request.status === "rejected" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}
                                            >
                                                <strong>Decision note:</strong> {request.decisionReason}
                                            </p>
                                        )}
                                        <p className="mt-3 text-xs text-gray-400">
                                            Submitted {formatDateTime(request.createdAt)}
                                            {request.decidedAt
                                                ? ` · Decided ${formatDateTime(request.decidedAt)}`
                                                : ""}
                                        </p>
                                    </div>
                                    {request.status === "pending" && (
                                        <div className="flex shrink-0 gap-2 lg:flex-col">
                                            <button
                                                type="button"
                                                disabled={busyId === request.id}
                                                onClick={() => void approve(request)}
                                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                                            >
                                                <Check className="h-4 w-4" />
                                                Approve
                                            </button>
                                            <button
                                                type="button"
                                                disabled={busyId === request.id}
                                                onClick={() => {
                                                    setRejecting(request);
                                                    setReason("");
                                                }}
                                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                                            >
                                                <X className="h-4 w-4" />
                                                Reject
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                ))}

            {result && result.meta.lastPage > 1 && (
                <nav className="flex items-center justify-center gap-3" aria-label="Access request pages">
                    <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() => updateParams({ page: String(page - 1) })}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm disabled:opacity-40"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-gray-500">
                        Page {result.meta.currentPage} of {result.meta.lastPage}
                    </span>
                    <button
                        type="button"
                        disabled={page >= result.meta.lastPage}
                        onClick={() => updateParams({ page: String(page + 1) })}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm disabled:opacity-40"
                    >
                        Next
                    </button>
                </nav>
            )}

            {rejecting && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
                    <form
                        ref={rejectionDialogRef}
                        onSubmit={reject}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="reject-title"
                        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
                    >
                        <h2 id="reject-title" className="text-lg font-bold text-[#1E3A8A]">
                            Reject access request
                        </h2>
                        <p className="mt-2 text-sm text-gray-500">
                            Give {rejecting.requesterName} a clear reason. This reason is saved with the audit
                            trail.
                        </p>
                        <label className="mt-5 block">
                            <span className="mb-1.5 block text-sm font-medium text-gray-700">Reason</span>
                            <textarea
                                ref={rejectionInitialFocusRef}
                                required
                                minLength={5}
                                rows={4}
                                value={reason}
                                onChange={(event) => setReason(event.target.value)}
                                className="w-full rounded-lg border border-gray-200 p-3 text-sm focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-blue-100"
                            />
                        </label>
                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setRejecting(null)}
                                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={busyId === rejecting.id}
                                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                            >
                                {busyId === rejecting.id ? "Rejecting…" : "Reject request"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Archive, Download, Eye, History, LockKeyhole, Pencil, Plus, Search, Send } from "lucide-react";
import { toast } from "sonner";
import { useApi } from "../../hooks/useApi";
import { useAgencyContext } from "../../hooks/useAgencyContext";
import {
    apiDelete,
    apiPost,
    firstValidationError,
    type Paginated,
    type ResearchDocument,
    queryString,
} from "../../lib/api";
import { formatBytes, formatDate, formatDocumentType } from "../../lib/format";
import { hasPermission } from "../../lib/permissions";
import { EmptyState, ErrorState, LoadingState } from "../shared/AsyncState";
import { StatusBadge } from "../shared/StatusBadge";

const FILTERS = ["all", "draft", "pending", "published", "rejected"] as const;

export function ResearchRepository() {
    const { user } = useAgencyContext();
    const [searchParams, setSearchParams] = useSearchParams();
    const [search, setSearch] = useState(searchParams.get("search") ?? "");
    const [busyId, setBusyId] = useState<number | null>(null);
    const status = searchParams.get("status") ?? "all";
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const query = searchParams.get("search") ?? "";
    const url = `/api/rikms/agency/documents${queryString({ status: status === "all" ? null : status, search: query, page })}`;
    const documents = useApi<Paginated<ResearchDocument>>(url);
    const canCreate = hasPermission(user, "documents.create");
    const canUpdate = hasPermission(user, "documents.update");
    const canSubmit = hasPermission(user, "documents.submit");
    const canArchive = hasPermission(user, "documents.archive");

    useEffect(() => {
        setSearch(query);
    }, [query]);

    function updateParams(updates: Record<string, string | null>) {
        const next = new URLSearchParams(searchParams);
        for (const [key, value] of Object.entries(updates)) {
            if (value && value !== "all") next.set(key, value);
            else next.delete(key);
        }
        setSearchParams(next);
    }

    function submitSearch(event: React.FormEvent) {
        event.preventDefault();
        updateParams({ search: search.trim() || null, page: null });
    }

    async function submitDocument(document: ResearchDocument) {
        if (
            !window.confirm(
                `Submit “${document.title}” for review? You can no longer edit it while it is pending.`,
            )
        )
            return;
        setBusyId(document.id);
        try {
            await apiPost(`/api/rikms/agency/documents/${document.id}/submit`);
            toast.success("Research submitted for review.");
            await documents.refresh();
        } catch (error) {
            toast.error(firstValidationError(error));
        } finally {
            setBusyId(null);
        }
    }

    async function archiveDocument(document: ResearchDocument) {
        if (!window.confirm(`Archive “${document.title}”? It will be removed from active repository views.`))
            return;
        setBusyId(document.id);
        try {
            await apiDelete(`/api/rikms/agency/documents/${document.id}`);
            toast.success("Research record archived.");
            await documents.refresh();
        } catch (error) {
            toast.error(firstValidationError(error));
        } finally {
            setBusyId(null);
        }
    }

    function download(document: ResearchDocument) {
        window.location.assign(`/api/rikms/agency/documents/${document.id}/download`);
    }

    const result = documents.data;

    return (
        <div className="space-y-6">
            <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                    <h1 className="text-2xl font-bold text-[#1E3A8A]">Research Repository</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage drafts, submissions, publications, and access policies.
                    </p>
                </div>
                {canCreate && (
                    <Link
                        to="/agency/upload"
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1E3A8A] px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-900"
                    >
                        <Plus className="h-4 w-4" />
                        Upload research
                    </Link>
                )}
            </header>

            <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <form onSubmit={submitSearch} className="flex flex-col gap-3 sm:flex-row">
                    <label className="relative flex-1">
                        <span className="sr-only">Search repository</span>
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search title, author, category, or keyword…"
                            className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                    </label>
                    <button
                        type="submit"
                        className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
                    >
                        Search
                    </button>
                </form>
                <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter by status">
                    {FILTERS.map((filter) => (
                        <button
                            key={filter}
                            type="button"
                            onClick={() => updateParams({ status: filter, page: null })}
                            aria-pressed={
                                status === filter || (filter === "all" && !searchParams.has("status"))
                            }
                            className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize ${status === filter || (filter === "all" && !searchParams.has("status")) ? "border-[#1E3A8A] bg-blue-50 text-[#1E3A8A]" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </section>

            {documents.loading && <LoadingState label="Loading repository…" />}
            {documents.error && (
                <ErrorState message={documents.error} onRetry={() => void documents.refresh()} />
            )}
            {!documents.loading &&
                !documents.error &&
                result &&
                (result.data.length === 0 ? (
                    <EmptyState
                        title="No matching research records"
                        description={
                            query || status !== "all"
                                ? "Try changing your search or status filter."
                                : "Upload a record to begin building your agency repository."
                        }
                    />
                ) : (
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[920px] text-left text-sm">
                                <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                                    <tr>
                                        <th className="px-5 py-3 font-semibold">Research</th>
                                        <th className="px-4 py-3 font-semibold">Type / year</th>
                                        <th className="px-4 py-3 font-semibold">Status</th>
                                        <th className="px-4 py-3 font-semibold">File</th>
                                        <th className="px-4 py-3 font-semibold">Updated</th>
                                        <th className="px-5 py-3 text-right font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {result.data.map((document) => (
                                        <tr key={document.id} className="align-top hover:bg-gray-50/70">
                                            <td className="max-w-lg px-5 py-4">
                                                <p className="font-medium text-gray-900">{document.title}</p>
                                                <p className="mt-1 line-clamp-1 text-xs text-gray-500">
                                                    {document.authors.join(", ") || "No authors yet"}
                                                </p>
                                                <p className="mt-1 text-xs text-gray-400">
                                                    {document.category}
                                                </p>
                                            </td>
                                            <td className="px-4 py-4">
                                                <p className="text-gray-700">
                                                    {formatDocumentType(document.documentType)}
                                                </p>
                                                <p className="mt-1 text-xs text-gray-500">
                                                    {document.year}
                                                    {document.quarter ? ` · ${document.quarter}` : ""}
                                                </p>
                                            </td>
                                            <td className="px-4 py-4">
                                                <StatusBadge status={document.status} />
                                                {document.isAiTagged && (
                                                    <p className="mt-2 text-[11px] text-purple-600">
                                                        AI-assisted metadata
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                <p className="text-gray-700">
                                                    {document.fileSize
                                                        ? (document.fileType ?? "Document")
                                                        : "No file attached"}
                                                </p>
                                                {document.fileSize && (
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        {formatBytes(document.fileSize)}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-gray-600">
                                                {formatDate(document.updatedAt)}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex justify-end gap-1">
                                                    {document.status === "published" && (
                                                        <Link
                                                            to={`/research/${document.id}`}
                                                            className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-[#1E3A8A]"
                                                            aria-label={`View ${document.title}`}
                                                            title="View public record"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Link>
                                                    )}
                                                    {canUpdate &&
                                                        (document.status === "draft" ||
                                                            document.status === "rejected") && (
                                                            <Link
                                                                to={`/agency/research/${document.id}/edit`}
                                                                className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-[#1E3A8A]"
                                                                aria-label={`Edit ${document.title}`}
                                                                title="Edit metadata"
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Link>
                                                        )}
                                                    {canUpdate && document.status === "published" && (
                                                        <Link
                                                            to={`/agency/research/${document.id}/edit`}
                                                            className="rounded-md p-2 text-amber-700 hover:bg-amber-50"
                                                            aria-label={`Create a revision of ${document.title}`}
                                                            title="Create revision"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Link>
                                                    )}
                                                    {canUpdate && (
                                                        <Link
                                                            to={`/agency/research/${document.id}/access-control`}
                                                            className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-[#1E3A8A]"
                                                            aria-label={`Manage access for ${document.title}`}
                                                            title="Access control"
                                                        >
                                                            <LockKeyhole className="h-4 w-4" />
                                                        </Link>
                                                    )}
                                                    <Link
                                                        to={`/agency/research/${document.id}/versions`}
                                                        className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-[#1E3A8A]"
                                                        aria-label={`View version history for ${document.title}`}
                                                        title="Version history"
                                                    >
                                                        <History className="h-4 w-4" />
                                                    </Link>
                                                    {document.canDownload && (
                                                        <button
                                                            type="button"
                                                            onClick={() => download(document)}
                                                            className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-[#1E3A8A]"
                                                            aria-label={`Download ${document.title}`}
                                                            title="Download"
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                    {canSubmit &&
                                                        (document.status === "draft" ||
                                                            document.status === "rejected") && (
                                                            <button
                                                                type="button"
                                                                disabled={busyId === document.id}
                                                                onClick={() => void submitDocument(document)}
                                                                className="rounded-md p-2 text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                                                                aria-label={`Submit ${document.title} for review`}
                                                                title="Submit for review"
                                                            >
                                                                <Send className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                    {canArchive && document.status !== "archived" && (
                                                        <button
                                                            type="button"
                                                            disabled={busyId === document.id}
                                                            onClick={() => void archiveDocument(document)}
                                                            className="rounded-md p-2 text-red-500 hover:bg-red-50 disabled:opacity-50"
                                                            aria-label={`Archive ${document.title}`}
                                                            title="Archive"
                                                        >
                                                            <Archive className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <footer className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 px-5 py-4 text-sm text-gray-500 sm:flex-row">
                            <span>
                                Showing {result.data.length} of {result.meta.total} records
                            </span>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    disabled={page <= 1}
                                    onClick={() => updateParams({ page: String(page - 1) })}
                                    className="rounded-lg border border-gray-200 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Previous
                                </button>
                                <span className="px-2 py-1.5">
                                    Page {result.meta.currentPage} of {Math.max(1, result.meta.lastPage)}
                                </span>
                                <button
                                    type="button"
                                    disabled={page >= result.meta.lastPage}
                                    onClick={() => updateParams({ page: String(page + 1) })}
                                    className="rounded-lg border border-gray-200 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Next
                                </button>
                            </div>
                        </footer>
                    </div>
                ))}
        </div>
    );
}

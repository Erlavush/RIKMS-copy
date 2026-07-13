import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { ArchiveRestore, History, Search } from "lucide-react";
import { toast } from "sonner";
import { useApi } from "../../hooks/useApi";
import { useAgencyContext } from "../../hooks/useAgencyContext";
import {
    apiPost,
    firstValidationError,
    type Paginated,
    type ResearchDocument,
    queryString,
} from "../../lib/api";
import { formatDate, formatDocumentType } from "../../lib/format";
import { hasPermission } from "../../lib/permissions";
import { EmptyState, ErrorState, LoadingState } from "../shared/AsyncState";

export function ArchiveManagement() {
    const { user } = useAgencyContext();
    const [params, setParams] = useSearchParams();
    const [search, setSearch] = useState(params.get("search") ?? "");
    const [busyId, setBusyId] = useState<number | null>(null);
    const page = Math.max(1, Number(params.get("page") ?? 1));
    const query = params.get("search") ?? "";
    const archive = useApi<Paginated<ResearchDocument>>(
        `/api/rikms/agency/archive${queryString({ search: query, page })}`,
    );
    const canRestore = hasPermission(user, "documents.archive");

    useEffect(() => setSearch(query), [query]);

    function updateParams(searchValue: string | null, pageValue?: number) {
        const next = new URLSearchParams();
        if (searchValue) next.set("search", searchValue);
        if (pageValue && pageValue > 1) next.set("page", String(pageValue));
        setParams(next);
    }

    async function restore(document: ResearchDocument) {
        if (!window.confirm(`Restore “${document.title}” as a draft?`)) return;
        setBusyId(document.id);
        try {
            await apiPost(`/api/rikms/agency/documents/${document.id}/restore`);
            toast.success("Research restored to the active repository as a draft.");
            await archive.refresh();
        } catch (error) {
            toast.error(firstValidationError(error));
        } finally {
            setBusyId(null);
        }
    }

    const result = archive.data;

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold text-[#1E3A8A]">Archive</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Review archived records and restore them safely as drafts.
                </p>
            </header>
            <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        updateParams(search.trim() || null);
                    }}
                    className="flex gap-3"
                >
                    <label className="relative flex-1">
                        <span className="sr-only">Search archive</span>
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search archived research…"
                            className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                    </label>
                    <button className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white">
                        Search
                    </button>
                </form>
            </section>
            {archive.loading && <LoadingState label="Loading archive…" />}
            {archive.error && <ErrorState message={archive.error} onRetry={() => void archive.refresh()} />}
            {!archive.loading &&
                !archive.error &&
                result &&
                (result.data.length === 0 ? (
                    <EmptyState
                        title="Archive is empty"
                        description={
                            query
                                ? "No archived record matches your search."
                                : "Archived research records will appear here."
                        }
                    />
                ) : (
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        <ul className="divide-y divide-gray-100">
                            {result.data.map((document) => (
                                <li
                                    key={document.id}
                                    className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center"
                                >
                                    <div className="min-w-0">
                                        <h2 className="font-medium text-gray-900">{document.title}</h2>
                                        <p className="mt-1 text-xs text-gray-500">
                                            {formatDocumentType(document.documentType)} · {document.year} ·
                                            Archived {formatDate(document.updatedAt)}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Link
                                            to={`/agency/research/${document.id}/versions`}
                                            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                                        >
                                            <History className="h-4 w-4" />
                                            History
                                        </Link>
                                        {canRestore && (
                                            <button
                                                type="button"
                                                disabled={busyId === document.id}
                                                onClick={() => void restore(document)}
                                                className="inline-flex items-center gap-2 rounded-lg bg-[#1E3A8A] px-3 py-2 text-sm font-medium text-white hover:bg-blue-900 disabled:opacity-50"
                                            >
                                                <ArchiveRestore className="h-4 w-4" />
                                                {busyId === document.id ? "Restoring…" : "Restore"}
                                            </button>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                        {result.meta.lastPage > 1 && (
                            <nav className="flex items-center justify-center gap-3 border-t border-gray-100 p-4">
                                <button
                                    disabled={page <= 1}
                                    onClick={() => updateParams(query || null, page - 1)}
                                    className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40"
                                >
                                    Previous
                                </button>
                                <span className="text-sm text-gray-500">
                                    Page {result.meta.currentPage} of {result.meta.lastPage}
                                </span>
                                <button
                                    disabled={page >= result.meta.lastPage}
                                    onClick={() => updateParams(query || null, page + 1)}
                                    className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40"
                                >
                                    Next
                                </button>
                            </nav>
                        )}
                    </div>
                ))}
        </div>
    );
}

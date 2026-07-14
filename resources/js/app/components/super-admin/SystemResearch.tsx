import { useState } from "react";
import { Archive, Eye, Search } from "lucide-react";

import { adminApi, documentAgencyName, errorMessage } from "../../lib/admin-api";
import type { AdminDocument, Agency, Paginated } from "../../lib/admin-api";
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

export function SystemResearch() {
    const initialSearch = new URLSearchParams(window.location.search).get("search") ?? "";
    const initialStatus = new URLSearchParams(window.location.search).get("status") ?? "";
    const [search, setSearch] = useState(initialSearch);
    const [status, setStatus] = useState(initialStatus);
    const [agencyId, setAgencyId] = useState("");
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<AdminDocument | null>(null);
    const [archiveTarget, setArchiveTarget] = useState<AdminDocument | null>(null);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);
    const debouncedSearch = useDebouncedValue(search);

    const {
        data: response,
        loading,
        error,
        reload,
    } = useAdminResource<Paginated<AdminDocument>>("/documents", {
        search: debouncedSearch,
        status,
        agency_id: agencyId,
        page,
    });
    const { data: agenciesResponse } = useAdminResource<Paginated<Agency>>("/agencies", { per_page: 100 });

    const archiveDocument = async () => {
        if (!archiveTarget) return;
        setSaving(true);
        try {
            await adminApi.post(`/documents/${archiveTarget.id}/archive`);
            setToast({ message: `“${archiveTarget.title}” was archived.`, tone: "success" });
            setArchiveTarget(null);
            reload();
        } catch (reason) {
            setToast({ message: errorMessage(reason), tone: "error" });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="mx-auto max-w-[1376px] space-y-6">
            {toast && <Toast {...toast} onClose={() => setToast(null)} />}
            <PageHeader
                title="System Research"
                description="Search and inspect research records across every participating agency."
            />
            <Panel>
                <div className="grid gap-3 border-b border-gray-100 p-5 md:grid-cols-[1fr_220px_240px]">
                    <label className="relative">
                        <span className="sr-only">Search research</span>
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            value={search}
                            onChange={(event) => {
                                setSearch(event.target.value);
                                setPage(1);
                            }}
                            placeholder="Search title, author, or keyword…"
                            className={`${inputClass} pl-10`}
                        />
                    </label>
                    <label>
                        <span className="sr-only">Filter by status</span>
                        <select
                            value={status}
                            onChange={(event) => {
                                setStatus(event.target.value);
                                setPage(1);
                            }}
                            className={inputClass}
                        >
                            <option value="">All statuses</option>
                            <option value="draft">Draft</option>
                            <option value="pending">Pending review</option>
                            <option value="published">Published</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </label>
                    <label>
                        <span className="sr-only">Filter by agency</span>
                        <select
                            value={agencyId}
                            onChange={(event) => {
                                setAgencyId(event.target.value);
                                setPage(1);
                            }}
                            className={inputClass}
                        >
                            <option value="">All agencies</option>
                            {agenciesResponse?.data.map((agency) => (
                                <option key={agency.id} value={agency.id}>
                                    {agency.abbreviation || agency.name}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

                {loading && !response ? (
                    <LoadingState label="Loading research records…" />
                ) : error && !response ? (
                    <ErrorState message={error} onRetry={reload} />
                ) : !response?.data.length ? (
                    <EmptyState title="No research found" description="Try changing the search or filters." />
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                                    <tr>
                                        <th className="px-5 py-3 font-semibold">Research</th>
                                        <th className="px-5 py-3 font-semibold">Agency</th>
                                        <th className="px-5 py-3 font-semibold">Status</th>
                                        <th className="px-5 py-3 font-semibold">Added</th>
                                        <th className="px-5 py-3 text-right font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {response.data.map((document) => (
                                        <tr key={document.id} className="hover:bg-gray-50/70">
                                            <td className="max-w-xl px-5 py-4">
                                                <p className="font-semibold text-slate-800">
                                                    {document.title}
                                                </p>
                                                <p className="mt-1 text-xs text-gray-500">
                                                    {document.category || "Uncategorized"}
                                                    {document.year ? ` · ${document.year}` : ""}
                                                </p>
                                            </td>
                                            <td className="px-5 py-4 text-gray-600">
                                                {documentAgencyName(document)}
                                            </td>
                                            <td className="px-5 py-4">
                                                <StatusBadge status={document.status} />
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4 text-gray-500">
                                                {formatDate(document.createdAt)}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelected(document)}
                                                        className={secondaryButton}
                                                    >
                                                        <Eye className="h-4 w-4" /> View
                                                    </button>
                                                    {document.status !== "archived" && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setArchiveTarget(document)}
                                                            className="rounded-lg p-2 text-gray-400 hover:bg-purple-50 hover:text-purple-700"
                                                            aria-label={`Archive ${document.title}`}
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
                        <Pagination meta={response.meta} onPage={setPage} />
                    </>
                )}
            </Panel>

            <Modal
                open={Boolean(selected)}
                title={selected?.title ?? "Research details"}
                description={
                    selected ? `${documentAgencyName(selected)} · Record #${selected.id}` : undefined
                }
                onClose={() => setSelected(null)}
            >
                {selected && (
                    <div className="space-y-5 text-sm">
                        <div className="flex flex-wrap gap-2">
                            <StatusBadge status={selected.status} />
                            {selected.accessMode && <StatusBadge status={selected.accessMode} />}
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-800">Abstract</h3>
                            <p className="mt-2 whitespace-pre-wrap leading-6 text-gray-600">
                                {selected.abstract || "No abstract was provided."}
                            </p>
                        </div>
                        <dl className="grid grid-cols-2 gap-4 rounded-xl bg-gray-50 p-4">
                            <div>
                                <dt className="text-xs text-gray-500">Category</dt>
                                <dd className="mt-1 font-medium text-gray-800">{selected.category || "—"}</dd>
                            </div>
                            <div>
                                <dt className="text-xs text-gray-500">Publication year</dt>
                                <dd className="mt-1 font-medium text-gray-800">{selected.year || "—"}</dd>
                            </div>
                            <div>
                                <dt className="text-xs text-gray-500">Created</dt>
                                <dd className="mt-1 font-medium text-gray-800">
                                    {formatDate(selected.createdAt)}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs text-gray-500">Downloads</dt>
                                <dd className="mt-1 font-medium text-gray-800">
                                    {Number(
                                        selected.downloads ?? selected.downloadCount ?? 0,
                                    ).toLocaleString()}
                                </dd>
                            </div>
                        </dl>
                    </div>
                )}
            </Modal>

            <Modal
                open={Boolean(archiveTarget)}
                title="Archive research record?"
                description="The record will leave active listings and can be restored from the archive."
                onClose={() => setArchiveTarget(null)}
                footer={
                    <>
                        <button
                            type="button"
                            className={secondaryButton}
                            onClick={() => setArchiveTarget(null)}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className={primaryButton}
                            disabled={saving}
                            onClick={() => void archiveDocument()}
                        >
                            <Archive className="h-4 w-4" /> {saving ? "Archiving…" : "Archive record"}
                        </button>
                    </>
                }
            >
                <p className="text-sm text-gray-600">{archiveTarget?.title}</p>
            </Modal>
        </div>
    );
}

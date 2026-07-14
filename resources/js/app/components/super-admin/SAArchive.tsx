import { useState } from "react";
import { Archive, RotateCcw, Search } from "lucide-react";

import { adminApi, documentAgencyName, errorMessage } from "../../lib/admin-api";
import type { AdminDocument, Paginated } from "../../lib/admin-api";
import { EmptyState, ErrorState, LoadingState, Modal, PageHeader, Pagination, Panel, Toast } from "./AdminUi";
import { formatDate, inputClass, primaryButton, secondaryButton } from "./admin-ui-utils";
import { useAdminResource, useDebouncedValue } from "./useAdminResource";

interface ArchiveItem extends AdminDocument {
    archivedAt?: string | null;
    deletedAt?: string | null;
}

export function SAArchive() {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [restoreTarget, setRestoreTarget] = useState<ArchiveItem | null>(null);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);
    const debouncedSearch = useDebouncedValue(search);
    const {
        data: response,
        loading,
        error,
        reload,
    } = useAdminResource<Paginated<ArchiveItem>>("/archive", { search: debouncedSearch, page });

    const restore = async () => {
        if (!restoreTarget) return;
        setSaving(true);
        try {
            await adminApi.post(`/documents/${restoreTarget.id}/restore`);
            setToast({ message: `“${restoreTarget.title}” was restored.`, tone: "success" });
            setRestoreTarget(null);
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
                title="Research Archive"
                description="Review archived research and restore records when needed."
            />
            <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 text-sm text-purple-800">
                <div className="flex gap-3">
                    <Archive className="h-5 w-5 shrink-0" />
                    <p>
                        Archived research is removed from active listings without destroying its history.
                        Permanent deletion is intentionally unavailable from this console.
                    </p>
                </div>
            </div>
            <Panel>
                <div className="border-b border-gray-100 p-5">
                    <label className="relative block max-w-xl">
                        <span className="sr-only">Search archive</span>
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            value={search}
                            onChange={(event) => {
                                setSearch(event.target.value);
                                setPage(1);
                            }}
                            className={`${inputClass} pl-10`}
                            placeholder="Search archived research…"
                        />
                    </label>
                </div>
                {loading && !response ? (
                    <LoadingState label="Loading archive…" />
                ) : error && !response ? (
                    <ErrorState message={error} onRetry={reload} />
                ) : !response?.data.length ? (
                    <EmptyState
                        title="Archive is empty"
                        description="Archived research records will appear here."
                    />
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                                    <tr>
                                        <th className="px-5 py-3 font-semibold">Research</th>
                                        <th className="px-5 py-3 font-semibold">Agency</th>
                                        <th className="px-5 py-3 font-semibold">Archived</th>
                                        <th className="px-5 py-3 text-right font-semibold">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {response.data.map((document) => (
                                        <tr key={document.id} className="hover:bg-gray-50/70">
                                            <td className="max-w-2xl px-5 py-4">
                                                <p className="font-semibold text-slate-800">
                                                    {document.title}
                                                </p>
                                                <p className="mt-1 text-xs text-gray-500">
                                                    Record #{document.id}
                                                    {document.category ? ` · ${document.category}` : ""}
                                                </p>
                                            </td>
                                            <td className="px-5 py-4 text-gray-600">
                                                {documentAgencyName(document)}
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4 text-gray-500">
                                                {formatDate(
                                                    document.archivedAt ??
                                                        document.deletedAt ??
                                                        document.updatedAt,
                                                    true,
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => setRestoreTarget(document)}
                                                    className={secondaryButton}
                                                >
                                                    <RotateCcw className="h-4 w-4" /> Restore
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
                open={Boolean(restoreTarget)}
                title="Restore research record?"
                description="The record will return to the appropriate active workflow state."
                onClose={() => setRestoreTarget(null)}
                footer={
                    <>
                        <button
                            type="button"
                            className={secondaryButton}
                            onClick={() => setRestoreTarget(null)}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className={primaryButton}
                            disabled={saving}
                            onClick={() => void restore()}
                        >
                            <RotateCcw className="h-4 w-4" /> {saving ? "Restoring…" : "Restore record"}
                        </button>
                    </>
                }
            >
                <p className="text-sm text-gray-600">{restoreTarget?.title}</p>
            </Modal>
        </div>
    );
}

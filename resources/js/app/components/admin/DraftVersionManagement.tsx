import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, GitCommitHorizontal, Plus, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useApi } from "../../hooks/useApi";
import { useAgencyContext } from "../../hooks/useAgencyContext";
import {
    apiPost,
    firstValidationError,
    type DocumentVersion,
    type Paginated,
    type ResearchDocument,
} from "../../lib/api";
import { formatDateTime } from "../../lib/format";
import { hasPermission } from "../../lib/permissions";
import { EmptyState, ErrorState, LoadingState } from "../shared/AsyncState";
import { StatusBadge } from "../shared/StatusBadge";

export function DraftVersionManagement() {
    const { user } = useAgencyContext();
    const { id } = useParams();
    const navigate = useNavigate();
    const detail = useApi<{ data: ResearchDocument }>(id ? `/api/rikms/agency/documents/${id}` : null);
    const versions = useApi<Paginated<DocumentVersion>>(
        id ? `/api/rikms/agency/documents/${id}/versions` : null,
    );
    const [summary, setSummary] = useState("");
    const [saving, setSaving] = useState(false);
    const [restoringId, setRestoringId] = useState<number | null>(null);
    const canUpdate = hasPermission(user, "documents.update");

    async function createSnapshot(event: React.FormEvent) {
        event.preventDefault();
        if (!id) return;
        setSaving(true);
        try {
            await apiPost(`/api/rikms/agency/documents/${id}/versions`, {
                changeSummary: summary.trim() || null,
            });
            toast.success("Current document snapshot saved.");
            setSummary("");
            await versions.refresh();
        } catch (error) {
            toast.error(firstValidationError(error));
        } finally {
            setSaving(false);
        }
    }

    async function restore(version: DocumentVersion) {
        if (
            !id ||
            !window.confirm(
                `Restore version ${version.versionNumber}? Current metadata and access settings will be snapshotted first.`,
            )
        )
            return;
        setRestoringId(version.id);
        try {
            await apiPost(`/api/rikms/agency/documents/${id}/versions/${version.id}/restore`);
            toast.success(`Version ${version.versionNumber} restored.`);
            await Promise.all([versions.refresh(), detail.refresh()]);
        } catch (error) {
            toast.error(firstValidationError(error));
        } finally {
            setRestoringId(null);
        }
    }

    if (detail.loading || versions.loading) return <LoadingState label="Loading version history…" />;
    if (detail.error || versions.error || !detail.data || !versions.data)
        return (
            <ErrorState
                message={detail.error ?? versions.error ?? "Version history is unavailable."}
                onRetry={() => void Promise.all([detail.refresh(), versions.refresh()])}
            />
        );
    const document = detail.data.data;

    return (
        <div className="space-y-6">
            <header>
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#1E3A8A]"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </button>
                <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-bold text-[#1E3A8A]">Version history</h1>
                    <StatusBadge status={document.status} />
                </div>
                <p className="mt-1 max-w-3xl text-sm text-gray-500">
                    Tracked snapshots for “{document.title}”. Restoring changes metadata and access settings
                    but does not bypass review or publish the record.
                </p>
            </header>
            {canUpdate ? (
                <form
                    onSubmit={createSnapshot}
                    className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                >
                    <h2 className="font-semibold text-[#1E3A8A]">Create manual snapshot</h2>
                    <p className="mt-1 text-xs text-gray-500">
                        RIKMS already creates snapshots before edits. Add one manually before a larger
                        revision.
                    </p>
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                        <label className="flex-1">
                            <span className="sr-only">Change summary</span>
                            <input
                                value={summary}
                                onChange={(event) => setSummary(event.target.value)}
                                maxLength={500}
                                placeholder="Optional change summary"
                                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-blue-100"
                            />
                        </label>
                        <button
                            disabled={saving}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1E3A8A] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                        >
                            <Plus className="h-4 w-4" />
                            {saving ? "Saving…" : "Create snapshot"}
                        </button>
                    </div>
                </form>
            ) : (
                <p className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                    Version history is read-only for your current role.
                </p>
            )}
            {versions.data.data.length === 0 ? (
                <EmptyState
                    title="No snapshots yet"
                    description="A snapshot will be created automatically before the next metadata or access-policy edit."
                />
            ) : (
                <ol className="relative space-y-4 border-l-2 border-blue-100 pl-6">
                    {versions.data.data.map((version, index) => (
                        <li
                            key={version.id}
                            className="relative rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                        >
                            <span className="absolute -left-[33px] top-5 flex h-4 w-4 items-center justify-center rounded-full bg-[#1E3A8A] ring-4 ring-[#F3F4F6]">
                                <GitCommitHorizontal className="h-2.5 w-2.5 text-white" />
                            </span>
                            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="font-semibold text-gray-900">
                                            Version {version.versionNumber}
                                        </h2>
                                        {index === 0 && (
                                            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                                                Latest snapshot
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-1 text-sm text-gray-600">
                                        {version.changeSummary || "Automatic snapshot before an update"}
                                    </p>
                                    <p className="mt-2 text-xs text-gray-400">
                                        {formatDateTime(version.createdAt)}
                                        {version.createdBy ? ` · ${version.createdBy}` : ""}
                                        {version.status ? ` · ${version.status}` : ""}
                                    </p>
                                </div>
                                {canUpdate && (
                                    <button
                                        type="button"
                                        disabled={restoringId === version.id}
                                        onClick={() => void restore(version)}
                                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        <RotateCcw className="h-4 w-4" />
                                        {restoringId === version.id ? "Restoring…" : "Restore"}
                                    </button>
                                )}
                            </div>
                        </li>
                    ))}
                </ol>
            )}
        </div>
    );
}

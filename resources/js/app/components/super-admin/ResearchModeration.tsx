import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import {
    CheckCircle2,
    Download,
    ExternalLink,
    Eye,
    FileText,
    Search,
    ShieldCheck,
    XCircle,
} from "lucide-react";

import { adminApi, documentAgencyName, errorMessage } from "../../lib/admin-api";
import type { AdminDocument, Agency, DataResponse, Paginated } from "../../lib/admin-api";
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

const REVIEWABLE_STATUSES = ["pending", "pending_review", "submitted"];

function isReviewable(document: AdminDocument): boolean {
    return REVIEWABLE_STATUSES.includes(document.status.toLowerCase());
}

function formatBytes(bytes?: number | null): string {
    if (!bytes) return "Not reported";
    const units = ["B", "KB", "MB", "GB"];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
}

function authorNames(document: AdminDocument): string {
    const authors = document.metadata?.authors ?? document.authors ?? [];
    return authors
        .map((author) => {
            if (typeof author === "string") return author;
            return author.affiliation
                ? `${author.name ?? "Unnamed author"} (${author.affiliation})`
                : author.name;
        })
        .filter(Boolean)
        .join(", ");
}

function ReviewSection({ title, value }: { title: string; value?: string | null }) {
    return (
        <section>
            <h3 className="font-semibold text-slate-800">{title}</h3>
            <p className="mt-2 whitespace-pre-wrap leading-6 text-gray-600">
                {value?.trim() || "Not provided."}
            </p>
        </section>
    );
}

export function ResearchModeration() {
    const [searchParams, setSearchParams] = useSearchParams();
    const linkedDocumentId = searchParams.get("document");
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("pending");
    const [agencyId, setAgencyId] = useState("");
    const [page, setPage] = useState(1);
    const [agencies, setAgencies] = useState<Agency[]>([]);
    const [selected, setSelected] = useState<AdminDocument | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [decision, setDecision] = useState<Decision | null>(null);
    const [reason, setReason] = useState("");
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{
        message: string;
        tone: "success" | "error";
    } | null>(null);
    const debouncedSearch = useDebouncedValue(search);
    const {
        data: response,
        loading,
        error,
        reload,
    } = useAdminResource<Paginated<AdminDocument>>("/moderation", {
        search: debouncedSearch,
        status,
        agency_id: agencyId,
        page,
    });

    useEffect(() => {
        let active = true;

        const loadAllAgencies = async () => {
            const records: Agency[] = [];
            for (let currentPage = 1; ; currentPage += 1) {
                const result = await adminApi.get<Paginated<Agency>>("/agencies", {
                    per_page: 100,
                    page: currentPage,
                });
                records.push(...result.data);
                if (currentPage >= result.meta.lastPage) break;
            }

            if (active) setAgencies(records);
        };

        void loadAllAgencies().catch((requestError: unknown) => {
            if (active) {
                setToast({ message: errorMessage(requestError), tone: "error" });
            }
        });

        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        if (!linkedDocumentId) return undefined;
        if (!/^\d+$/.test(linkedDocumentId)) {
            setToast({ message: "The linked research record is invalid.", tone: "error" });
            return undefined;
        }

        let active = true;
        setDetailLoading(true);
        setDecision(null);
        setReason("");

        adminApi
            .get<DataResponse<AdminDocument>>(`/documents/${linkedDocumentId}`)
            .then((result) => {
                if (active) setSelected(result.data);
            })
            .catch((requestError: unknown) => {
                if (active) {
                    setToast({ message: errorMessage(requestError), tone: "error" });
                    setSearchParams({}, { replace: true });
                }
            })
            .finally(() => {
                if (active) setDetailLoading(false);
            });

        return () => {
            active = false;
        };
    }, [linkedDocumentId, setSearchParams]);

    const inspectDocument = async (document: AdminDocument) => {
        setSelected(document);
        setDecision(null);
        setReason("");
        setDetailLoading(true);
        try {
            const result = await adminApi.get<DataResponse<AdminDocument>>(`/documents/${document.id}`);
            setSelected(result.data);
        } catch (requestError) {
            setToast({ message: errorMessage(requestError), tone: "error" });
        } finally {
            setDetailLoading(false);
        }
    };

    const closeReview = () => {
        if (saving) return;
        setSelected(null);
        setDecision(null);
        setReason("");
        if (linkedDocumentId) {
            const nextParams = new URLSearchParams(searchParams);
            nextParams.delete("document");
            setSearchParams(nextParams, { replace: true });
        }
    };

    const submitDecision = async () => {
        if (!selected || !decision) return;
        if (decision === "reject" && reason.trim().length < 10) {
            setToast({
                message: "Provide a clear rejection reason (at least 10 characters).",
                tone: "error",
            });
            return;
        }
        setSaving(true);
        try {
            await adminApi.post(
                `/documents/${selected.id}/${decision}`,
                decision === "reject" ? { reason: reason.trim() } : {},
            );
            setToast({
                message:
                    decision === "approve"
                        ? "Research approved and published."
                        : "Research returned with a rejection reason.",
                tone: "success",
            });
            setSelected(null);
            setDecision(null);
            setReason("");
            if (linkedDocumentId) setSearchParams({}, { replace: true });
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
                title="Research Moderation"
                description="Inspect the source and complete metadata before recording an approval or rejection."
            />
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                <div className="flex gap-3">
                    <ShieldCheck className="h-5 w-5 shrink-0" />
                    <p>
                        Approval publishes the record according to its configured visibility. Rejection
                        requires an actionable reason and never deletes the submission.
                    </p>
                </div>
            </div>
            <Panel>
                <div className="grid gap-3 border-b border-gray-100 p-5 md:grid-cols-[1fr_220px_240px]">
                    <label className="relative">
                        <span className="sr-only">Search review queue</span>
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            value={search}
                            onChange={(event) => {
                                setSearch(event.target.value);
                                setPage(1);
                            }}
                            placeholder="Search research title…"
                            className={`${inputClass} pl-10`}
                        />
                    </label>
                    <label>
                        <span className="sr-only">Review status</span>
                        <select
                            value={status}
                            onChange={(event) => {
                                setStatus(event.target.value);
                                setPage(1);
                            }}
                            className={inputClass}
                        >
                            <option value="pending">Pending review</option>
                            <option value="published">Approved / published</option>
                            <option value="rejected">Rejected</option>
                            <option value="">All review statuses</option>
                        </select>
                    </label>
                    <label>
                        <span className="sr-only">Agency</span>
                        <select
                            value={agencyId}
                            onChange={(event) => {
                                setAgencyId(event.target.value);
                                setPage(1);
                            }}
                            className={inputClass}
                        >
                            <option value="">All agencies</option>
                            {agencies.map((agency) => (
                                <option key={agency.id} value={agency.id}>
                                    {agency.abbreviation || agency.name}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
                {loading && !response ? (
                    <LoadingState label="Loading moderation queue…" />
                ) : error && !response ? (
                    <ErrorState message={error} onRetry={reload} />
                ) : !response?.data.length ? (
                    <EmptyState
                        title="Review queue is clear"
                        description="No research records match the selected status and filters."
                    />
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                                    <tr>
                                        <th className="px-5 py-3 font-semibold">Submission</th>
                                        <th className="px-5 py-3 font-semibold">Agency</th>
                                        <th className="px-5 py-3 font-semibold">Status</th>
                                        <th className="px-5 py-3 font-semibold">Submitted</th>
                                        <th className="px-5 py-3 text-right font-semibold">Review</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {response.data.map((document) => (
                                        <tr key={document.id} className="hover:bg-gray-50/70">
                                            <td className="max-w-xl px-5 py-4">
                                                <p className="font-semibold text-slate-800">
                                                    {document.title}
                                                </p>
                                                <p className="mt-1 line-clamp-1 text-xs text-gray-500">
                                                    {document.abstract || "No abstract provided"}
                                                </p>
                                            </td>
                                            <td className="px-5 py-4 text-gray-600">
                                                {documentAgencyName(document)}
                                            </td>
                                            <td className="px-5 py-4">
                                                <StatusBadge status={document.status} />
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4 text-gray-500">
                                                {formatDate(document.submittedAt ?? document.createdAt, true)}
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => void inspectDocument(document)}
                                                    className={secondaryButton}
                                                >
                                                    <Eye className="h-4 w-4" /> Inspect source
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
                open={Boolean(selected) || detailLoading}
                title={selected?.title ?? "Loading research review…"}
                description={
                    selected ? `${documentAgencyName(selected)} · Record #${selected.id}` : undefined
                }
                onClose={closeReview}
                size="max-w-4xl"
                footer={
                    selected && isReviewable(selected) && !decision ? (
                        <>
                            <button
                                type="button"
                                className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50"
                                onClick={() => setDecision("reject")}
                            >
                                <XCircle className="h-4 w-4" /> Reject
                            </button>
                            <button
                                type="button"
                                className={primaryButton}
                                onClick={() => setDecision("approve")}
                            >
                                <CheckCircle2 className="h-4 w-4" /> Approve and publish
                            </button>
                        </>
                    ) : decision ? (
                        <>
                            <button
                                type="button"
                                className={secondaryButton}
                                disabled={saving}
                                onClick={() => {
                                    setDecision(null);
                                    setReason("");
                                }}
                            >
                                Back to inspection
                            </button>
                            <button
                                type="button"
                                className={
                                    decision === "reject"
                                        ? "inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                                        : primaryButton
                                }
                                disabled={saving}
                                onClick={() => void submitDecision()}
                            >
                                {saving
                                    ? "Saving decision…"
                                    : decision === "approve"
                                      ? "Confirm approval"
                                      : "Confirm rejection"}
                            </button>
                        </>
                    ) : undefined
                }
            >
                {detailLoading && !selected ? (
                    <LoadingState label="Loading the submitted record…" />
                ) : selected ? (
                    <div className="space-y-6 text-sm">
                        {decision ? (
                            <div>
                                <p
                                    className={`rounded-xl border p-4 ${
                                        decision === "approve"
                                            ? "border-green-200 bg-green-50 text-green-800"
                                            : "border-red-200 bg-red-50 text-red-800"
                                    }`}
                                >
                                    {decision === "approve"
                                        ? "This will publish the research record using its configured public and access policy."
                                        : "This will return the submission to the agency. Explain what must be corrected."}
                                </p>
                                {decision === "reject" && (
                                    <div className="mt-4">
                                        <label
                                            htmlFor="rejection-reason"
                                            className="mb-1.5 block font-semibold text-slate-800"
                                        >
                                            Rejection reason
                                        </label>
                                        <textarea
                                            id="rejection-reason"
                                            rows={5}
                                            required
                                            value={reason}
                                            onChange={(event) => setReason(event.target.value)}
                                            className={inputClass}
                                            placeholder="Describe the corrections required before resubmission…"
                                        />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="flex flex-wrap items-center gap-2">
                                    <StatusBadge status={selected.status} />
                                    {selected.category && <StatusBadge status={selected.category} />}
                                    {selected.documentType && <StatusBadge status={selected.documentType} />}
                                </div>

                                <section className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 font-semibold text-blue-950">
                                                <FileText className="h-5 w-5" /> Submitted source
                                            </div>
                                            <p className="mt-1 text-xs leading-5 text-blue-800">
                                                {selected.originalFilename ||
                                                    (selected.externalUrl
                                                        ? "External research source"
                                                        : "No source filename")}
                                                {selected.fileSize
                                                    ? ` · ${formatBytes(selected.fileSize)}`
                                                    : ""}
                                                {selected.accessMode
                                                    ? ` · ${selected.accessMode.replaceAll("_", " ")}`
                                                    : ""}
                                            </p>
                                        </div>
                                        {selected.canDownload ? (
                                            <a
                                                href={`/api/rikms/admin/documents/${selected.id}/download`}
                                                target={
                                                    selected.accessMode === "external_link_only"
                                                        ? "_blank"
                                                        : undefined
                                                }
                                                rel={
                                                    selected.accessMode === "external_link_only"
                                                        ? "noreferrer"
                                                        : undefined
                                                }
                                                className={primaryButton}
                                            >
                                                {selected.accessMode === "external_link_only" ? (
                                                    <ExternalLink className="h-4 w-4" />
                                                ) : (
                                                    <Download className="h-4 w-4" />
                                                )}
                                                {selected.accessMode === "external_link_only"
                                                    ? "Open submitted source"
                                                    : "Download submitted file"}
                                            </a>
                                        ) : (
                                            <p className="rounded-lg bg-white/70 px-3 py-2 text-xs font-semibold text-red-700">
                                                The submitted source is unavailable. Approval will remain
                                                blocked by server validation.
                                            </p>
                                        )}
                                    </div>
                                </section>

                                <dl className="grid gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:grid-cols-2 lg:grid-cols-3">
                                    <div>
                                        <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Authors
                                        </dt>
                                        <dd className="mt-1 text-slate-800">
                                            {authorNames(selected) || "Not provided"}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Year
                                        </dt>
                                        <dd className="mt-1 text-slate-800">
                                            {selected.year || "Not provided"}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            SDG tags
                                        </dt>
                                        <dd className="mt-1 text-slate-800">
                                            {selected.sdgs?.length
                                                ? selected.sdgs.map((sdg) => `SDG ${sdg}`).join(", ")
                                                : "None"}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Keywords
                                        </dt>
                                        <dd className="mt-1 text-slate-800">
                                            {(selected.metadata?.keywords ?? selected.keywords ?? []).join(
                                                ", ",
                                            ) || "Not provided"}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            DOI
                                        </dt>
                                        <dd className="mt-1 break-all text-slate-800">
                                            {selected.metadata?.doi || "Not provided"}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Public fields
                                        </dt>
                                        <dd className="mt-1 text-slate-800">
                                            {selected.publicFields?.length
                                                ? selected.publicFields.join(", ")
                                                : "None selected"}
                                        </dd>
                                    </div>
                                </dl>

                                <ReviewSection
                                    title="Abstract"
                                    value={selected.metadata?.abstract ?? selected.abstract}
                                />
                                <ReviewSection title="Methodology" value={selected.metadata?.methodology} />
                                <ReviewSection
                                    title="Review of related literature"
                                    value={selected.metadata?.reviewOfRelatedLiterature}
                                />
                                <ReviewSection
                                    title="Theoretical framework"
                                    value={selected.metadata?.theoreticalFramework}
                                />
                                <ReviewSection
                                    title="Results and discussion"
                                    value={selected.metadata?.resultsAndDiscussion}
                                />

                                {selected.rejectionReason && (
                                    <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                                        <p className="font-semibold text-red-800">
                                            Previous rejection reason
                                        </p>
                                        <p className="mt-1 text-red-700">{selected.rejectionReason}</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                ) : null}
            </Modal>
        </div>
    );
}

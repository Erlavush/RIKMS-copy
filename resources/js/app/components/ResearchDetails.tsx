import { useState } from "react";
import { Link, useParams } from "react-router";
import {
    ArrowLeft,
    Building2,
    Calendar,
    Download,
    ExternalLink,
    FileText,
    Hash,
    KeyRound,
    Share2,
    X,
} from "lucide-react";
import { toast } from "sonner";
import { useApi } from "../hooks/useApi";
import { useBootstrap } from "../hooks/useBootstrap";
import { useDialogFocus } from "../hooks/useDialogFocus";
import { apiPost, firstValidationError, type ResearchDocument } from "../lib/api";
import { formatBytes, formatNumber } from "../lib/format";
import { ErrorState, LoadingState } from "./shared/AsyncState";

export function ResearchDetails() {
    const { id } = useParams();
    const detail = useApi<{ data: ResearchDocument }>(id ? `/api/rikms/public/documents/${id}` : null);
    const bootstrap = useBootstrap();
    const [requestOpen, setRequestOpen] = useState(false);
    const [requesterName, setRequesterName] = useState("");
    const [requesterEmail, setRequesterEmail] = useState("");
    const [requesterOrganization, setRequesterOrganization] = useState("");
    const [message, setMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [requestDialogRef, requestInitialFocusRef] = useDialogFocus<HTMLFormElement, HTMLInputElement>(
        requestOpen,
        () => {
            if (!submitting) setRequestOpen(false);
        },
    );

    async function submitRequest(event: React.FormEvent) {
        event.preventDefault();
        if (!id) return;
        setSubmitting(true);
        try {
            await apiPost(`/api/rikms/public/documents/${id}/access-requests`, {
                requester_name: requesterName,
                requester_email: requesterEmail,
                requester_organization: requesterOrganization || null,
                message,
            });
            toast.success("Access request submitted. The agency will review it.");
            setRequestOpen(false);
            setRequesterName("");
            setRequesterEmail("");
            setRequesterOrganization("");
            setMessage("");
        } catch (error) {
            toast.error(firstValidationError(error));
        } finally {
            setSubmitting(false);
        }
    }

    async function share() {
        try {
            if (navigator.share)
                await navigator.share({ title: detail.data?.data.title, url: window.location.href });
            else {
                await navigator.clipboard.writeText(window.location.href);
                toast.success("Research link copied.");
            }
        } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") return;
            toast.error("The research link could not be shared.");
        }
    }

    if (detail.loading) return <LoadingState label="Loading published research…" />;
    if (detail.error || !detail.data)
        return (
            <div className="mx-auto max-w-2xl px-6 py-16">
                <ErrorState
                    message={detail.error ?? "This research record is unavailable or not published."}
                    onRetry={() => void detail.refresh()}
                />
                <Link
                    to="/browse"
                    className="mx-auto mt-6 flex w-fit items-center gap-2 text-sm font-medium text-[#1E3A8A] hover:underline"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to browse
                </Link>
            </div>
        );
    const research = detail.data.data;
    const metadata = research.metadata;

    return (
        <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
            <nav
                className="mb-6 flex items-center gap-2 overflow-hidden text-sm text-gray-500"
                aria-label="Breadcrumb"
            >
                <Link to="/" className="hover:text-[#1E3A8A]">
                    Home
                </Link>
                <span>/</span>
                <Link to="/browse" className="hover:text-[#1E3A8A]">
                    Browse
                </Link>
                <span>/</span>
                <span className="truncate text-[#1E3A8A]">{research.title}</span>
            </nav>
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
                <article className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                    <div className="mb-4 flex flex-wrap gap-2">
                        {research.sdgs.map((number) => {
                            const sdg = bootstrap.data?.sdgData.find((item) => item.number === number);
                            return (
                                <Link
                                    key={number}
                                    to={`/browse?sdg=${number}`}
                                    className="rounded-full px-3 py-1 text-xs font-medium text-white"
                                    style={{ backgroundColor: sdg?.color ?? "#64748B" }}
                                >
                                    SDG {number}
                                    {sdg ? `: ${sdg.title}` : ""}
                                </Link>
                            );
                        })}
                    </div>
                    <h1 className="text-2xl font-bold leading-tight text-[#1E3A8A] sm:text-3xl">
                        {research.title}
                    </h1>
                    {research.authors.length > 0 && (
                        <section className="mt-6">
                            <h2 className="text-sm font-semibold text-gray-500">Authors</h2>
                            <p className="mt-1 font-medium text-[#1E3A8A]">{research.authors.join(", ")}</p>
                        </section>
                    )}
                    <section className="mt-5">
                        <h2 className="text-sm font-semibold text-gray-500">Agency</h2>
                        <Link
                            to={`/agencies/${research.agencyId}`}
                            className="mt-1 inline-flex items-center gap-2 font-medium text-[#1E3A8A] hover:underline"
                        >
                            <Building2 className="h-4 w-4" />
                            {research.agency}
                        </Link>
                    </section>
                    {research.abstract && <ContentSection title="Abstract" value={research.abstract} />}
                    {metadata?.methodology && (
                        <ContentSection title="Methodology" value={metadata.methodology} />
                    )}
                    {metadata?.reviewOfRelatedLiterature && (
                        <ContentSection
                            title="Review of related literature"
                            value={metadata.reviewOfRelatedLiterature}
                        />
                    )}
                    {metadata?.theoreticalFramework && (
                        <ContentSection title="Theoretical framework" value={metadata.theoreticalFramework} />
                    )}
                    {metadata?.resultsAndDiscussion && (
                        <ContentSection
                            title="Results and discussion"
                            value={metadata.resultsAndDiscussion}
                        />
                    )}
                    {research.keywords.length > 0 && (
                        <section className="mt-6">
                            <h2 className="mb-2 text-sm font-semibold text-gray-500">Keywords</h2>
                            <div className="flex flex-wrap gap-2">
                                {research.keywords.map((keyword) => (
                                    <Link
                                        key={keyword}
                                        to={`/browse?search=${encodeURIComponent(keyword)}`}
                                        className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600 hover:bg-blue-50 hover:text-[#1E3A8A]"
                                    >
                                        {keyword}
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}
                    <div className="mt-8 flex flex-wrap gap-3 border-t border-gray-100 pt-5">
                        {research.canDownload && !research.externalUrl && (
                            <button
                                type="button"
                                onClick={() =>
                                    window.location.assign(
                                        `/api/rikms/public/documents/${research.id}/download`,
                                    )
                                }
                                className="inline-flex items-center gap-2 rounded-lg bg-[#1E3A8A] px-5 py-3 text-sm font-semibold text-white hover:bg-blue-900"
                            >
                                <Download className="h-4 w-4" />
                                Download {research.fileType ?? "document"}
                            </button>
                        )}
                        {research.canRequestAccess && (
                            <button
                                type="button"
                                onClick={() => setRequestOpen(true)}
                                className="inline-flex items-center gap-2 rounded-lg bg-purple-700 px-5 py-3 text-sm font-semibold text-white hover:bg-purple-800"
                            >
                                <KeyRound className="h-4 w-4" />
                                Request access
                            </button>
                        )}
                        {research.externalUrl && (
                            <a
                                href={`/api/rikms/public/documents/${research.id}/download`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-5 py-3 text-sm font-semibold text-white hover:bg-cyan-800"
                            >
                                <ExternalLink className="h-4 w-4" />
                                Open external source
                            </a>
                        )}
                        <button
                            type="button"
                            onClick={() => void share()}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
                        >
                            <Share2 className="h-4 w-4" />
                            Share
                        </button>
                        {!research.canDownload && !research.canRequestAccess && !research.externalUrl && (
                            <p className="w-full rounded-lg bg-gray-50 p-3 text-sm text-gray-500">
                                The full file is restricted by the contributing agency. Public metadata
                                remains available here.
                            </p>
                        )}
                    </div>
                </article>
                <aside className="h-fit rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
                    <h2 className="border-b border-gray-100 pb-3 font-semibold text-[#1E3A8A]">
                        Research metadata
                    </h2>
                    <dl className="mt-4 space-y-4">
                        <Meta icon={Building2} label="Agency" value={research.agency} />
                        <Meta icon={Calendar} label="Publication year" value={String(research.year)} />
                        {metadata?.doi && <Meta icon={Hash} label="DOI" value={metadata.doi} />}
                        <Meta
                            icon={FileText}
                            label="File"
                            value={
                                research.fileSize
                                    ? `${research.fileType ?? "Document"} · ${formatBytes(research.fileSize)}`
                                    : "No local file attached"
                            }
                        />
                        <Meta icon={Download} label="Downloads" value={formatNumber(research.downloads)} />
                        <Meta icon={FileText} label="Category" value={research.category} />
                    </dl>
                </aside>
            </div>
            {requestOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
                    <form
                        ref={requestDialogRef}
                        onSubmit={submitRequest}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="request-access-title"
                        className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
                    >
                        <button
                            type="button"
                            onClick={() => setRequestOpen(false)}
                            aria-label="Close access request"
                            className="absolute right-4 top-4 rounded-lg p-2 text-gray-400 hover:bg-gray-100"
                        >
                            <X className="h-5 w-5" />
                        </button>
                        <h2 id="request-access-title" className="text-xl font-bold text-[#1E3A8A]">
                            Request document access
                        </h2>
                        <p className="mt-2 pr-8 text-sm text-gray-500">
                            Your contact details and purpose are sent only to the contributing agency for this
                            request.
                        </p>
                        <div className="mt-5 grid gap-4">
                            <label>
                                <span className="mb-1.5 block text-sm font-medium text-gray-700">
                                    Full name
                                </span>
                                <input
                                    ref={requestInitialFocusRef}
                                    required
                                    value={requesterName}
                                    onChange={(event) => setRequesterName(event.target.value)}
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-blue-100"
                                />
                            </label>
                            <label>
                                <span className="mb-1.5 block text-sm font-medium text-gray-700">
                                    Email address
                                </span>
                                <input
                                    required
                                    type="email"
                                    value={requesterEmail}
                                    onChange={(event) => setRequesterEmail(event.target.value)}
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-blue-100"
                                />
                            </label>
                            <label>
                                <span className="mb-1.5 block text-sm font-medium text-gray-700">
                                    Organization <span className="font-normal text-gray-400">(optional)</span>
                                </span>
                                <input
                                    value={requesterOrganization}
                                    onChange={(event) => setRequesterOrganization(event.target.value)}
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-blue-100"
                                />
                            </label>
                            <label>
                                <span className="mb-1.5 block text-sm font-medium text-gray-700">
                                    Purpose of access
                                </span>
                                <textarea
                                    required
                                    minLength={10}
                                    rows={4}
                                    value={message}
                                    onChange={(event) => setMessage(event.target.value)}
                                    className="w-full rounded-lg border border-gray-200 p-3 text-sm focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-blue-100"
                                />
                            </label>
                        </div>
                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setRequestOpen(false)}
                                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={submitting}
                                className="rounded-lg bg-purple-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                            >
                                {submitting ? "Submitting…" : "Submit request"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

function ContentSection({ title, value }: { title: string; value: string }) {
    return (
        <section className="mt-6">
            <h2 className="mb-2 text-sm font-semibold text-gray-500">{title}</h2>
            <p className="whitespace-pre-line leading-relaxed text-gray-700">{value}</p>
        </section>
    );
}

function Meta({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
    return (
        <div className="flex gap-3">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
            <div>
                <dt className="text-xs font-medium text-gray-500">{label}</dt>
                <dd className="mt-0.5 break-words text-sm font-medium text-[#1E3A8A]">{value}</dd>
            </div>
        </div>
    );
}

import { ArrowLeft, BookOpen, Building2, Calendar, ExternalLink, Mail, MapPin, Phone } from "lucide-react";
import { Link, useParams } from "react-router";
import { useApi } from "../hooks/useApi";
import { useBootstrap } from "../hooks/useBootstrap";
import { type Paginated, type ResearchDocument, queryString } from "../lib/api";
import { formatNumber } from "../lib/format";
import { EmptyState, ErrorState, LoadingState } from "./shared/AsyncState";
import { PublicResearchCard } from "./shared/PublicResearchCard";

export function AgencyProfile() {
    const { id } = useParams();
    const bootstrap = useBootstrap();
    const browseEnabled = Boolean(bootstrap.data && bootstrap.data.platform?.allowPublicBrowse !== false);
    const documents = useApi<Paginated<ResearchDocument>>(
        id && browseEnabled ? `/api/rikms/public/documents${queryString({ agency: id, page: 1 })}` : null,
    );
    if (bootstrap.loading) return <LoadingState label="Loading agency…" />;
    if (bootstrap.error || !bootstrap.data)
        return (
            <div className="mx-auto max-w-3xl px-6 py-16">
                <ErrorState
                    message={bootstrap.error ?? "Agency information is unavailable."}
                    onRetry={() => void bootstrap.refresh()}
                />
            </div>
        );
    const agency = bootstrap.data.agencies.find((item) => item.id === Number(id));
    if (!agency)
        return (
            <div className="mx-auto max-w-2xl px-6 py-16">
                <EmptyState
                    title="Agency not found"
                    description="This agency is not in the public directory."
                />
                <Link
                    to="/agencies"
                    className="mx-auto mt-6 flex w-fit items-center gap-2 text-sm font-medium text-[#1E3A8A] hover:underline"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to agencies
                </Link>
            </div>
        );

    return (
        <div>
            <section className="bg-gradient-to-br from-[#1E3A8A] to-blue-900 text-white">
                <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6">
                    <Link
                        to="/agencies"
                        className="inline-flex items-center gap-1 text-sm text-blue-100 hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        All agencies
                    </Link>
                    <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center">
                        <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                            <Building2 className="h-10 w-10" />
                        </span>
                        <div>
                            <p className="text-sm font-semibold text-blue-200">
                                {agency.abbreviation} · {agency.type}
                            </p>
                            <h1 className="mt-1 max-w-4xl text-2xl font-bold leading-tight sm:text-3xl">
                                {agency.name}
                            </h1>
                            <div className="mt-4 flex flex-wrap gap-4 text-sm text-blue-100">
                                <span className="inline-flex items-center gap-1">
                                    <BookOpen className="h-4 w-4" />
                                    {formatNumber(agency.publications)} publications
                                </span>
                                <span className="inline-flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    {agency.latestYear
                                        ? `Latest publication ${agency.latestYear}`
                                        : "No publications yet"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6">
                <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h2 className="font-semibold text-[#1E3A8A]">About this agency</h2>
                    <p className="mt-3 max-w-4xl leading-relaxed text-gray-600">{agency.description}</p>
                    {(agency.region ||
                        agency.address ||
                        agency.contactEmail ||
                        agency.contactPhone ||
                        agency.website) && (
                        <div className="mt-6 grid gap-3 border-t border-gray-100 pt-5 text-sm text-gray-600 sm:grid-cols-2">
                            {(agency.address || agency.region) && (
                                <p className="flex items-start gap-2">
                                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#1E3A8A]" />
                                    {[agency.address, agency.region].filter(Boolean).join(", ")}
                                </p>
                            )}
                            {agency.contactEmail && (
                                <a
                                    href={`mailto:${agency.contactEmail}`}
                                    className="flex items-center gap-2 text-[#1E3A8A] hover:underline"
                                >
                                    <Mail className="h-4 w-4" />
                                    {agency.contactEmail}
                                </a>
                            )}
                            {agency.contactPhone && (
                                <a
                                    href={`tel:${agency.contactPhone}`}
                                    className="flex items-center gap-2 text-[#1E3A8A] hover:underline"
                                >
                                    <Phone className="h-4 w-4" />
                                    {agency.contactPhone}
                                </a>
                            )}
                            {agency.website && (
                                <a
                                    href={agency.website}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2 text-[#1E3A8A] hover:underline"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                    Agency website
                                </a>
                            )}
                        </div>
                    )}
                </section>
                <section className="mt-10">
                    <div className="flex items-end justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-[#1E3A8A]">Published research</h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Public records contributed by {agency.abbreviation}.
                            </p>
                        </div>
                        {browseEnabled && (
                            <Link
                                to={`/browse?agency=${agency.id}`}
                                className="text-sm font-medium text-[#1E3A8A] hover:underline"
                            >
                                Browse all
                            </Link>
                        )}
                    </div>
                    <div className="mt-5">
                        {!browseEnabled && (
                            <EmptyState
                                title="Public browsing is temporarily unavailable"
                                description="This agency profile remains available while publication browsing is paused."
                            />
                        )}
                        {documents.loading && <LoadingState label="Loading agency publications…" />}
                        {documents.error && (
                            <ErrorState message={documents.error} onRetry={() => void documents.refresh()} />
                        )}
                        {documents.data &&
                            (documents.data.data.length ? (
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {documents.data.data.map((document) => (
                                        <PublicResearchCard
                                            key={document.id}
                                            document={document}
                                            sdgs={bootstrap.data?.sdgData ?? []}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <EmptyState
                                    title="No published research yet"
                                    description="Only reviewed, published records are listed publicly."
                                />
                            ))}
                    </div>
                </section>
            </div>
        </div>
    );
}

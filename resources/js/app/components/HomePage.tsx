import { ArrowRight, BookMarked, Building2, FileText, Layers, Search, TrendingUp, Users } from "lucide-react";
import { Link } from "react-router";
import { useApi } from "../hooks/useApi";
import { useBootstrap } from "../hooks/useBootstrap";
import { type Paginated, type ResearchDocument } from "../lib/api";
import { formatNumber } from "../lib/format";
import { EmptyState, ErrorState, LoadingState } from "./shared/AsyncState";
import { PublicResearchCard } from "./shared/PublicResearchCard";

function StatCard({ icon: Icon, value, label }: { icon: React.ElementType; value: number; label: string }) {
    return (
        <div className="rounded-xl border border-gray-100 bg-white p-6 text-center shadow-sm">
            <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
                <Icon className="h-6 w-6 text-[#1E3A8A]" />
            </span>
            <p className="text-3xl font-bold text-[#1E3A8A]">{formatNumber(value)}</p>
            <p className="mt-1 text-sm text-gray-500">{label}</p>
        </div>
    );
}

export function HomePage() {
    const bootstrap = useBootstrap();
    const featured = useApi<Paginated<ResearchDocument>>(
        bootstrap.data && bootstrap.data.platform?.allowPublicBrowse !== false
            ? "/api/rikms/public/documents?per_page=6&page=1"
            : null,
    );
    if (bootstrap.loading) return <LoadingState label="Loading RIKMS…" />;
    if (bootstrap.error || !bootstrap.data)
        return (
            <div className="mx-auto max-w-3xl px-6 py-16">
                <ErrorState
                    message={bootstrap.error ?? "The public repository is unavailable."}
                    onRetry={() => void bootstrap.refresh()}
                />
            </div>
        );
    const data = bootstrap.data;
    const browseEnabled = data.platform?.allowPublicBrowse !== false;

    return (
        <div>
            <section className="relative overflow-hidden bg-gradient-to-br from-[#1E3A8A] via-blue-900 to-[#2D4BA0] text-white">
                <div
                    className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
                        backgroundSize: "24px 24px",
                    }}
                />
                <div className="relative mx-auto max-w-[1200px] px-4 py-16 sm:px-6 sm:py-24">
                    <div className="max-w-2xl">
                        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
                            Regionwide Integrated Knowledge Management System
                        </h1>
                        <p className="mt-4 text-base leading-relaxed text-blue-100 sm:text-lg">
                            Discover reviewed, published research contributed by government agencies and
                            research institutions in the Davao Region.
                        </p>
                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            {browseEnabled ? (
                                <Link
                                    to="/browse"
                                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-[#1E3A8A] hover:bg-blue-50"
                                >
                                    <Search className="h-4 w-4" />
                                    Browse research
                                </Link>
                            ) : (
                                <span className="inline-flex items-center justify-center rounded-lg bg-white/15 px-6 py-3 text-sm font-semibold text-white">
                                    Public browsing is temporarily unavailable
                                </span>
                            )}
                            <Link
                                to="/agencies"
                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/20"
                            >
                                <Building2 className="h-4 w-4" />
                                Participating agencies
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
            <section className="relative z-10 mx-auto -mt-8 max-w-[1200px] px-4 sm:px-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        icon={FileText}
                        value={data.statistics.totalResearch}
                        label="Published research"
                    />
                    <StatCard
                        icon={Building2}
                        value={data.statistics.participatingAgencies}
                        label="Participating agencies"
                    />
                    <StatCard icon={Layers} value={data.statistics.sdgsCovered} label="SDGs represented" />
                    <StatCard
                        icon={TrendingUp}
                        value={data.statistics.latestPublications}
                        label="Latest publications"
                    />
                </div>
            </section>
            {browseEnabled && (
                <section className="bg-white py-14 sm:py-16">
                    <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
                        <div className="mx-auto mb-10 max-w-3xl text-center">
                            <h2 className="text-2xl font-bold text-[#1E3A8A]">
                                Research contributions to the Sustainable Development Goals
                            </h2>
                            <p className="mt-2 text-gray-500">
                                Explore published regional research by the goals it directly supports.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                            {data.sdgData.map((sdg) => (
                                <Link
                                    key={sdg.number}
                                    to={`/browse?sdg=${sdg.number}`}
                                    className="flex min-h-36 flex-col justify-between rounded-xl p-4 text-white shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md"
                                    style={{ backgroundColor: sdg.color }}
                                >
                                    <span className="text-3xl font-bold text-white/60">{sdg.number}</span>
                                    <span>
                                        <span className="block text-xs font-semibold leading-snug">
                                            {sdg.title}
                                        </span>
                                        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-1 text-[10px]">
                                            <FileText className="h-3 w-3" />
                                            {formatNumber(data.sdgResearchCounts[sdg.number] ?? 0)} records
                                        </span>
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}
            {browseEnabled && (
                <section className="bg-gray-50 py-14 sm:py-16">
                    <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
                        <div className="mb-8 flex items-end justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-[#1E3A8A]">
                                    Latest published research
                                </h2>
                                <p className="mt-1 text-gray-500">
                                    Recently reviewed additions to the public repository.
                                </p>
                            </div>
                            <Link
                                to="/browse"
                                className="hidden items-center gap-1 text-sm font-medium text-[#1E3A8A] hover:underline sm:inline-flex"
                            >
                                View all
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                        {featured.loading && <LoadingState label="Loading research…" />}
                        {featured.error && (
                            <ErrorState message={featured.error} onRetry={() => void featured.refresh()} />
                        )}
                        {featured.data &&
                            (featured.data.data.length ? (
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {featured.data.data.map((document) => (
                                        <PublicResearchCard
                                            key={document.id}
                                            document={document}
                                            sdgs={data.sdgData}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <EmptyState
                                    title="No published research yet"
                                    description="Approved publications will appear here."
                                />
                            ))}
                    </div>
                </section>
            )}
            {!browseEnabled && (
                <section className="bg-white py-14 sm:py-16">
                    <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
                        <EmptyState
                            title="Public browsing is temporarily unavailable"
                            description="Agency profiles remain available. Please return later for published research."
                        />
                    </div>
                </section>
            )}
            <section className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6 sm:py-16">
                <div className="mb-8 text-center">
                    <h2 className="text-2xl font-bold text-[#1E3A8A]">Participating agencies</h2>
                    <p className="mt-2 text-gray-500">
                        Institutions contributing reviewed knowledge to the regional repository.
                    </p>
                </div>
                {data.agencies.length ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {data.agencies.slice(0, 9).map((agency) => (
                            <Link
                                key={agency.id}
                                to={`/agencies/${agency.id}`}
                                className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                            >
                                <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
                                    <Users className="h-7 w-7 text-[#1E3A8A]" />
                                </span>
                                <p className="text-sm font-semibold text-[#1E3A8A]">{agency.abbreviation}</p>
                                <p className="mt-1 line-clamp-2 text-xs text-gray-500">{agency.name}</p>
                                <p className="mt-3 inline-flex items-center gap-1 text-xs text-gray-500">
                                    <BookMarked className="h-3 w-3" />
                                    {formatNumber(agency.publications)} publications
                                </p>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <EmptyState title="No participating agencies yet" />
                )}
            </section>
        </div>
    );
}

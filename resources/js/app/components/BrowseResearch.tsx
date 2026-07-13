import { useEffect, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useSearchParams } from "react-router";
import { useApi } from "../hooks/useApi";
import { useBootstrap } from "../hooks/useBootstrap";
import { type Paginated, type ResearchDocument, queryString } from "../lib/api";
import { EmptyState, ErrorState, LoadingState } from "./shared/AsyncState";
import { PublicResearchCard } from "./shared/PublicResearchCard";

export function BrowseResearch() {
    const [params, setParams] = useSearchParams();
    const legacyQuery = params.get("q");
    const appliedSearch = params.get("search") ?? legacyQuery ?? "";
    const [search, setSearch] = useState(appliedSearch);
    const page = Math.max(1, Number(params.get("page") ?? 1));
    const agency = params.get("agency") ?? "";
    const sdg = params.get("sdg") ?? "";
    const year = params.get("year") ?? "";
    const category = params.get("category") ?? "";
    const bootstrap = useBootstrap();
    const browseEnabled = Boolean(bootstrap.data && bootstrap.data.platform?.allowPublicBrowse !== false);
    const listUrl = browseEnabled
        ? `/api/rikms/public/documents${queryString({ search: appliedSearch, agency, sdg, year, category, page })}`
        : null;
    const documents = useApi<Paginated<ResearchDocument>>(listUrl);

    useEffect(() => setSearch(appliedSearch), [appliedSearch]);

    function update(key: string, value: string) {
        const next = new URLSearchParams(params);
        next.delete("q");
        if (value) next.set(key, value);
        else next.delete(key);
        if (key !== "page") next.delete("page");
        setParams(next);
    }

    function clearFilters() {
        setSearch("");
        setParams({});
    }

    const activeFilters = [appliedSearch, agency, sdg, year, category].filter(Boolean).length;
    const result = documents.data;
    const years = Array.from({ length: 12 }, (_, index) => new Date().getFullYear() - index);

    if (bootstrap.loading) return <LoadingState label="Loading public repository settings…" />;
    if (bootstrap.error || !bootstrap.data)
        return (
            <ErrorState
                message={bootstrap.error ?? "The public repository is unavailable."}
                onRetry={() => void bootstrap.refresh()}
            />
        );
    if (!browseEnabled)
        return (
            <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6">
                <h1 className="text-3xl font-bold text-[#1E3A8A]">Browse Research</h1>
                <div className="mt-8">
                    <EmptyState
                        title="Public browsing is temporarily unavailable"
                        description="Participating agency profiles remain available while public repository access is paused."
                    />
                </div>
            </div>
        );

    return (
        <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6">
            <header>
                <h1 className="text-3xl font-bold text-[#1E3A8A]">Browse Research</h1>
                <p className="mt-2 text-gray-500">
                    Search only reviewed and published research records available to the public.
                </p>
            </header>
            <section className="mt-8 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        update("search", search.trim());
                    }}
                    className="flex flex-col gap-3 sm:flex-row"
                >
                    <label className="relative flex-1">
                        <span className="sr-only">Search published research</span>
                        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search title, author, abstract, or keyword…"
                            className="w-full rounded-lg border border-gray-200 py-3 pl-11 pr-3 text-sm focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                    </label>
                    <button className="rounded-lg bg-[#1E3A8A] px-6 py-3 text-sm font-semibold text-white hover:bg-blue-900">
                        Search
                    </button>
                </form>
                <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                    {activeFilters > 0 && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                            {activeFilters}
                        </span>
                    )}
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <label>
                        <span className="sr-only">Agency</span>
                        <select
                            value={agency}
                            onChange={(event) => update("agency", event.target.value)}
                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm"
                        >
                            <option value="">All agencies</option>
                            {bootstrap.data?.agencies.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.abbreviation} — {item.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label>
                        <span className="sr-only">Sustainable Development Goal</span>
                        <select
                            value={sdg}
                            onChange={(event) => update("sdg", event.target.value)}
                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm"
                        >
                            <option value="">All SDGs</option>
                            {bootstrap.data?.sdgData.map((item) => (
                                <option key={item.number} value={item.number}>
                                    SDG {item.number}: {item.title}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label>
                        <span className="sr-only">Publication year</span>
                        <select
                            value={year}
                            onChange={(event) => update("year", event.target.value)}
                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm"
                        >
                            <option value="">All years</option>
                            {years.map((item) => (
                                <option key={item} value={item}>
                                    {item}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label>
                        <span className="sr-only">Category</span>
                        <select
                            value={category}
                            onChange={(event) => update("category", event.target.value)}
                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm"
                        >
                            <option value="">All categories</option>
                            {bootstrap.data?.researchCategories.map((item) => (
                                <option key={item} value={item}>
                                    {item}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
                {activeFilters > 0 && (
                    <button
                        type="button"
                        onClick={clearFilters}
                        className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:underline"
                    >
                        <X className="h-3 w-3" />
                        Clear all filters
                    </button>
                )}
            </section>
            <div className="mt-8 flex items-end justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Published research</h2>
                    <p className="mt-1 text-sm text-gray-500">
                        {result
                            ? `${result.meta.total.toLocaleString()} result${result.meta.total === 1 ? "" : "s"}`
                            : "Loading results…"}
                    </p>
                </div>
            </div>
            <section className="mt-5">
                {documents.loading && <LoadingState label="Searching research…" />}
                {documents.error && (
                    <ErrorState message={documents.error} onRetry={() => void documents.refresh()} />
                )}
                {result &&
                    !documents.loading &&
                    (result.data.length ? (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {result.data.map((document) => (
                                <PublicResearchCard
                                    key={document.id}
                                    document={document}
                                    sdgs={bootstrap.data?.sdgData ?? []}
                                />
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            title="No published research matches"
                            description="Try a broader search or clear one of the filters."
                        />
                    ))}
            </section>
            {result && result.meta.lastPage > 1 && (
                <nav
                    className="mt-8 flex items-center justify-center gap-3"
                    aria-label="Research result pages"
                >
                    <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() => update("page", String(page - 1))}
                        className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm disabled:opacity-40"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-gray-500">
                        Page {result.meta.currentPage} of {result.meta.lastPage}
                    </span>
                    <button
                        type="button"
                        disabled={page >= result.meta.lastPage}
                        onClick={() => update("page", String(page + 1))}
                        className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm disabled:opacity-40"
                    >
                        Next
                    </button>
                </nav>
            )}
        </div>
    );
}

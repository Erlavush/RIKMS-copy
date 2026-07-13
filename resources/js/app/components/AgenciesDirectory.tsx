import { useMemo, useState } from "react";
import { BookOpen, Building2, Calendar, Search } from "lucide-react";
import { Link } from "react-router";
import { useBootstrap } from "../hooks/useBootstrap";
import { formatNumber } from "../lib/format";
import { EmptyState, ErrorState, LoadingState } from "./shared/AsyncState";

export function AgenciesDirectory() {
    const bootstrap = useBootstrap();
    const [search, setSearch] = useState("");
    const [type, setType] = useState("");
    const agencies = useMemo(
        () =>
            (bootstrap.data?.agencies ?? []).filter(
                (agency) =>
                    (!search.trim() ||
                        `${agency.name} ${agency.abbreviation} ${agency.description}`
                            .toLowerCase()
                            .includes(search.trim().toLowerCase())) &&
                    (!type || agency.type === type),
            ),
        [bootstrap.data, search, type],
    );
    const types = Array.from(new Set((bootstrap.data?.agencies ?? []).map((agency) => agency.type))).sort();
    if (bootstrap.loading) return <LoadingState label="Loading participating agencies…" />;
    if (bootstrap.error || !bootstrap.data)
        return (
            <div className="mx-auto max-w-3xl px-6 py-16">
                <ErrorState
                    message={bootstrap.error ?? "Agency directory is unavailable."}
                    onRetry={() => void bootstrap.refresh()}
                />
            </div>
        );

    return (
        <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6">
            <header className="mx-auto max-w-3xl text-center">
                <h1 className="text-3xl font-bold text-[#1E3A8A]">Participating Agencies</h1>
                <p className="mt-3 text-gray-500">
                    Explore institutions contributing reviewed research to the Davao Region knowledge base.
                </p>
            </header>
            <section className="mt-8 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row">
                <label className="relative flex-1">
                    <span className="sr-only">Search agencies</span>
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search agency name or abbreviation…"
                        className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                </label>
                <label>
                    <span className="sr-only">Agency type</span>
                    <select
                        value={type}
                        onChange={(event) => setType(event.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm sm:w-64"
                    >
                        <option value="">All agency types</option>
                        {types.map((item) => (
                            <option key={item} value={item}>
                                {item}
                            </option>
                        ))}
                    </select>
                </label>
            </section>
            <p className="mt-6 text-sm text-gray-500">
                {agencies.length} agenc{agencies.length === 1 ? "y" : "ies"}
            </p>
            {agencies.length ? (
                <div className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {agencies.map((agency) => (
                        <Link
                            key={agency.id}
                            to={`/agencies/${agency.id}`}
                            className="group flex flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                        >
                            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                                <Building2 className="h-6 w-6 text-[#1E3A8A]" />
                            </span>
                            <h2 className="mt-4 font-semibold text-[#1E3A8A] group-hover:underline">
                                {agency.name}
                            </h2>
                            <p className="mt-1 text-xs font-medium text-gray-500">
                                {agency.abbreviation} · {agency.type}
                            </p>
                            <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-gray-600">
                                {agency.description}
                            </p>
                            <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4 text-xs text-gray-500">
                                <span className="inline-flex items-center gap-1">
                                    <BookOpen className="h-3 w-3" />
                                    {formatNumber(agency.publications)} publications
                                </span>
                                <span className="inline-flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {agency.latestYear
                                        ? `Latest ${agency.latestYear}`
                                        : "No publications yet"}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="mt-5">
                    <EmptyState
                        title="No agencies match"
                        description="Try a different name or type filter."
                    />
                </div>
            )}
        </div>
    );
}

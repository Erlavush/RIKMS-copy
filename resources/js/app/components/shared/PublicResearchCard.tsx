import { ArrowRight, Building2, Calendar } from "lucide-react";
import { Link } from "react-router";
import type { ResearchDocument, Sdg } from "../../lib/api";

export function PublicResearchCard({ document, sdgs }: { document: ResearchDocument; sdgs: Sdg[] }) {
    return (
        <article className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-3 flex flex-wrap gap-1.5">
                {document.sdgs.map((number) => {
                    const sdg = sdgs.find((item) => item.number === number);
                    return (
                        <span
                            key={number}
                            className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                            style={{ backgroundColor: sdg?.color ?? "#64748B" }}
                            title={sdg?.title}
                        >
                            SDG {number}
                        </span>
                    );
                })}
            </div>
            <h2 className="line-clamp-2 text-base font-semibold leading-snug text-[#1E3A8A]">
                {document.title}
            </h2>
            <p className="mt-2 line-clamp-1 text-xs text-gray-500">
                {document.authors.join(", ") || "No authors listed"}
            </p>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                <span className="inline-flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {document.agencyAbbr}
                </span>
                <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {document.year}
                </span>
            </div>
            <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-gray-600">
                {document.abstract || "No public abstract is available."}
            </p>
            <Link
                to={`/research/${document.id}`}
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#1E3A8A] hover:underline"
            >
                View research
                <ArrowRight className="h-3 w-3" />
            </Link>
        </article>
    );
}

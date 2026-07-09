import { useParams, Link } from "react-router";
import { useMemo } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  BookMarked,
  Calendar,
  Download,
  Target,
  FlaskConical,
  GraduationCap,
} from "lucide-react";
import { AGENCIES, RESEARCH_DATA, SDG_DATA } from "../data/mock-data";

export function AgencyProfile() {
  const { id } = useParams();
  const agency = AGENCIES.find((a) => a.id === Number(id));

  const agencyResearch = useMemo(() => {
    if (!agency) return [];
    return RESEARCH_DATA.filter(
      (r) => r.agencyAbbr === agency.abbreviation
    ).sort((a, b) => b.year - a.year);
  }, [agency]);

  const sdgCoverage = useMemo(() => {
    const sdgMap = new Map<number, number>();
    agencyResearch.forEach((r) => {
      r.sdgs.forEach((sdgNum) => {
        sdgMap.set(sdgNum, (sdgMap.get(sdgNum) || 0) + 1);
      });
    });
    return Array.from(sdgMap.entries())
      .map(([num, count]) => ({
        sdg: SDG_DATA.find((s) => s.number === num)!,
        count,
      }))
      .filter((item) => item.sdg)
      .sort((a, b) => b.count - a.count);
  }, [agencyResearch]);

  const uniqueSdgCount = sdgCoverage.length;

  if (!agency) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-16 text-center">
        <h2
          className="text-[#1E3A8A] mb-4"
          style={{ fontSize: "1.5rem", fontWeight: 700 }}
        >
          Agency Not Found
        </h2>
        <p className="text-[#6B7280] mb-6">
          The agency you are looking for does not exist.
        </p>
        <Link
          to="/agencies"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#1E3A8A] text-white rounded-lg hover:bg-[#1E3A8A]/90 transition-colors"
          style={{ fontWeight: 500 }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Agencies
        </Link>
      </div>
    );
  }

  const getIcon = () => {
    switch (agency.type) {
      case "Government Agency":
        return Building2;
      case "Research Consortium":
        return FlaskConical;
      case "Higher Education Institution":
        return GraduationCap;
    }
  };

  const Icon = getIcon();

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-6 overflow-x-auto">
        <Link to="/" className="hover:text-[#1E3A8A]">
          Home
        </Link>
        <span>/</span>
        <Link to="/agencies" className="hover:text-[#1E3A8A]">
          Agencies
        </Link>
        <span>/</span>
        <span className="text-[#1E3A8A]">{agency.abbreviation}</span>
      </div>

      {/* Agency Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Logo Placeholder */}
          <div className="w-20 h-20 rounded-2xl bg-[#1E3A8A]/10 flex items-center justify-center shrink-0">
            <Icon className="w-10 h-10 text-[#1E3A8A]" />
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1
                className="text-[#1E3A8A]"
                style={{ fontSize: "1.5rem", fontWeight: 700 }}
              >
                {agency.abbreviation}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs" style={{ fontWeight: 500 }}>
                {agency.type}
              </span>
            </div>
            <p
              className="text-[#6B7280] mb-3"
              style={{ fontSize: "1rem" }}
            >
              {agency.name}
            </p>
            <p className="text-[#6B7280] max-w-2xl">{agency.description}</p>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-gray-100">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <BookMarked className="w-5 h-5 text-[#1E3A8A]" />
            </div>
            <p
              className="text-[#1E3A8A]"
              style={{ fontSize: "1.5rem", fontWeight: 700 }}
            >
              {agency.publications}
            </p>
            <p className="text-sm text-[#6B7280]">Total Research</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Target className="w-5 h-5 text-[#1E3A8A]" />
            </div>
            <p
              className="text-[#1E3A8A]"
              style={{ fontSize: "1.5rem", fontWeight: 700 }}
            >
              {uniqueSdgCount}
            </p>
            <p className="text-sm text-[#6B7280]">SDGs Covered</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Calendar className="w-5 h-5 text-[#1E3A8A]" />
            </div>
            <p
              className="text-[#1E3A8A]"
              style={{ fontSize: "1.5rem", fontWeight: 700 }}
            >
              {agency.latestYear}
            </p>
            <p className="text-sm text-[#6B7280]">Latest Publication Year</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Research Published */}
        <div className="flex-1 min-w-0">
          <h2
            className="text-[#1E3A8A] mb-5"
            style={{ fontSize: "1.25rem", fontWeight: 700 }}
          >
            Research Published by This Agency
          </h2>

          {agencyResearch.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center">
              <BookMarked className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-[#6B7280]" style={{ fontWeight: 500 }}>
                No research papers found for this agency
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {agencyResearch.map((research) => (
                <div
                  key={research.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
                >
                  {/* SDG Tags */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    {research.sdgs.map((sdgNum) => {
                      const sdg = SDG_DATA.find((s) => s.number === sdgNum);
                      return (
                        <span
                          key={sdgNum}
                          className="px-2 py-0.5 rounded-full text-white text-xs"
                          style={{
                            backgroundColor: sdg?.color,
                            fontWeight: 500,
                          }}
                        >
                          SDG {sdgNum}
                        </span>
                      );
                    })}
                  </div>

                  {/* Title */}
                  <Link
                    to={`/research/${research.id}`}
                    className="text-[#1E3A8A] hover:underline block mb-1"
                    style={{ fontSize: "1.05rem", fontWeight: 600 }}
                  >
                    {research.title}
                  </Link>

                  {/* Authors & Year */}
                  <p className="text-xs text-[#6B7280] mb-1">
                    {research.authors.join(", ")}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-[#6B7280] mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {research.year}
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="w-3 h-3" />
                      {research.downloads.toLocaleString()} downloads
                    </span>
                  </div>

                  {/* Abstract Preview */}
                  <p className="text-sm text-[#6B7280] mb-4 line-clamp-2">
                    {research.abstract}
                  </p>

                  {/* Buttons */}
                  <div className="flex gap-3">
                    <Link
                      to={`/research/${research.id}`}
                      className="inline-flex items-center gap-1 px-4 py-2 bg-[#1E3A8A] text-white text-sm rounded-lg hover:bg-[#1E3A8A]/90 transition-colors"
                      style={{ fontWeight: 500 }}
                    >
                      View Research <ArrowRight className="w-3 h-3" />
                    </Link>
                    <button
                      className="inline-flex items-center gap-1 px-4 py-2 border border-[#1E3A8A] text-[#1E3A8A] text-sm rounded-lg hover:bg-blue-50 transition-colors"
                      style={{ fontWeight: 500 }}
                    >
                      <Download className="w-3 h-3" />
                      Download PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar - SDG Coverage */}
        <div className="lg:w-80 shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
            <h3
              className="text-[#1E3A8A] mb-4 pb-3 border-b border-gray-100"
              style={{ fontSize: "1rem", fontWeight: 600 }}
            >
              SDG Coverage
            </h3>

            {sdgCoverage.length === 0 ? (
              <p className="text-sm text-[#6B7280]">
                No SDG data available yet.
              </p>
            ) : (
              <div className="space-y-3">
                {sdgCoverage.map(({ sdg, count }) => (
                  <div key={sdg.number} className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-md flex items-center justify-center text-white text-xs shrink-0"
                      style={{
                        backgroundColor: sdg.color,
                        fontWeight: 700,
                      }}
                    >
                      {sdg.number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm text-[#374151] truncate"
                        style={{ fontWeight: 500 }}
                      >
                        SDG {sdg.number}
                      </p>
                      <p className="text-xs text-[#6B7280]">
                        {count} Research Stud{count !== 1 ? "ies" : "y"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Agency Overview */}
            <div className="mt-6 pt-4 border-t border-gray-100">
              <h4
                className="text-sm text-[#1E3A8A] mb-2"
                style={{ fontWeight: 600 }}
              >
                Agency Overview
              </h4>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                {agency.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
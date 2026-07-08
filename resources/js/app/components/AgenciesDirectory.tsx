import { useState, useMemo } from "react";
import { Link } from "react-router";
import {
  Search,
  Building2,
  BookMarked,
  ArrowRight,
  Users,
  FlaskConical,
  GraduationCap,
} from "lucide-react";
import { AGENCIES, type AgencyType } from "../data/mock-data";

const AGENCY_TYPES: AgencyType[] = [
  "Government Agency",
  "Research Consortium",
  "Higher Education Institution",
];

function getAgencyIcon(type: AgencyType) {
  switch (type) {
    case "Government Agency":
      return Building2;
    case "Research Consortium":
      return FlaskConical;
    case "Higher Education Institution":
      return GraduationCap;
  }
}

function getAgencyColor(type: AgencyType) {
  switch (type) {
    case "Government Agency":
      return { bg: "bg-blue-50", text: "text-blue-700", badge: "bg-blue-100 text-blue-700" };
    case "Research Consortium":
      return { bg: "bg-emerald-50", text: "text-emerald-700", badge: "bg-emerald-100 text-emerald-700" };
    case "Higher Education Institution":
      return { bg: "bg-purple-50", text: "text-purple-700", badge: "bg-purple-100 text-purple-700" };
  }
}

export function AgenciesDirectory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<AgencyType | "All">("All");

  const filteredAgencies = useMemo(() => {
    let results = [...AGENCIES];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      results = results.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.abbreviation.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q)
      );
    }

    if (selectedType !== "All") {
      results = results.filter((a) => a.type === selectedType);
    }

    return results;
  }, [searchQuery, selectedType]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { All: AGENCIES.length };
    AGENCY_TYPES.forEach((type) => {
      counts[type] = AGENCIES.filter((a) => a.type === type).length;
    });
    return counts;
  }, []);

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1
          className="text-[#1E3A8A] mb-2 text-xl sm:text-2xl"
          style={{ fontWeight: 700 }}
        >
          Participating Agencies in Davao Region
        </h1>
        <p className="text-[#6B7280] max-w-3xl">
          Explore government agencies, research institutions, and regional R&D
          consortia contributing research to the Regionwide Integrated Knowledge
          Management System.
        </p>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-8">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search agencies"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#F9FAFB] border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] transition-colors"
            />
          </div>
        </div>

        {/* Type Filter Tabs */}
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={() => setSelectedType("All")}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
              selectedType === "All"
                ? "bg-[#1E3A8A] text-white"
                : "bg-gray-100 text-[#6B7280] hover:bg-gray-200"
            }`}
            style={{ fontWeight: 500 }}
          >
            All ({typeCounts["All"]})
          </button>
          {AGENCY_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                selectedType === type
                  ? "bg-[#1E3A8A] text-white"
                  : "bg-gray-100 text-[#6B7280] hover:bg-gray-200"
              }`}
              style={{ fontWeight: 500 }}
            >
              {type} ({typeCounts[type]})
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <p className="text-sm text-[#6B7280] mb-4">
        Showing {filteredAgencies.length} agenc
        {filteredAgencies.length !== 1 ? "ies" : "y"}
      </p>

      {/* Agency Cards Grid */}
      {filteredAgencies.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-[#6B7280]" style={{ fontWeight: 500 }}>
            No agencies found matching your search
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Try adjusting your search terms or filters
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAgencies.map((agency) => {
            const Icon = getAgencyIcon(agency.type);
            const colors = getAgencyColor(agency.type);
            return (
              <div
                key={agency.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:-translate-y-0.5 transition-all group"
              >
                {/* Agency Icon & Type */}
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`w-14 h-14 rounded-xl ${colors.bg} flex items-center justify-center`}
                  >
                    <Icon className={`w-7 h-7 ${colors.text}`} />
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs ${colors.badge}`}
                    style={{ fontWeight: 500 }}
                  >
                    {agency.type}
                  </span>
                </div>

                {/* Agency Name */}
                <h3
                  className="text-[#1E3A8A] mb-1"
                  style={{ fontSize: "1rem", fontWeight: 600 }}
                >
                  {agency.abbreviation}
                </h3>
                <p className="text-sm text-[#6B7280] mb-3 leading-snug">
                  {agency.name}
                </p>

                {/* Description */}
                <p className="text-sm text-[#6B7280] mb-4 line-clamp-2">
                  {agency.description}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-1 text-sm text-[#6B7280] mb-5">
                  <BookMarked className="w-4 h-4" />
                  <span style={{ fontWeight: 500 }}>
                    {agency.publications} Research Publications
                  </span>
                </div>

                {/* Button */}
                <Link
                  to={`/agencies/${agency.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1E3A8A] text-white text-sm rounded-lg hover:bg-[#1E3A8A]/90 transition-colors w-full justify-center"
                  style={{ fontWeight: 500 }}
                >
                  View Agency Profile
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
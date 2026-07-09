import {
  Search,
  FileText,
  Building2,
  Target,
  Calendar,
  ArrowRight,
  TrendingUp,
  Users,
  BookMarked,
  Layers,
} from "lucide-react";
import { Link } from "react-router";
import { SDG_DATA, AGENCIES, RESEARCH_DATA, STATISTICS, SDG_RESEARCH_COUNTS } from "../data/mock-data";
import { ImageWithFallback } from "./figma/ImageWithFallback";

function ResearchCard({ research }: { research: (typeof RESEARCH_DATA)[0] }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex flex-wrap gap-2 mb-3">
        {research.sdgs.map((sdgNum) => {
          const sdg = SDG_DATA.find((s) => s.number === sdgNum);
          return (
            <span
              key={sdgNum}
              className="px-2 py-0.5 rounded-full text-white text-xs"
              style={{ backgroundColor: sdg?.color, fontWeight: 500 }}
            >
              SDG {sdgNum}
            </span>
          );
        })}
      </div>
      <h3 className="text-[#1E3A8A] mb-2 leading-snug" style={{ fontSize: "1rem", fontWeight: 600 }}>
        {research.title}
      </h3>
      <p className="text-xs text-[#6B7280] mb-1">
        {research.authors.join(", ")}
      </p>
      <div className="flex items-center gap-3 text-xs text-[#6B7280] mb-3">
        <span className="flex items-center gap-1">
          <Building2 className="w-3 h-3" />
          {research.agencyAbbr}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {research.year}
        </span>
      </div>
      <p className="text-sm text-[#6B7280] mb-4 line-clamp-3">
        {research.abstract}
      </p>
      <Link
        to={`/research/${research.id}`}
        className="inline-flex items-center gap-1 text-sm text-[#1E3A8A] hover:underline"
        style={{ fontWeight: 500 }}
      >
        View Research <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ElementType;
  value: number;
  label: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
      <div className="w-12 h-12 rounded-full bg-[#1E3A8A]/10 flex items-center justify-center mx-auto mb-3">
        <Icon className="w-6 h-6 text-[#1E3A8A]" />
      </div>
      <p className="text-[#1E3A8A] mb-1" style={{ fontSize: "1.75rem", fontWeight: 700 }}>
        {value.toLocaleString()}
      </p>
      <p className="text-sm text-[#6B7280]">{label}</p>
    </div>
  );
}

export function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#1E3A8A] via-[#1E3A8A] to-[#2D4BA0] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1765969934461-2f945e5aacb8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhY2FkZW1pYyUyMHJlc2VhcmNoJTIwbGlicmFyeSUyMGJvb2tzfGVufDF8fHx8MTc3MjY3Mjc3MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="Research background"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#1E3A8A]/90 to-[#1E3A8A]/70" />
        <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 py-14 sm:py-20 md:py-28">
          <div className="max-w-2xl">
            <h1 className="text-white mb-4 text-2xl sm:text-3xl md:text-4xl" style={{ fontWeight: 700, lineHeight: 1.2 }}>
              Regionwide Integrated Knowledge Management System
            </h1>
            <p className="text-blue-100 mb-8 text-base sm:text-lg leading-relaxed">
              A regional platform for discovering research studies across government agencies and research institutions in the Davao Region.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/browse"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-[#1E3A8A] rounded-lg hover:bg-blue-50 transition-colors w-full sm:w-auto"
                style={{ fontWeight: 600, fontSize: "0.9rem" }}
              >
                <Search className="w-4 h-4" />
                Browse Research
              </Link>
              <Link
                to="/agencies"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/15 text-white border border-white/30 rounded-lg hover:bg-white/25 transition-colors w-full sm:w-auto"
                style={{ fontWeight: 600, fontSize: "0.9rem" }}
              >
                <Building2 className="w-4 h-4" />
                View Participating Agencies
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 -mt-8 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={FileText} value={STATISTICS.totalResearch} label="Total Research Studies" />
          <StatCard icon={Building2} value={STATISTICS.participatingAgencies} label="Participating Agencies" />
          <StatCard icon={Layers} value={STATISTICS.sdgsCovered} label="Research Categories" />
          <StatCard icon={TrendingUp} value={STATISTICS.latestPublications} label="Latest Publications" />
        </div>
      </section>

      {/* SDG Research Distribution Section */}
      <section className="bg-white py-10 sm:py-16">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-[#1E3A8A] mb-2 text-xl sm:text-2xl" style={{ fontWeight: 700 }}>
              Research Contributions to the Sustainable Development Goals
            </h2>
            <p className="text-[#6B7280] max-w-3xl mx-auto">
              Research studies in RIKMS are categorized according to the United Nations Sustainable Development Goals to highlight how regional research contributes to global development priorities.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {SDG_DATA.map((sdg) => {
              const count = SDG_RESEARCH_COUNTS[sdg.number] || 0;
              return (
                <Link
                  key={sdg.number}
                  to={`/browse?sdg=${sdg.number}`}
                  className="group rounded-xl p-5 text-white shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer flex flex-col justify-between min-h-[160px]"
                  style={{ backgroundColor: sdg.color }}
                >
                  <span
                    className="text-white/60 self-start"
                    style={{ fontSize: "2rem", fontWeight: 700, lineHeight: 1 }}
                  >
                    {sdg.number}
                  </span>
                  <div>
                    <p
                      className="text-white mb-3 leading-snug"
                      style={{ fontSize: "0.85rem", fontWeight: 600 }}
                    >
                      {sdg.title}
                    </p>
                    <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1 w-fit">
                      <FileText className="w-3 h-3 text-white/80" />
                      <span className="text-xs text-white/90" style={{ fontWeight: 500 }}>
                        {count} Research Papers
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Research Section */}
      <section className="bg-white py-10 sm:py-16">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-3">
            <div>
              <h2 className="text-[#1E3A8A] mb-1 text-xl sm:text-2xl" style={{ fontWeight: 700 }}>
                Featured Research
              </h2>
              <p className="text-[#6B7280]">
                Latest and most impactful research publications
              </p>
            </div>
            <Link
              to="/browse"
              className="hidden md:inline-flex items-center gap-1 text-sm text-[#1E3A8A] hover:underline"
              style={{ fontWeight: 500 }}
            >
              View all research <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {RESEARCH_DATA.slice(0, 6).map((research) => (
              <ResearchCard key={research.id} research={research} />
            ))}
          </div>
        </div>
      </section>

      {/* Participating Agencies Section */}
      <section id="agencies" className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="text-center mb-10">
          <h2 className="text-[#1E3A8A] mb-2 text-xl sm:text-2xl" style={{ fontWeight: 700 }}>
            Participating Agencies in Davao Region
          </h2>
          <p className="text-[#6B7280]">
            Government agencies and research consortia contributing to the regional knowledge base
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {AGENCIES.map((agency) => (
            <Link
              to={`/agencies/${agency.id}`}
              key={agency.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="w-14 h-14 rounded-full bg-[#1E3A8A]/10 flex items-center justify-center mx-auto mb-3">
                <Users className="w-7 h-7 text-[#1E3A8A]" />
              </div>
              <p className="text-[#1E3A8A] mb-0.5" style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                {agency.abbreviation}
              </p>
              <p className="text-xs text-[#6B7280] mb-2 line-clamp-2">{agency.name}</p>
              <div className="flex items-center justify-center gap-1 text-xs text-[#6B7280]">
                <BookMarked className="w-3 h-3" />
                {agency.publications} publications
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
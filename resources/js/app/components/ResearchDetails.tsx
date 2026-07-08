import { useParams, Link } from "react-router";
import {
  ArrowLeft,
  Download,
  Building2,
  Calendar,
  FileText,
  Hash,
  Eye,
  Share2,
  Bookmark,
} from "lucide-react";
import { RESEARCH_DATA, SDG_DATA } from "../data/mock-data";

export function ResearchDetails() {
  const { id } = useParams();
  const research = RESEARCH_DATA.find((r) => r.id === Number(id));

  if (!research) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-16 text-center">
        <h2 className="text-[#1E3A8A] mb-4" style={{ fontSize: "1.5rem", fontWeight: 700 }}>
          Research Not Found
        </h2>
        <p className="text-[#6B7280] mb-6">
          The research paper you are looking for does not exist.
        </p>
        <Link
          to="/browse"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#1E3A8A] text-white rounded-lg hover:bg-[#1E3A8A]/90 transition-colors"
          style={{ fontWeight: 500 }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Browse
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-6 overflow-x-auto">
        <Link to="/" className="hover:text-[#1E3A8A]">Home</Link>
        <span>/</span>
        <Link to="/browse" className="hover:text-[#1E3A8A]">Browse Research</Link>
        <span>/</span>
        <span className="text-[#1E3A8A] truncate max-w-xs">{research.title}</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column - Main Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            {/* SDG Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {research.sdgs.map((sdgNum) => {
                const sdg = SDG_DATA.find((s) => s.number === sdgNum);
                return (
                  <span
                    key={sdgNum}
                    className="px-3 py-1 rounded-full text-white text-xs"
                    style={{ backgroundColor: sdg?.color, fontWeight: 500 }}
                  >
                    SDG {sdgNum}: {sdg?.title}
                  </span>
                );
              })}
            </div>

            {/* Title */}
            <h1 className="text-[#1E3A8A] mb-4 text-xl sm:text-2xl" style={{ fontWeight: 700, lineHeight: 1.3 }}>
              {research.title}
            </h1>

            {/* Authors */}
            <div className="mb-6">
              <h3 className="text-sm text-[#6B7280] mb-1" style={{ fontWeight: 600 }}>
                Authors
              </h3>
              <p className="text-[#1E3A8A]" style={{ fontWeight: 500 }}>
                {research.authors.join(", ")}
              </p>
            </div>

            {/* Agency */}
            <div className="mb-6">
              <h3 className="text-sm text-[#6B7280] mb-1" style={{ fontWeight: 600 }}>
                Agency
              </h3>
              <p className="text-[#1E3A8A] flex items-center gap-2" style={{ fontWeight: 500 }}>
                <Building2 className="w-4 h-4" />
                {research.agency}
              </p>
            </div>

            {/* Abstract */}
            <div className="mb-6">
              <h3 className="text-sm text-[#6B7280] mb-2" style={{ fontWeight: 600 }}>
                Abstract
              </h3>
              <p className="text-[#374151] leading-relaxed">
                {research.abstract}
              </p>
              <p className="text-[#374151] leading-relaxed mt-3">
                The findings of this research contribute to the existing body of knowledge and provide actionable recommendations for policymakers, practitioners, and stakeholders. The methodology employed includes both quantitative and qualitative approaches, ensuring a comprehensive understanding of the subject matter.
              </p>
            </div>

            {/* Keywords */}
            <div className="mb-6">
              <h3 className="text-sm text-[#6B7280] mb-2" style={{ fontWeight: 600 }}>
                Keywords
              </h3>
              <div className="flex flex-wrap gap-2">
                {research.keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="px-3 py-1 bg-gray-100 text-[#6B7280] text-sm rounded-full"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-4 border-t border-gray-100">
              <button
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#1E3A8A] text-white rounded-lg hover:bg-[#1E3A8A]/90 transition-colors w-full sm:w-auto"
                style={{ fontWeight: 600 }}
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>
              <button className="inline-flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 text-[#6B7280] rounded-lg hover:bg-gray-50 transition-colors text-sm w-full sm:w-auto">
                <Share2 className="w-4 h-4" />
                Share
              </button>
              <button className="inline-flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 text-[#6B7280] rounded-lg hover:bg-gray-50 transition-colors text-sm w-full sm:w-auto">
                <Bookmark className="w-4 h-4" />
                Save
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Metadata Card */}
        <div className="lg:w-80 shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
            <h3 className="text-[#1E3A8A] mb-4 pb-3 border-b border-gray-100" style={{ fontSize: "1rem", fontWeight: 600 }}>
              Research Metadata
            </h3>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Building2 className="w-4 h-4 text-[#6B7280] mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-[#6B7280]" style={{ fontWeight: 500 }}>Agency</p>
                  <p className="text-sm text-[#1E3A8A]" style={{ fontWeight: 500 }}>{research.agency}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-[#6B7280] mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-[#6B7280]" style={{ fontWeight: 500 }}>Publication Year</p>
                  <p className="text-sm text-[#1E3A8A]" style={{ fontWeight: 500 }}>{research.year}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Hash className="w-4 h-4 text-[#6B7280] mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-[#6B7280]" style={{ fontWeight: 500 }}>DOI</p>
                  <p className="text-sm text-[#1E3A8A] break-all" style={{ fontWeight: 500 }}>{research.doi}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileText className="w-4 h-4 text-[#6B7280] mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-[#6B7280]" style={{ fontWeight: 500 }}>File Type</p>
                  <p className="text-sm text-[#1E3A8A]" style={{ fontWeight: 500 }}>{research.fileType}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Download className="w-4 h-4 text-[#6B7280] mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-[#6B7280]" style={{ fontWeight: 500 }}>Downloads</p>
                  <p className="text-sm text-[#1E3A8A]" style={{ fontWeight: 500 }}>
                    {research.downloads.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Eye className="w-4 h-4 text-[#6B7280] mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-[#6B7280]" style={{ fontWeight: 500 }}>Category</p>
                  <p className="text-sm text-[#1E3A8A]" style={{ fontWeight: 500 }}>{research.category}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100">
              <h4 className="text-xs text-[#6B7280] mb-2" style={{ fontWeight: 600 }}>
                Aligned SDGs
              </h4>
              <div className="flex flex-wrap gap-2">
                {research.sdgs.map((sdgNum) => {
                  const sdg = SDG_DATA.find((s) => s.number === sdgNum);
                  return (
                    <div
                      key={sdgNum}
                      className="w-8 h-8 rounded-md flex items-center justify-center text-white text-xs"
                      style={{ backgroundColor: sdg?.color, fontWeight: 700 }}
                    >
                      {sdgNum}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router";
import {
  ChevronRight,
  Save,
  FileText,
  Upload,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Clock,
  Archive,
  Globe,
  Lock,
  ShieldCheck,
  FileWarning,
  ExternalLink,
} from "lucide-react";
import { RESEARCH_DATA, SDG_DATA, RESEARCH_CATEGORIES } from "../../data/mock-data";

type ResearchStatus = "Draft" | "Published" | "Archived";
type AccessPolicy = "Public Download" | "Request Access" | "Restricted" | "Embargo";

interface VersionEntry {
  version: number;
  label: string;
  date: string;
  user: string;
}

const MOCK_VERSIONS: VersionEntry[] = [
  { version: 1, label: "Uploaded", date: "2025-01-15", user: "Agency Admin" },
  { version: 2, label: "Metadata Updated", date: "2025-02-03", user: "Agency Admin" },
  { version: 3, label: "SDG Tags Added", date: "2025-02-10", user: "Agency Admin" },
];

function StatusBadge({ status }: { status: ResearchStatus }) {
  const cfg = {
    Draft: "bg-gray-100 text-gray-600 border-gray-200",
    Published: "bg-green-50 text-green-700 border-green-200",
    Archived: "bg-red-50 text-red-600 border-red-200",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border ${cfg[status]}`} style={{ fontWeight: 500 }}>
      {status === "Draft" && <Clock className="w-3 h-3" />}
      {status === "Published" && <Globe className="w-3 h-3" />}
      {status === "Archived" && <Archive className="w-3 h-3" />}
      {status}
    </span>
  );
}

function AccessPolicyBadge({ policy }: { policy: AccessPolicy }) {
  const cfg: Record<AccessPolicy, { icon: React.ElementType; style: string }> = {
    "Public Download": { icon: Globe, style: "bg-green-50 text-green-700 border-green-200" },
    "Request Access": { icon: ShieldCheck, style: "bg-amber-50 text-amber-700 border-amber-200" },
    Restricted: { icon: Lock, style: "bg-red-50 text-red-600 border-red-200" },
    Embargo: { icon: FileWarning, style: "bg-purple-50 text-purple-600 border-purple-200" },
  };
  const { icon: Icon, style } = cfg[policy];
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border ${style}`} style={{ fontWeight: 500 }}>
      <Icon className="w-3 h-3" />
      {policy}
    </span>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[#1E3A8A] mb-4 pb-2 border-b border-gray-100" style={{ fontSize: "0.9rem", fontWeight: 700 }}>
      {children}
    </h3>
  );
}

function FieldLabel({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
  return (
    <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 500 }}>
      {children}
      {optional && <span className="text-gray-400 text-xs ml-1">(optional)</span>}
    </label>
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function ResearchMetadata() {
  const { id } = useParams();
  const navigate = useNavigate();
  const research = RESEARCH_DATA.find((r) => r.id === Number(id));

  // Form state
  const [title, setTitle] = useState(research?.title ?? "");
  const [authors, setAuthors] = useState<string[]>(research?.authors ?? []);
  const [newAuthor, setNewAuthor] = useState("");
  const [abstract, setAbstract] = useState(research?.abstract ?? "");
  const [keywords, setKeywords] = useState<string[]>(research?.keywords ?? []);
  const [newKeyword, setNewKeyword] = useState("");
  const [year, setYear] = useState(research?.year ?? 2025);
  const [category, setCategory] = useState(research?.category ?? "");
  const [selectedSdgs, setSelectedSdgs] = useState<number[]>(research?.sdgs ?? []);
  const [publisher, setPublisher] = useState(research?.agencyAbbr ?? "DOST XI");
  const [doi, setDoi] = useState(research?.doi ?? "");
  const [externalLink, setExternalLink] = useState("");
  const [status, setStatus] = useState<ResearchStatus>("Published");
  const [accessPolicy, setAccessPolicy] = useState<AccessPolicy>("Request Access");
  const [versionOpen, setVersionOpen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [saving, setSaving] = useState(false);
  const [savedToast, setSavedToast] = useState<string | null>(null);

  // File info
  const fileName = `${(research?.title ?? "research").replace(/\s+/g, "_").substring(0, 40)}.pdf`;
  const fileSize = "2.4 MB";
  const uploadDate = "Jan 15, 2025";

  const handleAddAuthor = () => {
    if (newAuthor.trim() && !authors.includes(newAuthor.trim())) {
      setAuthors([...authors, newAuthor.trim()]);
      setNewAuthor("");
    }
  };
  const removeAuthor = (i: number) => setAuthors(authors.filter((_, idx) => idx !== i));

  const handleAddKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim().toLowerCase())) {
      setKeywords([...keywords, newKeyword.trim().toLowerCase()]);
      setNewKeyword("");
    }
  };
  const removeKeyword = (i: number) => setKeywords(keywords.filter((_, idx) => idx !== i));

  const toggleSdg = (n: number) => {
    setSelectedSdgs((prev) => (prev.includes(n) ? prev.filter((s) => s !== n) : [...prev, n]));
  };

  const showToast = (msg: string) => {
    setSavedToast(msg);
    setTimeout(() => setSavedToast(null), 3000);
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      showToast("Changes saved successfully.");
    }, 800);
  };

  const handleSaveDraft = () => {
    setStatus("Draft");
    showToast("Saved as draft.");
  };

  const handlePublish = () => {
    setStatus("Published");
    showToast("Research published successfully.");
  };

  const handleArchive = () => {
    setStatus("Archived");
    showToast("Research archived.");
  };

  if (!research) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <FileText className="w-12 h-12 text-gray-300 mb-4" />
        <h2 className="text-gray-700 mb-2" style={{ fontSize: "1.1rem", fontWeight: 600 }}>Research Not Found</h2>
        <p className="text-sm text-gray-500 mb-6">The research record you're looking for doesn't exist.</p>
        <button onClick={() => navigate("/agency/research")} className="px-4 py-2 text-sm bg-[#1E3A8A] text-white rounded-lg hover:bg-[#1E3A8A]/90 transition-colors" style={{ fontWeight: 500 }}>
          Back to Repository
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Toast */}
      {savedToast && (
        <div className="fixed top-20 right-6 z-[100] bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm animate-[fadeIn_0.2s_ease]" style={{ fontWeight: 500 }}>
          <Save className="w-4 h-4" />
          {savedToast}
        </div>
      )}

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-500 flex-wrap">
        <Link to="/agency/dashboard" className="hover:text-[#1E3A8A] transition-colors">Agency</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/agency/research" className="hover:text-[#1E3A8A] transition-colors">Research Repository</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-[#1E3A8A]" style={{ fontWeight: 500 }}>Edit Research</span>
      </nav>

      {/* Page Header */}
      <div>
        <h1 className="text-[#1E3A8A] mb-1" style={{ fontSize: "1.5rem", fontWeight: 700 }}>
          Research Metadata Management
        </h1>
        <p className="text-[#6B7280] text-sm">
          Review and update the metadata associated with this research publication.
        </p>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* LEFT — Metadata Form (70%) */}
        <div className="flex-1 lg:w-[70%] space-y-6">
          {/* Section 1 — Basic Information */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 lg:p-6">
            <SectionTitle>Basic Information</SectionTitle>
            <div className="space-y-5">
              {/* Title */}
              <div>
                <FieldLabel>Research Title</FieldLabel>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#F9FAFB] border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]/40"
                />
              </div>

              {/* Authors */}
              <div>
                <FieldLabel>Authors</FieldLabel>
                <div className="flex flex-wrap gap-2 mb-2">
                  {authors.map((a, i) => (
                    <span key={`author-${i}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1E3A8A]/5 text-[#1E3A8A] rounded-lg text-xs" style={{ fontWeight: 500 }}>
                      {a}
                      <button onClick={() => removeAuthor(i)} className="hover:text-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddAuthor())}
                    placeholder="Add author name..."
                    className="flex-1 px-4 py-2 bg-[#F9FAFB] border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]/40"
                  />
                  <button onClick={handleAddAuthor} className="px-3 py-2 bg-[#1E3A8A]/10 text-[#1E3A8A] rounded-lg hover:bg-[#1E3A8A]/20 transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Abstract */}
              <div>
                <FieldLabel>Abstract</FieldLabel>
                <textarea
                  value={abstract}
                  onChange={(e) => setAbstract(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-2.5 bg-[#F9FAFB] border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]/40 resize-none"
                />
              </div>

              {/* Keywords */}
              <div>
                <FieldLabel>Keywords</FieldLabel>
                <div className="flex flex-wrap gap-2 mb-2">
                  {keywords.map((k, i) => (
                    <span key={`kw-${i}`} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-xs" style={{ fontWeight: 500 }}>
                      {k}
                      <button onClick={() => removeKeyword(i)} className="hover:text-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddKeyword())}
                    placeholder="Add keyword..."
                    className="flex-1 px-4 py-2 bg-[#F9FAFB] border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]/40"
                  />
                  <button onClick={handleAddKeyword} className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Publication Year */}
              <div>
                <FieldLabel>Publication Year</FieldLabel>
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full max-w-[180px] px-4 py-2.5 bg-[#F9FAFB] border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20"
                >
                  {[2026, 2025, 2024, 2023, 2022, 2021, 2020].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2 — Research Classification */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 lg:p-6">
            <SectionTitle>Research Classification</SectionTitle>
            <div className="space-y-5">
              {/* Category */}
              <div>
                <FieldLabel>Research Category</FieldLabel>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full max-w-xs px-4 py-2.5 bg-[#F9FAFB] border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20"
                >
                  <option value="">Select category...</option>
                  {RESEARCH_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* SDG Tags */}
              <div>
                <FieldLabel>SDG Tags</FieldLabel>
                <p className="text-xs text-gray-400 mb-3">Select the Sustainable Development Goals relevant to this research.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {SDG_DATA.map((sdg) => {
                    const active = selectedSdgs.includes(sdg.number);
                    return (
                      <button
                        key={sdg.number}
                        type="button"
                        onClick={() => toggleSdg(sdg.number)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs text-left transition-all ${
                          active
                            ? "border-current shadow-sm"
                            : "border-gray-200 bg-[#F9FAFB] hover:border-gray-300"
                        }`}
                        style={
                          active
                            ? { backgroundColor: `${sdg.color}15`, color: sdg.color, borderColor: sdg.color, fontWeight: 600 }
                            : { fontWeight: 400, color: "#6B7280" }
                        }
                      >
                        <span
                          className="w-6 h-6 rounded flex items-center justify-center text-white shrink-0"
                          style={{ backgroundColor: sdg.color, fontSize: "0.65rem", fontWeight: 700 }}
                        >
                          {sdg.number}
                        </span>
                        <span className="truncate">{sdg.title}</span>
                      </button>
                    );
                  })}
                </div>
                {selectedSdgs.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    {selectedSdgs.length} SDG{selectedSdgs.length > 1 ? "s" : ""} selected
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 3 — Publication Information */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 lg:p-6">
            <SectionTitle>Publication Information</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <FieldLabel>Publisher / Institution</FieldLabel>
                <input
                  type="text"
                  value={publisher}
                  onChange={(e) => setPublisher(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#F9FAFB] border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]/40"
                  readOnly
                />
                <p className="text-xs text-gray-400 mt-1">Auto-filled from agency profile.</p>
              </div>
              <div>
                <FieldLabel optional>DOI</FieldLabel>
                <input
                  type="text"
                  value={doi}
                  onChange={(e) => setDoi(e.target.value)}
                  placeholder="e.g. 10.1234/rikms.2025.001"
                  className="w-full px-4 py-2.5 bg-[#F9FAFB] border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]/40"
                />
              </div>
              <div className="sm:col-span-2">
                <FieldLabel optional>External Link</FieldLabel>
                <input
                  type="url"
                  value={externalLink}
                  onChange={(e) => setExternalLink(e.target.value)}
                  placeholder="https://example.com/research-paper"
                  className="w-full px-4 py-2.5 bg-[#F9FAFB] border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]/40"
                />
                <p className="text-xs text-gray-400 mt-1">Link to external hosting if the research is published elsewhere.</p>
              </div>
            </div>
          </div>

          {/* Section 4 — File Information */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 lg:p-6">
            <SectionTitle>File Information</SectionTitle>
            <div className="flex items-start gap-4 p-4 bg-[#F9FAFB] rounded-lg border border-gray-100">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 truncate" style={{ fontWeight: 500 }}>{fileName}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span>{fileSize}</span>
                  <span>•</span>
                  <span>Uploaded {uploadDate}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button className="inline-flex items-center gap-1.5 px-3 py-2 text-xs bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors" style={{ fontWeight: 500 }}>
                  <Upload className="w-3.5 h-3.5" /> Replace File
                </button>
                <button className="inline-flex items-center gap-1.5 px-3 py-2 text-xs bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors" style={{ fontWeight: 500 }}>
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
              </div>
            </div>
          </div>

          {/* Version History */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <button
              onClick={() => setVersionOpen(!versionOpen)}
              className="w-full flex items-center justify-between px-5 lg:px-6 py-4 hover:bg-gray-50 transition-colors"
            >
              <span className="text-[#1E3A8A] text-sm" style={{ fontWeight: 700 }}>Version History</span>
              {versionOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {versionOpen && (
              <div className="px-5 lg:px-6 pb-5 space-y-3">
                {MOCK_VERSIONS.map((v) => (
                  <div key={v.version} className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-[#1E3A8A]/10 flex items-center justify-center shrink-0">
                      <span className="text-[#1E3A8A] text-xs" style={{ fontWeight: 700 }}>v{v.version}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-800" style={{ fontWeight: 500 }}>{v.label}</p>
                      <p className="text-xs text-gray-400">
                        {formatDate(v.date)} by {v.user}
                      </p>
                    </div>
                  </div>
                ))}
                <Link
                  to={`/agency/research/${id}/versions`}
                  className="mt-2 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-[#1E3A8A]/10 text-[#1E3A8A] rounded-lg hover:bg-[#1E3A8A]/20 transition-colors"
                  style={{ fontWeight: 500 }}
                >
                  Manage Versions & Drafts
                </Link>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 lg:p-6">
            <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm bg-[#1E3A8A] text-white rounded-lg hover:bg-[#1E3A8A]/90 transition-colors disabled:opacity-50"
                style={{ fontWeight: 500 }}
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={handleSaveDraft}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                style={{ fontWeight: 500 }}
              >
                <Clock className="w-4 h-4" />
                Save as Draft
              </button>
              <button
                onClick={handlePublish}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                style={{ fontWeight: 500 }}
              >
                <Globe className="w-4 h-4" />
                Publish Research
              </button>
              <button
                onClick={handleArchive}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                style={{ fontWeight: 500 }}
              >
                <Archive className="w-4 h-4" />
                Archive Research
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT — Preview Panel (30%) */}
        <div className="lg:w-[30%] space-y-5">
          {/* Document Preview */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-[#1E3A8A] text-sm" style={{ fontWeight: 700 }}>Document Preview</h3>
            </div>
            <div className="p-4">
              {/* Simulated PDF preview */}
              <div
                className="bg-[#F9FAFB] border border-gray-200 rounded-lg overflow-hidden flex flex-col items-center justify-center relative"
                style={{ minHeight: "320px" }}
              >
                <div className="w-full h-full p-6 flex flex-col items-center justify-start text-center" style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}>
                  <div className="w-16 h-16 bg-red-100 rounded-xl flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 text-red-500" />
                  </div>
                  <p className="text-xs text-gray-800 px-2 mb-2" style={{ fontWeight: 600, lineHeight: 1.4 }}>
                    {title || "Untitled Research"}
                  </p>
                  <p className="text-[10px] text-gray-500 mb-1">{authors.join(", ") || "No authors"}</p>
                  <p className="text-[10px] text-gray-400">{publisher} • {year}</p>
                  <div className="mt-4 w-full space-y-1.5">
                    {[...Array(8)].map((_, i) => (
                      <div key={`line-${i}`} className="h-1.5 bg-gray-200 rounded-full mx-auto" style={{ width: `${70 + Math.random() * 25}%` }} />
                    ))}
                  </div>
                </div>
              </div>
              {/* Zoom Controls */}
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setZoom(Math.max(50, zoom - 10))}
                    className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 transition-colors"
                    title="Zoom out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-gray-500 w-10 text-center">{zoom}%</span>
                  <button
                    onClick={() => setZoom(Math.min(150, zoom + 10))}
                    className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 transition-colors"
                    title="Zoom in"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>
                <button className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-[#1E3A8A] hover:bg-[#1E3A8A]/5 rounded-md transition-colors" style={{ fontWeight: 500 }}>
                  <Maximize2 className="w-3.5 h-3.5" /> Full Preview
                </button>
              </div>
            </div>
          </div>

          {/* Research Status */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-[#1E3A8A] text-sm" style={{ fontWeight: 700 }}>Research Status</h3>
            </div>
            <div className="p-5 space-y-4">
              <StatusBadge status={status} />
              <div className="space-y-2">
                {(["Draft", "Published", "Archived"] as ResearchStatus[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${
                      status === s ? "bg-[#1E3A8A]/5 text-[#1E3A8A] border border-[#1E3A8A]/20" : "text-gray-600 hover:bg-gray-50 border border-transparent"
                    }`}
                    style={{ fontWeight: status === s ? 600 : 400 }}
                  >
                    {s === "Draft" && <Clock className="w-4 h-4 text-gray-400" />}
                    {s === "Published" && <Globe className="w-4 h-4 text-green-500" />}
                    {s === "Archived" && <Archive className="w-4 h-4 text-red-400" />}
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Access Control Quick Settings */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-[#1E3A8A] text-sm" style={{ fontWeight: 700 }}>Access Control</h3>
            </div>
            <div className="p-5 space-y-4">
              <AccessPolicyBadge policy={accessPolicy} />
              <div className="space-y-2">
                {(["Public Download", "Request Access", "Restricted", "Embargo"] as AccessPolicy[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setAccessPolicy(p)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${
                      accessPolicy === p ? "bg-[#1E3A8A]/5 text-[#1E3A8A] border border-[#1E3A8A]/20" : "text-gray-600 hover:bg-gray-50 border border-transparent"
                    }`}
                    style={{ fontWeight: accessPolicy === p ? 600 : 400 }}
                  >
                    {p === "Public Download" && <Globe className="w-4 h-4 text-green-500" />}
                    {p === "Request Access" && <ShieldCheck className="w-4 h-4 text-amber-500" />}
                    {p === "Restricted" && <Lock className="w-4 h-4 text-red-400" />}
                    {p === "Embargo" && <FileWarning className="w-4 h-4 text-purple-500" />}
                    {p}
                  </button>
                ))}
              </div>
              <Link
                to={`/agency/research/${id}/access-control`}
                className="inline-flex items-center gap-1.5 text-sm text-[#1E3A8A] hover:underline mt-2"
                style={{ fontWeight: 500 }}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Manage Access
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
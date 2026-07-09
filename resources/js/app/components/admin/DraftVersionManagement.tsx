import { useState } from "react";
import { Link, useParams } from "react-router";
import {
  ChevronRight,
  FileText,
  Upload,
  Pencil,
  CheckCircle2,
  Download,
  Eye,
  RotateCcw,
  Save,
  Globe,
  Archive,
  Clock,
  X,
  ArrowLeftRight,
  FilePlus,
  AlertCircle,
  File,
  User,
} from "lucide-react";

/* ──────────── Types ──────────── */

type ResearchStatus = "Draft" | "Published" | "Archived";

interface VersionEntry {
  id: number;
  version: string;
  description: string;
  editor: string;
  dateTime: string;
  actionIcon: React.ElementType;
  actionColor: string;
  actionBg: string;
}

interface ComparisonField {
  field: string;
  oldValue: string;
  newValue: string;
  changed: boolean;
}

/* ──────────── Mock Data ──────────── */

const RESEARCH_DRAFT = {
  title: "Climate Adaptation Strategies in Davao Agriculture",
  currentVersion: "3.0",
  lastEdited: "March 6, 2026 – 10:45 AM",
  editedBy: "Agency Admin",
  status: "Draft" as ResearchStatus,
  fileName: "climate_adaptation_research_v3.pdf",
  fileSize: "4.2 MB",
  uploadDate: "March 6, 2026",
};

const VERSION_HISTORY: VersionEntry[] = [
  { id: 1, version: "3.0", description: "Metadata Updated", editor: "Agency Admin", dateTime: "Mar 6, 2026 – 10:45 AM", actionIcon: Pencil, actionColor: "#1E3A8A", actionBg: "#DBEAFE" },
  { id: 2, version: "2.1", description: "Document Replaced", editor: "Agency Admin", dateTime: "Mar 4, 2026 – 3:20 PM", actionIcon: Upload, actionColor: "#7C3AED", actionBg: "#EDE9FE" },
  { id: 3, version: "2.0", description: "Research Published", editor: "Agency Admin", dateTime: "Feb 28, 2026 – 9:00 AM", actionIcon: CheckCircle2, actionColor: "#16A34A", actionBg: "#DCFCE7" },
  { id: 4, version: "1.2", description: "Abstract and Keywords Updated", editor: "Agency Admin", dateTime: "Feb 25, 2026 – 2:15 PM", actionIcon: Pencil, actionColor: "#1E3A8A", actionBg: "#DBEAFE" },
  { id: 5, version: "1.1", description: "New Document Uploaded", editor: "Agency Admin", dateTime: "Feb 20, 2026 – 11:30 AM", actionIcon: Upload, actionColor: "#7C3AED", actionBg: "#EDE9FE" },
  { id: 6, version: "1.0", description: "Initial Draft Created", editor: "Agency Admin", dateTime: "Feb 15, 2026 – 8:00 AM", actionIcon: FilePlus, actionColor: "#0284C7", actionBg: "#E0F2FE" },
];

const COMPARISON_DATA: ComparisonField[] = [
  { field: "Title", oldValue: "Climate Adaptation in Davao Agriculture", newValue: "Climate Adaptation Strategies in Davao Agriculture", changed: true },
  { field: "Abstract", oldValue: "This study explores climate adaptation...", newValue: "This comprehensive study examines climate adaptation strategies...", changed: true },
  { field: "Keywords", oldValue: "climate, adaptation, agriculture", newValue: "climate, adaptation, agriculture, Davao Region, resilience", changed: true },
  { field: "Authors", oldValue: "Dr. Juan Dela Cruz, Maria Santos", newValue: "Dr. Juan Dela Cruz, Maria Santos", changed: false },
  { field: "Category", oldValue: "Agriculture & Food Security", newValue: "Agriculture & Food Security", changed: false },
  { field: "Document", oldValue: "climate_adaptation_research_v2.pdf (3.8 MB)", newValue: "climate_adaptation_research_v3.pdf (4.2 MB)", changed: true },
];

/* ──────────── Helpers ──────────── */

function StatusBadge({ status }: { status: ResearchStatus }) {
  const styles: Record<ResearchStatus, string> = {
    Draft: "bg-amber-50 text-amber-700 border-amber-200",
    Published: "bg-green-50 text-green-700 border-green-200",
    Archived: "bg-gray-100 text-gray-500 border-gray-200",
  };
  const icons: Record<ResearchStatus, React.ElementType> = {
    Draft: Pencil,
    Published: Globe,
    Archived: Archive,
  };
  const Icon = icons[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border ${styles[status]}`} style={{ fontWeight: 600 }}>
      <Icon className="w-3 h-3" />
      {status}
    </span>
  );
}

/* ──────────── Component ──────────── */

export function DraftVersionManagement() {
  const { id } = useParams();
  const [status, setStatus] = useState<ResearchStatus>(RESEARCH_DRAFT.status);
  const [versions, setVersions] = useState(VERSION_HISTORY);
  const [showCompare, setShowCompare] = useState(false);
  const [restoredToast, setRestoredToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setRestoredToast(msg);
    setTimeout(() => setRestoredToast(null), 3000);
  };

  const handlePublish = () => {
    setStatus("Published");
    showToast("Research published successfully.");
  };

  const handleArchive = () => {
    setStatus("Archived");
    showToast("Research archived.");
  };

  const handleSaveDraft = () => {
    showToast("Draft saved successfully.");
  };

  const handleRestore = (version: VersionEntry) => {
    const newVer = {
      id: versions.length + 1,
      version: `${parseFloat(versions[0].version) + 0.1}`,
      description: `Restored from Version ${version.version}`,
      editor: "Agency Admin",
      dateTime: "Mar 6, 2026 – 11:00 AM",
      actionIcon: RotateCcw,
      actionColor: "#D97706",
      actionBg: "#FEF3C7",
    };
    setVersions([newVer, ...versions]);
    setStatus("Draft");
    showToast(`Restored to Version ${version.version}. A new draft version has been created.`);
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {restoredToast && (
        <div className="fixed top-20 right-6 z-[100] bg-green-600 text-white px-5 py-3 rounded-[10px] shadow-lg flex items-center gap-2 text-sm animate-[fadeIn_0.2s_ease]" style={{ fontWeight: 500 }}>
          <CheckCircle2 className="w-4 h-4" />
          {restoredToast}
        </div>
      )}

      {/* Compare Versions Modal */}
      {showCompare && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[90]" onClick={() => setShowCompare(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] w-[calc(100%-2rem)] max-w-2xl bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-[10px] bg-[#1E3A8A]/10 flex items-center justify-center">
                  <ArrowLeftRight className="w-4 h-4 text-[#1E3A8A]" />
                </div>
                <div>
                  <h3 className="text-[#1E3A8A]" style={{ fontSize: "1rem", fontWeight: 700 }}>Compare Versions</h3>
                  <p className="text-xs text-gray-400">Version 2.1 → Version 3.0</p>
                </div>
              </div>
              <button onClick={() => setShowCompare(false)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-5">
              <div className="space-y-3">
                {COMPARISON_DATA.map((item) => (
                  <div key={item.field} className={`rounded-[10px] border p-4 ${item.changed ? "border-amber-200 bg-amber-50/40" : "border-gray-100 bg-[#F9FAFB]"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-gray-500" style={{ fontWeight: 600 }}>{item.field}</span>
                      {item.changed ? (
                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] rounded" style={{ fontWeight: 600 }}>Changed</span>
                      ) : (
                        <span className="px-1.5 py-0.5 bg-gray-100 text-gray-400 text-[10px] rounded" style={{ fontWeight: 600 }}>Unchanged</span>
                      )}
                    </div>
                    {item.changed ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="rounded-lg bg-red-50 border border-red-100 p-3">
                          <p className="text-[10px] text-red-400 mb-1" style={{ fontWeight: 600 }}>PREVIOUS (v2.1)</p>
                          <p className="text-xs text-red-700 break-words">{item.oldValue}</p>
                        </div>
                        <div className="rounded-lg bg-green-50 border border-green-100 p-3">
                          <p className="text-[10px] text-green-500 mb-1" style={{ fontWeight: 600 }}>CURRENT (v3.0)</p>
                          <p className="text-xs text-green-700 break-words">{item.newValue}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">{item.oldValue}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end shrink-0">
              <button
                onClick={() => setShowCompare(false)}
                className="px-4 py-2 text-sm bg-[#1E3A8A] text-white rounded-[10px] hover:bg-[#1E3A8A]/90 transition-colors"
                style={{ fontWeight: 500 }}
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-500 flex-wrap">
        <Link to="/agency/dashboard" className="hover:text-[#1E3A8A] transition-colors">Agency</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/agency/research" className="hover:text-[#1E3A8A] transition-colors">Research Repository</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to={`/agency/research/${id || "1"}/edit`} className="hover:text-[#1E3A8A] transition-colors">Research Details</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-[#1E3A8A]" style={{ fontWeight: 500 }}>Versions</span>
      </nav>

      {/* Page Header + Publishing Status */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-[#1E3A8A] mb-1" style={{ fontSize: "1.5rem", fontWeight: 700 }}>
            Draft & Version Management
          </h1>
          <p className="text-[#6B7280] text-sm">
            Manage draft versions and track revision history for this research record.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-[10px] border border-gray-200 shadow-sm">
            <span className="text-xs text-gray-500" style={{ fontWeight: 500 }}>Current Status:</span>
            <StatusBadge status={status} />
          </div>
          <div className="flex items-center gap-2">
            {status !== "Published" && (
              <button
                onClick={handlePublish}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs bg-green-600 text-white rounded-[10px] hover:bg-green-700 transition-colors"
                style={{ fontWeight: 500 }}
              >
                <Globe className="w-3.5 h-3.5" /> Publish Version
              </button>
            )}
            {status !== "Archived" && (
              <button
                onClick={handleArchive}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs bg-white text-gray-600 border border-gray-200 rounded-[10px] hover:bg-gray-50 transition-colors"
                style={{ fontWeight: 500 }}
              >
                <Archive className="w-3.5 h-3.5" /> Archive
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ──────────── Two-column layout ──────────── */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* LEFT — Current Draft & Editing Controls (65%) */}
        <div className="flex-1 lg:w-[65%] space-y-6">

          {/* Draft Summary Card */}
          <div className="bg-white rounded-[10px] border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[10px] bg-[#1E3A8A]/10 flex items-center justify-center">
                <FileText className="w-4 h-4 text-[#1E3A8A]" />
              </div>
              <h2 className="text-[#1E3A8A]" style={{ fontSize: "0.95rem", fontWeight: 700 }}>Current Draft</h2>
            </div>
            <div className="px-5 sm:px-6 py-5 space-y-5">
              {/* Title */}
              <div>
                <p className="text-xs text-gray-400 mb-1">Research Title</p>
                <p className="text-gray-800" style={{ fontSize: "1.05rem", fontWeight: 600 }}>{RESEARCH_DRAFT.title}</p>
              </div>
              {/* Meta row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-[#F9FAFB] rounded-lg p-3">
                  <p className="text-[10px] text-gray-400 mb-0.5" style={{ fontWeight: 500 }}>CURRENT VERSION</p>
                  <p className="text-sm text-[#1E3A8A]" style={{ fontWeight: 700 }}>Version {RESEARCH_DRAFT.currentVersion}</p>
                </div>
                <div className="bg-[#F9FAFB] rounded-lg p-3">
                  <p className="text-[10px] text-gray-400 mb-0.5" style={{ fontWeight: 500 }}>LAST EDITED</p>
                  <p className="text-sm text-gray-700" style={{ fontWeight: 500 }}>{RESEARCH_DRAFT.lastEdited}</p>
                </div>
                <div className="bg-[#F9FAFB] rounded-lg p-3">
                  <p className="text-[10px] text-gray-400 mb-0.5" style={{ fontWeight: 500 }}>EDITED BY</p>
                  <p className="text-sm text-gray-700 flex items-center gap-1" style={{ fontWeight: 500 }}>
                    <User className="w-3.5 h-3.5 text-gray-400" />{RESEARCH_DRAFT.editedBy}
                  </p>
                </div>
                <div className="bg-[#F9FAFB] rounded-lg p-3">
                  <p className="text-[10px] text-gray-400 mb-0.5" style={{ fontWeight: 500 }}>STATUS</p>
                  <StatusBadge status={status} />
                </div>
              </div>
            </div>
          </div>

          {/* Draft Editing Controls */}
          <div className="bg-white rounded-[10px] border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 sm:px-6 py-4 border-b border-gray-100">
              <h3 className="text-[#1E3A8A] text-sm" style={{ fontWeight: 700 }}>Draft Actions</h3>
            </div>
            <div className="px-5 sm:px-6 py-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Link
                  to={`/agency/research/${id || "1"}/edit`}
                  className="flex flex-col items-center gap-2 p-4 rounded-[10px] border border-gray-200 bg-[#F9FAFB] hover:bg-gray-100 hover:border-gray-300 transition-colors text-center"
                >
                  <div className="w-10 h-10 rounded-[10px] bg-[#DBEAFE] flex items-center justify-center">
                    <Pencil className="w-4.5 h-4.5 text-[#1E3A8A]" />
                  </div>
                  <span className="text-xs text-gray-700" style={{ fontWeight: 500 }}>Edit Metadata</span>
                </Link>
                <button className="flex flex-col items-center gap-2 p-4 rounded-[10px] border border-gray-200 bg-[#F9FAFB] hover:bg-gray-100 hover:border-gray-300 transition-colors text-center">
                  <div className="w-10 h-10 rounded-[10px] bg-[#EDE9FE] flex items-center justify-center">
                    <Upload className="w-4.5 h-4.5 text-[#7C3AED]" />
                  </div>
                  <span className="text-xs text-gray-700" style={{ fontWeight: 500 }}>Replace Document</span>
                </button>
                <button
                  onClick={handleSaveDraft}
                  className="flex flex-col items-center gap-2 p-4 rounded-[10px] border-2 border-[#1E3A8A]/20 bg-[#1E3A8A]/5 hover:bg-[#1E3A8A]/10 transition-colors text-center"
                >
                  <div className="w-10 h-10 rounded-[10px] bg-[#1E3A8A] flex items-center justify-center">
                    <Save className="w-4.5 h-4.5 text-white" />
                  </div>
                  <span className="text-xs text-[#1E3A8A]" style={{ fontWeight: 600 }}>Save Draft</span>
                </button>
                <button
                  onClick={handlePublish}
                  className="flex flex-col items-center gap-2 p-4 rounded-[10px] border border-green-200 bg-green-50 hover:bg-green-100 transition-colors text-center"
                >
                  <div className="w-10 h-10 rounded-[10px] bg-green-600 flex items-center justify-center">
                    <Globe className="w-4.5 h-4.5 text-white" />
                  </div>
                  <span className="text-xs text-green-700" style={{ fontWeight: 500 }}>Publish Research</span>
                </button>
              </div>
            </div>
          </div>

          {/* File Version Information */}
          <div className="bg-white rounded-[10px] border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[10px] bg-[#1E3A8A]/10 flex items-center justify-center">
                <File className="w-4 h-4 text-[#1E3A8A]" />
              </div>
              <h3 className="text-[#1E3A8A] text-sm" style={{ fontWeight: 700 }}>Attached Document</h3>
            </div>
            <div className="px-5 sm:px-6 py-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-[#F9FAFB] rounded-[10px] border border-gray-200">
                {/* File icon */}
                <div className="w-14 h-14 rounded-[10px] bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                  <div className="text-center">
                    <FileText className="w-6 h-6 text-red-500 mx-auto" />
                    <span className="text-[8px] text-red-400 mt-0.5 block" style={{ fontWeight: 700 }}>PDF</span>
                  </div>
                </div>
                {/* File details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 truncate" style={{ fontWeight: 600 }}>{RESEARCH_DRAFT.fileName}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <span>{RESEARCH_DRAFT.fileSize}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                    <span>Uploaded {RESEARCH_DRAFT.uploadDate}</span>
                  </div>
                </div>
                {/* File actions */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <button className="inline-flex items-center gap-1.5 px-3 py-2 text-xs bg-white border border-gray-200 rounded-[10px] text-gray-600 hover:bg-gray-50 transition-colors" style={{ fontWeight: 500 }}>
                    <Eye className="w-3.5 h-3.5" /> Preview
                  </button>
                  <button className="inline-flex items-center gap-1.5 px-3 py-2 text-xs bg-white border border-gray-200 rounded-[10px] text-gray-600 hover:bg-gray-50 transition-colors" style={{ fontWeight: 500 }}>
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>
                  <button className="inline-flex items-center gap-1.5 px-3 py-2 text-xs bg-[#1E3A8A] text-white rounded-[10px] hover:bg-[#1E3A8A]/90 transition-colors" style={{ fontWeight: 500 }}>
                    <Upload className="w-3.5 h-3.5" /> Replace
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — Version History Timeline (35%) */}
        <div className="lg:w-[35%]">
          <div className="bg-white rounded-[10px] border border-gray-200 shadow-sm overflow-hidden lg:sticky lg:top-24">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-[10px] bg-[#1E3A8A]/10 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-[#1E3A8A]" />
                </div>
                <div>
                  <h2 className="text-[#1E3A8A] text-sm" style={{ fontWeight: 700 }}>Version History</h2>
                  <p className="text-[11px] text-gray-400">{versions.length} versions</p>
                </div>
              </div>
              <button
                onClick={() => setShowCompare(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] bg-[#1E3A8A]/10 text-[#1E3A8A] rounded-[10px] hover:bg-[#1E3A8A]/20 transition-colors"
                style={{ fontWeight: 500 }}
              >
                <ArrowLeftRight className="w-3 h-3" /> Compare
              </button>
            </div>

            {/* Timeline */}
            <div className="px-5 py-5 max-h-[600px] overflow-y-auto">
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-[18px] top-3 bottom-3 w-0.5 bg-gray-100" />

                <div className="space-y-0">
                  {versions.map((v, idx) => {
                    const Icon = v.actionIcon;
                    const isLatest = idx === 0;
                    return (
                      <div key={v.id} className="relative pl-12 pb-6 last:pb-0 group">
                        {/* Timeline dot */}
                        <div
                          className={`absolute left-[7px] top-1 w-[22px] h-[22px] rounded-full flex items-center justify-center z-10 border-2 ${
                            isLatest ? "border-[#1E3A8A] bg-[#1E3A8A]" : "border-gray-200 bg-white"
                          }`}
                        >
                          <Icon className={`w-3 h-3 ${isLatest ? "text-white" : ""}`} style={isLatest ? {} : { color: v.actionColor }} />
                        </div>

                        {/* Version card */}
                        <div className={`rounded-[10px] border p-3.5 transition-shadow hover:shadow-sm ${
                          isLatest ? "border-[#1E3A8A]/20 bg-[#1E3A8A]/[0.02]" : "border-gray-100 bg-white"
                        }`}>
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-800" style={{ fontWeight: 700 }}>
                                  Version {v.version}
                                </span>
                                {isLatest && (
                                  <span className="px-1.5 py-0.5 bg-[#1E3A8A] text-white text-[9px] rounded" style={{ fontWeight: 600 }}>
                                    LATEST
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">{v.description}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-gray-400 mb-2.5">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {v.editor}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-gray-300" />
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {v.dateTime}
                            </span>
                          </div>

                          {/* Version actions */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button className="inline-flex items-center gap-1 px-2 py-1 text-[11px] bg-[#F9FAFB] border border-gray-200 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors" style={{ fontWeight: 500 }}>
                              <Eye className="w-3 h-3" /> View
                            </button>
                            {!isLatest && (
                              <button
                                onClick={() => handleRestore(v)}
                                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] bg-amber-50 border border-amber-200 rounded-md text-amber-600 hover:bg-amber-100 transition-colors"
                                style={{ fontWeight: 500 }}
                              >
                                <RotateCcw className="w-3 h-3" /> Restore
                              </button>
                            )}
                            <button className="inline-flex items-center gap-1 px-2 py-1 text-[11px] bg-[#F9FAFB] border border-gray-200 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors" style={{ fontWeight: 500 }}>
                              <Download className="w-3 h-3" /> Download
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

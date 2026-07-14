import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
    Upload,
    FileText,
    X,
    CheckCircle2,
    ChevronRight,
    ChevronLeft,
    Sparkles,
    Plus,
    Trash2,
    AlertTriangle,
    Clock,
    DollarSign,
    BarChart3,
    Tag,
    Star,
    Save,
    Send,
    Info,
    Users,
    Zap,
    FileBarChart,
    BookOpen,
    ClipboardList,
    Home,
    Globe,
    Lightbulb,
    Eye,
    Edit3,
    RefreshCw,
    Brain,
    Shield,
    AlertCircle,
    PenSquare,
    Database,
    ChevronDown,
    ChevronUp,
    Loader2,
    Lock,
    KeyRound,
    Calendar,
    Link2,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { SDG_DATA } from "../../data/reference-data";
import { apiPost, firstValidationError, type AgencySettingsData } from "../../lib/api";
import { useApi } from "../../hooks/useApi";
import { useAgencyContext } from "../../hooks/useAgencyContext";
import { useDialogFocus } from "../../hooks/useDialogFocus";
import { postFormData, postJson } from "../../lib/http";

// ─── Types ─────────────────────────────────────────────────────────────────────

type DocType = "research" | "terminal" | "pap" | null;
type AccessMode = "public" | "request" | "restricted" | "embargo" | "external" | null;

interface ProjectRow {
    id: string;
    target: string; // editable — describe what needs to be achieved
    actualPct: number; // 0–100: actual percentage
    accomplishmentPct: number; // 0–100: accomplishment percentage
}

interface MetadataFields {
    title: string;
    abstract: string;
    methodology: string;
    relatedLiterature: string;
    theoreticalFramework: string;
    resultsDiscussion: string;
    keywords: string;
    authors: string;
}

type MetadataKey = keyof MetadataFields;

// ─── Constants ─────────────────────────────────────────────────────────────────

const METADATA_VISIBILITY_FIELDS: { key: MetadataKey; label: string }[] = [
    { key: "title", label: "Title" },
    { key: "abstract", label: "Abstract" },
    { key: "methodology", label: "Methodology" },
    { key: "relatedLiterature", label: "Review of Related Literature" },
    { key: "theoreticalFramework", label: "Theoretical Framework" },
    { key: "resultsDiscussion", label: "Results and Discussion" },
];

const PAP_CATEGORIES = [
    { id: "circular", label: "Circular Economy", color: "#10B981" },
    { id: "digital", label: "Digital Economy", color: "#3B82F6" },
    { id: "ai", label: "Artificial Intelligence", color: "#8B5CF6" },
    { id: "sti", label: "STI Strategy", color: "#1E3A8A" },
    { id: "gad", label: "GAD", color: "#EC4899" },
    { id: "youth", label: "Youth", color: "#F59E0B" },
    { id: "ips", label: "IPs", color: "#EF4444" },
    { id: "pwds", label: "PWDs", color: "#06B6D4" },
    { id: "unserved", label: "Unserved / Underserved", color: "#64748B" },
];

const PENTAHELIX = ["Government", "Academe", "Business", "Civil Society", "Media"];
const QUARTERS = [
    { value: "Q1", label: "Q1 (Jan–Mar)" },
    { value: "Q2", label: "Q2 (Apr–Jun)" },
    { value: "Q3", label: "Q3 (Jul–Sep)" },
    { value: "Q4", label: "Q4 (Oct–Dec)" },
];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 7 }, (_, index) => String(CURRENT_YEAR - 3 + index));

const SDG_SUGGESTED = [9, 8, 17];

const SDG_SHORT: Record<number, string> = {
    1: "No Poverty",
    2: "Zero Hunger",
    3: "Good Health",
    4: "Quality Edu.",
    5: "Gender Eq.",
    6: "Clean Water",
    7: "Clean Energy",
    8: "Decent Work",
    9: "Industry",
    10: "Reduced Ineq.",
    11: "Sust. Cities",
    12: "Resp. Consump.",
    13: "Climate",
    14: "Life Below Water",
    15: "Life on Land",
    16: "Peace & Justice",
    17: "Partnerships",
};

const DOC_TYPE_CONFIG = [
    {
        id: "research",
        Icon: BookOpen,
        label: "Research Study",
        desc: "Peer-reviewed research papers and academic studies",
        color: "#1E3A8A",
        bg: "#EFF6FF",
        steps: 6,
        badge: "6-Step Simplified",
    },
    {
        id: "terminal",
        Icon: ClipboardList,
        label: "Terminal Report",
        desc: "End-of-project reports with performance data and outcomes",
        color: "#7C3AED",
        bg: "#F5F3FF",
        steps: 9,
        badge: "9-Step Full Flow",
    },
    {
        id: "pap",
        Icon: FileBarChart,
        label: "Project Accomplishment Report",
        desc: "PAP submissions for periodic monitoring and compliance",
        color: "#059669",
        bg: "#ECFDF5",
        steps: 9,
        badge: "9-Step Full Flow",
    },
];

// ── Dynamic step definitions ───────────────────────────────────────────────────

type StepDef = { num: number; label: string; accent: string };

const RESEARCH_STEPS: StepDef[] = [
    { num: 1, label: "Doc Type", accent: "#1E3A8A" },
    { num: 2, label: "Upload", accent: "#1E3A8A" },
    { num: 3, label: "Metadata Draft", accent: "#7C3AED" },
    { num: 4, label: "SDG Tagging", accent: "#0EA5E9" },
    { num: 5, label: "Access", accent: "#DC2626" },
    { num: 6, label: "Review", accent: "#059669" },
];

const REPORT_STEPS: StepDef[] = [
    { num: 1, label: "Doc Type", accent: "#1E3A8A" },
    { num: 2, label: "Details", accent: "#1E3A8A" },
    { num: 3, label: "Metadata Draft", accent: "#7C3AED" },
    { num: 4, label: "Performance", accent: "#1E3A8A" },
    { num: 5, label: "PAP Class.", accent: "#1E3A8A" },
    { num: 6, label: "Financials", accent: "#1E3A8A" },
    { num: 7, label: "Highlights", accent: "#F59E0B" },
    { num: 8, label: "SDG Tagging", accent: "#0EA5E9" },
    { num: 9, label: "Review", accent: "#059669" },
];

const ACCESS_OPTIONS: {
    id: AccessMode;
    Icon: React.ElementType;
    label: string;
    desc: string;
    color: string;
    bg: string;
    border: string;
    extra?: "date" | "url";
}[] = [
    {
        id: "public",
        Icon: Globe,
        label: "Public Download",
        desc: "Anyone can download the full research document.",
        color: "#1E3A8A",
        bg: "#EFF6FF",
        border: "#BFDBFE",
    },
    {
        id: "request",
        Icon: KeyRound,
        label: "Request Access",
        desc: "Users must submit a request to access the document.",
        color: "#7C3AED",
        bg: "#F5F3FF",
        border: "#DDD6FE",
    },
    {
        id: "restricted",
        Icon: Lock,
        label: "Restricted (Admin Only)",
        desc: "Only agency administrators can access the document.",
        color: "#DC2626",
        bg: "#FEF2F2",
        border: "#FECACA",
    },
    {
        id: "embargo",
        Icon: Clock,
        label: "Embargo Until Date",
        desc: "Document becomes publicly available after a specified date.",
        color: "#D97706",
        bg: "#FFFBEB",
        border: "#FDE68A",
        extra: "date",
    },
    {
        id: "external",
        Icon: Link2,
        label: "External Link Only",
        desc: "Link to a document hosted on an external platform.",
        color: "#0891B2",
        bg: "#ECFEFF",
        border: "#A5F3FC",
        extra: "url",
    },
];

function uploadAccessMode(value?: string): AccessMode {
    return (
        (
            {
                public_download: "public",
                request_access: "request",
                restricted_admin: "restricted",
                embargo_until_date: "embargo",
                external_link_only: "external",
            } as Record<string, AccessMode>
        )[value ?? ""] ?? "request"
    );
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function computeStatus(accomplishmentPct: number): "Completed" | "Ongoing" | "Not Started" {
    if (accomplishmentPct >= 100) return "Completed";
    if (accomplishmentPct > 0) return "Ongoing";
    return "Not Started";
}

function fmt(v: number) {
    return v === 0 ? "₱0.00" : `₱${v.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
}

// ─── Shared Micro-components ───────────────────────────────────────────────────

function ProgStatusBadge({ status }: { status: "Completed" | "Ongoing" | "Not Started" }) {
    const styles = {
        Completed: "bg-green-100 text-green-700",
        Ongoing: "bg-blue-100 text-blue-700",
        "Not Started": "bg-gray-100 text-gray-500",
    };
    const icons = {
        Completed: <CheckCircle2 className="w-3 h-3" />,
        Ongoing: <Clock className="w-3 h-3" />,
        "Not Started": <AlertCircle className="w-3 h-3" />,
    };
    return (
        <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${styles[status]}`}
        >
            {icons[status]}
            {status}
        </span>
    );
}

function FormField({
    label,
    required = false,
    hint,
    children,
}: {
    label: string;
    required?: boolean;
    hint?: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <label className="block text-sm text-gray-700 font-semibold mb-1.5">
                {label}
                {required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            {children}
            {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
        </div>
    );
}

function FormSectionHeader({
    icon,
    title,
    subtitle,
    step,
    total,
    accentColor = "#1E3A8A",
}: {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    step: number;
    total: number;
    accentColor?: string;
}) {
    return (
        <div className="flex items-start gap-4 pb-5 border-b border-gray-100">
            <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: accentColor + "18" }}
            >
                {icon}
            </div>
            <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h2 className="text-gray-900 font-bold" style={{ fontSize: "1.05rem" }}>
                        {title}
                    </h2>
                    <span
                        className="text-[10px] text-white px-2 py-0.5 rounded-full font-bold"
                        style={{ background: accentColor }}
                    >
                        STEP {step} OF {total}
                    </span>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">{subtitle}</p>
            </div>
        </div>
    );
}

function ReviewCard({
    title,
    stepLabel,
    onEdit,
    children,
}: {
    title: string;
    stepLabel: string;
    onEdit: () => void;
    children: React.ReactNode;
}) {
    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-[#F8FAFF] border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-800 font-semibold">{title}</span>
                    <span className="text-[10px] bg-[#1E3A8A]/10 text-[#1E3A8A] px-2 py-0.5 rounded-full font-semibold">
                        {stepLabel}
                    </span>
                </div>
                <button
                    onClick={onEdit}
                    className="flex items-center gap-1 text-xs text-[#1E3A8A] hover:underline font-medium"
                >
                    <Edit3 className="w-3 h-3" /> Edit
                </button>
            </div>
            <div className="p-4">{children}</div>
        </div>
    );
}

function ReviewField({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-[10px] text-gray-400 font-bold mb-0.5">{label.toUpperCase()}</p>
            <p className="text-sm text-gray-700 leading-relaxed">{value || "—"}</p>
        </div>
    );
}

// ─── Dynamic Step Progress ─────────────────────────────────────────────────────

function StepProgress({ currentStep, docType }: { currentStep: number; docType: DocType }) {
    const steps = docType === "research" ? RESEARCH_STEPS : docType ? REPORT_STEPS : null;
    const isResearch = docType === "research";

    // Placeholder when no type selected
    if (!steps) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4">
                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center gap-1.5 shrink-0">
                        <div className="w-9 h-9 rounded-full bg-[#1E3A8A] border-2 border-[#1E3A8A] text-white flex items-center justify-center text-xs font-bold">
                            1
                        </div>
                        <span className="text-[10px] text-[#1E3A8A] font-semibold hidden sm:block">
                            Doc Type
                        </span>
                    </div>
                    <div className="flex-1 h-0.5 bg-gray-200 rounded" />
                    <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl shrink-0">
                        <span className="w-3 h-3 rounded-full bg-gray-200 inline-block" />
                        Select a document type to see remaining steps
                        <span className="w-3 h-3 rounded-full bg-gray-200 inline-block" />
                    </div>
                    <div className="flex-1 h-0.5 bg-gray-200 rounded" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4">
            {/* Flow type indicator */}
            <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                    {isResearch ? "Research Study · Simplified Flow" : "Report Flow · Full Workflow"}
                </span>
                <span
                    className="text-[10px] font-bold px-2.5 py-0.5 rounded-full text-white"
                    style={{ background: isResearch ? "#1E3A8A" : "#7C3AED" }}
                >
                    {steps.length} Steps
                </span>
            </div>
            <div className="flex items-center overflow-x-auto">
                {steps.map((s, idx) => {
                    const done = s.num < currentStep;
                    const active = s.num === currentStep;
                    return (
                        <div key={`sp-${s.num}`} className="flex items-center shrink-0">
                            <div className="flex flex-col items-center gap-1.5">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs border-2 transition-all duration-300 ${done ? "bg-green-500 border-green-500 text-white" : "bg-white"}`}
                                    style={
                                        active
                                            ? {
                                                  background: s.accent,
                                                  borderColor: s.accent,
                                                  color: "#fff",
                                                  boxShadow: `0 0 0 4px ${s.accent}22`,
                                              }
                                            : done
                                              ? {}
                                              : { borderColor: "#E5E7EB", color: "#9CA3AF" }
                                    }
                                >
                                    {done ? (
                                        <CheckCircle2 className="w-4 h-4" />
                                    ) : (
                                        <span style={{ fontWeight: 700, fontSize: "0.78rem" }}>{s.num}</span>
                                    )}
                                </div>
                                <span
                                    className={`text-[10px] whitespace-nowrap hidden sm:block font-medium ${active ? "" : done ? "text-green-600" : "text-gray-400"}`}
                                    style={active ? { color: s.accent } : {}}
                                >
                                    {s.label}
                                </span>
                            </div>
                            {idx < steps.length - 1 && (
                                <div
                                    className={`w-4 sm:w-7 lg:w-11 h-0.5 mb-4 mx-1 shrink-0 transition-colors duration-300 ${done ? "bg-green-400" : "bg-gray-200"}`}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Step 1: Document Type (Shared) ───────────────────────────────────────────

function StepDocType({ docType, setDocType }: { docType: DocType; setDocType: (d: DocType) => void }) {
    return (
        <div className="p-6 sm:p-8 space-y-6">
            <div className="flex items-start gap-4 pb-5 border-b border-gray-100">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-[#1E3A8A]/10">
                    <ClipboardList className="w-5 h-5 text-[#1E3A8A]" />
                </div>
                <div>
                    <h2 className="text-gray-900 font-bold mb-1" style={{ fontSize: "1.05rem" }}>
                        Select Document Type
                    </h2>
                    <p className="text-sm text-gray-500">
                        Choose the document type to configure the appropriate wizard flow for your submission.
                    </p>
                </div>
            </div>

            {/* Two flows explanation */}
            <div className="grid sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl flex items-start gap-2.5">
                    <BookOpen className="w-4 h-4 text-[#1E3A8A] shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs font-bold text-[#1E3A8A] mb-0.5">
                            Research Study — 6-Step Simplified
                        </p>
                        <p className="text-[11px] text-[#1E3A8A]/70">
                            Upload → Metadata Draft → SDG Tagging → Access Control → Review
                        </p>
                    </div>
                </div>
                <div className="p-3.5 bg-[#F5F3FF] border border-[#DDD6FE] rounded-xl flex items-start gap-2.5">
                    <ClipboardList className="w-4 h-4 text-[#7C3AED] shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs font-bold text-[#7C3AED] mb-0.5">Reports — 9-Step Full Flow</p>
                        <p className="text-[11px] text-[#7C3AED]/70">
                            Details → Metadata → Performance → PAP → Financials → Highlights → SDG → Review
                        </p>
                    </div>
                </div>
            </div>

            {/* Doc type cards */}
            <div className="grid sm:grid-cols-3 gap-4">
                {DOC_TYPE_CONFIG.map((dt) => {
                    const sel = docType === dt.id;
                    return (
                        <button
                            key={`dt-${dt.id}`}
                            onClick={() => setDocType(dt.id as DocType)}
                            className={`relative p-5 rounded-2xl border-2 text-left transition-all duration-200 hover:shadow-lg ${sel ? "shadow-lg" : "border-gray-200 hover:border-gray-300"}`}
                            style={sel ? { borderColor: dt.color, background: dt.bg } : {}}
                        >
                            <span
                                className="absolute top-3 right-3 text-[9px] px-1.5 py-0.5 rounded-full font-bold whitespace-nowrap"
                                style={{ background: sel ? dt.color : dt.bg, color: sel ? "#fff" : dt.color }}
                            >
                                {dt.badge}
                            </span>
                            {sel && (
                                <div
                                    className="absolute top-3 left-3 w-5 h-5 rounded-full flex items-center justify-center shadow"
                                    style={{ background: dt.color }}
                                >
                                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                </div>
                            )}
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                                style={{ background: sel ? dt.color + "25" : dt.bg }}
                            >
                                <dt.Icon className="w-6 h-6" style={{ color: dt.color }} />
                            </div>
                            <p className="text-gray-900 font-bold mb-1" style={{ fontSize: "0.88rem" }}>
                                {dt.label}
                            </p>
                            <p className="text-gray-500 leading-relaxed" style={{ fontSize: "0.76rem" }}>
                                {dt.desc}
                            </p>
                        </button>
                    );
                })}
            </div>

            {/* Info banner based on selection */}
            {docType === "research" && (
                <div className="flex items-start gap-3 p-4 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl">
                    <Brain className="w-4 h-4 text-[#1E3A8A] mt-0.5 shrink-0" />
                    <p className="text-sm text-[#1E3A8A]">
                        <span className="font-semibold">Research Study selected.</span> This simplified 6-step
                        flow focuses on research submission: upload, metadata review, SDG tagging, and access
                        control. No performance or financial fields required.
                    </p>
                </div>
            )}
            {(docType === "terminal" || docType === "pap") && (
                <div className="flex items-start gap-3 p-4 bg-[#F5F3FF] border border-[#DDD6FE] rounded-xl">
                    <Info className="w-4 h-4 text-[#7C3AED] mt-0.5 shrink-0" />
                    <p className="text-sm text-[#7C3AED]">
                        <span className="font-semibold">
                            {DOC_TYPE_CONFIG.find((d) => d.id === docType)?.label} selected.
                        </span>{" "}
                        This 9-step flow includes document details, project performance tracking, PAP
                        classification, financial utilization, highlights, and SDG tagging — aligned to
                        regional reporting standards.
                    </p>
                </div>
            )}
        </div>
    );
}

// ─── RESEARCH: Step 2 — Upload (Simplified) ───────────────────────────────────

function StepUploadResearch({
    file,
    isDragOver,
    isUploading,
    uploadProg,
    titleOverride,
    onDragOver,
    onDragLeave,
    onDrop,
    onFileSelect,
    onRemoveFile,
    setTitleOverride,
}: {
    file: File | null;
    isDragOver: boolean;
    isUploading: boolean;
    uploadProg: number;
    titleOverride: string;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: () => void;
    onDrop: (e: React.DragEvent) => void;
    onFileSelect: (f: File) => void;
    onRemoveFile: () => void;
    setTitleOverride: (v: string) => void;
}) {
    const prog = Math.min(100, Math.round(uploadProg));
    return (
        <div className="p-6 sm:p-8 space-y-6">
            <FormSectionHeader
                icon={<Upload className="w-5 h-5 text-[#1E3A8A]" />}
                title="Upload Research Document"
                step={2}
                total={6}
                subtitle="Select a document to attach. A clearly labeled demo helper can draft metadata for your review in the next step."
            />
            {!file ? (
                <div
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    className={`border-2 border-dashed rounded-2xl p-14 text-center cursor-pointer transition-all ${isDragOver ? "border-[#1E3A8A] bg-blue-50 scale-[1.01]" : "border-gray-200 hover:border-[#1E3A8A]/40 hover:bg-[#F8FAFF]"}`}
                >
                    <div
                        className="w-18 h-18 bg-[#1E3A8A]/10 rounded-2xl flex items-center justify-center mx-auto mb-5"
                        style={{ width: 72, height: 72 }}
                    >
                        <Upload className="w-9 h-9 text-[#1E3A8A]" />
                    </div>
                    <p className="text-gray-700 font-semibold mb-1" style={{ fontSize: "1rem" }}>
                        Drag &amp; drop your document here
                    </p>
                    <p className="text-sm text-gray-400 mb-6">— or —</p>
                    <label className="inline-flex items-center gap-2 px-6 py-3 bg-[#1E3A8A] text-white rounded-xl text-sm font-medium cursor-pointer hover:bg-[#1E3A8A]/90 transition-colors shadow-sm">
                        <Upload className="w-4 h-4" /> Browse File
                        <input
                            type="file"
                            accept=".pdf,application/pdf"
                            className="hidden"
                            onChange={(e) => {
                                if (e.target.files?.[0]) onFileSelect(e.target.files[0]);
                            }}
                        />
                    </label>
                    <div className="flex items-center justify-center gap-3 mt-5 text-xs text-gray-400">
                        <span className="px-2 py-0.5 bg-gray-100 rounded font-medium">PDF</span>·
                        <span className="text-gray-300">Max 25 MB</span>
                    </div>
                </div>
            ) : (
                <div className="border border-gray-200 rounded-2xl p-5">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-16 bg-red-50 border border-red-100 rounded-xl flex flex-col items-center justify-center shrink-0 gap-1">
                            <FileText className="w-7 h-7 text-red-500" />
                            <span className="text-[9px] text-red-400 font-bold uppercase">
                                {file.name.split(".").pop()}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-800 font-semibold truncate">{file.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                            {isUploading || prog < 100 ? (
                                <div className="mt-2">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="flex items-center gap-1.5 text-xs text-gray-500">
                                            <Loader2 className="w-3 h-3 animate-spin" /> Uploading…
                                        </span>
                                        <span className="text-xs text-[#1E3A8A] font-bold">{prog}%</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[#1E3A8A] rounded-full transition-all"
                                            style={{ width: `${prog}%` }}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5 mt-2">
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    <span className="text-xs text-green-600 font-medium">
                                        File selected · It will upload when you save
                                    </span>
                                </div>
                            )}
                        </div>
                        {prog >= 100 && !isUploading && (
                            <button
                                onClick={onRemoveFile}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            )}
            <FormField label="Research Title" hint="Optional for a draft; verify the title before submitting">
                <input
                    type="text"
                    value={titleOverride}
                    onChange={(e) => setTitleOverride(e.target.value)}
                    placeholder="Manual title override (optional)…"
                    className="w-full px-4 py-2.5 bg-[#F9FAFB] border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]/40"
                />
            </FormField>
            <div className="flex items-start gap-3 p-4 bg-[#F5F3FF] border border-purple-200 rounded-xl">
                <Brain className="w-4 h-4 text-[#7C3AED] mt-0.5 shrink-0" />
                <p className="text-xs text-purple-800">
                    <span className="font-semibold">Human-reviewed metadata</span> — Complete the initial
                    fields here. After the PDF is securely stored, Gemini runs separately and never publishes
                    or approves content.
                </p>
            </div>
        </div>
    );
}

// ─── REPORT: Step 2 — Document Details (Full) ─────────────────────────────────

function StepDetailsReport({
    file,
    isDragOver,
    isUploading,
    uploadProg,
    title,
    description,
    quarter,
    year,
    agency,
    onDragOver,
    onDragLeave,
    onDrop,
    onFileSelect,
    onRemoveFile,
    setTitle,
    setDescription,
    setQuarter,
    setYear,
}: {
    file: File | null;
    isDragOver: boolean;
    isUploading: boolean;
    uploadProg: number;
    title: string;
    description: string;
    quarter: string;
    year: string;
    agency: string;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: () => void;
    onDrop: (e: React.DragEvent) => void;
    onFileSelect: (f: File) => void;
    onRemoveFile: () => void;
    setTitle: (v: string) => void;
    setDescription: (v: string) => void;
    setQuarter: (v: string) => void;
    setYear: (v: string) => void;
}) {
    const prog = Math.min(100, Math.round(uploadProg));
    return (
        <div className="p-6 sm:p-8 space-y-6">
            <FormSectionHeader
                icon={<FileText className="w-5 h-5 text-[#1E3A8A]" />}
                title="Document Details"
                step={2}
                total={9}
                subtitle="Select a document file and provide basic information. Review every metadata field before submission."
            />
            {!file ? (
                <div
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${isDragOver ? "border-[#1E3A8A] bg-blue-50 scale-[1.01]" : "border-gray-200 hover:border-[#1E3A8A]/40 hover:bg-[#F8FAFF]"}`}
                >
                    <div className="w-16 h-16 bg-[#1E3A8A]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Upload className="w-8 h-8 text-[#1E3A8A]" />
                    </div>
                    <p className="text-gray-700 font-semibold mb-1">Drag &amp; drop your document here</p>
                    <p className="text-sm text-gray-400 mb-5">— or —</p>
                    <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1E3A8A] text-white rounded-xl text-sm font-medium cursor-pointer hover:bg-[#1E3A8A]/90 transition-colors">
                        <Upload className="w-4 h-4" /> Browse File
                        <input
                            type="file"
                            accept=".pdf,application/pdf"
                            className="hidden"
                            onChange={(e) => {
                                if (e.target.files?.[0]) onFileSelect(e.target.files[0]);
                            }}
                        />
                    </label>
                    <div className="flex items-center justify-center gap-3 mt-4 text-xs text-gray-400">
                        <span>PDF</span>·<span>Max 25 MB</span>
                    </div>
                </div>
            ) : (
                <div className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-14 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center shrink-0">
                            <FileText className="w-6 h-6 text-red-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-800 font-semibold truncate">{file.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                            {isUploading || prog < 100 ? (
                                <div className="mt-2">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs text-gray-400">Uploading…</span>
                                        <span className="text-xs text-[#1E3A8A] font-semibold">{prog}%</span>
                                    </div>
                                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[#1E3A8A] rounded-full transition-all"
                                            style={{ width: `${prog}%` }}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5 mt-1">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                    <span className="text-xs text-green-600 font-medium">
                                        File selected · It will upload when you save
                                    </span>
                                </div>
                            )}
                        </div>
                        {prog >= 100 && !isUploading && (
                            <button
                                onClick={onRemoveFile}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            )}
            <div className="space-y-4">
                <FormField label="Report Title" hint="Required before final submission">
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Manual title override (optional)…"
                        className="w-full px-4 py-2.5 bg-[#F9FAFB] border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]/40"
                    />
                </FormField>
                <FormField label="Description">
                    <textarea
                        rows={2}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Brief description of this submission…"
                        className="w-full px-4 py-2.5 bg-[#F9FAFB] border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 resize-none"
                    />
                </FormField>
                <div className="grid sm:grid-cols-2 gap-4">
                    <FormField label="Quarter" required>
                        <select
                            value={quarter}
                            onChange={(e) => setQuarter(e.target.value)}
                            className="w-full px-4 py-2.5 bg-[#F9FAFB] border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20"
                        >
                            <option value="">Select Quarter</option>
                            {QUARTERS.map((q) => (
                                <option key={q.value} value={q.value}>
                                    {q.label}
                                </option>
                            ))}
                        </select>
                    </FormField>
                    <FormField label="Year" required>
                        <select
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            className="w-full px-4 py-2.5 bg-[#F9FAFB] border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20"
                        >
                            {YEARS.map((y) => (
                                <option key={y} value={y}>
                                    {y}
                                </option>
                            ))}
                        </select>
                    </FormField>
                </div>
                <FormField label="Agency">
                    <div className="flex items-center gap-2.5 px-4 py-2.5 bg-[#F0F4FF] border border-[#BFDBFE] rounded-xl">
                        <Zap className="w-4 h-4 text-[#1E3A8A] shrink-0" />
                        <span className="text-sm text-[#1E3A8A] font-medium flex-1 truncate">{agency}</span>
                        <span className="text-[10px] text-[#1E3A8A]/60 bg-[#DBEAFE] px-2 py-0.5 rounded-full font-semibold shrink-0">
                            Auto-filled
                        </span>
                    </div>
                </FormField>
            </div>
        </div>
    );
}

// ─── Shared: Step 3 — Reviewable Metadata Draft ───────────────────────────────

function StepAiMetadata({
    analyzing,
    ready,
    progress,
    stage,
    aiStages,
    metadata,
    publicFields,
    expandedMeta,
    setExpandedMeta,
    onRunAnalysis,
    onUpdateMeta,
    onTogglePublic,
    onSelectAll,
    onClearAll,
    stepNum,
    total,
}: {
    analyzing: boolean;
    ready: boolean;
    progress: number;
    stage: number;
    aiStages: string[];
    metadata: MetadataFields;
    publicFields: MetadataKey[];
    expandedMeta: MetadataKey | null;
    setExpandedMeta: (k: MetadataKey | null) => void;
    onRunAnalysis: () => void;
    onUpdateMeta: (k: MetadataKey, v: string) => void;
    onTogglePublic: (k: MetadataKey) => void;
    onSelectAll: () => void;
    onClearAll: () => void;
    stepNum: number;
    total: number;
}) {
    const FULL_FIELDS: { key: MetadataKey; label: string; rows: number }[] = [
        { key: "title", label: "Title", rows: 2 },
        { key: "abstract", label: "Abstract", rows: 5 },
        { key: "methodology", label: "Methodology", rows: 4 },
        { key: "relatedLiterature", label: "Review of Related Literature", rows: 4 },
        { key: "theoreticalFramework", label: "Theoretical Framework", rows: 3 },
        { key: "resultsDiscussion", label: "Results and Discussion", rows: 4 },
        { key: "keywords", label: "Keywords", rows: 2 },
        { key: "authors", label: "Authors", rows: 2 },
    ];
    return (
        <div className="p-6 sm:p-8 space-y-6">
            <FormSectionHeader
                icon={<Brain className="w-5 h-5 text-[#7C3AED]" />}
                title="Reviewable Metadata Draft"
                step={stepNum}
                total={total}
                accentColor="#7C3AED"
                subtitle="Prepare the initial editable fields. Gemini suggestions become available after the draft and source PDF are securely stored."
            />

            {!analyzing && !ready && (
                <div className="flex flex-col items-center justify-center py-14 space-y-5">
                    <div className="relative">
                        <div className="w-24 h-24 bg-purple-100 rounded-2xl flex items-center justify-center">
                            <Brain className="w-12 h-12 text-[#7C3AED]" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-8 h-8 bg-[#7C3AED] rounded-full flex items-center justify-center shadow">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                    </div>
                    <div className="text-center max-w-sm">
                        <p className="text-gray-800 font-semibold mb-1">Prepare an Editable Metadata Draft</p>
                        <p className="text-sm text-gray-500">
                            Continue to an editable metadata draft. Real Gemini analysis runs after the source
                            PDF is stored and remains subject to human review.
                        </p>
                    </div>
                    <button
                        onClick={onRunAnalysis}
                        className="inline-flex items-center gap-2 px-7 py-3 bg-[#7C3AED] text-white rounded-xl text-sm font-semibold hover:bg-[#7C3AED]/90 transition-all shadow-md hover:shadow-lg"
                    >
                        <Brain className="w-4 h-4" /> Prepare metadata draft
                    </button>
                </div>
            )}

            {analyzing && (
                <div className="space-y-5 py-10">
                    <div className="flex items-center justify-center">
                        <div className="relative w-20 h-20">
                            <div className="absolute inset-0 border-4 border-purple-100 rounded-full" />
                            <div className="absolute inset-0 border-4 border-[#7C3AED] rounded-full border-t-transparent animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Brain className="w-8 h-8 text-[#7C3AED]" />
                            </div>
                        </div>
                    </div>
                    <p className="text-center text-gray-600 font-medium">Preparing metadata review…</p>
                    <div className="max-w-md mx-auto space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">{aiStages[stage]}</span>
                            <span className="text-[#7C3AED] font-bold">{Math.round(progress)}%</span>
                        </div>
                        <div className="h-2.5 bg-purple-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-[#7C3AED] to-[#A78BFA] rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(100, progress)}%` }}
                            />
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {aiStages.map((s, i) => (
                                <span
                                    key={`ai-st-${i}`}
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${i < stage ? "bg-green-100 text-green-700" : i === stage ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-400"}`}
                                >
                                    {i < stage ? "✓ " : ""}
                                    {s.replace("…", "")}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {ready && (
                <div className="space-y-6">
                    <div className="flex items-center gap-3 p-3.5 bg-green-50 border border-green-200 rounded-xl">
                        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm text-green-700 font-semibold">Metadata draft prepared</p>
                            <p className="text-xs text-green-600">
                                These fields are human-controlled. Review the separate Gemini suggestions
                                after saving the draft and before submission.
                            </p>
                        </div>
                        <button
                            onClick={onRunAnalysis}
                            className="flex items-center gap-1 px-2.5 py-1 text-[10px] text-green-600 border border-green-200 rounded-lg hover:bg-green-100 font-medium"
                        >
                            <RefreshCw className="w-3 h-3" /> Re-run
                        </button>
                    </div>

                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-700 font-semibold">Suggested Fields</p>
                            <span className="text-xs text-gray-400 font-medium">
                                Editable suggestions · Click to expand
                            </span>
                        </div>
                        {FULL_FIELDS.map((f) => {
                            const exp = expandedMeta === f.key;
                            const val = metadata[f.key];
                            return (
                                <div
                                    key={`mf-${f.key}`}
                                    className="border border-gray-200 rounded-xl overflow-hidden"
                                >
                                    <button
                                        className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-[#F0F4FF] transition-colors text-left"
                                        onClick={() => setExpandedMeta(exp ? null : f.key)}
                                    >
                                        <PenSquare className="w-3.5 h-3.5 text-[#7C3AED] shrink-0" />
                                        <span className="text-sm text-gray-700 font-semibold flex-1">
                                            {f.label}
                                        </span>
                                        {val && (
                                            <span className="text-[10px] text-green-600 bg-green-100 px-2 py-0.5 rounded-full font-semibold shrink-0">
                                                Drafted
                                            </span>
                                        )}
                                        {exp ? (
                                            <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                                        ) : (
                                            <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                                        )}
                                    </button>
                                    {!exp && val && (
                                        <div className="px-4 py-2.5 border-t border-gray-100">
                                            <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                                                {val}
                                            </p>
                                        </div>
                                    )}
                                    {exp && (
                                        <div className="p-4 border-t border-gray-100">
                                            <textarea
                                                rows={f.rows}
                                                value={val}
                                                onChange={(e) => onUpdateMeta(f.key, e.target.value)}
                                                className="w-full px-3 py-2.5 bg-[#F9FAFB] border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]/40 resize-none leading-relaxed"
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Public Visibility */}
                    <div className="border border-[#BFDBFE] rounded-xl overflow-hidden">
                        <div className="flex items-center gap-3 px-5 py-3.5 bg-[#EFF6FF] border-b border-[#BFDBFE]">
                            <Shield className="w-4 h-4 text-[#1E3A8A]" />
                            <div className="flex-1">
                                <p className="text-sm text-[#1E3A8A] font-semibold">
                                    Select Metadata for Public Display
                                </p>
                                <p className="text-xs text-[#1E3A8A]/60 mt-0.5">
                                    Only selected fields will be visible in the public repository
                                </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    type="button"
                                    onClick={onSelectAll}
                                    className="text-xs text-[#1E3A8A] hover:underline font-semibold"
                                >
                                    ✓ Select All
                                </button>
                                <span className="text-gray-300">|</span>
                                <button
                                    type="button"
                                    onClick={onClearAll}
                                    className="text-xs text-gray-400 hover:text-gray-600 font-medium"
                                >
                                    Clear All
                                </button>
                            </div>
                        </div>
                        <div className="p-5 space-y-3">
                            {METADATA_VISIBILITY_FIELDS.map((f) => {
                                const checked = publicFields.includes(f.key);
                                return (
                                    <label
                                        key={`pvf-${f.key}`}
                                        className="flex items-start gap-3 cursor-pointer group"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() => onTogglePublic(f.key)}
                                            className="sr-only"
                                        />
                                        <span
                                            className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center border-2 transition-all shrink-0 ${checked ? "bg-[#1E3A8A] border-[#1E3A8A]" : "border-gray-300 group-hover:border-[#1E3A8A]/40"}`}
                                        >
                                            {checked && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                        </span>
                                        <div className="flex-1">
                                            <p
                                                className={`text-sm font-medium transition-colors ${checked ? "text-[#1E3A8A]" : "text-gray-600"}`}
                                            >
                                                {f.label}
                                            </p>
                                            {metadata[f.key] && (
                                                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed line-clamp-1">
                                                    {metadata[f.key]}
                                                </p>
                                            )}
                                        </div>
                                        {checked && (
                                            <span className="text-[10px] bg-[#1E3A8A]/10 text-[#1E3A8A] px-2 py-0.5 rounded-full font-semibold shrink-0 mt-0.5">
                                                Public
                                            </span>
                                        )}
                                    </label>
                                );
                            })}
                        </div>
                        {publicFields.length > 0 && (
                            <div className="mx-5 mb-5 p-4 bg-[#F8FAFF] border border-[#BFDBFE] rounded-xl">
                                <div className="flex items-center gap-2 mb-3">
                                    <Eye className="w-3.5 h-3.5 text-[#1E3A8A]" />
                                    <p className="text-[10px] text-[#1E3A8A] font-bold uppercase tracking-wide">
                                        Live Public Preview
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    {publicFields.map((k) => {
                                        const field = METADATA_VISIBILITY_FIELDS.find((ff) => ff.key === k);
                                        if (!field || !metadata[k]) return null;
                                        return (
                                            <div key={`lpv-${k}`}>
                                                <p className="text-[10px] text-gray-400 font-semibold uppercase mb-0.5">
                                                    {field.label}
                                                </p>
                                                <p className="text-xs text-gray-700 leading-relaxed line-clamp-2">
                                                    {metadata[k]}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── REPORT: Step 4 — Project Performance ─────────────────────────────────────

function StepPerformance({
    projects,
    projectTitle,
    onAdd,
    onUpdate,
    onRemove,
}: {
    projects: ProjectRow[];
    projectTitle: string;
    onAdd: () => void;
    onUpdate: (id: string, field: keyof ProjectRow, v: string | number) => void;
    onRemove: (id: string) => void;
}) {
    const autoName = projectTitle.trim() || "";
    const isPlaceholder = !projectTitle.trim();

    return (
        <div className="p-6 sm:p-8 space-y-6">
            <FormSectionHeader
                icon={<BarChart3 className="w-5 h-5 text-[#1E3A8A]" />}
                title="Project Performance"
                step={4}
                total={9}
                subtitle="Record targets versus actual accomplishments. Status and progress are auto-calculated."
            />

            {/* Auto-fill info banner */}
            <div
                className={`flex items-start gap-3 p-4 rounded-xl border ${isPlaceholder ? "bg-amber-50 border-amber-200" : "bg-[#EFF6FF] border-[#BFDBFE]"}`}
            >
                <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isPlaceholder ? "bg-amber-100" : "bg-[#1E3A8A]/10"}`}
                >
                    <Zap className={`w-4 h-4 ${isPlaceholder ? "text-amber-600" : "text-[#1E3A8A]"}`} />
                </div>
                <div className="flex-1 min-w-0">
                    <p
                        className={`text-sm font-semibold ${isPlaceholder ? "text-amber-700" : "text-[#1E3A8A]"}`}
                    >
                        Project Name — Auto-Filled from Step 2
                    </p>
                    {isPlaceholder ? (
                        <p className="text-xs text-amber-600 mt-0.5">
                            No document title entered in Step 2 yet. Go back to Step 2 to set the title — it
                            will automatically appear as the Project Name here.
                        </p>
                    ) : (
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className="text-xs text-[#1E3A8A]/60">Auto-filled as:</span>
                            <span className="text-xs text-[#1E3A8A] font-semibold bg-[#1E3A8A]/10 px-2 py-0.5 rounded-lg truncate max-w-xs">
                                "{autoName}"
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Desktop table */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-[#F8FAFF] border-b border-gray-200">
                            <th className="text-left px-4 py-3 text-xs text-gray-500 font-semibold w-72">
                                <div className="flex items-center gap-1.5">
                                    Project Name
                                    <span className="text-[9px] bg-[#1E3A8A]/10 text-[#1E3A8A] px-1.5 py-0.5 rounded font-bold">
                                        AUTO
                                    </span>
                                </div>
                            </th>
                            <th className="text-left px-4 py-3 text-xs text-gray-500 font-semibold">
                                Target
                            </th>
                            <th className="text-left px-4 py-3 text-xs text-gray-500 font-semibold">
                                Actual %
                            </th>
                            <th className="text-left px-4 py-3 text-xs text-gray-500 font-semibold">
                                Accomplishment %
                            </th>
                            <th className="text-left px-4 py-3 text-xs text-gray-500 font-semibold">
                                Status
                            </th>
                            <th className="px-4 py-3 w-10" />
                        </tr>
                    </thead>
                    <tbody>
                        {projects.map((p, idx) => {
                            const status = computeStatus(p.accomplishmentPct);
                            return (
                                <tr
                                    key={p.id}
                                    className={`border-b border-gray-100 hover:bg-[#FAFCFF] transition-colors ${idx % 2 ? "bg-[#FAFAFA]" : ""}`}
                                >
                                    {/* Project Name — read-only, auto-filled */}
                                    <td className="px-4 py-3 w-44">
                                        <div className="flex items-center gap-1.5 px-2 py-1.5 bg-gray-50 border border-dashed border-gray-200 rounded-lg">
                                            <Zap className="w-3 h-3 text-[#1E3A8A]/30 shrink-0" />
                                            <span
                                                className={`text-xs truncate max-w-[110px] ${isPlaceholder ? "text-gray-400 italic" : "text-gray-500"}`}
                                            >
                                                {isPlaceholder
                                                    ? "No title set"
                                                    : autoName.length > 18
                                                      ? autoName.slice(0, 18) + "…"
                                                      : autoName}
                                            </span>
                                        </div>
                                        <p className="text-[9px] text-gray-400 mt-0.5 flex items-center gap-1">
                                            <Lock className="w-2 h-2" /> auto · locked
                                        </p>
                                    </td>

                                    {/* Target */}
                                    <td className="px-4 py-3">
                                        <input
                                            type="text"
                                            value={p.target}
                                            onChange={(e) => onUpdate(p.id, "target", e.target.value)}
                                            placeholder="Enter target"
                                            className="w-36 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]/40 placeholder-gray-300"
                                        />
                                    </td>

                                    {/* Actual % */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1.5">
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={p.actualPct || ""}
                                                onChange={(e) =>
                                                    onUpdate(
                                                        p.id,
                                                        "actualPct",
                                                        Math.min(100, Math.max(0, Number(e.target.value))),
                                                    )
                                                }
                                                placeholder="0"
                                                className="w-16 px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-right focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]/40 placeholder-gray-300"
                                            />
                                            <span className="text-xs text-gray-400 font-semibold">%</span>
                                        </div>
                                    </td>

                                    {/* Accomplishment % + progress bar */}
                                    <td className="px-4 py-3">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-1.5">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={p.accomplishmentPct || ""}
                                                    onChange={(e) =>
                                                        onUpdate(
                                                            p.id,
                                                            "accomplishmentPct",
                                                            Math.min(
                                                                100,
                                                                Math.max(0, Number(e.target.value)),
                                                            ),
                                                        )
                                                    }
                                                    placeholder="0"
                                                    className="w-16 px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-right focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]/40 placeholder-gray-300"
                                                />
                                                <span className="text-xs text-gray-400 font-semibold">%</span>
                                            </div>
                                            {/* Compact progress bar */}
                                            <div className="w-28 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-300 ${
                                                        status === "Completed"
                                                            ? "bg-green-500"
                                                            : status === "Ongoing"
                                                              ? "bg-[#1E3A8A]"
                                                              : "bg-gray-200"
                                                    }`}
                                                    style={{ width: `${p.accomplishmentPct}%` }}
                                                />
                                            </div>
                                            <span className="text-[9px] text-gray-400 font-medium">
                                                {p.accomplishmentPct}% done
                                            </span>
                                        </div>
                                    </td>

                                    {/* Status badge — auto-calculated */}
                                    <td className="px-4 py-3">
                                        <ProgStatusBadge status={status} />
                                        <p className="text-[9px] text-gray-400 mt-1">Auto-calculated</p>
                                    </td>

                                    {/* Delete */}
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            onClick={() => onRemove(p.id)}
                                            disabled={projects.length === 1}
                                            className={`p-1.5 rounded-lg transition-colors ${projects.length === 1 ? "text-gray-200 cursor-not-allowed" : "text-gray-400 hover:text-red-500 hover:bg-red-50"}`}
                                            title="Remove row"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* ── Mobile cards */}
            <div className="md:hidden space-y-4">
                {projects.map((p, idx) => {
                    const status = computeStatus(p.accomplishmentPct);
                    return (
                        <div
                            key={p.id}
                            className="border border-gray-200 rounded-2xl p-4 space-y-4 bg-white shadow-sm"
                        >
                            {/* Card header */}
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-400 font-semibold">Row {idx + 1}</span>
                                <div className="flex items-center gap-2">
                                    <ProgStatusBadge status={status} />
                                    <button
                                        onClick={() => onRemove(p.id)}
                                        disabled={projects.length === 1}
                                        className={`p-1 rounded-md transition-colors ${projects.length === 1 ? "text-gray-200" : "text-gray-400 hover:text-red-500"}`}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Project Name — read-only */}
                            <div>
                                <p className="text-[10px] text-gray-400 font-semibold mb-1.5 flex items-center gap-1">
                                    <Zap className="w-3 h-3 text-[#1E3A8A]/40" />
                                    PROJECT NAME{" "}
                                    <span className="bg-[#1E3A8A]/10 text-[#1E3A8A] px-1.5 rounded font-bold">
                                        AUTO
                                    </span>
                                </p>
                                <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border border-dashed border-gray-200 rounded-xl">
                                    <Lock className="w-3 h-3 text-gray-300 shrink-0" />
                                    <span
                                        className={`text-xs ${isPlaceholder ? "text-gray-400 italic" : "text-gray-500 font-medium"}`}
                                    >
                                        {autoName || "Auto-filled from document title"}
                                    </span>
                                </div>
                            </div>

                            {/* Target */}
                            <div>
                                <p className="text-[10px] text-gray-400 font-semibold mb-1">TARGET</p>
                                <input
                                    type="text"
                                    value={p.target}
                                    onChange={(e) => onUpdate(p.id, "target", e.target.value)}
                                    placeholder="Enter target"
                                    className="w-full px-3 py-2.5 bg-[#F9FAFB] border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20"
                                />
                            </div>

                            {/* Actual % + Accomplishment % */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-[10px] text-gray-400 font-semibold mb-1">ACTUAL %</p>
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={p.actualPct || ""}
                                            onChange={(e) =>
                                                onUpdate(
                                                    p.id,
                                                    "actualPct",
                                                    Math.min(100, Math.max(0, Number(e.target.value))),
                                                )
                                            }
                                            placeholder="0"
                                            className="flex-1 px-2.5 py-2 bg-[#F9FAFB] border border-gray-200 rounded-xl text-sm text-right focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20"
                                        />
                                        <span className="text-xs text-gray-400 font-semibold">%</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 font-semibold mb-1">
                                        ACCOMPLISHMENT %
                                    </p>
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={p.accomplishmentPct || ""}
                                            onChange={(e) =>
                                                onUpdate(
                                                    p.id,
                                                    "accomplishmentPct",
                                                    Math.min(100, Math.max(0, Number(e.target.value))),
                                                )
                                            }
                                            placeholder="0"
                                            className="flex-1 px-2.5 py-2 bg-[#F9FAFB] border border-gray-200 rounded-xl text-sm text-right focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20"
                                        />
                                        <span className="text-xs text-gray-400 font-semibold">%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div>
                                <div className="flex justify-between text-[10px] text-gray-400 mb-1.5 font-medium">
                                    <span>Accomplishment Progress</span>
                                    <span className="font-bold">{p.accomplishmentPct}%</span>
                                </div>
                                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-300 ${status === "Completed" ? "bg-green-500" : status === "Ongoing" ? "bg-[#1E3A8A]" : "bg-gray-200"}`}
                                        style={{ width: `${p.accomplishmentPct}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Helper text */}
            <p className="text-xs text-gray-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                Project name is automatically generated from the document title entered in Step 2.
                {isPlaceholder && (
                    <span className="text-amber-500 font-medium">
                        Return to Step 2 to set the document title.
                    </span>
                )}
            </p>

            {/* Add Row button */}
            <button
                onClick={onAdd}
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 border-2 border-dashed border-[#1E3A8A]/25 text-[#1E3A8A] rounded-xl text-sm font-medium hover:border-[#1E3A8A]/50 hover:bg-[#1E3A8A]/5 transition-all"
            >
                <Plus className="w-4 h-4" /> Add Project Row
            </button>
        </div>
    );
}

// ─── REPORT: Step 5 — PAP Classification ──────────────────────────────────────

function StepPAP({
    selectedPAPs,
    togglePAP,
    description,
    setDescription,
    selectedSectors,
    toggleSector,
    aiApplied,
    onAiApply,
}: {
    selectedPAPs: string[];
    togglePAP: (id: string) => void;
    description: string;
    setDescription: (v: string) => void;
    selectedSectors: string[];
    toggleSector: (s: string) => void;
    aiApplied: boolean;
    onAiApply: () => void;
}) {
    return (
        <div className="p-6 sm:p-8 space-y-6">
            <FormSectionHeader
                icon={<Tag className="w-5 h-5 text-[#1E3A8A]" />}
                title="PAP Classification"
                step={5}
                total={9}
                subtitle="Select all applicable Program / Activity / Project categories and beneficiary sectors."
            />
            {!aiApplied ? (
                <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-[#EFF6FF] to-[#F5F3FF] border border-[#BFDBFE] rounded-xl">
                    <div className="w-9 h-9 bg-[#1E3A8A]/10 rounded-lg flex items-center justify-center shrink-0">
                        <Sparkles className="w-4 h-4 text-[#1E3A8A]" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm text-gray-800 font-semibold">AI Suggestion</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Based on extracted metadata:{" "}
                            <span className="text-[#1E3A8A] font-semibold">Digital Economy</span> &amp;{" "}
                            <span className="text-[#1E3A8A] font-semibold">STI Strategy</span>
                        </p>
                    </div>
                    <button
                        onClick={onAiApply}
                        className="px-3 py-1.5 text-xs bg-[#1E3A8A] text-white rounded-lg hover:bg-[#1E3A8A]/90 transition-colors shrink-0 font-medium"
                    >
                        Apply
                    </button>
                </div>
            ) : (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-green-50 border border-green-200 rounded-xl">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <p className="text-xs text-green-700 font-medium">
                        AI suggestions applied. Adjust as needed.
                    </p>
                </div>
            )}
            <div>
                <p className="text-sm text-gray-700 font-semibold mb-3">
                    PAP Categories <span className="text-red-500">*</span>
                </p>
                <div className="flex flex-wrap gap-2">
                    {PAP_CATEGORIES.map((cat) => {
                        const sel = selectedPAPs.includes(cat.id);
                        return (
                            <button
                                key={`pap-${cat.id}`}
                                onClick={() => togglePAP(cat.id)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs border-2 transition-all ${!sel ? "border-gray-200 text-gray-600 hover:border-gray-300" : ""}`}
                                style={
                                    sel
                                        ? {
                                              borderColor: cat.color,
                                              color: cat.color,
                                              background: cat.color + "18",
                                              fontWeight: 700,
                                          }
                                        : { fontWeight: 500 }
                                }
                            >
                                <Tag className="w-3 h-3" />
                                {cat.label}
                                {sel && <CheckCircle2 className="w-3 h-3" />}
                            </button>
                        );
                    })}
                </div>
            </div>
            <FormField label="PAP Description">
                <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe how this report relates to the selected PAP categories…"
                    className="w-full px-4 py-2.5 bg-[#F9FAFB] border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 resize-none"
                />
            </FormField>
            <div>
                <p className="text-sm text-gray-700 font-semibold mb-2">Beneficiary Sectors — Pentahelix</p>
                <div className="flex flex-wrap gap-2">
                    {PENTAHELIX.map((s) => {
                        const sel = selectedSectors.includes(s);
                        return (
                            <button
                                key={`penta-${s}`}
                                onClick={() => toggleSector(s)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border transition-all ${sel ? "bg-[#1E3A8A] text-white border-[#1E3A8A] font-semibold" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"}`}
                            >
                                <Users className="w-3 h-3" />
                                {s}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ─── REPORT: Step 6 — Financial Utilization ───────────────────────────────────

function StepFinancials({
    allocated,
    used,
    remaining,
    utilPct,
    setAllocated,
    setUsed,
}: {
    allocated: number | "";
    used: number | "";
    remaining: number;
    utilPct: number;
    setAllocated: (v: number | "") => void;
    setUsed: (v: number | "") => void;
}) {
    const alloc = typeof allocated === "number" ? allocated : 0;
    const usedVal = typeof used === "number" ? used : 0;
    const isOver = usedVal > alloc && alloc > 0;
    return (
        <div className="p-6 sm:p-8 space-y-6">
            <FormSectionHeader
                icon={<DollarSign className="w-5 h-5 text-[#1E3A8A]" />}
                title="Financial Utilization"
                step={6}
                total={9}
                subtitle="Enter budget figures. Remaining balance and utilization rate are automatically calculated."
            />
            <div className="grid sm:grid-cols-2 gap-5">
                <FormField label="Allocated Budget (₱)" required>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                            ₱
                        </span>
                        <input
                            type="number"
                            min="0"
                            value={allocated}
                            onChange={(e) =>
                                setAllocated(e.target.value === "" ? "" : Number(e.target.value))
                            }
                            placeholder="0.00"
                            className="w-full pl-7 pr-4 py-2.5 bg-[#F9FAFB] border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20"
                        />
                    </div>
                </FormField>
                <FormField label="Used Budget (₱)">
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                            ₱
                        </span>
                        <input
                            type="number"
                            min="0"
                            value={used}
                            onChange={(e) => setUsed(e.target.value === "" ? "" : Number(e.target.value))}
                            placeholder="0.00"
                            className={`w-full pl-7 pr-4 py-2.5 bg-[#F9FAFB] border rounded-xl text-sm focus:outline-none focus:ring-2 ${isOver ? "border-red-400 focus:ring-red-200" : "border-gray-200 focus:ring-[#1E3A8A]/20"}`}
                        />
                    </div>
                    {isOver && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Exceeds allocation
                        </p>
                    )}
                </FormField>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1 font-medium">Remaining Balance</p>
                    <p className="text-green-600 font-bold" style={{ fontSize: "1.2rem" }}>
                        {fmt(remaining)}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">Auto-calculated</p>
                </div>
                <div
                    className={`p-4 border rounded-xl ${utilPct > 90 ? "bg-red-50 border-red-200" : utilPct > 70 ? "bg-amber-50 border-amber-200" : "bg-[#EFF6FF] border-blue-200"}`}
                >
                    <p className="text-xs text-gray-500 mb-1 font-medium">Utilization Rate</p>
                    <p
                        className={`font-bold ${utilPct > 90 ? "text-red-600" : utilPct > 70 ? "text-amber-600" : "text-[#1E3A8A]"}`}
                        style={{ fontSize: "1.2rem" }}
                    >
                        {utilPct}%
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">Auto-calculated</p>
                </div>
            </div>
            {alloc > 0 && (
                <div>
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                        <span className="font-medium">Budget Usage Breakdown</span>
                        <span className="text-xs text-gray-400">
                            {fmt(usedVal)} of {fmt(alloc)}
                        </span>
                    </div>
                    <div className="h-8 bg-gray-100 rounded-full overflow-hidden relative">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${utilPct > 90 ? "bg-red-500" : utilPct > 70 ? "bg-amber-400" : "bg-[#1E3A8A]"}`}
                            style={{ width: `${Math.min(100, utilPct)}%` }}
                        />
                        {utilPct > 12 && (
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-xs font-bold">
                                {utilPct}%
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── REPORT: Step 7 — Highlights ─────────────────────────────────────────────

function StepHighlights({
    title,
    description,
    featured,
    file,
    setTitle,
    setDescription,
    setFeatured,
    setFile,
}: {
    title: string;
    description: string;
    featured: boolean;
    file: File | null;
    setTitle: (v: string) => void;
    setDescription: (v: string) => void;
    setFeatured: (v: boolean) => void;
    setFile: (f: File | null) => void;
}) {
    return (
        <div className="p-6 sm:p-8 space-y-6">
            <FormSectionHeader
                icon={<Star className="w-5 h-5 text-amber-500" />}
                title="Highlights / Initiatives"
                step={7}
                total={9}
                accentColor="#F59E0B"
                subtitle="Highlight key accomplishments or notable initiatives from this reporting period."
            />
            <div className="space-y-4">
                <FormField label="Highlight Title">
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. AI-based crop monitoring system deployed across 3 municipalities…"
                        className="w-full px-4 py-2.5 bg-[#F9FAFB] border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20"
                    />
                </FormField>
                <FormField label="Description">
                    <textarea
                        rows={5}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe the highlight — include impact metrics, beneficiaries, and measurable outcomes…"
                        className="w-full px-4 py-2.5 bg-[#F9FAFB] border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 resize-none"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">{description.length} characters</p>
                </FormField>
                <FormField label="Supporting Image / File (Optional)">
                    {!file ? (
                        <label className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[#1E3A8A]/30 hover:bg-gray-50 transition-all">
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                <Upload className="w-4 h-4 text-gray-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 font-medium">
                                    Upload supporting image or file
                                </p>
                                <p className="text-xs text-gray-400">PNG, JPG, PDF — max 10 MB</p>
                            </div>
                            <input
                                type="file"
                                accept=".png,.jpg,.jpeg,.pdf"
                                className="hidden"
                                onChange={(e) => {
                                    if (e.target.files?.[0]) setFile(e.target.files[0]);
                                }}
                            />
                        </label>
                    ) : (
                        <div className="flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-xl bg-gray-50">
                            <FileText className="w-5 h-5 text-[#1E3A8A]" />
                            <span className="text-sm text-gray-700 font-medium flex-1 truncate">
                                {file.name}
                            </span>
                            <button
                                onClick={() => setFile(null)}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </FormField>
                <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
                            <Star className="w-4 h-4 text-amber-500" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-800 font-semibold">Mark as Featured</p>
                            <p className="text-xs text-gray-500">
                                Featured highlights appear prominently on public dashboards
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setFeatured(!featured)}
                        className={`relative w-11 h-6 rounded-full transition-colors ${featured ? "bg-amber-500" : "bg-gray-200"}`}
                    >
                        <div
                            className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${featured ? "left-6" : "left-1"}`}
                        />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Shared: SDG Tagging ──────────────────────────────────────────────────────

function StepSdgTagging({
    selectedSdgs,
    toggleSdg,
    aiApplied,
    onAiApply,
    tooltip,
    setTooltip,
    stepNum,
    total,
}: {
    selectedSdgs: number[];
    toggleSdg: (n: number) => void;
    aiApplied: boolean;
    onAiApply: () => void;
    tooltip: number | null;
    setTooltip: (n: number | null) => void;
    stepNum: number;
    total: number;
}) {
    return (
        <div className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-[#0EA5E9]/10 to-[#1E3A8A]/10 border border-[#BFDBFE] rounded-2xl">
                <div className="w-12 h-12 bg-gradient-to-br from-[#0EA5E9] to-[#1E3A8A] rounded-xl flex items-center justify-center shrink-0">
                    <Globe className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[#1E3A8A] font-bold" style={{ fontSize: "1.05rem" }}>
                            SDG Tagging
                        </p>
                        <span className="text-[10px] bg-[#0EA5E9] text-white px-2 py-0.5 rounded-full font-bold">
                            STEP {stepNum} OF {total}
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Select Sustainable Development Goals — used for repository classification and
                        filtering
                    </p>
                </div>
            </div>

            {!aiApplied ? (
                <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
                    <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                        <Lightbulb className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm text-gray-800 font-semibold">AI SDG Suggestion</p>
                        <p className="text-xs text-gray-600 mt-0.5 flex items-center flex-wrap gap-1">
                            Based on extracted metadata, we suggest:
                            {SDG_SUGGESTED.map((n) => {
                                const sdg = SDG_DATA.find((s) => s.number === n);
                                return (
                                    <span
                                        key={`sdg-sg-${n}`}
                                        className="px-1.5 py-0.5 rounded text-white text-[10px] font-bold"
                                        style={{ background: sdg?.color }}
                                    >
                                        SDG {n}
                                    </span>
                                );
                            })}
                        </p>
                    </div>
                    <button
                        onClick={onAiApply}
                        className="px-3 py-1.5 text-xs bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors shrink-0 font-semibold"
                    >
                        Apply All
                    </button>
                </div>
            ) : (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-green-50 border border-green-200 rounded-xl">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <p className="text-xs text-green-700 font-medium">
                        AI suggestions applied — adjust your selection below.
                    </p>
                    <button onClick={onAiApply} className="ml-auto p-1 text-green-500 hover:text-green-700">
                        <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            {selectedSdgs.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-gray-500 font-bold">SELECTED ({selectedSdgs.length})</p>
                        <button
                            onClick={() => selectedSdgs.forEach((n) => toggleSdg(n))}
                            className="text-xs text-red-500 hover:text-red-700 font-medium"
                        >
                            Clear all
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {selectedSdgs.map((n) => {
                            const sdg = SDG_DATA.find((s) => s.number === n);
                            return (
                                <span
                                    key={`sdg-chip-${n}`}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-white text-xs font-semibold"
                                    style={{ background: sdg?.color }}
                                >
                                    SDG {n} · {SDG_SHORT[n]}
                                    <button
                                        onClick={() => toggleSdg(n)}
                                        className="ml-0.5 hover:bg-white/20 rounded-full p-0.5 transition-colors"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            );
                        })}
                    </div>
                </div>
            )}

            <div>
                <p className="text-sm text-gray-700 font-semibold mb-3">
                    Select Applicable SDGs <span className="text-red-500">*</span>
                    <span className="text-xs text-gray-400 ml-2 font-normal">
                        Hover for details · Click to select · Multi-select enabled
                    </span>
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-4 2xl:grid-cols-5 gap-2.5">
                    {SDG_DATA.map((sdg) => {
                        const sel = selectedSdgs.includes(sdg.number);
                        return (
                            <div key={`sdg-w-${sdg.number}`} className="relative">
                                <button
                                    onClick={() => toggleSdg(sdg.number)}
                                    onMouseEnter={() => setTooltip(sdg.number)}
                                    onMouseLeave={() => setTooltip(null)}
                                    className={`w-full rounded-2xl p-3 text-center transition-all duration-200 hover:scale-105 hover:shadow-lg border-2 ${sel ? "border-white shadow-xl ring-2 ring-offset-1" : "border-transparent opacity-85 hover:opacity-100"}`}
                                    style={{ background: sel ? sdg.color : sdg.color + "CC" }}
                                >
                                    {sel && (
                                        <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow">
                                            <CheckCircle2
                                                className="w-3.5 h-3.5"
                                                style={{ color: sdg.color }}
                                            />
                                        </div>
                                    )}
                                    <div className="text-white/70 text-[10px] font-bold mb-0.5">SDG</div>
                                    <div
                                        className="text-white font-black"
                                        style={{ fontSize: "1.6rem", lineHeight: 1 }}
                                    >
                                        {sdg.number}
                                    </div>
                                    <p
                                        className="text-white font-semibold mt-1.5 leading-tight"
                                        style={{ fontSize: "0.62rem" }}
                                    >
                                        {SDG_SHORT[sdg.number]}
                                    </p>
                                </button>
                                {tooltip === sdg.number && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
                                        <div className="bg-gray-900 text-white px-3 py-2 rounded-xl shadow-xl max-w-[200px] text-center">
                                            <p className="text-xs font-bold">SDG {sdg.number}</p>
                                            <p className="text-[11px] text-gray-300 mt-0.5 leading-snug">
                                                {sdg.title}
                                            </p>
                                        </div>
                                        <div className="w-2.5 h-2.5 bg-gray-900 rotate-45 mx-auto -mt-1" />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-[#F0FDF4] border border-green-200 rounded-xl">
                <Info className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                <p className="text-xs text-gray-600">
                    SDG tagging feeds into the RIKMS regional analytics dashboard and tracks Region XI's
                    contribution to the UN 2030 Agenda. Tags will appear as colored chips in the public
                    repository.
                </p>
            </div>
        </div>
    );
}

// ─── RESEARCH: Step 5 — Access Control ───────────────────────────────────────

function StepAccessControl({
    accessMode,
    setAccessMode,
    embargoDate,
    setEmbargoDate,
    externalUrl,
    setExternalUrl,
}: {
    accessMode: AccessMode;
    setAccessMode: (m: AccessMode) => void;
    embargoDate: string;
    setEmbargoDate: (v: string) => void;
    externalUrl: string;
    setExternalUrl: (v: string) => void;
}) {
    return (
        <div className="p-6 sm:p-8 space-y-6">
            <FormSectionHeader
                icon={<Shield className="w-5 h-5 text-red-600" />}
                title="Access Control"
                step={5}
                total={6}
                accentColor="#DC2626"
                subtitle="Define who can access or download this research document. This setting can be updated later by the agency administrator."
            />
            <div className="space-y-3">
                {ACCESS_OPTIONS.map((opt) => {
                    const sel = accessMode === opt.id;
                    return (
                        <div key={`acc-${opt.id}`}>
                            <button
                                onClick={() => setAccessMode(opt.id)}
                                className={`w-full flex items-start gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-200 hover:shadow-sm ${sel ? "shadow-sm" : "border-gray-200 hover:border-gray-300 bg-white"}`}
                                style={sel ? { borderColor: opt.color, background: opt.bg } : {}}
                            >
                                <div className="mt-0.5 shrink-0">
                                    <div
                                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${sel ? "border-transparent" : "border-gray-300"}`}
                                        style={sel ? { background: opt.color } : {}}
                                    >
                                        {sel && <div className="w-2 h-2 bg-white rounded-full" />}
                                    </div>
                                </div>
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                    style={{ background: opt.color + "18" }}
                                >
                                    <opt.Icon className="w-5 h-5" style={{ color: opt.color }} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-gray-900 font-semibold" style={{ fontSize: "0.9rem" }}>
                                        {opt.label}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                                </div>
                                {sel && (
                                    <span
                                        className="text-[10px] text-white font-bold px-2 py-0.5 rounded-full shrink-0"
                                        style={{ background: opt.color }}
                                    >
                                        Selected
                                    </span>
                                )}
                            </button>
                            {sel && opt.extra === "date" && (
                                <div className="mt-2 ml-4 pl-4 border-l-2 border-amber-200">
                                    <FormField label="Embargo Until" required>
                                        <div className="relative max-w-xs">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="date"
                                                value={embargoDate}
                                                onChange={(e) => setEmbargoDate(e.target.value)}
                                                min={new Date().toISOString().split("T")[0]}
                                                className="w-full pl-9 pr-4 py-2.5 bg-[#F9FAFB] border border-amber-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                                            />
                                        </div>
                                        {embargoDate && (
                                            <p className="text-[11px] text-amber-600 mt-1 font-medium">
                                                Public from:{" "}
                                                {new Date(embargoDate).toLocaleDateString("en-PH", {
                                                    year: "numeric",
                                                    month: "long",
                                                    day: "numeric",
                                                })}
                                            </p>
                                        )}
                                    </FormField>
                                </div>
                            )}
                            {sel && opt.extra === "url" && (
                                <div className="mt-2 ml-4 pl-4 border-l-2 border-cyan-200">
                                    <FormField label="External Document URL" required>
                                        <div className="relative">
                                            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="url"
                                                value={externalUrl}
                                                onChange={(e) => setExternalUrl(e.target.value)}
                                                placeholder="https://example.com/document"
                                                className="w-full pl-9 pr-4 py-2.5 bg-[#F9FAFB] border border-cyan-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                                            />
                                        </div>
                                    </FormField>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <Info className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                <p className="text-xs text-gray-500">
                    Access settings are enforced at the repository level. Agency administrators can modify
                    these after submission via the access control panel.
                </p>
            </div>
        </div>
    );
}

// ─── RESEARCH: Step 6 — Review & Submit ───────────────────────────────────────

function StepReviewResearch({
    docType,
    title,
    file,
    metadata,
    publicFields,
    selectedSdgs,
    accessMode,
    embargoDate,
    externalUrl,
    validationItems,
    passCount,
    failCount,
    validationExpanded,
    setValidationExpanded,
    onGoToStep,
}: {
    docType: DocType;
    title: string;
    file: File | null;
    metadata: MetadataFields;
    publicFields: MetadataKey[];
    selectedSdgs: number[];
    accessMode: AccessMode;
    embargoDate: string;
    externalUrl: string;
    validationItems: { label: string; ok: boolean; step: number }[];
    passCount: number;
    failCount: number;
    validationExpanded: boolean;
    setValidationExpanded: (v: boolean) => void;
    onGoToStep: (s: number) => void;
}) {
    const docLabel = DOC_TYPE_CONFIG.find((d) => d.id === docType)?.label ?? "—";
    const displayTitle = metadata.title || title || "Untitled Research";
    const accessOpt = ACCESS_OPTIONS.find((a) => a.id === accessMode);
    return (
        <div className="p-6 sm:p-8 space-y-5">
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-[#EFF6FF] border border-green-200 rounded-2xl">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-[#059669] rounded-xl flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[#1E3A8A] font-bold" style={{ fontSize: "1.05rem" }}>
                            Review Submission
                        </p>
                        <span className="text-[10px] bg-green-600 text-white px-2 py-0.5 rounded-full font-bold">
                            FINAL STEP
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Verify all information before submitting to the RIKMS repository.
                    </p>
                </div>
            </div>

            {/* Validation */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors"
                    onClick={() => setValidationExpanded(!validationExpanded)}
                >
                    <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${failCount === 0 ? "bg-green-100" : "bg-amber-100"}`}
                    >
                        {failCount === 0 ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                            <AlertCircle className="w-5 h-5 text-amber-500" />
                        )}
                    </div>
                    <div className="flex-1 text-left">
                        <p className="text-sm font-semibold text-gray-800">
                            Validation —{" "}
                            {failCount === 0
                                ? "All checks passed"
                                : `${failCount} issue${failCount > 1 ? "s" : ""} detected`}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${failCount === 0 ? "bg-green-500" : "bg-amber-400"}`}
                                    style={{ width: `${(passCount / validationItems.length) * 100}%` }}
                                />
                            </div>
                            <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
                                {passCount}/{validationItems.length} passed
                            </span>
                        </div>
                    </div>
                    {validationExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                    )}
                </button>
                {validationExpanded && (
                    <div className="px-4 pb-4 border-t border-gray-100">
                        <div className="grid sm:grid-cols-2 gap-2 mt-3">
                            {validationItems.map((item) => (
                                <div
                                    key={`rv-${item.label}`}
                                    className={`flex items-center gap-2.5 p-2.5 rounded-xl ${item.ok ? "bg-green-50" : "bg-amber-50"}`}
                                >
                                    {item.ok ? (
                                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                                    ) : (
                                        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                                    )}
                                    <span
                                        className={`text-xs flex-1 font-medium ${item.ok ? "text-green-700" : "text-amber-700"}`}
                                    >
                                        {item.label}
                                    </span>
                                    {!item.ok && (
                                        <button
                                            onClick={() => onGoToStep(item.step)}
                                            className="text-[10px] text-amber-600 hover:text-amber-800 underline font-semibold"
                                        >
                                            Fix
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* KPI */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#EFF6FF] rounded-xl p-3 text-center">
                    <p className="text-[#1E3A8A] font-bold text-xl">{selectedSdgs.length}</p>
                    <p className="text-[10px] text-gray-500 font-medium">SDGs Tagged</p>
                </div>
                <div className="bg-green-50 rounded-xl p-3 text-center">
                    <p className="text-green-600 font-bold text-xl">{publicFields.length}</p>
                    <p className="text-[10px] text-gray-500 font-medium">Public Fields</p>
                </div>
                <div
                    className="rounded-xl p-3 text-center"
                    style={{ background: accessOpt?.bg ?? "#F9FAFB" }}
                >
                    {accessOpt && (
                        <accessOpt.Icon
                            className="w-5 h-5 mx-auto mb-0.5"
                            style={{ color: accessOpt.color }}
                        />
                    )}
                    <p className="text-[10px] text-gray-500 font-medium truncate">Access</p>
                </div>
            </div>

            <ReviewCard title="Document Information" stepLabel="Step 1–2" onEdit={() => onGoToStep(2)}>
                <div className="grid sm:grid-cols-2 gap-3">
                    <ReviewField label="Type" value={docLabel} />
                    <ReviewField label="File" value={file?.name ?? "No file uploaded"} />
                    <div className="sm:col-span-2">
                        <ReviewField label="Research Title" value={displayTitle} />
                    </div>
                </div>
            </ReviewCard>

            <ReviewCard title="Extracted Metadata" stepLabel="Step 3 · AI" onEdit={() => onGoToStep(3)}>
                <div className="space-y-3">
                    {metadata.abstract && (
                        <ReviewField
                            label="Abstract"
                            value={
                                metadata.abstract.slice(0, 200) + (metadata.abstract.length > 200 ? "…" : "")
                            }
                        />
                    )}
                    {metadata.keywords && (
                        <div>
                            <p className="text-[10px] text-gray-400 mb-1.5 font-semibold">KEYWORDS</p>
                            <div className="flex flex-wrap gap-1">
                                {metadata.keywords.split(",").map((kw, i) => (
                                    <span
                                        key={`kw-${i}`}
                                        className="px-2 py-0.5 bg-[#EFF6FF] text-[#1E3A8A] text-[10px] rounded-full font-medium"
                                    >
                                        {kw.trim()}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {metadata.authors && <ReviewField label="Authors" value={metadata.authors} />}
                    <div>
                        <p className="text-[10px] text-gray-400 mb-1.5 font-semibold">
                            PUBLIC FIELDS ({publicFields.length})
                        </p>
                        <div className="flex flex-wrap gap-1">
                            {publicFields.map((k) => {
                                const f = METADATA_VISIBILITY_FIELDS.find((x) => x.key === k);
                                return f ? (
                                    <span
                                        key={`pub-b-${k}`}
                                        className="px-2 py-0.5 bg-[#1E3A8A]/10 text-[#1E3A8A] text-[10px] rounded-full font-semibold flex items-center gap-1"
                                    >
                                        <Eye className="w-2.5 h-2.5" />
                                        {f.label}
                                    </span>
                                ) : null;
                            })}
                        </div>
                    </div>
                </div>
            </ReviewCard>

            {selectedSdgs.length > 0 && (
                <ReviewCard title="SDG Alignment" stepLabel="Step 4" onEdit={() => onGoToStep(4)}>
                    <div className="flex flex-wrap gap-2">
                        {selectedSdgs.map((n) => {
                            const sdg = SDG_DATA.find((s) => s.number === n);
                            return (
                                <span
                                    key={`rs-sdg-${n}`}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-xs font-semibold"
                                    style={{ background: sdg?.color }}
                                >
                                    SDG {n} · {SDG_SHORT[n]}
                                </span>
                            );
                        })}
                    </div>
                </ReviewCard>
            )}

            <ReviewCard title="Access Control" stepLabel="Step 5" onEdit={() => onGoToStep(5)}>
                {accessOpt ? (
                    <div
                        className="flex items-center gap-3 p-3 rounded-xl"
                        style={{ background: accessOpt.bg }}
                    >
                        <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ background: accessOpt.color + "20" }}
                        >
                            <accessOpt.Icon className="w-5 h-5" style={{ color: accessOpt.color }} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold" style={{ color: accessOpt.color }}>
                                {accessOpt.label}
                            </p>
                            <p className="text-xs text-gray-500">{accessOpt.desc}</p>
                            {accessMode === "embargo" && embargoDate && (
                                <p className="text-[11px] text-amber-600 font-medium mt-0.5">
                                    Public from:{" "}
                                    {new Date(embargoDate).toLocaleDateString("en-PH", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}
                                </p>
                            )}
                            {accessMode === "external" && externalUrl && (
                                <p className="text-[11px] text-cyan-600 font-medium mt-0.5 truncate max-w-xs">
                                    {externalUrl}
                                </p>
                            )}
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-gray-400 italic">No access policy selected</p>
                )}
            </ReviewCard>
        </div>
    );
}

// ─── REPORT: Step 9 — Review & Validation ─────────────────────────────────────

function StepReviewReport({
    docType,
    title,
    description,
    quarter,
    year,
    agency,
    file,
    metadata,
    publicFields,
    projects,
    selectedPAPs,
    selectedSectors,
    alloc,
    used,
    remaining,
    utilPct,
    hlTitle,
    hlDescription,
    featured,
    completionRate,
    selectedSdgs,
    validationItems,
    passCount,
    failCount,
    validationExpanded,
    setValidationExpanded,
    onGoToStep,
}: {
    docType: DocType;
    title: string;
    description: string;
    quarter: string;
    year: string;
    agency: string;
    file: File | null;
    metadata: MetadataFields;
    publicFields: MetadataKey[];
    projects: ProjectRow[];
    selectedPAPs: string[];
    selectedSectors: string[];
    alloc: number;
    used: number;
    remaining: number;
    utilPct: number;
    hlTitle: string;
    hlDescription: string;
    featured: boolean;
    completionRate: number;
    selectedSdgs: number[];
    validationItems: { label: string; ok: boolean; step: number }[];
    passCount: number;
    failCount: number;
    validationExpanded: boolean;
    setValidationExpanded: (v: boolean) => void;
    onGoToStep: (s: number) => void;
}) {
    const docLabel = DOC_TYPE_CONFIG.find((d) => d.id === docType)?.label ?? "—";
    const displayTitle = metadata.title || title || "Untitled Report";
    return (
        <div className="p-6 sm:p-8 space-y-5">
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-[#EFF6FF] border border-green-200 rounded-2xl">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-[#059669] rounded-xl flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[#1E3A8A] font-bold" style={{ fontSize: "1.05rem" }}>
                            Review &amp; Validation
                        </p>
                        <span className="text-[10px] bg-green-600 text-white px-2 py-0.5 rounded-full font-bold">
                            FINAL STEP
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Verify all information before submitting to the RIKMS repository.
                    </p>
                </div>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors"
                    onClick={() => setValidationExpanded(!validationExpanded)}
                >
                    <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${failCount === 0 ? "bg-green-100" : "bg-amber-100"}`}
                    >
                        {failCount === 0 ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                            <AlertCircle className="w-5 h-5 text-amber-500" />
                        )}
                    </div>
                    <div className="flex-1 text-left">
                        <p className="text-sm font-semibold text-gray-800">
                            Validation Status —{" "}
                            {failCount === 0
                                ? "All checks passed"
                                : `${failCount} issue${failCount > 1 ? "s" : ""} detected`}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${failCount === 0 ? "bg-green-500" : "bg-amber-400"}`}
                                    style={{ width: `${(passCount / validationItems.length) * 100}%` }}
                                />
                            </div>
                            <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
                                {passCount}/{validationItems.length} passed
                            </span>
                        </div>
                    </div>
                    {validationExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                    )}
                </button>
                {validationExpanded && (
                    <div className="px-4 pb-4 border-t border-gray-100">
                        <div className="grid sm:grid-cols-2 gap-2 mt-3">
                            {validationItems.map((item) => (
                                <div
                                    key={`rrv-${item.label}`}
                                    className={`flex items-center gap-2.5 p-2.5 rounded-xl ${item.ok ? "bg-green-50" : "bg-amber-50"}`}
                                >
                                    {item.ok ? (
                                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                                    ) : (
                                        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                                    )}
                                    <span
                                        className={`text-xs flex-1 font-medium ${item.ok ? "text-green-700" : "text-amber-700"}`}
                                    >
                                        {item.label}
                                    </span>
                                    {!item.ok && (
                                        <button
                                            onClick={() => onGoToStep(item.step)}
                                            className="text-[10px] text-amber-600 hover:text-amber-800 underline font-semibold"
                                        >
                                            Fix
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* KPI strip */}
            <div className="grid grid-cols-4 gap-3">
                <div className="bg-[#EFF6FF] rounded-xl p-3 text-center">
                    <p className="text-[#1E3A8A] font-bold text-xl">{projects.length}</p>
                    <p className="text-[10px] text-gray-500 font-medium">Projects</p>
                </div>
                <div className="bg-green-50 rounded-xl p-3 text-center">
                    <p className="text-green-600 font-bold text-xl">{completionRate}%</p>
                    <p className="text-[10px] text-gray-500 font-medium">Completion</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 text-center">
                    <p className="text-amber-600 font-bold text-xl">{utilPct}%</p>
                    <p className="text-[10px] text-gray-500 font-medium">Budget Used</p>
                </div>
                <div className="bg-[#F0F9FF] rounded-xl p-3 text-center">
                    <p className="text-[#0EA5E9] font-bold text-xl">{selectedSdgs.length}</p>
                    <p className="text-[10px] text-gray-500 font-medium">SDGs Tagged</p>
                </div>
            </div>

            <ReviewCard title="Document Information" stepLabel="Step 1–2" onEdit={() => onGoToStep(2)}>
                <div className="grid sm:grid-cols-2 gap-3">
                    <ReviewField label="Type" value={docLabel} />
                    <ReviewField label="Agency" value={agency} />
                    <ReviewField label="Title" value={displayTitle} />
                    <ReviewField label="Period" value={[quarter, year].filter(Boolean).join(" ")} />
                    <div className="sm:col-span-2">
                        <ReviewField label="File" value={file?.name ?? "No file"} />
                    </div>
                    {description && (
                        <div className="sm:col-span-2">
                            <ReviewField label="Description" value={description} />
                        </div>
                    )}
                </div>
            </ReviewCard>

            <ReviewCard title="Extracted Metadata" stepLabel="Step 3 · AI" onEdit={() => onGoToStep(3)}>
                <div className="space-y-3">
                    {metadata.abstract && (
                        <ReviewField
                            label="Abstract"
                            value={
                                metadata.abstract.slice(0, 200) + (metadata.abstract.length > 200 ? "…" : "")
                            }
                        />
                    )}
                    {metadata.authors && <ReviewField label="Authors" value={metadata.authors} />}
                    <div>
                        <p className="text-[10px] text-gray-400 mb-1.5 font-semibold">
                            PUBLIC FIELDS ({publicFields.length})
                        </p>
                        <div className="flex flex-wrap gap-1">
                            {publicFields.map((k) => {
                                const f = METADATA_VISIBILITY_FIELDS.find((x) => x.key === k);
                                return f ? (
                                    <span
                                        key={`rr-pb-${k}`}
                                        className="px-2 py-0.5 bg-[#1E3A8A]/10 text-[#1E3A8A] text-[10px] rounded-full font-semibold flex items-center gap-1"
                                    >
                                        <Eye className="w-2.5 h-2.5" />
                                        {f.label}
                                    </span>
                                ) : null;
                            })}
                        </div>
                    </div>
                </div>
            </ReviewCard>

            {projects.length > 0 && (
                <ReviewCard title="Project Performance" stepLabel="Step 4" onEdit={() => onGoToStep(4)}>
                    <div className="space-y-2">
                        {projects.map((p, idx) => {
                            const status = computeStatus(p.accomplishmentPct);
                            return (
                                <div key={`rr-proj-${p.id}`} className="p-3 bg-gray-50 rounded-xl space-y-2">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                <Zap className="w-3 h-3 text-[#1E3A8A]/40 shrink-0" />
                                                <p className="text-[10px] text-gray-400 font-semibold">
                                                    ROW {idx + 1} — AUTO-FILLED NAME
                                                </p>
                                            </div>
                                            <p className="text-xs text-gray-500 font-medium truncate italic">
                                                {p.target ? `Target: ${p.target}` : "No target set"}
                                            </p>
                                        </div>
                                        <ProgStatusBadge status={status} />
                                    </div>
                                    {/* Percentage summary */}
                                    <div className="flex items-center gap-4 text-[10px] text-gray-500">
                                        <span>
                                            Actual:{" "}
                                            <span className="font-bold text-gray-700">{p.actualPct}%</span>
                                        </span>
                                        <span>
                                            Accomplishment:{" "}
                                            <span className="font-bold text-gray-700">
                                                {p.accomplishmentPct}%
                                            </span>
                                        </span>
                                    </div>
                                    {/* Progress bar */}
                                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all ${status === "Completed" ? "bg-green-500" : status === "Ongoing" ? "bg-[#1E3A8A]" : "bg-gray-200"}`}
                                            style={{ width: `${p.accomplishmentPct}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </ReviewCard>
            )}

            {selectedPAPs.length > 0 && (
                <ReviewCard title="PAP Classification" stepLabel="Step 5" onEdit={() => onGoToStep(5)}>
                    <div className="flex flex-wrap gap-2">
                        {selectedPAPs.map((id) => {
                            const cat = PAP_CATEGORIES.find((c) => c.id === id);
                            return cat ? (
                                <span
                                    key={`rr-pap-${id}`}
                                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold"
                                    style={{ background: cat.color + "18", color: cat.color }}
                                >
                                    <Tag className="w-3 h-3" />
                                    {cat.label}
                                </span>
                            ) : null;
                        })}
                    </div>
                    {selectedSectors.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {selectedSectors.map((s) => (
                                <span
                                    key={`rr-sec-${s}`}
                                    className="px-2 py-0.5 bg-[#1E3A8A]/10 text-[#1E3A8A] text-xs rounded-lg font-medium"
                                >
                                    {s}
                                </span>
                            ))}
                        </div>
                    )}
                </ReviewCard>
            )}

            {alloc > 0 && (
                <ReviewCard title="Financial Utilization" stepLabel="Step 6" onEdit={() => onGoToStep(6)}>
                    <div className="grid grid-cols-3 gap-4 mb-3">
                        <div>
                            <p className="text-[10px] text-gray-400 mb-0.5 font-bold">ALLOCATED</p>
                            <p className="text-sm font-semibold">{fmt(alloc)}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 mb-0.5 font-bold">USED</p>
                            <p className="text-sm font-semibold">{fmt(used)}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 mb-0.5 font-bold">REMAINING</p>
                            <p className="text-sm font-semibold text-green-600">{fmt(remaining)}</p>
                        </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full ${utilPct > 90 ? "bg-red-500" : "bg-[#1E3A8A]"}`}
                            style={{ width: `${Math.min(100, utilPct)}%` }}
                        />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">{utilPct}% utilized</p>
                </ReviewCard>
            )}

            {hlTitle && (
                <ReviewCard title="Highlights" stepLabel="Step 7" onEdit={() => onGoToStep(7)}>
                    <div className="flex items-start gap-2">
                        {featured && <Star className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />}
                        <div>
                            <p className="text-sm text-gray-800 font-semibold">{hlTitle}</p>
                            {hlDescription && (
                                <p className="text-xs text-gray-500 mt-1">
                                    {hlDescription.slice(0, 120)}
                                    {hlDescription.length > 120 ? "…" : ""}
                                </p>
                            )}
                            {featured && (
                                <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-semibold mt-2 inline-block">
                                    Featured
                                </span>
                            )}
                        </div>
                    </div>
                </ReviewCard>
            )}

            {selectedSdgs.length > 0 && (
                <ReviewCard title="SDG Alignment" stepLabel="Step 8" onEdit={() => onGoToStep(8)}>
                    <div className="flex flex-wrap gap-2">
                        {selectedSdgs.map((n) => {
                            const sdg = SDG_DATA.find((s) => s.number === n);
                            return (
                                <span
                                    key={`rr-sdg-${n}`}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-xs font-semibold"
                                    style={{ background: sdg?.color }}
                                >
                                    SDG {n} · {SDG_SHORT[n]}
                                </span>
                            );
                        })}
                    </div>
                </ReviewCard>
            )}
        </div>
    );
}

// ─── Live Preview: Research ────────────────────────────────────────────────────

function LivePreviewResearch({
    step,
    docType,
    title,
    file,
    metaReady,
    publicFields,
    metadata,
    selectedSdgs,
    accessMode,
    passCount,
    totalChecks,
}: {
    step: number;
    docType: DocType;
    title: string;
    file: File | null;
    metaReady: boolean;
    publicFields: MetadataKey[];
    metadata: MetadataFields;
    selectedSdgs: number[];
    accessMode: AccessMode;
    passCount: number;
    totalChecks: number;
}) {
    const docConf = DOC_TYPE_CONFIG.find((d) => d.id === docType);
    const accessOpt = ACCESS_OPTIONS.find((a) => a.id === accessMode);
    const displayTitle = metadata.title || title || "Untitled Research";

    return (
        <div className="space-y-3 xl:sticky xl:top-20">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2.5 px-4 py-3 bg-[#EFF6FF] border-b border-[#BFDBFE]">
                    <Eye className="w-4 h-4 text-[#1E3A8A]" />
                    <span className="text-xs text-[#1E3A8A] font-bold">Research Preview</span>
                    <span className="ml-auto text-[10px] text-[#1E3A8A]/60 font-medium">Step {step}/6</span>
                </div>
                <div className="p-4 space-y-4">
                    <div className="space-y-2">
                        {docConf && (
                            <div className="flex items-center gap-1.5">
                                <docConf.Icon className="w-3.5 h-3.5" style={{ color: docConf.color }} />
                                <span className="text-[10px] font-bold" style={{ color: docConf.color }}>
                                    {docConf.label}
                                </span>
                            </div>
                        )}
                        <p className="text-sm text-gray-800 font-semibold leading-snug">
                            {displayTitle || <span className="text-gray-300 italic">No title yet</span>}
                        </p>
                        {file && (
                            <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                                <FileText className="w-3 h-3" />
                                <span className="truncate max-w-[180px]">{file.name}</span>
                            </div>
                        )}
                    </div>
                    {metaReady && publicFields.length > 0 && (
                        <div className="border border-[#BFDBFE] rounded-lg p-3 bg-[#F8FAFF] space-y-2">
                            <p className="text-[9px] text-[#1E3A8A] font-bold uppercase tracking-wide flex items-center gap-1">
                                <Globe className="w-3 h-3" /> Public View
                            </p>
                            {publicFields.slice(0, 3).map((k) => {
                                const field = METADATA_VISIBILITY_FIELDS.find((f) => f.key === k);
                                if (!field || !metadata[k]) return null;
                                return (
                                    <div key={`lpvr-${k}`}>
                                        <p className="text-[9px] text-gray-400 font-semibold uppercase">
                                            {field.label}
                                        </p>
                                        <p className="text-[10px] text-gray-600 leading-snug line-clamp-2">
                                            {metadata[k]}
                                        </p>
                                    </div>
                                );
                            })}
                            {publicFields.length > 3 && (
                                <p className="text-[9px] text-[#1E3A8A] font-medium">
                                    +{publicFields.length - 3} more fields visible
                                </p>
                            )}
                        </div>
                    )}
                    {selectedSdgs.length > 0 && (
                        <div>
                            <p className="text-[9px] text-gray-400 font-bold uppercase mb-1.5">SDG TAGS</p>
                            <div className="flex flex-wrap gap-1">
                                {selectedSdgs.map((n) => {
                                    const sdg = SDG_DATA.find((s) => s.number === n);
                                    return (
                                        <span
                                            key={`lpv-sdg-${n}`}
                                            className="px-1.5 py-0.5 rounded text-white text-[9px] font-bold"
                                            style={{ background: sdg?.color }}
                                        >
                                            SDG {n}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    {accessOpt && (
                        <div
                            className="flex items-center gap-2 p-2 rounded-lg"
                            style={{ background: accessOpt.bg }}
                        >
                            <accessOpt.Icon
                                className="w-3.5 h-3.5 shrink-0"
                                style={{ color: accessOpt.color }}
                            />
                            <span className="text-[10px] font-semibold" style={{ color: accessOpt.color }}>
                                {accessOpt.label}
                            </span>
                        </div>
                    )}
                    <div className="pt-2 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-1">
                            <p className="text-[9px] text-gray-400 font-bold uppercase">Readiness</p>
                            <span className="text-[10px] font-bold text-[#1E3A8A]">
                                {passCount}/{totalChecks}
                            </span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${passCount === totalChecks ? "bg-green-500" : "bg-[#1E3A8A]"}`}
                                style={{ width: `${(passCount / totalChecks) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <p className="text-[9px] text-gray-400 font-bold uppercase mb-2.5">6-STEP RESEARCH FLOW</p>
                <div className="space-y-1.5">
                    {RESEARCH_STEPS.map((s) => (
                        <div
                            key={`rsh-${s.num}`}
                            className={`flex items-center gap-2 text-[11px] font-medium ${s.num === step ? "" : ""}  ${s.num < step ? "text-green-600" : s.num === step ? "" : "text-gray-300"}`}
                            style={s.num === step ? { color: s.accent } : {}}
                        >
                            <div
                                className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] shrink-0 ${s.num < step ? "bg-green-500 text-white" : s.num === step ? "text-white" : "bg-gray-100 text-gray-400"}`}
                                style={s.num === step ? { background: s.accent } : {}}
                            >
                                {s.num < step ? "✓" : s.num}
                            </div>
                            {s.label}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Live Preview: Reports ─────────────────────────────────────────────────────

function LivePreviewReport({
    step,
    docType,
    title,
    quarter,
    year,
    metadata,
    totalProjects,
    completionRate,
    utilPct,
    barData,
    papChartData,
    alloc,
    selectedSdgs,
    passCount,
    totalChecks,
}: {
    step: number;
    docType: DocType;
    title: string;
    file: File | null;
    quarter: string;
    year: string;
    metaReady: boolean;
    publicFields: MetadataKey[];
    metadata: MetadataFields;
    totalProjects: number;
    completionRate: number;
    utilPct: number;
    barData: { name: string; Target: number; Actual: number }[];
    papChartData: { name: string; value: number; color: string }[];
    selectedPAPs: string[];
    alloc: number;
    used: number;
    selectedSdgs: number[];
    passCount: number;
    totalChecks: number;
}) {
    const docConf = DOC_TYPE_CONFIG.find((d) => d.id === docType);
    const displayTitle = metadata.title || title || "Untitled Report";
    return (
        <div className="space-y-3 xl:sticky xl:top-20">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2.5 px-4 py-3 bg-[#F5F3FF] border-b border-[#DDD6FE]">
                    <Eye className="w-4 h-4 text-[#7C3AED]" />
                    <span className="text-xs text-[#7C3AED] font-bold">Report Preview</span>
                    <span className="ml-auto text-[10px] text-[#7C3AED]/60 font-medium">Step {step}/9</span>
                </div>
                <div className="p-4 space-y-4">
                    {docConf && (
                        <div className="flex items-center gap-1.5">
                            <docConf.Icon className="w-3.5 h-3.5" style={{ color: docConf.color }} />
                            <span className="text-[10px] font-bold" style={{ color: docConf.color }}>
                                {docConf.label}
                            </span>
                        </div>
                    )}
                    <p className="text-sm text-gray-800 font-semibold leading-snug line-clamp-2">
                        {displayTitle || <span className="text-gray-300 italic">No title yet</span>}
                    </p>
                    {(quarter || year) && (
                        <p className="text-[10px] text-gray-400">
                            {quarter} {year}
                        </p>
                    )}

                    {/* KPI strip */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-[#EFF6FF] rounded-lg p-2 text-center">
                            <p className="text-[#1E3A8A] font-bold">{totalProjects}</p>
                            <p className="text-[9px] text-gray-400">Projects</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-2 text-center">
                            <p className="text-green-600 font-bold">{completionRate}%</p>
                            <p className="text-[9px] text-gray-400">Completion</p>
                        </div>
                    </div>

                    {/* Budget bar */}
                    {alloc > 0 && (
                        <div>
                            <div className="flex justify-between text-[9px] text-gray-400 mb-1">
                                <span>Budget</span>
                                <span className="font-bold">{utilPct}%</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${utilPct > 90 ? "bg-red-500" : utilPct > 70 ? "bg-amber-400" : "bg-[#1E3A8A]"}`}
                                    style={{ width: `${Math.min(100, utilPct)}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Bar chart (projects) */}
                    {barData.length > 0 && (
                        <div>
                            <p className="text-[9px] text-gray-400 font-bold uppercase mb-1">PERFORMANCE</p>
                            <ResponsiveContainer width="100%" height={80}>
                                <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                    <XAxis dataKey="name" tick={{ fontSize: 7 }} />
                                    <YAxis tick={{ fontSize: 7 }} />
                                    <Tooltip contentStyle={{ fontSize: 9, borderRadius: 6 }} />
                                    <Bar dataKey="Target" fill="#E5E7EB" radius={[2, 2, 0, 0]} />
                                    <Bar dataKey="Actual" fill="#1E3A8A" radius={[2, 2, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* PAP pie */}
                    {papChartData.length > 0 && (
                        <div>
                            <p className="text-[9px] text-gray-400 font-bold uppercase mb-1">
                                PAP CATEGORIES
                            </p>
                            <div className="flex items-center gap-2">
                                <ResponsiveContainer width={60} height={60}>
                                    <PieChart>
                                        <Pie
                                            data={papChartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={16}
                                            outerRadius={28}
                                            paddingAngle={2}
                                            dataKey="value"
                                        >
                                            {papChartData.map((entry) => (
                                                <Cell key={`pap-cell-${entry.name}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="flex flex-col gap-1">
                                    {papChartData.slice(0, 3).map((d) => (
                                        <div key={`pap-l-${d.name}`} className="flex items-center gap-1">
                                            <div
                                                className="w-2 h-2 rounded-full shrink-0"
                                                style={{ background: d.color }}
                                            />
                                            <span className="text-[9px] text-gray-500">{d.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SDG tags */}
                    {selectedSdgs.length > 0 && (
                        <div>
                            <p className="text-[9px] text-gray-400 font-bold uppercase mb-1">SDG TAGS</p>
                            <div className="flex flex-wrap gap-1">
                                {selectedSdgs.map((n) => {
                                    const sdg = SDG_DATA.find((s) => s.number === n);
                                    return (
                                        <span
                                            key={`lpvr-sdg-${n}`}
                                            className="px-1.5 py-0.5 rounded text-white text-[9px] font-bold"
                                            style={{ background: sdg?.color }}
                                        >
                                            SDG {n}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="pt-2 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-1">
                            <p className="text-[9px] text-gray-400 font-bold uppercase">Readiness</p>
                            <span className="text-[10px] font-bold text-[#7C3AED]">
                                {passCount}/{totalChecks}
                            </span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${passCount === totalChecks ? "bg-green-500" : "bg-[#7C3AED]"}`}
                                style={{ width: `${(passCount / totalChecks) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <p className="text-[9px] text-gray-400 font-bold uppercase mb-2.5">9-STEP REPORT FLOW</p>
                <div className="space-y-1.5">
                    {REPORT_STEPS.map((s) => (
                        <div
                            key={`rpt-hint-${s.num}`}
                            className={`flex items-center gap-2 text-[11px] font-medium ${s.num < step ? "text-green-600" : s.num === step ? "" : "text-gray-300"}`}
                            style={s.num === step ? { color: s.accent } : {}}
                        >
                            <div
                                className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] shrink-0 ${s.num < step ? "bg-green-500 text-white" : s.num === step ? "text-white" : "bg-gray-100 text-gray-400"}`}
                                style={s.num === step ? { background: s.accent } : {}}
                            >
                                {s.num < step ? "✓" : s.num}
                            </div>
                            {s.label}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Root Component ────────────────────────────────────────────────────────────

export function UploadResearch() {
    const navigate = useNavigate();
    const { user } = useAgencyContext();
    const agencySettings = useApi<AgencySettingsData>("/api/rikms/agency/settings");
    const appliedDefaultAccess = useRef(false);
    // ── Shared
    const [step, setStep] = useState(1);
    const [docType, setDocTypeRaw] = useState<DocType>(null);

    const setDocType = (dt: DocType) => {
        if (dt !== docType) {
            setDocTypeRaw(dt);
            if (step > 1) setStep(1);
        }
    };

    // ── Shared upload state
    const [file, setFile] = useState<File | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProg, setUploadProg] = useState(0);
    const [documentId, setDocumentId] = useState<number | null>(null);

    // ── Research Step 2
    const [titleOverride, setTitleOverride] = useState("");

    // ── Report Step 2
    const [title2, setTitle2] = useState("");
    const [description2, setDesc2] = useState("");
    const [quarter, setQuarter] = useState("");
    const [year, setYear] = useState(String(CURRENT_YEAR));
    const agency = user.agencyName ?? "Your agency";

    // ── Step 3 (shared) — human-controlled metadata draft
    const [metaAnalyzing, setMetaAnalyzing] = useState(false);
    const [metaReady, setMetaReady] = useState(false);
    const [metaProgress, setMetaProgress] = useState(0);
    const [metaStage, setMetaStage] = useState(0);
    const [metadata, setMetadata] = useState<MetadataFields>({
        title: "",
        abstract: "",
        methodology: "",
        relatedLiterature: "",
        theoreticalFramework: "",
        resultsDiscussion: "",
        keywords: "",
        authors: "",
    });
    const [publicFields, setPublicFields] = useState<MetadataKey[]>(["title", "abstract"]);
    const [expandedMeta, setExpandedMeta] = useState<MetadataKey | null>(null);

    // ── Report Step 4 — Performance
    const [projects, setProjects] = useState<ProjectRow[]>([
        { id: "1", target: "", actualPct: 0, accomplishmentPct: 0 },
    ]);

    // ── Report Step 5 — PAP
    const [selectedPAPs, setSelectedPAPs] = useState<string[]>([]);
    const [papDescription, setPapDescription] = useState("");
    const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
    const [aiPapApplied, setAiPapApplied] = useState(false);

    // ── Report Step 6 — Financials
    const [allocBudget, setAllocBudget] = useState<number | "">("");
    const [usedBudget, setUsedBudget] = useState<number | "">("");

    // ── Report Step 7 — Highlights
    const [hlTitle, setHlTitle] = useState("");
    const [hlDesc, setHlDesc] = useState("");
    const [featured, setFeatured] = useState(false);
    const [hlFile, setHlFile] = useState<File | null>(null);

    // ── Shared Step 4/8 — SDG
    const [selectedSdgs, setSelectedSdgs] = useState<number[]>([]);
    const [aiSdgApplied, setAiSdgApplied] = useState(false);
    const [sdgTooltip, setSdgTooltip] = useState<number | null>(null);

    // ── Research Step 5 — Access
    const [accessMode, setAccessMode] = useState<AccessMode>(null);
    const [embargoDate, setEmbargoDate] = useState("");
    const [externalUrl, setExternalUrl] = useState("");

    // ── Submit state
    const [showConfirm, setShowConfirm] = useState(false);
    const [submitMode, setSubmitMode] = useState<"draft" | "submit" | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [validationExpanded, setValidationExpanded] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState("");
    const [submissionDialogRef, submissionInitialFocusRef] = useDialogFocus<
        HTMLDivElement,
        HTMLButtonElement
    >(showConfirm, () => {
        if (!isSaving) setShowConfirm(false);
    });

    useEffect(() => {
        if (appliedDefaultAccess.current || !agencySettings.data) return;
        appliedDefaultAccess.current = true;
        setAccessMode((current) => current ?? uploadAccessMode(agencySettings.data?.data.defaultAccessMode));
    }, [agencySettings.data]);

    // ── Metadata preparation stages
    const AI_STAGES = [
        "Parsing document structure…",
        "Extracting text blocks…",
        "Identifying metadata fields…",
        "Preparing review fields…",
        "Classifying abstract & methodology…",
        "Finalizing extraction…",
    ];

    const prepareMetadataDraft = () => {
        setMetaAnalyzing(false);
        setMetaProgress(100);
        setMetaStage(AI_STAGES.length - 1);
        setMetaReady(true);
        setMetadata((current) => ({
            ...current,
            title: current.title || titleOverride || title2,
            abstract: current.abstract || description2,
        }));
    };

    const runAiAnalysis = async () => {
        if (!documentId) {
            setSaveError("No document file has been uploaded yet.");
            return;
        }

        setMetaAnalyzing(true);
        setMetaReady(false);
        setMetaProgress(0);
        setMetaStage(0);
        setSaveError("");

        let backendResult: MetadataFields | null = null;
        let backendError: string | null = null;
        let suggestedSdgs: Array<{ sdg: number; confidence: number; reason: string }> = [];

        const apiPromise = postJson<any>(`/api/rikms/documents/${documentId}/analyze`, {})
            .then((res) => {
                backendResult = {
                    title: res.title || "",
                    abstract: res.abstract || "",
                    methodology: res.methodology || "",
                    relatedLiterature: res.review_of_related_literature || "",
                    theoreticalFramework: res.theoretical_framework || "",
                    resultsDiscussion: res.results_and_discussion || "",
                    keywords: (res.keywords || []).join(", "),
                    authors: (res.authors || []).join(", "),
                };
                suggestedSdgs = res.suggested_sdgs || [];
                if (suggestedSdgs.length > 0) {
                    setSelectedSdgs(suggestedSdgs.map((s) => s.sdg));
                }
            })
            .catch((err) => {
                backendError = err instanceof Error ? err.message : "AI extraction failed.";
            });

        let prog = 0;
        const iv = setInterval(() => {
            prog += Math.random() * 10 + 4;
            if (prog >= 90 && !backendResult && !backendError) {
                prog = 90;
            }
            const stageIdx = Math.min(AI_STAGES.length - 1, Math.floor((prog / 100) * AI_STAGES.length));
            setMetaProgress(Math.min(100, Math.round(prog)));
            setMetaStage(stageIdx);

            if (prog >= 100 || (prog >= 90 && (backendResult || backendError))) {
                clearInterval(iv);
                setMetaProgress(100);
                setMetaStage(AI_STAGES.length - 1);
                setTimeout(() => {
                    setMetaAnalyzing(false);
                    if (backendError) {
                        setSaveError(backendError);
                    } else if (backendResult) {
                        setMetaReady(true);
                        setMetadata(backendResult);
                        setPublicFields(["title", "abstract", "methodology", "resultsDiscussion"]);
                    }
                }, 500);
            }
        }, 180);
    };

    // ── Derived report values
    const alloc = typeof allocBudget === "number" ? allocBudget : 0;
    const used = typeof usedBudget === "number" ? usedBudget : 0;
    const remaining = Math.max(0, alloc - used);
    const utilPct = alloc > 0 ? Math.min(100, Math.round((used / alloc) * 100)) : 0;
    const activeProjects = projects.filter((p) => p.target.trim());
    const completedCount = activeProjects.filter(
        (p) => computeStatus(p.accomplishmentPct) === "Completed",
    ).length;
    const completionRate =
        activeProjects.length > 0 ? Math.round((completedCount / activeProjects.length) * 100) : 0;
    // Use guaranteed-unique index-based names so Recharts never generates duplicate SVG child keys
    const barData = activeProjects.map((p, i) => ({
        name: `R${i + 1}`,
        Target: 100,
        Actual: p.accomplishmentPct,
    }));
    const papChartData = selectedPAPs.map((id) => ({
        name: PAP_CATEGORIES.find((c) => c.id === id)?.label ?? id,
        value: 1,
        color: PAP_CATEGORIES.find((c) => c.id === id)?.color ?? "#ccc",
    }));

    // ── Validation — Research
    const researchValidation = [
        { label: "Document Type", ok: !!docType, step: 1 },
        { label: "File Uploaded", ok: !!file && uploadProg >= 100, step: 2 },
        { label: "Metadata Draft", ok: metaReady, step: 3 },
        { label: "SDG Tags", ok: selectedSdgs.length > 0, step: 4 },
        { label: "Access Policy", ok: !!accessMode, step: 5 },
        ...(accessMode === "embargo" ? [{ label: "Embargo Date", ok: embargoDate.length > 0, step: 5 }] : []),
    ];

    // ── Validation — Reports
    const reportValidation = [
        { label: "Document Type", ok: !!docType, step: 1 },
        { label: "File Uploaded", ok: !!file && uploadProg >= 100, step: 2 },
        { label: "Report Title", ok: title2.trim().length > 0 || metadata.title.trim().length > 0, step: 2 },
        { label: "Quarter & Year", ok: !!quarter, step: 2 },
        { label: "Metadata Draft", ok: metaReady, step: 3 },
        { label: "Performance Rows", ok: activeProjects.length > 0, step: 4 },
        { label: "PAP Categories", ok: selectedPAPs.length > 0, step: 5 },
        { label: "Budget Allocated", ok: alloc > 0, step: 6 },
        { label: "SDG Tagged", ok: selectedSdgs.length > 0, step: 8 },
    ];

    const isResearch = docType === "research";
    const isReport = docType === "terminal" || docType === "pap";
    const validationItems = isResearch ? researchValidation : reportValidation;
    const passCount = validationItems.filter((v) => v.ok).length;
    const failCount = validationItems.filter((v) => !v.ok).length;
    const canSubmitFull = failCount === 0;
    const totalSteps = isResearch ? 6 : 9;
    const reviewStep = totalSteps;
    const prevToReviewStep = totalSteps - 1;

    const canProceed = (): boolean => {
        if (step === 1) return !!docType;
        if (isResearch) {
            switch (step) {
                case 2:
                    return !!file && !isUploading && uploadProg >= 100;
                case 3:
                    return metaReady;
                case 4:
                    return selectedSdgs.length > 0;
                case 5:
                    return (
                        !!accessMode &&
                        (accessMode !== "embargo" || embargoDate.length > 0) &&
                        (accessMode !== "external" || externalUrl.length > 0)
                    );
                case 6:
                    return true;
            }
        }
        if (isReport) {
            switch (step) {
                case 2:
                    return !!file && !isUploading && uploadProg >= 100 && !!quarter;
                case 3:
                    return metaReady;
                case 4:
                    return activeProjects.length > 0;
                case 5:
                    return selectedPAPs.length > 0;
                case 6:
                    return alloc > 0;
                case 7:
                    return true;
                case 8:
                    return selectedSdgs.length > 0;
                case 9:
                    return true;
            }
        }
        return false;
    };

    const handleFileSelected = async (selected: File) => {
        const extensionAllowed = /\.pdf$/i.test(selected.name);
        if (!extensionAllowed) {
            setSaveError("Choose a PDF file.");
            return;
        }
        if (selected.size > 25 * 1024 * 1024) {
            setSaveError("The document must not exceed 25 MB.");
            return;
        }
        if (!docType) return;
        setSaveError("");
        setFile(selected);
        setIsUploading(true);
        setUploadProg(0);
        setDocumentId(null);

        const formData = new FormData();
        formData.append("document_type", docType);
        formData.append("document_file", selected);

        let simulatedProg = 0;
        const iv = setInterval(() => {
            simulatedProg += Math.random() * 12 + 6;
            if (simulatedProg >= 90) {
                simulatedProg = 90;
            }
            setUploadProg(simulatedProg);
        }, 150);

        try {
            const res = await postFormData<{ document_id: number; original_filename: string; file_size: number }>(
                "/api/rikms/documents/upload-draft",
                formData
            );

            clearInterval(iv);
            setUploadProg(100);
            setDocumentId(res.document_id);
            setIsUploading(false);
            setMetaReady(false);
        } catch (err) {
            clearInterval(iv);
            setIsUploading(false);
            setFile(null);
            setUploadProg(0);
            setSaveError(err instanceof Error ? err.message : "File upload failed.");
        }
    };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files[0]) handleFileSelected(e.dataTransfer.files[0]);
    };

    const addProject = () =>
        setProjects((p) => [
            ...p,
            { id: Date.now().toString(), target: "", actualPct: 0, accomplishmentPct: 0 },
        ]);
    const updateProject = (id: string, field: keyof ProjectRow, v: string | number) =>
        setProjects((p) => p.map((r) => (r.id === id ? { ...r, [field]: v } : r)));
    const removeProject = (id: string) => {
        if (projects.length > 1) setProjects((p) => p.filter((r) => r.id !== id));
    };
    const togglePAP = (id: string) =>
        setSelectedPAPs((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
    const toggleSector = (s: string) =>
        setSelectedSectors((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));
    const toggleSdg = (n: number) =>
        setSelectedSdgs((p) => (p.includes(n) ? p.filter((x) => x !== n) : [...p, n]));
    const togglePublic = (k: MetadataKey) =>
        setPublicFields((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));
    const updateMeta = (k: MetadataKey, v: string) => setMetadata((m) => ({ ...m, [k]: v }));

    const doReset = () => {
        setIsSubmitted(false);
        setStep(1);
        setDocTypeRaw(null);
        setFile(null);
        setUploadProg(0);
        setTitleOverride("");
        setTitle2("");
        setDesc2("");
        setQuarter("");
        setYear(String(CURRENT_YEAR));
        setMetaReady(false);
        setMetadata({
            title: "",
            abstract: "",
            methodology: "",
            relatedLiterature: "",
            theoreticalFramework: "",
            resultsDiscussion: "",
            keywords: "",
            authors: "",
        });
        setPublicFields(["title", "abstract"]);
        setSelectedSdgs([]);
        setProjects([{ id: "1", target: "", actualPct: 0, accomplishmentPct: 0 }]);
        setSelectedPAPs([]);
        setAllocBudget("");
        setUsedBudget("");
        setHlTitle("");
        setHlDesc("");
        setAccessMode(uploadAccessMode(agencySettings.data?.data.defaultAccessMode));
        setEmbargoDate("");
        setExternalUrl("");
        setSubmitMode(null);
        setSaveError("");
        setIsSaving(false);
        setDocumentId(null);
    };

    const appendJson = (payload: FormData, key: string, value: unknown) => {
        payload.append(key, JSON.stringify(value));
    };

    const submitDocument = async (mode: "draft" | "submit") => {
        if (!docType) return;

        setIsSaving(true);
        setSaveError("");

        const payload = new FormData();
        payload.append("document_type", docType);
        payload.append("submit_mode", mode);
        payload.append("title", metadata.title || titleOverride || title2 || "Untitled research record");
        payload.append("description", description2 || metadata.abstract || "");
        payload.append("year", year || String(CURRENT_YEAR));
        payload.append("quarter", quarter);
        payload.append("access_mode", accessMode || "public");
        payload.append("embargo_until", embargoDate);
        payload.append("external_url", externalUrl);
        appendJson(payload, "metadata", metadata);
        appendJson(payload, "public_fields", publicFields);
        appendJson(payload, "sdg_tags", selectedSdgs);

        if (isReport) {
            appendJson(payload, "projects", activeProjects);
            appendJson(payload, "pap", {
                categories: selectedPAPs,
                description: papDescription,
                sectors: selectedSectors,
            });
            appendJson(payload, "financials", {
                allocated: alloc,
                used,
            });
            if (hlTitle.trim() || hlDesc.trim() || featured || hlFile) {
                appendJson(payload, "highlight", {
                    title: hlTitle,
                    description: hlDesc,
                    featured,
                });
            }
        }

        if (documentId) {
            payload.append("document_id", documentId.toString());
        } else {
            if (file) payload.append("document_file", file);
        }
        if (isReport && hlFile) payload.append("highlight_file", hlFile);

        try {
            const response = await apiPost<{
                documentId: number;
                status: string;
                analysisQueued?: boolean;
                redirect: string;
            }>("/api/rikms/documents", payload);
            if (isResearch) {
                navigate(`/agency/research/${response.documentId}/edit`, {
                    replace: true,
                    state: {
                        autoApplyAi: response.analysisQueued === true,
                        fromUpload: true,
                    },
                });
                return;
            }
            setShowConfirm(false);
            setSubmitMode(mode);
            setIsSubmitted(true);
        } catch (error) {
            setSaveError(firstValidationError(error));
        } finally {
            setIsSaving(false);
        }
    };

    // ── Success screen
    if (isSubmitted) {
        return (
            <div className="flex flex-col items-center justify-center py-24 space-y-6">
                <div className="relative">
                    <div className="w-28 h-28 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-14 h-14 text-green-500" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-8 h-8 bg-[#1E3A8A] rounded-full flex items-center justify-center">
                        <Globe className="w-4 h-4 text-white" />
                    </div>
                </div>
                <div className="text-center space-y-2">
                    <h2 className="text-[#1E3A8A]" style={{ fontSize: "1.6rem", fontWeight: 700 }}>
                        {submitMode === "submit"
                            ? isResearch
                                ? "Research Successfully Submitted!"
                                : "Report Successfully Submitted!"
                            : "Draft Saved Successfully!"}
                    </h2>
                    <p className="text-gray-500 text-sm max-w-md mx-auto">
                        {submitMode === "submit"
                            ? `"${metadata.title || titleOverride || title2 || "Untitled"}" has been submitted to the RIKMS repository${selectedSdgs.length > 0 ? ` and tagged with ${selectedSdgs.length} SDG goal${selectedSdgs.length !== 1 ? "s" : ""}` : ""}.`
                            : "Your draft is safely stored. You can continue editing anytime from the Research Repository."}
                    </p>
                </div>
                {selectedSdgs.length > 0 && submitMode === "submit" && (
                    <div className="flex flex-wrap gap-2 justify-center max-w-sm">
                        {selectedSdgs.map((n) => {
                            const sdg = SDG_DATA.find((s) => s.number === n);
                            return (
                                <span
                                    key={`suc-sdg-${n}`}
                                    className="px-3 py-1 rounded-full text-white text-xs font-semibold"
                                    style={{ background: sdg?.color }}
                                >
                                    SDG {n} · {SDG_SHORT[n]}
                                </span>
                            );
                        })}
                    </div>
                )}
                <div className="flex gap-3 flex-wrap justify-center">
                    <Link
                        to="/agency/research"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1E3A8A] text-white rounded-xl text-sm font-medium hover:bg-[#1E3A8A]/90 transition-colors"
                    >
                        <Database className="w-4 h-4" /> View in Repository
                    </Link>
                    <button
                        onClick={doReset}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Upload Another
                    </button>
                </div>
            </div>
        );
    }

    const subtitle = isResearch
        ? "Submit research articles with review-gated Gemini metadata assistance"
        : "Submit structured reports with review-gated Gemini metadata assistance";

    return (
        <div className="space-y-5">
            {/* ── Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                    <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
                        <Link
                            to="/agency/dashboard"
                            className="flex items-center gap-1 hover:text-[#1E3A8A] transition-colors"
                        >
                            <Home className="w-3.5 h-3.5" /> Dashboard
                        </Link>
                        <ChevronRight className="w-3 h-3" />
                        <span>Upload</span>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-[#1E3A8A] font-semibold">New Document</span>
                    </nav>
                    <h1 className="text-[#1E3A8A]" style={{ fontSize: "1.5rem", fontWeight: 700 }}>
                        Upload Document
                    </h1>
                    <p className="text-gray-500 text-sm mt-0.5">{subtitle}</p>
                </div>
                <div
                    className="flex items-center gap-2 px-3 py-2 border border-[#BFDBFE] rounded-xl shrink-0"
                    style={{
                        background: isResearch
                            ? "linear-gradient(to right, #EFF6FF, #F5F3FF)"
                            : "linear-gradient(to right, #F5F3FF, #EFF6FF)",
                    }}
                >
                    <Brain className="w-4 h-4" style={{ color: isResearch ? "#1E3A8A" : "#7C3AED" }} />
                    <span
                        className="text-xs font-semibold"
                        style={{ color: isResearch ? "#1E3A8A" : "#7C3AED" }}
                    >
                        Review-assisted · {isResearch ? "6" : isReport ? "9" : "?"}-Step Wizard
                    </span>
                </div>
            </div>

            {/* ── Dynamic Stepper */}
            <StepProgress currentStep={step} docType={docType} />

            {/* ── Body */}
            <div className="flex flex-col xl:flex-row gap-5">
                {/* LEFT: Form */}
                <div className="flex-1 min-w-0 space-y-4">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        {/* Step 1 — Shared Doc Type */}
                        {step === 1 && <StepDocType docType={docType} setDocType={setDocType} />}

                        {/* ── RESEARCH FLOW steps 2–6 */}
                        {isResearch && step === 2 && (
                            <StepUploadResearch
                                file={file}
                                isDragOver={isDragOver}
                                isUploading={isUploading}
                                uploadProg={uploadProg}
                                titleOverride={titleOverride}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setIsDragOver(true);
                                }}
                                onDragLeave={() => setIsDragOver(false)}
                                onDrop={handleDrop}
                                onFileSelect={handleFileSelected}
                                onRemoveFile={() => {
                                    setFile(null);
                                    setUploadProg(0);
                                    setIsUploading(false);
                                    setDocumentId(null);
                                }}
                                setTitleOverride={setTitleOverride}
                            />
                        )}
                        {isResearch && step === 3 && (
                            <StepAiMetadata
                                analyzing={metaAnalyzing}
                                ready={metaReady}
                                progress={metaProgress}
                                stage={metaStage}
                                aiStages={AI_STAGES}
                                metadata={metadata}
                                publicFields={publicFields}
                                expandedMeta={expandedMeta}
                                setExpandedMeta={setExpandedMeta}
                                onRunAnalysis={runAiAnalysis}
                                onUpdateMeta={updateMeta}
                                onTogglePublic={togglePublic}
                                onSelectAll={() =>
                                    setPublicFields(METADATA_VISIBILITY_FIELDS.map((f) => f.key))
                                }
                                onClearAll={() => setPublicFields([])}
                                stepNum={3}
                                total={6}
                            />
                        )}
                        {isResearch && step === 4 && (
                            <StepSdgTagging
                                selectedSdgs={selectedSdgs}
                                toggleSdg={toggleSdg}
                                aiApplied={aiSdgApplied}
                                onAiApply={() => {
                                    SDG_SUGGESTED.forEach((n) => {
                                        if (!selectedSdgs.includes(n)) toggleSdg(n);
                                    });
                                    setAiSdgApplied(true);
                                }}
                                tooltip={sdgTooltip}
                                setTooltip={setSdgTooltip}
                                stepNum={4}
                                total={6}
                            />
                        )}
                        {isResearch && step === 5 && (
                            <StepAccessControl
                                accessMode={accessMode}
                                setAccessMode={setAccessMode}
                                embargoDate={embargoDate}
                                setEmbargoDate={setEmbargoDate}
                                externalUrl={externalUrl}
                                setExternalUrl={setExternalUrl}
                            />
                        )}
                        {isResearch && step === 6 && (
                            <StepReviewResearch
                                docType={docType}
                                title={titleOverride}
                                file={file}
                                metadata={metadata}
                                publicFields={publicFields}
                                selectedSdgs={selectedSdgs}
                                accessMode={accessMode}
                                embargoDate={embargoDate}
                                externalUrl={externalUrl}
                                validationItems={researchValidation}
                                passCount={passCount}
                                failCount={failCount}
                                validationExpanded={validationExpanded}
                                setValidationExpanded={setValidationExpanded}
                                onGoToStep={setStep}
                            />
                        )}

                        {/* ── REPORT FLOW steps 2–9 */}
                        {isReport && step === 2 && (
                            <StepDetailsReport
                                file={file}
                                isDragOver={isDragOver}
                                isUploading={isUploading}
                                uploadProg={uploadProg}
                                title={title2}
                                description={description2}
                                quarter={quarter}
                                year={year}
                                agency={agency}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setIsDragOver(true);
                                }}
                                onDragLeave={() => setIsDragOver(false)}
                                onDrop={handleDrop}
                                onFileSelect={handleFileSelected}
                                onRemoveFile={() => {
                                    setFile(null);
                                    setUploadProg(0);
                                    setIsUploading(false);
                                    setDocumentId(null);
                                }}
                                setTitle={setTitle2}
                                setDescription={setDesc2}
                                setQuarter={setQuarter}
                                setYear={setYear}
                            />
                        )}
                        {isReport && step === 3 && (
                            <StepAiMetadata
                                analyzing={metaAnalyzing}
                                ready={metaReady}
                                progress={metaProgress}
                                stage={metaStage}
                                aiStages={AI_STAGES}
                                metadata={metadata}
                                publicFields={publicFields}
                                expandedMeta={expandedMeta}
                                setExpandedMeta={setExpandedMeta}
                                onRunAnalysis={runAiAnalysis}
                                onUpdateMeta={updateMeta}
                                onTogglePublic={togglePublic}
                                onSelectAll={() =>
                                    setPublicFields(METADATA_VISIBILITY_FIELDS.map((f) => f.key))
                                }
                                onClearAll={() => setPublicFields([])}
                                stepNum={3}
                                total={9}
                            />
                        )}
                        {isReport && step === 4 && (
                            <StepPerformance
                                projects={projects}
                                projectTitle={metadata.title || title2}
                                onAdd={addProject}
                                onUpdate={updateProject}
                                onRemove={removeProject}
                            />
                        )}
                        {isReport && step === 5 && (
                            <StepPAP
                                selectedPAPs={selectedPAPs}
                                togglePAP={togglePAP}
                                description={papDescription}
                                setDescription={setPapDescription}
                                selectedSectors={selectedSectors}
                                toggleSector={toggleSector}
                                aiApplied={aiPapApplied}
                                onAiApply={() => {
                                    ["digital", "sti"].forEach((id) => {
                                        if (!selectedPAPs.includes(id)) togglePAP(id);
                                    });
                                    setAiPapApplied(true);
                                }}
                            />
                        )}
                        {isReport && step === 6 && (
                            <StepFinancials
                                allocated={allocBudget}
                                used={usedBudget}
                                remaining={remaining}
                                utilPct={utilPct}
                                setAllocated={setAllocBudget}
                                setUsed={setUsedBudget}
                            />
                        )}
                        {isReport && step === 7 && (
                            <StepHighlights
                                title={hlTitle}
                                description={hlDesc}
                                featured={featured}
                                file={hlFile}
                                setTitle={setHlTitle}
                                setDescription={setHlDesc}
                                setFeatured={setFeatured}
                                setFile={setHlFile}
                            />
                        )}
                        {isReport && step === 8 && (
                            <StepSdgTagging
                                selectedSdgs={selectedSdgs}
                                toggleSdg={toggleSdg}
                                aiApplied={aiSdgApplied}
                                onAiApply={() => {
                                    SDG_SUGGESTED.forEach((n) => {
                                        if (!selectedSdgs.includes(n)) toggleSdg(n);
                                    });
                                    setAiSdgApplied(true);
                                }}
                                tooltip={sdgTooltip}
                                setTooltip={setSdgTooltip}
                                stepNum={8}
                                total={9}
                            />
                        )}
                        {isReport && step === 9 && (
                            <StepReviewReport
                                docType={docType}
                                title={title2}
                                description={description2}
                                quarter={quarter}
                                year={year}
                                agency={agency}
                                file={file}
                                metadata={metadata}
                                publicFields={publicFields}
                                projects={activeProjects}
                                selectedPAPs={selectedPAPs}
                                selectedSectors={selectedSectors}
                                alloc={alloc}
                                used={used}
                                remaining={remaining}
                                utilPct={utilPct}
                                hlTitle={hlTitle}
                                hlDescription={hlDesc}
                                featured={featured}
                                completionRate={completionRate}
                                selectedSdgs={selectedSdgs}
                                validationItems={reportValidation}
                                passCount={passCount}
                                failCount={failCount}
                                validationExpanded={validationExpanded}
                                setValidationExpanded={setValidationExpanded}
                                onGoToStep={setStep}
                            />
                        )}
                    </div>

                    {/* ── Navigation */}
                    <div className="flex items-center justify-between gap-3">
                        <button
                            onClick={() => setStep((s) => Math.max(1, s - 1))}
                            disabled={step === 1}
                            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${step === 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:bg-gray-100 border border-gray-200"}`}
                        >
                            <ChevronLeft className="w-4 h-4" /> Previous
                        </button>

                        <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-400 font-medium">
                                {step} / {!docType ? "?" : isResearch ? 2 : totalSteps}
                            </span>

                            {step < reviewStep && (
                                <button
                                    onClick={() => {
                                        if (isResearch && step === 2) {
                                            void submitDocument("draft");
                                            return;
                                        }
                                        setStep((s) => Math.min(totalSteps, s + 1));
                                    }}
                                    disabled={!canProceed() || isSaving}
                                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm ${canProceed() && !isSaving ? "bg-[#1E3A8A] text-white hover:bg-[#1E3A8A]/90" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
                                >
                                    {isResearch && step === 2
                                        ? isSaving
                                            ? "Creating metadata draft…"
                                            : "Continue to AI metadata"
                                        : step === prevToReviewStep
                                          ? "Review & Submit"
                                          : "Continue"}{" "}
                                    {isResearch && step === 2 && isSaving ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <ChevronRight className="w-4 h-4" />
                                    )}
                                </button>
                            )}

                            {step === reviewStep && (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => submitDocument("draft")}
                                        disabled={isSaving}
                                        className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                                    >
                                        <Save className="w-4 h-4" /> {isSaving ? "Saving..." : "Save Draft"}
                                    </button>
                                    <button
                                        onClick={() => setShowConfirm(true)}
                                        disabled={isSaving || !canSubmitFull}
                                        className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm ${canSubmitFull ? "bg-green-600 text-white hover:bg-green-700" : "cursor-not-allowed bg-gray-200 text-gray-400"}`}
                                    >
                                        <Send className="w-4 h-4" />
                                        {isSaving
                                            ? "Saving..."
                                            : canSubmitFull
                                              ? isResearch
                                                  ? "Submit Research"
                                                  : "Submit Report"
                                              : `Complete ${failCount} required item${failCount === 1 ? "" : "s"}`}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    {saveError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                            {saveError}
                        </div>
                    )}
                </div>

                {/* RIGHT: Dynamic Preview */}
                <div className="xl:w-[270px] shrink-0">
                    {(!docType || isResearch) && (
                        <LivePreviewResearch
                            step={step}
                            docType={docType}
                            title={titleOverride}
                            file={file}
                            metaReady={metaReady}
                            publicFields={publicFields}
                            metadata={metadata}
                            selectedSdgs={selectedSdgs}
                            accessMode={accessMode}
                            passCount={passCount}
                            totalChecks={validationItems.length}
                        />
                    )}
                    {isReport && (
                        <LivePreviewReport
                            step={step}
                            docType={docType}
                            title={title2}
                            file={file}
                            quarter={quarter}
                            year={year}
                            metaReady={metaReady}
                            publicFields={publicFields}
                            metadata={metadata}
                            totalProjects={activeProjects.length}
                            completionRate={completionRate}
                            utilPct={utilPct}
                            barData={barData}
                            papChartData={papChartData}
                            selectedPAPs={selectedPAPs}
                            alloc={alloc}
                            used={used}
                            selectedSdgs={selectedSdgs}
                            passCount={passCount}
                            totalChecks={validationItems.length}
                        />
                    )}
                </div>
            </div>

            {/* ── Confirm Modal */}
            {showConfirm && (
                <div>
                    <button
                        type="button"
                        aria-label="Close submission confirmation"
                        className="fixed inset-0 z-50 bg-black/50"
                        onClick={() => setShowConfirm(false)}
                    />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div
                            ref={submissionDialogRef}
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="confirm-submission-title"
                            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                    <Send className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <h3
                                        id="confirm-submission-title"
                                        className="text-[#1E3A8A]"
                                        style={{ fontSize: "1.1rem", fontWeight: 700 }}
                                    >
                                        Confirm Submission
                                    </h3>
                                    <p className="text-xs text-gray-400">
                                        This will submit the document to RIKMS for formal review
                                    </p>
                                </div>
                            </div>
                            <div className="bg-[#F8FAFF] rounded-xl p-4 space-y-2 border border-[#BFDBFE]">
                                <p className="text-sm text-gray-800 font-semibold leading-snug">
                                    {metadata.title || titleOverride || title2 || "Untitled"}
                                </p>
                                {isReport && (
                                    <p className="text-xs text-gray-400">
                                        {quarter} {year}
                                    </p>
                                )}
                                {selectedSdgs.length > 0 && (
                                    <div className="flex flex-wrap gap-1 pt-1">
                                        {selectedSdgs.map((n) => {
                                            const sdg = SDG_DATA.find((s) => s.number === n);
                                            return (
                                                <span
                                                    key={`conf-sdg-${n}`}
                                                    className="px-2 py-0.5 rounded-full text-white text-[10px] font-semibold"
                                                    style={{ background: sdg?.color }}
                                                >
                                                    SDG {n}
                                                </span>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            {!canSubmitFull && (
                                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                                    <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                                    <p className="text-xs text-amber-700 font-medium">
                                        {failCount} validation item{failCount > 1 ? "s are" : " is"}{" "}
                                        incomplete. The document may be flagged for review.
                                    </p>
                                </div>
                            )}
                            <p className="text-xs text-gray-500">
                                By submitting, you certify that all information is accurate and in accordance
                                with the RIKMS submission standards for Region XI.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    ref={submissionInitialFocusRef}
                                    onClick={() => setShowConfirm(false)}
                                    className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => submitDocument("submit")}
                                    disabled={isSaving}
                                    className="px-5 py-2 text-sm bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold"
                                >
                                    {isSaving ? "Submitting..." : "Confirm &amp; Submit"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

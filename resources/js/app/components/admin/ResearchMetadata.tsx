import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { ArrowLeft, Brain, Check, FileUp, Info, Plus, RefreshCw, Save, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useApi } from "../../hooks/useApi";
import {
    apiPatch,
    apiPost,
    firstValidationError,
    type DocumentAiAnalysisResponse,
    type ResearchDocument,
} from "../../lib/api";
import { SDG_DATA } from "../../data/reference-data";
import { ErrorState, LoadingState } from "../shared/AsyncState";
import { StatusBadge } from "../shared/StatusBadge";

type DetailResponse = { data: ResearchDocument };

interface MetadataForm {
    title: string;
    year: string;
    quarter: string;
    category: string;
    authors: string;
    keywords: string;
    abstract: string;
    methodology: string;
    relatedLiterature: string;
    theoreticalFramework: string;
    resultsDiscussion: string;
    doi: string;
}

interface ReportProject {
    id: string;
    target: string;
    actualPct: number;
    accomplishmentPct: number;
}

const REPORT_SECTORS = ["Government", "Academe", "Business", "Civil Society", "Media"];

const EMPTY_FORM: MetadataForm = {
    title: "",
    year: String(new Date().getFullYear()),
    quarter: "",
    category: "",
    authors: "",
    keywords: "",
    abstract: "",
    methodology: "",
    relatedLiterature: "",
    theoreticalFramework: "",
    resultsDiscussion: "",
    doi: "",
};

const PUBLIC_FIELDS: Array<{ key: string; label: string }> = [
    { key: "title", label: "Title" },
    { key: "abstract", label: "Abstract" },
    { key: "methodology", label: "Methodology" },
    { key: "review_of_related_literature", label: "Review of related literature" },
    { key: "theoretical_framework", label: "Theoretical framework" },
    { key: "results_and_discussion", label: "Results and discussion" },
    { key: "authors", label: "Authors" },
    { key: "keywords", label: "Keywords" },
];

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">{label}</span>
            {children}
            {hint && <span className="mt-1 block text-xs text-gray-500">{hint}</span>}
        </label>
    );
}

const inputClass =
    "w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-blue-100";

export function ResearchMetadata() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const uploadState = location.state as {
        autoApplyAi?: boolean;
        fromUpload?: boolean;
    } | null;
    const autoApplyAi = Boolean(uploadState?.autoApplyAi);
    const fromUpload = Boolean(uploadState?.fromUpload);
    const autoAppliedAnalysisId = useRef<number | null>(null);
    const detail = useApi<DetailResponse>(id ? `/api/rikms/agency/documents/${id}` : null);
    const aiAnalysis = useApi<DocumentAiAnalysisResponse>(
        id ? `/api/rikms/agency/documents/${id}/ai-analysis` : null,
    );
    const [form, setForm] = useState<MetadataForm>(EMPTY_FORM);
    const [publicFields, setPublicFields] = useState<string[]>(["title", "abstract"]);
    const [sdgs, setSdgs] = useState<number[]>([]);
    const [saving, setSaving] = useState(false);
    const [sourceFile, setSourceFile] = useState<File | null>(null);
    const [fileInputKey, setFileInputKey] = useState(0);
    const [saveError, setSaveError] = useState("");
    const [projects, setProjects] = useState<ReportProject[]>([
        { id: crypto.randomUUID(), target: "", actualPct: 0, accomplishmentPct: 0 },
    ]);
    const [papCategories, setPapCategories] = useState("");
    const [papDescription, setPapDescription] = useState("");
    const [papSectors, setPapSectors] = useState<string[]>([]);
    const [financialAllocated, setFinancialAllocated] = useState("");
    const [financialReleased, setFinancialReleased] = useState("");
    const [financialObligated, setFinancialObligated] = useState("");
    const [financialUsed, setFinancialUsed] = useState("");
    const [financialAsOfDate, setFinancialAsOfDate] = useState("");
    const [highlightTitle, setHighlightTitle] = useState("");
    const [highlightDescription, setHighlightDescription] = useState("");
    const [highlightFeatured, setHighlightFeatured] = useState(false);
    const [initializedId, setInitializedId] = useState<number | null>(null);
    const [aiBusy, setAiBusy] = useState(false);
    const [appliedAnalysisId, setAppliedAnalysisId] = useState<number | null>(null);
    const [acceptedAiFields, setAcceptedAiFields] = useState<string[]>([]);
    const currentAnalysis = aiAnalysis.data?.data;
    const queuedForLongerThanFifteenSeconds =
        currentAnalysis?.status === "queued" &&
        Boolean(currentAnalysis.createdAt) &&
        Date.now() - Date.parse(currentAnalysis.createdAt) >= 15_000;

    useEffect(() => {
        const document = detail.data?.data;
        if (!document || initializedId === document.id) return;
        const metadata = document.metadata ?? {};
        setForm({
            title: metadata.title ?? document.title ?? "",
            year: String(document.year ?? new Date().getFullYear()),
            quarter: document.quarter ?? "",
            category: document.category ?? "",
            authors: (metadata.authors ?? document.authors ?? []).join(", "),
            keywords: (metadata.keywords ?? document.keywords ?? []).join(", "),
            abstract: metadata.abstract ?? document.abstract ?? "",
            methodology: metadata.methodology ?? "",
            relatedLiterature: metadata.reviewOfRelatedLiterature ?? "",
            theoreticalFramework: metadata.theoreticalFramework ?? "",
            resultsDiscussion: metadata.resultsAndDiscussion ?? "",
            doi: metadata.doi ?? "",
        });
        setPublicFields(document.publicFields ?? ["title", "abstract"]);
        setSdgs(document.sdgs ?? []);
        const performanceRows = document.performanceRows ?? [];
        setProjects(
            performanceRows.length
                ? performanceRows.map((row) => ({
                      id: String(row.id ?? crypto.randomUUID()),
                      target: row.target ?? "",
                      actualPct: row.actual ?? 0,
                      accomplishmentPct: row.accomplishmentPercentage ?? 0,
                  }))
                : [{ id: crypto.randomUUID(), target: "", actualPct: 0, accomplishmentPct: 0 }],
        );
        const pap = document.papClassifications ?? [];
        setPapCategories(pap.map((item) => item.category).join(", "));
        setPapDescription(pap.find((item) => item.description)?.description ?? "");
        setPapSectors(Array.from(new Set(pap.flatMap((item) => item.sectors ?? []))));
        setFinancialAllocated(String(document.financial?.allocated ?? ""));
        setFinancialReleased(String(document.financial?.released ?? ""));
        setFinancialObligated(String(document.financial?.obligated ?? ""));
        setFinancialUsed(String(document.financial?.used ?? ""));
        setFinancialAsOfDate(document.financial?.asOfDate ?? "");
        setInitializedId(document.id);
    }, [detail.data, initializedId]);

    useEffect(() => {
        const status = aiAnalysis.data?.data?.status;
        if (status !== "queued" && status !== "processing") return;

        const timer = window.setInterval(() => void aiAnalysis.refresh(), 3000);
        return () => window.clearInterval(timer);
    }, [aiAnalysis, aiAnalysis.data?.data?.status]);

    useEffect(() => {
        const analysis = aiAnalysis.data?.data;
        const suggestions = analysis?.suggestions;
        if (
            !autoApplyAi ||
            !analysis ||
            analysis.status !== "completed" ||
            !suggestions ||
            initializedId !== detail.data?.data.id ||
            autoAppliedAnalysisId.current === analysis.id
        ) {
            return;
        }

        autoAppliedAnalysisId.current = analysis.id;
        setForm((current) => ({
            ...current,
            title:
                current.title && current.title !== "Untitled research record"
                    ? current.title
                    : suggestions.title || current.title,
            abstract: current.abstract || suggestions.abstract,
            methodology: current.methodology || suggestions.methodology,
            relatedLiterature: current.relatedLiterature || suggestions.review_of_related_literature,
            theoreticalFramework: current.theoreticalFramework || suggestions.theoretical_framework,
            resultsDiscussion: current.resultsDiscussion || suggestions.results_and_discussion,
            keywords: current.keywords || suggestions.keywords.join(", "),
            authors: current.authors || suggestions.authors.join(", "),
            doi: current.doi || suggestions.doi,
            category: current.category || suggestions.category,
        }));
        const suggestedSdgs = suggestions.suggested_sdgs.map((item) => item.number);
        setSdgs((current) => (current.length ? current : suggestedSdgs));
        setAppliedAnalysisId(analysis.id);
        setAcceptedAiFields([
            "title",
            "abstract",
            "methodology",
            "review_of_related_literature",
            "theoretical_framework",
            "results_and_discussion",
            "keywords",
            "authors",
            "doi",
            "category",
            ...(suggestedSdgs.length ? ["suggested_sdgs"] : []),
        ]);
        toast.success("AI suggestions filled the editable metadata draft. Review them before saving.");
    }, [aiAnalysis.data?.data, autoApplyAi, detail.data?.data.id, initializedId]);

    function update<K extends keyof MetadataForm>(key: K, value: MetadataForm[K]) {
        setForm((current) => ({ ...current, [key]: value }));
    }

    function togglePublic(key: string) {
        if (key === "title") return;
        setPublicFields((current) =>
            current.includes(key) ? current.filter((field) => field !== key) : [...current, key],
        );
    }

    function toggleSdg(number: number) {
        setSdgs((current) =>
            current.includes(number) ? current.filter((item) => item !== number) : [...current, number],
        );
    }

    async function createRevision() {
        if (
            !id ||
            !window.confirm(
                "Create an editable revision? The published record will be withdrawn and changed to a draft until it passes review again.",
            )
        )
            return;
        setSaving(true);
        setSaveError("");
        try {
            await apiPatch(`/api/rikms/agency/documents/${id}`, {
                change_summary: "Started a revision of the published record",
            });
            toast.success("Revision draft created. You can now edit the record.");
            await detail.refresh();
        } catch (error) {
            const message = firstValidationError(error);
            setSaveError(message);
            toast.error(message);
        } finally {
            setSaving(false);
        }
    }

    async function queueAiAnalysis() {
        if (!id) return;
        setAiBusy(true);
        setSaveError("");
        try {
            await apiPost(`/api/rikms/agency/documents/${id}/ai-analysis`);
            toast.success("Document analysis queued.");
            await aiAnalysis.refresh();
        } catch (error) {
            const message = firstValidationError(error);
            setSaveError(message);
            toast.error(message);
        } finally {
            setAiBusy(false);
        }
    }

    function applyAiSuggestions() {
        const analysis = aiAnalysis.data?.data;
        const suggestions = analysis?.suggestions;
        if (!analysis || !suggestions) return;

        setForm((current) => ({
            ...current,
            title: suggestions.title || current.title,
            abstract: suggestions.abstract || current.abstract,
            methodology: suggestions.methodology || current.methodology,
            relatedLiterature: suggestions.review_of_related_literature || current.relatedLiterature,
            theoreticalFramework: suggestions.theoretical_framework || current.theoreticalFramework,
            resultsDiscussion: suggestions.results_and_discussion || current.resultsDiscussion,
            keywords: suggestions.keywords.join(", ") || current.keywords,
            authors: suggestions.authors.join(", ") || current.authors,
            doi: suggestions.doi || current.doi,
            category: suggestions.category || current.category,
        }));
        const suggestedSdgs = suggestions.suggested_sdgs.map((item) => item.number);
        if (suggestedSdgs.length) setSdgs(suggestedSdgs);
        const accepted = [
            "title",
            "abstract",
            "methodology",
            "review_of_related_literature",
            "theoretical_framework",
            "results_and_discussion",
            "keywords",
            "authors",
            "doi",
            "category",
            ...(suggestedSdgs.length ? ["suggested_sdgs"] : []),
        ];
        setAppliedAnalysisId(analysis.id);
        setAcceptedAiFields(accepted);
        toast.success("Suggestions applied as an editable draft. Review every field before saving.");
    }

    async function save(event: React.FormEvent) {
        event.preventDefault();
        if (!id) return;
        setSaving(true);
        setSaveError("");
        const payload = {
            title: form.title,
            year: Number(form.year),
            quarter: form.quarter || null,
            category: form.category,
            metadata: {
                title: form.title,
                authors: form.authors,
                keywords: form.keywords,
                abstract: form.abstract,
                methodology: form.methodology,
                relatedLiterature: form.relatedLiterature,
                theoreticalFramework: form.theoreticalFramework,
                resultsDiscussion: form.resultsDiscussion,
                doi: form.doi || null,
            },
            public_fields: publicFields,
            sdg_tags: sdgs,
        };
        const sourceDocument = detail.data?.data;
        const reportFlow =
            sourceDocument?.documentType === "terminal_report" ||
            sourceDocument?.documentType === "project_accomplishment_report";
        const newHighlight =
            highlightTitle.trim() || highlightDescription.trim()
                ? {
                      title: highlightTitle,
                      description: highlightDescription,
                      featured: highlightFeatured,
                  }
                : null;
        const reportData = {
            projects: projects.filter((project) => project.target.trim()),
            pap: {
                categories: papCategories
                    .split(",")
                    .map((category) => category.trim())
                    .filter(Boolean),
                description: papDescription,
                sectors: papSectors,
            },
            financials: {
                allocated: financialAllocated ? Number(financialAllocated) : null,
                released: financialReleased ? Number(financialReleased) : null,
                obligated: financialObligated ? Number(financialObligated) : null,
                used: financialUsed ? Number(financialUsed) : null,
                asOfDate: financialAsOfDate || null,
            },
            ...(newHighlight ? { highlight: newHighlight } : {}),
        };
        const requestPayload = reportFlow ? { ...payload, ...reportData } : payload;
        try {
            if (sourceFile) {
                const multipart = new FormData();
                multipart.append("_method", "PATCH");
                multipart.append("title", requestPayload.title);
                multipart.append("year", String(requestPayload.year));
                if (requestPayload.quarter) multipart.append("quarter", requestPayload.quarter);
                multipart.append("category", requestPayload.category);
                multipart.append("metadata", JSON.stringify(requestPayload.metadata));
                multipart.append("public_fields", JSON.stringify(requestPayload.public_fields));
                multipart.append("sdg_tags", JSON.stringify(requestPayload.sdg_tags));
                if (reportFlow) {
                    multipart.append("projects", JSON.stringify(reportData.projects));
                    multipart.append("pap", JSON.stringify(reportData.pap));
                    multipart.append("financials", JSON.stringify(reportData.financials));
                    if (newHighlight) multipart.append("highlight", JSON.stringify(newHighlight));
                }
                multipart.append("document_file", sourceFile);
                await apiPost(`/api/rikms/agency/documents/${id}`, multipart);
            } else {
                await apiPatch(`/api/rikms/agency/documents/${id}`, requestPayload);
            }
            if (appliedAnalysisId && acceptedAiFields.length) {
                await apiPost(`/api/rikms/agency/documents/${id}/ai-analysis/${appliedAnalysisId}/accept`, {
                    accepted_fields: acceptedAiFields,
                });
                setAppliedAnalysisId(null);
                setAcceptedAiFields([]);
                await aiAnalysis.refresh();
            }
            toast.success("Research metadata saved. A version snapshot was created.");
            setSourceFile(null);
            setFileInputKey((value) => value + 1);
            setHighlightTitle("");
            setHighlightDescription("");
            setHighlightFeatured(false);
            await detail.refresh();
        } catch (error) {
            const message = firstValidationError(error);
            setSaveError(message);
            toast.error(message);
        } finally {
            setSaving(false);
        }
    }

    if (detail.loading) return <LoadingState label="Loading research metadata…" />;
    if (detail.error || !detail.data)
        return (
            <ErrorState
                message={detail.error ?? "Research record not found."}
                onRetry={() => void detail.refresh()}
            />
        );

    const document = detail.data.data;
    const editable = document.status === "draft" || document.status === "rejected";
    const reportFlow =
        document.documentType === "terminal_report" ||
        document.documentType === "project_accomplishment_report";

    return (
        <form onSubmit={save} className="space-y-6">
            <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#1E3A8A]"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        {fromUpload ? "Back to upload" : "Back to repository"}
                    </button>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-[#1E3A8A]">
                            {fromUpload ? "AI metadata draft" : "Research metadata"}
                        </h1>
                        <StatusBadge status={document.status} />
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                        {fromUpload
                            ? "AI is extracting suggestions into this editable draft. Review before saving."
                            : "Edit structured metadata, public visibility, and SDG classification."}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link
                        to={`/agency/research/${document.id}/access-control`}
                        className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Access control
                    </Link>
                    <button
                        type="submit"
                        disabled={!editable || saving}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#1E3A8A] px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Save className="h-4 w-4" />
                        {saving ? "Saving…" : "Save changes"}
                    </button>
                </div>
            </header>

            {document.status === "published" && (
                <div className="flex flex-col justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 sm:flex-row sm:items-center">
                    <div className="flex gap-3">
                        <Info className="h-5 w-5 shrink-0" />
                        <p>
                            Published metadata is locked. Create a revision to withdraw it into a draft, make
                            changes, and submit it through review again.
                        </p>
                    </div>
                    <button
                        type="button"
                        disabled={saving}
                        onClick={() => void createRevision()}
                        className="shrink-0 rounded-lg bg-amber-700 px-4 py-2 font-medium text-white hover:bg-amber-800 disabled:opacity-50"
                    >
                        {saving ? "Creating…" : "Create revision"}
                    </button>
                </div>
            )}
            {(document.status === "pending" || document.status === "archived") && (
                <div className="flex gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                    <Info className="h-5 w-5 shrink-0" />
                    <p>
                        This record is {document.status}. Metadata is read-only until it is returned for
                        revision or restored to a draft.
                    </p>
                </div>
            )}
            {document.isAiTagged && (
                <div className="flex gap-3 rounded-xl border border-purple-200 bg-purple-50 p-4 text-sm text-purple-800">
                    <Info className="h-5 w-5 shrink-0" />
                    <p>
                        Some fields were AI-assisted. They remain human-controlled and unpublished unless the
                        record completes independent review. Verify every field before submitting.
                    </p>
                </div>
            )}
            {saveError && (
                <div
                    role="alert"
                    aria-live="assertive"
                    className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                    {saveError}
                </div>
            )}

            <section className="rounded-xl border border-purple-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div className="flex gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-700">
                            <Brain className="h-5 w-5" />
                        </span>
                        <div>
                            <h2 className="font-semibold text-[#1E3A8A]">AI metadata assistance</h2>
                            <p className="mt-1 text-xs text-gray-500">
                                The configured model produces reviewable suggestions. It cannot publish,
                                submit, or change access permissions. The active model appears below.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        disabled={
                            !editable ||
                            !document.originalFilename ||
                            aiBusy ||
                            aiAnalysis.data?.data?.status === "queued" ||
                            aiAnalysis.data?.data?.status === "processing" ||
                            aiAnalysis.data?.enabled === false
                        }
                        onClick={() => void queueAiAnalysis()}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-purple-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <RefreshCw className={`h-4 w-4 ${aiBusy ? "animate-spin" : ""}`} />
                        {aiAnalysis.data?.data ? "Run new analysis" : "Analyze document"}
                    </button>
                </div>

                {aiAnalysis.data?.enabled === false && (
                    <p className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                        AI assistance has not been enabled for this deployment.
                    </p>
                )}
                {aiAnalysis.data?.data && (
                    <div className="mt-4 rounded-xl border border-purple-100 bg-purple-50/50 p-4 text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-purple-900">
                                Status: {aiAnalysis.data.data.status}
                            </span>
                            <span className="text-gray-500">Model: {aiAnalysis.data.data.model}</span>
                            {aiAnalysis.data.data.confidence !== null && (
                                <span className="text-gray-500">
                                    Confidence: {Math.round(aiAnalysis.data.data.confidence * 100)}%
                                </span>
                            )}
                            {aiAnalysis.data.data.estimatedCostUsd !== null && (
                                <span className="text-gray-500">
                                    Estimated model cost: ${aiAnalysis.data.data.estimatedCostUsd.toFixed(4)}
                                </span>
                            )}
                        </div>
                        {aiAnalysis.data.data.status === "queued" && !queuedForLongerThanFifteenSeconds && (
                            <p className="mt-2 text-purple-800">Waiting for the background queue worker…</p>
                        )}
                        {aiAnalysis.data.data.status === "queued" && queuedForLongerThanFifteenSeconds && (
                            <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
                                Still queued. Local development requires the queue worker and configured model
                                service. Start the complete stack with <code>composer run dev</code> or{" "}
                                <code>npm run dev:rikms</code>, then confirm Ollama is running. Port 5173 is
                                only Vite; open RIKMS on port 8000.
                            </p>
                        )}
                        {aiAnalysis.data.data.status === "processing" && (
                            <p className="mt-2 text-purple-800">
                                The background worker is processing the PDF…
                            </p>
                        )}
                        {aiAnalysis.data.data.status === "failed" && (
                            <p className="mt-2 text-red-700">{aiAnalysis.data.data.errorMessage}</p>
                        )}
                        {aiAnalysis.data.data.suggestions && (
                            <div className="mt-3 space-y-3">
                                <div>
                                    <p className="font-medium text-gray-800">
                                        Suggested title:{" "}
                                        {aiAnalysis.data.data.suggestions.title || "Not found"}
                                    </p>
                                    <p className="mt-1 text-gray-600">
                                        {aiAnalysis.data.data.suggestions.executive_summary}
                                    </p>
                                </div>
                                {aiAnalysis.data.data.suggestions.suggested_sdgs.length > 0 && (
                                    <p className="text-gray-600">
                                        Suggested SDGs:{" "}
                                        {aiAnalysis.data.data.suggestions.suggested_sdgs
                                            .map((item) => item.number)
                                            .join(", ")}
                                    </p>
                                )}
                                {aiAnalysis.data.data.status === "completed" && (
                                    <button
                                        type="button"
                                        disabled={!editable}
                                        onClick={applyAiSuggestions}
                                        className="inline-flex items-center gap-2 rounded-lg border border-purple-300 bg-white px-4 py-2 text-sm font-medium text-purple-800 hover:bg-purple-100 disabled:opacity-50"
                                    >
                                        <Sparkles className="h-4 w-4" /> Apply as editable draft
                                    </button>
                                )}
                                {aiAnalysis.data.data.status === "reviewed" && (
                                    <p className="font-medium text-green-700">
                                        Human-reviewed by{" "}
                                        {aiAnalysis.data.data.reviewedBy ?? "an authorized user"}.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </section>

            <fieldset disabled={!editable || saving} className="space-y-6 disabled:opacity-70">
                <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#1E3A8A]">
                            <FileUp className="h-5 w-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                            <h2 className="font-semibold text-[#1E3A8A]">Source document</h2>
                            <p className="mt-1 text-xs text-gray-500">
                                {document.originalFilename
                                    ? `Current file: ${document.originalFilename}`
                                    : "No source file is attached. Attach one before submitting for review."}
                            </p>
                            <label className="mt-4 block">
                                <span className="mb-1.5 block text-sm font-medium text-gray-700">
                                    {document.originalFilename ? "Replace source file" : "Attach source file"}
                                </span>
                                <input
                                    key={fileInputKey}
                                    type="file"
                                    accept=".pdf,application/pdf"
                                    onChange={(event) => {
                                        const selected = event.target.files?.[0] ?? null;
                                        if (selected && selected.size > 25 * 1024 * 1024) {
                                            event.target.value = "";
                                            setSourceFile(null);
                                            setSaveError("The source document must not exceed 25 MB.");
                                            return;
                                        }
                                        setSaveError("");
                                        setSourceFile(selected);
                                    }}
                                    className="block w-full rounded-lg border border-gray-200 text-sm text-gray-600 file:mr-4 file:border-0 file:bg-blue-50 file:px-4 file:py-2.5 file:font-medium file:text-[#1E3A8A] hover:file:bg-blue-100"
                                />
                                <span className="mt-1 block text-xs text-gray-500">
                                    PDF only · maximum 25 MB. Replacements are versioned.
                                </span>
                            </label>
                            {sourceFile && (
                                <p className="mt-2 text-xs font-medium text-green-700">
                                    Ready to upload: {sourceFile.name}
                                </p>
                            )}
                        </div>
                    </div>
                </section>
                <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <h2 className="mb-5 font-semibold text-[#1E3A8A]">Core information</h2>
                    <div className="grid gap-5 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <Field label="Title">
                                <input
                                    required
                                    value={form.title}
                                    onChange={(event) => update("title", event.target.value)}
                                    className={inputClass}
                                />
                            </Field>
                        </div>
                        <Field label="Publication year">
                            <input
                                type="number"
                                min="1900"
                                max={new Date().getFullYear() + 5}
                                required
                                value={form.year}
                                onChange={(event) => update("year", event.target.value)}
                                className={inputClass}
                            />
                        </Field>
                        <Field label="Reporting quarter">
                            <select
                                value={form.quarter}
                                onChange={(event) => update("quarter", event.target.value)}
                                className={inputClass}
                            >
                                <option value="">Not specified</option>
                                <option value="Q1">Q1 (Jan–Mar)</option>
                                <option value="Q2">Q2 (Apr–Jun)</option>
                                <option value="Q3">Q3 (Jul–Sep)</option>
                                <option value="Q4">Q4 (Oct–Dec)</option>
                                <option value="Annual">Annual</option>
                            </select>
                        </Field>
                        <Field label="Category">
                            <input
                                required
                                value={form.category}
                                onChange={(event) => update("category", event.target.value)}
                                className={inputClass}
                            />
                        </Field>
                        <Field label="DOI">
                            <input
                                value={form.doi}
                                onChange={(event) => update("doi", event.target.value)}
                                placeholder="10.xxxx/…"
                                className={inputClass}
                            />
                        </Field>
                        <div className="sm:col-span-2">
                            <Field label="Authors" hint="Separate names with commas">
                                <input
                                    value={form.authors}
                                    onChange={(event) => update("authors", event.target.value)}
                                    className={inputClass}
                                />
                            </Field>
                        </div>
                        <div className="sm:col-span-2">
                            <Field label="Keywords" hint="Separate keywords with commas">
                                <input
                                    value={form.keywords}
                                    onChange={(event) => update("keywords", event.target.value)}
                                    className={inputClass}
                                />
                            </Field>
                        </div>
                    </div>
                </section>

                <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <h2 className="mb-5 font-semibold text-[#1E3A8A]">Research content</h2>
                    <div className="space-y-5">
                        <Field label="Abstract">
                            <textarea
                                rows={5}
                                value={form.abstract}
                                onChange={(event) => update("abstract", event.target.value)}
                                className={inputClass}
                            />
                        </Field>
                        <Field label="Methodology">
                            <textarea
                                rows={5}
                                value={form.methodology}
                                onChange={(event) => update("methodology", event.target.value)}
                                className={inputClass}
                            />
                        </Field>
                        <Field label="Review of related literature">
                            <textarea
                                rows={5}
                                value={form.relatedLiterature}
                                onChange={(event) => update("relatedLiterature", event.target.value)}
                                className={inputClass}
                            />
                        </Field>
                        <Field label="Theoretical framework">
                            <textarea
                                rows={5}
                                value={form.theoreticalFramework}
                                onChange={(event) => update("theoreticalFramework", event.target.value)}
                                className={inputClass}
                            />
                        </Field>
                        <Field label="Results and discussion">
                            <textarea
                                rows={6}
                                value={form.resultsDiscussion}
                                onChange={(event) => update("resultsDiscussion", event.target.value)}
                                className={inputClass}
                            />
                        </Field>
                    </div>
                </section>

                {reportFlow && (
                    <>
                        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="font-semibold text-[#1E3A8A]">Performance targets</h2>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Maintain the target and actual accomplishment rows used for report
                                        review.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setProjects((current) => [
                                            ...current,
                                            {
                                                id: crypto.randomUUID(),
                                                target: "",
                                                actualPct: 0,
                                                accomplishmentPct: 0,
                                            },
                                        ])
                                    }
                                    className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-[#1E3A8A] hover:bg-blue-50"
                                >
                                    <Plus className="h-3 w-3" /> Add target
                                </button>
                            </div>
                            <div className="mt-5 space-y-3">
                                {projects.map((project, index) => (
                                    <div
                                        key={project.id}
                                        className="grid gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 sm:grid-cols-[minmax(0,1fr)_9rem_9rem_auto]"
                                    >
                                        <label>
                                            <span className="mb-1 block text-xs font-medium text-gray-600">
                                                Target / output indicator {index + 1}
                                            </span>
                                            <input
                                                value={project.target}
                                                onChange={(event) =>
                                                    setProjects((current) =>
                                                        current.map((item) =>
                                                            item.id === project.id
                                                                ? { ...item, target: event.target.value }
                                                                : item,
                                                        ),
                                                    )
                                                }
                                                className={inputClass}
                                            />
                                        </label>
                                        <label>
                                            <span className="mb-1 block text-xs font-medium text-gray-600">
                                                Actual %
                                            </span>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={project.actualPct}
                                                onChange={(event) =>
                                                    setProjects((current) =>
                                                        current.map((item) =>
                                                            item.id === project.id
                                                                ? {
                                                                      ...item,
                                                                      actualPct: Number(event.target.value),
                                                                  }
                                                                : item,
                                                        ),
                                                    )
                                                }
                                                className={inputClass}
                                            />
                                        </label>
                                        <label>
                                            <span className="mb-1 block text-xs font-medium text-gray-600">
                                                Accomplishment %
                                            </span>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={project.accomplishmentPct}
                                                onChange={(event) =>
                                                    setProjects((current) =>
                                                        current.map((item) =>
                                                            item.id === project.id
                                                                ? {
                                                                      ...item,
                                                                      accomplishmentPct: Number(
                                                                          event.target.value,
                                                                      ),
                                                                  }
                                                                : item,
                                                        ),
                                                    )
                                                }
                                                className={inputClass}
                                            />
                                        </label>
                                        <button
                                            type="button"
                                            disabled={projects.length === 1}
                                            onClick={() =>
                                                setProjects((current) =>
                                                    current.filter((item) => item.id !== project.id),
                                                )
                                            }
                                            aria-label={`Remove target ${index + 1}`}
                                            className="self-end rounded-lg p-2.5 text-red-500 hover:bg-red-50 disabled:opacity-30"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="grid gap-6 lg:grid-cols-2">
                            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                                <h2 className="font-semibold text-[#1E3A8A]">PAP classification</h2>
                                <div className="mt-5 space-y-4">
                                    <Field label="Categories" hint="Separate multiple categories with commas">
                                        <input
                                            value={papCategories}
                                            onChange={(event) => setPapCategories(event.target.value)}
                                            placeholder="e.g. Digital Economy, STI Strategy"
                                            className={inputClass}
                                        />
                                    </Field>
                                    <Field label="Classification notes">
                                        <textarea
                                            rows={3}
                                            value={papDescription}
                                            onChange={(event) => setPapDescription(event.target.value)}
                                            className={inputClass}
                                        />
                                    </Field>
                                    <fieldset>
                                        <legend className="mb-2 text-sm font-medium text-gray-700">
                                            Beneficiary sectors
                                        </legend>
                                        <div className="flex flex-wrap gap-2">
                                            {REPORT_SECTORS.map((sector) => (
                                                <label
                                                    key={sector}
                                                    className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={papSectors.includes(sector)}
                                                        onChange={() =>
                                                            setPapSectors((current) =>
                                                                current.includes(sector)
                                                                    ? current.filter(
                                                                          (item) => item !== sector,
                                                                      )
                                                                    : [...current, sector],
                                                            )
                                                        }
                                                    />
                                                    {sector}
                                                </label>
                                            ))}
                                        </div>
                                    </fieldset>
                                </div>
                            </div>

                            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                                <h2 className="font-semibold text-[#1E3A8A]">Financial utilization</h2>
                                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                    {[
                                        ["Allocated budget", financialAllocated, setFinancialAllocated],
                                        ["Released amount", financialReleased, setFinancialReleased],
                                        ["Obligated amount", financialObligated, setFinancialObligated],
                                        ["Utilized amount", financialUsed, setFinancialUsed],
                                    ].map(([label, value, setter]) => (
                                        <label key={label as string}>
                                            <span className="mb-1.5 block text-sm font-medium text-gray-700">
                                                {label as string}
                                            </span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={value as string}
                                                onChange={(event) =>
                                                    (setter as React.Dispatch<React.SetStateAction<string>>)(
                                                        event.target.value,
                                                    )
                                                }
                                                className={inputClass}
                                            />
                                        </label>
                                    ))}
                                    <label className="sm:col-span-2">
                                        <span className="mb-1.5 block text-sm font-medium text-gray-700">
                                            Financial data as of
                                        </span>
                                        <input
                                            type="date"
                                            value={financialAsOfDate}
                                            onChange={(event) => setFinancialAsOfDate(event.target.value)}
                                            className={inputClass}
                                        />
                                    </label>
                                </div>
                            </div>
                        </section>

                        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                            <h2 className="font-semibold text-[#1E3A8A]">Report highlights</h2>
                            {(document.highlights ?? []).length > 0 && (
                                <ul className="mt-4 space-y-2">
                                    {document.highlights?.map((highlight) => (
                                        <li
                                            key={highlight.id}
                                            className="rounded-lg border border-gray-100 bg-gray-50 p-3"
                                        >
                                            <p className="text-sm font-medium text-gray-800">
                                                {highlight.title || "Untitled highlight"}
                                            </p>
                                            {highlight.description && (
                                                <p className="mt-1 text-xs text-gray-500">
                                                    {highlight.description}
                                                </p>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                <Field label="Add highlight title">
                                    <input
                                        value={highlightTitle}
                                        onChange={(event) => setHighlightTitle(event.target.value)}
                                        className={inputClass}
                                    />
                                </Field>
                                <label className="flex items-end gap-2 pb-2.5 text-sm text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={highlightFeatured}
                                        onChange={(event) => setHighlightFeatured(event.target.checked)}
                                    />
                                    Feature this highlight
                                </label>
                                <div className="sm:col-span-2">
                                    <Field label="Highlight description">
                                        <textarea
                                            rows={3}
                                            value={highlightDescription}
                                            onChange={(event) => setHighlightDescription(event.target.value)}
                                            className={inputClass}
                                        />
                                    </Field>
                                </div>
                            </div>
                        </section>
                    </>
                )}

                <section className="grid gap-6 lg:grid-cols-2">
                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                        <h2 className="font-semibold text-[#1E3A8A]">Public metadata fields</h2>
                        <p className="mb-4 mt-1 text-xs text-gray-500">
                            Only checked fields are exposed after publication. The title is always public.
                        </p>
                        <div className="space-y-2">
                            {PUBLIC_FIELDS.map((field) => (
                                <label
                                    key={field.key}
                                    className="flex items-center gap-3 rounded-lg border border-gray-100 p-3 text-sm"
                                >
                                    <input
                                        type="checkbox"
                                        checked={publicFields.includes(field.key)}
                                        disabled={field.key === "title"}
                                        onChange={() => togglePublic(field.key)}
                                        className="h-4 w-4 rounded border-gray-300 text-[#1E3A8A]"
                                    />
                                    <span>{field.label}</span>
                                    {field.key === "title" && (
                                        <span className="ml-auto text-xs text-gray-400">Required</span>
                                    )}
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                        <h2 className="font-semibold text-[#1E3A8A]">Sustainable Development Goals</h2>
                        <p className="mb-4 mt-1 text-xs text-gray-500">
                            Select every goal directly supported by the research.
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            {SDG_DATA.map((sdg) => {
                                const selected = sdgs.includes(sdg.number);
                                return (
                                    <button
                                        key={sdg.number}
                                        type="button"
                                        onClick={() => toggleSdg(sdg.number)}
                                        aria-pressed={selected}
                                        className={`flex items-center gap-2 rounded-lg border p-2 text-left text-xs ${selected ? "border-[#1E3A8A] bg-blue-50 text-[#1E3A8A]" : "border-gray-200 hover:bg-gray-50"}`}
                                    >
                                        <span
                                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white"
                                            style={{ backgroundColor: sdg.color }}
                                        >
                                            {sdg.number}
                                        </span>
                                        <span className="line-clamp-2">{sdg.title}</span>
                                        {selected && <Check className="ml-auto h-3 w-3" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </section>
            </fieldset>
        </form>
    );
}

export type ValidationErrors = Record<string, string[]>;

export class ApiError extends Error {
    readonly status: number;
    readonly errors: ValidationErrors;

    constructor(message: string, status: number, errors: ValidationErrors = {}) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.errors = errors;
    }
}

export interface PaginationMeta {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
}

export interface Paginated<T> {
    data: T[];
    meta: PaginationMeta;
}

export interface CurrentUser {
    id: number;
    name: string;
    email: string;
    role: "agency_admin" | "super_admin" | string;
    agencyId: number | null;
    agencyName: string | null;
    agencyAbbr: string | null;
    mustChangePassword?: boolean;
    unreadNotifications?: number;
    permissions?: string[];
}

export interface Sdg {
    number: number;
    title: string;
    color: string;
}

export interface PublicAgency {
    id: number;
    name: string;
    abbreviation: string;
    type: string;
    publications: number;
    description: string;
    latestYear: number | null;
    region?: string | null;
    address?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
    website?: string | null;
}

export type DocumentStatus = "draft" | "pending" | "published" | "rejected" | "archived";

export interface ResearchDocument {
    id: number;
    title: string;
    authors: string[];
    agency: string;
    agencyId: number;
    agencyAbbr: string;
    year: number;
    quarter?: string | null;
    abstract: string;
    description?: string | null;
    originalFilename?: string | null;
    keywords: string[];
    sdgs: number[];
    category: string;
    documentType: string;
    fileType: string | null;
    fileSize: number | null;
    downloads: number;
    status: DocumentStatus;
    accessMode: string;
    completionScore: number;
    isAiTagged: boolean;
    publishedAt: string | null;
    submittedAt: string | null;
    createdAt: string;
    updatedAt: string;
    canDownload: boolean;
    canRequestAccess: boolean;
    externalUrl: string | null;
    metadata?: DocumentMetadata;
    publicFields?: string[];
    performanceRows?: PerformanceRow[];
    financial?: FinancialDetails | null;
    papClassifications?: PapClassification[];
    highlights?: Highlight[];
    embargoUntil?: string | null;
    ownerName?: string | null;
    ownerEmail?: string | null;
    notifyAccessRequests?: boolean;
}

export interface DocumentMetadata {
    title?: string | null;
    abstract?: string | null;
    methodology?: string | null;
    reviewOfRelatedLiterature?: string | null;
    theoreticalFramework?: string | null;
    resultsAndDiscussion?: string | null;
    doi?: string | null;
    keywords?: string[];
    authors?: string[];
    aiConfidence?: number | null;
}

export interface AiDocumentSuggestions {
    title: string;
    abstract: string;
    methodology: string;
    review_of_related_literature: string;
    theoretical_framework: string;
    results_and_discussion: string;
    keywords: string[];
    authors: string[];
    doi: string;
    category: string;
    executive_summary: string;
    recommendations: string[];
    suggested_sdgs: Array<{ number: number; reason: string; confidence: number }>;
    overall_confidence: number;
    evidence_pages: number[];
}

export interface DocumentAiAnalysis {
    id: number;
    status: "queued" | "processing" | "completed" | "failed" | "reviewed";
    model: string;
    promptVersion: string;
    extractionMethod: string | null;
    suggestions: AiDocumentSuggestions | null;
    acceptedFields: string[];
    confidence: number | null;
    inputTokens: number | null;
    outputTokens: number | null;
    reasoningTokens: number | null;
    estimatedCostUsd: number | null;
    errorMessage: string | null;
    requestedBy: string | null;
    reviewedBy: string | null;
    createdAt: string;
    startedAt: string | null;
    completedAt: string | null;
    reviewedAt: string | null;
}

export interface DocumentAiAnalysisResponse {
    enabled: boolean;
    data: DocumentAiAnalysis | null;
}

export interface PerformanceRow {
    id?: number;
    target?: string;
    targetValue?: number;
    actual?: number;
    accomplishmentPercentage?: number;
    status?: string;
}

export interface FinancialDetails {
    allocated?: number | null;
    released?: number | null;
    obligated?: number | null;
    used?: number | null;
    remaining?: number | null;
    utilizationPercentage?: number | null;
    asOfDate?: string | null;
}

export interface PapClassification {
    id?: number;
    category: string;
    description?: string | null;
    sectors?: string[];
}

export interface Highlight {
    id: number;
    title?: string | null;
    description?: string | null;
    isFeatured?: boolean;
}

export interface BootstrapPayload {
    currentUser: CurrentUser | null;
    sdgData: Sdg[];
    sdgResearchCounts: Record<number, number>;
    agencies: PublicAgency[];
    researchCategories: string[];
    statistics: {
        totalResearch: number;
        participatingAgencies: number;
        sdgsCovered: number;
        latestPublications: number;
    };
    platform?: {
        siteName: string;
        supportEmail: string | null;
        announcement: string | null;
        allowPublicBrowse: boolean;
    };
}

export interface AccessRequestRecord {
    id: number;
    documentId: number;
    title: string;
    requesterName: string;
    requesterEmail: string;
    requesterOrganization?: string | null;
    message: string;
    status: "pending" | "approved" | "rejected";
    decisionReason?: string | null;
    createdAt: string;
    decidedAt?: string | null;
}

export interface DashboardPayload {
    data: {
        statistics: {
            totalResearch: number;
            drafts: number;
            pending: number;
            published: number;
            rejected: number;
            archived: number;
            totalDownloads: number;
            pendingAccessRequests: number;
        };
        recentDocuments: ResearchDocument[];
        pendingAccessRequests: AccessRequestRecord[];
        statusBreakdown: Array<{ name: string; value: number; color?: string }>;
        monthlySubmissions: Array<{ month: string; count: number }>;
    };
}

export interface AgencyAnalytics {
    data: {
        statistics: Record<string, number>;
        documentsByYear: Array<{ year: string | number; count: number }>;
        documentsByCategory: Array<{ name: string; value: number }>;
        downloadsByMonth: Array<{ month: string; count: number }>;
        topDocuments: ResearchDocument[];
        accessRequestsByStatus?: Array<{ name: string; value: number }>;
    };
}

export interface AgencyProfileData {
    data: {
        id: number;
        name: string;
        abbreviation?: string;
        region?: string | null;
        description?: string | null;
        address?: string | null;
        contactEmail?: string | null;
        contactPhone?: string | null;
        website?: string | null;
    };
}

export interface AgencySettingsData {
    data: {
        notifyAccessRequests: boolean;
        notifyReviewUpdates: boolean;
        notifyWeeklySummary: boolean;
        defaultAccessMode: string;
        timezone: string;
    };
}

export interface NotificationRecord {
    id: number | string;
    type: string;
    title: string;
    message: string;
    readAt: string | null;
    read?: boolean;
    createdAt: string;
    data?: Record<string, unknown>;
}

export interface AuditRecord {
    id: number;
    action: string;
    user: string | null;
    documentTitle: string | null;
    createdAt: string;
    details?: Record<string, unknown> | null;
}

export interface DocumentVersion {
    id: number;
    versionNumber: number;
    changeSummary?: string | null;
    createdAt: string;
    createdBy?: string | null;
    status?: string;
    filename?: string | null;
}

function csrfToken(): string {
    return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? "";
}

export async function apiRequest<T>(url: string, init: RequestInit = {}): Promise<T> {
    const bodyIsFormData = init.body instanceof FormData;
    const headers = new Headers(init.headers);
    headers.set("Accept", "application/json");
    headers.set("X-CSRF-TOKEN", csrfToken());
    headers.set("X-Requested-With", "XMLHttpRequest");

    if (init.body && !bodyIsFormData && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    const response = await fetch(url, {
        credentials: "same-origin",
        ...init,
        headers,
    });

    if (response.status === 204) {
        return undefined as T;
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        if (response.status === 401 && !url.endsWith("/login")) {
            window.dispatchEvent(new CustomEvent("rikms:unauthorized"));
        }
        throw new ApiError(
            typeof data.message === "string" ? data.message : "The request could not be completed.",
            response.status,
            data.errors ?? {},
        );
    }

    return data as T;
}

export function apiGet<T>(url: string, signal?: AbortSignal): Promise<T> {
    return apiRequest<T>(url, { signal });
}

export function apiPost<T>(url: string, payload?: unknown): Promise<T> {
    return apiRequest<T>(url, {
        method: "POST",
        body: payload instanceof FormData ? payload : JSON.stringify(payload ?? {}),
    });
}

export function apiPatch<T>(url: string, payload: unknown): Promise<T> {
    return apiRequest<T>(url, { method: "PATCH", body: JSON.stringify(payload) });
}

export function apiDelete<T>(url: string): Promise<T> {
    return apiRequest<T>(url, { method: "DELETE" });
}

export function queryString(params: Record<string, string | number | undefined | null>): string {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && String(value).trim() !== "") {
            search.set(key, String(value));
        }
    }
    const value = search.toString();
    return value ? `?${value}` : "";
}

export function firstValidationError(error: unknown): string {
    if (!(error instanceof ApiError)) {
        return error instanceof Error ? error.message : "Something went wrong. Please try again.";
    }

    const first = Object.values(error.errors)[0]?.[0];
    return first ?? error.message;
}

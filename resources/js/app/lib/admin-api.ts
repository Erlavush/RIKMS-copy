import { csrfToken } from "./http";

export class ApiError extends Error {
    status: number;
    errors: Record<string, string[]>;

    constructor(message: string, status: number, errors: Record<string, string[]> = {}) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.errors = errors;
    }
}

type QueryValue = string | number | boolean | null | undefined;

function queryString(query?: Record<string, QueryValue>): string {
    if (!query) return "";

    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            params.set(key, String(value));
        }
    });

    const result = params.toString();
    return result ? `?${result}` : "";
}

async function request<T>(
    path: string,
    options: RequestInit = {},
    query?: Record<string, QueryValue>,
): Promise<T> {
    const response = await fetch(`${path}${queryString(query)}`, {
        ...options,
        credentials: "same-origin",
        headers: {
            Accept: "application/json",
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...(options.method && options.method !== "GET" ? { "X-CSRF-TOKEN": csrfToken() } : {}),
            ...options.headers,
        },
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
        if (response.status === 401) {
            window.location.assign("/admin/login");
        }

        throw new ApiError(
            typeof payload.message === "string" ? payload.message : "The request could not be completed.",
            response.status,
            payload.errors && typeof payload.errors === "object" ? payload.errors : {},
        );
    }

    return payload as T;
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

export interface DataResponse<T> {
    data: T;
}

export interface AdminUser {
    id: number;
    name: string;
    email: string;
    role: "super_admin" | "agency_admin" | string;
    agencyId: number | null;
    agencyName?: string | null;
    agency?: { id: number; name: string; abbreviation?: string } | null;
    isActive: boolean;
    mustChangePassword?: boolean;
    lastLoginAt?: string | null;
    createdAt: string;
}

export interface Agency {
    id: number;
    name: string;
    abbreviation: string;
    region: string | null;
    contactEmail: string | null;
    isActive: boolean;
    usersCount: number;
    documentsCount: number;
    publishedCount: number;
    createdAt: string;
}

export interface AdminDocument {
    id: number;
    title: string;
    slug?: string;
    abstract?: string | null;
    status: string;
    accessMode?: string;
    canDownload?: boolean;
    agencyId?: number;
    agencyName?: string;
    agency?: string | { id: number; name: string; abbreviation?: string } | null;
    category?: string | null;
    documentType?: string | null;
    year?: number | string | null;
    authors?: Array<{ name?: string; affiliation?: string } | string>;
    keywords?: string[];
    sdgs?: number[];
    originalFilename?: string | null;
    fileSize?: number | null;
    fileType?: string | null;
    externalUrl?: string | null;
    publicFields?: string[];
    metadata?: {
        title?: string | null;
        abstract?: string | null;
        methodology?: string | null;
        reviewOfRelatedLiterature?: string | null;
        theoreticalFramework?: string | null;
        resultsAndDiscussion?: string | null;
        keywords?: string[];
        authors?: Array<{ name?: string; affiliation?: string } | string>;
        doi?: string | null;
        aiConfidence?: number | null;
    };
    submittedAt?: string | null;
    publishedAt?: string | null;
    createdAt: string;
    updatedAt?: string;
    reviewNotes?: string | null;
    rejectionReason?: string | null;
    downloadCount?: number;
    downloads?: number;
}

export interface AccessRequestRecord {
    id: number;
    status: string;
    requesterName?: string;
    requesterEmail?: string;
    requesterOrganization?: string | null;
    requester?: { name?: string; email?: string } | null;
    purpose?: string | null;
    reason?: string | null;
    message?: string | null;
    documentId?: number;
    agencyId?: number;
    documentTitle?: string;
    title?: string;
    document?: { id: number; title: string; agency?: { name: string } | null } | null;
    agencyName?: string;
    createdAt: string;
    reviewedAt?: string | null;
    decisionReason?: string | null;
    decidedBy?: string | null;
    decidedAt?: string | null;
}

export interface AuditLog {
    id: number;
    action: string;
    description?: string;
    userName?: string | null;
    userEmail?: string | null;
    user?: string | { id?: number; name?: string; email?: string } | null;
    eventType?: string | null;
    severity?: string | null;
    agency?: string | null;
    agencyId?: number | null;
    documentTitle?: string | null;
    documentId?: number | null;
    subjectType?: string | null;
    subjectId?: number | null;
    ipAddress?: string | null;
    metadata?: Record<string, unknown> | null;
    details?: Record<string, unknown> | null;
    createdAt: string;
}

export interface RoleRecord {
    id: number | string;
    name: string;
    label: string;
    isSystem?: boolean;
    userCount: number;
    permissions: string[];
}

export interface PermissionRecord {
    name: string;
    label: string;
}

export interface NotificationRecord {
    id: number;
    type: string;
    title: string;
    message: string;
    data: Record<string, unknown>;
    read: boolean;
    readAt?: string | null;
    createdAt: string;
}

export interface ArchiveRecord {
    id: number;
    type: "document" | "agency" | "user" | string;
    title: string;
    subtitle?: string | null;
    agencyName?: string | null;
    archivedAt?: string | null;
    deletedAt?: string | null;
}

const ADMIN_BASE = "/api/rikms/admin";

export const adminApi = {
    get<T>(path: string, query?: Record<string, QueryValue>): Promise<T> {
        return request<T>(`${ADMIN_BASE}${path}`, {}, query);
    },
    post<T>(path: string, body: Record<string, unknown> = {}): Promise<T> {
        return request<T>(`${ADMIN_BASE}${path}`, { method: "POST", body: JSON.stringify(body) });
    },
    patch<T>(path: string, body: Record<string, unknown>): Promise<T> {
        return request<T>(`${ADMIN_BASE}${path}`, { method: "PATCH", body: JSON.stringify(body) });
    },
};

export function getCurrentUser(): Promise<DataResponse<AdminUser>> {
    return request<DataResponse<AdminUser>>("/api/rikms/me");
}

export function getNotifications(): Promise<Paginated<NotificationRecord>> {
    return request<Paginated<NotificationRecord>>("/api/rikms/notifications", {}, { per_page: 8 });
}

export function markNotificationRead(id: number): Promise<DataResponse<NotificationRecord>> {
    return request<DataResponse<NotificationRecord>>(`/api/rikms/notifications/${id}/read`, {
        method: "PATCH",
        body: JSON.stringify({}),
    });
}

export function markAllNotificationsRead(): Promise<{ message: string }> {
    return request<{ message: string }>("/api/rikms/notifications/read-all", {
        method: "POST",
        body: JSON.stringify({}),
    });
}

export function errorMessage(error: unknown): string {
    if (error instanceof ApiError) {
        const validationMessage = Object.values(error.errors).flat()[0];
        return validationMessage ?? error.message;
    }

    return error instanceof Error ? error.message : "An unexpected error occurred.";
}

export function documentAgencyName(document: AdminDocument): string {
    if (document.agencyName) return document.agencyName;
    if (typeof document.agency === "string") return document.agency;
    return document.agency?.name ?? "—";
}

export function auditActorName(log: AuditLog): string {
    if (log.userName) return log.userName;
    if (typeof log.user === "string") return log.user;
    return log.user?.name ?? "System";
}

export function auditActorEmail(log: AuditLog): string | null {
    if (log.userEmail) return log.userEmail;
    if (typeof log.user === "object") return log.user?.email ?? null;
    return null;
}

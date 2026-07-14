import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Inbox, Loader2, X } from "lucide-react";

import type { PaginationMeta } from "../../lib/admin-api";

export function PageHeader({
    title,
    description,
    action,
}: {
    title: string;
    description: string;
    action?: ReactNode;
}) {
    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
                <p className="mt-1 text-sm text-gray-500">{description}</p>
            </div>
            {action}
        </div>
    );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
    return (
        <section
            className={`overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}
        >
            {children}
        </section>
    );
}

export function LoadingState({ label = "Loading data…" }: { label?: string }) {
    return (
        <div
            className="flex min-h-48 items-center justify-center gap-2 p-8 text-sm text-gray-500"
            role="status"
        >
            <Loader2 className="h-5 w-5 animate-spin text-[#1E3A8A]" aria-hidden="true" />
            <span>{label}</span>
        </div>
    );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
    return (
        <div className="m-5 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800" role="alert">
            <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                <div className="flex-1">
                    <p className="font-semibold">Unable to load this information</p>
                    <p className="mt-1 text-red-700">{message}</p>
                    {onRetry && (
                        <button
                            type="button"
                            onClick={onRetry}
                            className="mt-3 rounded-lg bg-red-700 px-3 py-2 text-xs font-semibold text-white hover:bg-red-800"
                        >
                            Try again
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
    return (
        <div className="flex min-h-48 flex-col items-center justify-center p-8 text-center">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
                <Inbox className="h-5 w-5 text-slate-400" aria-hidden="true" />
            </div>
            <p className="text-sm font-semibold text-slate-800">{title}</p>
            <p className="mt-1 max-w-md text-xs leading-5 text-gray-500">{description}</p>
        </div>
    );
}

const STATUS_STYLES: Record<string, string> = {
    published: "bg-green-50 text-green-700 ring-green-600/20",
    approved: "bg-green-50 text-green-700 ring-green-600/20",
    successful: "bg-green-50 text-green-700 ring-green-600/20",
    active: "bg-green-50 text-green-700 ring-green-600/20",
    pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
    pending_review: "bg-amber-50 text-amber-700 ring-amber-600/20",
    submitted: "bg-amber-50 text-amber-700 ring-amber-600/20",
    rejected: "bg-red-50 text-red-700 ring-red-600/20",
    failed: "bg-red-50 text-red-700 ring-red-600/20",
    inactive: "bg-gray-100 text-gray-600 ring-gray-500/20",
    draft: "bg-slate-100 text-slate-700 ring-slate-500/20",
    archived: "bg-purple-50 text-purple-700 ring-purple-600/20",
};

export function StatusBadge({ status }: { status: string }) {
    const normalized = status.toLowerCase().replace(/[\s-]+/g, "_");
    const label = normalized.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
    return (
        <span
            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${STATUS_STYLES[normalized] ?? "bg-blue-50 text-blue-700 ring-blue-600/20"}`}
        >
            {label}
        </span>
    );
}

export function Pagination({ meta, onPage }: { meta: PaginationMeta; onPage: (page: number) => void }) {
    if (meta.lastPage <= 1) return null;

    return (
        <nav
            className="flex items-center justify-between border-t border-gray-100 px-5 py-4"
            aria-label="Pagination"
        >
            <p className="text-xs text-gray-500">
                Page {meta.currentPage} of {meta.lastPage} · {meta.total.toLocaleString()} records
            </p>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => onPage(meta.currentPage - 1)}
                    disabled={meta.currentPage <= 1}
                    className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Previous page"
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                    type="button"
                    onClick={() => onPage(meta.currentPage + 1)}
                    disabled={meta.currentPage >= meta.lastPage}
                    className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Next page"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>
        </nav>
    );
}

export function Modal({
    open,
    title,
    description,
    onClose,
    children,
    footer,
    size = "max-w-xl",
}: {
    open: boolean;
    title: string;
    description?: string;
    onClose: () => void;
    children: ReactNode;
    footer?: ReactNode;
    size?: string;
}) {
    const closeButton = useRef<HTMLButtonElement>(null);
    const dialog = useRef<HTMLDivElement>(null);
    const onCloseRef = useRef(onClose);
    const titleId = useId();

    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        if (!open) return undefined;
        const previousFocus = document.activeElement as HTMLElement | null;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onCloseRef.current();
            if (event.key !== "Tab") return;
            const focusable = dialog.current?.querySelectorAll<HTMLElement>(
                'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
            );
            if (!focusable?.length) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };
        document.addEventListener("keydown", onKeyDown);
        document.body.style.overflow = "hidden";
        closeButton.current?.focus();

        return () => {
            document.removeEventListener("keydown", onKeyDown);
            document.body.style.overflow = "";
            previousFocus?.focus();
        };
    }, [open]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
        >
            <button
                type="button"
                className="absolute inset-0 bg-slate-950/50"
                onClick={onClose}
                aria-label="Close dialog"
            />
            <div
                ref={dialog}
                className={`relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white shadow-2xl ${size}`}
            >
                <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
                    <div>
                        <h2 id={titleId} className="text-lg font-bold text-slate-900">
                            {title}
                        </h2>
                        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
                    </div>
                    <button
                        ref={closeButton}
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                        aria-label="Close dialog"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="px-6 py-5">{children}</div>
                {footer && (
                    <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}

export function Toast({
    message,
    tone = "success",
    onClose,
}: {
    message: string;
    tone?: "success" | "error";
    onClose: () => void;
}) {
    const onCloseRef = useRef(onClose);

    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        const timeout = window.setTimeout(() => onCloseRef.current(), 4000);
        return () => window.clearTimeout(timeout);
    }, [message, tone]);

    return (
        <div
            className={`fixed right-5 top-20 z-[120] flex max-w-md items-center gap-3 rounded-xl border bg-white px-4 py-3 text-sm shadow-xl ${tone === "error" ? "border-red-200 text-red-800" : "border-green-200 text-green-800"}`}
            role={tone === "error" ? "alert" : "status"}
            aria-live={tone === "error" ? "assertive" : "polite"}
        >
            {tone === "error" ? (
                <AlertCircle className="h-5 w-5 shrink-0" />
            ) : (
                <CheckCircle2 className="h-5 w-5 shrink-0" />
            )}
            <span className="flex-1">{message}</span>
            <button
                type="button"
                onClick={onClose}
                className="rounded p-1 hover:bg-gray-100"
                aria-label="Dismiss notification"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}

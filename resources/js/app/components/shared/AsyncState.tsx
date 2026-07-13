import { AlertCircle, Inbox, Loader2, RefreshCw } from "lucide-react";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
    return (
        <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-gray-500" role="status">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            <span>{label}</span>
        </div>
    );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
    return (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center" role="alert">
            <AlertCircle className="mx-auto mb-2 h-6 w-6 text-red-500" aria-hidden="true" />
            <p className="text-sm text-red-700">{message}</p>
            {onRetry && (
                <button
                    type="button"
                    onClick={onRetry}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
                >
                    <RefreshCw className="h-4 w-4" aria-hidden="true" /> Retry
                </button>
            )}
        </div>
    );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
    return (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
            <Inbox className="mx-auto mb-3 h-8 w-8 text-gray-300" aria-hidden="true" />
            <h2 className="font-semibold text-gray-800">{title}</h2>
            {description && <p className="mx-auto mt-1 max-w-lg text-sm text-gray-500">{description}</p>}
        </div>
    );
}

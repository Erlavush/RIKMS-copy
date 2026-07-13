import type { DocumentStatus } from "../../lib/api";

const STYLES: Record<string, string> = {
    published: "border-green-200 bg-green-50 text-green-700",
    pending: "border-blue-200 bg-blue-50 text-blue-700",
    draft: "border-amber-200 bg-amber-50 text-amber-700",
    rejected: "border-red-200 bg-red-50 text-red-700",
    archived: "border-gray-200 bg-gray-50 text-gray-600",
    approved: "border-green-200 bg-green-50 text-green-700",
};

export function StatusBadge({ status }: { status: DocumentStatus | string }) {
    return (
        <span
            className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${STYLES[status] ?? STYLES.archived}`}
        >
            {status}
        </span>
    );
}

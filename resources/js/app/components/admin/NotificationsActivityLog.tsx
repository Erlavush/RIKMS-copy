import { useState } from "react";
import { Link } from "react-router";
import { Bell, CheckCheck, FileClock, Search } from "lucide-react";
import { toast } from "sonner";
import { useApi } from "../../hooks/useApi";
import { useAgencyContext } from "../../hooks/useAgencyContext";
import {
    apiPatch,
    apiPost,
    firstValidationError,
    type AuditRecord,
    type NotificationRecord,
    type Paginated,
    queryString,
} from "../../lib/api";
import { formatDateTime } from "../../lib/format";
import { hasPermission } from "../../lib/permissions";
import { EmptyState, ErrorState, LoadingState } from "../shared/AsyncState";

export function NotificationsActivityLog() {
    const { user } = useAgencyContext();
    const [tab, setTab] = useState<"notifications" | "activity">("notifications");
    const [notificationPage, setNotificationPage] = useState(1);
    const [activityPage, setActivityPage] = useState(1);
    const [activitySearch, setActivitySearch] = useState("");
    const [appliedSearch, setAppliedSearch] = useState("");
    const canViewDocuments = hasPermission(user, "documents.view");
    const canUpdateDocuments = hasPermission(user, "documents.update");
    const canManageAccess = hasPermission(user, "access_requests.manage");
    const notifications = useApi<Paginated<NotificationRecord>>(
        tab === "notifications" ? `/api/rikms/notifications${queryString({ page: notificationPage })}` : null,
    );
    const activity = useApi<Paginated<AuditRecord>>(
        canViewDocuments && tab === "activity"
            ? `/api/rikms/agency/activity${queryString({ search: appliedSearch, page: activityPage })}`
            : null,
    );

    async function markAllRead() {
        try {
            await apiPost("/api/rikms/notifications/read-all");
            toast.success("All notifications marked as read.");
            await notifications.refresh();
            window.dispatchEvent(new CustomEvent("rikms:notifications-changed"));
        } catch (error) {
            toast.error(firstValidationError(error));
        }
    }

    async function markRead(notification: NotificationRecord) {
        if (notification.readAt) return;
        try {
            await apiPatch(`/api/rikms/notifications/${notification.id}/read`, {});
            await notifications.refresh();
            window.dispatchEvent(new CustomEvent("rikms:notifications-changed"));
        } catch (error) {
            toast.error(firstValidationError(error));
        }
    }

    const unread = notifications.data?.data.filter((item) => !item.readAt).length ?? 0;

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold text-[#1E3A8A]">Notifications & Activity</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Review system updates and the agency’s immutable action history.
                </p>
            </header>
            <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1" role="tablist">
                <button
                    type="button"
                    role="tab"
                    aria-selected={tab === "notifications"}
                    onClick={() => setTab("notifications")}
                    className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium ${tab === "notifications" ? "bg-[#1E3A8A] text-white" : "text-gray-600 hover:bg-gray-50"}`}
                >
                    <Bell className="h-4 w-4" />
                    Notifications
                    {unread > 0 && (
                        <span className="rounded-full bg-red-500 px-1.5 text-[10px] text-white">
                            {unread}
                        </span>
                    )}
                </button>
                {canViewDocuments && (
                    <button
                        type="button"
                        role="tab"
                        aria-selected={tab === "activity"}
                        onClick={() => setTab("activity")}
                        className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium ${tab === "activity" ? "bg-[#1E3A8A] text-white" : "text-gray-600 hover:bg-gray-50"}`}
                    >
                        <FileClock className="h-4 w-4" />
                        Activity log
                    </button>
                )}
            </div>
            {tab === "notifications" && (
                <section role="tabpanel" className="space-y-4">
                    <div className="flex justify-end">
                        <button
                            type="button"
                            disabled={unread === 0}
                            onClick={() => void markAllRead()}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                        >
                            <CheckCheck className="h-4 w-4" />
                            Mark all read
                        </button>
                    </div>
                    {notifications.loading && <LoadingState label="Loading notifications…" />}
                    {notifications.error && (
                        <ErrorState
                            message={notifications.error}
                            onRetry={() => void notifications.refresh()}
                        />
                    )}
                    {notifications.data &&
                        (notifications.data.data.length === 0 ? (
                            <EmptyState
                                title="You’re all caught up"
                                description="New review, access, and system notifications will appear here."
                            />
                        ) : (
                            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                                <ul className="divide-y divide-gray-100">
                                    {notifications.data.data.map((notification) => {
                                        const href = notificationHref(
                                            notification,
                                            canManageAccess,
                                            canViewDocuments,
                                            canUpdateDocuments,
                                        );
                                        return (
                                            <li
                                                key={notification.id}
                                                className={`p-5 ${notification.readAt ? "bg-white" : "bg-blue-50/50"}`}
                                            >
                                                <div className="flex gap-3">
                                                    <span
                                                        className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${notification.readAt ? "bg-gray-200" : "bg-blue-600"}`}
                                                    />
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-col justify-between gap-1 sm:flex-row">
                                                            <h2 className="text-sm font-semibold text-gray-900">
                                                                {notification.title}
                                                            </h2>
                                                            <time className="shrink-0 text-xs text-gray-400">
                                                                {formatDateTime(notification.createdAt)}
                                                            </time>
                                                        </div>
                                                        <p className="mt-1 text-sm leading-relaxed text-gray-600">
                                                            {notification.message}
                                                        </p>
                                                        <div className="mt-3 flex gap-3">
                                                            {href && (
                                                                <Link
                                                                    to={href}
                                                                    onClick={() =>
                                                                        void markRead(notification)
                                                                    }
                                                                    className="text-xs font-medium text-[#1E3A8A] hover:underline"
                                                                >
                                                                    Open
                                                                </Link>
                                                            )}
                                                            {!notification.readAt && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        void markRead(notification)
                                                                    }
                                                                    className="text-xs font-medium text-gray-600 hover:underline"
                                                                >
                                                                    Mark as read
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        ))}
                    {notifications.data && notifications.data.meta.lastPage > 1 && (
                        <Pagination
                            page={notificationPage}
                            lastPage={notifications.data.meta.lastPage}
                            setPage={setNotificationPage}
                        />
                    )}
                </section>
            )}
            {canViewDocuments && tab === "activity" && (
                <section role="tabpanel" className="space-y-4">
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            setActivityPage(1);
                            setAppliedSearch(activitySearch.trim());
                        }}
                        className="flex gap-3 rounded-xl border border-gray-200 bg-white p-4"
                    >
                        <label className="relative flex-1">
                            <span className="sr-only">Search activity log</span>
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                value={activitySearch}
                                onChange={(event) => setActivitySearch(event.target.value)}
                                placeholder="Search actions, users, or research titles…"
                                className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-blue-100"
                            />
                        </label>
                        <button className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white">
                            Search
                        </button>
                    </form>
                    {activity.loading && <LoadingState label="Loading activity history…" />}
                    {activity.error && (
                        <ErrorState message={activity.error} onRetry={() => void activity.refresh()} />
                    )}
                    {activity.data &&
                        (activity.data.data.length === 0 ? (
                            <EmptyState title="No matching activity" />
                        ) : (
                            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                                <ul className="divide-y divide-gray-100">
                                    {activity.data.data.map((record) => (
                                        <li key={record.id} className="flex gap-4 p-5">
                                            <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100">
                                                <FileClock className="h-4 w-4 text-gray-500" />
                                            </span>
                                            <div>
                                                <p className="text-sm text-gray-800">
                                                    <span className="font-semibold">
                                                        {record.user ?? "System"}
                                                    </span>{" "}
                                                    {record.action}
                                                    {record.documentTitle ? (
                                                        <>
                                                            {" "}
                                                            ·{" "}
                                                            <span className="font-medium">
                                                                {record.documentTitle}
                                                            </span>
                                                        </>
                                                    ) : null}
                                                </p>
                                                <time className="mt-1 block text-xs text-gray-400">
                                                    {formatDateTime(record.createdAt)}
                                                </time>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    {activity.data && activity.data.meta.lastPage > 1 && (
                        <Pagination
                            page={activityPage}
                            lastPage={activity.data.meta.lastPage}
                            setPage={setActivityPage}
                        />
                    )}
                </section>
            )}
        </div>
    );
}

function notificationHref(
    notification: NotificationRecord,
    canManageAccess: boolean,
    canViewDocuments: boolean,
    canUpdateDocuments: boolean,
): string | null {
    if (notification.data?.accessRequestId) {
        return canManageAccess ? "/agency/access-requests" : null;
    }
    if (notification.data?.documentId) {
        if (canUpdateDocuments && canViewDocuments) {
            return `/agency/research/${String(notification.data.documentId)}/edit`;
        }
        if (canViewDocuments) {
            return `/agency/research/${String(notification.data.documentId)}/versions`;
        }
    }
    return null;
}

function Pagination({
    page,
    lastPage,
    setPage,
}: {
    page: number;
    lastPage: number;
    setPage: (page: number) => void;
}) {
    return (
        <nav className="flex items-center justify-center gap-3" aria-label="Pagination">
            <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm disabled:opacity-40"
            >
                Previous
            </button>
            <span className="text-sm text-gray-500">
                Page {page} of {lastPage}
            </span>
            <button
                type="button"
                disabled={page >= lastPage}
                onClick={() => setPage(page + 1)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm disabled:opacity-40"
            >
                Next
            </button>
        </nav>
    );
}

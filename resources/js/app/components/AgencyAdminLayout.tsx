import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import {
    Archive,
    BarChart3,
    Bell,
    Building2,
    ChevronDown,
    Database,
    LayoutDashboard,
    LogOut,
    Menu,
    Search,
    Settings,
    ShieldCheck,
    Upload,
    User,
    X,
} from "lucide-react";
import { apiPost, type CurrentUser, type NotificationRecord, type Paginated } from "../lib/api";
import { hasPermission, type AgencyPermission } from "../lib/permissions";
import { useApi } from "../hooks/useApi";
import type { AgencyOutletContext } from "../hooks/useAgencyContext";
import { ErrorState, LoadingState } from "./shared/AsyncState";

const NAV_ITEMS: ReadonlyArray<{
    icon: React.ElementType;
    label: string;
    href: string;
    permission?: AgencyPermission;
}> = [
    {
        icon: LayoutDashboard,
        label: "Dashboard",
        href: "/agency/dashboard",
        permission: "documents.view",
    },
    {
        icon: Database,
        label: "Research Repository",
        href: "/agency/research",
        permission: "documents.view",
    },
    {
        icon: Upload,
        label: "Upload Research",
        href: "/agency/upload",
        permission: "documents.create",
    },
    {
        icon: ShieldCheck,
        label: "Access Requests",
        href: "/agency/access-requests",
        permission: "access_requests.manage",
    },
    { icon: Archive, label: "Archive", href: "/agency/archive", permission: "documents.view" },
    {
        icon: BarChart3,
        label: "Analytics",
        href: "/agency/analytics",
        permission: "documents.view",
    },
    { icon: Bell, label: "Notifications", href: "/agency/notifications" },
    {
        icon: Building2,
        label: "Agency Profile",
        href: "/agency/profile",
        permission: "agency.manage",
    },
    { icon: Settings, label: "Settings", href: "/agency/settings", permission: "agency.manage" },
];

type MeResponse = { data: CurrentUser } | CurrentUser;
type NotificationResponse = Paginated<NotificationRecord> | { data: NotificationRecord[] };

function isWrappedUser(value: MeResponse): value is { data: CurrentUser } {
    return "data" in value;
}

export function AgencyAdminLayout() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [query, setQuery] = useState("");
    const navigate = useNavigate();
    const location = useLocation();
    const me = useApi<MeResponse>("/api/rikms/me");
    const notifications = useApi<NotificationResponse>("/api/rikms/notifications?unread=1&per_page=20");
    const refreshMe = me.refresh;
    const refreshNotificationList = notifications.refresh;

    useEffect(() => {
        const handleUnauthorized = () => {
            window.location.assign("/login");
        };
        window.addEventListener("rikms:unauthorized", handleUnauthorized);
        return () => window.removeEventListener("rikms:unauthorized", handleUnauthorized);
    }, []);

    useEffect(() => {
        const refreshNotifications = () => {
            void Promise.all([refreshMe(), refreshNotificationList()]);
        };
        window.addEventListener("rikms:notifications-changed", refreshNotifications);
        return () => window.removeEventListener("rikms:notifications-changed", refreshNotifications);
    }, [refreshMe, refreshNotificationList]);

    useEffect(() => {
        if (!me.data) return;
        const user = isWrappedUser(me.data) ? me.data.data : me.data;
        if (user.mustChangePassword) window.location.assign("/change-password");
        else if (location.pathname === "/agency/dashboard" && !hasPermission(user, "documents.view"))
            navigate("/agency/notifications", { replace: true });
    }, [location.pathname, me.data, navigate]);

    useEffect(() => {
        setMobileOpen(false);
        setProfileOpen(false);
    }, [location.pathname]);

    if (me.loading) return <LoadingState label="Loading your agency workspace…" />;
    if (me.error || !me.data) {
        return (
            <main className="mx-auto max-w-xl p-8">
                <ErrorState
                    message={me.error ?? "Your session could not be loaded."}
                    onRetry={() => void me.refresh()}
                />
            </main>
        );
    }

    const user = isWrappedUser(me.data) ? me.data.data : me.data;
    if (user.mustChangePassword) return <LoadingState label="Redirecting to password security…" />;
    const canViewDocuments = hasPermission(user, "documents.view");
    const canManageAgency = hasPermission(user, "agency.manage");
    const visibleNavItems = NAV_ITEMS.filter(
        (item) => !item.permission || hasPermission(user, item.permission),
    );
    const homeHref = canViewDocuments ? "/agency/dashboard" : "/agency/notifications";
    const notificationItems = notifications.data?.data ?? [];
    const unreadCount = user.unreadNotifications ?? notificationItems.filter((item) => !item.readAt).length;

    async function logout() {
        try {
            await apiPost<{ redirect?: string }>("/logout");
        } finally {
            window.location.assign("/login");
        }
    }

    function submitSearch(event: React.FormEvent) {
        event.preventDefault();
        const value = query.trim();
        navigate(value ? `/agency/research?search=${encodeURIComponent(value)}` : "/agency/research");
    }

    return (
        <div className="min-h-screen bg-[#F3F4F6] text-gray-900">
            <a
                href="#agency-main-content"
                className="sr-only z-[100] rounded-lg bg-white px-4 py-2 text-[#1E3A8A] shadow focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
            >
                Skip to agency content
            </a>
            <header className="sticky top-0 z-50 flex h-16 items-center border-b border-gray-200 bg-white px-4 lg:px-6">
                <button
                    type="button"
                    className="mr-2 rounded-lg p-2 hover:bg-gray-100 lg:hidden"
                    onClick={() => setMobileOpen((open) => !open)}
                    aria-label="Toggle navigation"
                >
                    {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
                <Link to={homeHref} className="flex shrink-0 items-center gap-2 font-bold text-[#1E3A8A]">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1E3A8A]">
                        <Database className="h-4 w-4 text-white" />
                    </span>
                    RIKMS
                </Link>

                {canViewDocuments && (
                    <form
                        className="mx-auto hidden w-full max-w-md px-6 sm:block"
                        role="search"
                        onSubmit={submitSearch}
                    >
                        <label htmlFor="agency-global-search" className="sr-only">
                            Search agency research
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                id="agency-global-search"
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="Search research records…"
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-3 text-sm focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-blue-100"
                            />
                        </div>
                    </form>
                )}

                <div className="ml-auto flex items-center gap-1">
                    <Link
                        to="/agency/notifications"
                        className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                        aria-label={`${unreadCount} unread notifications`}
                    >
                        <Bell className="h-5 w-5" />
                        {unreadCount > 0 && (
                            <span className="absolute right-1 top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                                {unreadCount > 9 ? "9+" : unreadCount}
                            </span>
                        )}
                    </Link>
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setProfileOpen((open) => !open)}
                            aria-expanded={profileOpen}
                            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-100"
                        >
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1E3A8A] text-xs font-semibold text-white">
                                {user.name
                                    .split(/\s+/)
                                    .map((part) => part[0])
                                    .join("")
                                    .slice(0, 2)
                                    .toUpperCase()}
                            </span>
                            <span className="hidden text-left md:block">
                                <span className="block max-w-44 truncate text-sm font-medium">
                                    {user.name}
                                </span>
                                <span className="block text-xs text-gray-500">
                                    {user.agencyAbbr ?? "Agency"}
                                </span>
                            </span>
                            <ChevronDown className="hidden h-4 w-4 text-gray-400 md:block" />
                        </button>
                        {profileOpen && (
                            <div className="absolute right-0 top-full mt-1 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                                {canManageAgency && (
                                    <>
                                        <Link
                                            to="/agency/profile"
                                            className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50"
                                        >
                                            <User className="h-4 w-4" /> Agency profile
                                        </Link>
                                        <Link
                                            to="/agency/settings"
                                            className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50"
                                        >
                                            <Settings className="h-4 w-4" /> Settings
                                        </Link>
                                    </>
                                )}
                                <button
                                    type="button"
                                    onClick={() => void logout()}
                                    className="flex w-full items-center gap-2 border-t border-gray-100 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
                                >
                                    <LogOut className="h-4 w-4" /> Sign out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="flex min-h-[calc(100vh-4rem)]">
                {mobileOpen && (
                    <button
                        type="button"
                        aria-label="Close navigation"
                        className="fixed inset-0 z-30 bg-black/30 lg:hidden"
                        onClick={() => setMobileOpen(false)}
                    />
                )}
                <aside
                    className={`fixed bottom-0 left-0 top-16 z-40 w-64 border-r border-gray-200 bg-white transition-transform lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
                >
                    <div className="border-b border-gray-100 px-5 py-4">
                        <p className="truncate text-sm font-semibold text-[#1E3A8A]">
                            {user.agencyAbbr ?? user.agencyName}
                        </p>
                        <p className="truncate text-xs text-gray-500">{user.agencyName}</p>
                    </div>
                    <nav className="space-y-1 p-3" aria-label="Agency portal">
                        {visibleNavItems.map(({ icon: Icon, label, href }) => {
                            const active =
                                location.pathname === href ||
                                (href === "/agency/research" &&
                                    location.pathname.startsWith("/agency/research/"));
                            return (
                                <Link
                                    key={href}
                                    to={href}
                                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${active ? "bg-blue-50 text-[#1E3A8A]" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}
                                    aria-current={active ? "page" : undefined}
                                >
                                    <Icon className="h-[18px] w-[18px]" />
                                    {label}
                                </Link>
                            );
                        })}
                    </nav>
                </aside>
                <main id="agency-main-content" className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
                    <div className="mx-auto max-w-7xl">
                        <Outlet context={{ user, refreshUser: me.refresh } satisfies AgencyOutletContext} />
                    </div>
                </main>
            </div>
        </div>
    );
}

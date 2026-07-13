import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import {
    Archive,
    BarChart3,
    Bell,
    BookOpen,
    Building2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Database,
    Eye,
    FileText,
    KeyRound,
    LayoutDashboard,
    LogOut,
    Menu,
    Search,
    Settings,
    ShieldAlert,
    ShieldCheck,
    User,
    Users,
    X,
} from "lucide-react";

import {
    getCurrentUser,
    getNotifications,
    markAllNotificationsRead,
    markNotificationRead,
} from "../lib/admin-api";
import type { NotificationRecord } from "../lib/admin-api";
import { postJson } from "../lib/http";
import { formatDate } from "./super-admin/admin-ui-utils";

const NAV_ITEMS = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/admin/dashboard" },
    { icon: Building2, label: "Agency Management", href: "/admin/agencies" },
    { icon: Users, label: "Agency Admin Users", href: "/admin/users" },
    { icon: Database, label: "System Research", href: "/admin/research" },
    { icon: ShieldCheck, label: "Research Moderation", href: "/admin/moderation" },
    { icon: Eye, label: "Access Monitoring", href: "/admin/access-monitoring" },
    { icon: BarChart3, label: "System Analytics", href: "/admin/analytics" },
    { icon: FileText, label: "Activity Logs", href: "/admin/activity" },
    { icon: KeyRound, label: "RBAC", href: "/admin/rbac" },
    { icon: ShieldAlert, label: "Security Center", href: "/admin/security" },
    { icon: Archive, label: "Archive", href: "/admin/archive" },
    { icon: Settings, label: "Platform Settings", href: "/admin/settings" },
] as const;

export function SuperAdminLayout() {
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
    const [notificationsError, setNotificationsError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [adminName, setAdminName] = useState("Administrator");
    const [identityLoading, setIdentityLoading] = useState(true);
    const [logoutError, setLogoutError] = useState<string | null>(null);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        let active = true;
        getCurrentUser()
            .then((response) => {
                if (!active) return;
                if (response.data.mustChangePassword) {
                    window.location.assign("/change-password");
                    return;
                }
                if (response.data.name) setAdminName(response.data.name);
                setIdentityLoading(false);
            })
            .catch(() => {
                if (active) setIdentityLoading(false);
            });
        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        let active = true;
        getNotifications()
            .then((response) => {
                if (active) setNotifications(response.data);
            })
            .catch((reason) => {
                if (active)
                    setNotificationsError(
                        reason instanceof Error ? reason.message : "Unable to load notifications.",
                    );
            });
        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        setMobileDrawerOpen(false);
        setProfileOpen(false);
        setNotificationsOpen(false);
    }, [location.pathname]);

    const submitSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const value = search.trim();
        navigate(value ? `/admin/research?search=${encodeURIComponent(value)}` : "/admin/research");
    };

    const logout = async () => {
        setLogoutError(null);
        try {
            await postJson<{ redirect?: string }>("/logout", {});
            window.location.assign("/admin/login");
        } catch (reason) {
            setLogoutError(reason instanceof Error ? reason.message : "Unable to sign out.");
        }
    };

    const readNotification = async (notification: NotificationRecord) => {
        if (notification.read) return;
        try {
            const response = await markNotificationRead(notification.id);
            setNotifications((items) =>
                items.map((item) => (item.id === notification.id ? response.data : item)),
            );
        } catch (reason) {
            setNotificationsError(
                reason instanceof Error ? reason.message : "Unable to update the notification.",
            );
        }
    };

    const readAllNotifications = async () => {
        try {
            await markAllNotificationsRead();
            setNotifications((items) =>
                items.map((item) => ({ ...item, read: true, readAt: new Date().toISOString() })),
            );
        } catch (reason) {
            setNotificationsError(
                reason instanceof Error ? reason.message : "Unable to update notifications.",
            );
        }
    };

    const sidebarWidth = sidebarCollapsed ? 72 : 240;
    const navigation = (mobile = false) => (
        <nav className="flex-1 overflow-y-auto py-3" aria-label="Administration navigation">
            {NAV_ITEMS.map(({ icon: Icon, label, href }) => {
                const active = location.pathname === href || location.pathname.startsWith(`${href}/`);
                return (
                    <Link
                        key={href}
                        to={href}
                        title={sidebarCollapsed && !mobile ? label : undefined}
                        className={`mx-2 mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${active ? "bg-amber-500/15 font-semibold text-amber-400" : "text-white/55 hover:bg-white/5 hover:text-white/85"}`}
                    >
                        <Icon className="h-5 w-5 shrink-0" />
                        {(mobile || !sidebarCollapsed) && <span className="truncate">{label}</span>}
                    </Link>
                );
            })}
        </nav>
    );

    if (identityLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#F3F4F6]" role="status">
                <p className="text-sm font-medium text-slate-600">Checking administrator security…</p>
            </div>
        );
    }

    return (
        <div
            className="flex min-h-screen flex-col bg-[#F3F4F6]"
            style={{ fontFamily: "'Inter', sans-serif" }}
        >
            <a
                href="#admin-main-content"
                className="sr-only z-[200] rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#1E3A8A] focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
            >
                Skip to main content
            </a>
            <header className="sticky top-0 z-50 flex h-16 items-center border-b border-white/10 bg-[#0F172A] px-4 sm:px-6">
                <button
                    type="button"
                    onClick={() => setMobileDrawerOpen(true)}
                    className="mr-2 rounded-lg p-2 text-white/60 hover:bg-white/10 lg:hidden"
                    aria-label="Open navigation"
                >
                    <Menu className="h-5 w-5" />
                </button>
                <Link to="/admin/dashboard" className="mr-6 flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20">
                        <BookOpen className="h-5 w-5 text-amber-400" />
                    </div>
                    <div className="hidden sm:block">
                        <span className="block text-sm font-bold leading-tight text-white">RIKMS</span>
                        <span className="block text-[10px] text-white/40">System Administration</span>
                    </div>
                </Link>

                <form onSubmit={submitSearch} className="hidden max-w-md flex-1 md:block" role="search">
                    <label htmlFor="admin-global-search" className="sr-only">
                        Search research records
                    </label>
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                        <input
                            id="admin-global-search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search research records…"
                            className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:border-amber-400/30 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                        />
                    </div>
                </form>

                <div className="relative ml-auto mr-1">
                    <button
                        type="button"
                        onClick={() => {
                            setNotificationsOpen((open) => !open);
                            setProfileOpen(false);
                        }}
                        className="relative rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white"
                        aria-label="Open notifications"
                        aria-expanded={notificationsOpen}
                    >
                        <Bell className="h-5 w-5" />
                        {notifications.some((notification) => !notification.read) && (
                            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500">
                                <span className="sr-only">Unread notifications</span>
                            </span>
                        )}
                    </button>
                    {notificationsOpen && (
                        <div className="absolute right-0 top-full z-50 mt-2 w-[min(90vw,380px)] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
                            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                                <div>
                                    <p className="text-sm font-bold text-slate-900">Notifications</p>
                                    <p className="text-xs text-gray-500">
                                        {notifications.filter((item) => !item.read).length} unread
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => void readAllNotifications()}
                                    disabled={!notifications.some((item) => !item.read)}
                                    className="text-xs font-semibold text-[#1E3A8A] hover:underline disabled:text-gray-300 disabled:no-underline"
                                >
                                    Mark all read
                                </button>
                            </div>
                            {notificationsError && (
                                <p
                                    className="border-b border-red-100 bg-red-50 px-4 py-3 text-xs text-red-700"
                                    role="alert"
                                >
                                    {notificationsError}
                                </p>
                            )}
                            {!notifications.length ? (
                                <p className="px-4 py-8 text-center text-sm text-gray-500">
                                    No notifications.
                                </p>
                            ) : (
                                <ul className="max-h-96 divide-y divide-gray-100 overflow-y-auto">
                                    {notifications.map((notification) => (
                                        <li key={notification.id}>
                                            <button
                                                type="button"
                                                onClick={() => void readNotification(notification)}
                                                className={`w-full px-4 py-3 text-left hover:bg-gray-50 ${notification.read ? "bg-white" : "bg-blue-50/60"}`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <span
                                                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${notification.read ? "bg-gray-200" : "bg-[#1E3A8A]"}`}
                                                    />
                                                    <span className="min-w-0">
                                                        <span className="block text-sm font-semibold text-slate-800">
                                                            {notification.title}
                                                        </span>
                                                        <span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-gray-500">
                                                            {notification.message}
                                                        </span>
                                                        <span className="mt-1 block text-[10px] text-gray-400">
                                                            {formatDate(notification.createdAt, true)}
                                                        </span>
                                                    </span>
                                                </div>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <Link
                                to="/admin/activity"
                                className="block border-t border-gray-100 px-4 py-3 text-center text-xs font-semibold text-[#1E3A8A] hover:bg-gray-50"
                            >
                                View activity log
                            </Link>
                        </div>
                    )}
                </div>

                <div className="relative">
                    <button
                        type="button"
                        onClick={() => {
                            setProfileOpen((open) => !open);
                            setNotificationsOpen(false);
                        }}
                        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-white/80 hover:bg-white/10"
                        aria-expanded={profileOpen}
                    >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20">
                            <User className="h-4 w-4 text-amber-400" />
                        </div>
                        <span className="hidden max-w-36 truncate text-sm font-medium sm:block">
                            {adminName}
                        </span>
                        <ChevronDown className="hidden h-3.5 w-3.5 text-white/40 sm:block" />
                    </button>
                    {profileOpen && (
                        <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white py-1.5 shadow-xl">
                            <div className="border-b border-gray-100 px-4 py-2.5">
                                <p className="truncate text-sm font-semibold text-slate-800">{adminName}</p>
                                <p className="text-xs text-gray-500">Super administrator</p>
                            </div>
                            <Link
                                to="/admin/security"
                                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                            >
                                <ShieldAlert className="h-4 w-4 text-gray-400" /> Security status
                            </Link>
                            <button
                                type="button"
                                onClick={() => void logout()}
                                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
                            >
                                <LogOut className="h-4 w-4" /> Sign out
                            </button>
                            {logoutError && (
                                <p
                                    className="border-t border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700"
                                    role="alert"
                                >
                                    {logoutError}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </header>

            <div className="flex flex-1">
                <aside
                    className="sticky top-16 hidden h-[calc(100vh-64px)] flex-col overflow-hidden border-r border-white/10 bg-[#0F172A] transition-[width] lg:flex"
                    style={{ width: sidebarWidth, minWidth: sidebarWidth }}
                >
                    {navigation()}
                    <div className="border-t border-white/10 p-2">
                        <button
                            type="button"
                            onClick={() => setSidebarCollapsed((value) => !value)}
                            className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs text-white/40 hover:bg-white/5 hover:text-white/70"
                            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                        >
                            {sidebarCollapsed ? (
                                <ChevronRight className="h-4 w-4" />
                            ) : (
                                <>
                                    <ChevronLeft className="h-4 w-4" /> Collapse
                                </>
                            )}
                        </button>
                    </div>
                </aside>

                {mobileDrawerOpen && (
                    <div className="fixed inset-0 z-[80] lg:hidden">
                        <button
                            type="button"
                            className="absolute inset-0 bg-black/50"
                            onClick={() => setMobileDrawerOpen(false)}
                            aria-label="Close navigation"
                        />
                        <aside className="relative flex h-full w-[280px] flex-col bg-[#0F172A] shadow-2xl">
                            <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
                                <span className="font-bold text-white">RIKMS Admin</span>
                                <button
                                    type="button"
                                    onClick={() => setMobileDrawerOpen(false)}
                                    className="rounded-lg p-2 text-white/50 hover:bg-white/10"
                                    aria-label="Close navigation"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <form onSubmit={submitSearch} className="p-3">
                                <label className="sr-only" htmlFor="mobile-admin-search">
                                    Search research
                                </label>
                                <input
                                    id="mobile-admin-search"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Search research…"
                                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30"
                                />
                            </form>
                            {navigation(true)}
                        </aside>
                    </div>
                )}

                <main
                    id="admin-main-content"
                    className="min-w-0 flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8"
                    tabIndex={-1}
                >
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

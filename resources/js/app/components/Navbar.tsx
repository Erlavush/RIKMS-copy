import { useEffect, useState } from "react";
import { BookOpen, Menu, Search, X } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router";
import { useBootstrap } from "../hooks/useBootstrap";

const NAV_LINKS = [
    { to: "/browse", label: "Browse Research" },
    { to: "/agencies", label: "Agencies" },
    { to: "/about", label: "About" },
] as const;

export function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const bootstrap = useBootstrap();
    const [search, setSearch] = useState("");
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => setMobileOpen(false), [location.pathname, location.search]);

    function submitSearch(event: React.FormEvent) {
        event.preventDefault();
        const value = search.trim();
        navigate(value ? `/browse?search=${encodeURIComponent(value)}` : "/browse");
    }

    const user = bootstrap.data?.currentUser;
    const portalUrl = user?.role === "super_admin" ? "/admin/dashboard" : "/agency/dashboard";

    return (
        <nav
            className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm"
            aria-label="Main navigation"
        >
            <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-6">
                <Link
                    to="/"
                    className="flex shrink-0 items-center gap-2 font-bold tracking-tight text-[#1E3A8A]"
                >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1E3A8A]">
                        <BookOpen className="h-5 w-5 text-white" />
                    </span>
                    <span className="hidden max-w-40 truncate sm:block">
                        {bootstrap.data?.platform?.siteName ?? "RIKMS"}
                    </span>
                </Link>
                <form onSubmit={submitSearch} className="hidden max-w-md flex-1 md:block" role="search">
                    <label className="relative block">
                        <span className="sr-only">Search published research</span>
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search published research by title or keyword"
                            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                    </label>
                </form>
                <div className="hidden items-center gap-1 md:flex">
                    {NAV_LINKS.map((link) => {
                        const active =
                            location.pathname === link.to ||
                            (link.to === "/agencies" && location.pathname.startsWith("/agencies/"));
                        return (
                            <Link
                                key={link.to}
                                to={link.to}
                                aria-current={active ? "page" : undefined}
                                className={`rounded-md px-3 py-2 text-sm ${active ? "bg-blue-50 font-medium text-[#1E3A8A]" : "text-gray-600 hover:bg-blue-50 hover:text-[#1E3A8A]"}`}
                            >
                                {link.label}
                            </Link>
                        );
                    })}
                    <Link
                        to={user ? portalUrl : "/login"}
                        className="ml-2 rounded-lg bg-[#1E3A8A] px-4 py-2 text-sm font-medium text-white hover:bg-blue-900"
                    >
                        {user ? "Dashboard" : "Agency login"}
                    </Link>
                </div>
                <div className="flex items-center gap-2 md:hidden">
                    <Link
                        to={user ? portalUrl : "/login"}
                        className="rounded-lg bg-[#1E3A8A] px-3 py-1.5 text-sm font-medium text-white"
                    >
                        {user ? "Dashboard" : "Login"}
                    </Link>
                    <button
                        type="button"
                        onClick={() => setMobileOpen((open) => !open)}
                        aria-expanded={mobileOpen}
                        aria-controls="mobile-navigation"
                        aria-label="Toggle navigation menu"
                        className="rounded-lg p-2 hover:bg-gray-100"
                    >
                        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </div>
            </div>
            {mobileOpen && (
                <div
                    id="mobile-navigation"
                    className="border-t border-gray-100 bg-white px-4 py-3 shadow-lg md:hidden"
                >
                    <form onSubmit={submitSearch} role="search">
                        <label className="relative block">
                            <span className="sr-only">Search published research</span>
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search research…"
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm"
                            />
                        </label>
                    </form>
                    <div className="mt-3 space-y-1">
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.to}
                                to={link.to}
                                className="block rounded-lg px-3 py-2.5 text-sm text-gray-600 hover:bg-blue-50 hover:text-[#1E3A8A]"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </nav>
    );
}

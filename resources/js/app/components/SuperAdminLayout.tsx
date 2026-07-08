import { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard,
  Building2,
  Users,
  Database,
  ShieldCheck,
  Eye,
  BarChart3,
  FileText,
  KeyRound,
  ShieldAlert,
  Archive,
  Settings,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Menu,
  X,
  Bell,
  BookOpen,
} from "lucide-react";
import { postJson } from "../lib/http";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin/dashboard" },
  { icon: Building2, label: "Agency Management", href: "/admin/agencies" },
  { icon: Users, label: "Agency Admin Users", href: "/admin/users" },
  { icon: Database, label: "System Research", href: "/admin/research" },
  { icon: ShieldCheck, label: "Research Integrity & Moderation", href: "/admin/moderation" },
  { icon: Eye, label: "Access Request Monitoring", href: "/admin/access-monitoring" },
  { icon: BarChart3, label: "System Analytics", href: "/admin/analytics" },
  { icon: FileText, label: "System Notifications & Activity Logs", href: "/admin/activity" },
  { icon: KeyRound, label: "RBAC Management", href: "/admin/rbac" },
  { icon: ShieldAlert, label: "Security Center", href: "/admin/security" },
  { icon: Archive, label: "Archive", href: "/admin/archive" },
  { icon: Settings, label: "Platform Settings", href: "/admin/settings" },
];

function SidebarTooltip({ label, show }: { label: string; show: boolean }) {
  if (!show) return null;
  return (
    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 pointer-events-none">
      <div className="px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap shadow-lg" style={{ fontWeight: 500 }}>
        {label}
      </div>
    </div>
  );
}

export function SuperAdminLayout() {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const logout = async () => {
    await postJson<{ redirect: string }>("/logout", {});
    window.location.href = "/admin/login";
  };

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w >= 1024) {
        setMobileDrawerOpen(false);
        setMobileSearchOpen(false);
      } else if (w >= 768) {
        setSidebarCollapsed(true);
        setMobileDrawerOpen(false);
        setMobileSearchOpen(false);
      } else {
        setMobileDrawerOpen(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const sidebarWidth = sidebarCollapsed ? "72px" : "240px";

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* TOP NAV */}
      <header className="bg-[#0F172A] border-b border-white/10 h-16 flex items-center px-6 sticky top-0 z-50">
        {/* Mobile menu */}
        <button className="lg:hidden mr-3 p-2 rounded-lg text-white/60 hover:bg-white/10 transition-colors" onClick={() => setMobileDrawerOpen(true)}>
          <Menu className="w-5 h-5" />
        </button>

        {/* Logo */}
        <Link to="/admin/dashboard" className="flex items-center gap-2.5 mr-6">
          <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-amber-400" />
          </div>
          <div className="hidden sm:block">
            <span className="text-white tracking-tight block" style={{ fontSize: "0.85rem", fontWeight: 700, lineHeight: 1.2 }}>
              RIKMS
            </span>
            <span className="text-white/40 block" style={{ fontSize: "0.65rem", fontWeight: 500 }}>
              System Administration
            </span>
          </div>
        </Link>

        {/* Search */}
        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
            <input
              type="text"
              placeholder="Search agencies, users, or research records..."
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400/30"
            />
          </div>
        </div>

        {/* Mobile search toggle */}
        <button className="md:hidden ml-auto mr-2 p-2 rounded-lg text-white/60 hover:bg-white/10 transition-colors" onClick={() => setMobileSearchOpen(!mobileSearchOpen)}>
          <Search className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 ml-auto">
          {/* Notifications */}
          <button className="relative p-2 rounded-lg text-white/60 hover:bg-white/10 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-amber-400" />
              </div>
              <span className="hidden sm:block text-sm text-white/80" style={{ fontWeight: 500 }}>Super Admin</span>
              <ChevronDown className="w-3.5 h-3.5 text-white/40 hidden sm:block" />
            </button>
            {profileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 z-50">
                  <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5">
                    <User className="w-4 h-4 text-gray-400" /> Profile
                  </button>
                  <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-gray-400" /> Security Settings
                  </button>
                  <div className="border-t border-gray-100 my-1" />
                  <button
                    onClick={() => { setProfileOpen(false); void logout(); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile search bar */}
      {mobileSearchOpen && (
        <div className="md:hidden bg-[#0F172A] border-b border-white/10 px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
            <input
              type="text"
              placeholder="Search..."
              autoFocus
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
            />
          </div>
        </div>
      )}

      <div className="flex flex-1">
        {/* SIDEBAR – Desktop */}
        <aside
          className="hidden lg:flex flex-col bg-[#0F172A] border-r border-white/10 sticky top-16 h-[calc(100vh-64px)] transition-all duration-200 overflow-hidden z-40"
          style={{ width: sidebarWidth, minWidth: sidebarWidth }}
        >
          <nav className="flex-1 py-3 overflow-y-auto custom-scrollbar">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + "/");
              return (
                <div key={item.href} className="relative px-2 mb-0.5" onMouseEnter={() => setHoveredItem(item.label)} onMouseLeave={() => setHoveredItem(null)}>
                  <Link
                    to={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isActive
                        ? "bg-amber-500/15 text-amber-400"
                        : "text-white/50 hover:bg-white/5 hover:text-white/80"
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {!sidebarCollapsed && (
                      <span className="text-sm truncate" style={{ fontWeight: isActive ? 600 : 400 }}>
                        {item.label}
                      </span>
                    )}
                  </Link>
                  {sidebarCollapsed && <SidebarTooltip label={item.label} show={hoveredItem === item.label} />}
                </div>
              );
            })}
          </nav>

          {/* Collapse toggle */}
          <div className="border-t border-white/10 p-2">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-white/40 hover:bg-white/5 hover:text-white/70 transition-colors"
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span className="text-xs">Collapse</span></>}
            </button>
          </div>
        </aside>

        {/* SIDEBAR – Mobile drawer */}
        {mobileDrawerOpen && (
          <>
            <div className="fixed inset-0 bg-black/50 z-50 lg:hidden" onClick={() => setMobileDrawerOpen(false)} />
            <aside className="fixed left-0 top-0 bottom-0 w-[260px] bg-[#0F172A] z-50 lg:hidden flex flex-col shadow-2xl">
              <div className="flex items-center justify-between px-4 h-16 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-amber-400" />
                  </div>
                  <span className="text-white text-sm" style={{ fontWeight: 700 }}>RIKMS Admin</span>
                </div>
                <button onClick={() => setMobileDrawerOpen(false)} className="p-2 rounded-lg text-white/40 hover:bg-white/10">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 py-3 overflow-y-auto">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setMobileDrawerOpen(false)}
                      className={`flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg transition-colors mb-0.5 ${
                        isActive
                          ? "bg-amber-500/15 text-amber-400"
                          : "text-white/50 hover:bg-white/5 hover:text-white/80"
                      }`}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      <span className="text-sm" style={{ fontWeight: isActive ? 600 : 400 }}>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </aside>
          </>
        )}

        {/* MAIN CONTENT */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

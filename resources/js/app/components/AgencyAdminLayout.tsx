import { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard,
  Database,
  Upload,
  ShieldCheck,
  BarChart3,
  Bell,
  Building2,
  Settings,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Menu,
  X,
  Archive,
} from "lucide-react";
import { postJson } from "../lib/http";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/agency/dashboard" },
  { icon: Database, label: "Research Repository", href: "/agency/research" },
  { icon: Upload, label: "Upload Research", href: "/agency/upload" },
  { icon: ShieldCheck, label: "Access Requests", href: "/agency/access-requests" },
  { icon: Archive, label: "Archive", href: "/agency/archive" },
  { icon: BarChart3, label: "Analytics", href: "/agency/analytics" },
  { icon: Bell, label: "Notifications", href: "/agency/notifications" },
  { icon: Building2, label: "Agency Profile", href: "/agency/profile" },
  { icon: Settings, label: "Settings", href: "/agency/settings" },
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

export function AgencyAdminLayout() {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const agencyName = "Department of Science and Technology – Region XI";
  const agencyAbbr = "DOST XI";

  // Responsive defaults
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
  const logout = async () => {
    await postJson<{ redirect: string }>("/logout", {});
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ===== TOP NAVIGATION BAR ===== */}
      <header className="bg-white border-b border-[#E5E7EB] h-16 flex items-center px-6 sticky top-0 z-50">
        {/* LEFT — Branding + Sidebar Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Mobile hamburger */}
          <button
            className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
            aria-label="Toggle menu"
          >
            {mobileDrawerOpen ? <X className="w-5 h-5 text-gray-600" /> : <Menu className="w-5 h-5 text-gray-600" />}
          </button>

          {/* Logo */}
          <Link to="/agency/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#1E3A8A] rounded-lg flex items-center justify-center">
              <Database className="w-4 h-4 text-white" />
            </div>
            <span className="hidden sm:block text-[#1E3A8A]" style={{ fontSize: "0.95rem", fontWeight: 700 }}>
              RIKMS
            </span>
          </Link>

          {/* Sidebar toggle (desktop/tablet only) */}
          <button
            className="hidden md:flex items-center justify-center p-1.5 ml-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* CENTER — Global Search */}
        {/* Desktop/Tablet: inline search */}
        <div className="hidden sm:flex flex-1 justify-center px-4 lg:px-8">
          <div className="relative w-full max-w-[320px] lg:max-w-[420px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search research records..."
              className="w-full pl-10 pr-4 py-2 bg-[#F3F4F6] border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]/40"
            />
          </div>
        </div>
        {/* Mobile: spacer when search hidden */}
        <div className="flex-1 sm:hidden" />

        {/* RIGHT — User Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Mobile search toggle */}
          <button
            className="sm:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            aria-label="Toggle search"
          >
            <Search className="w-5 h-5 text-gray-500" />
          </button>

          {/* Notification */}
          <button
            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => navigate("/agency/notifications")}
          >
            <Bell className="w-5 h-5 text-gray-500" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* Profile */}
          <div className="relative">
            <button
              className="flex items-center gap-2 px-2 md:px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => setProfileOpen(!profileOpen)}
            >
              <div className="w-8 h-8 bg-[#1E3A8A] rounded-full flex items-center justify-center">
                <span className="text-white text-xs" style={{ fontWeight: 600 }}>AD</span>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm text-gray-800" style={{ fontWeight: 500 }}>Agency Admin</p>
                <p className="text-xs text-gray-500">{agencyAbbr}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400 hidden md:block" />
            </button>
            {profileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50">
                  <button
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => { setProfileOpen(false); navigate("/agency/profile"); }}
                  >
                    <User className="w-4 h-4" /> My Profile
                  </button>
                  <button
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => { setProfileOpen(false); navigate("/agency/settings"); }}
                  >
                    <Settings className="w-4 h-4" /> Agency Settings
                  </button>
                  <div className="border-t border-gray-100 my-1" />
                  <button
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    onClick={() => { setProfileOpen(false); void logout(); }}
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile expandable search overlay */}
      {mobileSearchOpen && (
        <div className="sm:hidden bg-white border-b border-[#E5E7EB] px-4 py-3 sticky top-16 z-40">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search research records..."
              autoFocus
              className="w-full pl-10 pr-10 py-2.5 bg-[#F3F4F6] border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]/40"
            />
            <button
              onClick={() => setMobileSearchOpen(false)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-200 text-gray-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ===== BODY: SIDEBAR + CONTENT ===== */}
      <div className="flex flex-1">
        {/* Mobile Drawer Overlay */}
        {mobileDrawerOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-30 md:hidden"
            onClick={() => setMobileDrawerOpen(false)}
          />
        )}

        {/* Sidebar — Mobile Drawer */}
        <aside
          className={`fixed md:hidden top-16 left-0 h-[calc(100vh-4rem)] w-[240px] bg-white border-r border-gray-200 z-40 transition-transform duration-250 ease-in-out ${
            mobileDrawerOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <nav className="p-4 space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={() => setMobileDrawerOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? "bg-[#1E3A8A]/10 text-[#1E3A8A]"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                  style={{ fontWeight: isActive ? 600 : 400 }}
                >
                  <item.icon className="w-[18px] h-[18px] shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
            <div className="bg-[#F9FAFB] rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-0.5">Logged in as</p>
              <p className="text-sm text-[#1E3A8A] truncate" style={{ fontWeight: 600 }}>{agencyAbbr}</p>
              <p className="text-xs text-gray-500 truncate">{agencyName}</p>
            </div>
          </div>
        </aside>

        {/* Sidebar — Desktop / Tablet (Collapsible) */}
        <aside
          className="hidden md:flex flex-col shrink-0 bg-white border-r border-[#E5E7EB] h-[calc(100vh-4rem)] sticky top-16 transition-all duration-250 ease-in-out overflow-hidden"
          style={{ width: sidebarWidth, minWidth: sidebarWidth }}
        >
          {/* Nav Items */}
          <nav className={`flex-1 space-y-1 pt-4 ${sidebarCollapsed ? "px-2" : "px-4"}`}>
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.href;
              const isHovered = hoveredItem === item.label;
              return (
                <div key={item.label} className="relative">
                  <Link
                    to={item.href}
                    onMouseEnter={() => setHoveredItem(item.label)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={`flex items-center gap-3 py-2.5 rounded-lg text-sm transition-colors ${
                      sidebarCollapsed ? "justify-center px-0" : "px-3"
                    } ${
                      isActive
                        ? "bg-[#1E3A8A]/10 text-[#1E3A8A]"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                    style={{ fontWeight: isActive ? 600 : 400 }}
                  >
                    <item.icon className="w-[18px] h-[18px] shrink-0" />
                    {!sidebarCollapsed && (
                      <span className="truncate whitespace-nowrap">{item.label}</span>
                    )}
                  </Link>
                  {sidebarCollapsed && <SidebarTooltip label={item.label} show={isHovered} />}
                </div>
              );
            })}
          </nav>

          {/* Bottom: Logged-in Agency */}
          <div className={`border-t border-gray-100 ${sidebarCollapsed ? "p-2" : "p-4"}`}>
            {sidebarCollapsed ? (
              <div className="relative group">
                <div className="flex justify-center">
                  <div className="w-10 h-10 bg-[#1E3A8A]/10 rounded-lg flex items-center justify-center">
                    <span className="text-[#1E3A8A] text-xs" style={{ fontWeight: 700 }}>DX</span>
                  </div>
                </div>
                <div className="absolute left-full ml-2 bottom-0 z-50 hidden group-hover:block pointer-events-none">
                  <div className="px-3 py-2 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap shadow-lg">
                    <p style={{ fontWeight: 600 }}>{agencyAbbr}</p>
                    <p className="text-gray-300 mt-0.5" style={{ fontSize: "0.65rem" }}>{agencyName}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#F9FAFB] rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-0.5">Logged in as</p>
                <p className="text-sm text-[#1E3A8A] truncate" style={{ fontWeight: 600 }}>{agencyAbbr}</p>
                <p className="text-xs text-gray-500 truncate">{agencyName}</p>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-[1200px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

import { Search, BookOpen, Menu, X } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router";
import { useState } from "react";

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/browse?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  const navLinks = [
    { to: "/browse", label: "Browse Research", active: location.pathname === "/browse" },
    { to: "/agencies", label: "Agencies", active: location.pathname.startsWith("/agencies") },
    { to: "/about", label: "About", active: location.pathname === "/about" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex items-center justify-between h-16 gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-[#1E3A8A] rounded-lg flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="text-[#1E3A8A] tracking-tight hidden sm:block" style={{ fontSize: "1.1rem", fontWeight: 700 }}>
            RIKMS
          </span>
        </Link>

        {/* Search Bar - Desktop */}
        <form onSubmit={handleSearch} className="hidden md:block flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search research, keywords, agencies, or SDGs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#F9FAFB] border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] transition-colors"
            />
          </div>
        </form>

        {/* Navigation Links - Desktop */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-3 py-2 text-sm rounded-md transition-colors ${
                link.active
                  ? "text-[#1E3A8A] bg-blue-50"
                  : "text-[#6B7280] hover:text-[#1E3A8A] hover:bg-blue-50"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/login"
            className={`ml-2 px-4 py-2 text-sm rounded-lg transition-colors ${
              location.pathname === "/login"
                ? "bg-[#1E3A8A] text-white ring-2 ring-[#1E3A8A]/30"
                : "bg-[#1E3A8A] text-white hover:bg-[#1E3A8A]/90"
            }`}
          >
            Login
          </Link>
        </div>

        {/* Mobile: Search icon + Hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <Link
            to="/login"
            className="px-3 py-1.5 text-sm bg-[#1E3A8A] text-white rounded-lg"
          >
            Login
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 text-gray-600" />
            ) : (
              <Menu className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white shadow-lg">
          <div className="px-4 py-3">
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="mb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search research..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F9FAFB] border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                />
              </div>
            </form>

            {/* Mobile Nav Links */}
            <div className="space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2.5 text-sm rounded-lg transition-colors ${
                    link.active
                      ? "text-[#1E3A8A] bg-blue-50"
                      : "text-[#6B7280] hover:text-[#1E3A8A] hover:bg-gray-50"
                  }`}
                  style={{ fontWeight: link.active ? 600 : 400 }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

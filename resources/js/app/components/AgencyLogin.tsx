import { useState } from "react";
import {
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Lock,
  BookOpen,
  Building2,
  ChevronDown,
} from "lucide-react";
import { AGENCIES } from "../data/mock-data";
import { postJson } from "../lib/http";
import usepLogo from "figma:asset/6177429638abc45b39c8f0c3a10d798644b3df90.png";
import dostLogo from "figma:asset/cd31bfca4fc060b9b6e16de428e7aa16c331a6c6.png";

const AGENCY_OPTIONS = AGENCIES.map((a) => ({
  id: a.id,
  abbreviation: a.abbreviation,
  name: a.name,
}));

export function AgencyLogin() {
  const [selectedAgency, setSelectedAgency] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedAgencyData = AGENCY_OPTIONS.find(
    (a) => a.id.toString() === selectedAgency
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedAgency) {
      setError("Please select your agency before signing in.");
      return;
    }

    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await postJson<{ redirect: string }>("/login", {
        email,
        password,
        remember: rememberMe,
        agency_id: selectedAgency,
      });

      window.location.href = response.redirect || "/agency/dashboard";
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to sign in.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col lg:flex-row">
      {/* Left Section – Branding Panel */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center px-12 py-16"
        style={{ backgroundColor: "#1E3A8A" }}
      >
        {/* Dotted pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative z-10 max-w-lg text-center">
          {/* Logo */}
          <div className="w-16 h-16 bg-white/15 rounded-2xl flex items-center justify-center mx-auto mb-8">
            <BookOpen className="w-9 h-9 text-white" />
          </div>

          <h2
            className="text-white mb-4"
            style={{ fontSize: "2rem", fontWeight: 700, lineHeight: 1.25 }}
          >
            Regionwide Integrated Knowledge Management System
          </h2>

          {/* Accent underline */}
          <div className="w-16 h-1 bg-white/40 rounded-full mx-auto mb-6" />

          <p
            className="text-white/70 leading-relaxed"
            style={{ fontSize: "0.95rem" }}
          >
            Discover research publications, articles, and knowledge outputs
            contributed by government agencies and institutions in the Davao
            Region.
          </p>

          {/* Decorative circles */}
          <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full border border-white/10" />
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full border border-white/10" />
        </div>
      </div>

      {/* Right Section – Login Panel */}
      <div className="flex-1 flex items-center justify-center bg-[#F9FAFB] px-6 py-12 lg:py-0">
        <div className="w-full max-w-[420px]">
          {/* Header Logos */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <img
              src={usepLogo}
              alt="University of Southeastern Philippines"
              className="h-[52px] w-auto object-contain"
            />
            <div className="w-px h-8 bg-[#D1D5DB]" />
            <img
              src={dostLogo}
              alt="Department of Science and Technology Region XI"
              className="h-[52px] w-auto object-contain"
            />
          </div>

          {/* Welcome Text */}
          <div className="text-center mb-8">
            <h1
              className="text-[#1E3A8A] mb-2"
              style={{ fontSize: "1.65rem", fontWeight: 700 }}
            >
              Welcome Back
            </h1>
            <p className="text-[#6B7280] text-sm">
              Please select your agency and enter your credentials to access the portal.
            </p>
          </div>

          {/* Selected Agency Badge */}
          {selectedAgencyData && (
            <div className="flex items-center gap-3 bg-[#1E3A8A]/5 border border-[#1E3A8A]/15 rounded-lg px-4 py-3 mb-6">
              <div className="w-9 h-9 bg-[#1E3A8A] rounded-lg flex items-center justify-center shrink-0">
                <Building2 className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="min-w-0">
                <p
                  className="text-xs text-[#6B7280]"
                  style={{ fontWeight: 500 }}
                >
                  Selected Agency
                </p>
                <p
                  className="text-sm text-[#1E3A8A] truncate"
                  style={{ fontWeight: 600 }}
                >
                  {selectedAgencyData.abbreviation === "USEP"
                    ? selectedAgencyData.name
                    : `${selectedAgencyData.abbreviation} – ${selectedAgencyData.name}`}
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Agency Selector */}
            <div>
              <label
                htmlFor="agency"
                className="block text-sm text-[#374151] mb-1.5"
                style={{ fontWeight: 500 }}
              >
                Agency
              </label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <select
                  id="agency"
                  value={selectedAgency}
                  onChange={(e) => setSelectedAgency(e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] transition-colors disabled:opacity-50 cursor-pointer"
                  style={{ color: selectedAgency ? "#111827" : "#9CA3AF" }}
                >
                  <option value="" disabled>
                    Select your agency
                  </option>
                  {AGENCY_OPTIONS.map((agency) => (
                    <option key={agency.id} value={agency.id.toString()}>
                      {agency.abbreviation === "USEP"
                        ? `University of Southeastern Philippines (USEP)`
                        : `${agency.abbreviation} – ${agency.name}`}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm text-[#374151] mb-1.5"
                style={{ fontWeight: 500 }}
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="admin@agency.gov.ph"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] transition-colors disabled:opacity-50"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm text-[#374151] mb-1.5"
                style={{ fontWeight: 500 }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-4 py-2.5 pr-11 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] transition-colors disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4.5 h-4.5" />
                  ) : (
                    <Eye className="w-4.5 h-4.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[#1E3A8A] focus:ring-[#1E3A8A]/20"
                />
                <span className="text-sm text-[#6B7280]">Remember Me</span>
              </label>
              <button
                type="button"
                className="text-sm text-[#1E3A8A] hover:underline"
              >
                Forgot Password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#1E3A8A] text-white rounded-lg hover:bg-[#1E3A8A]/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
              style={{ fontWeight: 600 }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In to Portal"
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-8 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <Lock className="w-3.5 h-3.5 text-[#9CA3AF]" />
              <span
                className="text-xs text-[#9CA3AF]"
                style={{ fontWeight: 500 }}
              >
                Secure 256-bit encrypted connection
              </span>
            </div>
            <p className="text-xs text-[#9CA3AF] leading-relaxed">
              Official research management portal of the Regionwide
              <br />
              Integrated Knowledge Management System.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

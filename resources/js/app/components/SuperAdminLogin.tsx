import { useState } from "react";
import {
  Eye,
  EyeOff,
  ShieldAlert,
  AlertCircle,
  Loader2,
  Lock,
  BookOpen,
  KeyRound,
} from "lucide-react";

import { postJson } from "../lib/http";
import usepLogo from "figma:asset/6177429638abc45b39c8f0c3a10d798644b3df90.png";
import dostLogo from "figma:asset/cd31bfca4fc060b9b6e16de428e7aa16c331a6c6.png";

export function SuperAdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authCode, setAuthCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; authCode?: string; general?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};

    if (!email.trim()) newErrors.email = "Email address is required.";
    if (!password.trim()) newErrors.password = "Password is required.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      const response = await postJson<{ redirect: string }>("/login", {
        email,
        password,
        remember: rememberDevice,
        auth_code: authCode,
      });

      window.location.href = response.redirect || "/admin/dashboard";
    } catch (error) {
      setIsLoading(false);
      setErrors({ general: error instanceof Error ? error.message : "Unable to sign in." });
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ════════════════════════════════════════════
          LEFT PANEL – Security Branding
         ════════════════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-[50%] xl:w-[55%] bg-[#1E3A8A] relative overflow-hidden flex-col items-center justify-center px-12 xl:px-20">
        {/* Geometric grid pattern */}
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }} />
        {/* Radial gradient overlay */}
        <div className="absolute inset-0" style={{
          background: "radial-gradient(circle at 30% 50%, rgba(255,255,255,0.04) 0%, transparent 60%)",
        }} />
        {/* Decorative circles */}
        <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full border border-white/[0.05]" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full border border-white/[0.05]" />
        <div className="absolute top-1/4 right-12 w-40 h-40 rounded-full border border-white/[0.03]" />

        <div className="relative z-10 max-w-lg text-center">
          {/* System logo */}
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-8 backdrop-blur-sm border border-white/10">
            <BookOpen className="w-8 h-8 text-white" />
          </div>

          <h1 className="text-white mb-4" style={{ fontSize: "2rem", fontWeight: 700, lineHeight: 1.2 }}>
            RIKMS System<br />Administration
          </h1>
          <p className="text-white/60 mb-10" style={{ fontSize: "0.95rem", lineHeight: 1.6 }}>
            Secure administrative access to the Regionwide Integrated Knowledge Management System.
          </p>

          {/* Security notice */}
          <div className="inline-flex items-center gap-3 bg-white/[0.07] border border-white/10 rounded-xl px-5 py-3.5 backdrop-blur-sm">
            <div className="w-9 h-9 bg-amber-400/15 rounded-lg flex items-center justify-center shrink-0">
              <Lock className="w-4.5 h-4.5 text-amber-400" />
            </div>
            <div className="text-left">
              <p className="text-white text-sm" style={{ fontWeight: 600 }}>Restricted Access</p>
              <p className="text-white/50 text-xs">Authorized personnel only.</p>
            </div>
          </div>

          {/* Feature highlights */}
          <div className="mt-12 grid grid-cols-3 gap-4">
            {[
              { label: "Agencies", value: "9" },
              { label: "Research", value: "250+" },
              { label: "Users", value: "50+" },
            ].map((item) => (
              <div key={item.label} className="bg-white/[0.05] border border-white/[0.08] rounded-xl py-3 px-2">
                <p className="text-white text-lg" style={{ fontWeight: 700 }}>{item.value}</p>
                <p className="text-white/40 text-[11px]" style={{ fontWeight: 500 }}>{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════
          RIGHT PANEL – Login Form
         ════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Mobile branding strip */}
        <div className="lg:hidden bg-[#1E3A8A] px-6 py-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.06]" style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }} />
          <div className="relative z-10">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-3 border border-white/10">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-white mb-1" style={{ fontSize: "1.25rem", fontWeight: 700 }}>
              RIKMS System Administration
            </h1>
            <p className="text-white/50 text-xs">
              Secure administrative access for authorized personnel.
            </p>
          </div>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-6 py-10 lg:py-0">
          <div className="w-full max-w-[420px]">
            {/* Institutional logos */}
            <div className="flex items-center justify-center gap-6 mb-6">
              <img
                src={usepLogo}
                alt="USEP – University of Southeastern Philippines"
                title="USEP – University of Southeastern Philippines"
                className="h-12 w-12 sm:h-[48px] sm:w-[48px] object-contain"
              />
              <div className="w-px h-10 bg-[#E5E7EB]" />
              <img
                src={dostLogo}
                alt="DOST XI – Department of Science and Technology Region XI"
                title="DOST XI – Department of Science and Technology Region XI"
                className="h-12 w-12 sm:h-[48px] sm:w-[48px] object-contain"
              />
            </div>

            {/* Portal label */}
            <div className="text-center mb-8">
              <h2 className="text-[#1E3A8A] mb-1" style={{ fontSize: "1.35rem", fontWeight: 700 }}>
                System Administration Portal
              </h2>
              <p className="text-gray-400 text-sm">
                Sign in to access the governance dashboard.
              </p>
            </div>

            {/* General error */}
            {errors.general && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-[10px] px-4 py-3 mb-5">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-600" style={{ fontWeight: 500 }}>{errors.general}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label htmlFor="sa-email" className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 500 }}>
                  Admin Email
                </label>
                <input
                  id="sa-email"
                  type="email"
                  placeholder="admin@rikms.gov.ph"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
                  disabled={isLoading}
                  className={`w-full px-4 py-2.5 bg-[#F9FAFB] border rounded-[10px] text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]/40 transition-colors disabled:opacity-50 ${
                    errors.email ? "border-red-300 focus:ring-red-200 focus:border-red-400" : "border-gray-200"
                  }`}
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="sa-password" className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 500 }}>
                  Password
                </label>
                <div className="relative">
                  <input
                    id="sa-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
                    disabled={isLoading}
                    className={`w-full px-4 py-2.5 pr-11 bg-[#F9FAFB] border rounded-[10px] text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]/40 transition-colors disabled:opacity-50 ${
                      errors.password ? "border-red-300 focus:ring-red-200 focus:border-red-400" : "border-gray-200"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
              </div>

              {/* Two-Factor Authentication */}
              <div>
                <label htmlFor="sa-2fa" className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 500 }}>
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-gray-400" />
                    Authentication Code
                  </span>
                </label>
                <input
                  id="sa-2fa"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter code from your authenticator app"
                  value={authCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, "");
                    setAuthCode(val);
                    setErrors((p) => ({ ...p, authCode: undefined }));
                  }}
                  disabled={isLoading}
                  className={`w-full px-4 py-2.5 bg-[#F9FAFB] border rounded-[10px] text-sm text-gray-800 placeholder-gray-400 tracking-widest focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]/40 transition-colors disabled:opacity-50 ${
                    errors.authCode ? "border-red-300 focus:ring-red-200 focus:border-red-400" : "border-gray-200"
                  }`}
                />
                {errors.authCode ? (
                  <p className="text-xs text-red-500 mt-1">{errors.authCode}</p>
                ) : (
                  <p className="text-[11px] text-gray-400 mt-1">6-digit code from your authenticator app.</p>
                )}
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberDevice}
                    onChange={(e) => setRememberDevice(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-[#1E3A8A] focus:ring-[#1E3A8A]/20 accent-[#1E3A8A]"
                  />
                  <span className="text-sm text-gray-600">Remember this device</span>
                </label>
                <button type="button" className="text-sm text-[#1E3A8A] hover:underline" style={{ fontWeight: 500 }}>
                  Forgot Password?
                </button>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-[#1E3A8A] text-white rounded-[10px] hover:bg-[#1E3A8A]/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 shadow-sm"
                style={{ fontWeight: 600 }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Access System Portal
                  </>
                )}
              </button>
            </form>

            {/* Security warning */}
            <div className="mt-6 pt-5 border-t border-gray-100">
              <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-[10px] px-4 py-3">
                <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-amber-700" style={{ fontWeight: 500 }}>All login activities are monitored and logged.</p>
                  <p className="text-xs text-amber-600/70 mt-0.5">Unauthorized access is prohibited.</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-[11px] text-gray-400">
                Powered by <span style={{ fontWeight: 600 }} className="text-gray-500">University of Southeastern Philippines (USEP)</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

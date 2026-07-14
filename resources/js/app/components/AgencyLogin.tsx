import { useState } from "react";
import { AlertCircle, ArrowLeft, BookOpen, Building2, Eye, EyeOff, Loader2, Mail } from "lucide-react";
import { Link } from "react-router";
import { useBootstrap } from "../hooks/useBootstrap";
import { apiPost, firstValidationError } from "../lib/api";
import { agenciesVisibleOnLogin } from "../lib/login-agencies";

export function AgencyLogin() {
    const bootstrap = useBootstrap();
    const loginAgencies = agenciesVisibleOnLogin(bootstrap.data?.agencies);
    const [agencyId, setAgencyId] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [remember, setRemember] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [forgotOpen, setForgotOpen] = useState(false);
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotMessage, setForgotMessage] = useState("");

    async function login(event: React.FormEvent) {
        event.preventDefault();
        setLoading(true);
        setError("");
        try {
            const response = await apiPost<{ redirect: string }>("/login", {
                email,
                password,
                remember,
                agency_id: agencyId ? Number(agencyId) : null,
            });
            window.location.assign(response.redirect || "/agency/dashboard");
        } catch (caught) {
            setError(firstValidationError(caught));
            setLoading(false);
        }
    }

    async function forgotPassword(event: React.FormEvent) {
        event.preventDefault();
        setLoading(true);
        setError("");
        setForgotMessage("");
        try {
            const response = await apiPost<{ message: string }>("/forgot-password", { email: forgotEmail });
            setForgotMessage(response.message);
        } catch (caught) {
            setError(firstValidationError(caught));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
            <aside className="relative hidden overflow-hidden bg-[#1E3A8A] p-12 text-white lg:flex lg:items-center lg:justify-center">
                <div
                    className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
                        backgroundSize: "24px 24px",
                    }}
                />
                <div className="relative max-w-lg text-center">
                    <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15">
                        <BookOpen className="h-9 w-9" />
                    </span>
                    <h2 className="mt-8 text-3xl font-bold leading-tight">
                        Regionwide Integrated Knowledge Management System
                    </h2>
                    <p className="mt-5 leading-relaxed text-blue-100">
                        Securely manage your agency’s research records, review access requests, and submit
                        publications for human moderation.
                    </p>
                </div>
            </aside>
            <section
                className="flex items-center justify-center bg-gray-50 px-5 py-12"
                aria-label="Agency sign in"
            >
                <div className="w-full max-w-md">
                    {forgotOpen ? (
                        <>
                            <button
                                type="button"
                                onClick={() => {
                                    setForgotOpen(false);
                                    setError("");
                                }}
                                className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#1E3A8A]"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to sign in
                            </button>
                            <div className="text-center">
                                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50">
                                    <Mail className="h-7 w-7 text-[#1E3A8A]" />
                                </span>
                                <h1 className="mt-5 text-2xl font-bold text-[#1E3A8A]">
                                    Reset your password
                                </h1>
                                <p className="mt-2 text-sm text-gray-500">
                                    Enter your account email. For privacy, RIKMS always returns the same
                                    confirmation.
                                </p>
                            </div>
                            {error && <Alert message={error} />}
                            {forgotMessage ? (
                                <div
                                    aria-live="polite"
                                    className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700"
                                >
                                    {forgotMessage}
                                </div>
                            ) : (
                                <form onSubmit={forgotPassword} className="mt-7 space-y-5">
                                    <label>
                                        <span className="mb-1.5 block text-sm font-medium text-gray-700">
                                            Email address
                                        </span>
                                        <input
                                            required
                                            autoFocus
                                            type="email"
                                            autoComplete="email"
                                            value={forgotEmail}
                                            onChange={(event) => setForgotEmail(event.target.value)}
                                            className="w-full rounded-lg border border-gray-200 px-3 py-3 text-sm focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-blue-100"
                                        />
                                    </label>
                                    <button
                                        disabled={loading}
                                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1E3A8A] px-4 py-3 text-sm font-semibold text-white hover:bg-blue-900 disabled:opacity-60"
                                    >
                                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                                        {loading ? "Sending…" : "Send reset link"}
                                    </button>
                                </form>
                            )}
                        </>
                    ) : (
                        <>
                            <div className="text-center">
                                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-[#1E3A8A]">
                                    <Building2 className="h-7 w-7 text-white" />
                                </span>
                                <h1 className="mt-5 text-2xl font-bold text-[#1E3A8A]">Agency portal</h1>
                                <p className="mt-2 text-sm text-gray-500">
                                    Sign in with your assigned RIKMS account.
                                </p>
                            </div>
                            {error && <Alert message={error} />}
                            <form onSubmit={login} className="mt-7 space-y-5">
                                <label>
                                    <span className="mb-1.5 block text-sm font-medium text-gray-700">
                                        Agency <span className="font-normal text-gray-400">(optional)</span>
                                    </span>
                                    <select
                                        value={agencyId}
                                        onChange={(event) => setAgencyId(event.target.value)}
                                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    >
                                        <option value="">Use the agency assigned to my account</option>
                                        {loginAgencies.map((agency) => (
                                            <option key={agency.id} value={agency.id}>
                                                {agency.abbreviation} — {agency.name}
                                            </option>
                                        ))}
                                    </select>
                                    <span className="mt-1 block text-xs text-gray-500">
                                        If selected, it must match the agency assigned to your account.
                                    </span>
                                </label>
                                <label>
                                    <span className="mb-1.5 block text-sm font-medium text-gray-700">
                                        Email address
                                    </span>
                                    <input
                                        required
                                        type="email"
                                        autoComplete="email"
                                        value={email}
                                        onChange={(event) => setEmail(event.target.value)}
                                        className="w-full rounded-lg border border-gray-200 px-3 py-3 text-sm focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    />
                                </label>
                                <label>
                                    <span className="mb-1.5 block text-sm font-medium text-gray-700">
                                        Password
                                    </span>
                                    <span className="relative block">
                                        <input
                                            required
                                            type={showPassword ? "text" : "password"}
                                            autoComplete="current-password"
                                            value={password}
                                            onChange={(event) => setPassword(event.target.value)}
                                            className="w-full rounded-lg border border-gray-200 px-3 py-3 pr-11 text-sm focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-blue-100"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((show) => !show)}
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-gray-400 hover:bg-gray-100"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </span>
                                </label>
                                <div className="flex items-center justify-between">
                                    <label className="flex items-center gap-2 text-sm text-gray-600">
                                        <input
                                            type="checkbox"
                                            checked={remember}
                                            onChange={(event) => setRemember(event.target.checked)}
                                            className="h-4 w-4 rounded border-gray-300 text-[#1E3A8A]"
                                        />
                                        Keep me signed in
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setForgotOpen(true);
                                            setForgotEmail(email);
                                            setError("");
                                        }}
                                        className="text-sm font-medium text-[#1E3A8A] hover:underline"
                                    >
                                        Forgot password?
                                    </button>
                                </div>
                                <button
                                    disabled={loading}
                                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1E3A8A] px-4 py-3 text-sm font-semibold text-white hover:bg-blue-900 disabled:opacity-60"
                                >
                                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                                    {loading ? "Signing in…" : "Sign in"}
                                </button>
                            </form>
                            <p className="mt-6 text-center text-xs text-gray-500">
                                System administrators should use the{" "}
                                <Link
                                    to="/admin/login"
                                    className="font-medium text-[#1E3A8A] hover:underline"
                                >
                                    system administration portal
                                </Link>
                                .
                            </p>
                        </>
                    )}
                </div>
            </section>
        </div>
    );
}

function Alert({ message }: { message: string }) {
    return (
        <div
            role="alert"
            aria-live="assertive"
            className="mt-6 flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
            <AlertCircle className="h-5 w-5 shrink-0" />
            {message}
        </div>
    );
}

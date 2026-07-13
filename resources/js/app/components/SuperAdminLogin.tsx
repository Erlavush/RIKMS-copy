import { useState } from "react";
import type { FormEvent } from "react";
import { AlertCircle, BookOpen, Eye, EyeOff, Loader2, Lock, ShieldAlert } from "lucide-react";

import { postJson } from "../lib/http";
import { Modal } from "./super-admin/AdminUi";
import { inputClass, primaryButton, secondaryButton } from "./super-admin/admin-ui-utils";
import usepLogo from "figma:asset/6177429638abc45b39c8f0c3a10d798644b3df90.png";
import dostLogo from "figma:asset/cd31bfca4fc060b9b6e16de428e7aa16c331a6c6.png";

export function SuperAdminLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [remember, setRemember] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [recoveryOpen, setRecoveryOpen] = useState(false);
    const [recoveryEmail, setRecoveryEmail] = useState("");
    const [recoveryLoading, setRecoveryLoading] = useState(false);
    const [recoveryMessage, setRecoveryMessage] = useState<string | null>(null);
    const [recoveryError, setRecoveryError] = useState<string | null>(null);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!email.trim() || !password) {
            setError("Enter both your email address and password.");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await postJson<{ redirect?: string }>("/login", { email, password, remember });
            window.location.assign(response.redirect || "/admin/dashboard");
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : "Unable to sign in.");
            setLoading(false);
        }
    };

    const requestReset = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setRecoveryLoading(true);
        setRecoveryError(null);
        try {
            const response = await postJson<{ message?: string }>("/forgot-password", {
                email: recoveryEmail,
            });
            setRecoveryMessage(
                response.message ?? "If the account is eligible, password reset instructions have been sent.",
            );
        } catch (reason) {
            setRecoveryError(
                reason instanceof Error ? reason.message : "Unable to request a password reset.",
            );
        } finally {
            setRecoveryLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen bg-white" style={{ fontFamily: "'Inter', sans-serif" }}>
            <section
                className="relative hidden w-1/2 flex-col items-center justify-center overflow-hidden bg-[#1E3A8A] px-12 text-center lg:flex"
                aria-label="RIKMS administration"
            >
                <div
                    className="absolute inset-0 opacity-[0.06]"
                    style={{
                        backgroundImage:
                            "linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px),linear-gradient(90deg,rgba(255,255,255,.4) 1px,transparent 1px)",
                        backgroundSize: "48px 48px",
                    }}
                />
                <div className="relative z-10 max-w-lg">
                    <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
                        <BookOpen className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold leading-tight text-white">
                        RIKMS System Administration
                    </h1>
                    <p className="mt-4 leading-7 text-white/60">
                        Governance access for authorized administrators of the Regionwide Integrated Knowledge
                        Management System.
                    </p>
                    <div className="mx-auto mt-10 inline-flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.07] px-5 py-3.5 text-left">
                        <Lock className="h-5 w-5 text-amber-400" />
                        <div>
                            <p className="text-sm font-semibold text-white">Restricted access</p>
                            <p className="text-xs text-white/50">
                                Role authorization is enforced by the server.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="flex flex-1 flex-col">
                <div className="bg-[#1E3A8A] px-6 py-8 text-center lg:hidden">
                    <BookOpen className="mx-auto mb-3 h-10 w-10 text-white" />
                    <h1 className="text-xl font-bold text-white">RIKMS System Administration</h1>
                    <p className="mt-1 text-xs text-white/60">Authorized personnel only</p>
                </div>

                <div className="flex flex-1 items-center justify-center px-6 py-10">
                    <div className="w-full max-w-[420px]">
                        <div className="mb-7 flex items-center justify-center gap-6">
                            <img
                                src={usepLogo}
                                alt="University of Southeastern Philippines"
                                className="h-12 w-12 object-contain"
                            />
                            <div className="h-10 w-px bg-gray-200" />
                            <img
                                src={dostLogo}
                                alt="Department of Science and Technology Region XI"
                                className="h-12 w-12 object-contain"
                            />
                        </div>
                        <div className="mb-8 text-center">
                            <h2 className="text-2xl font-bold text-[#1E3A8A]">Administration Portal</h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Sign in with your assigned administrator account.
                            </p>
                        </div>

                        {error && (
                            <div
                                className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                                role="alert"
                            >
                                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /> {error}
                            </div>
                        )}

                        <form className="space-y-5" onSubmit={handleSubmit}>
                            <div>
                                <label
                                    htmlFor="admin-email"
                                    className="mb-1.5 block text-sm font-medium text-gray-700"
                                >
                                    Admin email
                                </label>
                                <input
                                    id="admin-email"
                                    type="email"
                                    autoComplete="username"
                                    required
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    disabled={loading}
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/10 disabled:opacity-60"
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="admin-password"
                                    className="mb-1.5 block text-sm font-medium text-gray-700"
                                >
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="admin-password"
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="current-password"
                                        required
                                        value={password}
                                        onChange={(event) => setPassword(event.target.value)}
                                        disabled={loading}
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 pr-11 text-sm outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/10 disabled:opacity-60"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((value) => !value)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-gray-700"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <label className="flex items-center gap-2 text-sm text-gray-600">
                                    <input
                                        type="checkbox"
                                        checked={remember}
                                        onChange={(event) => setRemember(event.target.checked)}
                                        className="h-4 w-4 accent-[#1E3A8A]"
                                    />{" "}
                                    Remember me
                                </label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setRecoveryEmail(email);
                                        setRecoveryMessage(null);
                                        setRecoveryError(null);
                                        setRecoveryOpen(true);
                                    }}
                                    className="text-sm font-medium text-[#1E3A8A] hover:underline"
                                >
                                    Forgot password?
                                </button>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#172e70] disabled:opacity-60"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
                                    </>
                                ) : (
                                    <>
                                        <Lock className="h-4 w-4" /> Access system portal
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                            <p>
                                If you cannot access your account, contact the designated RIKMS system
                                administrator. Never share your password.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <Modal
                open={recoveryOpen}
                title="Reset administrator password"
                description="Enter your administrator email. If it is eligible, RIKMS will send a time-limited reset link."
                onClose={() => setRecoveryOpen(false)}
                footer={
                    recoveryMessage ? (
                        <button
                            type="button"
                            className={primaryButton}
                            onClick={() => setRecoveryOpen(false)}
                        >
                            Done
                        </button>
                    ) : undefined
                }
            >
                {recoveryMessage ? (
                    <div
                        className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
                        role="status"
                    >
                        {recoveryMessage}
                    </div>
                ) : (
                    <form className="space-y-4" onSubmit={requestReset}>
                        {recoveryError && (
                            <p
                                className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                                role="alert"
                            >
                                {recoveryError}
                            </p>
                        )}
                        <div>
                            <label
                                htmlFor="recovery-email"
                                className="mb-1.5 block text-sm font-medium text-gray-700"
                            >
                                Admin email
                            </label>
                            <input
                                id="recovery-email"
                                type="email"
                                required
                                autoComplete="email"
                                value={recoveryEmail}
                                onChange={(event) => setRecoveryEmail(event.target.value)}
                                className={inputClass}
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                className={secondaryButton}
                                onClick={() => setRecoveryOpen(false)}
                            >
                                Cancel
                            </button>
                            <button type="submit" disabled={recoveryLoading} className={primaryButton}>
                                {recoveryLoading ? "Sending…" : "Send reset link"}
                            </button>
                        </div>
                    </form>
                )}
            </Modal>
        </main>
    );
}

import { useState } from "react";
import { AlertCircle, Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react";
import { apiPost, firstValidationError } from "../lib/api";

export function ChangePassword() {
    const [currentPassword, setCurrentPassword] = useState("");
    const [password, setPassword] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [showPasswords, setShowPasswords] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function submit(event: React.FormEvent) {
        event.preventDefault();
        setLoading(true);
        setError("");
        if (password !== confirmation) {
            setError("The new password and confirmation do not match.");
            setLoading(false);
            return;
        }
        try {
            const response = await apiPost<{ message: string; redirect?: string }>(
                "/api/rikms/change-password",
                {
                    currentPassword,
                    password,
                    passwordConfirmation: confirmation,
                },
            );
            window.location.assign(response.redirect || "/login");
        } catch (caught) {
            setError(firstValidationError(caught));
            setLoading(false);
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-gray-50 px-5 py-12">
            <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50">
                    <LockKeyhole className="h-7 w-7 text-[#1E3A8A]" />
                </span>
                <div className="text-center">
                    <h1 className="mt-5 text-2xl font-bold text-[#1E3A8A]">Secure your account</h1>
                    <p className="mt-2 text-sm text-gray-500">
                        You must replace the temporary password before accessing RIKMS. Use at least 12
                        characters and do not reuse another account’s password.
                    </p>
                </div>
                {error && (
                    <div
                        role="alert"
                        aria-live="assertive"
                        className="mt-5 flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                    >
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        {error}
                    </div>
                )}
                <form onSubmit={submit} className="mt-6 space-y-4">
                    <label>
                        <span className="mb-1.5 block text-sm font-medium">
                            Current or temporary password
                        </span>
                        <input
                            required
                            autoFocus
                            type={showPasswords ? "text" : "password"}
                            autoComplete="current-password"
                            value={currentPassword}
                            onChange={(event) => setCurrentPassword(event.target.value)}
                            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                    </label>
                    <label>
                        <span className="mb-1.5 block text-sm font-medium">New password</span>
                        <span className="relative block">
                            <input
                                required
                                minLength={12}
                                type={showPasswords ? "text" : "password"}
                                autoComplete="new-password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 pr-11 text-sm focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-blue-100"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPasswords((show) => !show)}
                                aria-label={showPasswords ? "Hide passwords" : "Show passwords"}
                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-2 text-gray-400 hover:bg-gray-100"
                            >
                                {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </span>
                    </label>
                    <label>
                        <span className="mb-1.5 block text-sm font-medium">Confirm new password</span>
                        <input
                            required
                            minLength={12}
                            type={showPasswords ? "text" : "password"}
                            autoComplete="new-password"
                            value={confirmation}
                            onChange={(event) => setConfirmation(event.target.value)}
                            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                    </label>
                    <button
                        disabled={loading}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1E3A8A] px-4 py-3 text-sm font-semibold text-white hover:bg-blue-900 disabled:opacity-60"
                    >
                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                        {loading ? "Updating…" : "Set new password"}
                    </button>
                </form>
            </div>
        </main>
    );
}

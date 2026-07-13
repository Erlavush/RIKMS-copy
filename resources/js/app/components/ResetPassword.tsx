import { useState } from "react";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router";
import { apiPost, firstValidationError } from "../lib/api";

export function ResetPassword() {
    const { token } = useParams();
    const [params] = useSearchParams();
    const [email, setEmail] = useState(params.get("email") ?? "");
    const [password, setPassword] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [complete, setComplete] = useState(false);

    async function reset(event: React.FormEvent) {
        event.preventDefault();
        setLoading(true);
        setError("");
        try {
            await apiPost("/reset-password", { token, email, password, password_confirmation: confirmation });
            setComplete(true);
        } catch (caught) {
            setError(firstValidationError(caught));
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-gray-50 px-5 py-12">
            <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50">
                    <LockKeyhole className="h-7 w-7 text-[#1E3A8A]" />
                </span>
                {complete ? (
                    <div className="text-center">
                        <CheckCircle2 className="mx-auto mt-6 h-8 w-8 text-green-600" />
                        <h1 className="mt-3 text-2xl font-bold text-[#1E3A8A]">Password reset</h1>
                        <p className="mt-2 text-sm text-gray-500">
                            Your password was updated. You can now sign in with the new password.
                        </p>
                        <Link
                            to="/login"
                            className="mt-6 inline-flex rounded-lg bg-[#1E3A8A] px-5 py-2.5 text-sm font-semibold text-white"
                        >
                            Go to sign in
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="text-center">
                            <h1 className="mt-5 text-2xl font-bold text-[#1E3A8A]">Choose a new password</h1>
                            <p className="mt-2 text-sm text-gray-500">
                                Use at least 12 characters and keep it unique to RIKMS.
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
                        <form onSubmit={reset} className="mt-6 space-y-4">
                            <label>
                                <span className="mb-1.5 block text-sm font-medium">Email address</span>
                                <input
                                    required
                                    type="email"
                                    autoComplete="email"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm"
                                />
                            </label>
                            <label>
                                <span className="mb-1.5 block text-sm font-medium">New password</span>
                                <span className="relative block">
                                    <input
                                        required
                                        minLength={12}
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="new-password"
                                        value={password}
                                        onChange={(event) => setPassword(event.target.value)}
                                        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 pr-11 text-sm"
                                    />
                                    <button
                                        type="button"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                        onClick={() => setShowPassword((show) => !show)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-2 text-gray-400"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </span>
                            </label>
                            <label>
                                <span className="mb-1.5 block text-sm font-medium">Confirm password</span>
                                <input
                                    required
                                    minLength={12}
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                    value={confirmation}
                                    onChange={(event) => setConfirmation(event.target.value)}
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm"
                                />
                            </label>
                            <button
                                disabled={loading}
                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1E3A8A] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                            >
                                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                                {loading ? "Resetting…" : "Reset password"}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </main>
    );
}

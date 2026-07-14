import { useState } from "react";
import { AlertCircle, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { apiPost, firstValidationError } from "../lib/api";

export function TwoFactorChallenge() {
    const [code, setCode] = useState("");
    const [recoveryMode, setRecoveryMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function submit(event: React.FormEvent) {
        event.preventDefault();
        setLoading(true);
        setError("");
        try {
            const response = await apiPost<{ redirect: string }>(
                "/two-factor-challenge",
                recoveryMode ? { recovery_code: code.trim() } : { code: code.replace(/\s/g, "") },
            );
            window.location.assign(response.redirect);
        } catch (caught) {
            setError(firstValidationError(caught));
            setLoading(false);
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12">
            <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
                    <ShieldCheck className="h-7 w-7 text-[#1E3A8A]" />
                </span>
                <div className="text-center">
                    <h1 className="mt-5 text-2xl font-bold text-[#1E3A8A]">Two-factor verification</h1>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                        {recoveryMode
                            ? "Enter one unused recovery code. It will be replaced after this sign-in."
                            : "Enter the six-digit code from your authenticator. This challenge expires in five minutes."}
                    </p>
                </div>

                {error && (
                    <div
                        className="mt-5 flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                        role="alert"
                    >
                        <AlertCircle className="h-5 w-5 shrink-0" /> {error}
                    </div>
                )}

                <form className="mt-6 space-y-4" onSubmit={submit}>
                    <label>
                        <span className="mb-1.5 block text-sm font-medium text-slate-700">
                            {recoveryMode ? "Recovery code" : "Authenticator code"}
                        </span>
                        <input
                            autoFocus
                            required
                            inputMode={recoveryMode ? "text" : "numeric"}
                            autoComplete="one-time-code"
                            maxLength={recoveryMode ? 32 : 6}
                            pattern={recoveryMode ? undefined : "[0-9]{6}"}
                            value={code}
                            onChange={(event) => setCode(event.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-center font-mono text-lg tracking-[0.25em] outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100"
                        />
                    </label>
                    <button
                        disabled={loading}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-4 py-3 text-sm font-semibold text-white hover:bg-blue-900 disabled:opacity-60"
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <KeyRound className="h-4 w-4" />
                        )}
                        {loading ? "Verifying…" : "Verify and continue"}
                    </button>
                </form>

                <button
                    type="button"
                    onClick={() => {
                        setRecoveryMode((value) => !value);
                        setCode("");
                        setError("");
                    }}
                    className="mt-4 w-full text-center text-sm font-medium text-[#1E3A8A] hover:underline"
                >
                    {recoveryMode ? "Use an authenticator code" : "Use a recovery code"}
                </button>
            </section>
        </main>
    );
}

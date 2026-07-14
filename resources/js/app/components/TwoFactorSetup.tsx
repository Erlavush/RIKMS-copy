import { useEffect, useState } from "react";
import { AlertCircle, Check, Clipboard, KeyRound, Loader2, RotateCw, ShieldCheck } from "lucide-react";
import { apiGet, apiPost, firstValidationError } from "../lib/api";

interface TwoFactorStatus {
    data: { required: boolean; enabled: boolean; pending: boolean };
}

interface SetupData {
    data: { qrCodeSvg: string; secretKey: string };
}

export function TwoFactorSetup() {
    const [status, setStatus] = useState<TwoFactorStatus["data"] | null>(null);
    const [currentPassword, setCurrentPassword] = useState("");
    const [setup, setSetup] = useState<SetupData["data"] | null>(null);
    const [code, setCode] = useState("");
    const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        apiGet<TwoFactorStatus>("/api/rikms/two-factor")
            .then((response) => setStatus(response.data))
            .catch((caught) => setError(firstValidationError(caught)));
    }, []);

    async function start(event: React.FormEvent) {
        event.preventDefault();
        setLoading(true);
        setError("");
        try {
            const response = await apiPost<SetupData>("/api/rikms/two-factor/setup", { currentPassword });
            setSetup(response.data);
            setCurrentPassword("");
            setStatus((value) => (value ? { ...value, enabled: false, pending: true } : value));
        } catch (caught) {
            setError(firstValidationError(caught));
        } finally {
            setLoading(false);
        }
    }

    async function confirm(event: React.FormEvent) {
        event.preventDefault();
        setLoading(true);
        setError("");
        try {
            const response = await apiPost<{ recoveryCodes: string[] }>("/api/rikms/two-factor/confirm", {
                code: code.replace(/\s/g, ""),
            });
            setRecoveryCodes(response.recoveryCodes);
            setSetup(null);
            setStatus((value) => (value ? { ...value, enabled: true, pending: false } : value));
        } catch (caught) {
            setError(firstValidationError(caught));
        } finally {
            setLoading(false);
        }
    }

    async function copyCodes() {
        await navigator.clipboard.writeText(recoveryCodes.join("\n"));
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
    }

    if (!status && !error) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-slate-50">
                <Loader2 className="h-7 w-7 animate-spin text-[#1E3A8A]" />
            </main>
        );
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12">
            <section className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
                <div className="flex items-start gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                        <ShieldCheck className="h-6 w-6 text-[#1E3A8A]" />
                    </span>
                    <div>
                        <h1 className="text-2xl font-bold text-[#1E3A8A]">
                            Administrator two-factor security
                        </h1>
                        <p className="mt-1 text-sm leading-6 text-slate-500">
                            A verified TOTP authenticator is mandatory for every RIKMS super administrator.
                        </p>
                    </div>
                </div>

                {error && (
                    <div
                        className="mt-6 flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                        role="alert"
                    >
                        <AlertCircle className="h-5 w-5 shrink-0" /> {error}
                    </div>
                )}

                {recoveryCodes.length > 0 ? (
                    <div className="mt-7">
                        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                            Two-factor authentication is active. Store these one-use recovery codes offline
                            now; they will not be shown again.
                        </div>
                        <div className="mt-4 grid grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-sm sm:grid-cols-2">
                            {recoveryCodes.map((recoveryCode) => (
                                <span key={recoveryCode}>{recoveryCode}</span>
                            ))}
                        </div>
                        <div className="mt-5 flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={copyCodes}
                                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            >
                                {copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                                {copied ? "Copied" : "Copy recovery codes"}
                            </button>
                            <button
                                type="button"
                                onClick={() => window.location.assign("/admin/dashboard")}
                                className="rounded-lg bg-[#1E3A8A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-900"
                            >
                                Continue to administration
                            </button>
                        </div>
                    </div>
                ) : setup ? (
                    <form className="mt-7" onSubmit={confirm}>
                        <div className="grid gap-6 md:grid-cols-[210px_1fr]">
                            <div
                                className="rounded-xl border border-slate-200 bg-white p-2"
                                dangerouslySetInnerHTML={{ __html: setup.qrCodeSvg }}
                            />
                            <div>
                                <h2 className="font-semibold text-slate-900">Scan, then verify</h2>
                                <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-600">
                                    <li>Scan the QR code with a TOTP-compatible authenticator.</li>
                                    <li>
                                        If scanning is unavailable, enter this key:{" "}
                                        <code className="break-all rounded bg-slate-100 px-1.5 py-1 text-xs text-slate-800">
                                            {setup.secretKey}
                                        </code>
                                    </li>
                                    <li>Enter the current six-digit code below.</li>
                                </ol>
                                <input
                                    autoFocus
                                    required
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    pattern="[0-9]{6}"
                                    maxLength={6}
                                    value={code}
                                    onChange={(event) => setCode(event.target.value)}
                                    className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-3 text-center font-mono text-lg tracking-[0.25em] outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100"
                                />
                                <button
                                    disabled={loading}
                                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-4 py-3 text-sm font-semibold text-white hover:bg-blue-900 disabled:opacity-60"
                                >
                                    {loading && <Loader2 className="h-4 w-4 animate-spin" />} Confirm
                                    authenticator
                                </button>
                            </div>
                        </div>
                    </form>
                ) : (
                    <div className="mt-7">
                        {status?.enabled && (
                            <div className="mb-5 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                                <Check className="h-5 w-5" /> Two-factor authentication is active. Starting
                                again rotates the authenticator and recovery codes.
                            </div>
                        )}
                        <form onSubmit={start} className="space-y-4">
                            <label>
                                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Current password
                                </span>
                                <input
                                    required
                                    type="password"
                                    autoComplete="current-password"
                                    value={currentPassword}
                                    onChange={(event) => setCurrentPassword(event.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100"
                                />
                            </label>
                            <button
                                disabled={loading}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-4 py-3 text-sm font-semibold text-white hover:bg-blue-900 disabled:opacity-60"
                            >
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : status?.enabled ? (
                                    <RotateCw className="h-4 w-4" />
                                ) : (
                                    <KeyRound className="h-4 w-4" />
                                )}
                                {loading
                                    ? "Preparing…"
                                    : status?.enabled
                                      ? "Rotate authenticator"
                                      : "Configure authenticator"}
                            </button>
                        </form>
                    </div>
                )}
            </section>
        </main>
    );
}

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
    ArrowLeft,
    CalendarClock,
    ExternalLink,
    Globe2,
    KeyRound,
    LockKeyhole,
    Save,
    ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { useApi } from "../../hooks/useApi";
import { apiPatch, firstValidationError, type ResearchDocument } from "../../lib/api";
import { ErrorState, LoadingState } from "../shared/AsyncState";
import { StatusBadge } from "../shared/StatusBadge";

type DetailResponse = { data: ResearchDocument };

const ACCESS_MODES = [
    {
        value: "public_download",
        label: "Public download",
        description: "Anyone can download the published file.",
        icon: Globe2,
        color: "text-blue-700 bg-blue-50",
    },
    {
        value: "request_access",
        label: "Request access",
        description: "Visitors submit a request that an agency administrator must approve.",
        icon: KeyRound,
        color: "text-purple-700 bg-purple-50",
    },
    {
        value: "restricted_admin",
        label: "Agency administrators only",
        description: "The file is never available to public visitors.",
        icon: LockKeyhole,
        color: "text-red-700 bg-red-50",
    },
    {
        value: "embargo_until_date",
        label: "Embargo until a date",
        description: "The file becomes public only after the embargo expires.",
        icon: CalendarClock,
        color: "text-amber-700 bg-amber-50",
    },
    {
        value: "external_link_only",
        label: "External link",
        description: "Visitors are sent to an approved external source instead of local storage.",
        icon: ExternalLink,
        color: "text-cyan-700 bg-cyan-50",
    },
] as const;

export function AccessControlManagement() {
    const { id } = useParams();
    const navigate = useNavigate();
    const detail = useApi<DetailResponse>(id ? `/api/rikms/agency/documents/${id}` : null);
    const [mode, setMode] = useState("public_download");
    const [embargoUntil, setEmbargoUntil] = useState("");
    const [externalUrl, setExternalUrl] = useState("");
    const [ownerName, setOwnerName] = useState("");
    const [ownerEmail, setOwnerEmail] = useState("");
    const [notify, setNotify] = useState(true);
    const [saving, setSaving] = useState(false);
    const [initializedId, setInitializedId] = useState<number | null>(null);

    useEffect(() => {
        const document = detail.data?.data;
        if (!document || initializedId === document.id) return;
        setMode(document.accessMode || "public_download");
        setEmbargoUntil(document.embargoUntil?.slice(0, 10) ?? "");
        setExternalUrl(document.externalUrl ?? "");
        setOwnerName(document.ownerName ?? "");
        setOwnerEmail(document.ownerEmail ?? "");
        setNotify(document.notifyAccessRequests ?? true);
        setInitializedId(document.id);
    }, [detail.data, initializedId]);

    async function save(event: React.FormEvent) {
        event.preventDefault();
        if (!id) return;
        const status = detail.data?.data.status;
        if (status === "pending" || status === "archived") return;
        if (
            status === "published" &&
            !window.confirm(
                "Saving a new access policy will withdraw this publication into a revision draft. Continue?",
            )
        )
            return;
        setSaving(true);
        try {
            await apiPatch(`/api/rikms/agency/documents/${id}`, {
                access_mode: mode,
                embargo_until: mode === "embargo_until_date" ? embargoUntil : null,
                external_url: mode === "external_link_only" ? externalUrl : null,
                owner_name: ownerName || null,
                owner_email: ownerEmail || null,
                notify_access_requests: notify,
            });
            toast.success("Access policy saved. A version snapshot was created.");
            await detail.refresh();
        } catch (error) {
            toast.error(firstValidationError(error));
        } finally {
            setSaving(false);
        }
    }

    if (detail.loading) return <LoadingState label="Loading access policy…" />;
    if (detail.error || !detail.data)
        return (
            <ErrorState
                message={detail.error ?? "Research record not found."}
                onRetry={() => void detail.refresh()}
            />
        );
    const document = detail.data.data;
    const canEdit = document.status !== "pending" && document.status !== "archived";

    return (
        <form onSubmit={save} className="space-y-6">
            <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#1E3A8A]"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </button>
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl font-bold text-[#1E3A8A]">Access control</h1>
                        <StatusBadge status={document.status} />
                    </div>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        Control how visitors access “{document.title}”. Changes are versioned and never bypass
                        publication review.
                    </p>
                </div>
                <button
                    type="submit"
                    disabled={saving || !canEdit}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1E3A8A] px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-900 disabled:opacity-50"
                >
                    <Save className="h-4 w-4" />
                    {saving ? "Saving…" : "Save access policy"}
                </button>
            </header>

            <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <ShieldAlert className="h-5 w-5 shrink-0" />
                <p>
                    Access controls apply only to approved, published records. Drafts and pending records
                    remain private regardless of this setting.
                </p>
            </div>

            {document.status === "published" && (
                <div className="flex gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                    <ShieldAlert className="h-5 w-5 shrink-0" />
                    <p>
                        Changing a published access policy creates a draft revision and temporarily removes
                        the record from public browsing until review is complete.
                    </p>
                </div>
            )}
            {!canEdit && (
                <div className="flex gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                    <LockKeyhole className="h-5 w-5 shrink-0" />
                    <p>
                        {document.status === "pending"
                            ? "This policy is read-only while the record is pending review."
                            : "Restore this archived record before changing its access policy."}
                    </p>
                </div>
            )}

            <fieldset disabled={!canEdit || saving} className="space-y-6 disabled:opacity-70">
                <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <h2 className="font-semibold text-[#1E3A8A]">Document access mode</h2>
                    <p className="mb-5 mt-1 text-xs text-gray-500">
                        Choose one policy. Approved access requests are logged and tied to an expiring grant.
                    </p>
                    <div className="grid gap-3 lg:grid-cols-2">
                        {ACCESS_MODES.map(({ value, label, description, icon: Icon, color }) => (
                            <label
                                key={value}
                                className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors ${mode === value ? "border-[#1E3A8A] ring-2 ring-blue-100" : "border-gray-200 hover:bg-gray-50"}`}
                            >
                                <input
                                    type="radio"
                                    name="accessMode"
                                    value={value}
                                    checked={mode === value}
                                    onChange={(event) => setMode(event.target.value)}
                                    className="mt-1 h-4 w-4 border-gray-300 text-[#1E3A8A]"
                                />
                                <span
                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${color}`}
                                >
                                    <Icon className="h-4 w-4" />
                                </span>
                                <span>
                                    <span className="block text-sm font-semibold text-gray-800">{label}</span>
                                    <span className="mt-1 block text-xs leading-relaxed text-gray-500">
                                        {description}
                                    </span>
                                </span>
                            </label>
                        ))}
                    </div>

                    {mode === "embargo_until_date" && (
                        <label className="mt-5 block max-w-sm">
                            <span className="mb-1.5 block text-sm font-medium text-gray-700">
                                Embargo end date
                            </span>
                            <input
                                required
                                type="date"
                                min={new Date().toISOString().slice(0, 10)}
                                value={embargoUntil}
                                onChange={(event) => setEmbargoUntil(event.target.value)}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-blue-100"
                            />
                        </label>
                    )}
                    {mode === "external_link_only" && (
                        <label className="mt-5 block">
                            <span className="mb-1.5 block text-sm font-medium text-gray-700">
                                External document URL
                            </span>
                            <input
                                required
                                type="url"
                                value={externalUrl}
                                onChange={(event) => setExternalUrl(event.target.value)}
                                placeholder="https://repository.example/document"
                                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-blue-100"
                            />
                        </label>
                    )}
                </section>

                <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <h2 className="font-semibold text-[#1E3A8A]">Responsible contact</h2>
                    <p className="mb-5 mt-1 text-xs text-gray-500">
                        Shown internally to administrators processing requests.
                    </p>
                    <div className="grid gap-5 sm:grid-cols-2">
                        <label>
                            <span className="mb-1.5 block text-sm font-medium text-gray-700">
                                Contact name
                            </span>
                            <input
                                value={ownerName}
                                onChange={(event) => setOwnerName(event.target.value)}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-blue-100"
                            />
                        </label>
                        <label>
                            <span className="mb-1.5 block text-sm font-medium text-gray-700">
                                Contact email
                            </span>
                            <input
                                type="email"
                                value={ownerEmail}
                                onChange={(event) => setOwnerEmail(event.target.value)}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-blue-100"
                            />
                        </label>
                    </div>
                    <label className="mt-5 flex items-start gap-3 rounded-lg bg-gray-50 p-3 text-sm">
                        <input
                            type="checkbox"
                            checked={notify}
                            onChange={(event) => setNotify(event.target.checked)}
                            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#1E3A8A]"
                        />
                        <span>
                            <span className="block font-medium text-gray-800">
                                Notify administrators about new requests
                            </span>
                            <span className="mt-0.5 block text-xs text-gray-500">
                                Notifications appear in RIKMS and follow the agency’s email preference.
                            </span>
                        </span>
                    </label>
                </section>
            </fieldset>

            <footer className="flex justify-between">
                <Link
                    to={`/agency/research/${document.id}/edit`}
                    className="text-sm font-medium text-[#1E3A8A] hover:underline"
                >
                    Edit metadata
                </Link>
                <button
                    type="submit"
                    disabled={saving || !canEdit}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#1E3A8A] px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-900 disabled:opacity-50"
                >
                    <Save className="h-4 w-4" />
                    {saving ? "Saving…" : "Save policy"}
                </button>
            </footer>
        </form>
    );
}

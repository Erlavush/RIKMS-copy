import { useEffect, useState } from "react";
import { Bell, Globe2, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useApi } from "../../hooks/useApi";
import { apiPatch, firstValidationError, type AgencySettingsData } from "../../lib/api";
import { ErrorState, LoadingState } from "../shared/AsyncState";

type Settings = AgencySettingsData["data"];

export function AgencySettings() {
    const settings = useApi<AgencySettingsData>("/api/rikms/agency/settings");
    const [form, setForm] = useState<Settings | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (settings.data && !form) setForm(settings.data.data);
    }, [settings.data, form]);

    function update<K extends keyof Settings>(key: K, value: Settings[K]) {
        setForm((current) => (current ? { ...current, [key]: value } : current));
    }

    async function save(event: React.FormEvent) {
        event.preventDefault();
        if (!form) return;
        setSaving(true);
        try {
            const response = await apiPatch<AgencySettingsData>("/api/rikms/agency/settings", form);
            setForm(response.data);
            toast.success("Agency settings saved.");
        } catch (error) {
            toast.error(firstValidationError(error));
        } finally {
            setSaving(false);
        }
    }

    if (settings.loading || !form) return <LoadingState label="Loading settings…" />;
    if (settings.error)
        return <ErrorState message={settings.error} onRetry={() => void settings.refresh()} />;

    return (
        <form onSubmit={save} className="space-y-6">
            <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                    <h1 className="text-2xl font-bold text-[#1E3A8A]">Agency Settings</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Configure persisted notification and repository defaults.
                    </p>
                </div>
                <button
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1E3A8A] px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-900 disabled:opacity-50"
                >
                    <Save className="h-4 w-4" />
                    {saving ? "Saving…" : "Save settings"}
                </button>
            </header>
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-[#1E3A8A]">
                        <Bell className="h-5 w-5" />
                    </span>
                    <div>
                        <h2 className="font-semibold text-gray-900">Notifications</h2>
                        <p className="text-xs text-gray-500">
                            Choose which operational events should alert agency administrators.
                        </p>
                    </div>
                </div>
                <fieldset disabled={saving} className="space-y-3">
                    <Toggle
                        checked={form.notifyAccessRequests}
                        onChange={(value) => update("notifyAccessRequests", value)}
                        label="New access requests"
                        description="Notify administrators when visitors request a protected file."
                    />
                    <Toggle
                        checked={form.notifyReviewUpdates}
                        onChange={(value) => update("notifyReviewUpdates", value)}
                        label="Review and moderation updates"
                        description="Notify administrators when a submitted record is approved, published, rejected, or returned."
                    />
                    <Toggle
                        checked={form.notifyWeeklySummary}
                        onChange={(value) => update("notifyWeeklySummary", value)}
                        label="Weekly summary"
                        description="Receive a weekly digest when the configured mail delivery system is available."
                    />
                </fieldset>
            </section>
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-700">
                        <Globe2 className="h-5 w-5" />
                    </span>
                    <div>
                        <h2 className="font-semibold text-gray-900">Repository defaults</h2>
                        <p className="text-xs text-gray-500">
                            Defaults can still be changed for each individual record.
                        </p>
                    </div>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                    <label>
                        <span className="mb-1.5 block text-sm font-medium text-gray-700">
                            Default access mode
                        </span>
                        <select
                            value={form.defaultAccessMode}
                            onChange={(event) => update("defaultAccessMode", event.target.value)}
                            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-blue-100"
                        >
                            <option value="public_download">Public download</option>
                            <option value="request_access">Request access</option>
                            <option value="restricted_admin">Agency administrators only</option>
                            <option value="embargo_until_date">Embargo until a date</option>
                            <option value="external_link_only">External link</option>
                        </select>
                    </label>
                    <label>
                        <span className="mb-1.5 block text-sm font-medium text-gray-700">
                            Display timezone
                        </span>
                        <select
                            value={form.timezone}
                            onChange={(event) => update("timezone", event.target.value)}
                            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-blue-100"
                        >
                            <option value="Asia/Manila">Asia/Manila (PHT)</option>
                            <option value="UTC">UTC</option>
                        </select>
                    </label>
                </div>
            </section>
            <aside className="flex gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                <ShieldCheck className="h-5 w-5 shrink-0 text-green-600" />
                <p>
                    Security-sensitive controls such as roles, account status, and moderation authority are
                    managed by authorized system administrators and cannot be changed here.
                </p>
            </aside>
        </form>
    );
}

function Toggle({
    checked,
    onChange,
    label,
    description,
}: {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
    description: string;
}) {
    return (
        <label className="flex cursor-pointer items-start justify-between gap-4 rounded-lg border border-gray-100 p-4">
            <span>
                <span className="block text-sm font-medium text-gray-800">{label}</span>
                <span className="mt-1 block text-xs text-gray-500">{description}</span>
            </span>
            <input
                type="checkbox"
                role="switch"
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
                className="mt-1 h-5 w-9 rounded-full border-gray-300 text-[#1E3A8A]"
            />
        </label>
    );
}

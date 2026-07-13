import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { CalendarClock, Globe2, Mail, Megaphone, Save, Settings } from "lucide-react";

import { adminApi, errorMessage } from "../../lib/admin-api";
import type { DataResponse } from "../../lib/admin-api";
import { EmptyState, ErrorState, LoadingState, PageHeader, Panel, Toast } from "./AdminUi";
import { inputClass, primaryButton } from "./admin-ui-utils";
import { useAdminResource } from "./useAdminResource";

interface PlatformSettingsData {
    siteName: string;
    supportEmail: string | null;
    allowPublicBrowse: boolean;
    accessGrantDays: number;
    announcement: string | null;
}

export function PlatformSettings() {
    const {
        data: response,
        loading,
        error,
        reload,
    } = useAdminResource<DataResponse<PlatformSettingsData>>("/settings");
    const [values, setValues] = useState<PlatformSettingsData | null>(null);
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);
    const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);

    useEffect(() => {
        if (response?.data) setValues((current) => current ?? response.data);
    }, [response]);

    const update = <Key extends keyof PlatformSettingsData>(key: Key, value: PlatformSettingsData[Key]) => {
        setValues((current) => (current ? { ...current, [key]: value } : current));
        setDirty(true);
    };

    const save = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!values) return;
        setSaving(true);
        try {
            const updated = await adminApi.patch<DataResponse<PlatformSettingsData>>("/settings", {
                site_name: values.siteName,
                support_email: values.supportEmail || null,
                allow_public_browse: values.allowPublicBrowse,
                access_grant_days: values.accessGrantDays,
                announcement: values.announcement || null,
            });
            setValues(updated.data);
            setDirty(false);
            setToast({ message: "Platform settings saved and applied.", tone: "success" });
        } catch (reason) {
            setToast({ message: errorMessage(reason), tone: "error" });
        } finally {
            setSaving(false);
        }
    };

    if (loading && !values) return <LoadingState label="Loading platform settings…" />;
    if (error && !values) return <ErrorState message={error} onRetry={reload} />;
    if (!values)
        return (
            <EmptyState
                title="Settings unavailable"
                description="The platform returned no configurable settings."
            />
        );

    return (
        <form className="mx-auto max-w-[1100px] space-y-6" onSubmit={save}>
            {toast && <Toast {...toast} onClose={() => setToast(null)} />}
            <PageHeader
                title="Platform Settings"
                description="Configure the supported settings that directly affect public access and access grants."
                action={
                    <button type="submit" className={primaryButton} disabled={saving || !dirty}>
                        <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save changes"}
                    </button>
                }
            />
            {error && <ErrorState message={`Displayed settings may be stale: ${error}`} onRetry={reload} />}

            <Panel>
                <div className="flex items-center gap-2.5 border-b border-gray-100 px-6 py-4">
                    <Settings className="h-5 w-5 text-[#1E3A8A]" />
                    <h2 className="text-sm font-bold text-slate-900">Platform identity and support</h2>
                </div>
                <div className="grid gap-5 p-6 sm:grid-cols-2">
                    <div>
                        <label
                            htmlFor="setting-site-name"
                            className="mb-1.5 block text-sm font-medium text-gray-700"
                        >
                            Site name
                        </label>
                        <div className="relative">
                            <Globe2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                id="setting-site-name"
                                required
                                maxLength={120}
                                value={values.siteName}
                                onChange={(event) => update("siteName", event.target.value)}
                                className={`${inputClass} pl-10`}
                            />
                        </div>
                        <p className="mt-1 text-xs text-gray-400">Displayed as the public catalogue name.</p>
                    </div>
                    <div>
                        <label
                            htmlFor="setting-support-email"
                            className="mb-1.5 block text-sm font-medium text-gray-700"
                        >
                            Support email
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                id="setting-support-email"
                                type="email"
                                value={values.supportEmail ?? ""}
                                onChange={(event) => update("supportEmail", event.target.value || null)}
                                className={`${inputClass} pl-10`}
                                placeholder="support@example.gov.ph"
                            />
                        </div>
                        <p className="mt-1 text-xs text-gray-400">
                            Shown when users need platform assistance.
                        </p>
                    </div>
                </div>
            </Panel>

            <Panel>
                <div className="flex items-center gap-2.5 border-b border-gray-100 px-6 py-4">
                    <Globe2 className="h-5 w-5 text-green-700" />
                    <h2 className="text-sm font-bold text-slate-900">Public catalogue</h2>
                </div>
                <div className="space-y-5 p-6">
                    <div className="flex items-start justify-between gap-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <div>
                            <label
                                htmlFor="setting-public-browse"
                                className="text-sm font-semibold text-slate-800"
                            >
                                Allow public browsing
                            </label>
                            <p className="mt-1 max-w-2xl text-xs leading-5 text-gray-500">
                                When disabled, the public catalogue is unavailable. Published records remain
                                stored and available to authorized administrators.
                            </p>
                        </div>
                        <button
                            id="setting-public-browse"
                            type="button"
                            role="switch"
                            aria-checked={values.allowPublicBrowse}
                            onClick={() => update("allowPublicBrowse", !values.allowPublicBrowse)}
                            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${values.allowPublicBrowse ? "bg-[#1E3A8A]" : "bg-gray-300"}`}
                        >
                            <span
                                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${values.allowPublicBrowse ? "translate-x-[22px]" : "translate-x-0.5"}`}
                            />
                        </button>
                    </div>
                    <div>
                        <label
                            htmlFor="setting-announcement"
                            className="mb-1.5 block text-sm font-medium text-gray-700"
                        >
                            Public announcement
                        </label>
                        <div className="relative">
                            <Megaphone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <textarea
                                id="setting-announcement"
                                rows={4}
                                maxLength={1000}
                                value={values.announcement ?? ""}
                                onChange={(event) => update("announcement", event.target.value || null)}
                                className={`${inputClass} pl-10`}
                                placeholder="Optional message displayed on the public catalogue…"
                            />
                        </div>
                        <p className="mt-1 text-right text-xs text-gray-400">
                            {(values.announcement ?? "").length}/1000
                        </p>
                    </div>
                </div>
            </Panel>

            <Panel>
                <div className="flex items-center gap-2.5 border-b border-gray-100 px-6 py-4">
                    <CalendarClock className="h-5 w-5 text-violet-700" />
                    <h2 className="text-sm font-bold text-slate-900">Access grant policy</h2>
                </div>
                <div className="p-6">
                    <label
                        htmlFor="setting-grant-days"
                        className="mb-1.5 block text-sm font-medium text-gray-700"
                    >
                        Approved access duration
                    </label>
                    <div className="flex max-w-sm items-center gap-3">
                        <input
                            id="setting-grant-days"
                            type="number"
                            min={1}
                            max={30}
                            required
                            value={values.accessGrantDays}
                            onChange={(event) => update("accessGrantDays", Number(event.target.value))}
                            className={inputClass}
                        />
                        <span className="text-sm text-gray-500">days</span>
                    </div>
                    <p className="mt-2 max-w-2xl text-xs leading-5 text-gray-500">
                        Newly approved requests receive an expiring grant for this duration. Existing grants
                        keep their original expiration.
                    </p>
                </div>
            </Panel>

            <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
                <p className="text-xs text-gray-500">
                    {dirty ? "You have unsaved changes." : "All displayed settings match the server."}
                </p>
                <button type="submit" className={primaryButton} disabled={saving || !dirty}>
                    <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save changes"}
                </button>
            </div>
        </form>
    );
}

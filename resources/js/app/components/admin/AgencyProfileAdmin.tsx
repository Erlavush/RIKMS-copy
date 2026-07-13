import { useEffect, useState } from "react";
import { Building2, ExternalLink, Mail, MapPin, Phone, Save } from "lucide-react";
import { toast } from "sonner";
import { useApi } from "../../hooks/useApi";
import { apiPatch, firstValidationError, type AgencyProfileData } from "../../lib/api";
import { ErrorState, LoadingState } from "../shared/AsyncState";
import { useAgencyContext } from "../../hooks/useAgencyContext";

type ProfileForm = AgencyProfileData["data"];
const inputClass =
    "w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-blue-100";

export function AgencyProfileAdmin() {
    const { refreshUser } = useAgencyContext();
    const profile = useApi<AgencyProfileData>("/api/rikms/agency/profile");
    const [form, setForm] = useState<ProfileForm | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (profile.data && !form) setForm(profile.data.data);
    }, [profile.data, form]);

    function update(key: keyof ProfileForm, value: string) {
        setForm((current) => (current ? { ...current, [key]: value } : current));
    }

    async function save(event: React.FormEvent) {
        event.preventDefault();
        if (!form) return;
        setSaving(true);
        try {
            const response = await apiPatch<AgencyProfileData>("/api/rikms/agency/profile", form);
            setForm(response.data);
            toast.success("Agency profile updated.");
            await Promise.all([profile.refresh(), refreshUser()]);
        } catch (error) {
            toast.error(firstValidationError(error));
        } finally {
            setSaving(false);
        }
    }

    if (profile.loading || !form) return <LoadingState label="Loading agency profile…" />;
    if (profile.error) return <ErrorState message={profile.error} onRetry={() => void profile.refresh()} />;

    const initials = (form.abbreviation || form.name)
        .split(/\s+/)
        .map((part) => part[0])
        .join("")
        .slice(0, 4)
        .toUpperCase();

    return (
        <form onSubmit={save} className="space-y-6">
            <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                    <h1 className="text-2xl font-bold text-[#1E3A8A]">Agency Profile</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Keep the public agency directory accurate and useful.
                    </p>
                </div>
                <button
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1E3A8A] px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-900 disabled:opacity-50"
                >
                    <Save className="h-4 w-4" />
                    {saving ? "Saving…" : "Save profile"}
                </button>
            </header>
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col items-center gap-5 border-b border-gray-100 pb-6 text-center sm:flex-row sm:text-left">
                    <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-[#1E3A8A] text-2xl font-bold text-white">
                        {initials}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{form.name}</h2>
                        <p className="mt-1 text-sm text-gray-500">
                            {form.abbreviation}
                            {form.region ? ` · ${form.region}` : ""}
                        </p>
                        <p className="mt-2 text-xs text-gray-400">
                            Profile information becomes public after saving. RIKMS currently uses agency
                            initials in this directory.
                        </p>
                    </div>
                </div>
                <fieldset disabled={saving} className="mt-6 grid gap-5 sm:grid-cols-2">
                    <label className="sm:col-span-2">
                        <span className="mb-1.5 block text-sm font-medium text-gray-700">Agency name</span>
                        <input
                            required
                            value={form.name}
                            onChange={(event) => update("name", event.target.value)}
                            className={inputClass}
                        />
                    </label>
                    <label>
                        <span className="mb-1.5 block text-sm font-medium text-gray-700">Abbreviation</span>
                        <input
                            value={form.abbreviation ?? ""}
                            onChange={(event) => update("abbreviation", event.target.value)}
                            className={inputClass}
                        />
                    </label>
                    <label>
                        <span className="mb-1.5 block text-sm font-medium text-gray-700">Region</span>
                        <input
                            value={form.region ?? ""}
                            onChange={(event) => update("region", event.target.value)}
                            className={inputClass}
                        />
                    </label>
                    <label className="sm:col-span-2">
                        <span className="mb-1.5 block text-sm font-medium text-gray-700">Description</span>
                        <textarea
                            rows={5}
                            value={form.description ?? ""}
                            onChange={(event) => update("description", event.target.value)}
                            className={inputClass}
                        />
                    </label>
                    <label className="sm:col-span-2">
                        <span className="mb-1.5 block text-sm font-medium text-gray-700">Address</span>
                        <span className="relative block">
                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <input
                                value={form.address ?? ""}
                                onChange={(event) => update("address", event.target.value)}
                                className={`${inputClass} pl-10`}
                            />
                        </span>
                    </label>
                    <label>
                        <span className="mb-1.5 block text-sm font-medium text-gray-700">Contact email</span>
                        <span className="relative block">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <input
                                type="email"
                                value={form.contactEmail ?? ""}
                                onChange={(event) => update("contactEmail", event.target.value)}
                                className={`${inputClass} pl-10`}
                            />
                        </span>
                    </label>
                    <label>
                        <span className="mb-1.5 block text-sm font-medium text-gray-700">Contact phone</span>
                        <span className="relative block">
                            <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <input
                                value={form.contactPhone ?? ""}
                                onChange={(event) => update("contactPhone", event.target.value)}
                                className={`${inputClass} pl-10`}
                            />
                        </span>
                    </label>
                    <label className="sm:col-span-2">
                        <span className="mb-1.5 block text-sm font-medium text-gray-700">Website</span>
                        <span className="relative block">
                            <ExternalLink className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <input
                                type="url"
                                value={form.website ?? ""}
                                onChange={(event) => update("website", event.target.value)}
                                placeholder="https://"
                                className={`${inputClass} pl-10`}
                            />
                        </span>
                    </label>
                </fieldset>
            </section>
            <aside className="flex gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                <Building2 className="h-5 w-5 shrink-0" />
                <p>
                    Published research remains attributed to this agency. Changing profile text does not alter
                    document ownership or agency-level authorization.
                </p>
            </aside>
        </form>
    );
}

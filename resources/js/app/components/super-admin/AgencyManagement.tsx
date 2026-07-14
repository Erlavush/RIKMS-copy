import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Building2, Eye, Pencil, Plus, Power, Search } from "lucide-react";

import { ApiError, adminApi, errorMessage } from "../../lib/admin-api";
import type { Agency, Paginated } from "../../lib/admin-api";
import {
    EmptyState,
    ErrorState,
    LoadingState,
    Modal,
    PageHeader,
    Pagination,
    Panel,
    StatusBadge,
    Toast,
} from "./AdminUi";
import { formatDate, inputClass, primaryButton, secondaryButton } from "./admin-ui-utils";
import { useAdminResource, useDebouncedValue } from "./useAdminResource";

interface AgencyFormValues {
    name: string;
    abbreviation: string;
    region: string;
    contactEmail: string;
}

const EMPTY_FORM: AgencyFormValues = { name: "", abbreviation: "", region: "Region XI", contactEmail: "" };

function AgencyForm({
    initial,
    saving,
    onCancel,
    onSubmit,
}: {
    initial?: Agency;
    saving: boolean;
    onCancel: () => void;
    onSubmit: (values: AgencyFormValues) => Promise<void>;
}) {
    const [values, setValues] = useState<AgencyFormValues>(EMPTY_FORM);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setValues(
            initial
                ? {
                      name: initial.name,
                      abbreviation: initial.abbreviation,
                      region: initial.region ?? "",
                      contactEmail: initial.contactEmail ?? "",
                  }
                : EMPTY_FORM,
        );
        setError(null);
    }, [initial]);

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        try {
            await onSubmit(values);
        } catch (reason) {
            setError(errorMessage(reason));
        }
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            {error && (
                <p
                    className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                    role="alert"
                >
                    {error}
                </p>
            )}
            <div>
                <label htmlFor="agency-name" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Agency name
                </label>
                <input
                    id="agency-name"
                    required
                    maxLength={255}
                    value={values.name}
                    onChange={(event) => setValues({ ...values, name: event.target.value })}
                    className={inputClass}
                />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <label
                        htmlFor="agency-abbreviation"
                        className="mb-1.5 block text-sm font-medium text-gray-700"
                    >
                        Abbreviation
                    </label>
                    <input
                        id="agency-abbreviation"
                        required
                        maxLength={50}
                        value={values.abbreviation}
                        onChange={(event) =>
                            setValues({ ...values, abbreviation: event.target.value.toUpperCase() })
                        }
                        className={inputClass}
                    />
                </div>
                <div>
                    <label htmlFor="agency-region" className="mb-1.5 block text-sm font-medium text-gray-700">
                        Region
                    </label>
                    <input
                        id="agency-region"
                        maxLength={100}
                        value={values.region}
                        onChange={(event) => setValues({ ...values, region: event.target.value })}
                        className={inputClass}
                    />
                </div>
            </div>
            <div>
                <label htmlFor="agency-email" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Contact email
                </label>
                <input
                    id="agency-email"
                    type="email"
                    value={values.contactEmail}
                    onChange={(event) => setValues({ ...values, contactEmail: event.target.value })}
                    className={inputClass}
                />
            </div>
            <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={onCancel} className={secondaryButton}>
                    Cancel
                </button>
                <button type="submit" disabled={saving} className={primaryButton}>
                    {saving ? "Saving…" : initial ? "Save changes" : "Create agency"}
                </button>
            </div>
        </form>
    );
}

export function AgencyManagement() {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [formOpen, setFormOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Agency | null>(null);
    const [detailTarget, setDetailTarget] = useState<Agency | null>(null);
    const [statusTarget, setStatusTarget] = useState<Agency | null>(null);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);
    const debouncedSearch = useDebouncedValue(search);
    const {
        data: response,
        loading,
        error,
        reload,
    } = useAdminResource<Paginated<Agency>>("/agencies", { search: debouncedSearch, page });

    const saveAgency = async (values: AgencyFormValues) => {
        setSaving(true);
        const payload = {
            name: values.name,
            abbreviation: values.abbreviation,
            region: values.region || null,
            contact_email: values.contactEmail || null,
        };
        try {
            if (editTarget) {
                await adminApi.patch(`/agencies/${editTarget.id}`, payload);
            } else {
                await adminApi.post("/agencies", payload);
            }
            setToast({
                message: editTarget ? "Agency details updated." : "Agency created successfully.",
                tone: "success",
            });
            setFormOpen(false);
            setEditTarget(null);
            reload();
        } catch (reason) {
            if (reason instanceof ApiError) throw reason;
            throw reason;
        } finally {
            setSaving(false);
        }
    };

    const toggleAgency = async () => {
        if (!statusTarget) return;
        setSaving(true);
        try {
            await adminApi.patch(`/agencies/${statusTarget.id}`, { is_active: !statusTarget.isActive });
            setToast({
                message: `${statusTarget.abbreviation} is now ${statusTarget.isActive ? "inactive" : "active"}.`,
                tone: "success",
            });
            setStatusTarget(null);
            reload();
        } catch (reason) {
            setToast({ message: errorMessage(reason), tone: "error" });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="mx-auto max-w-[1376px] space-y-6">
            {toast && <Toast {...toast} onClose={() => setToast(null)} />}
            <PageHeader
                title="Agency Management"
                description="Create and maintain the agencies participating in RIKMS."
                action={
                    <button
                        type="button"
                        className={primaryButton}
                        onClick={() => {
                            setEditTarget(null);
                            setFormOpen(true);
                        }}
                    >
                        <Plus className="h-4 w-4" /> Add agency
                    </button>
                }
            />
            <Panel>
                <div className="border-b border-gray-100 p-5">
                    <label className="relative">
                        <span className="sr-only">Search agencies</span>
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            value={search}
                            onChange={(event) => {
                                setSearch(event.target.value);
                                setPage(1);
                            }}
                            placeholder="Search agency name or abbreviation…"
                            className={`${inputClass} pl-10`}
                        />
                    </label>
                </div>
                {loading && !response ? (
                    <LoadingState label="Loading agencies…" />
                ) : error && !response ? (
                    <ErrorState message={error} onRetry={reload} />
                ) : !response?.data.length ? (
                    <EmptyState
                        title="No agencies found"
                        description="Add an agency or adjust the current filters."
                    />
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                                    <tr>
                                        <th className="px-5 py-3 font-semibold">Agency</th>
                                        <th className="px-5 py-3 font-semibold">Status</th>
                                        <th className="px-5 py-3 font-semibold">Admin users</th>
                                        <th className="px-5 py-3 font-semibold">Research</th>
                                        <th className="px-5 py-3 font-semibold">Published</th>
                                        <th className="px-5 py-3 text-right font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {response.data.map((agency) => (
                                        <tr key={agency.id} className="hover:bg-gray-50/70">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                                                        <Building2 className="h-5 w-5 text-[#1E3A8A]" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-800">
                                                            {agency.name}
                                                        </p>
                                                        <p className="mt-0.5 text-xs text-gray-500">
                                                            {agency.abbreviation} ·{" "}
                                                            {agency.region || "No region"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <StatusBadge
                                                    status={agency.isActive ? "active" : "inactive"}
                                                />
                                            </td>
                                            <td className="px-5 py-4 text-gray-600">
                                                {agency.usersCount.toLocaleString()}
                                            </td>
                                            <td className="px-5 py-4 text-gray-600">
                                                {agency.documentsCount.toLocaleString()}
                                            </td>
                                            <td className="px-5 py-4 text-gray-600">
                                                {agency.publishedCount.toLocaleString()}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex justify-end gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => setDetailTarget(agency)}
                                                        className="rounded-lg p-2 text-gray-400 hover:bg-blue-50 hover:text-blue-800"
                                                        aria-label={`View ${agency.name}`}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEditTarget(agency);
                                                            setFormOpen(true);
                                                        }}
                                                        className="rounded-lg p-2 text-gray-400 hover:bg-blue-50 hover:text-blue-800"
                                                        aria-label={`Edit ${agency.name}`}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setStatusTarget(agency)}
                                                        className={`rounded-lg p-2 ${agency.isActive ? "text-gray-400 hover:bg-amber-50 hover:text-amber-700" : "text-green-600 hover:bg-green-50"}`}
                                                        aria-label={`${agency.isActive ? "Deactivate" : "Activate"} ${agency.name}`}
                                                    >
                                                        <Power className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <Pagination meta={response.meta} onPage={setPage} />
                    </>
                )}
            </Panel>

            <Modal
                open={formOpen}
                title={editTarget ? "Edit agency" : "Create agency"}
                description={
                    editTarget ? `Update ${editTarget.name}` : "Add a participating organization to RIKMS."
                }
                onClose={() => {
                    if (!saving) {
                        setFormOpen(false);
                        setEditTarget(null);
                    }
                }}
            >
                <AgencyForm
                    initial={editTarget ?? undefined}
                    saving={saving}
                    onCancel={() => {
                        setFormOpen(false);
                        setEditTarget(null);
                    }}
                    onSubmit={saveAgency}
                />
            </Modal>
            <Modal
                open={Boolean(detailTarget)}
                title={detailTarget?.name ?? "Agency details"}
                description={detailTarget?.abbreviation}
                onClose={() => setDetailTarget(null)}
            >
                {detailTarget && (
                    <dl className="grid gap-4 text-sm sm:grid-cols-2">
                        <div>
                            <dt className="text-xs text-gray-500">Region</dt>
                            <dd className="mt-1 font-medium text-slate-800">{detailTarget.region || "—"}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500">Contact email</dt>
                            <dd className="mt-1 font-medium text-slate-800">
                                {detailTarget.contactEmail || "—"}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500">Created</dt>
                            <dd className="mt-1 font-medium text-slate-800">
                                {formatDate(detailTarget.createdAt)}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500">Status</dt>
                            <dd className="mt-1">
                                <StatusBadge status={detailTarget.isActive ? "active" : "inactive"} />
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500">Users</dt>
                            <dd className="mt-1 font-medium text-slate-800">{detailTarget.usersCount}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500">Research records</dt>
                            <dd className="mt-1 font-medium text-slate-800">{detailTarget.documentsCount}</dd>
                        </div>
                    </dl>
                )}
            </Modal>
            <Modal
                open={Boolean(statusTarget)}
                title={`${statusTarget?.isActive ? "Deactivate" : "Activate"} agency?`}
                description={
                    statusTarget?.isActive
                        ? "Users assigned to this agency will no longer be able to use agency administration features."
                        : "Agency users will regain access according to their assigned role."
                }
                onClose={() => setStatusTarget(null)}
                footer={
                    <>
                        <button
                            type="button"
                            className={secondaryButton}
                            onClick={() => setStatusTarget(null)}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className={primaryButton}
                            disabled={saving}
                            onClick={() => void toggleAgency()}
                        >
                            {saving ? "Saving…" : statusTarget?.isActive ? "Deactivate" : "Activate"}
                        </button>
                    </>
                }
            >
                <p className="text-sm text-gray-600">{statusTarget?.name}</p>
            </Modal>
        </div>
    );
}

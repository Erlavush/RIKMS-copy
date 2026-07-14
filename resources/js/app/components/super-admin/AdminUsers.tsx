import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Pencil, Plus, Power, Search, ShieldCheck, UserRound } from "lucide-react";

import { ApiError, adminApi, errorMessage } from "../../lib/admin-api";
import type { AdminUser, Agency, Paginated } from "../../lib/admin-api";
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

interface UserFormValues {
    name: string;
    email: string;
    password: string;
    role: "agency_admin" | "super_admin";
    agencyId: string;
}

function UserForm({
    initial,
    agencies,
    saving,
    onCancel,
    onSubmit,
}: {
    initial?: AdminUser;
    agencies: Agency[];
    saving: boolean;
    onCancel: () => void;
    onSubmit: (values: UserFormValues) => Promise<void>;
}) {
    const [values, setValues] = useState<UserFormValues>({
        name: "",
        email: "",
        password: "",
        role: "agency_admin",
        agencyId: "",
    });
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setValues(
            initial
                ? {
                      name: initial.name,
                      email: initial.email,
                      password: "",
                      role: initial.role === "super_admin" ? "super_admin" : "agency_admin",
                      agencyId: String(initial.agencyId ?? initial.agency?.id ?? ""),
                  }
                : { name: "", email: "", password: "", role: "agency_admin", agencyId: "" },
        );
        setError(null);
    }, [initial]);

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (values.role === "agency_admin" && !values.agencyId) {
            setError("Select an agency for this agency administrator.");
            return;
        }
        setError(null);
        try {
            await onSubmit(values);
        } catch (reason) {
            setError(errorMessage(reason));
        }
    };

    return (
        <form className="space-y-4" onSubmit={submit}>
            {error && (
                <p
                    className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                    role="alert"
                >
                    {error}
                </p>
            )}
            <div>
                <label htmlFor="user-name" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Full name
                </label>
                <input
                    id="user-name"
                    required
                    maxLength={255}
                    value={values.name}
                    onChange={(event) => setValues({ ...values, name: event.target.value })}
                    className={inputClass}
                />
            </div>
            <div>
                <label htmlFor="user-email" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Email address
                </label>
                <input
                    id="user-email"
                    required
                    type="email"
                    value={values.email}
                    onChange={(event) => setValues({ ...values, email: event.target.value })}
                    className={inputClass}
                />
            </div>
            <div>
                <label htmlFor="user-password" className="mb-1.5 block text-sm font-medium text-gray-700">
                    {initial ? "New password (optional)" : "Temporary password"}
                </label>
                <input
                    id="user-password"
                    required={!initial}
                    type="password"
                    minLength={12}
                    autoComplete="new-password"
                    value={values.password}
                    onChange={(event) => setValues({ ...values, password: event.target.value })}
                    className={inputClass}
                />
                <p className="mt-1 text-xs text-gray-400">
                    Use at least 12 characters. Share credentials through an approved secure channel.
                </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <label htmlFor="user-role" className="mb-1.5 block text-sm font-medium text-gray-700">
                        Role
                    </label>
                    <select
                        id="user-role"
                        value={values.role}
                        onChange={(event) =>
                            setValues({
                                ...values,
                                role: event.target.value as UserFormValues["role"],
                                agencyId: event.target.value === "super_admin" ? "" : values.agencyId,
                            })
                        }
                        className={inputClass}
                    >
                        <option value="agency_admin">Agency administrator</option>
                        <option value="super_admin">Super administrator</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="user-agency" className="mb-1.5 block text-sm font-medium text-gray-700">
                        Agency
                    </label>
                    <select
                        id="user-agency"
                        value={values.agencyId}
                        disabled={values.role === "super_admin"}
                        onChange={(event) => setValues({ ...values, agencyId: event.target.value })}
                        className={inputClass}
                    >
                        <option value="">Select agency</option>
                        {agencies
                            .filter((agency) => agency.isActive)
                            .map((agency) => (
                                <option key={agency.id} value={agency.id}>
                                    {agency.abbreviation || agency.name}
                                </option>
                            ))}
                    </select>
                </div>
            </div>
            <div className="flex justify-end gap-3 pt-3">
                <button type="button" className={secondaryButton} onClick={onCancel}>
                    Cancel
                </button>
                <button type="submit" className={primaryButton} disabled={saving}>
                    {saving ? "Saving…" : initial ? "Save changes" : "Create user"}
                </button>
            </div>
        </form>
    );
}

export function AdminUsers() {
    const [search, setSearch] = useState("");
    const [role, setRole] = useState("");
    const [status, setStatus] = useState("");
    const [agencyId, setAgencyId] = useState("");
    const [page, setPage] = useState(1);
    const [formOpen, setFormOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<AdminUser | null>(null);
    const [statusTarget, setStatusTarget] = useState<AdminUser | null>(null);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);
    const debouncedSearch = useDebouncedValue(search);
    const {
        data: response,
        loading,
        error,
        reload,
    } = useAdminResource<Paginated<AdminUser>>("/users", {
        search: debouncedSearch,
        role,
        status,
        agency_id: agencyId,
        page,
    });
    const { data: agenciesResponse } = useAdminResource<Paginated<Agency>>("/agencies", { per_page: 100 });
    const agencies = agenciesResponse?.data ?? [];

    const saveUser = async (values: UserFormValues) => {
        setSaving(true);
        const payload: Record<string, unknown> = {
            name: values.name,
            email: values.email,
            role: values.role,
            agency_id: values.role === "agency_admin" ? Number(values.agencyId) : null,
        };
        if (values.password) payload.password = values.password;
        try {
            if (editTarget) await adminApi.patch(`/users/${editTarget.id}`, payload);
            else await adminApi.post("/users", payload);
            setToast({
                message: editTarget ? "Administrator account updated." : "Administrator account created.",
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

    const toggleStatus = async () => {
        if (!statusTarget) return;
        setSaving(true);
        try {
            await adminApi.patch(`/users/${statusTarget.id}`, { is_active: !statusTarget.isActive });
            setToast({
                message: `${statusTarget.name}'s account is now ${statusTarget.isActive ? "inactive" : "active"}.`,
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
                title="Administrator Users"
                description="Manage super-administrator and agency-administrator accounts."
                action={
                    <button
                        type="button"
                        className={primaryButton}
                        onClick={() => {
                            setEditTarget(null);
                            setFormOpen(true);
                        }}
                    >
                        <Plus className="h-4 w-4" /> Add administrator
                    </button>
                }
            />
            <Panel>
                <div className="grid gap-3 border-b border-gray-100 p-5 md:grid-cols-[1fr_190px_190px_220px]">
                    <label className="relative">
                        <span className="sr-only">Search users</span>
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            value={search}
                            onChange={(event) => {
                                setSearch(event.target.value);
                                setPage(1);
                            }}
                            placeholder="Search name or email…"
                            className={`${inputClass} pl-10`}
                        />
                    </label>
                    <label>
                        <span className="sr-only">Filter role</span>
                        <select
                            value={role}
                            onChange={(event) => {
                                setRole(event.target.value);
                                setPage(1);
                            }}
                            className={inputClass}
                        >
                            <option value="">All roles</option>
                            <option value="agency_admin">Agency admin</option>
                            <option value="super_admin">Super admin</option>
                        </select>
                    </label>
                    <label>
                        <span className="sr-only">Filter status</span>
                        <select
                            value={status}
                            onChange={(event) => {
                                setStatus(event.target.value);
                                setPage(1);
                            }}
                            className={inputClass}
                        >
                            <option value="">All statuses</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </label>
                    <label>
                        <span className="sr-only">Filter agency</span>
                        <select
                            value={agencyId}
                            onChange={(event) => {
                                setAgencyId(event.target.value);
                                setPage(1);
                            }}
                            className={inputClass}
                        >
                            <option value="">All agencies</option>
                            {agencies.map((agency) => (
                                <option key={agency.id} value={agency.id}>
                                    {agency.abbreviation || agency.name}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
                {loading && !response ? (
                    <LoadingState label="Loading administrator accounts…" />
                ) : error && !response ? (
                    <ErrorState message={error} onRetry={reload} />
                ) : !response?.data.length ? (
                    <EmptyState
                        title="No administrators found"
                        description="Create an account or change the current filters."
                    />
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                                    <tr>
                                        <th className="px-5 py-3 font-semibold">Administrator</th>
                                        <th className="px-5 py-3 font-semibold">Role</th>
                                        <th className="px-5 py-3 font-semibold">Agency</th>
                                        <th className="px-5 py-3 font-semibold">Status</th>
                                        <th className="px-5 py-3 font-semibold">Last login</th>
                                        <th className="px-5 py-3 text-right font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {response.data.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50/70">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
                                                        {user.role === "super_admin" ? (
                                                            <ShieldCheck className="h-4 w-4 text-[#1E3A8A]" />
                                                        ) : (
                                                            <UserRound className="h-4 w-4 text-[#1E3A8A]" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-800">
                                                            {user.name}
                                                        </p>
                                                        <p className="text-xs text-gray-500">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <StatusBadge status={user.role} />
                                            </td>
                                            <td className="px-5 py-4 text-gray-600">
                                                {user.agencyName ?? user.agency?.name ?? "Platform-wide"}
                                            </td>
                                            <td className="px-5 py-4">
                                                <StatusBadge status={user.isActive ? "active" : "inactive"} />
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4 text-gray-500">
                                                {formatDate(user.lastLoginAt, true)}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex justify-end gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEditTarget(user);
                                                            setFormOpen(true);
                                                        }}
                                                        className="rounded-lg p-2 text-gray-400 hover:bg-blue-50 hover:text-blue-800"
                                                        aria-label={`Edit ${user.name}`}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setStatusTarget(user)}
                                                        className={`rounded-lg p-2 ${user.isActive ? "text-gray-400 hover:bg-amber-50 hover:text-amber-700" : "text-green-600 hover:bg-green-50"}`}
                                                        aria-label={`${user.isActive ? "Deactivate" : "Activate"} ${user.name}`}
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
                title={editTarget ? "Edit administrator" : "Create administrator"}
                description="Role and agency assignment determine this account's server-enforced access."
                onClose={() => {
                    if (!saving) {
                        setFormOpen(false);
                        setEditTarget(null);
                    }
                }}
            >
                <UserForm
                    initial={editTarget ?? undefined}
                    agencies={agencies}
                    saving={saving}
                    onCancel={() => {
                        setFormOpen(false);
                        setEditTarget(null);
                    }}
                    onSubmit={saveUser}
                />
            </Modal>
            <Modal
                open={Boolean(statusTarget)}
                title={`${statusTarget?.isActive ? "Deactivate" : "Activate"} account?`}
                description={
                    statusTarget?.isActive
                        ? "This user will be prevented from signing in."
                        : "This user will be allowed to sign in with their assigned role."
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
                            onClick={() => void toggleStatus()}
                        >
                            {saving
                                ? "Saving…"
                                : statusTarget?.isActive
                                  ? "Deactivate account"
                                  : "Activate account"}
                        </button>
                    </>
                }
            >
                <p className="text-sm text-gray-600">
                    {statusTarget?.name} · {statusTarget?.email}
                </p>
            </Modal>
        </div>
    );
}

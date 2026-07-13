import { useEffect, useState } from "react";
import { Check, KeyRound, LockKeyhole, Save, ShieldCheck, Users } from "lucide-react";

import { adminApi, errorMessage } from "../../lib/admin-api";
import type { PermissionRecord, RoleRecord } from "../../lib/admin-api";
import { EmptyState, ErrorState, LoadingState, PageHeader, Panel, Toast } from "./AdminUi";
import { primaryButton } from "./admin-ui-utils";
import { useAdminResource } from "./useAdminResource";

interface RolesResponse {
    data: RoleRecord[];
    permissions: PermissionRecord[];
}

export function RBACManagement() {
    const { data: response, loading, error, reload } = useAdminResource<RolesResponse>("/roles");
    const [drafts, setDrafts] = useState<Record<string, string[]>>({});
    const [savingRole, setSavingRole] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);

    useEffect(() => {
        if (!response) return;
        setDrafts((current) =>
            Object.keys(current).length
                ? current
                : Object.fromEntries(response.data.map((role) => [role.name, role.permissions])),
        );
    }, [response]);

    if (loading && !response) return <LoadingState label="Loading roles and permissions…" />;
    if (error && !response) return <ErrorState message={error} onRetry={reload} />;
    if (!response?.data.length)
        return <EmptyState title="No roles returned" description="The server has not defined any roles." />;

    const roles = response.data;
    const permissions = response.permissions;
    const changed = (role: RoleRecord) =>
        JSON.stringify([...(drafts[role.name] ?? [])].sort()) !==
        JSON.stringify([...role.permissions].sort());
    const editable = (role: RoleRecord) => role.name !== "super_admin";

    const togglePermission = (role: RoleRecord, permission: string) => {
        if (!editable(role) || permission === "platform.admin") return;
        setDrafts((current) => {
            const next = new Set(current[role.name] ?? role.permissions);
            if (next.has(permission)) next.delete(permission);
            else next.add(permission);
            return { ...current, [role.name]: [...next] };
        });
    };

    const saveRole = async (role: RoleRecord) => {
        setSavingRole(role.name);
        try {
            const result = await adminApi.patch<{ data: RoleRecord }>(
                `/roles/${encodeURIComponent(role.name)}`,
                { permissions: drafts[role.name] ?? [] },
            );
            setDrafts((current) => ({ ...current, [role.name]: result.data.permissions }));
            setToast({ message: `${role.label} permissions updated.`, tone: "success" });
            reload();
        } catch (reason) {
            setToast({ message: errorMessage(reason), tone: "error" });
        } finally {
            setSavingRole(null);
        }
    };

    return (
        <div className="mx-auto max-w-[1376px] space-y-6">
            {toast && <Toast {...toast} onClose={() => setToast(null)} />}
            <PageHeader
                title="Role-Based Access Control"
                description="Review and update server-enforced capabilities for agency administrators."
            />
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                <div className="flex gap-3">
                    <ShieldCheck className="h-5 w-5 shrink-0" />
                    <p>
                        The Super Administrator role and platform administration capability are protected to
                        prevent system lockout. User role and agency assignments are managed from
                        Administrator Users.
                    </p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {roles.map((role) => (
                    <Panel key={role.id}>
                        <div className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                                    {editable(role) ? (
                                        <KeyRound className="h-5 w-5 text-[#1E3A8A]" />
                                    ) : (
                                        <LockKeyhole className="h-5 w-5 text-[#1E3A8A]" />
                                    )}
                                </div>
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                                    <Users className="h-3.5 w-3.5" /> {role.userCount.toLocaleString()}
                                </span>
                            </div>
                            <h2 className="mt-4 text-lg font-bold text-slate-900">{role.label}</h2>
                            <p className="mt-1 font-mono text-xs text-gray-400">{role.name}</p>
                            <p className="mt-4 text-sm text-gray-600">
                                {editable(role)
                                    ? "Permissions can be updated in the matrix below."
                                    : "Protected platform role. Permissions are read-only."}
                            </p>
                        </div>
                    </Panel>
                ))}
            </div>

            <Panel>
                <div className="flex flex-col gap-3 border-b border-gray-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-sm font-bold text-slate-900">Permission matrix</h2>
                        <p className="mt-1 text-xs text-gray-500">
                            Changes apply to every user assigned to that role
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {roles.filter(editable).map((role) => (
                            <button
                                key={role.name}
                                type="button"
                                className={primaryButton}
                                disabled={!changed(role) || savingRole !== null}
                                onClick={() => void saveRole(role)}
                            >
                                <Save className="h-4 w-4" />{" "}
                                {savingRole === role.name ? "Saving…" : `Save ${role.label}`}
                            </button>
                        ))}
                    </div>
                </div>
                {!permissions.length ? (
                    <EmptyState
                        title="No permissions defined"
                        description="The server returned no supported permission catalogue."
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                                <tr>
                                    <th className="sticky left-0 bg-gray-50 px-5 py-3 font-semibold">
                                        Capability
                                    </th>
                                    {roles.map((role) => (
                                        <th
                                            key={role.id}
                                            className="min-w-48 px-5 py-3 text-center font-semibold"
                                        >
                                            {role.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {permissions.map((permission) => (
                                    <tr key={permission.name}>
                                        <th className="sticky left-0 bg-white px-5 py-3.5">
                                            <p className="font-medium text-gray-700">{permission.label}</p>
                                            <p className="mt-0.5 font-mono text-[10px] font-normal text-gray-400">
                                                {permission.name}
                                            </p>
                                        </th>
                                        {roles.map((role) => {
                                            const checked = (drafts[role.name] ?? role.permissions).includes(
                                                permission.name,
                                            );
                                            const locked =
                                                !editable(role) || permission.name === "platform.admin";
                                            return (
                                                <td
                                                    key={`${permission.name}-${role.id}`}
                                                    className="px-5 py-3.5 text-center"
                                                >
                                                    <label
                                                        className={`inline-flex items-center gap-2 ${locked ? "cursor-not-allowed" : "cursor-pointer"}`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={checked}
                                                            disabled={locked}
                                                            onChange={() =>
                                                                togglePermission(role, permission.name)
                                                            }
                                                            className="sr-only"
                                                        />
                                                        <span
                                                            className={`inline-flex h-7 w-7 items-center justify-center rounded-lg border transition ${checked ? "border-green-200 bg-green-50 text-green-700" : "border-gray-200 bg-white text-transparent"} ${locked ? "opacity-70" : "hover:border-blue-300"}`}
                                                        >
                                                            {locked &&
                                                            checked &&
                                                            permission.name === "platform.admin" ? (
                                                                <LockKeyhole className="h-3.5 w-3.5" />
                                                            ) : (
                                                                <Check className="h-4 w-4" />
                                                            )}
                                                        </span>
                                                        <span className="sr-only">
                                                            {checked ? "Allowed" : "Not allowed"} for{" "}
                                                            {role.label}
                                                        </span>
                                                    </label>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Panel>
        </div>
    );
}

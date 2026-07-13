import type { CurrentUser } from "./api";

export type AgencyPermission =
    | "documents.view"
    | "documents.create"
    | "documents.update"
    | "documents.submit"
    | "documents.archive"
    | "access_requests.manage"
    | "agency.manage";

export function hasPermission(user: CurrentUser, permission: AgencyPermission): boolean {
    return user.role === "super_admin" || (user.permissions ?? []).includes(permission);
}

export function hasEveryPermission(user: CurrentUser, permissions: readonly AgencyPermission[]): boolean {
    return permissions.every((permission) => hasPermission(user, permission));
}

import type { PublicAgency } from "./api";

export const TEMPORARY_TEST_AGENCY_TYPE = "Authorized Test Organization";

export function agenciesVisibleOnLogin(agencies: PublicAgency[] | undefined): PublicAgency[] {
    return (agencies ?? []).filter(
        (agency) => agency.type === TEMPORARY_TEST_AGENCY_TYPE && agency.isActive !== false,
    );
}

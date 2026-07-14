import { describe, expect, it } from "vitest";
import type { PublicAgency } from "../app/lib/api";
import { agenciesVisibleOnLogin } from "../app/lib/login-agencies";

function agency(overrides: Partial<PublicAgency>): PublicAgency {
    return {
        id: 1,
        name: "Test agency",
        abbreviation: "TEST",
        type: "Authorized Test Organization",
        publications: 0,
        description: "Test agency",
        latestYear: null,
        isActive: true,
        ...overrides,
    };
}

describe("temporary cohort login visibility", () => {
    it("shows only active authorized test organizations", () => {
        const visible = agenciesVisibleOnLogin([
            agency({ id: 1, name: "Cohort company" }),
            agency({ id: 2, name: "Inactive cohort company", isActive: false }),
            agency({ id: 3, name: "Legacy agency", type: "Government Agency" }),
        ]);

        expect(visible.map((item) => item.name)).toEqual(["Cohort company"]);
    });

    it("handles bootstrap data that has not loaded", () => {
        expect(agenciesVisibleOnLogin(undefined)).toEqual([]);
    });
});

import { useOutletContext } from "react-router";
import type { CurrentUser } from "../lib/api";

export interface AgencyOutletContext {
    user: CurrentUser;
    refreshUser: () => Promise<void>;
}

export function useAgencyContext(): AgencyOutletContext {
    return useOutletContext<AgencyOutletContext>();
}

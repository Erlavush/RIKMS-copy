import type { PropsWithChildren } from "react";
import { BootstrapContext } from "../context/BootstrapContext";
import { useApi } from "../hooks/useApi";
import type { BootstrapPayload } from "../lib/api";

export function BootstrapProvider({ children }: PropsWithChildren) {
    const bootstrap = useApi<BootstrapPayload>("/api/rikms/bootstrap");
    return <BootstrapContext.Provider value={bootstrap}>{children}</BootstrapContext.Provider>;
}

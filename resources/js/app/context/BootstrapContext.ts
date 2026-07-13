import { createContext } from "react";
import type { BootstrapPayload } from "../lib/api";

export interface BootstrapState {
    data: BootstrapPayload | null;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

export const BootstrapContext = createContext<BootstrapState | null>(null);

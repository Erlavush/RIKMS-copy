import { useContext } from "react";
import { BootstrapContext, type BootstrapState } from "../context/BootstrapContext";

export function useBootstrap(): BootstrapState {
    const value = useContext(BootstrapContext);
    if (!value) throw new Error("useBootstrap must be used within BootstrapProvider.");
    return value;
}

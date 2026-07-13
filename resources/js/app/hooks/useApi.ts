import { useCallback, useEffect, useRef, useState } from "react";
import { apiGet, firstValidationError } from "../lib/api";

interface ApiState<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

export function useApi<T>(url: string | null): ApiState<T> {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(Boolean(url));
    const [error, setError] = useState<string | null>(null);
    const requestId = useRef(0);

    const load = useCallback(
        async (signal?: AbortSignal) => {
            if (!url) {
                setData(null);
                setLoading(false);
                setError(null);
                return;
            }

            const id = ++requestId.current;
            setLoading(true);
            setError(null);

            try {
                const response = await apiGet<T>(url, signal);
                if (requestId.current === id) {
                    setData(response);
                }
            } catch (caught) {
                if (caught instanceof DOMException && caught.name === "AbortError") return;
                if (requestId.current === id) {
                    setError(firstValidationError(caught));
                }
            } finally {
                if (requestId.current === id) {
                    setLoading(false);
                }
            }
        },
        [url],
    );

    useEffect(() => {
        const controller = new AbortController();
        void load(controller.signal);
        return () => {
            requestId.current += 1;
            controller.abort();
        };
    }, [load]);

    const refresh = useCallback(async () => {
        await load();
    }, [load]);

    return { data, loading, error, refresh };
}

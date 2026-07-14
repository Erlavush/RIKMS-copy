import { useCallback, useEffect, useState } from "react";

import { adminApi, errorMessage } from "../../lib/admin-api";

export function useAdminResource<T>(
    path: string,
    query: Record<string, string | number | boolean | null | undefined> = {},
) {
    const queryKey = JSON.stringify(query);
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [revision, setRevision] = useState(0);

    const reload = useCallback(() => setRevision((value) => value + 1), []);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError(null);

        const parsedQuery = JSON.parse(queryKey) as Record<
            string,
            string | number | boolean | null | undefined
        >;
        adminApi
            .get<T>(path, parsedQuery)
            .then((response) => {
                if (active) setData(response);
            })
            .catch((reason: unknown) => {
                if (active) setError(errorMessage(reason));
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [path, queryKey, revision]);

    return { data, loading, error, reload };
}

export function useDebouncedValue<T>(value: T, delay = 300): T {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const timeout = window.setTimeout(() => setDebounced(value), delay);
        return () => window.clearTimeout(timeout);
    }, [delay, value]);

    return debounced;
}

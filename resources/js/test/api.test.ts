import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiDelete, apiGet, apiPatch, apiPost, queryString } from "../app/lib/api";

describe("RIKMS API client", () => {
    beforeEach(() => {
        document.head.innerHTML = '<meta name="csrf-token" content="test-csrf">';
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it("sends session, JSON, and CSRF headers for mutations", async () => {
        const fetchMock = vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ data: { id: 7 } }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }),
        );
        vi.stubGlobal("fetch", fetchMock);

        await expect(
            apiPatch<{ data: { id: number } }>("/api/rikms/documents/7", { title: "Updated" }),
        ).resolves.toEqual({ data: { id: 7 } });

        const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
        const headers = init.headers as Headers;
        expect(url).toBe("/api/rikms/documents/7");
        expect(init.method).toBe("PATCH");
        expect(init.credentials).toBe("same-origin");
        expect(headers.get("Accept")).toBe("application/json");
        expect(headers.get("Content-Type")).toBe("application/json");
        expect(headers.get("X-CSRF-TOKEN")).toBe("test-csrf");
    });

    it("preserves FormData bodies without forcing a content type", async () => {
        const fetchMock = vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ data: { id: 8 } }), {
                status: 201,
                headers: { "Content-Type": "application/json" },
            }),
        );
        vi.stubGlobal("fetch", fetchMock);
        const form = new FormData();
        form.append("title", "Uploaded");

        await apiPost("/api/rikms/documents", form);

        const init = fetchMock.mock.calls[0][1] as RequestInit;
        const headers = init.headers as Headers;
        expect(init.body).toBe(form);
        expect(headers.has("Content-Type")).toBe(false);
    });

    it("surfaces Laravel validation errors", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue(
                new Response(
                    JSON.stringify({
                        message: "The given data was invalid.",
                        errors: { title: ["The title field is required."] },
                    }),
                    {
                        status: 422,
                        headers: { "Content-Type": "application/json" },
                    },
                ),
            ),
        );

        const request = apiPost("/api/rikms/documents", {});
        await expect(request).rejects.toMatchObject({
            name: "ApiError",
            status: 422,
            errors: { title: ["The title field is required."] },
        });
    });

    it("handles empty responses and query parameters", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));

        await expect(apiDelete("/api/rikms/notifications/1")).resolves.toBeUndefined();
        expect(queryString({ page: 2, search: "rice", empty: "", missing: null })).toBe(
            "?page=2&search=rice",
        );
    });

    it("supports abortable reads", async () => {
        const fetchMock = vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ data: [] }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }),
        );
        vi.stubGlobal("fetch", fetchMock);
        const controller = new AbortController();

        await apiGet("/api/rikms/public/documents", controller.signal);

        expect((fetchMock.mock.calls[0][1] as RequestInit).signal).toBe(controller.signal);
    });
});

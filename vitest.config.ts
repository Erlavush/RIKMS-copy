import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "figma:asset": fileURLToPath(new URL("./resources/js/assets", import.meta.url)),
        },
    },
    test: {
        environment: "jsdom",
        setupFiles: ["./resources/js/test/setup.ts"],
        css: true,
        coverage: {
            reporter: ["text", "json", "html"],
        },
    },
});

import { defineConfig } from "vite";
import laravel from "laravel-vite-plugin";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
    plugins: [
        laravel({
            input: ["resources/js/main.tsx"],
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    resolve: {
        alias: {
            'figma:asset': fileURLToPath(new URL('./resources/js/assets', import.meta.url)).replace(/\\/g, '/'),
        },
    },
    server: {
        host: '127.0.0.1',
        watch: {
            ignored: ["**/storage/framework/views/**"],
        },
    },
});

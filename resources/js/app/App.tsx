import { Suspense } from "react";
import { RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { router } from "./routes";

export default function App() {
    return (
        <>
            <Suspense
                fallback={
                    <div
                        className="flex min-h-screen items-center justify-center text-sm text-gray-500"
                        role="status"
                    >
                        Loading RIKMS…
                    </div>
                }
            >
                <RouterProvider router={router} />
            </Suspense>
            <Toaster richColors closeButton position="top-right" />
        </>
    );
}

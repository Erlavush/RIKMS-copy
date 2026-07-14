import { ShieldX } from "lucide-react";
import { Link } from "react-router";

export function PermissionDenied() {
    return (
        <section className="mx-auto max-w-xl rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-sm">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-700">
                <ShieldX className="h-6 w-6" />
            </span>
            <h1 className="mt-4 text-xl font-bold text-gray-900">Permission required</h1>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
                Your current role does not allow this workspace action. Ask a system administrator if you
                believe you need access.
            </p>
            <Link
                to="/agency/notifications"
                className="mt-5 inline-flex rounded-lg bg-[#1E3A8A] px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-900"
            >
                Go to notifications
            </Link>
        </section>
    );
}

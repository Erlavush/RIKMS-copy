export function formatDate(value?: string | null, includeTime = false): string {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat(
        "en-PH",
        includeTime
            ? { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" }
            : { dateStyle: "medium", timeZone: "Asia/Manila" },
    ).format(date);
}

export const primaryButton =
    "inline-flex items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#172e70] disabled:cursor-not-allowed disabled:opacity-50";
export const secondaryButton =
    "inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50";
export const inputClass =
    "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/10";

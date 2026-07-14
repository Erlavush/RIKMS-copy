export function formatDate(value?: string | null): string {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeZone: "Asia/Manila" }).format(date);
}

export function formatDateTime(value?: string | null): string {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Manila",
    }).format(date);
}

export function formatBytes(bytes?: number | null): string {
    if (!bytes) return "No file";
    const units = ["B", "KB", "MB", "GB"];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

export function formatNumber(value?: number | null): string {
    return new Intl.NumberFormat("en-PH").format(value ?? 0);
}

export function formatDocumentType(value?: string | null): string {
    const labels: Record<string, string> = {
        research: "Research Study",
        research_study: "Research Study",
        terminal: "Terminal Report",
        terminal_report: "Terminal Report",
        pap: "Project Accomplishment Report",
        project_accomplishment_report: "Project Accomplishment Report",
    };
    if (!value) return "Research record";
    return labels[value] ?? value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

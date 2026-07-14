export type CsvCell = string | number | boolean | null | undefined;

/**
 * Escape a cell for spreadsheet-safe CSV output. Quoting alone does not stop
 * spreadsheet applications from evaluating user-controlled formula prefixes.
 */
export function escapeCsvCell(cell: CsvCell): string {
    const value = String(cell ?? "");
    const safeValue = /^[\t\r\n ]*[=+\-@]/.test(value) ? `'${value}` : value;
    return `"${safeValue.replace(/"/g, '""')}"`;
}

export function serializeCsv(rows: CsvCell[][]): string {
    return rows.map((row) => row.map(escapeCsvCell).join(",")).join("\r\n");
}

export function downloadCsv(filename: string, rows: CsvCell[][]): void {
    const url = URL.createObjectURL(
        new Blob(["\uFEFF", serializeCsv(rows)], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.hidden = true;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

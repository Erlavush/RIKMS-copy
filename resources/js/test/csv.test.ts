import { describe, expect, it } from "vitest";
import { escapeCsvCell, serializeCsv } from "../app/lib/csv";

describe("spreadsheet-safe CSV export", () => {
    it.each(["=2+3", "+SUM(A1:A2)", "-1+2", '@IMPORTDATA("https://example.test")', "  =cmd"])(
        "neutralizes formula-like cell %s",
        (value) => {
            expect(escapeCsvCell(value)).toBe(`"'${value.replace(/"/g, '""')}"`);
        },
    );

    it("quotes delimiters, quotes, and line breaks", () => {
        expect(
            serializeCsv([
                ["Title", "A, B"],
                ["Quoted", 'A "value"\nnext'],
            ]),
        ).toBe('"Title","A, B"\r\n"Quoted","A ""value""\nnext"');
    });
});

import { safeFileName } from "./downloadWorkspaceFile";

describe("safeFileName", () => {
  it("keeps an ordinary name intact", () => {
    expect(safeFileName("Tax Return 2024.pdf")).toBe("Tax Return 2024.pdf");
  });

  it("flattens path separators", () => {
    // Names come from whoever uploaded the file. A separator would place the
    // download somewhere other than the directory chosen for it.
    expect(safeFileName("reports/2024/summary.pdf")).toBe("reports_2024_summary.pdf");
    expect(safeFileName("reports\\summary.pdf")).toBe("reports_summary.pdf");
  });

  it("refuses to climb out of the download directory", () => {
    expect(safeFileName("../../../etc/passwd")).toBe("_.._.._etc_passwd");
  });

  it("substitutes a name when nothing usable is left", () => {
    // An empty destination filename is not a file, it is the directory itself.
    expect(safeFileName("...")).toBe("download");
    expect(safeFileName("   ")).toBe("download");
  });

  it("caps the length so the write cannot fail on a long name", () => {
    expect(safeFileName("a".repeat(500))).toHaveLength(120);
  });
});

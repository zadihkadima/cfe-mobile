import { formatFileSize } from "./formatFileSize";

describe("formatFileSize", () => {
  it("leaves small files in bytes", () => {
    expect(formatFileSize(0)).toBe("0 B");
    expect(formatFileSize(842)).toBe("842 B");
  });

  it("uses decimal units so it agrees with the operating system", () => {
    // A file the phone's own file browser calls 1 KB should not be called
    // 0.98 KB here. Two different sizes for one file reads as a bug.
    expect(formatFileSize(1000)).toBe("1.0 KB");
    expect(formatFileSize(4823718)).toBe("4.8 MB");
  });

  it("drops the decimal once it stops meaning anything", () => {
    expect(formatFileSize(94300000)).toBe("94 MB");
  });

  it("stops climbing at the largest unit it knows", () => {
    expect(formatFileSize(5e15)).toContain("TB");
  });

  it("returns nothing for a size that cannot be true", () => {
    // A missing size should leave the row blank rather than print "NaN B"
    // next to a perfectly good file.
    expect(formatFileSize(Number.NaN)).toBe("");
    expect(formatFileSize(-1)).toBe("");
  });
});

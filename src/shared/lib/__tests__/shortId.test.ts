import { SHORT_ID_LENGTH, formatShortId, shortId } from "../shortId";

describe("shortId", () => {
  it("keeps the end of an identifier, not the start", () => {
    expect(shortId("6a6ff86ba989c46f3717165e")).toBe("3717165e");
  });

  /**
   * The reason the function exists. These are six real ObjectIDs generated in
   * one process, and they agree on their first twenty-two characters. Taking
   * the front would collapse all six onto one string.
   */
  it("tells apart identifiers made moments apart", () => {
    const madeTogether = [
      "6a6ff86ba989c46f3717165e",
      "6a6ff86ba989c46f3717165f",
      "6a6ff86ba989c46f37171660",
      "6a6ff86ba989c46f37171661",
      "6a6ff86ba989c46f37171662",
      "6a6ff86ba989c46f37171663",
    ];

    const shortened = madeTogether.map(shortId);

    expect(new Set(shortened).size).toBe(madeTogether.length);
  });

  it("would have collapsed them had it taken the front", () => {
    // Guards the decision itself rather than the code. If someone rewrites
    // this to slice from the start, the test above still needs to fail for a
    // reason a reader can see, and this states what that reason is.
    const fronts = [
      "6a6ff86ba989c46f3717165e",
      "6a6ff86ba989c46f3717165f",
    ].map((id) => id.slice(0, SHORT_ID_LENGTH));

    expect(new Set(fronts).size).toBe(1);
  });

  it("leaves an identifier already short enough alone", () => {
    expect(shortId("abc")).toBe("abc");
  });

  it("returns the whole thing at exactly the cut length", () => {
    expect(shortId("12345678")).toBe("12345678");
  });

  it("gives nothing back for a missing identifier", () => {
    expect(shortId(undefined)).toBe("");
    expect(shortId(null)).toBe("");
    expect(shortId("")).toBe("");
  });

  it("ignores surrounding whitespace", () => {
    expect(shortId("  6a6ff86ba989c46f3717165e  ")).toBe("3717165e");
  });
});

describe("formatShortId", () => {
  it("marks the value as a reference", () => {
    expect(formatShortId("6a6ff86ba989c46f3717165e")).toBe("#3717165e");
  });

  it("stays empty rather than showing a lone marker", () => {
    expect(formatShortId(undefined)).toBe("");
  });
});

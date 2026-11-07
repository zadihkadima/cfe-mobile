import { isLookupCandidate } from "./useLookup";

describe("isLookupCandidate", () => {
  it("accepts a full identifier", () => {
    expect(isLookupCandidate("6a6ff86ba989c46f3717165e")).toBe(true);
  });

  // Ids are copied by hand and by clipboard, and both pick up whitespace. A
  // paste that fails because of a trailing space is the kind of failure a
  // person blames themselves for and reports as "search is broken".
  it("ignores surrounding whitespace", () => {
    expect(isLookupCandidate("  6a6ff86ba989c46f3717165e\n")).toBe(true);
  });

  it("accepts either case", () => {
    expect(isLookupCandidate("6A6FF86BA989C46F3717165E")).toBe(true);
  });

  // The point of the check is to stop a request per keystroke. A partial value
  // that passed would send ten collection reads to be told "no", and the
  // answer that mattered would arrive behind them.
  it("rejects anything that is not a whole identifier", () => {
    expect(isLookupCandidate("")).toBe(false);
    expect(isLookupCandidate("6a6ff86b")).toBe(false);
    expect(isLookupCandidate("6a6ff86ba989c46f3717165e0")).toBe(false);
    expect(isLookupCandidate("6a6ff86ba989c46f3717165z")).toBe(false);
    expect(isLookupCandidate("acme accounting")).toBe(false);
  });
});

import { describeReaders } from "./describeReaders";

function reader(name?: string) {
  return { user_id: "u", name, seen_at: "2026-01-01T00:00:00Z" };
}

describe("describeReaders", () => {
  it("names the readers rather than counting them", () => {
    // "Seen by 2" of four participants leaves the only question worth asking
    // unanswered.
    expect(describeReaders([reader("Ada"), reader("Grace")], 2)).toBe(
      "Seen by Ada, Grace",
    );
  });

  it("summarises once the list grows long", () => {
    const many = ["Ada", "Grace", "Katherine", "Radia", "Barbara"].map(reader);

    expect(describeReaders(many, 5)).toBe(
      "Seen by Ada, Grace, Katherine and 2 more",
    );
  });

  // A backend that has not been redeployed sends the count and no names.
  // Degrading to the previous display beats degrading to a blank line.
  it("falls back to the count when the server sent no names", () => {
    expect(describeReaders(undefined, 3)).toBe("Seen by 3");
  });

  // A deleted account resolves to no name. Dropping it silently would be a
  // lie; falling back to the count keeps the reader honest about the total.
  it("falls back to the count when no reader could be named", () => {
    expect(describeReaders([reader(), reader()], 2)).toBe("Seen by 2");
  });

  it("ignores readers the server could not name, but keeps the ones it could", () => {
    expect(describeReaders([reader("Ada"), reader()], 2)).toBe("Seen by Ada");
  });
});

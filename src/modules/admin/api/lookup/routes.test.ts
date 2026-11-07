import { LOOKUP_KIND_LABELS, lookupRoute } from "./routes";
import { LookupKind, LookupResult } from "./types";

const ID = "6a6ff86ba989c46f3717165e";
const WORKSPACE = "6a6ff86ba989c46f37171660";

const result = (kind: LookupKind, workspace?: string): LookupResult => ({
  id: ID,
  kind,
  workspace_id: workspace,
});

// Every kind the server can send has to be answerable here. Missing one would
// not fail loudly: the result would render, and the row would do nothing when
// pressed, which reads as a search that half-works.
const ALL_KINDS: LookupKind[] = [
  "workspace",
  "client",
  "manager",
  "admin",
  "user",
  "task",
  "checklist",
  "message",
  "file",
  "file_request",
  "irs_submission",
  "questionnaire",
  "signature_request",
];

describe("lookupRoute", () => {
  it("sends people to the screen for their role", () => {
    expect(lookupRoute(result("client"))).toBe(`/user/admin/clients/${ID}`);
    expect(lookupRoute(result("manager"))).toBe(`/user/admin/managers/${ID}`);
    expect(lookupRoute(result("workspace"))).toBe(`/user/admin/workspaces/${ID}`);
  });

  // The client and manager screens are different destinations, so a result
  // that only said "user" would leave this side guessing. If the server ever
  // stops splitting them, this is where it shows up.
  it("does not route a person whose role is unknown", () => {
    expect(lookupRoute(result("user"))).toBeNull();
    expect(lookupRoute(result("admin"))).toBeNull();
  });

  it("sends records inside a workspace to the tab that holds them", () => {
    expect(lookupRoute(result("task", WORKSPACE))).toBe(
      `/user/admin/workspaces/${WORKSPACE}/tasks`,
    );

    expect(lookupRoute(result("message", WORKSPACE))).toBe(
      `/user/admin/workspaces/${WORKSPACE}/messages`,
    );

    expect(lookupRoute(result("signature_request", WORKSPACE))).toBe(
      `/user/admin/workspaces/${WORKSPACE}/signatures`,
    );

    expect(lookupRoute(result("irs_submission", WORKSPACE))).toBe(
      `/user/admin/workspaces/${WORKSPACE}/irs-submissions`,
    );
  });

  // Files and file requests share a tab. Asserted rather than assumed, because
  // the pairing is the kind of thing a later split would quietly break.
  it("sends files and file requests to the same tab", () => {
    expect(lookupRoute(result("file", WORKSPACE))).toBe(
      `/user/admin/workspaces/${WORKSPACE}/client-files`,
    );

    expect(lookupRoute(result("file_request", WORKSPACE))).toBe(
      `/user/admin/workspaces/${WORKSPACE}/client-files`,
    );
  });

  // A scoped record arriving without its workspace cannot produce a path. The
  // failure to guard would be invisible in review and produce
  // `/workspaces/undefined/tasks` at runtime, which navigates somewhere and
  // renders nothing.
  it("refuses to build a path for a scoped record with no workspace", () => {
    expect(lookupRoute(result("task"))).toBeNull();
    expect(lookupRoute(result("questionnaire"))).toBeNull();
    expect(lookupRoute(result("checklist"))).toBeNull();
  });

  it("answers for every kind without throwing", () => {
    for (const kind of ALL_KINDS) {
      expect(() => lookupRoute(result(kind, WORKSPACE))).not.toThrow();
    }
  });

  it("never builds a path containing undefined", () => {
    for (const kind of ALL_KINDS) {
      const route = lookupRoute(result(kind, WORKSPACE));

      if (route !== null) expect(route).not.toContain("undefined");
    }
  });
});

describe("LOOKUP_KIND_LABELS", () => {
  // A kind with no label renders as blank, which looks like a loading state
  // that never finishes rather than a missing translation.
  it("names every kind", () => {
    for (const kind of ALL_KINDS) {
      expect(LOOKUP_KIND_LABELS[kind]).toBeTruthy();
    }
  });
});

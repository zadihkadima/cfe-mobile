import { Platform } from "react-native";

import { api } from "@/core/api/client";
import {
  uploadWorkspaceFile,
  reuploadWorkspaceFile,
} from "./uploadWorkspaceFile";

jest.mock("@/core/api/client", () => ({
  api: { post: jest.fn(), get: jest.fn() },
}));

const post = api.post as jest.Mock;

const asset = {
  uri: "file:///var/mobile/tmp/return-2025.pdf",
  name: "return-2025.pdf",
  mimeType: "application/pdf",
};

/**
 * The value handed to FormData.append for the file field.
 *
 * Captured by spying on append rather than by reading the body back, because
 * the assertion has to hold against React Native's FormData polyfill -- which
 * is what runs on a device -- while the test environment supplies jsdom's. The
 * two disagree about almost everything except what append receives, and what
 * append receives is precisely what was wrong.
 */
let appended: { field: string; value: unknown; filename?: string }[] = [];

// Installed per test, not once. The suite runs with restoreMocks, so a spy set
// up in beforeAll is torn down after the first test and every later one sees
// the real append -- which fails by finding nothing rather than by saying so.
beforeEach(() => {
  appended = [];

  jest
    .spyOn(FormData.prototype, "append")
    .mockImplementation(function (
      field: string,
      value: unknown,
      filename?: string,
    ) {
      appended.push({ field, value, filename });
    });

  post.mockReset();
  post.mockResolvedValue({ data: { id: "f1" } });
});

function filePart() {
  const entry = appended.find((item) => item.field === "file");

  if (!entry) {
    throw new Error("no file field was appended to the request body");
  }

  return entry;
}

/** The native descriptor, which is the shape React Native actually serialises. */
function nativePart() {
  return filePart().value as { uri?: string; name?: string; type?: string };
}

describe("uploadWorkspaceFile", () => {
  /**
   * The regression this file exists for.
   *
   * The body used to be built by fetching the uri and appending the resulting
   * Blob. React Native's FormData is a polyfill: getParts() spreads the value
   * looking for a `uri`, and a Blob spreads to `{_data}` because size and type
   * are prototype getters. The part therefore carried no uri, no content, and
   * -- since a Blob has no `name` -- no filename either.
   *
   * The upload still returned 200. It simply stored nothing, which is why this
   * presented as every upload screen breaking at once rather than as an error
   * anyone could act on. A test that only asserted "post was called" would
   * have passed throughout, so this asserts the shape of the part.
   */
  it("sends a part the native layer can actually read", async () => {
    await uploadWorkspaceFile("ws-1", asset);

    const part = nativePart();

    expect(part.uri).toBe(asset.uri);
    expect(part.name).toBe(asset.name);
    expect(part.type).toBe(asset.mimeType);
  });

  it("names the file, so the server does not have to invent one", async () => {
    await uploadWorkspaceFile("ws-1", asset);

    // A part with no filename arrives as an anonymous blob. The stored record
    // then shows something the person who uploaded it will not recognise.
    expect(nativePart().name).toBe(asset.name);
  });

  it("falls back to a generic type rather than sending none", async () => {
    await uploadWorkspaceFile("ws-1", { ...asset, mimeType: null });

    // Absent is not the same as unknown. Omitting the type entirely leaves the
    // server sniffing the extension, which is exactly the input the upload
    // validator is meant not to trust.
    expect(nativePart().type).toBe("application/octet-stream");
  });

  it("posts to the workspace upload endpoint", async () => {
    await uploadWorkspaceFile("ws-1", asset);

    expect(post.mock.calls[0][0]).toBe("/workspaces/ws-1/files/upload");
  });

  it("builds a reupload the same way, against the file's own endpoint", async () => {
    await reuploadWorkspaceFile("ws-1", "f-9", asset);

    const [url] = post.mock.calls[0] as [string, FormData];

    expect(url).toBe("/workspaces/ws-1/files/f-9/reupload");

    // Reupload shares the body builder, so a regression in one is a regression
    // in both. Asserted here so that stays true if they ever diverge.
    expect(nativePart().uri).toBe(asset.uri);
  });

  it("reports progress below completion while the request is outstanding", async () => {
    const seen: (number | null)[] = [];

    await uploadWorkspaceFile("ws-1", asset, {
      onProgress: (value) => seen.push(value),
    });

    const handler = post.mock.calls[0][2].onUploadProgress as (event: {
      loaded: number;
      total?: number;
    }) => void;

    handler({ loaded: 100, total: 100 });

    // The last byte leaving the device is not the server having accepted the
    // file; scanning and storage still follow. A bar sitting at 100% makes
    // that wait look like a hang.
    expect(seen[seen.length - 1]).toBeLessThan(1);
  });

  it("reports indeterminate progress when the total is unknown", async () => {
    const seen: (number | null)[] = [];

    await uploadWorkspaceFile("ws-1", asset, {
      onProgress: (value) => seen.push(value),
    });

    const handler = post.mock.calls[0][2].onUploadProgress as (event: {
      loaded: number;
      total?: number;
    }) => void;

    handler({ loaded: 100 });

    // Null rather than 0. A bar pinned at zero for the whole upload reads as a
    // transfer that never started, which is when people cancel something that
    // was working.
    expect(seen[seen.length - 1]).toBeNull();
  });

  it("does not log the file path", async () => {
    const log = jest.spyOn(console, "log").mockImplementation(() => undefined);

    await uploadWorkspaceFile("ws-1", asset);

    // Document paths carry client names and matter types. This helper used to
    // print the uri on every upload, which puts them in logcat where any other
    // process on the device can read them.
    expect(log).not.toHaveBeenCalled();

    log.mockRestore();
  });
});

describe("uploadWorkspaceFile on web", () => {
  it("appends the bytes, because a browser FormData has no notion of a uri", async () => {
    const original = Platform.OS;

    Object.defineProperty(Platform, "OS", { value: "web", configurable: true });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(["pdf"])),
    });

    await uploadWorkspaceFile("ws-1", asset);

    expect(global.fetch).toHaveBeenCalledWith(asset.uri);

    Object.defineProperty(Platform, "OS", {
      value: original,
      configurable: true,
    });
  });
});

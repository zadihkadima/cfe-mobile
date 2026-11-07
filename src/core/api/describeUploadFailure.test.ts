import { describeUploadFailure } from "./describeUploadFailure";

function httpError(status: number, message?: string) {
  return {
    isAxiosError: true,
    response: { status, data: message ? { error: message } : {} },
  };
}

describe("describeUploadFailure", () => {
  it("tells the user a file is too large rather than that it failed", () => {
    // The generic message leaves somebody re-picking the same file and
    // getting the same result, which is the failure repeating itself.
    expect(describeUploadFailure(httpError(413))).toMatch(/too large/i);
  });

  it("passes on why a file was rejected", () => {
    expect(
      describeUploadFailure(httpError(422, "this file was rejected by a security scan")),
    ).toMatch(/security scan/i);
  });

  it("advises waiting when the fault is ours, not the file's", () => {
    // Nothing is wrong with the document, so telling the user to change it
    // would send them looking for a problem that does not exist.
    expect(describeUploadFailure(httpError(503))).toMatch(/try again in a moment/i);
  });

  it("falls back to something honest when there is no status", () => {
    expect(describeUploadFailure(new Error("offline"))).toMatch(/could not be uploaded/i);
  });
});

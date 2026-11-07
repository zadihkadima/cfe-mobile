import { readdirSync, statSync } from "fs";
import { join, relative, sep } from "path";

const APP = join(__dirname, "..", "..", "..", "app");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

function routePatterns(): RegExp[] {
  return walk(APP)
    .filter((file) => file.endsWith(".tsx"))
    .map((file) => relative(APP, file).split(sep).join("/"))
    .filter((file) => !file.includes("_layout") && !file.startsWith("+"))
    .map((file) => {
      const route =
        "/" + file.replace(/\.tsx$/, "").replace(/(^|\/)index$/, "");

      return new RegExp(
        "^" +
          route
            .replace(/\[[^\]]+\]/g, "\u0000")
            .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
            .replace(/\u0000/g, "[^/]+") +
          "/?$",
      );
    });
}

/**
 * The paths the backend puts in outgoing email.
 *
 * They are duplicated here because the two repositories cannot import from
 * each other, and duplication that fails loudly is better than the alternative
 * that has already happened twice: the reset link pointed at /reset-password
 * while the screen lived at /auth/reset-password, and the invitation link
 * pointed at an API endpoint that only accepts POST. Neither was noticed,
 * because a dead link in an email is only ever discovered by its recipient,
 * who cannot tell it apart from an expired one and so reports nothing.
 *
 * If a path changes here, change internal/applink/routes.go and the link
 * builders in internal/common/email/sendgrid.go with it.
 */
const EMAIL_LINK_PATHS = [
  "/auth/reset-password",
  "/auth/accept-invite/some-token",

  // Reachable without a token as well, because the handoff page tells anyone
  // whose deep link did not fire -- everyone on a desktop -- to open the app
  // and enter the code by hand. There has to be somewhere to enter it.
  "/auth/accept-invite",
];

describe("email deep links", () => {
  it.each(EMAIL_LINK_PATHS)("has a screen at %s", (path) => {
    expect(routePatterns().some((pattern) => pattern.test(path))).toBe(true);
  });
});

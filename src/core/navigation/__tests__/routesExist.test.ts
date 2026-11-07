import { readdirSync, readFileSync, statSync } from "fs";
import { join, relative, sep } from "path";

const SRC = join(__dirname, "..", "..", "..");
const APP = join(SRC, "app");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

/**
 * Every route the file-based router actually serves, as a regular expression.
 *
 * Dynamic segments become a wildcard, so /user/workspaces/[id]/tasks matches a
 * reference built with a template literal.
 */
function routeMatchers(): { route: string; pattern: RegExp }[] {
  return walk(APP)
    .filter((file) => file.endsWith(".tsx"))
    .map((file) => relative(APP, file).split(sep).join("/"))
    .filter(
      (file) =>
        !file.includes("_layout") &&
        !file.startsWith("+") &&
        !file.includes("/+"),
    )
    .map((file) => {
      const route =
        "/" + file.replace(/\.tsx$/, "").replace(/(^|\/)index$/, "");

      const pattern = new RegExp(
        "^" +
          route
            .replace(/\[[^\]]+\]/g, "\u0000")
            .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
            .replace(/\u0000/g, "[^/]+") +
          "/?$",
      );

      return { route, pattern };
    });
}

/**
 * Every /user route referenced anywhere in the app, with template holes
 * replaced by a placeholder segment.
 */
function referencedRoutes(): { route: string; file: string }[] {
  const found: { route: string; file: string }[] = [];

  for (const file of walk(SRC)) {
    if (!/\.tsx?$/.test(file)) continue;
    if (file.includes("__tests__") || /\.test\.tsx?$/.test(file)) continue;

    const source = readFileSync(file, "utf8");

    for (const match of source.matchAll(/["`](\/user\/[^"`\n]*)["`]/g)) {
      const raw = match[1];

      // A reference assembled from a variable holding a whole path cannot be
      // checked here, so it is skipped rather than reported as broken.
      if (raw.includes("${") && !/\$\{[^}]*\}/.test(raw)) continue;

      found.push({
        route: raw.replace(/\$\{[^}]*\}/g, "x"),
        file: relative(SRC, file),
      });
    }
  }

  return found;
}

describe("app routes", () => {
  it("has a screen for every /user route the app navigates to", () => {
    const matchers = routeMatchers();

    // Routes assembled from a variable section (the notification resolver) are
    // covered by that module's own test, which asserts the sections it can
    // produce; they cannot be resolved statically here.
    const unresolvable = /\/x\/x$|\$/;

    const broken = referencedRoutes()
      .filter(({ route }) => !unresolvable.test(route))
      .filter(({ route }) => !matchers.some(({ pattern }) => pattern.test(route)))
      .map(({ route, file }) => `${route}  (referenced in ${file})`);

    // A route with no screen behind it is not a crash and not a warning: the
    // user taps a button and lands on not-found, which reads as the app being
    // broken generally rather than as one missing file. Three create buttons
    // and the settings link were in this state before this test existed.
    expect(broken).toEqual([]);
  });
});

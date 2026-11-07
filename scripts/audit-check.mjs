#!/usr/bin/env node
/**
 * Dependency audit gate.
 *
 * `npm audit --audit-level=high` alone is not usable on a React Native tree:
 * the toolchain drags in advisories that have no published fix compatible with
 * the pinned Expo SDK, so the job fails permanently. A permanently red gate is
 * worse than no gate, because people learn to ignore it and then miss the
 * finding that actually matters.
 *
 * This script keeps the gate meaningful instead of loosening it. Every
 * high/critical advisory fails the build unless it appears in
 * .audit-allowlist.json with a written justification and an expiry date. The
 * expiry is the important part: an accepted risk stops being accepted on a
 * known date, so the decision is revisited deliberately rather than inherited.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const FAILING_SEVERITIES = new Set(["high", "critical"]);

function readAudit() {
  try {
    // npm audit exits non-zero when it finds anything, so the throw is expected
    // and the payload is on stdout either way.
    return JSON.parse(
      execFileSync("npm", ["audit", "--json"], {
        cwd: root,
        encoding: "utf8",
        maxBuffer: 32 * 1024 * 1024,
      }),
    );
  } catch (error) {
    if (error.stdout) {
      return JSON.parse(error.stdout);
    }
    throw error;
  }
}

function readAllowlist() {
  const raw = JSON.parse(
    readFileSync(join(root, ".audit-allowlist.json"), "utf8"),
  );

  return new Map(raw.allow.map((entry) => [entry.id, entry]));
}

/**
 * Collapses npm's report to the underlying advisories.
 *
 * npm reports every package that merely depends on a vulnerable package as
 * vulnerable itself, so a single advisory in `brace-expansion` appears as
 * thirty findings. Deduplicating by advisory id is what makes the output
 * readable and the allowlist maintainable.
 */
function rootAdvisories(report) {
  const found = new Map();

  for (const vulnerability of Object.values(report.vulnerabilities ?? {})) {
    for (const via of vulnerability.via ?? []) {
      if (typeof via !== "object" || !via.url) continue;

      const id = via.url.split("/").pop();

      if (!found.has(id)) {
        found.set(id, {
          id,
          module: via.name,
          severity: via.severity,
          title: via.title,
          url: via.url,
        });
      }
    }
  }

  return [...found.values()];
}

const allowlist = readAllowlist();
const advisories = rootAdvisories(readAudit());

const today = new Date();
const problems = [];
const accepted = [];

for (const advisory of advisories) {
  const exception = allowlist.get(advisory.id);

  if (!exception) {
    if (FAILING_SEVERITIES.has(advisory.severity)) {
      problems.push({ advisory, why: "not reviewed" });
    }
    continue;
  }

  if (new Date(exception.reviewBy) < today) {
    problems.push({
      advisory,
      why: `acceptance expired on ${exception.reviewBy}`,
    });
    continue;
  }

  accepted.push({ advisory, exception });
}

for (const { advisory, exception } of accepted) {
  console.log(
    `accepted  ${advisory.severity.padEnd(8)} ${advisory.module} (${advisory.id}) — review by ${exception.reviewBy}`,
  );
}

// An allowlist entry for an advisory that no longer appears is dead weight and
// will quietly keep a future occurrence suppressed.
const present = new Set(advisories.map((a) => a.id));
for (const [id, entry] of allowlist) {
  if (!present.has(id)) {
    console.log(`stale     allowlist entry for ${entry.module} (${id}) — no longer reported, please remove it`);
  }
}

if (problems.length === 0) {
  console.log(`\nNo unreviewed high or critical advisories.`);
  process.exit(0);
}

console.error(`\n${problems.length} advisory/advisories require attention:\n`);

for (const { advisory, why } of problems) {
  console.error(`  ${advisory.severity.toUpperCase()}  ${advisory.module}`);
  console.error(`    ${advisory.title}`);
  console.error(`    ${advisory.url}`);
  console.error(`    reason: ${why}\n`);
}

console.error(
  "Fix the advisory, or record the acceptance in .audit-allowlist.json with a\n" +
    "justification explaining why it cannot reach production code, and a review date.",
);

process.exit(1);

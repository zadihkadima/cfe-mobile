# Testing

How the mobile client is tested, what the linter is and is not asked to prove,
and — equally important — what is **not** covered today.

## Current state

| Measure                | Value              |
| ---------------------- | ------------------ |
| Test suites            | 60                 |
| Tests                  | 473                |
| Screens                | 48                 |
| Screens with a test    | more than 1        |
| Statement coverage     | see `npm run test:coverage` |
| Lint errors            | 0                  |

Several of 48 screens have tests. That is a start, not a state to be satisfied
with, and this document states it plainly rather than burying it.

## Commands

```bash
npm test               # watchless run
npm run test:watch     # watch mode
npm run test:coverage   # with coverage and the ratchet enforced
npm run lint           # errors fail, warnings report
npm run lint:fix       # autofix what is mechanically fixable
npm run typecheck      # tsc --noEmit
npm run verify         # lint + typecheck + tests with coverage
npm run audit:ci       # dependency advisories against the allowlist
```

`npm run verify` is what to run before pushing. It matches CI.

> **`format:check` is deliberately not in `verify` or in CI yet.** Prettier was
> introduced after most of the code was written and 264 files are still
> unformatted, so including it would make `verify` fail for everyone on a clean
> checkout — a gate that always fails is worse than no gate, because it teaches
> people that red is normal. Running `npm run format` across the tree is a single
> mechanical commit that has not been taken. Once it is: add `format:check` back
> to `verify` and CI, and add the commit to `.git-blame-ignore-revs` so it does
> not pollute `git blame`.

## What the current tests cover

The 60 suites concentrate on the layers where a defect is silent and expensive:

- **`src/core/api`** — the shared client, token refresh and queueing,
  idempotency key generation, upload and download behaviour, and error
  normalisation.
- **`src/core/auth`** — session teardown.
- **`src/core/storage`** — encrypted MMKV behaviour.
- **Hooks and utilities** — cache keys, formatting, validation schemas.

This is a defensible place to have started: these modules are used by every
screen, so a bug in them is a bug everywhere. But it means the tested surface is
almost entirely *non-visual*.

## What is not tested

- **Limited screen and component tests.** Several high-value screens and
  components are covered, but most of the 48 screens still have no test.
  Nothing verifies that the other 47 render their loading, empty, error and
  success states, that a form surfaces validation messages, or that a mutation
  failure shows the user anything. `tsc` proves the props type-check; it proves
  nothing about what the user sees.
- **No navigation tests.** Route guards and role-based redirects are unverified.
- **No end-to-end tests.** No tool is installed. Nothing exercises a real sign-in
  against a real backend on a real device.
- **No accessibility testing.** See [Accessibility](#accessibility) below.
- **No visual regression testing**, so a design-system change can silently break
  layout on screens nobody opens during review.
- **No performance testing.** List rendering with realistic data volumes is
  unmeasured.

### Recommended next step

Screen tests, starting with the highest-risk screens rather than the easiest
ones: authentication, anything that uploads or downloads a document, and
anything that displays another user's data (where a tenancy bug would show up).

Use `@testing-library/react-native`, which is **already installed** (`^14.0.1`) —
there is no tooling work to do first, only tests to write. Query by accessible
role and label rather than by test id. A test that queries by label fails when
the screen becomes unusable by a screen reader; a test that queries by test id
passes happily either way. That property is worth more than the convenience.

For E2E, **Maestro** is the better fit over Detox for an Expo project: it works
against the managed workflow without ejecting, and its YAML flows are
maintainable by people who do not work in the codebase daily.

## Writing screen tests

Use `renderScreen` from `src/test-utils/renderScreen.tsx`. It wraps the screen in
a Redux `Provider` and a `QueryClientProvider`, builds a **fresh store per test**
(the app's singleton store is module state, so reusing it leaks one test's
session into every later test and makes the suite order-dependent), and
configures the query client with `retry: false` so an error-state assertion
fails immediately instead of timing out with a misleading message.

```tsx
import { renderScreen } from "@/test-utils/renderScreen";
import { screen, fireEvent, waitFor } from "@testing-library/react-native";

await renderScreen(<LoginScreen />);
await fireEvent.press(screen.getByText("Sign In"));
```

### Two traps that will cost you an hour each

**1. `render` and `fireEvent` are asynchronous in Testing Library v14.** Both
return promises and both must be awaited. Forgetting the `await` does not fail
where you forgot it: the render never completes, `screen` is never populated, and
*every* query then fails with `` `render` function has not been called `` — an
error that accuses the test of omitting the one thing it plainly did.

The ESLint rule `no-floating-promises` flags this correctly. **Believe it.** It
was reporting exactly this defect while the failure was being misdiagnosed as a
module-resolution problem.

**2. ESM packages must be added to `transformIgnorePatterns`.** `react-redux`
was missing, so the first screen test died with "Cannot use import statement
outside a module" pointing at the test file rather than at the config. Every
screen reaches a `Provider`, so that one omission blocked screen testing
entirely. If a new test fails with a syntax error inside `node_modules`, this
list is the first place to look.

### What a screen test should assert

`LoginScreen.test.tsx` is the reference. It covers the states worth paying for:

- validation rejects bad input **and the request never leaves** (the actual point
  of client-side validation);
- each role lands on its own area, and an **unrecognised role fails closed** to
  the least-privileged area rather than to the admin shell;
- a two-factor challenge navigates to the prompt **and does not also sign the
  user in**;
- a rejected sign-in shows an error, stays put, and **does not leak whether the
  email or the password was wrong** — distinguishing them turns the form into an
  account-existence oracle.

Those tests were mutation-checked: breaking the manager redirect makes exactly
one of them fail. A test that cannot fail is not evidence.

## Coverage

The thresholds in `jest.config.js` are a **ratchet floor, not a target**. They
are set just below the measured figures so they pass today and fail the moment
coverage regresses.

**Raise them when coverage rises. Never lower them to make a build pass.** The
numbers follow the tests; they must never lead them.

## What the linter is asked to prove

ESLint runs with type-aware rules. The configuration in `eslint.config.mjs`
documents every deliberate deviation inline, but the reasoning matters enough to
repeat:

### Promise handling is an error, not a warning

`no-floating-promises`, `no-misused-promises` and `await-thenable` are errors.
Introducing the linter surfaced **132 errors, 73 of which were unhandled or
discarded promises.** In React Native an unhandled rejection is invisible in a
release build: the user sees a button that did nothing and no crash is reported.

It also found a genuine bug in `src/core/storage/encryptionKey.ts`, where a
`try`/`catch` wrapped an async call. A synchronous `catch` cannot catch an
asynchronous rejection, so the handler could never fire.

### Rules deliberately turned off

- **`@typescript-eslint/unbound-method`** — 46 false positives. The codebase
  passes functions as props, which is idiomatic React and not the `this`-binding
  hazard the rule exists to catch.
- **`react-hooks/rules-of-hooks`** — 3 false positives caused by passing a hook
  through a `useData` prop. The rule cannot see through the indirection.

### Rules deliberately set to warn

The 24 React Compiler rules (`react-hooks/refs`, `set-state-in-effect`,
`immutability`, `purity`) report optimisation opportunities, not defects. They
are warnings so they are visible without blocking a merge on something that is
not broken.

The `no-unsafe-*` family is also a warning in application code: these fire on
values crossing the untyped boundary from the API, and turning them into errors
would force a large refactor rather than a fix. They are fully disabled in test
files, where fixture construction legitimately works with loose types.

**Never silence a rule with a bare inline `eslint-disable`.** If a rule is wrong
for this codebase, turn it off in `eslint.config.mjs` with an explanation, so the
decision is reviewable in one place instead of scattered across the tree.

## Accessibility

**There is no automated accessibility linting**, and this is a genuine gap rather
than a decision.

`eslint-plugin-react-native-a11y` supports ESLint 8 and below; `eslint-plugin-react`
supports 9.7 and below. This project runs ESLint 10. Installing either would have
required `--force` and a broken peer-dependency tree, which trades a real problem
for a worse one.

Until an ESLint 10 compatible plugin ships, accessibility is enforced by the
pull request checklist and by manual review. Re-check plugin compatibility when
bumping ESLint.

### Labelled inputs

`FormInput` associates its label with its input two ways: `accessibilityLabel`,
which is what VoiceOver and TalkBack read, and `nativeID`/`accessibilityLabelledBy`,
which is the real Android association. Both are asserted individually in
`FormInput.test.tsx`, because a screen-level `getByLabelText` query passes if
*either* is present and so cannot tell them apart — losing one would degrade a
real user's experience on one platform with every other test still green.

Screens should therefore reach form fields with `getByLabelText`, not
`getByPlaceholderText`. A placeholder disappears the moment the field has
content, so it is not a label, and querying by it lets markup no screen reader
can navigate pass the suite.

## Writing tests

- Test behaviour through the component's or hook's public surface, not its
  internals. A test asserting on internal state fails on refactors that broke
  nothing.
- Query by accessible role and label where a real user would use the label.
- Fake the network, the clock and storage. Everything else should be real; a
  test built entirely from mocks asserts that the mocks were configured
  correctly and nothing else.
- Deterministic and order-independent.
- Every bug fix ships with a test that fails before the fix. If you cannot write
  one, you do not yet understand the bug.

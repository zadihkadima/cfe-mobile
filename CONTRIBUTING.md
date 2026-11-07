# Contributing

## Branching: feature → develop → main

`main` is the protected, releasable production branch. `develop` is the shared
integration branch. Start short-lived feature and fix branches from `develop`,
open a pull request back to `develop`, then promote the validated `develop`
branch to `main` through a release pull request.

```
main
└── develop
  ├── feat/workspace-file-upload
  └── fix/notification-read-state
```

Unfinished work hides behind a flag rather than an unmerged branch. This matters
more on a client than on a service: a long-lived branch that misses an Expo SDK
bump can become unmergeable, because the native project is regenerated rather
than merged.

### Recommended branch protection

- Protect both `develop` and `main`: require a pull request, an approval, the
  required CI checks, an up-to-date branch, and no force pushes or deletion.
- Allow feature and fix branches to target only `develop`.
- Allow only `develop` to target `main`; use GitHub auto-merge or a merge queue
  after the release pull request's checks and approval pass.

## Commit messages: Conventional Commits

```
<type>(<optional scope>): <imperative summary>
```

Types: `feat`, `fix`, `perf`, `refactor`, `docs`, `test`, `build`, `ci`,
`chore`, `revert`.

```
feat(workspace): show upload progress for large documents
fix(auth): stop logging the axios error object on refresh failure
```

Breaking changes use `!` (`feat(api)!: ...`) and a `BREAKING CHANGE:` footer.

## Versioning

[Semantic Versioning](https://semver.org). Note that the app version in
`app.json` is user-visible and is what appears in a crash report, so it must be
bumped in the same commit as the release, not afterwards.

## Before opening a pull request

```bash
npm run verify     # lint, typecheck and tests with coverage
npm run audit:ci   # dependency vulnerabilities against the allowlist
```

`verify` does **not** yet include `npm run format:check`. Prettier was
introduced after most of the code was written, and 264 files are still
unformatted. Running `npm run format` across the tree is a single mechanical
commit that has not been taken yet; once it is, add `format:check` back to
`verify` and to CI, and record the commit in `.git-blame-ignore-revs` so it does
not pollute `git blame`.

A pull request should:

- do one thing, and be small enough to review carefully;
- include tests for new behaviour and for the bug being fixed;
- update documentation affected by the change;
- contain no TODOs, commented-out code or placeholder implementations.

## Coding standards

- TypeScript runs in `strict` mode. Do not add `any`, `as unknown as`, or
  `@ts-expect-error` without a comment explaining why the type system is wrong.
- ESLint errors are not negotiable; warnings are triaged. The rules that are
  deliberately disabled are documented with their reason in `eslint.config.mjs`.
  If a rule is wrong for this codebase, turn it off there with an explanation —
  never with a bare inline disable.
- Never call `fetch` or `axios` directly. All requests go through
  `src/core/api/client.ts` so auth, workspace context, refresh and error
  normalisation apply uniformly.
- Never store credentials outside `src/core/storage`.
- Never log tokens, passwords, personal identifiers or document contents.
- Never treat hidden UI as an access control. Authorization is enforced by the
  backend; `RoleGate` is a usability affordance, not a security boundary.
- Handle every promise. A floating promise in React Native produces an
  unhandled rejection that is invisible in release builds. `void` it
  deliberately or `await` it.
- Components hold rendering logic; data fetching lives in hooks; API shapes live
  in the module's `api/` directory.

## Testing standards

- Test behaviour through the component's or hook's public surface, not its
  internals. Query by accessible role and label rather than by test id where a
  real user would use the label.
- Prefer real collaborators; fake the network, the clock and storage.
- Bug fixes ship with a regression test that fails before the fix.
- Tests must be deterministic and independent of execution order.
- Coverage thresholds in `jest.config.js` are a ratchet, not a target. They are
  set just below the current measurement so coverage cannot fall. Raise them
  when you raise coverage; never lower them to make a build pass.

## Adding a feature module

1. Define the API functions and response types under `src/modules/<name>/api/`.
2. Add hooks under `hooks/` that wrap TanStack Query and own the cache keys.
3. Build screens under `screens/` using the design system, not raw primitives.
4. Register the route in `src/app/` — an unrouted screen is dead code, not a
   feature.
5. Confirm the backend endpoint exists and is documented in `cfe-backend`. The
   client cannot ship ahead of the API it depends on.
6. Update the changelog.

## Native changes

Anything that adds a native module, permission or capability cannot be shipped
as an over-the-air update. Say so explicitly in the pull request, because the
reviewer cannot tell from the JavaScript diff alone.

`android/` and `ios/` are generated by `expo prebuild`. Prefer a config plugin
over hand-editing them; a manual edit will be silently reverted the next time
anyone regenerates the project.

## Build variants and email links

The Expo configuration selects an app identity from `APP_VARIANT`, so multiple
builds can be installed on one device without competing for the same Android
package ID, iOS bundle ID, or deep-link scheme.

| Build | App name | Scheme | Android package |
| ----- | -------- | ------ | --------------- |
| Development | CFE Mobile Dev | `cfe-dev` | `com.sayeedkhalshi.cfemobile.dev` |
| Preview | CFE Mobile Preview | `cfe-preview` | `com.sayeedkhalshi.cfemobile.preview` |
| Production | CFE Mobile | `cfe` | `com.sayeedkhalshi.cfemobile` |

For a local Android development build, run `npm run android`. It sets
`APP_VARIANT=development` and targets Gradle's `developmentDebug` variant; do
not use an unqualified `expo run:android`, because multiple flavors make its
default `installDebug` task ambiguous.

Production email handoffs use `cfe:///auth/...`; keep the backend production
`APP_DEEP_LINK_SCHEME=cfe`. To test emailed links against a preview or
development build, point the matching non-production backend environment at
`cfe-preview` or `cfe-dev` respectively.

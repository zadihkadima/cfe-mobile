## What and why

<!-- What does this change do, and what problem does it solve? Link the issue. -->

Closes #

## Type of change

- [ ] `feat` — new functionality
- [ ] `fix` — bug fix
- [ ] `perf` — performance
- [ ] `refactor` — no behaviour change
- [ ] `docs` / `test` / `ci` / `chore`
- [ ] Breaking change (describe the migration below)

## How it was verified

<!-- Commands run and scenarios exercised, not just "it works". -->

- [ ] `npm run verify` passes (typecheck, lint, tests)
- [ ] New behaviour is covered by tests
- [ ] Bug fixes include a regression test
- [ ] Exercised on a device or simulator, not only in Jest

Platforms exercised:

- [ ] iOS
- [ ] Android

## Client security checklist

<!-- A mobile client is an untrusted environment. These are the failure modes
     that a passing test suite will not catch. -->

- [ ] No token, credential or personal data is written to `AsyncStorage`,
      logged, or included in an analytics or crash payload
- [ ] Server-side authorization is still the source of truth; hidden UI is not
      treated as an access control
- [ ] No secret is embedded in the bundle or in `app.json` (the bundle is
      readable by anyone who installs the app)
- [ ] New network calls go through the shared API client so auth, refresh and
      error normalisation apply
- [ ] No new dependency, or a new one is justified below

## Release impact

- [ ] No new configuration, or `.env.example` is updated
- [ ] No native change, or the change is compatible with the current Expo SDK
      and a new native build is required (say so explicitly)
- [ ] Backward compatible with the deployed backend, or the required backend
      version is stated below
- [ ] Works against the oldest app version still in the field, or a forced
      upgrade path is described

## Accessibility

<!-- Automated a11y linting is not yet in place; see `docs/TESTING.md`. -->

- [ ] Interactive elements have accessible labels and adequate hit targets
- [ ] Layout survives large system font sizes

## Notes for reviewers

<!-- Trade-offs, alternatives considered, follow-up work. -->

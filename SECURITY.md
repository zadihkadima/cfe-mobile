# Security Policy

## Supported versions

The `main` branch and the most recent released build receive security fixes.

Mobile clients are different from a service in one important way: old versions
stay installed on devices after a fix ships. A vulnerability that can only be
closed on the client should be assumed live in the field until the affected
builds are forced to upgrade, and where possible it should also be mitigated
server-side in `cfe-backend`.

## Reporting a vulnerability

Do **not** open a public issue for a security problem.

Report privately through GitHub Security Advisories
("Security" → "Report a vulnerability") or by email to the maintainers listed in
`.github/CODEOWNERS`.

Please include:

- affected version, build number and commit;
- platform, OS version and whether the device was rooted or jailbroken;
- reproduction steps or a proof of concept;
- assessed impact (data exposure, privilege escalation, session takeover).

### Response targets

| Stage                  | Target            |
| ---------------------- | ----------------- |
| Acknowledgement        | 2 business days   |
| Initial assessment     | 5 business days   |
| Fix for critical       | 7 calendar days   |
| Fix for high           | 30 calendar days  |
| Coordinated disclosure | after a fix ships |

## Threat model

The application handles tax documents and personal financial data. The device
is not a trusted environment: the bundle is readable by anyone who unzips the
IPA or APK, the app sandbox is readable on a rooted or jailbroken device, and
traffic is inspectable by anyone who can install a proxy certificate.

Two consequences follow, and they govern every review:

1. **The client is never an authorization boundary.** Hiding a screen or a
   button is a usability decision. Every access decision is made and enforced by
   the backend, and a client change can never be the fix for an authorization
   bug.
2. **The client holds no secrets.** Anything shipped in the bundle or in
   `app.json` is public. There is no API key, signing secret or shared password
   the app can keep.

## Security controls in this client

These controls are implemented. Regressions in any of them must be treated as
security bugs, not as ordinary defects.

- **Token storage.** Session tokens live in MMKV, which is encrypted with
  AES-256. The encryption key is not in the bundle and not in the same file: it
  is generated on first launch and held in the platform keystore (Keychain on
  iOS, Keystore on Android), which is hardware-backed on modern devices. See
  `src/core/storage/encryptionKey.ts`.
- **Key durability.** The keystore entry is `WHEN_UNLOCKED_THIS_DEVICE_ONLY`, so
  the key is unreadable while the device is locked, is excluded from unencrypted
  backups, and never migrates to a restored handset. A session that silently
  follows a backup onto a new device is a live credential the user does not know
  exists.
- **Single network path.** All requests go through the client in
  `src/core/api/client.ts`, so the bearer token is attached, the workspace
  context is applied, and errors are normalised in exactly one place. Calling
  `fetch` or `axios` directly bypasses all of it and is a review failure.
- **Token refresh.** A `401` triggers a single refresh; concurrent requests are
  queued behind it rather than each firing their own refresh, and the
  authentication endpoints are excluded so a failing refresh cannot recurse.
- **Refresh failures are not logged verbatim.** The rejected request object
  carries the refresh token in its config, and a refresh token outlives an
  access token by a wide margin. Only a message is logged, never the error
  object.
- **Retries are not automatic on mutations.** The shared query client retries
  reads but never replays a mutation, because a blind retry over a flaky mobile
  network duplicates submissions. Call sites that need retry-safety opt in with
  an `Idempotency-Key` via `src/core/api/idempotency.ts`.
- **Supply chain.** `npm run audit:ci` runs on every pull request. Accepted
  advisories are recorded in `.audit-allowlist.json` with a reason and a
  `reviewBy` date; the check fails once that date passes, so the decision is
  re-made rather than inherited silently.

## Known gaps

Stated explicitly, because an undocumented gap is indistinguishable from an
oversight.

- **No certificate pinning.** Traffic can be intercepted by anyone able to
  install a trusted root on the device. This mainly weakens defence against a
  compromised device, not against a network attacker, since TLS still applies.
- **No jailbreak or root detection.** Detection is bypassable and largely
  theatre, but its absence should be a conscious decision rather than an
  assumption.
- **No automated accessibility or a11y-security linting.** No ESLint 10
  compatible plugin is available yet; see `docs/TESTING.md`.
- **Screenshot and background-snapshot protection is not applied.** Sensitive
  screens may appear in the OS task switcher.
- **Idempotency keys are opt-in and thinly adopted.** Only client creation
  currently sends one. Any mutation a user can plausibly double-submit should
  send a key; today most do not, and the guarantee rests on the backend.

## Requirements for contributors

- Never log, persist or send to analytics: tokens, passwords, national
  identifiers, or document contents.
- Never store credentials outside `src/core/storage`.
- Never add a dependency that requests network or filesystem permissions
  without stating why in the pull request.
- Treat `.env` values as configuration, not as secrets. Anything placed there is
  compiled into the bundle and is readable by users.

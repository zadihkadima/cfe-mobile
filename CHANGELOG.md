# Changelog

All notable changes to the CFE mobile client are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Images sent in a conversation are shown, not listed.** An image attachment
  renders in the bubble; everything else keeps the file row with its name and
  size. A photograph reduced to a filename is a photograph nobody opens, and
  seeing it without deciding to is the entire reason for sending one.

  The URL behind a displayed image renews itself before it expires. Access
  URLs last ten minutes, so fetching one when the row first appears works
  until it lapses and then fails in the situation that matters most — a
  conversation somebody left open — by turning an image they were just looking
  at into a broken box. The lifetime is read from the server's response rather
  than assumed, so the two cannot disagree.

- **Files can be sent in a conversation.** The composer has an attach button;
  the picked file uploads immediately rather than on send, so a failed upload
  is reported while the user is still looking at it instead of after they have
  pressed send and moved on. A message may carry a file with no text.

  The file goes through the ordinary workspace upload endpoint, so it appears
  in the client's documents alongside everything else they have sent, and is
  versioned, listed and deleted with them. The message stores only a reference
  to it. Storing a second copy against the message would put a client's
  paperwork somewhere no retention rule reaches and nobody thinks to look.
  Retrying a failed message reuses the uploaded file rather than uploading it
  again, which would otherwise leave an orphaned copy in their documents for
  every failed attempt.

- **The connection state is visible above the composer.** A banner reads
  "Connecting…" while the socket is being established or re-established, and
  "Not connected" once the client has given up until something changes. It is
  placed directly above the composer, where somebody about to type is already
  looking; at the top of the screen the keyboard would cover it the moment
  they started.

### Changed

- An unconfirmed message is now declared failed after five seconds rather than
  fifteen. Fifteen was a hedge against mistaking a slow connection for a lost
  message. Now that a struggling connection says so on screen, the shorter
  deadline tells the user something is wrong while it is still worth their
  attention.

### Breaking

- Every user is signed out once and must authenticate again. The API now
  distinguishes access tokens from refresh tokens, and tokens issued before
  that distinction existed carry nothing to say which they are. The client
  already sent the right token to the right endpoint, so no code change was
  needed beyond re-authenticating.

### Fixed

- **A refused upload said only that it had failed.** The server distinguishes a
  file that is too large, one that fails a security scan, one whose format is
  refused, and a scanner that is temporarily down — but the composer reported
  all of them identically, which leaves somebody re-picking the same file and
  getting the same result. Only the last of those is worth retrying unchanged,
  and the message now says so.

- **The send button looked the same whether or not it would do anything.** It
  was live with an empty box and during a file upload. Pressing it mid-upload
  sent the message without the attachment and left the upload finishing into
  nothing, which reads as the file having been silently dropped. It is now
  disabled — and announced as disabled, since dimming says nothing to a screen
  reader — whenever there is nothing to send.

- **A misconfigured endpoint connected to the wrong place instead of failing.**
  Configuration arrives from `app.json` and from bundler substitution, neither
  of which is bound by the types this project declares, so a value that is not
  a string was always possible. One reached the WebSocket client, where a
  template literal turned it into `[object Object]` — a relative URL, which the
  browser resolved against whatever page was open. The reported failure named
  the Metro dev server and the route the user was standing on, and pointed
  nowhere near the API.

  Configured values are now accepted only when they are usable strings, with
  empty values and unexpanded `undefined`/`null` placeholders treated as
  absent, and both URLs must be absolute. A WebSocket URL whose scheme
  contradicts the API's, or which is missing the `/api/v1` prefix the API URL
  carries, is refused at startup in development rather than surfacing as a
  connection failure with no reason attached.

- **The client could fail to connect and never try again.** If no access token
  was available at the moment the socket was opened — which is the normal state
  for a fraction of a second on a cold start, while the stored session is still
  being restored — the client returned without creating a socket. No socket
  meant no close event, no close event meant no reconnect was ever scheduled,
  and the client sat inert for the rest of the session with nothing on screen
  to say so. Every message typed was queued and never sent. It now reports the
  state and retries, and a malformed socket URL — which throws rather than
  firing an error event — is caught and retried for the same reason.

- **Reconnecting could inherit a backoff earned somewhere else.** Retry delays
  double towards thirty seconds during an outage, and connecting again did not
  reset them or cancel the pending attempt. Opening a conversation could
  therefore mean waiting out a delay accumulated while the user was elsewhere
  in the app, with two attempts racing when it expired.

- **A sent message could sit marked "Sending…" forever.** Confirmation was
  matched only on the correlation id the server echoes back, so any message the
  server did not echo one for — one created through the REST endpoint, or a
  deployment that predates the field — was never recognised as delivered. It
  stayed dimmed, was declared failed after fifteen seconds, and told the user a
  message had been lost that had in fact arrived. An arriving message from the
  same sender with identical text now confirms the oldest unacknowledged copy,
  so identical messages sent in a row still resolve in the order they were
  sent, and a message from anyone else never consumes one.

  The send timeout is also cancelled once a message is confirmed. It was left
  to expire on its own, which was harmless in isolation but meant a long
  conversation accumulated one live timer for every message ever sent.

- **Scrolling up stopped loading older messages.** Whether more history existed
  was decided by counting cached messages against the total the server had
  reported. Live messages are written straight into the cache, so that count
  grew without any corresponding fetch; as soon as it caught up with the
  reported total, the conversation was declared fully loaded and scrolling up
  did nothing. The longer a conversation stayed open, the sooner it broke. It
  now depends on whether the last request came back short, which no cache
  mutation can fake.

  Older messages also no longer shift the view when they land — the reader
  scrolled up, a page arrived, and the message they were reading jumped away.

- **Timestamps rendered inconsistently or not at all.** `toLocaleTimeString`
  was used with formatting options, and the Intl support that backs it is not
  guaranteed to be present on Hermes; where it is absent the options are
  ignored and the whole date is returned instead of a time. Times are now
  formatted explicitly, so they read the same on every device, and an
  unparseable timestamp renders nothing rather than the words "Invalid Date".

  Conversations gained date separators, so it is possible to tell which day a
  message was sent on without opening it. Recent days are named rather than
  dated, because "Yesterday" is read faster than a date the reader has to work
  out.

### Removed

- The internal metadata printed under an expanded message: the sender's
  database id, the workspace id, the id of the message being replied to, and
  whether the message was a broadcast. All four were either raw identifiers
  that mean nothing to the person reading them or facts about how the message
  was routed rather than anything about the message. What remains is when it
  was sent, whether it has been edited, and how many people have seen it.

### Added

- Messages can be edited for fifteen minutes after sending. The composer loads
  the existing text so a word can be corrected rather than the message retyped,
  the change appears immediately and reverts if the server refuses it, and
  edited messages are marked as such for everyone in the conversation — a
  correction that only the author could see would be worse than no correction
  at all.

  An edit that changes nothing is discarded rather than sent, since it would be
  accepted and would mark the message as edited for every reader over text
  identical to what they had already seen.

- A sent message no longer disappears while it is in flight. Sending handed the
  frame to the socket and wrote nothing to the screen, so the message appeared
  only once the server echoed it back. The input cleared the instant send was
  pressed, which meant that on a slow connection the user's text left the
  screen with nothing to show it had been sent — and the natural response,
  retyping it, is what produced a duplicate when the socket recovered and both
  copies flushed. The message is now drawn immediately, dimmed and marked
  "Sending…", and settles in place when the server confirms it.

  Confirmation is matched on a per-send correlation id rather than on content
  and timestamp, which would have picked the wrong copy in the case that occurs
  most: the same short reply sent twice.

- A message composed while the connection is down is no longer silently
  swallowed. The socket queues anything sent while it is closed, which is the
  right behaviour, but it produced no signal at all — so a message sent during
  a blip looked delivered and was not. An unconfirmed message is now marked
  "Not sent" after fifteen seconds and can be retried by tapping it. The window
  is deliberately generous, because the reconnect backoff can legitimately take
  several seconds, and declaring a message failed that then arrives is worse
  than showing it in flight slightly too long.

  A retry sends under a fresh correlation id rather than reviving the old one,
  so a late confirmation of the first attempt cannot resolve the retry and
  leave the message delivered twice while the screen shows one.

  A failed message is kept on screen rather than removed. Deleting it would
  take the user's words away, which is the exact failure this work exists to
  prevent.

- Delivery state is announced to screen readers as part of the message rather
  than conveyed by dimming alone. A failed message previously read identically
  to a delivered one.

- The client and manager lists carried every defect the workspace list did:
  the search field was destroyed mid-keystroke, a request went out per
  character, the page number survived a search change, and the list emptied on
  every page turn. All four screens now share one implementation, so a fix
  reaches all of them and whichever list is written next.
- The manager list had no `keyExtractor`, so React fell back to array indices.
  On a paginated list that is a correctness bug rather than a warning: page two
  reuses page one's keys, so React treats row three as the same element it was
  and carries the previous row's state across.
- `Avatar` produced the wrong initials for anyone with a middle name — "Ada B
  Lovelace" gave "AB" instead of "AL" — and threw outright on a name containing
  a double space, because it indexed into a word without checking it was
  non-empty. A crash surfacing from an avatar is the last place anyone would
  look for it.
- Searching the workspace list destroyed the field being typed into. The screen
  replaced its entire body while loading, and the search box was part of that
  body, so each keystroke unmounted the input and dismissed the keyboard. Only
  the list is swapped now.
- Each keystroke in that search issued a request. Typing an eight-character
  name sent eight, seven of them already stale on arrival; the query is now
  debounced, as it already was elsewhere in the app.
- Refining a search while on a later page asked the server for page three of a
  result set that might have one, returning nothing for a query that matches.
  Paging resets when the search changes.
- Turning a page emptied the list before the next one arrived, because a new
  query key has no cached entry. The previous page is now held in place while
  the next loads, so paging reads as moving through a list rather than
  reloading the screen.
- Raw database identifiers were shown to users: "Client: 665f1a…" on every
  workspace row, plus "Workspace ID" and "Client ID" on two detail screens. An
  ObjectID gives the reader nothing to act on and signals that a part of the
  product was not meant for them. The detail screen resolves the client's name;
  the list drops the field, since the list endpoint returns only the id and
  resolving it would cost a request per row.
- The message inbox rendered every conversation at once. Its list sat inside a
  scrolling parent with `scrollEnabled={false}`, which defeats virtualisation,
  so a page size of 100 mounted a hundred rows to display the eight on screen.
- The "create workspace" control was a bare "+" glyph, which a screen reader
  announces as "plus" with no indication of what it creates. Pagination
  controls looked disabled without being announced as such.
- Reanimated could not be imported in a test. Its worklets runtime ships
  `.native.ts` files that assume a native module, and Jest's iOS default
  platform selected exactly those, so importing Reanimated anywhere failed the
  whole module rather than just the animation. `test/jestResolver.js` composes
  React Native's resolver with Reanimated's, since Jest accepts only one.
- Any test importing a screen would have failed. `lucide-react-native` resolves
  to an ESM bundle the preset's transform pattern does not match, so it reached
  the runtime as raw ESM and threw on its first `export`. Fourteen files already
  import lucide icons; none were under test, which is why nothing had surfaced
  it. Jest now resolves the CommonJS build the package already ships.
- `react-native-svg` is declared as a direct dependency. It is a native module
  and was reached only transitively through `lucide-react-native`, so every icon
  in the app depended on a hoisting decision nobody had made deliberately.
- Reading the theme outside its provider crashed rather than degraded. The
  context defaulted to `null!`, producing "cannot read property 'theme' of
  null" — an error naming neither the component nor the missing provider, and
  surfacing as a blank screen. It now falls back to the light palette: not a
  correct rendering, but a legible one.
- The `elevated` surface colour, which disagreed between the two places colour
  was defined. `tailwind.config.js` and `src/design-system/theme/colors.ts`
  each carried a full copy of the palette, and they had drifted: `elevated`
  was `#FCFCFD` in one and `#F8FAFC` in the other, and its dark counterpart
  disagreed outright (`#2C2C2E` against `#182239`). Nothing surfaced it,
  because a screen styled with `bg-elevated` and one styled with
  `theme.elevated` each looked plausible in isolation — the mismatch was only
  visible where the two sat side by side. Both now read from
  `src/design-system/theme/palette.js`, so the class-name and JavaScript
  styling paths cannot disagree again. `bg-elevated` and `bg-dark-elevated`
  therefore shift slightly; the design-system values were kept as the correct
  ones.

### Added

- `PaginatedListScreen`, the search-list-paginate pattern defined once. Four
  screens had implemented it independently and all four carried the same
  defects, which is the argument for extracting it more than the duplication
  was: each was written by copying the last, so a fix applied to one never
  reached the others.
- `Badge`, for states worth acting on. Status was previously body text —
  "Status: Active", "Invited: No" — at the same weight as the person's name, so
  a list of people read as a wall of words. Only the exceptions are drawn now;
  a badge on every row saying "Active" is noise that hides the rows that are
  not.
- `PersonRow`, replacing `ClientCard` and `ManagerCard`, which were identical
  apart from the word "client" or "manager".
- `SearchBar`, with autocorrect and autocapitalisation off. Both default to on
  and both are wrong for this product: the keyboard capitalises a surname
  mid-query and autocorrects surnames and tax identifiers into ordinary words,
  so the search looks for something the user did not type.
- `formatRelativeTime`, which renders a timestamp the way a person would say it
  and falls back to a date past a week, because "43 days ago" is a number
  nobody converts into anything useful. Timestamps slightly in the future are
  treated as now rather than counting backwards — device clocks drift, and "in
  -3 seconds" makes an otherwise careful product look unreliable.
- Empty states that distinguish an empty list from an unmatched search, and
  offer the action that would fill it where the user has permission to take it.
- `Skeleton` and `SkeletonList`, placeholders shaped like the content that is
  loading. Lists previously showed a centred spinner, which says only that
  something is happening and occupies a different amount of space than the
  content, so the screen jumped the moment data arrived. The pulse runs on the
  UI thread through Reanimated — a JavaScript-driven loading animation stutters
  precisely when it is on screen, because the JavaScript thread is busy doing
  the work being waited on, and that reads as the app having hung.
- `EmptyState`, for a list that succeeded and returned nothing. Where an action
  exists that would fill the list, it is offered, which turns a dead end into
  the start of a path. `QueryState` now renders it, so the distinction between
  "you have nothing outstanding" and "we could not reach the server" is drawn
  by one component rather than by each screen.
- `ListItem`, the row shape that had been written out by hand on nearly every
  list screen with slightly different padding, truncation and press feedback.
  Title and subtitle are pinned to one line: letting them wrap makes row height
  depend on content, which gives an otherwise uniform list a ragged rhythm and
  costs a virtualised list the constant row height it needs to estimate scroll
  position.
- `PressableScale`, a press that compresses rather than dims. Touch has no
  hover, so the press itself is the only moment a user can be told their finger
  landed on the right thing, and an opacity drop reads as the element becoming
  unavailable rather than yielding.
- `src/design-system/theme/palette.js`, the single definition of colour.
  Plain CommonJS because its two consumers cannot share a module format —
  components reach it through `colors.ts`, while `tailwind.config.js` requires
  it at build time, before any TypeScript transform runs. Tailwind's colour map
  is now generated from it rather than written out by hand, which also exposed
  `divider`, `overlay` and the brand light/dark variants: those tokens existed
  in the design system but the hand-written map had omitted them, so no class
  name could reach them.
- Tokens for states that were previously improvised per screen: `primarySubtle`
  and `secondarySubtle` for tinted brand fills, `infoSubtle` / `successSubtle`
  / `warningSubtle` / `dangerSubtle` for status backgrounds, `textInverted`
  for text on a brand surface, `scrim` for modal backdrops, and `skeleton` /
  `skeletonHighlight` so loading placeholders are designed rather than built
  from whichever grey was nearest.
- Signing out now ends the session on the server. Previously it deleted the
  client's own copy of the credential and nothing else, so a refresh token
  captured before sign-out kept working for up to thirty days afterwards. The
  client now calls `POST /auth/logout` before clearing local state, sending
  only the refresh token, so the revocation still succeeds when the access
  token has already expired — which is the most common reason to be signing
  out at all.
- A test suite, where there was none. Eight suites covering session teardown,
  encrypted storage, API error normalisation, idempotency keys and the query
  state components.
- `QueryState`, a single component for the loading, error and empty states of a
  TanStack Query result. Each screen had previously spelled these out by hand,
  which is why several of them disagreed about what an empty list should look
  like and a few rendered nothing at all on failure.
- Error boundaries around the navigation tree, so a render failure in one
  screen shows a recoverable message instead of unmounting the application to a
  blank screen.

### Changed

- Tokens and cached user records moved to encrypted MMKV storage. They were
  previously readable by anything with access to the application's sandbox,
  which on a rooted or jailbroken device is not a high bar.
- `endSession` reads the refresh token before it clears anything, so the server
  call has something to revoke, and fires that call without awaiting it. Local
  teardown is immediate and unconditional: a user who asks to be signed out is
  signed out on the device whether or not the network agrees.

### Fixed

- **Messaging stopped working after any connection drop.** The socket set
  itself to null on close and never retried, so a backgrounded app, a brief
  loss of signal or a server restart ended messaging for the rest of the
  session with no indication anything was wrong. The client now reconnects with
  exponential backoff, from one second up to thirty, and treats a deliberate
  sign-out as final rather than something to retry.
- **A reconnected socket was subscribed to nothing.** Joining a workspace was
  sent once at mount. The server has no memory of a connection that has gone
  away, so even when the socket did come back it received nothing. Room
  membership is now held by the client and replayed on every reconnect, before
  any queued events are flushed, since an event addressed to a room the server
  does not think you are in is discarded.
- **Arriving messages were filed among the oldest.** The API returns messages
  newest first, so page 0 holds the most recent batch, but incoming messages
  were appended to the last page — the furthest back in the history. A message
  that had genuinely arrived was buried where nobody would look for it.
- **The conversation read backwards.** The flattened pages were reversed before
  being handed to an inverted list, which put the oldest message at the bottom
  and the newest at the top.
- A message for one workspace could be written into another workspace's cached
  conversation, because the socket is shared between screens and the incoming
  event was not checked against the conversation being viewed.
- A duplicate message is now ignored rather than rendered twice. The sender is
  a member of the room they broadcast to, and a reconnect can race a refetch,
  so the same message legitimately arrives more than once.
- A malformed frame no longer throws inside the socket's message handler, which
  would have taken down the message pump and ended messaging for the session.

- Credentials were written to the console. Request and response logging
  included the `Authorization` header and the body of the login response, so
  access and refresh tokens were recorded in plain text anywhere logs were
  collected.
- `normalizeApiError` reported a generic message for responses that carried a
  specific one, so users saw "Something went wrong" for errors the API had
  explained.

### Security

- Sign-out is now genuinely a revocation rather than a local deletion.
- No credential reaches the logs.

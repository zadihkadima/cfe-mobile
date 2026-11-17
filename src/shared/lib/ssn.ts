/**
 * The shape both reveal endpoints answer with.
 *
 * `expires_in_seconds` is the server's advice on how long the number may stay
 * on screen, not a deadline it enforces: once the value is in the response the
 * server cannot take it back, so the client is the one that has to honour the
 * countdown. See the backend's `common/ssn` package, which names the same
 * lifetime and the same reasoning.
 */
export type SsnRevealResponse = {
  social_security_number: string;
  expires_in_seconds: number;
};

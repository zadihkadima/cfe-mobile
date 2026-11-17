import { api } from "@/core/api/client";

export type SsnRevealResponse = {
  social_security_number: string;
  expires_in_seconds: number;
};

/**
 * Releases the signed-in account's full SSN, re-authenticated by password.
 *
 * The password travels in the request body rather than as a credential in the
 * URL, which is what makes this a deliberate act rather than a link anyone
 * holding the session token can replay. The server records the disclosure
 * either way, so the number this returns is the one and only copy the client
 * ever holds: nothing is cached, and the value is dropped from state the
 * moment the countdown the response carries reaches zero.
 */
export const revealMySsn = async (
  password: string,
): Promise<SsnRevealResponse> => {
  const res = await api.post("/auth/me/ssn/reveal", { password });
  return res.data;
};

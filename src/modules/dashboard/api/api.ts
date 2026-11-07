import { api } from "@/core/api/client";

import { OutstandingWorkResponse } from "./types";

/**
 * Work waiting on the signed-in person, across every workspace they belong to.
 *
 * No workspace argument by design: the server decides the scope from the token
 * alone. Asking per workspace would mean one request per module per engagement
 * -- a manager on a dozen engagements would issue forty-eight requests to draw
 * one screen.
 */
export const getOutstandingWork = async (limit?: number): Promise<OutstandingWorkResponse> => {
  // Typed on the call rather than on the return. `api.get` resolves to `any`,
  // so annotating only the function signature would let any shape through and
  // the mismatch would surface as an undefined field at render time.
  const res = await api.get<OutstandingWorkResponse>("/dashboard", {
    params: limit ? { limit } : undefined,
  });

  return res.data;
};

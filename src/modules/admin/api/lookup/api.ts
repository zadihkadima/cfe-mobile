import { api } from "@/core/api/client";

import { LookupResult } from "./types";

/**
 * Asks what an identifier names.
 *
 * Resolves to null for an id that names nothing, rather than throwing. An
 * empty search is an ordinary outcome here -- an id may be mistyped, or name a
 * record since deleted -- and treating it as an error would put a red banner
 * in front of a search that simply came back empty.
 *
 * Every other failure is left to throw. A refused or unreachable request is
 * not the same as an id that matched nothing, and reporting them alike would
 * tell an administrator a record does not exist when the truth is that nobody
 * asked.
 */
export const lookupById = async (id: string): Promise<LookupResult | null> => {
  try {
    const res = await api.get(`/admin/lookup/${encodeURIComponent(id.trim())}`);

    return res.data;
  } catch (error) {
    const status = (error as { response?: { status?: number } })?.response?.status;

    // 404 is "no such record". 400 is "that is not an id at all" -- a shape
    // the server rejects before searching, and one the caller reaches by
    // pasting something that was never an identifier. Both mean the search
    // found nothing, which is what the screen has to show either way.
    if (status === 404 || status === 400) return null;

    throw error;
  }
};

/**
 * Case-insensitive client search over first name, last name and client code.
 *
 * The server's own search does not promise `client_code`, and a firm looking up
 * "the client whose code is C-1042" is the common case, not an edge one, so the
 * match is guaranteed here rather than left to the endpoint.
 *
 * Shared by the admin and manager client lists: both show the same rows, so
 * both must search them the same way.
 */
export function filterClientsBySearch<T extends {
  first_name: string;
  last_name: string;
  client_code?: string | null;
}>(items: T[], search: string): T[] {
  const term = search.trim().toLowerCase();

  if (!term) {
    return items;
  }

  return items.filter((client) => {
    const haystack = [
      client.first_name,
      client.last_name,
      client.client_code ?? "",
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(term);
  });
}

export const queryKeys = {
  dashboard: {
    all: ["dashboard"] as const,

    // Keyed by limit so asking for more rows fetches rather than re-reading
    // the shorter list already in the cache.
    outstanding: (limit?: number) => ["dashboard", "outstanding", limit ?? null] as const,
  },

  history: {
    all: ["history"] as const,

    // Keyed by the whole parameter object: the trail is scoped per subject,
    // and sharing a cache entry between two subjects would show one
    // client's activity under another's name.
    list: (params: unknown) => ["history", params] as const,

    // Suggestions are keyed by the term alone. They are a directory lookup,
    // independent of whatever filters the trail below is currently under, so
    // sharing them across those filters is the whole point.
    suggest: (term: string) => ["history", "suggest", term] as const,
  },

  firm: {
    all: ["firm"] as const,
    admins: ["firm", "admins"] as const,
  },

  sessions: {
    all: ["sessions"] as const,
  },

  reports: {
    // Keyed by range, so changing the dates fetches rather than showing the
    // previous window's figures under the new heading.
    summary: (from: string, to: string) => ["reports", "summary", from, to] as const,
  },

  workspacePins: {
    all: ["workspace-pins"] as const,
  },

  lookup: {
    all: ["lookup"] as const,

    // Keyed by the identifier alone. What an id names does not change between
    // one screen and the next, so a second search for the same id is answered
    // from the cache instead of walking every collection again.
    detail: (id: string) => ["lookup", id] as const,
  },

  managers: {
    all: ["managers"] as const,

    list: (params?: unknown) =>
      ["managers", params] as const,

    detail: (id: string) =>
      ["managers", id] as const,
  },

  clients: {
    all: ["clients"] as const,

    list: (params?: unknown) =>
      ["clients", params] as const,

    detail: (id: string) =>
      ["clients", id] as const,
  },

  workspaces: {
    all: ["workspaces"] as const,

    list: (params?: unknown) =>
      ["workspaces", params] as const,

    detail: (id: string) =>
      ["workspaces", id] as const,

    members: (id: string) =>
      ["workspaces", id, "members"] as const,
  },

  messages: {
    all: ["messages"] as const,

    workspace: (
      workspaceId: string,
    ) =>
      [
        "messages",
        workspaceId,
      ] as const,
  },

  tasks: {
    all: ["tasks"] as const,

    workspace: (
      workspaceId: string,
    ) =>
      [
        "tasks",
        workspaceId,
      ] as const,
  },

  checklists: {
    all: ["checklists"] as const,

    workspace: (
      workspaceId: string,
    ) =>
      [
        "checklists",
        workspaceId,
      ] as const,
  },

  fileRequests: {
    all: ["file-requests"] as const,

    workspace: (
      workspaceId: string,
    ) =>
      [
        "file-requests",
        workspaceId,
      ] as const,
  },

  signatureRequests: {
    all: ["signature-requests"] as const,

    workspace: (
      workspaceId: string,
    ) =>
      [
        "signature-requests",
        workspaceId,
      ] as const,
  },

  irsSubmissions: {
    all: ["irs-submissions"] as const,

    workspace: (
      workspaceId: string,
    ) =>
      [
        "irs-submissions",
        workspaceId,
      ] as const,
  },

  questionnaires: {
    all: ["questionnaires"] as const,

    workspace: (
      workspaceId: string,
    ) =>
      [
        "questionnaires",
        workspaceId,
      ] as const,
  },

  notifications: {
    all: ["notifications"] as const,
    unreadByWorkspace: ["notifications", "unread-by-workspace"] as const,
  },
};
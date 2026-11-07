import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/core/query/queryKeys";

import {
  getWorkspaces,
} from "@/modules/workspace/api/api";

import {
  ListWorkspaceParams,
} from "@/modules/workspace/api/types";

export const useWorkspaces = (
  params: ListWorkspaceParams
) => {
  return useQuery({
    queryKey: queryKeys.workspaces.list(
      params
    ),

    queryFn: () =>
      getWorkspaces(params),

    // Page and search changes produce a new query key, and without this the
    // cache has no entry for it, so `data` becomes undefined and the list
    // unmounts. The user sees the results they were reading vanish and be
    // replaced by a loading state on every keystroke and every page turn.
    // Holding the previous page in place while the next one loads is what
    // makes paging feel like moving through a list rather than reloading a
    // screen; `isPlaceholderData` is available to dim it if a caller wants to
    // show that the content is one step behind.
    placeholderData: keepPreviousData,
  });
};

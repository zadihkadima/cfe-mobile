import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";

import { queryKeys } from "@/core/query/queryKeys";
import { RootState } from "@/core/store";

import { getNotifications } from "../api/api";

export function useNotifications() {
  const signedIn = useSelector((state: RootState) => !!state.auth.user);
  const hydrated = useSelector((state: RootState) => state.auth.hydrated);

  return useQuery({
    queryKey: queryKeys.notifications.all,
    queryFn: getNotifications,
    enabled: hydrated && signedIn,
  });
}
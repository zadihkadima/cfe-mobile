import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/core/api/client";
import { tokenService } from "@/core/auth/tokenService";
import { queryKeys } from "@/core/query/queryKeys";

export type ActiveSession = {
  id: string;
  device: string;
  current: boolean;
  created_at: string;
  last_used_at: string;
  expires_at: string;
};

/**
 * The sessions this account is signed in on.
 *
 * The current refresh token is sent so the server can mark which row is this
 * device. It is already a credential the server holds a hash of, and without
 * it every row reads as "not current" -- which is how somebody ends the
 * session they are using and cannot explain why they were signed out.
 */
export function useSessions() {
  return useQuery({
    queryKey: queryKeys.sessions.all,
    queryFn: async () => {
      const { data } = await api.get<{ sessions: ActiveSession[] }>("/auth/sessions", {
        params: { current_refresh_token: tokenService.getRefreshToken() ?? undefined },
      });

      return data.sessions;
    },
  });
}

export function useRevokeSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/auth/sessions/${id}`);
    },

    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
    },
  });
}

export function useRevokeAllSessions() {
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{ revoked: number }>("/auth/sessions/revoke-all");
      return data;
    },
  });
}

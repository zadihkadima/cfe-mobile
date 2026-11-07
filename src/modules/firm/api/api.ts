import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/core/api/client";
import { queryKeys } from "@/core/query/queryKeys";

import { FirmAdmin, FirmSettings, FirmSettingsUpdate } from "./types";

export function useFirmSettings() {
  return useQuery({
    queryKey: queryKeys.firm.all,
    queryFn: async () => {
      const { data } = await api.get<FirmSettings>("/firm");
      return data;
    },
  });
}

export function useUpdateFirmSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (update: FirmSettingsUpdate) => {
      const { data } = await api.patch<FirmSettings>("/firm", update);
      return data;
    },

    onSuccess: (saved) => {
      // The server's copy replaces the local one rather than the request
      // doing so. They differ whenever the server trimmed or rejected part of
      // what was sent, and showing the request back would report a value that
      // was never stored.
      queryClient.setQueryData(queryKeys.firm.all, saved);
    },
  });
}

/**
 * Who holds admin access.
 *
 * Admin-only on the server, so this is only requested from the settings screen
 * and only when the viewer can act on it.
 */
export function useFirmAdmins(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.firm.admins,
    enabled,
    queryFn: async () => {
      const { data } = await api.get<{ items: FirmAdmin[]; total: number }>(
        "/admin/admins",
        { params: { page: 1, limit: 100 } },
      );
      return data;
    },
  });
}

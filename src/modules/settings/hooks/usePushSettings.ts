import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getPushSettings,
  PushSettings,
  savePushSettings,
} from "../api/push";

export const pushSettingsKey = ["push", "settings"] as const;

export function usePushSettings() {
  return useQuery({
    queryKey: pushSettingsKey,
    queryFn: getPushSettings,
  });
}

/**
 * Saves one switch.
 *
 * The whole map is sent rather than a single kind, because the server stores
 * the map it is given: sending one switch would erase every other choice. That
 * is also why the current settings have to be read before this can be used.
 *
 * The server's answer replaces the cache rather than the optimistic value being
 * kept, because the server drops kinds this role is not offered -- so what was
 * asked for and what was stored are not always the same, and the screen should
 * show what was stored.
 */
export function useSavePushSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (kinds: Record<string, boolean>) => savePushSettings(kinds),

    /*
     * Applied immediately so a switch moves under the finger.
     *
     * A switch that waits for a round trip before moving feels broken, and the
     * usual response is to tap it again -- which sends the opposite value and
     * leaves the setting on whatever the second request happened to say.
     */
    onMutate: async (kinds) => {
      await queryClient.cancelQueries({ queryKey: pushSettingsKey });

      const previous = queryClient.getQueryData<PushSettings>(pushSettingsKey);

      if (previous) {
        queryClient.setQueryData<PushSettings>(pushSettingsKey, {
          ...previous,
          kinds,
        });
      }

      return { previous };
    },

    // Put back what was there. Leaving the optimistic value would show a switch
    // as on while the server has it off, and nothing would ever correct it.
    onError: (_error, _kinds, context) => {
      if (context?.previous) {
        queryClient.setQueryData(pushSettingsKey, context.previous);
      }
    },

    onSuccess: (settings) => {
      queryClient.setQueryData(pushSettingsKey, settings);
    },
  });
}

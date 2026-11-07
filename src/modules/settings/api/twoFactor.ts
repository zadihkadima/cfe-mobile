import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/core/api/client";

export type SetTwoFactorInput = {
  enabled: boolean;

  /**
   * Required only to turn it off.
   *
   * A valid session is not proof enough to weaken the protection that session
   * is guarded by: someone holding a stolen token would otherwise switch the
   * second factor off and keep the account for good. Turning it on needs
   * nothing, because raising your own defences harms nobody and asking for a
   * password discourages the thing we want people to do.
   */
  currentPassword?: string;
};

export class TwoFactorPasswordError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TwoFactorPasswordError";
  }
}

export function useSetTwoFactor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ enabled, currentPassword }: SetTwoFactorInput) => {
      try {
        const { data } = await api.patch("/auth/two-factor", {
          enabled,
          current_password: currentPassword,
        });

        return data as { two_factor_enabled: boolean };
      } catch (error: any) {
        const code = error?.response?.data?.code;

        // Distinguished from a general failure so the screen can ask for the
        // password rather than showing "something went wrong" beside a switch
        // that has not moved, which reads as the app being broken.
        if (code === "password_required" || code === "invalid_password") {
          throw new TwoFactorPasswordError(
            error?.response?.data?.error ?? "That password is not correct.",
          );
        }

        throw error;
      }
    },

    onSuccess: () => {
      // The profile carries the flag the switch renders from. Without this the
      // switch springs back on the next read and looks as though the change
      // was rejected.
      void queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

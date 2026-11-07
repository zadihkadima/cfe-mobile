import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";

import { api } from "@/core/api/client";

import { completeSignIn, rememberPendingLogin } from "./useTwoFactor";

type LoginResult =
  | { requires_two_factor: true; challenge_id: string; email: string }
  | { access_token: string; refresh_token: string; user: { role: string } };

export const useLogin = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await api.post<LoginResult>("/auth/login", data);

      // The password is kept only long enough to support a resend on the next
      // screen. It is discarded the moment the sign-in completes.
      rememberPendingLogin(data.email, data.password);

      return res.data;
    },

    onSuccess: (data) => {
      // Distinguished by the flag rather than by a missing token. Treating an
      // absent access_token as "needs a code" would also swallow a malformed
      // response and send the user to a prompt with no challenge behind it.
      if ("requires_two_factor" in data && data.requires_two_factor) {
        router.push({
          pathname: "/auth/two-factor",
          params: { challenge: data.challenge_id, email: data.email },
        });

        return;
      }

      completeSignIn(data as Extract<LoginResult, { access_token: string }>, router);
    },
  });
};

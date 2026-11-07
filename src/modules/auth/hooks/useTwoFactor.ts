import { useMutation } from "@tanstack/react-query";

import { useRouter } from "expo-router";

import { api } from "@/core/api/client";
import { tokenService } from "@/core/auth/tokenService";
import { authStorage } from "@/core/storage/authStorage";
import { store } from "@/core/store";
import { setUser } from "@/core/store/authSlice";

/**
 * The credentials that produced the pending challenge.
 *
 * Held in memory only, never written to storage. A resend needs the password
 * again -- the server requires it so the endpoint cannot be used to mail codes
 * by guessing at challenge ids -- but a password that survives to disk to
 * support a button is a worse trade than asking the user to start over.
 */
let pending: { email: string; password: string } | null = null;

export function rememberPendingLogin(email: string, password: string) {
  pending = { email, password };
}

export function forgetPendingLogin() {
  pending = null;
}

/**
 * Completes a sign-in once the tokens arrive.
 *
 * Shared with the plain login path so the two cannot disagree about what
 * signing in means -- a copy in each is how one of them ends up not storing
 * the user, and the app then works until the next cold start.
 */
export function completeSignIn(
  data: { access_token: string; refresh_token: string; user: { role: string } },
  router: ReturnType<typeof useRouter>,
) {
  tokenService.setTokens(data.access_token, data.refresh_token);
  authStorage.setUser(data.user);
  store.dispatch(setUser(data.user));

  forgetPendingLogin();

  if (data.user.role === "admin") {
    router.replace("/user/admin");
  } else if (data.user.role === "manager") {
    router.replace("/user/manager");
  } else {
    router.replace("/user/client");
  }
}

export function useVerifyTwoFactor() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (body: { challenge_id: string; code: string }) => {
      const { data } = await api.post("/auth/two-factor/verify", body);
      return data;
    },

    onSuccess: (data) => completeSignIn(data, router),
  });
}

export function useResendTwoFactor() {
  return useMutation({
    mutationFn: async () => {
      if (!pending) {
        // Better than a request that will certainly be refused: the message
        // tells the user what to do, where a 401 from the server would read
        // as a wrong password they never typed.
        throw new Error("Start again from the sign-in screen to get a new code.");
      }

      const { data } = await api.post("/auth/two-factor/resend", pending);
      return data;
    },
  });
}

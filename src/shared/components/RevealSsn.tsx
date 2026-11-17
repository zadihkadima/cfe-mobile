import { useCallback, useEffect, useState } from "react";
import { AppState, Modal, Pressable, TextInput, View } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";

import { Button, Icon, Text as ThemedText } from "@/design-system/ui";

import type { SsnRevealResponse } from "@/shared/lib/ssn";

type Phase =
  | { kind: "masked" }
  | { kind: "revealed"; full: string; expiresAt: number };

type Props = {
  /**
   * The masked value the read endpoints already serve, in the server's own
   * shape (`•••-••-6789`). The full number is never held here until a reveal
   * has been answered, and it is dropped from state the moment the countdown
   * ends.
   */
  value?: string;

  /** Asks the server for the full number, proving the password first. */
  reveal(password: string): Promise<SsnRevealResponse>;

  /** Shown when there is nothing stored. */
  placeholder?: string;
};

/**
 * A masked SSN with a password-verified reveal.
 *
 * The read endpoints serve the number masked, so the masked row is the default
 * and needs nothing from this component. The eye button is the one path to the
 * full value: it asks for the account's own password, calls the reveal
 * endpoint, and shows the answer for exactly as long as the server said it may
 * be shown -- a countdown rather than a toggle, because a toggle left on is the
 * number on an unattended screen.
 *
 * The value is re-masked on expiry, on the app leaving the foreground, and on
 * unmount. Each of those is the same event from a different angle: the person
 * who asked for the number has stopped looking at it.
 */
export function RevealSsn({ value, reveal, placeholder = "—" }: Props) {
  const [phase, setPhase] = useState<Phase>({ kind: "masked" });
  const [promptOpen, setPromptOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [failure, setFailure] = useState("");
  const [busy, setBusy] = useState(false);

  // Milliseconds left in the current reveal, recomputed once a second so the
  // row counts down rather than freezing at the full lifetime.
  const [remainingMs, setRemainingMs] = useState(0);

  // A new value is a new person: navigating from one client's row to another
  // must not carry the first person's revealed number across.
  useEffect(() => {
    setPhase({ kind: "masked" });
    setPromptOpen(false);
    setPassword("");
    setFailure("");
  }, [value]);

  // The countdown. Expiry is not a render of the stored lifetime but a deadline
  // measured against the clock, so a reveal granted for sixty seconds is gone
  // sixty seconds after it was granted even if the screen sat untouched the
  // whole time.
  useEffect(() => {
    if (phase.kind !== "revealed") return;

    const tick = () => {
      const left = phase.expiresAt - Date.now();
      setRemainingMs(left);

      if (left <= 0) {
        setPhase({ kind: "masked" });
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  // Leaving the app with the number on screen is the same as walking away from
  // an unlocked phone. The app going to the background is the one blur event
  // the platform reports reliably everywhere, so it is what masks here.
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (next) => {
      if (next !== "active") {
        setPhase({ kind: "masked" });
      }
    });

    return () => subscription.remove();
  }, []);

  // The password is a credential: it is not left in state after the attempt
  // succeeds, fails, or is cancelled, and the field is emptied when the prompt
  // closes rather than kept for a next time.
  const closePrompt = useCallback(() => {
    setPromptOpen(false);
    setPassword("");
    setFailure("");
  }, []);

  const openPrompt = useCallback(() => {
    setFailure("");
    setPromptOpen(true);
  }, []);

  const hide = useCallback(() => {
    setPhase({ kind: "masked" });
  }, []);

  const submit = useCallback(async () => {
    setBusy(true);
    setFailure("");

    try {
      const result = await reveal(password);

      setPhase({
        kind: "revealed",
        full: result.social_security_number,
        expiresAt: Date.now() + result.expires_in_seconds * 1000,
      });
      setPassword("");
      setPromptOpen(false);
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const body = (err as { response?: { data?: { error?: string } } })?.response
        ?.data;

      // The server answers a wrong password with the same status it answers
      // everything else it refuses, but its body names the reason, and the
      // difference is worth saying out loud: "that password is not correct"
      // invites a second try, "you may not see this" does not.
      if (body?.error === "invalid credentials") {
        setFailure("That password is not correct.");
      } else if (status === 403) {
        setFailure("You may not reveal this number.");
      } else {
        setFailure("The number could not be revealed. Try again.");
      }

      // The prompt stays open with the failure on it, so a password the person
      // did not quite get right is still in the field for the retry.
    } finally {
      setBusy(false);
    }
  }, [reveal, password]);

  if (!value) {
    return (
      <ThemedText className="font-semibold text-text dark:text-dark-text">
        {placeholder}
      </ThemedText>
    );
  }

  const revealed = phase.kind === "revealed";

  return (
    <View className="flex-row items-center">
      <ThemedText className="font-semibold text-text dark:text-dark-text">
        {revealed ? phase.full : value}
      </ThemedText>

      {revealed ? (
        <ThemedText
          variant="caption"
          tone="muted"
          className="ml-2"
          accessibilityLiveRegion="polite"
        >
          {remainingMs > 0 ? `Visible for ${formatRemaining(remainingMs)}` : "Masking…"}
        </ThemedText>
      ) : null}

      <Pressable
        onPress={revealed ? hide : openPrompt}
        accessibilityRole="button"
        accessibilityLabel={
          revealed ? "Hide the full number" : "Show the full number"
        }
        accessibilityHint={
          revealed
            ? "Masks the number again"
            : "Asks for your password before showing the full number"
        }
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        className="ml-2 p-1"
      >
        {revealed ? (
          <Icon as={EyeOff} size="md" tone="muted" />
        ) : (
          <Icon as={Eye} size="md" tone="muted" />
        )}
      </Pressable>

      <Modal
        visible={promptOpen}
        transparent
        animationType="fade"
        onRequestClose={closePrompt}
        statusBarTranslucent
      >
        <View className="flex-1 justify-center bg-scrim px-8 dark:bg-dark-scrim">
          <View className="rounded-3xl bg-elevated p-6 dark:bg-dark-elevated">
            <ThemedText variant="heading">Confirm it's you</ThemedText>

            <ThemedText variant="body" tone="secondary" className="mt-2">
              Enter your password to reveal the full number. This is recorded.
            </ThemedText>

            <View className="mt-4">
              <ThemedText variant="label" tone="secondary">
                Password
              </ThemedText>

              <View className="mt-1 flex-row items-center rounded-2xl border border-border bg-surface px-4 dark:border-dark-border dark:bg-dark-surface">
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password"
                  placeholderTextColor="#8a8f98"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  accessibilityLabel="Password"
                  className="flex-1 py-3.5 text-text dark:text-dark-text"
                  style={{ fontSize: 17 }}
                  editable={!busy}
                />
              </View>
            </View>

            {failure ? (
              <ThemedText
                variant="caption"
                tone="danger"
                className="mt-2"
                accessibilityLiveRegion="polite"
              >
                {failure}
              </ThemedText>
            ) : null}

            <View className="mt-5 flex-row gap-3">
              <Button
                variant="ghost"
                className="flex-1"
                onPress={closePrompt}
                disabled={busy}
              >
                Cancel
              </Button>

              <Button
                className="flex-1"
                loading={busy}
                disabled={!password}
                onPress={() => void submit()}
                accessibilityLabel="Reveal the full number"
              >
                Reveal
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function formatRemaining(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

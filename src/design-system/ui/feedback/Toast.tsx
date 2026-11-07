import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AccessibilityInfo, Pressable, View } from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react-native";

import { Icon } from "../display/Icon";
import { Text } from "../typography/Text";

export type ToastTone = "info" | "success" | "warning" | "danger";

interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
  action?: { label: string; onPress(): void };
}

interface ToastContextValue {
  show(message: string, options?: { tone?: ToastTone; action?: Toast["action"] }): void;
}

const ToastContext = createContext<ToastContextValue>({
  // A no-op rather than a throw. A confirmation that fails to appear is a
  // smaller failure than a screen that crashes because a provider is missing
  // from a test harness or a storybook.
  show: () => {},
});

const toneStyles: Record<ToastTone, { fill: string; icon: typeof Info }> = {
  info: { fill: "bg-info-subtle dark:bg-dark-info-subtle", icon: Info },
  success: { fill: "bg-success-subtle dark:bg-dark-success-subtle", icon: CheckCircle2 },
  warning: { fill: "bg-warning-subtle dark:bg-dark-warning-subtle", icon: AlertTriangle },
  danger: { fill: "bg-danger-subtle dark:bg-dark-danger-subtle", icon: XCircle },
};

const toneToIconTone: Record<ToastTone, "info" | "success" | "warning" | "danger"> = {
  info: "info",
  success: "success",
  warning: "warning",
  danger: "danger",
};

const VISIBLE_MS = 3600;

/**
 * Brief confirmation that something happened.
 *
 * The app previously reported outcomes with `Alert.alert`, which stops the
 * user, demands a tap, and is indistinguishable from a question. "Task
 * created" does not need acknowledging -- it needs to be visible for a moment
 * and then get out of the way.
 *
 * Toasts enter from the top rather than the bottom. The bottom of the screen
 * is where the keyboard, the tab bar and the primary action live, and a
 * message that covers the button the user just pressed hides the very thing
 * they are looking at to confirm the result.
 *
 * Each toast is also announced. A visual-only confirmation tells a screen
 * reader user nothing, which leaves them unsure whether the action worked.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();

  const [toasts, setToasts] = useState<Toast[]>([]);

  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback<ToastContextValue["show"]>(
    (message, options) => {
      const id = nextId.current++;

      const toast: Toast = {
        id,
        message,
        tone: options?.tone ?? "info",
        action: options?.action,
      };

      // Only one at a time. A stack of toasts covers the screen it is
      // reporting on, and by the third the user is reading history rather
      // than the result of what they just did.
      setToasts([toast]);

      AccessibilityInfo.announceForAccessibility?.(message);

      setTimeout(() => dismiss(id), VISIBLE_MS);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <View
        style={{ top: insets.top + 8, pointerEvents: "box-none" }}
        className="absolute left-0 right-0 z-50 px-4"
      >
        {toasts.map((toast) => {
          const style = toneStyles[toast.tone];

          return (
            <Animated.View
              key={toast.id}
              entering={FadeInUp.duration(220)}
              exiting={FadeOutUp.duration(180)}
              accessibilityLiveRegion="polite"
              className={`flex-row items-center rounded-2xl border border-border px-4 py-3 dark:border-dark-border ${style.fill}`}
            >
              <Icon as={style.icon} size="lg" tone={toneToIconTone[toast.tone]} />

              <Text variant="label" className="ml-3 flex-1">
                {toast.message}
              </Text>

              {toast.action ? (
                <Pressable
                  onPress={() => {
                    toast.action?.onPress();
                    dismiss(toast.id);
                  }}
                  accessibilityRole="button"
                  hitSlop={12}
                  className="ml-3 active:opacity-60"
                >
                  <Text variant="label" tone="primary" weight="600">
                    {toast.action.label}
                  </Text>
                </Pressable>
              ) : null}
            </Animated.View>
          );
        })}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

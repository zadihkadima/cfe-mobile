import { Stack } from "expo-router";
import { Provider } from "react-redux";
import { store } from "@/core/store";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/core/query/queryClient";

import { useEffect } from "react";
import { bootstrapAuth } from "@/core/auth/bootstrapAuth";
import "./global.css";
import { ThemeProvider } from "@/design-system/theme/ThemeProvider"; 
import { ToastProvider } from "@/design-system/ui/feedback/Toast";
import { GlobalNotification } from "@/core/components/GlobalNotification";
import { ErrorBoundary } from "@/core/errors/ErrorBoundary";
import { NotificationRealtimeSync } from "@/modules/notification/components/NotificationRealtimeSync";
import { PushRegistration } from "@/modules/settings/components/PushRegistration";

export default function Layout() {

  useEffect(() => {
    // Deliberately not awaited: an effect callback cannot be async, and the
    // rendering below must not block on session restoration. bootstrapAuth
    // handles its own failures and always dispatches setHydrated in a finally
    // block, so a rejection here would represent a defect in that function
    // rather than an expected outcome to handle at the call site.
    void bootstrapAuth();
  }, []);

  return (

    <ThemeProvider>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          {/*
            Toasts sit above the navigator so a confirmation survives the
            screen that triggered it. Mounting the provider inside a screen
            would unmount the message along with the screen -- which is
            precisely the case that needs confirming, since the user has
            usually navigated away by the time the request returns.
          */}
          <ToastProvider>
            {/*
              The navigator is wrapped separately from the global chrome below it.
              A render error inside a screen therefore replaces only the screen
              area, leaving notifications and the realtime sync mounted, and an
              error in one of those cannot blank the navigator.
            */}
            <ErrorBoundary boundaryName="navigator">
              <Stack screenOptions={{ headerShown: false }} />
            </ErrorBoundary>

            <ErrorBoundary
              boundaryName="global-chrome"
              fallback={() => null}
            >
              <GlobalNotification />
              <NotificationRealtimeSync />

              {/* Inside this boundary on purpose: asking the operating system
                  for permission is the sort of thing that fails on a device
                  nobody tested on, and it must not be able to blank the app. */}
              <PushRegistration />
            </ErrorBoundary>
          </ToastProvider>
        </QueryClientProvider>
      </Provider>
    </ThemeProvider>
  );
}
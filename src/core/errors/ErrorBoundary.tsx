import React, { Component, ErrorInfo, ReactNode } from "react";
import { View } from "react-native";

import { Button } from "@/design-system/ui/button/Button";
import { Text } from "@/design-system/ui/typography/Text";

type Props = {
  children: ReactNode;

  /**
   * Label used to identify which boundary caught the error. Without it, a crash
   * report only says "something in the app failed", which is not actionable.
   */
  boundaryName: string;

  /** Rendered instead of the default recovery screen when supplied. */
  fallback?: (error: Error, reset: () => void) => ReactNode;

  /**
   * Called when the boundary catches. This is the hook a crash reporter is
   * attached to; the boundary itself deliberately does not depend on one, so it
   * stays usable in tests and in builds without telemetry.
   */
  onError?: (error: Error, info: ErrorInfo) => void;
};

type State = {
  error: Error | null;
};

/**
 * Catches render-time errors so one broken screen cannot take down the app.
 *
 * React unmounts the entire tree when a render throws and no boundary catches
 * it. On a mobile client that means a blank screen with no way forward: the
 * user cannot navigate away, cannot retry, and cannot even reach the sign-out
 * button. They have to force-quit, and if the error is in a screen they land on
 * after launch, the app appears permanently broken.
 *
 * That failure mode is unacceptable for a tax platform, where a user may be
 * partway through submitting documents against a deadline. This boundary
 * converts a total loss into a recoverable one.
 *
 * It is a class component because that is the only way to implement
 * `componentDidCatch`; React provides no hook equivalent.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info);

    if (__DEV__) {
      console.error(
        `[${this.props.boundaryName}] render error`,
        error,
        info.componentStack,
      );
    }
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;

    if (!error) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback(error, this.reset);
    }

    return <ErrorFallback error={error} onRetry={this.reset} />;
  }
}

type FallbackProps = {
  error: Error;
  onRetry: () => void;
};

/**
 * The default recovery screen.
 *
 * The underlying error message is shown only in development. In production it
 * is withheld deliberately: a thrown error can carry a stack trace, an internal
 * URL or a fragment of a server response, none of which belong on a user's
 * screen where they may be photographed or screen-shared.
 */
function ErrorFallback({ error, onRetry }: FallbackProps) {
  return (
    <View className="flex-1 items-center justify-center gap-4 px-8">
      <Text variant="heading" className="text-center">
        Something went wrong
      </Text>

      <Text variant="body" className="text-center opacity-70">
        This screen could not be displayed. Your data has not been lost.
      </Text>

      {__DEV__ ? (
        <Text variant="caption" className="text-center opacity-50">
          {error.message}
        </Text>
      ) : null}

      <Button onPress={onRetry}>Try again</Button>
    </View>
  );
}

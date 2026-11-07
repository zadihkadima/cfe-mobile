import { ActivityIndicator, Text, View } from "react-native";

import { ConnectionStatus } from "@/core/websocket/client";

type Props = {
  status: ConnectionStatus;
};

/**
 * A strip above the composer saying whether messages can currently be sent.
 *
 * Nothing is shown once connected. A banner that is always present stops being
 * read, and the healthy state is the one the user should not have to think
 * about — the point of this is to explain the unhealthy one, which was
 * previously indistinguishable from the app simply not working.
 */
export function ConnectionBanner({ status }: Props) {
  if (status === "connected") {
    return null;
  }

  const connecting = status === "connecting";

  return (
    <View
      accessibilityRole="alert"
      // Announced as one phrase rather than as separate spinner and text nodes,
      // so a screen reader does not read the state twice or read it out of
      // order.
      accessibilityLabel={
        connecting
          ? "Connecting. Messages will be sent once the connection is back."
          : "Not connected. Messages cannot be sent right now."
      }
      className={`flex-row items-center justify-center px-4 py-1.5 ${
        connecting
          ? "bg-warning-subtle dark:bg-dark-warning-subtle"
          : "bg-danger-subtle dark:bg-dark-danger-subtle"
      }`}
    >
      {connecting ? (
        <ActivityIndicator size="small" className="mr-2" />
      ) : null}

      <Text
        className={`text-xs font-semibold ${
          connecting
            ? "text-warning dark:text-dark-warning"
            : "text-danger dark:text-dark-danger"
        }`}
      >
        {connecting ? "Connecting…" : "Not connected"}
      </Text>
    </View>
  );
}

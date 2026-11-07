import { Pressable, Text, View } from "react-native";
import { Pin, PinOff } from "lucide-react-native";

import { useIconColor } from "@/design-system/theme/useColor";
import { Icon } from "@/design-system/ui";
import { UnreadBadge } from "@/design-system/ui/display/UnreadBadge";

interface Props {
  name: string;
  client: string;
  updated: string;
  pinned?: boolean;
  onPress?: () => void;
  onTogglePin?: () => void;

  /** How much unseen work is waiting in this workspace. */
  unread?: number;
}

export function WorkspaceRow({
  name,
  client,
  updated,
  pinned = false,
  onPress,
  onTogglePin,
  unread = 0,
}: Props) {
  // The filled pin needs the same colour for its stroke and its fill, and a
  // fill is a prop rather than a class, so the token is resolved here.
  const pinFill = useIconColor("secondaryBrand");

  return (
    <Pressable
      onPress={onPress}
      className="
      flex-row
      items-center
      justify-between
      py-4
      border-b
      border-border
      dark:border-dark-border
      active:opacity-80
      "
    >
      <View className="flex-1">
        <Text
          className="
          text-text
          dark:text-dark-text
          font-semibold
          text-base
          "
        >
          {name}
        </Text>

        {!!client && (
          <Text
            className="
            text-text-secondary
            dark:text-dark-text-secondary
            mt-1
            "
          >
            {client}
          </Text>
        )}
      </View>

      <View className="flex-row items-center">
        <View className="mr-2">
          <UnreadBadge count={unread} label={`unread in ${name}`} />
        </View>

        {!!onTogglePin && (
          <Pressable
            onPress={onTogglePin}
            accessibilityRole="button"
            accessibilityLabel={pinned ? `Unpin ${name}` : `Pin ${name}`}
            // Its own pressable inside the row's pressable, with generous
            // padding: a small target sitting on top of a large one is how a
            // near-miss opens the workspace instead of pinning it.
            hitSlop={8}
            className="mr-1 h-10 w-10 items-center justify-center rounded-full"
          >
            {pinned ? (
              <Icon as={Pin} size={17} tone="secondaryBrand" fill={pinFill} />
            ) : (
              <Icon as={PinOff} size={17} tone="muted" />
            )}
          </Pressable>
        )}

        <View className="items-end">
          <Text className="text-text-secondary dark:text-dark-text-secondary text-sm">
            {updated}
          </Text>

          <Text
            className="
            text-primary
            dark:text-dark-primary
            mt-2
            text-lg
            "
          >
            ›
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
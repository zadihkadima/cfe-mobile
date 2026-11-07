import { Pressable, Text, View } from "react-native";

import { formatFileSize } from "@/core/format/formatFileSize";

import { MessageAttachment as Attachment } from "../api/types";

type Props = {
  attachment: Attachment;

  isOwn: boolean;

  onOpen?(attachment: Attachment): void;
};

/**
 * The file row inside a message bubble.
 *
 * It shows the name the sender chose and the size, because those are the two
 * things that decide whether the reader opens it now or later. The storage key
 * and mime type are deliberately not shown: neither means anything to the
 * person reading, and the storage key is an internal path.
 */
export function MessageAttachment({ attachment, isOwn, onOpen }: Props) {
  const size = formatFileSize(attachment.size_bytes);

  return (
    <Pressable
      onPress={() => onOpen?.(attachment)}
      accessibilityRole="button"
      accessibilityLabel={`Attachment, ${attachment.name}${
        size ? `, ${size}` : ""
      }. Double tap to open.`}
      className={`mt-1.5 flex-row items-center rounded-xl border px-3 py-2 ${
        isOwn
          ? "border-background/30 dark:border-dark-background/30"
          : "border-border dark:border-dark-border"
      }`}
    >
      <View
        className={`mr-2.5 h-8 w-8 items-center justify-center rounded-lg ${
          isOwn
            ? "bg-background/20 dark:bg-dark-background/20"
            : "bg-elevated dark:bg-dark-elevated"
        }`}
      >
        <Text
          className={`text-sm ${
            isOwn
              ? "text-background dark:text-dark-background"
              : "text-text dark:text-dark-text"
          }`}
        >
          {/* A glyph rather than an icon component, so a file row never
              depends on the icon bundle being loaded to be legible. */}
          📄
        </Text>
      </View>

      <View className="flex-1">
        <Text
          numberOfLines={1}
          // Truncated at the end rather than wrapped: a long filename would
          // otherwise push the message text off the bubble, and the beginning
          // of a name is what identifies it.
          className={`text-sm font-medium ${
            isOwn
              ? "text-background dark:text-dark-background"
              : "text-text dark:text-dark-text"
          }`}
        >
          {attachment.name}
        </Text>

        {size ? (
          <Text
            className={`text-[11px] ${
              isOwn
                ? "text-background/70 dark:text-dark-background/70"
                : "text-text-secondary dark:text-dark-text-secondary"
            }`}
          >
            {size}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

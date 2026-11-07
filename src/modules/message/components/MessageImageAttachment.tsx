import { useState } from "react";

import { ActivityIndicator, Image, Pressable, Text, View } from "react-native";

import { useFileAccessUrl } from "@/core/api/useFileAccessUrl";

import { MessageAttachment as Attachment } from "../api/types";

type Props = {
  workspaceId: string;

  attachment: Attachment;

  isOwn: boolean;

  onOpen?(attachment: Attachment): void;
};

/**
 * An image sent in a conversation, shown rather than described.
 *
 * A photograph listed as a filename is a photograph nobody looks at. The
 * whole reason to send one is that the recipient sees it without deciding to,
 * so it is drawn in the bubble and tapping it opens the full-size file.
 *
 * The URL behind it expires, so it is held by a hook that renews it rather
 * than fetched once when this mounts. Fetching once works until the URL
 * lapses and then fails in the situation that matters most -- a conversation
 * somebody left open -- by turning an image they were just looking at into a
 * broken box.
 */
export function MessageImageAttachment({
  workspaceId,
  attachment,
  isOwn,
  onOpen,
}: Props) {
  const { data, isPending, isError } = useFileAccessUrl(
    workspaceId,
    attachment.id,
  );

  const [failed, setFailed] = useState(false);

  // A pending message has not been echoed by the server yet, but its file was
  // uploaded before sending, so there is a real id to fetch a URL for.
  const unavailable = isError || failed;

  return (
    <Pressable
      onPress={() => onOpen?.(attachment)}
      accessibilityRole="imagebutton"
      accessibilityLabel={`Image, ${attachment.name}. Double tap to open.`}
      className="mt-1.5 overflow-hidden rounded-xl"
    >
      <View
        // A fixed frame reserves the space before the image arrives, so the
        // conversation does not jump under the reader's thumb as rows load.
        className={`h-48 w-full items-center justify-center ${
          isOwn
            ? "bg-background/20 dark:bg-dark-background/20"
            : "bg-elevated dark:bg-dark-elevated"
        }`}
      >
        {data?.url && !unavailable ? (
          <Image
            source={{ uri: data.url }}
            resizeMode="cover"
            onError={() => setFailed(true)}
            accessibilityIgnoresInvertColors
            className="h-full w-full"
          />
        ) : isPending ? (
          <ActivityIndicator size="small" />
        ) : (
          // Named rather than blank. A reader who cannot see the image should
          // still know one was sent and what it was called, because that is
          // enough to ask the sender about it.
          <Text
            numberOfLines={2}
            className="px-3 text-center text-xs text-text-secondary dark:text-dark-text-secondary"
          >
            🖼 {attachment.name}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

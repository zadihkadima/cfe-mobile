import { Pressable, Text, View } from "react-native";

import { useState } from "react";

import {
  formatDayLabel,
  formatMessageTime,
} from "@/core/format/formatMessageTime";

import { ConversationMessage } from "../api/conversation";

import { MessageAttachment as Attachment } from "../api/types";

import { Avatar } from "@/design-system/ui";

import { describeReaders } from "../utils/describeReaders";

import { MessageAttachment } from "./MessageAttachment";
import { MessageImageAttachment } from "./MessageImageAttachment";

/**
 * How long after sending a message may still be corrected.
 *
 * The server enforces this; the value is repeated here only to decide whether
 * to offer the affordance. Showing an Edit button that is guaranteed to be
 * refused is worse than showing none, and the client cannot be the authority
 * because anything it decides can be bypassed.
 */
type Props = {
  message: ConversationMessage;

  workspaceId: string;

  isOwn: boolean;

  /**
   * Whether to name the sender above the text.
   *
   * Decided by the list rather than here, because it depends on the message
   * before this one: in a run of messages from the same person the name is
   * shown once, at the top. Repeating it on every bubble turns a conversation
   * into a column of the same name.
   */
  showSender?: boolean;

  /**
   * Briefly marks this as the message a reader jumped to from a reply's
   * excerpt. Without it the list simply lands somewhere new and leaves the
   * reader to work out which bubble was the point of the jump.
   */
  highlighted?: boolean;

  onReply?(messageId: string): void;
  onOpenParent?(parentId: string): void;

  onRetry?(message: ConversationMessage): void;

  onEdit?(message: ConversationMessage): void;

  onOpenAttachment?(attachment: Attachment): void;
};

export function MessageBubble({
  message,
  workspaceId,
  isOwn,
  showSender = false,
  highlighted = false,
  onReply,
  onOpenParent,
  onRetry,
  onEdit,
  onOpenAttachment,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  // Images are shown, everything else is listed. A photograph reduced to a
  // filename is a photograph nobody opens, and the reason for sending one is
  // that the recipient sees it without having to decide to.
  const isImage = !!message.attachment?.mime_type?.startsWith("image/");

  const isSending = message.delivery === "sending";
  const hasFailed = message.delivery === "failed";

  const sentAt = new Date(message.created_at).getTime();

  // An unconfirmed message has no server-side existence yet, so there is
  // nothing to edit; offering it would send a request for an id the server has
  // never seen.
  const canEdit =
    isOwn &&
    !isSending &&
    !hasFailed &&
    // A message that is only a file has no words to correct, and editing it to
    // add some would change what the recipient already read without any
    // indication of what was there before.
    message.content.trim().length > 0 &&
    Number.isFinite(sentAt);

  // Delivery state is spoken as part of the message rather than left to the
  // dimming, which a screen reader cannot convey. Without it a failed message
  // is announced identically to a delivered one.
  const deliveryLabel = isSending
    ? ", sending"
    : hasFailed
      ? ", failed to send, double tap to retry"
      : "";

  const metaClass = isOwn
    ? "text-background/80 dark:text-dark-background/80"
    : "text-text-secondary dark:text-dark-text-secondary";

  // Only ever shown on other people's messages. Labelling your own bubbles with
  // your own name tells you what you already know, and the side of the screen
  // they sit on has said it already.
  const senderName = isOwn ? undefined : message.sender_name;
  const showSenderName = showSender && !!senderName;

  // Spoken before the content, because a screen reader gets no help from the
  // alignment and colour that tell a sighted reader who is talking. Announced
  // on every message rather than only the first of a run: the visual grouping
  // that makes repetition redundant is not conveyed linearly.
  const senderLabel = !isOwn && senderName ? `${senderName}, ` : "";

  const seenByLabel = describeReaders(message.seen_by, message.seen_by_count);

  const actionTextClass = isOwn
    ? "text-background dark:text-dark-background"
    : "text-text dark:text-dark-text";

  return (
    <View
      className={`w-full flex-row my-1.5 px-3 ${
        isOwn ? "justify-end" : "justify-start"
      }`}
    >
      {/* A fixed gutter on incoming messages, holding the picture only at the
          top of a run. The width is reserved on every bubble rather than only
          the ones showing a picture, so a run stays aligned in a single column
          instead of stepping sideways under its own first message. */}
      {!isOwn ? (
        <View className="mr-2 w-8 justify-end">
          {showSender ? (
            <Avatar
              size="sm"
              name={senderName}
              image={message.sender_avatar_url}
            />
          ) : null}
        </View>
      ) : null}

      <Pressable
        onPress={() => {
          if (hasFailed) {
            onRetry?.(message);
            return;
          }

          setExpanded((prev) => !prev);
        }}
        accessibilityRole="button"
        accessibilityLabel={`${senderLabel}${message.content}${
          message.attachment ? `, attachment ${message.attachment.name}` : ""
        }${
          message.edited_at ? ", edited" : ""
        }, ${formatMessageTime(message.created_at)}${deliveryLabel}`}
        className={`max-w-[80%] rounded-[18px] px-3.5 py-2.5 ${
          isOwn ? "bg-text dark:bg-dark-text" : "bg-surface dark:bg-dark-surface"
        } ${isSending ? "opacity-60" : ""} ${
          highlighted ? "border-2 border-primary dark:border-dark-primary" : ""
        }`}
      >
        {showSenderName ? (
          <Text
            numberOfLines={1}
            className="mb-0.5 text-xs font-semibold text-primary dark:text-dark-primary"
          >
            {senderName}
          </Text>
        ) : null}

        {message.content ? (
          <Text
            className={`text-base ${
              isOwn
                ? "text-background dark:text-dark-background"
                : "text-text dark:text-dark-text"
            }`}
          >
            {message.content}
          </Text>
        ) : null}

        {message.reply_to ? (
          <Pressable
            onPress={() => onOpenParent?.(message.reply_to!.id)}
            className="mb-2 rounded-md border-l-2 border-primary bg-surface/60 px-2 py-1 dark:border-dark-primary dark:bg-dark-surface/60"
            accessibilityRole="button"
            // The excerpt is truncated, so the affordance has to say that
            // there is more behind it -- otherwise a shortened quote reads as
            // the whole of what was said.
            accessibilityLabel={`Replying to ${
              message.reply_to.sender_name ?? "a message"
            }, ${message.reply_to.content ?? ""}, double tap to show it`}
          >
            <Text className="text-sm font-semibold text-text dark:text-dark-text">
              {message.reply_to.sender_name ?? "Reply"}
            </Text>

            <Text
              numberOfLines={2}
              className="text-sm italic text-text-secondary dark:text-dark-text-secondary"
            >
              {message.reply_to.content ?? ""}
            </Text>
          </Pressable>
        ) : null}

        {message.attachment ? (
          isImage ? (
            <MessageImageAttachment
              workspaceId={workspaceId}
              attachment={message.attachment}
              isOwn={isOwn}
              onOpen={onOpenAttachment}
            />
          ) : (
            <MessageAttachment
              attachment={message.attachment}
              isOwn={isOwn}
              onOpen={onOpenAttachment}
            />
          )
        ) : null}

        {expanded && (
          <View className="mt-2">
            {/* Sender and workspace ids used to be printed here. They are raw
                database identifiers, meaningless to the person reading them,
                and the broadcast flag told the reader something about how the
                message was routed rather than anything about the message. */}
            <Text className={`text-[11px] ${metaClass}`}>
              {formatDayLabel(message.created_at)} at{" "}
              {formatMessageTime(message.created_at)}
            </Text>

            {message.edited_at ? (
              <Text className={`text-[11px] ${metaClass}`}>
                Edited {formatMessageTime(message.edited_at)}
              </Text>
            ) : null}

            <Text className={`text-[11px] ${metaClass}`}>{seenByLabel}</Text>

            <View className="mt-1 flex-row">
              <Pressable
                onPress={() => onReply?.(message.id)}
                accessibilityRole="button"
                accessibilityLabel="Reply to this message"
                className="self-start rounded-full border border-border px-2 py-0.5 dark:border-dark-border"
              >
                <Text className={`text-[11px] ${actionTextClass}`}>Reply</Text>
              </Pressable>

              {canEdit ? (
                <Pressable
                  onPress={() => onEdit?.(message)}
                  accessibilityRole="button"
                  accessibilityLabel="Edit this message"
                  className="ml-2 self-start rounded-full border border-border px-2 py-0.5 dark:border-dark-border"
                >
                  <Text className={`text-[11px] ${actionTextClass}`}>Edit</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        )}

        {hasFailed ? (
          <Text className="mt-1.5 self-end text-xs font-semibold text-danger dark:text-dark-danger">
            Not sent · Tap to retry
          </Text>
        ) : (
          <Text
            className={`mt-1.5 self-end text-xs ${
              isOwn
                ? "text-background/70 dark:text-dark-background/70"
                : "text-text-secondary dark:text-dark-text-secondary"
            }`}
          >
            {isSending
              ? "Sending…"
              : `${formatMessageTime(message.created_at)}${
                  message.edited_at ? " · edited" : ""
                }`}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

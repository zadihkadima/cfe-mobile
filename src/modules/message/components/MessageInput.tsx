import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Check, Paperclip, Send } from "lucide-react-native";

import { formatFileSize } from "@/core/format/formatFileSize";
import { describeUploadFailure } from "@/core/api/describeUploadFailure";
import { useColor } from "@/design-system/theme/useColor";
import { Icon } from "@/design-system/ui";

import { MessageAttachment } from "../api/types";

type SendPayload = {
  content: string;
  replyToId?: string;
  attachment?: MessageAttachment;
};

export type EditingMessage = {
  id: string;
  content: string;
};

type Props = {
  onSend(payload: SendPayload): void;

  replyToId?: string;

  onClearReply?(): void;

  /** Set while the user is correcting a message they already sent. */
  editing?: EditingMessage;

  onSubmitEdit?(messageId: string, content: string): void;

  onCancelEdit?(): void;

  /**
   * Uploads a picked file and returns what to attach.
   *
   * The upload happens before the message is sent, not with it, because the
   * file has to exist in the workspace's documents for the message to be able
   * to reference it. That is also what puts it in the client's file list.
   */
  onPickAttachment?(): Promise<MessageAttachment | null>;
};

export function MessageInput({
  onSend,
  replyToId,
  onClearReply,
  editing,
  onSubmitEdit,
  onCancelEdit,
  onPickAttachment,
}: Props) {
  const [value, setValue] = useState("");

  // A placeholder colour is a prop, so it cannot carry a `dark:` variant and
  // has to be resolved against the active theme here.
  const placeholderColor = useColor("textMuted");

  // The file is uploaded when it is picked, not when Send is pressed, so the
  // user finds out immediately if the upload fails rather than after composing
  // a message around a file that never arrived.
  const [attachment, setAttachment] = useState<MessageAttachment | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadFailed, setUploadFailed] = useState<string | null>(null);

  // Entering edit mode loads the existing text so the user corrects a word
  // rather than retyping the message. Keyed on the id, not on the object, so
  // that a re-render — or the server's own echo of the edit arriving over the
  // socket — does not overwrite what the user is in the middle of typing.
  const editingId = editing?.id;

  useEffect(() => {
    if (editingId) {
      setValue(editing?.content ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingId]);

  function submit() {
    const text = value.trim();

    // Pressing Send while a file is still uploading would send the message
    // without it and leave the upload finishing into nothing, which reads to
    // the user as the file having been silently dropped.
    if (uploading) {
      return;
    }

    if (editing) {
      if (!text) {
        return;
      }

      // An edit that changes nothing is discarded rather than sent. It would
      // be accepted, and would mark the message as edited for everyone reading
      // it, over text that is identical to what they already saw.
      if (text !== editing.content.trim()) {
        onSubmitEdit?.(editing.id, text);
      } else {
        onCancelEdit?.();
      }

      setValue("");

      return;
    }

    // A file on its own is a message. Requiring a caption would make people
    // type something meaningless beside the document, which is what everyone
    // does when a form insists on it.
    if (!text && !attachment) {
      return;
    }

    onSend({
      content: text,
      replyToId,
      attachment: attachment ?? undefined,
    });

    setValue("");
    setAttachment(null);
    setUploadFailed(null);
  }

  async function pickAttachment() {
    if (!onPickAttachment || uploading) {
      return;
    }

    setUploading(true);
    setUploadFailed(null);

    try {
      const picked = await onPickAttachment();

      if (picked) {
        setAttachment(picked);
      }
    } catch (error) {
      // Reported in the composer rather than thrown, and reported with the
      // reason. "That file could not be uploaded" leaves somebody re-picking
      // the same file forever; "this file is too large" tells them what to do
      // instead.
      setUploadFailed(describeUploadFailure(error));
    } finally {
      setUploading(false);
    }
  }

  function cancelEdit() {
    setValue("");
    onCancelEdit?.();
  }

  // Exactly the conditions `submit` acts on, so the button's appearance and
  // its behaviour cannot disagree. A button that looks live and does nothing
  // when pressed is read as the app being broken, which is the report this
  // started as.
  const canSubmit = editing
    ? value.trim().length > 0
    : !uploading && (value.trim().length > 0 || !!attachment);

  return (
    <View className="border-t border-border bg-surface p-2.5 dark:border-dark-border dark:bg-dark-surface">
      {editing ? (
        <View className="mb-2 flex-row items-center justify-between rounded-lg border border-border px-3 py-2 dark:border-dark-border">
          <Text className="text-xs text-text-secondary dark:text-dark-text-secondary">
            Editing your message
          </Text>

          <Pressable
            onPress={cancelEdit}
            accessibilityRole="button"
            accessibilityLabel="Cancel editing"
          >
            <Text className="text-xs font-semibold text-danger">Cancel</Text>
          </Pressable>
        </View>
      ) : null}

      {!editing && !!replyToId && (
        <View className="mb-2 flex-row items-center justify-between rounded-lg border border-border px-3 py-2 dark:border-dark-border">
          <Text className="text-xs text-text-secondary dark:text-dark-text-secondary">
            Replying to a message
          </Text>

          <Pressable
            onPress={onClearReply}
            accessibilityRole="button"
            accessibilityLabel="Cancel reply"
          >
            <Text className="text-xs font-semibold text-danger">Clear</Text>
          </Pressable>
        </View>
      )}

      {!editing && attachment ? (
        <View className="mb-2 flex-row items-center justify-between rounded-lg border border-border px-3 py-2 dark:border-dark-border">
          <Text
            numberOfLines={1}
            className="flex-1 text-xs text-text dark:text-dark-text"
          >
            📄 {attachment.name}
            {attachment.size_bytes
              ? ` · ${formatFileSize(attachment.size_bytes)}`
              : ""}
          </Text>

          <Pressable
            onPress={() => setAttachment(null)}
            accessibilityRole="button"
            accessibilityLabel="Remove attachment"
            className="ml-2"
          >
            <Text className="text-xs font-semibold text-danger dark:text-dark-danger">
              Remove
            </Text>
          </Pressable>
        </View>
      ) : null}

      {uploadFailed ? (
        <View className="mb-2 rounded-lg bg-danger-subtle px-3 py-2 dark:bg-dark-danger-subtle">
          <Text className="text-xs font-semibold text-danger dark:text-dark-danger">
            {uploadFailed}
          </Text>
        </View>
      ) : null}

      <View className="flex-row">
        {!editing && onPickAttachment ? (
          <TouchableOpacity
            onPress={() => void pickAttachment()}
            disabled={uploading}
            accessibilityRole="button"
            accessibilityLabel="Attach a file"
            accessibilityState={{ disabled: uploading, busy: uploading }}
            className={`mr-2 h-11 w-11 items-center justify-center rounded-full border border-border dark:border-dark-border ${
              uploading ? "opacity-50" : ""
            }`}
          >
            {uploading ? (
              <ActivityIndicator size="small" />
            ) : (
              <Icon as={Paperclip} size="lg" tone="secondary" />
            )}
          </TouchableOpacity>
        ) : null}

        <TextInput
          value={value}
          onChangeText={setValue}
          placeholder={editing ? "Edit your message..." : "Write a message..."}
          placeholderTextColor={placeholderColor}
          accessibilityLabel={editing ? "Edit message" : "Write a message"}
          multiline
          returnKeyType="send"
          submitBehavior="submit"
          onSubmitEditing={submit}
          className="min-h-11 max-h-[120px] flex-1 rounded-[22px] border border-border bg-background px-4 py-2.5 text-text dark:border-dark-border dark:bg-dark-background dark:text-dark-text"
        />

        <TouchableOpacity
          onPress={submit}
          disabled={!canSubmit}
          accessibilityRole="button"
          accessibilityLabel={editing ? "Save changes" : "Send message"}
          // Announced as disabled rather than only dimmed. Opacity says
          // nothing to a screen reader, which would otherwise offer a button
          // that does nothing when activated.
          accessibilityState={{ disabled: !canSubmit }}
          // Deliberately still pressable-looking rather than hidden: a Send
          // button that disappears when the box is empty moves the layout
          // under the thumb of somebody about to press it.
          //
          // Round and icon-only so its width never changes. As a text button
          // it was two characters wide when editing and four when sending, so
          // the text box beside it resized as you switched between the two.
          className={`ml-2 h-11 w-11 items-center justify-center rounded-full bg-primary ${
            canSubmit ? "" : "opacity-40"
          }`}
        >
          {editing ? (
            <Icon as={Check} size="lg" tone="inverted" />
          ) : (
            <Icon as={Send} size={19} tone="inverted" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

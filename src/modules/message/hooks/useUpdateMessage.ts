import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/core/query/queryKeys";

import { updateMessage } from "../api/api";
import { MessagePages, replaceMessage } from "../api/conversation";

type Variables = {
  messageId: string;
  content: string;
};

/**
 * Rewrites a message the current user sent.
 *
 * The change is applied to the cache before the request completes, because the
 * user has just pressed Save on text they can still see: leaving the old
 * wording on screen until a round trip finishes reads as the edit having been
 * ignored, which is exactly what makes people press the button twice.
 *
 * On failure the previous message is put back. Nothing else can restore it —
 * the original text exists only in the cache once the composer has cleared, so
 * without the snapshot a rejected edit would leave the user looking at wording
 * the server never accepted, with no way to recover what was there before.
 */
export function useUpdateMessage(workspaceId: string) {
  const queryClient = useQueryClient();

  const conversationKey = queryKeys.messages.workspace(workspaceId);

  return useMutation({
    mutationFn: ({ messageId, content }: Variables) =>
      updateMessage(workspaceId, messageId, { content }),

    onMutate: async ({ messageId, content }) => {
      // An in-flight refetch that resolves after this would overwrite the
      // optimistic text with the server's older copy.
      await queryClient.cancelQueries({ queryKey: conversationKey });

      const previous = queryClient.getQueryData<MessagePages>(conversationKey);

      queryClient.setQueryData<MessagePages>(conversationKey, (cache) => {
        if (!cache) {
          return cache;
        }

        return {
          ...cache,
          pages: cache.pages.map((page) => ({
            ...page,
            items: page.items.map((item) =>
              item.id === messageId ? { ...item, content } : item,
            ),
          })),
        };
      });

      return { previous };
    },

    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(conversationKey, context.previous);
      }
    },

    onSuccess: (message) => {
      // The server decides `edited_at`, so the confirmed message replaces the
      // optimistic one rather than merely being assumed correct. Without this
      // the sender's own copy would not be marked as edited while everyone
      // else's, updated from the broadcast, would be.
      queryClient.setQueryData<MessagePages>(conversationKey, (cache) =>
        replaceMessage(cache, message),
      );
    },
  });
}

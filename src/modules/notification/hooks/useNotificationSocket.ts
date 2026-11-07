import { useEffect } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { tokenService } from "@/core/auth/tokenService";
import { queryKeys } from "@/core/query/queryKeys";
import { store } from "@/core/store";
import { showInfo } from "@/core/store/notificationSlice";
import { websocketClient } from "@/core/websocket/client";
import { WS_EVENTS } from "@/core/websocket/events";

import { AppNotification, NotificationListResponse } from "../api/types";

/**
 * Keeps the notification list and its badges current while the app is open.
 *
 * Gated on being signed in rather than on holding a token, which is what this
 * hook used to take. The difference matters more than it reads: the token was
 * read imperatively by the component above, at the root of the navigator,
 * which renders once. At that moment the session has usually not finished
 * restoring, so the token was null, so this hook returned before connecting --
 * and nothing ever re-rendered the root to try again. The socket stayed down
 * for the whole session, and notifications appeared only when a screen change
 * happened to refetch the list. That is exactly the "nothing arrives until I
 * refresh" that was reported.
 *
 * Being signed in comes from the store, so it becomes true when the session
 * restores and this effect runs then. The token is handed over as a function
 * rather than a value, so every connection attempt reads the current one: a
 * socket that drops after the access token has rotated would otherwise retry
 * forever with an expired credential.
 */
export function useNotificationSocket(signedIn: boolean) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!signedIn) {
      // Signing out has to take the socket down too. It is authenticated with
      // the previous session's token, and leaving it up means the next person
      // to sign in on this handset receives the last one's events.
      websocketClient.disconnect();

      return;
    }

    websocketClient.connect(() => tokenService.getAccessToken());

    return websocketClient.listen((event) => {
      if (event.type !== WS_EVENTS.NOTIFICATION_CREATED) {
        return;
      }

      const notification = event.payload as AppNotification;

      /*
       * Conversation traffic is deliberately absent from this list. The server
       * scopes it out, because a feed in which every message competes with
       * every deadline is a feed nobody reads. Inserting it here would put it
       * back -- and worse, only until the next refetch, when the server
       * declines to send it and the row disappears. A row that vanishes reads
       * as the app losing things.
       *
       * The message still announces itself: the toast below still fires, and
       * the workspace badges refreshed at the end are where a message belongs.
       */
      if (!notification.type.startsWith("message.")) {
        queryClient.setQueryData<NotificationListResponse>(
          queryKeys.notifications.all,
          (previous) => {
            if (!previous) {
              return previous;
            }

            return {
              ...previous,
              items: [notification, ...previous.items],
              total: previous.total + 1,
              unread: previous.unread + 1,
            };
          },
        );
      }

      store.dispatch(showInfo(notification.body, notification.title));

      /*
       * The badges are counted by the server, so they cannot be adjusted
       * here the way the list above can -- the arriving event says nothing
       * about how many other things are already waiting elsewhere.
       *
       * Refetching is cheap: it is one grouped query, and it only happens
       * when something has actually arrived. Without it a new message shows
       * a toast but leaves every badge stale until the next screen change.
       */
      void queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.unreadByWorkspace,
      });
    });
  }, [queryClient, signedIn]);
}
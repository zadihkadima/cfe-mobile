import { WsEvent } from "./types";
import { WS_BASE_URL } from "@/core/config/env";

/**
 * Reconnection backs off so a server that is down does not receive a connection
 * attempt every frame from every client. The delay doubles up to a ceiling,
 * which keeps recovery quick after a brief network blip while staying polite
 * during a real outage.
 */
const INITIAL_RETRY_DELAY_MS = 1000;
const MAX_RETRY_DELAY_MS = 30000;

type RoomRegistration = {
  joinType: string;
  leaveType: string;
  payload: unknown;
};

type TokenProvider = () => string | null;

/**
 * What the socket is currently doing, from the point of view of somebody
 * waiting to send a message.
 *
 * "connecting" covers both the first attempt and every reconnect, because the
 * distinction does not matter to the person looking at the screen: in both
 * cases their message will be held rather than delivered. "disconnected" means
 * the client has given up until something changes -- there is no token, or the
 * caller asked to disconnect -- rather than that it is between attempts.
 */
export type ConnectionStatus = "connecting" | "connected" | "disconnected";

class WebSocketClient {
  private socket: WebSocket | null = null;

  private listeners = new Set<(event: WsEvent) => void>();

  private statusListeners = new Set<(status: ConnectionStatus) => void>();

  private status: ConnectionStatus = "disconnected";

  private pendingEvents: string[] = [];

  /**
   * Rooms the caller wants to be in, as opposed to rooms the current socket
   * happens to have joined. A reconnect replays these, because the server has
   * no memory of a connection that has gone away.
   */
  private rooms = new Map<string, RoomRegistration>();

  private tokenProvider: TokenProvider | null = null;

  private retryDelay = INITIAL_RETRY_DELAY_MS;

  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Set when the caller asked to disconnect, so an intentional close is not
   * mistaken for a dropped connection and retried.
   */
  private closedByCaller = false;

  connect(tokenOrProvider: string | TokenProvider) {
    this.tokenProvider =
      typeof tokenOrProvider === "function"
        ? tokenOrProvider
        : () => tokenOrProvider;

    this.closedByCaller = false;

    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    // A pending retry is cancelled and the backoff reset. Opening a screen that
    // needs the socket is a fresh intent to connect, and making the user wait
    // out a thirty-second backoff accumulated while they were elsewhere in the
    // app is the difference between messaging that works and messaging that
    // appears not to. Leaving the timer running would also mean two attempts
    // racing: this one, and the one already scheduled.
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }

    this.retryDelay = INITIAL_RETRY_DELAY_MS;

    this.open();
  }

  private open() {
    const token = this.tokenProvider?.();

    // A reconnect attempts to use the current access token, not whatever was
    // current when the screen first mounted. Otherwise a socket that drops
    // after fifteen minutes keeps retrying with an expired token forever.
    if (!token) {
      // Previously this returned in silence. No socket was created, so no
      // close event ever fired, so no reconnect was ever scheduled -- the
      // client sat inert with no way back and nothing on screen to say so,
      // which looks exactly like messaging being broken. It now reports the
      // state and tries again, since a token usually appears moments later
      // once the session has finished restoring.
      this.setStatus("disconnected");
      this.scheduleReconnect();

      return;
    }

    this.setStatus("connecting");

    // The WebSocket API cannot set an Authorization header, so the token is
    // passed as a query parameter and validated server-side before upgrade.
    // It is encoded to stay a well-formed URL for every possible token value.
    try {
      this.socket = new WebSocket(
        `${WS_BASE_URL}?token=${encodeURIComponent(token)}`,
      );
    } catch {
      // A malformed URL throws here rather than firing an error event, and
      // without this the client would be left with no socket and no retry.
      this.socket = null;
      this.setStatus("disconnected");
      this.scheduleReconnect();

      return;
    }

    this.socket.onopen = () => {
      this.retryDelay = INITIAL_RETRY_DELAY_MS;

      this.setStatus("connected");

      // Rejoin before flushing queued events: an event addressed to a room is
      // useless if the server does not yet believe this connection is in it.
      this.rooms.forEach((room) => {
        this.transmit(room.joinType, room.payload);
      });

      const queued = this.pendingEvents;
      this.pendingEvents = [];
      queued.forEach((event) => this.socket?.send(event));
    };

    this.socket.onerror = () => {
      // Errors are followed by a close, which is where reconnection is handled.
      // Nothing is logged here: the event carries no useful detail and the
      // token is in the URL.
    };

    this.socket.onclose = () => {
      this.socket = null;

      if (this.closedByCaller) {
        this.setStatus("disconnected");

        return;
      }

      // Reported as connecting rather than disconnected, because a retry is
      // already scheduled. Showing "not connected" for a blip that resolves in
      // a second would be more alarming than the situation warrants.
      this.setStatus("connecting");
      this.scheduleReconnect();
    };

    this.socket.onmessage = (event) => {
      let parsed: WsEvent;

      try {
        parsed = JSON.parse(event.data) as WsEvent;
      } catch {
        // A frame that is not JSON is not something any listener can act on,
        // and throwing here would take down the socket's message pump.
        return;
      }

      this.listeners.forEach((listener) => listener(parsed));
    };
  }

  private scheduleReconnect() {
    if (this.retryTimer) {
      return;
    }

    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      this.retryDelay = Math.min(this.retryDelay * 2, MAX_RETRY_DELAY_MS);
      this.open();
    }, this.retryDelay);
  }

  disconnect() {
    this.closedByCaller = true;

    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }

    this.retryDelay = INITIAL_RETRY_DELAY_MS;
    this.pendingEvents = [];
    this.rooms.clear();
    this.tokenProvider = null;

    this.socket?.close();
    this.socket = null;

    this.setStatus("disconnected");
  }

  /**
   * Subscribes to connection state, and reports the current state immediately.
   *
   * The immediate call matters: a subscriber that only heard about changes
   * would show nothing at all until the next transition, which on a healthy
   * connection never comes.
   */
  observeStatus(callback: (status: ConnectionStatus) => void) {
    this.statusListeners.add(callback);

    callback(this.status);

    return () => {
      this.statusListeners.delete(callback);
    };
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  private setStatus(status: ConnectionStatus) {
    if (this.status === status) {
      // Reconnect attempts fire repeatedly while a server is down. Announcing
      // "connecting" on each one would re-render every subscriber on a timer
      // for no visible change.
      return;
    }

    this.status = status;
    this.statusListeners.forEach((listener) => listener(status));
  }

  /**
   * Registers interest in a room and returns the function that leaves it.
   *
   * The registration outlives any single connection, so a room joined here is
   * rejoined automatically after a drop. Sending a one-off join instead left a
   * reconnected socket subscribed to nothing, which looked exactly like the
   * feature being broken.
   */
  joinRoom(joinType: string, leaveType: string, payload: unknown) {
    const key = `${joinType}:${JSON.stringify(payload)}`;

    this.rooms.set(key, { joinType, leaveType, payload });
    this.transmit(joinType, payload);

    return () => {
      this.rooms.delete(key);
      this.transmit(leaveType, payload);
    };
  }

  /**
   * Sends an event, reporting whether it went out or was queued.
   *
   * The return value matters to callers that draw something optimistically:
   * a queued event has not reached the server and may not for some time, so a
   * caller that assumed delivery would leave the user looking at a message
   * that appears sent and is not.
   */
  send<T>(type: string, payload: T): boolean {
    return this.transmit(type, payload);
  }

  private transmit(type: string, payload: unknown): boolean {
    const serialized = JSON.stringify({ type, payload });

    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(serialized);
      return true;
    }

    // Anything sent while the socket is down is held rather than dropped, so a
    // message composed during a blip is delivered once the socket returns
    // instead of vanishing without the user being told.
    this.pendingEvents.push(serialized);
    return false;
  }

  listen(callback: (event: WsEvent) => void) {
    this.listeners.add(callback);

    return () => {
      this.listeners.delete(callback);
    };
  }
}

export const websocketClient = new WebSocketClient();

/**
 * These exercise the socket lifecycle with a fake WebSocket, because the
 * failures that matter here are all about what happens between connections:
 * a dropped socket, a reconnect, and whether the server still believes this
 * client is in the rooms it asked to be in.
 */

class FakeSocket {
  static instances: FakeSocket[] = [];

  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  readyState = FakeSocket.CONNECTING;
  sent: string[] = [];
  url: string;

  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: ((error: unknown) => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    FakeSocket.instances.push(this);
  }

  send(data: string) {
    this.sent.push(data);
  }

  close() {
    this.readyState = FakeSocket.CLOSED;
    this.onclose?.();
  }

  /** Completes the handshake the way a server would. */
  accept() {
    this.readyState = FakeSocket.OPEN;
    this.onopen?.();
  }

  /** Drops the connection the way a network blip or server restart would. */
  drop() {
    this.readyState = FakeSocket.CLOSED;
    this.onclose?.();
  }

  deliver(payload: unknown) {
    this.onmessage?.({ data: JSON.stringify(payload) });
  }
}

(globalThis as unknown as { WebSocket: unknown }).WebSocket = FakeSocket;

function types(socket: FakeSocket): string[] {
  return socket.sent.map((raw) => JSON.parse(raw).type);
}

describe("websocketClient", () => {
  let websocketClient: typeof import("./client").websocketClient;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.resetModules();
    FakeSocket.instances = [];
    websocketClient = require("./client").websocketClient;
  });

  afterEach(() => {
    websocketClient.disconnect();
    jest.useRealTimers();
  });

  it("carries the token on the handshake", () => {
    websocketClient.connect("a-token");

    expect(FakeSocket.instances[0].url).toContain("token=a-token");
  });

  it("reconnects after the connection drops", () => {
    // Without this the socket stayed null after any blip and messaging was
    // silently dead until the screen was remounted.
    websocketClient.connect("a-token");
    FakeSocket.instances[0].accept();

    FakeSocket.instances[0].drop();
    jest.runOnlyPendingTimers();

    expect(FakeSocket.instances).toHaveLength(2);
  });

  it("uses the current token on reconnect, not the original one", () => {
    let token = "old-token";

    websocketClient.connect(() => token);
    FakeSocket.instances[0].accept();

    token = "new-token";
    FakeSocket.instances[0].drop();
    jest.runOnlyPendingTimers();

    expect(FakeSocket.instances).toHaveLength(2);
    expect(FakeSocket.instances[1].url).toContain("token=new-token");
  });

  it("does not reconnect after a deliberate disconnect", () => {
    websocketClient.connect("a-token");
    FakeSocket.instances[0].accept();

    websocketClient.disconnect();
    jest.runOnlyPendingTimers();

    expect(FakeSocket.instances).toHaveLength(1);
  });

  it("backs off between attempts rather than retrying in a tight loop", () => {
    websocketClient.connect("a-token");
    FakeSocket.instances[0].accept();
    FakeSocket.instances[0].drop();

    jest.advanceTimersByTime(999);
    expect(FakeSocket.instances).toHaveLength(1);

    jest.advanceTimersByTime(1);
    expect(FakeSocket.instances).toHaveLength(2);
  });

  it("rejoins its rooms after reconnecting", () => {
    // The server has no memory of a connection that has gone away, so a room
    // joined once is forgotten on reconnect and the socket goes quiet.
    websocketClient.connect("a-token");
    FakeSocket.instances[0].accept();
    websocketClient.joinRoom("workspace.join", "workspace.leave", { workspace_id: "w1" });

    FakeSocket.instances[0].drop();
    jest.runOnlyPendingTimers();
    FakeSocket.instances[1].accept();

    expect(types(FakeSocket.instances[1])).toContain("workspace.join");
  });

  it("stops rejoining a room once it has been left", () => {
    websocketClient.connect("a-token");
    FakeSocket.instances[0].accept();
    const leave = websocketClient.joinRoom("workspace.join", "workspace.leave", {
      workspace_id: "w1",
    });

    leave();

    FakeSocket.instances[0].drop();
    jest.runOnlyPendingTimers();
    FakeSocket.instances[1].accept();

    expect(types(FakeSocket.instances[1])).not.toContain("workspace.join");
  });

  it("holds events sent before the socket opens", () => {
    websocketClient.connect("a-token");
    websocketClient.send("message.send", { content: "composed while connecting" });

    expect(FakeSocket.instances[0].sent).toHaveLength(0);

    FakeSocket.instances[0].accept();

    expect(types(FakeSocket.instances[0])).toContain("message.send");
  });

  it("joins a room before flushing queued events", () => {
    // An event addressed to a room is useless if the server does not yet
    // believe this connection is in it.
    websocketClient.connect("a-token");
    websocketClient.joinRoom("workspace.join", "workspace.leave", { workspace_id: "w1" });
    websocketClient.send("message.send", { content: "hello" });

    FakeSocket.instances[0].accept();

    const order = types(FakeSocket.instances[0]);
    expect(order.indexOf("workspace.join")).toBeLessThan(order.indexOf("message.send"));
  });

  it("delivers incoming events to listeners", () => {
    const seen: unknown[] = [];
    websocketClient.connect("a-token");
    websocketClient.listen((event) => seen.push(event));
    FakeSocket.instances[0].accept();

    FakeSocket.instances[0].deliver({ type: "message.created", payload: { id: "m1" } });

    expect(seen).toEqual([{ type: "message.created", payload: { id: "m1" } }]);
  });

  it("survives a frame that is not JSON", () => {
    // Throwing here would take down the socket's message pump and end
    // messaging for the session.
    websocketClient.connect("a-token");
    FakeSocket.instances[0].accept();

    expect(() => {
      FakeSocket.instances[0].onmessage?.({ data: "not json" });
    }).not.toThrow();
  });

  it("stops listening once unsubscribed", () => {
    const seen: unknown[] = [];
    websocketClient.connect("a-token");
    const stop = websocketClient.listen((event) => seen.push(event));
    FakeSocket.instances[0].accept();

    stop();
    FakeSocket.instances[0].deliver({ type: "message.created", payload: {} });

    expect(seen).toHaveLength(0);
  });

  it("reports the connection status as it changes", () => {
    const seen: string[] = [];

    // The first call arrives immediately, so a screen that mounts mid-outage
    // is told about it rather than showing nothing until the next transition.
    websocketClient.observeStatus((status) => seen.push(status));
    websocketClient.connect("a-token");
    FakeSocket.instances[0].accept();

    expect(seen).toEqual(["disconnected", "connecting", "connected"]);
  });

  it("keeps trying when no token is available yet", () => {
    // This returned in silence before: no socket meant no close event, so no
    // reconnect was ever scheduled and the client sat inert forever. On a cold
    // start the token appears a moment after the screen mounts, so giving up
    // at the first miss broke messaging for the whole session.
    let token: string | null = null;

    websocketClient.connect(() => token);

    expect(FakeSocket.instances).toHaveLength(0);
    expect(websocketClient.getStatus()).toBe("disconnected");

    token = "a-token";
    jest.runOnlyPendingTimers();

    expect(FakeSocket.instances).toHaveLength(1);
  });

  it("does not report disconnected while a retry is pending", () => {
    // A blip that resolves in a second should not put "not connected" in front
    // of the user.
    websocketClient.connect("a-token");
    FakeSocket.instances[0].accept();

    FakeSocket.instances[0].drop();

    expect(websocketClient.getStatus()).toBe("connecting");
  });

  it("connecting again does not wait out a backoff earned elsewhere", () => {
    // Reconnect delays double towards thirty seconds. Inheriting that on a
    // fresh connect would leave somebody who just opened the conversation
    // staring at a composer that quietly holds their messages.
    let token: string | null = null;

    websocketClient.connect(() => token);
    jest.runOnlyPendingTimers();
    jest.runOnlyPendingTimers();

    token = "a-token";
    websocketClient.connect(() => token);

    expect(FakeSocket.instances).toHaveLength(1);
  });
});

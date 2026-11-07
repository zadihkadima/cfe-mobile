import { render } from "@testing-library/react-native";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

jest.mock("@/core/websocket/client", () => ({
  websocketClient: {
    connect: jest.fn(),
    disconnect: jest.fn(),
    listen: jest.fn(() => jest.fn()),
  },
}));

jest.mock("@/core/auth/tokenService", () => ({
  tokenService: { getAccessToken: jest.fn(() => "token-1") },
}));

import { tokenService } from "@/core/auth/tokenService";
import { websocketClient } from "@/core/websocket/client";

import { useNotificationSocket } from "../useNotificationSocket";

function Probe({ signedIn }: { signedIn: boolean }) {
  useNotificationSocket(signedIn);

  return null;
}

async function renderProbe(signedIn: boolean) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  // Awaited because render is asynchronous in Testing Library v14; without it
  // the tree is never committed and no effect ever runs.
  const view = await render(
    <QueryClientProvider client={client}>
      <Probe signedIn={signedIn} />
    </QueryClientProvider>,
  );

  return {
    setSignedIn: (next: boolean) =>
      view.rerender(
        <QueryClientProvider client={client}>
          <Probe signedIn={next} />
        </QueryClientProvider>,
      ),
  };
}

describe("useNotificationSocket", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (tokenService.getAccessToken as jest.Mock).mockReturnValue("token-1");
  });

  /*
   * The regression this exists for. The hook used to take the access token,
   * read during the render of a component at the root of the navigator, which
   * renders once -- before the session has finished restoring. The token was
   * therefore null, the hook returned before connecting, and nothing ever
   * re-rendered the root to try again. The socket stayed down for the whole
   * session and notifications only appeared when something happened to refetch
   * the list, which is what "nothing arrives until I refresh" looked like.
   */
  it("connects once the session arrives, not only if it was there first", async () => {
    const { setSignedIn } = await renderProbe(false);

    expect(websocketClient.connect).not.toHaveBeenCalled();

    await setSignedIn(true);

    expect(websocketClient.connect).toHaveBeenCalledTimes(1);
  });

  /*
   * The token is handed over as a function, not a value. A socket that drops
   * after the access token has rotated must reconnect with the current one
   * rather than retrying forever with the credential it was born with.
   */
  it("hands over a way to read the token rather than a copy of it", async () => {
    await renderProbe(true);

    const provider = (websocketClient.connect as jest.Mock).mock
      .calls[0][0] as () => string | null;

    expect(typeof provider).toBe("function");

    (tokenService.getAccessToken as jest.Mock).mockReturnValue("token-2");

    expect(provider()).toBe("token-2");
  });

  /*
   * The socket is authenticated with the session's token. Leaving it up after
   * sign-out means the next person on this handset receives the last one's
   * events, which on a shared device is a disclosure rather than an oddity.
   */
  it("takes the socket down when the session ends", async () => {
    const { setSignedIn } = await renderProbe(true);

    await setSignedIn(false);

    expect(websocketClient.disconnect).toHaveBeenCalled();
  });
});

import Constants from "expo-constants";

/**
 * Runtime environment configuration.
 *
 * Twelve-Factor: endpoints must come from configuration, never from source.
 * Values are resolved in priority order:
 *
 *   1. `EXPO_PUBLIC_API_URL` / `EXPO_PUBLIC_WS_URL` (build- or run-time env);
 *   2. `extra.apiUrl` / `extra.wsUrl` from `app.json` (per-profile overrides);
 *   3. the Metro host during development, so a device on the same network
 *      reaches the developer machine without editing any file.
 *
 * There is deliberately no production fallback: shipping a release without an
 * explicit API URL is a configuration error and must fail loudly.
 */

const DEFAULT_API_PORT = "8080";
const API_PREFIX = "/api/v1";

type ExtraConfig = {
  apiUrl?: string;
  wsUrl?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as ExtraConfig;

/** Host:port of the Metro bundler, available only in development builds. */
function metroHost(): string | undefined {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants.expoGoConfig as { debuggerHost?: string } | undefined)?.debuggerHost;

  const host = hostUri?.split(":")[0];

  return host ? `${host}:${DEFAULT_API_PORT}` : undefined;
}

/**
 * Reads a configured value, accepting only a usable string.
 *
 * These arrive from two places that both lie about their type. `app.json`
 * holds whatever JSON was written there, and `process.env` entries are
 * substituted textually by the bundler, so either can hand back an object, a
 * number or the literal string "undefined" while TypeScript still believes it
 * is looking at `string | undefined`.
 *
 * That is not theoretical here. A non-string reached the WebSocket client,
 * where a template literal turned it into "[object Object]" -- a relative URL,
 * which the browser then resolved against whatever page happened to be open.
 * The resulting connection attempt named the Metro dev server and the route
 * the user was standing on, and pointed nowhere near the API. Anything that is
 * not a usable string is discarded here so it can never travel that far.
 */
function readSetting(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  // A shell that expanded an unset variable, or a bundler that substituted a
  // missing one, leaves these behind as text. They are absent, not configured.
  if (!trimmed || trimmed === "undefined" || trimmed === "null") {
    return undefined;
  }

  return trimmed.replace(/\/+$/, "");
}

/**
 * Refuses a URL that is not absolute.
 *
 * A relative URL does not fail. It resolves against the current document and
 * connects successfully to the wrong place, which is far harder to recognise
 * than an outright error.
 */
function requireAbsolute(url: string, source: string, schemes: string[]): string {
  if (!schemes.some((scheme) => url.startsWith(`${scheme}://`))) {
    throw new Error(
      `${source} is "${url}", which does not begin with ${schemes
        .map((scheme) => `${scheme}://`)
        .join(" or ")}. A relative URL silently resolves against the current ` +
        "page rather than reaching the API.",
    );
  }

  return url;
}

function resolveApiBaseUrl(): string {
  const configured = readSetting(process.env.EXPO_PUBLIC_API_URL) ?? readSetting(extra.apiUrl);

  if (configured) {
    return requireAbsolute(configured, "EXPO_PUBLIC_API_URL", ["http", "https"]);
  }

  const host = metroHost();

  if (__DEV__ && host) {
    return `http://${host}${API_PREFIX}`;
  }

  throw new Error(
    "EXPO_PUBLIC_API_URL is not set. Configure the API base URL before building.",
  );
}

function resolveWsBaseUrl(apiBaseUrl: string): string {
  const configured = readSetting(process.env.EXPO_PUBLIC_WS_URL) ?? readSetting(extra.wsUrl);

  if (configured) {
    const url = requireAbsolute(configured, "EXPO_PUBLIC_WS_URL", ["ws", "wss"]);

    // A hand-written WebSocket URL is easy to get wrong and gives nothing back
    // when it is: a failed upgrade surfaces as "connection failed" with no
    // status, no body and no reason. The two mistakes that actually happen are
    // pointing wss:// at a server with no TLS, and dropping the /api/v1 prefix
    // that the API URL carries. Both are silent, both look identical to the
    // feature being broken, and both cost far more to diagnose than to check
    // for here.
    if (__DEV__) {
      if (apiBaseUrl.startsWith("https://") !== url.startsWith("wss://")) {
        throw new Error(
          `EXPO_PUBLIC_WS_URL is ${url} but the API is ${apiBaseUrl}. ` +
            "A TLS WebSocket cannot connect to a server without TLS, or the " +
            "reverse. Leave EXPO_PUBLIC_WS_URL unset to derive it from the " +
            "API URL.",
        );
      }

      if (apiBaseUrl.includes(API_PREFIX) && !url.includes(API_PREFIX)) {
        throw new Error(
          `EXPO_PUBLIC_WS_URL is ${url}, which is missing the ${API_PREFIX} ` +
            "prefix the API URL carries. Leave EXPO_PUBLIC_WS_URL unset to " +
            "derive it from the API URL.",
        );
      }
    }

    return url;
  }

  // Derive from the API URL so the two can never drift apart, and so a TLS
  // API automatically implies a TLS WebSocket.
  return `${apiBaseUrl.replace(/^http/, "ws")}/ws`;
}

export const API_BASE_URL = resolveApiBaseUrl();
export const WS_BASE_URL = resolveWsBaseUrl(API_BASE_URL);

/** True when traffic leaves the device unencrypted; blocked outside development. */
export const IS_INSECURE_TRANSPORT = API_BASE_URL.startsWith("http://");

if (IS_INSECURE_TRANSPORT && !__DEV__) {
  throw new Error(
    "Refusing to use a plaintext API URL in a production build. Use https:// and wss://.",
  );
}

export const REQUEST_TIMEOUT_MS = 30_000;

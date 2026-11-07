/**
 * These cover the ways configuration arrives wrong, because every one of them
 * has already reached a running app. The values come from `app.json` and from
 * bundler substitution, neither of which is bound by the types this module
 * declares, so a value that is not a string is a runtime possibility no matter
 * what TypeScript believes.
 */

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { extra: {} }, expoGoConfig: undefined },
}));

const Constants = require("expo-constants").default;

function loadEnv(
  env: Record<string, unknown>,
  extra: Record<string, unknown> = {},
  hostUri?: string,
) {
  jest.resetModules();

  Constants.expoConfig = { extra, hostUri };

  delete process.env.EXPO_PUBLIC_API_URL;
  delete process.env.EXPO_PUBLIC_WS_URL;
  Object.assign(process.env, env);

  return require("./env");
}

describe("env", () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
  });

  it("derives the socket URL from the API URL", () => {
    const env = loadEnv({ EXPO_PUBLIC_API_URL: "https://api.example.com/api/v1" });

    expect(env.WS_BASE_URL).toBe("wss://api.example.com/api/v1/ws");
  });

  it("keeps the socket scheme in step with the API scheme", () => {
    // Deriving rather than repeating is the point: a plaintext API must not
    // produce a TLS socket, which fails the handshake with no explanation.
    const env = loadEnv({ EXPO_PUBLIC_API_URL: "http://192.168.0.110:8080/api/v1" });

    expect(env.WS_BASE_URL).toBe("ws://192.168.0.110:8080/api/v1/ws");
  });

  it("ignores a configured value that is not a string", () => {
    // An object here previously became "[object Object]" in a template
    // literal. That is a relative URL, so the browser resolved it against
    // whichever page was open and reported a failed connection to the dev
    // server rather than anything resembling the real cause.
    const env = loadEnv(
      { EXPO_PUBLIC_API_URL: "https://api.example.com/api/v1" },
      { wsUrl: { host: "api.example.com" } },
    );

    expect(env.WS_BASE_URL).toBe("wss://api.example.com/api/v1/ws");
  });

  it("treats an unexpanded placeholder as absent", () => {
    // A shell or bundler that could not resolve the variable leaves the word
    // behind as text, which is emptiness wearing a costume.
    const env = loadEnv({
      EXPO_PUBLIC_API_URL: "https://api.example.com/api/v1",
      EXPO_PUBLIC_WS_URL: "undefined",
    });

    expect(env.WS_BASE_URL).toBe("wss://api.example.com/api/v1/ws");
  });

  it("refuses a socket URL that is not absolute", () => {
    expect(() =>
      loadEnv({
        EXPO_PUBLIC_API_URL: "https://api.example.com/api/v1",
        EXPO_PUBLIC_WS_URL: "/api/v1/ws",
      }),
    ).toThrow(/does not begin with/);
  });

  it("refuses a socket URL whose scheme contradicts the API", () => {
    expect(() =>
      loadEnv({
        EXPO_PUBLIC_API_URL: "http://192.168.0.110:8080/api/v1",
        EXPO_PUBLIC_WS_URL: "wss://192.168.0.110:8080/api/v1/ws",
      }),
    ).toThrow(/cannot connect to a server without TLS/);
  });

  it("refuses a socket URL missing the prefix the API carries", () => {
    expect(() =>
      loadEnv({
        EXPO_PUBLIC_API_URL: "http://192.168.0.110:8080/api/v1",
        EXPO_PUBLIC_WS_URL: "ws://192.168.0.110:8080/ws",
      }),
    ).toThrow(/missing the \/api\/v1 prefix/);
  });

  it("drops a trailing slash so paths do not double up", () => {
    const env = loadEnv({ EXPO_PUBLIC_API_URL: "https://api.example.com/api/v1/" });

    expect(env.API_BASE_URL).toBe("https://api.example.com/api/v1");
  });
});

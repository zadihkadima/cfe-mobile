import React from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";

import authReducer from "@/core/store/authSlice";

import { useUploadMyAvatar } from "./useUploadMyAvatar";

const mockGetMyProfile = jest.fn();
const mockUploadMyAvatar = jest.fn();

jest.mock("@/modules/user/api/profile.api", () => ({
  getMyProfile: (...args: unknown[]) => mockGetMyProfile(...args),
  uploadMyAvatar: (...args: unknown[]) => mockUploadMyAvatar(...args),
}));

function wrapper(store: ReturnType<typeof makeStore>) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      </Provider>
    );
  };
}

function makeStore() {
  return configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: {
        user: {
          id: "u1",
          email: "ada@example.com",
          role: "client" as const,
          avatar_url: "https://x/old.png",
        },
        hydrated: true,
      },
    },
  });
}

const picked = { uri: "file:///new.jpg", name: "new.jpg", mimeType: "image/jpeg" };

beforeEach(() => {
  jest.clearAllMocks();
  mockUploadMyAvatar.mockResolvedValue({ avatar_url: "https://x/new.png" });
  mockGetMyProfile.mockResolvedValue({
    id: "u1",
    email: "ada@example.com",
    role: "client",
    avatar_url: "https://x/new.png",
  });
});

describe("useUploadMyAvatar", () => {

  /*
   * This is the bug the hook shipped with.
   *
   * `fetchQuery` was called without a queryFn, which does not inherit the one
   * the profile query registered -- it replaces it, and rejects with "Missing
   * queryFn". The rejection came after the upload had already succeeded, so
   * the picture reached the server, the screen reported a failure, and the
   * store was never told. The header and every message bubble went on drawing
   * the old picture until the next sign-in.
   */
  it("refetches the profile after uploading", async () => {
    const store = makeStore();

    const { result } = await renderHook(() => useUploadMyAvatar(), {
      wrapper: wrapper(store),
    });

    await act(async () => {
      await result.current.mutateAsync(picked);
    });

    await waitFor(() => expect(mockGetMyProfile).toHaveBeenCalled());
  });

  it("reports success rather than failing after the picture was accepted", async () => {
    const store = makeStore();

    const { result } = await renderHook(() => useUploadMyAvatar(), {
      wrapper: wrapper(store),
    });

    await act(async () => {
      await result.current.mutateAsync(picked);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.isError).toBe(false);
  });

  // The header and the drawer read the picture from the store, not from the
  // query, so this dispatch is the only thing that updates them.
  it("puts the new picture in the store so the header follows", async () => {
    const store = makeStore();

    const { result } = await renderHook(() => useUploadMyAvatar(), {
      wrapper: wrapper(store),
    });

    await act(async () => {
      await result.current.mutateAsync(picked);
    });

    await waitFor(() =>
      expect(store.getState().auth.user?.avatar_url).toBe("https://x/new.png"),
    );
  });

  // A failed upload must not leave the store describing a picture the server
  // does not have.
  it("leaves the stored picture alone when the upload fails", async () => {
    mockUploadMyAvatar.mockRejectedValue(new Error("network"));

    const store = makeStore();

    const { result } = await renderHook(() => useUploadMyAvatar(), {
      wrapper: wrapper(store),
    });

    await act(async () => {
      await result.current.mutateAsync(picked).catch(() => undefined);
    });

    expect(mockGetMyProfile).not.toHaveBeenCalled();
    expect(store.getState().auth.user?.avatar_url).toBe("https://x/old.png");
  });

});

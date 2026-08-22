import { createElement, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { conversationKeys } from "../keys";

const { getConversationSocketMock, useAppSelectorMock } = vi.hoisted(() => ({
  getConversationSocketMock: vi.fn(),
  useAppSelectorMock: vi.fn(),
}));

vi.mock("@/lib/socket", () => ({
  getConversationSocket: getConversationSocketMock,
}));

// The shared socket hook subscribes to the access token so a refused handshake
// can be retried once the store has a fresh one — this stand-in lets a test
// move the token without a real store/Provider.
vi.mock("@/shared/store/hooks", () => ({
  useAppSelector: useAppSelectorMock,
}));

// Imported after the mock so the hook picks up the mocked module.
import { useUnreadRealtime } from "./useUnreadRealtime";

type Listener = (payload?: unknown) => void;

/**
 * A stand-in for the socket.io client that records the listeners the hook
 * registers, so a test can fire them directly instead of opening a real
 * connection — same approach as useConversationRealtime.test.ts.
 */
function createFakeSocket() {
  const listeners = new Map<string, Set<Listener>>();

  const on = vi.fn((event: string, listener: Listener) => {
    const forEvent = listeners.get(event) ?? new Set<Listener>();
    forEvent.add(listener);
    listeners.set(event, forEvent);
  });

  const off = vi.fn((event: string, listener: Listener) => {
    listeners.get(event)?.delete(listener);
  });

  return {
    socket: {
      on,
      off,
      connect: vi.fn(),
      disconnect: vi.fn(),
      connected: false,
    },
    emitToClient: (event: string, payload?: unknown) => {
      for (const listener of listeners.get(event) ?? []) {
        listener(payload);
      }
    },
    listenerCount: (event: string) => listeners.get(event)?.size ?? 0,
  };
}

function renderUnreadRealtime(queryClient: QueryClient) {
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
  return renderHook(() => useUnreadRealtime(), { wrapper });
}

describe("useUnreadRealtime", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    useAppSelectorMock.mockReturnValue("access-token-1");
  });

  it("does nothing when the socket is unconfigured", () => {
    getConversationSocketMock.mockReturnValue(null);

    expect(() => renderUnreadRealtime(queryClient)).not.toThrow();
  });

  it("connects the shared socket on mount", () => {
    const fake = createFakeSocket();
    getConversationSocketMock.mockReturnValue(fake.socket);

    renderUnreadRealtime(queryClient);

    expect(fake.socket.connect).toHaveBeenCalledTimes(1);
  });

  it("invalidates both unread keys when a message is created, with no interval needed", async () => {
    const fake = createFakeSocket();
    getConversationSocketMock.mockReturnValue(fake.socket);
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    renderUnreadRealtime(queryClient);
    act(() => fake.emitToClient("message.created", { submissionId: "s-1" }));

    expect(invalidate).toHaveBeenCalledWith({
      queryKey: conversationKeys.unreadCount,
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: conversationKeys.unreadCounts,
    });
  });

  it("invalidates both unread keys when a negotiation changes", () => {
    const fake = createFakeSocket();
    getConversationSocketMock.mockReturnValue(fake.socket);
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    renderUnreadRealtime(queryClient);
    act(() =>
      fake.emitToClient("negotiation.changed", {
        submissionId: "s-1",
        kind: "interview_proposed",
      }),
    );

    expect(invalidate).toHaveBeenCalledWith({
      queryKey: conversationKeys.unreadCount,
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: conversationKeys.unreadCounts,
    });
  });

  it("reconnects when the gateway refuses the handshake, with no thread mounted to do it", async () => {
    const fake = createFakeSocket();
    getConversationSocketMock.mockReturnValue(fake.socket);

    renderUnreadRealtime(queryClient);
    expect(fake.socket.connect).toHaveBeenCalledTimes(1);

    // The badges live on pages where no thread is mounted, so nothing else
    // would revive this socket for the rest of the tab's life.
    act(() => fake.emitToClient("disconnect", "io server disconnect"));

    await vi.waitFor(() =>
      expect(fake.socket.connect).toHaveBeenCalledTimes(2),
    );
  });

  it("reconnects when the access token rotates", () => {
    const fake = createFakeSocket();
    getConversationSocketMock.mockReturnValue(fake.socket);

    const { rerender } = renderUnreadRealtime(queryClient);
    expect(fake.socket.connect).toHaveBeenCalledTimes(1);

    useAppSelectorMock.mockReturnValue("access-token-2");
    rerender();

    expect(fake.socket.connect).toHaveBeenCalledTimes(2);
  });

  it("does not reconnect again on a second refusal of the same token", async () => {
    const fake = createFakeSocket();
    getConversationSocketMock.mockReturnValue(fake.socket);

    renderUnreadRealtime(queryClient);
    act(() => fake.emitToClient("disconnect", "io server disconnect"));
    await vi.waitFor(() =>
      expect(fake.socket.connect).toHaveBeenCalledTimes(2),
    );

    // A still-invalid token must not loop handshake attempts against the
    // gateway, which is not covered by the API's throttler.
    act(() => fake.emitToClient("disconnect", "io server disconnect"));

    expect(fake.socket.connect).toHaveBeenCalledTimes(2);
  });

  it("removes its listeners on unmount", () => {
    const fake = createFakeSocket();
    getConversationSocketMock.mockReturnValue(fake.socket);

    const { unmount } = renderUnreadRealtime(queryClient);
    expect(fake.listenerCount("message.created")).toBe(1);
    expect(fake.listenerCount("negotiation.changed")).toBe(1);

    unmount();

    expect(fake.listenerCount("message.created")).toBe(0);
    expect(fake.listenerCount("negotiation.changed")).toBe(0);
  });

  it("does not leave the socket disconnected on unmount", () => {
    const fake = createFakeSocket();
    getConversationSocketMock.mockReturnValue(fake.socket);

    const { unmount } = renderUnreadRealtime(queryClient);
    unmount();

    expect(fake.socket.disconnect).not.toHaveBeenCalled();
  });
});

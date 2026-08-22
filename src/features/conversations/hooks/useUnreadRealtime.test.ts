import { createElement, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { conversationKeys } from "../keys";

const { getConversationSocketMock } = vi.hoisted(() => ({
  getConversationSocketMock: vi.fn(),
}));

vi.mock("@/lib/socket", () => ({
  getConversationSocket: getConversationSocketMock,
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

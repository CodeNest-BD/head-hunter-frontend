import { createElement, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { inboxKeys } from "@/features/inbox/keys";

import { conversationKeys } from "../keys";

const { getConversationSocketMock, useAuthMock, useAppSelectorMock } =
  vi.hoisted(() => ({
    getConversationSocketMock: vi.fn(),
    useAuthMock: vi.fn(),
    useAppSelectorMock: vi.fn(),
  }));

vi.mock("@/lib/socket", () => ({
  getConversationSocket: getConversationSocketMock,
}));

// The hook reads the current user's id to tell its own echo apart from the
// counterparty's message.
vi.mock("@/features/auth", () => ({
  useAuth: useAuthMock,
}));

// The hook subscribes to the access token purely as an effect dependency —
// this stand-in lets a test move it without a real store/Provider.
vi.mock("@/shared/store/hooks", () => ({
  useAppSelector: useAppSelectorMock,
}));

// Imported after the mocks so the hook picks up the mocked modules.
import { useConversationRealtime } from "./useConversationRealtime";

const SUBMISSION_ID = "submission-1";
const CURRENT_USER_ID = "user-me";
const COUNTERPARTY_USER_ID = "user-them";

type Listener = (payload: unknown) => void;

/**
 * A stand-in for the socket.io client that records the listeners the hook
 * registers, so a test can fire them directly instead of opening a real
 * connection.
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
    on,
    off,
    emitToClient: (event: string, payload?: unknown) => {
      for (const listener of listeners.get(event) ?? []) {
        listener(payload);
      }
    },
    listenerCount: (event: string) => listeners.get(event)?.size ?? 0,
  };
}

const messageFrame = (overrides: Record<string, unknown> = {}) => ({
  candidateId: SUBMISSION_ID,
  messageId: "message-1",
  senderUserId: COUNTERPARTY_USER_ID,
  createdAt: "2026-08-14T10:00:00.000Z",
  ...overrides,
});

function renderRealtime(queryClient: QueryClient) {
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
  return renderHook(() => useConversationRealtime(SUBMISSION_ID), { wrapper });
}

describe("useConversationRealtime", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    useAuthMock.mockReturnValue({ user: { id: CURRENT_USER_ID } });
    useAppSelectorMock.mockReturnValue("access-token-1");
  });

  it("reports polling when the socket is unconfigured", () => {
    getConversationSocketMock.mockReturnValue(null);

    const { result } = renderRealtime(queryClient);

    expect(result.current.status).toBe("polling");
  });

  it("reports live once the socket connects", async () => {
    const fake = createFakeSocket();
    getConversationSocketMock.mockReturnValue(fake.socket);

    const { result } = renderRealtime(queryClient);
    act(() => fake.emitToClient("connect"));

    await waitFor(() => expect(result.current.status).toBe("live"));
  });

  it("falls back to polling when the socket disconnects", async () => {
    const fake = createFakeSocket();
    getConversationSocketMock.mockReturnValue(fake.socket);

    const { result } = renderRealtime(queryClient);
    act(() => fake.emitToClient("connect"));
    await waitFor(() => expect(result.current.status).toBe("live"));

    act(() => fake.emitToClient("disconnect"));

    await waitFor(() => expect(result.current.status).toBe("polling"));
  });

  it("reconnects when the gateway refuses the handshake with io server disconnect", async () => {
    const fake = createFakeSocket();
    getConversationSocketMock.mockReturnValue(fake.socket);

    renderRealtime(queryClient);
    expect(fake.socket.connect).toHaveBeenCalledTimes(1);

    act(() => fake.emitToClient("disconnect", "io server disconnect"));

    await waitFor(() => expect(fake.socket.connect).toHaveBeenCalledTimes(2));
  });

  it("does not reconnect again on a second refusal of the same token", async () => {
    const fake = createFakeSocket();
    getConversationSocketMock.mockReturnValue(fake.socket);

    renderRealtime(queryClient);
    expect(fake.socket.connect).toHaveBeenCalledTimes(1);

    // First refusal: the token in play hasn't been refused before, so this
    // retries once — mirroring the real handshake that was just rejected.
    act(() => fake.emitToClient("disconnect", "io server disconnect"));
    await waitFor(() => expect(fake.socket.connect).toHaveBeenCalledTimes(2));

    // Second refusal with the same still-invalid token must not retry again:
    // this is what stops a stale token from looping reconnect attempts.
    act(() => fake.emitToClient("disconnect", "io server disconnect"));

    expect(fake.socket.connect).toHaveBeenCalledTimes(2);
  });

  it("reconnects the shared socket when the access token rotates", () => {
    const fake = createFakeSocket();
    getConversationSocketMock.mockReturnValue(fake.socket);

    const { rerender } = renderRealtime(queryClient);
    expect(fake.socket.connect).toHaveBeenCalledTimes(1);

    // A rotated token (refresh, or a fresh login after a cleared session)
    // must re-run the effect and reconnect — nothing else in the dependency
    // array changes when only the token changes.
    useAppSelectorMock.mockReturnValue("access-token-2");
    rerender();

    expect(fake.socket.connect).toHaveBeenCalledTimes(2);
  });

  it("invalidates the thread and the inbox on a counterparty message", async () => {
    const fake = createFakeSocket();
    getConversationSocketMock.mockReturnValue(fake.socket);
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    renderRealtime(queryClient);
    act(() => fake.emitToClient("message.created", messageFrame()));

    await waitFor(() => {
      expect(invalidate).toHaveBeenCalledWith({
        queryKey: conversationKeys.all,
      });
      expect(invalidate).toHaveBeenCalledWith({ queryKey: inboxKeys.all });
    });
  });

  it("ignores a frame for a different submission", () => {
    const fake = createFakeSocket();
    getConversationSocketMock.mockReturnValue(fake.socket);
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    renderRealtime(queryClient);
    act(() =>
      fake.emitToClient(
        "message.created",
        messageFrame({ candidateId: "submission-other" }),
      ),
    );

    expect(invalidate).not.toHaveBeenCalled();
  });

  it("ignores the caller's own message, which the send mutation already handled", () => {
    const fake = createFakeSocket();
    getConversationSocketMock.mockReturnValue(fake.socket);
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    renderRealtime(queryClient);
    act(() =>
      fake.emitToClient(
        "message.created",
        messageFrame({ senderUserId: CURRENT_USER_ID }),
      ),
    );

    expect(invalidate).not.toHaveBeenCalled();
  });

  it("invalidates on an own-looking frame when the current user is unknown", async () => {
    useAuthMock.mockReturnValue({ user: null });
    const fake = createFakeSocket();
    getConversationSocketMock.mockReturnValue(fake.socket);
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    renderRealtime(queryClient);
    act(() =>
      fake.emitToClient(
        "message.created",
        messageFrame({ senderUserId: CURRENT_USER_ID }),
      ),
    );

    await waitFor(() => expect(invalidate).toHaveBeenCalled());
  });

  it("removes its listeners on unmount", () => {
    const fake = createFakeSocket();
    getConversationSocketMock.mockReturnValue(fake.socket);

    const { unmount } = renderRealtime(queryClient);
    expect(fake.listenerCount("message.created")).toBe(1);

    unmount();

    expect(fake.listenerCount("message.created")).toBe(0);
  });
});

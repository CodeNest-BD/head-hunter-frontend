import { createElement, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { REALTIME_SUBSCRIBE_STATES } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { submissionKeys } from "@/features/submissions/keys";

import { conversationKeys } from "../keys";

const { getSupabaseClientMock, fetchRealtimeTokenMock, useAuthMock } =
  vi.hoisted(() => ({
    getSupabaseClientMock: vi.fn(),
    fetchRealtimeTokenMock: vi.fn(),
    useAuthMock: vi.fn(),
  }));

vi.mock("@/lib/supabase", () => ({
  getSupabaseClient: getSupabaseClientMock,
}));

vi.mock("../api/conversations", () => ({
  fetchRealtimeToken: fetchRealtimeTokenMock,
}));

// The hook reads the current user's id from auth state to tell a
// self-authored INSERT echo apart from a counterparty's.
vi.mock("@/features/auth", () => ({
  useAuth: useAuthMock,
}));

// Imported after the mocks above so the hook picks up the mocked modules.
import { useConversationRealtime } from "./useConversationRealtime";

const CURRENT_USER_ID = "user-me";
const COUNTERPARTY_USER_ID = "user-them";

interface InsertPayload {
  new: { sender_user_id: string };
}
type PostgresChangesCallback = (payload: InsertPayload) => void;
type SubscribeCallback = (status: REALTIME_SUBSCRIBE_STATES) => void;

interface FakeChannel {
  topic: string;
  on: ReturnType<typeof vi.fn>;
  subscribe: ReturnType<typeof vi.fn>;
}

/** A minimal stand-in for `SupabaseClient`, capturing the callbacks the hook
 * registers so a test can trigger them directly instead of a real socket.
 * `client.channel(topic)` returns a fresh object per call (one per real
 * `connect()`/reconnect), recorded in `channels`, so a test can distinguish
 * "the channel removed on teardown" from "the channel created after it" —
 * needed to assert the `submissionId`-change behaviour below. `emitInsert`
 * and `emitSubscribeStatus` always act on the most recently subscribed
 * channel, mirroring how the hook only ever has one channel live at a time. */
function createFakeSupabaseClient() {
  let onInsert: PostgresChangesCallback | undefined;
  let onSubscribe: SubscribeCallback | undefined;
  const channels: FakeChannel[] = [];

  const client = {
    realtime: { setAuth: vi.fn().mockResolvedValue(undefined) },
    channel: vi.fn((topic: string) => {
      const fakeChannel: FakeChannel = {
        topic,
        on: vi.fn(
          (
            _event: string,
            _filter: unknown,
            callback: PostgresChangesCallback,
          ) => {
            onInsert = callback;
            return fakeChannel;
          },
        ),
        subscribe: vi.fn((callback: SubscribeCallback) => {
          onSubscribe = callback;
          return fakeChannel;
        }),
      };
      channels.push(fakeChannel);
      return fakeChannel;
    }),
    removeChannel: vi.fn().mockResolvedValue({ status: "ok", error: null }),
  };

  return {
    client,
    channels,
    get channel(): FakeChannel {
      return channels[0];
    },
    // Defaults to a counterparty-authored row: most tests only care that an
    // INSERT triggers an invalidation, not who sent it.
    emitInsert: (senderUserId: string = COUNTERPARTY_USER_ID) =>
      onInsert?.({ new: { sender_user_id: senderUserId } }),
    emitSubscribeStatus: (status: REALTIME_SUBSCRIBE_STATES) =>
      onSubscribe?.(status),
  };
}

function renderRealtimeHook(submissionId: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);

  return {
    queryClient,
    ...renderHook(() => useConversationRealtime(submissionId), { wrapper }),
  };
}

describe("useConversationRealtime", () => {
  beforeEach(() => {
    getSupabaseClientMock.mockReset();
    fetchRealtimeTokenMock.mockReset();
    useAuthMock.mockReset();
    useAuthMock.mockReturnValue({ user: { id: CURRENT_USER_ID } });
  });

  it("reports polling immediately when the client is unconfigured", () => {
    getSupabaseClientMock.mockReturnValue(null);

    const { result } = renderRealtimeHook("submission-1");

    expect(result.current.status).toBe("polling");
    expect(fetchRealtimeTokenMock).not.toHaveBeenCalled();
  });

  it("authenticates the realtime client with the fetched token before subscribing", async () => {
    const fake = createFakeSupabaseClient();
    getSupabaseClientMock.mockReturnValue(fake.client);
    fetchRealtimeTokenMock.mockResolvedValue({
      token: "tok-123",
      expiresIn: 900,
    });

    const { result } = renderRealtimeHook("submission-1");

    await waitFor(() =>
      expect(fake.client.realtime.setAuth).toHaveBeenCalledWith("tok-123"),
    );
    expect(fake.channel.subscribe).toHaveBeenCalled();

    const setAuthOrder =
      fake.client.realtime.setAuth.mock.invocationCallOrder[0];
    const subscribeOrder = fake.channel.subscribe.mock.invocationCallOrder[0];
    expect(setAuthOrder).toBeLessThan(subscribeOrder);

    act(() => fake.emitSubscribeStatus(REALTIME_SUBSCRIBE_STATES.SUBSCRIBED));
    await waitFor(() => expect(result.current.status).toBe("live"));
  });

  it("invalidates the thread query on an INSERT event instead of writing the row into the cache", async () => {
    const fake = createFakeSupabaseClient();
    getSupabaseClientMock.mockReturnValue(fake.client);
    fetchRealtimeTokenMock.mockResolvedValue({
      token: "tok-123",
      expiresIn: 900,
    });

    const { queryClient } = renderRealtimeHook("submission-1");
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const setQueryDataSpy = vi.spyOn(queryClient, "setQueryData");

    await waitFor(() => expect(fake.channel.on).toHaveBeenCalled());
    fake.emitInsert(COUNTERPARTY_USER_ID);

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: conversationKeys.all,
    });
    expect(setQueryDataSpy).not.toHaveBeenCalled();
  });

  it("skips the invalidation when the INSERT was authored by the current user", async () => {
    const fake = createFakeSupabaseClient();
    getSupabaseClientMock.mockReturnValue(fake.client);
    fetchRealtimeTokenMock.mockResolvedValue({
      token: "tok-123",
      expiresIn: 900,
    });

    const { queryClient } = renderRealtimeHook("submission-1");
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    await waitFor(() => expect(fake.channel.on).toHaveBeenCalled());
    fake.emitInsert(CURRENT_USER_ID);

    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it("still invalidates when the current user's id is unavailable, rather than risk a missed message", async () => {
    useAuthMock.mockReturnValue({ user: null });
    const fake = createFakeSupabaseClient();
    getSupabaseClientMock.mockReturnValue(fake.client);
    fetchRealtimeTokenMock.mockResolvedValue({
      token: "tok-123",
      expiresIn: 900,
    });

    const { queryClient } = renderRealtimeHook("submission-1");
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    await waitFor(() => expect(fake.channel.on).toHaveBeenCalled());
    // Even though this row happens to carry what would be a self-match, the
    // viewer's own id can't be confirmed, so it must still invalidate.
    fake.emitInsert(CURRENT_USER_ID);

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: conversationKeys.all,
    });
  });

  it("invalidates the unread-count and submissions-list queries on a counterparty INSERT, not only the thread key", async () => {
    const fake = createFakeSupabaseClient();
    getSupabaseClientMock.mockReturnValue(fake.client);
    fetchRealtimeTokenMock.mockResolvedValue({
      token: "tok-123",
      expiresIn: 900,
    });

    const { queryClient } = renderRealtimeHook("submission-1");
    // Seed both queries so `invalidateQueries` has an existing cache entry to
    // mark stale — a key with no observer and no prior fetch has nothing to
    // flag, so this is what makes the assertion below meaningful rather than
    // vacuously true.
    queryClient.setQueryData(conversationKeys.unreadCount, 0);
    const listParams = { page: 1, limit: 20 };
    queryClient.setQueryData(submissionKeys.list(listParams), {
      data: [],
      meta: { page: 1, totalPages: 1 },
    });

    await waitFor(() => expect(fake.channel.on).toHaveBeenCalled());
    fake.emitInsert(COUNTERPARTY_USER_ID);

    expect(
      queryClient.getQueryState(conversationKeys.unreadCount)?.isInvalidated,
    ).toBe(true);
    expect(
      queryClient.getQueryState(submissionKeys.list(listParams))
        ?.isInvalidated,
    ).toBe(true);
  });

  it("does not invalidate the unread-count or submissions-list queries when the INSERT is self-authored", async () => {
    const fake = createFakeSupabaseClient();
    getSupabaseClientMock.mockReturnValue(fake.client);
    fetchRealtimeTokenMock.mockResolvedValue({
      token: "tok-123",
      expiresIn: 900,
    });

    const { queryClient } = renderRealtimeHook("submission-1");
    queryClient.setQueryData(conversationKeys.unreadCount, 0);
    const listParams = { page: 1, limit: 20 };
    queryClient.setQueryData(submissionKeys.list(listParams), {
      data: [],
      meta: { page: 1, totalPages: 1 },
    });

    await waitFor(() => expect(fake.channel.on).toHaveBeenCalled());
    fake.emitInsert(CURRENT_USER_ID);

    expect(
      queryClient.getQueryState(conversationKeys.unreadCount)?.isInvalidated,
    ).toBe(false);
    expect(
      queryClient.getQueryState(submissionKeys.list(listParams))
        ?.isInvalidated,
    ).toBe(false);
  });

  it("removes the channel on unmount so no subscription is leaked", async () => {
    const fake = createFakeSupabaseClient();
    getSupabaseClientMock.mockReturnValue(fake.client);
    fetchRealtimeTokenMock.mockResolvedValue({
      token: "tok-123",
      expiresIn: 900,
    });

    const { unmount } = renderRealtimeHook("submission-1");
    await waitFor(() => expect(fake.channel.subscribe).toHaveBeenCalled());

    unmount();

    expect(fake.client.removeChannel).toHaveBeenCalled();
  });

  it("falls back to polling after a resubscribe attempt also errors", async () => {
    const fake = createFakeSupabaseClient();
    getSupabaseClientMock.mockReturnValue(fake.client);
    fetchRealtimeTokenMock.mockResolvedValue({
      token: "tok-123",
      expiresIn: 900,
    });

    const { result } = renderRealtimeHook("submission-1");
    await waitFor(() => expect(fake.channel.subscribe).toHaveBeenCalled());

    act(() =>
      fake.emitSubscribeStatus(REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR),
    );
    await waitFor(() => expect(fake.client.channel).toHaveBeenCalledTimes(2));

    act(() =>
      fake.emitSubscribeStatus(REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR),
    );

    await waitFor(() => expect(result.current.status).toBe("polling"));
    // Bounded to one retry per failure episode: two failures mint at most
    // twice, never storming the 10/minute token endpoint.
    expect(fetchRealtimeTokenMock).toHaveBeenCalledTimes(2);
  });

  it("falls back to polling after a resubscribe attempt also times out or closes", async () => {
    const fake = createFakeSupabaseClient();
    getSupabaseClientMock.mockReturnValue(fake.client);
    fetchRealtimeTokenMock.mockResolvedValue({
      token: "tok-123",
      expiresIn: 900,
    });

    const { result } = renderRealtimeHook("submission-1");
    await waitFor(() => expect(fake.channel.subscribe).toHaveBeenCalled());

    // TIMED_OUT and CLOSED are treated the same as CHANNEL_ERROR: a dropped
    // connection doesn't always surface as an explicit error.
    act(() => fake.emitSubscribeStatus(REALTIME_SUBSCRIBE_STATES.TIMED_OUT));
    await waitFor(() => expect(fake.client.channel).toHaveBeenCalledTimes(2));

    act(() => fake.emitSubscribeStatus(REALTIME_SUBSCRIBE_STATES.CLOSED));

    await waitFor(() => expect(result.current.status).toBe("polling"));
    expect(fetchRealtimeTokenMock).toHaveBeenCalledTimes(2);
  });

  it("tears down the old channel and subscribes to the new one when submissionId changes", async () => {
    const fake = createFakeSupabaseClient();
    getSupabaseClientMock.mockReturnValue(fake.client);
    fetchRealtimeTokenMock.mockResolvedValue({
      token: "tok-123",
      expiresIn: 900,
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);

    const { rerender } = renderHook(
      ({ submissionId }: { submissionId: string }) =>
        useConversationRealtime(submissionId),
      { wrapper, initialProps: { submissionId: "submission-1" } },
    );

    await waitFor(() =>
      expect(fake.client.channel).toHaveBeenNthCalledWith(
        1,
        "conversation-submission-1",
      ),
    );
    const firstChannel = fake.channels[0];

    rerender({ submissionId: "submission-2" });

    await waitFor(() =>
      expect(fake.client.channel).toHaveBeenNthCalledWith(
        2,
        "conversation-submission-2",
      ),
    );
    expect(fake.client.removeChannel).toHaveBeenCalledWith(firstChannel);
    expect(fake.channels[1].on).toHaveBeenCalledWith(
      "postgres_changes",
      expect.objectContaining({ filter: "submission_id=eq.submission-2" }),
      expect.any(Function),
    );
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The module under test caches its socket at module scope, so each test needs
 * a fresh module instance — otherwise the previous test's socket (and its
 * `disconnect` spy) would leak into the next one.
 */
describe("resetConversationSocket", () => {
  const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;

  beforeEach(() => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:8080/v1";
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_URL = originalApiUrl;
  });

  it("drops the socket when the session is cleared", async () => {
    const { getConversationSocket, resetConversationSocket } = await import(
      "./socket"
    );

    const socket = getConversationSocket();
    expect(socket).not.toBeNull();
    const disconnectSpy = vi.spyOn(socket!, "disconnect");

    resetConversationSocket();

    // The old socket is torn down rather than left connected to the previous
    // user's room...
    expect(disconnectSpy).toHaveBeenCalled();

    // ...and the next caller gets a brand-new socket, which re-reads `auth`
    // on its very first connect instead of reusing stale identity.
    const rebuilt = getConversationSocket();
    expect(rebuilt).not.toBeNull();
    expect(rebuilt).not.toBe(socket);
  });
});

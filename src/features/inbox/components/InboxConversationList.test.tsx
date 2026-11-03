import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/utils";
import type { InboxConversationRow } from "../schemas";
import { InboxConversationList } from "./InboxConversationList";

vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));

const conversationsMock = vi.fn();

function row(overrides: Partial<InboxConversationRow> = {}) {
  return {
    candidateId: "cand-1",
    candidateName: "Sarah Ahmed",
    status: "submitted" as const,
    jobId: "job-1",
    jobTitle: "Product Designer",
    counterpartyName: "Initech",
    unreadMessages: 0,
    needsReview: false,
    lastMessagePreview: null,
    lastActivityAt: new Date("2026-11-01"),
    ...overrides,
  };
}

vi.mock("../hooks/useInbox", () => ({
  useInboxConversations: (_side: unknown, params: unknown) => {
    conversationsMock(params);
    return {
      data: {
        data: [row()],
        meta: { total: 1, totalPages: 1, page: 1, limit: 20 },
      },
      isPending: false,
      isError: false,
      refetch: vi.fn(),
      isPlaceholderData: false,
    };
  },
  useInboxAttentionCount: () => ({ data: 0 }),
}));

vi.mock("@/features/conversations/hooks/useConversation", () => ({
  useMarkAllThreadsRead: () => ({ mutate: vi.fn(), isPending: false }),
}));

/** The params of the most recent render's query. */
const lastParams = (): Record<string, unknown> =>
  conversationsMock.mock.calls.at(-1)?.[0] as Record<string, unknown>;

describe("InboxConversationList stage filter", () => {
  beforeEach(() => conversationsMock.mockReset());

  it("asks for every stage when nothing is filtered", () => {
    renderWithProviders(<InboxConversationList side="recruiter" />);

    expect(lastParams().status).toEqual([]);
  });

  it("opens filtered to the stages it was handed", () => {
    // How the dashboard's "Candidates In Process" card lands here.
    renderWithProviders(
      <InboxConversationList
        side="recruiter"
        initialStatuses={["submitted", "reviewing", "interviewing", "offered"]}
      />,
    );

    expect(lastParams().status).toEqual([
      "submitted",
      "reviewing",
      "interviewing",
      "offered",
    ]);
    expect(
      screen.getByRole("button", { name: /stage: 4 selected/i }),
    ).toBeInTheDocument();
  });

  it("names the one stage chosen rather than counting it", () => {
    renderWithProviders(
      <InboxConversationList side="recruiter" initialStatuses={["offered"]} />,
    );

    expect(
      screen.getByRole("button", { name: /stage: offered/i }),
    ).toBeInTheDocument();
  });

  it("sends the stages a reader ticks, and keeps the menu open for more", async () => {
    const user = userEvent.setup();
    renderWithProviders(<InboxConversationList side="recruiter" />);

    await user.click(screen.getByRole("button", { name: "Stage" }));
    await user.click(screen.getByRole("menuitemcheckbox", { name: /hired/i }));
    // Still open — picking three stages must not mean reopening the menu
    // three times.
    await user.click(screen.getByRole("menuitemcheckbox", { name: /passed/i }));

    expect(lastParams().status).toEqual(["hired", "passed"]);
  });

  it("sends the stages in pipeline order however they were ticked", async () => {
    // The value feeds a query key, so a set that reordered itself on each
    // click would refetch every time.
    const user = userEvent.setup();
    renderWithProviders(<InboxConversationList side="recruiter" />);

    await user.click(screen.getByRole("button", { name: "Stage" }));
    await user.click(screen.getByRole("menuitemcheckbox", { name: /passed/i }));
    await user.click(screen.getByRole("menuitemcheckbox", { name: /hired/i }));

    expect(lastParams().status).toEqual(["hired", "passed"]);
  });

  it("clears back to every stage", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <InboxConversationList side="recruiter" initialStatuses={["offered"]} />,
    );

    await user.click(screen.getByRole("button", { name: /stage: offered/i }));
    await user.click(screen.getByRole("menuitem", { name: /clear stage/i }));

    expect(lastParams().status).toEqual([]);
  });

  it("drops a stage ticked twice", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <InboxConversationList side="recruiter" initialStatuses={["hired"]} />,
    );

    await user.click(screen.getByRole("button", { name: /stage: hired/i }));
    await user.click(screen.getByRole("menuitemcheckbox", { name: /hired/i }));

    expect(lastParams().status).toEqual([]);
  });
});

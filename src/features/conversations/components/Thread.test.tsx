import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/utils";
import type { ConversationThread } from "../schemas";
import { Thread } from "./Thread";

/**
 * Same defaults as `renderWithProviders`, but keeps a handle on the
 * `QueryClient` — the scroll tests below simulate "a new message arrived"
 * the same way the app does (a realtime/poll-triggered `invalidateQueries`),
 * not by re-mounting the component.
 */
function renderWithClient(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
    ),
  };
}

/**
 * Overrides `Element.prototype.scrollHeight` with a getter this test
 * controls, since jsdom never computes real layout. Installed on the
 * prototype rather than one specific node — an error→Retry unmounts and
 * remounts the scroll container as a brand-new element, and a per-instance
 * override (the previous version of this helper) would go back to jsdom's
 * default 0 on that fresh node, making mount-time and remount-time scroll
 * behaviour unobservable. Returns a restore function; callers must invoke
 * it (an `afterEach` below does this automatically) so the override never
 * leaks into another test.
 */
function mockScrollHeight(getValue: () => number): () => void {
  const original = Object.getOwnPropertyDescriptor(
    Element.prototype,
    "scrollHeight",
  );
  Object.defineProperty(Element.prototype, "scrollHeight", {
    configurable: true,
    get: getValue,
  });
  return () => {
    if (original) {
      Object.defineProperty(Element.prototype, "scrollHeight", original);
    }
  };
}

let restoreScrollHeight: (() => void) | null = null;
afterEach(() => {
  restoreScrollHeight?.();
  restoreScrollHeight = null;
});

const fetchConversationThreadMock = vi.fn();
const sendMessageMock = vi.fn();
const markThreadReadMock = vi.fn();
const fetchMessageUnreadCountMock = vi.fn();

vi.mock("../api/conversations", () => ({
  fetchConversationThread: (...args: unknown[]) =>
    fetchConversationThreadMock(...args),
  sendMessage: (...args: unknown[]) => sendMessageMock(...args),
  markThreadRead: (...args: unknown[]) => markThreadReadMock(...args),
  fetchMessageUnreadCount: (...args: unknown[]) =>
    fetchMessageUnreadCountMock(...args),
}));

// Thread derives the viewer's party from auth state to align MessageBubble;
// neither test below asserts alignment, so a fixed role is enough here.
const useAuthMock = vi.fn();
vi.mock("@/features/auth", () => ({
  useAuth: () => useAuthMock(),
}));

// useConversationRealtime subscribes to the access token purely as an effect
// dependency (see its own test for that behaviour); mocked here so this file
// doesn't need a real Redux <Provider> just to satisfy that read.
vi.mock("@/shared/store/hooks", () => ({
  useAppSelector: () => null,
}));

// Thread renders ProposalCard for "proposal" events, which pulls in the
// interviews feature's real API client (and its NEXT_PUBLIC_API_URL check)
// through its hooks — mocked out here the same way ProposalCard's own test
// does, even though neither scenario below includes a proposal event.
vi.mock("@/features/interviews", () => ({
  useConfirmSlot: () => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  }),
  useCounterRequest: () => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  }),
  ProposeSlotsForm: () => null,
}));

// Same reasoning as the interviews mock above, for OfferCard's offer-event
// branch — mocked even though neither scenario below includes an offer event.
vi.mock("@/features/offers", () => ({
  useAcceptOffer: () => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  }),
  useDeclineOffer: () => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  }),
  useCounterOffer: () => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  }),
  useWithdrawOffer: () => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  }),
}));

const candidates = [
  { id: "cand1", fullName: "J. Rivera" },
  { id: "cand2", fullName: "A. Kim" },
];

const systemEvent = {
  type: "submission" as const,
  at: "2026-08-11T08:00:00.000Z",
  actor: "recruiter" as const,
  title: "Candidates submitted",
  body: null,
  candidateId: null,
  messageId: null,
  data: null,
};

const cand1Message = {
  type: "message" as const,
  at: "2026-08-11T09:00:00.000Z",
  actor: "recruiter" as const,
  title: "Message",
  body: "Strong fit for cand1.",
  candidateId: "cand1",
  messageId: "m1",
  data: null,
};

const cand2Message = {
  type: "message" as const,
  at: "2026-08-11T09:05:00.000Z",
  actor: "company" as const,
  title: "Message",
  body: "Great fit for cand2.",
  candidateId: "cand2",
  messageId: "m2",
  data: null,
};

const offerEvent = {
  type: "offer" as const,
  at: "2026-08-11T09:10:00.000Z",
  actor: "company" as const,
  title: "Offer sent — $5,000 for J. Rivera",
  body: null,
  candidateId: "cand1",
  messageId: null,
  data: {
    kind: "offer" as const,
    offerId: "offer-1",
    offerStatus: "sent" as const,
    amountMinor: 500000,
    salaryMinor: 13000000,
    jobTitle: "Staff Engineer",
    startDate: "2026-09-01",
    previousOfferId: null,
    createdBy: "company" as const,
  },
};

const droppedFutureEvent = {
  type: "offer" as const,
  at: "2026-08-11T09:15:00.000Z",
  actor: "company" as const,
  title: "Offer sent — $5,000 for A. Kim",
  body: null,
  candidateId: "cand2",
  messageId: null,
  data: null,
};

function threadResponse(
  events: ConversationThread["events"]["data"],
): ConversationThread {
  return {
    submissionId: "submission-1",
    status: "submitted",
    company: { profileId: "c1", name: "Acme" },
    recruiter: { profileId: "r1", name: "Dana Lee" },
    job: { id: "j1", title: "Staff Engineer" },
    candidates,
    events: {
      data: events,
      meta: { page: 1, limit: 20, total: events.length, totalPages: 1 },
    },
  };
}

/** Builds a single-event thread response carrying one message body — the
 * minimal fixture the placeholder-data test needs, reusing `threadResponse`
 * and `cand1Message` rather than inventing a parallel shape. */
function threadWithMessage(body: string): ConversationThread {
  return threadResponse([{ ...cand1Message, body }]);
}

function renderThread() {
  return renderWithProviders(<Thread submissionId="submission-1" />);
}

describe("Thread", () => {
  beforeEach(() => {
    fetchConversationThreadMock.mockReset();
    sendMessageMock.mockReset();
    markThreadReadMock.mockReset();
    fetchMessageUnreadCountMock.mockReset();
    markThreadReadMock.mockResolvedValue(0);
    useAuthMock.mockReturnValue({ user: { role: "company" } });

    // The candidate filter is a server-side query param: return every
    // candidate's entries by default, and narrow to just cand1's message
    // (plus the untagged system event) once the caller asks for cand1.
    fetchConversationThreadMock.mockImplementation(
      async (_submissionId: string, params: { candidateId?: string }) =>
        threadResponse(
          params.candidateId === "cand1"
            ? [systemEvent, cand1Message]
            : [systemEvent, cand1Message, cand2Message],
        ),
    );
  });

  it("renders message bodies and a system event's title", async () => {
    renderWithProviders(<Thread submissionId="submission-1" />);

    expect(
      await screen.findByText("Strong fit for cand1."),
    ).toBeInTheDocument();
    expect(screen.getByText("Great fit for cand2.")).toBeInTheDocument();
    expect(screen.getByText("Candidates submitted")).toBeInTheDocument();
  });

  it("narrows to the selected candidate's messages, keeping untagged system events visible", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Thread submissionId="submission-1" />);
    await screen.findByText("Strong fit for cand1.");

    await user.click(screen.getByRole("button", { name: "J. Rivera" }));

    await waitFor(() => {
      expect(
        screen.queryByText("Great fit for cand2."),
      ).not.toBeInTheDocument();
    });
    expect(screen.getByText("Strong fit for cand1.")).toBeInTheDocument();
    expect(screen.getByText("Candidates submitted")).toBeInTheDocument();
  });

  it("renders an offer event as an OfferCard rather than plain text", async () => {
    // The offer was created by the company, so only the recruiter — the
    // party who did not create it — sees Accept/Decline/Counter.
    useAuthMock.mockReturnValue({ user: { role: "recruiter" } });
    fetchConversationThreadMock.mockResolvedValue(
      threadResponse([systemEvent, offerEvent]),
    );

    renderWithProviders(<Thread submissionId="submission-1" />);

    await screen.findByText("Candidates submitted");
    // OfferCard renders the negotiated salary and a Counter action for the
    // recruiter — neither of which the raw event title (which names the
    // commission, not the salary) would ever produce.
    expect(screen.getByText("$130,000")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^counter$/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Offer sent — $5,000 for J. Rivera"),
    ).not.toBeInTheDocument();
  });

  it("falls back to plain rendering for an offer event with unrecognised data", async () => {
    fetchConversationThreadMock.mockResolvedValue(
      threadResponse([systemEvent, droppedFutureEvent]),
    );

    renderWithProviders(<Thread submissionId="submission-1" />);

    expect(
      await screen.findByText("Offer sent — $5,000 for A. Kim"),
    ).toBeInTheDocument();
  });

  it("scrolls to the bottom on first load, and again when a new message arrives", async () => {
    // Installed *before* rendering — the previous version of this test
    // installed the override only after the initial mount, which left
    // `scrollHeight` at jsdom's default 0 during mount and made the
    // headline behaviour of D5 ("opens scrolled to the top") unobservable.
    let scrollHeightValue = 400;
    restoreScrollHeight = mockScrollHeight(() => scrollHeightValue);

    // Newest-first, matching the real API's `sortOrder` — `Thread` reverses
    // this into oldest-at-top, so `cand1Message` (not `systemEvent`) is the
    // newest event and the one whose identity the scroll effect tracks.
    fetchConversationThreadMock.mockResolvedValue(
      threadResponse([cand1Message, systemEvent]),
    );

    const { queryClient, container } = renderWithClient(
      <Thread submissionId="submission-1" />,
    );
    await screen.findByText("Strong fit for cand1.");

    const scrollContainer =
      container.querySelector<HTMLDivElement>(".overflow-y-auto");
    if (!scrollContainer) throw new Error("scroll container not found");
    // Proves the mount-time scroll actually fired, not just that a later
    // effect happened to land on the same value.
    await waitFor(() => expect(scrollContainer.scrollTop).toBe(400));

    // A message arrives the same way the real app learns about one — a
    // realtime/poll-triggered invalidation, not a remount — and the
    // container grows to make room for it.
    const newMessage = {
      ...cand1Message,
      at: "2026-08-11T09:20:00.000Z",
      messageId: "m3",
      body: "Follow-up from cand1.",
    };
    scrollHeightValue = 900;
    fetchConversationThreadMock.mockResolvedValue(
      threadResponse([newMessage, cand1Message, systemEvent]),
    );
    await act(async () => {
      await queryClient.invalidateQueries({ queryKey: ["conversations"] });
    });
    await screen.findByText("Follow-up from cand1.");

    await waitFor(() => expect(scrollContainer.scrollTop).toBe(900));
  });

  it("scrolls to the newest message after switching candidate filters, even when the newest event is unchanged", async () => {
    // The untagged system event is the newest entry in every filter (it has
    // no `candidateId`, so it survives narrowing to one candidate) — the
    // trap `lastEventKey` alone can't catch: the newest event's identity
    // never changes across this switch, so only tracking the filter itself
    // (`candidateId`, added alongside `keepPreviousData`) makes the scroll
    // effect fire at all. Before that, the container no longer remounting
    // (Task 1's fix) meant this case scrolled nowhere.
    const systemEventLatest = {
      ...systemEvent,
      at: "2026-08-11T10:00:00.000Z",
    };
    fetchConversationThreadMock.mockResolvedValue(
      threadResponse([systemEventLatest, cand1Message]),
    );
    const scrollHeightValue = 320;
    restoreScrollHeight = mockScrollHeight(() => scrollHeightValue);

    const { container } = renderWithProviders(
      <Thread submissionId="submission-1" />,
    );
    await screen.findByText("Strong fit for cand1.");

    const initialContainer =
      container.querySelector<HTMLDivElement>(".overflow-y-auto");
    if (!initialContainer) throw new Error("scroll container not found");
    // Simulate the reader having scrolled away from the bottom before
    // switching filters, so a later match against `scrollHeightValue`
    // proves the effect actually ran rather than scrollTop having never
    // moved off it.
    initialContainer.scrollTop = 0;

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "J. Rivera" }));
    await screen.findByText("Candidates submitted");

    const filteredContainer =
      container.querySelector<HTMLDivElement>(".overflow-y-auto");
    // Same element — `keepPreviousData` (Task 1) means the filter switch no
    // longer remounts the scroll container.
    expect(filteredContainer).toBe(initialContainer);
    // Scrolled to the newest message of the *filtered* view regardless — the
    // filter change is its own trigger, independent of whether the newest
    // event's identity happened to change.
    await waitFor(() =>
      expect(filteredContainer?.scrollTop).toBe(scrollHeightValue),
    );
  });

  it("does not scroll to the bottom for an older page, and instead preserves the reader's position", async () => {
    const olderMessage = {
      type: "message" as const,
      at: "2026-08-10T09:00:00.000Z",
      actor: "company" as const,
      title: "Message",
      body: "Older history.",
      candidateId: "cand1",
      messageId: "m0",
      data: null,
    };
    let scrollHeightValue = 300;
    restoreScrollHeight = mockScrollHeight(() => scrollHeightValue);

    fetchConversationThreadMock.mockImplementation(
      async (_submissionId: string, params: { page?: number }) => {
        if (params.page === 2) {
          // The older page is about to render above what's already on
          // screen, growing the scroll container — set here so it's in
          // place by the time the component's compensation effect reads it.
          scrollHeightValue = 500;
          return {
            ...threadResponse([olderMessage]),
            events: {
              data: [olderMessage],
              meta: { page: 2, limit: 20, total: 2, totalPages: 2 },
            },
          };
        }
        return {
          ...threadResponse([cand1Message]),
          events: {
            data: [cand1Message],
            meta: { page: 1, limit: 20, total: 2, totalPages: 2 },
          },
        };
      },
    );

    const { container } = renderWithProviders(
      <Thread submissionId="submission-1" />,
    );
    await screen.findByText("Strong fit for cand1.");

    const scrollContainer =
      container.querySelector<HTMLDivElement>(".overflow-y-auto");
    if (!scrollContainer) throw new Error("scroll container not found");
    scrollContainer.scrollTop = 250;

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Load older" }));
    await screen.findByText("Older history.");

    // 250 (where the reader was) + 200 (the height the older page just
    // added) — never jumps to the new bottom (500), which is what a naive
    // "scroll on every data change" would have done.
    expect(scrollContainer.scrollTop).toBe(450);
  });

  it("keeps the previous events on screen — dimmed, not blanked — while a candidate filter loads", async () => {
    fetchConversationThreadMock.mockResolvedValue(
      threadWithMessage("first message"),
    );
    const { container } = renderThread();
    expect(await screen.findByText("first message")).toBeInTheDocument();

    const eventsList = container.querySelector(".overflow-y-auto");
    if (!eventsList) throw new Error("events list not found");
    // Settled state: no stale affordance yet.
    expect(eventsList).not.toHaveClass("opacity-60");

    // The next fetch is for the filtered view and has not resolved yet.
    let resolveFiltered: (value: ConversationThread) => void = () => {};
    fetchConversationThreadMock.mockReturnValue(
      new Promise<ConversationThread>((resolve) => {
        resolveFiltered = resolve;
      }),
    );
    await userEvent.click(screen.getByRole("button", { name: "J. Rivera" }));

    // The skeleton must NOT have replaced the thread — the previous events
    // stay on screen, marked stale rather than disappearing.
    expect(screen.getByText("first message")).toBeInTheDocument();
    expect(eventsList).toHaveClass("opacity-60");

    resolveFiltered(threadWithMessage("filtered message"));
    expect(await screen.findByText("filtered message")).toBeInTheDocument();
    // The affordance clears once the filtered data has actually arrived.
    expect(eventsList).not.toHaveClass("opacity-60");
  });
});

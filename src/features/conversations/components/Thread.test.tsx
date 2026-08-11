import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/utils";
import type { ConversationThread } from "../schemas";
import { Thread } from "./Thread";

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
});

import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/utils";
import type { Interview } from "../schemas";
import { MeetingLinkField } from "./MeetingLinkField";

const setMeetingUrlMock = vi.fn();

vi.mock("../hooks/useInterviews", () => ({
  useSetMeetingUrl: () => ({
    mutate: setMeetingUrlMock,
    isPending: false,
    isError: false,
  }),
}));

function interview(overrides: Partial<Interview> = {}): Interview {
  return {
    id: "interview-1",
    jobId: "job-1",
    candidateId: "candidate-1",
    interviewType: "video",
    status: "scheduled",
    round: 1,
    confirmedSlotStart: "2026-11-10T14:00:00.000Z",
    confirmedSlotEnd: "2026-11-10T15:00:00.000Z",
    meetingJoinUrl: null,
    outcome: null,
    passFeedback: null,
    createdAt: "2026-08-01T00:00:00.000Z",
    liveProposal: null,
    ...overrides,
  };
}

describe("MeetingLinkField", () => {
  beforeEach(() => setMeetingUrlMock.mockReset());

  it("offers no link field on an interview that has no call to join", () => {
    // A phone screen has a number and an on-site has an address, so the field
    // is absent rather than present and inapplicable.
    const { container } = renderWithProviders(
      <MeetingLinkField
        interview={interview({ interviewType: "phone" })}
        canEdit
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("saves a pasted Teams link", () => {
    renderWithProviders(<MeetingLinkField interview={interview()} canEdit />);

    fireEvent.click(screen.getByRole("button", { name: /add teams or zoom/i }));
    fireEvent.change(screen.getByLabelText(/teams or zoom link/i), {
      target: { value: "https://teams.microsoft.com/l/meetup-join/abc" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save link/i }));

    expect(setMeetingUrlMock).toHaveBeenCalledWith(
      "https://teams.microsoft.com/l/meetup-join/abc",
      expect.anything(),
    );
  });

  it("refuses something that is not a link, without calling the API", () => {
    renderWithProviders(<MeetingLinkField interview={interview()} canEdit />);

    fireEvent.click(screen.getByRole("button", { name: /add teams or zoom/i }));
    fireEvent.change(screen.getByLabelText(/teams or zoom link/i), {
      target: { value: "meeting id 123 456" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save link/i }));

    expect(screen.getByText(/including https:\/\//i)).toBeInTheDocument();
    expect(setMeetingUrlMock).not.toHaveBeenCalled();
  });

  it("lets a recruiter join but never edit", () => {
    // The endpoint is company-only, so a recruiter is shown the link rather
    // than a control that could only 403.
    renderWithProviders(
      <MeetingLinkField
        interview={interview({ meetingJoinUrl: "https://zoom.us/j/123" })}
        canEdit={false}
      />,
    );

    expect(
      screen.getByRole("link", { name: /join video call/i }),
    ).toHaveAttribute("href", "https://zoom.us/j/123");
    expect(
      screen.queryByRole("button", { name: /replace link/i }),
    ).not.toBeInTheDocument();
  });
});

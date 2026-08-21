import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/utils";
import type { Paginated } from "@/shared/libs/pagination";
import type { Notification } from "../schemas";
import { NotificationList } from "./NotificationList";

const fetchNotificationsMock = vi.fn();
const fetchUnreadCountMock = vi.fn();
const markReadMock = vi.fn();
const markUnreadMock = vi.fn();
const markAllReadMock = vi.fn();

vi.mock("../api/notifications", () => ({
  fetchNotifications: (...args: unknown[]) => fetchNotificationsMock(...args),
  fetchUnreadCount: (...args: unknown[]) => fetchUnreadCountMock(...args),
  markNotificationRead: (...args: unknown[]) => markReadMock(...args),
  markNotificationUnread: (...args: unknown[]) => markUnreadMock(...args),
  markAllNotificationsRead: (...args: unknown[]) => markAllReadMock(...args),
}));

// The row resolves each item's destination via the caller's role; mocked so
// this file never needs a real Redux store.
const useAuthMock = vi.fn();
vi.mock("@/features/auth", () => ({
  useAuth: () => useAuthMock(),
}));

const NOTIFICATION_TITLES: Record<string, string> = {
  offer_accepted: "Offer accepted",
  payout_sent: "Payout sent",
  job_published: "New job posted",
};

let itemCounter = 0;

function item(overrides: Partial<Notification> = {}): Notification {
  itemCounter += 1;
  const type = overrides.type ?? "offer_accepted";
  return {
    id: `n-${itemCounter}`,
    type,
    title: NOTIFICATION_TITLES[type] ?? "Notification",
    body: null,
    data: null,
    readAt: null,
    createdAt: new Date(),
    ...overrides,
  };
}

function flatPaginated(data: Notification[]): Paginated<Notification> {
  return {
    data,
    meta: { page: 1, limit: 50, total: data.length, totalPages: 1 },
  };
}

function renderList() {
  return renderWithProviders(<NotificationList />);
}

describe("NotificationList", () => {
  beforeEach(() => {
    itemCounter = 0;
    fetchNotificationsMock.mockReset();
    fetchNotificationsMock.mockResolvedValue(flatPaginated([]));
    fetchUnreadCountMock.mockReset();
    fetchUnreadCountMock.mockResolvedValue(0);
    markReadMock.mockReset();
    markUnreadMock.mockReset();
    markAllReadMock.mockReset();
    useAuthMock.mockReset();
    useAuthMock.mockReturnValue({ user: { id: "u", role: "company" } });
  });

  it("renders notifications under a day header", async () => {
    fetchNotificationsMock.mockResolvedValue(
      flatPaginated([item({ title: "Subscription past due" })]),
    );

    renderList();

    expect(
      await screen.findByText("Subscription past due"),
    ).toBeInTheDocument();
    // Today's items sit under a "Today" header.
    expect(screen.getByText("Today")).toBeInTheDocument();
  });

  it("shows the unread count on the Unread chip", async () => {
    fetchUnreadCountMock.mockResolvedValue(3);
    fetchNotificationsMock.mockResolvedValue(flatPaginated([item()]));

    renderList();

    expect(await screen.findByText("Unread · 3")).toBeInTheDocument();
  });

  it("clicking a routable item marks it read and links to its page", async () => {
    fetchNotificationsMock.mockResolvedValue(
      flatPaginated([
        item({ type: "offer_accepted", data: { submissionId: "sub-1" } }),
      ]),
    );

    renderList();
    const link = await screen.findByRole("link");

    expect(link).toHaveAttribute("href", "/company/inbox/sub-1");
    await userEvent.click(link);
    expect(markReadMock).toHaveBeenCalledWith("n-1");
  });

  it("renders an unroutable notification as text rather than a link", async () => {
    fetchNotificationsMock.mockResolvedValue(
      flatPaginated([item({ type: "payout_sent", data: null })]),
    );
    useAuthMock.mockReturnValue({ user: { id: "u", role: "recruiter" } });

    renderList();

    expect(await screen.findByText("Payout sent")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("filters to a category when its chip is selected", async () => {
    fetchNotificationsMock.mockResolvedValue(
      flatPaginated([
        item({ type: "job_published" }),
        item({ type: "offer_accepted", data: { submissionId: "sub-1" } }),
      ]),
    );

    renderList();
    expect(await screen.findByText("New job posted")).toBeInTheDocument();
    expect(screen.getByText("Offer accepted")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Jobs" }));

    expect(screen.getByText("New job posted")).toBeInTheDocument();
    expect(screen.queryByText("Offer accepted")).not.toBeInTheDocument();
  });

  it("shows the empty state when there are no notifications", async () => {
    renderList();

    expect(await screen.findByText("Nothing yet")).toBeInTheDocument();
  });
});

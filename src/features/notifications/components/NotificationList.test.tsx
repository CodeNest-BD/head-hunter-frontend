import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/utils";
import type { Paginated } from "@/shared/libs/pagination";
import type { Notification, NotificationGroup } from "../schemas";
import { NotificationList } from "./NotificationList";

const fetchNotificationGroupsMock = vi.fn();
const fetchNotificationsMock = vi.fn();
const markReadMock = vi.fn();
const markAllReadMock = vi.fn();
const fetchUnreadCountMock = vi.fn();

vi.mock("../api/notifications", () => ({
  fetchNotificationGroups: (...args: unknown[]) =>
    fetchNotificationGroupsMock(...args),
  fetchNotifications: (...args: unknown[]) => fetchNotificationsMock(...args),
  fetchUnreadCount: (...args: unknown[]) => fetchUnreadCountMock(...args),
  markNotificationRead: (...args: unknown[]) => markReadMock(...args),
  markAllNotificationsRead: (...args: unknown[]) => markAllReadMock(...args),
}));

// NotificationGroup resolves each item's destination via the caller's role;
// mocked the same way Thread.test.tsx mocks the auth barrel, so this file
// never needs a real Redux store.
const useAuthMock = vi.fn();
vi.mock("@/features/auth", () => ({
  useAuth: () => useAuthMock(),
}));

const NOTIFICATION_TITLES: Record<string, string> = {
  offer_accepted: "Offer accepted",
  payout_sent: "Payout sent",
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
    createdAt: new Date("2026-01-01T12:00:00Z"),
    ...overrides,
  };
}

function group(overrides: Partial<NotificationGroup> = {}): NotificationGroup {
  return {
    key: "sub-1",
    submissionId: "sub-1",
    jobTitle: "Staff Engineer",
    counterpartyName: "Acme Co",
    total: 1,
    unread: 0,
    items: [item()],
    latestAt: new Date("2026-01-02T12:00:00Z"),
    ...overrides,
  };
}

function paginated(data: NotificationGroup[]): Paginated<NotificationGroup> {
  return {
    data,
    meta: { page: 1, limit: 20, total: data.length, totalPages: 1 },
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
    fetchNotificationGroupsMock.mockReset();
    fetchNotificationsMock.mockReset();
    fetchNotificationsMock.mockResolvedValue(flatPaginated([]));
    markReadMock.mockReset();
    markAllReadMock.mockReset();
    fetchUnreadCountMock.mockReset();
    useAuthMock.mockReset();
    useAuthMock.mockReturnValue({ user: { id: "u", role: "company" } });
  });

  it("renders a multi-item group collapsed with its true count", async () => {
    fetchNotificationGroupsMock.mockResolvedValue(
      paginated([
        group({
          jobTitle: "Seniorr software Engineer",
          counterpartyName: "Sayed Tahsin",
          total: 4,
          unread: 2,
          items: [item(), item(), item()],
        }),
      ]),
    );

    renderList();

    expect(
      await screen.findByText("Seniorr software Engineer"),
    ).toBeInTheDocument();
    expect(screen.getByText("2 new")).toBeInTheDocument();
    // Collapsed: the items are not rendered until the header is clicked.
    expect(screen.queryByText("Offer accepted")).not.toBeInTheDocument();
  });

  it("renders a single-item group as a plain row with no disclosure control", async () => {
    fetchNotificationGroupsMock.mockResolvedValue(
      paginated([
        group({
          total: 1,
          unread: 1,
          items: [item({ title: "Subscription past due" })],
        }),
      ]),
    );

    renderList();

    expect(
      await screen.findByText("Subscription past due"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /expand/i }),
    ).not.toBeInTheDocument();
  });

  it("expanding a group does not mark anything read", async () => {
    fetchNotificationGroupsMock.mockResolvedValue(
      paginated([
        group({ total: 3, unread: 3, items: [item(), item(), item()] }),
      ]),
    );

    renderList();
    await userEvent.click(
      await screen.findByRole("button", { name: /expand/i }),
    );

    expect(markReadMock).not.toHaveBeenCalled();
  });

  it("clicking an item marks it read and links to its page", async () => {
    fetchNotificationGroupsMock.mockResolvedValue(
      paginated([
        group({
          submissionId: "sub-1",
          total: 1,
          unread: 1,
          items: [
            item({ type: "offer_accepted", data: { submissionId: "sub-1" } }),
          ],
        }),
      ]),
    );

    renderList();
    const link = await screen.findByRole("link");

    expect(link).toHaveAttribute("href", "/company/inbox/sub-1");
    await userEvent.click(link);
    expect(markReadMock).toHaveBeenCalledWith("n-1");
  });

  it("renders an unroutable notification as text rather than a link", async () => {
    fetchNotificationGroupsMock.mockResolvedValue(
      paginated([
        group({
          total: 1,
          unread: 0,
          items: [item({ type: "payout_sent", data: null })],
        }),
      ]),
    );
    useAuthMock.mockReturnValue({ user: { id: "u", role: "recruiter" } });

    renderList();

    expect(await screen.findByText("Payout sent")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});

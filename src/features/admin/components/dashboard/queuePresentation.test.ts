import { describe, expect, it } from "vitest";

import type { DashboardQueue } from "../../schemas";
import { byPriority } from "./queuePresentation";

const queue = (
  key: DashboardQueue["key"],
  priority: DashboardQueue["priority"],
): DashboardQueue => ({
  key,
  priority,
  count: 1,
  urgent: priority === "urgent",
  context: "",
});

describe("byPriority", () => {
  it("leads with what needs attention most", () => {
    const ordered = byPriority([
      queue("recruiter_verifications", "to_review"),
      queue("payments_on_hold", "on_hold"),
      queue("submissions_awaiting_review", "urgent"),
      queue("failed_payouts", "failed"),
    ]);

    expect(ordered.map((q) => q.key)).toEqual([
      "submissions_awaiting_review",
      "failed_payouts",
      "payments_on_hold",
      "recruiter_verifications",
    ]);
  });

  it("keeps the server's order among queues of equal weight", () => {
    const ordered = byPriority([
      queue("disputes_near_payout", "urgent"),
      queue("disputes_awaiting_reply", "urgent"),
      queue("submissions_awaiting_review", "urgent"),
    ]);

    expect(ordered.map((q) => q.key)).toEqual([
      "disputes_near_payout",
      "disputes_awaiting_reply",
      "submissions_awaiting_review",
    ]);
  });

  it("does not reorder the array it was given", () => {
    // The queues come straight from the query cache; sorting in place would
    // reorder what every other reader of that cache sees.
    const queues = [
      queue("recruiter_verifications", "to_review"),
      queue("disputes_near_payout", "urgent"),
    ];

    byPriority(queues);

    expect(queues.map((q) => q.key)).toEqual([
      "recruiter_verifications",
      "disputes_near_payout",
    ]);
  });
});

import { describe, expect, it } from "vitest";
import { conversationEventSchema } from "./schemas";

const base = {
  at: "2026-08-11T09:00:00.000Z",
  actor: "recruiter" as const,
  title: "Something happened",
  body: null,
  candidateId: null,
  messageId: null,
};

describe("conversationEventSchema", () => {
  it("parses the event types the backend emits today", () => {
    expect(conversationEventSchema.parse({ ...base, type: "proposal" }).type).toBe(
      "proposal",
    );
  });

  it("parses a message event", () => {
    expect(conversationEventSchema.parse({ ...base, type: "message" }).type).toBe(
      "message",
    );
  });

  it("degrades an unrecognised type to unknown rather than throwing", () => {
    expect(conversationEventSchema.parse({ ...base, type: "placement" }).type).toBe(
      "unknown",
    );
  });
});

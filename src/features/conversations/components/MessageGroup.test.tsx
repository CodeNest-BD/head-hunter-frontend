import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ConversationEvent } from "../schemas";
import { MessageGroup } from "./MessageGroup";

function messageEvent(
  overrides: Partial<ConversationEvent> & { at: string; messageId: string },
): ConversationEvent {
  return {
    type: "message",
    actor: "recruiter",
    title: "Message",
    body: "hello",
    candidateId: null,
    data: null,
    ...overrides,
  };
}

describe("MessageGroup", () => {
  it("renders exactly one name and one timestamp for a two-message group", () => {
    const events = [
      messageEvent({
        at: "2026-08-10T09:00:00.000Z",
        messageId: "m1",
        body: "First",
      }),
      messageEvent({
        at: "2026-08-10T09:05:00.000Z",
        messageId: "m2",
        body: "Second",
      }),
    ];

    render(
      <MessageGroup
        actor="recruiter"
        isOwn={false}
        events={events}
        companyName="Acme"
        recruiterName="Dana Lee"
      />,
    );

    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
    expect(screen.getAllByText("Dana Lee")).toHaveLength(1);
    // Only the last message's timestamp renders — the group only knows the
    // one that formatDateTime produces for 09:05, not 09:00.
    expect(screen.getAllByText(/\d{1,2}:\d{2}/)).toHaveLength(1);
  });

  it("shows the actual counterparty name instead of the shouted party word", () => {
    render(
      <MessageGroup
        actor="company"
        isOwn={false}
        events={[
          messageEvent({
            at: "2026-08-10T09:00:00.000Z",
            messageId: "m1",
            actor: "company",
          }),
        ]}
        companyName="Acme"
        recruiterName="Dana Lee"
      />,
    );

    expect(screen.getByText("Acme")).toBeInTheDocument();
    expect(screen.queryByText("COMPANY")).not.toBeInTheDocument();
    expect(screen.queryByText("Company")).not.toBeInTheDocument();
  });

  it("labels the viewer's own group as You regardless of the actual name", () => {
    render(
      <MessageGroup
        actor="company"
        isOwn
        events={[
          messageEvent({
            at: "2026-08-10T09:00:00.000Z",
            messageId: "m1",
            actor: "company",
          }),
        ]}
        companyName="Acme"
        recruiterName="Dana Lee"
      />,
    );

    expect(screen.getByText("You")).toBeInTheDocument();
    expect(screen.queryByText("Acme")).not.toBeInTheDocument();
  });

  it("falls back to the party word when no name is supplied", () => {
    render(
      <MessageGroup
        actor="recruiter"
        isOwn={false}
        events={[
          messageEvent({ at: "2026-08-10T09:00:00.000Z", messageId: "m1" }),
        ]}
      />,
    );

    expect(screen.getByText("Recruiter")).toBeInTheDocument();
  });

  it("falls back to the party word when the supplied name is blank", () => {
    render(
      <MessageGroup
        actor="company"
        isOwn={false}
        events={[
          messageEvent({
            at: "2026-08-10T09:00:00.000Z",
            messageId: "m1",
            actor: "company",
          }),
        ]}
        companyName="   "
        recruiterName="Dana Lee"
      />,
    );

    expect(screen.getByText("Company")).toBeInTheDocument();
  });

  it("colours and aligns the viewer's own messages using bg-primary, never by actor", () => {
    const { container } = render(
      <MessageGroup
        actor="company"
        isOwn
        events={[
          messageEvent({
            at: "2026-08-10T09:00:00.000Z",
            messageId: "m1",
            actor: "company",
            body: "Own message",
          }),
        ]}
      />,
    );

    const bubble = screen.getByText("Own message");
    expect(bubble).toHaveClass("bg-primary", "text-primary-foreground");
    expect(bubble.parentElement).toHaveClass("justify-end");
    expect(container.querySelector(".items-end")).not.toBeNull();
  });

  it("colours and aligns the counterparty's messages using bg-muted, never by actor", () => {
    const { container } = render(
      <MessageGroup
        actor="company"
        isOwn={false}
        events={[
          messageEvent({
            at: "2026-08-10T09:00:00.000Z",
            messageId: "m1",
            actor: "company",
            body: "Their message",
          }),
        ]}
      />,
    );

    const bubble = screen.getByText("Their message");
    expect(bubble).toHaveClass("bg-muted", "text-foreground");
    expect(bubble.parentElement).toHaveClass("justify-start");
    expect(container.querySelector(".items-start")).not.toBeNull();
  });
});

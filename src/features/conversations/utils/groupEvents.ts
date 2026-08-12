import { format } from "date-fns";

import type { ConversationEvent } from "../schemas";

export type ConversationParty = "company" | "recruiter";

export type GroupedThreadItem =
  | { kind: "day"; date: string }
  | {
      kind: "messages";
      actor: ConversationParty;
      isOwn: boolean;
      events: ConversationEvent[];
    }
  | { kind: "event"; event: ConversationEvent };

function isValidDate(date: Date): boolean {
  return !Number.isNaN(date.getTime());
}

/** Calendar-day key in the viewer's local timezone — `date-fns`'s `format`
 * reads the `Date`'s local getters, the same source `formatDateTime`'s
 * `toLocaleDateString` reads, so the two never disagree about where a day
 * boundary falls.
 *
 * The event schema only requires `at` to be a string, not a valid
 * datetime, and `date-fns`'s `format` throws `RangeError` on an invalid
 * `Date` (unlike `toLocaleDateString`, which degrades to the string
 * "Invalid Date"). One malformed timestamp taking down the whole thread
 * would contradict every other tolerance this feature already has — the
 * `data?.kind` fallbacks, `tolerantEnum` — so a bad row here degrades to a
 * key that can never collide with a real day instead of throwing. */
function dayKey(iso: string): string {
  const date = new Date(iso);
  return isValidDate(date) ? format(date, "yyyy-MM-dd") : `invalid-${iso}`;
}

/** Stable identity for one event, used both as a React `key` and to detect
 * whether the newest event in the feed actually changed. Messages carry
 * their own id; every other event type — and a message with no id — is
 * identified by its type, time and candidate instead. */
export function eventKey(event: ConversationEvent): string {
  return (
    event.messageId ??
    `${event.type}-${event.at}-${event.candidateId ?? "none"}`
  );
}

/** Messages are always authored by one of the two parties. The shared event
 * schema's `actor` is nullable/`"system"` only to cover the other event
 * types it also carries, so a message event without a party falls back to
 * "recruiter" — the same default `MessageBubble` used before this file
 * existed. */
function resolveMessageActor(event: ConversationEvent): ConversationParty {
  return event.actor === "company" ? "company" : "recruiter";
}

/**
 * Pure, single-pass transform from the flat event feed into render-ready
 * items: consecutive messages from the same side collapse into one
 * "messages" group (so a group renders exactly one name and one timestamp,
 * however many bubbles it holds), a "day" item is inserted whenever the
 * calendar day changes — which also always starts a new group, even for the
 * same actor — and every non-message event stays its own standalone "event"
 * item, untouched, so callers keep deciding how to render (or fall back on)
 * each one.
 *
 * No React import: later phases render into this list and must not
 * re-derive grouping, so this stays a plain data transform they can also
 * unit test without mounting anything.
 */
export function groupEvents(
  events: ConversationEvent[],
  viewerParty: ConversationParty,
): GroupedThreadItem[] {
  const items: GroupedThreadItem[] = [];
  let currentDayKey: string | null = null;
  let currentGroup: {
    actor: ConversationParty;
    isOwn: boolean;
    events: ConversationEvent[];
  } | null = null;

  for (const event of events) {
    const eventDayKey = dayKey(event.at);
    if (eventDayKey !== currentDayKey) {
      currentDayKey = eventDayKey;
      currentGroup = null;
      items.push({ kind: "day", date: event.at });
    }

    if (event.type !== "message") {
      currentGroup = null;
      items.push({ kind: "event", event });
      continue;
    }

    const actor = resolveMessageActor(event);
    const isOwn = actor === viewerParty;
    if (
      currentGroup &&
      currentGroup.actor === actor &&
      currentGroup.isOwn === isOwn
    ) {
      currentGroup.events.push(event);
    } else {
      currentGroup = { actor, isOwn, events: [event] };
      items.push({
        kind: "messages",
        actor,
        isOwn,
        events: currentGroup.events,
      });
    }
  }

  return items;
}

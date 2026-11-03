"use client";

import { useState } from "react";
import { AlertCircle, Video } from "lucide-react";
import { z } from "zod";

import { Button } from "@/shared/ui-components/controls/button";
import { Input } from "@/shared/ui-components/controls/input";
import { Label } from "@/shared/ui-components/controls/label";
import { useSetMeetingUrl } from "../hooks/useInterviews";
import { type Interview } from "../schemas";

/**
 * Interview types that happen over a call, and so can carry a join link. A
 * phone screen has a number, not a URL, and an on-site has an address — the
 * field is simply absent on both rather than present and inapplicable.
 */
const VIDEO_TYPES: ReadonlySet<Interview["interviewType"]> = new Set([
  "video",
  "video_panel",
]);

/**
 * Teams and Zoom both hand out an https link, and the backend stores whatever
 * it is given. Validated here only so an obvious mistake — a meeting ID, a
 * pasted invite paragraph — is caught before it reaches the other party as an
 * unclickable string.
 */
const meetingUrlSchema = z
  .string()
  .trim()
  .url("Paste the full link, including https://");

/** The panel is open or it isn't, and an open one is either adding or
 * replacing — a union rather than two booleans that could disagree. */
type Editing = { kind: "closed" } | { kind: "open"; draft: string };

export interface MeetingLinkFieldProps {
  interview: Interview;
  /**
   * Whether this viewer may set the link. The endpoint is company-only, so a
   * recruiter reads the same field without the controls rather than being
   * shown a button that could only 403.
   */
  canEdit: boolean;
}

/**
 * The Teams or Zoom link for a scheduled video interview: the company pastes
 * it once a time is agreed, and the recruiter joins from the same row.
 *
 * The platform does not create the meeting — it carries the link the company's
 * own calendar already made, which is what keeps the two in step without
 * holding a Teams or Zoom credential on anyone's behalf.
 */
export function MeetingLinkField({
  interview,
  canEdit,
}: MeetingLinkFieldProps) {
  const [editing, setEditing] = useState<Editing>({ kind: "closed" });
  const [error, setError] = useState<string | null>(null);
  const setMeetingUrl = useSetMeetingUrl(interview.id);

  if (!VIDEO_TYPES.has(interview.interviewType)) return null;

  const link = interview.meetingJoinUrl;

  const save = (): void => {
    if (editing.kind !== "open") return;
    const parsed = meetingUrlSchema.safeParse(editing.draft);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a valid link");
      return;
    }
    setError(null);
    setMeetingUrl.mutate(parsed.data, {
      onSuccess: () => setEditing({ kind: "closed" }),
    });
  };

  if (editing.kind === "open") {
    return (
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`meeting-url-${interview.id}`}>
          Teams or Zoom link
        </Label>
        <Input
          id={`meeting-url-${interview.id}`}
          type="url"
          inputMode="url"
          placeholder="https://teams.microsoft.com/l/meetup-join/…"
          value={editing.draft}
          onChange={(event) =>
            setEditing({ kind: "open", draft: event.target.value })
          }
        />
        {error && <p className="text-meta font-medium text-bad">{error}</p>}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            disabled={setMeetingUrl.isPending}
            onClick={save}
          >
            {setMeetingUrl.isPending ? "Saving…" : "Save link"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setError(null);
              setEditing({ kind: "closed" });
            }}
          >
            Cancel
          </Button>
        </div>
        {setMeetingUrl.isError && (
          <p className="flex items-center gap-2 text-meta text-bad">
            <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
            That link could not be saved — please try again.
          </p>
        )}
      </div>
    );
  }

  if (link) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="outline" size="sm">
          <a href={link} target="_blank" rel="noopener noreferrer">
            <Video aria-hidden="true" />
            Join Video Call
          </a>
        </Button>
        {canEdit && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setEditing({ kind: "open", draft: link })}
          >
            Replace link
          </Button>
        )}
      </div>
    );
  }

  return canEdit ? (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="w-fit"
      onClick={() => setEditing({ kind: "open", draft: "" })}
    >
      <Video aria-hidden="true" />
      Add Teams or Zoom Link
    </Button>
  ) : (
    <p className="text-meta text-ink-muted">
      The company has not added a video link yet.
    </p>
  );
}

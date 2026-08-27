"use client";

import { useId, useState } from "react";
import { HttpStatusCode } from "axios";
import { AlertCircle } from "lucide-react";

import { allMessages, isApiError } from "@/shared/libs/errorHandler";
import { Button } from "@/shared/ui-components/controls/button";
import { Textarea } from "@/shared/ui-components/controls/textarea";
import { useSendMessage } from "../hooks/useConversation";

const MAX_BODY_LENGTH = 4000;

export interface MessageComposerProps {
  /** The thread. A conversation is one candidate. */
  candidateId: string;
  /** Display name for the scope indicator below. */
  candidateName?: string;
  /** False once the candidate is passed on: readable, closed to new messages. */
  acceptsMessages?: boolean;
}

/**
 * 409 (the candidate was passed on) and 429 (30/minute throttle) are both
 * reachable outcomes of sending, so each gets a specific inline message
 * instead of a generic failure — mirrors the status-driven error messages in
 * features/auth's sign-in form.
 */
function sendMessageErrorMessage(error: unknown): string {
  if (!isApiError(error)) {
    return "Could not send your message. Please try again.";
  }
  switch (error.statusCode) {
    case HttpStatusCode.Conflict:
      return "This candidate was passed on, so the conversation is closed.";
    case HttpStatusCode.TooManyRequests:
      return "You're sending messages too quickly. Please wait a moment and try again.";
    default:
      return allMessages(error);
  }
}

/** Textarea + send button for one thread, disabled while a send is pending. */
export function MessageComposer({
  candidateId,
  candidateName,
  acceptsMessages = true,
}: MessageComposerProps) {
  const scopeDescriptionId = useId();
  const [body, setBody] = useState("");
  const sendMessage = useSendMessage(candidateId);

  const trimmed = body.trim();
  // A quiet status cue, not a warning: it names who this conversation is
  // about, which matters now that every candidate has a thread of their own.
  const scopeLabel = acceptsMessages
    ? `Sending about ${candidateName ?? "this candidate"}`
    : "This candidate was passed on — the conversation is closed";

  const handleSend = (): void => {
    if (!trimmed) return;
    sendMessage.mutate({ body: trimmed }, { onSuccess: () => setBody("") });
  };

  return (
    <div className="flex flex-col gap-2">
      <p id={scopeDescriptionId} className="text-xs text-muted-foreground">
        {scopeLabel}
      </p>
      <Textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        maxLength={MAX_BODY_LENGTH}
        placeholder="Write a message…"
        disabled={sendMessage.isPending || !acceptsMessages}
        aria-label="Message"
        aria-describedby={scopeDescriptionId}
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {body.length}/{MAX_BODY_LENGTH}
        </p>
        <Button
          type="button"
          size="sm"
          className="shrink-0"
          disabled={
            sendMessage.isPending || trimmed.length === 0 || !acceptsMessages
          }
          onClick={handleSend}
        >
          {sendMessage.isPending ? "Sending…" : "Send"}
        </Button>
      </div>
      {sendMessage.isError && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {sendMessageErrorMessage(sendMessage.error)}
        </div>
      )}
    </div>
  );
}

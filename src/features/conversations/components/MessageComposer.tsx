"use client";

import { useId, useState } from "react";
import { HttpStatusCode } from "axios";
import { AlertCircle, SendHorizontal } from "lucide-react";

import { allMessages, isApiError } from "@/shared/libs/errorHandler";
import { cn } from "@/shared/libs/shadCnConfig";
import { Button } from "@/shared/ui-components/controls/button";
import { Textarea } from "@/shared/ui-components/controls/textarea";
import { useSendMessage } from "../hooks/useConversation";
import type { ConversationParty } from "../utils/groupEvents";

const MAX_BODY_LENGTH = 4000;

export interface MessageComposerProps {
  /** The thread. A conversation is one candidate. */
  candidateId: string;
  /** Who is writing — the optimistic message is drawn on their side. */
  senderParty: ConversationParty;
  /** The counterparty's name, for the reply placeholder ("Write a reply to …"). */
  replyToName?: string;
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
  senderParty,
  replyToName,
  acceptsMessages = true,
}: MessageComposerProps) {
  const scopeDescriptionId = useId();
  const [body, setBody] = useState("");
  const sendMessage = useSendMessage(candidateId, senderParty);

  const trimmed = body.trim();
  // Not gated on a pending send: the message is already in the thread, so the
  // next one can go straight after it, like any chat.
  const canSend = trimmed.length > 0 && acceptsMessages;

  // Cleared at once — the message is already in the thread (optimistic) — and
  // handed back only if the send fails and nothing new was typed meanwhile.
  const handleSend = (): void => {
    if (!canSend) return;
    const sent = trimmed;
    setBody("");
    sendMessage.mutate(
      { body: sent },
      { onError: () => setBody((current) => current || sent) },
    );
  };

  // Closed thread (candidate passed on): a quiet, read-only notice in place of
  // the composer.
  if (!acceptsMessages) {
    return (
      <p className="rounded-xl border border-border bg-secondary/40 px-4 py-3 text-center text-[13px] text-muted-foreground">
        This candidate was passed on — the conversation is closed.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-xl border border-border bg-card shadow-sm focus-within:border-primary/40">
        <Textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={(event) => {
            // Enter sends; Shift+Enter is a newline. Never send mid-IME
            // composition (nativeEvent.isComposing) — that Enter commits text.
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              handleSend();
            }
          }}
          maxLength={MAX_BODY_LENGTH}
          placeholder={
            replyToName ? `Write a reply to ${replyToName}…` : "Write a reply…"
          }
          aria-label="Message"
          aria-describedby={scopeDescriptionId}
          className="min-h-[76px] resize-none border-0 bg-transparent px-4 py-3 shadow-none focus-visible:ring-0"
        />
        <div className="flex items-center justify-between gap-3 px-3 pb-3">
          <p
            id={scopeDescriptionId}
            className="text-[11px] text-muted-foreground"
          >
            Enter to send · Shift + Enter for a new line
          </p>
          <Button
            type="button"
            size="sm"
            className={cn("shrink-0 gap-1.5")}
            disabled={!canSend}
            onClick={handleSend}
          >
            Send
            <SendHorizontal className="h-3.5 w-3.5" />
          </Button>
        </div>
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

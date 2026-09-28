"use client";

import { useState } from "react";

import { cn } from "@/shared/libs/shadCnConfig";
import { formatDate } from "@/shared/utils/formatDate";
import { Button } from "@/shared/ui-components/controls/button";
import { Textarea } from "@/shared/ui-components/controls/textarea";

import type { DisputeMessage } from "../schemas";

const SENDER_LABELS: Record<DisputeMessage["senderRole"], string> = {
  admin: "Support",
  company: "Company",
  recruiter: "Recruiter",
};

/**
 * One private mediation channel: its messages, and (when open) a composer.
 * Admin messages sit on the left, the party's on the right, so a reader can
 * follow the back-and-forth at a glance.
 */
export function DisputeChannelThread({
  messages,
  onSend,
  sending = false,
  placeholder = "Write a message…",
  emptyLabel = "No messages yet.",
  disabled = false,
}: {
  messages: DisputeMessage[];
  onSend?: (body: string) => void;
  sending?: boolean;
  placeholder?: string;
  emptyLabel?: string;
  disabled?: boolean;
}) {
  const [body, setBody] = useState("");

  const send = (): void => {
    const trimmed = body.trim();
    if (!trimmed || sending) return;
    onSend?.(trimmed);
    setBody("");
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-1 flex-col gap-2.5">
        {messages.length === 0 ? (
          // `.well`, dashed: an empty channel is a placeholder, not a record.
          <p className="rounded-sm border border-dashed border-line-strong bg-surface-sub px-3 py-2.5 text-sub text-ink-muted">
            {emptyLabel}
          </p>
        ) : (
          messages.map((m) => {
            const fromAdmin = m.senderRole === "admin";
            return (
              // `.msg` — the counterparty reads as the plain bubble, the party
              // whose side this channel is on as the reference's `.msg--own`.
              <div
                key={m.id}
                className={cn(
                  "flex max-w-[78%] flex-col",
                  fromAdmin ? "self-start" : "items-end self-end",
                )}
              >
                <div
                  className={cn(
                    "rounded-[12px] border px-3 py-2 text-sub",
                    fromAdmin
                      ? "rounded-tl-[4px] border-line bg-surface-sub text-ink-body"
                      : "rounded-tr-[4px] border-blue bg-blue text-white",
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                </div>
                <div className="mt-[3px] flex items-center gap-1.5 text-[11px] text-ink-faint">
                  <span>{SENDER_LABELS[m.senderRole]}</span>
                  <span>·</span>
                  <span>{formatDate(m.createdAt)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {onSend && !disabled ? (
        // `.composer` — one framed unit: a borderless textarea over a ruled bar.
        <div className="rounded-md border border-line-strong bg-surface transition-colors focus-within:border-blue focus-within:shadow-focus">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={placeholder}
            rows={3}
            maxLength={4000}
            className="min-h-16 resize-none rounded-none border-0 bg-transparent px-3 py-2.5 text-sub focus-visible:shadow-none"
          />
          <div className="flex items-center gap-2 border-t border-line px-2.5 py-[7px]">
            <Button
              type="button"
              size="sm"
              className="ml-auto"
              disabled={sending || body.trim().length === 0}
              onClick={send}
            >
              {sending ? "Sending…" : "Send"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

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
    <div className="flex flex-1 flex-col gap-3">
      <div className="flex flex-1 flex-col gap-2">
        {messages.length === 0 ? (
          <p className="rounded-md border border-dashed border-input bg-secondary/40 p-3 text-[13px] text-muted-foreground">
            {emptyLabel}
          </p>
        ) : (
          messages.map((m) => {
            const fromAdmin = m.senderRole === "admin";
            return (
              <div
                key={m.id}
                className={cn(
                  "max-w-[85%] rounded-md border px-3 py-2 text-sm",
                  fromAdmin
                    ? "self-start border-border bg-card"
                    : "self-end border-primary/20 bg-accent/60",
                )}
              >
                <div className="mb-0.5 flex items-center gap-2 text-[11px] font-semibold text-muted-foreground">
                  <span>{SENDER_LABELS[m.senderRole]}</span>
                  <span>·</span>
                  <span>{formatDate(m.createdAt)}</span>
                </div>
                <p className="whitespace-pre-wrap break-words text-navy">
                  {m.body}
                </p>
              </div>
            );
          })
        )}
      </div>

      {onSend && !disabled ? (
        <div className="flex flex-col gap-2">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={placeholder}
            rows={3}
            maxLength={4000}
          />
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
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

"use client";

import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { allMessages, isApiError } from "@/shared/libs/errorHandler";
import { formatDate } from "@/shared/utils/formatDate";
import { formatMinor } from "@/shared/utils/money";
import { Button } from "@/shared/ui-components/controls/button";
import { Card, CardContent } from "@/shared/ui-components/controls/card";

import { useMyDispute, usePostDisputeMessage } from "../hooks/useDisputes";
import { DISPUTE_SUBJECT_LABELS, isDisputeOpen } from "../schemas";
import { DisputeChannelThread } from "./DisputeChannelThread";
import { DisputeProofList } from "./DisputeProofList";
import { DisputeStatusBadge } from "./DisputeStatusBadge";

/** A participant's view of one dispute: the facts, and their private channel. */
export function ParticipantDisputeView({ id }: { id: string }) {
  const { data, isPending, isError, refetch } = useMyDispute(id);
  const post = usePostDisputeMessage(id);

  if (isError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-8 text-center text-sm text-destructive">
          <AlertCircle className="h-6 w-6" />
          Could not load this dispute.
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }
  if (isPending) {
    return (
      <div className="h-40 animate-pulse rounded-md border border-border bg-muted/40" />
    );
  }

  const open = isDisputeOpen(data.status);

  const send = (body: string): void => {
    post.mutate(body, {
      onError: (error) =>
        toast.error(
          isApiError(error)
            ? allMessages(error)
            : "Could not send your message.",
        ),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link href="/disputes">
            <ArrowLeft className="mr-1 h-4 w-4" /> All Disputes
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-xl font-bold text-navy">
            Dispute · {data.jobTitle}
          </h1>
          <DisputeStatusBadge status={data.status} />
        </div>
      </div>

      <Card>
        <CardContent className="grid gap-4 p-5 sm:grid-cols-3">
          <Fact label="Counterparty" value={data.counterpartyName} />
          <Fact label="Fee In Escrow" value={formatMinor(data.amountMinor)} />
          <Fact label="Opened" value={formatDate(data.createdAt)} />
          <div className="sm:col-span-3">
            <Fact
              label="Subject"
              value={DISPUTE_SUBJECT_LABELS[data.subject]}
            />
          </div>
          <div className="sm:col-span-3">
            <Fact label="Your Reason" value={data.reason} />
          </div>
          {data.resolutionNote ? (
            <div className="sm:col-span-3">
              <Fact label="Resolution" value={data.resolutionNote} />
            </div>
          ) : null}
          <div className="sm:col-span-3">
            <DisputeProofList attachments={data.attachments} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h2 className="mb-3 font-heading text-base font-bold text-navy">
            Your Conversation With Support
          </h2>
          <DisputeChannelThread
            messages={data.messages}
            onSend={open ? send : undefined}
            sending={post.isPending}
            emptyLabel={
              open
                ? "No messages yet. Explain your side to the admin here."
                : "This dispute is closed."
            }
            placeholder="Message support…"
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 whitespace-pre-wrap break-words text-sm text-navy">
        {value}
      </p>
    </div>
  );
}

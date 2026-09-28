"use client";

import { AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { allMessages, isApiError } from "@/shared/libs/errorHandler";
import { formatDate } from "@/shared/utils/formatDate";
import { formatMinor } from "@/shared/utils/money";
import { BackLink, PageHeader } from "@/shared/ui-components/brand";
import { Button } from "@/shared/ui-components/controls/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui-components/controls/card";

import { useMyDispute, usePostDisputeMessage } from "../hooks/useDisputes";
import { DISPUTE_SUBJECT_LABELS, isDisputeOpen } from "../schemas";
import { describeCountdown } from "../utils/describeCountdown";
import { DisputeChannelThread } from "./DisputeChannelThread";
import { DisputeFact } from "./DisputeFact";
import { DisputeProofList } from "./DisputeProofList";
import { DisputeStatusBadge } from "./DisputeStatusBadge";

/** A participant's view of one dispute: the facts, and their private channel. */
export function ParticipantDisputeView({ id }: { id: string }) {
  const { data, isPending, isError, refetch } = useMyDispute(id);
  const post = usePostDisputeMessage(id);

  if (isError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-8 text-center text-sub text-bad">
          <AlertCircle className="size-[22px]" />
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
      <div className="h-40 animate-pulse rounded-md border border-line bg-surface-sub" />
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
    <div className="flex flex-col gap-4">
      <div>
        <BackLink href="/disputes">All Disputes</BackLink>
        <PageHeader
          title={`Dispute · ${data.jobTitle}`}
          badge={<DisputeStatusBadge status={data.status} />}
        />
      </div>

      <Card>
        <CardContent className="grid grid-cols-2 gap-x-5 gap-y-3.5 sm:grid-cols-3">
          <DisputeFact label="Counterparty" value={data.counterpartyName} />
          <DisputeFact
            label="Fee In Escrow"
            value={formatMinor(data.amountMinor)}
          />
          <DisputeFact label="Opened" value={formatDate(data.createdAt)} />
          <DisputeFact
            className="col-span-2 sm:col-span-3"
            label="Subject"
            value={DISPUTE_SUBJECT_LABELS[data.subject]}
          />
          <DisputeFact
            className="col-span-2 sm:col-span-3"
            variant="prose"
            label="Your Reason"
            value={data.reason}
          />
          <DisputeFact
            className="col-span-2 sm:col-span-3"
            label="Release Countdown"
            value={describeCountdown(data.countdown)}
          />
          {data.resolutionNote ? (
            <DisputeFact
              className="col-span-2 sm:col-span-3"
              variant="prose"
              label="Resolution"
              value={data.resolutionNote}
            />
          ) : null}
          <div className="col-span-2 sm:col-span-3">
            <DisputeProofList attachments={data.attachments} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Conversation With Support</CardTitle>
        </CardHeader>
        <CardContent>
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

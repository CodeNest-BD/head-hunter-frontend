"use client";

import Link from "next/link";
import { AlertCircle, ArrowLeft, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { allMessages, isApiError } from "@/shared/libs/errorHandler";
import { formatDate } from "@/shared/utils/formatDate";
import { formatMinor } from "@/shared/utils/money";
import { Button } from "@/shared/ui-components/controls/button";
import { Card, CardContent } from "@/shared/ui-components/controls/card";

import {
  useAdminDispute,
  usePostAdminDisputeMessage,
} from "../hooks/useDisputes";
import { DISPUTE_SUBJECT_LABELS, isDisputeOpen } from "../schemas";
import { DisputeChannelThread } from "./DisputeChannelThread";
import { DisputeProofList } from "./DisputeProofList";
import { DisputeStatusBadge } from "./DisputeStatusBadge";

/** Full admin adjudication view: context and both channels. Settling the
 * escrow is not done from here — an admin moves that money by hand. */
export function AdminDisputeView({ id }: { id: string }) {
  const { data, isPending, isError, refetch } = useAdminDispute(id);
  const post = usePostAdminDisputeMessage(id);

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

  // Both channels post through one mutation, so `isPending` alone would put
  // the other channel's composer into "Sending…" too. The in-flight variables
  // say which one is actually busy.
  const sendingTo = (channel: "company" | "recruiter"): boolean =>
    post.isPending && post.variables?.channel === channel;

  const sendTo = (channel: "company" | "recruiter") => (body: string) => {
    post.mutate(
      { channel, body },
      {
        onError: (error) =>
          toast.error(
            isApiError(error) ? allMessages(error) : "Could not send message.",
          ),
      },
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link href="/admin/disputes">
            <ArrowLeft className="mr-1 h-4 w-4" /> Dispute Inbox
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-xl font-bold text-navy">
            {data.candidateName} · {data.jobTitle}
          </h1>
          <DisputeStatusBadge status={data.status} />
        </div>
      </div>

      <Card>
        <CardContent className="grid gap-4 p-5 sm:grid-cols-3">
          <Fact label="Company" value={data.companyName} />
          <Fact label="Recruiter" value={data.recruiterName} />
          <Fact
            label="Opened By"
            value={data.raisedBy === "company" ? "Company" : "Recruiter"}
          />
          <Fact label="Fee In Escrow" value={formatMinor(data.amountMinor)} />
          <Fact label="Joining Date" value={formatDate(data.joiningDate)} />
          <Fact label="Guarantee Ends" value={formatDate(data.holdExpiresAt)} />
          <div className="sm:col-span-3">
            <Fact
              label="Subject"
              value={DISPUTE_SUBJECT_LABELS[data.subject]}
            />
          </div>
          <div className="sm:col-span-3">
            <Fact label="Reason" value={data.reason} />
          </div>
          {data.resolutionNote ? (
            <div className="sm:col-span-3">
              <Fact label="Resolution Note" value={data.resolutionNote} />
            </div>
          ) : null}
          <div className="sm:col-span-3">
            <DisputeProofList attachments={data.attachments} />
          </div>
          <div className="sm:col-span-3">
            {/* Opens in its own tab: the admin reads the parties' own thread
                alongside this adjudication, not instead of it — which is what
                the external-link affordance already promised. */}
            <Button asChild variant="outline" size="sm">
              <Link
                href={`/admin/conversations/${data.candidateId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open Company ↔ Recruiter Thread
                <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="flex flex-col">
          <CardContent className="flex flex-1 flex-col p-5">
            <h2 className="mb-3 font-heading text-base font-bold text-navy">
              Channel With Company
            </h2>
            <DisputeChannelThread
              messages={data.companyMessages}
              onSend={open ? sendTo("company") : undefined}
              sending={sendingTo("company")}
              placeholder="Message the company…"
              emptyLabel="No messages with the company yet."
            />
          </CardContent>
        </Card>
        <Card className="flex flex-col">
          <CardContent className="flex flex-1 flex-col p-5">
            <h2 className="mb-3 font-heading text-base font-bold text-navy">
              Channel With Recruiter
            </h2>
            <DisputeChannelThread
              messages={data.recruiterMessages}
              onSend={open ? sendTo("recruiter") : undefined}
              sending={sendingTo("recruiter")}
              placeholder="Message the recruiter…"
              emptyLabel="No messages with the recruiter yet."
            />
          </CardContent>
        </Card>
      </div>
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

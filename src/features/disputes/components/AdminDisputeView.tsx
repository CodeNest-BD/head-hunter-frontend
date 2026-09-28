"use client";

import Link from "next/link";
import { AlertCircle, ExternalLink } from "lucide-react";
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

import {
  useAdminDispute,
  usePostAdminDisputeMessage,
} from "../hooks/useDisputes";
import { DISPUTE_SUBJECT_LABELS, isDisputeOpen } from "../schemas";
import { describeCountdown } from "../utils/describeCountdown";
import { DisputeChannelThread } from "./DisputeChannelThread";
import { DisputeFact } from "./DisputeFact";
import { DisputeProofList } from "./DisputeProofList";
import { DisputeStatusBadge } from "./DisputeStatusBadge";
import { ResolveDisputeCard } from "./ResolveDisputeCard";

/** Full admin adjudication view: context, both channels, and resolution. */
export function AdminDisputeView({ id }: { id: string }) {
  const { data, isPending, isError, refetch } = useAdminDispute(id);
  const post = usePostAdminDisputeMessage(id);

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
    <div className="flex flex-col gap-4">
      <div>
        <BackLink href="/admin/disputes">Dispute Inbox</BackLink>
        <PageHeader
          title={`${data.candidateName} · ${data.jobTitle}`}
          badge={<DisputeStatusBadge status={data.status} />}
        />
      </div>

      <Card>
        <CardContent className="grid grid-cols-2 gap-x-5 gap-y-3.5 sm:grid-cols-3">
          <DisputeFact label="Company" value={data.companyName} />
          <DisputeFact label="Recruiter" value={data.recruiterName} />
          <DisputeFact
            label="Opened By"
            value={data.raisedBy === "company" ? "Company" : "Recruiter"}
          />
          <DisputeFact
            label="Fee In Escrow"
            value={formatMinor(data.amountMinor)}
          />
          <DisputeFact
            label="Joining Date"
            value={formatDate(data.joiningDate)}
          />
          <DisputeFact
            label="Release Date"
            value={formatDate(data.holdExpiresAt)}
          />
          <DisputeFact
            className="col-span-2 sm:col-span-3"
            label="Subject"
            value={DISPUTE_SUBJECT_LABELS[data.subject]}
          />
          <DisputeFact
            className="col-span-2 sm:col-span-3"
            variant="prose"
            label="Reason"
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
              label="Resolution Note"
              value={data.resolutionNote}
            />
          ) : null}
          <div className="col-span-2 sm:col-span-3">
            <DisputeProofList attachments={data.attachments} />
          </div>
          <div className="col-span-2 sm:col-span-3">
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
                <ExternalLink />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Channel With Company</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col">
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
          <CardHeader>
            <CardTitle>Channel With Recruiter</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col">
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

      {open ? <ResolveDisputeCard dispute={data} /> : null}
    </div>
  );
}

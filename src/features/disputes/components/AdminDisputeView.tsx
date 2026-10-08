"use client";

import Link from "next/link";
import { AlertCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { useCanonicalPath } from "@/shared/hooks/useCanonicalPath";
import { allMessages, isApiError } from "@/shared/libs/errorHandler";
import {
  adminConversationPath,
  adminDisputePath,
} from "@/shared/utils/entityPaths";
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
export function AdminDisputeView({ disputeRef }: { disputeRef: string }) {
  const { data, isPending, isError, refetch } = useAdminDispute(disputeRef);
  const post = usePostAdminDisputeMessage();
  useCanonicalPath(data && adminDisputePath(data));

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
      { disputeId: data.id, channel, body },
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

      {/* The claim and the two channels run down the main column; who and
          how much, and the decision itself, sit in the rail beside them —
          where an adjudicator can keep the facts in view while reading the
          threads, instead of scrolling back up to them. */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="flex min-w-0 flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Dispute Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-x-5 gap-y-3.5 sm:grid-cols-3">
              <DisputeFact
                label="Subject"
                value={DISPUTE_SUBJECT_LABELS[data.subject]}
              />
              <DisputeFact
                label="Raised By"
                value={data.raisedBy === "company" ? "Company" : "Recruiter"}
              />
              <DisputeFact
                label="Release Countdown"
                value={describeCountdown(data.countdown)}
              />
              <DisputeFact
                className="col-span-2 sm:col-span-3"
                variant="prose"
                label="Reason"
                value={data.reason}
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
            </CardContent>
          </Card>

          <div className="grid gap-4 xl:grid-cols-2">
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
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Placement Overview</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3.5">
              <DisputeFact label="Candidate" value={data.candidateName} />
              <DisputeFact label="Job" value={data.jobTitle} />
              <DisputeFact label="Company" value={data.companyName} />
              <DisputeFact label="Recruiter" value={data.recruiterName} />
              {/* Opens in its own tab: the admin reads the parties' own thread
                  alongside this adjudication, not instead of it — which is what
                  the external-link affordance already promised. */}
              <Button asChild variant="outline" size="sm" className="w-fit">
                <Link
                  href={adminConversationPath({
                    id: data.candidateId,
                    serialNumber: data.candidateSerialNumber,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open Their Thread
                  <ExternalLink />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment &amp; Escrow</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3.5">
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
            </CardContent>
          </Card>

          {open ? <ResolveDisputeCard dispute={data} /> : null}
        </div>
      </div>
    </div>
  );
}

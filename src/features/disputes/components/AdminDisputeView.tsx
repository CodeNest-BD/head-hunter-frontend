"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { allMessages, isApiError } from "@/shared/libs/errorHandler";
import { formatDate } from "@/shared/utils/formatDate";
import { formatMinor } from "@/shared/utils/money";
import { Button } from "@/shared/ui-components/controls/button";
import { Card, CardContent } from "@/shared/ui-components/controls/card";
import { ConfirmAction } from "@/shared/ui-components/controls/ConfirmAction";
import { Textarea } from "@/shared/ui-components/controls/textarea";

import {
  useAdminDispute,
  usePostAdminDisputeMessage,
  useResolveDispute,
} from "../hooks/useDisputes";
import { isDisputeOpen, type DisputeResolution } from "../schemas";
import { DisputeChannelThread } from "./DisputeChannelThread";
import { DisputeStatusBadge } from "./DisputeStatusBadge";

/** Full admin adjudication view: context, both channels, and resolution. */
export function AdminDisputeView({ id }: { id: string }) {
  const { data, isPending, isError, refetch } = useAdminDispute(id);
  const post = usePostAdminDisputeMessage(id);
  const resolve = useResolveDispute(id);
  const [note, setNote] = useState("");
  const [confirming, setConfirming] = useState<DisputeResolution | null>(null);

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

  const doResolve = (outcome: DisputeResolution): void => {
    resolve.mutate(
      { outcome, note: note.trim() || undefined },
      {
        onSuccess: () => {
          toast.success(
            outcome === "refund"
              ? "Refunded the company."
              : "Released the fee to the recruiter.",
          );
          setConfirming(null);
        },
        onError: (error) =>
          toast.error(
            isApiError(error)
              ? allMessages(error)
              : "Could not resolve the dispute.",
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
            <Fact label="Reason" value={data.reason} />
          </div>
          {data.resolutionNote ? (
            <div className="sm:col-span-3">
              <Fact label="Resolution Note" value={data.resolutionNote} />
            </div>
          ) : null}
          <div className="sm:col-span-3">
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/conversations/${data.candidateId}`}>
                Open Company ↔ Recruiter Thread
                <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <h2 className="mb-3 font-heading text-base font-bold text-navy">
              Channel With Company
            </h2>
            <DisputeChannelThread
              messages={data.companyMessages}
              onSend={open ? sendTo("company") : undefined}
              sending={post.isPending}
              placeholder="Message the company…"
              emptyLabel="No messages with the company yet."
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <h2 className="mb-3 font-heading text-base font-bold text-navy">
              Channel With Recruiter
            </h2>
            <DisputeChannelThread
              messages={data.recruiterMessages}
              onSend={open ? sendTo("recruiter") : undefined}
              sending={post.isPending}
              placeholder="Message the recruiter…"
              emptyLabel="No messages with the recruiter yet."
            />
          </CardContent>
        </Card>
      </div>

      {open ? (
        <Card>
          <CardContent className="flex flex-col gap-4 p-5">
            <div>
              <h2 className="font-heading text-base font-bold text-navy">
                Resolve
              </h2>
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                Settle the {formatMinor(data.amountMinor)} held in escrow. This
                moves money and cannot be undone.
              </p>
            </div>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Resolution note (recorded on the dispute)…"
              rows={2}
              maxLength={4000}
            />
            {confirming ? (
              <ConfirmAction
                message={
                  confirming === "refund"
                    ? `Refund ${formatMinor(data.amountMinor)} to ${data.companyName} and reopen the job?`
                    : `Release ${formatMinor(data.amountMinor)} to ${data.recruiterName}?`
                }
                confirmLabel={
                  confirming === "refund" ? "Refund company" : "Pay recruiter"
                }
                busyLabel="Settling…"
                busy={resolve.isPending}
                onConfirm={() => doResolve(confirming)}
                onCancel={() => setConfirming(null)}
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setConfirming("refund")}
                >
                  Refund Company
                </Button>
                <Button type="button" onClick={() => setConfirming("release")}>
                  Pay Recruiter
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}
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

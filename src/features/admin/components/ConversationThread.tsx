"use client";

import {
  AlertCircle,
  ArrowLeftRight,
  CalendarClock,
  CheckCircle2,
  FileText,
  Send,
  UserPlus,
  type LucideIcon,
} from "lucide-react";

import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { Breadcrumb } from "@/shared/ui-components/layout/Breadcrumb";
import { cn } from "@/shared/libs/shadCnConfig";
import { Button } from "@/shared/ui-components/controls/button";
import { Card, CardContent } from "@/shared/ui-components/controls/card";
import { useAdminConversation } from "../hooks/useAdmin";
import { SUBMISSION_LABELS, type ConversationEvent } from "../schemas";
import { DetailSkeleton } from "./DetailPrimitives";
import { SUBMISSION_STATUS_STYLES } from "./statusStyles";

const EVENT_ICON: Record<ConversationEvent["type"], LucideIcon> = {
  submission: Send,
  candidate: UserPlus,
  proposal: CalendarClock,
  hire_response: CheckCircle2,
  offer: FileText,
};

const ACTOR_LABEL: Record<string, string> = {
  company: "Company",
  recruiter: "Recruiter",
  system: "System",
};

const ACTOR_MARKER: Record<string, string> = {
  company: "bg-navy text-white",
  recruiter: "bg-primary text-primary-foreground",
  system: "bg-muted text-muted-foreground",
};

const ACTOR_TEXT: Record<string, string> = {
  company: "text-navy",
  recruiter: "text-primary",
  system: "text-muted-foreground",
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ConversationThread({ submissionId }: { submissionId: string }) {
  const { data, isPending, isError, refetch } =
    useAdminConversation(submissionId);

  if (isPending) return <DetailSkeleton />;
  if (isError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-8 text-center text-sm text-destructive">
          <AlertCircle className="h-6 w-6" />
          Could not load this conversation.
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Conversations", href: "/admin/conversations" },
          { label: `${data.company.name} ↔ ${data.recruiter.name}` },
        ]}
      />

      <Card>
        <CardContent className="flex flex-col gap-4 p-6">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="font-heading text-lg font-bold text-navy">
              {data.company.name}
            </span>
            <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
            <span className="font-heading text-lg font-bold text-navy">
              {data.recruiter.name}
            </span>
            <StatusBadge
              label={SUBMISSION_LABELS[data.status] ?? data.status}
              className={
                SUBMISSION_STATUS_STYLES[data.status] ??
                "bg-muted text-muted-foreground"
              }
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Role:{" "}
            <span className="font-medium text-navy">{data.job.title}</span>
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-navy" />
              Company
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-primary" />
              Recruiter
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <ol className="flex flex-col">
            {data.events.map((event, index) => {
              const Icon = EVENT_ICON[event.type];
              const actor = event.actor ?? "system";
              const isLast = index === data.events.length - 1;
              return (
                <li key={index} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                        ACTOR_MARKER[actor] ?? ACTOR_MARKER.system,
                      )}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    {!isLast && <span className="my-1 w-px flex-1 bg-border" />}
                  </div>
                  <div
                    className={cn("min-w-0 flex-1", isLast ? "pb-0" : "pb-6")}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-navy">
                        {event.title}
                      </p>
                      <span
                        className={cn(
                          "text-xs font-semibold uppercase tracking-[0.06em]",
                          ACTOR_TEXT[actor] ?? "text-muted-foreground",
                        )}
                      >
                        {ACTOR_LABEL[actor] ?? "System"}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDateTime(event.at)}
                    </p>
                    {event.body && (
                      <p className="mt-2 rounded-lg bg-muted/60 px-3 py-2 text-sm text-foreground">
                        {event.body}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertCircle } from "lucide-react";

import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import {
  MobileRecordCard,
  MobileRecordList,
} from "@/shared/ui-components/mobile-view/MobileRecordCard";
import { cn } from "@/shared/libs/shadCnConfig";
import { Button } from "@/shared/ui-components/controls/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui-components/controls/card";
import { useAdminConversations } from "../hooks/useAdmin";
import { CANDIDATE_LABELS, type ConversationListItem } from "../schemas";
import { ListPager } from "./ListPager";
import { CANDIDATE_STATUS_TONES } from "./statusStyles";
import {
  TABLE_BODY,
  TABLE_CELL_MAIN,
  TABLE_EL,
  TABLE_HEAD,
  TABLE_ROW,
  TABLE_SCROLL,
  TABLE_TD,
  TABLE_TH,
} from "@/shared/ui-components/data/tableStyles";

const PAGE_SIZE = 10;

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function SubmissionStatus({
  submission,
}: {
  submission: ConversationListItem;
}) {
  return (
    <StatusBadge
      label={CANDIDATE_LABELS[submission.status] ?? submission.status}
      tone={CANDIDATE_STATUS_TONES[submission.status] ?? "neutral"}
    />
  );
}

function SubmissionCard({ submission }: { submission: ConversationListItem }) {
  return (
    <MobileRecordCard
      title={submission.jobTitle}
      subtitle={submission.companyName}
      href={`/admin/conversations/${submission.candidateId}`}
      trailing={<SubmissionStatus submission={submission} />}
      fields={[
        { label: "Messages", value: submission.messageCount },
        {
          label: "Last activity",
          value: formatDateTime(submission.lastActivityAt),
        },
      ]}
    />
  );
}

/**
 * This recruiter's submissions, each a link into the full conversation thread —
 * the same thread the Conversations directory opens.
 */
export function RecruiterSubmissions({
  recruiterProfileId,
}: {
  recruiterProfileId: string;
}) {
  const [page, setPage] = useState(1);
  const { data, isPending, isError, refetch } = useAdminConversations({
    page,
    limit: PAGE_SIZE,
    recruiterProfileId,
  });

  return (
    <Card>
      {/* The reference's submissions table carries its title on an unruled head:
          the table's own header band is the rule. */}
      <CardHeader className="border-b-0">
        <CardTitle>Submissions</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isPending ? (
          <div className="h-32 animate-pulse" />
        ) : isError ? (
          <div className="m-4 flex max-w-md flex-col gap-3 rounded-sm border border-bad-line bg-bad-bg p-3.5 text-sub text-bad">
            <div className="flex items-center gap-2.5 font-[550]">
              <AlertCircle className="size-[15px] shrink-0" />
              Could not load submissions.
            </div>
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void refetch()}
              >
                Retry
              </Button>
            </div>
          </div>
        ) : data.data.length === 0 ? (
          <p className="px-5 py-9 text-center text-sub text-ink-muted">
            This recruiter has not submitted any candidates yet.
          </p>
        ) : (
          <>
            <div className={cn(TABLE_SCROLL, "hidden sm:block")}>
              <table className={TABLE_EL}>
                <thead className={TABLE_HEAD}>
                  <tr>
                    <th scope="col" className={TABLE_TH}>
                      Job
                    </th>
                    <th scope="col" className={TABLE_TH}>
                      Company
                    </th>
                    <th scope="col" className={cn(TABLE_TH, "text-center")}>
                      Messages
                    </th>
                    <th scope="col" className={TABLE_TH}>
                      Status
                    </th>
                    <th scope="col" className={TABLE_TH}>
                      Last activity
                    </th>
                  </tr>
                </thead>
                <tbody className={TABLE_BODY}>
                  {data.data.map((c) => (
                    <tr
                      key={c.candidateId}
                      className={cn("relative", TABLE_ROW)}
                    >
                      <td className={TABLE_TD}>
                        <Link
                          href={`/admin/conversations/${c.candidateId}`}
                          className={cn(
                            TABLE_CELL_MAIN,
                            "transition-colors after:absolute after:inset-0 hover:text-blue focus-visible:underline focus-visible:outline-none",
                          )}
                        >
                          <span className="block max-w-[220px] truncate">
                            {c.jobTitle}
                          </span>
                        </Link>
                      </td>
                      <td className={cn(TABLE_TD, "text-ink-muted")}>
                        <span className="block max-w-[180px] truncate">
                          {c.companyName}
                        </span>
                      </td>
                      <td
                        className={cn(
                          TABLE_TD,
                          "text-center tabular-nums text-ink",
                        )}
                      >
                        {c.messageCount}
                      </td>
                      <td className={TABLE_TD}>
                        <SubmissionStatus submission={c} />
                      </td>
                      <td
                        className={cn(
                          TABLE_TD,
                          "whitespace-nowrap tabular-nums text-ink-muted",
                        )}
                      >
                        {formatDateTime(c.lastActivityAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <MobileRecordList className="sm:hidden">
              {data.data.map((c) => (
                <SubmissionCard key={c.candidateId} submission={c} />
              ))}
            </MobileRecordList>
            <ListPager
              page={page}
              totalPages={data.meta.totalPages}
              total={data.meta.total}
              onPage={setPage}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import Link from "next/link";
import { AlertCircle, MessagesSquare } from "lucide-react";

import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { TableSkeleton } from "@/shared/ui-components/data/TableSkeleton";
import { Button } from "@/shared/ui-components/controls/button";
import { Card, CardContent } from "@/shared/ui-components/controls/card";
import { useAdminConversations } from "../hooks/useAdmin";
import { useListState } from "../hooks/useListState";
import { SUBMISSION_LABELS } from "../schemas";
import { ListPager } from "./ListPager";
import { ListToolbar } from "./ListToolbar";
import { SUBMISSION_STATUS_STYLES } from "./statusStyles";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ConversationsTable() {
  const { page, setPage, qInput, setQInput, q, status, changeStatus } =
    useListState();
  const { data, isPending, isError, refetch } = useAdminConversations({
    page,
    q: q || undefined,
    status: status || undefined,
  });

  return (
    <div className="flex flex-col gap-4">
      <ListToolbar
        query={qInput}
        onQueryChange={setQInput}
        placeholder="Search by job, company or recruiter…"
        filter={{
          value: status,
          onChange: changeStatus,
          allLabel: "All",
          options: [
            { value: "submitted", label: "Submitted" },
            { value: "under_review", label: "Under review" },
            { value: "advanced", label: "Advanced" },
            { value: "rejected", label: "Rejected" },
            { value: "withdrawn", label: "Withdrawn" },
          ],
        }}
      />

      {isPending ? (
        <TableSkeleton />
      ) : isError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center text-sm text-destructive">
            <AlertCircle className="h-6 w-6" />
            Could not load conversations.
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : data.data.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-primary">
              <MessagesSquare className="h-6 w-6" />
            </span>
            <p className="text-sm font-semibold text-navy">
              No conversations found
            </p>
            <p className="text-sm text-muted-foreground">
              Conversations appear once a recruiter submits candidates to a job.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-[0.08em] text-muted-foreground">
                    <th className="px-5 py-3 font-semibold">Company</th>
                    <th className="px-5 py-3 font-semibold">Recruiter</th>
                    <th className="px-5 py-3 font-semibold">Job</th>
                    <th className="px-5 py-3 text-center font-semibold">
                      Candidates
                    </th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Last activity</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((c) => (
                    <tr
                      key={c.submissionId}
                      className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-accent/40"
                    >
                      <td className="px-5 py-3">
                        <Link
                          href={`/admin/conversations/${c.submissionId}`}
                          className="font-medium text-navy hover:text-primary hover:underline"
                        >
                          {c.companyName}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {c.recruiterName}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {c.jobTitle}
                      </td>
                      <td className="px-5 py-3 text-center tabular-nums text-navy">
                        {c.candidateCount}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge
                          label={SUBMISSION_LABELS[c.status] ?? c.status}
                          className={
                            SUBMISSION_STATUS_STYLES[c.status] ??
                            "bg-muted text-muted-foreground"
                          }
                        />
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">
                        {formatDateTime(c.lastActivityAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ListPager
              page={page}
              totalPages={data.meta.totalPages}
              total={data.meta.total}
              onPage={setPage}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

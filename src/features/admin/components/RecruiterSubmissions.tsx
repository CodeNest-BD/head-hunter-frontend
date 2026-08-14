"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertCircle } from "lucide-react";

import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { Button } from "@/shared/ui-components/controls/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui-components/controls/card";
import { useAdminConversations } from "../hooks/useAdmin";
import { SUBMISSION_LABELS } from "../schemas";
import { ListPager } from "./ListPager";
import { SUBMISSION_STATUS_STYLES } from "./statusStyles";
import { BODY_ROW_CLASS, TABLE_CLASS, THEAD_ROW_CLASS } from "./tableStyles";

const PAGE_SIZE = 10;

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
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
      <CardHeader>
        <CardTitle className="text-base">Submissions</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isPending ? (
          <div className="h-32 animate-pulse" />
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 p-8 text-center text-sm text-destructive">
            <AlertCircle className="h-6 w-6" />
            Could not load submissions.
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        ) : data.data.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-muted-foreground">
            This recruiter has not submitted any candidates yet.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className={TABLE_CLASS}>
                <thead>
                  <tr className={THEAD_ROW_CLASS}>
                    <th scope="col" className="px-5 py-3 font-semibold">
                      Job
                    </th>
                    <th scope="col" className="px-5 py-3 font-semibold">
                      Company
                    </th>
                    <th
                      scope="col"
                      className="px-5 py-3 text-center font-semibold"
                    >
                      Candidates
                    </th>
                    <th scope="col" className="px-5 py-3 font-semibold">
                      Status
                    </th>
                    <th scope="col" className="px-5 py-3 font-semibold">
                      Last activity
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((c) => (
                    <tr
                      key={c.submissionId}
                      className={`relative ${BODY_ROW_CLASS}`}
                    >
                      <td className="px-5 py-3">
                        <Link
                          href={`/admin/conversations/${c.submissionId}`}
                          className="font-medium text-navy after:absolute after:inset-0 hover:text-primary focus-visible:underline focus-visible:outline-none"
                        >
                          <span className="block max-w-[220px] truncate">
                            {c.jobTitle}
                          </span>
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        <span className="block max-w-[180px] truncate">
                          {c.companyName}
                        </span>
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
          </>
        )}
      </CardContent>
    </Card>
  );
}

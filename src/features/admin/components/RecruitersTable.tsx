"use client";

import Link from "next/link";
import { AlertCircle, Users } from "lucide-react";

import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { TableSkeleton } from "@/shared/ui-components/data/TableSkeleton";
import { Button } from "@/shared/ui-components/controls/button";
import { Card, CardContent } from "@/shared/ui-components/controls/card";
import { useAdminRecruiters } from "../hooks/useAdmin";
import { useListState } from "../hooks/useListState";
import { SUBSCRIPTION_LABELS } from "../schemas";
import { HoldButton } from "./HoldButton";
import { ListPager } from "./ListPager";
import { ListToolbar } from "./ListToolbar";
import {
  ACCOUNT_STATUS_LABELS,
  ACCOUNT_STATUS_STYLES,
  SUBSCRIPTION_STATUS_STYLES,
} from "./statusStyles";
import { BODY_ROW_CLASS, TABLE_CLASS, THEAD_ROW_CLASS } from "./tableStyles";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function RecruitersTable() {
  const {
    page,
    setPage,
    qInput,
    setQInput,
    q,
    status,
    changeStatus,
    limit,
    changeLimit,
  } = useListState();
  const { data, isPending, isError, refetch } = useAdminRecruiters({
    page,
    limit,
    q: q || undefined,
    status: status || undefined,
  });

  return (
    <div className="flex flex-col gap-4">
      <ListToolbar
        query={qInput}
        onQueryChange={setQInput}
        placeholder="Search recruiters by name or email…"
        filter={{
          value: status,
          onChange: changeStatus,
          allLabel: "All statuses",
          options: [
            { value: "active", label: "Active" },
            { value: "suspended", label: "Held" },
          ],
        }}
      />

      {isPending ? (
        <TableSkeleton />
      ) : isError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center text-sm text-destructive">
            <AlertCircle className="h-6 w-6" />
            Could not load recruiters.
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : data.data.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-primary">
              <Users className="h-6 w-6" />
            </span>
            <p className="text-sm font-semibold text-navy">
              No recruiters found
            </p>
            <p className="text-sm text-muted-foreground">
              Try a different search or filter.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className={TABLE_CLASS}>
                <thead>
                  <tr className={THEAD_ROW_CLASS}>
                    <th scope="col" className="px-5 py-3 font-semibold">
                      Recruiter
                    </th>
                    <th scope="col" className="px-5 py-3 font-semibold">
                      Subscription
                    </th>
                    <th scope="col" className="px-5 py-3 font-semibold">
                      Location
                    </th>
                    <th scope="col" className="px-5 py-3 font-semibold">
                      Joined
                    </th>
                    <th scope="col" className="px-5 py-3 font-semibold">
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-5 py-3 text-right font-semibold"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((r) => (
                    <tr key={r.userId} className={BODY_ROW_CLASS}>
                      <td className="px-5 py-3">
                        <Link
                          href={`/admin/recruiters/${r.userId}`}
                          className="font-medium text-navy hover:text-primary hover:underline focus-visible:underline focus-visible:outline-none"
                        >
                          {r.firstName} {r.lastName}
                        </Link>
                        <p
                          className="max-w-[240px] truncate text-xs text-muted-foreground"
                          title={r.email}
                        >
                          {r.email}
                        </p>
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge
                          label={
                            SUBSCRIPTION_LABELS[r.subscriptionStatus] ??
                            r.subscriptionStatus
                          }
                          className={
                            SUBSCRIPTION_STATUS_STYLES[r.subscriptionStatus] ??
                            "bg-muted text-muted-foreground"
                          }
                        />
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {[r.city, r.state].filter(Boolean).join(", ") || "—"}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">
                        {formatDate(r.joinedAt)}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge
                          label={ACCOUNT_STATUS_LABELS[r.status]}
                          className={ACCOUNT_STATUS_STYLES[r.status]}
                        />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/admin/recruiters/${r.userId}`}>
                              View
                            </Link>
                          </Button>
                          <HoldButton
                            userId={r.userId}
                            status={r.status}
                            subjectName={`${r.firstName} ${r.lastName}`}
                            size="sm"
                          />
                        </div>
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
              pageSize={limit}
              onPageSize={changeLimit}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

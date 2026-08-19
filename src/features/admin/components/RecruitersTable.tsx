"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, Users } from "lucide-react";

import { RatingStars } from "@/shared/ui-components/data/RatingStars";
import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { TableAvatar } from "@/shared/ui-components/data/TableAvatar";
import { TableSkeleton } from "@/shared/ui-components/data/TableSkeleton";
import {
  ColumnsToggle,
  useVisibleColumns,
  type ColumnDef,
} from "@/shared/ui-components/data/columns";
import { Button } from "@/shared/ui-components/controls/button";
import { Card, CardContent } from "@/shared/ui-components/controls/card";
import { useAdminRecruiters } from "../hooks/useAdmin";
import { useListState } from "../hooks/useListState";
import { VERIFICATION_LABELS } from "../schemas";
import { AccountRowActions } from "./AccountRowActions";
import { ListPager } from "./ListPager";
import { ListToolbar } from "./ListToolbar";
import {
  ACCOUNT_STATUS_LABELS,
  ACCOUNT_STATUS_STYLES,
  VERIFICATION_STATUS_STYLES,
} from "./statusStyles";
import { BODY_ROW_CLASS, TABLE_CLASS, THEAD_ROW_CLASS } from "./tableStyles";
import { TABLE_TOOLBAR } from "@/shared/ui-components/data/tableStyles";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const COLUMNS: ColumnDef[] = [
  { key: "recruiter", label: "Recruiter", required: true },
  { key: "verification", label: "Verification" },
  { key: "rating", label: "Rating" },
  { key: "location", label: "Location" },
  { key: "joined", label: "Joined" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Actions", required: true },
];

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
  const [verificationFilter, setVerificationFilter] = useState("");
  const cols = useVisibleColumns("admin.recruiters.columns", COLUMNS);
  const { data, isPending, isError, refetch } = useAdminRecruiters({
    page,
    limit,
    q: q || undefined,
    status: status || undefined,
    verificationStatus: verificationFilter || undefined,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className={TABLE_TOOLBAR}>
        <div className="flex-1">
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
            extraFilter={{
              value: verificationFilter,
              onChange: (next) => {
                setVerificationFilter(next);
                setPage(1);
              },
              allLabel: "All verification",
              options: [
                { value: "pending", label: "Pending" },
                { value: "verified", label: "Verified" },
                { value: "rejected", label: "Rejected" },
              ],
            }}
          />
        </div>
        <ColumnsToggle
          columns={cols.columns}
          isVisible={cols.isVisible}
          onToggle={cols.toggle}
        />
      </div>

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
            <div className="w-full">
              <table className={TABLE_CLASS}>
                <thead>
                  <tr className={THEAD_ROW_CLASS}>
                    <th scope="col" className="px-5 py-3 font-semibold">
                      Recruiter
                    </th>
                    {cols.isVisible("verification") && (
                      <th scope="col" className="px-5 py-3 font-semibold">
                        Verification
                      </th>
                    )}
                    {cols.isVisible("rating") && (
                      <th scope="col" className="px-5 py-3 font-semibold">
                        Rating
                      </th>
                    )}
                    {cols.isVisible("location") && (
                      <th scope="col" className="px-5 py-3 font-semibold">
                        Location
                      </th>
                    )}
                    {cols.isVisible("joined") && (
                      <th scope="col" className="px-5 py-3 font-semibold">
                        Joined
                      </th>
                    )}
                    {cols.isVisible("status") && (
                      <th scope="col" className="px-5 py-3 font-semibold">
                        Status
                      </th>
                    )}
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
                        <div className="flex items-center gap-3">
                          <TableAvatar name={`${r.firstName} ${r.lastName}`} />
                          <div className="min-w-0">
                            <Link
                              href={`/admin/recruiters/${r.userId}`}
                              className="font-semibold text-navy hover:text-primary hover:underline focus-visible:underline focus-visible:outline-none"
                            >
                              {r.firstName} {r.lastName}
                            </Link>
                            <p
                              className="max-w-[240px] truncate text-xs text-muted-foreground"
                              title={r.email}
                            >
                              {r.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      {cols.isVisible("verification") && (
                        <td className="px-5 py-3">
                          <StatusBadge
                            label={VERIFICATION_LABELS[r.verificationStatus]}
                            className={
                              VERIFICATION_STATUS_STYLES[
                                r.verificationStatus
                              ] ?? "bg-muted text-muted-foreground"
                            }
                          />
                        </td>
                      )}
                      {cols.isVisible("rating") && (
                        <td className="whitespace-nowrap px-5 py-3">
                          <RatingStars
                            value={r.ratingAvg}
                            count={r.ratingCount}
                          />
                        </td>
                      )}
                      {cols.isVisible("location") && (
                        <td className="px-5 py-3 text-muted-foreground">
                          {[r.city, r.state].filter(Boolean).join(", ") || "—"}
                        </td>
                      )}
                      {cols.isVisible("joined") && (
                        <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">
                          {formatDate(r.joinedAt)}
                        </td>
                      )}
                      {cols.isVisible("status") && (
                        <td className="px-5 py-3">
                          <StatusBadge
                            label={ACCOUNT_STATUS_LABELS[r.status]}
                            className={ACCOUNT_STATUS_STYLES[r.status]}
                          />
                        </td>
                      )}
                      <td className="px-5 py-3">
                        <AccountRowActions
                          userId={r.userId}
                          status={r.status}
                          subjectName={`${r.firstName} ${r.lastName}`}
                          viewHref={`/admin/recruiters/${r.userId}`}
                          kind="recruiter"
                        />
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

"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

import { cn } from "@/shared/libs/shadCnConfig";
import { formatDate } from "@/shared/utils/formatDate";
import { formatMinor } from "@/shared/utils/money";
import { Button } from "@/shared/ui-components/controls/button";
import {
  Card,
  CardHeader,
  CardTitle,
} from "@/shared/ui-components/controls/card";
import {
  ColumnFilter,
  FilterableHead,
} from "@/shared/ui-components/data/ColumnFilter";
import {
  ColumnsToggle,
  useVisibleColumns,
  type ColumnDef,
} from "@/shared/ui-components/data/Columns";
import { MobileFilters } from "@/shared/ui-components/data/MobileFilters";
import { TablePager } from "@/shared/ui-components/data/TablePager";
import { TableSkeleton } from "@/shared/ui-components/data/TableSkeleton";
import {
  TABLE_BODY,
  TABLE_EL,
  TABLE_HEAD,
  TABLE_ROW,
  TABLE_ROW_UNREAD,
  TABLE_TD_RAIL,
  TABLE_SCROLL,
  TABLE_TD,
  TABLE_TH,
} from "@/shared/ui-components/data/tableStyles";
import {
  MobileRecordCard,
  MobileRecordList,
} from "@/shared/ui-components/mobile-view/MobileRecordCard";

import { useAdminDisputes } from "../hooks/useDisputes";
import {
  DISPUTE_SUBJECT_LABELS,
  type DisputeChannel,
  type DisputeStatus,
} from "../schemas";
import { DisputeStatusBadge } from "./DisputeStatusBadge";

/**
 * Each view names the statuses the server should keep; no view selected is the
 * unfiltered list, so the filter's own Clear row is what used to be "All".
 */
const STATUS_VIEWS: {
  label: string;
  value: string;
  statuses: readonly DisputeStatus[];
}[] = [
  { label: "Open", value: "open_active", statuses: ["open", "under_review"] },
  {
    label: "Resolved — Refunded",
    value: "resolved_refund",
    statuses: ["resolved_refund"],
  },
  {
    label: "Resolved — Paid Recruiter",
    value: "resolved_release",
    statuses: ["resolved_release"],
  },
];

const COLUMNS: ColumnDef[] = [
  // Company carries the unread rail, so the row loses its "new activity" cue
  // without it; Actions holds the only way into the dispute.
  { key: "company", label: "Company", required: true },
  { key: "recruiter", label: "Recruiter" },
  { key: "candidate", label: "Candidate / Role" },
  { key: "raisedBy", label: "Raised By" },
  { key: "subject", label: "Subject" },
  { key: "fee", label: "Fee" },
  { key: "status", label: "Status" },
  { key: "opened", label: "Opened" },
  { key: "actions", label: "Actions", required: true },
];

const RAISED_BY_LABELS: Record<DisputeChannel, string> = {
  company: "Company",
  recruiter: "Recruiter",
};

const RAISED_BY_OPTIONS: { label: string; value: DisputeChannel }[] = [
  { label: "Raised by Company", value: "company" },
  { label: "Raised by Recruiter", value: "recruiter" },
];

/** Narrows the filter's plain string back to a channel the query accepts;
 * `undefined` is the unfiltered list. */
const toRaisedBy = (value: string | null): DisputeChannel | undefined =>
  RAISED_BY_OPTIONS.find((option) => option.value === value)?.value;

/** `fetchAdminDisputes` asks for 25 a page; the pager's range readout has to
 * agree with it. */
const ADMIN_DISPUTES_PAGE_SIZE = 25;

/** The admin dispute inbox. */
export function AdminDisputesTable() {
  const [page, setPage] = useState(1);
  const [statusView, setStatusView] = useState<string | null>("open_active");
  const [raisedBy, setRaisedBy] = useState<DisputeChannel | undefined>(
    undefined,
  );
  const cols = useVisibleColumns("admin.disputes.columns", COLUMNS, (key) => {
    if (key === "status") {
      setStatusView(null);
      setPage(1);
    }
    if (key === "raisedBy") {
      setRaisedBy(undefined);
      setPage(1);
    }
  });
  const statuses = STATUS_VIEWS.find((v) => v.value === statusView)?.statuses;
  const { data, isPending, isError, refetch } = useAdminDisputes(
    page,
    statuses,
    raisedBy,
  );

  const rows = data?.data ?? [];

  // The Status filter starts on Open, and it lives in a header row the empty
  // state replaces — so an admin with nothing open would have no way back to
  // the full list without this.
  const hasFilters = statusView !== null || raisedBy !== undefined;
  const resetFilters = () => {
    setStatusView(null);
    setRaisedBy(undefined);
    setPage(1);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Disputes</CardTitle>
        <div className="ml-auto">
          <ColumnsToggle
            columns={cols.columns}
            isVisible={cols.isVisible}
            onToggle={cols.toggle}
          />
        </div>
      </CardHeader>

      {/* This table has no toolbar, and its filters live in a header row a
          phone never renders — so they get their own phone-only control. */}
      <div className="px-4 pt-4 sm:hidden">
        <MobileFilters
          filters={[
            {
              value: statusView ?? "",
              onChange: (next) => {
                setStatusView(next === "" ? null : next);
                setPage(1);
              },
              allLabel: "All statuses",
              options: STATUS_VIEWS.map(({ label, value }) => ({
                label,
                value,
              })),
            },
            {
              value: raisedBy ?? "",
              onChange: (next) => {
                setRaisedBy(toRaisedBy(next === "" ? null : next));
                setPage(1);
              },
              allLabel: "Raised by anyone",
              options: RAISED_BY_OPTIONS,
            },
          ]}
        />
      </div>

      {isError ? (
        <div className="flex flex-col items-center gap-3 p-8 text-center text-sub text-bad">
          <AlertCircle className="size-[22px]" />
          Could not load disputes.
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      ) : isPending ? (
        <div className="p-4">
          <TableSkeleton columns={cols.allKeys.filter(cols.isVisible).length} />
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 p-8 text-center">
          <p className="text-sub text-ink-muted">No disputes here.</p>
          {hasFilters && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetFilters}
            >
              Reset filters
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className={cn(TABLE_SCROLL, "hidden sm:block")}>
            <table className={TABLE_EL}>
              <thead className={TABLE_HEAD}>
                <tr>
                  <th scope="col" className={TABLE_TH}>
                    Company
                  </th>
                  {cols.isVisible("recruiter") && (
                    <th scope="col" className={TABLE_TH}>
                      Recruiter
                    </th>
                  )}
                  {cols.isVisible("candidate") && (
                    <th scope="col" className={TABLE_TH}>
                      Candidate / Role
                    </th>
                  )}
                  {cols.isVisible("raisedBy") && (
                    <FilterableHead label="Raised By">
                      <ColumnFilter
                        label="Raised By"
                        options={RAISED_BY_OPTIONS}
                        value={raisedBy ?? null}
                        onChange={(next) => {
                          setRaisedBy(toRaisedBy(next));
                          setPage(1);
                        }}
                      />
                    </FilterableHead>
                  )}
                  {cols.isVisible("subject") && (
                    <th scope="col" className={TABLE_TH}>
                      Subject
                    </th>
                  )}
                  {cols.isVisible("fee") && (
                    <th scope="col" className={cn(TABLE_TH, "text-right")}>
                      Fee
                    </th>
                  )}
                  {cols.isVisible("status") && (
                    <FilterableHead label="Status">
                      <ColumnFilter
                        label="Status"
                        options={STATUS_VIEWS}
                        value={statusView}
                        onChange={(next) => {
                          setStatusView(next);
                          setPage(1);
                        }}
                      />
                    </FilterableHead>
                  )}
                  {cols.isVisible("opened") && (
                    <th scope="col" className={TABLE_TH}>
                      Opened
                    </th>
                  )}
                  <th scope="col" className={TABLE_TH} />
                </tr>
              </thead>
              <tbody className={TABLE_BODY}>
                {rows.map((d) => (
                  <tr
                    key={d.id}
                    className={d.unread ? TABLE_ROW_UNREAD : TABLE_ROW}
                  >
                    <td
                      className={cn(
                        TABLE_TD,
                        "text-ink",
                        d.unread ? `font-[650] ${TABLE_TD_RAIL}` : "font-[550]",
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <span className="flex w-2.5 shrink-0 justify-center">
                          {d.unread && (
                            <span
                              className="block size-2.5 shrink-0 rounded-full bg-blue"
                              aria-label="New activity"
                            />
                          )}
                        </span>
                        {d.companyName}
                      </span>
                    </td>
                    {cols.isVisible("recruiter") && (
                      <td className={cn(TABLE_TD, "text-ink-body")}>
                        {d.recruiterName}
                      </td>
                    )}
                    {cols.isVisible("candidate") && (
                      <td className={cn(TABLE_TD, "text-ink-muted")}>
                        <span className="block max-w-[220px] truncate">
                          {d.candidateName} · {d.jobTitle}
                        </span>
                      </td>
                    )}
                    {cols.isVisible("raisedBy") && (
                      <td className={cn(TABLE_TD, "text-ink-body")}>
                        {RAISED_BY_LABELS[d.raisedBy]}
                      </td>
                    )}
                    {cols.isVisible("subject") && (
                      <td className={cn(TABLE_TD, "text-ink-body")}>
                        {DISPUTE_SUBJECT_LABELS[d.subject]}
                      </td>
                    )}
                    {cols.isVisible("fee") && (
                      <td
                        className={cn(
                          TABLE_TD,
                          "whitespace-nowrap text-right font-[650] tabular-nums text-ink",
                        )}
                      >
                        {formatMinor(d.amountMinor)}
                      </td>
                    )}
                    {cols.isVisible("status") && (
                      <td className={TABLE_TD}>
                        <DisputeStatusBadge status={d.status} />
                      </td>
                    )}
                    {cols.isVisible("opened") && (
                      <td
                        className={cn(
                          TABLE_TD,
                          "whitespace-nowrap tabular-nums text-ink-muted",
                        )}
                      >
                        {formatDate(d.createdAt)}
                      </td>
                    )}
                    <td className={cn(TABLE_TD, "text-right")}>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/disputes/${d.id}`}>Review</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <MobileRecordList className="sm:hidden">
            {rows.map((d) => (
              <MobileRecordCard
                key={d.id}
                title={`${d.candidateName} · ${d.jobTitle}`}
                subtitle={`${d.companyName} ↔ ${d.recruiterName}`}
                trailing={<DisputeStatusBadge status={d.status} />}
                href={`/admin/disputes/${d.id}`}
                className={cn(d.unread && "bg-unread shadow-rail")}
                fields={[
                  { label: "Raised By", value: RAISED_BY_LABELS[d.raisedBy] },
                  {
                    label: "Subject",
                    value: DISPUTE_SUBJECT_LABELS[d.subject],
                  },
                  { label: "Fee", value: formatMinor(d.amountMinor) },
                  { label: "Opened", value: formatDate(d.createdAt) },
                ]}
              />
            ))}
          </MobileRecordList>

          <TablePager
            page={page}
            totalPages={data.meta.totalPages}
            total={data.meta.total}
            onPage={setPage}
            pageSize={ADMIN_DISPUTES_PAGE_SIZE}
          />
        </>
      )}
    </Card>
  );
}

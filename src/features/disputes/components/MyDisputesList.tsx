"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, ShieldAlert } from "lucide-react";

import { cn } from "@/shared/libs/shadCnConfig";
import { disputePath } from "@/shared/utils/entityPaths";
import { entriesOf } from "@/shared/utils/entriesOf";
import { formatDate } from "@/shared/utils/formatDate";
import { formatMinor } from "@/shared/utils/money";
import { Pill } from "@/shared/ui-components/badges/Pill";
import { Button } from "@/shared/ui-components/controls/button";
import { EmptyState } from "@/shared/ui-components/feedback/EmptyState";
import {
  ColumnsToggle,
  useVisibleColumns,
  type ColumnDef,
} from "@/shared/ui-components/data/Columns";
import { TablePager } from "@/shared/ui-components/data/TablePager";
import { TableSkeleton } from "@/shared/ui-components/data/TableSkeleton";
import {
  TABLE_BODY,
  TABLE_CARD,
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
  ColumnFilter,
  FilterableHead,
} from "@/shared/ui-components/data/ColumnFilter";
import {
  MobileRecordCard,
  MobileRecordList,
} from "@/shared/ui-components/mobile-view/MobileRecordCard";

import { useMyDisputes } from "../hooks/useDisputes";
import {
  DISPUTE_STATUS_LABELS,
  DISPUTE_SUBJECT_LABELS,
  isDisputeOpen,
  type DisputeStatus,
  type DisputeSubject,
} from "../schemas";
import { DisputeStatusBadge } from "./DisputeStatusBadge";

/** Each filter's options are the row's own labels, so the popover reads exactly
 * as the cell it filters. */
const STATUS_OPTIONS = entriesOf(DISPUTE_STATUS_LABELS).map(
  ([value, label]) => ({ value, label }),
);

const SUBJECT_OPTIONS = entriesOf(DISPUTE_SUBJECT_LABELS).map(
  ([value, label]) => ({ value, label }),
);

const COLUMNS: ColumnDef[] = [
  // Role carries the update rail and the Pending pill, so the row loses its
  // "needs you" cue without it; Actions holds the only way into the dispute.
  { key: "role", label: "Role", required: true },
  { key: "subject", label: "Subject" },
  { key: "counterparty", label: "Counterparty" },
  { key: "fee", label: "Fee" },
  { key: "status", label: "Status" },
  { key: "opened", label: "Opened" },
  { key: "actions", label: "Actions", required: true },
];

/** Same pill as the inbox's "New": a row still waiting on somebody. An open
 * dispute is an admin decision outstanding, which the status badge alone does
 * not read as at a glance. */
function PendingPill() {
  return (
    <Pill tone="blue" plain className="uppercase tracking-[0.06em]">
      Pending
    </Pill>
  );
}

function UpdateDot() {
  return (
    <span
      className="block size-2.5 shrink-0 rounded-full bg-blue"
      aria-label="New activity"
    />
  );
}

/** The caller's disputes, most recently active first. */
/** `fetchMyDisputes` asks for 20 a page; the pager's range readout has to
 * agree with it. */
const MY_DISPUTES_PAGE_SIZE = 20;

export function MyDisputesList() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string | null>(null);
  const [subject, setSubject] = useState<string | null>(null);
  const cols = useVisibleColumns("disputes.mine.columns", COLUMNS, (key) => {
    if (key === "status") changeStatus(null);
    if (key === "subject") changeSubject(null);
  });
  const { data, isPending, isError, refetch } = useMyDisputes(
    page,
    status ?? undefined,
    subject ?? undefined,
  );
  const setFilter =
    (apply: (next: string | null) => void) => (next: string | null) => {
      apply(next);
      setPage(1);
    };
  const changeStatus = setFilter(setStatus);
  const changeSubject = setFilter(setSubject);
  const hasFilters = status !== null || subject !== null;
  const resetFilters = () => {
    setStatus(null);
    setSubject(null);
    setPage(1);
  };

  if (isError) {
    return (
      <div className={cn(TABLE_CARD, "p-8")}>
        <div className="flex flex-col items-center gap-3 text-center text-sub text-bad">
          <AlertCircle className="size-[22px]" />
          Could not load your disputes.
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }
  if (isPending)
    return (
      <TableSkeleton columns={cols.allKeys.filter(cols.isVisible).length} />
    );

  if (data.data.length === 0) {
    return (
      <div className={TABLE_CARD}>
        <EmptyState
          icon={ShieldAlert}
          title="No disputes"
          description="Use “Raise a Dispute” above to open one on a placement held in escrow."
          // The header row carrying the filters is replaced by this card, so
          // filtering to something you have none of would otherwise dead-end.
          action={
            hasFilters ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={resetFilters}
              >
                Reset filters
              </Button>
            ) : undefined
          }
        />
      </div>
    );
  }

  return (
    <div className={TABLE_CARD}>
      {/* The list has neither a toolbar nor a card title, so the picker gets a
          header strip of its own — desktop only, since the phone card list
          renders a fixed field set the picker could not change. */}
      <div className="hidden items-center border-b border-line px-4 py-2.5 sm:flex">
        <div className="ml-auto">
          <ColumnsToggle
            columns={cols.columns}
            isVisible={cols.isVisible}
            onToggle={cols.toggle}
          />
        </div>
      </div>

      <div className={cn(TABLE_SCROLL, "hidden sm:block")}>
        <table className={TABLE_EL}>
          <thead className={TABLE_HEAD}>
            <tr>
              <th scope="col" className={TABLE_TH}>
                Role
              </th>
              {cols.isVisible("subject") && (
                <FilterableHead label="Subject">
                  <ColumnFilter
                    label="Subject"
                    options={SUBJECT_OPTIONS}
                    value={subject}
                    onChange={changeSubject}
                  />
                </FilterableHead>
              )}
              {cols.isVisible("counterparty") && (
                <th scope="col" className={TABLE_TH}>
                  Counterparty
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
                    options={STATUS_OPTIONS}
                    value={status}
                    onChange={changeStatus}
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
            {data.data.map((d) => (
              <tr
                key={d.id}
                className={d.hasUpdate ? TABLE_ROW_UNREAD : TABLE_ROW}
              >
                <td
                  className={cn(
                    TABLE_TD,
                    "text-ink",
                    d.hasUpdate ? `font-[650] ${TABLE_TD_RAIL}` : "font-[550]",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span className="flex w-2.5 shrink-0 justify-center">
                      {d.hasUpdate && <UpdateDot />}
                    </span>
                    {d.jobTitle}
                    {isDisputeOpen(d.status) && <PendingPill />}
                  </span>
                </td>
                {cols.isVisible("subject") && (
                  <td className={cn(TABLE_TD, "text-ink-body")}>
                    {DISPUTE_SUBJECT_LABELS[d.subject]}
                  </td>
                )}
                {cols.isVisible("counterparty") && (
                  <td className={cn(TABLE_TD, "text-ink-muted")}>
                    {d.counterpartyName}
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
                    <Link href={disputePath(d)}>View</Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <MobileRecordList className="sm:hidden">
        {data.data.map((d) => (
          <MobileRecordCard
            key={d.id}
            title={d.jobTitle}
            subtitle={d.counterpartyName}
            trailing={
              <span className="flex items-center gap-1.5">
                {isDisputeOpen(d.status) && <PendingPill />}
                <DisputeStatusBadge status={d.status} />
              </span>
            }
            href={disputePath(d)}
            className={cn(d.hasUpdate && "bg-unread shadow-rail")}
            fields={[
              { label: "Subject", value: DISPUTE_SUBJECT_LABELS[d.subject] },
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
        pageSize={MY_DISPUTES_PAGE_SIZE}
      />
    </div>
  );
}

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
import { NativeSelect } from "@/shared/ui-components/controls/nativeSelect";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/shared/ui-components/controls/tabs";
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

/** Each view names the statuses the server should keep; "All" names none. */
const FILTERS: {
  label: string;
  value: string;
  statuses?: readonly DisputeStatus[];
}[] = [
  { label: "Open", value: "open_active", statuses: ["open", "under_review"] },
  { label: "All", value: "all" },
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

const RAISED_BY_LABELS: Record<DisputeChannel, string> = {
  company: "Company",
  recruiter: "Recruiter",
};

/** Whose side opened the dispute — "any" is the unfiltered tab. */
type RaisedByTab = DisputeChannel | "any";

const RAISED_BY_TABS: { label: string; value: RaisedByTab }[] = [
  { label: "All", value: "any" },
  { label: "Raised by Company", value: "company" },
  { label: "Raised by Recruiter", value: "recruiter" },
];

/** Narrows the tab bar's plain string back to a tab this table understands —
 * same shape as `isCandidateSort` in the inbox table. */
const isRaisedByTab = (value: string): value is RaisedByTab =>
  RAISED_BY_TABS.some((tab) => tab.value === value);

/** The admin dispute inbox. */
export function AdminDisputesTable() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("open_active");
  const [raisedByTab, setRaisedByTab] = useState<RaisedByTab>("any");
  const statuses = FILTERS.find((f) => f.value === filter)?.statuses;
  const { data, isPending, isError, refetch } = useAdminDisputes(
    page,
    statuses,
    raisedByTab === "any" ? undefined : raisedByTab,
  );

  const rows = data?.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Disputes</CardTitle>
        <NativeSelect
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setPage(1);
          }}
          className="ml-auto w-auto min-w-[170px] max-w-[220px]"
        >
          {FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </NativeSelect>
      </CardHeader>

      {/* Same underline tab bar as the admin Settings page, so the two admin
          screens filter the same way. The list below is the only panel, so
          the triggers drive the query rather than swapping TabsContent. */}
      <Tabs
        value={raisedByTab}
        onValueChange={(value) => {
          if (!isRaisedByTab(value)) return;
          setRaisedByTab(value);
          setPage(1);
        }}
      >
        <TabsList className="px-4">
          {RAISED_BY_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

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
          <TableSkeleton />
        </div>
      ) : rows.length === 0 ? (
        <p className="p-8 text-center text-sub text-ink-muted">
          No disputes here.
        </p>
      ) : (
        <>
          <div className={cn(TABLE_SCROLL, "hidden sm:block")}>
            <table className={TABLE_EL}>
              <thead className={TABLE_HEAD}>
                <tr>
                  <th scope="col" className={TABLE_TH}>
                    Company
                  </th>
                  <th scope="col" className={TABLE_TH}>
                    Recruiter
                  </th>
                  <th scope="col" className={TABLE_TH}>
                    Candidate / Role
                  </th>
                  <th scope="col" className={TABLE_TH}>
                    Raised By
                  </th>
                  <th scope="col" className={TABLE_TH}>
                    Subject
                  </th>
                  <th scope="col" className={cn(TABLE_TH, "text-right")}>
                    Fee
                  </th>
                  <th scope="col" className={TABLE_TH}>
                    Status
                  </th>
                  <th scope="col" className={TABLE_TH}>
                    Opened
                  </th>
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
                    <td className={cn(TABLE_TD, "text-ink-body")}>
                      {d.recruiterName}
                    </td>
                    <td className={cn(TABLE_TD, "text-ink-muted")}>
                      <span className="block max-w-[220px] truncate">
                        {d.candidateName} · {d.jobTitle}
                      </span>
                    </td>
                    <td className={cn(TABLE_TD, "text-ink-body")}>
                      {RAISED_BY_LABELS[d.raisedBy]}
                    </td>
                    <td className={cn(TABLE_TD, "text-ink-body")}>
                      {DISPUTE_SUBJECT_LABELS[d.subject]}
                    </td>
                    <td
                      className={cn(
                        TABLE_TD,
                        "whitespace-nowrap text-right font-[650] tabular-nums text-ink",
                      )}
                    >
                      {formatMinor(d.amountMinor)}
                    </td>
                    <td className={TABLE_TD}>
                      <DisputeStatusBadge status={d.status} />
                    </td>
                    <td
                      className={cn(
                        TABLE_TD,
                        "whitespace-nowrap tabular-nums text-ink-muted",
                      )}
                    >
                      {formatDate(d.createdAt)}
                    </td>
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

          {/* `.pager` — the reference's footer rule above the page controls. */}
          <div className="flex items-center justify-between gap-2 border-t border-line px-3.5 py-2.5 text-[12.5px] text-ink-muted">
            <span className="tabular-nums">
              {data.meta.total.toLocaleString()} total · page {page} of{" "}
              {Math.max(data.meta.totalPages, 1)}
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= data.meta.totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}

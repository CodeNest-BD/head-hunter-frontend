"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

import { cn } from "@/shared/libs/shadCnConfig";
import { formatDate } from "@/shared/utils/formatDate";
import { formatMinor } from "@/shared/utils/money";
import { Button } from "@/shared/ui-components/controls/button";
import { Card, CardContent } from "@/shared/ui-components/controls/card";
import { NativeSelect } from "@/shared/ui-components/controls/nativeSelect";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/shared/ui-components/controls/tabs";
import { TableSkeleton } from "@/shared/ui-components/data/TableSkeleton";
import {
  MobileRecordCard,
  MobileRecordList,
} from "@/shared/ui-components/mobile-view/MobileRecordCard";

import { useAdminDisputes } from "../hooks/useDisputes";
import type { DisputeChannel } from "../schemas";
import { DisputeStatusBadge } from "./DisputeStatusBadge";

const TH = "px-5 py-3 font-semibold";
const HEAD_ROW =
  "border-b border-border bg-muted/40 text-left text-xs uppercase tracking-[0.08em] text-muted-foreground";
const BODY_ROW =
  "border-b border-border/60 transition-colors last:border-0 even:bg-muted/20 hover:bg-accent/50";

const FILTERS: { label: string; value: string }[] = [
  { label: "Open", value: "open_active" },
  { label: "All", value: "all" },
  { label: "Resolved — Refunded", value: "resolved_refund" },
  { label: "Resolved — Paid Recruiter", value: "resolved_release" },
];

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
  // "open_active" is a convenience view: the backend filters by a single status,
  // so "open" is the actionable subset admins live in; "all" clears it.
  const status =
    filter === "all" || filter === "open_active" ? undefined : filter;
  const { data, isPending, isError, refetch } = useAdminDisputes(
    page,
    status,
    raisedByTab === "any" ? undefined : raisedByTab,
  );

  const rows =
    filter === "open_active" && data
      ? data.data.filter(
          (d) => d.status === "open" || d.status === "under_review",
        )
      : (data?.data ?? []);

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex items-center justify-between gap-3 px-5 py-3">
          <h2 className="font-heading text-base font-bold text-navy">
            Disputes
          </h2>
          <NativeSelect
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(1);
            }}
            className="max-w-[220px]"
          >
            {FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </NativeSelect>
        </div>

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
          <TabsList className="px-5">
            {RAISED_BY_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {isError ? (
          <div className="flex flex-col items-center gap-3 p-8 text-center text-sm text-destructive">
            <AlertCircle className="h-6 w-6" />
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
          <p className="p-8 text-center text-sm text-muted-foreground">
            No disputes here.
          </p>
        ) : (
          <>
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className={HEAD_ROW}>
                    <th scope="col" className={TH}>
                      Company
                    </th>
                    <th scope="col" className={TH}>
                      Recruiter
                    </th>
                    <th scope="col" className={TH}>
                      Candidate / Role
                    </th>
                    <th scope="col" className={cn(TH, "text-right")}>
                      Fee
                    </th>
                    <th scope="col" className={TH}>
                      Status
                    </th>
                    <th scope="col" className={TH}>
                      Opened
                    </th>
                    <th scope="col" className={TH} />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((d) => (
                    <tr key={d.id} className={BODY_ROW}>
                      <td className="px-5 py-3 font-medium text-navy">
                        {d.companyName}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {d.recruiterName}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        <span className="block max-w-[220px] truncate">
                          {d.candidateName} · {d.jobTitle}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-right font-medium text-navy">
                        {formatMinor(d.amountMinor)}
                      </td>
                      <td className="px-5 py-3">
                        <DisputeStatusBadge status={d.status} />
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">
                        {formatDate(d.createdAt)}
                      </td>
                      <td className="px-5 py-3 text-right">
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
                  fields={[
                    { label: "Fee", value: formatMinor(d.amountMinor) },
                    { label: "Opened", value: formatDate(d.createdAt) },
                  ]}
                />
              ))}
            </MobileRecordList>

            <div className="flex items-center justify-between border-t border-border px-5 py-3 text-sm">
              <span className="text-muted-foreground">
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
      </CardContent>
    </Card>
  );
}

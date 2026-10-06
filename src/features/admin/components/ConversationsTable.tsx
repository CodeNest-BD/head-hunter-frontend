"use client";

import Link from "next/link";
import { AlertCircle, MessagesSquare } from "lucide-react";

import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { TableSkeleton } from "@/shared/ui-components/data/TableSkeleton";
import { TableFilterBar } from "@/shared/ui-components/data/TableFilterBar";
import {
  useVisibleColumns,
  type ColumnDef,
} from "@/shared/ui-components/data/Columns";
import { EmptyState } from "@/shared/ui-components/feedback/EmptyState";
import {
  MobileRecordCard,
  MobileRecordList,
} from "@/shared/ui-components/mobile-view/MobileRecordCard";
import { cn } from "@/shared/libs/shadCnConfig";
import { Button } from "@/shared/ui-components/controls/button";
import { useAdminConversations } from "../hooks/useAdmin";
import { useListState } from "../hooks/useListState";
import { CANDIDATE_LABELS, type ConversationListItem } from "../schemas";
import { ListPager } from "./ListPager";
import { CANDIDATE_STATUS_TONES } from "./statusStyles";
import {
  TABLE_BODY,
  TABLE_CARD,
  TABLE_CELL_MAIN,
  TABLE_EL,
  TABLE_HEAD,
  TABLE_ROW,
  TABLE_SCROLL,
  TABLE_TD,
  TABLE_TH,
} from "@/shared/ui-components/data/tableStyles";

const STATUS_FILTER_OPTIONS = [
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under review" },
  { value: "advanced", label: "Advanced" },
  { value: "rejected", label: "Rejected" },
  { value: "withdrawn", label: "Withdrawn" },
] as const;

const COLUMNS: ColumnDef[] = [
  { key: "company", label: "Company", required: true },
  { key: "recruiter", label: "Recruiter" },
  { key: "job", label: "Job" },
  { key: "messages", label: "Messages" },
  { key: "status", label: "Status" },
  { key: "lastActivity", label: "Last activity" },
];

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function ConversationStatus({
  conversation,
}: {
  conversation: ConversationListItem;
}) {
  return (
    <StatusBadge
      label={CANDIDATE_LABELS[conversation.status] ?? conversation.status}
      tone={CANDIDATE_STATUS_TONES[conversation.status] ?? "neutral"}
    />
  );
}

function ConversationCard({
  conversation,
}: {
  conversation: ConversationListItem;
}) {
  return (
    <MobileRecordCard
      title={conversation.jobTitle}
      subtitle={`${conversation.companyName} · ${conversation.recruiterName}`}
      href={`/admin/conversations/${conversation.candidateId}`}
      trailing={<ConversationStatus conversation={conversation} />}
      fields={[
        { label: "Messages", value: conversation.messageCount },
        {
          label: "Last activity",
          value: formatDateTime(conversation.lastActivityAt),
        },
      ]}
    />
  );
}

export function ConversationsTable() {
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
  // Drives the filter bar's Clear, and the way back out of an empty list.
  const hasFilters = qInput !== "" || status !== "";
  const resetFilters = () => {
    setQInput("");
    changeStatus("");
    setPage(1);
  };
  const cols = useVisibleColumns("admin.conversations.columns", COLUMNS);
  const { data, isPending, isError, refetch } = useAdminConversations({
    page,
    limit,
    q: q || undefined,
    status: status || undefined,
  });

  return (
    <div className="flex flex-col gap-4">
      <TableFilterBar
        filters={[
          {
            kind: "search",
            key: "q",
            label: "Search conversations",
            placeholder: "Search by job, company or recruiter…",
            value: qInput,
            onChange: setQInput,
          },
          {
            kind: "select",
            key: "status",
            label: "Status",
            placeholder: "All statuses",
            options: STATUS_FILTER_OPTIONS,
            value: status,
            onChange: changeStatus,
          },
        ]}
        columns={cols.columns}
        isColumnVisible={cols.isVisible}
        onToggleColumn={cols.toggle}
        onClearFilters={resetFilters}
      />

      {isPending ? (
        <TableSkeleton columns={cols.allKeys.filter(cols.isVisible).length} />
      ) : isError ? (
        <div className="flex max-w-md flex-col gap-3 rounded-sm border border-bad-line bg-bad-bg p-3.5 text-sub text-bad">
          <div className="flex items-center gap-2.5 font-[550]">
            <AlertCircle className="size-[15px] shrink-0" />
            Could not load conversations.
          </div>
          <div>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        </div>
      ) : data.data.length === 0 ? (
        <div className={TABLE_CARD}>
          <EmptyState
            icon={MessagesSquare}
            title="No conversations found"
            description="Conversations appear once a recruiter submits candidates to a job."
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
      ) : (
        <>
          <div className={TABLE_CARD}>
            <div className={cn(TABLE_SCROLL, "hidden sm:block")}>
              <table className={TABLE_EL}>
                <thead className={TABLE_HEAD}>
                  <tr>
                    <th scope="col" className={cn(TABLE_TH, "w-[20%]")}>
                      Company
                    </th>
                    {cols.isVisible("recruiter") && (
                      <th scope="col" className={cn(TABLE_TH, "w-[20%]")}>
                        Recruiter
                      </th>
                    )}
                    {cols.isVisible("job") && (
                      <th scope="col" className={cn(TABLE_TH, "w-[24%]")}>
                        Job
                      </th>
                    )}
                    {cols.isVisible("messages") && (
                      <th scope="col" className={cn(TABLE_TH, "text-center")}>
                        Messages
                      </th>
                    )}
                    {cols.isVisible("status") && (
                      <th scope="col" className={TABLE_TH}>
                        Status
                      </th>
                    )}
                    {cols.isVisible("lastActivity") && (
                      <th scope="col" className={cn(TABLE_TH, "text-right")}>
                        Last activity
                      </th>
                    )}
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
                          {c.companyName}
                        </Link>
                      </td>
                      {cols.isVisible("recruiter") && (
                        <td className={cn(TABLE_TD, "text-ink-body")}>
                          <span className="block max-w-[200px] truncate">
                            {c.recruiterName}
                          </span>
                        </td>
                      )}
                      {cols.isVisible("job") && (
                        <td className={cn(TABLE_TD, "text-ink-muted")}>
                          <span className="block max-w-[220px] truncate">
                            {c.jobTitle}
                          </span>
                        </td>
                      )}
                      {cols.isVisible("messages") && (
                        <td
                          className={cn(
                            TABLE_TD,
                            "text-center tabular-nums text-ink",
                          )}
                        >
                          {c.messageCount}
                        </td>
                      )}
                      {cols.isVisible("status") && (
                        <td className={TABLE_TD}>
                          <ConversationStatus conversation={c} />
                        </td>
                      )}
                      {cols.isVisible("lastActivity") && (
                        <td
                          className={cn(
                            TABLE_TD,
                            "whitespace-nowrap text-right tabular-nums text-ink-muted",
                          )}
                        >
                          {formatDateTime(c.lastActivityAt)}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <MobileRecordList className="sm:hidden">
              {data.data.map((c) => (
                <ConversationCard key={c.candidateId} conversation={c} />
              ))}
            </MobileRecordList>
          </div>
          <ListPager
            page={page}
            totalPages={data.meta.totalPages}
            total={data.meta.total}
            onPage={setPage}
            pageSize={limit}
            onPageSize={changeLimit}
          />
        </>
      )}
    </div>
  );
}

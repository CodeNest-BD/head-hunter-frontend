"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, Briefcase, Plus } from "lucide-react";

import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { TableSkeleton } from "@/shared/ui-components/data/TableSkeleton";
import { TablePager } from "@/shared/ui-components/data/TablePager";
import { ListToolbar } from "@/shared/ui-components/data/ListToolbar";
import {
  ColumnsToggle,
  useVisibleColumns,
  type ColumnDef,
} from "@/shared/ui-components/data/columns";
import {
  TABLE_BODY,
  TABLE_CARD,
  TABLE_EL,
  TABLE_HEAD,
  TABLE_HEAD_ROW,
  TABLE_ROW,
  TABLE_SCROLL,
  TABLE_TD,
  TABLE_TH,
  TABLE_TOOLBAR,
} from "@/shared/ui-components/data/tableStyles";
import { useListState } from "@/shared/hooks/useListState";
import { cn } from "@/shared/libs/shadCnConfig";
import { formatMinor } from "@/shared/utils/money";
import {
  ROLE_CATEGORY_LABELS,
  type JobStatus,
  type RoleCategory,
} from "../schemas";
import { useJobs } from "../hooks/useJobs";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  published: "text-[#17734E] bg-[#E7F4EC]",
  paused: "text-[#92610C] bg-[#FBF3DF]",
  filled: "bg-primary/15 text-primary",
  closed: "bg-muted text-muted-foreground",
  expired: "text-[#9B3535] bg-[#FBEAEA]",
};

const COLUMNS: ColumnDef[] = [
  { key: "title", label: "Title", required: true },
  { key: "category", label: "Category" },
  { key: "fee", label: "Fee" },
  { key: "status", label: "Status" },
];

const CATEGORY_OPTIONS = (
  Object.entries(ROLE_CATEGORY_LABELS) as [RoleCategory, string][]
).map(([value, label]) => ({ value, label }));

export function JobsTable() {
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
  const [category, setCategory] = useState("");
  const cols = useVisibleColumns("company.jobs.columns", COLUMNS);
  const { data, isPending, isError, refetch } = useJobs({
    page,
    limit,
    q: q || undefined,
    status: (status || undefined) as JobStatus | undefined,
    roleCategory: category || undefined,
  });

  const toolbar = (
    <div className={TABLE_TOOLBAR}>
      <div className="flex-1">
        <ListToolbar
          query={qInput}
          onQueryChange={setQInput}
          placeholder="Search jobs by title…"
          filter={{
            value: status,
            onChange: changeStatus,
            allLabel: "All statuses",
            options: [
              { value: "published", label: "Published" },
              { value: "draft", label: "Draft" },
              { value: "paused", label: "Paused" },
              { value: "filled", label: "Filled" },
              { value: "closed", label: "Closed" },
              { value: "expired", label: "Expired" },
            ],
          }}
          extraFilter={{
            value: category,
            onChange: (next) => {
              setCategory(next);
              setPage(1);
            },
            allLabel: "All categories",
            options: CATEGORY_OPTIONS,
          }}
        />
      </div>
      <ColumnsToggle
        columns={cols.columns}
        isVisible={cols.isVisible}
        onToggle={cols.toggle}
      />
    </div>
  );

  if (isError) {
    return (
      <div className="flex flex-col gap-4">
        {toolbar}
        <div className="flex flex-col gap-3 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="h-[18px] w-[18px]" />
            Could not load jobs.
          </div>
          <button
            type="button"
            className="self-start rounded-md border border-destructive/40 px-3 py-1 text-xs font-medium transition-colors hover:bg-destructive/10"
            onClick={() => void refetch()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {toolbar}

      {isPending ? (
        <TableSkeleton />
      ) : data.data.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-[#C9D0DF] bg-card px-6 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Briefcase className="h-6 w-6" />
          </span>
          <div className="flex flex-col gap-1">
            <p className="font-heading text-base font-semibold text-foreground">
              No jobs found
            </p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Try a different search or filter, or post a new role.
            </p>
          </div>
          <Link
            href="/company/jobs/new"
            className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Plus className="h-[18px] w-[18px]" />
            New job
          </Link>
        </div>
      ) : (
        <div className={TABLE_CARD}>
          <div className={TABLE_SCROLL}>
            <table className={TABLE_EL}>
              <thead className={TABLE_HEAD}>
                <tr className={TABLE_HEAD_ROW}>
                  <th className={TABLE_TH}>Title</th>
                  {cols.isVisible("category") && (
                    <th className={TABLE_TH}>Category</th>
                  )}
                  {cols.isVisible("fee") && <th className={TABLE_TH}>Fee</th>}
                  {cols.isVisible("status") && (
                    <th className={TABLE_TH}>Status</th>
                  )}
                </tr>
              </thead>
              <tbody className={TABLE_BODY}>
                {data.data.map((job) => (
                  <tr key={job.id} className={TABLE_ROW}>
                    <td className={`${TABLE_TD} font-semibold text-navy`}>
                      <Link
                        href={`/company/jobs/${job.id}`}
                        className="transition-colors hover:text-primary hover:underline"
                      >
                        {job.title}
                      </Link>
                    </td>
                    {cols.isVisible("category") && (
                      <td className={`${TABLE_TD} text-brand-gray`}>
                        {ROLE_CATEGORY_LABELS[job.roleCategory]}
                      </td>
                    )}
                    {cols.isVisible("fee") && (
                      <td className={`${TABLE_TD} tabular-nums text-navy`}>
                        {formatMinor(job.recruiterFeeMinor)}
                      </td>
                    )}
                    {cols.isVisible("status") && (
                      <td className={TABLE_TD}>
                        <StatusBadge
                          label={job.status}
                          className={cn(
                            STATUS_STYLES[job.status] ??
                              "bg-muted text-muted-foreground",
                            "capitalize",
                          )}
                        />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TablePager
            page={page}
            totalPages={data.meta.totalPages}
            total={data.meta.total}
            pageSize={limit}
            onPage={setPage}
            onPageSize={changeLimit}
          />
        </div>
      )}
    </div>
  );
}

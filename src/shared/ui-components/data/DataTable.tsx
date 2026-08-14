"use client";

import { type ReactNode } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type OnChangeFn,
  type SortingState,
} from "@tanstack/react-table";
import { AlertCircle, ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/shared/libs/shadCnConfig";
import { Button } from "@/shared/ui-components/controls/button";
import { Card, CardContent } from "@/shared/ui-components/controls/card";
import { TableSkeleton } from "@/shared/ui-components/data/TableSkeleton";
import { DataTablePagination } from "@/shared/ui-components/data/DataTablePagination";

export interface DataTableProps<T> {
  columns: ColumnDef<T, unknown>[];
  data: T[];
  getRowId: (row: T) => string;

  /** Server-driven pagination (1-based page). */
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;

  /** Server-driven sorting (single column). */
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;

  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;

  emptyIcon?: LucideIcon;
  emptyTitle?: string;
  emptyMessage?: string;
}

/**
 * Reusable server-driven data grid built on TanStack Table: a sticky header,
 * click-to-sort columns (sort happens on the server — `manualSorting`),
 * resizable columns, its own vertical scroll area, and a numbered pager.
 * Pagination and sorting are controlled by the caller so it composes with any
 * server list endpoint.
 */
export function DataTable<T>({
  columns,
  data,
  getRowId,
  page,
  pageSize,
  pageCount,
  total,
  onPage,
  onPageSize,
  sorting,
  onSortingChange,
  isLoading = false,
  isError = false,
  onRetry,
  emptyIcon: EmptyIcon,
  emptyTitle = "Nothing to show",
  emptyMessage = "Try a different search or filter.",
}: DataTableProps<T>) {
  const table = useReactTable({
    data,
    columns,
    getRowId,
    state: {
      sorting,
      pagination: { pageIndex: Math.max(page - 1, 0), pageSize },
    },
    onSortingChange,
    manualPagination: true,
    manualSorting: true,
    // Clicking a sorted column toggles asc/desc rather than cycling back to
    // "unsorted" — the list always has an explicit sort to send the server.
    enableSortingRemoval: false,
    pageCount: Math.max(pageCount, 1),
    getCoreRowModel: getCoreRowModel(),
    enableColumnResizing: true,
    columnResizeMode: "onChange",
  });

  if (isLoading) return <TableSkeleton />;

  if (isError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-8 text-center text-sm text-destructive">
          <AlertCircle className="h-6 w-6" />
          Could not load this list.
          {onRetry && (
            <Button variant="outline" size="sm" onClick={() => onRetry()}>
              Retry
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          {EmptyIcon && (
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-primary">
              <EmptyIcon className="h-6 w-6" />
            </span>
          )}
          <p className="text-sm font-semibold text-navy">{emptyTitle}</p>
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="max-h-[calc(100vh-16rem)] overflow-auto">
          <table
            className="w-full border-collapse text-sm"
            style={{ width: table.getCenterTotalSize() }}
          >
            <thead className="sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  className="bg-muted text-left text-xs uppercase tracking-[0.08em] text-muted-foreground [&>th]:border-b [&>th]:border-border [&>th]:border-l [&>th]:border-border/50 [&>th:first-child]:border-l-0"
                >
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    const sorted = header.column.getIsSorted();
                    return (
                      <th
                        key={header.id}
                        scope="col"
                        className="relative select-none px-4 py-3 font-semibold"
                        style={{ width: header.getSize() }}
                        aria-sort={
                          sorted === "asc"
                            ? "ascending"
                            : sorted === "desc"
                              ? "descending"
                              : undefined
                        }
                      >
                        {header.isPlaceholder ? null : (
                          <button
                            type="button"
                            disabled={!canSort}
                            onClick={header.column.getToggleSortingHandler()}
                            className={cn(
                              "flex items-center gap-1.5",
                              canSort && "cursor-pointer hover:text-navy",
                            )}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                            {canSort &&
                              (sorted === "asc" ? (
                                <ArrowUp className="h-3.5 w-3.5 text-primary" />
                              ) : sorted === "desc" ? (
                                <ArrowDown className="h-3.5 w-3.5 text-primary" />
                              ) : (
                                <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
                              ))}
                          </button>
                        )}
                        {header.column.getCanResize() && (
                          <span
                            role="separator"
                            aria-orientation="vertical"
                            onMouseDown={header.getResizeHandler()}
                            onTouchStart={header.getResizeHandler()}
                            className={cn(
                              "absolute right-0 top-0 h-full w-1 cursor-col-resize touch-none select-none bg-transparent hover:bg-primary/40",
                              header.column.getIsResizing() && "bg-primary/60",
                            )}
                          />
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border/60 transition-colors last:border-0 even:bg-muted/20 hover:bg-accent/50 [&>td]:border-l [&>td]:border-border/40 [&>td:first-child]:border-l-0"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-4 py-3 align-middle"
                      style={{ width: cell.column.getSize() }}
                    >
                      {
                        flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        ) as ReactNode
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <DataTablePagination
          page={page}
          pageCount={pageCount}
          total={total}
          pageSize={pageSize}
          onPage={onPage}
          onPageSize={onPageSize}
        />
      </CardContent>
    </Card>
  );
}

"use client";

import Link from "next/link";
import { AlertCircle, Building2 } from "lucide-react";

import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { TableSkeleton } from "@/shared/ui-components/data/TableSkeleton";
import { formatMinor } from "@/shared/utils/money";
import { Button } from "@/shared/ui-components/controls/button";
import { Card, CardContent } from "@/shared/ui-components/controls/card";
import { useAdminCompanies } from "../hooks/useAdmin";
import { useListState } from "../hooks/useListState";
import { HoldButton } from "./HoldButton";
import { ListPager } from "./ListPager";
import { ListToolbar } from "./ListToolbar";
import { ACCOUNT_STATUS_LABELS, ACCOUNT_STATUS_STYLES } from "./statusStyles";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function CompaniesTable() {
  const { page, setPage, qInput, setQInput, q, status, changeStatus } =
    useListState();
  const { data, isPending, isError, refetch } = useAdminCompanies({
    page,
    q: q || undefined,
    status: status || undefined,
  });

  return (
    <div className="flex flex-col gap-4">
      <ListToolbar
        query={qInput}
        onQueryChange={setQInput}
        placeholder="Search companies by name or email…"
        filter={{
          value: status,
          onChange: changeStatus,
          allLabel: "All",
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
            Could not load companies.
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : data.data.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-primary">
              <Building2 className="h-6 w-6" />
            </span>
            <p className="text-sm font-semibold text-navy">
              No companies found
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
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-[0.08em] text-muted-foreground">
                    <th scope="col" className="px-5 py-3 font-semibold">
                      Company
                    </th>
                    <th
                      scope="col"
                      className="px-5 py-3 text-right font-semibold"
                    >
                      Wallet
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
                  {data.data.map((c) => (
                    <tr
                      key={c.userId}
                      className="border-b border-border/60 last:border-0 hover:bg-accent/40"
                    >
                      <td className="px-5 py-3">
                        <Link
                          href={`/admin/companies/${c.userId}`}
                          className="font-medium text-navy hover:text-primary hover:underline focus-visible:underline focus-visible:outline-none"
                        >
                          {c.companyName}
                        </Link>
                        <p
                          className="max-w-[240px] truncate text-xs text-muted-foreground"
                          title={c.email}
                        >
                          {c.email}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-right font-medium text-navy">
                        {formatMinor(c.balanceMinor)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">
                        {formatDate(c.joinedAt)}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge
                          label={ACCOUNT_STATUS_LABELS[c.status]}
                          className={ACCOUNT_STATUS_STYLES[c.status]}
                        />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/admin/companies/${c.userId}`}>
                              View
                            </Link>
                          </Button>
                          <HoldButton
                            userId={c.userId}
                            status={c.status}
                            subjectName={c.companyName}
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
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

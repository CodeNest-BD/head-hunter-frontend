"use client";

import { useState } from "react";
import { AlertCircle, Building2, ExternalLink, Search } from "lucide-react";

import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { PageBanner } from "@/shared/ui-components/brand";
import { FilterChip } from "@/shared/ui-components/controls/filter-chip";
import { Input } from "@/shared/ui-components/controls/input";
import { CompanyLogo } from "@/shared/ui-components/data/CompanyLogo";
import { TablePager } from "@/shared/ui-components/data/TablePager";
import { formatMinor } from "@/shared/utils/money";
import type { CompanySummary } from "../schemas";
import { useCompanies } from "../hooks/useCompanies";

const PAGE_SIZE = 12;

/** The two views the directory offers, as mutually-exclusive chips. */
type Filter = "all" | "commission";
const FILTERS: readonly { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "commission", label: "Commission published" },
];

function commissionRange(company: CompanySummary): string | null {
  const { commissionRangeMinMinor: min, commissionRangeMaxMinor: max } =
    company;
  if (min === null && max === null) return null;
  if (min !== null && max !== null) {
    return `${formatMinor(min)} – ${formatMinor(max)}`;
  }
  return min !== null
    ? `From ${formatMinor(min)}`
    : `Up to ${formatMinor(max)}`;
}

function ListSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-40 w-full animate-pulse rounded-md border border-border bg-card"
        />
      ))}
    </div>
  );
}

function CompanyCard({ company }: { company: CompanySummary }) {
  const range = commissionRange(company);

  return (
    <article className="flex h-full flex-col rounded-md border border-border bg-card p-4 shadow-card transition-shadow hover:shadow-card-hover">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <CompanyLogo
            companyProfileId={company.id}
            hasLogo={company.hasLogo}
            name={company.companyName}
            size="sm"
            className="h-10 w-10 text-sm"
          />
          <div className="min-w-0">
            <h3 className="truncate font-heading text-[15px] font-bold text-navy">
              {company.companyName}
            </h3>
            {company.website ? (
              <a
                href={company.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex max-w-full items-center gap-1 truncate text-xs text-brand-secondary underline-offset-2 hover:underline"
              >
                <span className="truncate">
                  {company.website.replace(/^https?:\/\//, "")}
                </span>
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            ) : (
              <p className="truncate text-xs text-muted-foreground">
                {company.description || "No description provided"}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Commission
        </span>
        {range ? (
          <span className="text-sm font-bold tabular-nums text-navy">
            {range}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Not published</span>
        )}
      </div>
    </article>
  );
}

export function CompanyList() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  // Debounced so typing issues one request per pause, not one per keystroke.
  const query = useDebouncedValue(search, 300);
  const q = query === "" ? undefined : query;

  // Both views read the full directory; commission has no server filter, so it
  // is refined client-side below.
  const { data, isPending, isError, refetch } = useCompanies({
    q,
    page,
    limit: PAGE_SIZE,
  });

  // Banner count: a stable total independent of the active search/filter.
  const companiesTotal = useCompanies({ limit: 1 }).data?.meta.total ?? 0;

  const rows = data?.data ?? [];
  // No server-side "has published commission" filter exists yet, so refine the
  // loaded page client-side; the pager is hidden in this mode since totals
  // would no longer reflect what's shown.
  const commissionOnly = filter === "commission";
  const visible = commissionOnly
    ? rows.filter((c) => commissionRange(c) !== null)
    : rows;

  const setFilterAndReset = (next: Filter) => {
    setFilter(next);
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageBanner
        title="Companies"
        subtitle="Browse the companies hiring through the marketplace."
        metrics={[{ label: "Companies", value: companiesTotal }]}
      />

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative sm:max-w-sm sm:flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search companies"
              aria-label="Search companies"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <FilterChip
                key={f.key}
                active={filter === f.key}
                onClick={() => setFilterAndReset(f.key)}
              >
                {f.label}
              </FilterChip>
            ))}
          </div>
        </div>

        {isPending && <ListSkeleton />}

        {isError && (
          <div className="flex flex-col gap-3 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            <div className="flex items-center gap-2 font-medium">
              <AlertCircle className="h-[18px] w-[18px]" />
              Could not load companies.
            </div>
            <button
              type="button"
              className="self-start rounded-md border border-destructive/40 px-3 py-1 text-xs font-medium transition-colors hover:bg-destructive/10"
              onClick={() => void refetch()}
            >
              Retry
            </button>
          </div>
        )}

        {data && visible.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-input bg-card px-6 py-14 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-primary">
              <Building2 className="h-6 w-6" />
            </span>
            <div className="flex flex-col gap-1">
              <p className="font-heading text-base font-extrabold text-navy">
                No companies found
              </p>
              <p className="max-w-sm text-sm text-muted-foreground">
                {commissionOnly
                  ? "No companies on this page have a published commission."
                  : query !== ""
                    ? `Nothing matches “${query}”. Try a different search.`
                    : "There are no companies to show right now."}
              </p>
            </div>
          </div>
        )}

        {data && visible.length > 0 && (
          <>
            <div
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              role="list"
            >
              {visible.map((company) => (
                <div role="listitem" key={company.id}>
                  <CompanyCard company={company} />
                </div>
              ))}
            </div>

            {/* The client-side commission filter breaks page totals, so the
                pager only shows for the server-backed views. */}
            {!commissionOnly && data.meta.totalPages > 1 && (
              <div className="rounded-md border border-border bg-card shadow-card">
                <TablePager
                  page={page}
                  totalPages={data.meta.totalPages}
                  total={data.meta.total}
                  onPage={setPage}
                  pageSize={PAGE_SIZE}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

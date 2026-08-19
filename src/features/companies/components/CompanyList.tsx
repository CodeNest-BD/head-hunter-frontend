"use client";

import { useState } from "react";
import { AlertCircle, Building2, ExternalLink, Search } from "lucide-react";

import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { Input } from "@/shared/ui-components/controls/input";
import { TablePager } from "@/shared/ui-components/data/TablePager";
import { formatMinor } from "@/shared/utils/money";
import type { CompanySummary } from "../schemas";
import { useCompanies } from "../hooks/useCompanies";
import { FollowButton } from "./FollowButton";

const PAGE_SIZE = 12;

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

/** Two-letter monogram from the company name — a clean avatar fallback. */
function monogram(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function ListSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="h-44 w-full animate-pulse rounded-md border border-brand-line bg-white"
        />
      ))}
    </div>
  );
}

function CompanyCard({ company }: { company: CompanySummary }) {
  const range = commissionRange(company);

  return (
    <article className="flex h-full flex-col rounded-md border border-brand-line bg-white p-4 shadow-card transition-shadow hover:shadow-card-hover">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-accent font-heading text-sm font-extrabold text-primary">
            {monogram(company.companyName)}
          </span>
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
              <p className="text-xs text-brand-gray-light">
                {company.isFollowedByMe ? "Following" : "Company"}
              </p>
            )}
          </div>
        </div>
        <FollowButton
          companyId={company.id}
          isFollowed={company.isFollowedByMe}
        />
      </div>

      {/* Reserve two lines so cards with and without a description align. */}
      <p className="mt-3 line-clamp-2 min-h-[2.5rem] text-sm leading-relaxed text-brand-gray">
        {company.description || "No description provided."}
      </p>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-brand-line pt-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-gray-light">
          Commission
        </span>
        {range ? (
          <span className="text-sm font-bold tabular-nums text-navy">
            {range}
          </span>
        ) : (
          <span className="text-xs text-brand-gray-light">Not published</span>
        )}
      </div>
    </article>
  );
}

export function CompanyList() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  // Debounced so typing issues one request per pause, not one per keystroke.
  const query = useDebouncedValue(search, 300);
  const { data, isPending, isError, refetch } = useCompanies({
    q: query === "" ? undefined : query,
    page,
    limit: PAGE_SIZE,
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="relative max-w-sm">
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

      {data && data.data.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-input bg-white px-6 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-primary">
            <Building2 className="h-6 w-6" />
          </span>
          <div className="flex flex-col gap-1">
            <p className="font-heading text-base font-extrabold text-navy">
              No companies found
            </p>
            <p className="max-w-sm text-sm text-brand-gray">
              {query !== ""
                ? `Nothing matches “${query}”. Try a different search.`
                : "There are no companies to show right now."}
            </p>
          </div>
        </div>
      )}

      {data && data.data.length > 0 && (
        <>
          <div
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
            role="list"
          >
            {data.data.map((company) => (
              <div role="listitem" key={company.id}>
                <CompanyCard company={company} />
              </div>
            ))}
          </div>

          {data.meta.totalPages > 1 && (
            <div className="rounded-md border border-brand-line bg-card shadow-card">
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
  );
}

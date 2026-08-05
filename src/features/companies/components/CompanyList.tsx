"use client";

import { useState } from "react";
import { AlertCircle, Building2, ExternalLink, Search } from "lucide-react";

import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { Input } from "@/shared/ui-components/controls/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui-components/controls/card";
import { formatMinor } from "@/shared/utils/money";
import type { CompanySummary } from "../schemas";
import { useCompanies } from "../hooks/useCompanies";
import { FollowButton } from "./FollowButton";

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
    <ul className="flex flex-col gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <li
          key={i}
          className="h-28 w-full animate-pulse rounded-xl border border-border/70 bg-muted"
        />
      ))}
    </ul>
  );
}

export function CompanyList() {
  const [search, setSearch] = useState("");
  // Debounced so typing issues one request per pause, not one per keystroke.
  const query = useDebouncedValue(search, 300);
  const { data, isPending, isError, refetch } = useCompanies({
    q: query === "" ? undefined : query,
    limit: 20,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search companies"
          aria-label="Search companies"
          className="pl-9"
        />
      </div>

      {isPending && <ListSkeleton />}

      {isError && (
        <div className="flex flex-col gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
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
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/70 bg-card/50 px-6 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Building2 className="h-6 w-6" />
          </span>
          <div className="flex flex-col gap-1">
            <p className="font-heading text-base font-semibold text-foreground">
              No companies found
            </p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {query !== ""
                ? `Nothing matches “${query}”. Try a different search.`
                : "There are no companies to show right now."}
            </p>
          </div>
        </div>
      )}

      <ul className="flex flex-col gap-4">
        {data?.data.map((company) => {
          const range = commissionRange(company);
          return (
            <li key={company.id}>
              <Card className="border-border/70 transition hover:border-primary/50 hover:shadow-black/20">
                <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                      <Building2 className="h-[18px] w-[18px]" />
                    </span>
                    <div className="flex flex-col gap-1.5">
                      <CardTitle className="font-heading tracking-tight">
                        {company.companyName}
                      </CardTitle>
                      {company.website && (
                        <CardDescription>
                          <a
                            href={company.website}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline"
                          >
                            {company.website}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  <FollowButton
                    companyId={company.id}
                    isFollowed={company.isFollowedByMe}
                  />
                </CardHeader>
                {(company.description || range) && (
                  <CardContent className="flex flex-col gap-3 pl-[76px]">
                    {company.description && (
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {company.description}
                      </p>
                    )}
                    {range && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">
                          Commission range:{" "}
                        </span>
                        <span className="font-medium tabular-nums text-foreground">
                          {range}
                        </span>
                      </p>
                    )}
                  </CardContent>
                )}
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

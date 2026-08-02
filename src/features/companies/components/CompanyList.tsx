"use client";

import { useState } from "react";
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
      <Input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search companies"
        aria-label="Search companies"
        className="max-w-sm"
      />

      {isPending && (
        <p className="text-sm text-muted-foreground">Loading companies…</p>
      )}

      {isError && (
        <p className="text-sm text-destructive">
          Could not load companies.{" "}
          <button
            type="button"
            className="underline"
            onClick={() => void refetch()}
          >
            Retry
          </button>
        </p>
      )}

      {data && data.data.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No companies found{query !== "" ? ` for “${query}”` : ""}.
        </p>
      )}

      <ul className="flex flex-col gap-4">
        {data?.data.map((company) => {
          const range = commissionRange(company);
          return (
            <li key={company.id}>
              <Card>
                <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
                  <div className="flex flex-col gap-1.5">
                    <CardTitle>{company.companyName}</CardTitle>
                    {company.website && (
                      <CardDescription>
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noreferrer"
                          className="underline"
                        >
                          {company.website}
                        </a>
                      </CardDescription>
                    )}
                  </div>
                  <FollowButton
                    companyId={company.id}
                    isFollowed={company.isFollowedByMe}
                  />
                </CardHeader>
                {(company.description || range) && (
                  <CardContent className="flex flex-col gap-2">
                    {company.description && (
                      <p className="text-sm text-muted-foreground">
                        {company.description}
                      </p>
                    )}
                    {range && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">
                          Commission range:{" "}
                        </span>
                        {range}
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

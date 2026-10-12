"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, Handshake } from "lucide-react";

import { cn } from "@/shared/libs/shadCnConfig";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { Button } from "@/shared/ui-components/controls/button";
import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { TONE_DOT, type PillTone } from "@/shared/ui-components/badges/Pill";
import { EmptyState } from "@/shared/ui-components/feedback/EmptyState";
import {
  ToolbarSearch,
  ToolbarSelect,
} from "@/shared/ui-components/data/ListToolbar";
import {
  ColumnsToggle,
  useVisibleColumns,
  type ColumnDef,
} from "@/shared/ui-components/data/Columns";
import {
  TABLE_BODY,
  TABLE_CARD,
  TABLE_CELL_MAIN,
  TABLE_CELL_SUB,
  TABLE_EL,
  TABLE_HEAD,
  TABLE_ROW,
  TABLE_SCROLL,
  TABLE_TD,
  TABLE_TD_STACKED,
  TABLE_TH,
  TABLE_TOOLBAR,
} from "@/shared/ui-components/data/tableStyles";
import {
  adminCompanyPath,
  adminDisputePath,
  adminRecruiterPath,
} from "@/shared/utils/entityPaths";
import { formatMinor } from "@/shared/utils/money";
import { DEFAULT_PAGE_SIZE } from "../api/admin";
import {
  useAdminOffers,
  useAdminPlacements,
  usePlacementCounts,
} from "../hooks/useAdmin";
import { ListPager } from "./ListPager";
import {
  PLACEMENT_VIEWS,
  type AdminPlacement,
  type PlacementCounts,
  type PlacementView,
} from "../schemas";

const VIEW_LABELS: Record<PlacementView, string> = {
  all: "All",
  not_joined: "Not joined",
  in_guarantee: "In guarantee",
  guarantee_complete: "Guarantee complete",
  payment_blocked: "Payment blocked",
  paid: "Paid",
  disputed: "Disputed",
};

const VIEW_COUNT: Record<PlacementView, keyof PlacementCounts> = {
  all: "all",
  not_joined: "notJoined",
  in_guarantee: "inGuarantee",
  guarantee_complete: "guaranteeComplete",
  payment_blocked: "paymentBlocked",
  paid: "paid",
  disputed: "disputed",
};

const OFFER_TONES: Record<string, PillTone> = {
  sent: "info",
  accepted: "ok",
  declined: "bad",
  countered: "warn",
  superseded: "neutral",
  withdrawn: "neutral",
};

/** The stage options, in the order the design lists them. "All" is the
 *  select's own empty value, so it is not repeated here. */
const STAGE_OPTIONS = PLACEMENT_VIEWS.filter(
  (view): view is Exclude<PlacementView, "all"> => view !== "all",
).map((view) => ({ value: view, label: VIEW_LABELS[view] }));

/** Narrows a select's string back to a view without a cast. */
function toPlacementView(value: string): PlacementView {
  const match = PLACEMENT_VIEWS.find((view) => view === value);
  return match ?? "all";
}

const DAY_MS = 24 * 60 * 60 * 1000;

function formatDay(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function shortDay(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function titleCaseWords(value: string): string {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Where the placement is in its life, as an admin reads it. The placement's
 * own status says where the money sits; this says what has happened to the
 * person — the two come apart whenever a dispute pauses payment.
 */
function lifeStage(p: AdminPlacement): { label: string; tone: PillTone } {
  if (p.status === "released") return { label: "Completed", tone: "violet" };
  if (p.status === "refunded") return { label: "Refunded", tone: "neutral" };
  if (new Date(p.joiningDate).getTime() > Date.now()) {
    return { label: "Hired, not joined", tone: "neutral" };
  }
  if (new Date(p.holdExpiresAt).getTime() <= Date.now()) {
    return { label: "Guarantee complete", tone: "info" };
  }
  return {
    label: "In guarantee",
    tone: p.status === "disputed" ? "warn" : "info",
  };
}

/** What is happening to the commission. */
function paymentState(p: AdminPlacement): {
  label: string;
  tone: PillTone;
  note: string;
} {
  if (p.status === "released") {
    return {
      label: "Paid",
      tone: "ok",
      note: `Released ${formatDay(p.releasedAt)}`,
    };
  }
  if (p.status === "refunded") {
    return {
      label: "Refunded",
      tone: "neutral",
      note: "Returned to the company",
    };
  }
  if (p.status === "disputed") {
    return { label: "On hold", tone: "warn", note: "Dispute hold" };
  }
  if (p.status === "releasing") {
    return { label: "Processing", tone: "info", note: "Payout in flight" };
  }
  if (new Date(p.joiningDate).getTime() > Date.now()) {
    return { label: "Pending", tone: "neutral", note: "Starts at joining" };
  }
  return {
    label: "Pending",
    tone: "neutral",
    note: `Auto-release on ${shortDay(p.holdExpiresAt)}`,
  };
}

/** Day N of the 30-day guarantee, clamped to the window. */
function guaranteeDay(p: AdminPlacement): { day: number; total: number } {
  const joined = new Date(p.joiningDate).getTime();
  const ends = new Date(p.holdExpiresAt).getTime();
  const total = Math.max(1, Math.round((ends - joined) / DAY_MS));
  const elapsed = Math.round((Date.now() - joined) / DAY_MS);
  return { day: Math.max(0, Math.min(elapsed, total)), total };
}

function GuaranteeBar({ placement }: { placement: AdminPlacement }) {
  const { day, total } = guaranteeDay(placement);
  const held = placement.status === "disputed";
  return (
    <div>
      <div
        role="img"
        aria-label={`Day ${day} of ${total}`}
        className="flex h-1.5 overflow-hidden rounded-full bg-line"
      >
        <div
          className={cn("rounded-full", held ? "bg-warn-dot" : "bg-blue")}
          style={{ width: `${(day / total) * 100}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-meta text-ink-muted">
        <span>Day 0 · joined</span>
        <span className="font-medium text-ink">Day {total}</span>
      </div>
      <p className="mb-0 mt-2 text-sub text-ink-body">
        <span className="font-medium">Today: day {day}.</span>{" "}
        {held
          ? `The payment is paused, not the clock. Day ${total} stays ${formatDay(placement.holdExpiresAt)}.`
          : `Auto-releases on ${formatDay(placement.holdExpiresAt)} if nothing blocks it.`}
      </p>
    </div>
  );
}

function PlacementDetail({ placement }: { placement: AdminPlacement }) {
  const payment = paymentState(placement);
  return (
    <aside className="flex flex-col gap-0 overflow-hidden rounded-md bg-surface shadow-e1">
      <div className="px-5 py-4">
        <p className="m-0 text-meta tabular-nums text-ink-muted">
          {placement.candidateSerialNumber
            ? `SUB-${placement.candidateSerialNumber}`
            : "Placement"}
        </p>
        <h2 className="mt-0.5 text-card font-[650] text-ink">
          {placement.candidateName}
        </h2>
        <p className="m-0 mt-1 text-sub text-ink-muted">
          {placement.jobTitle} ·{" "}
          <Link
            href={adminCompanyPath({
              id: placement.companyUserId,
              serialNumber: placement.companySerialNumber,
            })}
            className="text-blue-ink hover:underline"
          >
            {placement.companyName}
          </Link>{" "}
          →{" "}
          <Link
            href={adminRecruiterPath({
              id: placement.recruiterUserId,
              serialNumber: placement.recruiterSerialNumber,
            })}
            className="text-blue-ink hover:underline"
          >
            {placement.recruiterName}
          </Link>
        </p>
        <dl className="m-0 mt-3.5 flex flex-col gap-2.5 text-sub">
          {[
            ["Agreed commission", formatMinor(placement.amountMinor)],
            ["Joining date", formatDay(placement.joiningDate)],
            ["Original guarantee end", formatDay(placement.holdExpiresAt)],
          ].map(([label, value]) => (
            <div
              key={label}
              className="flex items-baseline justify-between gap-4"
            >
              <dt className="shrink-0 text-ink-muted">{label}</dt>
              <dd className="m-0 text-right tabular-nums text-ink">{value}</dd>
            </div>
          ))}
          <div className="flex items-baseline justify-between gap-4">
            <dt className="shrink-0 text-ink-muted">Payment</dt>
            <dd className="m-0">
              <StatusBadge label={payment.label} tone={payment.tone} />
            </dd>
          </div>
        </dl>
      </div>

      <div className="border-t border-line px-5 py-4">
        <h3 className="mb-3 mt-0 text-sub font-[650] text-ink">
          30-day guarantee
        </h3>
        <GuaranteeBar placement={placement} />
      </div>

      {placement.openDisputeId && (
        <div className="border-t border-line px-5 py-4">
          <h3 className="mb-2.5 mt-0 text-sub font-[650] text-ink">
            Blocking holds
          </h3>
          <p className="m-0 flex gap-2 text-sub text-ink">
            <span
              aria-hidden="true"
              className={cn(
                "mt-1.5 size-1.5 shrink-0 rounded-full",
                TONE_DOT.warn,
              )}
            />
            <span>
              Dispute hold · DSP-{placement.openDisputeSerialNumber}
              <span className="block text-meta text-ink-muted">
                Opened {formatDay(placement.disputeOpenedAt)}
              </span>
            </span>
          </p>
          <div className="mt-3 flex flex-wrap gap-4 text-sub font-medium text-blue-ink">
            <Link
              href={adminDisputePath({
                id: placement.openDisputeId,
                serialNumber: placement.openDisputeSerialNumber ?? undefined,
              })}
              className="hover:underline"
            >
              Open DSP-{placement.openDisputeSerialNumber}
            </Link>
          </div>
        </div>
      )}
    </aside>
  );
}

function PlacementsTab({
  initialView,
  initialPlacementId,
}: {
  initialView?: PlacementView;
  initialPlacementId?: string;
}) {
  const [view, setView] = useState<PlacementView>(initialView ?? "all");
  const [page, setPage] = useState(1);
  // Seeded from the link, so arriving from a dispute opens that placement
  // rather than whichever row happens to be first.
  const [selectedId, setSelectedId] = useState<string | null>(
    initialPlacementId ?? null,
  );
  const counts = usePlacementCounts();
  const { data, isPending, isError, refetch } = useAdminPlacements(
    view,
    page,
    DEFAULT_PAGE_SIZE,
  );

  const rows = data?.data ?? [];
  // Falls back to the first row so the panel is never blank beside a list
  // that has something in it.
  const selected = rows.find((row) => row.id === selectedId) ?? rows[0];

  return (
    <div className="flex flex-wrap items-start gap-6">
      <div className="flex min-w-0 flex-[3_1_560px] flex-col gap-4">
        <div className={TABLE_CARD}>
          <div className={TABLE_TOOLBAR}>
            <ToolbarSelect
              label="Placement stage"
              value={view === "all" ? "" : view}
              onChange={(next) => {
                setView(next === "" ? "all" : toPlacementView(next));
                setPage(1);
              }}
              allLabel={`All stages${counts.data ? ` (${counts.data.all})` : ""}`}
              options={STAGE_OPTIONS.map((option) => ({
                value: option.value,
                // The count rides in the label — a select has nowhere else to
                // put it, and the chips it replaces carried one each.
                label: counts.data
                  ? `${option.label} (${counts.data[VIEW_COUNT[option.value]]})`
                  : option.label,
              }))}
            />
            {view !== "all" && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setView("all");
                  setPage(1);
                }}
              >
                Clear filters
              </Button>
            )}
          </div>

          {isPending ? (
            <div className="flex flex-col">
              {[0, 1, 2, 3].map((row) => (
                <div
                  key={row}
                  className="flex h-16 items-center gap-4 border-t border-line px-5"
                >
                  <div className="h-3.5 w-1/4 animate-pulse rounded-xs bg-surface-sunken" />
                  <div className="h-3.5 w-1/5 animate-pulse rounded-xs bg-surface-sunken" />
                  <div className="ml-auto h-3.5 w-16 animate-pulse rounded-xs bg-surface-sunken" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="m-5 flex max-w-md flex-col gap-3 rounded-sm border border-bad-line bg-bad-bg p-3.5 text-sub text-bad">
              <div className="flex items-center gap-2.5 font-[550]">
                <AlertCircle className="size-[15px] shrink-0" />
                Could not load placements.
              </div>
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void refetch()}
                >
                  Retry
                </Button>
              </div>
            </div>
          ) : rows.length === 0 ? (
            <EmptyState
              icon={Handshake}
              title="No placements here"
              description="Nothing sits in this stage right now."
            />
          ) : (
            <>
              <ul className="m-0 list-none divide-y divide-line p-0">
                {rows.map((row) => {
                  const stage = lifeStage(row);
                  const payment = paymentState(row);
                  const isSelected = selected?.id === row.id;
                  return (
                    <li key={row.id}>
                      <button
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => setSelectedId(row.id)}
                        className={cn(
                          "flex w-full flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5 text-left transition-colors",
                          isSelected
                            ? "bg-tint shadow-rail"
                            : "hover:bg-surface-sub",
                        )}
                      >
                        <span className="min-w-[160px] flex-[2_1_180px]">
                          <span className="block font-medium text-ink">
                            {row.candidateName}
                          </span>
                          <span className="block truncate text-meta text-ink-muted">
                            {row.jobTitle} · {row.companyName}
                          </span>
                        </span>
                        <span className="min-w-[150px] flex-1">
                          <span className="flex items-center gap-1.5 text-sub">
                            <span
                              aria-hidden="true"
                              className={cn(
                                "size-1.5 rounded-full",
                                TONE_DOT[stage.tone],
                              )}
                            />
                            {stage.label}
                          </span>
                          <span className="block text-meta text-ink-muted">
                            Joined {shortDay(row.joiningDate)} · day{" "}
                            {guaranteeDay(row).total}{" "}
                            {shortDay(row.holdExpiresAt)}
                          </span>
                        </span>
                        <span className="min-w-[130px] flex-1">
                          <span className="flex items-center gap-1.5 text-sub">
                            <span
                              aria-hidden="true"
                              className={cn(
                                "size-1.5 rounded-full",
                                TONE_DOT[payment.tone],
                              )}
                            />
                            {payment.label}
                          </span>
                          <span className="block text-meta text-ink-muted">
                            {payment.note}
                          </span>
                        </span>
                        <span className="ml-auto whitespace-nowrap font-[650] tabular-nums text-ink">
                          {formatMinor(row.amountMinor)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              {data && (
                <ListPager
                  page={page}
                  totalPages={data.meta.totalPages}
                  total={data.meta.total}
                  onPage={setPage}
                />
              )}
            </>
          )}
        </div>
      </div>

      <div className="min-w-0 flex-[1_1_320px]">
        {selected && <PlacementDetail placement={selected} />}
      </div>
    </div>
  );
}

const OFFER_STATUS_OPTIONS = [
  { value: "sent", label: "Sent" },
  { value: "accepted", label: "Accepted" },
  { value: "declined", label: "Declined" },
  { value: "countered", label: "Countered" },
  { value: "superseded", label: "Superseded" },
  { value: "withdrawn", label: "Withdrawn" },
] as const;

const OFFER_COLUMNS: ColumnDef[] = [
  { key: "candidate", label: "Candidate", required: true },
  { key: "job", label: "Job · Company" },
  { key: "recruiter", label: "Recruiter" },
  { key: "sent", label: "Sent" },
  { key: "status", label: "Status", required: true },
  { key: "amount", label: "Amount" },
];

function OffersTab() {
  const [page, setPage] = useState(1);
  const [qInput, setQInput] = useState("");
  const [status, setStatus] = useState("");
  // Same 300ms the shared list state uses, so search feels identical here.
  const q = useDebouncedValue(qInput, 300);
  const cols = useVisibleColumns("admin.offers.columns", OFFER_COLUMNS);

  const hasFilters = qInput !== "" || status !== "";
  const resetFilters = () => {
    setQInput("");
    setStatus("");
    setPage(1);
  };

  const { data, isPending, isError, refetch } = useAdminOffers({
    page,
    limit: DEFAULT_PAGE_SIZE,
    q: q || undefined,
    status: status || undefined,
  });

  return (
    <div className={TABLE_CARD}>
      <div className={TABLE_TOOLBAR}>
        <ToolbarSearch
          value={qInput}
          onChange={setQInput}
          placeholder="Search candidate, job, company or recruiter"
          className="min-w-[200px] flex-[1_1_240px] sm:max-w-[320px]"
        />
        <ToolbarSelect
          label="Offer status"
          value={status}
          onChange={(next) => {
            setStatus(next);
            setPage(1);
          }}
          allLabel="Any status"
          options={OFFER_STATUS_OPTIONS}
        />
        {hasFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetFilters}
          >
            Clear filters
          </Button>
        )}
        <div className="ml-auto">
          <ColumnsToggle
            columns={cols.columns}
            isVisible={cols.isVisible}
            onToggle={cols.toggle}
          />
        </div>
      </div>

      {isPending ? (
        <div className="flex flex-col">
          <div className="h-10 w-full animate-pulse border-t border-line bg-surface-sub" />
          {[0, 1, 2, 3].map((row) => (
            <div
              key={row}
              className="flex h-14 items-center gap-4 border-t border-line px-5"
            >
              <div className="h-3.5 w-1/4 animate-pulse rounded-xs bg-surface-sunken" />
              <div className="ml-auto h-5.25 w-20 animate-pulse rounded-full bg-surface-sunken" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="m-5 flex max-w-md flex-col gap-3 rounded-sm border border-bad-line bg-bad-bg p-3.5 text-sub text-bad">
          <div className="flex items-center gap-2.5 font-[550]">
            <AlertCircle className="size-[15px] shrink-0" />
            Could not load offers.
          </div>
          <div>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        </div>
      ) : data.data.length === 0 ? (
        <EmptyState
          icon={Handshake}
          title="No offers found"
          description="Try a different search or filter."
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
      ) : (
        <>
          <div className={TABLE_SCROLL}>
            <table className={TABLE_EL}>
              <thead className={TABLE_HEAD}>
                <tr>
                  <th scope="col" className={TABLE_TH}>
                    Candidate
                  </th>
                  {cols.isVisible("job") && (
                    <th scope="col" className={TABLE_TH}>
                      Job · Company
                    </th>
                  )}
                  {cols.isVisible("recruiter") && (
                    <th scope="col" className={TABLE_TH}>
                      Recruiter
                    </th>
                  )}
                  {cols.isVisible("sent") && (
                    <th scope="col" className={TABLE_TH}>
                      Sent
                    </th>
                  )}
                  <th scope="col" className={TABLE_TH}>
                    Status
                  </th>
                  {cols.isVisible("amount") && (
                    <th scope="col" className={cn(TABLE_TH, "text-right")}>
                      Amount
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className={TABLE_BODY}>
                {data.data.map((offer) => (
                  <tr key={offer.id} className={TABLE_ROW}>
                    <td className={cn(TABLE_TD, TABLE_CELL_MAIN)}>
                      {offer.candidateName}
                    </td>
                    {cols.isVisible("job") && (
                      <td className={TABLE_TD_STACKED}>
                        <span className="block text-ink">{offer.jobTitle}</span>
                        <span className={TABLE_CELL_SUB}>
                          {offer.companyName}
                        </span>
                      </td>
                    )}
                    {cols.isVisible("recruiter") && (
                      <td className={cn(TABLE_TD, "text-ink-body")}>
                        {offer.recruiterName}
                      </td>
                    )}
                    {cols.isVisible("sent") && (
                      <td
                        className={cn(
                          TABLE_TD,
                          "whitespace-nowrap tabular-nums text-ink-muted",
                        )}
                      >
                        {formatDay(offer.createdAt)}
                      </td>
                    )}
                    <td className={TABLE_TD}>
                      <StatusBadge
                        label={titleCaseWords(offer.status)}
                        tone={OFFER_TONES[offer.status] ?? "neutral"}
                      />
                    </td>
                    {cols.isVisible("amount") && (
                      <td
                        className={cn(
                          TABLE_TD,
                          "whitespace-nowrap text-right font-[650] tabular-nums text-ink",
                        )}
                      >
                        {formatMinor(offer.amountMinor)}
                      </td>
                    )}
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
        </>
      )}
    </div>
  );
}

/**
 * From offer to paid commission. The two tabs are the same hiring event at
 * two stages — an offer is a proposal, a placement is the thing that anchors
 * joining, the guarantee, payment and any dispute.
 */
export function OffersPlacementsBoard({
  initialView,
  initialPlacementId,
}: {
  /** Deep-link: the slice to open on, and the row to select within it. */
  initialView?: PlacementView;
  initialPlacementId?: string;
} = {}) {
  const [tab, setTab] = useState<"offers" | "placements">("placements");
  const counts = usePlacementCounts();
  const offers = useAdminOffers({ page: 1, limit: 1 });

  return (
    <div className="flex flex-col gap-4">
      <div
        role="tablist"
        aria-label="Offers and placements"
        className="flex gap-6 border-b border-line"
      >
        {(
          [
            ["offers", "Offers", offers.data?.meta.total],
            ["placements", "Placements", counts.data?.all],
          ] as const
        ).map(([key, label, count]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cn(
              "flex h-11 items-center gap-2 text-block transition-colors",
              tab === key
                ? "font-[650] text-ink shadow-[inset_0_-2px_0_theme(colors.blue.DEFAULT)]"
                : "font-medium text-ink-muted hover:text-ink",
            )}
          >
            {label}
            <span className="tabular-nums text-ink-faint">{count ?? "—"}</span>
          </button>
        ))}
      </div>

      {tab === "placements" ? (
        <PlacementsTab
          initialView={initialView}
          initialPlacementId={initialPlacementId}
        />
      ) : (
        <OffersTab />
      )}
    </div>
  );
}

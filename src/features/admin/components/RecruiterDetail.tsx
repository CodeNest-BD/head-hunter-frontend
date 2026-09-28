"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { AlertCircle, BadgeCheck, BadgeX, Trash2 } from "lucide-react";

import { RatingStars } from "@/shared/ui-components/data/RatingStars";
import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { formatMinor } from "@/shared/utils/money";
import { getSpecializationLabel } from "@/shared/utils/specializations";
import { Button } from "@/shared/ui-components/controls/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui-components/controls/card";
import { Textarea } from "@/shared/ui-components/controls/textarea";
import {
  useAdminRecruiter,
  useDecideRecruiterVerification,
  useDeleteRecruiter,
} from "../hooks/useAdmin";
import {
  SUBSCRIPTION_LABELS,
  VERIFICATION_LABELS,
  type RecruiterDetail as RecruiterDetailData,
} from "../schemas";
import { HoldButton } from "./HoldButton";
import {
  DetailField,
  DetailSkeleton,
  FACTS_GRID,
  FACT_FULL,
  initials,
} from "./DetailPrimitives";
import { RecruiterSubmissions } from "./RecruiterSubmissions";
import {
  ACCOUNT_STATUS_LABELS,
  ACCOUNT_STATUS_TONES,
  SUBSCRIPTION_STATUS_TONES,
  VERIFICATION_STATUS_TONES,
} from "./statusStyles";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * The admin's verification decision. The note reaches the recruiter either way
 * — it becomes the rejection's notification body, and is appended to the
 * approval's — so it is worth writing well.
 */
function VerificationCard({ data }: { data: RecruiterDetailData }) {
  const decide = useDecideRecruiterVerification();
  const [note, setNote] = useState("");

  const submit = (status: "verified" | "rejected"): void => {
    decide.mutate(
      { userId: data.userId, status, note: note.trim() || undefined },
      { onSuccess: () => setNote("") },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verification</CardTitle>
        <StatusBadge
          className="ml-auto"
          label={VERIFICATION_LABELS[data.verificationStatus]}
          tone={VERIFICATION_STATUS_TONES[data.verificationStatus] ?? "neutral"}
        />
      </CardHeader>
      <CardContent className="flex flex-col gap-2.5">
        <p className="text-sub text-ink-muted">
          {data.verificationStatus === "verified"
            ? "This recruiter can use the live job map and submit candidates."
            : data.verificationStatus === "rejected"
              ? "This recruiter was rejected. Approving now restores full access."
              : "Review the profile and references, then approve or reject. Only verified recruiters can use the live map and submit candidates."}
        </p>
        {data.verificationNote && (
          /* `.well` — the previous decision, kept as context beside the new one. */
          <p className="rounded-sm border border-line bg-surface-sub px-3 py-2.5 text-body text-ink-body">
            <span className="font-[650] text-ink">Last note:</span>{" "}
            {data.verificationNote}
          </p>
        )}
        <Textarea
          rows={2}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Optional note — sent to the recruiter with the decision."
          aria-label="Verification note"
        />
      </CardContent>
      <CardFooter className="flex-wrap">
        {data.verificationStatus !== "verified" && (
          <Button
            type="button"
            disabled={decide.isPending}
            onClick={() => submit("verified")}
          >
            <BadgeCheck />
            Approve
          </Button>
        )}
        {data.verificationStatus !== "rejected" && (
          <Button
            type="button"
            variant="destructive"
            disabled={decide.isPending}
            onClick={() => submit("rejected")}
          >
            <BadgeX />
            Reject
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

/** Soft-deletes a recruiter (behind an alert-dialog confirm). */
function DeleteRecruiterButton({
  userId,
  name,
}: {
  userId: string;
  name: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const deleteRecruiter = useDeleteRecruiter();

  return (
    <AlertDialog.Root open={open} onOpenChange={setOpen}>
      <AlertDialog.Trigger asChild>
        <Button type="button" variant="destructive" size="sm">
          <Trash2 />
          Delete
        </Button>
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-navy/40 backdrop-blur-sm" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-line bg-surface p-5 shadow-pop focus:outline-none">
          <AlertDialog.Title className="text-card font-[650] text-ink">
            Delete {name}?
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-1.5 text-sub text-ink-muted">
            The recruiter account is removed and its sessions revoked. This is
            recoverable by support.
          </AlertDialog.Description>
          <div className="mt-4 flex justify-end gap-2">
            <AlertDialog.Cancel asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </AlertDialog.Cancel>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteRecruiter.isPending}
              onClick={() =>
                deleteRecruiter.mutate(userId, {
                  onSuccess: () => {
                    setOpen(false);
                    router.push("/admin/recruiters");
                  },
                })
              }
            >
              {deleteRecruiter.isPending ? "Deleting…" : "Delete recruiter"}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

export function RecruiterDetail({ userId }: { userId: string }) {
  const { data, isPending, isError, refetch } = useAdminRecruiter(userId);

  if (isPending) return <DetailSkeleton />;
  if (isError) {
    return (
      <div className="flex max-w-md flex-col gap-3 rounded-sm border border-bad-line bg-bad-bg p-3.5 text-sub text-bad">
        <div className="flex items-center gap-2.5 font-[550]">
          <AlertCircle className="size-[15px] shrink-0" />
          Could not load this recruiter.
        </div>
        <div>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const name = `${data.firstName} ${data.lastName}`;
  const cityState = [data.city, data.state].filter(Boolean).join(", ");
  const location = [cityState, data.zip].filter(Boolean).join(" ") || "—";

  return (
    <div className="flex w-full max-w-5xl flex-col gap-3">
      <Card>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex min-w-0 items-center gap-4">
            <span className="flex size-13 shrink-0 items-center justify-center rounded-full bg-tint text-block font-bold text-blue-ink">
              {initials(data.firstName, data.lastName)}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-page font-bold text-ink">{name}</h2>
                <StatusBadge
                  label={ACCOUNT_STATUS_LABELS[data.status]}
                  tone={ACCOUNT_STATUS_TONES[data.status]}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:ml-auto sm:shrink-0">
            <HoldButton
              userId={data.userId}
              status={data.status}
              subjectName={name}
            />
            <DeleteRecruiterButton userId={data.userId} name={name} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        <VerificationCard data={data} />

        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className={FACTS_GRID}>
            <DetailField label="Phone" value={data.phone} />
            <DetailField
              label="Phone confirmed"
              value={data.phoneVerified ? "Yes" : "No"}
            />
            <DetailField label="Email" value={data.email} />
            <DetailField
              label="Email confirmed"
              value={data.emailVerified ? "Yes" : "No"}
            />
            <DetailField label="Address" value={data.addressLine} />
            <DetailField label="Location" value={location} />
            <div className={FACT_FULL}>
              <div className="text-label font-[650] uppercase text-ink-muted">
                LinkedIn
              </div>
              <div className="mt-[3px] text-body font-[550] text-ink">
                {data.linkedinUrl ? (
                  <a
                    href={data.linkedinUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="break-all text-blue-ink hover:underline"
                  >
                    {data.linkedinUrl.replace(/^https?:\/\//, "")}
                  </a>
                ) : (
                  "—"
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Marketplace</CardTitle>
          </CardHeader>
          <CardContent className={FACTS_GRID}>
            <div>
              <div className="text-label font-[650] uppercase text-ink-muted">
                Subscription
              </div>
              <div className="mt-[3px]">
                <StatusBadge
                  label={
                    SUBSCRIPTION_LABELS[data.subscriptionStatus] ??
                    data.subscriptionStatus
                  }
                  tone={
                    SUBSCRIPTION_STATUS_TONES[data.subscriptionStatus] ??
                    "neutral"
                  }
                />
              </div>
            </div>
            <DetailField
              label="Renews"
              value={formatDate(data.currentPeriodEnd)}
            />
            <DetailField
              label="Placements"
              value={String(data.placementCount)}
            />
            <DetailField
              label="Total earnings"
              value={formatMinor(data.releasedEarningsMinor)}
            />
            <DetailField
              label="Experience"
              value={
                data.yearsExperience !== null
                  ? `${data.yearsExperience} yrs`
                  : null
              }
            />
            <div>
              <div className="text-label font-[650] uppercase text-ink-muted">
                Rating
              </div>
              <div className="mt-[3px]">
                <RatingStars value={data.ratingAvg} count={data.ratingCount} />
              </div>
            </div>
            <div className={FACT_FULL}>
              <div className="text-label font-[650] uppercase text-ink-muted">
                Specializations
              </div>
              <div className="mt-[3px] text-body font-[550] text-ink">
                {data.specializations && data.specializations.length > 0
                  ? data.specializations.map(getSpecializationLabel).join(", ")
                  : "—"}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className={FACTS_GRID}>
            <DetailField label="Joined" value={formatDate(data.joinedAt)} />
            <DetailField
              label="Last login"
              value={formatDate(data.lastLoginAt)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Recruiting History ({data.experiences.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.experiences.length === 0 ? (
              <p className="text-sub text-ink-muted">No companies listed.</p>
            ) : (
              /* Compact `.well` rows rather than a table — the list never runs
                 past a handful of firms. */
              <ul className="flex flex-col gap-2">
                {data.experiences.map((experience) => (
                  <li
                    key={experience.id}
                    className="rounded-sm border border-line bg-surface-sub px-3 py-2.5"
                  >
                    <span className="flex flex-wrap items-baseline gap-2 text-block font-[650] text-ink">
                      {experience.firmName}
                      {experience.years !== null && (
                        <span className="text-meta font-[450] tabular-nums text-ink-muted">
                          {experience.years} yr
                          {experience.years === 1 ? "" : "s"}
                        </span>
                      )}
                    </span>
                    {experience.specializations.length > 0 && (
                      <span className="mt-0.5 block text-meta text-ink-muted">
                        {experience.specializations
                          .map(getSpecializationLabel)
                          .join(" · ")}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>References ({data.references.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {data.references.length === 0 ? (
              <p className="text-sub text-ink-muted">No references on file.</p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {data.references.map((ref) => (
                  <li
                    key={ref.id}
                    className="flex items-center gap-2 text-body font-[550] text-ink"
                  >
                    {ref.verified ? (
                      <BadgeCheck className="size-4 shrink-0 text-ok" />
                    ) : (
                      <BadgeX className="size-4 shrink-0 text-bad" />
                    )}
                    <span>
                      {ref.name}
                      {ref.company ? ` – ${ref.company}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <RecruiterSubmissions recruiterProfileId={data.recruiterProfileId} />
    </div>
  );
}

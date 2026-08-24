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
import { DetailField, DetailSkeleton, initials } from "./DetailPrimitives";
import { RecruiterSubmissions } from "./RecruiterSubmissions";
import {
  ACCOUNT_STATUS_LABELS,
  ACCOUNT_STATUS_STYLES,
  SUBSCRIPTION_STATUS_STYLES,
  VERIFICATION_STATUS_STYLES,
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
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Verification</CardTitle>
        <StatusBadge
          label={VERIFICATION_LABELS[data.verificationStatus]}
          className={
            VERIFICATION_STATUS_STYLES[data.verificationStatus] ??
            "bg-muted text-muted-foreground"
          }
        />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          {data.verificationStatus === "verified"
            ? "This recruiter can use the live job map and submit candidates."
            : data.verificationStatus === "rejected"
              ? "This recruiter was rejected. Approving now restores full access."
              : "Review the profile and references, then approve or reject. Only verified recruiters can use the live map and submit candidates."}
        </p>
        {data.verificationNote && (
          <p className="rounded-md border border-border bg-secondary/60 px-3 py-2 text-sm text-navy">
            <span className="font-semibold">Last note:</span>{" "}
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
        <div className="flex flex-wrap gap-2">
          {data.verificationStatus !== "verified" && (
            <Button
              type="button"
              disabled={decide.isPending}
              onClick={() => submit("verified")}
            >
              <BadgeCheck className="h-4 w-4" />
              Approve
            </Button>
          )}
          {data.verificationStatus !== "rejected" && (
            <Button
              type="button"
              variant="outline"
              disabled={decide.isPending}
              className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => submit("rejected")}
            >
              <BadgeX className="h-4 w-4" />
              Reject
            </Button>
          )}
        </div>
      </CardContent>
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
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-navy/40 backdrop-blur-sm" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-md border border-border bg-card p-6 shadow-card-lg focus:outline-none">
          <AlertDialog.Title className="font-heading text-lg font-extrabold text-foreground">
            Delete {name}?
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm text-muted-foreground">
            The recruiter account is removed and its sessions revoked. This is
            recoverable by support.
          </AlertDialog.Description>
          <div className="mt-5 flex justify-end gap-2">
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
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-8 text-center text-sm text-destructive">
          <AlertCircle className="h-6 w-6" />
          Could not load this recruiter.
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const name = `${data.firstName} ${data.lastName}`;
  const location = [data.city, data.state].filter(Boolean).join(", ") || "—";

  return (
    <div className="flex w-full max-w-5xl flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent text-lg font-bold text-primary">
              {initials(data.firstName, data.lastName)}
            </span>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="font-heading text-xl font-bold text-navy">
                  {name}
                </h2>
                <StatusBadge
                  label={ACCOUNT_STATUS_LABELS[data.status]}
                  className={ACCOUNT_STATUS_STYLES[data.status]}
                />
              </div>
              <p className="text-sm text-muted-foreground">{data.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <HoldButton
              userId={data.userId}
              status={data.status}
              subjectName={name}
            />
            <DeleteRecruiterButton userId={data.userId} name={name} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <VerificationCard data={data} />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contact</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailField label="Phone" value={data.phone} />
            <DetailField label="Location" value={location} />
            <DetailField label="Address" value={data.addressLine} />
            <DetailField label="ZIP" value={data.zip} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Marketplace</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Subscription
              </span>
              <StatusBadge
                label={
                  SUBSCRIPTION_LABELS[data.subscriptionStatus] ??
                  data.subscriptionStatus
                }
                className={
                  SUBSCRIPTION_STATUS_STYLES[data.subscriptionStatus] ??
                  "bg-muted text-muted-foreground"
                }
              />
            </div>
            <DetailField
              label="Renews"
              value={formatDate(data.currentPeriodEnd)}
            />
            <DetailField
              label="Submissions"
              value={String(data.submissionCount)}
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
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Rating
              </span>
              <RatingStars value={data.ratingAvg} count={data.ratingCount} />
            </div>
            <div className="col-span-2 flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Specializations
              </span>
              <span className="text-sm text-navy">
                {data.specializations && data.specializations.length > 0
                  ? data.specializations.map(getSpecializationLabel).join(", ")
                  : "—"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailField label="Joined" value={formatDate(data.joinedAt)} />
            <DetailField
              label="Last login"
              value={formatDate(data.lastLoginAt)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              References ({data.references.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.references.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No references on file.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {data.references.map((ref) => (
                  <li
                    key={ref.id}
                    className="rounded-md border border-border px-3 py-2 text-sm text-navy"
                  >
                    {ref.name}
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

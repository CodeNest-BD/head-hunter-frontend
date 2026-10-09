"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { AlertCircle, BadgeCheck, BadgeX, Trash2 } from "lucide-react";

import { RatingStars } from "@/shared/ui-components/data/RatingStars";
import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { useCanonicalPath } from "@/shared/hooks/useCanonicalPath";
import { adminRecruiterPath } from "@/shared/utils/entityPaths";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/ui-components/controls/tabs";
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
  DetailSkeleton,
  RAIL_FACTS,
  RailField,
  initials,
} from "./DetailPrimitives";
import { RecruiterSubmissions } from "./RecruiterSubmissions";
import {
  ACCOUNT_STATUS_LABELS,
  ACCOUNT_STATUS_TONES,
  SUBSCRIPTION_STATUS_TONES,
  VERIFICATION_STATUS_TONES,
} from "./statusStyles";
import { cn } from "@/shared/libs/shadCnConfig";
import {
  DIALOG_OVERLAY,
  DIALOG_PANEL_PADDED,
  DIALOG_TITLE,
} from "@/shared/ui-components/feedback/dialogStyles";

/** Short month, as the design's header strip and rail both use — the long
 * form wrapped "September 24, 2026" across two lines in a 340px rail. */
function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** One figure in the header card's strip: the number, then what it counts. */
function HeaderStat({
  value,
  label,
  className,
}: {
  value: string;
  label: string;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className="truncate text-section font-bold text-ink">{value}</div>
      <div className="mt-0.5 text-meta text-ink-muted">{label}</div>
    </div>
  );
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
        <AlertDialog.Overlay className={DIALOG_OVERLAY} />
        <AlertDialog.Content className={cn(DIALOG_PANEL_PADDED, "max-w-md")}>
          <AlertDialog.Title className={DIALOG_TITLE}>
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

export function RecruiterDetail({ recruiterRef }: { recruiterRef: string }) {
  const [tab, setTab] = useState("overview");
  const { data, isPending, isError, refetch } = useAdminRecruiter(recruiterRef);
  useCanonicalPath(
    data &&
      adminRecruiterPath({
        id: data.userId,
        serialNumber: data.recruiterSerialNumber,
      }),
  );

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
    // Controlled rather than `defaultValue`: Overview's "View all submissions"
    // moves the reader to the Submissions tab, so the bar has to follow.
    <Tabs
      value={tab}
      onValueChange={setTab}
      className="flex w-full flex-col gap-3"
    >
      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex min-w-0 items-center gap-4">
              <span className="flex size-13 shrink-0 items-center justify-center rounded-full bg-tint text-block font-bold text-blue-ink">
                {initials(data.firstName, data.lastName)}
              </span>
              <div className="min-w-0">
                {data.recruiterSerialNumber !== undefined && (
                  <p className="text-label font-[650] uppercase text-ink-faint">
                    Recruiter / #{data.recruiterSerialNumber}
                  </p>
                )}
                <div className="mt-[3px] flex flex-wrap items-center gap-2.5">
                  <h2 className="text-page font-bold text-ink">{name}</h2>
                  <StatusBadge
                    label={ACCOUNT_STATUS_LABELS[data.status]}
                    tone={ACCOUNT_STATUS_TONES[data.status]}
                  />
                  <StatusBadge
                    label={
                      VERIFICATION_LABELS[data.verificationStatus] ??
                      data.verificationStatus
                    }
                    tone={
                      VERIFICATION_STATUS_TONES[data.verificationStatus] ??
                      "neutral"
                    }
                  />
                </div>
                <p className="mt-[3px] text-sub text-ink-muted">
                  Recruiter · Joined {formatDate(data.joinedAt)}
                </p>
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
          </div>

          {/* The four figures that say what this account amounts to, ruled off
              from the identity above them and from each other. */}
          <div className="grid grid-cols-2 gap-x-5 gap-y-4 border-t border-line pt-4 sm:grid-cols-4 sm:divide-x sm:divide-line">
            <HeaderStat
              value={String(data.placementCount)}
              label={data.placementCount === 1 ? "Placement" : "Placements"}
            />
            <HeaderStat
              className="sm:pl-5"
              value={formatMinor(data.releasedEarningsMinor)}
              label="Total Earnings"
            />
            <HeaderStat
              className="sm:pl-5"
              value={
                SUBSCRIPTION_LABELS[data.subscriptionStatus] ??
                data.subscriptionStatus
              }
              label="Marketplace Plan"
            />
            <HeaderStat
              className="sm:pl-5"
              value={formatDate(data.lastLoginAt)}
              label="Last Active"
            />
          </div>
        </CardContent>

        {/* The tab bar closes the header card: the card's own bottom border is
            the rule the active underline sits on, so the bar adds none of its
            own. */}
        <TabsList className="px-2 shadow-none">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="history">Recruiting History</TabsTrigger>
          <TabsTrigger value="references">References</TabsTrigger>
        </TabsList>
      </Card>

      {/* The design's shape: the account's own record down the main column,
          the reference facts about it in a narrower rail beside. The rail does
          not belong to any one tab — it is what the record is about. */}
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="flex min-w-0 flex-col gap-3">
          <TabsContent value="overview" className="mt-0 flex flex-col gap-3">
            <VerificationCard data={data} />
            <RecruiterSubmissions
              recruiterProfileId={data.recruiterProfileId}
              title="Recent Submissions"
              onViewAll={() => setTab("submissions")}
            />
          </TabsContent>

          <TabsContent value="submissions" className="mt-0">
            <RecruiterSubmissions
              recruiterProfileId={data.recruiterProfileId}
            />
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>
                  Recruiting History ({data.experiences.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.experiences.length === 0 ? (
                  <p className="text-sub text-ink-muted">
                    No companies listed.
                  </p>
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
          </TabsContent>

          <TabsContent value="references" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>References ({data.references.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {data.references.length === 0 ? (
                  <p className="text-sub text-ink-muted">
                    No references on file.
                  </p>
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
          </TabsContent>
        </div>

        {/* The reference facts about the account, in the design's narrower
            rail beside it. */}
        <div className="flex min-w-0 flex-col gap-3">
          <Card>
            <CardHeader>
              <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardContent className={RAIL_FACTS}>
              <RailField label="Phone" value={data.phone} />
              <RailField
                label="Phone confirmed"
                value={data.phoneVerified ? "Yes" : "No"}
              />
              <RailField label="Email" value={data.email} />
              <RailField
                label="Email confirmed"
                value={data.emailVerified ? "Yes" : "No"}
              />
              <RailField label="Address" value={data.addressLine} />
              <RailField label="Location" value={location} />
              <RailField
                label="LinkedIn"
                value={
                  data.linkedinUrl ? (
                    <a
                      href={data.linkedinUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="break-all text-blue-ink hover:underline"
                    >
                      {data.linkedinUrl.replace(/^https?:\/\//, "")}
                    </a>
                  ) : null
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Marketplace</CardTitle>
            </CardHeader>
            <CardContent className={RAIL_FACTS}>
              <RailField
                label="Subscription"
                value={
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
                }
              />
              <RailField
                label="Renews"
                value={formatDate(data.currentPeriodEnd)}
              />
              <RailField
                label="Placements"
                value={String(data.placementCount)}
              />
              <RailField
                label="Total earnings"
                value={formatMinor(data.releasedEarningsMinor)}
              />
              <RailField
                label="Experience"
                value={
                  data.yearsExperience !== null
                    ? `${data.yearsExperience} yrs`
                    : null
                }
              />
              <RailField
                label="Rating"
                value={
                  <RatingStars
                    value={data.ratingAvg}
                    count={data.ratingCount}
                  />
                }
              />
              <RailField
                label="Specializations"
                value={
                  data.specializations && data.specializations.length > 0
                    ? data.specializations
                        .map(getSpecializationLabel)
                        .join(", ")
                    : null
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
            </CardHeader>
            <CardContent className={RAIL_FACTS}>
              <RailField label="Joined" value={formatDate(data.joinedAt)} />
              <RailField
                label="Last login"
                value={formatDate(data.lastLoginAt)}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </Tabs>
  );
}

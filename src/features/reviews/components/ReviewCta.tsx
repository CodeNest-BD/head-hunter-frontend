"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Star, X } from "lucide-react";

import { RatingStars } from "@/shared/ui-components/data/RatingStars";
import { Button } from "@/shared/ui-components/controls/button";
import { Label } from "@/shared/ui-components/controls/label";
import { Textarea } from "@/shared/ui-components/controls/textarea";

import {
  useCreateReview,
  useReviewByOffer,
  useUpdateReview,
} from "../hooks/useReviews";
import { StarRatingInput } from "./StarRatingInput";
import { cn } from "@/shared/libs/shadCnConfig";
import {
  DIALOG_OVERLAY,
  DIALOG_PANEL_PADDED,
} from "@/shared/ui-components/feedback/dialogStyles";

interface ReviewCtaProps {
  /** The accepted offer (the hire) this review is about. */
  offerId: string;
}

/**
 * "Rate this recruiter" on an accepted offer. One review per hire: the button
 * reads the existing review (if any) and the dialog either creates or edits
 * it, prefilled. Company-side only — render it only for the company viewer.
 */
export function ReviewCta({ offerId }: ReviewCtaProps) {
  const { data: existing, isLoading } = useReviewByOffer(offerId);
  const createReview = useCreateReview();
  const updateReview = useUpdateReview();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  // Prefill when the dialog opens (and re-sync if the review refetches).
  useEffect(() => {
    if (!open) return;
    setRating(existing?.rating ?? 0);
    setComment(existing?.comment ?? "");
  }, [open, existing]);

  // Hold the trigger's footprint rather than popping a button into the offer
  // card once the existing review resolves.
  if (isLoading) {
    return (
      <div
        aria-hidden="true"
        className="h-7.5 w-36 animate-pulse rounded-xs bg-surface-sunken"
      />
    );
  }

  const isPending = createReview.isPending || updateReview.isPending;
  const submit = (): void => {
    const onSuccess = (): void => setOpen(false);
    if (existing) {
      updateReview.mutate(
        { id: existing.id, rating, comment: comment.trim() },
        { onSuccess },
      );
    } else {
      createReview.mutate(
        { offerId, rating, comment: comment.trim() || undefined },
        { onSuccess },
      );
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {existing && <RatingStars value={existing.rating} />}
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger asChild>
          <Button type="button" variant="outline" size="sm">
            <Star />
            {existing ? "Edit your review" : "Rate this recruiter"}
          </Button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className={DIALOG_OVERLAY} />
          <Dialog.Content className={cn(DIALOG_PANEL_PADDED, "max-w-md")}>
            <div className="flex items-start justify-between">
              <div>
                <Dialog.Title className="text-section font-bold text-ink">
                  {existing ? "Edit your review" : "Rate this recruiter"}
                </Dialog.Title>
                <Dialog.Description className="mt-[3px] text-sub text-ink-muted">
                  Your rating helps other companies pick the right recruiter.
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Close"
                  className="inline-flex size-7 shrink-0 items-center justify-center rounded-xs text-ink-faint transition-colors hover:bg-surface-sunken hover:text-ink"
                >
                  <X className="size-[15px]" />
                </button>
              </Dialog.Close>
            </div>

            <div className="mt-4 flex flex-col gap-4">
              <StarRatingInput value={rating} onChange={setRating} />
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`review-comment-${offerId}`}>
                  Comment (optional)
                </Label>
                <Textarea
                  id={`review-comment-${offerId}`}
                  rows={3}
                  maxLength={2000}
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="How was working with this recruiter?"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Dialog.Close asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Dialog.Close>
                <Button
                  type="button"
                  disabled={rating === 0 || isPending}
                  onClick={submit}
                >
                  {isPending
                    ? "Saving…"
                    : existing
                      ? "Save changes"
                      : "Submit review"}
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

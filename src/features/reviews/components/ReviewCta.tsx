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

  if (isLoading) return null;

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
            <Star className="h-4 w-4" />
            {existing ? "Edit your review" : "Rate this recruiter"}
          </Button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-navy/40 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-card-lg focus:outline-none">
            <div className="flex items-start justify-between">
              <div>
                <Dialog.Title className="font-heading text-lg font-extrabold text-foreground">
                  {existing ? "Edit your review" : "Rate this recruiter"}
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                  Your rating helps other companies pick the right recruiter.
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Close"
                  className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>

            <div className="mt-5 flex flex-col gap-4">
              <StarRatingInput value={rating} onChange={setRating} />
              <div className="flex flex-col gap-2">
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

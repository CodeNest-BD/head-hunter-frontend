"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Plus } from "lucide-react";

import { Button } from "@/shared/ui-components/controls/button";
import { ConfirmAction } from "@/shared/ui-components/controls/ConfirmAction";
import { Input } from "@/shared/ui-components/controls/input";
import { Label } from "@/shared/ui-components/controls/label";
import {
  useAddReference,
  useRemoveReference,
} from "../hooks/useRecruiterProfile";
import {
  referenceFormSchema,
  type RecruiterReference,
  type ReferenceFormValues,
} from "../schemas";

const MAX_REFERENCES = 3;

/** Two-letter monogram from a reference's name. */
function monogram(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

interface ReferencesSectionProps {
  references: RecruiterReference[];
}

export function ReferencesSection({ references }: ReferencesSectionProps) {
  const add = useAddReference();
  const remove = useRemoveReference();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const atCapacity = references.length >= MAX_REFERENCES;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReferenceFormValues>({
    resolver: zodResolver(referenceFormSchema),
    defaultValues: { name: "", company: "", title: "", phone: "" },
  });

  const onSubmit = handleSubmit((values) => {
    add.mutate(
      {
        name: values.name,
        company: values.company || undefined,
        title: values.title || undefined,
        phone: values.phone || undefined,
      },
      {
        onSuccess: () => {
          reset();
          setAdding(false);
        },
      },
    );
  });

  return (
    <section className="rounded-md border border-border bg-card p-5 shadow-card sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-base font-bold text-navy">
            References
          </h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Up to {MAX_REFERENCES} professional references from recruiting
            roles.
          </p>
        </div>
        <span className="shrink-0 text-sm font-semibold tabular-nums text-muted-foreground">
          {references.length} / {MAX_REFERENCES}
        </span>
      </div>

      <div className="mt-4 divide-y divide-border border-t border-border">
        {references.length === 0 && !adding && (
          <p className="py-6 text-sm text-muted-foreground">
            No references yet — add up to {MAX_REFERENCES}.
          </p>
        )}

        {references.map((reference) =>
          confirmingId === reference.id ? (
            <div key={reference.id} className="py-4">
              <ConfirmAction
                message="Remove this reference? This cannot be undone."
                confirmLabel="Confirm remove"
                busyLabel="Removing…"
                busy={remove.isPending}
                onCancel={() => setConfirmingId(null)}
                onConfirm={() => remove.mutate(reference.id)}
              />
            </div>
          ) : (
            <div
              key={reference.id}
              className="flex items-center justify-between gap-4 py-3.5"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent text-xs font-bold text-primary">
                  {monogram(reference.name)}
                </span>
                <div className="min-w-0 text-sm">
                  <p className="font-semibold text-navy">{reference.name}</p>
                  <p className="truncate text-muted-foreground">
                    {[reference.title, reference.company, reference.phone]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setConfirmingId(reference.id)}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                Remove
              </Button>
            </div>
          ),
        )}
      </div>

      {atCapacity ? (
        <p className="mt-4 rounded-md border border-border/60 bg-muted/30 p-3 text-sm text-muted-foreground">
          You have the maximum of {MAX_REFERENCES} references. Remove one to add
          another.
        </p>
      ) : adding ? (
        <form
          onSubmit={onSubmit}
          className="mt-4 flex flex-col gap-4 rounded-md border border-border bg-secondary/40 p-4"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="ref-name">Name</Label>
              <Input id="ref-name" {...register("name")} />
              {errors.name && (
                <p className="text-xs text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ref-company">Company</Label>
              <Input id="ref-company" {...register("company")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ref-title">Title</Label>
              <Input id="ref-title" {...register("title")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ref-phone">Phone</Label>
              <Input id="ref-phone" {...register("phone")} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={add.isPending}>
              {add.isPending ? "Adding…" : "Add reference"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                reset();
                setAdding(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
        >
          <Plus className="h-4 w-4" />
          Add a reference
        </button>
      )}
    </section>
  );
}

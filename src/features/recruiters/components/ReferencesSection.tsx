"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Plus } from "lucide-react";

import { Avatar } from "@/shared/ui-components/badges/Avatar";
import { Button } from "@/shared/ui-components/controls/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui-components/controls/card";
import { ConfirmAction } from "@/shared/ui-components/controls/ConfirmAction";
import { Input } from "@/shared/ui-components/controls/input";
import { Label } from "@/shared/ui-components/controls/label";
import { ListRow } from "@/shared/ui-components/list/ListRow";
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
    // The reference's references card: a ruled head carrying the count, the
    // rows themselves, and the one "add" affordance in the foot.
    <Card>
      <CardHeader>
        <CardTitle>References</CardTitle>
        <span className="ml-auto shrink-0 text-meta font-[550] tabular-nums text-ink-muted">
          {references.length} / {MAX_REFERENCES}
        </span>
        <CardDescription>
          Up to {MAX_REFERENCES} professional references from recruiting roles
          (at least 1 required).
        </CardDescription>
      </CardHeader>

      <div className="flex flex-col">
        {references.length === 0 && !adding && (
          <p className="px-4 py-6 text-sub text-ink-muted">
            No references yet — add up to {MAX_REFERENCES}.
          </p>
        )}

        {references.map((reference) =>
          confirmingId === reference.id ? (
            <div
              key={reference.id}
              className="border-b border-line px-4 py-3 last:border-b-0"
            >
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
            <ListRow key={reference.id} className="items-center">
              <Avatar name={reference.name} size="md" />
              <div className="min-w-0 flex-1">
                <p className="text-block font-[650] text-ink">
                  {reference.name}
                </p>
                <p className="truncate text-sub text-ink-muted">
                  {[reference.title, reference.company, reference.phone]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setConfirmingId(reference.id)}
                className="shrink-0"
              >
                Remove
              </Button>
            </ListRow>
          ),
        )}
      </div>

      {atCapacity ? (
        <CardFooter>
          <p className="text-meta text-ink-muted">
            You have the maximum of {MAX_REFERENCES} references. Remove one to
            add another.
          </p>
        </CardFooter>
      ) : adding ? (
        <CardFooter className="p-4">
          <form onSubmit={onSubmit} className="flex w-full flex-col gap-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ref-name">Name</Label>
                <Input id="ref-name" {...register("name")} />
                {errors.name && (
                  <p className="text-meta font-medium text-bad">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ref-company">Company</Label>
                <Input id="ref-company" {...register("company")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ref-title">Title</Label>
                <Input id="ref-title" {...register("title")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ref-phone">Phone</Label>
                <Input
                  id="ref-phone"
                  className="tabular-nums"
                  {...register("phone")}
                />
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
        </CardFooter>
      ) : (
        <CardFooter>
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 text-sub font-[550] text-blue-ink transition-colors hover:text-blue"
          >
            <Plus className="size-[15px]" />
            Add a reference
          </button>
        </CardFooter>
      )}
    </Card>
  );
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/shared/ui-components/controls/button";
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

interface ReferencesSectionProps {
  references: RecruiterReference[];
}

export function ReferencesSection({ references }: ReferencesSectionProps) {
  const add = useAddReference();
  const remove = useRemoveReference();
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
      { onSuccess: () => reset() },
    );
  });

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">References</h2>
        <p className="text-sm text-muted-foreground">
          Up to {MAX_REFERENCES} professional references from recruiting roles.
        </p>
      </div>

      {references.length === 0 ? (
        <p className="text-sm text-muted-foreground">No references yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {references.map((reference) => (
            <li
              key={reference.id}
              className="flex items-start justify-between gap-4 rounded-lg border p-3"
            >
              <div className="text-sm">
                <p className="font-medium">{reference.name}</p>
                <p className="text-muted-foreground">
                  {[reference.title, reference.company]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </p>
                {reference.phone && (
                  <p className="text-muted-foreground">{reference.phone}</p>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={remove.isPending}
                onClick={() => remove.mutate(reference.id)}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}

      {atCapacity ? (
        <p className="text-sm text-muted-foreground">
          You have the maximum of {MAX_REFERENCES} references. Remove one to add
          another.
        </p>
      ) : (
        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-3 rounded-lg border p-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="ref-name">Name</Label>
              <Input id="ref-name" {...register("name")} />
              {errors.name && (
                <p className="text-sm text-destructive">
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
          <div>
            <Button type="submit" size="sm" disabled={add.isPending}>
              {add.isPending ? "Adding…" : "Add reference"}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}

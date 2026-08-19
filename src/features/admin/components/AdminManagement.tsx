"use client";

import { useState } from "react";
import { AlertCircle, KeyRound, Pencil, Trash2, UserPlus } from "lucide-react";

import { useAuth } from "@/features/auth";
import { Button } from "@/shared/ui-components/controls/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui-components/controls/card";
import { ConfirmAction } from "@/shared/ui-components/controls/ConfirmAction";
import { Input } from "@/shared/ui-components/controls/input";
import { Label } from "@/shared/ui-components/controls/label";
import {
  useAdmins,
  useChangeAdminPassword,
  useCreateAdmin,
  useRemoveAdmin,
  useUpdateAdmin,
} from "../hooks/useAdmin";
import type { AdminUser } from "../schemas";
import { BODY_ROW_CLASS, TABLE_CLASS, THEAD_ROW_CLASS } from "./tableStyles";

const MIN_PASSWORD = 8;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function CreateAdminForm() {
  const create = useCreateAdmin();
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");

  const valid =
    email.trim() !== "" &&
    firstName.trim() !== "" &&
    lastName.trim() !== "" &&
    password.length >= MIN_PASSWORD;

  const onSubmit = (event: React.FormEvent): void => {
    event.preventDefault();
    if (!valid) return;
    create.mutate(
      {
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        password,
      },
      {
        onSuccess: () => {
          setEmail("");
          setFirstName("");
          setLastName("");
          setPassword("");
        },
      },
    );
  };

  return (
    <form onSubmit={onSubmit} className="flex max-w-2xl flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-admin-first">First name</Label>
          <Input
            id="new-admin-first"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-admin-last">Last name</Label>
          <Input
            id="new-admin-last"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-admin-email">Email</Label>
          <Input
            id="new-admin-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-admin-password">Initial password</Label>
          <Input
            id="new-admin-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            At least {MIN_PASSWORD} characters.
          </p>
        </div>
      </div>

      {create.isError && (
        <p className="text-sm text-destructive">
          Could not create the admin. The email may already be in use.
        </p>
      )}
      {create.isSuccess && !create.isPending && (
        <p className="text-sm text-[#17734E]">Admin created.</p>
      )}

      <div>
        <Button type="submit" disabled={!valid || create.isPending}>
          <UserPlus className="mr-2 h-4 w-4" />
          {create.isPending ? "Creating…" : "Create admin"}
        </Button>
      </div>
    </form>
  );
}

function ChangePasswordForm({
  userId,
  onDone,
}: {
  userId: string;
  onDone: () => void;
}) {
  const change = useChangeAdminPassword();
  const [password, setPassword] = useState("");
  const valid = password.length >= MIN_PASSWORD;

  const onSubmit = (event: React.FormEvent): void => {
    event.preventDefault();
    if (!valid) return;
    change.mutate({ userId, password }, { onSuccess: onDone });
  };

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-2 rounded-md border border-border bg-muted/30 p-3 sm:flex-row sm:items-end"
    >
      <div className="flex flex-1 flex-col gap-1.5">
        <Label htmlFor={`pw-${userId}`}>New password</Label>
        <Input
          id={`pw-${userId}`}
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={!valid || change.isPending}>
          {change.isPending ? "Saving…" : "Set password"}
        </Button>
      </div>
    </form>
  );
}

function EditAdminForm({
  admin,
  onDone,
}: {
  admin: AdminUser;
  onDone: () => void;
}) {
  const update = useUpdateAdmin();
  const [firstName, setFirstName] = useState(admin.firstName);
  const [lastName, setLastName] = useState(admin.lastName);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!firstName.trim() || !lastName.trim()) return;
        update.mutate(
          {
            userId: admin.userId,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
          },
          { onSuccess: onDone },
        );
      }}
      className="flex flex-wrap items-end gap-3 rounded-md border border-border bg-secondary/50 p-3"
    >
      <div className="flex flex-col gap-1">
        <Label htmlFor={`first-${admin.userId}`}>First name</Label>
        <Input
          id={`first-${admin.userId}`}
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
          className="h-9 w-40"
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor={`last-${admin.userId}`}>Last name</Label>
        <Input
          id={`last-${admin.userId}`}
          value={lastName}
          onChange={(event) => setLastName(event.target.value)}
          className="h-9 w-40"
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={update.isPending}>
          {update.isPending ? "Saving…" : "Save"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function AdminRow({ admin, isSelf }: { admin: AdminUser; isSelf: boolean }) {
  const remove = useRemoveAdmin();
  const [confirming, setConfirming] = useState(false);
  const [changing, setChanging] = useState(false);
  const [editing, setEditing] = useState(false);

  return (
    <>
      <tr className={BODY_ROW_CLASS}>
        <td className="px-5 py-3">
          <span className="font-medium text-navy">
            {admin.firstName} {admin.lastName}
            {isSelf && (
              <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-primary">
                You
              </span>
            )}
          </span>
          <p className="text-xs text-muted-foreground">{admin.email}</p>
        </td>
        <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">
          {formatDate(admin.createdAt)}
        </td>
        <td className="px-5 py-3">
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditing((v) => !v)}
            >
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setChanging((v) => !v)}
            >
              <KeyRound className="mr-1.5 h-3.5 w-3.5" />
              Password
            </Button>
            {!isSelf && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setConfirming(true)}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Remove
              </Button>
            )}
          </div>
        </td>
      </tr>
      {(changing || confirming || editing) && (
        <tr>
          <td colSpan={3} className="px-5 py-3">
            {editing && (
              <EditAdminForm admin={admin} onDone={() => setEditing(false)} />
            )}
            {changing && (
              <ChangePasswordForm
                userId={admin.userId}
                onDone={() => setChanging(false)}
              />
            )}
            {confirming && (
              <ConfirmAction
                message={`Remove ${admin.firstName} ${admin.lastName}? They will lose admin access immediately.`}
                confirmLabel="Remove admin"
                busy={remove.isPending}
                onCancel={() => setConfirming(false)}
                onConfirm={() =>
                  remove.mutate(admin.userId, {
                    onSuccess: () => setConfirming(false),
                  })
                }
              />
            )}
          </td>
        </tr>
      )}
    </>
  );
}

export function AdminManagement() {
  const { user } = useAuth();
  const { data, isPending, isError, refetch } = useAdmins();

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Create admin</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateAdminForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Admins</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isPending ? (
            <div className="h-32 animate-pulse" />
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 p-8 text-center text-sm text-destructive">
              <AlertCircle className="h-6 w-6" />
              Could not load admins.
              <Button
                variant="outline"
                size="sm"
                onClick={() => void refetch()}
              >
                Retry
              </Button>
            </div>
          ) : (
            <div className="w-full">
              <table className={TABLE_CLASS}>
                <thead>
                  <tr className={THEAD_ROW_CLASS}>
                    <th scope="col" className="px-5 py-3 font-semibold">
                      Admin
                    </th>
                    <th scope="col" className="px-5 py-3 font-semibold">
                      Created
                    </th>
                    <th
                      scope="col"
                      className="px-5 py-3 text-right font-semibold"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((admin) => (
                    <AdminRow
                      key={admin.userId}
                      admin={admin}
                      isSelf={admin.userId === user?.id}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

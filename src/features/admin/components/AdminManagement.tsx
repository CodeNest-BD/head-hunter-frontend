"use client";

import { useState } from "react";
import { AlertCircle, KeyRound, Pencil, Trash2, UserPlus } from "lucide-react";

import { useAuth } from "@/features/auth";
import { cn } from "@/shared/libs/shadCnConfig";
import { CountChip } from "@/shared/ui-components/badges/CountChip";
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
  MobileRecordCard,
  MobileRecordList,
} from "@/shared/ui-components/mobile-view/MobileRecordCard";
import {
  TABLE_BODY,
  TABLE_CELL_MAIN,
  TABLE_CELL_SUB,
  TABLE_EL,
  TABLE_HEAD,
  TABLE_ROW,
  TABLE_SCROLL,
  TABLE_TD,
  TABLE_TD_STACKED,
  TABLE_TH,
} from "@/shared/ui-components/data/tableStyles";
import { TableSkeleton } from "@/shared/ui-components/data/TableSkeleton";
import {
  useAdmins,
  useChangeAdminPassword,
  useCreateAdmin,
  useRemoveAdmin,
  useUpdateAdmin,
} from "../hooks/useAdmin";
import type { AdminUser } from "../schemas";

const MIN_PASSWORD = 8;

/** `.field` — label over control, with an optional hint beneath. */
const FIELD_CLASS = "flex flex-col gap-1.5";

/** `.well` — the inline panel a row opens below itself. */
const PANEL_CLASS = "rounded-sm border border-line bg-surface-sub p-3";

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
    <form onSubmit={onSubmit} className="flex max-w-2xl flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className={FIELD_CLASS}>
          <Label htmlFor="new-admin-first">First name</Label>
          <Input
            id="new-admin-first"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
          />
        </div>
        <div className={FIELD_CLASS}>
          <Label htmlFor="new-admin-last">Last name</Label>
          <Input
            id="new-admin-last"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
          />
        </div>
        <div className={FIELD_CLASS}>
          <Label htmlFor="new-admin-email">Email</Label>
          <Input
            id="new-admin-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className={FIELD_CLASS}>
          <Label htmlFor="new-admin-password">Initial password</Label>
          <Input
            id="new-admin-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <p className="text-meta text-ink-faint">
            At least {MIN_PASSWORD} characters.
          </p>
        </div>
      </div>

      {create.isError && (
        <p className="text-meta font-medium text-bad">
          Could not create the admin. The email may already be in use.
        </p>
      )}
      {create.isSuccess && !create.isPending && (
        <p className="text-meta font-medium text-ok">Admin created.</p>
      )}

      <div>
        <Button type="submit" disabled={!valid || create.isPending}>
          <UserPlus />
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
      className={cn(
        PANEL_CLASS,
        "flex flex-col gap-2 sm:flex-row sm:items-end",
      )}
    >
      <div className={cn(FIELD_CLASS, "flex-1")}>
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
      className={cn(PANEL_CLASS, "flex flex-wrap items-end gap-3")}
    >
      <div className={FIELD_CLASS}>
        <Label htmlFor={`first-${admin.userId}`}>First name</Label>
        <Input
          id={`first-${admin.userId}`}
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
          className="w-40"
        />
      </div>
      <div className={FIELD_CLASS}>
        <Label htmlFor={`last-${admin.userId}`}>Last name</Label>
        <Input
          id={`last-${admin.userId}`}
          value={lastName}
          onChange={(event) => setLastName(event.target.value)}
          className="w-40"
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

function AdminName({ admin, isSelf }: { admin: AdminUser; isSelf: boolean }) {
  return (
    <>
      {admin.firstName} {admin.lastName}
      {isSelf && <CountChip className="ml-2">You</CountChip>}
    </>
  );
}

/**
 * The per-row controls and the panel they open, shared by the desktop `<tr>`
 * and the mobile card so the two renderings can never drift apart.
 */
function useAdminRowControls(admin: AdminUser, isSelf: boolean) {
  const remove = useRemoveAdmin();
  const [confirming, setConfirming] = useState(false);
  const [changing, setChanging] = useState(false);
  const [editing, setEditing] = useState(false);

  const actions = (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setEditing((v) => !v)}
      >
        <Pencil />
        Edit
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setChanging((v) => !v)}
      >
        <KeyRound />
        Password
      </Button>
      {!isSelf && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setConfirming(true)}
        >
          <Trash2 />
          Remove
        </Button>
      )}
    </>
  );

  const panel =
    changing || confirming || editing ? (
      <>
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
      </>
    ) : null;

  return { actions, panel };
}

function AdminRow({ admin, isSelf }: { admin: AdminUser; isSelf: boolean }) {
  const { actions, panel } = useAdminRowControls(admin, isSelf);

  return (
    <>
      <tr className={TABLE_ROW}>
        <td className={TABLE_TD_STACKED}>
          <span className={cn(TABLE_CELL_MAIN, "flex items-center")}>
            <AdminName admin={admin} isSelf={isSelf} />
          </span>
          <p className={TABLE_CELL_SUB}>{admin.email}</p>
        </td>
        <td
          className={cn(
            TABLE_TD,
            "whitespace-nowrap tabular-nums text-ink-muted",
          )}
        >
          {formatDate(admin.createdAt)}
        </td>
        <td className={TABLE_TD}>
          <div className="flex items-center justify-end gap-2">{actions}</div>
        </td>
      </tr>
      {panel && (
        <tr>
          <td colSpan={3} className="border-b border-line px-3.5 py-3">
            {panel}
          </td>
        </tr>
      )}
    </>
  );
}

function AdminCard({ admin, isSelf }: { admin: AdminUser; isSelf: boolean }) {
  const { actions, panel } = useAdminRowControls(admin, isSelf);

  return (
    <MobileRecordCard
      title={<AdminName admin={admin} isSelf={isSelf} />}
      subtitle={admin.email}
      fields={[{ label: "Created", value: formatDate(admin.createdAt) }]}
      actions={
        <>
          {actions}
          {panel && <div className="w-full">{panel}</div>}
        </>
      }
    />
  );
}

export function AdminManagement() {
  const { user } = useAuth();
  const { data, isPending, isError, refetch } = useAdmins();

  return (
    <div className="flex flex-col gap-3">
      <Card>
        <CardHeader>
          <CardTitle>Create admin</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateAdminForm />
        </CardContent>
      </Card>

      <Card>
        {/* The roster's title sits on an unruled head — the table's own header
            band is the rule beneath it. */}
        <CardHeader className="border-b-0">
          <CardTitle>Admins</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isPending ? (
            /* The roster is Admin · Created · Actions. Borderless: the card
               around it already draws the frame. */
            <TableSkeleton
              rows={3}
              columns={3}
              className="rounded-none border-0 shadow-none"
            />
          ) : isError ? (
            <div className="m-4 flex max-w-md flex-col gap-3 rounded-sm border border-bad-line bg-bad-bg p-3.5 text-sub text-bad">
              <div className="flex items-center gap-2.5 font-[550]">
                <AlertCircle className="size-[15px] shrink-0" />
                Could not load admins.
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
          ) : (
            <>
              <div className={cn(TABLE_SCROLL, "hidden sm:block")}>
                <table className={TABLE_EL}>
                  <thead className={TABLE_HEAD}>
                    <tr>
                      <th scope="col" className={cn(TABLE_TH, "w-[46%]")}>
                        Admin
                      </th>
                      <th scope="col" className={TABLE_TH}>
                        Created
                      </th>
                      <th scope="col" className={cn(TABLE_TH, "text-right")}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className={TABLE_BODY}>
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
              <MobileRecordList className="sm:hidden">
                {data.map((admin) => (
                  <AdminCard
                    key={admin.userId}
                    admin={admin}
                    isSelf={admin.userId === user?.id}
                  />
                ))}
              </MobileRecordList>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

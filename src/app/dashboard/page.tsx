"use client";

import { useAuth } from "@/features/auth/hooks/useAuth";

export default function DashboardPage() {
  const { user, logout } = useAuth();

  // AuthProvider gates this route: it renders nothing here until the session is
  // authenticated, so `user` is expected to be present. Guard anyway to keep
  // the type honest during the redirect frame.
  if (!user) return null;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Dashboard
        </h1>
        <button
          type="button"
          onClick={() => {
            void logout();
          }}
          className="h-9 rounded-md border border-zinc-200 px-4 text-sm font-medium text-zinc-900 transition hover:border-zinc-400"
        >
          Log out
        </button>
      </div>

      <p className="text-sm text-zinc-500">
        You are signed in. This page proves the end-to-end auth flow.
      </p>

      <dl className="grid grid-cols-[8rem_1fr] gap-y-3 rounded-xl border border-zinc-200 bg-white p-6 text-sm">
        <dt className="font-medium text-zinc-500">ID</dt>
        <dd className="text-zinc-900">{user.id}</dd>
        <dt className="font-medium text-zinc-500">Email</dt>
        <dd className="text-zinc-900">{user.email}</dd>
        <dt className="font-medium text-zinc-500">Role</dt>
        <dd className="capitalize text-zinc-900">{user.role}</dd>
        <dt className="font-medium text-zinc-500">Email verified</dt>
        <dd className="text-zinc-900">{user.emailVerified ? "Yes" : "No"}</dd>
        <dt className="font-medium text-zinc-500">Profile</dt>
        <dd className="text-zinc-900">
          <pre className="overflow-x-auto rounded-md bg-zinc-50 p-3 text-xs">
            {JSON.stringify(user.profile, null, 2)}
          </pre>
        </dd>
      </dl>
    </main>
  );
}

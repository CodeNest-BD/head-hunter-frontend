"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../hooks/useAuth";
import type { Role } from "../types";

interface RequireRoleProps {
  /** A single role, or several when a screen is shared (e.g. disputes). */
  role: Role | Role[];
  children: React.ReactNode;
}

/**
 * Keeps a role off screens meant for the other role.
 *
 * This is UX, not security: the API enforces @Roles regardless, so the worst a
 * bypass achieves is a screen whose requests all 403. AuthProvider has already
 * guaranteed a session by the time this renders.
 */
export function RequireRole({ role, children }: RequireRoleProps) {
  const { user, status } = useAuth();
  const router = useRouter();
  const allowed = Array.isArray(role) ? role : [role];
  const mismatched =
    status === "authenticated" &&
    user !== null &&
    !allowed.includes(user.role);

  useEffect(() => {
    if (mismatched) router.replace("/dashboard");
  }, [mismatched, router]);

  if (status !== "authenticated" || !user || mismatched) return null;
  return <>{children}</>;
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import type { Role } from "@/features/auth/types";

interface RequireRoleProps {
  role: Role;
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
  const mismatched =
    status === "authenticated" && user !== null && user.role !== role;

  useEffect(() => {
    if (mismatched) router.replace("/dashboard");
  }, [mismatched, router]);

  if (status !== "authenticated" || !user || mismatched) return null;
  return <>{children}</>;
}

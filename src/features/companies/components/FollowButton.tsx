"use client";

import { Button } from "@/shared/ui-components/controls/button";
import { useToggleFollow } from "../hooks/useCompanies";

interface FollowButtonProps {
  companyId: string;
  isFollowed: boolean;
}

export function FollowButton({ companyId, isFollowed }: FollowButtonProps) {
  const toggle = useToggleFollow();
  const pending = toggle.isPending;

  return (
    <Button
      type="button"
      variant={isFollowed ? "outline" : "default"}
      size="sm"
      disabled={pending}
      onClick={() => toggle.mutate({ companyId, isFollowed })}
    >
      {pending ? "…" : isFollowed ? "Following" : "Follow"}
    </Button>
  );
}

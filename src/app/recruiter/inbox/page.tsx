"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { RequireApprovedRecruiter, RequireRole } from "@/features/auth";
import { InboxConversationList } from "@/features/inbox";
import { toCandidateStatuses } from "@/features/candidates/schemas";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

function RecruiterInbox() {
  const searchParams = useSearchParams();
  // `?status=offered&status=hired` → the stages to open filtered to.
  const statuses = toCandidateStatuses(searchParams?.getAll("status") ?? []);

  return (
    <InboxConversationList
      // Remount when the URL's stages change. The list takes `initialStatuses`
      // once and then owns the filter, which is what stops a cleared filter
      // being undone by the URL it arrived from — but the App Router
      // re-renders rather than remounts on a search-param-only navigation, so
      // without this, going back to a differently-filtered link would leave
      // the old filter applied while the URL claimed otherwise.
      key={statuses.join(",")}
      side="recruiter"
      initialStatuses={statuses.length > 0 ? statuses : undefined}
    />
  );
}

/**
 * The recruiter's inbox: a flat list of your conversations with companies,
 * most-recent first. Click a row to open the conversation directly.
 *
 * `useSearchParams` needs the Suspense boundary — without it the whole route
 * opts out of static rendering at build time.
 */
export default function RecruiterInboxPage() {
  return (
    <RequireRole role="recruiter">
      <DashboardLayout wide>
        <RequireApprovedRecruiter>
          <Suspense fallback={null}>
            <RecruiterInbox />
          </Suspense>
        </RequireApprovedRecruiter>
      </DashboardLayout>
    </RequireRole>
  );
}

"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { RequireRole } from "@/features/auth";
import { OffersPlacementsBoard } from "@/features/admin";
import { PLACEMENT_VIEWS, type PlacementView } from "@/features/admin/schemas";
import { PageHeader } from "@/shared/ui-components/brand";
import { DashboardLayout } from "@/shared/ui-components/layout/DashboardLayout";

/** Narrows the URL's string to a slice without a cast. */
function toView(value: string | null): PlacementView | undefined {
  return PLACEMENT_VIEWS.find((view) => view === value);
}

function BoardContent() {
  const searchParams = useSearchParams();
  return (
    <OffersPlacementsBoard
      initialView={toView(searchParams.get("view"))}
      initialPlacementId={searchParams.get("placement") ?? undefined}
    />
  );
}

export default function AdminOffersPlacementsPage() {
  return (
    <RequireRole role="admin">
      <DashboardLayout
        wide
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Offers & Placements" },
        ]}
      >
        <div className="flex flex-col gap-4">
          <PageHeader
            title="Offers & Placements"
            subtitle="From offer to paid commission. Each placement anchors joining, the 30-day guarantee, payment and disputes."
          />
          <Suspense fallback={null}>
            <BoardContent />
          </Suspense>
        </div>
      </DashboardLayout>
    </RequireRole>
  );
}

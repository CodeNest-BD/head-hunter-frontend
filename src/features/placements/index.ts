"use client";

// The barrel is a client boundary: it re-exports client-only components/hooks.
export { CompanyPlacementsTable } from "./components/CompanyPlacementsTable";
export { DisputeDialog } from "./components/DisputeDialog";
export { useCompanyPlacements, useRaiseDispute } from "./hooks/usePlacements";
export { placementKeys } from "./keys";
export type { CompanyPlacement } from "./schemas";

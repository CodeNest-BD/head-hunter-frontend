"use client";

// Client boundary: re-exports dispute components and hooks.
export { AdminDisputesTable } from "./components/AdminDisputesTable";
export { AdminDisputeView } from "./components/AdminDisputeView";
export { MyDisputesList } from "./components/MyDisputesList";
export { ParticipantDisputeView } from "./components/ParticipantDisputeView";
export { RaiseDisputeForm } from "./components/RaiseDisputeForm";
export { RaiseDisputePanel } from "./components/RaiseDisputePanel";
export {
  useAdminDisputeAttentionCount,
  useDisputeAttentionCount,
} from "./hooks/useDisputes";
export { disputeKeys } from "./keys";
export { isDisputeOpen } from "./schemas";
export type {
  AdminDisputeDetail,
  AdminDisputeListItem,
  DisputeStatus,
  ParticipantDispute,
} from "./schemas";

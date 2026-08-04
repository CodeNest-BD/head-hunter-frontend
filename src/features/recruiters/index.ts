"use client";

// The barrel is a client boundary: it re-exports hooks and components that use
// client-only React APIs.
export { RecruiterProfileForm } from "./components/RecruiterProfileForm";
export { ReferencesSection } from "./components/ReferencesSection";
export { SubscriptionCard } from "./components/SubscriptionCard";
export {
  useAddReference,
  useDevActivateSubscription,
  useMyRecruiterProfile,
  useRemoveReference,
  useUpdateMyRecruiterProfile,
} from "./hooks/useRecruiterProfile";
export { recruiterKeys } from "./keys";
export type {
  RecruiterProfile,
  RecruiterReference,
  Specialization,
} from "./schemas";
export { SPECIALIZATION_LABELS } from "./schemas";

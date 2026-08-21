"use client";

// The barrel is a client boundary: it re-exports hooks and components that use
// client-only React APIs.
export { RecruiterProfileForm } from "./components/RecruiterProfileForm";
export { ReferencesSection } from "./components/ReferencesSection";
export { SubscriptionCard } from "./components/SubscriptionCard";
export { VerificationBanner } from "./components/VerificationBanner";
export {
  useAddReference,
  useDevActivateSubscription,
  useMyRecruiterProfile,
  useReapplyRecruiterVerification,
  useRemoveReference,
  useUpdateMyRecruiterProfile,
} from "./hooks/useRecruiterProfile";
export { useIsVerifiedRecruiter } from "./hooks/useIsVerifiedRecruiter";
export { useVerificationGate } from "./hooks/useVerificationGate";
export { recruiterKeys } from "./keys";
export type {
  RecruiterProfile,
  RecruiterReference,
  VerificationStatus,
} from "./schemas";

import { Suspense } from "react";

import { SignUpForm } from "@/features/auth";

/**
 * The form reads `?role=` during render to skip the account-type step, and
 * `useSearchParams` forces a client bailout when it does. Without this boundary
 * the whole page fails to prerender at build time.
 */
export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <SignUpForm />
    </Suspense>
  );
}

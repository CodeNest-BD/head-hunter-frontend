/**
 * Sentry initializes only in deployed environments. Local/dev runs skip it so
 * developer noise never reaches the shared project. Scaffold-level helper
 * consumed by the sentry.*.config.ts entrypoints.
 */
export const shouldInitializeSentry = (): boolean => {
  return (
    process.env.NEXT_PUBLIC_ENVIRONMENT === "staging" ||
    process.env.NEXT_PUBLIC_ENVIRONMENT === "production"
  );
};

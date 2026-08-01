// Build-time Sentry options consumed by next.config.js via withSentryConfig.
// Kept lean: source-map upload and the JSX AST rewrite are the two biggest
// contributors to build heap/time, so both stay off until a real need appears.
module.exports = {
  sentryConfig: {
    org: process.env.NEXT_PUBLIC_SENTRY_ORG,
    project: process.env.NEXT_PUBLIC_SENTRY_PROJECT,
    silent: !process.env.CI,
    hideSourceMaps: true,
    disableLogger: true,
    sourcemaps: {
      disable: process.env.NEXT_PUBLIC_ENVIRONMENT !== "production",
    },
    widenClientFileUpload: false,
    reactComponentAnnotation: {
      enabled: false,
    },
  },
};

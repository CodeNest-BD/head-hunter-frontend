const { withSentryConfig } = require("@sentry/nextjs");
const { sentryConfig } = require("./src/shared/libs/sentryConfig");

// Enabled only when ANALYZE=true (see `npm run analyze`). Opens an
// interactive treemap of each chunk so we can see what actually ships to
// the browser and which heavy libs land in first-load JS.
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
  // Write the static treemap to .next/analyze/*.html instead of trying to
  // spawn a browser — keeps CI and headless runs from hanging.
  openAnalyzer: false,
});

const baseConfig = {
  swcMinify: true,
  output: "standalone",
  reactStrictMode: true,
  // Type-checking and lint run in a dedicated CI job (`ci.yml`) so they
  // don't block the docker build. Removing them shaves ~60-120s off
  // `next build` walltime and frees heap for the actual compile.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    // `webpackBuildWorker` would spawn a separate Node process per
    // webpack target. On the standard 2 vCPU / 7 GB GitHub-hosted
    // runner that means two ~5 GB heaps competing for memory and
    // CPU — net OOM risk and no real wall-clock win on 2 cores.
    // Re-enable only if/when we move to a 4+ core runner.
    //
    // Tree-shake heavy barrel-exported deps. Each entry teaches Next to
    // resolve `import { x } from "lib"` to the specific submodule and
    // skip the rest. Big wins for icons / lodash / firebase / syncfusion.
    optimizePackageImports: [
      "lodash",
      "firebase",
      "@react-pdf-viewer/core",
      "@react-pdf-viewer/default-layout",
      "@react-pdf-viewer/highlight",
      "@syncfusion/ej2-react-charts",
      // Barrel-exported icon/date/chart libs used across the app.
      // lucide-react alone is imported in 450+ files — without this, a
      // single icon import pulls the whole barrel into the chunk.
      "lucide-react",
      "date-fns",
      "recharts",
    ],
  },
  transpilePackages: ["@react-pdf-viewer/core"],
  images: {
    // Add this project's remote image hosts here
    // (e.g. your Supabase storage domain, CloudFront distribution, or S3 bucket).
    domains: [],
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
        canvas: false,
      };
    }
    if (isServer) {
      config.resolve.alias["pdfjs-dist"] = false;
    }
    return config;
  },
};

const isSentryEnabled =
  process.env.NEXT_PUBLIC_ENVIRONMENT === "staging" ||
  process.env.NEXT_PUBLIC_ENVIRONMENT === "production";

module.exports = async () => {
  const { default: withSerwistInit } = await import("@serwist/next");

  const withSerwist = withSerwistInit({
    swSrc: "src/app/sw.ts",
    swDest: "public/sw.js",
    disable: false,
    register: false,
  });

  const withSerwistConfig = withSerwist(baseConfig);
  const analyzedConfig = withBundleAnalyzer(withSerwistConfig);

  return isSentryEnabled
    ? withSentryConfig(analyzedConfig, sentryConfig)
    : analyzedConfig;
};

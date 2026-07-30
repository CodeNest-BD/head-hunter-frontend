import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  // Match Next's automatic JSX runtime so components that don't import React
  // (the app's default) render under test without a "React is not defined"
  // error. Classic-runtime files that `import React` still work unchanged.
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react",
  },
  test: {
    exclude: ["e2e/**", "node_modules/**", "dist/**"],
    setupFiles: ["./src/test/setupTest.ts"],
    environment: "jsdom",
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

// Settings for `npm test` (Vitest + React Testing Library).
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Use React's automatic JSX (same as Next.js), so test files
  // don't need `import React from "react"`.
  esbuild: { jsx: "automatic" },
  resolve: {
    // Lets tests use the same "@/lib/api" style imports as the app.
    alias: { "@": path.resolve(__dirname, ".") },
  },
  test: {
    environment: "jsdom", // a fake browser (document, window, localStorage)
    setupFiles: ["./vitest.setup.ts"],
    include: ["__tests__/**/*.test.{ts,tsx}"],
  },
});

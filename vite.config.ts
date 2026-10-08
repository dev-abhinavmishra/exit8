import { defineConfig } from "vitest/config";

// base "./" keeps the bundle deployable from any static path (GH Pages,
// Netlify, sub-path preview). e2e verifies a non-root base explicitly.
export default defineConfig({
  base: "./",
  build: {
    target: "es2022",
    sourcemap: true,
    chunkSizeWarningLimit: 4000,
    rollupOptions: {
      output: {
        manualChunks: {
          babylon: ["@babylonjs/core"],
        },
      },
    },
  },
  test: {
    include: ["tests/unit/**/*.spec.ts"],
  },
});

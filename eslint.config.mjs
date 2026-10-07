import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    ignores: ["dist/", "node_modules/", "test-results/", "playwright-report/", "coverage/"],
  },
  {
    files: ["**/*.{ts,mts,mjs}"],
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
  {
    files: ["tools/**/*.mjs", "playwright.config.ts", "tests/e2e/**"],
    languageOptions: { globals: { ...globals.node } },
    rules: { "no-console": "off" },
  },
);

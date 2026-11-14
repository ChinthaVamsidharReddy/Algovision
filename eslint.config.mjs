import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "**/coverage/**",
      "**/generated/**",
      "apps/web/public/pyodide/**",
      "apps/api/**",
      "packages/algorithms/content/**",
      "apps/web/e2e-output/**",
      "apps/web/next-env.d.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": "error",
      eqeqeq: ["error", "always"],
    },
  },
  {
    files: ["**/*.mjs", "**/*.js"],
    languageOptions: {
      globals: { process: "readonly", console: "readonly" },
    },
  },
  {
    // Browser Web Workers for the practice page: plain scripts with worker globals.
    files: ["apps/web/public/practice/*.js"],
    languageOptions: {
      sourceType: "script",
      globals: { self: "readonly", importScripts: "readonly", loadPyodide: "readonly", fetch: "readonly", performance: "readonly", console: "writable", setTimeout: "readonly" },
    },
  },
  {
    // e2e scripts run in Node but pass functions to page.evaluate, which execute in the browser.
    files: ["apps/web/e2e/**/*.mjs"],
    languageOptions: {
      globals: {
        document: "readonly",
        window: "readonly",
        performance: "readonly",
        requestAnimationFrame: "readonly",
        getComputedStyle: "readonly",
        setTimeout: "readonly",
        fetch: "readonly",
        localStorage: "readonly",
        URL: "readonly",
        Buffer: "readonly",
      },
    },
  },
);

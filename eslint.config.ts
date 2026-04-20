import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import pluginJsxA11y from "eslint-plugin-jsx-a11y";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores([
    ".tanstack/**/*",
    ".output/**/*",
    ".nitro/**/*",
    "e2e/seed/**/*",
    "test-results/**/*",
    "playwright-report/**/*",
    "playwright/.cache/**/*",
  ]),
  {
    settings:{
      react:{
        version: "detect"
      }
    }
  },  
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: { globals: globals.browser }
  },
  tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  pluginReact.configs.flat['jsx-runtime'],
  (pluginJsxA11y.flatConfigs as Record<string, unknown>).recommended as Record<string, unknown>,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", {
        "args": "after-used",
        "caughtErrors": "none",
        "varsIgnorePattern": "^_",
        "destructuredArrayIgnorePattern": "^_"
      }],
      "max-lines": ["error", {
        "max": 300,
        "skipBlankLines": true,
        "skipComments": true
      }],
      // Code complexity rules for architectural analysis
      "complexity": ["error", { "max": 10 }],
      "max-params": ["error", { "max": 4 }],
      "max-depth": ["error", { "max": 4 }],
      "max-nested-callbacks": ["error", { "max": 3 }],
      "max-statements": ["error", { "max": 20 }],
      "max-lines-per-function": ["error", { "max": 100, "skipBlankLines": true, "skipComments": true }],
      // React rules to catch structural issues
      "react/no-unknown-property": "error",
      "react/void-dom-elements-no-children": "error",
      "react/no-danger-with-children": "error",
      "react/no-unescaped-entities": "error",
      "react/no-children-prop": "error",
      // JSX accessibility rules that also catch HTML structure issues
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/heading-has-content": "error",
      "jsx-a11y/anchor-has-content": "error",
      "jsx-a11y/iframe-has-title": "error",
      "jsx-a11y/img-redundant-alt": "error",
      "jsx-a11y/no-redundant-roles": "error"
    }
  },
  // Relaxed rules for test files - nested describe/it blocks are normal
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx"],
    rules: {
      "max-lines": "off",
      "max-nested-callbacks": ["error", { "max": 5 }],
      "max-lines-per-function": "off",
      "max-statements": "off",
    }
  },
  // Node-runtime scripts (one-shot data-prep tools). They use `process`,
  // `console`, and large procedural `main()` functions by nature.
  {
    files: ["scripts/**/*.{js,mjs,cjs,ts}"],
    languageOptions: { globals: globals.node },
    rules: {
      "max-statements": "off",
      "max-lines-per-function": "off",
    }
  },
  // Field-graph engine is being introduced in stages (see
  // docs/field-graph/EPIC-migration.md). Early commits intentionally land
  // dead exports / placeholder catalogs that downstream commits will wire
  // up; relax unused-vars here until phase 2 starts consuming them.
  {
    files: ["src/shared/domain/field-graph/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
    }
  }
]);

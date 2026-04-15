import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import obsidianmd from "eslint-plugin-obsidianmd";
import tseslint from "typescript-eslint";

export default defineConfig([
  {
    ignores: ["dist/**", "node_modules/**"]
  },
  {
    ...js.configs.recommended,
    languageOptions: {
      globals: {
        console: "readonly",
        document: "readonly",
        navigator: "readonly",
        process: "readonly",
        window: "readonly"
      }
    }
  },
  ...tseslint.configs.recommended,
  ...obsidianmd.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    rules: {
      "@typescript-eslint/no-deprecated": "off"
    }
  },
  {
    files: ["package.json"],
    rules: {
      "obsidianmd/ui/sentence-case": "off"
    }
  }
]);

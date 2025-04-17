import { defineConfig } from "@eslint/config-helpers";
import js from "@eslint/js";
import prettier from "eslint-plugin-prettier/recommended";

export default defineConfig([
    js.configs.recommended,
    {
        files: ["**/*.{js,mjs,cjs,jsx,ts,tsx}"],
        plugins: {
            prettier: prettier,
        },
        rules: {
            "prettier/prettier": "error",
            "no-unused-vars": "warn",
            "no-console": "warn",
            "no-undef": "error",
            "prefer-const": "warn",
            "no-constant-binary-expression": "error"
        },
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
        }
    },
    {
        ignores: ["**/node_modules/", "dist/", "build/", ".git/"]
    }
]);
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    rules: {
      // TypeScript rules
      "@typescript-eslint/no-explicit-any": "warn", // Change from error to warning
      "@typescript-eslint/no-unused-vars": "warn", // Change from error to warning
      "@typescript-eslint/ban-ts-comment": "warn", // Change from error to warning

      // React rules
      "react/no-unescaped-entities": "off", // Disable unescaped entities rule
      "react-hooks/exhaustive-deps": "warn", // Change from error to warning

      // General ESLint rules
      "no-unused-vars": "warn", // Change from error to warning
    },
  },
];

export default eslintConfig;

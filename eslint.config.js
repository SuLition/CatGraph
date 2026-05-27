import js from "@eslint/js";
import vue from "eslint-plugin-vue";
import vueTsConfig from "@vue/eslint-config-typescript";
import prettierConfig from "eslint-config-prettier";

export default [
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "src-tauri/target/**",
      "src-tauri/gen/**",
      "design-source/**",
      "*.config.{js,ts,mjs,cjs}",
    ],
  },
  js.configs.recommended,
  ...vue.configs["flat/recommended"],
  ...vueTsConfig(),
  prettierConfig,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        navigator: "readonly",
      },
    },
    rules: {
      "vue/multi-word-component-names": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
];

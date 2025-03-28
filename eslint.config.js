// eslint.config.js
import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReactConfig from "eslint-plugin-react/configs/recommended.js";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginReactRefresh from "eslint-plugin-react-refresh";


export default [
  { files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"] }, // Apply globally first

  // Ignore node_modules, dist, etc.
  { ignores: ["dist/", "node_modules/", ".env", "*.lock", "*.log"] },

  // Base configurations (JS Recommended, TS Recommended)
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,

  // React specific configuration
  {
    files: ["**/*.{jsx,tsx}"], // Apply only to JSX/TSX files
    ...pluginReactConfig, // Use React recommended rules
    languageOptions: {
      ...pluginReactConfig.languageOptions, // Inherit React parser options
      parserOptions: {
        ecmaFeatures: { jsx: true }, // Ensure JSX is enabled
      },
      globals: { ...globals.browser } // Add browser globals
    },
    settings: {
      react: { version: "detect" } // Automatically detect React version
    },
    plugins: {
      "react-hooks": pluginReactHooks,
      "react-refresh": pluginReactRefresh,
    },
    rules: {
      // React Hooks rules
      ...pluginReactHooks.configs.recommended.rules,
      // React Refresh rule
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      // Add or override other rules as needed
      "react/react-in-jsx-scope": "off", // Not needed with new JSX transform
      "react/jsx-uses-react": "off", // Not needed with new JSX transform
      "@typescript-eslint/no-explicit-any": "warn", // Warn instead of error for 'any'
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }], // Warn unused vars, allow underscore prefix
    }
  },
];
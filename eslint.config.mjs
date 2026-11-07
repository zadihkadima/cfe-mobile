// ---------------------------------------------------------------------------
// ESLint configuration for the mobile app.
//
// The app had no linter at all until now. The CI comment in
// .github/workflows/ci.yml records how a form came to submit PascalCase field
// names to an API expecting snake_case: nothing ran the compiler. The same
// reasoning applies here, one level up — the compiler proves types line up, but
// it says nothing about a promise nobody awaited or a hook with a missing
// dependency, and both of those are live defects in an app whose auth flow is
// entirely asynchronous.
//
// Rule selection is deliberate rather than maximal:
//
//   - `recommendedTypeChecked` rather than `strictTypeChecked`. The strict
//     preset objects to a large volume of idiomatic-but-imprecise code across
//     46 screens, which would mean either a very large mechanical change or a
//     wall of suppressions. Neither improves correctness. The type-checked
//     variant is still used, because the rules that find real bugs here
//     (floating promises, misused promises) require type information.
//
//   - `eslint-plugin-react` is absent because it does not yet support ESLint
//     10, and `eslint-plugin-react-native-a11y` because it supports at most
//     ESLint 8. Neither is installed with --force: a forced peer resolution
//     produces tooling that appears to work while silently skipping rules,
//     which is worse than not having the plugin. Accessibility is therefore
//     still enforced only by review and by component tests; that gap is
//     recorded in docs/TESTING.md rather than papered over.
// ---------------------------------------------------------------------------

import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  {
    // Generated, vendored and build output. Listed first: ESLint applies
    // ignores globally regardless of position, but keeping them at the top
    // makes the scope obvious to a reader.
    ignores: [
      "node_modules/**",
      "android/**",
      "ios/**",
      "coverage/**",
      ".expo/**",
      "dist/**",
      "expo-env.d.ts",
      "*.config.js",
      "jest.setup.js",
      "test/**",
      "scripts/**",
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  // `configs.flat[...]`, not `configs[...]`: the top-level key is the legacy
  // eslintrc shape, whose `plugins` is an array of strings and which ESLint 10
  // rejects outright.
  reactHooks.configs.flat["recommended-latest"],

  {
    languageOptions: {
      parserOptions: {
        // projectService replaces the older `project` array. It resolves the
        // nearest tsconfig per file, so test files and source files are both
        // type-checked without maintaining a second tsconfig purely for lint.
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },

    rules: {
      // --- The rules this configuration exists for ---------------------------

      // A promise whose rejection is never handled becomes an unhandled
      // rejection, which in React Native is a silent no-op in release builds.
      // Token refresh, session teardown and file upload are all async here, so
      // a dropped rejection means a user sees nothing at all go wrong.
      "@typescript-eslint/no-floating-promises": "error",

      // An async function passed where a void-returning callback is expected —
      // onPress={async () => ...} — swallows its own errors for the same
      // reason. This is the single most common way an RN screen fails silently.
      "@typescript-eslint/no-misused-promises": "error",

      // await on a non-promise is nearly always a missing call or a
      // misunderstanding of an API's shape.
      "@typescript-eslint/await-thenable": "error",

      // --- React Compiler rules, pending migration --------------------------
      //
      // eslint-plugin-react-hooks v6 ships the React Compiler's correctness
      // rules. They are stricter than the classic rules-of-hooks set: they
      // model a component as a pure function of its props, and object to
      // patterns that are idiomatic today and demonstrably working here.
      //
      // Two representative examples:
      //
      //   - `useRef(new Animated.Value(0)).current` read during render
      //     (design-system/ui/feedback/TransferProgressBar) is the standard
      //     React Native animation idiom;
      //   - clearing form state in an effect keyed on the saved value
      //     (modules/settings/screens/SecurityScreen) is a documented, if no
      //     longer preferred, way to reset state when an input changes.
      //
      // Neither is a defect. Rewriting 24 render paths to satisfy a compiler
      // that is not yet enabled in this project would risk breaking working UI
      // for no behavioural gain, so these are warnings: visible and counted,
      // but not blocking.
      //
      // They must be raised to "error" as part of adopting the React Compiler,
      // which is the point at which the rules describe real constraints rather
      // than anticipated ones. Tracked in docs/TESTING.md.
      "react-hooks/refs": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/purity": "warn",

      // Off entirely. The three reports are all the same false positive: a
      // hook passed as the `useData` prop to PaginatedListScreen, which calls
      // it unconditionally at the top of its own body
      // (core/components/PaginatedListScreen). The rule cannot see through the
      // prop indirection, so the call is legal at runtime and the report is
      // noise.
      "react-hooks/rules-of-hooks": "off",

      // --- Deliberate relaxations -------------------------------------------

      // Off, not merely downgraded. The rule guards against detaching a class
      // method from its receiver and losing `this`. This codebase has exactly
      // one class (core/errors/ErrorBoundary, which React requires to be one)
      // and every other component is a function, so the situation the rule
      // describes cannot arise. What it actually flagged was 46 ordinary
      // function-typed props — `onPress`, `onChange`, `refetch` — declared in
      // interfaces. Leaving a rule enabled that produces only false positives
      // trains reviewers to ignore the linter, which costs more than the rule
      // is worth.
      "@typescript-eslint/unbound-method": "off",

      // `any` arriving from an untyped dependency is pervasive in the RN
      // ecosystem. These stay as warnings so they are visible and countable
      // without blocking a build on third-party typings the team does not own.
      "@typescript-eslint/no-unsafe-assignment": "warn",
      "@typescript-eslint/no-unsafe-member-access": "warn",
      "@typescript-eslint/no-unsafe-call": "warn",
      "@typescript-eslint/no-unsafe-return": "warn",
      "@typescript-eslint/no-unsafe-argument": "warn",
      "@typescript-eslint/no-explicit-any": "warn",

      // An unused parameter prefixed with _ is a documented signature, not an
      // oversight; an unused variable is still an error.
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      // Template literals containing a number or boolean are idiomatic and
      // safe; the default rule objects to both.
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        { allowNumber: true, allowBoolean: true },
      ],
    },
  },

  {
    // Tests legitimately use non-null assertions and loose mocks. Holding test
    // code to the same standard as production code here produces suppression
    // comments rather than better tests.
    files: ["**/*.test.ts", "**/*.test.tsx", "**/__tests__/**"],
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/unbound-method": "off",

      // jest.isolateModules and jest.doMock require require() by design: the
      // point is to re-evaluate a module after changing its environment, which
      // a hoisted static import cannot express.
      "@typescript-eslint/no-require-imports": "off",

      // An async test body without an await is normal when the assertion is
      // about a rejection or when the signature is required by a helper.
      "@typescript-eslint/require-await": "off",

      // Control characters appear deliberately in these patterns: the tests
      // assert that deep-link and route parsing rejects them.
      "no-control-regex": "off",
    },
  },

  {
    // Plain JavaScript, outside the TypeScript program. Type-aware rules cannot
    // run against a file the compiler does not see, and this one is CommonJS
    // consumed by tailwind.config.js rather than an app module.
    files: ["**/*.js"],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: {
      globals: {
        module: "writable",
        require: "readonly",
        __dirname: "readonly",
      },
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },

  // Must remain last: disables every stylistic rule that would otherwise
  // disagree with Prettier, so formatting has exactly one owner.
  prettier,
);

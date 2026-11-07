/**
 * Jest configuration for the mobile app.
 *
 * `jest-expo` is used rather than a bare `react-native` preset because it is
 * the configuration Expo actually tests its own SDK against, so it already
 * understands the module resolution, asset handling and platform extensions
 * this project relies on.
 */
module.exports = {
  preset: "jest-expo",

  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],

  // Composes React Native's resolver with Reanimated's, since Jest takes only
  // one and this project needs both. See test/jestResolver.js.
  resolver: "<rootDir>/test/jestResolver.js",

  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "\\.css$": "<rootDir>/test/styleMock.js",

    // Jest resolves this package to its `module` field, which is a `.mjs`
    // bundle the preset's transform pattern (`\.[jt]sx?$`) does not match, so
    // it reaches the runtime as raw ESM and throws on the first `export`.
    // Pointing at the CommonJS build the package already ships is preferable
    // to widening the transform to `.mjs`, which would pull every other ESM
    // dependency through Babel and slow the whole suite for one import.
    "^lucide-react-native$":
      "<rootDir>/node_modules/lucide-react-native/dist/cjs/lucide-react-native.js",
  },

  // Most of the React Native ecosystem ships untranspiled ESM, so the default
  // "ignore all of node_modules" rule has to be narrowed or nothing imports.
  // `immer` and `redux` are included because Redux Toolkit pulls them in as
  // ESM-only builds. `lucide-react-native` and `react-native-reanimated` are
  // here for the same reason, and their absence was a trap rather than a gap:
  // fourteen files already import lucide icons, so the first test written
  // against any screen would have failed on a syntax error in node_modules
  // with nothing to suggest the cause was configuration.
  //
  // `react-redux` was exactly that trap in practice. Jest resolves it to
  // `react-redux.legacy-esm.js` and threw "Cannot use import statement outside
  // a module" on the first screen test, pointing at the test file rather than
  // at this list. Every screen reaches a `Provider`, so this one omission
  // blocked screen testing entirely.
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|react-native-css-interop|nativewind|@tanstack/.*|immer|redux|redux-thunk|reselect|react-redux|@reduxjs/.*|lucide-react-native|react-native-reanimated|react-native-worklets)",
  ],

  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/app/**",
  ],

  // A ratchet floor, not a target.
  //
  // Measured coverage is 32.7% of statements, 32.4% of branches, 26.1% of
  // functions and 32.6% of lines. These thresholds sit just underneath, so the
  // suite passes today and fails the moment coverage regresses. Without them
  // `test:coverage` printed a number that no one was obliged to act on, and a
  // pull request could delete tests without any check objecting.
  //
  // Raise these whenever real coverage rises. The number follows the tests; it
  // never leads them. They were last raised when PaginatedListScreen and the
  // drawer row gained tests -- the two components behind a create button that
  // was reported missing and a menu that would not open. The genuine gap is
  // that most screens still have no test at all, which is tracked in
  // docs/TESTING.md rather than papered over with an unreachable threshold.
  //
  // Branches and functions are held a point below what is measured rather than
  // pinned to it. At 30.02% and 25.04% the margin is a hundredth of a percent,
  // and a floor that tight stops being a regression check and becomes a build
  // that breaks on rounding, which teaches people to lower the number instead
  // of reading it.
  coverageThreshold: {
    global: {
      statements: 32,
      branches: 31,
      functions: 26,
      lines: 32,
    },
  },

  testMatch: ["<rootDir>/src/**/*.test.{ts,tsx}"],

  clearMocks: true,
  restoreMocks: true,
};

const reactNativeResolver = require("@react-native/jest-preset/jest/resolver");
const workletsResolver = require("react-native-worklets/jest/resolver");

/**
 * Composes the two module resolvers this project needs, because Jest accepts
 * only one.
 *
 * `jest-expo` sets React Native's resolver, which is required for `react-native`
 * subpath imports to resolve at all. Reanimated 4 needs a second one: its
 * worklets runtime ships `.native.ts` files that assume a native TurboModule,
 * and Jest's `defaultPlatform: "ios"` picks exactly those. The result is a
 * constructor throwing at import time, so any file importing Reanimated fails
 * to load — not the animation failing, the whole module.
 *
 * The worklets resolver strips the native extensions so the plain JavaScript
 * implementation is chosen instead. Delegating to React Native's resolver
 * afterwards keeps its `packageFilter` behaviour intact; replacing it outright
 * would trade one broken import for another.
 */
module.exports = (request, options) => {
  return workletsResolver(request, {
    ...options,

    // React Native's resolver reads `defaultResolver` off the options it is
    // handed, and the worklets resolver forwards its own options through. Left
    // alone that would make React Native's resolver call itself forever, so
    // Jest's real resolver is pinned back in place explicitly.
    defaultResolver: (nestedRequest, nestedOptions) =>
      reactNativeResolver(nestedRequest, {
        ...nestedOptions,
        defaultResolver: options.defaultResolver,
      }),
  });
};

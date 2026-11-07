const variants = {
  development: {
    name: "CFE Portal Dev",
    packageSuffix: ".dev",
    scheme: "cfe-dev",
  },
  preview: {
    name: "CFE Portal Preview",
    packageSuffix: ".preview",
    scheme: "cfe-preview",
  },
  production: {
    // Display name only. The package name, bundle identifier and slug stay on
    // "cfemobile"/"cfe-mobile": those are identity, not branding. Changing
    // them would produce a different app -- existing installs would not
    // update, and the FCM registration in google-services.json would stop
    // matching, which takes push down with it.
    name: "CFE Portal",
    packageSuffix: "",
    scheme: "cfe",
  },
};

const baseConfig = {
  name: "CFE Portal",
  slug: "cfe-mobile",
  version: "1.0.0",
  scheme: "cfe",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.sayeedkhalshi.cfemobile",
  },
  android: {
    softwareKeyboardLayoutMode: "resize",
    /*
     * A path, not the contents: prebuild copies this into android/app/, which
     * is what lets the installed app register with FCM. Without it
     * getExpoPushTokenAsync throws and no token is ever recorded, no matter
     * how the server-side credentials are set up.
     *
     * Read from the environment first because the file is a credential and so
     * is gitignored -- on an EAS builder it arrives as a file secret at a
     * path only that build knows, and the literal below would not exist.
     */
    googleServicesFile:
      process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json",
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundImage: "./assets/android-icon-background.png",
      monochromeImage: "./assets/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
    package: "com.sayeedkhalshi.cfemobile",
  },
  web: {
    favicon: "./assets/favicon.png",
    bundler: "metro",
  },
  plugins: [
    "expo-router",
    "./plugins/withAndroidVariants",
    "expo-secure-store",
    "expo-sharing",
    "@react-native-community/datetimepicker",
    [
      "expo-splash-screen",
      {
        // Matches `launchBackground` in the default (slate) theme.
        //
        // Two reasons, and the first is a plain defect. splash-icon.png is a
        // near-white mark, averaging rgb(214,214,219). Against the previous
        // #E6F4FE it reached 1.29:1 -- white on almost-white, so the logo was
        // not dim, it was invisible, and the app opened on what looked like a
        // blank pale screen. On this background it reaches 10.9:1.
        //
        // Second, this is the colour the in-app launch screen continues in.
        // The native splash is drawn before any JavaScript runs, so it cannot
        // follow the selected theme; keeping it on the default theme's launch
        // colour means the handover is seamless for everyone who has not
        // changed themes, and a single clean cut rather than a flash of pale
        // blue for everyone who has.
        backgroundColor: "#0F243B",
        image: "./assets/splash-icon.png",
        imageWidth: 160,
      },
    ],
    [
      // Without this the module is present in JavaScript but nothing is added
      // to the native project: no FCM receiver, no notification icon, and --
      // the part that actually stops delivery -- no POST_NOTIFICATIONS
      // permission, which Android 13 and later require before a permission
      // request can be granted at all. The failure is silent, because asking
      // for a permission that was never declared simply returns "denied".
      "expo-notifications",
      {
        // The monochrome mark rather than the full icon: Android draws the
        // notification icon as a silhouette, so anything with colour or
        // detail arrives as a white blob.
        icon: "./assets/android-icon-monochrome.png",
        color: "#0F243B",
      },
    ],
    [
      "expo-build-properties",
      {
        android: {
          buildArchs: ["armeabi-v7a", "arm64-v8a"],
          enableBundleCompression: true,
          enableMinifyInReleaseBuilds: true,
          enableShrinkResourcesInReleaseBuilds: true,
          useLegacyPackaging: true,
        },
      },
    ],
  ],
  extra: {
    apiUrl: {},
    wsUrl: {},
    router: {},
    eas: {
      projectId: "fb2112aa-68cb-420c-85c6-a19fa0af60a8",
    },
  },
};

module.exports = () => {
  const variantName = process.env.APP_VARIANT ?? "development";
  const variant = variants[variantName];

  if (!variant) {
    throw new Error(`Unknown APP_VARIANT: ${variantName}`);
  }

  const config = structuredClone(baseConfig);

  config.name = variant.name;
  config.scheme = variant.scheme;
  config.ios.bundleIdentifier = `com.sayeedkhalshi.cfemobile${variant.packageSuffix}`;

  return config;
};
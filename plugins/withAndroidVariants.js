const fs = require("fs");
const path = require("path");
const {
  withAndroidManifest,
  withAppBuildGradle,
  withDangerousMod,
} = require("@expo/config-plugins");

const FLAVOR_CONFIGURATION = `
    flavorDimensions "environment"
    productFlavors {
        development {
            dimension "environment"
            applicationIdSuffix ".dev"
            versionNameSuffix "-dev"
            manifestPlaceholders = [appScheme: "cfe-dev"]
            resValue "string", "app_name", "CFE Portal Dev"
        }
        preview {
            dimension "environment"
            applicationIdSuffix ".preview"
            versionNameSuffix "-preview"
            manifestPlaceholders = [appScheme: "cfe-preview"]
            resValue "string", "app_name", "CFE Portal Preview"
        }
        production {
            dimension "environment"
            manifestPlaceholders = [appScheme: "cfe"]
            resValue "string", "app_name", "CFE Portal"
        }
    }
`;

const DEVELOPMENT_INSTALL_ALIAS = `
tasks.register("installDebug") {
  group = "install"
  description = "Installs the development debug build for Expo CLI compatibility."
  dependsOn("installDevelopmentDebug")
}
`;

function withAndroidVariants(config) {
  config = withDangerousMod(config, ["android", async (modConfig) => {
    const wrapperPath = path.join(
      modConfig.modRequest.platformProjectRoot,
      "gradle/wrapper/gradle-wrapper.properties",
    );
    const wrapper = fs.readFileSync(wrapperPath, "utf8").replace(
      /distributionUrl=https\\:\/\/services\.gradle\.org\/distributions\/gradle-[^-]+-bin\.zip/,
      "distributionUrl=https\\://services.gradle.org/distributions/gradle-8.13-bin.zip",
    );
    fs.writeFileSync(wrapperPath, wrapper);

    return modConfig;
  }]);

  config = withAppBuildGradle(config, (gradleConfig) => {
    if (!gradleConfig.modResults.contents.includes('flavorDimensions "environment"')) {
      gradleConfig.modResults.contents = gradleConfig.modResults.contents.replace(
        "    signingConfigs {",
        `${FLAVOR_CONFIGURATION}    signingConfigs {`,
      );
    }

    if (!gradleConfig.modResults.contents.includes('tasks.register("installDebug")')) {
      gradleConfig.modResults.contents += `\n${DEVELOPMENT_INSTALL_ALIAS}`;
    }

    return gradleConfig;
  });

  return withAndroidManifest(config, (manifestConfig) => {
    const application = manifestConfig.modResults.manifest.application?.[0];
    const mainActivity = application?.activity?.find(
      (activity) => activity.$?.["android:name"] === ".MainActivity",
    );

    if (!mainActivity) {
      throw new Error("Unable to find MainActivity while configuring Android variants.");
    }

    for (const intentFilter of mainActivity["intent-filter"] ?? []) {
      for (const data of intentFilter.data ?? []) {
        if (["cfe", "cfe-dev", "cfe-preview"].includes(data.$?.["android:scheme"])) {
          data.$["android:scheme"] = "${appScheme}";
        }
      }
    }

    return manifestConfig;
  });
}

module.exports = withAndroidVariants;

.PHONY: start start-android start-ios android ios
.PHONY: apk apk-production build-android build-ios build-all
.PHONY: submit-ios push-secret push-logs

# ============================================================
# Local development
# ============================================================

# Start the Expo development server.
# Scan the QR code with a compatible development build.
start:
	npx expo start --dev-client

# Start the server and open the connected Android device.
android start-android:
	npx expo start --dev-client --android

# Start the server for iOS development.
# On Linux, scan the QR code on a physical iPhone.
# On macOS, use: npx expo start --dev-client --ios
ios start-ios:
	npx expo start --dev-client

# ============================================================
# Android builds
# ============================================================

# Build an internal-testing APK using the preview profile.
apk:
	npx eas-cli@latest build --platform android --profile preview

# Build the production APK for direct installation.
# Prebuild first to catch missing files and broken plugins locally.
apk-production:
	APP_VARIANT=production npx expo prebuild --clean --platform android
	npx eas-cli@latest build --platform android --profile production-apk

# Android AAB for Google Play Store
aab-production:
	APP_VARIANT=production npx expo prebuild --clean --platform android
	npx eas-cli@latest build --platform android --profile production

# Build the production Android App Bundle for Google Play.
build-android:
	APP_VARIANT=production npx eas-cli@latest build --platform android --profile production

# ============================================================
# iOS builds and App Store submission
# ============================================================

# Build the production iOS app in the EAS cloud.
# Requires Apple signing credentials configured in EAS.
build-ios:
	APP_VARIANT=production npx eas-cli@latest build --platform ios --profile production

# Build production Android and iOS apps in the EAS cloud.
build-all:
	APP_VARIANT=production npx eas-cli@latest build --platform all --profile production

# Upload a SPECIFIC production iOS build to App Store Connect.
# Usage:
#   make submit-ios BUILD_ID=<EAS_BUILD_ID>
#
# Always provide the build ID to avoid submitting the wrong variant.
submit-ios:
	@test -n "$(BUILD_ID)" || \
		(echo "Usage: make submit-ios BUILD_ID=<EAS_BUILD_ID>"; exit 1)
	APP_VARIANT=production npx eas-cli@latest submit --platform ios --id "$(BUILD_ID)"

# ============================================================
# EAS secrets
# ============================================================

# Upload google-services.json to EAS.
# Run once, then again whenever the Firebase file changes.
push-secret:
	npx eas-cli@latest secret:create --scope project --name GOOGLE_SERVICES_JSON \
		--type file --value ./google-services.json --force

# ============================================================
# Debugging
# ============================================================

# Follow push notification registration logs on an attached Android device.
push-logs:
	adb logcat -s ReactNativeJS:V FirebaseMessaging:V expo-notifications:V

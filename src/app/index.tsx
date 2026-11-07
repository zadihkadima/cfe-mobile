
import { Redirect } from "expo-router";
import { useSelector } from "react-redux";
import { RootState } from "@/core/store";
import { LaunchScreen } from "@/design-system/ui/brand/LaunchScreen";


export default function Index() {
  const { user, hydrated } = useSelector(
    (state: RootState) => state.auth
  );

  // Session restoration reads the keychain, which is not instant on a cold
  // start. This used to render `null` while it ran -- a blank frame between
  // the native splash and the first screen, long enough on a slow device to
  // look like the app had died on launch.
  if (!hydrated) return <LaunchScreen />;

  if (!user) {
    return <Redirect href="/auth/login" />;
  }

  switch (user.role) {
    case "admin":
      return <Redirect href="/user/admin" />;

    case "manager":
      return <Redirect href="/user/manager" />;

    default:
      return <Redirect href="/user/client" />;
  }
}
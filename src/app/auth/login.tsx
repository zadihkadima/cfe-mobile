import { RootState } from "@/core/store";
import { LoginScreen } from "@/modules/auth/screens/LoginScreen";
import { useSelector } from "react-redux";
import { Redirect } from "expo-router";

export default function LoginScr() {
  const { user, hydrated } = useSelector(
    (state: RootState) => state.auth
  );

  if (!hydrated) return null;

  // 👇 already logged in → send away from login
  if (user) {
    if (user.role === "admin") return <Redirect href="/user/admin" />;
    if (user.role === "manager") return <Redirect href="/user/manager" />;
    return <Redirect href="/user/client" />;
  }

  // 👇 not logged in → show login screen
  return <LoginScreen />;
}
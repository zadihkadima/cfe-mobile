import { PropsWithChildren } from "react";
import { useSelector } from "react-redux";
import { Redirect } from "expo-router";
import { RootState } from "@/core/store";

type Props = PropsWithChildren & {
  allowedRoles: ("admin" | "manager" | "client")[];
};

export function RouteGuard({ children, allowedRoles }: Props) {
  const { user, hydrated } = useSelector((state: RootState) => state.auth);

  // Nothing is decided until the stored session has been read back. A guard
  // that read only `user` would see it empty on a cold start -- the keychain
  // read is not instant -- and would send a signed-in person to the login
  // screen before the restored session could prove otherwise.
  if (!hydrated) return null;

  if (!user) {
    return <Redirect href="/auth/login" />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Redirect to user's role dashboard
    const dashboardMap = {
      admin: "/user/admin",
      manager: "/user/manager",
      client: "/user/client",
    };
    return <Redirect href={dashboardMap[user.role]} />;
  }

  return <>{children}</>;
}

import { PropsWithChildren } from "react";
import { useSelector } from "react-redux";
import { Redirect } from "expo-router";
import { RootState } from "@/core/store";

type Props = PropsWithChildren & {
  allowedRoles: ("admin" | "manager" | "client")[];
};

export function RouteGuard({ children, allowedRoles }: Props) {
  const { user } = useSelector((state: RootState) => state.auth);

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

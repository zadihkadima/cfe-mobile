import { Slot } from "expo-router";
import { useSelector } from "react-redux";

import { AppShell } from "@/design-system/ui/layout/AppShell";
import { clientMenu, managerMenu, adminMenu } from "@/design-system/ui/navigation/menuData";
import { RootState } from "@/core/store";

export default function UserWorkspacesLayout() {
  const user = useSelector((state: RootState) => state.auth.user);

  let menu = clientMenu;
  if (user?.role === "manager") menu = managerMenu;
  else if (user?.role === "admin") menu = adminMenu;

  return (
    <AppShell title="Workspaces" menu={menu}>
      <Slot />
    </AppShell>
  );
}

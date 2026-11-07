import { PropsWithChildren } from "react";

import { AppShell } from "./AppShell";

import { managerMenu } from "@/design-system/ui/navigation/menuData";

interface Props extends PropsWithChildren {
  title: string;
}

export function ManagerLayout({ title, children }: Props) {
  return (
    <AppShell title={title} menu={managerMenu}>
      {children}
    </AppShell>
  );
}

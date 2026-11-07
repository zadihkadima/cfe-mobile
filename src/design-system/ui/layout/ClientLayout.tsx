import { PropsWithChildren } from "react";

import { AppShell } from "./AppShell";

import { clientMenu } from "@/design-system/ui/navigation/menuData";

interface Props extends PropsWithChildren {
  title: string;
}

export function ClientLayout({ title, children }: Props) {
  return (
    <AppShell title={title} menu={clientMenu}>
      {children}
    </AppShell>
  );
}

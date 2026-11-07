import { PropsWithChildren } from "react";

import { AppShell } from "./AppShell";

import { adminMenu } from "@/design-system/ui/navigation/menuData";

interface Props
  extends PropsWithChildren {
  title: string;
}

export function AuthLayout({
  title,
  children,
}: Props) {
  return (
    <AppShell
      title={title}
      menu={adminMenu}
      // Auth screens are short forms with no list in them, so the shell can
      // safely scroll on their behalf.
      scroll
    >
      {children}
    </AppShell>
  );
}
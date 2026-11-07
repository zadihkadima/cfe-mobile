// src/components/ui/layout/AdminLayout.tsx

import React, {
  PropsWithChildren,
} from "react";

import { AppShell } from "./AppShell";

import { adminMenu } from "@/design-system/ui/navigation/menuData";

interface Props
  extends PropsWithChildren {
  title: string;

  scroll?: boolean;

  refreshing?: boolean;

  onRefresh?(): void;
}

export function AdminLayout({
  children,
  ...props
}: Props) {
  return (
    <AppShell
      {...props}
      menu={adminMenu}
    >
      {children}
    </AppShell>
  );
}
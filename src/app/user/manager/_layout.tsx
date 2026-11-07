import { Slot } from "expo-router";

import { ManagerLayout } from "@/design-system/ui/layout/ManagerLayout";

export default function UserManagerLayout() {
  return (
    <ManagerLayout title="Manager">
      <Slot />
    </ManagerLayout>
  );
}

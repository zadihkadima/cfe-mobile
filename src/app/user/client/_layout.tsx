import { Slot } from "expo-router";

import { ClientLayout } from "@/design-system/ui/layout/ClientLayout";

export default function UserClientLayout() {
  return (
    <ClientLayout title="Client">
      <Slot />
    </ClientLayout>
  );
}

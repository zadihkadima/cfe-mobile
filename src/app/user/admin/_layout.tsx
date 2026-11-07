import { Slot } from "expo-router";

import { AdminLayout } from "@/design-system/ui/layout/AdminLayout";

export default function UserAdminLayout() {
  return (
    <AdminLayout title="Admin">
      <Slot />
    </AdminLayout>
  );
}

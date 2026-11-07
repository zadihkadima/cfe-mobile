import { RoleGate } from "@/core/auth/RoleGate";
import { ReportsScreen } from "@/modules/settings/screens/ReportsScreen";

export default function ReportsPage() {
  return (
    <RoleGate roles={["admin"]} title="Reports">
      <ReportsScreen />
    </RoleGate>
  );
}

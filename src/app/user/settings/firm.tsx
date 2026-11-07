import { RoleGate } from "@/core/auth/RoleGate";
import { SettingsScreen } from "@/modules/firm/screens/SettingsScreen";

export default function FirmSettingsPage() {
  return (
    <RoleGate roles={["admin"]} title="Firm settings">
      <SettingsScreen />
    </RoleGate>
  );
}

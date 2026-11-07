import { RoleGate } from "@/core/auth/RoleGate";
import { HistoryScreen } from "@/modules/history/screens/HistoryScreen";

export default function HistoryPage() {
  return (
    <RoleGate roles={["admin"]} title="History">
      <HistoryScreen />
    </RoleGate>
  );
}

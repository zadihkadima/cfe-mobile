import { WorkspaceDetailScreen } from "@/modules/workspace/screens/WorkspaceDetailScreen";

/**
 * The workspace shell for clients and managers.
 *
 * This route previously rendered a different screen from the admin one, so the
 * tabbed layout only ever reached administrators: clients and managers still
 * got the older page, where each of nine modules was a card that navigated
 * away and back. Two screens for one concept also meant every subsequent
 * workspace change had to be made twice, and the second copy was the one that
 * got forgotten.
 *
 * The screen is role-aware where it needs to be -- the edit affordance appears
 * only for the role the API lets edit -- so sharing it does not widen access.
 */
export default function WorkspacePage() {
  return <WorkspaceDetailScreen />;
}

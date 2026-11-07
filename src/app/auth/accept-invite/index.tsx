import { AcceptInviteScreen } from "@/modules/auth/screens/AcceptInviteScreen";

// The token-less entry point. Without this, /auth/accept-invite matches only
// the dynamic segment below it and lands on not-found, so anyone typing the
// code by hand -- the only route open to a desktop, where the deep link cannot
// fire -- had nowhere to type it.
export default function AcceptInvitePage() {
  return <AcceptInviteScreen />;
}

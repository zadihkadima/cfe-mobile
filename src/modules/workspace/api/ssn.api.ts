import { api } from "@/core/api/client";

export type SsnRevealResponse = {
  social_security_number: string;
  expires_in_seconds: number;
};

/**
 * Releases the full SSN of the client a workspace belongs to, re-authenticated
 * by the caller's own password.
 *
 * The password verified is the caller's, not the client's: the workspace has
 * already established that this person may read the engagement, and this step
 * establishes that the person holding the session is the person it belongs to.
 * Verifying the client's password instead would lock the client out of their
 * own account every time their accountant looked at their return, which is why
 * the two are not interchangeable here.
 */
export const revealWorkspaceClientSsn = async (
  workspaceId: string,
  password: string,
): Promise<SsnRevealResponse> => {
  const res = await api.post(
    `/workspaces/${workspaceId}/client/ssn/reveal`,
    { password },
  );
  return res.data;
};

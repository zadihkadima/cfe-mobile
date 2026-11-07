import { api } from "@/core/api/client";

export const resendInvite = async (id: string): Promise<void> => {
  await api.post(`/admin/users/${id}/resend-invite`);
};

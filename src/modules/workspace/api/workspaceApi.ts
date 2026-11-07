import { api } from "@/core/api/client";

export const getWorkspaces = async () => {
  const res = await api.get("/workspaces");
  return res.data;
};
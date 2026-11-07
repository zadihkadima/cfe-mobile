import { api } from "@/core/api/client";

import {
  CreateManagerRequest,
  UpdateManagerRequest,
  ListManagersParams,
  ListManagersResponse,
  Manager,
} from "./types";

export const createManager = async (
  data: CreateManagerRequest
): Promise<Manager> => {
  const res = await api.post("/admin/managers", data);

  return res.data;
};

export const getManagers = async (
  params: ListManagersParams
): Promise<ListManagersResponse> => {
  const res = await api.get("/admin/managers", {
    params,
  });

  return res.data;
};

export const getManager = async (
  id: string
): Promise<Manager> => {
  const res = await api.get(`/admin/managers/${id}`);

  return res.data;
};

export const updateManager = async (
  id: string,
  data: UpdateManagerRequest
): Promise<void> => {
  await api.patch(`/admin/managers/${id}`, data);
};

export const deleteManager = async (
  id: string
): Promise<void> => {
  await api.delete(`/admin/managers/${id}`);
};
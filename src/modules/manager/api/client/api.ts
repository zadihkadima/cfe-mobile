import { api } from "@/core/api/client";
import { withIdempotencyKey } from "@/core/api/idempotency";

import {
  CreateManagerClientRequest,
  UpdateManagerClientRequest,
  ListManagerClientsParams,
  ListManagerClientsResponse,
  ManagerClient,
} from "./types";

/**
 * Manager-facing client administration, over `/api/v1/manager/clients`.
 *
 * The server scopes every one of these to the clients assigned to the calling
 * manager, so the client sends the same request regardless of who else's
 * clients exist. The scoping is the server's job: this module must never try
 * to enforce it by hiding rows, because hiding is not enforcement.
 */

/**
 * Creating a client is not naturally idempotent, so the caller supplies a key
 * that stays constant across retries of the same intent. Without it, a request
 * that succeeded but whose response was lost to a dropped connection would be
 * retried into a second, duplicate client record.
 */
export const createManagerClient = async (
  data: CreateManagerClientRequest,
  idempotencyKey?: string,
): Promise<ManagerClient> => {
  const res = await api.post(
    "/manager/clients",
    data,
    idempotencyKey ? withIdempotencyKey(idempotencyKey) : undefined,
  );

  return res.data;
};

export const getManagerClients = async (
  params: ListManagerClientsParams
): Promise<ListManagerClientsResponse> => {
  const res = await api.get("/manager/clients", {
    params,
  });

  return res.data;
};

export const getManagerClient = async (
  id: string
): Promise<ManagerClient> => {
  const res = await api.get(`/manager/clients/${id}`);

  return res.data;
};

export const updateManagerClient = async (
  id: string,
  data: UpdateManagerClientRequest
): Promise<void> => {
  await api.patch(`/manager/clients/${id}`, data);
};

export const deleteManagerClient = async (
  id: string
): Promise<void> => {
  await api.delete(`/manager/clients/${id}`);
};

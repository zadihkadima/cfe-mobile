import { api } from "@/core/api/client";
import { withIdempotencyKey } from "@/core/api/idempotency";

import {
  CreateClientRequest,
  UpdateClientRequest,
  ListClientsParams,
  ListClientsResponse,
  Client,
} from "./types";

/**
 * Creating a client is not naturally idempotent, so the caller supplies a key
 * that stays constant across retries of the same intent. Without it, a request
 * that succeeded but whose response was lost to a dropped connection would be
 * retried into a second, duplicate client record.
 */
export const createClient = async (
  data: CreateClientRequest,
  idempotencyKey?: string,
): Promise<Client> => {
  const res = await api.post(
    "/admin/clients",
    data,
    idempotencyKey ? withIdempotencyKey(idempotencyKey) : undefined,
  );

  return res.data;
};

export const getClients = async (
  params: ListClientsParams
): Promise<ListClientsResponse> => {
  const res = await api.get("/admin/clients", {
    params,
  });

  return res.data;
};

export const getClient = async (
  id: string
): Promise<Client> => {
  const res = await api.get(`/admin/clients/${id}`);

  return res.data;
};

export const updateClient = async (
  id: string,
  data: UpdateClientRequest
): Promise<void> => {
  await api.patch(`/admin/clients/${id}`, data);
};

export const deleteClient = async (
  id: string
): Promise<void> => {
  await api.delete(`/admin/clients/${id}`);
};
import { api } from "@/core/api/client";

import {
  Workspace,
  CreateWorkspaceRequest,
  UpdateWorkspaceRequest,
  ListWorkspaceParams,
  ListWorkspaceResponse,
  WorkspaceClientDetails,
  WorkspaceMembersResponse,
} from "./types";

export const createWorkspace = async (
  data: CreateWorkspaceRequest
): Promise<Workspace> => {
  const res = await api.post(
    "/workspaces",
    data
  );

  return res.data;
};

export const getWorkspaces = async (
  params: ListWorkspaceParams
): Promise<ListWorkspaceResponse> => {
  const res = await api.get(
    "/workspaces",
    {
      params,
    }
  );

  return res.data;
};

export const getWorkspace = async (
  id: string
): Promise<Workspace> => {
  const res = await api.get(
    `/workspaces/${id}`
  );

  return res.data;
};

export const updateWorkspace = async (
  id: string,
  data: UpdateWorkspaceRequest
): Promise<void> => {
  await api.patch(
    `/workspaces/${id}`,
    data
  );
};

export const deleteWorkspace = async (
  id: string
): Promise<void> => {
  await api.delete(
    `/workspaces/${id}`
  );
};

export const getWorkspaceClientDetails = async (
  workspaceId: string,
): Promise<WorkspaceClientDetails> => {
  const res = await api.get(
    `/workspaces/${workspaceId}/client-details`,
  );

  return res.data;
};

export const getWorkspaceMembers = async (
  workspaceId: string,
): Promise<WorkspaceMembersResponse> => {
  const res = await api.get(
    `/workspaces/${workspaceId}/members`,
  );

  return res.data;
};
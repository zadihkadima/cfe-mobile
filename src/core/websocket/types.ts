export interface WsEvent<T = unknown> {
  type: string;

  payload: T;
}

export interface WorkspaceJoinPayload {
  workspace_id: string;
}

export interface WorkspaceLeavePayload {
  workspace_id: string;
}

export interface MessageSendPayload {
  workspace_id: string;

  content: string;

  reply_to_id?: string;

  is_broadcast?: boolean;
}
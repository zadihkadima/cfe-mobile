import { api } from "@/core/api/client";
import { CreateUserRequest } from "../types";

export const createManager = (data: CreateUserRequest) =>
  api.post("/managers", data);

export const createClient = (data: CreateUserRequest) =>
  api.post("/clients", data);

export const getUsers = (params?: {
  role?: "manager" | "client";
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
}) =>
  api.get("/users", {
    params,
  });


export const getManagers = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
}) =>
  api.get("/managers", {
    params,
  });
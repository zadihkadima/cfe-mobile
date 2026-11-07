export type UserRole =
  | "admin"
  | "manager"
  | "client";

export interface CreateUserRequest {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

export interface User {
  ID: string;

  FirstName: string;
  LastName: string;

  Email: string;

  Role: UserRole;

  IsActive: boolean;

  Invited: boolean;

  CreatedAt: string;
  UpdatedAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];

  page: number;

  limit: number;

  total: number;

  totalPages: number;
}
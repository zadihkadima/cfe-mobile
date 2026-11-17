import type { z } from "zod";

import { createClientSchema } from "@/modules/admin/schemas/createClientSchema";

import type { CreateManagerClientRequest } from "../api/client/types";

/**
 * The manager's create form carries the same fields as the administrator's,
 * because the request body is the same contract. Reusing the admin schema
 * keeps the two from drifting apart, which they would do if written twice.
 */
export const createManagerClientSchema = createClientSchema;

export type CreateManagerClientFormData = z.infer<
  typeof createManagerClientSchema
>;

// The annotation is the assertion: if the manager transport type drifts from
// the schema, this file stops compiling.
export const _schemaSatisfiesRequest: CreateManagerClientRequest =
  createManagerClientSchema.parse({
    first_name: "Ada",
    last_name: "Lovelace",
    email: "ada@example.com",
  });

void _schemaSatisfiesRequest;

import { z } from "zod";

/**
 * Field names match the API contract exactly (`first_name`, not `FirstName`).
 *
 * They previously did not, and because the create screen typed its submit
 * handler as `any`, nothing caught it: the form sent `{FirstName, LastName,
 * Email}` to an endpoint that requires `{first_name, last_name, email}`, so
 * every client creation was rejected and every edit form rendered blank.
 * Keeping the schema aligned with the transport type is what lets the compiler
 * catch that class of mistake instead of a user discovering it.
 */
export const createClientSchema = z.object({
  first_name: z
    .string()
    .trim()
    .min(2, "First name is required"),

  last_name: z
    .string()
    .trim()
    .min(2, "Last name is required"),

  email: z
    .string()
    .trim()
    .email("Enter a valid email address"),
});

export type CreateClientFormData =
  z.infer<typeof createClientSchema>;
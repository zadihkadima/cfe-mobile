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

  // Optional: `date_of_birth` and `reason_for_consultation` are not required
  // by the feedback, and `client_code` is assigned by the firm rather than
  // typed here, so all three may simply be left blank.
  date_of_birth: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a date as YYYY-MM-DD")
    .optional(),

  client_code: z
    .string()
    .trim()
    .optional(),

  reason_for_consultation: z
    .string()
    .trim()
    .optional(),
});

export type CreateClientFormData =
  z.infer<typeof createClientSchema>;
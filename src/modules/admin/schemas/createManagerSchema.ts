import { z } from "zod";

export const createManagerSchema = z.object({
  first_name: z
    .string()
    .min(2, "First name is required"),

  last_name: z
    .string()
    .min(2, "Last name is required"),

  email: z
    .string()
    .email("Invalid email"),
});

export type CreateManagerFormData =
  z.infer<typeof createManagerSchema>;
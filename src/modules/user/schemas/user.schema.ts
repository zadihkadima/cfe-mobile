import { z } from "zod";

export const userSchema = z
  .object({
    first_name: z
      .string()
      .min(2),

    last_name: z
      .string()
      .min(2),

    email: z
      .email(),

    password: z
      .string()
      .min(8),

    confirm_password: z
      .string(),
  })
  .refine(
    (data) =>
      data.password ===
      data.confirm_password,
    {
      path: [
        "confirm_password",
      ],
      message:
        "Passwords do not match",
    }
  );

export type UserFormData =
  z.infer<typeof userSchema>;
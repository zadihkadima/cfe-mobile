import { z } from "zod";

// The backend rejects anything under 6 characters, but the login form already
// asks for 8. Matching the stricter of the two here means an account is never
// created with a password its owner cannot then use to sign in without being
// told, at the point of setting it, why it was refused.
export const acceptInviteSchema = z
  .object({
    token: z.string().trim().min(1, "Paste the code from your invitation email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),

    // Registration details collected at onboarding. All optional: a client
    // may not know their code yet, may not wish to say why they are here,
    // and a birthdate is not needed to activate an account.
    date_of_birth: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a date as YYYY-MM-DD")
      .optional(),

    client_code: z.string().trim().optional(),

    reason_for_consultation: z.string().trim().optional(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type AcceptInviteFormData = z.infer<typeof acceptInviteSchema>;

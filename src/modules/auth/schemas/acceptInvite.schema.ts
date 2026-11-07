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
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type AcceptInviteFormData = z.infer<typeof acceptInviteSchema>;

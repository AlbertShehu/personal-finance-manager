// src/lib/validations/registerSchema.js
import { z } from "zod";

export const registerSchema = (t) =>
  z
    .object({
      name: z
        .string()
        .trim()
        .min(2, { message: t("formValidation.name.minLength", "Name must be at least 2 characters") }),

      email: z
        .string()
        .trim()
        .min(1, { message: t("formValidation.email.required", "Email is required") })
        .email({ message: t("formValidation.email.invalid", "Please enter a valid email address") })
        .regex(/@(gmail|googlemail)\.com$/i, {
          message: "", // Mos shfaq mesazh për Gmail validation - frontend e trajton
        })
        .transform((v) => v.toLowerCase()),

      password: z
        .string()
        .min(8, { message: t("formValidation.password.minLength8", "Password must be at least 8 characters") })
        .regex(/\d/, { message: t("formValidation.password.number", "Password must include at least one number") })
        .regex(/[^\w\s]/, { message: t("formValidation.password.symbol", "Password must include at least one symbol") }),

      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      path: ["confirmPassword"],
      message: t("formValidation.password.match", "Passwords do not match"),
    });

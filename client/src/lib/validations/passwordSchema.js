// src/lib/validations/passwordSchema.js
import { z } from "zod"

export const passwordSchema = (t) =>
  z
    .object({
      currentPassword: z
        .string()
        .min(1, { message: t("password.validation.currentPassword", "Current password is required") }),
      newPassword: z
        .string()
        .min(8, { message: t("register.validation.password.min", "At least 8 characters") })
        .regex(/\d/, { message: t("register.validation.password.number", "At least one number") })
        .regex(/[^\w\s]/, { message: t("register.validation.password.symbol", "At least one symbol") }),
      confirmNewPassword: z.string(),
    })
    .refine(
      (data) => data.newPassword === data.confirmNewPassword,
      {
        message: t("register.validation.password.match", "Passwords do not match"),
        path: ["confirmNewPassword"],
      }
    )

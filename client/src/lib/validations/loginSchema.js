// src/lib/validations/loginSchema.js
import { z } from "zod";

// Pranon funksionin `t` për përkthime dinamike
export const loginSchema = (t) =>
  z.object({
    email: z.preprocess(
      (v) => (typeof v === "string" ? v.trim().toLowerCase() : v),
      z
        .string()
        .email({
          message: t("formValidation.email.invalid", "Please enter a valid email address"),
        })
        .refine(
          (v) => /@(gmail|googlemail)\.com$/i.test(v),
          {
            message: "", // Mos shfaq mesazh për Gmail validation - frontend e trajton
          }
        )
    ),
    password: z
      .string()
      .min(6, {
        message: t(
          "formValidation.password.minLength",
          "Password must be at least 6 characters"
        ),
      }),
    // opsionale: lejo fushën 'remember' që përdor forma
    remember: z.boolean().optional(),
  });

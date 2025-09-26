// src/lib/validations/editProfileSchema.js
import { z } from "zod";

export const editProfileSchema = (t) =>
  z.object({
    name: z.string().min(2, t("profile.validation.name")),
    email: z.string().email(t("profile.validation.email")),
  });

import { z } from "zod";

export const buildTransactionSchema = (t) =>
  z.object({
    category: z
      .string()
      .min(2, t("transaction.validation.categoryRequired")),
    description: z
      .string()
      .min(2, t("transaction.validation.descriptionRequired")),
    amount: z.coerce
      .number()
      .positive(t("transaction.validation.amountPositive")),
    type: z.enum(["INCOME", "EXPENSE"]),
    date: z.string().min(1, t("transaction.validation.dateRequired")),
  });

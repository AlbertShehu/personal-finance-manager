// src/components/transactions/AddTransactionModal.jsx
import React, { useEffect, useId, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import api from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";
import { buildTransactionSchema } from "@/lib/validations/transactionSchema";
import { useTranslation } from "react-i18next";
import { addTransactionLocal } from "@/store/transactionSlice";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

// Y-M-D sipas kohës lokale (jo UTC)
function toLocalYMD(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const DEFAULT_CATEGORIES = [
  "Salary",
  "Groceries",
  "Rent",
  "Utilities",
  "Transport",
  "Dining",
  "Shopping",
  "Healthcare",
  "Entertainment",
  "Other",
];

export default function AddTransactionModal({
  isOpen,
  onClose,
  refetch,
  categories = DEFAULT_CATEGORIES, // sugjerime opsionale
}) {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const baseId = useId(); // për aria-errormessage
  const { toast } = useToast();

  const [form, setForm] = useState({
    category: "",
    description: "",
    amount: "",
    type: "INCOME",
    date: toLocalYMD(),
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // reset sa herë hapet dialogu
  useEffect(() => {
    if (isOpen) {
      setErrors({});
      setSubmitting(false);
      setForm((f) => ({ ...f, date: f.date || toLocalYMD() }));
    }
  }, [isOpen]);

  const schema = useMemo(() => buildTransactionSchema(t), [t]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleAmountChange = (e) => {
    // Lejo “,” si separator decimal për gjuhët EU -> zëvendëso me “.”
    const normalized = e.target.value.replace(",", ".");
    setForm((f) => ({ ...f, amount: normalized }));
    if (errors.amount) setErrors((prev) => ({ ...prev, amount: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setErrors({});

    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const flat = parsed.error.flatten();
      setErrors(flat.fieldErrors || {});
      toast({
        title: t("transaction.toast.validationErrorTitle", "Validation error"),
        description: t(
          "transaction.toast.validationError",
          "Please check the fields and try again"
        ),
        variant: "destructive",
        duration: 6000,
      });
      setSubmitting(false);
      return;
    }

    try {
      // Shkruaje te API (schema pritet të përdorë z.coerce.number për amount)
      const response = await api.post("/transactions", parsed.data);
      const newTransaction = response.data;

      // Shto transaksionin e ri në Redux store
      dispatch(addTransactionLocal(newTransaction));

      toast({
        title: t("transaction.toast.addSuccess"),
        description: t("transaction.toast.addDescription"),
        variant: "success",
        duration: 5000,
      });

      setForm({
        category: "",
        description: "",
        amount: "",
        type: "INCOME",
        date: toLocalYMD(),
      });
      onClose?.();
      refetch?.();
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        t("transaction.toast.addError");
      toast({
        title: t(
          "transaction.toast.addErrorTitle",
          "Failed to add transaction"
        ),
        description: message,
        variant: "destructive",
        duration: 6000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // IDs për aria-errormessage
  const errId = {
    category: `${baseId}-err-category`,
    description: `${baseId}-err-description`,
    amount: `${baseId}-err-amount`,
    date: `${baseId}-err-date`,
    type: `${baseId}-err-type`,
  };

  return (
    <Dialog open={!!isOpen} onOpenChange={(open) => !open && onClose?.()}>
      <DialogContent
        className="
          fixed z-50 w-[92vw] max-w-md rounded-xl border bg-card text-foreground p-6 shadow-lg
          left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
          outline-none
          data-[state=open]:animate-in data-[state=closed]:animate-out
          data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0
          data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95
        "
      >
        {/* Buton mbylljeje sipër djathtas */}

        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {t("transaction.modal.title")}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            {t(
              "transaction.modal.subtitle",
              "Fill the form to add a new transaction"
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3" noValidate>
          {/* Category */}
          <div className="space-y-1">
            <label htmlFor="category" className="text-sm font-medium">
              {t("transaction.form.category")}
            </label>
            <input
              id="category"
              name="category"
              autoFocus
              list="categories-list"
              placeholder={t("transaction.form.category")}
              value={form.category}
              onChange={handleChange}
              required
              disabled={submitting}
              aria-invalid={!!errors.category}
              aria-errormessage={errors.category ? errId.category : undefined}
              className="w-full px-3 py-2 rounded-lg border bg-background"
            />
            <datalist id="categories-list">
              {categories.slice(0, 25).map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            {errors.category?.[0] && (
              <p id={errId.category} className="text-xs text-red-600">
                {errors.category[0]}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label htmlFor="description" className="text-sm font-medium">
              {t("transaction.form.description")}
            </label>
            <input
              id="description"
              name="description"
              placeholder={t("transaction.form.description")}
              value={form.description}
              onChange={handleChange}
              required
              disabled={submitting}
              aria-invalid={!!errors.description}
              aria-errormessage={
                errors.description ? errId.description : undefined
              }
              className="w-full px-3 py-2 rounded-lg border bg-background"
            />
            {errors.description?.[0] && (
              <p id={errId.description} className="text-xs text-red-600">
                {errors.description[0]}
              </p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="amount" className="text-sm font-medium">
                {t("transaction.form.amount")}
              </label>
              <span className="text-xs text-muted-foreground">
                {i18n.language?.startsWith("de") ||
                i18n.language?.startsWith("sq")
                  ? t("overview.total", "Total")
                  : t("transactions.amountHelp", "Use . or , for decimals")}
              </span>
            </div>
            <input
              id="amount"
              name="amount"
              type="text"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={form.amount}
              onChange={handleAmountChange}
              required
              disabled={submitting}
              aria-invalid={!!errors.amount}
              aria-errormessage={errors.amount ? errId.amount : undefined}
              className="w-full px-3 py-2 rounded-lg border bg-background"
            />
            {errors.amount?.[0] && (
              <p id={errId.amount} className="text-xs text-red-600">
                {errors.amount[0]}
              </p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-1">
            <label htmlFor="date" className="text-sm font-medium">
              {t("transaction.form.date", "Date")}
            </label>
            <input
              id="date"
              name="date"
              type="date"
              value={form.date}
              onChange={handleChange}
              required
              disabled={submitting}
              aria-invalid={!!errors.date}
              aria-errormessage={errors.date ? errId.date : undefined}
              className="w-full px-3 py-2 rounded-lg border bg-background"
            />
            {errors.date?.[0] && (
              <p id={errId.date} className="text-xs text-red-600">
                {errors.date[0]}
              </p>
            )}
          </div>

          {/* Type */}
          <fieldset className="space-y-1">
            <legend className="text-sm font-medium">
              {t("transaction.form.type", "Type")}
            </legend>
            <div className="grid grid-cols-2 gap-2">
              <label className="inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 cursor-pointer hover:bg-muted has-[:checked]:bg-blue-50 dark:has-[:checked]:bg-blue-950/30 has-[:checked]:border-blue-500">
                <input
                  type="radio"
                  name="type"
                  value="INCOME"
                  checked={form.type === "INCOME"}
                  onChange={handleChange}
                  disabled={submitting}
                  className="sr-only"
                />
                <span>{t("transaction.filter.income")}</span>
              </label>
              <label className="inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 cursor-pointer hover:bg-muted has-[:checked]:bg-rose-50 dark:has-[:checked]:bg-rose-950/30 has-[:checked]:border-rose-500">
                <input
                  type="radio"
                  name="type"
                  value="EXPENSE"
                  checked={form.type === "EXPENSE"}
                  onChange={handleChange}
                  disabled={submitting}
                  className="sr-only"
                />
                <span>{t("transaction.filter.expense")}</span>
              </label>
            </div>
            {errors.type?.[0] && (
              <p id={errId.type} className="text-xs text-red-600">
                {errors.type[0]}
              </p>
            )}
          </fieldset>

          <DialogFooter className="flex justify-end gap-2 pt-2">
            <DialogClose asChild>
              <button
                type="button"
                disabled={submitting}
                className="text-sm px-4 py-2 rounded-lg border hover:bg-muted disabled:opacity-50"
              >
                {t("transaction.modal.cancel")}
              </button>
            </DialogClose>
            <button
              type="submit"
              disabled={submitting}
              className="text-sm px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {submitting && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/80 border-r-transparent" />
              )}
              {t("transaction.modal.submit")}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

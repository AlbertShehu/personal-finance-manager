// src/components/transactions/EditTransactionModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/axios";
import { useTranslation } from "react-i18next";
import { buildTransactionSchema } from "@/lib/validations/transactionSchema";
import { updateTransactionLocal } from "@/store/transactionSlice";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

// helper: format "YYYY-MM-DD" për <input type="date">
const toDateInput = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

// dërgo vetëm fushat e ndryshuara (PATCH “partial”)
const diffPayload = (initial, current) => {
  const out = {};
  for (const k of Object.keys(current)) {
    const a = k === "amount" ? Number(initial[k] ?? 0) : initial[k];
    const b = k === "amount" ? Number(current[k] ?? 0) : current[k];

    if (k === "date") {
      const ai = toDateInput(initial[k]); // initial mund të jetë ISO
      if (ai !== b) out[k] = b;
    } else if (a !== b) {
      out[k] = b;
    }
  }
  return out;
};

export default function EditTransactionModal({ tx, isOpen, onClose, refetch }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { toast } = useToast();

  const [form, setForm] = useState({
    category: "",
    description: "",
    amount: "",
    type: "INCOME",
    date: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // kur hapet modal-i ose ndryshon “tx”, plotëso formën
  useEffect(() => {
    if (!isOpen || !tx) return;
    setErrors({});
    setSubmitting(false);
    setForm({
      category: tx.category ?? "",
      description: tx.description ?? "",
      amount: (tx.amount ?? "").toString(),
      type: String(tx.type || "INCOME").toUpperCase(),
      date: toDateInput(tx.date),
    });
  }, [isOpen, tx]);

  const schema = useMemo(() => buildTransactionSchema(t), [t]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tx?.id && !tx?._id) return;

    setSubmitting(true);
    setErrors({});

    // valido si “create” (më e thjeshtë për UI); pastaj bëjmë diff
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const flat = parsed.error.flatten();
      setErrors(flat.fieldErrors || {});
      toast({
        title: t("transaction.toast.validationErrorTitle", "Validation error"),
        description: t("transaction.toast.validationError", "Please check the fields and try again"),
        variant: "destructive",
      });
      setSubmitting(false);
      return;
    }

    // përgatit payload-in vetëm me fushat e ndryshuara
    const payload = diffPayload(
      {
        category: tx.category ?? "",
        description: tx.description ?? "",
        amount: Number(tx.amount ?? 0),
        type: String(tx.type || "INCOME").toUpperCase(),
        date: toDateInput(tx.date),
      },
      {
        ...parsed.data,
        amount: Number(parsed.data.amount),
      }
    );

    // nëse s’ka ndryshime, mos thirr patch
    if (Object.keys(payload).length === 0) {
      toast({
        title: t("transaction.toast.noChanges", "No changes to save"),
        description: t("transaction.toast.noChangesDesc", "Please modify at least one field"),
      });
      setSubmitting(false);
      return;
    }

    try {
      const id = tx.id ?? tx._id;
      const response = await api.patch(`/transactions/${id}`, {
        ...payload,
        // backend e pret "date" si ISO; ktheje nga YYYY-MM-DD → ISO (opsionale)
        ...(payload.date && { date: new Date(payload.date).toISOString() }),
      });

      // Përditëso transaksionin në Redux store
      dispatch(updateTransactionLocal(response.data));

      toast({
        title: t("transaction.toast.updateSuccess", "Transaction updated"),
      });

      // rifresko të dhënat në prind dhe mbyll modal-in
      await refetch?.();
      onClose?.();
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        t("transaction.toast.updateError", "Failed to update transaction");

      toast({
        title: t("transaction.toast.updateErrorTitle", "Update failed"),
        description: message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={!!isOpen} onOpenChange={(open) => !open && onClose?.()}>
      <DialogContent className="w-[90vw] max-w-md rounded-xl border bg-card text-foreground p-6 shadow-lg">
        {/* Butoni i mbylljes në këndin e djathtë sipër */}
       vazh

        <DialogHeader>
          <DialogTitle>{t("transaction.modal.editTitle", "Edit Transaction")}</DialogTitle>
          <DialogDescription>
            {t("transaction.modal.editSubtitle", "Update the fields and save your changes")}
          </DialogDescription>
        </DialogHeader>

        {/* Forma përditëson & paraqet butonat e aksionit */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div className="space-y-1">
            <label htmlFor="category" className="text-sm font-medium">
              {t("transaction.form.category")}
            </label>
            <input
              id="category"
              name="category"
              value={form.category}
              onChange={handleChange}
              disabled={submitting}
              aria-invalid={!!errors.category}
              className="w-full px-3 py-2 rounded-lg border bg-background"
            />
            {errors.category?.[0] && (
              <p className="text-xs text-red-600">{errors.category[0]}</p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="description" className="text-sm font-medium">
              {t("transaction.form.description")}
            </label>
            <input
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              disabled={submitting}
              aria-invalid={!!errors.description}
              className="w-full px-3 py-2 rounded-lg border bg-background"
            />
            {errors.description?.[0] && (
              <p className="text-xs text-red-600">{errors.description[0]}</p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="amount" className="text-sm font-medium">
              {t("transaction.form.amount")}
            </label>
            <input
              id="amount"
              name="amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              value={form.amount}
              onChange={handleChange}
              disabled={submitting}
              aria-invalid={!!errors.amount}
              className="w-full px-3 py-2 rounded-lg border bg-background"
            />
            {errors.amount?.[0] && (
              <p className="text-xs text-red-600">{errors.amount[0]}</p>
            )}
          </div>

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
              disabled={submitting}
              aria-invalid={!!errors.date}
              className="w-full px-3 py-2 rounded-lg border bg-background"
            />
            {errors.date?.[0] && (
              <p className="text-xs text-red-600">{errors.date[0]}</p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="type" className="text-sm font-medium">
              {t("transaction.form.type", "Type")}
            </label>
            <select
              id="type"
              name="type"
              value={form.type}
              onChange={handleChange}
              disabled={submitting}
              className="w-full px-3 py-2 rounded-lg border bg-background"
            >
              <option value="INCOME">{t("transaction.filter.income")}</option>
              <option value="EXPENSE">{t("transaction.filter.expense")}</option>
            </select>
            {errors.type?.[0] && (
              <p className="text-xs text-red-600">{errors.type[0]}</p>
            )}
          </div>

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
              className="text-sm px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-2"
            >
              {submitting && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/80 border-r-transparent" />
              )}
              {t("actions.save", "Save")}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
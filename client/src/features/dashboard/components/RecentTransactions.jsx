import React, { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { format } from "date-fns"
import { formatCurrency } from "@/lib/utils"

export default function RecentTransactions({ transactions = [], currency = "EUR" }) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language

  const items = useMemo(
    () =>
      [...transactions]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5),
    [transactions]
  )

  if (items.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h3 className="text-base font-semibold mb-2">{t("dashboard.recent", "Recent activity")}</h3>
        <p className="text-sm text-muted-foreground">{t("transactions.noData")}</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <h3 className="text-base font-semibold mb-4">{t("dashboard.recent", "Recent activity")}</h3>
      <ul className="space-y-3">
        {items.map((tx) => {
          const isIncome = String(tx.type).toUpperCase() === "INCOME"
          return (
            <li key={tx.id || tx._id} className="flex items-center justify-between">
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{tx.description || tx.category || "—"}</div>
                <div className="text-xs text-muted-foreground">
                  {format(new Date(tx.date), "dd/MM/yyyy")} · {tx.category || t("table.category")}
                </div>
              </div>
              <div className={`text-sm font-semibold ${isIncome ? "text-emerald-600" : "text-red-600"}`}>
                {isIncome ? "+" : "-"} {formatCurrency(Math.abs(Number(tx.amount) || 0), { currency, locale })}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

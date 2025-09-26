// src/components/dashboard/ForecastCard.jsx
import React, { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { formatCurrency } from "@/lib/utils"

export default function ForecastCard({ transactions = [], currency = "EUR" }) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language

  const { incomeMTD, expenseMTD, netMTD, daysPassed, daysInMonth, projection } = useMemo(() => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const daysPassed = now.getDate()
    const daysInMonth = monthEnd.getDate()

    let incomeMTD = 0, expenseMTD = 0
    for (const tx of transactions) {
      const d = new Date(tx.date)
      if (d >= monthStart && d <= now) {
        const amt = Number(tx.amount) || 0
        if (String(tx.type).toUpperCase() === "INCOME") incomeMTD += amt
        else expenseMTD += amt
      }
    }
    const netMTD = incomeMTD - expenseMTD
    const runRate = daysPassed > 0 ? netMTD / daysPassed : 0
    const projection = runRate * daysInMonth
    return { incomeMTD, expenseMTD, netMTD, daysPassed, daysInMonth, projection }
  }, [transactions])

  const ratio = Math.max(0, Math.min(1, (netMTD + 1e-9) / (Math.abs(projection) + 1e-9)))
  const barWidth = isFinite(ratio) ? Math.round(ratio * 100) : 0
  const positive = projection >= 0

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm h-full">
      <h3 className="text-base font-semibold mb-1">{t("dashboard.analysis")}</h3>
      <p className="text-sm text-muted-foreground mb-4">
        {t("dashboard.kpi.savingsRate", "Savings rate")} · {daysPassed}/{daysInMonth}
      </p>

      <div className="grid grid-cols-3 gap-3 text-sm mb-4">
        <Stat label={t("transactions.income")} value={formatCurrency(incomeMTD, { currency, locale })} tone="ok" />
        <Stat label={t("transactions.expense")} value={formatCurrency(expenseMTD, { currency, locale })} tone="warn" />
        <Stat label={t("dashboard.balance")} value={formatCurrency(netMTD, { currency, locale })} tone={netMTD>=0?"ok":"bad"} />
      </div>

      <div className="mb-1 flex justify-between text-xs text-muted-foreground">
        <span>{t("chart.title")}</span>
        <span>{t("dashboard.viewAll", "View all")}</span>
      </div>
      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full ${positive ? "bg-emerald-500" : "bg-red-500"}`}
          style={{ width: `${Math.max(6, barWidth)}%` }}
        />
      </div>

      <div className="mt-3 text-sm">
        <span className="text-muted-foreground mr-1">{t("dashboard.balance")} →</span>
        <span className={positive ? "text-emerald-600" : "text-red-600"}>{formatCurrency(projection, { currency, locale })}</span>
        <span className="text-muted-foreground ml-1">({t("dashboard.thisMonth")})</span>
      </div>
    </div>
  )
}

function Stat({ label, value, tone }) {
  const toneCls =
    tone === "ok" ? "text-emerald-600" : tone === "bad" ? "text-red-600" : "text-amber-600"
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`font-semibold ${toneCls}`}>{value}</div>
    </div>
  )
}

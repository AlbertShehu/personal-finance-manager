import React, { useMemo } from "react"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"
import { useTranslation } from "react-i18next"
import { getDateRange } from "./range-utils.js"
import { formatCurrency } from "@/lib/utils"

export default function CashflowAreaChart({ transactions = [], rangeKey = "30d", currency = "EUR" }) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language
  const { start, end } = getDateRange(rangeKey)

  const data = useMemo(() => {
    const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1)
    const buckets = []
    for (let i = 0; i < days; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
      buckets.push({ d, label: new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short" }).format(d), delta: 0 })
    }
    transactions.forEach((tx) => {
      const d = new Date(tx.date)
      if (d < start || d > end) return
      const idx = Math.floor((d - start) / (1000 * 60 * 60 * 24))
      const sign = String(tx.type).toUpperCase() === "INCOME" ? 1 : -1
      buckets[idx].delta += sign * (Number(tx.amount) || 0)
    })
    let sum = 0
    return buckets.map((b) => ({ label: b.label, value: (sum += b.delta) }))
  }, [transactions, start, end, locale])

  const hasAny = data.some((x) => x.value !== 0)

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-4">{t("chart.title")}</h2>
      <div className="h-[320px]">
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 8, right: 12, left: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="cf" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.7} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.15} />
              </linearGradient>
            </defs>
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: "currentColor", opacity: 0.8 }} />
            <YAxis tick={{ fontSize: 12, fill: "currentColor", opacity: 0.8 }} />
            <ReferenceLine y={0} stroke="hsl(var(--border))" />
            <Tooltip
              wrapperStyle={{ outline: "none" }}
              contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12 }}
              formatter={(v) => [formatCurrency(v, { currency, locale }), t("dashboard.balance")]}
            />
            <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="url(#cf)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {!hasAny && <p className="mt-2 text-sm text-muted-foreground">{t("chart.noData")}</p>}
    </div>
  )
}

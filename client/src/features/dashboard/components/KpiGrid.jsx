import React, { useMemo } from "react"
import KpiCard from "./KpiCard"
import { useTranslation } from "react-i18next"
import { formatCurrency } from "@/lib/utils"
import { getDateRange, getPreviousRange } from "./range-utils.js"

export default function KpiGrid({ transactions = [], rangeKey = "30d", currency = "EUR" }) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language

  const { start, end } = getDateRange(rangeKey)
  const prev = getPreviousRange({ start, end })

  const inRange = useMemo(
    () => transactions.filter((tx) => {
      const d = new Date(tx.date)
      return d >= start && d <= end
    }),
    [transactions, start, end]
  )

  const prevRange = useMemo(
    () => transactions.filter((tx) => {
      const d = new Date(tx.date)
      return d >= prev.start && d <= prev.end
    }),
    [transactions, prev.start, prev.end]
  )

  function sumBy(arr, type) {
    return arr.reduce((sum, tx) => sum + (String(tx.type).toUpperCase() === type ? Number(tx.amount) || 0 : 0), 0)
  }

  const income = sumBy(inRange, "INCOME")
  const expense = sumBy(inRange, "EXPENSE")
  const net = income - expense

  const prevIncome = sumBy(prevRange, "INCOME")
  const prevExpense = sumBy(prevRange, "EXPENSE")
  const prevNet = prevIncome - prevExpense

  const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1)
  const avgDaily = expense / days
  const savingsRate = income > 0 ? (net / income) * 100 : 0

  function delta(curr, prev) {
    if (!prev) return null
    const d = ((curr - prev) / Math.max(1e-9, prev)) * 100
    return isFinite(d) ? d : null
  }

  // Sparkline: cashflow kumulativ ditor
  const sparkData = useMemo(() => {
    const buckets = new Map()
    for (let i = 0; i < days; i++) {
      const key = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i).toDateString()
      buckets.set(key, 0)
    }
    inRange.forEach((tx) => {
      const d = new Date(tx.date).toDateString()
      const val = (String(tx.type).toUpperCase() === "INCOME" ? 1 : -1) * (Number(tx.amount) || 0)
      buckets.set(d, (buckets.get(d) || 0) + val)
    })
    return Array.from(buckets.values()).reduce((acc, v) => {
      const sum = (acc.length ? acc[acc.length - 1].y : 0) + v
      acc.push({ y: sum })
      return acc
    }, [])
  }, [inRange, days, start])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
      <KpiCard
        title={t("dashboard.income")}
        value={formatCurrency(income, { currency, locale })}
        deltaPct={delta(income, prevIncome)}
        data={sparkData}
        color="#22c55e"
      />
      <KpiCard
        title={t("dashboard.expense")}
        value={formatCurrency(expense, { currency, locale })}
        deltaPct={delta(expense, prevExpense)}
        data={sparkData}
        color="#ef4444"
      />
      <KpiCard
        title={t("dashboard.balance")}
        value={formatCurrency(net, { currency, locale })}
        deltaPct={delta(net, prevNet)}
        data={sparkData}
        color="#3b82f6"
      />
      <KpiCard
        title={t("dashboard.kpi.savingsRate", "Savings rate")}
        value={`${Math.max(-999, Math.min(999, savingsRate)).toFixed(1)}%`}
        data={sparkData}
        color="#a78bfa"
      />
      <KpiCard
        title={t("dashboard.kpi.avgDaily", "Avg daily spend")}
        value={formatCurrency(avgDaily, { currency, locale })}
        data={sparkData}
        color="#f59e0b"
      />
    </div>
  )
}

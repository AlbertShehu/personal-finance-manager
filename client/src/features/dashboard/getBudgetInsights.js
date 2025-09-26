// src/features/dashboard/getBudgetInsights.js
import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  isWithinInterval,
} from "date-fns"

/**
 * Analiza bazë për muajin AKTUAL:
 * - insights për ndryshime > threshold (default 25%) sipas kategorive (vetëm EXPENSE)
 * - "spotlight" i shpenzimit më të madh të muajit
 *
 * Nuk shton më një "note" për çdo transaksion (këtë e bën BudgetInsightCard për eventet e reja).
 */
export function getBudgetInsights(
  transactions,
  t,
  { changeThreshold = 0.25 } = {}
) {
  const now = new Date()
  const ym = format(now, "yyyy-MM")
  const prevDate = subMonths(now, 1)

  const curStart = startOfMonth(now)
  const curEnd = endOfMonth(now)
  const prevStart = startOfMonth(prevDate)
  const prevEnd = endOfMonth(prevDate)

  const inRange = (d, start, end) =>
    isWithinInterval(new Date(d), { start, end })

  const currentTx = transactions.filter((tx) =>
    inRange(tx.date, curStart, curEnd)
  )
  const prevTx = transactions.filter((tx) =>
    inRange(tx.date, prevStart, prevEnd)
  )

  // Shuma sipas kategorie vetëm për EXPENSE
  const sumByCat = (arr) =>
    arr.reduce((acc, tx) => {
      if (String(tx.type).toUpperCase() !== "EXPENSE") return acc
      const cat = tx.category || "Other"
      const amt = Math.abs(Number(tx.amount) || 0)
      acc[cat] = (acc[cat] || 0) + amt
      return acc
    }, {})

  const curTotals = sumByCat(currentTx)
  const prevTotals = sumByCat(prevTx)

  const insights = []

  // Ndryshime > threshold për muajin aktual
  for (const [category, curr] of Object.entries(curTotals)) {
    const prev = prevTotals[category] || 0
    const delta = curr - prev
    const ratio = prev === 0 ? 1 : delta / prev

    if (ratio > changeThreshold) {
      insights.push({
        key: `delta:inc:${ym}:${category}`,
        kind: "delta-inc",
        title: t("insight.increase.title", { category }),
        description: t("insight.increase.description", {
          amount: curr.toFixed(2),
          percent: (ratio * 100).toFixed(1),
        }),
      })
    } else if (ratio < -changeThreshold) {
      insights.push({
        key: `delta:dec:${ym}:${category}`,
        kind: "delta-dec",
        title: t("insight.decrease.title", { category }),
        description: t("insight.decrease.description", {
          amount: curr.toFixed(2),
          percent: Math.abs(ratio * 100).toFixed(1),
        }),
      })
    }
  }

  // Spotlight: shpenzimi më i madh në muajin aktual
  const currentExpenses = currentTx.filter(
    (tx) => String(tx.type).toUpperCase() === "EXPENSE"
  )
  if (currentExpenses.length) {
    const maxTx = currentExpenses.reduce((a, b) =>
      Math.abs(a.amount) > Math.abs(b.amount) ? a : b
    )
    insights.push({
      key: `largest:${ym}:${maxTx.category}:${maxTx.date}:${maxTx.amount}`,
      kind: "spotlight",
      title: t("insight.transaction.title", { category: maxTx.category }),
      description: t("insight.transaction.description", {
        date: format(new Date(maxTx.date), "dd-MM-yyyy"),
        type: t("insight.transaction.expense"),
        amount: Number(maxTx.amount).toFixed(2),
        category: maxTx.category,
      }),
    })
  }

  return insights
}

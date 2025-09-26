// src/components/dashboard/MonthlyBarChart.jsx
import React, { useMemo, useEffect, useState } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts"
import { useTranslation } from "react-i18next"

/* ----------------------- Helpers: theme + formatting ---------------------- */

function cssVarHsl(name) {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim()
  return raw ? `hsl(${raw})` : undefined
}

// Re-render kur ndryshon klasa 'dark' te :root (ndryshim teme)
function useThemeVersion() {
  const [, setTick] = useState(0)
  useEffect(() => {
    const root = document.documentElement
    const obs = new MutationObserver((m) => {
      if (m.some((x) => x.attributeName === "class")) setTick((v) => v + 1)
    })
    obs.observe(root, { attributes: true, attributeFilter: ["class"] })
    return () => obs.disconnect()
  }, [])
  return null
}

function fmtCurrency(n, currency = "EUR", locale = undefined) {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(Number(n) || 0)
  } catch {
    return `${Number(n || 0).toFixed(2)} ${currency}`
  }
}

function fmtAbbr(n) {
  const v = Math.abs(Number(n) || 0)
  if (v >= 1_000_000) return `${Math.sign(n) < 0 ? "-" : ""}${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `${Math.sign(n) < 0 ? "-" : ""}${(v / 1_000).toFixed(1)}k`
  return `${n}`
}

function monthLabel(date, locale) {
  return new Intl.DateTimeFormat(locale, { month: "short", year: "numeric" }).format(date)
}

function lastNMonths(n) {
  const arr = []
  const d = new Date()
  d.setDate(1)
  for (let i = n - 1; i >= 0; i--) {
    const copy = new Date(d.getFullYear(), d.getMonth() - i, 1)
    const key = `${copy.getFullYear()}-${String(copy.getMonth() + 1).padStart(2, "0")}`
    arr.push({ key, date: copy })
  }
  return arr
}

/* --------------------------------- Chart --------------------------------- */

export default function MonthlyBarChart({
  transactions = [],
  months = 12,
  currency = "EUR",
}) {
  const { t, i18n } = useTranslation()
  useThemeVersion()
  const locale = i18n.language || undefined

  // Ngjyra nga tema (fallback në Tailwind palette)
  const colors = useMemo(() => {
    const income = cssVarHsl("--chart-2") || "#22c55e" // green-500
    const expense = cssVarHsl("--chart-5") || "#ef4444" // red-500
    return { income, expense }
  }, [])

  // Përgatit 12 muajt e fundit, mbush me 0 kur s’ka të dhëna
  const data = useMemo(() => {
    const base = new Map(lastNMonths(months).map((m) => [m.key, { ...m, income: 0, expense: 0 }]))

    for (const tx of transactions) {
      if (!tx?.date) continue
      const d = new Date(tx.date)
      if (Number.isNaN(d.getTime())) continue
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      if (!base.has(key)) continue // jashtë dritares së 12 muajve
      const curr = base.get(key)
      const amt = Math.abs(Number(tx.amount) || 0)
      const type = String(tx.type || "").toUpperCase()
      if (type === "INCOME") curr.income += amt
      else if (type === "EXPENSE") curr.expense += amt
    }

    // Shfaq shpenzimet si vlera negative (që të dalin poshtë zeros)
    const rows = Array.from(base.values()).map((r) => ({
      label: monthLabel(r.date, locale),
      income: r.income,
      expense: -r.expense,
      incomeAbs: r.income,
      expenseAbs: r.expense,
      net: r.income - r.expense,
    }))
    return rows
  }, [transactions, months, locale])

  const hasAny = data.some((d) => d.incomeAbs > 0 || d.expenseAbs > 0)

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-4">{t("charts.monthly.title")}</h2>

      {!hasAny ? (
        <p className="text-sm text-muted-foreground">{t("charts.noCategoryData")}</p>
      ) : (
        <div className="h-[320px] w-full">
          <ResponsiveContainer>
            <BarChart
              data={data}
              margin={{ top: 8, right: 12, left: 8, bottom: 0 }}
              barCategoryGap={16}
              aria-label={t("charts.monthly.title")}
            >
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colors.income} stopOpacity={0.95} />
                  <stop offset="100%" stopColor={colors.income} stopOpacity={0.65} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colors.expense} stopOpacity={0.95} />
                  <stop offset="100%" stopColor={colors.expense} stopOpacity={0.65} />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: "currentColor", opacity: 0.8 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={{ stroke: "hsl(var(--border))" }}
              />
              <YAxis
                tickFormatter={(v) => fmtAbbr(v)}
                tick={{ fontSize: 12, fill: "currentColor", opacity: 0.8 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={{ stroke: "hsl(var(--border))" }}
              />

              <ReferenceLine y={0} stroke="hsl(var(--border))" />

              <Tooltip
                wrapperStyle={{ outline: "none" }}
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 12,
                }}
                formatter={(value, name, { payload }) => {
                  if (name === "income") return [fmtCurrency(payload.incomeAbs, currency, locale), t("charts.monthly.income")]
                  if (name === "expense") return [fmtCurrency(payload.expenseAbs, currency, locale), t("charts.monthly.expense")]
                  return [fmtCurrency(value, currency, locale), name]
                }}
                labelFormatter={(label, payload) => {
                  const p = payload?.[0]?.payload
                  return `${label} · ${t("overview.total")}: ${fmtCurrency(p?.net ?? 0, currency, locale)}`
                }}
              />

              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: 8 }}
                formatter={(value) =>
                  value === "income" ? t("charts.monthly.income") : t("charts.monthly.expense")
                }
              />

              {/* Shiritë e grumbulluar rreth zeros */}
              <Bar
                dataKey="income"
                stackId="side-by-side"
                fill="url(#incomeGrad)"
                radius={[6, 6, 0, 0]}
                name="income"
              />
              <Bar
                dataKey="expense"
                stackId="stack"
                fill="url(#expenseGrad)"
                radius={[0, 0, 6, 6]}
                name="expense"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

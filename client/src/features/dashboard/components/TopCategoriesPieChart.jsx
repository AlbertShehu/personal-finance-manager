/* eslint-disable no-unused-vars */
// src/components/dashboard/TopCategoriesPieChart.jsx
import React, { useMemo, useState, useEffect } from "react"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { useTranslation } from "react-i18next"
import { formatCurrency } from "@/lib/utils"

/* ----------------------- Ndihmës: tema + monedha ----------------------- */

function cssVarHsl(name) {
  if (typeof window === "undefined") return undefined
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim()
  return raw ? `hsl(${raw})` : undefined
}

// shkakton re-render kur ndryshon tema (klasa 'dark' te :root)
function useThemeVersion() {
  const [, setTick] = useState(0)
  useEffect(() => {
    if (typeof window === "undefined") return
    const root = document.documentElement
    const obs = new MutationObserver((m) => {
      if (m.some((x) => x.attributeName === "class")) setTick((v) => v + 1)
    })
    obs.observe(root, { attributes: true, attributeFilter: ["class"] })
    return () => obs.disconnect()
  }, [])
  return null
}

/* ------------------------------ Komponenti ------------------------------- */

export default function TopCategoriesPieChart({
  transactions = [],
  // opsional: shfaq vetëm shpenzimet (default), ose përfshi edhe të ardhurat
  includeIncome = false,
  // sa kategori të shfaqen si “top”; të tjerat grumbullohen te “Other”
  topN = 5,
  currency = "EUR",
}) {
  const { t, i18n } = useTranslation()
  useThemeVersion() // thjesht për re-render në ndryshim të temës
  const locale = i18n.language || undefined

  // Ngjyrat nga tema (me fallback)
  const COLORS = useMemo(() => {
    const themed = [
      cssVarHsl("--chart-1"),
      cssVarHsl("--chart-2"),
      cssVarHsl("--chart-3"),
      cssVarHsl("--chart-4"),
      cssVarHsl("--chart-5"),
    ].filter(Boolean)
    const fallback = ["#4ade80", "#f87171", "#60a5fa", "#fbbf24", "#a78bfa", "#34d399"]
    return themed.length ? themed : fallback
  }, [])

  // Grupim i shumave sipas kategorie (default: vetëm EXPENSE)
  const { data, total } = useMemo(() => {
    const map = new Map()
    for (const tx of transactions) {
      const type = String(tx.type || "").toUpperCase()
      if (!includeIncome && type !== "EXPENSE") continue
      if (includeIncome && type !== "EXPENSE" && type !== "INCOME") continue

      const cat = tx.category || t("charts.uncategorized", "Uncategorized")
      const amt = Math.abs(Number(tx.amount) || 0)
      map.set(cat, (map.get(cat) || 0) + amt)
    }

    if (map.size === 0) return { data: [], total: 0 }

    // rendit zbritës dhe nda topN
    const sorted = Array.from(map, ([name, value]) => ({ name, value })).sort(
      (a, b) => b.value - a.value
    )

    const top = sorted.slice(0, topN)
    const rest = sorted.slice(topN)
    const otherSum = rest.reduce((acc, x) => acc + x.value, 0)

    const final = otherSum
      ? [
          ...top,
          { name: t("charts.other", "Other"), value: otherSum, isOther: true },
        ]
      : top

    const total = final.reduce((acc, x) => acc + x.value, 0)
    return { data: final, total }
  }, [transactions, includeIncome, topN, t])

  if (data.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-2">
          {t("charts.topCategories")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("charts.noCategoryData")}
        </p>
      </div>
    )
  }

  // label i personalizuar për përqindje (vetëm > 6%)
  const renderLabel = ({ value, percent }) => {
    if (!total) return ""
    const p = percent * 100
    if (p < 6) return "" // mos e mbush me etiketa shumë të vogla
    return `${p.toFixed(0)}%`
  }

  const tooltipFormatter = (val, name, { payload }) => {
    const pct = total ? ` (${((val / total) * 100).toFixed(1)}%)` : ""
    const display = `${formatCurrency(val, { currency, locale, symbolPosition: 'auto' })}${pct}`
    // kthe [value, name] sipas API të Recharts
    return [display, payload?.name ?? name]
  }

  return (
    <div className="relative rounded-xl border bg-card p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-4">
        {t("charts.topCategories")}
      </h2>

      <div className="h-[320px] w-full">
        <ResponsiveContainer>
          <PieChart aria-label={t("charts.topCategories")}>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={110}
              paddingAngle={2}
              labelLine={false}
              label={renderLabel}
              isAnimationActive
            >
              {data.map((entry, i) => (
                <Cell
                  key={entry.name}
                  fill={COLORS[i % COLORS.length]}
                  stroke="var(--tw-ring-color, transparent)"
                />
              ))}
            </Pie>

            <Tooltip
              formatter={tooltipFormatter}
              contentStyle={{
                background: "var(--tooltip-bg, hsl(var(--popover)))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 10,
              }}
              wrapperStyle={{ outline: "none" }}
            />

            <Legend
              verticalAlign="bottom"
              iconType="circle"
              wrapperStyle={{ paddingTop: 8 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Total në qendër (overlay) */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            {includeIncome ? t("overview.total") : t("charts.monthly.expense")}
          </div>
          <div className="text-lg font-semibold">
            {formatCurrency(total, { currency, locale, symbolPosition: 'before' })}
          </div>
        </div>
      </div>
    </div>
  )
}

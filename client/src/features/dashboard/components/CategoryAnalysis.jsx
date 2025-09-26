// src/components/dashboard/CategoryAnalysis.jsx
import React, { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { motion } from "framer-motion"
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3,
  PieChart,
  Calendar,
  Target
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"

export default function CategoryAnalysis({ transactions = [], currency = "EUR" }) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language

  // Analizo kategoritë
  const categoryAnalysis = useMemo(() => {
    if (!transactions.length) return []

    const categoryData = {}
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    transactions.forEach(tx => {
      if (tx.type !== 'EXPENSE') return

      const category = tx.category || 'Other'
      const txDate = new Date(tx.date)
      const amount = Math.abs(Number(tx.amount) || 0)
      const isCurrentMonth = txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear

      if (!categoryData[category]) {
        categoryData[category] = {
          total: 0,
          currentMonth: 0,
          count: 0,
          avgAmount: 0,
          trend: 0
        }
      }

      categoryData[category].total += amount
      categoryData[category].count += 1
      if (isCurrentMonth) {
        categoryData[category].currentMonth += amount
      }
    })

    // Llogarit mesataren dhe trendin
    Object.keys(categoryData).forEach(category => {
      const data = categoryData[category]
      data.avgAmount = data.count > 0 ? data.total / data.count : 0
      
      // Llogarit trendin (krahaso muajin aktual me muajin e kaluar)
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear
      
      const prevMonthTotal = transactions
        .filter(tx => {
          if (tx.type !== 'EXPENSE' || tx.category !== category) return false
          const txDate = new Date(tx.date)
          return txDate.getMonth() === prevMonth && txDate.getFullYear() === prevYear
        })
        .reduce((sum, tx) => sum + Math.abs(Number(tx.amount) || 0), 0)

      if (prevMonthTotal > 0) {
        data.trend = ((data.currentMonth - prevMonthTotal) / prevMonthTotal) * 100
      }
    })

    return Object.entries(categoryData)
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.total - a.total)
  }, [transactions])

  // Llogarit totalet
  const totals = useMemo(() => {
    const totalExpenses = transactions
      .filter(tx => tx.type === 'EXPENSE')
      .reduce((sum, tx) => sum + Math.abs(Number(tx.amount) || 0), 0)

    const currentMonthExpenses = transactions
      .filter(tx => {
        if (tx.type !== 'EXPENSE') return false
        const txDate = new Date(tx.date)
        const currentMonth = new Date().getMonth()
        const currentYear = new Date().getFullYear()
        return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear
      })
      .reduce((sum, tx) => sum + Math.abs(Number(tx.amount) || 0), 0)

    return { totalExpenses, currentMonthExpenses }
  }, [transactions])

  if (categoryAnalysis.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-6 shadow-sm text-center">
        <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">{t("categoryAnalysis.noData", "Nuk ka të dhëna")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("categoryAnalysis.noDataDesc", "Shtoni transaksione për të parë analizën e kategorive")}
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
          <BarChart3 className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">{t("categoryAnalysis.title", "Analiza e Kategorive")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("categoryAnalysis.desc", "Shpenzimet sipas kategorive me trendet")}
          </p>
        </div>
      </div>

      {/* Totalet */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-600">
              {t("categoryAnalysis.totalExpenses", "Shpenzimet Totale")}
            </span>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(totals.totalExpenses, { currency, locale })}
          </div>
        </div>

        <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-600">
              {t("categoryAnalysis.currentMonth", "Muaji Aktual")}
            </span>
          </div>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(totals.currentMonthExpenses, { currency, locale })}
          </div>
        </div>
      </div>

      {/* Lista e kategorive */}
      <div className="space-y-3">
        {categoryAnalysis.slice(0, 8).map((item, index) => (
          <motion.div
            key={item.category}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600" />
                <span className="font-medium">{item.category}</span>
              </div>
              <div className="flex items-center gap-2">
                {item.trend !== 0 && (
                  <div className={`flex items-center gap-1 text-sm ${
                    item.trend > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {item.trend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    <span>{Math.abs(item.trend).toFixed(1)}%</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground mb-1">
                  {t("categoryAnalysis.total", "Total")}
                </div>
                <div className="font-semibold">
                  {formatCurrency(item.total, { currency, locale })}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">
                  {t("categoryAnalysis.currentMonth", "Muaji Aktual")}
                </div>
                <div className="font-semibold">
                  {formatCurrency(item.currentMonth, { currency, locale })}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">
                  {t("categoryAnalysis.count", "Numri")}
                </div>
                <div className="font-semibold">{item.count}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">
                  {t("categoryAnalysis.average", "Mesatarja")}
                </div>
                <div className="font-semibold">
                  {formatCurrency(item.avgAmount, { currency, locale })}
                </div>
              </div>
            </div>

            {/* Progress bar për përqindjen */}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>{t("categoryAnalysis.percentage", "Përqindja")}</span>
                <span>{((item.total / totals.totalExpenses) * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(item.total / totals.totalExpenses) * 100}%` }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {categoryAnalysis.length > 8 && (
        <div className="mt-4 text-center">
          <span className="text-sm text-muted-foreground">
            {t("categoryAnalysis.showing", "Duke shfaqur")} 8 {t("categoryAnalysis.of", "nga")} {categoryAnalysis.length} {t("categoryAnalysis.categories", "kategori")}
          </span>
        </div>
      )}
    </div>
  )
}

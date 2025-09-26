// src/components/dashboard/TransactionTrends.jsx
import React, { useMemo, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { motion } from "framer-motion"
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  DollarSign,
  BarChart3,
  Activity,
  Target,
  Zap
} from "lucide-react"
import { format, startOfMonth, endOfMonth, subMonths, eachMonthOfInterval } from "date-fns"
import { formatCurrency } from "@/lib/utils"

export default function TransactionTrends({ transactions = [], loading = false, currency = "EUR", onRefresh }) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language

  // Debug: log transactions to see if data is being received
  useEffect(() => {
    console.log('TransactionTrends - Received transactions:', transactions.length, transactions)
  }, [transactions])

  // Analizo trendet mujore
  const monthlyTrends = useMemo(() => {
    if (!transactions.length) return []

    const now = new Date()
    const sixMonthsAgo = subMonths(now, 5)
    const months = eachMonthOfInterval({ start: sixMonthsAgo, end: now })

    return months.map(month => {
      const monthStart = startOfMonth(month)
      const monthEnd = endOfMonth(month)
      
      const monthTransactions = transactions.filter(tx => {
        const txDate = new Date(tx.date)
        return txDate >= monthStart && txDate <= monthEnd
      })

      const income = monthTransactions
        .filter(tx => tx.type === 'INCOME')
        .reduce((sum, tx) => sum + Math.abs(Number(tx.amount) || 0), 0)

      const expense = monthTransactions
        .filter(tx => tx.type === 'EXPENSE')
        .reduce((sum, tx) => sum + Math.abs(Number(tx.amount) || 0), 0)

      const net = income - expense

      return {
        month: format(month, 'MMM yyyy'),
        monthShort: format(month, 'MMM'),
        income,
        expense,
        net,
        transactionCount: monthTransactions.length
      }
    })
  }, [transactions])

  // Llogarit trendet
  const trends = useMemo(() => {
    if (monthlyTrends.length < 2) return null

    const current = monthlyTrends[monthlyTrends.length - 1]
    const previous = monthlyTrends[monthlyTrends.length - 2]

    const incomeTrend = previous.income > 0 ? ((current.income - previous.income) / previous.income) * 100 : 0
    const expenseTrend = previous.expense > 0 ? ((current.expense - previous.expense) / previous.expense) * 100 : 0
    const netTrend = previous.net !== 0 ? ((current.net - previous.net) / Math.abs(previous.net)) * 100 : 0

    return {
      income: incomeTrend,
      expense: expenseTrend,
      net: netTrend
    }
  }, [monthlyTrends])

  // Llogarit mesataret
  const averages = useMemo(() => {
    if (monthlyTrends.length === 0) return null

    const totalIncome = monthlyTrends.reduce((sum, month) => sum + month.income, 0)
    const totalExpense = monthlyTrends.reduce((sum, month) => sum + month.expense, 0)
    const totalNet = monthlyTrends.reduce((sum, month) => sum + month.net, 0)
    const totalTransactions = monthlyTrends.reduce((sum, month) => sum + month.transactionCount, 0)

    return {
      income: totalIncome / monthlyTrends.length,
      expense: totalExpense / monthlyTrends.length,
      net: totalNet / monthlyTrends.length,
      transactions: totalTransactions / monthlyTrends.length
    }
  }, [monthlyTrends])

  if (loading) {
    return (
      <div className="rounded-xl border bg-card p-6 shadow-sm text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h3 className="text-lg font-semibold mb-2">{t("trends.loading", "Duke ngarkuar...")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("trends.loadingDesc", "Duke ngarkuar trendet e transaksioneve")}
        </p>
      </div>
    )
  }

  if (monthlyTrends.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-6 shadow-sm text-center">
        <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">{t("trends.noData", "Nuk ka të dhëna")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("trends.noDataDesc", "Shtoni transaksione për të parë trendet")}
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-blue-600">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{t("trends.title", "Trendet e Transaksioneve")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("trends.desc", "Analiza e trendeve mujore për 6 muajt e fundit")}
            </p>
          </div>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            <svg className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {t("trends.refresh", "Rifresko")}
          </button>
        )}
      </div>

      {/* Trendet aktuale */}
      {trends && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">
                {t("trends.incomeTrend", "Trendi i Të Ardhurave")}
              </span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {trends.income > 0 ? '+' : ''}{trends.income.toFixed(1)}%
            </div>
          </div>

          <div className="p-4 rounded-lg bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-600">
                {t("trends.expenseTrend", "Trendi i Shpenzimeve")}
              </span>
            </div>
            <div className="text-2xl font-bold text-red-600">
              {trends.expense > 0 ? '+' : ''}{trends.expense.toFixed(1)}%
            </div>
          </div>

          <div className={`p-4 rounded-lg ${
            trends.net > 0 
              ? 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20'
              : 'bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">
                {t("trends.netTrend", "Trendi Neto")}
              </span>
            </div>
            <div className={`text-2xl font-bold ${
              trends.net > 0 ? 'text-blue-600' : 'text-orange-600'
            }`}>
              {trends.net > 0 ? '+' : ''}{trends.net.toFixed(1)}%
            </div>
          </div>
        </div>
      )}

      {/* Mesataret */}
      {averages && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-sm text-muted-foreground mb-1">
              {t("trends.avgIncome", "Mes. Të Ardhura")}
            </div>
            <div className="font-semibold text-green-600">
              {formatCurrency(averages.income, { currency, locale })}
            </div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-sm text-muted-foreground mb-1">
              {t("trends.avgExpense", "Mes. Shpenzime")}
            </div>
            <div className="font-semibold text-red-600">
              {formatCurrency(averages.expense, { currency, locale })}
            </div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-sm text-muted-foreground mb-1">
              {t("trends.avgNet", "Mes. Neto")}
            </div>
            <div className={`font-semibold ${
              averages.net > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(averages.net, { currency, locale })}
            </div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-sm text-muted-foreground mb-1">
              {t("trends.avgTransactions", "Mes. Transaksione")}
            </div>
            <div className="font-semibold text-blue-600">
              {averages.transactions.toFixed(0)}
            </div>
          </div>
        </div>
      )}

      {/* Grafik i thjeshtë */}
      <div className="space-y-4">
        <h3 className="font-semibold">{t("trends.monthlyBreakdown", "Ndarja Mujore")}</h3>
        <div className="space-y-3">
          {monthlyTrends.map((month, index) => (
            <motion.div
              key={month.month}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{month.month}</span>
                <span className={`text-sm font-semibold ${
                  month.net > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(month.net, { currency, locale })}
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-muted-foreground mb-1">
                    {t("trends.income", "Të Ardhura")}
                  </div>
                  <div className="font-semibold text-green-600">
                    {formatCurrency(month.income, { currency, locale })}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-muted-foreground mb-1">
                    {t("trends.expense", "Shpenzime")}
                  </div>
                  <div className="font-semibold text-red-600">
                    {formatCurrency(month.expense, { currency, locale })}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-muted-foreground mb-1">
                    {t("trends.transactions", "Transaksione")}
                  </div>
                  <div className="font-semibold text-blue-600">
                    {month.transactionCount}
                  </div>
                </div>
              </div>

              {/* Progress bar për shpenzimet */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>{t("trends.expenseRatio", "Raporti i Shpenzimeve")}</span>
                  <span>{month.income > 0 ? ((month.expense / month.income) * 100).toFixed(1) : 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${month.income > 0 ? Math.min(100, (month.expense / month.income) * 100) : 0}%` 
                    }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

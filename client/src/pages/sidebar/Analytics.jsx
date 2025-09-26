// src/pages/Analytics.jsx
import React from "react"
import { useTranslation } from "react-i18next"
import Header from "@/features/dashboard/components/Header"
import useTransactions from "@/features/transactions/hooks/useTransactions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, DollarSign, BarChart3, RefreshCw } from "lucide-react"

export default function Analytics() {
  const { t, i18n } = useTranslation()
  const { transactions = [], loading, error, refetch } = useTransactions()

  // Llogaritja e statistikave
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const currentMonthTransactions = transactions.filter(tx => {
    const txDate = new Date(tx.date)
    return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear
  })

  const income = currentMonthTransactions
    .filter(tx => tx.type === 'INCOME')
    .reduce((sum, tx) => sum + tx.amount, 0)

  const expenses = currentMonthTransactions
    .filter(tx => tx.type === 'EXPENSE')
    .reduce((sum, tx) => sum + tx.amount, 0)

  const balance = income - expenses

  // Analiza e kategorive
  const categoryAnalysis = currentMonthTransactions
    .filter(tx => tx.type === 'EXPENSE')
    .reduce((acc, tx) => {
      const category = tx.category || 'Other'
      acc[category] = (acc[category] || 0) + tx.amount
      return acc
    }, {})

  const topCategories = Object.entries(categoryAnalysis)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)

  // Analiza mujore (6 muajt e fundit)
  const monthlyData = []
  for (let i = 5; i >= 0; i--) {
    const month = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthTransactions = transactions.filter(tx => {
      const txDate = new Date(tx.date)
      return txDate.getMonth() === month.getMonth() && 
             txDate.getFullYear() === month.getFullYear()
    })
    
    const monthIncome = monthTransactions
      .filter(tx => tx.type === 'INCOME')
      .reduce((sum, tx) => sum + tx.amount, 0)
    
    const monthExpenses = monthTransactions
      .filter(tx => tx.type === 'EXPENSE')
      .reduce((sum, tx) => sum + tx.amount, 0)

    // Get current language for proper month formatting
    const currentLang = i18n.language || 'en'
    const localeMap = {
      'sq': 'sq-AL',
      'de': 'de-DE', 
      'en': 'en-US'
    }
    const locale = localeMap[currentLang] || 'en-US'
    
    monthlyData.push({
      month: month.toLocaleDateString(locale, { month: 'short' }),
      income: monthIncome,
      expenses: monthExpenses,
      balance: monthIncome - monthExpenses
    })
  }

  if (loading) {
    return (
      <main className="space-y-8 px-4 sm:px-6 py-6">
        <Header title={t("analytics.title", "Analitika")} subtitle={t("analytics.subtitle", "Analiza e detajuar financiare")} />
        <div className="text-center py-8">
          <div className="text-muted-foreground">{t("analytics.loading", "Duke ngarkuar...")}</div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="space-y-8 px-4 sm:px-6 py-6">
        <Header title={t("analytics.title", "Analitika")} subtitle={t("analytics.subtitle", "Analiza e detajuar financiare")} />
        <div className="text-center py-8">
          <div className="text-red-500">{t("analytics.error", "Gabim në ngarkimin e të dhënave")}</div>
        </div>
      </main>
    )
  }

  return (
    <main className="space-y-8 px-4 sm:px-6 py-6" aria-label={t("analytics.title", "Analitika")}>
      <div className="flex items-center justify-between">
        <Header 
          title={t("analytics.title", "Analitika")} 
          subtitle={t("analytics.subtitle", "Analiza e detajuar financiare")} 
        />
        <Button
          variant="outline"
          size="sm"
          onClick={refetch}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {t("analytics.refresh", "Rifresko")}
        </Button>
      </div>

      {/* Statistikat kryesore */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("analytics.totalIncome", "Të ardhurat totale")}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              +{income.toFixed(2)}€
            </div>
            <p className="text-xs text-muted-foreground">
              {t("analytics.thisMonth", "Këtë muaj")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("analytics.totalExpenses", "Shpenzimet totale")}
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              -{expenses.toFixed(2)}€
            </div>
            <p className="text-xs text-muted-foreground">
              {t("analytics.thisMonth", "Këtë muaj")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("analytics.netBalance", "Bilanci neto")}
            </CardTitle>
            <DollarSign className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {balance >= 0 ? '+' : ''}{balance.toFixed(2)}€
            </div>
            <p className="text-xs text-muted-foreground">
              {t("analytics.thisMonth", "Këtë muaj")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("analytics.transactions", "Transaksionet")}
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {currentMonthTransactions.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("analytics.thisMonth", "Këtë muaj")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analiza e kategorive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("analytics.topCategories", "Kategoritë kryesore")}</CardTitle>
            <CardDescription>
              {t("analytics.topCategoriesDesc", "Shpenzimet sipas kategorive këtë muaj")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topCategories.length > 0 ? (
              <div className="space-y-4">
                {topCategories.map(([category, amount], index) => (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-sm font-medium capitalize">{category}</span>
                    </div>
                    <span className="text-sm font-semibold text-red-600">
                      -{amount.toFixed(2)}€
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                {t("analytics.noData", "Nuk ka të dhëna për këtë muaj")}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("analytics.monthlyTrend", "Trendi mujor")}</CardTitle>
            <CardDescription>
              {t("analytics.monthlyTrendDesc", "Të ardhurat dhe shpenzimet 6 muajt e fundit")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthlyData.map((data, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="text-sm font-medium">{data.month}</div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-green-600">+{data.income.toFixed(0)}€</span>
                    <span className="text-red-600">-{data.expenses.toFixed(0)}€</span>
                    <span className={`font-semibold ${data.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {data.balance >= 0 ? '+' : ''}{data.balance.toFixed(0)}€
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informacione shtesë */}
      <Card>
        <CardHeader>
          <CardTitle>{t("analytics.insights", "Vlerësime")}</CardTitle>
          <CardDescription>
            {t("analytics.insightsDesc", "Analiza dhe rekomandime bazuar në të dhënat tuaja")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {balance < 0 && (
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                  <TrendingDown className="h-4 w-4" />
                  <span className="font-medium">{t("analytics.negativeBalance", "Bilanç negativ")}</span>
                </div>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {t("analytics.negativeBalanceDesc", "Shpenzoni më shumë se të ardhurat. Konsideroni reduktimin e shpenzimeve.")}
                </p>
              </div>
            )}
            
            {topCategories.length > 0 && (
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                  <BarChart3 className="h-4 w-4" />
                  <span className="font-medium">{t("analytics.topSpending", "Shpenzimet kryesore")}</span>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  {t("analytics.topSpendingDesc", `Kategoria "${topCategories[0]?.[0]}" është ajo me shpenzimet më të mëdha këtë muaj.`)}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  )
}


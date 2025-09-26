// src/components/dashboard/SmartInsights.jsx
import React, { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  PiggyBank, 
  AlertTriangle, 
  Lightbulb,
  Calendar,
  DollarSign,
  BarChart3,
  Zap,
  Heart,
  Star
} from "lucide-react"
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval, differenceInDays } from "date-fns"

// Analiza e avancuar e të dhënave financiare
function analyzeFinancialData(transactions, t) {
  const now = new Date()
  const currentMonth = format(now, "yyyy-MM")
  const prevMonth = format(subMonths(now, 1), "yyyy-MM")
  
  // Filtro transaksionet për muajin aktual dhe të kaluar
  const currentTx = transactions.filter(tx => {
    const txDate = new Date(tx.date)
    const isCurrent = isWithinInterval(txDate, { 
      start: startOfMonth(now), 
      end: endOfMonth(now) 
    })
    if (isCurrent) {
      console.log("Current month transaction:", tx)
    }
    return isCurrent
  })
  
  const prevTx = transactions.filter(tx => {
    const txDate = new Date(tx.date)
    const isPrev = isWithinInterval(txDate, { 
      start: startOfMonth(subMonths(now, 1)), 
      end: endOfMonth(subMonths(now, 1)) 
    })
    if (isPrev) {
      console.log("Previous month transaction:", tx)
    }
    return isPrev
  })

  // Llogarit totalet
  const currentIncome = currentTx
    .filter(tx => tx.type === "INCOME")
    .reduce((sum, tx) => sum + Math.abs(Number(tx.amount) || 0), 0)
  
  const currentExpenses = currentTx
    .filter(tx => tx.type === "EXPENSE")
    .reduce((sum, tx) => sum + Math.abs(Number(tx.amount) || 0), 0)
  
  const prevIncome = prevTx
    .filter(tx => tx.type === "INCOME")
    .reduce((sum, tx) => sum + Math.abs(Number(tx.amount) || 0), 0)
  
  const prevExpenses = prevTx
    .filter(tx => tx.type === "EXPENSE")
    .reduce((sum, tx) => sum + Math.abs(Number(tx.amount) || 0), 0)

  // Llogarit kategoritë më të shpenzuara
  const categorySpending = currentTx
    .filter(tx => tx.type === "EXPENSE")
    .reduce((acc, tx) => {
      const category = tx.category || "Other"
      acc[category] = (acc[category] || 0) + Math.abs(Number(tx.amount) || 0)
      return acc
    }, {})

  const topCategory = Object.entries(categorySpending)
    .sort(([,a], [,b]) => b - a)[0]

  // Llogarit trendet
  const incomeTrend = prevIncome > 0 ? ((currentIncome - prevIncome) / prevIncome) * 100 : 0
  const expenseTrend = prevExpenses > 0 ? ((currentExpenses - prevExpenses) / prevExpenses) * 100 : 0
  const savingsRate = currentIncome > 0 ? ((currentIncome - currentExpenses) / currentIncome) * 100 : 0

  // Llogarit shpenzimet mesatare ditore
  const daysInMonth = differenceInDays(endOfMonth(now), startOfMonth(now)) + 1
  const dailySpending = currentExpenses / daysInMonth

  return {
    currentIncome,
    currentExpenses,
    prevIncome,
    prevExpenses,
    incomeTrend,
    expenseTrend,
    savingsRate,
    dailySpending,
    topCategory,
    categorySpending,
    currentTx,
    prevTx
  }
}

// Gjeneron rekomandime të personalizuara
function generateSmartRecommendations(data, t) {
  const recommendations = []
  const { 
    incomeTrend, 
    expenseTrend, 
    savingsRate, 
    dailySpending, 
    topCategory,
    currentIncome,
    currentExpenses,
    categorySpending
  } = data

  // 1. Rekomandime për kursime
  if (savingsRate < 10) {
    recommendations.push({
      id: "low-savings",
      type: "warning",
      icon: PiggyBank,
      title: t("smartInsights.lowSavings.title", "Kursime të ulëta"),
      description: t("smartInsights.lowSavings.description", 
        `Kursimet tuaja janë vetëm ${savingsRate.toFixed(1)}%. Qëlloni për të paktën 20% për stabilitet financiar.`, 
        { rate: savingsRate.toFixed(1) }),
      action: t("smartInsights.lowSavings.action", "Rishikoni shpenzimet tuaja"),
      priority: "high"
    })
  } else if (savingsRate > 30) {
    recommendations.push({
      id: "excellent-savings",
      type: "success",
      icon: Star,
      title: t("smartInsights.excellentSavings.title", "Kursime të shkëlqyera! 🎉"),
      description: t("smartInsights.excellentSavings.description", 
        `Kursimet tuaja janë ${savingsRate.toFixed(1)}% - shkëlqyeshëm! Vazhdoni kështu.`, 
        { rate: savingsRate.toFixed(1) }),
      action: t("smartInsights.excellentSavings.action", "Konsideroni investime"),
      priority: "low"
    })
  }

  // 2. Rekomandime për trendet e të ardhurave
  if (incomeTrend < -10) {
    recommendations.push({
      id: "income-decline",
      type: "warning",
      icon: TrendingDown,
      title: t("smartInsights.incomeDecline.title", "Rënie në të ardhura"),
      description: t("smartInsights.incomeDecline.description", 
        `Të ardhurat tuaja u ulën me ${Math.abs(incomeTrend).toFixed(1)}% krahasuar me muajin e kaluar.`, 
        { percent: Math.abs(incomeTrend).toFixed(1) }),
      action: t("smartInsights.incomeDecline.action", "Kërkoni mundësi të reja"),
      priority: "high"
    })
  } else if (incomeTrend > 20) {
    recommendations.push({
      id: "income-growth",
      type: "success",
      icon: TrendingUp,
      title: t("smartInsights.incomeGrowth.title", "Rritje e shkëlqyer në të ardhura! 📈"),
      description: t("smartInsights.incomeGrowth.description", 
        `Të ardhurat tuaja u rritën me ${incomeTrend.toFixed(1)}% - fantastike!`, 
        { percent: incomeTrend.toFixed(1) }),
      action: t("smartInsights.incomeGrowth.action", "Rishikoni buxhetin tuaj"),
      priority: "medium"
    })
  }

  // 3. Rekomandime për shpenzimet
  if (expenseTrend > 25) {
    recommendations.push({
      id: "expense-increase",
      type: "warning",
      icon: AlertTriangle,
      title: t("smartInsights.expenseIncrease.title", "Rritje e shpejtë në shpenzime"),
      description: t("smartInsights.expenseIncrease.description", 
        `Shpenzimet u rritën me ${expenseTrend.toFixed(1)}%. Kontrolloni buxhetin tuaj.`, 
        { percent: expenseTrend.toFixed(1) }),
      action: t("smartInsights.expenseIncrease.action", "Identifikoni shpenzimet e panevojshme"),
      priority: "high"
    })
  }

  // 4. Rekomandime për kategorinë më të shpenzuar
  if (topCategory && topCategory[1] > currentIncome * 0.4) {
    recommendations.push({
      id: "high-category-spending",
      type: "info",
      icon: Target,
      title: t("smartInsights.highCategorySpending.title", "Shpenzim i lartë në kategori"),
      description: t("smartInsights.highCategorySpending.description", 
        `Shpenzoni ${topCategory[1].toFixed(2)}€ në ${topCategory[0]} (${((topCategory[1]/currentIncome)*100).toFixed(1)}% e të ardhurave).`, 
        { 
          amount: topCategory[1].toFixed(2), 
          category: topCategory[0], 
          percentage: ((topCategory[1]/currentIncome)*100).toFixed(1) 
        }),
      action: t("smartInsights.highCategorySpending.action", "Konsideroni reduktimin"),
      priority: "medium"
    })
  }

  // 5. Rekomandime për shpenzimet ditore
  if (dailySpending > 50) {
    recommendations.push({
      id: "high-daily-spending",
      type: "info",
      icon: Calendar,
      title: t("smartInsights.highDailySpending.title", "Shpenzime ditore të larta"),
      description: t("smartInsights.highDailySpending.description", 
        `Shpenzoni mesatarisht ${dailySpending.toFixed(2)}€ në ditë.`, 
        { amount: dailySpending.toFixed(2) }),
      action: t("smartInsights.highDailySpending.action", "Planifikoni shpenzimet tuaja"),
      priority: "medium"
    })
  }

  // 6. Rekomandime për balancë
  if (currentIncome > 0 && currentExpenses > 0) {
    const balance = currentIncome - currentExpenses
    if (balance < 0) {
      recommendations.push({
        id: "negative-balance",
        type: "error",
        icon: AlertTriangle,
        title: t("smartInsights.negativeBalance.title", "Bilanç negativ"),
        description: t("smartInsights.negativeBalance.description", 
          `Shpenzoni ${Math.abs(balance).toFixed(2)}€ më shumë se të ardhurat.`, 
          { amount: Math.abs(balance).toFixed(2) }),
        action: t("smartInsights.negativeBalance.action", "Reduktoni shpenzimet menjëherë"),
        priority: "critical"
      })
    }
  }

  // 7. Rekomandime për diversifikim
  const categoryCount = Object.keys(categorySpending).length
  if (categoryCount < 3 && currentExpenses > 0) {
    recommendations.push({
      id: "diversify-spending",
      type: "info",
      icon: BarChart3,
      title: t("smartInsights.diversifySpending.title", "Diversifikoni shpenzimet"),
      description: t("smartInsights.diversifySpending.description", 
        `Shpenzimet tuaja janë të përqendruara në vetëm ${categoryCount} kategori.`, 
        { count: categoryCount }),
      action: t("smartInsights.diversifySpending.action", "Konsideroni kategoritë e tjera"),
      priority: "low"
    })
  }

  // 8. Rekomandime për investime (nëse kursimet janë të mira)
  if (savingsRate > 20 && currentIncome > 1000) {
    recommendations.push({
      id: "consider-investing",
      type: "success",
      icon: Zap,
      title: t("smartInsights.considerInvesting.title", "Konsideroni investime"),
      description: t("smartInsights.considerInvesting.description", 
        `Me kursime prej ${savingsRate.toFixed(1)}%, mund të konsideroni investime për rritje afatgjatë.`, 
        { rate: savingsRate.toFixed(1) }),
      action: t("smartInsights.considerInvesting.action", "Kërkoni këshilla investimi"),
      priority: "low"
    })
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })
}

export default function SmartInsights({ transactions = [] }) {
  const { t } = useTranslation()
  const [recommendations, setRecommendations] = useState([])
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    console.log("SmartInsights - transactions received:", transactions)
    
    if (!transactions || transactions.length === 0) {
      setRecommendations([])
      return
    }

    const data = analyzeFinancialData(transactions, t)
    console.log("SmartInsights - analyzed data:", data)
    
    const smartRecs = generateSmartRecommendations(data, t)
    console.log("SmartInsights - generated recommendations:", smartRecs)
    
    setRecommendations(smartRecs)
  }, [transactions, t])

  if (recommendations.length === 0) {
    return (
      <div className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="font-semibold text-blue-900 dark:text-blue-100">
            {t("smartInsights.noData.title", "Nuk ka të dhëna të mjaftueshme")}
          </h3>
        </div>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          {t("smartInsights.noData.description", "Shtoni më shumë transaksione për të marrë rekomandime të personalizuara AI.")}
        </p>
      </div>
    )
  }

  const visible = expanded ? recommendations : recommendations.slice(0, 3)

  const getTypeStyles = (type) => {
    switch (type) {
      case "critical":
        return "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
      case "error":
        return "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
      case "warning":
        return "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800"
      case "success":
        return "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
      case "info":
        return "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
      default:
        return "bg-gray-50 dark:bg-gray-950/20 border-gray-200 dark:border-gray-800"
    }
  }

  const getIconColor = (type) => {
    switch (type) {
      case "critical":
      case "error":
        return "text-red-600 dark:text-red-400"
      case "warning":
        return "text-yellow-600 dark:text-yellow-400"
      case "success":
        return "text-green-600 dark:text-green-400"
      case "info":
        return "text-blue-600 dark:text-blue-400"
      default:
        return "text-gray-600 dark:text-gray-400"
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30">
          <Heart className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        </div>
        <h3 className="font-semibold text-lg bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          {t("smartInsights.title", "Rekomandime AI të Personalizuara")}
        </h3>
      </div>

      {visible.map((rec) => {
        const IconComponent = rec.icon
        return (
          <div
            key={rec.id}
            className={`p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${getTypeStyles(rec.type)}`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm`}>
                <IconComponent className={`h-4 w-4 ${getIconColor(rec.type)}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm mb-1">
                  {rec.title}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 leading-relaxed">
                  {rec.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-500">
                    {rec.action}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    rec.priority === "critical" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" :
                    rec.priority === "high" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" :
                    rec.priority === "medium" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" :
                    "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300"
                  }`}>
                    {t(`smartInsights.priority.${rec.priority}`, rec.priority)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )
      })}

      {recommendations.length > 3 && (
        <div className="text-center pt-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-purple-500 rounded px-2 py-1"
          >
            {expanded 
              ? t("smartInsights.showLess", "Shfaq më pak") 
              : t("smartInsights.showMore", `Shfaq të gjitha (${recommendations.length})`, { count: recommendations.length })
            }
          </button>
        </div>
      )}
    </div>
  )
}

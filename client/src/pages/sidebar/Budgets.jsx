// src/pages/Budgets.jsx
import React, { useState } from "react"
import { useTranslation } from "react-i18next"
import Header from "@/features/dashboard/components/Header"
import useTransactions from "@/features/transactions/hooks/useTransactions"
import { useBudgetNotifications } from "@/hooks/useBudgetNotifications"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Plus, Target, AlertTriangle, CheckCircle, RefreshCw, Trash2 } from "lucide-react"

export default function Budgets() {
  const { t } = useTranslation()
  const { transactions = [], loading, refetch } = useTransactions()
  const [showNotification, setShowNotification] = React.useState(null)
  
  // Load budgets from localStorage or start empty
  const [budgets, setBudgets] = useState(() => {
    const saved = localStorage.getItem('budgets')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return []
      }
    }
    return []
  })
  const [newBudget, setNewBudget] = useState({ category: "", limit: "" })

  // Save budgets to localStorage whenever they change
  React.useEffect(() => {
    localStorage.setItem('budgets', JSON.stringify(budgets))
  }, [budgets])

  // Use the budget notifications hook
  useBudgetNotifications(transactions, budgets, setShowNotification)

  // Auto-refetch when transactions change (for real-time updates)
  React.useEffect(() => {
    if (transactions.length > 0) {
      // Small delay to ensure transactions are fully loaded
      const timer = setTimeout(() => {
        refetch()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [transactions.length, refetch])

  // Auto-hide notification after 5 seconds
  React.useEffect(() => {
    if (showNotification) {
      const timer = setTimeout(() => {
        setShowNotification(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [showNotification])

  // Llogaritja e shpenzimeve për çdo kategori
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const currentMonthTransactions = transactions.filter(tx => {
    const txDate = new Date(tx.date)
    return txDate.getMonth() === currentMonth && 
           txDate.getFullYear() === currentYear &&
           tx.type === 'EXPENSE'
  })

  const categorySpending = currentMonthTransactions.reduce((acc, tx) => {
    const category = tx.category || 'Other'
    acc[category] = (acc[category] || 0) + tx.amount
    return acc
  }, {})

  // Përditësoj budgetet me të dhënat aktuale
  const updatedBudgets = budgets.map(budget => ({
    ...budget,
    spent: categorySpending[budget.category] || 0
  }))

  const handleAddBudget = () => {
    if (newBudget.category && newBudget.limit) {
      const budget = {
        id: Date.now(),
        category: newBudget.category,
        limit: parseFloat(newBudget.limit),
        spent: categorySpending[newBudget.category] || 0
      }
      setBudgets([...budgets, budget])
      setNewBudget({ category: "", limit: "" })
    }
  }

  const handleDeleteBudget = (id) => {
    setBudgets(budgets.filter(budget => budget.id !== id))
  }

  const getProgressColor = (spent, limit) => {
    const percentage = (spent / limit) * 100
    if (percentage >= 100) return "bg-red-500"
    if (percentage >= 80) return "bg-yellow-500"
    return "bg-green-500"
  }

  const getStatusIcon = (spent, limit) => {
    const percentage = (spent / limit) * 100
    if (percentage >= 100) return <AlertTriangle className="h-4 w-4 text-red-500" />
    if (percentage >= 80) return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    return <CheckCircle className="h-4 w-4 text-green-500" />
  }

  return (
    <main className="space-y-6 px-4 sm:px-6 py-6" aria-label={t("budgets.title", "Buxhetet")}>
      {/* Notification */}
      {showNotification && (
        <div className={`fixed top-4 right-4 z-50 max-w-sm p-4 rounded-lg shadow-lg border ${
          showNotification.type === 'error' 
            ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/20 dark:border-red-800 dark:text-red-200'
            : 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950/20 dark:border-yellow-800 dark:text-yellow-200'
        }`}>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              {showNotification.type === 'error' ? (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm">{showNotification.title}</h4>
              <p className="text-sm mt-1">{showNotification.message}</p>
            </div>
            <button
              onClick={() => setShowNotification(null)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Header 
          title={t("budgets.title", "Buxhetet")} 
          subtitle={t("budgets.subtitle", "Menaxhoni buxhetet tuaja mujore")} 
        />
        <div className="flex items-center gap-2">
          {showNotification && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs">
              <AlertTriangle className="h-3 w-3" />
              <span>{t("budgets.alert", "Alarm")}</span>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {t("budgets.refresh", "Rifresko")}
          </Button>
        </div>
      </div>

      {/* Shtimi i buxhetit të ri */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {t("budgets.addBudget", "Shto buxhet të ri")}
          </CardTitle>
          <CardDescription>
            {t("budgets.addBudgetDesc", "Krijoni një buxhet të ri për një kategori")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="category">{t("budgets.category", "Kategoria")}</Label>
              <Input
                id="category"
                placeholder={t("budgets.categoryPlaceholder", "Shkruani kategorinë")}
                value={newBudget.category}
                onChange={(e) => setNewBudget({ ...newBudget, category: e.target.value })}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="limit">{t("budgets.limit", "Limiti (€)")}</Label>
              <Input
                id="limit"
                type="number"
                placeholder="500"
                value={newBudget.limit}
                onChange={(e) => setNewBudget({ ...newBudget, limit: e.target.value })}
              />
            </div>
            <Button onClick={handleAddBudget} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {t("budgets.add", "Shto")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista e buxheteve - version i thjeshtuar */}
      {updatedBudgets.length > 0 ? (
        <div className="space-y-4">
          {updatedBudgets.map((budget) => {
            const percentage = (budget.spent / budget.limit) * 100
            const remaining = budget.limit - budget.spent
            
            return (
              <Card key={budget.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(budget.spent, budget.limit)}
                      <h3 className="font-semibold capitalize text-lg">{budget.category}</h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteBudget(budget.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{budget.spent.toFixed(2)}€ / {budget.limit.toFixed(2)}€</span>
                      <span className={remaining >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {remaining >= 0 ? '+' : ''}{remaining.toFixed(2)}€ {t("budgets.remaining", "mbetur")}
                      </span>
                    </div>
                    
                    <Progress 
                      value={Math.min(percentage, 100)} 
                      className="h-2"
                    />
                    
                    <div className="flex justify-between text-xs">
                      <span>{percentage.toFixed(1)}%</span>
                      {percentage >= 100 && (
                        <span className="text-red-600 font-medium">
                          {t("budgets.overBudget", "Buxheti u tejkalua!")}
                        </span>
                      )}
                      {percentage >= 80 && percentage < 100 && (
                        <span className="text-yellow-600 font-medium">
                          {t("budgets.warning", "Paralajmërim")}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {t("budgets.noBudgets", "Nuk ka buxhete")}
            </h3>
            <p className="text-muted-foreground mb-4">
              {t("budgets.noBudgetsDesc", "Shtoni buxhetin tuaj të parë për të filluar menaxhimin e shpenzimeve.")}
            </p>
          </CardContent>
        </Card>
      )}
    </main>
  )
}


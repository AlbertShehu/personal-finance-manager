// src/hooks/useBudgetNotifications.js
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

export function useBudgetNotifications(transactions, budgets, onNotification) {
  const { t } = useTranslation()
  const prevTransactionCount = useRef(0)
  const notifiedBudgets = useRef(new Set())

  useEffect(() => {
    // Only check if we have new transactions
    if (transactions.length <= prevTransactionCount.current) {
      return
    }

    prevTransactionCount.current = transactions.length

    // Calculate current month spending
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

    // Check each budget for warnings
    budgets.forEach(budget => {
      const spent = categorySpending[budget.category] || 0
      const percentage = (spent / budget.limit) * 100
      const budgetKey = `${budget.category}-${budget.limit}`

      // Skip if we already notified for this budget this session
      if (notifiedBudgets.current.has(budgetKey)) {
        return
      }

      // Check if budget is exceeded
      if (percentage >= 100) {
        onNotification({
          type: 'error',
          title: t("budgets.overBudget", "Buxheti u tejkalua!"),
          message: t("budgets.overBudgetMessage", `Kategoria "${budget.category}" ka tejkaluar buxhetin me ${(spent - budget.limit).toFixed(2)}€`),
          category: budget.category
        })
        notifiedBudgets.current.add(budgetKey)
      }
      // Check if budget is close to limit (80-99%)
      else if (percentage >= 80 && percentage < 100) {
        onNotification({
          type: 'warning',
          title: t("budgets.warning", "Paralajmërim"),
          message: t("budgets.warningMessage", `Kategoria "${budget.category}" ka shpenzuar ${percentage.toFixed(1)}% të buxhetit`),
          category: budget.category
        })
        notifiedBudgets.current.add(budgetKey)
      }
    })
  }, [transactions, budgets, onNotification, t])

  // Reset notifications when budgets change
  useEffect(() => {
    notifiedBudgets.current.clear()
  }, [budgets])
}

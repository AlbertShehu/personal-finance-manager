// src/components/transactions/MonthlyIncomeModal.jsx
import React, { useState, useEffect } from "react"
import { useDispatch } from "react-redux"
import { useTranslation } from "react-i18next"
import { useToast } from "@/hooks/use-toast"
import { X, Euro, Plus, Calendar, TrendingUp } from "lucide-react"
import * as Dialog from "@radix-ui/react-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import api from "@/lib/axios"
import { formatCurrency } from "@/lib/utils"
import { addTransactionLocal } from "@/store/transactionSlice"

export default function MonthlyIncomeModal({ isOpen, onClose, refetch }) {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [monthlySalary, setMonthlySalary] = useState("")
  const [additionalIncome, setAdditionalIncome] = useState("")
  const [incomeHistory, setIncomeHistory] = useState([])

  // Ngarko të dhënat e rrogës mujore
  useEffect(() => {
    if (isOpen) {
      loadIncomeData()
    }
  }, [isOpen])

  const loadIncomeData = async () => {
    try {
      const response = await api.get("/income/monthly")
      const data = response.data
      setMonthlySalary(data.monthlySalary?.toString() || "")
      setAdditionalIncome(data.additionalIncome?.toString() || "")
      setIncomeHistory(data.history || [])
    } catch (error) {
      console.error("Error loading income data:", error)
      // Nëse nuk ka të dhëna, lejo përdoruesin të shtojë
    }
  }

  const handleSave = async () => {
    if (!monthlySalary || isNaN(parseFloat(monthlySalary))) {
      toast({
        title: t("income.error.title", "Gabim"),
        description: t("income.error.salaryRequired", "Rroga mujore është e detyrueshme"),
        variant: "error",
      })
      return
    }

    setLoading(true)
    try {
      const incomeData = {
        monthlySalary: parseFloat(monthlySalary),
        additionalIncome: parseFloat(additionalIncome) || 0,
        month: new Date().toISOString().slice(0, 7), // YYYY-MM format
      }

      await api.post("/income/monthly", incomeData)
      
      toast({
        title: t("income.success.title", "Sukses"),
        description: t("income.success.saved", "Të dhënat e rrogës u ruajtën me sukses"),
        variant: "success",
      })

      onClose()
      refetch?.()
    } catch (error) {
      console.error("Error saving income data:", error)
      toast({
        title: t("income.error.title", "Gabim"),
        description: t("income.error.saveFailed", "Dështoi ruajtja e të dhënave"),
        variant: "error",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddToTransactions = async () => {
    if (!monthlySalary || isNaN(parseFloat(monthlySalary))) {
      toast({
        title: t("income.error.title", "Gabim"),
        description: t("income.error.salaryRequired", "Rroga mujore është e detyrueshme"),
        variant: "error",
      })
      return
    }

    setLoading(true)
    try {
      const currentDate = new Date()
      const currentMonth = currentDate.toISOString().slice(0, 7)
      
      // Kontrollo nëse ka transaksion për këtë muaj
      const existingResponse = await api.get(`/transactions?type=INCOME&month=${currentMonth}`)
      const existingTransactions = existingResponse.data.transactions || []
      
      const hasSalaryThisMonth = existingTransactions.some(tx => 
        tx.description?.toLowerCase().includes('rroga') || 
        tx.description?.toLowerCase().includes('salary')
      )

      if (hasSalaryThisMonth) {
        toast({
          title: t("income.warning.title", "Paralajmërim"),
          description: t("income.warning.alreadyAdded", "Rroga për këtë muaj është shtuar tashmë"),
          variant: "warning",
        })
        setLoading(false)
        return
      }

      // Shto rrogën si transaksion
      const salaryTransaction = {
        type: "INCOME",
        amount: parseFloat(monthlySalary),
        description: t("income.transactionDescription", "Rroga mujore"),
        category: "Salary",
        date: currentDate.toISOString().split('T')[0],
        currency: "EUR"
      }

      const salaryResponse = await api.post("/transactions", salaryTransaction)
      dispatch(addTransactionLocal(salaryResponse.data))

      // Shto të hyrat shtesë nëse ka
      if (additionalIncome && parseFloat(additionalIncome) > 0) {
        const additionalTransaction = {
          type: "INCOME",
          amount: parseFloat(additionalIncome),
          description: t("income.additionalDescription", "Të hyra shtesë"),
          category: "Additional Income",
          date: currentDate.toISOString().split('T')[0],
          currency: "EUR"
        }
        const additionalResponse = await api.post("/transactions", additionalTransaction)
        dispatch(addTransactionLocal(additionalResponse.data))
      }

      toast({
        title: t("income.success.title", "Sukses"),
        description: t("income.success.addedToTransactions", "Të hyrat u shtuan në transaksionet"),
        variant: "success",
      })

      onClose()
      refetch?.()
    } catch (error) {
      console.error("Error adding income to transactions:", error)
      toast({
        title: t("income.error.title", "Gabim"),
        description: t("income.error.addFailed", "Dështoi shtimi i të hyrave"),
        variant: "error",
      })
    } finally {
      setLoading(false)
    }
  }

  const totalMonthlyIncome = (parseFloat(monthlySalary) || 0) + (parseFloat(additionalIncome) || 0)

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />
        <Dialog.Content className="fixed z-50 w-[95vw] max-w-2xl rounded-2xl border bg-card p-6 shadow-xl left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-bottom-2 data-[state=closed]:slide-out-to-bottom-2 sm:data-[state=open]:fade-in-0 sm:data-[state=closed]:fade-out-0 sm:data-[state=open]:zoom-in-95 sm:data-[state=closed]:zoom-out-95">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <Dialog.Title className="text-xl font-semibold flex items-center gap-2">
                <Euro className="h-5 w-5 text-emerald-600" />
                {t("income.title", "Menaxhimi i Të Hyrave Mujore")}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground mt-1">
                {t("income.subtitle", "Vendosni rrogën mujore dhe të hyrat shtesë për planifikim më të mirë financiar")}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="sm" className="rounded-lg p-1.5">
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </div>

          <div className="space-y-6">
            {/* Form për të hyrat */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {t("income.currentMonth", "Të Hyrat e Muajit Aktual")}
                </CardTitle>
                <CardDescription>
                  {t("income.currentMonthDesc", "Vendosni rrogën dhe të hyrat shtesë për këtë muaj")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="monthlySalary" className="text-sm font-medium">
                      {t("income.monthlySalary", "Rroga Mujore")} *
                    </Label>
                    <div className="relative">
                      <Input
                        id="monthlySalary"
                        type="number"
                        step="0.01"
                        placeholder="2500.00"
                        value={monthlySalary}
                        onChange={(e) => setMonthlySalary(e.target.value)}
                        className="pl-8"
                      />
                      <Euro className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="additionalIncome" className="text-sm font-medium">
                      {t("income.additionalIncome", "Të Hyra Shtesë")}
                    </Label>
                    <div className="relative">
                      <Input
                        id="additionalIncome"
                        type="number"
                        step="0.01"
                        placeholder="500.00"
                        value={additionalIncome}
                        onChange={(e) => setAdditionalIncome(e.target.value)}
                        className="pl-8"
                      />
                      <Plus className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>

                {/* Përmbledhje */}
                {totalMonthlyIncome > 0 && (
                  <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                        {t("income.totalMonthly", "Totali Mujor")}:
                      </span>
                      <span className="text-lg font-bold text-emerald-600">
                        {formatCurrency(totalMonthlyIncome)}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Historiku i të hyrave */}
            {incomeHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    {t("income.history", "Historiku i Të Hyrave")}
                  </CardTitle>
                  <CardDescription>
                    {t("income.historyDesc", "Të hyrat e muajve të mëparshëm")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {incomeHistory.slice(0, 5).map((income, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <div className="font-medium">{income.month}</div>
                          <div className="text-sm text-muted-foreground">
                            {t("income.salary", "Rroga")}: {formatCurrency(income.monthlySalary)}
                            {income.additionalIncome > 0 && (
                              <span> + {t("income.additional", "Shtesë")}: {formatCurrency(income.additionalIncome)}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-emerald-600">
                            {formatCurrency(income.monthlySalary + income.additionalIncome)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Butonat e veprimit */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                onClick={handleAddToTransactions}
                disabled={loading || !monthlySalary}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {t("income.adding", "Duke shtuar...")}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    {t("income.addToTransactions", "Shto në Transaksionet")}
                  </div>
                )}
              </Button>

              <Button
                onClick={handleSave}
                disabled={loading || !monthlySalary}
                variant="outline"
                className="flex-1"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {t("income.saving", "Duke ruajtur...")}
                  </div>
                ) : (
                  t("income.saveOnly", "Ruaj Vetëm")
                )}
              </Button>

              <Button
                onClick={onClose}
                variant="ghost"
                className="sm:w-auto"
              >
                {t("actions.cancel", "Anulo")}
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

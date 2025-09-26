// src/pages/Transactions.jsx
import React from "react"
import { useTranslation } from "react-i18next"
import useTransactions from "@/features/transactions/hooks/useTransactions"
import TransactionList from "@/features/transactions/components/TransactionTable"

export default function Transactions() {
  const { t } = useTranslation()
  const { transactions = [], loading, refetch, error } = useTransactions()

  const count = Array.isArray(transactions) ? transactions.length : 0

  React.useEffect(() => {
    document.title = `${t("transactions.title", "Transactions")} · ${count}`
  }, [count, t])

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-4" aria-label={t("transactions.title")}>
      {/* Header i thjeshtë */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("transactions.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {count} {t("table.title", "Transaction List").toLowerCase()}
          </p>
        </div>
      </header>

      {/* Mesazh gabimi (opsional) */}
      {error && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-lg border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-700 dark:text-red-300"
        >
          {typeof error === "string" ? error : error?.message || t("dashboard.loadError")}
        </div>
      )}

      {/* Tabela (përfshin butonat e tua: Add, CSV, Refresh) */}
      <TransactionList transactions={transactions} loading={loading} refetch={refetch} />
    </main>
  )
}

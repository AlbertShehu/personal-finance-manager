// src/pages/Dashboard.jsx
import React from "react";
import { useTranslation } from "react-i18next";
import Header from "@/features/dashboard/components/Header";
import useTransactions from "@/features/transactions/hooks/useTransactions";
import SmartInsights from "@/features/dashboard/components/SmartInsights";
import VirtualizedTransactionList from "@/features/dashboard/components/VirtualizedTransactionList";
import CategoryAnalysis from "@/features/dashboard/components/CategoryAnalysis";
import TransactionTrends from "@/features/dashboard/components/TransactionTrends";
import KpiGrid from "@/features/dashboard/components/KpiGrid";
import CashflowAreaChart from "@/features/dashboard/components/CashflowAreachart";
import RecentTransactions from "@/features/dashboard/components/RecentTransactions";
import DateRangeTabs from "@/features/dashboard/components/DateRangeTabs";
import ForecastCard from "@/features/dashboard/components/ForecastCard";
import TopCategoriesPieChart from "@/features/dashboard/components/TopCategoriesPieChart";
import MonthlyBarChart from "@/features/dashboard/components/MonthlyBarChart";


export default function Dashboard() {
  const { t } = useTranslation();
  const { transactions = [], loading, error, refetch } = useTransactions();
  const [range, setRange] = React.useState("30d"); // sigurohu që DateRangeTabs e njeh këtë vlerë

  // Titulli i faqes me numrin e transaksioneve
  React.useEffect(() => {
    document.title = `${t("dashboard.title")} · ${transactions.length}`;
  }, [transactions.length, t]);

  return (
    <main
      className="space-y-8 px-4 sm:px-6 py-6"
      aria-label={t("dashboard.title")}
    >
      <Header title={t("dashboard.title")} subtitle={t("dashboard.subtitle")}>
        {/* Nëse DateRangeTabs pret onValueChange, përshtate props-in: onValueChange={setRange} */}
        <DateRangeTabs value={range} onChange={setRange} />
      </Header>

      {/* KPIs */}
      <KpiGrid transactions={transactions} rangeKey={range} loading={loading} />

      {/* Mesazh i thjeshtë gabimi (opsional) */}
      {error && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-lg border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-700 dark:text-red-300"
        >
          {typeof error === "string"
            ? error
            : error?.message || t("dashboard.loadError")}
        </div>
      )}

      {/* Rekomandime */}
      <section className="space-y-4" aria-labelledby="ai-recos">
        <h2 id="ai-recos" className="text-xl font-semibold">
          {t("dashboard.recommendations")}
        </h2>
        <div className="bg-card p-4 rounded-xl border">
          <SmartInsights transactions={transactions} />
        </div>
      </section>

      {/* Analitika */}
      <section
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        aria-labelledby="analytics"
      >
        <h2 id="analytics" className="sr-only">
          {t("dashboard.analysis")}
        </h2>

        <div className="lg:col-span-2">
          {/* key={range} → reseton animimin kur ndryshon range */}
          <CashflowAreaChart
            key={range}
            transactions={transactions}
            rangeKey={range}
            loading={loading}
          />
        </div>

        <div className="lg:col-span-1">
          <RecentTransactions transactions={transactions} loading={loading} />
        </div>
      </section>
    
      {/* Monthly Bar Chart */}
      <section className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <MonthlyBarChart transactions={transactions} />
      </section>

      {/* Lista e plotë e transaksioneve me analizë */}
      <section className="space-y-4" aria-labelledby="transaction-analysis">
        <h2 id="transaction-analysis" className="text-xl font-semibold">
          {t("dashboard.transactionAnalysis", "Analiza e Transaksioneve")}
        </h2>
        <VirtualizedTransactionList 
          transactions={transactions}
          onEdit={(transaction) => {/* TODO: Implement edit functionality */}}
          onDelete={(transaction) => {/* TODO: Implement delete functionality */}}
          onView={(transaction) => {/* TODO: Implement view functionality */}}
        />
      </section>

      {/* Analiza e kategorive */}
      <section className="space-y-4" aria-labelledby="category-analysis">
        <h2 id="category-analysis" className="text-xl font-semibold">
          {t("dashboard.categoryAnalysis", "Analiza e Kategorive")}
        </h2>
        <CategoryAnalysis transactions={transactions} />
      </section>

      {/* Trendet e transaksioneve */}
      <section className="space-y-4" aria-labelledby="transaction-trends">
        <div className="flex items-center justify-between">
          <h2 id="transaction-trends" className="text-xl font-semibold">
            {t("dashboard.transactionTrends", "Trendet e Transaksioneve")}
          </h2>
          <button
            onClick={refetch}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            <svg className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {t("dashboard.refresh", "Rifresko")}
          </button>
        </div>
        <TransactionTrends transactions={transactions} loading={loading} onRefresh={refetch} />
      </section>
      {/* NEW: Parashikimi & Buxhetet */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ForecastCard transactions={transactions} />
        <TopCategoriesPieChart transactions={transactions} />
      </section>
    </main>
  );
}

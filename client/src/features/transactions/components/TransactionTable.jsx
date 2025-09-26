// src/components/transactions/TransactionTable.jsx
import React, { useMemo, useState } from "react"
import { useDispatch } from "react-redux"
import { useTranslation } from "react-i18next"
import AddTransactionModal from "./AddTransactionModal"
import EditTransactionModal from "./EditTransactionModal"
import MonthlyIncomeModal from "./MonthlyIncomeModal"
import { useToast } from "@/hooks/use-toast"
import { deleteTransactionLocal } from "@/store/transactionSlice"
import {
  Plus,
  Trash2,
  Download,
  X,
  Calendar,
  Tag,
  FileText,
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowUpDown,
  FileDown,
  Pencil,
  Euro,
} from "lucide-react"
import * as Dialog from "@radix-ui/react-dialog"
import api from "@/lib/axios"
import { formatCurrency } from "@/lib/utils"
import { format } from "date-fns"

const TYPES = ["ALL", "INCOME", "EXPENSE"]

export default function TransactionTable({ transactions = [], refetch }) {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { toast } = useToast()
  const [selectedTx, setSelectedTx] = useState(null)
  const [editTx, setEditTx] = useState(null)
  const [filterType, setFilterType] = useState("ALL")
  const [query, setQuery] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [showIncomeModal, setShowIncomeModal] = useState(false)
  const [sort, setSort] = useState({ key: "date", dir: "desc" }) // asc|desc

  // kategori unike për sugjerime te modal-i
  const uniqueCategories = useMemo(() => {
    const set = new Set()
    transactions.forEach((tx) => tx?.category && set.add(tx.category))
    return Array.from(set)
  }, [transactions])

  const filtered = useMemo(() => {
    let data = Array.isArray(transactions) ? [...transactions] : []
    // filtro sipas llojit
    if (filterType !== "ALL") {
      data = data.filter((tx) => String(tx.type).toUpperCase() === filterType)
    }
    // kërkesa e kërkimit (kategoria/përshkrimi)
    const q = query.trim().toLowerCase()
    if (q) {
      data = data.filter((tx) => {
        return (
          String(tx.category || "").toLowerCase().includes(q) ||
          String(tx.description || "").toLowerCase().includes(q)
        )
      })
    }
    // sort
    data.sort((a, b) => {
      const dir = sort.dir === "asc" ? 1 : -1
      if (sort.key === "amount") {
        const av = Number(a.amount) || 0
        const bv = Number(b.amount) || 0
        return av > bv ? dir : av < bv ? -dir : 0
      }
      if (sort.key === "category" || sort.key === "description" || sort.key === "type") {
        const av = String(a[sort.key] || "").toLowerCase()
        const bv = String(b[sort.key] || "").toLowerCase()
        return av > bv ? dir : av < bv ? -dir : 0
      }
      // date default
      const ad = new Date(a.date).getTime() || 0
      const bd = new Date(b.date).getTime() || 0
      return ad > bd ? dir : ad < bd ? -dir : 0
    })
    return data
  }, [transactions, filterType, query, sort])

  const summary = useMemo(() => {
    let income = 0
    let expense = 0
    for (const tx of filtered) {
      const amt = Number(tx.amount) || 0
      if (String(tx.type).toUpperCase() === "INCOME") income += amt
      else expense += amt
    }
    return { income, expense, net: income - expense }
  }, [filtered])

  function toggleSort(key) {
    setSort((prev) => {
      if (prev.key !== key) return { key, dir: "asc" }
      return { key, dir: prev.dir === "asc" ? "desc" : "asc" }
    })
  }

  async function handleDelete(id) {
    if (!confirm(t("table.confirmDelete"))) return
    try {
      await api.delete(`/transactions/${id}`)
      
      // Fshi transaksionin nga Redux store
      dispatch(deleteTransactionLocal(id))
      
      toast({
        title: t("table.deleteSuccess"),
        description: t("table.deleteDescription"),
        variant: "success",
        duration: 5000,
      })
      refetch()
      setSelectedTx(null)
      setEditTx(null)
    
    } catch (err) {
      console.error("Deletion error:", err)
      toast.error(normalizeError(err).message)
    }
  }

  async function exportPDF() {
    try {
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ])
      const doc = new jsPDF()
      doc.setFontSize(14)
      doc.text(t("table.title"), 14, 20)

      const body = filtered.map((tx) => [
        safeDate(tx.date),
        tx.category ?? "—",
        tx.description ?? "—",
        formatCurrency(Math.abs(Number(tx.amount) || 0), {
          currency: tx.currency || "EUR",
        }),
        t(`transactions.typeMap.${String(tx.type).toUpperCase()}`),
      ])

      autoTable(doc, {
        head: [[t("table.date"), t("table.category"), t("table.description"), t("table.amount"), t("table.type")]],
        body,
        startY: 30,
        theme: "striped",
        styles: { fontSize: 10 },
        headStyles: { fillColor: [37, 99, 235] }, // blue-600
      })

      doc.save(`transactions_${new Date().toISOString().slice(0, 10)}.pdf`)
      toast.success("PDF exported")
    } catch {
      toast.error("PDF export failed")
    }
  }

  
  const openEdit = (tx) => {
    setSelectedTx(null)
    setEditTx(tx)
  }

  return (
    <div className="bg-card p-3 md:p-4 rounded-lg border w-full overflow-x-auto">
      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-3 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t("table.title")}</h2>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-xs px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-medium min-w-[100px]"
          >
            {TYPES.map((tKey) => (
              <option key={tKey} value={tKey}>
                {tKey === "ALL" ? t("table.filters.all") : t(`table.filters.${tKey.toLowerCase()}`)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("transactions.search", "Search…")}
              className="text-xs px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all duration-200 w-full sm:w-48"
              aria-label={t("transactions.search", "Search")}
            />
          </div>
         
          <div className="flex gap-1.5">
            <button
              onClick={exportPDF}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 font-medium shadow-sm whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("table.exportPdf")}</span>
              <span className="sm:hidden">PDF</span>
            </button>
            <button
              onClick={() => setShowIncomeModal(true)}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200 font-medium shadow-sm whitespace-nowrap"
            >
              <Euro className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("table.manageIncome")}</span>
              <span className="sm:hidden">Income</span>
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors duration-200 font-medium shadow-sm whitespace-nowrap"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("table.addTransaction")}</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-lg border bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-3 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="text-center p-2.5 rounded-md bg-white/50 dark:bg-gray-800/50">
          <div className="text-muted-foreground text-xs uppercase tracking-wide mb-1">{t("summary.income", "Income")}</div>
          <div className="font-bold text-base text-emerald-600">{formatCurrency(summary.income)}</div>
        </div>
        <div className="text-center p-2.5 rounded-md bg-white/50 dark:bg-gray-800/50">
          <div className="text-muted-foreground text-xs uppercase tracking-wide mb-1">{t("summary.expense", "Expense")}</div>
          <div className="font-bold text-base text-red-600">{formatCurrency(summary.expense)}</div>
        </div>
        <div className="text-center p-2.5 rounded-md bg-white/50 dark:bg-gray-800/50">
          <div className="text-muted-foreground text-xs uppercase tracking-wide mb-1">{t("summary.net", "Net")}</div>
          <div className={`font-bold text-base ${summary.net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(summary.net)}</div>
        </div>
      </div>

      {/* Add Transaction Modal */}
      <AddTransactionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        refetch={refetch}
        categories={uniqueCategories}
      />

      {/* Edit Transaction Modal */}
      <EditTransactionModal
        tx={editTx}
        isOpen={!!editTx}
        onClose={() => setEditTx(null)}
        refetch={refetch}
      />

      {/* Monthly Income Modal */}
      <MonthlyIncomeModal
        isOpen={showIncomeModal}
        onClose={() => setShowIncomeModal(false)}
        refetch={refetch}
      />

      {/* Table */}
      <div className="w-full overflow-x-auto rounded-lg border">
        <table className="min-w-full table-auto border-collapse text-sm">
          <thead className="sticky top-0 bg-muted/80 backdrop-blur supports-[backdrop-filter]:bg-muted/90 border-b">
            <tr>
              {[
                { key: "date", label: t("table.date"), align: "left", sortable: true },
                { key: "category", label: t("table.category"), align: "left", sortable: true },
                { key: "description", label: t("table.description"), align: "left", sortable: true },
                { key: "amount", label: t("table.amount"), align: "right", sortable: true },
                { key: "type", label: t("table.type"), align: "left", sortable: true },
                { key: "actions", label: t("table.actions"), align: "right", sortable: false },
              ].map((col) => (
                <th
                  key={col.key}
                  className={`px-3 py-2 font-semibold text-xs uppercase tracking-wide text-muted-foreground border-r last:border-r-0 ${
                    col.align === "right" ? "text-right" : "text-left"
                  }`}
                >
                  {col.sortable ? (
                    <button onClick={() => toggleSort(col.key)} className="inline-flex items-center gap-1 hover:underline">
                      {col.label}
                      <ArrowUpDown
                        className={`h-3.5 w-3.5 ${sort.key === col.key ? "opacity-100" : "opacity-40"}`}
                        aria-hidden="true"
                      />
                      <span className="sr-only">
                        {sort.key === col.key ? (sort.dir === "asc" ? "ascending" : "descending") : "sortable"}
                      </span>
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-2xl opacity-50">📊</div>
                    <div className="text-xs">{t("table.empty")}</div>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((tx) => {
                const type = String(tx.type).toUpperCase()
                const isIncome = type === "INCOME"
                return (
                  <tr
                    key={tx.id || tx._id}
                    className="border-t hover:bg-muted/50 cursor-pointer transition-colors duration-150"
                    onClick={() => setSelectedTx(tx)}
                    tabIndex={0}
                    role="button"
                    onKeyDown={(e) => e.key === "Enter" && setSelectedTx(tx)}
                  >
                    <td className="px-3 py-2 border-r last:border-r-0 text-xs">{safeDate(tx.date)}</td>
                    <td className="px-3 py-2 border-r last:border-r-0 text-xs">{tx.category || "—"}</td>
                    <td className="px-3 py-2 border-r last:border-r-0 text-xs">{tx.description || "—"}</td>
                    <td className="px-3 py-2 text-right font-medium border-r last:border-r-0 text-xs">
                      <span className={isIncome ? "text-emerald-600" : "text-red-600"}>
                        {isIncome ? "+" : "-"}
                        {formatCurrency(Math.abs(Number(tx.amount) || 0), {
                          currency: tx.currency || "EUR",
                        })}
                      </span>
                    </td>
                    <td className="px-3 py-2 border-r last:border-r-0">
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                          isIncome
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                            : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                        }`}
                      >
                        {t(`transactions.typeMap.${type}`)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right border-r last:border-r-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openEdit(tx)
                        }}
                        className="inline-flex items-center gap-1 p-1 rounded-md text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors duration-150"
                        title={t("actions.edit", "Edit")}
                        aria-label={t("actions.edit", "Edit")}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(tx.id || tx._id)
                        }}
                        className="inline-flex items-center gap-1 p-1 rounded-md text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors duration-150"
                        title={t("actions.delete", "Delete")}
                        aria-label={t("actions.delete", "Delete")}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Details Dialog */}
      <DetailsDialog
        tx={selectedTx}
        onClose={() => setSelectedTx(null)}
        onEdit={openEdit}
        t={t}
      />
    </div>
  )
}

function safeDate(value, withTime = false) {
  if (!value) return ""
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return format(d, withTime ? "dd/MM/yyyy HH:mm" : "dd/MM/yyyy")
}

function DetailsDialog({ tx, onClose, onEdit, t }) {
  if (!tx) return null
  const type = String(tx.type).toUpperCase()
  const isIncome = type === "INCOME"

  return (
    <Dialog.Root open={!!tx} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="
            fixed inset-0 z-50 bg-black/40 backdrop-blur-sm
            data-[state=open]:animate-in data-[state=closed]:animate-out
            data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0
          "
        />
        <Dialog.Content
          className="
            fixed z-50 w-[92vw] max-w-md rounded-2xl border bg-card p-6 shadow-xl
            left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 outline-none
            data-[state=open]:animate-in data-[state=closed]:animate-out
            data-[state=open]:slide-in-from-bottom-2 data-[state=closed]:slide-out-to-bottom-2
            sm:data-[state=open]:fade-in-0 sm:data-[state=closed]:fade-out-0
            sm:data-[state=open]:zoom-in-95 sm:data-[state=closed]:zoom-out-95
          "
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-lg font-semibold">
                {t("table.detailsTitle")}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground mt-1">
                {isIncome ? t("transactions.typeMap.INCOME") : t("transactions.typeMap.EXPENSE")}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="rounded-lg p-1.5 hover:bg-muted" aria-label={t("actions.close", "Close")}>
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <div className="mt-4 mb-2 flex items-center gap-2">
            {isIncome ? <ArrowUpCircle className="h-5 w-5 text-emerald-600" /> : <ArrowDownCircle className="h-5 w-5 text-red-600" />}
            <div className={`text-xl font-semibold ${isIncome ? "text-emerald-600" : "text-red-600"}`}>
              {isIncome ? "+" : "-"}
              {formatCurrency(Math.abs(Number(tx.amount) || 0), { currency: tx.currency || "EUR" })}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 text-sm">
            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <div className="text-xs text-muted-foreground">{t("table.date")}</div>
                <div className="font-medium">{safeDate(tx.date, true)}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Tag className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <div className="text-xs text-muted-foreground">{t("table.category")}</div>
                <div className="font-medium">{tx.category || "—"}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <div className="text-xs text-muted-foreground">{t("table.description")}</div>
                <div className="font-medium">{tx.description || "—"}</div>
              </div>
            </div>
          </div>

          <div className="mt-5 flex justify-between">
            <Dialog.Close asChild>
              <button
                className="text-sm px-4 py-2 rounded-lg border hover:bg-muted inline-flex items-center gap-2"
                onClick={() => onEdit?.(tx)}
                title={t("actions.edit", "Edit")}
                aria-label={t("actions.edit", "Edit")}
              >
                <Pencil className="h-4 w-4" />
                {t("actions.edit", "Edit")}
              </button>
            </Dialog.Close>

            <Dialog.Close asChild>
              <button className="text-sm px-4 py-2 rounded-lg border hover:bg-muted">
                {t("actions.close")}
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

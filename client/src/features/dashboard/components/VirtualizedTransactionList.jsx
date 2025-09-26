// src/components/dashboard/VirtualizedTransactionList.jsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  Download,
  Eye,
  EyeOff,
  Calendar,
  DollarSign,
  Tag,
  MoreHorizontal
} from "lucide-react"
import { format } from "date-fns"
import { formatCurrency } from "@/lib/utils"

// Virtual scrolling hook
const useVirtualScroll = (items, itemHeight = 60, containerHeight = 400) => {
  const [scrollTop, setScrollTop] = useState(0)
  const [containerRef, setContainerRef] = useState(null)

  const visibleItems = useMemo(() => {
    if (!containerRef) return { start: 0, end: 0, items: [] }

    const start = Math.floor(scrollTop / itemHeight)
    const end = Math.min(start + Math.ceil(containerHeight / itemHeight) + 1, items.length)
    
    return {
      start,
      end,
      items: items.slice(start, end)
    }
  }, [items, scrollTop, itemHeight, containerHeight, containerRef])

  const totalHeight = items.length * itemHeight
  const offsetY = visibleItems.start * itemHeight

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop)
  }, [])

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    setContainerRef
  }
}

// Komponenti për një transaksion
const TransactionItem = ({ 
  transaction, 
  index, 
  style, 
  onEdit, 
  onDelete, 
  onView,
  currency = "EUR",
  locale = "en"
}) => {
  const { t } = useTranslation()
  const [isHovered, setIsHovered] = useState(false)
  const [showActions, setShowActions] = useState(false)

  const isIncome = transaction.type === 'INCOME'
  const amount = Math.abs(Number(transaction.amount) || 0)

  return (
    <motion.div
      style={style}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
      className="flex items-center gap-4 p-4 border-b hover:bg-muted/50 transition-colors"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Icon dhe info kryesore */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          isIncome 
            ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' 
            : 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
        }`}>
          {isIncome ? <DollarSign className="h-5 w-5" /> : <Tag className="h-5 w-5" />}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">
            {transaction.description || transaction.category || t("transactions.untitled", "Untitled")}
          </div>
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Calendar className="h-3 w-3" />
            {format(new Date(transaction.date), "dd/MM/yyyy")}
            {transaction.category && (
              <>
                <span>•</span>
                <span>{transaction.category}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Shuma dhe aksionet */}
      <div className="flex items-center gap-3">
        <div className={`text-right ${
          isIncome ? 'text-green-600' : 'text-red-600'
        }`}>
          <div className="font-semibold">
            {isIncome ? '+' : '-'} {formatCurrency(amount, { currency, locale })}
          </div>
          {transaction.note && (
            <div className="text-xs text-muted-foreground truncate max-w-32">
              {transaction.note}
            </div>
          )}
        </div>

        <AnimatePresence>
          {(isHovered || showActions) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1"
            >
              <button
                onClick={() => onView?.(transaction)}
                className="p-1 rounded hover:bg-muted transition-colors"
                title={t("transactions.view", "View")}
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                onClick={() => onEdit?.(transaction)}
                className="p-1 rounded hover:bg-muted transition-colors"
                title={t("transactions.edit", "Edit")}
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// Komponenti kryesor
export default function VirtualizedTransactionList({ 
  transactions = [], 
  onEdit, 
  onDelete, 
  onView,
  currency = "EUR",
  locale = "en",
  height = 400,
  itemHeight = 60
}) {
  const { t, i18n } = useTranslation()
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("date")
  const [sortOrder, setSortOrder] = useState("desc")
  const [filterType, setFilterType] = useState("all")
  const [filterCategory, setFilterCategory] = useState("all")
  const [showFilters, setShowFilters] = useState(false)

  // Filtro dhe rendit transaksionet
  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = transactions.filter(tx => {
      // Filtro sipas kërkimit
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const matchesSearch = 
          (tx.description || "").toLowerCase().includes(searchLower) ||
          (tx.category || "").toLowerCase().includes(searchLower) ||
          (tx.note || "").toLowerCase().includes(searchLower)
        if (!matchesSearch) return false
      }

      // Filtro sipas llojit
      if (filterType !== "all" && tx.type !== filterType) return false

      // Filtro sipas kategorisë
      if (filterCategory !== "all" && tx.category !== filterCategory) return false

      return true
    })

    // Rendit
    filtered.sort((a, b) => {
      let aValue, bValue

      switch (sortBy) {
        case "date":
          aValue = new Date(a.date)
          bValue = new Date(b.date)
          break
        case "amount":
          aValue = Math.abs(Number(a.amount) || 0)
          bValue = Math.abs(Number(b.amount) || 0)
          break
        case "description":
          aValue = (a.description || "").toLowerCase()
          bValue = (b.description || "").toLowerCase()
          break
        case "category":
          aValue = (a.category || "").toLowerCase()
          bValue = (b.category || "").toLowerCase()
          break
        default:
          aValue = new Date(a.date)
          bValue = new Date(b.date)
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [transactions, searchTerm, sortBy, sortOrder, filterType, filterCategory])

  // Përdor virtual scrolling
  const { visibleItems, totalHeight, offsetY, handleScroll, setContainerRef } = useVirtualScroll(
    filteredAndSortedTransactions,
    itemHeight,
    height
  )

  // Kategoritë unike për filtrin
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(transactions.map(tx => tx.category).filter(Boolean))]
    return uniqueCategories.sort()
  }, [transactions])

  // Handlers
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortOrder("desc")
    }
  }

  const handleExport = () => {
    const csvContent = [
      ["Date", "Description", "Category", "Type", "Amount", "Note"],
      ...filteredAndSortedTransactions.map(tx => [
        format(new Date(tx.date), "yyyy-MM-dd"),
        tx.description || "",
        tx.category || "",
        tx.type,
        tx.amount,
        tx.note || ""
      ])
    ].map(row => row.join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `transactions_${format(new Date(), "yyyy-MM-dd")}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      {/* Header me kontrollin */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            {t("transactions.title", "Transaksionet")} ({filteredAndSortedTransactions.length})
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              title={t("transactions.filters", "Filters")}
            >
              <Filter className="h-4 w-4" />
            </button>
            <button
              onClick={handleExport}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              title={t("transactions.export", "Export")}
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Kërkimi */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t("transactions.search", "Search transactions...")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Filtrot */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4"
            >
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {t("transactions.type", "Type")}
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">{t("transactions.allTypes", "All Types")}</option>
                  <option value="INCOME">{t("transactions.income", "Income")}</option>
                  <option value="EXPENSE">{t("transactions.expense", "Expense")}</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  {t("transactions.category", "Category")}
                </label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">{t("transactions.allCategories", "All Categories")}</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  {t("transactions.sortBy", "Sort By")}
                </label>
                <div className="flex gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="date">{t("transactions.date", "Date")}</option>
                    <option value="amount">{t("transactions.amount", "Amount")}</option>
                    <option value="description">{t("transactions.description", "Description")}</option>
                    <option value="category">{t("transactions.category", "Category")}</option>
                  </select>
                  <button
                    onClick={() => handleSort(sortBy)}
                    className="p-2 border rounded-lg hover:bg-muted transition-colors"
                    title={t("transactions.sortOrder", "Sort Order")}
                  >
                    {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Lista e virtualizuar */}
      <div
        ref={setContainerRef}
        className="overflow-auto"
        style={{ height }}
        onScroll={handleScroll}
      >
        <div style={{ height: totalHeight, position: "relative" }}>
          <div style={{ transform: `translateY(${offsetY}px)` }}>
            {visibleItems.items.map((transaction, index) => (
              <TransactionItem
                key={transaction.id || transaction._id || index}
                transaction={transaction}
                index={index}
                style={{ height: itemHeight }}
                onEdit={onEdit}
                onDelete={onDelete}
                onView={onView}
                currency={currency}
                locale={locale}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Footer me statistikat */}
      <div className="p-4 border-t bg-muted/20">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {t("transactions.showing", "Showing")} {visibleItems.start + 1}-{Math.min(visibleItems.end, filteredAndSortedTransactions.length)} {t("transactions.of", "of")} {filteredAndSortedTransactions.length}
          </span>
          <span>
            {t("transactions.total", "Total")}: {formatCurrency(
              filteredAndSortedTransactions.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0),
              { currency, locale }
            )}
          </span>
        </div>
      </div>
    </div>
  )
}

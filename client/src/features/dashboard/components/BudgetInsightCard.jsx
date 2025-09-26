/* eslint-disable no-empty */
// src/features/dashboard/components/BudgetInsightCard.jsx
import React from "react"
import { getBudgetInsights } from "../getBudgetInsights"
import { X, Info, Activity } from "lucide-react"
import { useTranslation } from "react-i18next"
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { ToastAction } from "@/components/ui/toast"

const STORAGE_KEY = "budget_insights"
const DELETED_KEY = "budget_insights_deleted"
const TX_KEYS_KEY = "budget_tx_keys_v1"
const CHANGE_THRESHOLD = 0.25 // 25%

function safeGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}
function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

/** ID stabil për çdo insight (pavarësisht përkthimit) */
function insightId(insight) {
  if (insight?.key) return String(insight.key)
  try {
    const clone = { ...insight }
    delete clone.title
    delete clone.description
    const s = JSON.stringify(clone)
    let h = 5381
    for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i)
    return String(h >>> 0)
  } catch {
    return String(Math.random())
  }
}

/** “Fingerprint” unik për një transaksion */
function txKey(tx, idx = 0) {
  if (tx.id !== null && tx.id !== undefined) return `id:${tx.id}`
  return [
    "f",
    new Date(tx.date).toISOString().slice(0, 10),
    String(tx.type).toUpperCase(),
    tx.category ?? "",
    Number(tx.amount).toFixed(2),
    idx,
  ].join("|")
}

/** Delta muaj-para-muaj për një muaj & kategori (vetëm EXPENSE) */
function monthDeltaForCategory(transactions, ym, category) {
  const [year, month] = ym.split("-").map(Number)
  const monthDate = new Date(year, month - 1, 1)

  const curStart = startOfMonth(monthDate)
  const curEnd = endOfMonth(monthDate)
  const prevDate = subMonths(monthDate, 1)
  const prevStart = startOfMonth(prevDate)
  const prevEnd = endOfMonth(prevDate)

  const inRange = (d, start, end) => isWithinInterval(new Date(d), { start, end })

  const cur = transactions.filter(
    (tx) =>
      inRange(tx.date, curStart, curEnd) &&
      String(tx.type).toUpperCase() === "EXPENSE" &&
      (tx.category || "") === category
  )
  const prev = transactions.filter(
    (tx) =>
      inRange(tx.date, prevStart, prevEnd) &&
      String(tx.type).toUpperCase() === "EXPENSE" &&
      (tx.category || "") === category
  )

  const curSum = cur.reduce((s, t) => s + Math.abs(Number(t.amount) || 0), 0)
  const prevSum = prev.reduce((s, t) => s + Math.abs(Number(t.amount) || 0), 0)

  if (prevSum === 0 && curSum === 0) return null
  const delta = curSum - prevSum
  const ratio = prevSum === 0 ? 1 : delta / prevSum
  return { curSum, prevSum, delta, ratio }
}

export default function BudgetInsightCard({ transactions = [] }) {
  const { t } = useTranslation()
  const [insights, setInsights] = React.useState([])
  const [expanded, setExpanded] = React.useState(false)
  const { toast } = useToast()

  React.useEffect(() => {
    const deletedIds = new Set(safeGet(DELETED_KEY, []))

    // 1) Insights bazë për muajin aktual
    const base = (getBudgetInsights(transactions, t) || []).map((x) => ({
      ...x,
      __id: insightId(x),
    }))

    // 2) Detect transaksione të reja (vs snapshot)
    const prevKeysArr = safeGet(TX_KEYS_KEY, [])
    const prevKeys = new Set(prevKeysArr)

    const currentKeys = []
    const newTxs = []
    transactions.forEach((tx, idx) => {
      const k = txKey(tx, idx)
      currentKeys.push(k)
      if (!prevKeys.has(k)) newTxs.push({ ...tx, __k: k })
    })
    safeSet(TX_KEYS_KEY, currentKeys)

    const nowYm = format(new Date(), "yyyy-MM")

    // 2a) Insight “📌” për çdo transaksion të ri
    const eventInsights = newTxs.map((tx) => {
      const date = new Date(tx.date)
      const ym = format(date, "yyyy-MM")
      const isExpense = String(tx.type).toUpperCase() === "EXPENSE"
      const typeLabel = isExpense ? t("insight.transaction.expense") : t("insight.transaction.income")

      return {
        key: `evt:new:${tx.__k}`,
        kind: "event",
        title: `📌 ${t("insight.transaction.title", { category: tx.category })}`,
        description: t("insight.transaction.description", {
          date: format(date, "dd-MM-yyyy"),
          type: typeLabel,
          amount: Number(tx.amount).toFixed(2),
          category: tx.category,
        }),
        __id: `evt:new:${tx.__k}`,
        __ym: ym,
        __cat: tx.category || "",
        __isExpense: isExpense,
      }
    })

    // 2b) Nëse transaksioni prek një muaj të kaluar dhe ndryshon >=25%, shto delta insight
    const deltaFromBackfills = []
    eventInsights.forEach((evt) => {
      if (evt.__ym === nowYm) return
      if (!evt.__isExpense) return

      const delta = monthDeltaForCategory(transactions, evt.__ym, evt.__cat)
      if (!delta) return
      const { curSum, ratio } = delta
      if (Math.abs(ratio) < CHANGE_THRESHOLD) return

      if (ratio > 0) {
        deltaFromBackfills.push({
          key: `evt:delta-inc:${evt.__ym}:${evt.__cat}`,
          kind: "delta-inc-backfill",
          title: t("insight.increase.title", { category: evt.__cat }),
          description: t("insight.increase.description", {
            amount: curSum.toFixed(2),
            percent: (ratio * 100).toFixed(1),
          }),
          __id: `evt:delta-inc:${evt.__ym}:${evt.__cat}`,
        })
      } else {
        deltaFromBackfills.push({
          key: `evt:delta-dec:${evt.__ym}:${evt.__cat}`,
          kind: "delta-dec-backfill",
          title: t("insight.decrease.title", { category: evt.__cat }),
          description: t("insight.decrease.description", {
            amount: curSum.toFixed(2),
            percent: Math.abs(ratio * 100).toFixed(1),
          }),
          __id: `evt:delta-dec:${evt.__ym}:${evt.__cat}`,
        })
      }
    })

    // 3) Merge, filtro të fshirat & hiq duplikatat
    const all = [...base, ...eventInsights, ...deltaFromBackfills]
    const uniq = []
    const seen = new Set()
    for (const ins of all) {
      if (!ins.__id) ins.__id = insightId(ins)
      if (deletedIds.has(ins.__id)) continue
      if (seen.has(ins.__id)) continue
      seen.add(ins.__id)
      uniq.push(ins)
    }

    setInsights(uniq)
    safeSet(STORAGE_KEY, uniq)
  }, [transactions, t])

  const handleDelete = (insight) => {
  const id = insight.__id;
  const originalIndex = insights.findIndex((i) => i.__id === id);

  // persist fshirjen
  const deleted = safeGet(DELETED_KEY, []);
  if (!deleted.includes(id)) {
    deleted.push(id);
    safeSet(DELETED_KEY, deleted);
  }

  // përditëso state & storage
  const next = insights.filter((i) => i.__id !== id);
  setInsights(next);
  safeSet(STORAGE_KEY, next);

  // KAPE handle-in e toast-it dhe përdore në "Undo"
  const tHandle = toast({
    title: t("insight.dismissed", "Insight dismissed"),
    variant: "destructive",
    duration: 5000,
    action: (
      <ToastAction
        altText={t("common.undo", "Undo")}
        onClick={() => {
          // rikthe në storage
          const deleted2 = safeGet(DELETED_KEY, []).filter((x) => x !== id);
          safeSet(DELETED_KEY, deleted2);

          // rikthe në UI në indeksin origjinal
          setInsights((prev) => {
            const arr = [...prev];
            const pos = Math.min(Math.max(originalIndex, 0), arr.length);
            arr.splice(pos, 0, insight);
            safeSet(STORAGE_KEY, arr);
            return arr;
          });

          // mbylle pikërisht këtë toast
          tHandle.dismiss();

          // feedback i shkurtër
          toast({
            title: t("insight.restored", "Insight restored"),
            variant: "success",
            duration: 2500,
          });
        }}
      >
        {t("common.undo", "Undo")}
      </ToastAction>
    ),
  });
};



  if (!Array.isArray(insights) || insights.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-card border text-sm text-muted-foreground">
        {t("insight.empty")}
      </div>
    )
  }

  const visible = expanded ? insights : insights.slice(0, 2)

  return (
    <div className="space-y-4 overflow-hidden">
      {visible.map((insight) => {
        const isNote = String(insight.title || "").trim().startsWith("📌")
        const toneCls = isNote
          ? "bg-muted/40 border-border"
          : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700"

        return (
          <div
            key={insight.__id}
            className={`p-4 rounded-xl shadow relative border ${toneCls}`}
          >
            <button
              onClick={() => handleDelete(insight)}
              className="absolute top-2 right-2 inline-flex items-center justify-center rounded p-1 text-muted-foreground hover:text-red-600 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              title={t("insight.delete")}
              aria-label={t("insight.delete")}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>

            <div className="flex items-start gap-2">
              {isNote ? (
                <Activity className="h-4 w-4 mt-1 text-muted-foreground" aria-hidden="true" />
              ) : (
                <Info className="h-4 w-4 mt-1 text-blue-600 dark:text-blue-300" aria-hidden="true" />
              )}
              <div>
                <h3
                  className={`font-semibold text-sm ${
                    isNote ? "text-foreground" : "text-blue-700 dark:text-blue-200"
                  }`}
                >
                  {insight.title}
                </h3>
                <p className="text-xs text-muted-foreground">{insight.description}</p>
              </div>
            </div>
          </div>
        )
      })}

      {insights.length > 2 && (
        <div className="text-center pt-1">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-1"
            aria-expanded={expanded}
          >
            {expanded ? t("insight.showLess") : t("insight.showAll")}
          </button>
        </div>
      )}
    </div>
  )
}

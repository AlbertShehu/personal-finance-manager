import React from "react"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"

export default function DateRangeTabs({ value, onChange, className }) {
  const { t } = useTranslation()
  const ranges = [
    { key: "30d", label: t("range.last30", "Last 30 days") },
    { key: "mtd", label: t("range.thisMonth", "This month") },
    { key: "ytd", label: t("range.ytd", "Year to date") },
    { key: "all", label: t("range.all", "All") },
  ]

  return (
    <div
      role="tablist"
      aria-label={t("dashboard.range.aria", "Date range")}
      className={cn(
        "inline-flex items-center gap-1 rounded-lg border bg-card p-1",
        "shadow-sm",
        className
      )}
    >
      {ranges.map((r) => {
        const active = value === r.key
        return (
          <button
            key={r.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange?.(r.key)}
            className={cn(
              "px-3 py-1.5 text-sm rounded-md transition-colors outline-none",
              "focus-visible:ring-2 focus-visible:ring-primary",
              active
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-foreground"
            )}
          >
            {r.label}
          </button>
        )
      })}
    </div>
  )
}

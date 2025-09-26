import React from "react"
import { LineChart, Line, ResponsiveContainer } from "recharts"
import { cn } from "@/lib/utils"

export default function KpiCard({ title, value, deltaPct, data = [], color = "#3b82f6", className }) {
  const isUp = typeof deltaPct === "number" && deltaPct >= 0
  return (
    <div className={cn("rounded-xl border bg-card p-4 shadow-sm", className)}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm text-muted-foreground">{title}</div>
          <div className="text-1.5xl font-semibold mt-1">{value}</div>
          {typeof deltaPct === "number" && (
            <div className={cn("mt-1 text-xs", isUp ? "text-emerald-600" : "text-red-600")}>
              {isUp ? "▲" : "▼"} {Math.abs(deltaPct).toFixed(1)}%
              <span className="text-muted-foreground"> vs prev.</span>
            </div>
          )}
        </div>
        <div className="h-12 w-24">
          <ResponsiveContainer>
            <LineChart data={data}>
              <Line type="monotone" dataKey="y" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

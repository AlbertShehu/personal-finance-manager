// /src/features/dashboard/components/range-utils.js
export function getDateRange(key) {
  const now = new Date()
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

  if (key === "30d") {
    const start = new Date(end); start.setDate(end.getDate() - 29)
    return { start, end }
  }
  if (key === "month") {
    const start = new Date(end.getFullYear(), end.getMonth(), 1)
    return { start, end }
  }
  if (key === "ytd") {
    const start = new Date(end.getFullYear(), 0, 1)
    return { start, end }
  }
  return { start: new Date(2000, 0, 1), end } // "all"
}

export function getPreviousRange({ start, end }) {
  const ms = end - start
  const prevEnd = new Date(start); prevEnd.setMilliseconds(prevEnd.getMilliseconds() - 1)
  const prevStart = new Date(prevEnd.getTime() - ms)
  return { start: prevStart, end: prevEnd }
}

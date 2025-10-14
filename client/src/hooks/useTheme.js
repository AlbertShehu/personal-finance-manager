// src/hooks/useTheme.js
import * as React from "react"

const STORAGE_KEY = "theme" // "light" | "dark"

function applyTheme(theme) {
  const root = document.documentElement
  const shouldDark = theme === "dark"
  root.classList.toggle("dark", shouldDark)
}

export function useTheme() {
  const [theme, setThemeState] = React.useState(() => {
    if (typeof window === "undefined") return "light"
    return localStorage.getItem(STORAGE_KEY) || "light"
  })

  // Apply on mount
  React.useEffect(() => {
    applyTheme(theme)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const setTheme = React.useCallback((next) => {
    localStorage.setItem(STORAGE_KEY, next)
    setThemeState(next)
    applyTheme(next)
  }, [])

  return { theme, setTheme }
}

export default useTheme

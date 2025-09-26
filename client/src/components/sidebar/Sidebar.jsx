// src/components/shared/sidebar/Sidebar.jsx
import React from "react"
import { NavLink } from "react-router-dom"
import { Home, BarChart2, TrendingUp, Target } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"
import { useSelector } from "react-redux"

const LINKS = [
  { to: "/dashboard", icon: Home, i18n: "sidebar.dashboard" },
  { to: "/transactions", icon: BarChart2, i18n: "sidebar.transactions" },
  { to: "/analytics", icon: TrendingUp, i18n: "sidebar.analytics" },
  { to: "/budgets", icon: Target, i18n: "sidebar.budgets" },
]

function Sidebar() {
  const { t } = useTranslation()
  const authState = useSelector((state) => state.auth)
  const user = authState?.user

  return (
    <aside
      aria-label={t("sidebar.navigation", "Sidebar navigation")}
      className={cn(
        "flex flex-col w-64 h-screen",
        "bg-sidebar text-sidebar-foreground border-r border-sidebar-border",
        "py-6 px-3 md:px-4 overflow-y-auto overflow-x-hidden sticky top-0"
      )}
    >
      {/* Përshëndetja e përdoruesit */}
      {user && (
        <div className="mb-6 text-xs md:text-sm text-muted-foreground truncate">
          👋 {t("avatar.greeting", "Hello")}, {user.name}
        </div>
      )}

      {/* Navigation kryesor */}
      <nav className="flex-1 space-y-1">
        {LINKS.map(({ to, icon, i18n }) => (
          <NavLink
            key={to}
            to={to}
            aria-label={t(i18n)}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium truncate transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "hover:bg-sidebar-accent/60 text-sidebar-foreground"
              )
            }
          >
            {React.createElement(icon, {
              className: "h-4 w-4 shrink-0",
              "aria-hidden": true,
            })}
            <span className="truncate">{t(i18n)}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="mt-auto pt-6 text-center text-[10px] md:text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()}
      </div>
    </aside>
  )
}

export default React.memo(Sidebar)

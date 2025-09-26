// src/components/shared/sidebar/SidebarSheet.jsx
import React from "react"
import { Menu, Home, BarChart2, TrendingUp, Target } from "lucide-react"
import { NavLink } from "react-router-dom"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"
import { useSelector } from "react-redux"
import Logo from "@/assets/finance-logo.png"

const LINKS = [
  { to: "/dashboard", icon: Home, i18n: "sidebar.dashboard" },
  { to: "/transactions", icon: BarChart2, i18n: "sidebar.transactions" },
  { to: "/analytics", icon: TrendingUp, i18n: "sidebar.analytics" },
  { to: "/budgets", icon: Target, i18n: "sidebar.budgets" },
]

export default function SidebarSheet() {
  const { t } = useTranslation()
  const [open, setOpen] = React.useState(false)
  const user = useSelector((state) => state.auth.user)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="md:hidden inline-flex items-center justify-center rounded-md p-2 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        aria-label={t("sidebar.openMenu", "Open menu")}
      >
        <Menu className="h-6 w-6" aria-hidden="true" />
      </SheetTrigger>

      <SheetContent
        side="left"
        className={cn(
          "w-64 p-0",
          "bg-sidebar text-sidebar-foreground border-r border-sidebar-border"
        )}
        aria-label={t("sidebar.navigation", "Sidebar navigation")}
      >
        <div className="flex h-full flex-col">
          <SheetHeader className="px-4 py-4 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <img
                src={Logo}
                alt={t('aside.logoAlt', 'FinMan logo')}
                className="w-28 md:w-36 select-none object-contain"
                loading="lazy"
                decoding="async"
                draggable={false}
              />
            </div>
            {user && (
              <div className="text-xs text-muted-foreground truncate">
                👋 {t("avatar.greeting", "Hello")}, {user.name}
              </div>
            )}
          </SheetHeader>

          {/* Links */}
          <nav className="flex-1 space-y-1 px-2 py-3">
            {LINKS.map(({ to, icon, i18n }) => (
              <SheetClose asChild key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    cn(
                      "group flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium truncate transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "hover:bg-sidebar-accent/60 text-sidebar-foreground"
                    )
                  }
                  aria-label={t(i18n)}
                >
                  {React.createElement(icon, {
                    className: "h-4 w-4 shrink-0",
                    "aria-hidden": true,
                  })}
                  <span className="truncate">{t(i18n)}</span>
                </NavLink>
              </SheetClose>
            ))}
          </nav>

          <SheetFooter className="px-4 py-4 border-t border-sidebar-border text-[10px] md:text-xs text-muted-foreground text-center">
            &copy; {new Date().getFullYear()}
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}
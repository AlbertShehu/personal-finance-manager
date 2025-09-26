/* eslint-disable no-unused-vars */
// src/components/shared/navbar/DropDownAvatar.jsx
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import { logoutUser } from "@/store/authSlice"
import { useTranslation } from "react-i18next"
import { useToast } from "@/hooks/use-toast"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"

import { User, Settings, KeyRound, LogOut, Edit3, Sun, Moon, Check } from "lucide-react"
import useTheme from "@/hooks/useTheme"

function getInitials(name) {
  if (!name) return "??"
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export default function DropDownAvatar() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { toast } = useToast()
  const authState = useSelector((state) => state.auth)
  const user = authState?.user
  const { theme, setTheme } = useTheme()

  if (!user) return null

  function handleLogout() {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    sessionStorage.removeItem("token")
    sessionStorage.removeItem("user")

    dispatch(logoutUser())
    toast({
      title: t("avatar.logoutSuccess", "You have been logged out"),
      description: t("avatar.logoutDescription", "See you next time!"),
      variant: "success",
      duration: 5000,
    })
    navigate("/", { replace: true })
  }

  const themeItems = [
    { key: "dark",   icon: Moon,   label: t("theme.dark", "Dark") },
    { key: "light",  icon: Sun,    label: t("theme.light", "Light") },
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        asChild
        aria-label={t("avatar.account", "Account")}
      >
        <Avatar className="cursor-pointer ring-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          {user?.avatar ? (
            <AvatarImage src={user.avatar} alt={user.name || "User"} />
          ) : null}
          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-52 sm:w-60 max-w-[calc(100vw-2rem)] sm:max-w-none" align="end" sideOffset={4} alignOffset={-4} avoidCollisions={true} collisionPadding={16}>
        <DropdownMenuLabel>
          <div className="flex items-start gap-2">
            <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div className="min-w-0">
              <div className="font-medium truncate">
                {user.name || t("avatar.account")}
              </div>
              {user.email ? (
                <div className="text-xs text-muted-foreground truncate">
                  {user.email}
                </div>
              ) : null}
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => navigate("/profile")}>
            <User className="h-4 w-4 mr-2" />
            {t("avatar.profile")}
          </DropdownMenuItem>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Settings className="h-4 w-4 mr-2" />
              {t("avatar.settings")}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-40 sm:w-48 max-w-[calc(100vw-4rem)] sm:max-w-none" sideOffset={2} alignOffset={-2} avoidCollisions={true} collisionPadding={16}>
              <DropdownMenuItem onClick={() => navigate("/settings/password")}>
                <KeyRound className="h-4 w-4 mr-2" />
                {t("avatar.password")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/settings/profile")}>
                <Edit3 className="h-4 w-4 mr-2" />
                {t("avatar.editProfile")}
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Theme submenu inline */}
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                {t("theme.title", "Theme")}
              </div>
              {themeItems.map(({ key, icon: Icon, label }) => {
                const selected = theme === key
                return (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => setTheme(key)}
                    className="justify-between"
                    role="menuitemradio"
                    aria-checked={selected}
                  >
                    <span className="inline-flex items-center">
                      <Icon className="h-4 w-4 mr-2" />
                      {label}
                    </span>
                    {selected ? <Check className="h-4 w-4" /> : null}
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleLogout}
          className="text-red-600 focus:text-red-700"
        >
          <LogOut className="h-4 w-4 mr-2" />
          {t("avatar.logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

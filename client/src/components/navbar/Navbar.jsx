// src/components/shared/navbar/Navbar.jsx
import React from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import Logo from "@/assets/finance-logo.png"
import DropDownAvatar from "./DropDownAvatar"
import { useSelector } from "react-redux"
import SidebarSheet from "../sidebar/SidebarSheet"
import LanguageSwitcher from "@/components/LanguageSwitcher"
// eslint-disable-next-line no-unused-vars
import { motion, useReducedMotion } from "framer-motion"

export default function Navbar() {
  const { t } = useTranslation()
  const authState = useSelector((state) => state.auth)
  const user = authState?.user
  const prefersReducedMotion = useReducedMotion()

  const titleVariants = prefersReducedMotion
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: -8 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { type: "spring", stiffness: 160, damping: 18 },
        },
      }

  const subtitleVariants = prefersReducedMotion
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, x: -8 },
        visible: {
          opacity: 1,
          x: 0,
          transition: { delay: 0.15, type: "spring", stiffness: 140, damping: 18 },
        },
      }

  return (
    <nav
      role="navigation"
      aria-label="Top navigation"
      className="bg-background border-b border-border"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Sidebar trigger (mobile) + Logo */}
        <div className="flex items-center gap-3">
          <div className="md:hidden">
            <SidebarSheet />
          </div>
          <Link to="/dashboard" className="flex items-center gap-2" aria-label={t("navbar.home", "Home")}>
            <img
              src={Logo}
              alt={t("app.name", "FinMan")}
              className="h-16 w-auto md:h-24"
              width={70}
              height={70}
              decoding="async"
            />
          </Link>
        </div>

        {/* Title (md+) */}
        <div className="hidden md:block">
          <motion.h1
            className="text-xl md:text-2xl font-bold text-primary"
            variants={titleVariants}
            initial="hidden"
            animate="visible"
          >
            {t("navbar.title")}
            <motion.span
              className="ml-2 inline-block text-muted-foreground font-medium"
              variants={subtitleVariants}
              initial="hidden"
              animate="visible"
            >
              {t("navbar.subtitle")}
            </motion.span>
          </motion.h1>
        </div>

        {/* Right side: Language + Avatar */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          {user ? (
            <DropDownAvatar />
          ) : (
            <Link
              to="/login"
              className="text-sm text-primary hover:underline"
            >
              {t("auth.login")}
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}

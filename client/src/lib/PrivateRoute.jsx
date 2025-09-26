// src/lib/PrivateRoute.jsx
import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'

/**
 * PrivateRoute
 * - Mbron rrutat nga përdoruesit jo të autentikuar
 * - (Opsionale) lejon vetëm role të caktuara me props `roles`
 * - `redirectTo` default /login
 */
export default function PrivateRoute({ children, roles, redirectTo = '/login' }) {
  const authState = useSelector((state) => state.auth)
  const { user, loading } = authState || {}
  const location = useLocation()

  // Faqe ngarkimi e aksesueshme
  if (loading) {
    return (
      <div className="min-h-[40vh] grid place-items-center p-6" role="status" aria-live="polite">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-ring border-r-transparent" />
        <span className="sr-only">Loading…</span>
      </div>
    )
  }

  // Jo i loguar -> shko në login dhe ruaj destinacionin
  if (!user) {
    const from = location.pathname + location.search + location.hash
    // shmang loop nëse je tashmë te /login
    if (location.pathname !== redirectTo) {
      return <Navigate to={redirectTo} state={{ from }} replace />
    }
    return null
  }

  // Kontroll roli (nëse kërkohet)
  if (roles && roles.length) {
    const userRoles = Array.isArray(user?.roles) ? user.roles : [user?.role].filter(Boolean)
    const authorized = userRoles.some((r) => roles.includes(r))
    if (!authorized) {
      // Mund të kesh një /403; për tani kthe në dashboard
      return <Navigate to="/dashboard" replace state={{ unauthorized: true }} />
    }
  }

  return children
}

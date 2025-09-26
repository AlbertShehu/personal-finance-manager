// src/App.jsx
import React, { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import PrivateRoute from './lib/PrivateRoute'
import Layout from './components/layout/Layout'
import { Toaster } from "@/components/ui/toaster"
import { MotionConfig, useReducedMotion } from 'framer-motion'

// Lazy-load pages
const LandingPage      = lazy(() => import('./pages/LandingPage'))
const Login            = lazy(() => import('./pages/Login'))
const Register         = lazy(() => import('./pages/Register'))
const ForgotPassword   = lazy(() => import('./pages/login/ForgotPasswordPage'))
const ResetPassword    = lazy(() => import('./pages/login/ResetPasswordPage'))
const Dashboard        = lazy(() => import('./pages/Dashboard'))
const Analytics        = lazy(() => import('./pages/sidebar/Analytics'))
const Budgets          = lazy(() => import('./pages/sidebar/Budgets'))
const Profile          = lazy(() => import('./pages/Profile'))
const PasswordSettings = lazy(() => import('./pages/settings/PasswordSettings'))
const ProfileSettings  = lazy(() => import('./pages/settings/ProfileSettings'))
const Transactions     = lazy(() => import('./pages/sidebar/Transactions'))

/** Error boundary i thjeshtë për lazy chunks / render errors */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error, info) {
    // mund të dërgosh në log service këtu
    console.error('App error boundary:', error, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[40vh] grid place-items-center p-6 text-center">
          <div>
            <h1 className="text-xl font-semibold mb-2">Diçka shkoi keq</h1>
            <p className="text-muted-foreground mb-4">
              Provo të rifreskosh faqen. Nëse vazhdon, kthehu në fillim.
            </p>
            <a href="/" className="inline-flex items-center gap-2 rounded-lg px-4 py-2 border">
              ← Back to Home
            </a>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

/** Reset scroll kur ndryshon rruga */
function ScrollToTop() {
  const { pathname } = useLocation()
  React.useEffect(() => {
    // 'auto' është standart; shmang vlerat jo-standarde si 'instant'
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname])
  return null
}

/** Fallback i aksesueshëm me spinner */
function LoadingFallback() {
  return (
    <div className="min-h-[30vh] grid place-items-center p-6" role="status" aria-live="polite">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-ring border-r-transparent" />
        Loading…
      </div>
    </div>
  )
}

export default function App() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      {/* Centralizo politikat e motion në të gjithë app-in */}
      <MotionConfig reducedMotion={prefersReducedMotion ? 'always' : 'never'}>
        <ErrorBoundary>
          <ScrollToTop />
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Public */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />

              {/* Private (layout + auth) */}
              <Route
                element={
                  <PrivateRoute>
                    <Layout />
                  </PrivateRoute>
                }
              >
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="budgets" element={<Budgets />} />
                <Route path="profile" element={<Profile />} />
                <Route path="settings/password" element={<PasswordSettings />} />
                <Route path="settings/profile" element={<ProfileSettings />} />
                <Route path="transactions" element={<Transactions />} />
              </Route>
            </Routes>
          </Suspense>
          <Toaster/>
        </ErrorBoundary>
      </MotionConfig>
    </BrowserRouter>
  )
}

// src/main.jsx
import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from '@/store/store'
import App from './App'
import './index.css'
import '@fontsource-variable/inter'
import i18n from './lib/i18'
import { GoogleOAuthProvider } from '@react-oauth/google'

// Dark-mode bootstrap për të shmangur flicker
const rootEl = document.documentElement
const savedTheme = localStorage.getItem('theme')
const prefersDark =
  window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches

if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
  rootEl.classList.add('dark')
} else {
  rootEl.classList.remove('dark')
}

// ErrorBoundary për të kapur gabimet në prod
function ErrorBoundary({ children }) {
  const [err, setErr] = React.useState(null)
  React.useEffect(() => {
    const handler = (e) => setErr(e.reason || e.error || e)
    window.addEventListener("error", handler)
    window.addEventListener("unhandledrejection", handler)
    return () => {
      window.removeEventListener("error", handler)
      window.removeEventListener("unhandledrejection", handler)
    }
  }, [])
  if (err) {
    return (
      <div style={{ padding: 24 }}>
        <h1>App error</h1>
        <pre style={{ whiteSpace: "pre-wrap" }}>{String(err?.stack || err)}</pre>
      </div>
    )
  }
  return children
}

// Lexo Client ID nga .env (frontend)
const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim()
if (!GOOGLE_CLIENT_ID) {
  console.warn(
    '⚠️  VITE_GOOGLE_CLIENT_ID mungon. Google Sign-In s\'do të funksionojë. ' +
    'Për të aktivizuar, vendos VITE_GOOGLE_CLIENT_ID në client/.env'
  )
}

// Gjithmonë rrethoj App me GoogleOAuthProvider që hooks e Google të mos hedhin error
const root = createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <ErrorBoundary>
          {GOOGLE_CLIENT_ID ? (
            <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
              <App />
            </GoogleOAuthProvider>
          ) : (
            <App />
          )}
        </ErrorBoundary>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
)

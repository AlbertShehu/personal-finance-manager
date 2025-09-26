// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from '@/store/store'
import App from './App'
import './index.css'
import '@fontsource-variable/inter'
import './lib/i18'
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

// Lexo Client ID nga .env (frontend)
const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim()
if (!GOOGLE_CLIENT_ID) {
  console.warn(
    '⚠️  VITE_GOOGLE_CLIENT_ID mungon. Google Sign-In s’do të funksionojë. ' +
    'Për të aktivizuar, vendos VITE_GOOGLE_CLIENT_ID në client/.env'
  )
}

// Gjithmonë rrethoj App me GoogleOAuthProvider që hooks e Google të mos hedhin error
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <App />
      </GoogleOAuthProvider>
    </Provider>
  </React.StrictMode>
)

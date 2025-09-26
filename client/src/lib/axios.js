/* eslint-disable no-empty */
// src/lib/axios.js
import axios from 'axios'
import axiosRetry from 'axios-retry'

// Lexo bazën nga env (opsionale). Nëse nuk është vendosur, fallback në backend local
const baseRaw = (import.meta.env.VITE_API_URL || '').trim() || 'http://localhost:8095'

// Siguro që base të mos ketë slash në fund, pastaj shto /api
const BASE = baseRaw.replace(/\/+$/, '') + '/api'

// Nëse përdor cookie auth/CSRF, vendos VITE_USE_COOKIES=true
const useCookies = String(import.meta.env.VITE_USE_COOKIES || '').toLowerCase() === 'true'

const api = axios.create({
  baseURL: BASE,
  withCredentials: useCookies,
  timeout: Number(import.meta.env.VITE_API_TIMEOUT || 15000),
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
})

// Retry vetëm për gabime të rrjetit, 429/502/503/504
axiosRetry(api, {
  retries: Number(import.meta.env.VITE_API_RETRIES || 2),
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    const s = error?.response?.status
    return axiosRetry.isNetworkError(error) || [429, 502, 503, 504].includes(s)
  },
})

// Setters të thjeshtë për token
export const setAuthToken = (token, { persist = true } = {}) => {
  if (!token) return
  api.defaults.headers.common.Authorization = `Bearer ${token}`
  try { (persist ? localStorage : sessionStorage).setItem('token', token) } catch {}
}

export const clearAuth = () => {
  delete api.defaults.headers.common.Authorization
  try {
    localStorage.removeItem('token')
    sessionStorage.removeItem('token')
    localStorage.removeItem('user')
  } catch {}
}

// REQUEST: ngjit Bearer token nga storage (nëse s’po përdor cookies)
api.interceptors.request.use((config) => {
  if (!useCookies && !config.headers.Authorization) {
    try {
      const t = localStorage.getItem('token') || sessionStorage.getItem('token')
      if (t) config.headers.Authorization = `Bearer ${t}`
    } catch {}
  }
  // X-Request-ID ndihmon në debug në server
  const rnd = globalThis?.crypto?.randomUUID?.()
  if (!config.headers['X-Request-ID'] && rnd) {
    config.headers['X-Request-ID'] = rnd
  }
  return config
})

let isRefreshing = false
let refreshPromise = null

// RESPONSE: 401 → refresh (opsionale) ose logout → /login
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error?.response?.status
    if (status === 401) {
      const tried = error.config?._retry
      const refreshEndpoint = import.meta.env.VITE_REFRESH_ENDPOINT // p.sh. '/auth/refresh'
      if (!tried && refreshEndpoint) {
        if (!isRefreshing) {
          isRefreshing = true
          refreshPromise = api
            .post(refreshEndpoint, null, { withCredentials: useCookies })
            .finally(() => { isRefreshing = false })
        }
        try {
          await refreshPromise
          error.config._retry = true
          if (!useCookies) {
            const t = localStorage.getItem('token') || sessionStorage.getItem('token')
            if (t) error.config.headers.Authorization = `Bearer ${t}`
          }
          return api.request(error.config)
        } catch {
          clearAuth()
        }
      } else {
        clearAuth()
      }
      if (location.pathname !== '/login') window.location.assign('/login')
    }
    return Promise.reject(error)
  }
)

export { BASE }
export default api


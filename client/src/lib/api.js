// src/lib/api.js
import axios from 'axios'

const BASE = (import.meta.env.VITE_API_URL || '').trim()

const api = axios.create({
  baseURL: BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  // timeout: 10000, // optional
})

// Helper-a që kthejnë direkt .data dhe unifikojnë gabimet
export const apiGet    = (url, config)           => api.get(url, config).then((r) => r.data)
export const apiPost   = (url, data, config)     => api.post(url, data, config).then((r) => r.data)
export const apiPut    = (url, data, config)     => api.put(url, data, config).then((r) => r.data)
export const apiPatch  = (url, data, config)     => api.patch(url, data, config).then((r) => r.data)
export const apiDelete = (url, config)           => api.delete(url, config).then((r) => r.data)

// Normalizim i gabimeve për UI/toast
export const normalizeError = (err) => {
  const status = err?.response?.status ?? 0
  const data = err?.response?.data
  return {
    status,
    message: data?.message || err.message || 'Request failed',
    code: data?.code,
    details: data?.errors || data?.details,
  }
}

export default api

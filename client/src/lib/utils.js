/* eslint-disable eqeqeq */
// src/lib/utils.js
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Tailwind class merger (shadcn-style) */
export const cn = (...inputs) => twMerge(clsx(inputs))

/** Premtim i thjeshtë për vonesë */
export const sleep = (ms) => new Promise((res) => setTimeout(res, ms))

/** Debounce (vonon thirrjet derisa të kalojë `wait`) */
export const debounce = (fn, wait = 300) => {
  let t
  return (...args) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...args), wait)
  }
}

/** Throttle (kufizon thirrjet në maksimum një herë në `wait`) */
export const throttle = (fn, wait = 300, { leading = true, trailing = true } = {}) => {
  let last = 0
  let timer
  return (...args) => {
    const now = Date.now()
    if (!last && !leading) last = now
    const remaining = wait - (now - last)
    if (remaining <= 0) {
      if (timer) { clearTimeout(timer); timer = null }
      last = now
      fn(...args)
    } else if (trailing && !timer) {
      timer = setTimeout(() => {
        last = leading ? Date.now() : 0
        timer = null
        fn(...args)
      }, remaining)
    }
  }
}

/* ---------------- Locale helpers (pa importuar i18n) ---------------- */

const LOCALE_MAP = { en: 'en-US', de: 'de-DE', sq: 'sq-AL' }

const getActiveLang = () => {
  if (typeof window === 'undefined') return 'en'
  const fromStorage = (localStorage.getItem('lang') || localStorage.getItem('i18nextLng') || '').toLowerCase()
  if (fromStorage) return fromStorage.split('-')[0]
  const html = (document.documentElement.getAttribute('lang') || '').toLowerCase()
  if (html) return html.split('-')[0]
  const nav = (navigator?.language || 'en').toLowerCase()
  return nav.split('-')[0]
}

const getActiveLocale = () => {
  const lang = getActiveLang()
  return LOCALE_MAP[lang] || 'en-US'
}

/* ---------------- Formatters ---------------- */

/**
 * Formatim monedheje me Intl.
 * - symbolPosition: 'auto' (default bazuar në locale), ose 'before'/'after' për t’e detyruar pozicionin.
 * - Respekton shenjën negative: p.sh. '-€ 123.45' kur është 'before'.
 */
export const formatCurrency = (
  value,
  {
    currency = 'EUR',
    locale,
    minimumFractionDigits,
    maximumFractionDigits,
    symbolPosition = 'before', // 'auto' | 'before' | 'after'
  } = {}
) => {
  if (value == null || Number.isNaN(value)) return ''

  const resolvedLocale = locale || getActiveLocale()
  const opts = { style: 'currency', currency }
  if (minimumFractionDigits != null) opts.minimumFractionDigits = minimumFractionDigits
  if (maximumFractionDigits != null) opts.maximumFractionDigits = maximumFractionDigits

  // 'auto' — lë Intl të vendosë sipas locale
  if (symbolPosition === 'auto') {
    return new Intl.NumberFormat(resolvedLocale, opts).format(Number(value))
  }

  // Nëse detyrohet para/pas, rindërto me formatToParts për të ruajtur numrin & shenjën
  const nf = new Intl.NumberFormat(resolvedLocale, opts)
  const parts = nf.formatToParts(Number(value))

  const currencyIndex = parts.findIndex((p) => p.type === 'currency')
  if (currencyIndex === -1) {
    // S’gjetëm pjesë 'currency' — fallback
    return nf.format(Number(value))
  }

  const currencyPart = parts[currencyIndex]
  const rest = parts.filter((_, i) => i !== currencyIndex)

  // Siguro që minus/plusSign të jetë përpara kur është 'before'
  const signIndex = rest.findIndex((p) => p.type === 'minusSign' || p.type === 'plusSign')
  const signPart = signIndex !== -1 ? rest[signIndex] : null
  const restNoSign = signIndex !== -1 ? rest.filter((_, i) => i !== signIndex) : rest

  let rebuilt
  if (symbolPosition === 'before') {
    // - € 1.234,56  (minus përpara, pastaj currency)
    rebuilt = [
      ...(signPart ? [signPart] : []),
      currencyPart,
      { type: 'literal', value: ' ' },
      ...restNoSign,
    ]
  } else {
    // 'after' — numri i formatuar + hapësirë + currency
    rebuilt = [
      ...rest,
      { type: 'literal', value: ' ' },
      currencyPart,
    ]
  }

  return rebuilt.map((p) => p.value).join('').replace(/\s{2,}/g, ' ').trim()
}

/** Formatim numrash (p.sh. compact: 1.2K) */
export const formatNumber = (
  value,
  { locale, notation = 'standard', maximumFractionDigits = 2 } = {}
) => {
  if (value == null || Number.isNaN(value)) return ''
  const resolvedLocale = locale || getActiveLocale()
  return new Intl.NumberFormat(resolvedLocale, { notation, maximumFractionDigits }).format(Number(value))
}

/** Formatim datash me Intl */
export const formatDate = (
  date,
  { locale, dateStyle = 'medium', timeStyle } = {}
) => {
  const d = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  const resolvedLocale = locale || getActiveLocale()
  const opts = { dateStyle }
  if (timeStyle) opts.timeStyle = timeStyle
  return new Intl.DateTimeFormat(resolvedLocale, opts).format(d)
}

/** Ndërtim URL me query params */
export const buildUrl = (base, params) => {
  if (!params) return base
  const usp = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v == null) return
    if (Array.isArray(v)) v.forEach((x) => usp.append(k, String(x)))
    else usp.set(k, String(v))
  })
  const q = usp.toString()
  return q ? `${base}?${q}` : base
}

/** JSON i sigurt */
export const parseJSONSafe = (str, fallback = null) => {
  try { return JSON.parse(str) } catch { return fallback }
}
export const stringifyJSONSafe = (obj, fallback = '') => {
  try { return JSON.stringify(obj) } catch { return fallback }
}

/** Shkarkim i një Blob-i si file */
export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

/** Të ndryshme */
export const clamp = (n, min, max) => Math.min(Math.max(n, min), max)
export const isTruthy = (v) => !!v
export const uid = () =>
  (globalThis.crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2))

/** Merge refs për komponentë React me forwardRef */
export const mergeRefs = (...refs) => (node) => {
  refs.forEach((ref) => {
    if (!ref) return
    if (typeof ref === 'function') ref(node)
    else ref.current = node
  })
}

/** Nxjerr mesazh gabimi i përdorshëm për UI */
export const toErrorMessage = (err, fallback = 'Something went wrong') => {
  return (
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    fallback
  )
}

/** Maskime të thjeshta për UI financiare */
export const maskCard = (num = '') => String(num).replace(/\D/g, '').replace(/.(?=.{4})/g, '•')
export const last4 = (num = '') => String(num).slice(-4)

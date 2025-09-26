// src/components/LanguageSwitcher.jsx
import { useTranslation } from "react-i18next"
import gbFlag from "@/assets/flags/en.png"
import alFlag from "@/assets/flags/al.png"
import deFlag from "@/assets/flags/de.png"

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const baseLang = (i18n.language || 'en').toLowerCase().split('-')[0]

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng)
    // ruaj me key-n që e përdorim kudo
    localStorage.setItem("lang", lng)
    // ruaj edhe i18nextLng që LanguageDetector e kupton out-of-the-box
    localStorage.setItem("i18nextLng", lng)
    // vendos atributin lang tek <html>
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', lng)
    }
  }

  const langs = [
    { code: "en", label: "EN", flag: gbFlag },
    { code: "sq", label: "SQ", flag: alFlag },
    { code: "de", label: "DE", flag: deFlag },
  ]

  return (
    <div className="flex gap-1 items-center text-xs">
      {langs.map(({ code, label, flag }) => {
        const active = baseLang === code
        return (
          <button
            key={code}
            onClick={() => changeLanguage(code)}
            aria-pressed={active}
            aria-label={`Change language to ${label}`}
            className={`flex items-center gap-1 px-1.5 py-1 rounded ${
              active ? "bg-blue-100 dark:bg-blue-800 font-medium ring-1 ring-blue-400" : "hover:underline"
            }`}
          >
            <img src={flag} alt={`${label} flag`} className="w-4 h-3 object-cover rounded-sm" />
            {label}
          </button>
        )
      })}
    </div>
  )
}

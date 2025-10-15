import React, { useState } from "react"
import { useGoogleLogin } from "@react-oauth/google"
import { useTranslation } from "react-i18next"
import { useToast } from "@/hooks/use-toast"
import api from "@/lib/axios"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

const GoogleSignInButton = ({ 
  onSuccess, 
  onError, 
  variant = "default",
  size = "default",
  className = "",
  disabled = false,
  children,
  ...props 
}) => {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  // Konfigurimi i Google
  const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim()

  // Callback-et e Google
  const handleGoogleSuccess = async (cred) => {
    setIsLoading(true)
    try {
      const res = await api.post("/auth/google", { credential: cred?.credential })
      const { token, user } = res.data || {}
      
      if (token) localStorage.setItem("token", token)
      if (user) localStorage.setItem("user", JSON.stringify(user))

      toast({
        variant: "success",
        title: t("auth.google.success.title", "Welcome!"),
        description: t("auth.google.success.desc", "Signed in with Google successfully."),
        duration: 4000,
      })

      if (onSuccess) {
        onSuccess({ token, user })
      }
    } catch (e) {
      const errorMessage = e?.response?.data?.message || e?.message || t("auth.google.error.desc", "Please try again.")
      
      toast({
        variant: "destructive",
        title: t("auth.google.error.title", "Google Sign-In failed"),
        description: errorMessage,
        duration: 6000,
      })

      if (onError) {
        onError(e)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleError = (error) => {
    toast({
      variant: "destructive",
      title: t("auth.google.error.title", "Google Sign-In failed"),
      description: t("auth.google.error.desc", "Please try again."),
      duration: 6000,
    })

    if (onError) {
      onError(error)
    }
  }

  // Hook-i i Google login
  let triggerGoogle = () => {
    console.warn("⚠️ VITE_GOOGLE_CLIENT_ID mungon — Google Sign-In është i fikur.")
  }
  
  if (GOOGLE_CLIENT_ID) {
    triggerGoogle = useGoogleLogin({
      onSuccess: handleGoogleSuccess,
      onError: handleGoogleError,
      flow: "implicit",
    })
  }

  const handleClick = () => {
    if (isLoading || disabled) return

    if (GOOGLE_CLIENT_ID) {
      try {
        triggerGoogle()
      } catch (e) {
        console.error("Google trigger failed:", e)
        toast({
          variant: "destructive",
          title: t("auth.google.error.title", "Google Sign-In failed"),
          description: t("auth.google.error.desc", "Please try again."),
          duration: 6000,
        })
      }
    } else {
      toast({
        variant: "destructive",
        title: t("auth.google.notConfigured.title", "Google Sign-In not configured"),
        description: t(
          "auth.google.notConfigured.desc",
          "Set VITE_GOOGLE_CLIENT_ID in client/.env and restart the dev server to enable Google Sign-In."
        ),
        duration: 7000,
      })
    }
  }

  // Stilet profesionale të butonit Google
  const getButtonStyles = () => {
    const baseStyles = "inline-flex items-center justify-center gap-3 rounded-lg border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
    
    const sizeStyles = {
      sm: "px-3 py-2 text-sm h-9",
      default: "px-4 py-3 text-sm h-11",
      lg: "px-6 py-4 text-base h-12"
    }

    const variantStyles = {
      default: "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 shadow-sm hover:shadow-lg hover:border-gray-400 dark:hover:border-gray-500",
      outline: "bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-gray-400 dark:hover:border-gray-500",
      ghost: "bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 border-transparent text-gray-700 dark:text-gray-200"
    }

    return `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`
  }

  return (
    <Button
      type="button"
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={getButtonStyles()}
      aria-label={t("auth.google.button", "Sign in with Google")}
      {...props}
    >
      {/* Logo-ja e Google */}
      <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-white dark:bg-gray-800 rounded-sm border border-gray-200 dark:border-gray-600">
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-gray-500 dark:text-gray-400" />
        ) : (
          <svg 
            viewBox="0 0 24 24" 
            className="w-4 h-4" 
            aria-hidden="true"
          >
            <path 
              fill="#4285F4" 
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path 
              fill="#34A853" 
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path 
              fill="#FBBC05" 
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path 
              fill="#EA4335" 
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        )}
      </div>

      {/* Teksti i Butonit */}
      <span className="flex-1 text-center font-medium">
        {children || t("auth.google.button", "Continue with Google")}
      </span>
    </Button>
  )
}

export default GoogleSignInButton

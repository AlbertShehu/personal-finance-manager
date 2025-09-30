/* eslint-disable react-hooks/rules-of-hooks */
// src/components/shared/auth/LoginForm.jsx
import React, { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate, useLocation, Link } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"

import { loginUser } from "@/store/authSlice"
import { loginSchema } from "@/lib/validations/loginSchema"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import { useMobileToast } from "@/hooks/use-mobile-toast"
import GoogleSignInButton from "@/components/ui/google-signin-button"
import api from "@/lib/axios"
import { cn } from "@/lib/utils"

const normalizeEmail = (v = "") => v.trim().toLowerCase()
// Gmail validation removed - now accepts any valid email

export default function LoginForm() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || "/dashboard"
  const authState = useSelector((state) => state.auth)
  const { isLoading } = authState || {}
  const { toast } = useToast()
  const { toast: mobileToast } = useMobileToast()

  const [showResend, setShowResend] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)

  const form = useForm({
    resolver: zodResolver(loginSchema(t)),
    defaultValues: { email: "", password: "", remember: true },
    mode: "onChange",
  })

  // Rifresko skemën e validimit kur ndryshohet gjuha
  useEffect(() => {
    form.clearErrors()
    // Rifresko validimin për të gjitha fushat
    Object.keys(form.formState.errors).forEach(field => {
      form.trigger(field)
    })
  }, [t, form])

  // Trajtuesi i suksesit të Google Sign-In
  const handleGoogleSuccess = ({ token, user }) => {
    navigate(from, { replace: true })
  }

  // Nëse ridrejtohet nga /api/auth/verify?token=...&verified=1|0
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const v = params.get("verified")
    if (v === "1") {
      mobileToast({
        variant: "success",
        title: t("login.verified.title", "Email verified ✅"),
        description: t("login.verified.desc", "You can sign in now."),
        duration: 5000,
      })
    } else if (v === "0") {
      mobileToast({
        variant: "error",
        title: t("login.verifyFail.title", "Verification failed"),
        description: t("login.verifyFail.desc", "Link invalid or expired. You can resend a new link below."),
        duration: 6000,
      })
      setShowResend(true)
    }
    if (v) {
      const url = new URL(window.location.href)
      url.searchParams.delete("verified")
      window.history.replaceState({}, "", url.pathname + url.search)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const statusKey = (status) => {
    switch (status) {
      case 400:
        return "required"
      case 401:
        return "invalidPassword"
      case 404:
        return "notFound"
      case 500:
        return "server"
      default:
        return "default"
    }
  }

  const onSubmit = async (data) => {
    const email = normalizeEmail(data.email)

    // Basic email validation (accepts any valid email)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      mobileToast({
        variant: "error",
        title: t("login.error.title", "Login failed"),
        description: t("formValidation.email.invalid", "Please enter a valid email address."),
        duration: 6000,
      })
      return
    }

    const payload = { email, password: data.password, remember: data.remember }
    const result = await dispatch(loginUser(payload))

    if (loginUser.fulfilled.match(result)) {
      if (data.remember) localStorage.setItem("remember_me", "1")
      else localStorage.removeItem("remember_me")

      mobileToast({
        title: t("login.success.title", "Welcome back 👋"),
        description: t("login.success.description", "You're signed in."),
        variant: "success",
        duration: 5000,
      })
      navigate(from, { replace: true })
    } else {
      const { status, message } = result.payload || {}
      const key = statusKey(status)
      if (status === 403) setShowResend(true)

      mobileToast({
        title: t("login.error.title", "Login failed"),
        description: t(`login.error.${key}`, { defaultValue: message }),
        variant: "error",
        duration: 6000,
      })
    }
  }

  // Ridërgo verifikimin
  const handleResend = async () => {
    const email = normalizeEmail(form.getValues("email"))
    if (!email) {
      mobileToast({
        variant: "error",
        title: t("login.resend.needEmail.title", "Email required"),
        description: t("login.resend.needEmail.desc", "Enter your email address first."),
        duration: 6000,
      })
      return
    }
    // Basic email validation (accepts any valid email)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      mobileToast({
        variant: "error",
        title: t("login.error.title", "Login failed"),
        description: t("formValidation.email.invalid", "Please enter a valid email address."),
        duration: 6000,
      })
      return
    }
    try {
      setResendLoading(true)
      await api.post("/auth/resend-verification", { email })
      mobileToast({
        variant: "success",
        title: t("login.resend.sent.title", "Verification link sent"),
        description: t("login.resend.sent.desc", "Check your inbox or spam folder."),
        duration: 5000,
      })
      setShowResend(false)
    } catch (e) {
      mobileToast({
        variant: "error",
        title: t("login.resend.fail.title", "Could not resend"),
        description: e?.response?.data?.message || e?.message || t("login.resend.fail.desc", "Please try again later."),
        duration: 6000,
      })
    } finally {
      setResendLoading(false)
    }
  }


  return (
    <div className="w-full">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full space-y-4 sm:space-y-6 bg-card p-4 sm:p-6 md:p-8 rounded-xl shadow-md text-foreground"
          aria-busy={isLoading || undefined}
        >
          <div className="text-center space-y-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-300">
              {t("login.title")}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {t("login.subtitle")}
            </p>
          </div>

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("login.email")}</FormLabel>
                <FormControl>
                  <input
                    type="email"
                    {...field}
                    onBlur={(e) => form.setValue("email", normalizeEmail(e.target.value), { shouldValidate: true, shouldDirty: true })}
                    disabled={isLoading}
                    autoComplete="email"
                    className={cn(
                      "mt-1 block w-full rounded-md border px-3 py-2 sm:py-3 bg-background text-sm sm:text-base transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1",
                      form.formState.errors.email 
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500" 
                        : "border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                    )}
                    placeholder="you@example.com"
                    aria-invalid={!!form.formState.errors.email || undefined}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("login.password")}</FormLabel>
                <FormControl>
                  <input
                    type="password"
                    {...field}
                    disabled={isLoading}
                    autoComplete="current-password"
                    className={cn(
                      "mt-1 block w-full rounded-md border px-3 py-2 sm:py-3 bg-background text-sm sm:text-base transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1",
                      form.formState.errors.password 
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500" 
                        : "border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                    )}
                    placeholder="**********"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="remember"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      id="remember"
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      disabled={isLoading}
                      className="h-4 w-4 rounded border"
                    />
                    <span className="text-xs sm:text-sm">
                      {t("login.rememberMe", "Remember me")}
                    </span>
                  </label>

                  <Link
                    to="/forgot-password"
                    className="text-xs sm:text-sm text-blue-600 dark:text-blue-300 hover:underline"
                  >
                    {t("login.forgotPassword")}
                  </Link>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isLoading} className="w-full font-semibold py-2 sm:py-3 rounded-md text-sm sm:text-base">
            {isLoading ? t("login.loading", "Logging in...") : t("login.submit", "Login")}
          </Button>

          {showResend && (
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">
                {t("login.resend.prompt", "Didn't get the verification email?")}
              </p>
              <Button type="button" size="sm" variant="outline" onClick={handleResend} disabled={resendLoading}>
                {resendLoading ? t("login.resend.sending", "Sending…") : t("login.resend.cta", "Resend")}
              </Button>
            </div>
          )}

          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">{t("login.or", "or")}</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="flex justify-center">
            <GoogleSignInButton
              onSuccess={handleGoogleSuccess}
              className="w-full max-w-xs"
              disabled={isLoading}
            >
              {t("login.google.button", "Sign in with Google")}
            </GoogleSignInButton>
          </div>
        </form>
      </Form>
    </div>
  )
}

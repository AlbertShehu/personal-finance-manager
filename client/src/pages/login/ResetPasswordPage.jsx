// src/pages/ResetPasswordPage.jsx
import React, { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslation } from "react-i18next"
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom"
import { Eye, EyeOff, CheckCircle2, CircleAlert } from "lucide-react"
import api from "@/lib/axios"
import { Input } from "@/components/ui/input"
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

export default function ResetPasswordPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { token: tokenParam } = useParams()
  const [searchParams] = useSearchParams()

  // token nga :token ose ?token=
  const token = tokenParam || searchParams.get("token") || ""

  // 🗣️ lexo gjuhën nga URL (?lng=de|en|sq) dhe aplikoje
  const lng =
    searchParams.get("lng") ||
    searchParams.get("lang") ||
    searchParams.get("locale")

  useEffect(() => {
    if (lng && i18n.language !== lng) {
      i18n.changeLanguage(lng)
    }
  }, [lng, i18n])

  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const schema = z
    .object({
      password: z
        .string()
        .min(8, { message: t("reset.validation.password.min") })
        .regex(/\d/, { message: t("reset.validation.password.number") })
        .regex(/[^\w\s]/, { message: t("reset.validation.password.symbol") }),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("reset.validation.match"),
      path: ["confirmPassword"],
    })

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
    mode: "onChange",
  })

  const pwd = form.watch("password") ?? ""
  const confirm = form.watch("confirmPassword") ?? ""
  const reqs = {
    len: pwd.length >= 8,
    num: /\d/.test(pwd),
    sym: /[^\w\s]/.test(pwd),
  }
  const mismatch = pwd && confirm && pwd !== confirm

  async function onSubmit(values) {
    if (!token) {
      toast({
        variant: "destructive",
        title: t("reset.error.title", "Error"),
        description: t("reset.missingToken"),
        duration: 6000,
      })
      return
    }

    setLoading(true)
    try {
      await api.post("/auth/reset-password", { token, password: values.password })
      toast ({
        title: t("reset.success.title", "Password Reset Successful"),
        description: t("reset.success.description", "Your password has been reset successfully."),
        variant: "success",
        duration: 6000,
      })
      form.reset()
      navigate("/login", { replace: true })
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        t("reset.error")
      toast({
        title: t("reset.error.title", "Error"),
        description: message,
        variant: "destructive",
        duration: 6000,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background text-foreground">
      <div className="w-full max-w-md">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 bg-card p-6 md:p-8 rounded-xl border shadow-sm"
            noValidate
          >
            <div className="text-center space-y-1">
              <h1 className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-300">
                {t("reset.title")}
              </h1>
              <p className="text-sm text-muted-foreground">{t("reset.subtitle")}</p>
            </div>

            {/* Password */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("reset.password")}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPwd ? "text" : "password"}
                        {...field}
                        autoComplete="new-password"
                        placeholder={t("reset.passwordPlaceholder")}
                        aria-invalid={!!form.formState.errors.password || undefined}
                        className="bg-background pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd((v) => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded hover:bg-muted"
                        aria-label={showPwd ? t("register.hidePassword") : t("register.showPassword")}
                      >
                        {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>

                  {/* Kërkesat e fjalëkalimit */}
                  <ul className="mt-2 space-y-1 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className={`h-4 w-4 ${reqs.len ? "text-emerald-600" : "text-muted-foreground"}`} />
                      <span>{t("reset.passwordReq.min")}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className={`h-4 w-4 ${reqs.num ? "text-emerald-600" : "text-muted-foreground"}`} />
                      <span>{t("reset.passwordReq.number")}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className={`h-4 w-4 ${reqs.sym ? "text-emerald-600" : "text-muted-foreground"}`} />
                      <span>{t("reset.passwordReq.symbol")}</span>
                    </li>
                  </ul>

                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Confirm Password */}
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("reset.confirmPassword")}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirm ? "text" : "password"}
                        {...field}
                        autoComplete="new-password"
                        placeholder={t("reset.confirmPlaceholder")}
                        aria-invalid={!!form.formState.errors.confirmPassword || mismatch || undefined}
                        className="bg-background pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded hover:bg-muted"
                        aria-label={showConfirm ? t("register.hidePassword") : t("register.showPassword")}
                      >
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>

                  {mismatch && !form.formState.errors.confirmPassword && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <CircleAlert className="h-4 w-4" />
                      {t("reset.validation.match")}
                    </p>
                  )}

                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={loading} className="w-full font-semibold">
              {loading ? t("reset.loading") : t("reset.submit")}
            </Button>

            <div className="text-center">
              <Link to="/login" className="text-sm text-blue-600 dark:text-blue-300 hover:underline">
                {t("reset.backToLogin")}
              </Link>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}

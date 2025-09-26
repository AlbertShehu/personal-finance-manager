// src/components/settings/ChangePasswordForm.jsx
import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { Eye, EyeOff, Lock, CheckCircle2, CircleAlert } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

import api from "@/lib/axios"
import { passwordSchema } from "@/lib/validations/passwordSchema"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"

export default function ChangePasswordForm() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { toast } = useToast()

  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  const form = useForm({
    resolver: zodResolver(passwordSchema(t)),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
    mode: "onChange",
    criteriaMode: "all",
  })

  // ✅ reaktive dhe super të sigurta
  const [newPwd, confirmPwd] = useWatch({
    control: form.control,
    name: ["newPassword", "confirmNewPassword"],
  })

  const mismatch = !!newPwd && !!confirmPwd && newPwd !== confirmPwd

  const reqs = {
    len: (newPwd || "").length >= 8,
    num: /\d/.test(newPwd || ""),
    sym: /[^\w\s]/.test(newPwd || ""),
  }

  const onSubmit = async (data) => {
    // ✅ Guard shtesë – s’lejon submit nëse ka mismatch
    if (data.newPassword !== data.confirmNewPassword) {
      toast({
        title: t("register.validation.password.match", "Passwords do not match"),
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      await api.patch("/users/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })

      toast({
        title: t("password.success.title", "Password Changed Successfully"),
        description: t("password.success.description", "Your password has been updated."),
        variant: "success",
        duration: 4000,
      })

      form.reset()
      navigate("/profile")
    } catch (err) {
      toast({
        title: t("password.error.title", "Error Changing Password"),
        description: err?.response?.data?.message || t("password.error.default"),
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  // kontroll i qartë për “submit”
  const canSubmit = form.formState.isValid && !mismatch && !loading

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 rounded-xl border bg-card p-6 shadow-sm"
        noValidate
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lock className="h-4 w-4" />
          <span>{t("settings.password.title")}</span>
        </div>

        {/* Current password */}
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("password.form.currentPasswordLabel")}</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showOld ? "text" : "password"}
                    autoComplete="current-password"
                    {...field}
                    className="pr-10"
                    aria-invalid={!!form.formState.errors.currentPassword || undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowOld(v => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-2 hover:bg-muted"
                    aria-label={showOld ? t("register.hidePassword") : t("register.showPassword")}
                  >
                    {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* New password */}
        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("password.form.newPasswordLabel")}</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showNew ? "text" : "password"}
                    autoComplete="new-password"
                    {...field}
                    className="pr-10"
                    aria-invalid={!!form.formState.errors.newPassword || undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(v => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-2 hover:bg-muted"
                    aria-label={showNew ? t("register.hidePassword") : t("register.showPassword")}
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormControl>

              <ul className="mt-2 space-y-1 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className={`h-4 w-4 ${reqs.len ? "text-emerald-600" : "text-muted-foreground"}`} />
                  <span>{t("register.passwordReq.min", "At least 8 characters")}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className={`h-4 w-4 ${reqs.num ? "text-emerald-600" : "text-muted-foreground"}`} />
                  <span>{t("register.passwordReq.number", "At least one number")}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className={`h-4 w-4 ${reqs.sym ? "text-emerald-600" : "text-muted-foreground"}`} />
                  <span>{t("register.passwordReq.symbol", "At least one symbol")}</span>
                </li>
              </ul>

              <FormMessage />
            </FormItem>
          )}
        />

        {/* Confirm new password */}
        <FormField
          control={form.control}
          name="confirmNewPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("password.form.confirmNewPasswordLabel")}</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    {...field}
                    className="pr-10"
                    aria-invalid={!!form.formState.errors.confirmNewPassword || mismatch || undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-2 hover:bg-muted"
                    aria-label={showConfirm ? t("register.hidePassword") : t("register.showPassword")}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormControl>

              {mismatch && !form.formState.errors.confirmNewPassword && (
                <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                  <CircleAlert className="h-4 w-4" />
                  {t("register.validation.password.match", "Passwords do not match")}
                </p>
              )}

              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={!canSubmit}
          className="w-full font-semibold py-2 rounded-md"
        >
          {loading ? t("password.form.saving", "Saving…") : t("password.form.submit", "Change Password")}
        </Button>
      </form>
    </Form>
  )
}

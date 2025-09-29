// src/pages/ForgotPasswordPage.jsx
import React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
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

export default function ForgotPasswordPage() {
  const { t } = useTranslation()
  const { toast } = useToast()

  React.useEffect(() => {
    document.title = `${t("forgot.title", "Forgot password")} · FinMan`
  }, [t])

  const schema = z.object({
    email: z
      .string()
      .trim()
      .email({ message: "" }), // Mos shfaq mesazh për email validation - frontend e trajton
  })

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
    mode: "onChange",
  })

  async function onSubmit(values) {
    try {
      const email = values.email.trim().toLowerCase();
      
      // Validimi bazë i email-it (çdo email provider)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast({
          title: t("forgot.error.title", "Error"),
          description: t("forgot.validation.emailRules.invalid", "Please enter a valid email address."),
          variant: "destructive",
          duration: 6000,
        });
        return;
      }

      // NOTE: api ka baseURL me /api → endpoint relativ
      await api.post("/auth/forgot-password", { email })
      toast({
        title: t("forgot.success.title", "Check your email"),
        description: t("forgot.success.description", "We sent you a link to reset your password."),
        variant: "success",
        duration: 6000,
      })
      form.reset()
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        t("forgot.error")
      toast ({ 
        title: t("forgot.error.title", "Error"),
        description: msg,
        variant: "destructive",
        duration: 6000,
      })
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
                {t("forgot.title")}
              </h1>
              <p className="text-sm text-muted-foreground">{t("forgot.subtitle")}</p>
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("register.email", "Email")}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      {...field}
                      placeholder={t("register.emailPlaceholder", "you@example.com")}
                      autoComplete="email"
                      aria-invalid={!!form.formState.errors.email || undefined}
                      className="bg-background"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full font-semibold"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting
                ? t("forgot.sending", "Sending…")
                : t("forgot.submit")}
            </Button>

            <div className="text-center">
              <Link
                to="/login"
                className="text-sm text-blue-600 dark:text-blue-300 hover:underline"
              >
                {t("reset.backToLogin", "Back to login")}
              </Link>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}

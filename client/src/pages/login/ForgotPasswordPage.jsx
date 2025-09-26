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
      
      // Validimi i avancuar i email-it në frontend
      if (!/@(gmail|googlemail)\.com$/i.test(email)) {
        toast({
          title: t("forgot.error.title", "Error"),
          description: t("forgot.validation.emailRules.gmailOnly", "Only Gmail addresses are allowed."),
          variant: "destructive",
          duration: 6000,
        });
        return;
      }

      // Validimi i formës së Gmail
      const localPart = email.split('@')[0];
      if (localPart.length < 6 || localPart.length > 30) {
        toast({
          title: t("forgot.error.title", "Error"),
          description: t("forgot.validation.emailRules.length", "Gmail local part must be 6-30 characters."),
          variant: "destructive",
          duration: 6000,
        });
        return;
      }

      // Kontrollo karakteret e lejuara
      const gmailLocalPartRegex = /^[a-zA-Z0-9._%+-]+$/;
      if (!gmailLocalPartRegex.test(localPart)) {
        toast({
          title: t("forgot.error.title", "Error"),
          description: t("forgot.validation.emailRules.characters", "Email contains invalid characters for Gmail."),
          variant: "destructive",
          duration: 6000,
        });
        return;
      }

      // Kontrollo pikat
      if (localPart.endsWith('.') || localPart.startsWith('.')) {
        toast({
          title: t("forgot.error.title", "Error"),
          description: t("forgot.validation.emailRules.dots", "Gmail doesn't allow dots at the beginning or end."),
          variant: "destructive",
          duration: 6000,
        });
        return;
      }

      if (localPart.includes('..')) {
        toast({
          title: t("forgot.error.title", "Error"),
          description: t("forgot.validation.emailRules.consecutiveDots", "Gmail doesn't allow consecutive dots."),
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

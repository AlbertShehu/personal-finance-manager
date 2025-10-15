// src/pages/ForgotPasswordPage.jsx
import React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslation } from "react-i18next"
import i18n from "@/lib/i18"
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
    const title = typeof t === 'function' ? t("forgot.title", "Forgot password") : "Forgot password";
    document.title = `${title} · FinMan`
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
        // Fallback për rastin kur t nuk funksionon
        const title = typeof t === 'function' ? t("forgot.error.title", "Error") : "Error";
        const description = typeof t === 'function' ? t("forgot.validation.emailRules.invalid", "Please enter a valid email address.") : "Please enter a valid email address.";
        
        toast({
          title: title,
          description: description,
          variant: "destructive",
          duration: 6000,
        });
        return;
      }

      // NOTE: api ka baseURL me /api → endpoint relativ
      await api.post("/auth/forgot-password", { email, language: i18n.language })
      
      // Fallback për rastin kur t nuk funksionon
      const successTitle = typeof t === 'function' ? t("forgot.success.title", "Check your email") : "Check your email";
      const successDescription = typeof t === 'function' ? t("forgot.success.description", "We sent you a link to reset your password.") : "We sent you a link to reset your password.";
      
      toast({
        title: successTitle,
        description: successDescription,
        variant: "success",
        duration: 6000,
      })
      form.reset()
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        (typeof t === 'function' ? t("forgot.error") : "An error occurred")
      
      // Fallback për rastin kur t nuk funksionon
      const errorTitle = typeof t === 'function' ? t("forgot.error.title", "Error") : "Error";
      
      toast ({ 
        title: errorTitle,
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
                {typeof t === 'function' ? t("forgot.title") : "Forgot Password"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {typeof t === 'function' ? t("forgot.subtitle") : "Enter your email and we will send you reset instructions."}
              </p>
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{typeof t === 'function' ? t("register.email", "Email") : "Email"}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      {...field}
                      placeholder={typeof t === 'function' ? t("register.emailPlaceholder", "you@example.com") : "you@example.com"}
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
                ? (typeof t === 'function' ? t("forgot.sending", "Sending…") : "Sending…")
                : (typeof t === 'function' ? t("forgot.submit") : "Send Link")}
            </Button>

            <div className="text-center">
              <Link
                to="/login"
                className="text-sm text-blue-600 dark:text-blue-300 hover:underline"
              >
                {typeof t === 'function' ? t("reset.backToLogin", "Back to login") : "Back to login"}
              </Link>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}

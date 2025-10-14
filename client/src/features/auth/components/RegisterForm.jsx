/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/rules-of-hooks */
// src/components/shared/auth/RegisterForm.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "@/lib/validations/registerSchema";
import { useTranslation } from "react-i18next";
import i18n from "@/lib/i18";
import { CheckCircle2, CircleAlert, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import GoogleSignInButton from "@/components/ui/google-signin-button";
import api from "@/lib/axios";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const normalizeEmail = (email = "") => email.trim().toLowerCase();

export default function RegisterForm() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Debug: kontrollo nëse t funksionon
  console.log("🔍 RegisterForm - t function:", typeof t);
  console.log("🔍 RegisterForm - t('test'):", t('test'));
  console.log("🔍 RegisterForm - i18n ready:", i18n.isInitialized);
  console.log("🔍 RegisterForm - i18n language:", i18n.language);

  const form = useForm({
    resolver: zodResolver(registerSchema(t)),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onChange",
  });

  // Rifresko skemën e validimit kur ndryshohet gjuha
  useEffect(() => {
    form.clearErrors()
    // Rifresko validimin për të gjitha fushat
    Object.keys(form.formState.errors).forEach(field => {
      form.trigger(field)
    })
  }, [t, form]);

  // Trajtuesi i suksesit të Google Sign-In
  const handleGoogleSuccess = ({ token, user }) => {
    navigate("/", { replace: true });
  };

  const pwd = form.watch("password") ?? "";
  const confirm = form.watch("confirmPassword") ?? "";
  const emailVal = normalizeEmail(form.watch("email") ?? "");
  // Email validation removed - now accepts any valid email

  const reqs = {
    len: (pwd?.length || 0) >= 8,
    num: /\d/.test(pwd || ""),
    sym: /[^\w\s]/.test(pwd || ""),
  };
  const mismatch = pwd && confirm && pwd !== confirm;

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = {
        name: data.name?.trim(),
        email: normalizeEmail(data.email),
        password: data.password,
        language: i18n.language, // Shtojmë gjuhën aktuale
      };

      // Validimi bazë i email-it (lejo çdo email valid)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(payload.email)) {
        // Fallback për rastin kur t nuk funksionon
        const title = typeof t === 'function' ? t("register.error.title", "Registration Failed") : "Registration Failed";
        const description = typeof t === 'function' ? t("formValidation.email.invalid", "Please enter a valid email address.") : "Please enter a valid email address.";
        
        toast({
          variant: "destructive",
          title: title,
          description: description,
          duration: 6000,
        });
        console.log("🔍 Email validation error - translation:", description);
        return;
      }

      const res = await api.post("/auth/register", payload);

      const result = res?.data || {};
      if (result.user) localStorage.setItem("user", JSON.stringify(result.user));
      localStorage.setItem("registerSuccess", "true");

      toast({
        title: t("register.success.title"),
        description:
          t(
            "register.success.descriptionVerify",
            "Registration completed. Check your email for the verification link."
          ) || "Registration completed. Check your email for the verification link.",
        variant: "success",
        duration: 6000,
      });

      form.reset();
      navigate("/login", { replace: true });
    } catch (err) {
      const status = err?.response?.status;
      const mapped =
        status === 400
          ? err?.response?.data?.message ||
            t("register.error.required", "All fields are required.")
          : status === 409
          ? t("register.error.duplicateEmail", "This email is already registered.")
          : err?.response?.data?.message ||
            err?.response?.data?.error ||
            err?.message ||
            t("register.error.default");

      toast({
        variant: "destructive",
        title: t("register.error.title", "Registration Failed"),
        description: mapped,
        duration: 6000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 sm:space-y-6 bg-card p-4 sm:p-6 md:p-8 rounded-xl shadow-md text-foreground"
        noValidate
      >
        <div className="text-center space-y-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-300">
            {t("register.title")}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {t("register.subtitle")}
          </p>
        </div>

        {/* Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("register.name")}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t("register.namePlaceholder")}
                  autoComplete="name"
                  aria-invalid={!!form.formState.errors.name || undefined}
                  className={cn(
                    "bg-background text-sm sm:text-base transition-colors",
                    form.formState.errors.name 
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500" 
                      : "border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                  )}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Email */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("register.email")}</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  {...field}
                  placeholder={t("register.emailPlaceholder")}
                  autoComplete="email"
                  aria-invalid={!!form.formState.errors.email || undefined}
                  className={cn(
                    "bg-background text-sm sm:text-base transition-colors",
                    form.formState.errors.email
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500" 
                      : "border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                  )}
                  onBlur={(e) => {
                    const v = normalizeEmail(e.target.value);
                    form.setValue("email", v, { shouldValidate: true, shouldDirty: true });
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Password */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("register.password")}</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  {...field}
                  placeholder="********"
                  autoComplete="new-password"
                  aria-invalid={!!form.formState.errors.password || undefined}
                  className={cn(
                    "bg-background text-sm sm:text-base transition-colors",
                    form.formState.errors.password 
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500" 
                      : "border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                  )}
                />
              </FormControl>
              {/* Password requirements hint */}
              <ul className="mt-2 space-y-1 text-xs sm:text-sm">
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

        {/* Confirm Password */}
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("register.confirmPassword")}</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  {...field}
                  placeholder="********"
                  autoComplete="new-password"
                  aria-invalid={
                    !!form.formState.errors.confirmPassword || mismatch || undefined
                  }
                  className={cn(
                    "bg-background text-sm sm:text-base transition-colors",
                    form.formState.errors.confirmPassword || mismatch
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500" 
                      : "border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                  )}
                />
              </FormControl>

              {mismatch && !form.formState.errors.confirmPassword && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1 leading-relaxed">
                  <CircleAlert className="h-3 w-3 sm:h-4 sm:w-4" />
                  {t("register.validation.password.match", "Passwords do not match")}
                </p>
              )}

              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={
            loading ||
            !form.formState.isValid ||
            (pwd && confirm && pwd !== confirm) ||
            false // Email validation removed - now accepts any valid email
          }
          className="w-full font-semibold py-2 sm:py-3 rounded-md text-sm sm:text-base"
        >
          {loading ? t("register.loading") : t("register.submit")}
        </Button>

        {/* Divider + Google */}
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">{t("register.or", "or")}</span>
          <div className="h-px flex-1 bg-border" />
        </div>
        <div className="flex justify-center">
          <GoogleSignInButton
            onSuccess={handleGoogleSuccess}
            className="w-full max-w-xs"
            disabled={loading}
          >
            {t("register.google.button", "Sign in with Google")}
          </GoogleSignInButton>
        </div>
      </form>
    </Form>
  );
}

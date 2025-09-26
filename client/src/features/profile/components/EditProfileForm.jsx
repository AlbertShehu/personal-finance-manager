import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/axios";
import { editProfileSchema } from "@/lib/validations/editProfileSchema";
import { restoreSession } from "@/store/authSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

export default function EditProfileForm() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const authState = useSelector((s) => s.auth);
  const user = authState?.user;
  const token = authState?.token;

  const form = useForm({
    resolver: zodResolver(editProfileSchema(t)),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
    },
    mode: "onChange",
  });

  const onSubmit = async (values) => {
    try {
      // përshtate me backend-in tënd: "/users/me" ose "/users/profile"
      const res = await api.patch("/users/update-profile", values);
      const updatedUser = res?.data?.user || { ...user, ...values };

      // persist & redux
      localStorage.setItem("user", JSON.stringify(updatedUser));
      dispatch(restoreSession({ user: updatedUser, token }));

      toast({
        title: t("profile.success.title"),
        description: t("profile.success.description"),
        variant: "success",
        duration: 5000,
      });
      form.reset();
      navigate("/profile");
    } catch (err) {
      toast({
        title: t("profile.error.title"),
        description: err?.response?.data?.message || t("profile.error.default"),
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const isDirty = form.formState.isDirty;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 rounded-xl border bg-card p-6 shadow-sm max-w-md"
        noValidate
      >
        {/* Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("profile.form.nameLabel")}</FormLabel>
              <FormControl>
                <Input {...field} placeholder={t("register.namePlaceholder")} />
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
              <FormLabel>{t("profile.form.emailLabel")}</FormLabel>
              <FormControl>
                <Input type="email" {...field} placeholder="you@example.com" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={form.formState.isSubmitting || !isDirty}
          className="w-full"
        >
          {form.formState.isSubmitting
            ? t("profile.form.saving")
            : t("profile.form.submit")}
        </Button>
      </form>
    </Form>
  );
}

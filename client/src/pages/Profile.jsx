/* eslint-disable no-empty */
// src/pages/Profile.jsx
import React from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

import {
  Copy,
  Mail,
  ShieldCheck,
  Globe,
  User2,
  CheckCircle2,
  XCircle,
  Moon,
  Sun,
  MonitorSmartphone,
  HardDriveDownload,
} from "lucide-react";

// ----------------------------- Ndihmës -----------------------------
function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

function mapLanguageToLocale(lang = "en") {
  const l = String(lang).toLowerCase();
  if (l.startsWith("de")) return "de-DE";
  if (l.startsWith("sq")) return "sq-AL";
  return "en-US";
}

function formatMemberSince(dateInput, locale) {
  const d = dateInput ? new Date(dateInput) : null;
  if (!d || Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(d);
}

function ThemeBadge({ value }) {
  if (value === "system") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs">
        <MonitorSmartphone className="h-3.5 w-3.5" /> System
      </span>
    );
  }
  if (value === "dark") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs">
        <Moon className="h-3.5 w-3.5" /> Dark
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs">
      <Sun className="h-3.5 w-3.5" /> Light
    </span>
  );
}

// Seanca lokale shumë e thjeshtë (pa backend)
const SESS_KEY = "finman_sessions";
function readSessions() {
  try {
    const raw = localStorage.getItem(SESS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function writeSessions(list) {
  try {
    localStorage.setItem(SESS_KEY, JSON.stringify(list));
  } catch {}
}
function upsertThisSession() {
  const list = readSessions();
  const ua = navigator.userAgent || "";
  const device = /Mobile|Android|iPhone/i.test(ua)
    ? "Mobile"
    : /iPad|Tablet/i.test(ua)
    ? "Tablet"
    : "Desktop";
  const browser = /Chrome/i.test(ua)
    ? "Chrome"
    : /Firefox/i.test(ua)
    ? "Firefox"
    : /Safari/i.test(ua)
    ? "Safari"
    : /Edg/i.test(ua)
    ? "Edge"
    : "Browser";
  const key = "this-device";
  const now = new Date().toISOString();

  const idx = list.findIndex((s) => s.key === key);
  if (idx >= 0) {
    list[idx] = { ...list[idx], lastSeenAt: now };
  } else {
    list.unshift({ key, device, browser, createdAt: now, lastSeenAt: now });
  }
  // mbaj max 5
  writeSessions(list.slice(0, 5));
  return readSessions();
}

// ------------------------------ Page -------------------------------

export default function Profile() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const authState = useSelector((state) => state.auth);
  const user = authState?.user;

  // theme e lexuar pas-mount (shmang mismatch)
  const [themePref, setThemePref] = React.useState("system");
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved === "light" || saved === "dark" || saved === "system") {
        setThemePref(saved);
      } else {
        const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
        setThemePref(prefersDark ? "dark" : "light");
      }
      // reagon në ndryshimin e sistemit
      const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
      const onChange = () => {
        if (localStorage.getItem("theme") === "system") {
          setThemePref(mq.matches ? "dark" : "light");
        }
      };
      mq?.addEventListener?.("change", onChange);
      // reagon në ndryshimin e localStorage (nga një tab tjetër)
      const onStorage = (e) => {
        if (e.key === "theme") {
          const v = e.newValue;
          setThemePref(v || "system");
        }
      };
      window.addEventListener("storage", onStorage);
      return () => {
        mq?.removeEventListener?.("change", onChange);
        window.removeEventListener("storage", onStorage);
      };
    } catch {}
  }, []);

  // sessions të reaktive
  const [sessions, setSessions] = React.useState([]);
  React.useEffect(() => {
    try {
      const updated = upsertThisSession();
      setSessions(updated);
      const onStorage = (e) => {
        if (e.key === SESS_KEY) setSessions(readSessions());
      };
      const onVisibility = () => {
        if (document.visibilityState === "visible") {
          const u = upsertThisSession();
          setSessions(u);
        }
      };
      window.addEventListener("storage", onStorage);
      document.addEventListener("visibilitychange", onVisibility);
      return () => {
        window.removeEventListener("storage", onStorage);
        document.removeEventListener("visibilitychange", onVisibility);
      };
    } catch {}
  }, []);

  if (!user) {
    return (
      <main className="min-h-[60vh] grid place-items-center bg-transparent">
        <p className="text-lg text-muted-foreground">{t("profile.noData")}</p>
      </main>
    );
  }

  const locale = mapLanguageToLocale(i18n.language);
  const memberSince = formatMemberSince(user.createdAt, locale);
  const emailVerified = Boolean(user.emailVerified); // nëse backend e dërgon këtë fushë

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(user.email || "");
      toast({
        title: t("profile.copy.success.title", "Copied"),
        description: t("profile.copy.success.desc", "Email copied to clipboard"),
        duration: 2500,
      });
    } catch {
      toast({
        title: t("profile.copy.error.title", "Copy failed"),
        description: t("profile.copy.error.desc", "Could not copy email"),
        variant: "destructive",
      });
    }
  };

  const onExport = () => {
    try {
      const data = {
        exportedAt: new Date().toISOString(),
        user: {
          id: user.id ?? null,
          name: user.name ?? "",
          email: user.email ?? "",
          createdAt: user.createdAt ?? null,
          emailVerified,
        },
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "finman-profile.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast({
        title: t("profile.export.success.title", "Profile exported"),
        description: t("profile.export.success.desc", "Your profile JSON has been downloaded"),
        duration: 2500,
      });
    } catch {
      toast({
        title: t("profile.export.error.title", "Export failed"),
        description: t("profile.export.error.desc", "Could not export your profile"),
        variant: "destructive",
      });
    }
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
      {/* Banner */}
      <section
        aria-label="Profile header"
        className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950"
      >
        {/* dekor i lehtë */}
        <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-blue-200/30 blur-2xl dark:bg-blue-500/10" />
        <div className="pointer-events-none absolute -bottom-14 -left-14 h-44 w-44 rounded-full bg-indigo-200/30 blur-2xl dark:bg-indigo-500/10" />

        <div className="relative flex flex-col gap-6 p-6 sm:p-8">
          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 sm:h-20 sm:w-20 ring-2 ring-white dark:ring-slate-800 shadow">
                <AvatarFallback className="text-xl">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="flex items-center gap-2 text-2xl sm:text-3xl font-bold tracking-tight">
                  <User2 className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                  <span className="break-words">{user.name}</span>
                </h1>

                {/* Email + verified badge */}
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-2 break-words">
                    <Mail className="h-4 w-4" />
                    {user.email}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    className="rounded px-1 py-0.5 text-xs hover:bg-muted"
                    aria-label={t("profile.copy.aria", "Copy email")}
                    title={t("profile.copy.title", "Copy email")}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>

                  {emailVerified ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {t("profile.email.verified", "Verified")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                      <XCircle className="h-3.5 w-3.5" />
                      {t("profile.email.notVerified", "Not verified")}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Export */}
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onExport} className="inline-flex items-center gap-2">
                <HardDriveDownload className="h-4 w-4" />
                {t("profile.export.button", "Export JSON")}
              </Button>
            </div>
          </div>

          {/* Info & Preferences */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("profile.registered")}
              </p>
              <p className="mt-1 font-medium">{memberSince}</p>
            </div>

            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                <Globe className="h-3.5 w-3.5" />
                {t("profile.language", "Language")}
              </p>
              <p className="mt-1 font-medium uppercase">
                {(i18n.language || "en").slice(0, 2)}
              </p>
              <div className="mt-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  {t("profile.theme", "Theme")}
                </p>
                <ThemeBadge value={themePref} />
              </div>
            </div>

            <div className="rounded-xl border bg-card p-4 sm:col-span-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                {t("profile.security", "Security")}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-md border px-2 py-1 text-xs">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  2FA <span className="text-muted-foreground">· {t("profile.soon", "Soon")}</span>
                </span>
                <span className="inline-flex items-center gap-2 rounded-md border px-2 py-1 text-xs">
                  {emailVerified ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      {t("profile.email.verified", "Email verified")}
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3.5 w-3.5 text-amber-600" />
                      {t("profile.email.notVerified", "Email not verified")}
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Sessions */}
          <div className="rounded-2xl border bg-card">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-sm font-medium">
                {t("profile.sessions.title", "Recent Sessions")}
              </h3>
              <span className="text-xs text-muted-foreground">
                {sessions.length
                  ? t("profile.sessions.count", "{{count}} device(s)", { count: sessions.length })
                  : "—"}
              </span>
            </div>

            {sessions.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">
                {t("profile.sessions.empty", "No session data yet.")}
              </div>
            ) : (
              <ul className="divide-y">
                {sessions.map((s) => (
                  <li key={s.key} className="flex items-center justify-between p-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {s.device} · {s.browser}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("profile.sessions.lastSeen", "Last seen")}:{" "}
                        {formatMemberSince(s.lastSeenAt, locale)}
                      </p>
                    </div>
                    <span className="text-xs rounded border px-2 py-0.5">
                      {s.key === "this-device"
                        ? t("profile.sessions.thisDevice", "This device")
                        : t("profile.sessions.device", "Device")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Footer mini-note */}
      <p className="mt-4 text-xs text-muted-foreground">
        {t("profile.copy.tip", "Tip: you can copy your email by clicking the")}{" "}
        <Copy className="inline h-3 w-3 align-text-top" />{" "}
        {t("profile.copy.tip.end", "icon.")}
      </p>
    </main>
  );
}

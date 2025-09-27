/* eslint-disable no-unused-vars */
// src/pages/LandingPage.jsx
import * as React from 'react'
import { Link } from 'react-router-dom'
import { Rocket, LogIn, ShieldCheck, BarChart3, Zap, Users, Star, Globe, Activity } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import landingImage from '../assets/finance.png'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { motion, useReducedMotion, animate } from 'framer-motion'

export default function LandingPage() {
  const { t } = useTranslation()
  const prefersReducedMotion = useReducedMotion()

  const headingVariants = prefersReducedMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.2 } } }
    : {
        hidden: { opacity: 0, y: 24, scale: 0.98, filter: 'blur(4px)' },
        visible: {
          opacity: 1, y: 0, scale: 1, filter: 'blur(0px)',
          transition: { duration: 0.7, ease: 'easeOut', type: 'spring', stiffness: 220, damping: 24, delay: 0.1 },
        },
      }

  const cardVariants = prefersReducedMotion
    ? { hidden: { opacity: 0 }, visible: (i) => ({ opacity: 1, transition: { delay: 0.05 * i } }) }
    : {
        hidden: { opacity: 0, y: 16 },
        visible: (i) => ({ opacity: 1, y: 0, transition: { delay: 0.08 * i, type: 'spring', stiffness: 220, damping: 24 } }),
      }

  React.useEffect(() => {
    document.title = `${t('landing.metaTitle', 'FinMan – Smart Personal Finance Manager')}`
  }, [t])

  const features = [
    {
      icon: ShieldCheck,
      title: t('features.security.title', 'Secure by default'),
      desc: t('features.security.desc', 'Your data is encrypted and protected with strict access controls.'),
    },
    {
      icon: BarChart3,
      title: t('features.insights.title', 'Actionable insights'),
      desc: t('features.insights.desc', 'Understand spending patterns with clear charts and category breakdowns.'),
    },
    {
      icon: Zap,
      title: t('features.fast.title', 'Fast & delightful'),
      desc: t('features.fast.desc', 'Snappy UI, keyboard-friendly, and optimized for all devices.'),
    },
  ]

  const stats = [
    { icon: Users, label: t('stats.users', 'Users'), value: 1280, suffix: '+' },
    { icon: Activity, label: t('stats.transactions', 'Transactions tracked'), value: 52340, suffix: '+' },
    { icon: Star, label: t('stats.rating', 'Avg rating'), value: 4.8, decimals: 1, suffix: '/5' },
    { icon: Globe, label: t('stats.countries', 'Countries'), value: 18 },
  ]

  return (
    <main className="relative min-h-screen bg-background text-foreground">
      <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 rounded-md bg-primary text-primary-foreground px-3 py-2">
        {t('common.skipToContent', 'Skip to content')}
      </a>

      <header className="absolute top-4 right-4 md:top-8 md:right-8 z-50">
        <LanguageSwitcher />
      </header>

      {/* Hero */}
      <section id="content" className="px-6 mx-auto max-w-7xl pt-24">
        <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-12 lg:gap-20">
          {/* Text */}
          <div className="flex-1 text-center md:text-left">
            <span className="inline-block bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 text-xs md:text-sm px-3 py-1 rounded-full mb-4">
              🔐 {t('landing.tagline')}
            </span>

            <motion.h1
              className="text-4xl md:text-6xl font-extrabold mb-4 pb-2 leading-tight font-sans bg-gradient-to-r from-blue-900 to-blue-500 bg-clip-text text-transparent dark:from-blue-300 dark:to-blue-100"
              variants={headingVariants}
              initial="hidden"
              animate="visible"
            >
              {t('landing.title')}
            </motion.h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl md:max-w-md mx-auto md:mx-0">
              {t('landing.subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row sm:justify-center md:justify-start gap-3">
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition text-base md:text-lg font-medium w-full sm:w-auto"
              >
                <LogIn size={20} />
                {t('landing.login')}
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 border border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 dark:hover:text-white px-6 py-3 rounded-md transition text-base md:text-lg font-medium w-full sm:w-auto"
              >
                <Rocket size={20} />
                {t('landing.register')}
              </Link>
            </div>
          </div>

          {/* Image */}
          <figure className="flex-1 w-full max-w-sm sm:max-w-md mx-auto">
            <div className="rounded-xl shadow-lg overflow-hidden bg-card border">
              <img
                src={landingImage}
                alt={t('landing.imageAlt')}
                loading="eager"
                decoding="async"
                fetchpriority="high"
                className="w-full h-auto object-contain aspect-[4/3]"
              />
            </div>
          </figure>
        </div>
      </section>

      {/* Features */}
<section
  aria-label={t('features.aria', 'Key features')}
  className="px-6 mx-auto max-w-7xl py-12 md:py-16"
>
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {features.map((f, i) => {
      const Icon = f.icon
      return (
        <motion.article
          key={f.title}
          custom={i + 1}
          variants={cardVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="rounded-2xl border bg-card p-5 md:p-6 shadow-sm"
        >
          <div className="flex items-start gap-4">
            <div className="rounded-xl border p-2">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{f.desc}</p>
            </div>
          </div>
        </motion.article>
      )
    })}
  </div>
</section>


      {/* Stats strip */}
      <StatsStrip stats={stats} prefersReducedMotion={prefersReducedMotion} />
    </main>
  )
}

/* ---------------- Stats strip (with animated numbers) ---------------- */

function StatsStrip({ stats, prefersReducedMotion }) {
  const { t } = useTranslation()
  return (
    <section
      aria-label={t('stats.aria', 'Product stats')}
      className="px-6 mx-auto max-w-7xl pb-12 md:pb-16"
    >
      <div className="rounded-2xl border bg-card/60 backdrop-blur-sm p-5 md:p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6">
          {stats.map((s) => (
            <div key={s.label} className="flex items-center gap-3 md:gap-4">
              <div className="rounded-xl border p-2">
                <s.icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <div className="text-xl md:text-2xl font-semibold leading-none">
                  <AnimatedNumber
                    value={s.value}
                    decimals={s.decimals ?? 0}
                    duration={prefersReducedMotion ? 0.1 : 1.2}
                  />
                  {s.suffix ? <span className="ml-0.5">{s.suffix}</span> : null}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground mt-1">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function AnimatedNumber({ value, duration = 1, decimals = 0 }) {
  const [display, setDisplay] = React.useState(0)

  React.useEffect(() => {
    const controls = animate(0, value, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(v),
    })
    return () => controls.stop()
  }, [value, duration])

  const n = decimals ? Number(display.toFixed(decimals)) : Math.round(display)
  const formatted = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(n)

  return <span>{formatted}</span>
}

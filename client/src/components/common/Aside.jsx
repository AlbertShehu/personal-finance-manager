/* eslint-disable no-unused-vars */
// src/components/common/Aside.jsx
import * as React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import Logo from '@/assets/finance-logo.png'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { motion, useReducedMotion } from 'framer-motion'

const Aside = () => {
  const { t } = useTranslation()
  const prefersReducedMotion = useReducedMotion()

  const welcomeVariants = prefersReducedMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.2 } } }
    : {
        hidden: { opacity: 0, y: -16 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.6, ease: 'easeOut', type: 'spring', stiffness: 160, damping: 20 },
        },
      }

  return (
    <aside
      role="complementary"
      aria-label={t('aside.aria', 'Onboarding sidebar')}
      className="relative hidden md:flex w-full md:w-1/2 bg-blue-200 dark:bg-blue-950 flex-col justify-between p-6 md:p-10 text-blue-900 dark:text-blue-100 transition-colors duration-300"
    >
      {/* 🌍 Language */}
      <div className="absolute top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>

      {/* 🔹 Logo */}
      <img
        src={Logo}
        alt={t('aside.logoAlt', 'FinMan logo')}
        loading="lazy"
        decoding="async"
        className="w-36 md:w-48 mb-8 md:mb-12 select-none object-contain"
        draggable={false}
      />

      {/* 🔸 Welcome */}
      <section className="space-y-4 text-center md:text-left flex-1 flex flex-col justify-center">
        <motion.h2
          className="text-2xl md:text-3xl font-bold"
          variants={welcomeVariants}
          initial="hidden"
          animate="visible"
        >
          {t('aside.welcome')}
        </motion.h2>

        <p className="text-sm md:text-base text-blue-700 dark:text-blue-300 leading-relaxed">
          {t('aside.description')}
        </p>

        {/* 🔙 Back to home */}
        <div className="mt-4">
          <Button
            asChild
            variant="outline"
            className="text-blue-900 border-blue-900 dark:text-white dark:border-white hover:bg-blue-100 dark:hover:bg-blue-800 hover:text-blue-700 dark:hover:text-white transition"
          >
            <Link to="/" aria-label={t('aside.backToHomeAria', 'Back to home')}>
              {t('aside.backToHome')}
            </Link>
          </Button>
        </div>
      </section>

      {/* 📆 Footer */}
      <footer className="text-xs text-blue-600 dark:text-blue-400 mt-8 text-center md:text-left">
        &copy; {new Date().getFullYear()} Albert Shehu. {t('aside.rights')}
      </footer>
    </aside>
  )
}

export default Aside

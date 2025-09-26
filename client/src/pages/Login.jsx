import { Link } from "react-router-dom"
import Aside from "@/components/common/Aside"
import LoginForm from "@/features/auth/components/LoginForm"
import { Button } from "@/components/ui/button"
import { useTranslation } from "react-i18next"

const Login = () => {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen md:flex bg-white dark:bg-gray-900 transition-colors duration-300">
      {/* Ana e majtë: branding */}
      <Aside />

      {/* Ana e djathtë: login form */}
      <div className="relative md:w-1/2 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
        {/* Buton për regjistrim */}
        <div className="absolute top-4 right-4 md:top-6 md:right-6">
          <Button
            asChild
            type="button"
            className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-white border border-blue-700 hover:bg-blue-600 hover:text-white transition px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm md:text-base"
          >
            <Link to="/register">{t("auth.register")}</Link>
          </Button>
        </div>

        {/* Forma */}
        <div className="w-full max-w-sm sm:max-w-md">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}

export default Login

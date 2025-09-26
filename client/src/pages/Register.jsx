import { Link } from "react-router-dom"
import RegisterForm from "@/features/auth/components/RegisterForm"
import Aside from "@/components/common/Aside"
import { Button } from "@/components/ui/button"
import { useTranslation } from "react-i18next"

const Register = () => {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen md:flex bg-background text-foreground transition-colors duration-300">
      {/* Ana e majtë: branding */}
      <Aside />

      {/* Ana e djathtë: forma e regjistrimit */}
      <div className="relative md:w-1/2 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
        {/* Buton për t'u futur në llogari ekzistuese */}
        <div className="absolute top-4 right-4 md:top-6 md:right-6">
          <Button
            asChild
            type="button"
            className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-white border border-blue-700 hover:bg-blue-600 hover:text-white transition px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm md:text-base"
          >
            <Link to="/login">{t("auth.login")}</Link>
          </Button>
        </div>

        {/* Forma e regjistrimit */}
        <div className="w-full max-w-sm sm:max-w-md">
          <RegisterForm />
        </div>
      </div>
    </div>
  )
}

export default Register

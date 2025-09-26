import ChangePasswordForm from "@/features/profile/components/ChangePasswordForm";
import { useTranslation } from "react-i18next";

const PasswordSettings = () => {
  const { t } = useTranslation();

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">
        {t("settings.password.title")}
      </h1>
      <ChangePasswordForm />
    </div>
  );
};

export default PasswordSettings;

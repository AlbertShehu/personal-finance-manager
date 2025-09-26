// src/pages/settings/ProfileSettings.jsx
import EditProfileForm from "@/features/profile/components/EditProfileForm";
import { useTranslation } from "react-i18next";

const ProfileSettings = () => {
  const { t } = useTranslation();

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">
        {t("settings.profile.title")}
      </h1>
      <EditProfileForm />
    </div>
  );
};

export default ProfileSettings;

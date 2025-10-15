import { useEffect, useRef } from "react";
import { toast } from "sonner";
import api from "@/lib/axios"; // Përdor axios për të siguruar që baseURL me /api është i saktë

export default function GoogleSignInButton() {
  const btnRef = useRef(null);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || !window.google) {
      console.error("Google Client ID ose Google Identity Services nuk u ngarkuan.");
      return;
    }

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response) => {
        try {
          if (!response?.credential) {
            toast.error("Google Sign-In failed: Missing credential");
            return;
          }
          const { data } = await api.post("/auth/google", {
            idToken: response.credential,
          });
          // ruaj tokenin/user sipas logjikës tënde…
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          window.location.href = "/";
        } catch (err) {
          console.error("Google login failed:", err);
          toast.error(err.response?.data?.message || "Google login failed");
        }
      },
      ux_mode: "popup",
      auto_select: false,
    });

    window.google.accounts.id.renderButton(btnRef.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: "signin_with",
      shape: "pill",
    });
  }, []);

  return <div ref={btnRef} />;
}
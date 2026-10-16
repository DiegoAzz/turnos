"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, CheckCircle2, ArrowRight } from "lucide-react";

declare global {
  interface Window {
    google?: any;
  }
}

interface GoogleAuthButtonProps {
  endpoint: "/api/auth/google/business" | "/api/auth/google/partner";
  text?: string;
  className?: string;
  postulationType?: "AMBASSADOR" | "FRANCHISE";
  franchiseName?: string;
  franchiseCityCountry?: string;
  phone?: string;
  onSuccess?: (data: any) => void;
}

export default function GoogleAuthButton({
  endpoint,
  text = "Continuar con Google",
  className = "",
  postulationType,
  franchiseName,
  franchiseCityCountry,
  phone,
  onSuccess,
}: GoogleAuthButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFallbackModal, setShowFallbackModal] = useState(false);
  const [fallbackEmail, setFallbackEmail] = useState("");
  const [fallbackName, setFallbackName] = useState("");

  const [activeClientId, setActiveClientId] = useState<string>(
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""
  );
  const tokenClientRef = useState<any>(null);

  // Cargar Client ID desde settings si no está en process.env
  useEffect(() => {
    if (!activeClientId) {
      fetch("/api/platform/settings")
        .then((res) => res.json())
        .then((data) => {
          if (data?.googleClientId) {
            setActiveClientId(data.googleClientId);
          }
        })
        .catch(() => {});
    }
  }, [activeClientId]);

  // Cargar e inicializar el SDK oficial de Google Identity Services
  useEffect(() => {
    if (!activeClientId || typeof window === "undefined") return;

    const scriptId = "google-jssdk";
    const initGsi = () => {
      if (window.google?.accounts?.oauth2) {
        try {
          const client = window.google.accounts.oauth2.initTokenClient({
            client_id: activeClientId,
            scope: "email profile openid",
            callback: async (response: any) => {
              if (response.error) {
                setError(response.error_description || response.error || "Inicio con Google cancelado.");
                return;
              }
              if (response.access_token) {
                await sendAuthPayload({ accessToken: response.access_token });
              }
            },
          });
          tokenClientRef[1](client);
        } catch (e) {
          console.warn("Error al inicializar OAuth2 TokenClient:", e);
        }
      }

      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: activeClientId,
            callback: handleGoogleResponse,
            auto_select: false,
          });
        } catch (e) {
          console.warn("Error al inicializar GSI ID Client:", e);
        }
      }
    };

    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initGsi;
      document.body.appendChild(script);
    } else if (window.google?.accounts) {
      initGsi();
    }
  }, [activeClientId]);

  const handleGoogleResponse = async (response: any) => {
    if (!response?.credential) return;
    await sendAuthPayload({ credential: response.credential });
  };

  const sendAuthPayload = async (payload: any) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          postulationType,
          franchiseName,
          franchiseCityCountry,
          phone,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo autenticar con Google.");
      }

      if (onSuccess) {
        onSuccess(data);
      } else if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    } catch (err: any) {
      setError(err.message || "Error al conectar con Google.");
    } finally {
      setLoading(false);
    }
  };

  const handleButtonClick = () => {
    const tokenClient = tokenClientRef[0];
    if (tokenClient) {
      // Abre la ventana emergente oficial de selección de cuentas Google
      tokenClient.requestAccessToken({ prompt: "select_account" });
    } else if (activeClientId && window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      // Si aún no se ha ingresado el Client ID en el panel Super Admin
      setShowFallbackModal(true);
    }
  };

  const handleFallbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fallbackEmail) return;
    setShowFallbackModal(false);
    await sendAuthPayload({
      email: fallbackEmail,
      name: fallbackName || fallbackEmail.split("@")[0],
    });
  };

  return (
    <>
      <div className="w-full">
        {error && (
          <div className="mb-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-700">
            {error}
          </div>
        )}

        <button
          type="button"
          disabled={loading}
          onClick={handleButtonClick}
          className={`w-full flex items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50 hover:border-gray-400 transition cursor-pointer disabled:opacity-50 ${className}`}
        >
          {loading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>{loading ? "Conectando con Google..." : text}</span>
        </button>
      </div>

      {/* MODAL DE ENTRADA CON GOOGLE (Activo cuando aún no se ha colocado el Client ID de Google Console) */}
      {showFallbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl relative border border-gray-200">
            <button
              type="button"
              onClick={() => setShowFallbackModal(false)}
              className="absolute right-4 top-4 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-center space-y-1 mb-5">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 border border-blue-100">
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </div>
              <h3 className="text-base font-bold text-gray-900 pt-2">
                Acceso con cuenta Google / Gmail
              </h3>
              <p className="text-xs text-gray-500">
                Ingresa tu cuenta de Google para sincronizar tu perfil de inmediato:
              </p>
            </div>

            <form onSubmit={handleFallbackSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Tu Correo Gmail *
                </label>
                <input
                  type="email"
                  required
                  autoFocus
                  placeholder="ejemplo@gmail.com"
                  value={fallbackEmail}
                  onChange={(e) => setFallbackEmail(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Tu Nombre Completo (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Tu Nombre"
                  value={fallbackName}
                  onChange={(e) => setFallbackName(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 text-xs shadow-md transition flex items-center justify-center gap-1.5"
              >
                <span>Acceder con esta cuenta Google</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

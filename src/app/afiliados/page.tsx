"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DollarSign,
  TrendingUp,
  Users,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  MessageCircle,
  Clock,
  Zap,
  Crown,
  Building2,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GoogleAuthButton from "@/components/GoogleAuthButton";

export default function AfiliadosPage() {
  const router = useRouter();

  // Calculadora interactiva
  const [numClients, setNumClients] = useState(25);
  const [commissionRate, setCommissionRate] = useState(0.20); // Porcentaje personalizable (ej. 20%)
  const planPriceCOP = 60000; // ~60.000 COP al mes por negocio
  const monthlyEarningsCOP = Math.round(numClients * planPriceCOP * commissionRate);
  const yearlyEarningsCOP = monthlyEarningsCOP * 12;

  // Tipo de postulación: Embajador (gratis, comisión) o Franquicia (dueño, territorio)
  const [postulationType, setPostulationType] = useState<"AMBASSADOR" | "FRANCHISE">("AMBASSADOR");
  const [franchiseName, setFranchiseName] = useState("");
  const [franchiseCityCountry, setFranchiseCityCountry] = useState("");

  // Estado formulario registro
  const [name, setName] = useState("");
  const [countryCode, setCountryCode] = useState("+57");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [experience, setExperience] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("NEQUI");
  const [payoutAccount, setPayoutAccount] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState<any | null>(null);

  // Estado login
  const [loginMode, setLoginMode] = useState(false);
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const formatCOP = (val: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(val);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const isFranchiseQuery = searchParams.get("tipo") === "franquicia" || window.location.hash.includes("franquicia");
      if (isFranchiseQuery) {
        setPostulationType("FRANCHISE");
      }

      if (window.location.hash) {
        const hash = window.location.hash.substring(1).split("?")[0];
        const target = document.getElementById(hash);
        if (target) {
          setTimeout(() => {
            target.scrollIntoView({ behavior: "smooth" });
          }, 150);
        }
      }
    }
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const cleanDigits = phone.replace(/[^0-9]/g, "");
      const cleanCode = countryCode.replace(/[^0-9]/g, "");
      const fullPhone = cleanDigits.startsWith(cleanCode)
        ? `+${cleanDigits}`
        : `${countryCode} ${phone.trim()}`;

      const res = await fetch("/api/partners/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone: fullPhone,
          email,
          experience,
          payoutMethod,
          payoutAccount: payoutAccount || fullPhone,
          customCode,
          postulationType,
          franchiseName,
          franchiseCityCountry,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo completar el registro.");

      if (data.pendingApproval) {
        setRegistrationSuccess(data);
      } else {
        router.push("/afiliados/portal");
      }
    } catch (err: any) {
      setError(err.message || "Error al registrarse.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    try {
      const res = await fetch("/api/partners/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: loginIdentifier }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se encontró el embajador.");

      router.push("/afiliados/portal");
    } catch (err: any) {
      setLoginError(err.message || "Error al iniciar sesión.");
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white text-gray-900">
      <Navbar />

      <main className="flex-1">
        {/* HERO EMBABAJADORES */}
        <section className="relative overflow-hidden bg-gradient-to-b from-emerald-950 via-gray-900 to-gray-950 text-white py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-400">
                <Sparkles className="h-4 w-4" />
                Programa de Embajadores & Comisiones Vitalicias
              </div>

              <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl leading-tight">
                Construye tu propio <br />
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 bg-clip-text text-transparent">
                  Sueldo Recurrente Mensual
                </span>
              </h1>

              <p className="mt-6 text-lg sm:text-xl text-gray-300 leading-relaxed">
                Recomienda <strong>TurnoYa</strong> a barberías, estéticas y consultorios. 
                Gana una <strong>comisión recurrente mes a mes</strong> mientras tu cliente siga usando la app. 
                Si tu cliente paga durante 5 años, ¡tú ganas comisiones esos 5 años!
              </p>
            </div>

            {/* CALCULADORA INTERACTIVA DE INGRESOS PASIVOS */}
            <div id="calculadora" className="mt-16 mx-auto max-w-2xl rounded-3xl bg-white/5 border border-white/10 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-4 mb-6 gap-3">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-400" />
                    Simulador de Ingresos Pasivos
                  </h3>
                  <p className="text-xs text-gray-400">
                    Desliza para ver cuánto ganarías de comisión recurrente cada mes
                  </p>
                </div>
                <div className="flex items-center gap-1.5 self-start sm:self-auto">
                  <span className="text-xs text-gray-400 mr-1">Comisión:</span>
                  {[15, 20, 25, 30, 40].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setCommissionRate(pct / 100)}
                      className={`px-2 py-1 text-xs font-bold rounded-lg transition ${
                        Math.round(commissionRate * 100) === pct
                          ? "bg-emerald-500 text-slate-950 shadow-sm"
                          : "bg-white/10 text-gray-300 hover:text-white"
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-gray-300">
                      Negocios activos que conseguiste:
                    </span>
                    <span className="text-2xl font-black text-emerald-400">
                      {numClients} negocios
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    step="1"
                    value={numClients}
                    onChange={(e) => setNumClients(parseInt(e.target.value))}
                    className="w-full h-3 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between text-[11px] text-gray-400 mt-1">
                    <span>1 negocio</span>
                    <span>25</span>
                    <span>50</span>
                    <span>75</span>
                    <span>100 negocios</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/20 p-5 text-center">
                  <div>
                    <span className="text-xs text-emerald-300/80 uppercase font-semibold">
                      Tu Ganancia Mensual
                    </span>
                    <p className="text-2xl sm:text-3xl font-black text-white mt-1">
                      {formatCOP(monthlyEarningsCOP)}
                    </p>
                    <span className="text-[11px] text-gray-400">todos los meses fijo</span>
                  </div>
                  <div>
                    <span className="text-xs text-emerald-300/80 uppercase font-semibold">
                      Proyección Anual
                    </span>
                    <p className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
                      {formatCOP(yearlyEarningsCOP)}
                    </p>
                    <span className="text-[11px] text-gray-400">ingreso pasivo total</span>
                  </div>
                </div>

                <p className="text-xs text-center text-gray-400">
                  💡 <em>Calculado sobre la suscripción Plan PRO ($60.000 COP/mes). Retiros directos a tu Nequi o cuenta bancaria.</em>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CÓMO FUNCIONA EL MODELO REVOLUCIONARIO */}
        <section id="como-funciona-afiliados" className="py-20 bg-gray-50 border-y border-gray-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                La Regla del Ingreso Pasivo
              </h2>
              <p className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
                ¿Por qué este sistema supera a cualquier venta tradicional?
              </p>
            </div>

            <div className="mt-14 grid gap-8 sm:grid-cols-3">
              <div className="rounded-2xl bg-white p-7 border border-gray-200 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 font-bold text-xl">
                  1
                </div>
                <h3 className="mt-5 text-lg font-bold text-gray-900">
                  Consigues el negocio una sola vez
                </h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                  Le muestras a una barbería o spa lo fácil que es recibir citas 24/7 y enviar recordatorios por WhatsApp. Se registran con tu enlace.
                </p>
              </div>

              <div className="rounded-2xl bg-white p-7 border border-gray-200 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 font-bold text-xl">
                  2
                </div>
                <h3 className="mt-5 text-lg font-bold text-gray-900">
                  Cobras mes tras mes de por vida
                </h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                  A diferencia de una comisión de una sola vez, aquí ganas tu comisión recurrente cada mes automáticamente. Si el cliente dura 3 años, cobras los 36 meses.
                </p>
              </div>

              <div className="rounded-2xl bg-white p-7 border border-gray-200 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 font-bold text-xl">
                  3
                </div>
                <h3 className="mt-5 text-lg font-bold text-gray-900">
                  Tu incentivo es que no cancelen
                </h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                  Como ganas mes a mes, apoyas al negocio, le ayudas a sacarle provecho a la app y tu cartera de clientes se convierte en un sueldo que nunca deja de crecer.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FORMULARIO DE REGISTRO / ACCESO DE EMBAJADOR */}
        <section id="registro" className="py-20 bg-white">
          <div className="mx-auto max-w-xl px-4 sm:px-6">
            <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-xl">
              {/* TABS REGISTRO / LOGIN */}
              <div className="flex rounded-xl bg-gray-100 p-1 mb-8">
                <button
                  type="button"
                  onClick={() => setLoginMode(false)}
                  className={`flex-1 rounded-lg py-2.5 text-xs font-bold transition ${
                    !loginMode
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Quiero ser Embajador (Nuevo)
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMode(true)}
                  className={`flex-1 rounded-lg py-2.5 text-xs font-bold transition ${
                    loginMode
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Ya soy Embajador (Ingresar)
                </button>
              </div>

              {!loginMode ? (
                <div>
                  {registrationSuccess ? (
                    registrationSuccess.isFranchise ? (
                      <div className="rounded-2xl bg-gradient-to-b from-amber-50 to-orange-50 border border-amber-300 p-6 text-center space-y-4">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-600 text-white shadow-lg shadow-amber-600/30">
                          <Crown className="h-8 w-8" />
                        </div>
                        <h3 className="text-xl font-extrabold text-gray-900">
                          👑 ¡Postulación a Franquicia Enviada!
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-700 leading-relaxed max-w-md mx-auto">
                          Gracias <strong>{registrationSuccess.partner?.name}</strong>. Hemos registrado tu postulación para liderar la franquicia{" "}
                          <strong>{registrationSuccess.partner?.franchiseName || "Oficial"}</strong> en{" "}
                          <strong>{registrationSuccess.partner?.franchiseCityCountry || "tu territorio"}</strong>.
                        </p>
                        <div className="rounded-xl bg-white border border-amber-200 p-4 text-xs text-left text-gray-800 space-y-2 shadow-xs">
                          <p>
                            <strong>Código de Franquicia asignado:</strong>{" "}
                            <span className="font-mono font-bold text-amber-700">
                              {registrationSuccess.partner?.referralCode}
                            </span>
                          </p>
                          <p>
                            <strong>WhatsApp de contacto:</strong>{" "}
                            <span className="font-medium">{registrationSuccess.partner?.phone}</span>
                          </p>
                          <p className="flex items-center gap-1.5">
                            <strong>Estado de Franquicia:</strong>{" "}
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                              🟡 En Revisión & Asignación de Territorio
                            </span>
                          </p>
                        </div>
                        <p className="text-xs text-gray-600">
                          El Super Admin te contactará por WhatsApp para validar tu territorio, coordinar el pago de la inscripción de apertura ($99 USD / $400.000 COP) y habilitar tu plataforma oficial.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setRegistrationSuccess(null);
                            setLoginMode(true);
                          }}
                          className="inline-block mt-2 text-xs font-bold text-amber-800 hover:text-amber-900 underline"
                        >
                          ¿Ya fue activada tu franquicia? Iniciar Sesión aquí →
                        </button>
                      </div>
                    ) : (
                      <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-6 text-center space-y-4">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/30">
                          <CheckCircle2 className="h-8 w-8" />
                        </div>
                        <h3 className="text-xl font-extrabold text-gray-900">
                          ¡Postulación Enviada con Éxito!
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-md mx-auto">
                          Gracias <strong>{registrationSuccess.partner?.name}</strong>. Tu perfil comercial ha sido enviado al administrador para validación y activación manual.
                        </p>
                        <div className="rounded-xl bg-white border border-emerald-100 p-4 text-xs text-left text-gray-700 space-y-2 shadow-xs">
                          <p>
                            <strong>Código solicitado:</strong>{" "}
                            <span className="font-mono font-bold text-emerald-700">
                              {registrationSuccess.partner?.referralCode}
                            </span>
                          </p>
                          <p>
                            <strong>WhatsApp de contacto:</strong>{" "}
                            <span className="font-medium">{registrationSuccess.partner?.phone}</span>
                          </p>
                          <p className="flex items-center gap-1.5">
                            <strong>Estado de la cuenta:</strong>{" "}
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                              🟡 Pendiente de Aprobación
                            </span>
                          </p>
                        </div>
                        <p className="text-xs text-gray-500">
                          Te contactaremos por WhatsApp para validar tu información y habilitar tu acceso al portal de comisiones.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setRegistrationSuccess(null);
                            setLoginMode(true);
                          }}
                          className="inline-block mt-2 text-xs font-bold text-emerald-700 hover:text-emerald-800 underline"
                        >
                          ¿Ya te validaron? Iniciar Sesión aquí →
                        </button>
                      </div>
                    )
                  ) : (
                    <>
                      {/* SELECTOR DE MODALIDAD: EMBAJADOR vs FRANQUICIA */}
                      <div className="mb-6 p-1.5 rounded-2xl bg-gray-100 border border-gray-200">
                        <span className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider px-2 pt-1 pb-1.5">
                          Selecciona tu tipo de postulación:
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setPostulationType("AMBASSADOR")}
                            className={`rounded-xl p-3 text-left transition flex flex-col gap-1 ${
                              postulationType === "AMBASSADOR"
                                ? "bg-white text-gray-900 shadow-sm border-2 border-emerald-500"
                                : "text-gray-600 hover:text-gray-900 bg-transparent"
                            }`}
                          >
                            <span className="text-xs font-bold flex items-center gap-1.5">
                              <span>🤝 Embajador</span>
                            </span>
                            <span className="text-[10px] text-gray-500">
                              Sin costo inicial • Ganas comisiones mes a mes
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setPostulationType("FRANCHISE")}
                            className={`rounded-xl p-3 text-left transition flex flex-col gap-1 ${
                              postulationType === "FRANCHISE"
                                ? "bg-gradient-to-r from-amber-50 to-orange-50 text-amber-950 shadow-sm border-2 border-amber-500"
                                : "text-gray-600 hover:text-gray-900 bg-transparent"
                            }`}
                          >
                            <span className="text-xs font-bold flex items-center gap-1.5 text-amber-900">
                              <Crown className="h-3.5 w-3.5 text-amber-600" />
                              <span>👑 Dueño Franquicia</span>
                            </span>
                            <span className="text-[10px] text-amber-800 font-medium">
                              Marca Propia • Cobras el 100% a tus negocios
                            </span>
                          </button>
                        </div>
                      </div>

                      {postulationType === "FRANCHISE" ? (
                        <div className="rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-500/40 p-4 mb-5 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-amber-900 font-extrabold text-xs">
                            <Crown className="h-4 w-4 text-amber-600" />
                            <span>Postulación a Dueño de Franquicia (Marca Propia)</span>
                          </div>
                          <p className="text-[11px] text-amber-900 leading-relaxed">
                            Como franquiciado, eres el <strong>propietario comercial en tu ciudad o país</strong>: cobras el 100% de las suscripciones directamente en tus cuentas (Nequi, Bancolombia, etc.). Solo pagas una <strong>inscripción de apertura ($99 USD / $400.000 COP)</strong> y un canon mensual de tecnología ($29 USD / $100.000 COP/mes) por servidores y soporte continuo.
                          </p>
                        </div>
                      ) : (
                        <div className="mb-4">
                          <h3 className="text-xl font-bold text-gray-900">
                            Postúlate como Embajador
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            Envía tu información para validar tu perfil comercial y asignarte tu código oficial.
                          </p>
                        </div>
                      )}

                      {error && (
                        <div className="mb-4 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                          {error}
                        </div>
                      )}

                      {/* BOTÓN REGISTRO CON GOOGLE / GMAIL */}
                      <div className="mb-6 space-y-3">
                        <GoogleAuthButton
                          endpoint="/api/auth/google/partner"
                          text={
                            postulationType === "FRANCHISE"
                              ? "Postularme con Google / Gmail (Franquicia)"
                              : "Registrarme con Google / Gmail"
                          }
                          postulationType={postulationType}
                          franchiseName={franchiseName}
                          franchiseCityCountry={franchiseCityCountry}
                          onSuccess={(data) => {
                            if (data.isExisting && data.status === "ACTIVE") {
                              window.location.href = "/afiliados/portal";
                            } else {
                              setRegistrationSuccess(data);
                            }
                          }}
                        />

                        <div className="relative flex items-center justify-center">
                          <div className="border-t border-gray-200 w-full" />
                          <span className="bg-white px-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                            o con formulario manual
                          </span>
                        </div>
                      </div>

                      <form onSubmit={handleRegister} className="space-y-4">
                        {/* CAMPOS EXCLUSIVOS DE FRANQUICIA */}
                        {postulationType === "FRANCHISE" && (
                          <div className="space-y-3 rounded-2xl bg-amber-50/60 border border-amber-200 p-4 mb-2">
                            <div>
                              <label className="block text-xs font-bold text-amber-900 mb-1">
                                👑 Nombre de tu Franquicia o Marca Deseada *
                              </label>
                              <input
                                type="text"
                                required={postulationType === "FRANCHISE"}
                                placeholder="Ej. TurnoYa Medellín, BarberPro Cali, MiAgenda Bogotá"
                                value={franchiseName}
                                onChange={(e) => setFranchiseName(e.target.value)}
                                className="w-full rounded-xl border border-amber-300 bg-white px-3.5 py-2.5 text-sm font-bold text-gray-900 focus:border-amber-500 focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-amber-900 mb-1">
                                📍 Ciudad y País de Operación (Territorio Solicitado) *
                              </label>
                              <input
                                type="text"
                                required={postulationType === "FRANCHISE"}
                                placeholder="Ej. Medellín, Colombia / Santiago, Chile / CDMX, México"
                                value={franchiseCityCountry}
                                onChange={(e) => setFranchiseCityCountry(e.target.value)}
                                className="w-full rounded-xl border border-amber-300 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-900 focus:border-amber-500 focus:outline-none"
                              />
                              <p className="mt-1 text-[11px] text-amber-800">
                                Validamos exclusividad geográfica para asegurar que no haya otra franquicia activa en tu misma zona.
                              </p>
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Tu Nombre Completo *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Ej. Carlos Mendoza"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Tu WhatsApp (para validar tu cuenta y coordinar pagos) *
                          </label>
                          <div className="flex rounded-xl border border-gray-300 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 overflow-hidden bg-white">
                            <select
                              value={countryCode}
                              onChange={(e) => setCountryCode(e.target.value)}
                              className="bg-gray-50 border-r border-gray-300 px-2.5 py-2.5 text-xs text-gray-700 font-bold focus:outline-none cursor-pointer"
                            >
                              <option value="+57">🇨🇴 +57 (Colombia)</option>
                              <option value="+52">🇲🇽 +52 (México)</option>
                              <option value="+1">🇺🇸 +1 (USA / Canadá)</option>
                              <option value="+34">🇪🇸 +34 (España)</option>
                              <option value="+54">🇦🇷 +54 (Argentina)</option>
                              <option value="+56">🇨🇱 +56 (Chile)</option>
                              <option value="+51">🇵🇪 +51 (Perú)</option>
                              <option value="+593">🇪🇨 +593 (Ecuador)</option>
                              <option value="+507">🇵🇦 +507 (Panamá)</option>
                              <option value="+58">🇻🇪 +58 (Venezuela)</option>
                              <option value="+506">🇨🇷 +506 (Costa Rica)</option>
                              <option value="+502">🇬🇹 +502 (Guatemala)</option>
                              <option value="+503">🇸🇻 +503 (El Salvador)</option>
                              <option value="+504">🇭🇳 +504 (Honduras)</option>
                              <option value="+591">🇧🇴 +591 (Bolivia)</option>
                              <option value="+598">🇺🇾 +598 (Uruguay)</option>
                              <option value="+595">🇵🇾 +595 (Paraguay)</option>
                              <option value="+1809">🇩🇴 +1 (Rep. Dominicana)</option>
                            </select>
                            <input
                              type="tel"
                              required
                              placeholder="Ej. 300 123 4567"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              className="w-full px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none font-medium"
                            />
                          </div>
                          <p className="mt-1 text-[11px] text-gray-400">
                            Selecciona tu país e ingresa tu número móvil para coordinar tus retiros por WhatsApp.
                          </p>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Tu Correo Electrónico *
                          </label>
                          <input
                            type="email"
                            required
                            placeholder="carlos@ejemplo.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                          />
                        </div>

                        {/* CAMPO DE OBSERVACIONES / PERFIL COMERCIAL (REQUERIDO) */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            {postulationType === "FRANCHISE"
                              ? "Tu Plan Comercial para tu Franquicia / Experiencia *"
                              : "Tu Perfil Comercial, Experiencia u Observaciones *"}
                          </label>
                          <textarea
                            required
                            rows={3}
                            placeholder={
                              postulationType === "FRANCHISE"
                                ? "Cuéntanos: ¿Por qué te interesa ser franquiciado en tu ciudad? ¿Qué plan comercial o contactos tienes con barberías, estéticas o consultorios para afiliar en tu territorio?"
                                : "Cuéntanos brevemente: ¿Qué experiencia tienes comercialmente? ¿En qué ciudad estás? ¿Qué barberías, spas o consultorios conoces para promover TurnoYa? (Obligatorio para que el administrador valide tu cuenta)"
                            }
                            value={experience}
                            onChange={(e) => setExperience(e.target.value)}
                            className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none leading-relaxed"
                          />
                          <p className="mt-1 text-[11px] text-gray-500">
                            🔒 Filtro de seriedad: El administrador revisa tu perfil antes de activar tu cuenta para evitar registros no calificados.
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Método de Pago Preferido
                            </label>
                            <select
                              value={payoutMethod}
                              onChange={(e) => setPayoutMethod(e.target.value)}
                              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none bg-white"
                            >
                              <option value="NEQUI">Nequi</option>
                              <option value="DAVIPLATA">Daviplata</option>
                              <option value="BANCOLOMBIA">Bancolombia</option>
                              <option value="PAYPAL">PayPal</option>
                              <option value="OTRO">Otro Banco</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Número de Cuenta / Celular
                            </label>
                            <input
                              type="text"
                              placeholder="Número para transferirte"
                              value={payoutAccount}
                              onChange={(e) => setPayoutAccount(e.target.value)}
                              className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Código de referido deseado (Opcional)
                          </label>
                          <input
                            type="text"
                            placeholder={
                              postulationType === "FRANCHISE"
                                ? "Ej. MEDELLIN-PRO (dejar vacío para auto-generar FQ-...)"
                                : "Ej. CARLOS-PRO (dejar vacío para auto-generar)"
                            }
                            value={customCode}
                            onChange={(e) => setCustomCode(e.target.value)}
                            className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none uppercase font-mono"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          style={{
                            backgroundColor: postulationType === "FRANCHISE" ? "#d97706" : "#059669",
                            color: "#ffffff",
                          }}
                          className="w-full mt-4 rounded-xl py-3 text-sm font-bold shadow-lg transition hover:opacity-90 disabled:opacity-50"
                        >
                          {loading
                            ? "Enviando postulación..."
                            : postulationType === "FRANCHISE"
                            ? "Postularme como Dueño de Franquicia →"
                            : "Enviar Postulación para Validación →"}
                        </button>
                      </form>
                    </>
                  )}
                </div>
              ) : (
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Ingresar a tu Portal de Embajador
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 mb-6">
                    Accede para ver tu saldo acumulado, tus clientes activos y solicitar retiros.
                  </p>

                  {loginError && (
                    <div className="mb-4 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                      {loginError}
                    </div>
                  )}

                  {/* BOTÓN INGRESO CON GOOGLE */}
                  <div className="mb-6 space-y-3">
                    <GoogleAuthButton
                      endpoint="/api/auth/google/partner"
                      text="Entrar a mi Portal con Google / Gmail"
                      onSuccess={(data) => {
                        if (data.isExisting && data.status === "ACTIVE") {
                          window.location.href = "/afiliados/portal";
                        } else {
                          setLoginError(data.message || "Tu cuenta vinculada a Gmail está en revisión.");
                        }
                      }}
                    />

                    <div className="relative flex items-center justify-center">
                      <div className="border-t border-gray-200 w-full" />
                      <span className="bg-white px-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                        o con tu código / WhatsApp
                      </span>
                    </div>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Tu Código de Referido, WhatsApp o Correo
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. CARLOS10 o tu número de WhatsApp"
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loginLoading}
                      style={{ backgroundColor: "#111827", color: "#ffffff" }}
                      className="w-full mt-4 rounded-xl py-3 text-sm font-bold shadow-md transition hover:bg-gray-800 disabled:opacity-50"
                    >
                      {loginLoading ? "Ingresando..." : "Entrar a mi Portal →"}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

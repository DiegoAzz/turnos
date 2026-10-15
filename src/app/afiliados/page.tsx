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
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function AfiliadosPage() {
  const router = useRouter();

  // Calculadora interactiva
  const [numClients, setNumClients] = useState(25);
  const [commissionRate, setCommissionRate] = useState(0.20); // Porcentaje personalizable (ej. 20%)
  const planPriceCOP = 60000; // ~60.000 COP al mes por negocio
  const monthlyEarningsCOP = Math.round(numClients * planPriceCOP * commissionRate);
  const yearlyEarningsCOP = monthlyEarningsCOP * 12;

  // Estado formulario registro
  const [name, setName] = useState("");
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
    if (typeof window !== "undefined" && window.location.hash) {
      const hash = window.location.hash.substring(1);
      const target = document.getElementById(hash);
      if (target) {
        setTimeout(() => {
          target.scrollIntoView({ behavior: "smooth" });
        }, 150);
      }
    }
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/partners/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          email,
          experience,
          payoutMethod,
          payoutAccount: payoutAccount || phone,
          customCode,
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
                  ) : (
                    <>
                      <h3 className="text-xl font-bold text-gray-900">
                        Postúlate como Embajador
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 mb-6">
                        Envía tu información para validar tu perfil comercial y asignarte tu código oficial.
                      </p>

                      {error && (
                        <div className="mb-4 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                          {error}
                        </div>
                      )}

                      <form onSubmit={handleRegister} className="space-y-4">
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
                          <input
                            type="tel"
                            required
                            placeholder="Ej. +57 300 123 4567"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                          />
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
                            Tu Perfil Comercial, Experiencia u Observaciones *
                          </label>
                          <textarea
                            required
                            rows={3}
                            placeholder="Cuéntanos brevemente: ¿Qué experiencia tienes comercialmente? ¿En qué ciudad estás? ¿Qué barberías, spas o consultorios conoces para promover TurnoYa? (Obligatorio para que el administrador valide tu cuenta)"
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
                            placeholder="Ej. CARLOS-PRO (dejar vacío para auto-generar)"
                            value={customCode}
                            onChange={(e) => setCustomCode(e.target.value)}
                            className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none uppercase font-mono"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          style={{ backgroundColor: "#059669", color: "#ffffff" }}
                          className="w-full mt-4 rounded-xl py-3 text-sm font-bold shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-500 disabled:opacity-50"
                        >
                          {loading ? "Enviando postulación..." : "Enviar Postulación para Validación →"}
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

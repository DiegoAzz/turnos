"use client";

import { useState } from "react";
import { Check, Zap, Sparkles, CreditCard, Smartphone, Wallet, Car } from "lucide-react";

export default function SubscriptionManager({ business }: { business: any }) {
  const [currentPlan, setCurrentPlan] = useState<string>(business.plan || "FREE");
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState(false);

  // Alternar plan en modo pruebas / demo
  const handleToggleMockPlan = async (newPlan: "FREE" | "INDEPENDIENTE" | "PRO") => {
    try {
      setLoading(true);
      const res = await fetch("/api/subscription/toggle-mock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business.id,
          plan: newPlan,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setCurrentPlan(newPlan);
        alert(`¡Plan actualizado a ${newPlan}! La aplicación ahora refleja este nivel de acceso.`);
      } else {
        alert(data.error || "Error al actualizar plan");
      }
    } catch (err) {
      console.error(err);
      alert("Error al conectar con la API");
    } finally {
      setLoading(false);
    }
  };

  // Iniciar checkout de Stripe
  const handleStripeCheckout = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business.id,
          interval,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al iniciar Stripe");

      if (data.isMock) {
        alert("Modo Demo Activo: Activaremos el plan PRO directamente para que pruebes todas las funciones, contabilidad y tu APK.");
        await handleToggleMockPlan("PRO");
      } else if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      alert(err.message || "Error al procesar pago");
    } finally {
      setLoading(false);
    }
  };

  const isPro = currentPlan === "PRO";
  const isIndependiente = currentPlan === "INDEPENDIENTE";
  const isFree = currentPlan === "FREE";

  return (
    <div className="space-y-8">
      {/* CARD DEL PLAN ACTUAL */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Estado de tu Cuenta
            </span>
            <div className="mt-1 flex items-center gap-3">
              <h2 className="text-2xl font-extrabold text-gray-900">
                {isPro
                  ? "Plan Pro Ilimitado + APK"
                  : isIndependiente
                  ? "Plan Manicurista / Domicilio"
                  : "Plan Emprendedor (Gratis)"}
              </h2>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  isPro
                    ? "bg-emerald-100 text-emerald-800"
                    : isIndependiente
                    ? "bg-teal-100 text-teal-800"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {isPro ? "PRO Activo" : isIndependiente ? "Independiente" : "Básico"}
              </span>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {isPro
                ? "Disfrutas de citas ilimitadas, Módulo Contable, APK móvil propia instalable y marca personalizada."
                : isIndependiente
                ? "Citas ilimitadas, atención a domicilio y servicios de 30 a 120 minutos."
                : "Limitado a 30 citas mensuales y 2 servicios. Actualiza para desbloquear todo."}
            </p>
          </div>

          {/* SIMULADOR / TEST TOGGLE (SUPER UTIL PARA PROBAR) */}
          <div className="rounded-xl bg-gray-50 p-3.5 border border-gray-200 text-right sm:max-w-md">
            <span className="text-[11px] font-bold text-gray-500 uppercase block">
              Pruebas de Desarrollo / Demo
            </span>
            <p className="text-[11px] text-gray-400 mb-2">
              Cambia el plan al instante sin tarjeta para probar el bloqueo y desbloqueo de funciones:
            </p>
            <div className="flex flex-wrap justify-end gap-1.5">
              <button
                type="button"
                disabled={loading || isFree}
                onClick={() => handleToggleMockPlan("FREE")}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold border transition ${
                  isFree
                    ? "bg-gray-200 text-gray-500 cursor-default"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                }`}
              >
                Free ($0)
              </button>
              <button
                type="button"
                disabled={loading || isIndependiente}
                onClick={() => handleToggleMockPlan("INDEPENDIENTE")}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold border transition ${
                  isIndependiente
                    ? "bg-teal-100 text-teal-800 border-teal-300 cursor-default font-bold"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-teal-50"
                }`}
              >
                Independiente ($9)
              </button>
              <button
                type="button"
                disabled={loading || isPro}
                onClick={() => handleToggleMockPlan("PRO")}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold border transition ${
                  isPro
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300 cursor-default font-bold"
                    : "bg-emerald-600 text-white hover:bg-emerald-500"
                }`}
              >
                Pro ($19)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* COMPARATIVA DE LOS 3 PLANES */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* PLAN FREE */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Plan Emprendedor</h3>
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-600">
                $0 / mes
              </span>
            </div>

            <ul className="mt-6 space-y-3 text-xs text-gray-600">
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                Hasta 30 citas por mes
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                Hasta 2 servicios activos
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                Página pública de reservas
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                Recordatorios manuales por WhatsApp
              </li>
            </ul>
          </div>

          <div className="mt-8">
            <button
              disabled={isFree}
              onClick={() => handleToggleMockPlan("FREE")}
              className="w-full rounded-xl border border-gray-300 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition disabled:opacity-40"
            >
              {isFree ? "Plan Actual" : "Cambiar a Plan Gratuito"}
            </button>
          </div>
        </div>

        {/* PLAN INDEPENDIENTE (MANICURISTAS / DOMICILIOS) */}
        <div className="rounded-2xl border-2 border-teal-500 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full mb-1">
                  💅 Ideal Independientes
                </span>
                <h3 className="text-lg font-bold text-gray-900">Manicurista / Domicilio</h3>
              </div>
              <div className="text-right">
                <span className="text-2xl font-extrabold text-gray-900">$9</span>
                <span className="text-xs text-gray-500 font-medium"> / mes</span>
              </div>
            </div>

            <ul className="mt-6 space-y-3 text-xs text-gray-700">
              <li className="flex items-center gap-2.5 font-semibold text-gray-900">
                <Zap className="h-4 w-4 text-teal-600 shrink-0" />
                Citas y turnos 100% ilimitados
              </li>
              <li className="flex items-center gap-2.5 font-semibold text-gray-900">
                <Car className="h-4 w-4 text-teal-600 shrink-0" />
                Modalidad a Domicilio con captura de dirección
              </li>
              <li className="flex items-center gap-2.5 font-semibold text-gray-900">
                <Zap className="h-4 w-4 text-teal-600 shrink-0" />
                Servicios flexibles de 30 a 120 minutos
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-teal-500 shrink-0" />
                Recordatorios automáticos por WhatsApp con dirección
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-teal-500 shrink-0" />
                Alertas sonoras en segundo plano
              </li>
            </ul>
          </div>

          <div className="mt-8">
            <button
              onClick={() => handleToggleMockPlan("INDEPENDIENTE")}
              disabled={loading || isIndependiente}
              className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold text-white shadow-md transition ${
                isIndependiente
                  ? "bg-teal-800 opacity-80 cursor-default"
                  : "bg-teal-600 hover:bg-teal-500 shadow-teal-600/25"
              }`}
            >
              {isIndependiente ? "Plan Independiente Activo ✓" : "Activar Plan Independiente ($9/mes)"}
            </button>
          </div>
        </div>

        {/* PLAN PRO CON CONTABILIDAD Y APK */}
        <div className="relative rounded-2xl border-2 border-emerald-600 bg-white p-6 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mb-1">
                  <Sparkles className="h-3 w-3" />
                  Más Completo
                </span>
                <h3 className="text-lg font-bold text-gray-900">Plan Pro + APK + Contabilidad</h3>
              </div>
              <div className="text-right">
                <span className="text-2xl font-extrabold text-gray-900">$19</span>
                <span className="text-xs text-gray-500 font-medium"> / mes</span>
              </div>
            </div>

            <ul className="mt-6 space-y-3 text-xs text-gray-700">
              <li className="flex items-center gap-2.5 font-bold text-emerald-900 bg-emerald-50/70 p-1.5 rounded-lg border border-emerald-100">
                <Smartphone className="h-4 w-4 text-emerald-700 shrink-0" />
                📱 App Móvil Android (APK) propia con tu logo
              </li>
              <li className="flex items-center gap-2.5 font-bold text-emerald-900 bg-emerald-50/70 p-1.5 rounded-lg border border-emerald-100">
                <Wallet className="h-4 w-4 text-emerald-700 shrink-0" />
                📊 Módulo Contable (Ingresos, Gastos y Ganancia neta)
              </li>
              <li className="flex items-center gap-2.5 font-semibold text-gray-900">
                <Zap className="h-4 w-4 text-emerald-600 shrink-0" />
                Arqueo por método de pago (Efectivo, Nequi, Banco)
              </li>
              <li className="flex items-center gap-2.5 font-semibold text-gray-900">
                <Zap className="h-4 w-4 text-emerald-600 shrink-0" />
                Citas y servicios 100% ilimitados
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                Personalización de marca, logotipo y estado en vivo
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                Soporte prioritario VIP 24/7
              </li>
            </ul>
          </div>

          <div className="mt-8">
            <button
              onClick={handleStripeCheckout}
              disabled={loading || isPro}
              className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold text-white shadow-md transition ${
                isPro
                  ? "bg-emerald-800 opacity-80 cursor-default"
                  : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25"
              }`}
            >
              <CreditCard className="h-4 w-4" />
              {isPro
                ? "Plan Pro Activo ✓"
                : loading
                ? "Conectando con Stripe..."
                : "Suscribirse a Plan Pro ($19/mes)"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

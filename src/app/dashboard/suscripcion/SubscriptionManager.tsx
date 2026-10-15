"use client";

import { useState } from "react";
import {
  Check,
  Zap,
  Sparkles,
  Smartphone,
  Wallet,
  Car,
  ShoppingBag,
  MessageCircle,
  Building2,
  Copy,
  CheckCircle2,
  X,
  CreditCard,
} from "lucide-react";

export default function SubscriptionManager({ business }: { business: any }) {
  const [currentPlan, setCurrentPlan] = useState<string>(business.plan || "FREE");
  const [loading, setLoading] = useState(false);

  // Modal de consignación manual
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<"PRO" | "INDEPENDIENTE" | null>(null);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);

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

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAccount(label);
    setTimeout(() => setCopiedAccount(null), 2500);
  };

  const isPro = currentPlan === "PRO";
  const isIndependiente = currentPlan === "INDEPENDIENTE";
  const isFree = currentPlan === "FREE";

  const nequiNumber = "300 123 4567";
  const daviplataNumber = "300 123 4567";

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

          {/* SIMULADOR / TEST TOGGLE */}
          <div className="rounded-xl bg-gray-50 p-3.5 border border-gray-200 text-right sm:max-w-md">
            <span className="text-[11px] font-bold text-gray-500 uppercase block">
              Pruebas de Desarrollo / Demo
            </span>
            <p className="text-[11px] text-gray-400 mb-2">
              Cambia el plan al instante para probar el bloqueo y desbloqueo de funciones:
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
                Independiente ($35k)
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
                Pro ($60k)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* COMPARATIVA DE LOS 3 PLANES */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* PLAN GRATUITO */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Plan Básico</h3>
              <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                Gratis
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500">Para empezar a digitalizarte.</p>

            <div className="mt-4">
              <span className="text-3xl font-extrabold text-gray-900">$0</span>
              <span className="text-xs text-gray-500 font-medium"> / mes</span>
            </div>

            <ul className="mt-6 space-y-3 text-xs text-gray-600">
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                Hasta 30 citas mensuales
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                Máximo 2 servicios activos
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                Página web de reservas pública
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                Recordatorios manuales por WhatsApp
              </li>
            </ul>
          </div>

          <div className="mt-8">
            <button
              disabled
              className="w-full rounded-xl border border-gray-200 py-3 text-xs font-bold text-gray-400 bg-gray-50 cursor-default"
            >
              {isFree ? "Plan Básico Actual" : "Incluido"}
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
                <span className="text-2xl font-extrabold text-gray-900">$35.000</span>
                <span className="text-xs text-gray-500 font-medium"> COP / mes</span>
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
              onClick={() => setSelectedPlanForPayment("INDEPENDIENTE")}
              disabled={isIndependiente}
              className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold text-white shadow-md transition ${
                isIndependiente
                  ? "bg-teal-800 opacity-80 cursor-default"
                  : "bg-teal-600 hover:bg-teal-500 shadow-teal-600/25"
              }`}
            >
              {isIndependiente ? "Plan Independiente Activo ✓" : "Pagar por Consignación ($35.000 COP)"}
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
                <span className="text-2xl font-extrabold text-gray-900">$60.000</span>
                <span className="text-xs text-gray-500 font-medium"> COP / mes</span>
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
              <li className="flex items-center gap-2.5 font-bold text-emerald-900 bg-emerald-50/70 p-1.5 rounded-lg border border-emerald-100">
                <ShoppingBag className="h-4 w-4 text-emerald-700 shrink-0" />
                🛍️ Inventario & Punto de Venta (POS) en mostrador
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
              onClick={() => setSelectedPlanForPayment("PRO")}
              disabled={isPro}
              className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold text-white shadow-md transition ${
                isPro
                  ? "bg-emerald-800 opacity-80 cursor-default"
                  : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25"
              }`}
            >
              <Wallet className="h-4 w-4" />
              {isPro
                ? "Plan Pro Activo ✓"
                : "Pagar por Consignación ($60.000 COP)"}
            </button>
          </div>
        </div>
      </div>

      {/* MODAL DE PAGO POR CONSIGNACIÓN / TRANSFERENCIA DIRECTA */}
      {selectedPlanForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedPlanForPayment(null)}
              className="absolute right-5 top-5 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Activar {selectedPlanForPayment === "PRO" ? "Plan PRO Ilimitado" : "Plan Independiente"}
                </h3>
                <p className="text-xs text-gray-500">
                  Consignación directa verificada por el administrador
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-emerald-50/70 border border-emerald-200 p-4 mb-5">
              <span className="text-xs font-semibold text-emerald-900 block mb-1">
                Valor mensual a consignar:
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-700">
                  {selectedPlanForPayment === "PRO" ? "$60.000 COP" : "$35.000 COP"}
                </span>
                <span className="text-xs text-emerald-800">
                  ({selectedPlanForPayment === "PRO" ? "$19 USD" : "$9 USD"})
                </span>
              </div>
              <p className="text-[11px] text-emerald-700 mt-1">
                Negocio a habilitar: <strong>{business.name}</strong> (slug: <code>{business.slug}</code>)
              </p>
            </div>

            {/* CUENTAS DE RECAUDO */}
            <div className="space-y-3 mb-6">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Cuentas Disponibles para Transferir:
              </h4>

              {/* NEQUI */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-gray-50/70">
                <div>
                  <span className="text-xs font-bold text-gray-900 block">Nequi</span>
                  <span className="text-sm font-mono font-bold text-gray-700">{nequiNumber}</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(nequiNumber.replace(/\s+/g, ""), "NEQUI")}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-100"
                >
                  {copiedAccount === "NEQUI" ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ¡Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copiar
                    </>
                  )}
                </button>
              </div>

              {/* DAVIPLATA */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-gray-50/70">
                <div>
                  <span className="text-xs font-bold text-gray-900 block">Daviplata</span>
                  <span className="text-sm font-mono font-bold text-gray-700">{daviplataNumber}</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(daviplataNumber.replace(/\s+/g, ""), "DAVIPLATA")}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-100"
                >
                  {copiedAccount === "DAVIPLATA" ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ¡Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copiar
                    </>
                  )}
                </button>
              </div>

              {/* BANCOLOMBIA */}
              <div className="p-3 rounded-xl border border-gray-200 bg-gray-50/70">
                <span className="text-xs font-bold text-gray-900 block">Bancolombia</span>
                <span className="text-xs text-gray-600">
                  Ahorros / Transferencia QR (solicita el número o código QR directo al WhatsApp de soporte).
                </span>
              </div>
            </div>

            {/* BOTÓN WHATSAPP PARA ENVIAR COMPROBANTE */}
            <div className="space-y-3">
              <a
                href={`https://wa.me/57${nequiNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                  `¡Hola! 👋 Acabo de realizar la consignación para activar el ${
                    selectedPlanForPayment === "PRO" ? "Plan PRO ($60.000 COP)" : "Plan Independiente ($35.000 COP)"
                  } de mi negocio "${business.name}" (Slug: ${business.slug}).\n\nAdjunto el comprobante de pago para su verificación y activación.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ backgroundColor: "#059669", color: "#ffffff" }}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-500 transition"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Enviar Comprobante por WhatsApp</span>
              </a>

              <p className="text-[11px] text-center text-gray-400">
                💡 Una vez verifiquemos tu consignación, tu plan se activará de inmediato. <br />
                <em>(Próximamente PSE y pasarela automatizada).</em>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

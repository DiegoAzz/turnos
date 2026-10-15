"use client";

import { useEffect, useState } from "react";
import {
  CreditCard,
  Building2,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Zap,
  Save,
  RefreshCw,
  ExternalLink,
  Eye,
  EyeOff,
} from "lucide-react";

export default function AdminPaymentSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [showIntegritySecret, setShowIntegritySecret] = useState(false);

  const [paymentMode, setPaymentMode] = useState<"MANUAL" | "GATEWAY" | "HYBRID">("MANUAL");
  const [wompiPublicKey, setWompiPublicKey] = useState("");
  const [wompiIntegritySecret, setWompiIntegritySecret] = useState("");
  const [wompiSandbox, setWompiSandbox] = useState(true);
  const [nequiNumber, setNequiNumber] = useState("300 123 4567");
  const [daviplataNumber, setDaviplataNumber] = useState("300 123 4567");
  const [bancolombiaDetails, setBancolombiaDetails] = useState("Cuenta de Ahorros Bancolombia");
  const [whatsappPaymentNumber, setWhatsappPaymentNumber] = useState("300 123 4567");
  const [proPriceCOP, setProPriceCOP] = useState(60000);
  const [independientePriceCOP, setIndependientePriceCOP] = useState(35000);

  const webhookUrl = "https://turnos.appzplay.online/api/wompi/webhook";

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/platform/settings");
      if (res.ok) {
        const data = await res.json();
        setPaymentMode(data.paymentMode || "MANUAL");
        setWompiPublicKey(data.wompiPublicKey || "");
        if (data.wompiIntegritySecret) setWompiIntegritySecret(data.wompiIntegritySecret);
        setWompiSandbox(data.wompiSandbox ?? true);
        setNequiNumber(data.nequiNumber || "300 123 4567");
        setDaviplataNumber(data.daviplataNumber || "300 123 4567");
        setBancolombiaDetails(data.bancolombiaDetails || "Cuenta de Ahorros Bancolombia");
        setWhatsappPaymentNumber(data.whatsappPaymentNumber || "300 123 4567");
        setProPriceCOP(data.proPriceCOP || 60000);
        setIndependientePriceCOP(data.independientePriceCOP || 35000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (newMode?: "MANUAL" | "GATEWAY" | "HYBRID") => {
    try {
      setSaving(true);
      const targetMode = newMode || paymentMode;

      const res = await fetch("/api/platform/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMode: targetMode,
          wompiPublicKey,
          wompiIntegritySecret,
          wompiSandbox,
          nequiNumber,
          daviplataNumber,
          bancolombiaDetails,
          whatsappPaymentNumber,
          proPriceCOP: Number(proPriceCOP),
          independientePriceCOP: Number(independientePriceCOP),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo guardar la configuración.");

      if (newMode) setPaymentMode(newMode);
      alert("¡Configuración de pagos guardada con éxito!");
    } catch (err: any) {
      alert(err.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2500);
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400">Cargando configuración de pagos...</div>;
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* SELECTOR MAESTRO DE MODO DE PAGO */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5 mb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Zap className="h-4 w-4" />
              Interruptor Maestro de Cobro
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
              ¿Cómo deseas cobrar las suscripciones a tus clientes?
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Cambia en cualquier momento entre cobro tradicional o pasarela automatizada con 1 solo clic.
            </p>
          </div>

          <span
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold border self-start sm:self-auto ${
              paymentMode === "MANUAL"
                ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                : paymentMode === "GATEWAY"
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                : "bg-teal-500/20 text-teal-300 border-teal-500/30"
            }`}
          >
            {paymentMode === "MANUAL"
              ? "Modo Activo: Solo Consignación Manual"
              : paymentMode === "GATEWAY"
              ? "Modo Activo: Solo Pasarela Online (Wompi)"
              : "Modo Activo: Híbrido (Ambas Opciones)"}
          </span>
        </div>

        {/* 3 OPCIONES SELECCIONABLES */}
        <div className="grid gap-4 sm:grid-cols-3">
          {/* OPCIÓN 1: SOLO CONSIGNACIÓN */}
          <div
            onClick={() => handleSave("MANUAL")}
            className={`cursor-pointer rounded-2xl p-5 border-2 transition relative flex flex-col justify-between ${
              paymentMode === "MANUAL"
                ? "border-amber-400 bg-amber-500/10 shadow-lg shadow-amber-500/10"
                : "border-slate-800 bg-slate-900/40 hover:border-slate-700"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                  <Smartphone className="h-5 w-5" />
                </div>
                {paymentMode === "MANUAL" && (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-slate-950 font-black text-xs">
                    ✓
                  </span>
                )}
              </div>
              <h3 className="font-bold text-white text-base">Solo Consignación Manual</h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                El cliente te transfiere a <strong>Nequi, Daviplata o Bancolombia</strong> y te envía el comprobante por WhatsApp. Tú verificas el dinero y le das acceso en 1 clic.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-semibold text-amber-400">
              0% comisiones bancarias para ti
            </div>
          </div>

          {/* OPCIÓN 2: PASARELA AUTOMÁTICA */}
          <div
            onClick={() => handleSave("GATEWAY")}
            className={`cursor-pointer rounded-2xl p-5 border-2 transition relative flex flex-col justify-between ${
              paymentMode === "GATEWAY"
                ? "border-emerald-400 bg-emerald-500/10 shadow-lg shadow-emerald-500/10"
                : "border-slate-800 bg-slate-900/40 hover:border-slate-700"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                  <CreditCard className="h-5 w-5" />
                </div>
                {paymentMode === "GATEWAY" && (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400 text-slate-950 font-black text-xs">
                    ✓
                  </span>
                )}
              </div>
              <h3 className="font-bold text-white text-base">Pasarela Wompi / PSE</h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                El cliente paga en línea con <strong>PSE, Nequi directo o Tarjetas</strong>. La cuenta se activa automáticamente en segundos y se le paga la comisión a su embajador.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-semibold text-emerald-400">
              100% automático sin intervención manual
            </div>
          </div>

          {/* OPCIÓN 3: MODO HÍBRIDO */}
          <div
            onClick={() => handleSave("HYBRID")}
            className={`cursor-pointer rounded-2xl p-5 border-2 transition relative flex flex-col justify-between ${
              paymentMode === "HYBRID"
                ? "border-teal-400 bg-teal-500/10 shadow-lg shadow-teal-500/10"
                : "border-slate-800 bg-slate-900/40 hover:border-slate-700"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/20 text-teal-400">
                  <Building2 className="h-5 w-5" />
                </div>
                {paymentMode === "HYBRID" && (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-400 text-slate-950 font-black text-xs">
                    ✓
                  </span>
                )}
              </div>
              <h3 className="font-bold text-white text-base">Híbrido (Ambas Opciones)</h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Le muestra las dos opciones al cliente: quien quiera pagar con PSE lo hace en línea, y quien prefiera transferir por Nequi te manda el comprobante.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-semibold text-teal-400">
              Máxima conversión para todos los clientes
            </div>
          </div>
        </div>
      </div>

      {/* FORMULARIO DE CUENTAS DE CONSIGNACIÓN MANUAL */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6 sm:p-8 shadow-xl space-y-6">
        <div className="border-b border-slate-800 pb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-amber-400" />
            Configuración de Cuentas de Consignación Manual
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Estos son los números de cuenta que verán los clientes cuando vayan a pagar por transferencia:
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Número de Celular Nequi
            </label>
            <input
              type="text"
              value={nequiNumber}
              onChange={(e) => setNequiNumber(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2.5 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none"
              placeholder="300 123 4567"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Número de Celular Daviplata
            </label>
            <input
              type="text"
              value={daviplataNumber}
              onChange={(e) => setDaviplataNumber(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2.5 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none"
              placeholder="300 123 4567"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Detalles Cuenta Bancolombia / QR
            </label>
            <input
              type="text"
              value={bancolombiaDetails}
              onChange={(e) => setBancolombiaDetails(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              placeholder="Ahorros Bancolombia # 123-456789-00"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              WhatsApp para Recibir Comprobantes de Pago
            </label>
            <input
              type="text"
              value={whatsappPaymentNumber}
              onChange={(e) => setWhatsappPaymentNumber(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2.5 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none"
              placeholder="300 123 4567"
            />
          </div>
        </div>
      </div>

      {/* FORMULARIO DE CONFIGURACIÓN PASARELA WOMPI */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6 sm:p-8 shadow-xl space-y-6">
        <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-emerald-400" />
              Credenciales de la Pasarela Wompi (Bancolombia)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Conecta tu cuenta de Wompi para habilitar PSE, Nequi y tarjetas automáticas:
            </p>
          </div>

          <a
            href="https://wompi.co"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-semibold self-start sm:self-auto"
          >
            <span>Ir a Wompi.co</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Llave Pública de Wompi (Public Key)
            </label>
            <input
              type="text"
              value={wompiPublicKey}
              onChange={(e) => setWompiPublicKey(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2.5 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none"
              placeholder="pub_prod_... o pub_test_..."
            />
            <p className="mt-1 text-[11px] text-slate-500">
              La encuentras en tu panel de Wompi ➔ Desarrolladores ➔ Llaves de API.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-300">
                Secreto de Integridad de Wompi (Integrity Secret)
              </label>
              <button
                type="button"
                onClick={() => setShowIntegritySecret(!showIntegritySecret)}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-emerald-400 transition"
              >
                {showIntegritySecret ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5" />
                    <span>Ocultar</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5" />
                    <span>Ver texto completo</span>
                  </>
                )}
              </button>
            </div>
            <div className="relative">
              <input
                type={showIntegritySecret ? "text" : "password"}
                value={wompiIntegritySecret}
                onChange={(e) => setWompiIntegritySecret(e.target.value.trim())}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2.5 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none pr-10"
                placeholder="test_integrity_... o prod_integrity_..."
              />
            </div>
            {wompiIntegritySecret && !wompiIntegritySecret.startsWith("test_integrity_") && !wompiIntegritySecret.startsWith("prod_integrity_") && (
              <p className="mt-1.5 text-xs text-rose-400 font-semibold bg-rose-500/10 border border-rose-500/30 p-2 rounded-lg">
                ⚠️ Atención: La clave ingresada no parece ser un Secreto de Integridad. Debe empezar obligatoriamente por <code className="bg-rose-950/60 px-1 py-0.5 rounded">test_integrity_</code> o <code className="bg-rose-950/60 px-1 py-0.5 rounded">prod_integrity_</code>. Asegúrate de no haber copiado el &quot;Secreto de Eventos&quot;.
              </p>
            )}
            <p className="mt-1 text-[11px] text-slate-500">
              ⚠️ <strong>Importante:</strong> En el panel de Wompi, haz clic dentro del campo de Integridad y presiona <kbd className="bg-slate-800 text-slate-300 px-1 rounded">Ctrl + A</kbd> para asegurarte de copiar la clave completa sin recortar caracteres.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              id="wompiSandbox"
              type="checkbox"
              checked={wompiSandbox}
              onChange={(e) => setWompiSandbox(e.target.checked)}
              className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
            />
            <label htmlFor="wompiSandbox" className="text-xs text-slate-300">
              <strong>Modo Sandbox (Pruebas)</strong>: Marca esta casilla si estás usando llaves de prueba <code>pub_test_...</code>
            </label>
          </div>

          {/* URL DE WEBHOOK PARA PEGAR EN WOMPI */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 mt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-slate-200 block">
                  URL de Eventos / Webhook para tu panel de Wompi:
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Pega esta URL en tu cuenta de Wompi ➔ Desarrolladores ➔ Eventos para que el sistema active automáticamente a los clientes que paguen.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyWebhook}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition whitespace-nowrap self-start sm:self-auto"
              >
                {copiedWebhook ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>¡URL Copiada!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copiar URL</span>
                  </>
                )}
              </button>
            </div>
            <div className="mt-2 text-xs font-mono text-emerald-400 bg-slate-950 p-2 rounded-lg truncate">
              {webhookUrl}
            </div>
          </div>
        </div>
      </div>

      {/* BOTÓN GUARDAR CAMBIOS */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => handleSave()}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-3 text-sm shadow-lg shadow-emerald-500/25 transition disabled:opacity-50"
        >
          {saving ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Guardando...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Guardar Configuración de Pagos</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

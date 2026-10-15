"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Smartphone,
  Download,
  Share2,
  QrCode,
  Sparkles,
  CheckCircle2,
  Copy,
  ExternalLink,
  MessageCircle,
  ShieldCheck,
  Zap,
  ArrowRight,
  Info,
} from "lucide-react";

export default function AppMovilManager({ business }: { business: any }) {
  const [copied, setCopied] = useState(false);
  const isPro = business.plan === "PRO";

  const publicUrl = `https://turnos.appzplay.online/p/${business.slug}`;
  const apkDownloadUrl = `/api/apk/download?slug=${business.slug}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    publicUrl
  )}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const shareText = `¡Hola! 📲 Descarga e instala la App oficial de *${business.name}* en tu celular para reservar tus citas en 1 solo clic:\n\n👉 ${publicUrl}`;
  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* BANNER PLAN PRO O UPGRADE */}
      {!isPro ? (
        <div className="rounded-3xl border-2 border-emerald-500/30 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-slate-950 mb-3 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Función Exclusiva del Plan PRO
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ten la App Móvil Android (APK) propia de {business.name}
            </h2>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              En el <strong>Plan PRO</strong>, tu negocio tiene su propia aplicación móvil con tu logo y nombre. Tus clientes pueden descargarla directamente en su celular Android o iPhone para agendarte turnos en 1 segundo sin abrir navegadores.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard/suscripcion"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-3 text-xs shadow-lg shadow-emerald-500/25 transition"
              >
                <span>Activar Plan PRO y Obtener mi APK</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <span className="text-xs text-slate-400">Solo $19 USD / mes</span>
            </div>
          </div>

          <div className="absolute right-4 -bottom-10 opacity-10 sm:opacity-20 pointer-events-none">
            <Smartphone className="h-72 w-72 text-emerald-400" />
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-teal-50 to-white p-6 sm:p-8 text-emerald-950 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-600/30">
              <Smartphone className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  Plan PRO Activo
                </span>
                <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  APK Lista y Habilitada
                </span>
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 mt-1">
                Tu App Móvil Oficial está Lista
              </h2>
              <p className="text-xs text-gray-600 mt-1 max-w-xl">
                La aplicación móvil de <strong>{business.name}</strong> está empaquetada con tu logotipo, colores y catálogo de servicios para instalarse en cualquier dispositivo móvil.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <a
              href={apkDownloadUrl}
              download
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 text-xs shadow-md transition"
            >
              <Download className="h-4 w-4 text-emerald-400" />
              <span>Descargar APK (.apk)</span>
            </a>
          </div>
        </div>
      )}

      {/* CONTENEDOR PRINCIPAL: PREVISUALIZACIÓN Y CANALES DE INSTALACIÓN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* COLUMNA IZQUIERDA: MOCKUP INTERACTIVO DEL CELULAR (4 COLS) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full max-w-[290px] rounded-[44px] border-[10px] border-slate-900 bg-slate-900 shadow-2xl overflow-hidden relative">
            {/* Altavoz y Cámara del Celular */}
            <div className="h-6 bg-slate-900 flex items-center justify-center relative">
              <div className="h-3.5 w-20 bg-slate-950 rounded-full flex items-center justify-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-slate-800" />
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500/80" />
              </div>
            </div>

            {/* Pantalla Interna del Celular */}
            <div className="bg-white min-h-[480px] text-gray-800 flex flex-col justify-between p-4">
              <div>
                {/* Header de la App */}
                <div className="flex items-center gap-2.5 border-b border-gray-100 pb-3">
                  {business.logoUrl ? (
                    <img
                      src={business.logoUrl}
                      alt={business.name}
                      className="h-9 w-9 rounded-xl object-cover border border-gray-100 shadow-sm"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                      {business.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-xs text-gray-900 truncate">
                      {business.name}
                    </h4>
                    <span className="text-[10px] text-emerald-700 font-semibold block">
                      App Móvil Oficial
                    </span>
                  </div>
                </div>

                {/* Banner de Bienvenida en la App */}
                <div className="mt-4 rounded-2xl bg-emerald-50 p-3 border border-emerald-100 text-center">
                  <span className="text-xl">✨</span>
                  <p className="text-xs font-bold text-emerald-950 mt-1">
                    ¡Reserva tu turno en 1 clic!
                  </p>
                  <p className="text-[10px] text-emerald-700 mt-0.5">
                    Sin filas ni llamadas telefónicas
                  </p>
                </div>

                {/* Lista simulada de turnos */}
                <div className="mt-4 space-y-2">
                  <div className="rounded-xl border border-gray-100 p-2 text-[11px] flex justify-between items-center shadow-2xs">
                    <span className="font-semibold text-gray-700">1. Elige tu Servicio</span>
                    <span className="text-emerald-600 font-bold">✓</span>
                  </div>
                  <div className="rounded-xl border border-gray-100 p-2 text-[11px] flex justify-between items-center shadow-2xs">
                    <span className="font-semibold text-gray-700">2. Elige Fecha y Hora</span>
                    <span className="text-emerald-600 font-bold">✓</span>
                  </div>
                  <div className="rounded-xl border border-gray-100 p-2 text-[11px] flex justify-between items-center shadow-2xs">
                    <span className="font-semibold text-gray-700">3. Confirmación WhatsApp</span>
                    <span className="text-emerald-600 font-bold">✓</span>
                  </div>
                </div>
              </div>

              {/* Botón flotante simulado en el celular */}
              <div className="pt-4">
                <div className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs text-center shadow-md shadow-emerald-600/30">
                  Agendar Cita Ahora
                </div>
                {/* Barra de Inicio de Android */}
                <div className="mt-3 mx-auto h-1 w-24 bg-gray-300 rounded-full" />
              </div>
            </div>
          </div>

          <p className="mt-3 text-xs text-gray-400 font-medium text-center">
            📱 Previsualización en tiempo real de tu App
          </p>
        </div>

        {/* COLUMNA DERECHA: 3 FORMAS DE INSTALACIÓN (7 COLS) */}
        <div className="lg:col-span-7 space-y-6">
          {/* MÉTODO 1: INSTALACIÓN 1-CLIC (WebAPK) */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-extrabold text-base text-gray-900">
                  Instalación Directa 1-Clic (Recomendado)
                </h3>
                <p className="text-xs text-gray-500">
                  Compatible con todos los celulares Android y iPhone sin pasar por Play Store
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row items-center gap-6">
              {/* Código QR Dinámico */}
              <div className="p-2 bg-white border border-gray-200 rounded-2xl shadow-sm shrink-0">
                <img
                  src={qrCodeUrl}
                  alt={`QR de ${business.name}`}
                  className="h-32 w-32 rounded-xl"
                />
              </div>

              <div className="space-y-3 text-xs text-gray-600 text-center sm:text-left">
                <p>
                  <strong>¿Cómo funciona?</strong> Abre la cámara de cualquier teléfono móvil y apunta al código QR, o ingresa al enlace.
                </p>
                <div className="p-3 bg-gray-50 rounded-xl space-y-1 text-gray-700">
                  <p>
                    🤖 <strong>En Android:</strong> Toca los 3 puntos de Chrome y selecciona <em>"Instalar Aplicación"</em> o <em>"Agregar a Pantalla Principal"</em>.
                  </p>
                  <p>
                    🍏 <strong>En iPhone:</strong> Toca el botón Compartir de Safari y selecciona <em>"Agregar al inicio"</em>.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* MÉTODO 2: DESCARGA DIRECTA DE ARCHIVO APK */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <div className="h-9 w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-extrabold text-base text-gray-900">
                  Descarga del Archivo Instalador APK (.apk)
                </h3>
                <p className="text-xs text-gray-500">
                  Para instalar manualmente el archivo instalador en teléfonos y tablets Android
                </p>
              </div>
            </div>

            <div className="mt-4 text-xs text-gray-600 space-y-3">
              <p>
                Puedes descargar directamente el instalador Android (.apk) firmado con el nombre de tu negocio para tenerlo guardado o compartirlo por Bluetooth o Telegram:
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                {isPro ? (
                  <a
                    href={apkDownloadUrl}
                    download
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 text-xs shadow-sm transition"
                  >
                    <Download className="h-4 w-4" />
                    <span>Descargar {business.name}-App.apk</span>
                  </a>
                ) : (
                  <Link
                    href="/dashboard/suscripcion"
                    className="inline-flex items-center gap-2 rounded-xl bg-gray-100 text-gray-500 font-bold px-4 py-2.5 text-xs border border-gray-200 hover:bg-gray-200 transition"
                  >
                    <span>🔒 Desbloquear descarga APK con Plan PRO</span>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* MÉTODO 3: DIFUSIÓN POR WHATSAPP A TUS CLIENTES */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-extrabold text-base text-gray-900">
                  Enviar Enlace de la App a tus Clientes por WhatsApp
                </h3>
                <p className="text-xs text-gray-500">
                  Compártelo en tus estados, redes sociales o por chat privado
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {/* Caja con el enlace */}
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl p-2 text-xs">
                <span className="font-mono text-gray-700 truncate flex-1 px-2">
                  {publicUrl}
                </span>
                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 font-semibold hover:bg-gray-100 transition shrink-0"
                >
                  <Copy className="h-3.5 w-3.5 text-emerald-600" />
                  <span>{copied ? "¡Copiado!" : "Copiar Enlace"}</span>
                </button>
              </div>

              {/* Botón de compartir directo por WhatsApp */}
              <a
                href={whatsappShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 text-xs shadow-md shadow-emerald-600/25 transition"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Enviar Invitación de Descarga a Clientes por WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

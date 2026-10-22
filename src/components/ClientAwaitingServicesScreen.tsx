"use client";

import { useState } from "react";
import { Sparkles, Clock, RefreshCw, MessageCircle, LogOut, ShieldCheck, CheckCircle2 } from "lucide-react";
import DashboardLogoutButton from "@/components/DashboardLogoutButton";

interface ClientAwaitingServicesScreenProps {
  business: {
    id: string;
    name: string;
    slug: string;
    category?: string | null;
    phone?: string | null;
    currency?: string;
  };
}

export default function ClientAwaitingServicesScreen({
  business,
}: ClientAwaitingServicesScreenProps) {
  const [checking, setChecking] = useState(false);

  const getCategoryLabel = (cat?: string | null) => {
    switch (cat) {
      case "MANICURA_SPA":
        return "💅 Manicura, Uñas & Spa";
      case "BARBERIA":
        return "💈 Barbería & Peluquería";
      case "LAVADERO":
        return "🚗 Lavadero de Autos & Motos";
      case "SALUD_CONSULTORIO":
        return "🩺 Salud, Spa & Terapias";
      default:
        return "⚡ Servicios Profesionales";
    }
  };

  const handleRefresh = () => {
    setChecking(true);
    window.location.reload();
  };

  const waMessage = encodeURIComponent(
    `Hola, acabo de registrar mi negocio "${business.name}" en TurnoYa y estoy a la espera de que el Super Administrador me habilite mis servicios con sus checsitos para comenzar a operar mi panel.`
  );
  // Default WhatsApp link to administration
  const waUrl = `https://wa.me/?text=${waMessage}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 flex flex-col items-center justify-center p-4 text-white">
      {/* CARD PRINCIPAL */}
      <div className="w-full max-w-xl bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        {/* Glow de fondo */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* LOGO & BADGE */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Sparkles className="h-5 w-5 text-slate-950 font-bold" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-white">
                Turno<span className="text-emerald-400">Ya</span>
              </span>
              <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">
                Ecosistema SaaS
              </span>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 animate-pulse">
            <Clock className="h-3.5 w-3.5" />
            En Configuración
          </span>
        </div>

        {/* CONTENIDO */}
        <div className="mt-6 text-center">
          <div className="inline-flex p-4 rounded-3xl bg-slate-800/80 border border-slate-700/60 shadow-inner mb-4">
            <Clock className="h-10 w-10 text-amber-400" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            ¡Bienvenido, {business.name}!
          </h1>

          <p className="mt-3 text-slate-300 text-sm leading-relaxed max-w-md mx-auto">
            Tu cuenta ha sido creada con éxito. Por seguridad y orden operativo, tu panel se desbloqueará una vez el <strong className="text-amber-300 font-semibold">Super Administrador</strong> te asigne tus servicios autorizados con sus checsitos.
          </p>
        </div>

        {/* FICHA TÉCNICA DEL NEGOCIO */}
        <div className="mt-6 bg-slate-950/60 rounded-2xl p-4 border border-slate-800/80 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">🏢 Negocio:</span>
            <span className="text-slate-200 font-bold">{business.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">🏷️ Rubro seleccionado:</span>
            <span className="text-emerald-400 font-semibold">{getCategoryLabel(business.category)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">📱 WhatsApp registrado:</span>
            <span className="text-slate-300 font-mono">{business.phone || "No configurado"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">🌐 Tu página pública:</span>
            <span className="text-slate-400 font-mono text-[11px]">/p/{business.slug}</span>
          </div>
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">⚡ Estado de Servicios:</span>
            <span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              0 Asignados (Pendiente Super Admin)
            </span>
          </div>
        </div>

        {/* ACCIONES */}
        <div className="mt-6 space-y-3">
          <button
            onClick={handleRefresh}
            disabled={checking}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition active:scale-[0.99] disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${checking ? "animate-spin" : ""}`} />
            <span>{checking ? "Verificando servicios..." : "🔄 Ya me los asignaron, Desbloquear Panel"}</span>
          </button>

          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-2 transition"
          >
            <MessageCircle className="h-4 w-4 text-emerald-400" />
            <span>Avisar al Administrador por WhatsApp para activar</span>
          </a>
        </div>

        {/* LOGOUT */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span>¿Deseas salir o cambiar de cuenta?</span>
          <div className="w-auto">
            <DashboardLogoutButton />
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-500 text-center">
        TurnoYa Cloud • Plataforma Multi-Negocio
      </p>
    </div>
  );
}

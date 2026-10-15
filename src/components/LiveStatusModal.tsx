"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Coffee,
  CalendarOff,
  Megaphone,
  X,
  Sparkles,
  Info,
} from "lucide-react";

interface LiveStatusModalProps {
  business: any;
  onClose: () => void;
  onSaved: (updatedBusiness: any) => void;
}

export default function LiveStatusModal({
  business,
  onClose,
  onSaved,
}: LiveStatusModalProps) {
  const [liveStatus, setLiveStatus] = useState<string>(
    business.liveStatus || "OPEN"
  );
  const [statusMessage, setStatusMessage] = useState<string>(
    business.statusMessage || ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const quickMessages: Record<string, string[]> = {
    LUNCH: [
      "En almuerzo, volvemos a las 2:00 PM",
      "Pausa de almuerzo (1:00 PM - 2:00 PM)",
      "Descanso breve, atendemos en 20 minutos",
    ],
    CLOSED_TODAY: [
      "Cerrado por día festivo. Agenda para mañana.",
      "Cerrado por descanso semanal. ¡Te esperamos pronto!",
      "Hoy no hay servicio por mantenimiento.",
    ],
    SPECIAL_NOTICE: [
      "Hoy atendemos por orden de llegada hasta las 8 PM",
      "Hoy abrimos en horario especial",
      "Por favor llegar 5 minutos antes de su cita",
    ],
    OPEN: [
      "Atendiendo con normalidad",
      "Horario habitual activo",
    ],
  };

  const handleQuickMessageClick = (msg: string) => {
    setStatusMessage(msg);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/business/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business.id,
          liveStatus,
          statusMessage: statusMessage.trim() ? statusMessage.trim() : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al actualizar estado.");
      }

      onSaved(data.business);
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al guardar el estado.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Megaphone className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-gray-900">
                Estado del Negocio en Vivo
              </h3>
              <p className="text-xs text-gray-500">
                Informa a los clientes si estás atendiendo, en almuerzo o festivo
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
            <Info className="h-4 w-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* OPCIONES DE ESTADO */}
          <div>
            <label className="block text-xs font-bold text-gray-800 mb-2">
              Selecciona el estado actual de tu negocio:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* 1. ABIERTO */}
              <button
                type="button"
                onClick={() => setLiveStatus("OPEN")}
                className={`p-3.5 rounded-2xl border text-left transition flex items-start gap-3 ${
                  liveStatus === "OPEN"
                    ? "border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-gray-900 flex items-center gap-1.5">
                    <span>🟢 Abierto</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Atendiendo con normalidad
                  </p>
                </div>
              </button>

              {/* 2. ALMUERZO / PAUSA */}
              <button
                type="button"
                onClick={() => {
                  setLiveStatus("LUNCH");
                  if (!statusMessage) setStatusMessage("En almuerzo, volvemos a las 2:00 PM");
                }}
                className={`p-3.5 rounded-2xl border text-left transition flex items-start gap-3 ${
                  liveStatus === "LUNCH"
                    ? "border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0">
                  <Coffee className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-gray-900 flex items-center gap-1.5">
                    <span>🟡 En Almuerzo</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Pausa de comida o descanso
                  </p>
                </div>
              </button>

              {/* 3. CERRADO POR HOY / FESTIVO */}
              <button
                type="button"
                onClick={() => {
                  setLiveStatus("CLOSED_TODAY");
                  if (!statusMessage) setStatusMessage("Cerrado por día festivo. Agenda para los próximos días.");
                }}
                className={`p-3.5 rounded-2xl border text-left transition flex items-start gap-3 ${
                  liveStatus === "CLOSED_TODAY"
                    ? "border-rose-500 bg-rose-50/70 ring-2 ring-rose-500/20"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <div className="p-2 rounded-xl bg-rose-100 text-rose-700 shrink-0">
                  <CalendarOff className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-gray-900 flex items-center gap-1.5">
                    <span>🔴 Cerrado Hoy</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Festivo, descanso o cierre
                  </p>
                </div>
              </button>

              {/* 4. NOVEDAD ESPECIAL */}
              <button
                type="button"
                onClick={() => {
                  setLiveStatus("SPECIAL_NOTICE");
                  if (!statusMessage) setStatusMessage("Hoy atendemos en horario especial");
                }}
                className={`p-3.5 rounded-2xl border text-left transition flex items-start gap-3 ${
                  liveStatus === "SPECIAL_NOTICE"
                    ? "border-indigo-500 bg-indigo-50/70 ring-2 ring-indigo-500/20"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700 shrink-0">
                  <Megaphone className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-gray-900 flex items-center gap-1.5">
                    <span>📢 Novedad / Aviso</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Comunicado para tus clientes
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* MENSAJE O NOVEDAD PERSONALIZADA */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-gray-800">
                Mensaje o indicación para los clientes (Opcional):
              </label>
              {statusMessage && (
                <button
                  type="button"
                  onClick={() => setStatusMessage("")}
                  className="text-[11px] text-gray-400 hover:text-gray-600 underline"
                >
                  Borrar texto
                </button>
              )}
            </div>

            {/* BOTONES DE SUGERENCIA RÁPIDA */}
            {quickMessages[liveStatus] && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {quickMessages[liveStatus].map((msg, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleQuickMessageClick(msg)}
                    className="text-[11px] bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 text-gray-700 px-2.5 py-1 rounded-lg border border-gray-200 transition"
                  >
                    + {msg}
                  </button>
                ))}
              </div>
            )}

            <input
              type="text"
              placeholder="Ej. En almuerzo, volvemos a las 2:00 PM..."
              value={statusMessage}
              onChange={(e) => setStatusMessage(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium"
            />
          </div>

          {/* VISTA PREVIA DE LO QUE VERÁ EL CLIENTE */}
          <div>
            <label className="text-[11px] font-bold text-gray-500 block mb-1.5">
              Vista previa del aviso en tu página web:
            </label>
            <div
              className={`p-3.5 rounded-2xl border text-xs flex items-center gap-3 ${
                liveStatus === "OPEN"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : liveStatus === "LUNCH"
                  ? "bg-amber-50 border-amber-200 text-amber-900"
                  : liveStatus === "CLOSED_TODAY"
                  ? "bg-rose-50 border-rose-200 text-rose-900"
                  : "bg-indigo-50 border-indigo-200 text-indigo-900"
              }`}
            >
              <div className="text-base shrink-0">
                {liveStatus === "OPEN" && "🟢"}
                {liveStatus === "LUNCH" && "🍽️"}
                {liveStatus === "CLOSED_TODAY" && "🔴"}
                {liveStatus === "SPECIAL_NOTICE" && "📢"}
              </div>
              <div className="flex-1">
                <p className="font-bold">
                  {liveStatus === "OPEN" && "Establecimiento Abierto"}
                  {liveStatus === "LUNCH" && "Pausa de Almuerzo / Descanso"}
                  {liveStatus === "CLOSED_TODAY" && "Cerrado por Hoy / Festivo"}
                  {liveStatus === "SPECIAL_NOTICE" && "Aviso del Establecimiento"}
                </p>
                <p className="text-[11px] opacity-90 mt-0.5">
                  {statusMessage ||
                    (liveStatus === "OPEN"
                      ? "Atendiendo turnos con normalidad."
                      : "Puedes reservar tu cita para los próximos horarios disponibles.")}
                </p>
              </div>
            </div>
          </div>

          {/* BOTONES DE ACCIÓN */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Actualizar Estado en Vivo ✓"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

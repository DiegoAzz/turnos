"use client";

import { useState, useEffect } from "react";
import { Clock, Check, X, AlertCircle, Calendar, Sparkles } from "lucide-react";

interface WorkingHour {
  id?: string;
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

interface WorkingHoursModalProps {
  business: any;
  onClose: () => void;
  onSaved?: (updatedHours: WorkingHour[]) => void;
}

const DAY_LABELS = [
  { dayOfWeek: 1, label: "Lunes" },
  { dayOfWeek: 2, label: "Martes" },
  { dayOfWeek: 3, label: "Miércoles" },
  { dayOfWeek: 4, label: "Jueves" },
  { dayOfWeek: 5, label: "Viernes" },
  { dayOfWeek: 6, label: "Sábado" },
  { dayOfWeek: 0, label: "Domingo" },
];

export default function WorkingHoursModal({
  business,
  onClose,
  onSaved,
}: WorkingHoursModalProps) {
  const [hours, setHours] = useState<WorkingHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadHours() {
      try {
        setLoading(true);
        const res = await fetch(`/api/business/working-hours?businessId=${business.id}`);
        if (!res.ok) throw new Error("Error cargando horarios");
        const data = await res.json();
        if (data.workingHours) {
          setHours(data.workingHours);
        }
      } catch (err: any) {
        setError(err.message || "No se pudieron cargar los horarios.");
      } finally {
        setLoading(false);
      }
    }
    loadHours();
  }, [business.id]);

  const handleToggleDay = (dayOfWeek: number) => {
    setHours((prev) =>
      prev.map((h) =>
        h.dayOfWeek === dayOfWeek ? { ...h, isClosed: !h.isClosed } : h
      )
    );
  };

  const applyPreset = (presetType: "MON_SAT" | "WED_SUN" | "WEEKEND" | "ALL") => {
    setHours((prev) =>
      prev.map((h) => {
        let isClosed = false;
        if (presetType === "MON_SAT") {
          isClosed = h.dayOfWeek === 0; // Domingo cerrado
        } else if (presetType === "WED_SUN") {
          isClosed = h.dayOfWeek === 1 || h.dayOfWeek === 2; // Lunes y Martes cerrado
        } else if (presetType === "WEEKEND") {
          isClosed = ![5, 6, 0].includes(h.dayOfWeek); // Solo Viernes, Sábado y Domingo
        } else if (presetType === "ALL") {
          isClosed = false;
        }
        return { ...h, isClosed };
      })
    );
  };

  const copyFirstDayHoursToAll = () => {
    const firstOpen = hours.find((h) => !h.isClosed) || hours[0];
    if (!firstOpen) return;
    setHours((prev) =>
      prev.map((h) => ({
        ...h,
        openTime: firstOpen.openTime,
        closeTime: firstOpen.closeTime,
      }))
    );
  };

  const handleTimeChange = (
    dayOfWeek: number,
    field: "openTime" | "closeTime",
    value: string
  ) => {
    setHours((prev) =>
      prev.map((h) => (h.dayOfWeek === dayOfWeek ? { ...h, [field]: value } : h))
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/business/working-hours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business.id,
          hours,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar horarios");

      setSuccess(true);
      if (onSaved) onSaved(data.workingHours);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-gray-900">
                Horario Semanal & Días de Atención
              </h3>
              <p className="text-xs text-gray-500">
                Define qué días abres y cuáles cierras para evitar que reserven en tus descansos.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center gap-2">
            <Check className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>¡Horarios guardados con éxito! Actualizando calendario...</span>
          </div>
        )}

        {/* PLANTILLAS RÁPIDAS PARA DEFINIR SEMANALMENTE (IDEAL PARA MANICURISTAS Y BARBEROS) */}
        {!loading && (
          <div className="mt-4 p-3 bg-teal-50/70 border border-teal-100 rounded-2xl">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-teal-900 flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-teal-600" />
                <span>Ajuste Rápido de Esta Semana:</span>
              </span>
              <button
                type="button"
                onClick={copyFirstDayHoursToAll}
                className="text-[10px] text-teal-800 font-bold hover:underline"
              >
                Copiar horas a todos los abiertos
              </button>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              <button
                type="button"
                onClick={() => applyPreset("MON_SAT")}
                className="px-2.5 py-1 bg-white border border-teal-200 text-teal-900 hover:bg-teal-100/70 rounded-lg text-[10px] font-bold shadow-xs shrink-0"
              >
                Lun a Sáb (Dom cerrado)
              </button>
              <button
                type="button"
                onClick={() => applyPreset("WED_SUN")}
                className="px-2.5 py-1 bg-white border border-teal-200 text-teal-900 hover:bg-teal-100/70 rounded-lg text-[10px] font-bold shadow-xs shrink-0"
              >
                Mié a Dom (Lun/Mar descanso)
              </button>
              <button
                type="button"
                onClick={() => applyPreset("WEEKEND")}
                className="px-2.5 py-1 bg-white border border-teal-200 text-teal-900 hover:bg-teal-100/70 rounded-lg text-[10px] font-bold shadow-xs shrink-0"
              >
                Vie a Dom (Fin de semana)
              </button>
              <button
                type="button"
                onClick={() => applyPreset("ALL")}
                className="px-2.5 py-1 bg-white border border-teal-200 text-teal-900 hover:bg-teal-100/70 rounded-lg text-[10px] font-bold shadow-xs shrink-0"
              >
                Todos los días
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-xs text-gray-500">
            Cargando configuración de horarios...
          </div>
        ) : (
          <form onSubmit={handleSave} className="mt-4 space-y-3">
            {DAY_LABELS.map(({ dayOfWeek, label }) => {
              const dayData = hours.find((h) => h.dayOfWeek === dayOfWeek) || {
                dayOfWeek,
                openTime: "09:00",
                closeTime: "19:00",
                isClosed: dayOfWeek === 0,
              };

              const isClosed = dayData.isClosed;

              return (
                <div
                  key={dayOfWeek}
                  className={`p-3.5 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isClosed
                      ? "bg-gray-50 border-gray-200 opacity-70"
                      : "bg-white border-emerald-200/80 shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between sm:justify-start gap-3">
                    <button
                      type="button"
                      onClick={() => handleToggleDay(dayOfWeek)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        !isClosed ? "bg-emerald-600" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          !isClosed ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>

                    <div>
                      <span className="font-extrabold text-sm text-gray-900 block">
                        {label}
                      </span>
                      <span className="text-[11px] text-gray-500">
                        {!isClosed ? (
                          <span className="text-emerald-700 font-semibold">● Abierto</span>
                        ) : (
                          <span className="text-rose-600 font-semibold">✕ Cerrado todo el día</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {!isClosed ? (
                    <div className="flex items-center gap-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-500">De:</span>
                        <input
                          type="time"
                          value={dayData.openTime}
                          onChange={(e) =>
                            handleTimeChange(dayOfWeek, "openTime", e.target.value)
                          }
                          className="px-2.5 py-1.5 rounded-xl border border-gray-300 bg-white text-xs font-semibold text-gray-900 focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                      <span className="text-gray-400">a</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="time"
                          value={dayData.closeTime}
                          onChange={(e) =>
                            handleTimeChange(dayOfWeek, "closeTime", e.target.value)
                          }
                          className="px-2.5 py-1.5 rounded-xl border border-gray-300 bg-white text-xs font-semibold text-gray-900 focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 font-medium italic">
                      No se recibirán turnos este día
                    </span>
                  )}
                </div>
              );
            })}

            <div className="pt-4 flex items-center justify-between border-t border-gray-100">
              <span className="text-[11px] text-gray-500">
                Los días marcados como "Cerrado" aparecerán deshabilitados para tus clientes.
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ backgroundColor: "#059669", color: "#ffffff" }}
                  className="px-5 py-2 text-xs font-bold text-white rounded-xl shadow-md hover:opacity-90 transition disabled:opacity-50"
                >
                  {saving ? "Guardando..." : "Guardar Horarios"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

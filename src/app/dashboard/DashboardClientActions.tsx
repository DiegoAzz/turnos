"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircle, Check, X, Bell, Volume2, VolumeX, Sparkles, Settings } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import ReminderSettingsModal from "@/components/ReminderSettingsModal";

// Función para reproducir sonido de campana/ding nativo con Web Audio API
function playChimeSound() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    // Primer tono (Agudo)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    gain1.gain.setValueAtTime(0.3, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.6);

    // Segundo tono (Armónico alegre)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
    gain2.gain.setValueAtTime(0.35, ctx.currentTime + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.15);
    osc2.stop(ctx.currentTime + 0.9);
  } catch (e) {
    console.warn("AudioContext no disponible o bloqueado por el navegador:", e);
  }
}

// Formatear teléfono para mostrar con formato limpio (ej. +57 310 601 7261)
function formatDisplayPhone(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, "");
  if (digits.length === 12 && digits.startsWith("57")) {
    return `+57 ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
  }
  if (digits.length === 10 && digits.startsWith("3")) {
    return `+57 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  return phone;
}

export default function DashboardClientActions({
  initialAppointments,
  business,
}: {
  initialAppointments: any[];
  business: any;
}) {
  const [appointments, setAppointments] = useState<any[]>(initialAppointments || []);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [newAppointmentNotification, setNewAppointmentNotification] = useState<any | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentBusiness, setCurrentBusiness] = useState(business);

  // Referencia para recordar los IDs ya conocidos
  const knownIdsRef = useRef<Set<string>>(
    new Set((initialAppointments || []).map((a) => a.id))
  );

  // Efecto para sondear (polling) citas nuevas en tiempo real cada 5 segundos
  useEffect(() => {
    if (!business?.id) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/appointments?businessId=${business.id}`);
        if (!res.ok) return;
        const data = await res.json();
        const incomingList: any[] = data.appointments || [];

        // Detectar si hay alguna cita cuyo ID no conocíamos
        const newOnes = incomingList.filter((a) => !knownIdsRef.current.has(a.id));

        if (newOnes.length > 0) {
          // Tomamos la más reciente
          const latest = newOnes[0];

          // Sonar alerta
          if (soundEnabled) {
            playChimeSound();
          }

          // Vibrar en celulares si está soportado
          if (typeof window !== "undefined" && "vibrate" in navigator) {
            try {
              navigator.vibrate([200, 100, 200]);
            } catch (_) {}
          }

          // Mostrar notificación flotante
          setNewAppointmentNotification(latest);

          // Agregar nuevos IDs al registro
          newOnes.forEach((n) => knownIdsRef.current.add(n.id));

          // Actualizar lista en pantalla
          setAppointments(incomingList);

          // Quitar notificación tras 7 segundos
          setTimeout(() => {
            setNewAppointmentNotification((current: any) =>
              current?.id === latest.id ? null : current
            );
          }, 7000);
        }
      } catch (err) {
        console.error("Error al sincronizar citas en vivo:", err);
      }
    }, 5000); // Consulta cada 5 segundos

    return () => clearInterval(interval);
  }, [business?.id, soundEnabled]);

  // Manejar envío de recordatorio por WhatsApp
  const handleSendReminder = async (appointment: any) => {
    try {
      setLoadingId(appointment.id);
      const res = await fetch(`/api/appointments/${appointment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reminderSent: true }),
      });

      const data = await res.json();
      if (res.ok && data.reminderUrl) {
        setAppointments((prev) =>
          prev.map((a) => (a.id === appointment.id ? { ...a, reminderSent: true } : a))
        );
        window.open(data.reminderUrl, "_blank");
      }
    } catch (err) {
      console.error(err);
      alert("Error al enviar recordatorio");
    } finally {
      setLoadingId(null);
    }
  };

  // Cambiar estado de la cita
  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      setLoadingId(id);
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setAppointments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
        );
      }
    } catch (err) {
      console.error(err);
      alert("Error al actualizar estado");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="relative">
      {/* NOTIFICACIÓN FLOTANTE DE NUEVO TURNO EN TIEMPO REAL */}
      {newAppointmentNotification && (
        <div className="fixed top-6 right-6 z-50 animate-bounce max-w-sm w-full bg-emerald-600 text-white p-4 rounded-2xl shadow-2xl border-2 border-emerald-400 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-white/20 rounded-xl mt-0.5 animate-pulse">
              <Bell className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="font-extrabold text-sm flex items-center gap-1.5">
                <span>¡Nuevo Turno Recibido!</span>
                <span className="text-xs bg-white text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                  {newAppointmentNotification.startTime}
                </span>
              </div>
              <p className="text-xs mt-1 text-emerald-100">
                <strong>{newAppointmentNotification.clientName}</strong> reservó{" "}
                <em>{newAppointmentNotification.service?.name}</em>.
              </p>
            </div>
          </div>
          <button
            onClick={() => setNewAppointmentNotification(null)}
            className="text-white/80 hover:text-white p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* BARRA SUPERIOR DE ESTADO EN VIVO Y CONTROL DE SONIDO */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 text-xs">
        <div className="flex items-center gap-2 text-emerald-700 font-semibold bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Sincronización en vivo activa (Alertas en tiempo real)</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition shadow-sm"
            title="Configurar recordatorios automáticos de WhatsApp"
          >
            <Settings className="h-3.5 w-3.5 text-emerald-600" />
            <span>⚙️ Recordatorios WhatsApp</span>
          </button>

          <button
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              if (next) playChimeSound();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold border transition ${
              soundEnabled
                ? "bg-slate-900 text-white border-slate-800 hover:bg-slate-800"
                : "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200"
            }`}
            title="Activar/Desactivar sonido de nuevo turno"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Sonido: Activado</span>
              </>
            ) : (
              <>
                <VolumeX className="h-3.5 w-3.5 text-gray-400" />
                <span>Sonido: Silenciado</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* MODAL CONFIGURACIÓN RECORDATORIOS */}
      {isSettingsOpen && (
        <ReminderSettingsModal
          business={currentBusiness}
          onClose={() => setIsSettingsOpen(false)}
          onSaved={(updated) => setCurrentBusiness(updated)}
        />
      )}

      {/* TABLA DE CITAS */}
      <div className="overflow-x-auto mt-4">
        {appointments.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="font-semibold text-gray-600">Aún no hay citas registradas</p>
            <p className="text-xs mt-1">
              Las citas que tus clientes reserven en tu enlace público aparecerán aquí automáticamente con sonido.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50/70 text-xs font-semibold text-gray-500">
              <tr>
                <th className="py-3 px-4">Hora</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Servicio</th>
                <th className="py-3 px-4">Precio</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones WhatsApp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {appointments.map((appointment) => {
                const isCompleted = appointment.status === "COMPLETED";
                const isCancelled = appointment.status === "CANCELLED";

                return (
                  <tr key={appointment.id} className="hover:bg-gray-50/50 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                      {appointment.startTime}
                      <span className="block text-[11px] font-normal text-gray-400">
                        hasta {appointment.endTime}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-gray-900">{appointment.clientName}</span>
                      <span className="block text-xs text-emerald-700 font-mono font-medium">
                        {formatDisplayPhone(appointment.clientPhone)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-medium text-gray-800">{appointment.service?.name}</span>
                      <span className="block text-xs text-gray-400">
                        {appointment.service?.durationMinutes} min
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-gray-900">
                      {formatCurrency(appointment.service?.price || 0, business?.currency || "COP")}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          appointment.status === "CONFIRMED"
                            ? "bg-emerald-100 text-emerald-800"
                            : appointment.status === "COMPLETED"
                            ? "bg-blue-100 text-blue-800"
                            : appointment.status === "CANCELLED"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {appointment.status === "CONFIRMED" && "Confirmada"}
                        {appointment.status === "COMPLETED" && "Completada"}
                        {appointment.status === "CANCELLED" && "Cancelada"}
                        {appointment.status === "PENDING" && "Pendiente"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      {/* Boton Enviar Recordatorio WhatsApp */}
                      <button
                        onClick={() => handleSendReminder(appointment)}
                        disabled={loadingId === appointment.id || isCancelled}
                        title="Enviar recordatorio por WhatsApp con el número corregido"
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold shadow-sm transition ${
                          appointment.reminderSent
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                            : "bg-emerald-600 text-white hover:bg-emerald-500"
                        }`}
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        {appointment.reminderSent ? "Recordatorio Enviado" : "Enviar WhatsApp"}
                      </button>

                      {/* Marcar como Completada */}
                      {!isCompleted && !isCancelled && (
                        <button
                          onClick={() => handleStatusChange(appointment.id, "COMPLETED")}
                          title="Marcar como atendida / completada"
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 transition"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}

                      {/* Cancelar Cita */}
                      {!isCancelled && !isCompleted && (
                        <button
                          onClick={() => handleStatusChange(appointment.id, "CANCELLED")}
                          title="Cancelar turno"
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import {
  MessageCircle,
  Check,
  X,
  Bell,
  Volume2,
  VolumeX,
  Settings,
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Palette,
  Activity,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import ReminderSettingsModal from "@/components/ReminderSettingsModal";
import LiveStatusModal from "@/components/LiveStatusModal";
import BusinessProfileModal from "@/components/BusinessProfileModal";
import {
  playAlertChime,
  unlockAudio,
  requestSystemNotificationPermission,
  showSystemNotification,
} from "@/lib/sound";

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

const SPANISH_MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const SPANISH_DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

// Formatear la fecha en que está agendada la cita
function formatAppointmentDate(dateInput: string | Date | undefined): string {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";

  const dateStr = typeof dateInput === "string" ? dateInput : d.toISOString();
  const [yearStr, monthStr, dayStr] = dateStr.slice(0, 10).split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);

  const targetDate = new Date(year, month, day);
  const dayOfWeek = SPANISH_DAYS[targetDate.getDay()];
  const monthName = SPANISH_MONTHS[month];

  const today = new Date();
  const isToday =
    today.getFullYear() === year &&
    today.getMonth() === month &&
    today.getDate() === day;

  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const isTomorrow =
    tomorrow.getFullYear() === year &&
    tomorrow.getMonth() === month &&
    tomorrow.getDate() === day;

  if (isToday) return `Hoy (${day} ${monthName})`;
  if (isTomorrow) return `Mañana (${day} ${monthName})`;
  return `${dayOfWeek}, ${day} ${monthName} ${year}`;
}

// Formatear cuándo fue reservada/creada la cita por el cliente
function formatCreatedAt(createdAtInput: string | Date | undefined): string {
  if (!createdAtInput) return "";
  const d = new Date(createdAtInput);
  if (isNaN(d.getTime())) return "";

  const day = d.getDate().toString().padStart(2, "0");
  const monthName = SPANISH_MONTHS[d.getMonth()];
  let hours = d.getHours();
  const mins = d.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;

  return `${day} ${monthName}, ${hours}:${mins} ${ampm}`;
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
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [currentBusiness, setCurrentBusiness] = useState(business);
  const [confirmModal, setConfirmModal] = useState<{
    appointment: any;
    action: "COMPLETED" | "CANCELLED";
  } | null>(null);

  // Referencia para recordar los IDs ya conocidos
  const knownIdsRef = useRef<Set<string>>(
    new Set((initialAppointments || []).map((a) => a.id))
  );

  // 1. Desbloquear audio del navegador al primer clic o toque en cualquier parte
  useEffect(() => {
    const handleFirstUserInteraction = () => {
      unlockAudio();
      requestSystemNotificationPermission();
    };

    window.addEventListener("click", handleFirstUserInteraction, { once: true });
    window.addEventListener("touchstart", handleFirstUserInteraction, { once: true });

    return () => {
      window.removeEventListener("click", handleFirstUserInteraction);
      window.removeEventListener("touchstart", handleFirstUserInteraction);
    };
  }, []);

  // 2. Efecto para sondear (polling) citas nuevas en tiempo real cada 4 segundos
  useEffect(() => {
    if (!business?.id) return;

    let titleInterval: any = null;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/appointments?businessId=${business.id}`);
        if (!res.ok) return;
        const data = await res.json();
        const incomingList: any[] = data.appointments || [];

        // Detectar si hay alguna cita cuyo ID no conocíamos
        const newOnes = incomingList.filter((a) => !knownIdsRef.current.has(a.id));

        if (newOnes.length > 0) {
          const latest = newOnes[0];

          // 🔊 Sonar alerta garantizada (en primer plano y segundo plano)
          if (soundEnabled) {
            playAlertChime();
          }

          // 📳 Vibrar en celulares si está soportado
          if (typeof window !== "undefined" && "vibrate" in navigator) {
            try {
              navigator.vibrate([300, 150, 300]);
            } catch (_) {}
          }

          // 💻 Notificación nativa del Sistema Operativo (Windows/Mac/Android)
          showSystemNotification(
            "🔔 ¡Nuevo Turno en TurnoYa!",
            `${latest.clientName} agendó ${latest.service?.name || "un servicio"} para las ${latest.startTime}`
          );

          // 🏷️ Parpadear el título de la pestaña del navegador para llamar la atención si está en otra página
          if (typeof document !== "undefined") {
            const originalTitle = document.title;
            let toggle = false;
            titleInterval = setInterval(() => {
              document.title = toggle ? "🔔 (1) ¡NUEVO TURNO!" : originalTitle;
              toggle = !toggle;
            }, 1000);

            // Detener parpadeo después de 15 segundos
            setTimeout(() => {
              if (titleInterval) clearInterval(titleInterval);
              document.title = originalTitle;
            }, 15000);
          }

          // Mostrar notificación flotante interna
          setNewAppointmentNotification(latest);

          // Registrar IDs para no repetir alerta
          newOnes.forEach((n) => knownIdsRef.current.add(n.id));

          // Actualizar lista en pantalla
          setAppointments(incomingList);

          // Quitar notificación flotante tras 8 segundos
          setTimeout(() => {
            setNewAppointmentNotification((current: any) =>
              current?.id === latest.id ? null : current
            );
          }, 8000);
        }
      } catch (err) {
        console.error("Error al sincronizar citas en vivo:", err);
      }
    }, 4000); // Consulta cada 4 segundos

    return () => {
      clearInterval(interval);
      if (titleInterval) clearInterval(titleInterval);
    };
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3 text-xs">
        <div className="flex items-center gap-2 text-emerald-700 font-semibold bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Alertas en tiempo real activas (Suena en segundo plano)</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* BOTÓN ESTADO EN VIVO */}
          <button
            onClick={() => setIsStatusOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold border transition shadow-sm ${
              currentBusiness.liveStatus === "LUNCH"
                ? "bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100"
                : currentBusiness.liveStatus === "CLOSED_TODAY"
                ? "bg-rose-50 text-rose-900 border-rose-300 hover:bg-rose-100"
                : currentBusiness.liveStatus === "NOTICE"
                ? "bg-blue-50 text-blue-900 border-blue-300 hover:bg-blue-100"
                : "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
            }`}
            title="Cambiar estado en vivo visible para tus clientes"
          >
            <span>
              {currentBusiness.liveStatus === "LUNCH"
                ? "🟡 En Almuerzo"
                : currentBusiness.liveStatus === "CLOSED_TODAY"
                ? "🔴 Cerrado Hoy"
                : currentBusiness.liveStatus === "NOTICE"
                ? "📢 Novedad"
                : "🟢 Abierto"}
            </span>
          </button>

          {/* BOTÓN EDITAR PERFIL & LOGO */}
          <button
            onClick={() => setIsProfileOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition shadow-sm"
            title="Personalizar logo, nombre, WhatsApp y dirección del negocio"
          >
            <Palette className="h-3.5 w-3.5 text-emerald-600" />
            <span>Perfil & Logo</span>
          </button>

          {/* BOTÓN CONFIGURACIÓN RECORDATORIOS */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition shadow-sm"
            title="Configurar recordatorios automáticos de WhatsApp"
          >
            <Settings className="h-3.5 w-3.5 text-emerald-600" />
            <span>WhatsApp</span>
          </button>

          {/* BOTÓN PROBAR / ACTIVAR SONIDO */}
          <button
            onClick={() => {
              unlockAudio();
              requestSystemNotificationPermission();
              const next = !soundEnabled;
              setSoundEnabled(next);
              if (next) playAlertChime();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold border transition ${
              soundEnabled
                ? "bg-slate-900 text-white border-slate-800 hover:bg-slate-800"
                : "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200"
            }`}
            title="Probar y asegurar sonido en segundo plano"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Sonido: Activado (Probar 🔔)</span>
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

      {/* MODAL ESTADO EN VIVO */}
      {isStatusOpen && (
        <LiveStatusModal
          business={currentBusiness}
          onClose={() => setIsStatusOpen(false)}
          onSaved={(updated) => setCurrentBusiness(updated)}
        />
      )}

      {/* MODAL PERFIL DEL NEGOCIO & LOGO */}
      {isProfileOpen && (
        <BusinessProfileModal
          business={currentBusiness}
          onClose={() => setIsProfileOpen(false)}
          onSaved={(updated) => setCurrentBusiness(updated)}
        />
      )}

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
                <th className="py-3 px-4">Fecha & Horario</th>
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
                    <td className="py-3.5 px-4">
                      {/* Fecha agendada de la cita */}
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
                        <Calendar className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>{formatAppointmentDate(appointment.date)}</span>
                      </div>

                      {/* Horario del turno */}
                      <div className="text-xs font-mono font-semibold text-emerald-800 mt-0.5">
                        {appointment.startTime}
                        <span className="text-[11px] font-normal text-gray-400 ml-1">
                          (hasta {appointment.endTime})
                        </span>
                      </div>

                      {/* Cuándo tomó la cita el cliente */}
                      {appointment.createdAt && (
                        <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5 text-gray-400 shrink-0" />
                          <span>Tomada: {formatCreatedAt(appointment.createdAt)}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-gray-900">{appointment.clientName}</span>
                        {appointment.appointmentType === "DOMICILIO" && (
                          <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-1.5 py-0.5 rounded-md">
                            🚗 Domicilio
                          </span>
                        )}
                      </div>
                      <span className="block text-xs text-emerald-700 font-mono font-medium">
                        {formatDisplayPhone(appointment.clientPhone)}
                      </span>
                      {appointment.clientAddress && (
                        <span className="block text-[11px] text-gray-500 mt-0.5 max-w-xs truncate" title={appointment.clientAddress}>
                          📍 {appointment.clientAddress}
                        </span>
                      )}
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

                      {/* Marcar como Completada con Modal de Confirmación */}
                      {!isCompleted && !isCancelled && (
                        <button
                          onClick={() => setConfirmModal({ appointment, action: "COMPLETED" })}
                          title="Marcar como atendida / completada"
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}

                      {/* Cancelar Cita con Modal de Confirmación */}
                      {!isCancelled && !isCompleted && (
                        <button
                          onClick={() => setConfirmModal({ appointment, action: "CANCELLED" })}
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

      {/* VENTANA MODAL DE CONFIRMACIÓN PARA COMPLETAR O CANCELAR CITA */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative">
            <div className="flex items-start gap-3.5 mb-4">
              <div
                className={`p-3 rounded-2xl shrink-0 ${
                  confirmModal.action === "COMPLETED"
                    ? "bg-blue-50 text-blue-600"
                    : "bg-rose-50 text-rose-600"
                }`}
              >
                {confirmModal.action === "COMPLETED" ? (
                  <CheckCircle2 className="h-6 w-6" />
                ) : (
                  <AlertTriangle className="h-6 w-6" />
                )}
              </div>
              <div>
                <h3 className="font-extrabold text-gray-900 text-base">
                  {confirmModal.action === "COMPLETED"
                    ? "¿Marcar cita como atendida?"
                    : "¿Seguro que deseas cancelar este turno?"}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {confirmModal.action === "COMPLETED"
                    ? "El cliente fue atendido con éxito y la cita se registrará como completada."
                    : "El turno quedará marcado como cancelado en tu agenda y el horario se liberará."}
                </p>
              </div>
            </div>

            {/* Ficha Resumen de la Cita */}
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200/70 mb-5 text-xs space-y-2 text-gray-700">
              <div className="flex justify-between items-center pb-1.5 border-b border-gray-200/60">
                <span className="text-gray-500 font-medium">Cliente:</span>
                <span className="font-bold text-gray-900">{confirmModal.appointment.clientName}</span>
              </div>
              <div className="flex justify-between items-center pb-1.5 border-b border-gray-200/60">
                <span className="text-gray-500 font-medium">Servicio:</span>
                <span className="font-semibold text-gray-800">{confirmModal.appointment.service?.name}</span>
              </div>
              <div className="flex justify-between items-center pb-1.5 border-b border-gray-200/60">
                <span className="text-gray-500 font-medium">Fecha de la cita:</span>
                <span className="font-bold text-emerald-800">
                  {formatAppointmentDate(confirmModal.appointment.date)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium">Horario:</span>
                <span className="font-mono font-bold text-gray-900">
                  {confirmModal.appointment.startTime} - {confirmModal.appointment.endTime}
                </span>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
              >
                Volver
              </button>

              <button
                type="button"
                disabled={loadingId === confirmModal.appointment.id}
                onClick={async () => {
                  const appointmentId = confirmModal.appointment.id;
                  const targetAction = confirmModal.action;
                  setConfirmModal(null);
                  await handleStatusChange(appointmentId, targetAction);
                }}
                className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-md transition ${
                  confirmModal.action === "COMPLETED"
                    ? "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20"
                    : "bg-rose-600 hover:bg-rose-700 shadow-rose-500/20"
                }`}
              >
                {confirmModal.action === "COMPLETED"
                  ? "Sí, marcar completada ✓"
                  : "Sí, cancelar turno ✕"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

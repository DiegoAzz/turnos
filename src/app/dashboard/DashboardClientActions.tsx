"use client";

import { useState } from "react";
import { MessageCircle, Check, X, Clock, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function DashboardClientActions({
  initialAppointments,
  business,
}: {
  initialAppointments: any[];
  business: any;
}) {
  const [appointments, setAppointments] = useState(initialAppointments);
  const [loadingId, setLoadingId] = useState<string | null>(null);

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
        // Actualizar estado local
        setAppointments((prev) =>
          prev.map((a) => (a.id === appointment.id ? { ...a, reminderSent: true } : a))
        );
        // Abrir WhatsApp con el mensaje pre-cargado
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
    <div className="overflow-x-auto">
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
                  <span className="block text-xs text-gray-400 font-mono">
                    {appointment.clientPhone}
                  </span>
                </td>

                <td className="py-3.5 px-4">
                  <span className="font-medium text-gray-800">{appointment.service?.name}</span>
                  <span className="block text-xs text-gray-400">
                    {appointment.service?.durationMinutes} min
                  </span>
                </td>

                <td className="py-3.5 px-4 font-bold text-gray-900">
                  {formatCurrency(appointment.service?.price || 0, business.currency)}
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
                    title="Enviar recordatorio automático por WhatsApp"
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
    </div>
  );
}

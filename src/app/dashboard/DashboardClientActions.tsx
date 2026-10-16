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
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CalendarClock,
  RotateCcw,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import ReminderSettingsModal from "@/components/ReminderSettingsModal";
import LiveStatusModal from "@/components/LiveStatusModal";
import BusinessProfileModal from "@/components/BusinessProfileModal";
import OnboardingModal from "@/components/OnboardingModal";
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

// Verifica si una cita corresponde a la fecha de hoy
function isAppointmentToday(dateInput: string | Date | undefined): boolean {
  if (!dateInput) return false;
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return false;
  const dateStr = typeof dateInput === "string" ? dateInput : d.toISOString();
  const [yearStr, monthStr, dayStr] = dateStr.slice(0, 10).split("-");
  const today = new Date();
  return (
    today.getFullYear() === parseInt(yearStr, 10) &&
    today.getMonth() === parseInt(monthStr, 10) - 1 &&
    today.getDate() === parseInt(dayStr, 10)
  );
}

// Sumar minutos a una hora HH:mm
function addMinutesToTime(timeStr: string, minutes: number): string {
  if (!timeStr) return "";
  const clean = timeStr.trim();
  const parts = clean.split(":");
  let hours = parseInt(parts[0], 10) || 0;
  let mins = parseInt(parts[1], 10) || 0;
  if (clean.toUpperCase().includes("PM") && hours < 12) hours += 12;
  if (clean.toUpperCase().includes("AM") && hours === 12) hours = 0;

  const totalMins = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMins / 60) % 24;
  const newMins = totalMins % 60;
  return `${String(newHours).padStart(2, "0")}:${String(newMins).padStart(2, "0")}`;
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

// Extraer minutos de anticipación según la configuración guardada
function parseReminderTimingMinutes(timingStr?: string): number {
  if (!timingStr) return 15;
  if (timingStr === "15_MINUTES_BEFORE") return 15;
  if (timingStr === "30_MINUTES_BEFORE") return 30;
  if (timingStr === "1_HOUR_BEFORE") return 60;
  if (timingStr === "2_HOURS_BEFORE") return 120;
  if (timingStr === "24_HOURS_BEFORE") return 1440;
  if (timingStr.startsWith("CUSTOM_")) {
    const parts = timingStr.split("_");
    const val = parseInt(parts[1], 10) || 15;
    const unit = parts[2] || "MINUTES";
    if (unit === "HOURS") return val * 60;
    if (unit === "DAYS") return val * 1440;
    return val;
  }
  return 15;
}

// Calcular minutos restantes para una cita
function getMinutesUntilAppointment(app: any): number | null {
  if (!app?.date || !app?.startTime) return null;
  try {
    const dateStr = typeof app.date === "string" ? app.date : new Date(app.date).toISOString();
    const [yearStr, monthStr, dayStr] = dateStr.slice(0, 10).split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1;
    const day = parseInt(dayStr, 10);

    const parts = app.startTime.trim().split(":");
    let hours = parseInt(parts[0], 10);
    let mins = parseInt(parts[1], 10) || 0;

    if (app.startTime.toUpperCase().includes("PM") && hours < 12) hours += 12;
    if (app.startTime.toUpperCase().includes("AM") && hours === 12) hours = 0;

    const appDate = new Date(year, month, day, hours, mins, 0, 0);
    const now = new Date();

    const diffMs = appDate.getTime() - now.getTime();
    return Math.floor(diffMs / 60000);
  } catch {
    return null;
  }
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
  const [dueReminder, setDueReminder] = useState<{ appointment: any; diffMinutes: number } | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(() => {
    if (typeof window !== "undefined") {
      if (sessionStorage.getItem("turnoya_onboarding_dismissed")) {
        return false;
      }
    }
    return (
      !business?.category ||
      business.category === "PENDIENTE" ||
      Boolean(business?.name && business.name.toLowerCase().endsWith("(turnos)"))
    );
  });

  const handleCloseOnboarding = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("turnoya_onboarding_dismissed", "true");
    }
    setIsOnboardingOpen(false);
  };
  const [currentBusiness, setCurrentBusiness] = useState(business);

  // Modal de confirmación para Completar / Cancelar
  const [confirmModal, setConfirmModal] = useState<{
    appointment: any;
    action: "COMPLETED" | "CANCELLED";
  } | null>(null);

  // Estados de Búsqueda y Paginación Super Rápida
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "TODAY" | "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED"
  >("ALL");
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Estados del Modal de Reagendar (Opción 2 de WhatsApp)
  const [rescheduleModal, setRescheduleModal] = useState<any | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleStartTime, setRescheduleStartTime] = useState("");
  const [rescheduleEndTime, setRescheduleEndTime] = useState("");
  const [rescheduleNotes, setRescheduleNotes] = useState("");
  const [rescheduleSubmitting, setRescheduleSubmitting] = useState(false);
  const [rescheduleSuccess, setRescheduleSuccess] = useState<{
    appointment: any;
    whatsappUrl: string;
  } | null>(null);

  // Referencia para recordar los IDs ya conocidos
  const knownIdsRef = useRef<Set<string>>(
    new Set((initialAppointments || []).map((a) => a.id))
  );

  // Referencia para no disparar recordatorios duplicados repetidamente
  const remindedAlertedIdsRef = useRef<Set<string>>(new Set());

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
    }, 4000);

    return () => {
      clearInterval(interval);
      if (titleInterval) clearInterval(titleInterval);
    };
  }, [business?.id, soundEnabled]);

  // 3. Efecto para monitorear recordatorios automáticos según la anticipación configurada
  useEffect(() => {
    if (currentBusiness?.autoRemindersEnabled === false) return;

    const targetMinutes = parseReminderTimingMinutes(currentBusiness?.reminderTiming);

    const checkReminders = () => {
      for (const app of appointments) {
        if (app.status === "CANCELLED" || app.status === "COMPLETED" || app.reminderSent) {
          continue;
        }

        const diff = getMinutesUntilAppointment(app);
        if (diff !== null && diff <= targetMinutes && diff >= -30) {
          if (!remindedAlertedIdsRef.current.has(app.id)) {
            remindedAlertedIdsRef.current.add(app.id);

            // Alerta Sonora
            if (soundEnabled) {
              playAlertChime();
            }

            // Vibración en celulares
            if (typeof window !== "undefined" && "vibrate" in navigator) {
              try {
                navigator.vibrate([200, 100, 200]);
              } catch (_) {}
            }

            // Notificación del Sistema Operativo
            showSystemNotification(
              "⏰ ¡Momento de Enviar Recordatorio!",
              `${app.clientName} tiene turno a las ${app.startTime}. Toca para abrir WhatsApp.`
            );

            // Mostrar Banner Flotante de Acción Inmediata
            setDueReminder({ appointment: app, diffMinutes: diff });
            break;
          }
        }
      }
    };

    checkReminders();
    const reminderInterval = setInterval(checkReminders, 5000);
    return () => clearInterval(reminderInterval);
  }, [appointments, currentBusiness, soundEnabled]);

  // Resetear a página 1 cuando cambia la búsqueda, el filtro o el tamaño de página
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, pageSize]);

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

  // Cambiar estado de la cita (ej. PENDING -> CONFIRMED, o CANCELLED, COMPLETED)
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

  // Manejar apertura del modal de reagendamiento (Opción 2)
  const handleOpenReschedule = (appointment: any) => {
    setRescheduleSuccess(null);
    setRescheduleModal(appointment);

    let curDateStr = "";
    if (appointment.date) {
      const d = new Date(appointment.date);
      if (!isNaN(d.getTime())) {
        curDateStr = (typeof appointment.date === "string" ? appointment.date : d.toISOString()).slice(0, 10);
      }
    }
    if (!curDateStr) {
      curDateStr = new Date().toISOString().slice(0, 10);
    }
    setRescheduleDate(curDateStr);

    const start = appointment.startTime || "10:00";
    setRescheduleStartTime(start);
    const duration = appointment.service?.durationMinutes || 30;
    setRescheduleEndTime(appointment.endTime || addMinutesToTime(start, duration));
    setRescheduleNotes(appointment.clientNotes || "");
  };

  // Manejar cambio de hora de inicio con auto-cálculo de hora de fin
  const handleStartTimeChange = (newStartTime: string) => {
    setRescheduleStartTime(newStartTime);
    if (rescheduleModal) {
      const duration = rescheduleModal.service?.durationMinutes || 30;
      setRescheduleEndTime(addMinutesToTime(newStartTime, duration));
    }
  };

  // Guardar reagendamiento y generar mensaje de WhatsApp
  const handleSaveReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleModal || !rescheduleDate || !rescheduleStartTime) return;

    try {
      setRescheduleSubmitting(true);
      const res = await fetch(`/api/appointments/${rescheduleModal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: rescheduleDate,
          startTime: rescheduleStartTime,
          endTime: rescheduleEndTime,
          clientNotes: rescheduleNotes,
          status: "CONFIRMED",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al reagendar la cita");

      // Actualizar cita en el estado local
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === rescheduleModal.id
            ? {
                ...a,
                date: rescheduleDate,
                startTime: rescheduleStartTime,
                endTime: rescheduleEndTime,
                clientNotes: rescheduleNotes,
                status: "CONFIRMED",
                reminderSent: false,
              }
            : a
        )
      );

      // Generar mensaje directo para WhatsApp
      const rawPhone = (rescheduleModal.clientPhone || "").replace(/[^0-9]/g, "");
      const cleanPhone =
        rawPhone.length === 10 && rawPhone.startsWith("3") ? `57${rawPhone}` : rawPhone;
      const formattedDate = formatAppointmentDate(rescheduleDate);
      const addressText =
        rescheduleModal.appointmentType === "DOMICILIO"
          ? rescheduleModal.clientAddress || "A domicilio"
          : currentBusiness?.address || "Nuestro local";

      const whatsappText =
        `Hola *${rescheduleModal.clientName}*, te confirmamos que tu cita en *${currentBusiness?.name || "nuestro establecimiento"}* ha sido *REAGENDADA* con éxito:\n\n` +
        `🗓️ *Nueva Fecha:* ${formattedDate}\n` +
        `⏰ *Nuevo Horario:* ${rescheduleStartTime} - ${rescheduleEndTime}\n` +
        `💈 *Servicio:* ${rescheduleModal.service?.name || "Servicio"}\n` +
        `📍 *Dirección:* ${addressText}\n\n` +
        `¡Te esperamos! Si tienes cualquier inquietud, estamos atentos.`;

      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappText)}`;

      setRescheduleSuccess({
        appointment: {
          ...rescheduleModal,
          date: rescheduleDate,
          startTime: rescheduleStartTime,
          endTime: rescheduleEndTime,
        },
        whatsappUrl,
      });
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error al reagendar la cita");
    } finally {
      setRescheduleSubmitting(false);
    }
  };

  // Contadores para pestañas de filtro
  const totalCount = appointments.length;
  const todayCount = appointments.filter((a) => isAppointmentToday(a.date)).length;
  const pendingCount = appointments.filter((a) => a.status === "PENDING").length;
  const confirmedCount = appointments.filter((a) => a.status === "CONFIRMED").length;
  const completedCount = appointments.filter((a) => a.status === "COMPLETED").length;
  const cancelledCount = appointments.filter((a) => a.status === "CANCELLED").length;

  // Filtrar citas según búsqueda y estado
  const filteredAppointments = appointments.filter((app) => {
    // 1. Filtro por estado / Hoy
    if (statusFilter === "TODAY") {
      if (!isAppointmentToday(app.date)) return false;
    } else if (statusFilter !== "ALL") {
      if (app.status !== statusFilter) return false;
    }

    // 2. Filtro por texto de búsqueda
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase().trim();
    const clientName = (app.clientName || "").toLowerCase();
    const rawPhone = (app.clientPhone || "").replace(/[^0-9]/g, "");
    const formattedPhone = formatDisplayPhone(app.clientPhone || "").toLowerCase();
    const serviceName = (app.service?.name || "").toLowerCase();
    const startTime = (app.startTime || "").toLowerCase();
    const endTime = (app.endTime || "").toLowerCase();
    const dateFormatted = formatAppointmentDate(app.date).toLowerCase();
    const clientAddress = (app.clientAddress || "").toLowerCase();

    return (
      clientName.includes(query) ||
      rawPhone.includes(query) ||
      formattedPhone.includes(query) ||
      serviceName.includes(query) ||
      startTime.includes(query) ||
      endTime.includes(query) ||
      dateFormatted.includes(query) ||
      clientAddress.includes(query)
    );
  });

  // Cálculo de paginación super rápida
  const totalFiltered = filteredAppointments.length;
  const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(totalFiltered / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedAppointments =
    pageSize === -1
      ? filteredAppointments
      : filteredAppointments.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);

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

          {/* BOTÓN CONFIGURAR RUBRO & ESPECIALIDAD */}
          <button
            onClick={() => setIsOnboardingOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold border border-purple-200 bg-purple-50 text-purple-900 hover:bg-purple-100 transition shadow-sm"
            title="Cambiar rubro, profesión o servicios sugeridos de tu negocio"
          >
            <Sparkles className="h-3.5 w-3.5 text-purple-600" />
            <span>
              {currentBusiness.category === "MANICURA_SPA"
                ? "💅 Manicura & Spa"
                : currentBusiness.category === "SALUD_CONSULTORIO"
                ? "🩺 Salud & Consultorio"
                : currentBusiness.category === "LAVADERO"
                ? "🚗 Lavadero & Autos"
                : currentBusiness.category === "VETERINARIA"
                ? "🐾 Veterinaria"
                : currentBusiness.category === "OTRO"
                ? "⚡ Servicios"
                : "💈 Barbería"}
            </span>
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
              playAlertChime();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold border border-gray-900 bg-gray-900 text-white hover:bg-gray-800 transition shadow-sm"
            title="Probar sonido de notificación"
          >
            <Volume2 className="h-3.5 w-3.5 text-amber-400" />
            <span>{soundEnabled ? "Sonido: Activado (Probar 🔔)" : "Sonido Desactivado"}</span>
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

      {/* MODAL ESTADO EN VIVO */}
      {isStatusOpen && (
        <LiveStatusModal
          business={currentBusiness}
          onClose={() => setIsStatusOpen(false)}
          onSaved={(updated) => setCurrentBusiness(updated)}
        />
      )}

      {/* MODAL PERFIL & LOGO */}
      {isProfileOpen && (
        <BusinessProfileModal
          business={currentBusiness}
          onClose={() => setIsProfileOpen(false)}
          onSaved={(updated) => setCurrentBusiness(updated)}
        />
      )}

      {/* ASISTENTE ONBOARDING DE RUBRO */}
      {isOnboardingOpen && (
        <OnboardingModal
          business={currentBusiness}
          onClose={handleCloseOnboarding}
          onComplete={(updated) => {
            setCurrentBusiness(updated);
            setIsOnboardingOpen(false);
            window.location.reload();
          }}
        />
      )}

      {/* BANNER DE RECORDATORIO DEBIDO EN TIEMPO REAL */}
      {dueReminder && (
        <div className="mt-4 p-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white rounded-2xl shadow-xl border-2 border-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl shrink-0">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="font-extrabold text-sm flex items-center gap-2">
                <span>⏰ ¡Momento de Enviar Recordatorio Automático!</span>
                <span className="bg-white text-orange-950 text-xs px-2 py-0.5 rounded-full font-bold">
                  {dueReminder.diffMinutes <= 0 ? "¡Turno Ahora!" : `Faltan ${dueReminder.diffMinutes} min`}
                </span>
              </div>
              <p className="text-xs text-amber-50 mt-0.5">
                Cliente: <strong>{dueReminder.appointment.clientName}</strong> · Turno: <strong>{dueReminder.appointment.startTime}</strong> ({dueReminder.appointment.service?.name})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => {
                handleSendReminder(dueReminder.appointment);
                setDueReminder(null);
              }}
              className="bg-white text-emerald-950 hover:bg-emerald-50 px-4 py-2 rounded-xl text-xs font-extrabold shadow flex items-center gap-1.5 transition"
            >
              <MessageCircle className="h-4 w-4 text-emerald-600" />
              <span>Enviar WhatsApp Ahora</span>
            </button>
            <button
              onClick={() => setDueReminder(null)}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl text-xs"
              title="Cerrar aviso"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* BARRA DE BÚSQUEDA Y PAGINACIÓN SUPER RÁPIDA */}
      <div className="mt-4 bg-gray-50/90 rounded-2xl p-3 sm:p-4 border border-gray-200/80 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* BUSCADOR INSTANTÁNEO */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por cliente, teléfono, servicio o fecha..."
              className="w-full pl-9 pr-9 py-2.5 text-xs bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-gray-900 placeholder-gray-400 shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-xs p-1"
                title="Limpiar búsqueda"
              >
                ✕
              </button>
            )}
          </div>

          {/* SELECTOR DE CITAS POR PÁGINA */}
          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto text-xs text-gray-500 font-medium">
            <span className="hidden sm:inline">Mostrar:</span>
            <div className="flex items-center rounded-xl bg-white border border-gray-200 p-0.5 shadow-sm">
              {[10, 25, 50, -1].map((size) => (
                <button
                  key={size}
                  onClick={() => setPageSize(size)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    pageSize === size
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {size === -1 ? "Todas" : size}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* PESTAÑAS DE FILTRO RÁPIDO */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition shrink-0 ${
              statusFilter === "ALL"
                ? "bg-gray-900 text-white shadow-sm"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
            }`}
          >
            <span>Todas</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                statusFilter === "ALL" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              {totalCount}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter("TODAY")}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition shrink-0 ${
              statusFilter === "TODAY"
                ? "bg-emerald-700 text-white shadow-sm"
                : "bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50"
            }`}
          >
            <span>📅 Citas de Hoy</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                statusFilter === "TODAY" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {todayCount}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter("PENDING")}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition shrink-0 ${
              statusFilter === "PENDING"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-white text-amber-800 border border-amber-200 hover:bg-amber-50"
            }`}
          >
            <span>Pendientes</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                statusFilter === "PENDING" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"
              }`}
            >
              {pendingCount}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter("CONFIRMED")}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition shrink-0 ${
              statusFilter === "CONFIRMED"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white text-emerald-700 border border-gray-200 hover:bg-gray-100"
            }`}
          >
            <span>Confirmadas</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                statusFilter === "CONFIRMED" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              {confirmedCount}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter("COMPLETED")}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition shrink-0 ${
              statusFilter === "COMPLETED"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-blue-700 border border-gray-200 hover:bg-gray-100"
            }`}
          >
            <span>Completadas</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                statusFilter === "COMPLETED" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              {completedCount}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter("CANCELLED")}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition shrink-0 ${
              statusFilter === "CANCELLED"
                ? "bg-rose-600 text-white shadow-sm"
                : "bg-white text-rose-700 border border-gray-200 hover:bg-gray-100"
            }`}
          >
            <span>Canceladas</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                statusFilter === "CANCELLED" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              {cancelledCount}
            </span>
          </button>

          {(searchQuery || statusFilter !== "ALL") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("ALL");
              }}
              className="text-xs text-gray-500 hover:text-gray-900 underline ml-2 font-medium shrink-0 flex items-center gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              Restablecer filtros
            </button>
          )}
        </div>
      </div>

      {/* TABLA DE CITAS */}
      <div className="overflow-x-auto mt-4">
        {filteredAppointments.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="font-semibold text-gray-700">No se encontraron citas</p>
            <p className="text-xs mt-1 text-gray-500">
              {searchQuery || statusFilter !== "ALL"
                ? "Prueba cambiando el término de búsqueda o seleccionando otro filtro."
                : "Las citas que tus clientes reserven en tu enlace público aparecerán aquí automáticamente."}
            </p>
            {(searchQuery || statusFilter !== "ALL") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("ALL");
                }}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Ver todas las citas</span>
              </button>
            )}
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
                <th className="py-3 px-4 text-right">Acciones WhatsApp & Gestión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedAppointments.map((appointment) => {
                const isCompleted = appointment.status === "COMPLETED";
                const isCancelled = appointment.status === "CANCELLED";
                const isPending = appointment.status === "PENDING";

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
                        <span
                          className="block text-[11px] text-gray-500 mt-0.5 max-w-xs truncate"
                          title={appointment.clientAddress}
                        >
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
                      {/* Opción 1 del cliente: Botón Confirmar Asistencia con 1 Clic si está PENDIENTE */}
                      {isPending && (
                        <button
                          onClick={() => handleStatusChange(appointment.id, "CONFIRMED")}
                          disabled={loadingId === appointment.id}
                          title="El cliente respondió 1: Confirmar Asistencia"
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Confirmar (1)</span>
                        </button>
                      )}

                      {/* Opción 2 del cliente: Botón Reagendar Cita (Fecha y Hora) */}
                      {!isCompleted && !isCancelled && (
                        <button
                          onClick={() => handleOpenReschedule(appointment)}
                          title="El cliente respondió 2: Reagendar Fecha u Horario"
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition shadow-sm"
                        >
                          <CalendarClock className="h-3.5 w-3.5 text-blue-600" />
                          <span className="hidden xl:inline">Reagendar (2)</span>
                        </button>
                      )}

                      {/* Botón Enviar Recordatorio WhatsApp */}
                      {(() => {
                        const diff = getMinutesUntilAppointment(appointment);
                        const targetMinutes = parseReminderTimingMinutes(currentBusiness?.reminderTiming);
                        const isDue =
                          diff !== null &&
                          diff <= targetMinutes &&
                          diff >= -30 &&
                          !appointment.reminderSent &&
                          !isCompleted &&
                          !isCancelled;

                        if (isDue) {
                          return (
                            <button
                              onClick={() => handleSendReminder(appointment)}
                              disabled={loadingId === appointment.id}
                              title="¡Es hora de enviar el recordatorio!"
                              className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md animate-pulse ring-2 ring-amber-300 ring-offset-1"
                            >
                              <Clock className="h-3.5 w-3.5" />
                              <span>⏰ Recordar ({diff <= 0 ? "¡Ahora!" : `${diff}m`})</span>
                            </button>
                          );
                        }

                        return (
                          <button
                            onClick={() => handleSendReminder(appointment)}
                            disabled={loadingId === appointment.id || isCancelled}
                            title="Enviar recordatorio por WhatsApp"
                            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold shadow-sm transition ${
                              appointment.reminderSent
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                                : "bg-emerald-600 text-white hover:bg-emerald-500"
                            }`}
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            {appointment.reminderSent ? "Recordatorio Enviado" : "Enviar WhatsApp"}
                          </button>
                        );
                      })()}

                      {/* Opción rápida SMS (Abre app nativa de SMS del celular sin costo adicional) */}
                      {appointment.clientPhone && !isCancelled && !isCompleted && (
                        <a
                          href={`sms:${appointment.clientPhone.replace(/[^0-9]/g, "")}?body=${encodeURIComponent(
                            `Hola ${appointment.clientName}, te recordamos tu cita hoy a las ${appointment.startTime} en ${currentBusiness?.name || "nuestro local"}. ¡Te esperamos!`
                          )}`}
                          title="Enviar SMS usando la app de mensajería de tu celular"
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 hover:text-gray-900 transition"
                        >
                          💬 SMS
                        </a>
                      )}

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

      {/* BARRA INFERIOR DEL PAGINADOR SUPER RÁPIDO */}
      {filteredAppointments.length > 0 && (
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-gray-100 text-xs text-gray-600">
          <div>
            Mostrando{" "}
            <strong>
              {pageSize === -1
                ? 1
                : Math.min((safeCurrentPage - 1) * pageSize + 1, totalFiltered)}
            </strong>{" "}
            a{" "}
            <strong>
              {pageSize === -1
                ? totalFiltered
                : Math.min(safeCurrentPage * pageSize, totalFiltered)}
            </strong>{" "}
            de <strong>{totalFiltered}</strong> citas
            {searchQuery && (
              <span className="text-gray-400 ml-1">(filtradas de {totalCount} en total)</span>
            )}
          </div>

          {pageSize !== -1 && totalPages > 1 && (
            <div className="flex items-center gap-1">
              {/* Primera Página */}
              <button
                onClick={() => setCurrentPage(1)}
                disabled={safeCurrentPage === 1}
                className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none shadow-sm transition"
                title="Primera página"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>

              {/* Anterior */}
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
                className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none font-semibold flex items-center gap-1 shadow-sm transition"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Anterior</span>
              </button>

              {/* Botones de Páginas Numéricos */}
              <div className="flex items-center gap-1 mx-1">
                {(() => {
                  const pages = [];
                  let start = Math.max(1, safeCurrentPage - 2);
                  let end = Math.min(totalPages, start + 4);
                  if (end - start < 4) {
                    start = Math.max(1, end - 4);
                  }
                  for (let i = start; i <= end; i++) {
                    pages.push(i);
                  }
                  return pages.map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`h-8 w-8 rounded-lg font-bold text-xs transition ${
                        safeCurrentPage === pageNum
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {pageNum}
                    </button>
                  ));
                })()}
              </div>

              {/* Siguiente */}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage === totalPages}
                className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none font-semibold flex items-center gap-1 shadow-sm transition"
              >
                <span className="hidden sm:inline">Siguiente</span>
                <ChevronRight className="h-4 w-4" />
              </button>

              {/* Última Página */}
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={safeCurrentPage === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none shadow-sm transition"
                title="Última página"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODAL PARA REAGENDAR CITA (OPCIÓN 2 DE WHATSAPP) */}
      {rescheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 relative">
            {rescheduleSuccess ? (
              // Vista de Éxito con botón directo a WhatsApp
              <div className="text-center space-y-4 py-2">
                <div className="h-14 w-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">¡Cita Reagendada con Éxito!</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    La cita de <strong>{rescheduleSuccess.appointment.clientName}</strong> se actualizó para el{" "}
                    <strong>{formatAppointmentDate(rescheduleSuccess.appointment.date)}</strong> a las{" "}
                    <strong>{rescheduleSuccess.appointment.startTime}</strong>.
                  </p>
                </div>

                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-left text-xs space-y-1.5 text-emerald-900">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                    <CalendarClock className="h-4 w-4 text-emerald-600" />
                    <span>Nuevos datos de la reserva:</span>
                  </div>
                  <p>🗓️ <strong>Fecha:</strong> {formatAppointmentDate(rescheduleSuccess.appointment.date)}</p>
                  <p>⏰ <strong>Horario:</strong> {rescheduleSuccess.appointment.startTime} - {rescheduleSuccess.appointment.endTime}</p>
                  <p>💈 <strong>Servicio:</strong> {rescheduleSuccess.appointment.service?.name}</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                  <a
                    href={rescheduleSuccess.whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>Notificar al Cliente por WhatsApp</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setRescheduleModal(null);
                      setRescheduleSuccess(null);
                    }}
                    className="w-full sm:w-auto px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            ) : (
              // Formulario para Seleccionar Nueva Fecha y Horario
              <form onSubmit={handleSaveReschedule} className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl shrink-0">
                      <CalendarClock className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-gray-900 text-base">
                        Reagendar Cita (Opción 2)
                      </h3>
                      <p className="text-xs text-gray-500">
                        Cliente: <strong>{rescheduleModal.clientName}</strong> · {rescheduleModal.service?.name} ({rescheduleModal.service?.durationMinutes} min)
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRescheduleModal(null)}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
                  >
                    ✕
                  </button>
                </div>

                {/* Fecha y Hora Actual */}
                <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-900 flex items-center justify-between">
                  <span className="font-medium text-amber-700">Horario Anterior:</span>
                  <span className="font-bold">
                    {formatAppointmentDate(rescheduleModal.date)} · {rescheduleModal.startTime}
                  </span>
                </div>

                {/* Selección de Nueva Fecha */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Nueva Fecha de la Cita:
                  </label>
                  <input
                    type="date"
                    required
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Selección de Horario */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Nueva Hora de Inicio:
                    </label>
                    <input
                      type="time"
                      required
                      value={rescheduleStartTime}
                      onChange={(e) => handleStartTimeChange(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Hora de Finalización:
                    </label>
                    <input
                      type="time"
                      required
                      value={rescheduleEndTime}
                      onChange={(e) => setRescheduleEndTime(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50"
                    />
                  </div>
                </div>

                {/* Notas opcionales */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Notas o Motivo del Reagendamiento (Opcional):
                  </label>
                  <textarea
                    rows={2}
                    value={rescheduleNotes}
                    onChange={(e) => setRescheduleNotes(e.target.value)}
                    placeholder="Ej. El cliente solicitó cambio de horario por trabajo..."
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Botones de acción */}
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setRescheduleModal(null)}
                    className="px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={rescheduleSubmitting}
                    className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50"
                  >
                    {rescheduleSubmitting ? "Guardando..." : "Guardar y Reagendar Cita"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

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

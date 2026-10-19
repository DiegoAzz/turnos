"use client";

import { useEffect, useState, use, useCallback } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Phone,
  CheckCircle2,
  ChevronRight,
  MessageCircle,
  ArrowLeft,
  Sparkles,
  Ticket,
  Scissors,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Service {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number;
}

interface WorkingHour {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

interface BusinessData {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  description: string | null;
  address: string | null;
  currency: string;
  plan: string;
  logoUrl?: string | null;
  liveStatus?: string;
  statusMessage?: string | null;
  category?: string;
  serviceModality?: string;
multiBarberEnabled?: boolean;

homeServiceFee?: number;
  requireDepositForNew?: boolean;
  depositAmount?: number;
  depositPaymentInfo?: string | null;
  referralProgramEnabled?: boolean;
  referralRewardText?: string | null;
}

interface StaffMember {
  id: string;
  name: string;
  chairNumber: number;
  chairLabel: string;
  avatarUrl?: string | null;
  allowedServiceIds?: string[] | null;
}

interface CountryConfig {
  code: string;
  name: string;
  flag: string;
  digits: number;
  placeholder: string;
  hint: string;
}

const COUNTRY_CONFIGS: Record<string, CountryConfig> = {
  "+57": {
    code: "+57",
    name: "Colombia",
    flag: "🇨🇴",
    digits: 10,
    placeholder: "310 601 7261",
    hint: "10 dígitos (inicia por 3)",
  },
  "+52": {
    code: "+52",
    name: "México",
    flag: "🇲🇽",
    digits: 10,
    placeholder: "55 1234 5678",
    hint: "10 dígitos",
  },
  "+1": {
    code: "+1",
    name: "USA / Canadá",
    flag: "🇺🇸",
    digits: 10,
    placeholder: "202 555 0123",
    hint: "10 dígitos",
  },
  "+34": {
    code: "+34",
    name: "España",
    flag: "🇪🇸",
    digits: 9,
    placeholder: "612 345 678",
    hint: "9 dígitos",
  },
  "+54": {
    code: "+54",
    name: "Argentina",
    flag: "🇦🇷",
    digits: 10,
    placeholder: "11 2345 6789",
    hint: "10 dígitos",
  },
  "+56": {
    code: "+56",
    name: "Chile",
    flag: "🇨🇱",
    digits: 9,
    placeholder: "9 1234 5678",
    hint: "9 dígitos",
  },
  "+51": {
    code: "+51",
    name: "Perú",
    flag: "🇵🇪",
    digits: 9,
    placeholder: "912 345 678",
    hint: "9 dígitos",
  },
  "+593": {
    code: "+593",
    name: "Ecuador",
    flag: "🇪🇨",
    digits: 9,
    placeholder: "9 1234 5678",
    hint: "9 dígitos",
  },
  "+58": {
    code: "+58",
    name: "Venezuela",
    flag: "🇻🇪",
    digits: 10,
    placeholder: "412 123 4567",
    hint: "10 dígitos",
  },
  "+507": {
    code: "+507",
    name: "Panamá",
    flag: "🇵🇦",
    digits: 8,
    placeholder: "6123 4567",
    hint: "8 dígitos",
  },
  "+506": {
    code: "+506",
    name: "Costa Rica",
    flag: "🇨🇷",
    digits: 8,
    placeholder: "8123 4567",
    hint: "8 dígitos",
  },
};

export default function BookingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [bookedIntervals, setBookedIntervals] = useState<{ startTime: string; endTime: string }[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [selectedStaffMemberId, setSelectedStaffMemberId] = useState<string | null>(null);

  // Wizard state
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [scheduleMode, setScheduleMode] = useState<"DEFAULT" | "ALL_HOURS">("DEFAULT");
  const [clientName, setClientName] = useState("");
  const [countryCode, setCountryCode] = useState("+57");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientNotes, setClientNotes] = useState("");
  const [clientBirthday, setClientBirthday] = useState("");
  const [referredBy, setReferredBy] = useState("");
  const [appointmentType, setAppointmentType] = useState<"LOCAL" | "DOMICILIO">("LOCAL");
  const [clientAddress, setClientAddress] = useState("");
  const [isReturningClient, setIsReturningClient] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<any | null>(null);

const currentConfig = COUNTRY_CONFIGS[countryCode] || COUNTRY_CONFIGS["+57"];

  const handleCountryChange = (newCode: string) => {
    setCountryCode(newCode);
    const config = COUNTRY_CONFIGS[newCode] || COUNTRY_CONFIGS["+57"];
    const onlyDigits = clientPhone.replace(/[^0-9]/g, "");
    if (onlyDigits.length > config.digits) {
      setClientPhone(onlyDigits.slice(0, config.digits));
    }
  };

  const handlePhoneChange = (val: string) => {
    const config = COUNTRY_CONFIGS[countryCode] || COUNTRY_CONFIGS["+57"];
    const onlyDigits = val.replace(/[^0-9]/g, "").slice(0, config.digits);
    setClientPhone(onlyDigits);
  };
  // Modal de Cancelación / Novedad Mutua
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelResult, setCancelResult] = useState<{ notifyUrl?: string; notifyMessage?: string } | null>(null);

  // Cargar datos previos de cliente frecuente guardados en el navegador
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const savedName = localStorage.getItem("turnoya_client_name");
        const savedPhone = localStorage.getItem("turnoya_client_phone");
        const savedEmail = localStorage.getItem("turnoya_client_email");
        const savedCountry = localStorage.getItem("turnoya_client_country");
        const savedAddress = localStorage.getItem("turnoya_client_address");

        if (savedName) setClientName(savedName);
        if (savedPhone) setClientPhone(savedPhone);
        if (savedEmail) setClientEmail(savedEmail);
        if (savedCountry) setCountryCode(savedCountry);
        if (savedAddress) setClientAddress(savedAddress);

        if (savedName || savedPhone) {
          setIsReturningClient(true);
        }
      }
    } catch (_) {}
  }, []);

  const handleClearSavedData = () => {
    try {
      localStorage.removeItem("turnoya_client_name");
      localStorage.removeItem("turnoya_client_phone");
      localStorage.removeItem("turnoya_client_email");
      localStorage.removeItem("turnoya_client_country");
      localStorage.removeItem("turnoya_client_address");
    } catch (_) {}
    setClientName("");
    setClientPhone("");
    setClientEmail("");
    setClientAddress("");
    setIsReturningClient(false);
  };

  // Generar los próximos 14 días para reservar con fecha LOCAL del usuario (evita salto de zona horaria UTC nocturno)
  const availableDates = Array.from({ length: 14 }).map((_, index) => {
    const d = new Date();
    d.setDate(d.getDate() + index);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return {
      iso: `${y}-${m}-${day}`,
      dayName: d.toLocaleDateString("es-ES", { weekday: "short" }),
      dayNumber: d.getDate(),
      monthName: d.toLocaleDateString("es-ES", { month: "short" }),
      dayOfWeek: d.getDay(),
    };
  });

  // Verificar si un día específico está cerrado (por horario semanal o liveStatus)
  const isDayClosed = (dayOfWeek: number, isoDate: string) => {
    const now = new Date();
    const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    if (isoDate === todayIso && business?.liveStatus === "CLOSED_TODAY") {
      return true;
    }
    const wh = workingHours.find((w) => w.dayOfWeek === dayOfWeek);
    if (wh) {
      return wh.isClosed;
    }
    // Por defecto domingo (0) cerrado
    return dayOfWeek === 0;
  };

  // Cargar datos del negocio
  useEffect(() => {
    async function fetchBusiness() {
      try {
        setLoading(true);
        const res = await fetch(`/api/business/${slug}`);
        if (!res.ok) throw new Error("Negocio no encontrado");
        const data = await res.json();
        setBusiness(data.business);
        setServices(data.services);
        setStaffMembers(data.staffMembers || []);
        const whList: WorkingHour[] = data.workingHours || [];
        setWorkingHours(whList);
        setProducts(data.products || []);

        // Auto-seleccionar el PRIMER día ABIERTO disponible para no caer en un día cerrado
        const now = new Date();
        const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

        if (availableDates.length > 0) {
          const firstOpen = availableDates.find((item) => {
            if (item.iso === todayIso && data.business?.liveStatus === "CLOSED_TODAY") {
              return false;
            }
            const wh = whList.find((w) => w.dayOfWeek === item.dayOfWeek);
            if (wh) return !wh.isClosed;
            return item.dayOfWeek !== 0;
          });
          setSelectedDate(firstOpen ? firstOpen.iso : availableDates[0].iso);
        }
      } catch (err: any) {
        setError(err.message || "Error al cargar la información.");
      } finally {
        setLoading(false);
      }
    }
    fetchBusiness();
  }, [slug]);

  // Actualizar slots ocupados en tiempo real
  const fetchSlots = useCallback(async () => {
    if (!selectedDate || !slug) return;
    try {
      const barberParam = selectedStaffMemberId ? `&staffMemberId=${selectedStaffMemberId}` : "";
      const res = await fetch(`/api/business/${slug}?date=${selectedDate}${barberParam}`);
      if (res.ok) {
        const data = await res.json();
        setBookedSlots(data.bookedSlots || []);
        setBookedIntervals(data.bookedIntervals || []);
      }
    } catch (err) {
      console.error("Error al obtener slots:", err);
    }
  }, [selectedDate, slug, selectedStaffMemberId]);

  // Actualizar slots al cambiar la fecha seleccionada
  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  // Polling silencioso en tiempo real cada 5s cuando el cliente está eligiendo fecha/hora (paso 3)
  useEffect(() => {
    if (step !== 3 || !selectedDate) return;
    const interval = setInterval(() => {
      fetchSlots();
    }, 5000);
    return () => clearInterval(interval);
  }, [step, selectedDate, fetchSlots]);

  // Detector inteligente de disponibilidad considerando duración del servicio e intervalos
  const isSlotDisabled = (slot: string) => {
    if (bookedSlots.includes(slot)) return true;
    if (!selectedService) return false;

    const [h, m] = slot.split(":").map(Number);
    const slotStart = h * 60 + m;
    const duration = selectedService.durationMinutes || 30;
    const slotEnd = slotStart + duration;

    return bookedIntervals.some((app) => {
      const [asH, asM] = app.startTime.split(":").map(Number);
      const [aeH, aeM] = app.endTime.split(":").map(Number);
      const appStart = asH * 60 + asM;
      const appEnd = aeH * 60 + aeM;
      return slotStart < appEnd && slotEnd > appStart;
    });
  };

  // Generar franjas horarias del día seleccionado
  const generateSlotsForSelectedDate = () => {
    if (!selectedDate) return [];

    const dateObj = new Date(`${selectedDate}T12:00:00.000Z`);
    const dayOfWeek = dateObj.getDay();

    // Si el día está cerrado, no se ofrecen turnos
    if (isDayClosed(dayOfWeek, selectedDate)) {
      return [];
    }

    let rawSlots: string[] = [];

    // Modo 1: Todas las horas (horario extendido de 06:00 a 23:30 para barberos o turnos especiales en días abiertos)
    if (scheduleMode === "ALL_HOURS") {
      let currentMin = 6 * 60; // 06:00 AM
      const endMin = 23 * 60 + 30; // 23:30 PM
      while (currentMin <= endMin) {
        const h = Math.floor(currentMin / 60);
        const m = currentMin % 60;
        rawSlots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
        currentMin += 30;
      }
    } else {
      // Modo 2: Horario habitual configurado por el negocio
      if (workingHours.length === 0) return [];

      const wh = workingHours.find((w) => w.dayOfWeek === dayOfWeek);
      if (!wh || wh.isClosed) return [];

      const [startH, startM] = wh.openTime.split(":").map(Number);
      const [endH, endM] = wh.closeTime.split(":").map(Number);

      let currentMin = startH * 60 + startM;
      const endMin = endH * 60 + endM;

      // Intervalo estándar de 30 minutos
      while (currentMin + 30 <= endMin) {
        const h = Math.floor(currentMin / 60);
        const m = currentMin % 60;
        rawSlots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
        currentMin += 30;
      }
    }

    // SI LA FECHA ES HOY: Ocultar horarios anteriores a la hora actual (ej. si son las 3pm, no mostrar las 2pm)
    const now = new Date();
    const todayYear = now.getFullYear();
    const todayMonth = String(now.getMonth() + 1).padStart(2, "0");
    const todayDay = String(now.getDate()).padStart(2, "0");
    const todayIso = `${todayYear}-${todayMonth}-${todayDay}`;

    if (selectedDate === todayIso) {
      const currentMinutesNow = now.getHours() * 60 + now.getMinutes();
      rawSlots = rawSlots.filter((slot) => {
        const [h, m] = slot.split(":").map(Number);
        const slotMinutes = h * 60 + m;
        return slotMinutes >= currentMinutesNow;
      });
    }

    return rawSlots;
  };

  const selectedDateItem = availableDates.find((d) => d.iso === selectedDate);
  const isCurrentDateClosed = selectedDateItem
    ? isDayClosed(selectedDateItem.dayOfWeek, selectedDateItem.iso)
    : false;

  const timeSlots = generateSlotsForSelectedDate();

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedDate || !selectedTime || !clientName || !clientPhone) {
      alert("Por favor completa todos los campos requeridos.");
      return;
    }

    const cleanDigits = clientPhone.replace(/[^0-9]/g, "");

    if (cleanDigits.length !== currentConfig.digits) {
      alert(
        `El número de WhatsApp para ${currentConfig.name} debe tener exactamente ${currentConfig.digits} dígitos.\nActualmente ingresaste ${cleanDigits.length} dígitos.`
      );
      return;
    }

    if (countryCode === "+57" && !cleanDigits.startsWith("3")) {
      alert("En Colombia los números celulares de WhatsApp deben comenzar con el dígito 3 (ejemplo: 310 601 7261).");
      return;
    }

    try {
      setIsSubmitting(true);
      const cleanPrefix = countryCode.replace("+", "");
      const finalPhone = cleanDigits.startsWith(cleanPrefix) ? cleanDigits : `${cleanPrefix}${cleanDigits}`;

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessSlug: slug,
          serviceId: selectedService.id,
          date: selectedDate,
          startTime: selectedTime,
          clientName,
          clientPhone: finalPhone,
          clientEmail,
          clientNotes,
          clientBirthday: clientBirthday.trim() || null,
          referredBy: referredBy.trim() || null,
          appointmentType,
          clientAddress: appointmentType === "DOMICILIO" ? clientAddress : null,
          staffMemberId: selectedStaffMemberId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (
          res.status === 409 ||
          data.error?.toLowerCase().includes("cruza") ||
          data.error?.toLowerCase().includes("reservada")
        ) {
          await fetchSlots();
          setSelectedTime("");
          alert(
            "⚠️ Lo sentimos: ese horario acaba de ser reservado por otro cliente o se cruza con otra cita. Hemos actualizado la disponibilidad en tiempo real. Por favor selecciona otro horario."
          );
          setStep(3);
          return;
        }
        throw new Error(data.error || "No se pudo agendar la cita.");
      }

      // Guardar datos en el teléfono/navegador del cliente frecuente
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem("turnoya_client_name", clientName);
          localStorage.setItem("turnoya_client_phone", cleanDigits);
          if (clientEmail) localStorage.setItem("turnoya_client_email", clientEmail);
          if (countryCode) localStorage.setItem("turnoya_client_country", countryCode);
          if (clientAddress) localStorage.setItem("turnoya_client_address", clientAddress);
          if (clientBirthday) localStorage.setItem("turnoya_client_birthday", clientBirthday);
        }
      } catch (_) {}

      setBookingSuccess(data);
      setStep(5);
    } catch (err: any) {
      alert(err.message || "Error al procesar la reserva.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClientCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    const apptId = bookingSuccess?.appointment?.id;
    if (!apptId) return;

    try {
      setCancelling(true);
      const res = await fetch("/api/appointments/novedad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: apptId,
          reason: cancelReason.trim() || "Imprevisto de última hora",
          cancelledBy: "CLIENT",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo reportar la novedad.");
      setCancelResult(data);
    } catch (err: any) {
      alert(err.message || "Error al cancelar.");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <p className="mt-3 text-sm font-medium text-gray-500">Cargando disponibilidad...</p>
        </div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Página no encontrada</h2>
        <p className="mt-2 text-sm text-gray-500">{error || "El negocio solicitado no existe."}</p>
        <Link
          href="/"
          className="mt-6 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow"
        >
          Volver al Inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-gray-100 to-gray-50 py-8 px-4 sm:px-6">
      <link rel="manifest" href={`/api/manifest?slug=${slug}`} />
      <meta name="theme-color" content="#059669" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-title" content={business.name} />
      <div className="mx-auto max-w-xl">
        {/* ENCABEZADO DEL NEGOCIO */}
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                <Sparkles className="h-3 w-3" />
                Reservas Online
              </span>
              <h1 className="mt-2 text-2xl font-bold text-gray-900">{business.name}</h1>
            </div>
            {business.logoUrl ? (
              <img
                src={business.logoUrl}
                alt={business.name}
                className="h-14 w-14 rounded-2xl object-cover border border-gray-100 shadow-md shrink-0"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-lg shadow-md shadow-emerald-500/20 shrink-0">
                {business.name.substring(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          {business.description && (
            <p className="mt-3 text-sm text-gray-600 leading-relaxed">
              {business.description}
            </p>
          )}

          {/* ESTADO EN VIVO DEL NEGOCIO */}
          {business.liveStatus && (
            <div
              className={`mt-3.5 p-3 rounded-2xl text-xs flex items-center gap-2.5 border ${
                business.liveStatus === "OPEN"
                  ? "bg-emerald-50/90 text-emerald-900 border-emerald-200"
                  : business.liveStatus === "LUNCH"
                  ? "bg-amber-50/90 text-amber-900 border-amber-200"
                  : business.liveStatus === "CLOSED_TODAY"
                  ? "bg-rose-50/90 text-rose-900 border-rose-200"
                  : "bg-blue-50/90 text-blue-900 border-blue-200"
              }`}
            >
              <span className="text-base shrink-0">
                {business.liveStatus === "OPEN"
                  ? "🟢"
                  : business.liveStatus === "LUNCH"
                  ? "🟡"
                  : business.liveStatus === "CLOSED_TODAY"
                  ? "🔴"
                  : "📢"}
              </span>
              <div>
                <span className="font-bold">
                  {business.liveStatus === "OPEN"
                    ? "Abierto y Atendiendo"
                    : business.liveStatus === "LUNCH"
                    ? "En Horario de Almuerzo"
                    : business.liveStatus === "CLOSED_TODAY"
                    ? "Hoy No Labora / Festivo"
                    : "Comunicado Oficial"}
                </span>
                <p className="text-[11px] opacity-85 mt-0.5">
                  {business.statusMessage ||
                    (business.liveStatus === "OPEN"
                      ? "Turnos disponibles para reservar hoy con normalidad."
                      : "Puedes consultar disponibilidad para los próximos días.")}
                </p>
              </div>
            </div>
          )}

          {/* BANNER TURNERO EN VIVO / PANTALLA SMART TV */}
          <Link
            href={`/p/${slug}/turnero`}
            className="mt-3.5 flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white text-xs border border-slate-800 shadow-md hover:border-emerald-500/60 transition group"
          >
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                📺
              </span>
              <div>
                <span className="font-extrabold flex items-center gap-1.5 text-slate-100">
                  <span>Pantalla de Turnero en Vivo</span>
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Mira quién está en la silla y el orden de los turnos en tiempo real
                </p>
              </div>
            </div>
            <span className="text-emerald-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform shrink-0">
              Ver Fila →
            </span>
          </Link>

          <div className="mt-4 flex flex-wrap gap-4 border-t border-gray-100 pt-4 text-xs text-gray-500">
            {business.address && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                <span>{business.address}</span>
              </div>
            )}
            {business.phone && (
              <div className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-emerald-600" />
                <span>{business.phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* CONTENEDOR DEL WIZARD DE RESERVA */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          {/* PASO 1: SELECCIONAR SERVICIO */}
          {step === 1 && (
            <div>
              <div className="mb-4">
                <h2 className="text-lg font-bold text-gray-900">1. Selecciona un servicio</h2>
                <p className="text-xs text-gray-500">Elige lo que deseas realizarte hoy</p>
              </div>

              <div className="space-y-3">
                {services.map((service) => (
                  <div
                    key={service.id}
                    onClick={() => {
                      setSelectedService(service);
                      setStep(2);
                    }}
                    className={`cursor-pointer rounded-xl border p-4 transition-all hover:border-emerald-500 hover:shadow-sm ${
                      selectedService?.id === service.id
                        ? "border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-600"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">{service.name}</h3>
                        {service.description && (
                          <p className="mt-1 text-xs text-gray-500">{service.description}</p>
                        )}
                        <div className="mt-2.5 flex items-center gap-2 text-xs font-medium text-emerald-700">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{service.durationMinutes} minutos</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-bold text-gray-900">
                          {formatCurrency(service.price, business.currency)}
                        </span>
                        <ChevronRight className="mt-2 ml-auto h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PASO 2: SELECCIONAR FECHA */}
          {step === 2 && (
            <div>
              <button
                onClick={() => setStep(1)}
                className="mb-4 flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Cambiar servicio ({selectedService?.name})
              </button>

              {/* SELECTOR DE PROFESIONAL / BARBERO (MODO MULTI-BARBERO) */}
              {business?.multiBarberEnabled && staffMembers.length > 0 && (
                <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-50/70 via-teal-50/70 to-emerald-50/70 border border-emerald-200/80 shadow-sm">
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                      <Scissors className="h-4 w-4 text-emerald-600" />
                      ¿Con quién deseas atenderte?
                    </h3>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                      Opcional
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mb-3">
                    Elige tu barbero favorito o deja la opción automática para pasar lo más rápido posible.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Opción Automática / Cualquier barbero (Predeterminada) */}
                    <button
                      type="button"
                      onClick={() => setSelectedStaffMemberId(null)}
                      className={`p-3 rounded-xl border text-left transition flex items-center gap-3 ${
                        selectedStaffMemberId === null
                          ? "border-emerald-600 bg-white ring-2 ring-emerald-500/20 shadow-sm"
                          : "border-gray-200 bg-white/80 hover:bg-white text-gray-700"
                      }`}
                    >
                      <div
                        className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                          selectedStaffMemberId === null
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        ⚡
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-gray-900 truncate">
                            Cualquiera disponible
                          </span>
                          <span className="text-[9px] font-extrabold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full">
                            Más rápido
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500 truncate">
                          Te atiende el primer barbero libre
                        </p>
                      </div>
                    </button>

                    {/* Barberos registrados */}
                    {staffMembers
                      .filter((staff) => {
                        if (!selectedService) return true;
                        if (!staff.allowedServiceIds || staff.allowedServiceIds.length === 0) return true;
                        return staff.allowedServiceIds.includes(selectedService.id);
                      })
                      .map((staff) => {
                      const isSelected = selectedStaffMemberId === staff.id;
                      return (
                        <button
                          key={staff.id}
                          type="button"
                          onClick={() => setSelectedStaffMemberId(staff.id)}
                          className={`p-3 rounded-xl border text-left transition flex items-center gap-3 ${
                            isSelected
                              ? "border-emerald-600 bg-white ring-2 ring-emerald-500/20 shadow-sm"
                              : "border-gray-200 bg-white/80 hover:bg-white text-gray-700"
                          }`}
                        >
                          <div
                            className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                              isSelected
                                ? "bg-emerald-600 text-white shadow-sm"
                                : "bg-gray-100 text-gray-700 border border-gray-200"
                            }`}
                          >
                            {staff.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-xs text-gray-900 block truncate">
                              {staff.name}
                            </span>
                            <span className="text-[10px] text-gray-500 block truncate">
                              {staff.chairLabel || `Silla ${staff.chairNumber}`}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mb-4">
                <h2 className="text-lg font-bold text-gray-900">2. Elige el día</h2>
                <p className="text-xs text-gray-500">Próximos días con disponibilidad</p>
              </div>

              <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                {availableDates.map((item) => {
                  const isClosed = isDayClosed(item.dayOfWeek, item.iso);
                  const isSelected = selectedDate === item.iso;
                  return (
                    <button
                      key={item.iso}
                      disabled={isClosed}
                      onClick={() => {
                        if (!isClosed) setSelectedDate(item.iso);
                      }}
                      className={`flex flex-col items-center justify-center rounded-xl p-3 text-center border transition relative ${
                        isClosed
                          ? "border-gray-200 bg-gray-100/80 text-gray-400 cursor-not-allowed opacity-60"
                          : isSelected
                          ? "border-emerald-600 bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/20"
                          : "border-gray-200 bg-white hover:border-emerald-500 hover:bg-emerald-50/50"
                      }`}
                    >
                      <span className={`text-[10px] uppercase font-bold ${isClosed ? "text-gray-400" : isSelected ? "text-emerald-100" : "text-gray-400"}`}>
                        {item.dayName}
                      </span>
                      <span className={`my-0.5 text-lg font-extrabold ${isClosed ? "line-through text-gray-400" : ""}`}>
                        {item.dayNumber}
                      </span>
                      {isClosed ? (
                        <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1 py-0.5 rounded-md mt-0.5 border border-rose-200/60">
                          Cerrado
                        </span>
                      ) : (
                        <span className={`text-[10px] ${isSelected ? "text-emerald-100" : "text-gray-400"}`}>
                          {item.monthName}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  disabled={!selectedDate || isCurrentDateClosed}
                  onClick={() => setStep(3)}
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition disabled:opacity-50"
                >
                  Continuar a Horarios →
                </button>
              </div>
            </div>
          )}

          {/* PASO 3: SELECCIONAR HORA */}
          {step === 3 && (
            <div>
              <button
                onClick={() => setStep(2)}
                className="mb-4 flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Cambiar fecha ({selectedDate})
              </button>

              <div className="mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">3. Selecciona la hora</h2>
                    <p className="text-xs text-gray-500">Horarios para {selectedDate}</p>
                  </div>

                  {/* Selector Horario Habitual vs Horario Extendido (Solo si el día está abierto) */}
                  {!isCurrentDateClosed && (
                    <div className="flex items-center bg-gray-100 p-1 rounded-xl self-start sm:self-auto border border-gray-200">
                      <button
                        type="button"
                        onClick={() => setScheduleMode("DEFAULT")}
                        className={`px-3 py-1.5 text-xs rounded-lg transition ${
                          scheduleMode === "DEFAULT"
                            ? "bg-white text-emerald-800 shadow-sm font-bold"
                            : "text-gray-500 hover:text-gray-900 font-medium"
                        }`}
                      >
                        Horario habitual
                      </button>
                      <button
                        type="button"
                        onClick={() => setScheduleMode("ALL_HOURS")}
                        className={`px-3 py-1.5 text-xs rounded-lg transition flex items-center gap-1.5 ${
                          scheduleMode === "ALL_HOURS"
                            ? "bg-white text-emerald-800 shadow-sm font-bold"
                            : "text-gray-500 hover:text-gray-900 font-medium"
                        }`}
                      >
                        <span>Todas las horas (Extendido)</span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded font-bold">24h</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {timeSlots.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 bg-gray-50/50">
                  <p className="font-semibold text-gray-700">
                    {(() => {
                      if (isCurrentDateClosed) {
                        return "🚫 El establecimiento permanece CERRADO este día.";
                      }
                      const now = new Date();
                      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
                      return selectedDate === todayStr
                        ? "Los turnos habituales de hoy anteriores a la hora actual ya han pasado."
                        : "El negocio no tiene horario habitual configurado para este día.";
                    })()}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {isCurrentDateClosed
                      ? "Este día está configurado como día de descanso del establecimiento. Por favor selecciona otro día en el calendario."
                      : "Puedes consultar el horario extendido de hoy o agendar para mañana."}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                    {isCurrentDateClosed ? (
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm transition"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        <span>Ver calendario y días abiertos</span>
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setScheduleMode("ALL_HOURS")}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm transition"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>Ver horario extendido</span>
                        </button>
                        {availableDates.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const nextOpen = availableDates.find((d, idx) => idx > 0 && !isDayClosed(d.dayOfWeek, d.iso));
                              if (nextOpen) {
                                setSelectedDate(nextOpen.iso);
                              } else {
                                setSelectedDate(availableDates[1].iso);
                              }
                              setScheduleMode("DEFAULT");
                            }}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
                          >
                            <span>Ver turnos para Mañana →</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                  {timeSlots.map((slot) => {
                    const isBooked = isSlotDisabled(slot);
                    const isSelected = selectedTime === slot;

                    return (
                      <button
                        key={slot}
                        disabled={isBooked}
                        onClick={() => setSelectedTime(slot)}
                        className={`rounded-xl py-2.5 px-2 text-center text-xs font-semibold transition border ${
                          isBooked
                            ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 line-through"
                            : isSelected
                            ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                            : "border-gray-200 bg-white hover:border-emerald-500 hover:bg-emerald-50 text-gray-800"
                        }`}
                      >
                        <div>{slot}</div>
                        {isBooked && (
                          <span className="block text-[9px] text-gray-400 no-underline font-normal leading-tight mt-0.5">
                            Reservado
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  disabled={!selectedTime || isSlotDisabled(selectedTime)}
                  onClick={() => setStep(4)}
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition disabled:opacity-50"
                >
                  Ingresar mis Datos →
                </button>
              </div>
            </div>
          )}

          {/* PASO 4: FORMULARIO DEL CLIENTE */}
          {step === 4 && (
            <form onSubmit={handleBookingSubmit}>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="mb-4 flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Cambiar hora ({selectedTime})
              </button>

              <div className="mb-4">
                <h2 className="text-lg font-bold text-gray-900">4. Datos de contacto</h2>
                <p className="text-xs text-gray-500">Para enviarte la confirmación y recordatorio</p>
              </div>

              {/* BANNER CLIENTE FRECUENTE AUTO-RECORDADO */}
              {isReturningClient && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-950 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">👋</span>
                    <div>
                      <p className="font-bold">¡Hola de nuevo{clientName ? `, ${clientName.split(" ")[0]}` : ""}!</p>
                      <p className="text-[11px] text-emerald-700">Tus datos se autocompletaron para que agendes en 1 clic.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearSavedData}
                    className="text-[10px] text-emerald-800 hover:text-emerald-950 underline font-semibold px-2 py-1 shrink-0"
                  >
                    ¿Cambiar datos?
                  </button>
                </div>
              )}

              {/* RESUMEN PREVIO */}
              <div className="mb-5 rounded-xl bg-gray-50 p-3.5 border border-gray-200 text-xs space-y-1.5 text-gray-700">
                <p>
                  <strong>Servicio:</strong> {selectedService?.name} (
                  {formatCurrency(selectedService?.price || 0, business.currency)})
                </p>
                {business?.multiBarberEnabled && staffMembers.length > 0 && (
                  <p>
                    <strong>Barbero / Profesional:</strong>{" "}
                    {selectedStaffMemberId
                      ? `${staffMembers.find((s) => s.id === selectedStaffMemberId)?.name} (${staffMembers.find((s) => s.id === selectedStaffMemberId)?.chairLabel || `Silla ${staffMembers.find((s) => s.id === selectedStaffMemberId)?.chairNumber}`})`
                      : "Cualquier barbero disponible (Asignación automática)"}
                  </p>
                )}
                <p>
                  <strong>Fecha y Hora:</strong> {selectedDate} a las {selectedTime}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Juan Pérez"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Número de WhatsApp *
                  </label>
                  <div className="flex rounded-xl border border-gray-300 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 overflow-hidden bg-white">
                    <select
                      value={countryCode}
                      onChange={(e) => handleCountryChange(e.target.value)}
                      className="bg-gray-50 border-r border-gray-300 px-2.5 py-2.5 text-xs text-gray-700 font-bold focus:outline-none cursor-pointer"
                    >
                      {Object.values(COUNTRY_CONFIGS).map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.code} ({c.name})
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      required
                      inputMode="numeric"
                      maxLength={currentConfig.digits}
                      placeholder={`Ej. ${currentConfig.placeholder}`}
                      value={clientPhone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none font-mono font-medium"
                    />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[11px]">
                    <span className="text-gray-500">{currentConfig.hint}</span>
                    <span
                      className={`font-mono font-semibold ${
                        clientPhone.length === currentConfig.digits
                          ? "text-emerald-600"
                          : "text-amber-600"
                      }`}
                    >
                      {clientPhone.length} / {currentConfig.digits} dígitos
                      {clientPhone.length === currentConfig.digits && " ✓"}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Correo electrónico (Opcional)
                  </label>
                  <input
                    type="email"
                    placeholder="juan@ejemplo.com"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* MODALIDAD DE SERVICIO (LOCAL / DOMICILIO) */}
                {(business.serviceModality === "DOMICILIO" ||
                  business.serviceModality === "HIBRIDO") && (
                  <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-2xl space-y-3">
                    <label className="block text-xs font-bold text-teal-950">
                      Modalidad de Atención
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {business.serviceModality === "HIBRIDO" && (
                        <button
                          type="button"
                          onClick={() => setAppointmentType("LOCAL")}
                          className={`py-2 px-3 text-xs rounded-xl font-bold border transition text-center ${
                            appointmentType === "LOCAL"
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                              : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          🏢 En el Local
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setAppointmentType("DOMICILIO")}
                        className={`py-2 px-3 text-xs rounded-xl font-bold border transition text-center ${
                          appointmentType === "DOMICILIO"
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                            : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                        } ${business.serviceModality === "DOMICILIO" ? "col-span-2" : ""}`}
                      >
                        🚗 A Domicilio (Voy donde estés)
                      </button>
                    </div>

                    {appointmentType === "DOMICILIO" && (
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs font-semibold text-teal-950 mb-1">
                            Dirección exacta / Ubicación del servicio *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Ej. Calle 45 # 12-34 Apto 402, Envigado"
                            value={clientAddress}
                            onChange={(e) => setClientAddress(e.target.value)}
                            className="w-full rounded-xl border border-teal-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                          <p className="mt-1 text-[11px] text-teal-700">
                            La profesional se desplazará hasta esta dirección en el horario confirmado.
                          </p>
                        </div>

                        {business.homeServiceFee && business.homeServiceFee > 0 ? (
                          <div className="flex items-center justify-between text-xs bg-purple-100/80 text-purple-950 p-2.5 rounded-xl border border-purple-200 font-bold">
                            <span>🛵 Recargo por servicio a domicilio:</span>
                            <span>+{formatCurrency(business.homeServiceFee, business.currency)}</span>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                )}

                {/* 🎂 CAMPO DE CUMPLEAÑOS (FIDELIZACIÓN) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-gray-700">
                      🎂 Tu Fecha de Cumpleaños (Opcional - ¡Recibe sorpresas y regalos!)
                    </label>
                    {clientBirthday && (
                      <button
                        type="button"
                        onClick={() => setClientBirthday("")}
                        className="text-[10px] text-gray-400 hover:text-rose-600 font-semibold"
                      >
                        Quitar
                      </button>
                    )}
                  </div>
                  <input
                    type="date"
                    max="2099-12-31"
                    min="1920-01-01"
                    value={clientBirthday}
                    onChange={(e) => setClientBirthday(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                  />
                  <p className="mt-1 text-[11px] text-gray-400">
                    Selecciona tu fecha en el calendario para recibir promociones exclusivas y felicitaciones en tu cumpleaños.
                  </p>
                </div>

                {/* 🎁 PROGRAMA DE REFERIDOS */}
                {business.referralProgramEnabled && (
                  <div className="p-3.5 bg-pink-50/70 border border-pink-200 rounded-2xl space-y-1">
                    <label className="block text-xs font-bold text-pink-950">
                      🎁 ¿Quién te recomendó? (Nombre o WhatsApp de tu amiga/amigo)
                    </label>
                    {business.referralRewardText && (
                      <p className="text-[11px] text-pink-800 font-medium">{business.referralRewardText}</p>
                    )}
                    <input
                      type="text"
                      placeholder="Ej. Laura Restrepo (310...)"
                      value={referredBy}
                      onChange={(e) => setReferredBy(e.target.value)}
                      className="w-full rounded-xl border border-pink-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-pink-500 focus:outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Comentario adicional o preferencia
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ej. Esmaltes tonos pastel, cutícula sensible..."
                    value={clientNotes}
                    onChange={(e) => setClientNotes(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-600/25 hover:bg-emerald-500 transition disabled:opacity-50"
                >
                  {isSubmitting ? "Confirmando reserva..." : "Confirmar Mi Turno"}
                </button>
              </div>
            </form>
          )}

          {/* PASO 5: PANTALLA DE CONFIRMACIÓN FINAL */}
          {step === 5 && (
            <div className="text-center py-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-10 w-10" />
              </div>

              <h2 className="mt-4 text-2xl font-extrabold text-gray-900">
                ¡Tu turno está confirmado!
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Hemos reservado tu lugar en {business.name}.
              </p>

              {/* AVISO DE ANTICIPO PARA CLIENTES NUEVOS */}
              {bookingSuccess?.depositRequired > 0 && (
                <div className="my-5 p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-left space-y-2">
                  <div className="flex items-center gap-2 text-amber-950 font-black text-sm">
                    <span className="text-lg">🛡️</span>
                    <span>Anticipo requerido para clientes nuevos</span>
                  </div>
                  <p className="text-xs text-amber-900 leading-relaxed">
                    Para asegurar tu cupo y garantizar el tiempo de tu especialista, se requiere un anticipo de <strong>{formatCurrency(bookingSuccess.depositRequired, business.currency)}</strong> (se descontará del valor total del servicio).
                  </p>
                  {bookingSuccess.depositPaymentInfo && (
                    <div className="p-3 bg-white rounded-xl border border-amber-200 text-xs text-amber-950 font-bold whitespace-pre-line">
                      {bookingSuccess.depositPaymentInfo}
                    </div>
                  )}
                  <p className="text-[11px] text-amber-800">
                    Por favor envía tu comprobante de pago por WhatsApp para dejar tu espacio 100% apartado.
                  </p>
                </div>
              )}

              {/* TICKET DEL TURNO ASIGNADO */}
              <div className="my-5 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-2 border-emerald-500/40 shadow-sm flex items-center justify-between">
                <div className="text-left">
                  <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-800">
                    <Ticket className="h-4 w-4 text-emerald-600" />
                    <span>Tu Posición de Turno</span>
                  </div>
                  <p className="text-xs text-gray-700 font-medium mt-1">
                    {(!bookingSuccess?.aheadCount || bookingSuccess?.aheadCount === 0) ? (
                      <span className="text-emerald-700 font-bold">🟢 ¡Sala despejada! Eres el siguiente turno a atender.</span>
                    ) : (
                      <span>
                        Tienes <strong className="text-gray-900">{bookingSuccess?.aheadCount} turno(s)</strong> en espera antes que tú.
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Prográmate para llegar 5 a 10 minutos antes de tu horario.
                  </p>
                </div>
                <div className="flex flex-col items-center justify-center bg-emerald-600 text-white rounded-2xl px-4 py-2.5 shadow-md shadow-emerald-600/30 shrink-0 ml-3">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-100">TURNO</span>
                  <span className="text-3xl font-black leading-none">#{bookingSuccess?.turnNumber || 1}</span>
                </div>
              </div>

              {/* CARD DE DETALLE */}
              <div className="my-6 rounded-2xl bg-gray-50 p-4 border border-gray-200 text-left text-sm space-y-2">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500">Número de Turno:</span>
                  <span className="font-extrabold text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-lg text-xs">
                    Turno #{bookingSuccess?.turnNumber || 1}
                  </span>
                </div>
                {bookingSuccess?.appointment?.staffMember?.name && (
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500">Barbero / Profesional:</span>
                    <span className="font-bold text-gray-900">
                      {bookingSuccess.appointment.staffMember.name} (
                      {bookingSuccess.appointment.staffMember.chairLabel || `Silla ${bookingSuccess.appointment.staffMember.chairNumber}`}
                      )
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500">Cliente:</span>
                  <span className="font-semibold text-gray-900">{clientName}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500">Servicio:</span>
                  <span className="font-semibold text-gray-900">{selectedService?.name}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500">Fecha y Hora:</span>
                  <span className="font-semibold text-emerald-700">
                    {selectedDate} a las {selectedTime}
                  </span>
                </div>
                {appointmentType === "DOMICILIO" && clientAddress && (
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500">Lugar / Dirección:</span>
                    <span className="font-semibold text-emerald-800 text-right">{clientAddress} (A Domicilio)</span>
                  </div>
                )}
                {bookingSuccess?.homeFee > 0 && (
                  <div className="flex justify-between border-b pb-2 text-purple-700 font-bold">
                    <span>Recargo a Domicilio:</span>
                    <span>+{formatCurrency(bookingSuccess.homeFee, business.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Total a Pagar:</span>
                  <span className="font-black text-gray-900 text-base">
                    {formatCurrency(
                      (selectedService?.price || 0) + (bookingSuccess?.homeFee || 0),
                      business.currency
                    )}
                  </span>
                </div>
              </div>

              {/* BOTON DE WHATSAPP DIRECTO */}
              {bookingSuccess?.whatsappUrl && (
                <a
                  href={bookingSuccess.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-500 transition mb-3"
                >
                  <MessageCircle className="h-5 w-5" />
                  Enviar comprobante por WhatsApp
                </a>
              )}

              {/* BOTÓN SEGUIR TURNO EN VIVO */}
              <Link
                href={`/p/${slug}/turnero`}
                className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white shadow-md hover:bg-slate-800 transition mb-3"
              >
                <span>📺 Ver Pantalla de Turnos en Vivo</span>
              </Link>

              {/* BOTÓN PARA REPORTAR NOVEDAD O CANCELAR CITA MUTUA */}
              {!cancelResult ? (
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition border border-rose-200 mb-3"
                >
                  <span>⚠️ ¿Te surgió un imprevisto? Reportar novedad / cancelar cita</span>
                </button>
              ) : (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-left space-y-2 mb-3">
                  <p className="text-xs font-bold text-rose-900">
                    ✓ Cita cancelada en el sistema.
                  </p>
                  <p className="text-xs text-rose-700">
                    Avisa al establecimiento para que conozcan tu novedad:
                  </p>
                  {cancelResult.notifyUrl && (
                    <a
                      href={cancelResult.notifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow hover:bg-emerald-700"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>Avisar a {business.name} por WhatsApp</span>
                    </a>
                  )}
                </div>
              )}

              <button
                onClick={() => {
                  setStep(1);
                  setSelectedService(null);
                  setSelectedTime("");
                  setBookingSuccess(null);
                  setCancelResult(null);
                }}
                className="mt-2 text-xs font-semibold text-gray-500 hover:text-gray-900 underline"
              >
                Agendar otra cita
              </button>
            </div>
          )}

          {/* MODAL CANCELACIÓN POR PARTE DEL CLIENTE */}
          {isCancelModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
              <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 text-left">
                <h3 className="font-extrabold text-base text-gray-900 mb-1">
                  Reportar Novedad o Cancelar Turno
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  Liberaremos tu turno para que otra persona pueda ser atendida y le avisaremos a {business.name}.
                </p>

                <form onSubmit={handleClientCancel} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      ¿Por qué necesitas cancelar o reprogramar?
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Ej. Me surgió una reunión de trabajo / Deseo aplazarlo para el fin de semana..."
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 p-3 text-xs text-gray-900 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsCancelModalOpen(false)}
                      className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                    >
                      Volver
                    </button>
                    <button
                      type="submit"
                      disabled={cancelling}
                      className="px-5 py-2 text-xs font-bold bg-rose-600 text-white rounded-xl hover:bg-rose-700 shadow-md transition disabled:opacity-50"
                    >
                      {cancelling ? "Cancelando..." : "Confirmar Cancelación"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* SECCIÓN DE PRODUCTOS EN VENTA DISPONIBLES EN EL ESTABLECIMIENTO */}
        {products.length > 0 && (
          <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">🛍️</span>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base">
                    Productos & Artículos Disponibles
                  </h3>
                  <p className="text-xs text-gray-500">
                    Disponibles para adquirir directamente en nuestro establecimiento
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-200">
                {products.length} {products.length === 1 ? "artículo" : "artículos"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {products.map((p: any) => (
                <div
                  key={p.id}
                  className="p-3.5 rounded-xl border border-gray-100 hover:border-emerald-300 bg-gray-50/50 hover:bg-white transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-xs text-gray-900 leading-tight">
                        {p.name}
                      </span>
                      <span className="text-xs font-black text-emerald-700 shrink-0">
                        {formatCurrency(p.price, business?.currency || "COP")}
                      </span>
                    </div>

                    {p.category && (
                      <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-gray-200 text-gray-600">
                        {p.category}
                      </span>
                    )}

                    {p.description && (
                      <p className="text-[11px] text-gray-500 mt-1.5 line-clamp-2">
                        {p.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-gray-200/60 flex items-center justify-between text-[11px]">
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                      {p.stock > 0 ? `${p.stock} disponibles` : "Disponible"}
                    </span>

                    {business?.phone && (
                      <a
                        href={`https://api.whatsapp.com/send?phone=${business.phone.replace(/[^0-9]/g, "")}&text=${encodeURIComponent(
                          `Hola ${business.name} 👋 Me interesa comprar el producto: *${p.name}* (${formatCurrency(p.price, business?.currency || "COP")}). ¿Tienen disponibilidad?`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline"
                      >
                        Consultar 💬
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
